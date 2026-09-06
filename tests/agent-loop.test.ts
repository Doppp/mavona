import {test,expect} from 'bun:test';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runTask} from '../packages/agent/loop';
import {SessionStore} from '../packages/sessions/store';
import {ExecutionPolicy,settingsDigest} from '../packages/tools/policy';
import type {Provider,ProviderRequest,ProviderEvent} from '../packages/providers/types';
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'mavona-agent-'));const root=join(dir,'repo');await mkdir(join(root,'config'),{recursive:true});await mkdir(join(root,'app/models'),{recursive:true});await writeFile(join(root,'config/application.rb'),'');await writeFile(join(root,'app/models/order.rb'),'# user edit\nold\n');await Bun.spawn(['git','init','-q',root]).exited;return {dir,root};}
const capabilities={streaming:true,tools:true,instructions:true,structuredOutput:false,images:false,locality:'local' as const,source:'bounded_preflight' as const,observedAt:new Date().toISOString(),contextWindow:32000};
function provider():Provider {let step=0;return {async *stream(request:ProviderRequest):AsyncGenerator<ProviderEvent>{
 step++;
 if(step===1)yield {type:'tool.delta',index:0,callId:'read-1',name:'read_file',argumentsDelta:JSON.stringify({path:'app/models/order.rb'})};
 else if(step===2){const last=request.messages.at(-1)!;const source=JSON.parse(last.content);yield {type:'tool.delta',index:0,callId:'patch-1',name:'apply_patch',argumentsDelta:JSON.stringify({path:'app/models/order.rb',beforeDigest:source.digest,oldText:'old',newText:'new'})};}
 else yield {type:'text.delta',text:'Changed order.'};
 yield{type:'completed',finishReason:step<3?'tool_calls':'stop'};
 }};}
test('actual read/patch/verification loop preserves user edits and records independent outcomes',async()=>{
 const {dir,root}=await fixture();const store=new SessionStore(join(dir,'session'),'s1');const policy=new ExecutionPolicy(root);
 const argv=[process.execPath,'-e','if (!(await Bun.file("app/models/order.rb").text()).includes("new")) process.exit(1)'];
 policy.grantDevelopment({commands:[argv],writePaths:['app/models/order.rb'],settingsDigest:await settingsDigest(root)});
 try{
 const result=await runTask({root,task:'Change order behavior',provider:provider(),providerId:'fixture',model:'test',capabilities,store,policy,signal:new AbortController().signal,verifiers:[{id:'order-outcome',argv,required:true,provenance:'user-approved',timeoutMs:3000}]});
 expect(result.correctness).toBe('passed');expect(result.exitCode).toBe(0);expect(await readFile(join(root,'app/models/order.rb'),'utf8')).toBe('# user edit\nnew\n');
 expect(store.events.some(e=>e.type==='verification.completed')).toBe(true);expect(store.events.at(-1)?.type).toBe('task.completed');
 }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
test('headless refuses unapproved patch and empty verification never passes',async()=>{
 const {dir,root}=await fixture();const store=new SessionStore(join(dir,'session'),'s2');
 try{const result=await runTask({root,task:'Change order behavior',provider:provider(),providerId:'fixture',model:'test',capabilities,store,policy:new ExecutionPolicy(root),signal:new AbortController().signal,verifiers:[]});
 expect(result.exitCode).toBe(2);expect(result.correctness).toBe('unknown');expect(await readFile(join(root,'app/models/order.rb'),'utf8')).toContain('old');
 }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
test('tool loop budget stops repeated requests and malformed tools cannot execute',async()=>{
 const {dir,root}=await fixture();const store=new SessionStore(join(dir,'session'),'s3');let requests=0;
 const repeated:Provider={async *stream(){requests++;yield{type:'tool.delta',index:0,callId:'repeat-'+requests,name:'read_file',argumentsDelta:'{"path":"app/models/order.rb"}'};yield{type:'completed',finishReason:'tool_calls'};}};
 try{const result=await runTask({root,task:'Change order behavior',provider:repeated,providerId:'fixture',model:'test',capabilities,store,policy:new ExecutionPolicy(root),signal:new AbortController().signal,verifiers:[],maxTurns:2});expect(requests).toBe(2);expect(result.exitCode).toBe(4);}finally{store.close();await rm(dir,{recursive:true,force:true});}
});
test('verification that changes source cannot leave earlier evidence fresh',async()=>{
 const {dir,root}=await fixture();const store=new SessionStore(join(dir,'session'),'s4');const policy=new ExecutionPolicy(root);const argv=[process.execPath,'-e','await Bun.write("app/models/order.rb","changed by verifier")'];policy.grantDevelopment({commands:[argv],writePaths:[],settingsDigest:await settingsDigest(root)});
 const done:Provider={async *stream(){yield{type:'text.delta',text:'Ready for checks.'};yield{type:'completed',finishReason:'stop'};}};
 try{const result=await runTask({root,task:'Review order behavior',provider:done,providerId:'fixture',model:'test',capabilities,store,policy,signal:new AbortController().signal,verifiers:[{id:'mutating-check',argv,required:true,provenance:'user-approved',timeoutMs:3000}]});expect(result.correctness).toBe('unknown');expect(result.checks[0]?.fresh).toBe(false);}
 finally{store.close();await rm(dir,{recursive:true,force:true});}
});
test('changed resumed repository requires reconciliation before another model request',async()=>{
 const {dir,root}=await fixture();const store=new SessionStore(join(dir,'session'),'s5');let calls=0;const done:Provider={async *stream(){calls++;yield{type:'completed',finishReason:'stop'};}};
 const options={root,task:'Review order behavior',provider:done,providerId:'fixture',model:'test',capabilities,store,policy:new ExecutionPolicy(root),signal:new AbortController().signal,verifiers:[]};
 try{await runTask(options);expect(calls).toBe(1);await writeFile(join(root,'app/models/order.rb'),'external saved change');const result=await runTask(options);expect(result.status).toBe('repository_changed');expect(result.exitCode).toBe(2);expect(calls).toBe(1);expect(await readFile(join(root,'app/models/order.rb'),'utf8')).toBe('external saved change');}
 finally{store.close();await rm(dir,{recursive:true,force:true});}
});
