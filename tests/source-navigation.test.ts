import {test,expect} from 'bun:test';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {SourceNavigator} from '../packages/tools/source-navigation';
test('source history search selection and refresh preserve labelled immutable snapshots',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-source-nav-'));
 try{await writeFile(join(root,'注文.rb'),'class Order\n  order = 1\n  order += 1\nend\n');await writeFile(join(root,'other.rb'),'other');const nav=new SourceNavigator(root);
  await nav.open('注文.rb',2);nav.search('order');expect(nav.current?.matches).toEqual([2,3]);nav.next(1);expect(nav.current?.line).toBe(3);nav.select(2,3);const reference=nav.reference();expect(reference.text).toContain('order += 1');expect(await nav.currentReference(reference)).toBe(true);
  await nav.open('other.rb');nav.back();expect(nav.current?.path).toBe('注文.rb');expect(nav.current?.line).toBe(3);
  await writeFile(join(root,'注文.rb'),'changed');expect(await nav.currentReference(reference)).toBe(false);expect(nav.current?.text).toContain('class Order');await nav.refresh();expect(nav.current?.text).toBe('changed');expect(nav.current?.selection).toBeUndefined();
 }finally{await rm(root,{recursive:true,force:true});}
});
