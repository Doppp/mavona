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
test('unimplemented run refuses instead of reporting a verified task',async () => {
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
