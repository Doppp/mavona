import {test,expect} from 'bun:test';import {mkdtemp,writeFile,readFile,rm,mkdir,symlink,link,stat} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {ToolRuntime} from '../packages/tools/runtime';import {ExecutionPolicy,prepareAction} from '../packages/tools/policy';import {digest} from '../packages/tools/source';
test('approved creation makes bounded directories without overwriting files and deletion retains recoverable bytes',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-file-effects-'));const policy=new ExecutionPolicy(root);const runtime=new ToolRuntime(root,policy);const signal=new AbortController().signal;
 try{const create={tool:'create_file' as const,path:'app/models/order.rb',text:'class Order\nend\n'};await expect(runtime.execute(create,signal)).rejects.toThrow('approval');policy.approveOnce(await prepareAction(root,create));expect((await runtime.execute(create,signal)).state).toBe('passed');expect(await readFile(join(root,create.path),'utf8')).toBe(create.text);expect((await stat(join(root,create.path))).mode&0o777).toBe(0o644&~process.umask());await expect(prepareAction(root,create)).rejects.toThrow('exists');
  const remove={tool:'delete_file' as const,path:create.path,beforeDigest:digest(create.text)};policy.approveOnce(await prepareAction(root,remove));const result=await runtime.execute(remove,signal);expect(result.state).toBe('passed');expect(await Bun.file(join(root,create.path)).exists()).toBe(false);expect(await readFile(join(root,result.recoveryPath!),'utf8')).toBe(create.text);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('file mutation rejects symlink parents and external hardlinks before touching other files',async()=>{
 const base=await mkdtemp(join(tmpdir(),'mavona-file-boundary-'));const root=join(base,'repo');await mkdir(root);const outside=join(base,'outside');await mkdir(outside);await writeFile(join(outside,'secret.rb'),'unchanged');await symlink(outside,join(root,'linked'));await link(join(outside,'secret.rb'),join(root,'hard.rb'));
 try{await expect(prepareAction(root,{tool:'create_file',path:'linked/new.rb',text:'bad'})).rejects.toThrow();await expect(prepareAction(root,{tool:'apply_patch',path:'hard.rb',beforeDigest:digest('unchanged'),oldText:'unchanged',newText:'bad'})).rejects.toThrow('hardlink');expect(await readFile(join(outside,'secret.rb'),'utf8')).toBe('unchanged');expect(await Bun.file(join(outside,'new.rb')).exists()).toBe(false);}
 finally{await rm(base,{recursive:true,force:true});}
});
test('descriptor traversal refuses a parent swapped to an outside symlink after preparation',async()=>{
 const {rename}=await import('node:fs/promises');const {mutateFile}=await import('../packages/tools/file-mutations');const base=await mkdtemp(join(tmpdir(),'mavona-parent-race-'));const root=join(base,'repo'),outside=join(base,'outside');await mkdir(join(root,'safe'),{recursive:true});await mkdir(outside);const action={tool:'create_file' as const,path:'safe/new.rb',text:'inside only'};
 try{const prepared=await prepareAction(root,action);await rename(join(root,'safe'),join(root,'previous'));await symlink(outside,join(root,'safe'));await expect(mutateFile(root,action,prepared,new AbortController().signal,Date.now())).rejects.toThrow('symlink');expect(await Bun.file(join(outside,'new.rb')).exists()).toBe(false);}
 finally{await rm(base,{recursive:true,force:true});}
});
test('replacement checkout at the same path invalidates existing execution grants',async()=>{
 const {rename}=await import('node:fs/promises');const base=await mkdtemp(join(tmpdir(),'mavona-root-identity-'));const root=join(base,'repo');await mkdir(root);const policy=new ExecutionPolicy(root);const action={tool:'create_file' as const,path:'new.rb',text:'owned checkout'};
 try{policy.approveOnce(await prepareAction(root,action));await rename(root,join(base,'original'));await mkdir(root);await expect(new ToolRuntime(root,policy).execute(action,new AbortController().signal)).rejects.toThrow('approval');expect(await Bun.file(join(root,'new.rb')).exists()).toBe(false);}
 finally{await rm(base,{recursive:true,force:true});}
});
