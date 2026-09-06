import { dirname, relative, join } from 'node:path';
import { realpath } from 'node:fs/promises';
import { containedPath, readSource, type SourceSnapshot } from '../tools/source';
export interface RepositoryInstruction extends SourceSnapshot {trust:'repository';scope:string}
/** Repository text remains lower-trust input, never execution permission or host policy. */
export async function scopedInstructions(root:string,targets:string[],maxBytes=65536):Promise<RepositoryInstruction[]>{
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>1024*1024||targets.length>64)throw new Error('Invalid instruction bounds');
 const base=await realpath(root);const scopes=new Set<string>(['.']);
 for(const target of targets){let scope=dirname(relative(base,await containedPath(base,target)));while(scope!=='.'){scopes.add(scope);scope=dirname(scope);}}
 const result:RepositoryInstruction[]=[];let remaining=maxBytes;
 for(const scope of [...scopes].sort((a,b)=>a.split('/').length-b.split('/').length||a.localeCompare(b))){
  try{const source=await readSource(base,join(scope,'AGENTS.md'),remaining);remaining-=Buffer.byteLength(source.text);result.push({...source,trust:'repository',scope});if(remaining<1)throw new Error('Instruction byte limit reached');}
  catch(error){if(!(error instanceof Error&&'code'in error&&error.code==='ENOENT'))throw error;}
 }
 return result;
}
