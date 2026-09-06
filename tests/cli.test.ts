import { test, expect } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const entry=join(import.meta.dir,'../apps/mavona/main.ts');
const command=process.env.MAVONA_TEST_BINARY?[process.env.MAVONA_TEST_BINARY]:[process.execPath,entry];
test('headless executable path inspects a real Git fixture with JSON-only stdout',async () => {
 const root=await mkdtemp(join(tmpdir(),'mavona-cli-'));
 try {
  expect(await Bun.spawn(['git','init','-q',root]).exited).toBe(0);
  await mkdir(join(root,'config')); await writeFile(join(root,'config/application.rb'),'raise "never execute"');
  const child=Bun.spawn([...command,'inspect',root,'--format','json'],{stdout:'pipe',stderr:'pipe'});
  const output=JSON.parse(await new Response(child.stdout).text());
  expect(await child.exited).toBe(0); expect(output.status).toBe('selected'); expect(output.runtime).toBe('unknown');
  expect(await new Response(child.stderr).text()).toBe('');
 } finally {await rm(root,{recursive:true,force:true});}
});
test('unconfigured run refuses instead of reporting a verified task',async () => {
 const child=Bun.spawn([...command,'run','fix orders'],{stdout:'pipe',stderr:'pipe'});
 expect(await child.exited).toBe(2);expect(await new Response(child.stdout).text()).toBe('');
});
test.skipIf(!process.env.MAVONA_TEST_BINARY)('packaged startup ignores repository runtime preload configuration',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-hostile-runtime-'));
 try {
  await writeFile(join(root,'bunfig.toml'),'preload = ["./hostile.ts"]\n');
  await writeFile(join(root,'hostile.ts'),'await Bun.write("PWNED", "executed");');
  const child=Bun.spawn([...command,'--version'],{cwd:root,env:{PATH:'/usr/bin:/bin'},stdout:'pipe',stderr:'pipe'});
  expect(await child.exited).toBe(0);expect(await new Response(child.stdout).text()).toContain('mavona 0.1.0');
  expect(await Bun.file(join(root,'PWNED')).exists()).toBe(false);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('offline inspect exposes task nominations and explicit unmatched decisions',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-route-cli-'));
 try {
  expect(await Bun.spawn(['git','init','-q',root]).exited).toBe(0);
  await mkdir(join(root,'config'));await writeFile(join(root,'config/application.rb'),'');
  const child=Bun.spawn([...command,'inspect',root,'--task','Adjust frobnicator behavior'],{stdout:'pipe',stderr:'pipe'});
  const output=JSON.parse(await new Response(child.stdout).text());
  expect(output.routing.status).toBe('NEEDS_DECISION');expect(output.routing.contextPaths).toEqual([]);
  expect(await child.exited).toBe(0);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('headless local HTTP provider performs an approved patch and independent verification',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mavona-cli-run-'));const root=join(dir,'repo');let calls=0;
 const server=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(request){
  const body=await request.json() as {messages:{role:string;content:string}[]};calls++;
  const source=JSON.parse(body.messages[1]!.content).sources[0];
  const delta=calls===1?{tool_calls:[{index:0,id:'patch-1',type:'function',function:{name:'apply_patch',arguments:JSON.stringify({path:'app/models/order.rb',beforeDigest:source.digest,oldText:'old',newText:'new'})}}]}:{content:'Order updated.'};
  return new Response('data: '+JSON.stringify({choices:[{delta,finish_reason:null}]})+'\n\ndata: '+JSON.stringify({choices:[{delta:{},finish_reason:calls===1?'tool_calls':'stop'}]})+'\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }});
 try{
  await mkdir(join(root,'config'),{recursive:true});await mkdir(join(root,'app/models'),{recursive:true});await writeFile(join(root,'config/application.rb'),'');await writeFile(join(root,'app/models/order.rb'),'# prior user change\nold\n');await Bun.spawn(['git','init','-q',root]).exited;
  const argv=JSON.stringify([process.execPath,'-e','if ((await Bun.file("app/models/order.rb").text())!=="# prior user change\\nnew\\n") process.exit(1)']);
  const child=Bun.spawn([...command,'run','Change app/models/order.rb','--root',root,'--provider','fixture','--model','test','--endpoint',`http://127.0.0.1:${server.port}/v1`,'--locality','local','--trust-model-tools','--allow-write','app/models/order.rb','--allow-command',argv,'--verify',argv,'--data-dir',join(dir,'data'),'--format','jsonl'],{stdout:'pipe',stderr:'pipe'});
  const output=await new Response(child.stdout).text();const error=await new Response(child.stderr).text();expect(error).toBe('');expect(await child.exited).toBe(0);
  const events=output.trim().split('\n').map(line=>JSON.parse(line));expect(events.at(-1).result.correctness).toBe('passed');expect(events.filter(e=>e.type==='effect.requested')).toHaveLength(2);expect(calls).toBe(2);
  expect(await Bun.file(join(root,'app/models/order.rb')).text()).toBe('# prior user change\nnew\n');
 }finally{server.stop(true);await rm(dir,{recursive:true,force:true});}
});
