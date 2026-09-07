import {relative,resolve,join} from 'node:path';import {realpath} from 'node:fs/promises';
import {readSource,digest} from '../tools/source';import {captureRepositoryState} from '../tools/repository-state';import {settingsDigest} from '../tools/policy';import {WorktreeLease} from '../tools/worktree';
import {parseFlow,digestFlow,approveFlow,type Flow} from './service';import type {SessionStore} from '../sessions/store';
type FlowReference={status:'passed';root:string;path:string;sourceDigest:string;flowDigest:string}|{status:'unknown';reason:string};
export async function savedFlowReference(root:string,path:string|undefined,flow:Flow):Promise<FlowReference>{
 if(!path)return {status:'unknown',reason:'No saved repository flow reference; run an explicit saved file to enable rerun'};
 try{const canonicalRoot=await realpath(root),source=await readSource(canonicalRoot,relative(canonicalRoot,await realpath(resolve(path))));const parsed=parseFlow(JSON.parse(source.text));if(digestFlow(parsed)!==digestFlow(flow))return {status:'unknown',reason:'Executed flow overrides differ from the saved file; save the effective flow before rerun'};return {status:'passed',root:canonicalRoot,path:source.path,sourceDigest:source.digest,flowDigest:digestFlow(flow)};}
 catch{return {status:'unknown',reason:'Saved flow is unavailable or outside the repository read boundary'};}
}
export async function prepareRerun(store:Pick<SessionStore,'events'>,inspectionId:string){
 const event=store.events.findLast(e=>e.type==='inspection.flow'&&e.payload.inspectionId===inspectionId);if(!event)throw new Error('No saved flow for this inspection');const ref=JSON.parse(String(event.payload.reference)) as FlowReference;if(ref.status!=='passed')throw new Error('Exact saved-flow rerun unavailable');
 const root=await realpath(ref.root);const source=await readSource(root,ref.path);const flow=parseFlow(JSON.parse(source.text));if(source.digest!==ref.sourceDigest||digestFlow(flow)!==ref.flowDigest)throw new Error('Saved flow changed; review it through app run');const grant=approveFlow(flow,root,'scope-validation-only');const repository=await captureRepositoryState(root);if(repository.status!=='passed')throw new Error('Repository fingerprint unavailable');
 const value={inspectionId,throughEventId:store.events.at(-1)!.eventId,root,sourcePath:ref.path,sourceDigest:source.digest,flowDigest:ref.flowDigest,repositoryDigest:repository.digest,settingsDigest:await settingsDigest(root),origins:grant.origins,flow,scope:'fresh browser execution; navigation and actions may change application state',fixtureState:'unknown; no reset or reseed is implied',correctness:'unknown'};
 return {id:digest(JSON.stringify(value)),...value};
}
export async function rerunInspection(store:SessionStore,inspectionId:string,approvedId:string,signal:AbortSignal,onEvent?:Parameters<typeof import('../agent/inspection').runInspection>[0]['onEvent']){
 signal.throwIfAborted();if(!store.state.mutationAllowed)throw new Error('Reconcile interrupted effects before browser rerun');let review=await prepareRerun(store,inspectionId);if(review.id!==approvedId)throw new Error('Rerun needs exact fresh approval');if(!store.state.repository||await realpath(store.state.repository)!==review.root)throw new Error('Rerun requires the owning checkout');const lease=await WorktreeLease.acquire(review.root,store.sessionId);
 try{review=await prepareRerun(store,inspectionId);if(review.id!==approvedId)throw new Error('Rerun review changed');signal.throwIfAborted();const {runInspection}=await import('../agent/inspection');const result=await runInspection({root:review.root,flow:review.flow,flowPath:join(review.root,review.sourcePath),store,signal,lease,...(onEvent?{onEvent}:{})});store.append('inspection.rerun',{inspectionId:result.report.id,previousInspectionId:inspectionId,reviewId:review.id});return result;}
 finally{lease.close();}
}
