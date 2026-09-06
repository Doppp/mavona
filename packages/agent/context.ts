import {readSource,digest} from '../tools/source';
import type {ProviderMessage} from '../providers/types';
import type {Envelope} from '../protocol/events';
export async function readSourceRange(root:string,path:string,startLine=1,endLine=startLine+199){
 if(!Number.isSafeInteger(startLine)||!Number.isSafeInteger(endLine)||startLine<1||endLine<startLine||endLine-startLine>=400)throw new Error('Source range must contain at most 400 lines');
 const source=await readSource(root,path);const lines=source.text.split('\n');const selected:string[]=[];let bytes=0;
 for(const line of lines.slice(startLine-1,endLine)){const size=Buffer.byteLength(line)+(selected.length?1:0);if(bytes+size>16384)break;selected.push(line);bytes+=size;}
 return {...source,text:selected.join('\n'),startLine,endLine:startLine+selected.length-1,totalLines:lines.length,truncated:startLine>1||startLine+selected.length-1<lines.length,requestedEndLine:endLine};
}
function taskEvents(events:readonly Envelope[],taskId:string){const index=events.findIndex(e=>e.type==='task.started'&&e.payload.taskId===taskId);if(index<0)throw new Error('Unknown task');const next=events.findIndex((e,i)=>i>index&&e.type==='task.started');return events.slice(index,next<0?undefined:next);}
export function readResultRange(events:readonly Envelope[],taskId:string,callId:string,offset=0){
 const event=taskEvents(events,taskId).find(e=>e.type==='tool.completed'&&e.payload.callId===callId);if(!event)throw new Error('No canonical result for this task and call');
 const value=String(event.payload.result);if(!Number.isSafeInteger(offset)||offset<0||offset>value.length||offset>0&&/[\uDC00-\uDFFF]/.test(value[offset]??''))throw new Error('Invalid result character offset');
 let end=Math.min(value.length,offset+2048);if(end<value.length&&/[\uDC00-\uDFFF]/.test(value[end]??''))end--;
 return {callId,eventId:event.eventId,offset,text:value.slice(offset,end),nextOffset:end<value.length?end:null,totalCharacters:value.length,encoding:'JSON text; offsets are UTF-16 code units'};
}
export function compactContext(messages:readonly ProviderMessage[],budget:number,events:readonly Envelope[],taskId:string,checks:readonly {id:string;state:string;fresh:boolean;required?:boolean;provenance?:string}[],repositoryDigest?:string){
 const current=taskEvents(events,taskId);const initial=messages[1];if(!initial)return null;
 const data=JSON.parse(initial.content);data.sources=(data.sources??[]).map(({text,...reference}:{text:string;[key:string]:unknown})=>({...reference,textOmitted:true,retrieve:'read_file'}));
 const pinned:ProviderMessage[]=[messages[0]!,{...initial,content:JSON.stringify(data)}];
 const groups:ProviderMessage[][]=[];for(const message of messages.slice(2)){
  if(message.role==='user'){if(!message.content.startsWith('{"kind":"deterministic_context_checkpoint"'))pinned.push(message);}
  else if(message.role==='assistant')groups.push([message]);else if(message.role==='tool')groups.at(-1)?.push(message);
 }
 const refs=current.filter(e=>e.type==='tool.completed').map(e=>({callId:e.payload.callId,eventId:e.eventId,resultDigest:digest(String(e.payload.result))}));
 const acceptance=events.findLast(e=>e.type==='acceptance.baseline'||e.type==='acceptance.adopted');
 const checkpoint={kind:'deterministic_context_checkpoint',taskId,repositoryDigest,checks:checks.map(({id,state,fresh,required,provenance})=>({id,state,fresh,required,provenance})),acceptanceEventId:acceptance?.eventId,throughSequence:events.at(-1)?.sequence,results:refs,instruction:'Older source and exchanges omitted explicitly. Use read_file or read_tool_result for canonical evidence. No omission changes approval or verification truth.'};
 pinned.push({role:'user',content:JSON.stringify(checkpoint)});
 const size=(m:readonly ProviderMessage[])=>Buffer.byteLength(JSON.stringify(m));if(size(pinned)>budget)return null;
 let retained:ProviderMessage[]=[];for(const group of groups.toReversed()){if(size([...pinned,...group,...retained])>budget)break;retained=[...group,...retained];}
 const compiled=[...pinned,...retained];return {messages:compiled,bytes:size(compiled),snapshot:{...checkpoint,inputDigest:digest(JSON.stringify(messages)),retainedMessageDigests:compiled.map(m=>digest(JSON.stringify(m)))}};
}
