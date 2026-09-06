import {open,realpath} from 'node:fs/promises';import {constants} from 'node:fs';import {join} from 'node:path';
import {parseArguments,single} from './options';import {dataDirectory} from './run';
import {parseFlow,digestFlow,doctor,approveFlow} from '../app-inspection/service';
import {SessionStore} from '../sessions/store';import {runInspection} from '../agent/inspection';
export async function readFlow(path:string){const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const metadata=await file.stat();if(!metadata.isFile()||metadata.size>1024*1024)throw new Error('Flow exceeds file budget');const bytes=Buffer.alloc(1024*1024+1);const {bytesRead}=await file.read(bytes,0,bytes.length,0);if(bytesRead>1024*1024)throw new Error('Flow exceeds file budget');return parseFlow(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,bytesRead))));}finally{await file.close();}}
export async function appCommand(raw:string[]):Promise<number>{
 const operation=raw[0];const args=parseArguments(raw.slice(1),['flow','url','root','data-dir','format','approve-flow','browser','trace-file','profile','color-scheme','reduced-motion'],['headed','dry-run','trace','video']);
 if(args.positionals.length)throw new Error('Unexpected browser arguments');
 if(operation==='replay'){const path=single(args,'trace-file');if(!path)throw new Error('Use app replay --trace-file PATH');const {startTraceViewer}=await import('../app-inspection/viewer');const viewer=await startTraceViewer(path);console.log(JSON.stringify({schemaVersion:1,status:'ready',url:viewer.url,scope:'local offline trace replay',stop:'Ctrl+C'}));await new Promise<void>(resolve=>{const stop=()=>{process.off('SIGINT',stop);process.off('SIGTERM',stop);viewer.stop();resolve();};process.on('SIGINT',stop);process.on('SIGTERM',stop);});return 0;}
 if(operation==='install'){const {browserInstall}=await import('./browser-install');return browserInstall(single(args,'browser','chromium')!,args.flags.has('dry-run'));}
 if(operation==='doctor'){console.log(JSON.stringify({schemaVersion:1,engines:await doctor()},null,2));return 0;}
 if(operation!=='run'&&operation!=='inspect')throw new Error('Use app doctor, app run --flow PATH, or app inspect --url URL');
 const root=await realpath(single(args,'root',process.cwd())!);const format=single(args,'format','json');if(format!=='json'&&format!=='jsonl')throw new Error('Unsupported inspection output format');
 const path=single(args,'flow');const url=single(args,'url');if(operation==='run'&&!path||operation==='inspect'&&!url)throw new Error('Inspection flow or URL required');
 const flow=path?await readFlow(path):parseFlow({version:1,url,headed:args.flags.has('headed'),steps:[{op:'observe'},{op:'capture'}]});
 const profile=single(args,'profile'),browser=single(args,'browser'),scheme=single(args,'color-scheme'),motion=single(args,'reduced-motion');Object.assign(flow,parseFlow({...flow,...(profile?{profile}:{}),...(browser?{browser}:{}),...(scheme?{colorScheme:scheme}:{}),...(motion?{reducedMotion:motion}:{})}));
 for(const kind of ['trace','video'] as const)if(args.flags.has(kind))flow.evidence={...flow.evidence,[kind]:true};
 if(args.flags.has('headed'))flow.headed=true;const grant=approveFlow(flow,root,'explicit-user');const approved=single(args,'approve-flow');
 if(approved!==digestFlow(flow)){console.log(JSON.stringify({schemaVersion:1,status:'approval_required',correctness:'unknown',approval:{flowDigest:grant.flowDigest,checkout:root,origins:grant.origins,flow,warning:'Browser navigation and actions can mutate the development application. Review the full flow, then pass its exact digest with --approve-flow.'}},null,2));return 2;}
 const id=Bun.randomUUIDv7();const store=new SessionStore(join(single(args,'data-dir',dataDirectory())!,'sessions',id),id);store.append('session.opened',{repository:root});
 const controller=new AbortController();const cancel=()=>controller.abort();process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
 try{const result=await runInspection({root,flow,store,signal:controller.signal,onEvent:event=>{if(format==='jsonl')console.log(JSON.stringify(event));}});console.log(JSON.stringify(format==='jsonl'?{schemaVersion:1,type:'inspection.result',result}:result));return result.exitCode;}
 finally{store.close();process.off('SIGINT',cancel);process.off('SIGTERM',cancel);}
}
