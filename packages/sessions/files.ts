import {constants,openSync,closeSync,lstatSync,fstatSync,readSync} from 'node:fs';import {join} from 'node:path';
export const HISTORY_LIMIT=128*1024*1024;
export function sessionDirectory(directory:string){const entry=lstatSync(directory);if(entry.isSymbolicLink()||!entry.isDirectory())throw new Error('Session directory symlink or non-directory refused');}
export function regularSessionFile(path:string,missing=false){try{const entry=lstatSync(path);if(entry.isSymbolicLink()||!entry.isFile()||entry.nlink!==1)throw new Error('Session file symlink, hardlink or non-file refused');return entry;}catch(error){if(missing&&(error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}}
export function validateSessionFiles(directory:string){sessionDirectory(directory);for(const name of ['events.jsonl','writer.lock','writer.sqlite','projection.sqlite'])for(const suffix of (name.endsWith('.sqlite')?['','-journal','-wal','-shm']:['']))regularSessionFile(join(directory,name+suffix),true);}
export function readBoundedFile(path:string,limit:number,existingFd?:number):Buffer{
 if(!Number.isSafeInteger(limit)||limit<1)throw new Error('Invalid file read budget');regularSessionFile(path);
 const fd=existingFd??openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const before=fstatSync(fd);if(!before.isFile()||before.nlink!==1)throw new Error('Session file identity refused');if(before.size>limit)throw new Error('Session history exceeds read budget');
  const buffer=Buffer.alloc(before.size);let used=0;while(used<buffer.length){const size=readSync(fd,buffer,used,buffer.length-used,used);if(size===0)break;used+=size;}
  const after=fstatSync(fd),current=regularSessionFile(path)!;if(used!==before.size||before.size!==after.size||before.mtimeMs!==after.mtimeMs||current.ino!==before.ino||current.dev!==before.dev)throw new Error('Session file changed during read; retry');return buffer;
 }finally{if(existingFd===undefined)closeSync(fd);}
}
export function readSessionBytes(directory:string,fd?:number){sessionDirectory(directory);return readBoundedFile(join(directory,'events.jsonl'),HISTORY_LIMIT,fd);}
