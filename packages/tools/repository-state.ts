import {realpath,open,lstat,readlink} from 'node:fs/promises';
import {constants} from 'node:fs';import {join,resolve,relative} from 'node:path';import {createHash} from 'node:crypto';
import {containedPath,digest,excluded,isWithin} from './source';
export interface RepositoryState {version:1;root:string;status:'passed'|'unknown';head:string|null;indexDigest:string;digest:string;files:Record<string,{digest:string;mode:number;state:'present'|'absent'|'unknown'}>;preexistingPaths:string[]}
async function gitRead(root:string,args:string[]):Promise<string>{
 const child=Bun.spawn(['git','--no-pager','--no-optional-locks','-c','core.fsmonitor=false','-c','core.untrackedCache=false','-C',root,...args],{env:{PATH:process.env.PATH??'/usr/bin:/bin',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'},stdout:'pipe',stderr:'ignore'});
 let failure=false;const timer=setTimeout(()=>{failure=true;child.kill(9);},5000);const reader=child.stdout.getReader();let size=0;const chunks:Uint8Array[]=[];
 try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4*1024*1024){failure=true;child.kill(9);break;}chunks.push(part.value);}if(await child.exited!==0||failure)throw new Error('Git metadata unavailable or bounded');return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));}
 finally{clearTimeout(timer);await reader.cancel();}
}
export async function captureRepositoryState(repository:string):Promise<RepositoryState>{
 const root=await realpath(repository);let head:string|null=null,status:'passed'|'unknown'='passed';
 try{head=(await gitRead(root,['rev-parse','--verify','HEAD'])).trim();}catch{}
 const index=await gitRead(root,['ls-files','--stage','-z']);const untracked=await gitRead(root,['ls-files','--others','--exclude-standard','-z']);
 const entries=new Map<string,{oid:string;mode:number}>();let algorithm:'sha1'|'sha256'='sha1';
 for(const entry of index.split('\0').filter(Boolean)){const match=/^([0-7]+) ([a-f0-9]+) ([0-3])\t([\s\S]+)$/.exec(entry);if(!match)throw new Error('Malformed Git index metadata');if(match[3]!=='0')status='unknown';const path=match[4]!;if(excluded(path))continue;entries.set(path,{oid:match[2]!,mode:parseInt(match[1]!,8)});if(match[2]!.length===64)algorithm='sha256';}
 const paths=[...new Set([...entries.keys(),...untracked.split('\0').filter(path=>path&&!excluded(path))])].sort();if(paths.length>20000)throw new Error('Repository fingerprint path budget');
 const files:RepositoryState['files']={};const preexistingPaths:string[]=[];let bytes=0;
 for(const path of paths){
  const lexical=resolve(root,path);if(!isWithin(root,lexical)||relative(root,lexical)!==path)throw new Error('Invalid repository inventory path');
  try{
   const metadata=await lstat(lexical);let content:Buffer;let mode:number;
   if(metadata.isSymbolicLink()){await containedPath(root,join(path,'..'));content=Buffer.from(await readlink(lexical));mode=0o120000;}
   else {if(!metadata.isFile()||metadata.size>8*1024*1024||bytes+metadata.size>64*1024*1024)throw new Error('Repository fingerprint byte budget');const canonical=await containedPath(root,path);const file=await open(canonical,constants.O_RDONLY|constants.O_NOFOLLOW);
    try{const before=await file.stat();if(before.size>8*1024*1024)throw new Error('Repository fingerprint byte budget');const buffer=Buffer.alloc(before.size+1);let used=0;while(used<buffer.length){const part=await file.read(buffer,used,buffer.length-used,null);if(!part.bytesRead)break;used+=part.bytesRead;}content=buffer.subarray(0,used);const after=await file.stat();const current=await lstat(lexical);if(content.length>8*1024*1024||before.ino!==current.ino||before.dev!==current.dev||before.size!==after.size||before.mtimeMs!==after.mtimeMs)throw new Error('Source changed during fingerprint');mode=metadata.mode&0o111?0o100755:0o100644;}finally{await file.close();}
   }
   bytes+=content.length;const hash=createHash(algorithm).update(`blob ${content.length}\0`).update(content).digest('hex');files[path]={digest:digest(content),mode,state:'present'};const baseline=entries.get(path);if(!baseline||baseline.oid!==hash||baseline.mode!==mode)preexistingPaths.push(path);
  }catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT'){files[path]={digest:'absent',mode:0,state:'absent'};if(entries.has(path))preexistingPaths.push(path);}else{status='unknown';files[path]={digest:'unknown',mode:0,state:'unknown'};}}
 }
 const indexDigest=digest(index);const state={version:1 as const,root,status,head,indexDigest,files,preexistingPaths};return {...state,digest:digest(JSON.stringify({root,head,indexDigest,files}))};
}
export function changesSince(before:RepositoryState,after:RepositoryState){if(before.root!==after.root)throw new Error('Repository identity changed');const paths=[...new Set([...Object.keys(before.files),...Object.keys(after.files)])].sort().filter(path=>JSON.stringify(before.files[path])!==JSON.stringify(after.files[path]));return {status:before.status==='passed'&&after.status==='passed'?'passed' as const:'unknown' as const,paths,preexistingPaths:[...before.preexistingPaths],gitChanged:before.head!==after.head||before.indexDigest!==after.indexDigest};}
