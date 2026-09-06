import { mkdir, writeFile, rename, rm, realpath } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { digest, readSource } from '../tools/source';
import { PARSER_VERSION, parseRubyFiles, probeAvailability, validateRubyFileFacts, type ProbeOptions, type RubyStructure, type RubyFileFacts } from './probe';
export interface StructuralObservation {path:string;digest:string;capturedAt:string;provenance:'fresh'|'cache';querySchemaVersion:1}
export interface CachedRubyStructure extends RubyStructure {observations:StructuralObservation[]}
/** cacheDirectory is host-managed storage, never target-controlled configuration. */
export async function parseRubyFilesCached(root:string,paths:string[],cacheDirectory:string,options:ProbeOptions={}):Promise<CachedRubyStructure>{
 if(!paths.length||paths.length>64||new Set(paths).size!==paths.length||paths.some(path=>!path.endsWith('.rb')))throw new Error('Choose 1–64 distinct Ruby source files');
 const available=await probeAvailability(options);
 if(available.status==='unknown')return {schemaVersion:1,status:'unknown',parserVersion:PARSER_VERSION,files:[],reason:available.reason,observations:[]};
 const repository=await realpath(root);await mkdir(cacheDirectory,{recursive:true,mode:0o700});const cache=await realpath(cacheDirectory);
 const files:RubyFileFacts[]=[];const observations:StructuralObservation[]=[];
 for(const path of paths){
  const source=await readSource(repository,path);const key=digest(JSON.stringify([1,repository,source.path,source.digest,PARSER_VERSION]));let reused=false;
  try{
   const entry:unknown=JSON.parse((await readSource(cache,`${key}.json`,2*1024*1024)).text);
   if(typeof entry==='object'&&entry!==null&&'schemaVersion'in entry&&entry.schemaVersion===1&&'parserVersion'in entry&&entry.parserVersion===PARSER_VERSION&&'capturedAt'in entry&&typeof entry.capturedAt==='string'&&Number.isFinite(Date.parse(entry.capturedAt))&&'file'in entry&&validateRubyFileFacts(entry.file,source.path,source.digest,source.lineCount)){
    files.push(entry.file);observations.push({path:source.path,digest:source.digest,capturedAt:entry.capturedAt,provenance:'cache',querySchemaVersion:1});reused=true;
   }
  }catch{/* Rebuild corrupt, expired-format, or missing entries from the parser. */}
  if(reused)continue;
  const parsed=await parseRubyFiles(repository,[path],options);
  if(parsed.status==='unknown')return {...parsed,files,observations};
  const file=parsed.files[0]!;
  if(file.digest!==source.digest)return {schemaVersion:1,status:'unknown',parserVersion:PARSER_VERSION,reason:'source_changed',files,observations};
  const capturedAt=new Date().toISOString();files.push(file);observations.push({path:file.path,digest:file.digest,capturedAt,provenance:'fresh',querySchemaVersion:1});
  const temporary=join(cache,`${key}.${randomUUID()}.tmp`);
  try{await writeFile(temporary,JSON.stringify({schemaVersion:1,parserVersion:PARSER_VERSION,capturedAt,file}),{flag:'wx',mode:0o600});await rename(temporary,join(cache,`${key}.json`));}finally{await rm(temporary,{force:true});}
 }
 return {schemaVersion:1,status:files.every(file=>file.status==='passed')?'passed':'failed',parserVersion:PARSER_VERSION,files,observations};
}
