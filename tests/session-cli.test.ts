import {test,expect} from 'bun:test';import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {SessionStore} from '../packages/sessions/store';
const command=process.env.MAVONA_TEST_BINARY?[process.env.MAVONA_TEST_BINARY]:[process.execPath,join(import.meta.dir,'../apps/mavona/main.ts')];
test('session CLI inspects exports forks and resumes without replaying effects',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-session-cli-'));const sessions=join(root,'sessions');const store=new SessionStore(join(sessions,'original'),'original');store.append('session.opened',{repository:process.cwd()});store.append('draft.changed',{text:'retained task'});store.append('effect.requested',{effectId:'pending',kind:'command'});store.close();
 const run=async(args:string[])=>{const child=Bun.spawn([...command,...args,'--data-dir',root],{stdout:'pipe',stderr:'pipe'});const text=await new Response(child.stdout).text();expect(await child.exited).toBe(0);return JSON.parse(text);};
 try{
  expect((await run(['sessions','list'])).sessions[0].id).toBe('original');
  expect((await run(['sessions','show','original'])).state.mutationAllowed).toBe(false);
  const exported=await run(['sessions','export','original']);expect(exported.effectReplay).toBe('never');expect(exported.pendingEffects).toEqual(['pending']);
  const fork=await run(['sessions','fork','original']);expect(fork.id).not.toBe('original');expect(fork.mutationAllowed).toBe(false);
  const resumed=await run(['resume','original','--format','json']);expect(resumed.draft).toBe('retained task');expect(resumed.mutationAllowed).toBe(false);
 }finally{await rm(root,{recursive:true,force:true});}
});
