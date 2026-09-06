import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scopedInstructions } from '../packages/rails/instructions';
import { parseRubyFilesCached } from '../packages/rails/cache';
const roots:string[]=[];afterEach(async()=>{await Promise.all(roots.splice(0).map(path=>rm(path,{recursive:true,force:true})));});
async function directory(){const path=await mkdtemp(join(tmpdir(),'mavona-context-'));roots.push(path);return path;}
async function put(root:string,path:string,text:string){await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),text);}
test('instruction scopes follow target ancestry and preserve changed digest',async()=>{
 const root=await directory();await put(root,'AGENTS.md','root');await put(root,'app/AGENTS.md','app');await put(root,'test/AGENTS.md','unrelated');await put(root,'app/models/order.rb','class Order; end');
 const before=await scopedInstructions(root,['app/models/order.rb']);expect(before.map(x=>x.path)).toEqual(['AGENTS.md','app/AGENTS.md']);expect(before.every(x=>x.trust==='repository')).toBe(true);
 await put(root,'app/AGENTS.md','changed');const after=await scopedInstructions(root,['app/models/order.rb']);expect(after[0]?.digest).toBe(before[0]?.digest);expect(after[1]?.digest).not.toBe(before[1]?.digest);
 await expect(scopedInstructions(root,['../escape.rb'])).rejects.toThrow('outside');
});
test('persistent structural cache reuses unchanged file and invalidates changed content',async()=>{
 const root=await directory();const cache=await directory();await put(root,'app/models/order.rb','class Order; end');
 const first=await parseRubyFilesCached(root,['app/models/order.rb'],cache);expect(first.status).toBe('passed');expect(first.observations[0]?.provenance).toBe('fresh');
 const second=await parseRubyFilesCached(root,['app/models/order.rb'],cache);expect(second.observations[0]?.provenance).toBe('cache');expect(second.observations[0]?.capturedAt).toBe(first.observations[0]?.capturedAt);
 await put(root,'unrelated.txt','untracked');expect((await parseRubyFilesCached(root,['app/models/order.rb'],cache)).observations[0]?.provenance).toBe('cache');
 await put(root,'app/models/order.rb','class Invoice; end');const changed=await parseRubyFilesCached(root,['app/models/order.rb'],cache);expect(changed.observations[0]?.provenance).toBe('fresh');expect(changed.files[0]?.declarations[0]?.name).toBe('Invoice');
 const unavailable=await parseRubyFilesCached(root,['app/models/order.rb'],cache,{ruby:['/missing/ruby']});expect(unavailable.status).toBe('unknown');expect(unavailable.observations).toEqual([]);
});
