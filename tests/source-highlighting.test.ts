import {test,expect} from 'bun:test';import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {sourceHighlighter} from '../packages/tui/source-highlighting';
test('bundled Ruby parser highlights Unicode source locally and preserves original offsets',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-highlight-'));const client=sourceHighlighter(root);
 try{const text='# 注文\nclass Order < ApplicationRecord\n  validates :name, presence: true\nend\n';const result=await client.highlightOnce(text,'ruby');expect(result.error).toBeUndefined();expect(result.highlights?.length).toBeGreaterThan(5);expect(result.highlights?.some(([start,end,group])=>group==='keyword'&&text.slice(start,end)==='class')).toBe(true);expect(result.highlights?.some(([, ,group])=>group==='comment')).toBe(true);}
 finally{await client.destroy();await rm(root,{recursive:true,force:true});}
});
