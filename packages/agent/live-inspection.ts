import {mkdir,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {InspectionService,approveFlow,type Artifact,type Flow,type Report} from '../app-inspection/service';
import {AuthenticationStore} from '../app-inspection/authentication';
import {repositoryEvidence} from '../app-inspection/provenance';
import {reportManifest} from '../app-inspection/report-viewer';
import {renderReport} from '../app-inspection/report';
import {inspectionSummary} from './inspection-policy';
import {savedFlowReference} from '../app-inspection/rerun';
import {SessionStore} from '../sessions/store';
import {WorktreeLease} from '../tools/runtime';
import {attachServer,ServerUnavailableError,type ServerHandle} from '../app-inspection/lifecycle';

export class LiveInspection {
 private finished=false;
 private constructor(private root:string,private store:SessionStore,private service:InspectionService,private lease:WorktreeLease,private server:ServerHandle,private effectId:string,private intentId:string,private directory:string,readonly flow:Flow){}
 static async start(options:{root:string;store:SessionStore;flow:Flow;authentication?:{store:AuthenticationStore;referenceId:string};server?:()=>Promise<ServerHandle>}){
  if(!options.store.state.mutationAllowed)throw new Error('Reconcile interrupted effects before browser execution');
  const lease=await WorktreeLease.acquire(options.root,options.store.sessionId),service=new InspectionService(),effectId=Bun.randomUUIDv7(),directory=join(options.store.directory,'artifacts',effectId);let intentId='',finalized=false,server:ServerHandle|undefined;
  try{await lease.assertOwner(options.root,options.store.sessionId);await mkdir(directory,{recursive:true,mode:0o700});const intent=options.store.append('effect.requested',{effectId,kind:'browser'});intentId=intent.eventId;lease.beginEffect(effectId,'browser');server=await (options.server?.()??attachServer(options.flow.url));const report=await service.start(options.flow,approveFlow(options.flow,options.root,'explicit-user'),{checkout:options.root,artifactRoot:options.store.directory,artifactDirectory:directory,...(options.authentication?{authentication:{...options.authentication,reuseApproved:true}}:{}),evidenceContext:()=>repositoryEvidence(options.root,options.store.sessionId),onEvent:async event=>{options.store.append('inspection.event',{inspectionId:event.inspectionId,event:JSON.stringify(event)});},onEvidence:async evidence=>{if(evidence.kind==='app_artifact')options.store.append('inspection.artifact',{inspectionId:evidence.artifact.inspectionId!,artifactId:evidence.artifact.id,managedPath:relative(options.store.directory,join(directory,evidence.artifact.path)),evidence:JSON.stringify(evidence.artifact)});else if(evidence.kind==='app_observation')options.store.append('app_observation',{inspectionId:evidence.observation.inspectionId!,observationId:evidence.observation.id,evidence:JSON.stringify(evidence.observation)});else options.store.append('app_assertion',{inspectionId:evidence.check.inspectionId!,checkId:evidence.check.id,evidence:JSON.stringify(evidence.check)});}});const live=new LiveInspection(options.root,options.store,service,lease,server,effectId,intent.eventId,directory,options.flow);if(report.state!=='ready'){await live.stop(true);finalized=true;throw new Error(report.reason??'Browser unavailable');}return live;
  }catch(error){const state=error instanceof ServerUnavailableError?'failed':'unknown';if(!finalized&&intentId)options.store.append('effect.completed',{effectId,state},intentId);if(!finalized)try{lease.completeEffect(effectId,state);}catch{}await service.stop(true);await server?.stop();lease.close();throw error;}
 }
 snapshot(){return this.service.snapshot();}
 serverStatus(){return {ownership:this.server.ownership,url:this.server.url,logs:this.server.logs()};}
 async capture():Promise<Artifact>{return await this.service.perform({op:'capture'}) as Artifact;}
 async takeover(){await this.service.takeover();return this.snapshot();}
 async resume(){await this.service.resume();return this.snapshot();}
 async saveAuthentication(store:AuthenticationStore,expiresAt:number){return this.service.saveAuthentication(store,{approved:true,expiresAt});}
 async stop(cancelled=false):Promise<{report:Report;reportPath:string}>{
  if(this.finished)throw new Error('Live inspection already stopped');this.finished=true;let report:Report;
  try{const takeoverUnreconciled=this.service.snapshot().state==='manual takeover';report=cancelled||takeoverUnreconciled?await this.service.stop(true):await this.service.complete();const state=report.state==='completed'?'passed':'unknown',reference=await savedFlowReference(this.root,undefined,this.flow),reportPath=join(this.directory,'report.html'),html=Buffer.from(renderReport(report));await writeFile(reportPath,html,{flag:'wx',mode:0o600});await writeFile(join(this.directory,'report.json'),JSON.stringify(report),{flag:'wx',mode:0o600});this.store.append('inspection.flow',{inspectionId:report.id,reference:JSON.stringify(reference)});this.store.append('inspection.report',{inspectionId:report.id,manifest:JSON.stringify(reportManifest(this.store.directory,this.store.sessionId,report,reportPath,html))});this.store.append('inspection.summary',{inspectionId:report.id,summary:JSON.stringify(inspectionSummary(report,reportPath))});this.store.append('inspection.completed',{inspectionId:report.id,status:report.status,reportPath});this.store.append('effect.completed',{effectId:this.effectId,state},this.intentId);this.lease.completeEffect(this.effectId,state);return {report,reportPath};
  }finally{await this.service.stop(false);await this.server.stop();this.lease.close();}
 }
}
