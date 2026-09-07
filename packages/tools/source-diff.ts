import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import type {SourceSnapshot} from './source';
export interface SourceDiff {text:string;beforeDigest:string;afterDigest:string;additions:number;deletions:number}
export async function sourceDiff(before:SourceSnapshot,after:SourceSnapshot):Promise<SourceDiff>{
 if(before.path!==after.path||Buffer.byteLength(before.text)+Buffer.byteLength(after.text)>2*1024*1024)throw new Error('Source diff identity or size mismatch');
 const directory=await mkdtemp(join(tmpdir(),'mavona-source-diff-'));
 try{
  await writeFile(join(directory,'before'),before.text,{mode:0o600});await writeFile(join(directory,'after'),after.text,{mode:0o600});
  // Isolated no-index diff invokes no repository filters, hooks, external differ or shell.
  const child=Bun.spawn(['git','--no-pager','diff','--no-index','--no-ext-diff','--no-textconv','--no-color','--','before','after'],{cwd:directory,env:{PATH:process.env.PATH??'/usr/bin:/bin',GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1'},stdout:'pipe',stderr:'ignore'});
  const timer=setTimeout(()=>child.kill(9),3000);const reader=child.stdout.getReader();let size=0;const chunks:Uint8Array[]=[];
  try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4*1024*1024){child.kill(9);throw new Error('Diff output limit');}chunks.push(part.value);}const code=await child.exited;if(code!==0&&code!==1)throw new Error('Diff unavailable');}
  finally{clearTimeout(timer);await reader.cancel();}
  const lines=Buffer.concat(chunks).toString('utf8').split('\n');const additions=lines.filter(line=>line.startsWith('+')&&!line.startsWith('+++')).length;const deletions=lines.filter(line=>line.startsWith('-')&&!line.startsWith('---')).length;
  const text=lines.map(line=>line==='--- a/before'?`--- ${before.revision==='worktree'?'snapshot':before.revision}/${JSON.stringify(before.path)} (${before.digest})`:line==='+++ b/after'?`+++ worktree/${JSON.stringify(after.path)} (${after.digest})`:line.startsWith('diff --git ')?`diff ${JSON.stringify(before.path)}`:line).join('\n');
  return {text,beforeDigest:before.digest,afterDigest:after.digest,additions,deletions};
 }finally{await rm(directory,{recursive:true,force:true});}
}
