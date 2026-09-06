import {closeSync,readSync,writeSync,fstatSync,ftruncateSync,fsyncSync,constants} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';import {join} from 'node:path';import {AnchoredFiles} from './anchored-files';import {containedPath,digest,isWithin} from './source';
import type {Action,PreparedAction} from './policy';import type {ToolResult} from './runtime';
function bytes(fd:number){const before=fstatSync(fd);if(!before.isFile()||before.size>1024*1024)throw new Error('Mutation source byte limit');const buffer=Buffer.alloc(before.size+1);let used=0;while(used<buffer.length){const n=readSync(fd,buffer,used,buffer.length-used,used);if(!n)break;used+=n;}const after=fstatSync(fd);if(used!==before.size||before.mtimeMs!==after.mtimeMs||before.size!==after.size)throw new Error('Mutation source changed');return buffer.subarray(0,used);}
export async function mutateFile(root:string,action:Exclude<Action,{tool:'run_command'}>,prepared:PreparedAction,signal:AbortSignal,started:number):Promise<ToolResult>{
 if(!prepared.scope)throw new Error('Missing anchored mutation scope');const files=new AnchoredFiles(root,prepared.scope);let parent:ReturnType<AnchoredFiles['parent']>|undefined;let fd:number|undefined;
 const outcome=(state:ToolResult['state'],extra:Partial<ToolResult>={}):ToolResult=>({state,path:action.path,durationMs:Date.now()-started,...extra});
 try{
  signal.throwIfAborted();parent=files.parent(action.path,action.tool==='create_file');fd=files.open(parent,action.tool==='create_file'?constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY:action.tool==='delete_file'?constants.O_RDONLY:constants.O_RDWR,action.tool==='create_file'?0o644:0);
  if(action.tool!=='create_file'&&(!files.matches(fd)||digest(bytes(fd))!==action.beforeDigest))throw new Error('Mutation source changed after approval');
  signal.throwIfAborted();
  if(action.tool==='delete_file'){
   const recoveryPath='.mavona/recovery/'+Bun.randomUUIDv7();const recovery=files.parent(recoveryPath,true,true);
   try{files.move(parent,recovery);let recovered:number|undefined;let valid=false;try{recovered=files.open(recovery,constants.O_RDONLY);valid=files.matches(recovered)&&digest(bytes(recovered))===action.beforeDigest;}catch{}finally{if(recovered!==undefined)closeSync(recovered);}
    if(!valid){try{files.move(recovery,parent);return outcome('unknown',{reason:'Source changed during removal; current entry restored'});}catch{return outcome('unknown',{recoveryPath,reason:'Source changed during removal; recover retained entry without overwriting current path'});}}
    try{const canonical=await realpath(join(root,recoveryPath));if(!isWithin(await realpath(root),canonical))throw new Error('Recovery outside checkout');const saved=await stat(canonical);const original=fstatSync(fd);if(saved.dev!==original.dev||saved.ino!==original.ino)return outcome('unknown',{recoveryPath,reason:'Recovery path changed; reconcile'});}catch{return outcome('unknown',{recoveryPath,reason:'Recovery path moved; reconcile'});}
    return outcome('passed',{digest:'absent',recoveryPath});
   }finally{recovery.close();}
  }
  const content=Buffer.from(prepared.nextText!);let offset=0;while(offset<content.length)offset+=writeSync(fd,content,offset,content.length-offset,offset);ftruncateSync(fd,content.length);fsyncSync(fd);fsyncSync(parent.fd);
  const before=fstatSync(fd);let current:number|undefined;try{current=files.open(parent,constants.O_RDONLY);const actual=fstatSync(current);if(actual.ino!==before.ino||actual.dev!==before.dev)return outcome('unknown',{reason:'Path replaced during mutation; user replacement preserved'});}finally{if(current!==undefined)closeSync(current);}
  try{const canonical=await containedPath(root,action.path);const actual=await stat(canonical);if(actual.ino!==before.ino||actual.dev!==before.dev)return outcome('unknown',{reason:'Path moved during mutation; reconcile'});}catch{return outcome('unknown',{reason:'Path moved during mutation; reconcile'});}
  return outcome('passed',{digest:digest(content)});
 }finally{if(fd!==undefined)closeSync(fd);parent?.close();files.close();}
}
