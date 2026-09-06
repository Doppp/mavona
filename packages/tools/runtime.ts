import {Database} from 'bun:sqlite';
import {spawn} from 'node:child_process';
import {mkdir,lstat,realpath,open,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {constants} from 'node:fs';
import {ExecutionPolicy,prepareAction,type Action} from './policy';
import {containedPath,digest} from './source';
export interface ToolResult {state:'passed'|'failed'|'unknown';stdout?:string;stderr?:string;exitCode?:number|null;signal?:string|null;reason?:string;path?:string;digest?:string;durationMs:number}
export class WorktreeLease {
 private constructor(private database:Database){}
 static async acquire(repository:string,owner:string):Promise<WorktreeLease>{
  const root=await realpath(repository);let parent=root;
  for(const segment of ['.mavona','locks']){parent=join(parent,segment);await mkdir(parent,{recursive:true,mode:0o700});if((await lstat(parent)).isSymbolicLink())throw new Error('Worktree lock symlink refused');}
  const path=join(parent,'mutable.sqlite');try{if((await lstat(path)).isSymbolicLink())throw new Error('Worktree lock symlink refused');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const db=new Database(path,{create:true});
  try{db.exec('PRAGMA busy_timeout=0; CREATE TABLE IF NOT EXISTS owner (id TEXT NOT NULL); BEGIN IMMEDIATE;');db.query('INSERT INTO owner VALUES (?)').run(owner);return new WorktreeLease(db);}catch{db.close();throw new Error('Worktree already owned by another mutable task');}
 }
 close(){try{this.database.exec('ROLLBACK');}finally{this.database.close();}}
}
export class ToolRuntime {
 constructor(readonly root:string,readonly policy:ExecutionPolicy,private secrets:readonly string[]=[]){ }
 private sanitize(text:string){for(const secret of this.secrets)if(secret)text=text.split(secret).join('[REDACTED]');return text.replace(/Bearer\s+\S+/gi,'Bearer [REDACTED]');}
 async execute(action:Action,signal:AbortSignal):Promise<ToolResult>{
  signal.throwIfAborted();const prepared=await prepareAction(this.root,action);this.policy.consume(prepared);
  const started=Date.now();
  if(action.tool==='apply_patch'){
   const target=await containedPath(this.root,action.path);const handle=await open(target,constants.O_RDWR|constants.O_NOFOLLOW);
   try{
    const before=await handle.stat();const current=await stat(await containedPath(this.root,action.path));
    if(before.ino!==current.ino||before.dev!==current.dev)throw new Error('Patch path changed');
    const original=await handle.readFile();if(digest(original)!==action.beforeDigest)throw new Error('Patch source changed after approval');
    signal.throwIfAborted();const bytes=Buffer.from(prepared.nextText!);let offset=0;
    // Retain inode and permissions, so an external path replacement is never overwritten.
    while(offset<bytes.length){const result=await handle.write(bytes,offset,bytes.length-offset,offset);offset+=result.bytesWritten;}
    await handle.truncate(bytes.length);await handle.sync();
    const after=await stat(await containedPath(this.root,action.path));if(after.ino!==before.ino||after.dev!==before.dev)return {state:'unknown',reason:'Path replaced during write; reconcile',durationMs:Date.now()-started};
    return {state:'passed',path:action.path,digest:digest(bytes),durationMs:Date.now()-started};
   }finally{await handle.close();}
  }
  return await new Promise<ToolResult>((resolve,reject)=>{
   const child=spawn(prepared.executable!,action.argv.slice(1),{cwd:prepared.cwd!,detached:process.platform!=='win32',env:{PATH:process.env.PATH??'/usr/bin:/bin',LANG:'C.UTF-8',RAILS_ENV:'test',RACK_ENV:'test',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
   let stdout='',stderr='',bytes=0,reason:string|undefined,escalation:ReturnType<typeof setTimeout>|undefined;
   const stop=(why:string)=>{if(reason)return;reason=why;try{process.kill(process.platform==='win32'?child.pid!:-child.pid!,'SIGTERM');}catch{}escalation=setTimeout(()=>{try{process.kill(process.platform==='win32'?child.pid!:-child.pid!,'SIGKILL');}catch{}},250);};
   const capture=(kind:'stdout'|'stderr',chunk:Buffer)=>{const available=Math.max(0,256*1024-bytes);bytes+=chunk.length;const text=chunk.subarray(0,available).toString('utf8');if(kind==='stdout')stdout+=text;else stderr+=text;if(bytes>256*1024)stop('output limit');};
   child.stdout.on('data',(chunk:Buffer)=>capture('stdout',chunk));child.stderr.on('data',(chunk:Buffer)=>capture('stderr',chunk));
   const cancel=()=>stop('cancelled');signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
   const timer=setTimeout(()=>stop('timeout'),action.timeoutMs);
   const cleanup=()=>{clearTimeout(timer);if(escalation)clearTimeout(escalation);signal.removeEventListener('abort',cancel);};
   child.on('error',()=>{cleanup();reject(new Error('Command could not start'));});
   child.on('close',(code,exitSignal)=>{cleanup();resolve({state:reason?'unknown':code===0?'passed':'failed',stdout:this.sanitize(stdout),stderr:this.sanitize(stderr),exitCode:code,signal:exitSignal,durationMs:Date.now()-started,...(reason?{reason}:{})});});
  });
 }
}
