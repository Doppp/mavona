import { mkdtemp, writeFile, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import probeSource from '../../probes/rails_probe.rb' with { type: 'text' };
import { readSource } from '../tools/source';
export const PARSER_VERSION='1.8.1';
export interface ProbeOptions { ruby?:string[]; timeoutMs?:number; maxOutputBytes?:number; signal?:AbortSignal }
export type ProbeAvailability={schemaVersion:1;status:'passed';rubyVersion:string;parserVersion:string}|{schemaVersion:1;status:'unknown';reason:string};
export interface RubyDeclaration {kind:'class'|'module'|'method'|'constant'|'association'|'validation'|'callback'|'route';name:string|null;line:number;scope:string;superclass?:string|null;macro?:string}
export interface RubyFileFacts {path:string;digest:string;status:'passed'|'failed';declarations:RubyDeclaration[];errorLines:number[]}
export interface RubyStructure {schemaVersion:1;status:'passed'|'failed'|'unknown';parserVersion:string;files:RubyFileFacts[];reason?:string}
const unknown=(reason:string):ProbeAvailability=>({schemaVersion:1,status:'unknown',reason});
function record(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value);}
const clean=(value:unknown):value is string=>typeof value==='string'&&value.length<=1024&&!/[\x00-\x1f\x7f]/.test(value);
const keys=(value:Record<string,unknown>,allowed:string[])=>Object.keys(value).every(key=>allowed.includes(key));
async function invoke(request:unknown,options:ProbeOptions):Promise<unknown>{
 const ruby=options.ruby??['ruby'];const timeout=options.timeoutMs??3000;const max=options.maxOutputBytes??1024*1024;
 if(!ruby.length||ruby.some(arg=>!arg||arg.includes('\0'))||!Number.isSafeInteger(timeout)||timeout<1||timeout>30000||!Number.isSafeInteger(max)||max<1||max>4*1024*1024)throw new Error('Invalid probe configuration');
 const input=JSON.stringify(request);if(Buffer.byteLength(input)>2*1024*1024)throw new Error('Probe input byte limit exceeded');
 const dir=await mkdtemp(join(tmpdir(),'mavona-probe-'));await chmod(dir,0o700);
 try{
  const script=join(dir,'rails_probe.rb');await writeFile(script,probeSource,{mode:0o600});
  if(options.signal?.aborted)return unknown('cancelled');
  // No target cwd, RUBYOPT/RUBYLIB, Bundler variables, credentials, or user home.
  const child=Bun.spawn([...ruby,'--disable-gems',script],{cwd:dir,env:{PATH:process.env.PATH??'/usr/bin:/bin',HOME:dir,LANG:'C.UTF-8'},stdin:new Blob([input]),stdout:'pipe',stderr:'pipe'});
  let reason:string|undefined;const stop=(why:string)=>{reason??=why;child.kill(9);};
  const timer=setTimeout(()=>stop('timeout'),timeout);const abort=()=>stop('cancelled');options.signal?.addEventListener('abort',abort,{once:true});
  const collect=async(stream:ReadableStream<Uint8Array>,retain:boolean)=>{const reader=stream.getReader();const chunks:Uint8Array[]=[];let size=0;try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){stop('output_limit');break;}if(retain)chunks.push(part.value);}}finally{await reader.cancel();}return Buffer.concat(chunks).toString('utf8');};
  try{const [out,,exit]=await Promise.all([collect(child.stdout,true),collect(child.stderr,false),child.exited]);if(reason)return unknown(reason);if(exit!==0)return unknown('probe_unavailable');try{return JSON.parse(out) as unknown;}catch{return unknown('invalid_response');}}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
 }catch{return unknown('probe_unavailable');}finally{await rm(dir,{recursive:true,force:true});}
}
export async function probeAvailability(options:ProbeOptions={}):Promise<ProbeAvailability>{
 const result=await invoke({schemaVersion:1,operation:'availability'},options);
 if(record(result)&&result.schemaVersion===1){
  if(result.status==='unknown'&&keys(result,['schemaVersion','status','reason'])&&typeof result.reason==='string'&&['parser_unavailable','parser_version_mismatch','probe_failed','cancelled','timeout','output_limit','probe_unavailable','invalid_response'].includes(result.reason))return unknown(result.reason);
  if(result.status==='passed'&&keys(result,['schemaVersion','status','rubyVersion','parserVersion'])&&typeof result.rubyVersion==='string'&&/^\d+\.\d+\.\d+$/.test(result.rubyVersion)&&result.parserVersion===PARSER_VERSION)return {schemaVersion:1,status:'passed',rubyVersion:result.rubyVersion,parserVersion:PARSER_VERSION};
 }return unknown('invalid_response');
}
function validDeclaration(value:unknown):value is RubyDeclaration{
 if(!record(value)||!keys(value,['kind','name','line','scope','superclass','macro']))return false;
 return ['class','module','method','constant','association','validation','callback','route'].includes(String(value.kind))&&(value.name===null||clean(value.name))&&Number.isSafeInteger(value.line)&&Number(value.line)>0&&clean(value.scope)&&(!('superclass'in value)||value.superclass===null||clean(value.superclass))&&(!('macro'in value)||clean(value.macro));
}
export function validateRubyFileFacts(value:unknown,path:string,digest:string,lineCount:number):value is RubyFileFacts{
 if(!record(value)||!keys(value,['path','digest','status','declarations','errorLines'])||value.path!==path||value.digest!==digest||!['passed','failed'].includes(String(value.status))||!Array.isArray(value.declarations)||value.declarations.length>10000||!value.declarations.every(validDeclaration)||!Array.isArray(value.errorLines)||value.errorLines.length>100||!value.errorLines.every(line=>Number.isSafeInteger(line)&&line>0&&line<=lineCount)||value.declarations.some(d=>d.line>lineCount))return false;
 return !(value.status==='failed'&&value.declarations.length||value.status==='passed'&&value.errorLines.length);
}
export async function parseRubyFiles(root:string,paths:string[],options:ProbeOptions={}):Promise<RubyStructure>{
 if(!paths.length||paths.length>64||new Set(paths).size!==paths.length||paths.some(path=>!path.endsWith('.rb')))throw new Error('Choose 1–64 distinct Ruby source files');
 const sources=await Promise.all(paths.map(path=>readSource(root,path)));
 const unavailable=(reason:string):RubyStructure=>({schemaVersion:1,status:'unknown',parserVersion:PARSER_VERSION,files:[],reason});
 const availability=await probeAvailability(options);if(availability.status==='unknown')return unavailable(availability.reason);
 const result=await invoke({schemaVersion:1,operation:'parse',files:sources.map(source=>({path:source.path,digest:source.digest,source:source.text}))},options);
 if(!record(result)||!keys(result,['schemaVersion','status','parserVersion','files'])||result.schemaVersion!==1||!['passed','failed'].includes(String(result.status))||result.parserVersion!==PARSER_VERSION||!Array.isArray(result.files)||result.files.length!==sources.length)return unavailable('invalid_response');
 const files:RubyFileFacts[]=[];
 for(let i=0;i<sources.length;i++){
  const value:unknown=result.files[i];const source=sources[i]!;
  if(!validateRubyFileFacts(value,source.path,source.digest,source.lineCount))return unavailable('invalid_response');
  files.push(value as unknown as RubyFileFacts);
 }
 const status=files.every(file=>file.status==='passed')?'passed':'failed';if(result.status!==status)return unavailable('invalid_response');
 return {schemaVersion:1,status,parserVersion:PARSER_VERSION,files};
}
