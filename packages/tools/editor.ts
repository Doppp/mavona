import {spawn} from 'node:child_process';
import {containedPath} from './source';
import {captureRepositoryState,changesSince,type RepositoryState} from './repository-state';
import {ExecutionPolicy,prepareAction,type PreparedAction} from './policy';
import {WorktreeLease} from './runtime';
export interface EditorResult {exitCode:number|null;cancelled:boolean;before:RepositoryState;after:RepositoryState;changed:ReturnType<typeof changesSince>}
export interface EditorAdapter {argv:string[];terminal:boolean}
export async function editorHandoff(options:{root:string;path:string;line:number;adapter:EditorAdapter;policy:ExecutionPolicy;signal:AbortSignal;approve:(action:PreparedAction)=>Promise<boolean>;suspend:()=>void|Promise<void>;resume:()=>void|Promise<void>;effect?:{effectId:string;sessionId:string};afterReturn?:(result:EditorResult)=>void;beforeLaunch?:()=>void;confirmReturn?:()=>Promise<void>}){
 const {root,adapter,policy,signal}=options;signal.throwIfAborted();if(!adapter.terminal&&!options.confirmReturn)throw new Error('GUI editor requires saved-file return confirmation');if(!Number.isSafeInteger(options.line)||options.line<1||!adapter.argv.length||adapter.argv.length>64)throw new Error('Invalid editor configuration');
 const path=await containedPath(root,options.path);const argv=adapter.argv.map(arg=>arg.replaceAll('{path}',path).replaceAll('{line}',String(options.line)));
 const action={tool:'run_command' as const,argv,cwd:'.',timeoutMs:300000};const prepared=await prepareAction(root,action);
 if(!policy.allows(prepared)){if(!await options.approve(prepared))throw new Error('Editor approval denied');policy.approveOnce(prepared);}
 signal.throwIfAborted();const effect=options.effect??{effectId:Bun.randomUUIDv7(),sessionId:'editor-'+Bun.randomUUIDv7()};const lease=await WorktreeLease.acquire(root,effect.sessionId);let suspended=false;
 try{
  policy.consume(await prepareAction(root,action));const before=await captureRepositoryState(root);policy.revoke();
  options.beforeLaunch?.();lease.beginEffect(effect.effectId,'command');
  if(adapter.terminal){suspended=true;await options.suspend();}
  const exit=await new Promise<{exitCode:number|null;cancelled:boolean}>((resolve,reject)=>{
   const child=spawn(prepared.executable!,argv.slice(1),{cwd:root,stdio:adapter.terminal?'inherit':'ignore',env:Object.fromEntries(['PATH','HOME','USER','LOGNAME','TERM','COLORTERM','LANG','DISPLAY','WAYLAND_DISPLAY','XDG_RUNTIME_DIR'].flatMap(key=>process.env[key]===undefined?[]:[[key,process.env[key]!]]))});
   let cancelled=false;let escalation:ReturnType<typeof setTimeout>|undefined;const abort=()=>{cancelled=true;child.kill('SIGTERM');escalation=setTimeout(()=>child.kill('SIGKILL'),250);};signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();const timer=setTimeout(abort,action.timeoutMs);
   const cleanup=()=>{clearTimeout(timer);if(escalation)clearTimeout(escalation);signal.removeEventListener('abort',abort);};child.once('error',()=>{cleanup();reject(new Error('Editor could not start'));});child.once('close',exitCode=>{cleanup();resolve({exitCode,cancelled});});
  });
  if(!adapter.terminal){if(!options.confirmReturn)throw new Error('GUI editor requires explicit saved-file return confirmation');await options.confirmReturn();}
  const after=await captureRepositoryState(root);const result={...exit,before,after,changed:changesSince(before,after)};options.afterReturn?.(result);lease.completeEffect(effect.effectId,exit.cancelled?'unknown':exit.exitCode===0?'passed':'failed');return result;
 }finally{try{if(suspended)await options.resume();}finally{policy.revoke();lease.close();}}
}
