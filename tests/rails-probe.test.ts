import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseRubyFiles, probeAvailability } from '../packages/rails/probe';
const roots:string[]=[];
afterEach(async()=>{await Promise.all(roots.splice(0).map(path=>rm(path,{recursive:true,force:true})));});
async function fixture(source:string){const root=await mkdtemp(join(tmpdir(),'mavona-prism-')); roots.push(root); await mkdir(join(root,'app/models'),{recursive:true});await writeFile(join(root,'app/models/user.rb'),source);return root;}
test('Prism extracts namespaced declarations without executing Ruby or inherited RUBYOPT',async()=>{
 const root=await fixture('File.write("PWNED", "bad")\nmodule Admin\n class User < ApplicationRecord\n  belongs_to :team\n  validates :email, presence: true\n  before_save :normalize\n  LIMIT = 4\n  def show; end\n end\nend');
 const original=process.env.RUBYOPT;process.env.RUBYOPT='-r/nonexistent/mavona-hostile';
 try {const result=await parseRubyFiles(root,['app/models/user.rb']);expect(result.status).toBe('passed');
 expect(result.files[0]?.declarations.map(d=>[d.kind,d.name])).toEqual([['module','Admin'],['class','Admin::User'],['association','team'],['validation','email'],['callback','normalize'],['constant','Admin::User::LIMIT'],['method','show']]);
 expect(result.files[0]?.declarations[1]?.superclass).toBe('ApplicationRecord');expect(await Bun.file(join(root,'PWNED')).exists()).toBe(false);
 }finally{if(original===undefined)delete process.env.RUBYOPT;else process.env.RUBYOPT=original;}
});
test('syntax errors are failed structural evidence and dynamic declaration names stay unknown',async()=>{
 const root=await fixture('class Broken <');const failed=await parseRubyFiles(root,['app/models/user.rb']);expect(failed.status).toBe('failed');expect(failed.files[0]?.status).toBe('failed');
 await writeFile(join(root,'app/models/user.rb'),'class User; belongs_to computed_name; end');const result=await parseRubyFiles(root,['app/models/user.rb']);expect(result.files[0]?.declarations.find(d=>d.kind==='association')?.name).toBe(null);
});
test('missing Ruby returns explicit unknown, and unsafe paths fail before parsing',async()=>{
 const root=await fixture('class User; end');const result=await parseRubyFiles(root,['app/models/user.rb'],{ruby:['/nonexistent/ruby']});expect(result.status).toBe('unknown');expect(result.files).toEqual([]);
 await expect(parseRubyFiles(root,['../outside.rb'])).rejects.toThrow('outside');
});
test('older or incompatible Ruby response is unknown rather than fresh structural evidence',async()=>{
 const result=await probeAvailability({ruby:[process.execPath,'-e','console.log(JSON.stringify({schemaVersion:1,status:"unknown",reason:"parser_unavailable"}))','--']});expect(result.status).toBe('unknown');
});
test('probe output and execution are bounded, malformed responses never become facts',async()=>{
 expect((await probeAvailability({ruby:[process.execPath,'-e','process.stdout.write("x".repeat(20000))','--'],maxOutputBytes:1024})).status).toBe('unknown');
 expect((await probeAvailability({ruby:[process.execPath,'-e','setTimeout(()=>{},10000)','--'],timeoutMs:30})).status).toBe('unknown');
 expect((await probeAvailability({ruby:[process.execPath,'-e','console.log("{}")','--']})).status).toBe('unknown');
});
test('probe diagnostics cannot forward arbitrary executable output as evidence',async()=>{
 const result=await probeAvailability({ruby:[process.execPath,'-e','console.log(JSON.stringify({schemaVersion:1,status:"unknown",reason:"credential-canary"}))','--']});expect(result).toEqual({schemaVersion:1,status:'unknown',reason:'invalid_response'});
});
