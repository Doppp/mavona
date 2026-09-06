import {mkdtemp,writeFile,rm,chmod} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';import source from '../../probes/rails_runtime_probe.rb' with {type:'text'};import type {ToolResult} from '../tools/runtime';
export async function prepareRuntimeProbe(cwd:string,models:string[]){
 if(models.length>8||new Set(models).size!==models.length||models.some(name=>name.length>200||!/^([A-Z]\w*)(::[A-Z]\w*)*$/.test(name)))throw new Error('Choose up to eight Ruby model names');
 const directory=await mkdtemp(join(tmpdir(),'mavona-runtime-probe-'));await chmod(directory,0o700);try{const path=join(directory,'rails_runtime_probe.rb');await writeFile(path,source,{mode:0o600,flag:'wx'});return {action:{tool:'run_command' as const,argv:['ruby','bin/rails','runner','--environment=test',path,JSON.stringify({schemaVersion:1,models})],cwd,timeoutMs:30000},close:()=>rm(directory,{recursive:true,force:true})};}catch(error){await rm(directory,{recursive:true,force:true});throw error;}
}
export function decodeRuntimeProbe(result:ToolResult):Record<string,unknown>{
 const unknown={schemaVersion:1,status:'unknown',provenance:'approved Rails runtime observation',correctness:'unknown',reason:'runtime_facts_unavailable'};
 if(result.state!=='passed'||!result.stdout||Buffer.byteLength(result.stdout)>256*1024)return unknown;
 try{const value=JSON.parse(result.stdout) as Record<string,unknown>;if(value.schemaVersion!==1||value.kind!=='runtime_observation'||value.status!=='passed'||value.environment!=='test')return unknown;
 const text=(v:unknown)=>typeof v==='string'&&Buffer.byteLength(v)<=1024&&!/[\x00-\x1f\x7f]/.test(v);
 const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
 if(!text(value.railsVersion)||!text(value.rubyVersion)||!Array.isArray(value.routes)||value.routes.length>200||!value.routes.every(r=>record(r)&&Object.keys(r).sort().join(',')==='action,controller,name,path,verb'&&Object.values(r).every(text))||!Array.isArray(value.loaderPaths)||value.loaderPaths.length>100||!value.loaderPaths.every(p=>text(p)&&!p.startsWith('/')&&!p.split('/').includes('..'))||typeof value.routesTruncated!=='boolean'||typeof value.pathsTruncated!=='boolean'||!Array.isArray(value.models)||value.models.length>8)return unknown;
 for(const model of value.models){if(!record(model)||!text(model.name)||!text(model.table)||typeof model.truncated!=='boolean'||!Array.isArray(model.associations)||model.associations.length>100||!model.associations.every(a=>record(a)&&Object.keys(a).sort().join(',')==='className,kind,name'&&Object.values(a).every(text))||!Array.isArray(model.columns)||model.columns.length>100||!model.columns.every(c=>record(c)&&Object.keys(c).sort().join(',')==='name,nullable,type'&&text(c.name)&&text(c.type)&&typeof c.nullable==='boolean')||Object.keys(model).sort().join(',')!=='associations,columns,name,table,truncated')return unknown;}
 if(Object.keys(value).sort().join(',')!=='environment,kind,loaderPaths,models,pathsTruncated,railsVersion,routes,routesTruncated,rubyVersion,schemaVersion,status')return unknown;
 return {...value,provenance:'approved Rails runtime observation',correctness:'unknown'};
 }catch{return unknown;}
}
