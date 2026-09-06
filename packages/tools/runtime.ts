import {mutateFile} from './file-mutations';
export {WorktreeLease} from './worktree';
import {spawn} from 'node:child_process';
import {ExecutionPolicy,prepareAction,type Action} from './policy';
export interface ToolResult {state:'passed'|'failed'|'unknown';stdout?:string;stderr?:string;exitCode?:number|null;signal?:string|null;reason?:string;path?:string;digest?:string;recoveryPath?:string;durationMs:number}
export class ToolRuntime {
 constructor(readonly root:string,readonly policy:ExecutionPolicy,private secrets:readonly string[]=[]){ }
 private sanitize(text:string){for(const secret of this.secrets)if(secret)text=text.split(secret).join('[REDACTED]');return text.replace(/Bearer\s+\S+/gi,'Bearer [REDACTED]');}
 async execute(action:Action,signal:AbortSignal):Promise<ToolResult>{
  signal.throwIfAborted();const prepared=await prepareAction(this.root,action);this.policy.consume(prepared);
  const started=Date.now();
  if(action.tool!=='run_command')return mutateFile(this.root,action,prepared,signal,started);
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
