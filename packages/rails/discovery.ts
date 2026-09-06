import { readdir, realpath } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { excluded, isWithin, readSource } from '../tools/source';
export interface RepositoryInspection {
 schemaVersion:1; status:'selected'|'needs_decision'|'unsupported'; repository:string;
 roots:string[]; selectedRoot:string|null; files:string[];
 facts:{ railsVersion:string|null; testFrameworks:string[]; databaseAdapters:string[]; frontend:string[] };
 runtime:'unknown'; warnings:string[];
}
// Git metadata reads never invoke project hooks, shell aliases, boot or config commands.
async function gitRoot(path:string):Promise<string|null> {
 const child=Bun.spawn(['git','-C',path,'rev-parse','--show-toplevel'],{env:{PATH:process.env.PATH??'/usr/bin:/bin',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_OPTIONAL_LOCKS:'0'},stdout:'pipe',stderr:'pipe'});
 const timer=setTimeout(()=>child.kill(),3000);
 try { const output=await new Response(child.stdout).text(); await new Response(child.stderr).text(); return await child.exited===0 ? await realpath(output.trim()):null; } finally {clearTimeout(timer);}
}
export async function inspectRepository(path:string):Promise<RepositoryInspection> {
 const requested=await realpath(path); const repository=await gitRoot(requested);
 const result:RepositoryInspection={schemaVersion:1,status:'unsupported',repository:repository??requested,roots:[],selectedRoot:null,files:[],facts:{railsVersion:null,testFrameworks:[],databaseAdapters:[],frontend:[]},runtime:'unknown',warnings:[]};
 if (!repository) {result.warnings.push('A Git-backed Rails repository is required');return result;}
 const files:string[]=[]; let visited=0; let bounded=false;
 async function walk(dir:string,depth:number):Promise<void> {
  if (depth>30 || visited>=20000) {bounded=true;return;}
  for (const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
   if (++visited>20000) {bounded=true;break;}
   const full=join(dir,item.name); const rel=relative(repository!,full);
   if (excluded(rel)||item.isSymbolicLink()) continue;
   if (item.isDirectory()) await walk(full,depth+1);
   else if (item.isFile()) files.push(rel);
  }
 }
 await walk(repository,0);
 result.roots=files.filter(f=>f==='config/application.rb'||f.endsWith('/config/application.rb')).map(f=>dirname(dirname(f))).sort();
 const scoped=result.roots.filter(r=>isWithin(join(repository,r),requested)).sort((a,b)=>b.length-a.length);
 result.selectedRoot=result.roots.length===1?result.roots[0]!:scoped[0]??null;
 result.status=result.selectedRoot!==null?'selected':result.roots.length?'needs_decision':'unsupported';
 if (bounded) {result.warnings.push('Discovery inventory limit reached; scope may be incomplete'); result.status='needs_decision'; result.selectedRoot=null;}
 if (result.selectedRoot===null) return result;
 const selected=join(repository,result.selectedRoot);
 result.files=files.filter(f=>isWithin(selected,join(repository,f)));
 let lock=''; try { lock=(await readSource(repository,join(result.selectedRoot,'Gemfile.lock'))).text; } catch {result.warnings.push('Gemfile.lock unavailable; dependency facts unknown');}
 const gems=new Map([...lock.matchAll(/^ {4}([\w-]+) \(([^)]+)\)/gm)].map(m=>[m[1]!,m[2]!]));
 result.facts.railsVersion=gems.get('rails')??null;
 const relativeFiles=result.files.map(f=>relative(selected,join(repository,f)));
 result.facts.testFrameworks=[...(relativeFiles.some(f=>f.startsWith('test/'))?['minitest']:[]),...(relativeFiles.some(f=>f.startsWith('spec/'))?['rspec']:[])];
 result.facts.databaseAdapters=['pg','mysql2','sqlite3'].filter(g=>gems.has(g));
 result.facts.frontend=['turbo-rails','stimulus-rails','importmap-rails','jsbundling-rails','cssbundling-rails'].filter(g=>gems.has(g));
 return result;
}
