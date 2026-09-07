import {realpath,lstat} from 'node:fs/promises';
import {constants,closeSync} from 'node:fs';
import {join} from 'node:path';
import {AnchoredFiles} from './anchored-files';
import {identity,type MutationScope} from './mutation-path';
import {retainedDeletions,recoveryBytes,availableRecoveryPath} from './recovery';
import {digest} from './source';
import {settingsDigest} from './policy';
import {captureRepositoryState} from './repository-state';
import {WorktreeLease} from './worktree';
import type {SessionStore} from '../sessions/store';

export async function prepareDisposal(store:Pick<SessionStore,'events'>,recoveryId:string){
 const entry=retainedDeletions(store.events).find(item=>item.id===recoveryId);
 if(!entry||entry.state!=='retained')throw new Error('No known retained deletion for this identity');
 entry.recoveryPath=await availableRecoveryPath(entry);
 const root=await realpath(entry.root),scope:MutationScope={rootIdentity:identity(await lstat(root,{bigint:true})),parents:[]};
 for(const path of ['.mavona','.mavona/recovery']){const metadata=await lstat(join(root,path),{bigint:true});if(!metadata.isDirectory()||metadata.isSymbolicLink()||(metadata.mode&0o077n)!==0n)throw new Error('Private recovery directory required');scope.parents.push({path,...identity(metadata)});}
 const files=new AnchoredFiles(root,scope);let parent:ReturnType<AnchoredFiles['parent']>|undefined,fd:number|undefined;
 try{parent=files.parent(entry.recoveryPath,false,true);fd=files.open(parent,constants.O_RDONLY);const metadata=recoveryBytes(fd);if(metadata.sha256!==entry.sha256)throw new Error('Retained source changed');scope.fileIdentity=metadata.identity;const repository=await captureRepositoryState(root);if(repository.status!=='passed')throw new Error('Repository fingerprint unavailable');const value={throughEventId:store.events.at(-1)!.eventId,recoveryId,root,path:entry.path,recoveryPath:entry.recoveryPath,sha256:metadata.sha256,size:metadata.size,mode:metadata.mode,scope,repositoryDigest:repository.digest,settingsDigest:await settingsDigest(root),operation:'permanently remove this retained copy; cannot undo' as const,currentSource:'leave unchanged' as const,correctness:'unknown' as const};return {id:digest(JSON.stringify(value)),...value};}
 finally{if(fd!==undefined)closeSync(fd);parent?.close();files.close();}
}
export async function disposeSource(store:SessionStore,recoveryId:string,approvedId:string,signal:AbortSignal){
 signal.throwIfAborted();if(!store.state.mutationAllowed)throw new Error('Reconcile interrupted effects before disposal');let review=await prepareDisposal(store,recoveryId);if(review.id!==approvedId)throw new Error('Disposal needs exact fresh approval');if(!store.state.repository||await realpath(store.state.repository)!==review.root)throw new Error('Disposal requires the owning checkout');
 const lease=await WorktreeLease.acquire(review.root,store.sessionId);let files:AnchoredFiles|undefined,source:ReturnType<AnchoredFiles['parent']>|undefined,staged:ReturnType<AnchoredFiles['parent']>|undefined,fd:number|undefined;let requested=false,begun=false;const effectId=Bun.randomUUIDv7(),stagingPath='.mavona/recovery/'+Bun.randomUUIDv7();let remainingPath=review.recoveryPath;
 try{review=await prepareDisposal(store,recoveryId);if(review.id!==approvedId)throw new Error('Disposal review changed');signal.throwIfAborted();store.append('source.disposal.requested',{recoveryId,effectId,stagingPath,review:JSON.stringify(review)});store.append('effect.requested',{effectId,kind:'patch'});requested=true;lease.beginEffect(effectId,'patch');begun=true;
 files=new AnchoredFiles(review.root,review.scope);source=files.parent(review.recoveryPath,false,true);staged=files.parent(stagingPath,false,true);fd=files.open(source,constants.O_RDONLY);const before=recoveryBytes(fd);if(!files.matches(fd)||before.sha256!==review.sha256||before.mode!==review.mode)throw new Error('Retained source changed');signal.throwIfAborted();
 // Record the possible destination even if rename succeeded but its fsync failed.
 remainingPath=stagingPath;files.move(source,staged);const check=files.open(staged,constants.O_RDONLY);try{const current=recoveryBytes(check);if(!files.matches(check)||current.sha256!==review.sha256||current.mode!==review.mode)throw new Error('Staged source changed');signal.throwIfAborted();files.remove(staged);}finally{closeSync(check);}
 const result={state:'passed' as const,path:review.path,sha256:review.sha256,removedPath:stagingPath,correctness:'unknown' as const};store.append('source.disposal.completed',{recoveryId,effectId,state:result.state,result:JSON.stringify(result)});store.append('effect.completed',{effectId,state:'passed'});lease.completeEffect(effectId,'passed');begun=false;return result;
 }catch(error){if(!requested)throw error;const result={state:'unknown' as const,path:review.path,recoveryPath:review.recoveryPath,remainingPath,sha256:review.sha256,correctness:'unknown' as const,reason:'Inspect original and staging recovery paths and reconcile. Removal is never automatically retried.'};store.append('source.disposal.completed',{recoveryId,effectId,state:result.state,result:JSON.stringify(result)});store.append('effect.completed',{effectId,state:'unknown'});if(begun)lease.completeEffect(effectId,'unknown');return result;}
 finally{if(fd!==undefined)closeSync(fd);staged?.close();source?.close();files?.close();lease.close();}
}
