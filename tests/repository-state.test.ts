import {test,expect} from 'bun:test';import {mkdtemp,writeFile,rm,unlink} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {captureRepositoryState,changesSince} from '../packages/tools/repository-state';
test('repository snapshots distinguish pre-existing edits from later edits, additions and deletions without hooks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-state-'));const git=async(args:string[])=>{const p=Bun.spawn(['git','-C',root,...args],{stdout:'pipe',stderr:'pipe'});expect(await p.exited).toBe(0);};
 try{await git(['init','-q']);await writeFile(join(root,'order.rb'),'original');await writeFile(join(root,'other.rb'),'stable');await git(['add','order.rb','other.rb']);await git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture']);
  await writeFile(join(root,'order.rb'),'user edit');await git(['config','core.fsmonitor','touch HOOK_EXECUTED']);const before=await captureRepositoryState(root);expect(before.status).toBe('passed');expect(before.preexistingPaths).toEqual(['order.rb']);
  await writeFile(join(root,'order.rb'),'user and agent edit');await writeFile(join(root,'new.rb'),'new');await unlink(join(root,'other.rb'));const after=await captureRepositoryState(root);
  expect(changesSince(before,after).paths).toEqual(['new.rb','order.rb','other.rb']);expect(changesSince(before,after).preexistingPaths).toEqual(['order.rb']);expect(await Bun.file(join(root,'HOOK_EXECUTED')).exists()).toBe(false);expect(before.digest).not.toBe(after.digest);
 }finally{await rm(root,{recursive:true,force:true});}
});
