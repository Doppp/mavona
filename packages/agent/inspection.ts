import {repositoryEvidence} from '../app-inspection/provenance';
import {mkdir,writeFile} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {InspectionService,approveFlow,type Flow} from '../app-inspection/service';
import {renderReport} from '../app-inspection/report';
import {WorktreeLease} from '../tools/runtime';
import {SessionStore} from '../sessions/store';
import type {Envelope} from '../protocol/events';
export async function runInspection(options:{root:string;taskId?:string;flow:Flow;lease?:WorktreeLease;store:SessionStore;signal:AbortSignal;onEvent?:(event:Envelope)=>void}){
 const {store,flow,signal}=options;signal.throwIfAborted();if(!store.state.mutationAllowed)throw new Error('Reconcile interrupted effects before browser execution');
 const lease=options.lease??await WorktreeLease.acquire(options.root,store.sessionId);const service=new InspectionService();const effectId=Bun.randomUUIDv7();const directory=join(store.directory,'artifacts',effectId);
 const cancel=()=>{void service.stop(true);};
 try{
  await lease.assertOwner(options.root,store.sessionId);await mkdir(directory,{recursive:true,mode:0o700});const intent=store.append('effect.requested',{effectId,kind:'browser'});options.onEvent?.(intent);lease.beginEffect(effectId,'browser');
  signal.addEventListener('abort',cancel,{once:true});if(signal.aborted){cancel();signal.throwIfAborted();}
  const report=await service.run(flow,approveFlow(flow,options.root,'explicit-user'),{evidenceContext:()=>repositoryEvidence(options.root,store.sessionId,options.taskId),checkout:options.root,artifactRoot:store.directory,artifactDirectory:directory,onEvidence:async evidence=>{const event=evidence.kind==='app_artifact'?store.append('inspection.artifact',{inspectionId:evidence.artifact.inspectionId!,artifactId:evidence.artifact.id,managedPath:relative(store.directory,join(directory,evidence.artifact.path)),evidence:JSON.stringify(evidence.artifact)}):evidence.kind==='app_observation'?store.append('app_observation',{inspectionId:evidence.observation.inspectionId!,observationId:evidence.observation.id,evidence:JSON.stringify(evidence.observation)}):store.append('app_assertion',{inspectionId:evidence.check.inspectionId!,checkId:evidence.check.id,evidence:JSON.stringify(evidence.check)});options.onEvent?.(event);},onEvent:async event=>{const recorded=store.append('inspection.event',{inspectionId:event.inspectionId,event:JSON.stringify(event)});options.onEvent?.(recorded);}});
  // A cancelled or failed browser run may have changed application state; never infer rollback.
  const effect=store.append('effect.completed',{effectId,state:signal.aborted||report.state!=='completed'?'unknown':'passed'},intent.eventId);options.onEvent?.(effect);lease.completeEffect(effectId,signal.aborted||report.state!=='completed'?'unknown':'passed');
  const reportPath=join(directory,'report.html');await writeFile(reportPath,renderReport(report),{flag:'wx',mode:0o600});await writeFile(join(directory,'report.json'),JSON.stringify(report),{flag:'wx',mode:0o600});
  const completed=store.append('inspection.completed',{inspectionId:report.id,status:report.status,reportPath});options.onEvent?.(completed);
  return {schemaVersion:1,sessionId:store.sessionId,report,reportPath,exitCode:signal.aborted?130:report.status==='passed'?0:report.status==='failed'?3:4};
 }finally{signal.removeEventListener('abort',cancel);await service.stop(false);if(!options.lease)lease.close();}
}
