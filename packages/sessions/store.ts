import {validateSessionFiles,readSessionBytes,HISTORY_LIMIT,regularSessionFile} from './files';
import { Database } from 'bun:sqlite';
import { mkdirSync, openSync, closeSync, writeSync, fsyncSync, ftruncateSync, fstatSync, constants, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { decode, type Envelope, type EventType, type Payloads } from '../protocol/events';
import { replay, type SessionState } from '../domain/task';
export class SessionStore {
 readonly events:Envelope[]=[];
 state:SessionState=replay([]);
 recoveredTrailingBytes=0;
 private logSize=0n;private logModified=0n;
 private fd=-1; private lock=-1;private db:Database|undefined;private ownership:Database|undefined;private closed=false;
 constructor(readonly directory:string,readonly sessionId:string,private secrets:readonly string[]=[]){
  if(!/^[\w-]+$/.test(sessionId))throw new Error('Invalid session ID');
  mkdirSync(directory,{recursive:true,mode:0o700});validateSessionFiles(directory);
  try {this.ownership=new Database(join(directory,'writer.sqlite'),{create:true});this.ownership.exec('PRAGMA busy_timeout=0; BEGIN EXCLUSIVE');this.lock=openSync(join(directory,'writer.lock'),constants.O_WRONLY|constants.O_CREAT|constants.O_NOFOLLOW,0o600);if(fstatSync(this.lock).nlink!==1)throw new Error('Session lock hardlink refused');ftruncateSync(this.lock,0);writeSync(this.lock,JSON.stringify({version:1,pid:process.pid,ownerId:Bun.randomUUIDv7(),sessionId}));fsyncSync(this.lock);} catch {if(this.lock>=0)closeSync(this.lock);this.ownership?.close();throw new Error('Session already owned or ownership unavailable');}
  try {
   this.fd=openSync(join(directory,'events.jsonl'),constants.O_RDWR|constants.O_CREAT|constants.O_APPEND|constants.O_NOFOLLOW,0o600);
   const bytes=readSessionBytes(directory,this.fd);const boundary=bytes.lastIndexOf(10)+1;
   const complete=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,boundary));const seen=new Map<string,string>();
   for(const line of complete.split('\n').filter(Boolean)){
    const event=decode(JSON.parse(line));
    if(event.sessionId!==sessionId)throw new Error('Session identity mismatch');
    const normalized=JSON.stringify(event);const prior=seen.get(event.eventId);
    if(prior){if(prior!==normalized)throw new Error('Duplicate event ID with conflicting content');continue;}
    if(event.sequence!==this.events.length+1)throw new Error('Event sequence gap');
    seen.set(event.eventId,normalized);this.events.push(event);
   }
   this.state=replay(this.events);
   if(boundary<bytes.length){this.recoveredTrailingBytes=bytes.length-boundary;ftruncateSync(this.fd,boundary);fsyncSync(this.fd);}
   const metadata=fstatSync(this.fd,{bigint:true});this.logSize=metadata.size;this.logModified=metadata.mtimeNs;
   this.db=new Database(join(directory,'projection.sqlite'),{create:true});
   this.db.exec('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, sequence INTEGER NOT NULL, json TEXT NOT NULL)');
   this.db.transaction(()=>{this.db!.exec('DELETE FROM events');for(const e of this.events)this.project(e);})();
  } catch(error){this.close();throw error;}
 }
 addSecret(value:string):void{if(value&&!this.secrets.includes(value))this.secrets=[...this.secrets,value];}
 sanitizeText(input:string):string{let text=input;for(const secret of this.secrets)if(secret)text=text.split(secret).join('[REDACTED]');return text.replace(/(https?:\/\/)[^/\s]*@/gi,'$1[REDACTED]@').replace(/([?&](?:access_token|refresh_token|auth_token|token|password|api[_-]?key|secret|credential)=)[^&#\s]*/gi,'$1[REDACTED]').replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi,'Bearer [REDACTED]').replace(/\bsk-[A-Za-z0-9_-]{12,}/g,'[REDACTED]');}
 private project(event:Envelope){this.db!.query('INSERT INTO events VALUES (?, ?, ?)').run(event.eventId,event.sequence,JSON.stringify(event));}
 append<T extends EventType>(type:T,payload:Payloads[T],causedBy?:string):Envelope {
  if(this.closed)throw new Error('Session closed');
  if(type==='effect.requested'&&!this.state.mutationAllowed)throw new Error('Unreconciled effect prevents mutation');
  if(this.state.unsupported)throw new Error('Replay contains unsupported events; upgrade before writing');
  const raw:Envelope={protocolVersion:1,eventId:Bun.randomUUIDv7(),sessionId:this.sessionId,sequence:this.events.length+1,timestamp:new Date().toISOString(),type,schemaVersion:1,payload:payload as unknown as Record<string,unknown>,...(causedBy?{causedBy}: {})};
  decode(raw);
  // Redact string values before either canonical or projection storage; never log originals.
  const redact=(value:unknown,depth=0,structured=false):unknown=>{
   if(depth>64)throw new Error('Evidence nesting exceeds redaction budget');
   if(typeof value==='string'){if(/^[\s]*[\[{]/.test(value)){let parsed:unknown;try{parsed=JSON.parse(value);}catch{}if(parsed&&typeof parsed==='object')return JSON.stringify(redact(parsed,depth+1,true));}return this.sanitizeText(value);}
   if(Array.isArray(value))return value.map(item=>redact(item,depth+1,structured));
   if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,(structured?/^[a-z0-9_-]*(?:password|secret|credential|api[_-]?key|(?:access|refresh|auth)[_-]?token)s?$/i:/password|secret|credential|api.?key|(?:access|refresh|auth).?token/i).test(k)?'[REDACTED]':redact(v,depth+1,structured)]));
   return value;
  };
  const event=decode({...raw,payload:redact(raw.payload)});const state=replay([...this.events,event]);
  const bytes=Buffer.from(JSON.stringify(event)+'\n');const current=regularSessionFile(join(this.directory,'events.jsonl'))!;const opened=fstatSync(this.fd);const version=fstatSync(this.fd,{bigint:true});if(version.size!==this.logSize||version.mtimeNs!==this.logModified||current.ino!==opened.ino||current.dev!==opened.dev||opened.nlink!==1)throw new Error('Session file changed before append');if(opened.size+bytes.length>HISTORY_LIMIT)throw new Error('Session history exceeds write budget; export and start a new session');let offset=0;
  try {while(offset<bytes.length)offset+=writeSync(this.fd,bytes,offset,bytes.length-offset);fsyncSync(this.fd);const metadata=fstatSync(this.fd,{bigint:true});this.logSize=metadata.size;this.logModified=metadata.mtimeNs;}
  catch(error){this.close();throw error;}
  this.events.push(event);this.state=state;
  try{this.project(event);}catch{this.close();throw new Error('Canonical event saved; projection failed. Reopen to rebuild.');}
  return event;
 }
 close(){if(this.closed)return;this.closed=true;this.db?.close();if(this.fd>=0)closeSync(this.fd);if(this.lock>=0){closeSync(this.lock);try{unlinkSync(join(this.directory,'writer.lock'));}catch{}}this.ownership?.close();}
}
