import type {BrowserContext,Page} from 'playwright';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,stat,rm,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {iso,utils} from 'playwright-core/lib/coreBundle';

export type TraceReport={status:'unknown';reason:string}|{status:'passed';path:string;sha256:string;size:number;format:'playwright';sanitizerVersion:1;constrained:true;reason:string};
type Event=Record<string,unknown>;
type Recorder={_contextCreatedEvent:Event;_state?:{chunkFiles:Set<string>};_appendTraceEvent(event:Event):void;_appendResource(path:string,bytes:Buffer):void;onEntryFinished(...args:unknown[]):void;flushHarEntries(...args:unknown[]):void;onContentBlobAppend(...args:unknown[]):void};
type Client={_connection:{toImpl(value:unknown):{tracing:Recorder;guid:string}}};
const methods=['_appendTraceEvent','_appendResource','onEntryFinished','flushHarEntries','onContentBlobAppend'] as const;
const identifier=(value:unknown)=>typeof value==='string'&&/^[A-Za-z0-9_@:. -]{1,120}$/.test(value)?value:undefined;
const number=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:0;
function safeViewport(value:unknown){const options=value&&typeof value==='object'?value as Record<string,unknown>:{};const viewport=options.viewport&&typeof options.viewport==='object'?options.viewport as Record<string,unknown>:{};return {width:Math.min(4000,number(viewport.width)),height:Math.min(4000,number(viewport.height))};}
// No arbitrary strings, arguments, DOM, headers, bodies, stacks or source paths cross this boundary.
export function sanitizeTraceEvent(event:Event):Event|undefined{
 const id=identifier(event.callId);
 if(event.type==='context-options')return {type:'context-options',version:number(event.version),origin:'library',browserName:['chromium','firefox','webkit'].includes(String(event.browserName))?event.browserName:'unknown',playwrightVersion:'1.63.0',platform:'redacted',wallTime:number(event.wallTime),monotonicTime:number(event.monotonicTime),sdkLanguage:'javascript',options:{viewport:safeViewport(event.options)}};
 if(event.type==='before'&&id){const klass=['Browser','BrowserContext','Page','Frame','Locator','ElementHandle','JSHandle','Route','WebSocketRoute','Dialog','Download','Tracing'].includes(String(event.class))?String(event.class):'Browser';const method=identifier(event.method)??'operation';return {type:'before',callId:id,startTime:number(event.startTime),class:klass,method,title:klass+'.'+method,params:{},...(identifier(event.parentId)?{parentId:identifier(event.parentId)}:{})};}
 if(event.type==='after'&&id)return {type:'after',callId:id,endTime:number(event.endTime),...(event.error?{error:{name:'Error',message:'Browser operation failed; see sanitized inspection report'}}:{})};
 return undefined;
}
export class ConstrainedTrace{
 private recorder:Recorder;private restore:()=>void;private count=0;private size=0;private failed=false;private closed=false;
 private constructor(private context:BrowserContext){
  const client=context as unknown as Client;this.recorder=client._connection.toImpl(context).tracing;
  const recorder=this.recorder;if(recorder._contextCreatedEvent.playwrightVersion!=='1.63.0'||methods.some(key=>typeof recorder[key]!=='function'))throw new Error('Pinned trace sanitizer contract unavailable');
  const original={...Object.fromEntries(methods.map(key=>[key,recorder[key]]))} as Pick<Recorder,typeof methods[number]>;
  const tracing=context.tracing as unknown as {_startCollectingStacks:(...args:unknown[])=>unknown};const stacks=tracing._startCollectingStacks;if(typeof stacks!=='function')throw new Error('Pinned source-stack sanitizer contract unavailable');
  tracing._startCollectingStacks=()=>{};
  recorder._appendTraceEvent=event=>{const safe=sanitizeTraceEvent(event);if(!safe)return;const bytes=Buffer.byteLength(JSON.stringify(safe));if(++this.count>5000||this.size+bytes>8*1024*1024){this.failed=true;return;}this.size+=bytes;original._appendTraceEvent.call(recorder,safe);};
  recorder._appendResource=()=>{};recorder.onEntryFinished=()=>{};recorder.flushHarEntries=()=>{};recorder.onContentBlobAppend=()=>{};
  this.persistFrame=(page,bytes,width,height)=>{if(this.closed||this.failed)return;if(this.size+bytes.length>64*1024*1024){this.failed=true;return;}this.size+=bytes.length;const file='screencast/'+randomUUID()+'.png';recorder._state?.chunkFiles.add(file);original._appendResource.call(recorder,file,bytes);original._appendTraceEvent.call(recorder,{type:'screencast-frame',pageId:(page as unknown as Client)._connection.toImpl(page).guid,file,width,height,timestamp:iso.monotonicTime(),frameSwapWallTime:Date.now()});};
  this.restore=()=>{for(const key of methods)Object.assign(recorder,{[key]:original[key]});tracing._startCollectingStacks=stacks;};
 }
 persistFrame: (page:Page,bytes:Buffer,width:number,height:number)=>void;
 static async start(context:BrowserContext){const trace=new ConstrainedTrace(context);try{await context.tracing.start({screenshots:false,snapshots:false,sources:false});return trace;}catch(error){trace.restore();throw error;}}
 async finish(directory:string):Promise<TraceReport>{if(this.closed)return {status:'unknown',reason:'Trace already closed'};this.closed=true;const path=randomUUID()+'.zip',absolute=join(directory,path);try{await this.context.tracing.stop({path:absolute});await chmod(absolute,0o600);if(this.failed)throw new Error('Constrained trace exceeded its recording budget');const result=await validateTraceArchive(absolute);if(!result.actions)throw new Error('Trace contains no browser actions');const bytes=await readFile(absolute);return {status:'passed',path,sha256:createHash('sha256').update(bytes).digest('hex'),size:bytes.length,format:'playwright',sanitizerVersion:1,constrained:true,reason:'Actions and masked checkpoint frames only; DOM, source, arguments and network payloads omitted'};}catch{await rm(absolute,{force:true});return {status:'unknown',reason:'Constrained trace could not be safely recorded and loaded offline'};}finally{this.restore();}}
}
export async function validateTraceArchive(path:string){
 const metadata=await stat(path);if(!metadata.isFile()||metadata.size>64*1024*1024)throw new Error('Trace archive budget exceeded');const zip=new utils.ZipFile(path);
 try{const names=await zip.entries();if(names.length>1024)throw new Error('Trace entry budget exceeded');let total=0;for(const name of names){if(!/^(?:[a-zA-Z0-9_-]+\.(?:trace|network|stacks)|screencast\/[a-zA-Z0-9_-]+\.png)$/.test(name))throw new Error('Unsupported trace entry');const entry=zip._entries.get(name);if(!entry||entry.uncompressedSize>16*1024*1024||(total+=entry.uncompressedSize)>64*1024*1024)throw new Error('Trace expansion budget exceeded');}
 const content=new Map<string,Buffer>();for(const name of names)content.set(name,await zip.read(name));
 const loader=new iso.TraceLoader();await loader.load({entryNames:async()=>names,readText:async(name:string)=>content.get(name)?.toString('utf8'),readBlob:async(name:string)=>content.has(name)?new Blob([new Uint8Array(content.get(name)!)]):undefined,isLive:()=>false,traceURL:()=>''});
 return {actions:loader.contextEntries.reduce((n,c)=>n+c.actions.length,0),frames:loader.contextEntries.reduce((n,c)=>n+c.pages.reduce((m,p)=>m+p.screencastFrames.length,0),0),text:names.filter(n=>!n.endsWith('.png')).map(n=>content.get(n)!.toString('utf8')).join('\n')};
 }finally{zip.close();}
}
