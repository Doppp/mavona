import {test,expect} from 'bun:test';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {SourceNavigator} from '../packages/tools/source-navigation';
test('source diff identifies both immutable revisions and cannot select misleading diff line numbers',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-diff-'));
 try{await writeFile(join(root,'注文.rb'),'old\n');const nav=new SourceNavigator(root);await nav.open('注文.rb');const before=nav.current!.digest;await writeFile(join(root,'注文.rb'),'new\n');await nav.showDiff();expect(nav.current?.diff?.beforeDigest).toBe(before);expect(nav.current?.diff?.afterDigest).not.toBe(before);expect(nav.current?.diff?.text).toContain('-old\n+new');expect(nav.current?.text).toBe('old\n');expect(()=>nav.select(1,2)).toThrow('source view');nav.showSource();expect(nav.current?.diff).toBeUndefined();expect(nav.current?.digest).toBe(before);}
 finally{await rm(root,{recursive:true,force:true});}
});
