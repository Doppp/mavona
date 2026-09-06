import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {InspectionService,approveFlow,type Flow} from '../app-inspection/service';
import {renderReport} from '../app-inspection/report';
import {WorktreeLease} from '../tools/runtime';
import {SessionStore} from '../sessions/store';
import type {Envelope} from '../protocol/events';
export async function runInspection(options:{root:string;flow:Flow;store:SessionStore;signal:AbortSignal;onEvent?:(event:Envelope)=>void}){
 const {store,flow,signal}=options;signal.throwIfAborted();if(!store.state.mutationAllowed)throw new Error('Reconcile interrupted effects before browser execution');
 const lease=await WorktreeLease.acquire(options.root,store.sessionId);const service=new InspectionService();const effectId=Bun.randomUUIDv7();const directory=join(store.directory,'artifacts',effectId);
 const cancel=()=>{void service.stop(true);};
 try{
  await mkdir(directory,{recursive:true,mode:0o700});const intent=store.append('effect.requested',{effectId,kind:'browser'});options.onEvent?.(intent);lease.beginEffect(effectId,'browser');
  signal.addEventListener('abort',cancel,{once:true});if(signal.aborted){cancel();signal.throwIfAborted();}
  const report=await service.run(flow,approveFlow(flow,options.root,'explicit-user'),{checkout:options.root,artifactRoot:store.directory,artifactDirectory:directory,onEvent:async event=>{options.onEvent?.(store.append('inspection.event',{inspectionId:event.inspectionId,event:JSON.stringify(event)}));}});
  // A cancelled or failed browser run may have changed application state; never infer rollback.
  const effect=store.append('effect.completed',{effectId,state:signal.aborted||report.state!=='completed'?'unknown':'passed'},intent.eventId);options.onEvent?.(effect);lease.completeEffect(effectId,signal.aborted||report.state!=='completed'?'unknown':'passed');
  const reportPath=join(directory,'report.html');await writeFile(reportPath,renderReport(report),{flag:'wx',mode:0o600});await writeFile(join(directory,'report.json'),JSON.stringify(report),{flag:'wx',mode:0o600});
  options.onEvent?.(store.append('inspection.completed',{inspectionId:report.id,status:report.status,reportPath}));
  return {schemaVersion:1,sessionId:store.sessionId,report,reportPath,exitCode:signal.aborted?130:report.status==='passed'?0:report.status==='failed'?3:4};
 }finally{signal.removeEventListener('abort',cancel);await service.stop(false);lease.close();}
}
