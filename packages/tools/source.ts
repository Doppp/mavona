import { open, realpath, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
export const digest = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
export function isWithin(root:string, candidate:string):boolean {
 const rel=relative(root,candidate); return rel==='' || (!isAbsolute(rel) && rel!=='..' && !rel.startsWith('../'));
}
export function excluded(path:string):boolean {
 return path.split(/[\\/]/).some(s => ['.git','node_modules','vendor','tmp','log','.mavona'].includes(s) || /^\.env(?:\.|$)/.test(s) || /^(?:master\.key|credentials.*\.yml(?:\.enc)?|.*\.(?:pem|key|p12))$/i.test(s));
}
export async function containedPath(root:string,path:string):Promise<string> {
 const base=await realpath(root); const candidate=resolve(base,path);
 if (!isWithin(base,candidate)) throw new Error('Path outside repository');
 if (excluded(relative(base,candidate))) throw new Error('Path excluded by repository read policy');
 const canonical=await realpath(candidate);
 if (!isWithin(base,canonical)) throw new Error('Symlink points outside repository');
 if (excluded(relative(base,canonical))) throw new Error('Resolved path excluded by repository read policy');
 return canonical;
}
export interface SourceSnapshot { path:string; text:string; digest:string; revision:'worktree'; lineCount:number }
export interface SourceSelection { path:string; start:number; end:number; text:string; digest:string; revision:'worktree' }
export async function readSource(root:string,path:string,maxBytes=1024*1024):Promise<SourceSnapshot> {
 if (!Number.isSafeInteger(maxBytes)||maxBytes<1) throw new Error('Invalid source limit');
 const canonical=await containedPath(root,path);
 const file=await open(canonical,constants.O_RDONLY|constants.O_NOFOLLOW);
 try {
  const before=await file.stat();
  if (!before.isFile()) throw new Error('Source is not a regular file');
  if(before.nlink!==1)throw new Error('Source hardlink refused');
  if (before.size>maxBytes) throw new Error('Source exceeds byte limit');
  const buffer=Buffer.alloc(maxBytes+1); let used=0;
  while (used<buffer.length) { const {bytesRead}=await file.read(buffer,used,buffer.length-used,null); if (!bytesRead) break; used+=bytesRead; }
  if (used>maxBytes) throw new Error('Source exceeds byte limit');
  const after=await file.stat(); const current=await stat(await containedPath(root,path));
  if (after.nlink!==1||current.nlink!==1||before.ino!==current.ino || before.dev!==current.dev || before.mtimeMs!==after.mtimeMs || before.size!==after.size) throw new Error('Source changed while reading; retry');
  const bytes=buffer.subarray(0,used); if (bytes.includes(0)) throw new Error('Source is binary');
  let text:string; try { text=new TextDecoder('utf-8',{fatal:true}).decode(bytes); } catch { throw new Error('Source is binary or invalid UTF-8'); }
  return {path:relative(await realpath(root),canonical),text,digest:digest(bytes),revision:'worktree',lineCount:text.split('\n').length};
 } finally { await file.close(); }
}
export function selectLines(source:SourceSnapshot,start:number,end:number):SourceSelection {
 if (!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>source.lineCount) throw new Error('Invalid line range');
 return {path:source.path,start,end,text:source.text.split('\n').slice(start-1,end).join('\n'),digest:source.digest,revision:'worktree'};
}
export async function selectionIsCurrent(root:string,selection:SourceSelection):Promise<boolean> {
 try { return (await readSource(root,selection.path)).digest===selection.digest; } catch { return false; }
}
