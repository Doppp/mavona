import {realpath} from 'node:fs/promises';import {WorktreeLease} from '../tools/worktree';import {captureRepositoryState} from '../tools/repository-state';import {SessionStore} from './store';
/** Explicit user acknowledgement of current state; never an inferred successful effect. */
export async function reconcileEffect(store:SessionStore,effectId:string,reason:string){
 if(!reason.trim()||reason.length>4096)throw new Error('Reconciliation requires a bounded explanation of the inspected current state');if(!store.state.repository||!Object.hasOwn(store.state.effects,effectId))throw new Error('Session effect not found');
 const root=await realpath(store.state.repository);const lease=await WorktreeLease.acquire(root,store.sessionId,{reconcile:true});
 try{const pending=lease.pendingEffects().find(effect=>effect.effectId===effectId);if(pending&&pending.owner!==store.sessionId)throw new Error('Effect belongs to another session');const snapshot=await captureRepositoryState(root);if(snapshot.status!=='passed')throw new Error('Repository state unavailable; reconciliation cannot continue');
  store.append('verification.invalidated',{reason:'Explicit effect reconciliation; prior verification remains stale'});store.append('repository.snapshot',{snapshot:JSON.stringify(snapshot),reason:'effect-reconciliation'});store.append('effect.reconciled',{effectId,reason:reason.trim()});if(pending)lease.reconcileEffect(effectId,store.sessionId);
  return {effectId,outcome:store.state.effects[effectId],reconciled:true,verificationFresh:false,mutationAllowed:store.state.mutationAllowed};
 }finally{lease.close();}
}
