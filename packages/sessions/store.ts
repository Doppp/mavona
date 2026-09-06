import { Database } from 'bun:sqlite';
import { mkdirSync, openSync, closeSync, readFileSync, writeSync, fsyncSync, truncateSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { decode, type Envelope, type EventType, type Payloads } from '../protocol/events';
import { replay, type SessionState } from '../domain/task';
export class SessionStore {
 readonly events:Envelope[]=[];
 state:SessionState=replay([]);
 recoveredTrailingBytes=0;
 private fd=-1; private lock=-1;private db:Database|undefined;private ownership:Database|undefined;private closed=false;
 constructor(readonly directory:string,readonly sessionId:string,private secrets:readonly string[]=[]){
  if(!/^[\w-]+$/.test(sessionId))throw new Error('Invalid session ID');
  mkdirSync(directory,{recursive:true,mode:0o700});
  try {this.ownership=new Database(join(directory,'writer.sqlite'),{create:true});this.ownership.exec('PRAGMA busy_timeout=0; BEGIN EXCLUSIVE');this.lock=openSync(join(directory,'writer.lock'),'w',0o600);writeSync(this.lock,JSON.stringify({version:1,pid:process.pid,ownerId:Bun.randomUUIDv7(),sessionId}));fsyncSync(this.lock);} catch {this.ownership?.close();throw new Error('Session already owned or ownership unavailable');}
  try {
   this.fd=openSync(join(directory,'events.jsonl'),'a+',0o600);
   const bytes=readFileSync(join(directory,'events.jsonl'));const boundary=bytes.lastIndexOf(10)+1;
   const complete=bytes.subarray(0,boundary).toString('utf8');const seen=new Map<string,string>();
   for(const line of complete.split('\n').filter(Boolean)){
    const event=decode(JSON.parse(line));
    if(event.sessionId!==sessionId)throw new Error('Session identity mismatch');
    const normalized=JSON.stringify(event);const prior=seen.get(event.eventId);
    if(prior){if(prior!==normalized)throw new Error('Duplicate event ID with conflicting content');continue;}
    if(event.sequence!==this.events.length+1)throw new Error('Event sequence gap');
    seen.set(event.eventId,normalized);this.events.push(event);
   }
   this.state=replay(this.events);
   if(boundary<bytes.length){this.recoveredTrailingBytes=bytes.length-boundary;truncateSync(join(directory,'events.jsonl'),boundary);fsyncSync(this.fd);}
   this.db=new Database(join(directory,'projection.sqlite'),{create:true});
   this.db.exec('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, sequence INTEGER NOT NULL, json TEXT NOT NULL)');
   this.db.transaction(()=>{this.db!.exec('DELETE FROM events');for(const e of this.events)this.project(e);})();
  } catch(error){this.close();throw error;}
 }
 addSecret(value:string):void{if(value&&!this.secrets.includes(value))this.secrets=[...this.secrets,value];}
 sanitizeText(input:string):string{let text=input;for(const secret of this.secrets)if(secret)text=text.split(secret).join('[REDACTED]');return text.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi,'Bearer [REDACTED]').replace(/\bsk-[A-Za-z0-9_-]{12,}/g,'[REDACTED]');}
 private project(event:Envelope){this.db!.query('INSERT INTO events VALUES (?, ?, ?)').run(event.eventId,event.sequence,JSON.stringify(event));}
 append<T extends EventType>(type:T,payload:Payloads[T],causedBy?:string):Envelope {
  if(this.closed)throw new Error('Session closed');
  if(type==='effect.requested'&&!this.state.mutationAllowed)throw new Error('Unreconciled effect prevents mutation');
  if(this.state.unsupported)throw new Error('Replay contains unsupported events; upgrade before writing');
  const raw:Envelope={protocolVersion:1,eventId:Bun.randomUUIDv7(),sessionId:this.sessionId,sequence:this.events.length+1,timestamp:new Date().toISOString(),type,schemaVersion:1,payload:payload as unknown as Record<string,unknown>,...(causedBy?{causedBy}: {})};
  decode(raw);
  // Redact string values before either canonical or projection storage; never log originals.
  const redact=(value:unknown):unknown=>{
   if(typeof value==='string'){
    let text=value;
    for(const secret of this.secrets)if(secret)text=text.split(secret).join('[REDACTED]');
    return text.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi,'Bearer [REDACTED]').replace(/\bsk-[A-Za-z0-9_-]{12,}/g,'[REDACTED]');
   }
   if(Array.isArray(value))return value.map(redact);
   if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/password|secret|credential|api.?key|(?:access|refresh|auth).?token/i.test(k)?'[REDACTED]':redact(v)]));
   return value;
  };
  const event=decode({...raw,payload:redact(raw.payload)});const state=replay([...this.events,event]);
  const bytes=Buffer.from(JSON.stringify(event)+'\n');let offset=0;
  try {while(offset<bytes.length)offset+=writeSync(this.fd,bytes,offset,bytes.length-offset);fsyncSync(this.fd);}
  catch(error){this.close();throw error;}
  this.events.push(event);this.state=state;
  try{this.project(event);}catch{this.close();throw new Error('Canonical event saved; projection failed. Reopen to rebuild.');}
  return event;
 }
 close(){if(this.closed)return;this.closed=true;this.db?.close();if(this.fd>=0)closeSync(this.fd);if(this.lock>=0){closeSync(this.lock);try{unlinkSync(join(this.directory,'writer.lock'));}catch{}}this.ownership?.close();}
}
