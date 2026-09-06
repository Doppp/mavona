import {test,expect} from 'bun:test';import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import {WorktreeLease} from '../packages/tools/runtime';
test('unfinished worktree effect survives writer death and blocks other sessions',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-worktree-crash-'));const entry=join(import.meta.dir,'../packages/tools/runtime.ts');const child=Bun.spawn([process.execPath,'-e',`import {WorktreeLease} from ${JSON.stringify(entry)};const lease=await WorktreeLease.acquire(${JSON.stringify(root)},'original');lease.beginEffect('effect-one','command');console.log('ready');setInterval(()=>{},1000);`],{stdout:'pipe',stderr:'pipe'});
 try{const reader=child.stdout.getReader();const ready=await reader.read();reader.releaseLock();expect(new TextDecoder().decode(ready.value)).toContain('ready');child.kill('SIGKILL');await child.exited;await expect(WorktreeLease.acquire(root,'other')).rejects.toThrow('Unreconciled');const recovery=await WorktreeLease.acquire(root,'original',{reconcile:true});try{expect(recovery.pendingEffects()).toEqual([{effectId:'effect-one',owner:'original',kind:'command'}]);recovery.reconcileEffect('effect-one','original');}finally{recovery.close();}const next=await WorktreeLease.acquire(root,'other');next.close();}
 finally{child.kill();await child.exited;await rm(root,{recursive:true,force:true});}
});
test('unknown effect remains blocked and only its owning session can reconcile it',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-worktree-unknown-'));
 try{const lease=await WorktreeLease.acquire(root,'owner');lease.beginEffect('effect','patch');lease.completeEffect('effect','unknown');lease.close();await expect(WorktreeLease.acquire(root,'another')).rejects.toThrow('Unreconciled');const recovery=await WorktreeLease.acquire(root,'owner',{reconcile:true});try{expect(()=>recovery.reconcileEffect('effect','another')).toThrow('owner');recovery.reconcileEffect('effect','owner');}finally{recovery.close();}}
 finally{await rm(root,{recursive:true,force:true});}
});
test('explicit reconciliation preserves unknown outcome and invalidates verification in canonical replay',async()=>{
 const {SessionStore}=await import('../packages/sessions/store');const {reconcileEffect}=await import('../packages/sessions/reconciliation');const {readHistory}=await import('../packages/sessions/lifecycle');const root=await mkdtemp(join(tmpdir(),'mavona-reconcile-'));const repository=join(root,'repo');const {mkdir}=await import('node:fs/promises');await mkdir(repository);await Bun.spawn(['git','init','-q',repository]).exited;const store=new SessionStore(join(root,'session'),'original');
 try{store.append('session.opened',{repository});const lease=await WorktreeLease.acquire(repository,store.sessionId);store.append('effect.requested',{effectId:'pending',kind:'command'});lease.beginEffect('pending','command');lease.close();await reconcileEffect(store,'pending','I inspected the worktree and accept its current state');expect(store.state.effects.pending).toBe('unknown');expect(store.state.mutationAllowed).toBe(true);expect(store.events.some(event=>event.type==='verification.invalidated')).toBe(true);store.close();expect(readHistory(join(root,'session'),'original').state.mutationAllowed).toBe(true);const next=await WorktreeLease.acquire(repository,'other');next.close();}
 finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('Rails subdirectories share the enclosing Git worktree mutation owner',async()=>{
 const {mkdir}=await import('node:fs/promises');const root=await mkdtemp(join(tmpdir(),'mavona-nested-owner-'));await Bun.spawn(['git','init','-q',root]).exited;await mkdir(join(root,'apps/one'),{recursive:true});await mkdir(join(root,'apps/two'),{recursive:true});
 try{const lease=await WorktreeLease.acquire(join(root,'apps/one'),'one');try{await expect(WorktreeLease.acquire(join(root,'apps/two'),'two')).rejects.toThrow('owned');}finally{lease.close();}}
 finally{await rm(root,{recursive:true,force:true});}
});
