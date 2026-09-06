import { afterEach, expect, test } from 'bun:test';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectRepository } from '../packages/rails/discovery';
import { readSource, selectLines, selectionIsCurrent } from '../packages/tools/source';
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(p => rm(p, {recursive:true, force:true}))); });
async function fixture() {
 const p = await mkdtemp(join(tmpdir(), 'mavona-test-')); roots.push(p);
 const git = Bun.spawn(['git','init','-q',p]); expect(await git.exited).toBe(0);
 return p;
}
async function put(root:string, path:string, text:string) {
 await mkdir(join(root,path,'..'),{recursive:true}); await writeFile(join(root,path),text);
}
test('offline discovery identifies facts and does not execute hostile config or application', async () => {
 const root = await fixture();
 await put(root,'config/application.rb', 'raise "must not run"');
 await put(root,'Gemfile.lock','    rails (8.1.0)\n    pg (1.6.0)\n    turbo-rails (2.0.0)\n');
 await put(root,'app/models/order.rb','class Order < ApplicationRecord\nend\n');
 await put(root,'test/models/order_test.rb','');
 await put(root,'.mavona.yml','boot: ["touch", "PWNED"]');
 const result = await inspectRepository(root);
 expect(result.status).toBe('selected'); expect(result.selectedRoot).toBe('.');
 expect(result.facts.railsVersion).toBe('8.1.0'); expect(result.facts.testFrameworks).toEqual(['minitest']);
 expect(result.files).toContain('app/models/order.rb');
 expect(result.runtime).toBe('unknown'); expect(await Bun.file(join(root,'PWNED')).exists()).toBe(false);
});
test('multiple roots require a choice unless the requested directory scopes one',async () => {
 const root=await fixture(); await put(root,'apps/a/config/application.rb',''); await put(root,'apps/b/config/application.rb','');
 expect((await inspectRepository(root)).status).toBe('needs_decision');
 expect((await inspectRepository(join(root,'apps/a'))).selectedRoot).toBe('apps/a');
});
test('ignored trees and symlink escapes cannot nominate a Rails root or leak source',async () => {
 const root=await fixture(); const outside=await fixture();
 await put(outside,'config/application.rb','secret');
 await put(root,'vendor/ignored/config/application.rb','');
 await symlink(outside,join(root,'escape'));
 expect((await inspectRepository(root)).roots).toEqual([]);
 await expect(readSource(root,'escape/config/application.rb')).rejects.toThrow('outside');
 await expect(readSource(root,'../secret')).rejects.toThrow('outside');
 await put(root,'.env','TOKEN=secret'); await expect(readSource(root,'.env')).rejects.toThrow('excluded');
});
test('source snapshots preserve line selection and detect drift without inference',async () => {
 const root=await fixture(); await put(root,'app/models/注文.rb','class Order\n  # hello\nend\n');
 const snapshot=await readSource(root,'app/models/注文.rb'); const selection=selectLines(snapshot,2,2);
 expect(selection.text).toBe('  # hello'); expect(await selectionIsCurrent(root,selection)).toBe(true);
 await put(root,'app/models/注文.rb','class Order\n  # changed\nend\n');
 expect(await selectionIsCurrent(root,selection)).toBe(false);
 expect(() => selectLines(snapshot,0,2)).toThrow();
});
test('binary and oversized files have bounded explicit refusals',async () => {
 const root=await fixture(); await put(root,'binary','x\0y'); await put(root,'large','12345');
 await expect(readSource(root,'binary')).rejects.toThrow('binary');
 await expect(readSource(root,'large',4)).rejects.toThrow('limit');
});
test('non-Git paths return explicit unsupported inspection',async () => {
 const root=await mkdtemp(join(tmpdir(),'mavona-no-git-')); roots.push(root);
 expect((await inspectRepository(root)).status).toBe('unsupported');
});
