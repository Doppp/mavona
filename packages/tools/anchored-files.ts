import source from './openat.c' with {type:'text'};
import {dlopen,cc,FFIType} from 'bun:ffi';
import {openSync,closeSync,fstatSync,fsyncSync,constants,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import type {MutationScope} from './mutation-path';
const same=(actual:{dev:bigint;ino:bigint},expected:{dev:string;ino:string})=>String(actual.dev)===expected.dev&&String(actual.ino)===expected.ino;
function loadNative(){
 if(process.platform!=='darwin'&&process.platform!=='linux')throw new Error('Anchored mutations unavailable on this platform');
 const library=process.platform==='darwin'?'/usr/lib/libSystem.B.dylib':'libc.so.6';
 const directory=mkdtempSync(join(tmpdir(),'mavona-openat-'));
 const bridge=(()=>{try{const path=join(directory,'bridge.c');writeFileSync(path,source,{mode:0o600,flag:'wx'});return cc({source:path,symbols:{mavona_openat:{args:[FFIType.i32,FFIType.cstring,FFIType.i32,FFIType.u32],returns:FFIType.i32}}});}finally{rmSync(directory,{recursive:true,force:true});}})();
 const file=dlopen(library,{mkdirat:{args:[FFIType.i32,FFIType.cstring,FFIType.u32],returns:FFIType.i32}});
 const move=process.platform==='darwin'?(()=>{const lib=dlopen(library,{renameatx_np:{args:[FFIType.i32,FFIType.cstring,FFIType.i32,FFIType.cstring,FFIType.u32],returns:FFIType.i32}});return (from:number,name:string,to:number,target:string)=>lib.symbols.renameatx_np(from,name,to,target,4);})():(()=>{const lib=dlopen(library,{renameat2:{args:[FFIType.i32,FFIType.cstring,FFIType.i32,FFIType.cstring,FFIType.u32],returns:FFIType.i32}});return (from:number,name:string,to:number,target:string)=>lib.symbols.renameat2(from,name,to,target,1);})();
 return {library:file,bridge,...file.symbols,openat:(fd:number,path:string,flags:number,mode:number)=>bridge.symbols.mavona_openat(fd,Buffer.from(path+'\0'),flags,mode),move,closeOnExec:process.platform==='darwin'?0x1000000:0x80000};
}
let native:ReturnType<typeof loadNative>|undefined;
/** Narrow directory-descriptor boundary for approved repository file mutations. */
export class AnchoredFiles {
 private rootFd:number;private native:ReturnType<typeof loadNative>;
 constructor(root:string,private scope:MutationScope){this.native=native??=loadNative();this.rootFd=openSync(root,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW);if(!same(fstatSync(this.rootFd,{bigint:true}),scope.rootIdentity)){closeSync(this.rootFd);throw new Error('Checkout changed after approval');}}
 parent(path:string,create=false,internal=false){
  const parts=path.split('/');if(parts.some(part=>!part||part==='.'||part==='..'||part.includes('\0')))throw new Error('Invalid anchored path');const leaf=parts.pop()!;let fd=this.rootFd,prefix='';
  try{for(const part of parts){prefix=prefix?prefix+'/'+part:part;const expected=this.scope.parents.find(parent=>parent.path===prefix);let next=-1;
   if(expected||internal)next=this.native.openat(fd,part,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW|this.native.closeOnExec,0);
   if(next<0&&create&&(!expected||internal)){if(this.native.mkdirat(fd,part,internal?0o700:0o755)!==0)throw new Error('Directory changed or appeared after approval');fsyncSync(fd);next=this.native.openat(fd,part,constants.O_RDONLY|constants.O_DIRECTORY|constants.O_NOFOLLOW|this.native.closeOnExec,0);}
   if(next<0)throw new Error('Mutation directory unavailable or symlink refused');if(expected&&!same(fstatSync(next,{bigint:true}),expected)){closeSync(next);throw new Error('Mutation directory changed after approval');}if(fd!==this.rootFd)closeSync(fd);fd=next;
  }return {fd,leaf,close:()=>{if(fd!==this.rootFd)closeSync(fd);}};}catch(error){if(fd!==this.rootFd)closeSync(fd);throw error;}
 }
 open(parent:{fd:number;leaf:string},flags:number,mode=0){const fd=this.native.openat(parent.fd,parent.leaf,flags|constants.O_NOFOLLOW|this.native.closeOnExec,mode);if(fd<0)throw new Error('File changed, exists or symlink refused');return fd;}
 move(from:{fd:number;leaf:string},to:{fd:number;leaf:string}){if(this.native.move(from.fd,from.leaf,to.fd,to.leaf)!==0)throw new Error('Atomic move refused; destination exists or source changed');fsyncSync(from.fd);fsyncSync(to.fd);}
 matches(fd:number){const metadata=fstatSync(fd,{bigint:true});return metadata.isFile()&&metadata.nlink===1n&&!!this.scope.fileIdentity&&same(metadata,this.scope.fileIdentity);}
 close(){closeSync(this.rootFd);}
}
