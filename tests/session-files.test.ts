import {test,expect} from 'bun:test';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,linkSync,rmSync,openSync,ftruncateSync,closeSync,statSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {SessionStore} from '../packages/sessions/store';import {readHistory} from '../packages/sessions/lifecycle';
test('history reads reject sparse oversized files before allocating the history',()=>{
 const root=mkdtempSync(join(tmpdir(),'mavona-history-budget-'));const fd=openSync(join(root,'events.jsonl'),'w');ftruncateSync(fd,128*1024*1024+1);closeSync(fd);
 try{expect(()=>readHistory(root,'large')).toThrow('budget');expect(()=>new SessionStore(root,'large')).toThrow('budget');expect(statSync(join(root,'events.jsonl')).size).toBe(128*1024*1024+1);}finally{rmSync(root,{recursive:true,force:true});}
});
test('writer refuses linked canonical logs and lock markers without changing outside bytes',()=>{
 for(const name of ['events.jsonl','writer.lock','writer.sqlite','projection.sqlite','projection.sqlite-journal'])for(const kind of ['symlink','hardlink']){
  const root=mkdtempSync(join(tmpdir(),'mavona-session-links-'));const dir=join(root,'session');mkdirSync(dir);const outside=join(root,'outside');writeFileSync(outside,'private original');if(kind==='symlink')symlinkSync(outside,join(dir,name));else linkSync(outside,join(dir,name));
  try{expect(()=>new SessionStore(dir,'linked')).toThrow();expect(readFileSync(outside,'utf8')).toBe('private original');}finally{rmSync(root,{recursive:true,force:true});}
 }
});
test('read-only history and writer reject a symlink session directory',()=>{
 const root=mkdtempSync(join(tmpdir(),'mavona-session-directory-'));const dir=join(root,'real');const writer=new SessionStore(dir,'one');writer.append('session.opened',{repository:'/fixture'});writer.close();symlinkSync(dir,join(root,'linked'));
 try{expect(()=>readHistory(join(root,'linked'),'one')).toThrow('symlink');expect(()=>new SessionStore(join(root,'linked'),'one')).toThrow('symlink');}finally{rmSync(root,{recursive:true,force:true});}
});
test('external log edits stop the active writer before another append',()=>{
 const root=mkdtempSync(join(tmpdir(),'mavona-session-drift-'));const store=new SessionStore(root,'drift');store.append('session.opened',{repository:'/fixture'});const path=join(root,'events.jsonl');const changed=readFileSync(path,'utf8')+'external incomplete';writeFileSync(path,changed);
 try{expect(()=>store.append('draft.changed',{text:'must not append'})).toThrow('changed');expect(readFileSync(path,'utf8')).toBe(changed);}finally{store.close();rmSync(root,{recursive:true,force:true});}
});
