import {test,expect} from 'bun:test';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {editorHandoff} from '../packages/tools/editor';import {ExecutionPolicy} from '../packages/tools/policy';import {WorktreeLease} from '../packages/tools/runtime';
test('editor handoff holds ownership, restores terminal and identifies saved user edits',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-editor-'));await Bun.spawn(['git','init','-q',root]).exited;await writeFile(join(root,'order.rb'),'original');const policy=new ExecutionPolicy(root);let suspended=false,resumed=false;
 try{const result=await editorHandoff({root,path:'order.rb',line:1,adapter:{argv:[process.execPath,'-e','await Bun.write(process.argv[1],"saved in editor")','{path}'],terminal:true},policy,signal:new AbortController().signal,approve:async()=>true,suspend:async()=>{suspended=true;await expect(WorktreeLease.acquire(root,'competitor')).rejects.toThrow('owned');},resume:()=>{resumed=true;}});
 expect(suspended).toBe(true);expect(resumed).toBe(true);expect(result.changed.paths).toEqual(['order.rb']);expect(await Bun.file(join(root,'order.rb')).text()).toBe('saved in editor');expect(result.exitCode).toBe(0);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('denied editor never launches or suspends the terminal',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-editor-deny-'));await Bun.spawn(['git','init','-q',root]).exited;await writeFile(join(root,'order.rb'),'original');
 try{await expect(editorHandoff({root,path:'order.rb',line:1,adapter:{argv:[process.execPath,'-e','throw Error("should not launch")'],terminal:true},policy:new ExecutionPolicy(root),signal:new AbortController().signal,approve:async()=>false,suspend:()=>{throw Error('should not suspend');},resume:()=>{}})).rejects.toThrow('approval');expect(await Bun.file(join(root,'order.rb')).text()).toBe('original');}
 finally{await rm(root,{recursive:true,force:true});}
});
test('GUI launch keeps the worktree lease until explicit saved-file return confirmation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-editor-gui-'));await Bun.spawn(['git','init','-q',root]).exited;await writeFile(join(root,'order.rb'),'original');let confirmed=false;
 try{await editorHandoff({root,path:'order.rb',line:1,adapter:{argv:[process.execPath,'-e','process.exit(0)'],terminal:false},policy:new ExecutionPolicy(root),signal:new AbortController().signal,approve:async()=>true,suspend:()=>{throw Error('GUI must not suspend');},resume:()=>{},confirmReturn:async()=>{await expect(WorktreeLease.acquire(root,'competitor')).rejects.toThrow('owned');await writeFile(join(root,'order.rb'),'GUI user saved');confirmed=true;}});expect(confirmed).toBe(true);expect(await Bun.file(join(root,'order.rb')).text()).toBe('GUI user saved');}
 finally{await rm(root,{recursive:true,force:true});}
});
test('partial terminal suspension failure still restores ownership and terminal',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-editor-suspend-'));await Bun.spawn(['git','init','-q',root]).exited;await writeFile(join(root,'order.rb'),'original');let restored=false;
 try{await expect(editorHandoff({root,path:'order.rb',line:1,adapter:{argv:[process.execPath,'-e','process.exit(0)'],terminal:true},policy:new ExecutionPolicy(root),signal:new AbortController().signal,approve:async()=>true,suspend:()=>{throw Error('suspend failed');},resume:()=>{restored=true;}})).rejects.toThrow('suspend failed');expect(restored).toBe(true);await expect(WorktreeLease.acquire(root,'next')).rejects.toThrow('Unreconciled');const lease=await WorktreeLease.acquire(root,'next',{reconcile:true});expect(lease.pendingEffects()).toHaveLength(1);lease.close();}
 finally{await rm(root,{recursive:true,force:true});}
});
