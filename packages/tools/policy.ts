import {readFile,realpath,stat} from 'node:fs/promises';
import {realpathSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {containedPath,digest,readSource,isWithin} from './source';
export type Action=
 |{tool:'apply_patch';path:string;beforeDigest:string;oldText:string;newText:string}
 |{tool:'run_command';argv:string[];cwd:string;timeoutMs:number};
export interface PreparedAction {action:Action;root:string;identity:string;settingsDigest:string;executable?:string;cwd?:string;nextText?:string;target?:string}
export async function settingsDigest(root:string):Promise<string>{
 const entries:Record<string,string>={};
 const visit=async(path:string,depth:number)=>{
  if(depth>8)throw new Error('Configuration include limit');
  let text:string;try{text=(await readSource(root,path,256*1024)).text;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return;throw error;}
  if(entries[path]!==undefined)return;entries[path]=digest(text);
  const parsed=Bun.YAML.parse(text) as unknown;
  if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
   const include=(parsed as Record<string,unknown>).include;
   if(include!==undefined){if(!Array.isArray(include)||!include.every(p=>typeof p==='string'))throw new Error('Configuration includes must be paths');for(const p of include)await visit(p,depth+1);}
  }
 };
 await visit('.mavona.yml',0);return digest(JSON.stringify(Object.entries(entries).sort()));
}
export async function prepareAction(repository:string,action:Action):Promise<PreparedAction>{
 const root=await realpath(repository);const settings=await settingsDigest(root);
 if(action.tool==='apply_patch'){
  if(typeof action.path!=='string'||typeof action.beforeDigest!=='string'||typeof action.oldText!=='string'||typeof action.newText!=='string'||!action.oldText||action.newText.length>1024*1024)throw new Error('Invalid patch arguments');
  const source=await readSource(root,action.path);
  if(source.digest!==action.beforeDigest)throw new Error('Patch source is stale; read and propose again');
  if(source.text.split(action.oldText).length!==2)throw new Error('Patch oldText must have exactly one unique match');
  const target=await containedPath(root,action.path);const nextText=source.text.replace(action.oldText,()=>action.newText);
  return {action,root,settingsDigest:settings,target,nextText,identity:digest(JSON.stringify({root,settings,action,target}))};
 }
 if(action.tool!=='run_command'||!Array.isArray(action.argv)||!action.argv.length||!action.argv.every(a=>typeof a==='string'&&!a.includes('\0'))||!Number.isSafeInteger(action.timeoutMs)||action.timeoutMs<1||action.timeoutMs>300000)throw new Error('Invalid command arguments');
 const cwd=await containedPath(root,action.cwd);if(!(await stat(cwd)).isDirectory())throw new Error('Command cwd must be a directory');
 const first=action.argv[0]!;
 const executable=await realpath(first.includes('/')?resolve(cwd,first):Bun.which(first,{PATH:process.env.PATH??'/usr/bin:/bin'})??'');
 if(/^(?:ba|z|da|k|c|fi)?sh$|^(?:powershell|pwsh|cmd\.exe)$/.test(executable.split('/').pop()??''))throw new Error('Shell execution requires a higher-risk tool; unavailable here');
 const files:Record<string,string>={};
 // Bind executable bytes and identifiable entry files. Transitive application code is explicitly not sandboxed.
 const executableStat=await stat(executable);if(executableStat.size>256*1024*1024)throw new Error('Executable identity limit');
 files[executable]=digest(await readFile(executable));
 for(const arg of action.argv.slice(1)){
  if(arg.startsWith('-'))continue;
  const candidate=resolve(cwd,arg);
  if(!isWithin(root,candidate))continue;
  try{const entry=await readSource(root,relative(root,candidate));files[entry.path]=entry.digest;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT'&&(error as NodeJS.ErrnoException).code!=='ENOTDIR')throw error;}
 }
 return {action,root,settingsDigest:settings,executable,cwd,identity:digest(JSON.stringify({root,settings,action,executable,cwd,files}))};
}
export class ExecutionPolicy {
 private once=new Set<string>();private revision=0;
 private development:{commands:string[][];writePaths:string[];settingsDigest:string;revision:number}|null=null;
 readonly repository:string;
 constructor(repository:string){this.repository=realpathSync(repository);}
 approveOnce(action:PreparedAction){if(action.root!==this.repository)throw new Error('Approval checkout mismatch');this.once.add(action.identity);}
 grantDevelopment(scope:{commands:string[][];writePaths:string[];settingsDigest:string}){this.development={...structuredClone(scope),revision:this.revision};}
 revoke(){this.once.clear();this.development=null;this.revision++;}
 allows(action:PreparedAction):boolean {
  if(action.root!==this.repository)return false;
  if(this.once.has(action.identity))return true;
  const grant=this.development;
  if(grant&&grant.revision===this.revision&&grant.settingsDigest===action.settingsDigest){
   if(action.action.tool==='run_command'&&grant.commands.some(argv=>JSON.stringify(argv)===JSON.stringify(action.action.tool==='run_command'?action.action.argv:[])))return true;
   if(action.action.tool==='apply_patch'&&grant.writePaths.includes(action.action.path))return true;
  }
  return false;
 }
 consume(action:PreparedAction){if(!this.allows(action))throw new ApprovalRequired(action);this.once.delete(action.identity);}
}
export class ApprovalRequired extends Error {constructor(readonly prepared:PreparedAction){super('Explicit execution approval required');}}
