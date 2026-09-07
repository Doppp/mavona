import {savedFlowReference} from '../app-inspection/rerun';
import {reportManifest} from '../app-inspection/report-viewer';
import {inspectionSummary} from './inspection-policy';
import {repositoryEvidence} from '../app-inspection/provenance';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {InspectionService,approveFlow,type Flow} from '../app-inspection/service';
import {renderReport} from '../app-inspection/report';
import {WorktreeLease} from '../tools/runtime';
import {SessionStore} from '../sessions/store';
import type {Envelope} from '../protocol/events';
import {attachServer,ServerUnavailableError,type ServerHandle} from '../app-inspection/lifecycle';
export async function runInspection(options:{root:string;taskId?:string;flow:Flow;flowPath?:string;lease?:WorktreeLease;store:SessionStore;signal:AbortSignal;server?:()=>Promise<ServerHandle>;onEvent?:(event:Envelope)=>void}){
 const {store,flow,signal}=options;signal.throwIfAborted();if(!store.state.mutationAllowed)throw new Error('Reconcile interrupted effects before browser execution');
 const flowReference=await savedFlowReference(options.root,options.flowPath,flow);
 const lease=options.lease??await WorktreeLease.acquire(options.root,store.sessionId);const service=new InspectionService();const effectId=Bun.randomUUIDv7();const directory=join(store.directory,'artifacts',effectId);let server:ServerHandle|undefined,intent:Envelope|undefined,effectFinalized=false;
 const cancel=()=>{void service.stop(true);};
 try{
  await lease.assertOwner(options.root,store.sessionId);await mkdir(directory,{recursive:true,mode:0o700});intent=store.append('effect.requested',{effectId,kind:'browser'});options.onEvent?.(intent);lease.beginEffect(effectId,'browser');server=await (options.server?.()??attachServer(flow.url));
  signal.addEventListener('abort',cancel,{once:true});if(signal.aborted){cancel();signal.throwIfAborted();}
  const report=await service.run(flow,approveFlow(flow,options.root,'explicit-user'),{evidenceContext:()=>repositoryEvidence(options.root,store.sessionId,options.taskId),checkout:options.root,artifactRoot:store.directory,artifactDirectory:directory,onEvidence:async evidence=>{const event=evidence.kind==='app_artifact'?store.append('inspection.artifact',{inspectionId:evidence.artifact.inspectionId!,artifactId:evidence.artifact.id,managedPath:relative(store.directory,join(directory,evidence.artifact.path)),evidence:JSON.stringify(evidence.artifact)}):evidence.kind==='app_observation'?store.append('app_observation',{inspectionId:evidence.observation.inspectionId!,observationId:evidence.observation.id,evidence:JSON.stringify(evidence.observation)}):store.append('app_assertion',{inspectionId:evidence.check.inspectionId!,checkId:evidence.check.id,evidence:JSON.stringify(evidence.check)});options.onEvent?.(event);},onEvent:async event=>{const recorded=store.append('inspection.event',{inspectionId:event.inspectionId,event:JSON.stringify(event)});options.onEvent?.(recorded);}});
  const saved=store.append('inspection.flow',{inspectionId:report.id,reference:JSON.stringify(flowReference)});options.onEvent?.(saved);
  const reportPath=join(directory,'report.html');const html=Buffer.from(renderReport(report));await writeFile(reportPath,html,{flag:'wx',mode:0o600});await writeFile(join(directory,'report.json'),JSON.stringify(report),{flag:'wx',mode:0o600});
  const manifest=store.append('inspection.report',{inspectionId:report.id,manifest:JSON.stringify(reportManifest(store.directory,store.sessionId,report,reportPath,html))});options.onEvent?.(manifest);
  const summary=store.append('inspection.summary',{inspectionId:report.id,summary:JSON.stringify(inspectionSummary(report,reportPath))});options.onEvent?.(summary);
  const completed=store.append('inspection.completed',{inspectionId:report.id,status:report.status,reportPath});options.onEvent?.(completed);
  // Complete the effect only after its immutable report is durable.
  const state=signal.aborted||report.state!=='completed'?'unknown':'passed',effect=store.append('effect.completed',{effectId,state},intent.eventId);effectFinalized=true;options.onEvent?.(effect);lease.completeEffect(effectId,state);
  return {schemaVersion:1,sessionId:store.sessionId,report,reportPath,server:{ownership:server.ownership,url:server.url,logs:server.logs()},exitCode:signal.aborted?130:report.status==='passed'?0:report.status==='failed'?3:4};
 }catch(error){if(intent&&!effectFinalized){const state=error instanceof ServerUnavailableError?'failed':'unknown',effect=store.append('effect.completed',{effectId,state},intent.eventId);effectFinalized=true;options.onEvent?.(effect);try{lease.completeEffect(effectId,state);}catch{}}throw error;}
 finally{signal.removeEventListener('abort',cancel);await service.stop(false);await server?.stop();if(!options.lease)lease.close();}
}
