import { createHash } from 'node:crypto';
import type { RepositoryInspection } from './discovery';

export interface SurfaceCandidate {
 id:string; path:string; nominated:boolean;
 signal:'explicit_path'|'task_subject'|'declared_route'|'same_surface';
 confidence:'high'|'low'; basis:string;
}
interface RoutingBase {
 schemaVersion:1; candidates:SurfaceCandidate[]; contextPaths:string[]; contextTruncated:boolean;
}
export type TaskRouting = RoutingBase & (
 | {status:'PLAN_READY'; planningMode:'direct_change'|'lightweight_plan'|'full_plan'}
 | {status:'NEEDS_DECISION'|'TOO_BROAD'|'UNSUPPORTED'; reason:string}
);
const generic = new Set(['app','rb','erb','html','js','ts','tsx','jsx','yml','yaml','json','lib','db','change','update','create','adjust','behavior','behaviour','model','controller','view','test','spec','job','mailer','channel','component','application','rails','config','show','index','new','edit','add','remove','fix','with','from','that','this','have','should']);
const singular=(word:string)=>word.length>3&&word.endsWith('s')&&!word.endsWith('ss')?word.slice(0,-1):word;
function words(text:string):string[] {
 return (text.toLowerCase().match(/[a-z][a-z0-9]*/g)??[]).map(singular).filter(w=>w.length>=3&&!generic.has(w));
}
function validPath(path:string):boolean {
 return !!path&&!path.startsWith('/')&&!path.includes('\\')&&!path.split('/').some(p=>p==='..'||p==='.'||!p);
}
function localPath(path:string,root:string):string|null {
 if(!validPath(path)) return null;
 if(root==='.') return path;
 if(!validPath(root)||!path.startsWith(`${root}/`)) return null;
 return path.slice(root.length+1);
}
function surface(path:string):string|null {
 return /^(?:app|test|spec)\/([^/]+)\//.exec(path)?.[1]??null;
}
/** Static nominations only: no repository execution, inference, source reads or verifier approval. */
export function routeTask(task:string,inspection:RepositoryInspection):TaskRouting {
 const text=task.trim(); if(!text) throw new Error('task is required');
 const base:RoutingBase={schemaVersion:1,candidates:[],contextPaths:[],contextTruncated:false};
 if(inspection.status==='unsupported') return {...base,status:'UNSUPPORTED',reason:'A Git-backed Rails repository is required'};
 if(inspection.status!=='selected'||inspection.selectedRoot===null) return {...base,status:'NEEDS_DECISION',reason:'Select an unambiguous Rails root before routing'};
 if(/\b(?:rewrite\s+(?:the\s+)?(?:entire|whole)|complete\s+rewrite|every\s+(?:model|controller|page|feature)|all\s+applications?)\b/i.test(text))
  return {...base,status:'TOO_BROAD',reason:'Select one bounded Rails behavior with an independently verifiable outcome'};
 const taskWords=new Set(words(text));
 const referenced=new Set(text.match(/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+/g)??[]);
 const files=[...new Set(inspection.files)].sort().flatMap(path=>{
  const local=localPath(path,inspection.selectedRoot!);
  return local!==null&&(/^(?:app|test|spec|config|db|lib)\//.test(local)||referenced.has(path)||referenced.has(local))?[{path,local}]:[];
 });
 const declaredRoutes=new Map((inspection.structure?.files??[]).filter(file=>file.status==='passed').flatMap(file=>file.declarations.filter(declaration=>declaration.kind==='route'&&declaration.name!==null&&words(declaration.name).some(word=>taskWords.has(word))).map(declaration=>[file.path,{line:declaration.line,digest:file.digest}] as const)));
 const rank=({path,local}:{path:string;local:string})=>referenced.has(path)||referenced.has(local)?0:words(local).some(word=>taskWords.has(word))?1:declaredRoutes.has(path)?2:3;
 const nominated=files.filter(file=>rank(file)<3).sort((a,b)=>rank(a)-rank(b)||(a.path<b.path?-1:1));
 if(!nominated.length) return {...base,status:'NEEDS_DECISION',reason:'No file has primary task evidence; select a file or describe the Rails behavior more specifically'};
 const paths=new Set(nominated.map(f=>f.path));
 const surfaces=new Set(nominated.map(f=>surface(f.local)).filter(s=>s!==null));
 const candidates:SurfaceCandidate[]=[...files].sort((a,b)=>rank(a)-rank(b)||(a.path<b.path?-1:1)).filter(f=>{const category=surface(f.local);return paths.has(f.path)||(category!==null&&surfaces.has(category));}).map(({path,local})=>{
  const explicit=referenced.has(path)||referenced.has(local);
  const primary=paths.has(path);
  const route=declaredRoutes.get(path);const signal=explicit?'explicit_path':route?'declared_route':primary?'task_subject':'same_surface';
  return {id:`impact_${createHash('sha256').update(JSON.stringify([inspection.repository,inspection.selectedRoot,path])).digest('hex').slice(0,16)}`,path,nominated:primary,signal,
   confidence:primary?'high':'low',basis:explicit?'User references this inventory path':route?'Parsed resource declaration at line '+route.line+' · '+route.digest+'; effective runtime route unknown':primary?'Task subject matches a complete path word':'Same Rails surface only; insufficient for context nomination'};
 });
 const contextPaths=nominated.map(f=>f.path).slice(0,8);
 const highRisk=/\b(?:migration|schema|database|authentication|authorization|payment|payments|encryption|encrypt|destructive|backfill)\b/i.test(text);
 const categories=new Set(nominated.map(file=>file.local.split('/')[1]));
 const planningMode=highRisk?'full_plan':nominated.length>=5||categories.size>=3?'lightweight_plan':'direct_change';
 return {schemaVersion:1,status:'PLAN_READY',planningMode,candidates,contextPaths,contextTruncated:nominated.length>contextPaths.length};
}
