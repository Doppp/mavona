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
test('changed pre-existing acceptance tests cannot be silently used to verify an implementation',async()=>{
 const {dir,root}=await fixture();await mkdir(join(root,'test/models'),{recursive:true});const path='test/models/order_test.rb';const original='assert_equal expected, order.total\n';await writeFile(join(root,path),original);const {digest}=await import('../packages/tools/source');let calls=0;const changed:Provider={async *stream(){calls++;if(calls===1)yield{type:'tool.delta',index:0,callId:'weaken',name:'apply_patch',argumentsDelta:JSON.stringify({path,beforeDigest:digest(original),oldText:original,newText:'assert true\n'})};else yield{type:'text.delta',text:'Tests pass.'};yield{type:'completed',finishReason:calls===1?'tool_calls':'stop'};}};const store=new SessionStore(join(dir,'session'),'criteria');const policy=new ExecutionPolicy(root);const argv=[process.execPath,'-e','process.exit(0)'];policy.grantDevelopment({commands:[argv],writePaths:[path],settingsDigest:await settingsDigest(root)});
 try{const result=await runTask({root,task:'Change order behavior',provider:changed,providerId:'fixture',model:'test',capabilities,store,policy,signal:new AbortController().signal,verifiers:[{id:'approved-check',argv,required:true,provenance:'user-approved',timeoutMs:3000}]});expect(result.correctness).toBe('unknown');expect(result.status).toBe('acceptance_changed');expect(store.events.filter(event=>event.type==='effect.requested')).toHaveLength(1);}
 finally{store.close();await rm(dir,{recursive:true,force:true});}
});
test('configured verifier is selected automatically but still requires explicit execution approval',async()=>{
 const {dir,root}=await fixture();const argv=[process.execPath,'-e','if (!(await Bun.file("app/models/order.rb").text()).includes("new")) process.exit(1)'];await writeFile(join(root,'.mavona.yml'),JSON.stringify({verification:{test:{command:argv}}}));const store=new SessionStore(join(dir,'session'),'automatic');const policy=new ExecutionPolicy(root);policy.grantDevelopment({commands:[],writePaths:['app/models/order.rb'],settingsDigest:await settingsDigest(root)});let approvals=0;
 try{const result=await runTask({root,task:'Change order behavior',provider:provider(),providerId:'fixture',model:'test',capabilities,store,policy,signal:new AbortController().signal,verifiers:[],approve:async action=>{approvals++;expect(action.action.tool).toBe('run_command');return true;}});expect(result.correctness).toBe('passed');expect(approvals).toBe(1);expect(result.checks[0]?.provenance).toBe('repository');expect(store.events.some(event=>event.type==='verification.selected')).toBe(true);}
 finally{store.close();await rm(dir,{recursive:true,force:true});}
});

test('acceptance changes survive retry and require adoption of the exact reviewed state',async()=>{
 const {dir,root}=await fixture();await mkdir(join(root,'test/models'),{recursive:true});const path='test/models/order_test.rb';await writeFile(join(root,path),'assert_equal expected, order.total\n');const store=new SessionStore(join(dir,'session'),'adoption');let calls=0;const done:Provider={async *stream(){calls++;yield{type:'completed',finishReason:'stop'};}};const argv=[process.execPath,'-e','process.exit(0)'];const policy=new ExecutionPolicy(root);policy.grantDevelopment({commands:[argv],writePaths:[],settingsDigest:await settingsDigest(root)});
 const options={root,task:'Review order behavior',provider:done,providerId:'fixture',model:'test',capabilities,store,policy,signal:new AbortController().signal,verifiers:[{id:'test',argv,required:true,provenance:'user-approved' as const,timeoutMs:3000}]};
 try{expect((await runTask(options)).correctness).toBe('passed');await writeFile(join(root,path),'assert_equal new_expected, order.total\n');const {captureRepositoryState}=await import('../packages/tools/repository-state');store.append('repository.snapshot',{snapshot:JSON.stringify(await captureRepositoryState(root)),reason:'explicit-reconciliation'});
  const blocked=await runTask(options);expect(blocked.status).toBe('acceptance_changed');expect(calls).toBe(1);
  let reviews=0;const accepted=await runTask({...options,adoptAcceptance:async(review:import('../packages/verification/adoption').AcceptanceReview)=>{reviews++;expect(review.changes[0]?.before?.text).toContain('assert_equal expected');expect(review.changes[0]?.after?.text).toContain('new_expected');return true;}});expect(reviews).toBe(1);expect(accepted.correctness).toBe('passed');expect(store.events.some(event=>event.type==='acceptance.adopted')).toBe(true);
  await writeFile(join(root,path),'assert true\n');store.append('repository.snapshot',{snapshot:JSON.stringify(await captureRepositoryState(root)),reason:'explicit-reconciliation'});const drift=await runTask({...options,adoptAcceptance:async()=>{await writeFile(join(root,path),'assert false\n');return true;}});expect(drift.correctness).toBe('unknown');expect(calls).toBe(2);
 }finally{store.close();await rm(dir,{recursive:true,force:true});}
});
