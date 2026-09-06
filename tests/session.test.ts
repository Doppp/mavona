import { test, expect, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, appendFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionStore } from '../packages/sessions/store';
import { correctness } from '../packages/domain/task';
const dirs:string[]=[];
afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true});});
function directory(){const d=mkdtempSync(join(tmpdir(),'mavona-session-'));dirs.push(d);return d;}
test('required check truth cannot be promoted by diagnostic tests, stale evidence or empty checks',()=>{
 expect(correctness([])).toBe('unknown');
 const check={id:'check-1',required:true,state:'passed' as const,provenance:'user-approved' as const,fresh:true};
 expect(correctness([check])).toBe('passed');
 expect(correctness([{...check,provenance:'model-proposed'}])).toBe('unknown');
 expect(correctness([{...check,fresh:false}])).toBe('unknown');
 expect(correctness([{...check,state:'failed'}, {...check,id:'check-2',state:'unknown'}])).toBe('failed');
});
test('append/reopen preserves draft and incomplete effect intent without executing effects',()=>{
 const dir=directory(); let store=new SessionStore(dir,'session-1');
 store.append('session.opened',{repository:'/fixture'});
 store.append('draft.changed',{text:'Orders\n注文'});
 const request=store.append('effect.requested',{effectId:'effect-1',kind:'command'});
 expect(request.sequence).toBe(3);store.close();
 store=new SessionStore(dir,'session-1');
 expect(store.state.draft).toBe('Orders\n注文');
 expect(store.state.effects['effect-1']).toBe('unknown');
 expect(store.state.mutationAllowed).toBe(false);store.close();
});
test('truncates only incomplete trailing bytes and rebuilds SQLite from canonical JSONL',()=>{
 const dir=directory();let store=new SessionStore(dir,'session-2');store.append('session.opened',{repository:'/fixture'});store.close();
 appendFileSync(join(dir,'events.jsonl'),'{"incomplete":');
 rmSync(join(dir,'projection.sqlite'));store=new SessionStore(dir,'session-2');
 expect(store.events).toHaveLength(1);expect(store.recoveredTrailingBytes).toBeGreaterThan(0);
 expect(readFileSync(join(dir,'events.jsonl'),'utf8').endsWith('\n')).toBe(true);store.close();
});
test('complete corrupt records and unknown critical versions refuse mutation',()=>{
 const dir=directory();let store=new SessionStore(dir,'session-3');const event=store.append('session.opened',{repository:'/fixture'});store.close();
 appendFileSync(join(dir,'events.jsonl'),JSON.stringify({...event,eventId:'unknown-1',sequence:2,type:'approval.resolved',schemaVersion:99,payload:{}})+'\n');
 store=new SessionStore(dir,'session-3');expect(store.state.mutationAllowed).toBe(false);
 expect(()=>store.append('draft.changed',{text:'x'})).toThrow('unsupported');store.close();
 appendFileSync(join(dir,'events.jsonl'),'not JSON\n');expect(()=>new SessionStore(dir,'session-3')).toThrow();
});
test('duplicate delivery does not apply twice and conflicting IDs refuse replay',()=>{
 const dir=directory();let store=new SessionStore(dir,'session-4');const event=store.append('session.opened',{repository:'/fixture'});store.close();
 appendFileSync(join(dir,'events.jsonl'),JSON.stringify(event)+'\n');store=new SessionStore(dir,'session-4');expect(store.events).toHaveLength(1);store.close();
 appendFileSync(join(dir,'events.jsonl'),JSON.stringify({...event,payload:{repository:'/different'}})+'\n');
 expect(()=>new SessionStore(dir,'session-4')).toThrow('conflicting');
});
test('single writer owns a session and releases ownership on close',()=>{
 const dir=directory();const store=new SessionStore(dir,'session-5');
 expect(()=>new SessionStore(dir,'session-5')).toThrow('owned');store.close();
 const resumed=new SessionStore(dir,'session-5');resumed.close();
});
test('secret values are redacted before disk and payloads runtime validated',()=>{
 const dir=directory();const store=new SessionStore(dir,'session-6',['canary-private-value']);
 store.append('session.opened',{repository:'/fixture'});store.append('draft.changed',{text:'use canary-private-value'});
 expect(readFileSync(join(dir,'events.jsonl'),'utf8')).not.toContain('canary-private-value');
 expect(()=>store.append('draft.changed',{text:42} as never)).toThrow();store.close();
});
test('unreconciled effect blocks another intent and malformed completed record is not truncated',()=>{
 const dir=directory();let store=new SessionStore(dir,'session-7');
 store.append('session.opened',{repository:'/fixture'});store.append('effect.requested',{effectId:'one',kind:'patch'});
 expect(()=>store.append('effect.requested',{effectId:'two',kind:'patch'})).toThrow('Unreconciled');
 store.close();appendFileSync(join(dir,'events.jsonl'),'broken\n');const before=readFileSync(join(dir,'events.jsonl'));
 expect(()=>new SessionStore(dir,'session-7')).toThrow();expect(readFileSync(join(dir,'events.jsonl'))).toEqual(before);
});

test('canonical JSON evidence redacts values without consuming structure or adjacent fields',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const dir=await mkdtemp(join(tmpdir(),'mavona-json-redaction-'));const store=new SessionStore(dir,'json-redaction',['EXPLICIT_CANARY']);try{const event=store.append('app_observation',{inspectionId:'inspection',observationId:'observation',evidence:JSON.stringify({url:'http://127.0.0.1/?token=QUERY_CANARY',title:'EXPLICIT_CANARY',metadata:{password:'PASSWORD_CANARY'},files:{'config/credentials.yml.enc':{digest:'hash',state:'present'}},next:'retained',nested:JSON.stringify({url:'http://127.0.0.1/?secret=NESTED_CANARY',safe:'yes'})})});const evidence=JSON.parse(String(event.payload.evidence));expect(evidence.next).toBe('retained');expect(evidence.files['config/credentials.yml.enc']).toEqual({digest:'hash',state:'present'});expect(JSON.parse(evidence.nested).safe).toBe('yes');expect(JSON.stringify(event)).not.toContain('CANARY');expect(evidence.metadata.password).toBe('[REDACTED]');}finally{store.close();await rm(dir,{recursive:true,force:true});}
});
