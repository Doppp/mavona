import {test,expect,afterEach} from 'bun:test';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ExecutionPolicy,prepareAction} from '../packages/tools/policy';
import {ToolRuntime,WorktreeLease} from '../packages/tools/runtime';
import {readSource} from '../packages/tools/source';
const dirs:string[]=[];afterEach(async()=>{for(const d of dirs.splice(0))await rm(d,{recursive:true,force:true});});
async function fixture(){const root=await mkdtemp(join(tmpdir(),'mavona-tools-'));dirs.push(root);await mkdir(join(root,'app'));await writeFile(join(root,'app/order.rb'),'user change\nold\n');return root;}
test('patch is denied headlessly, bound to exact bytes and preserves existing edits',async()=>{
 const root=await fixture();const policy=new ExecutionPolicy(root);const runtime=new ToolRuntime(root,policy);const source=await readSource(root,'app/order.rb');
 const patch={tool:'apply_patch' as const,path:'app/order.rb',beforeDigest:source.digest,oldText:'old',newText:'new'};
 await expect(runtime.execute(patch,new AbortController().signal)).rejects.toThrow('approval');
 const prepared=await prepareAction(root,patch);policy.approveOnce(prepared);
 const result=await runtime.execute(patch,new AbortController().signal);expect(result.state).toBe('passed');expect(await readFile(join(root,'app/order.rb'),'utf8')).toBe('user change\nnew\n');
 await expect(runtime.execute(patch,new AbortController().signal)).rejects.toThrow();
});
test('entry script and effective settings changes invalidate exact-action approval',async()=>{
 const root=await fixture();await writeFile(join(root,'check.rb'),'puts "one"');
 const policy=new ExecutionPolicy(root);const runtime=new ToolRuntime(root,policy);
 const action={tool:'run_command' as const,argv:[process.execPath,'check.rb'],cwd:'.',timeoutMs:1000};
 policy.approveOnce(await prepareAction(root,action));await writeFile(join(root,'check.rb'),'puts "two"');
 await expect(runtime.execute(action,new AbortController().signal)).rejects.toThrow('approval');
 policy.approveOnce(await prepareAction(root,action));await writeFile(join(root,'.mavona.yml'),'verification: changed');
 await expect(runtime.execute(action,new AbortController().signal)).rejects.toThrow('approval');
});
test('scoped execution is explicit, checkout-bound and revocable',async()=>{
 const root=await fixture();const other=await fixture();const policy=new ExecutionPolicy(root);const action={tool:'run_command' as const,argv:[process.execPath,'-e','console.log("ok")'],cwd:'.',timeoutMs:1000};
 const prepared=await prepareAction(root,action);policy.grantDevelopment({commands:[action.argv],writePaths:[],settingsDigest:prepared.settingsDigest});
 expect((await new ToolRuntime(root,policy).execute(action,new AbortController().signal)).stdout?.trim()).toBe('ok');
 await expect(new ToolRuntime(other,policy).execute(action,new AbortController().signal)).rejects.toThrow();
 policy.revoke();await expect(new ToolRuntime(root,policy).execute(action,new AbortController().signal)).rejects.toThrow('approval');
});
test('command output and timeout are bounded and inherited provider/preload secrets are stripped',async()=>{
 const root=await fixture();const policy=new ExecutionPolicy(root);const runtime=new ToolRuntime(root,policy);
 const action={tool:'run_command' as const,argv:[process.execPath,'-e','console.log(process.env.OPENAI_API_KEY || "clean");setInterval(()=>{},1000)'],cwd:'.',timeoutMs:100};
 const previous=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='canary-credential';
 try {policy.approveOnce(await prepareAction(root,action));const result=await runtime.execute(action,new AbortController().signal);expect(result.state).toBe('unknown');expect(result.stdout).toContain('clean');expect(result.stdout).not.toContain('canary-credential');}finally{if(previous===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;}
});
test('single worktree owner is enforced and released',async()=>{
 const root=await fixture();const one=await WorktreeLease.acquire(root,'one');
 await expect(WorktreeLease.acquire(root,'two')).rejects.toThrow('owned');one.close();
 const two=await WorktreeLease.acquire(root,'two');two.close();
});
test('patch refuses symlink escapes, stale source and ambiguous replacement',async()=>{
 const root=await fixture();const outside=await fixture();await symlink(join(outside,'app/order.rb'),join(root,'escape.rb'));
 await expect(prepareAction(root,{tool:'apply_patch',path:'escape.rb',beforeDigest:'x',oldText:'old',newText:'new'})).rejects.toThrow('outside');
 const source=await readSource(root,'app/order.rb');await writeFile(join(root,'app/order.rb'),'old old');
 const policy=new ExecutionPolicy(root);const runtime=new ToolRuntime(root,policy);
 const action={tool:'apply_patch' as const,path:'app/order.rb',beforeDigest:source.digest,oldText:'old',newText:'new'};
 await expect(prepareAction(root,action)).rejects.toThrow('stale');
 const now=await readSource(root,'app/order.rb');await expect(prepareAction(root,{...action,beforeDigest:now.digest})).rejects.toThrow('unique');
});
