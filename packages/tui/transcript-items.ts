import type {Envelope} from '../protocol/events';
export type TranscriptKind='user'|'assistant'|'tool'|'verification'|'status';
export interface TranscriptMessage {id:string;text:string;kind?:TranscriptKind;detail?:string;expanded?:boolean;streaming?:boolean}
const limit=(text:string,max=16*1024)=>Buffer.byteLength(text)<=max?text:Buffer.from(text).subarray(0,max).toString('utf8').replace(/\uFFFD$/,'')+'\n[terminal detail truncated; canonical session event retains the bounded result]';
const pretty=(value:unknown)=>{try{return JSON.stringify(JSON.parse(String(value)),null,2);}catch{return String(value);}};
const target=(argumentsText:string)=>{try{const args=JSON.parse(argumentsText) as Record<string,unknown>;const value=args.path??args.cwd??args.url??(Array.isArray(args.argv)?args.argv.join(' '):undefined);return value===undefined?'':` · ${String(value).slice(0,160)}`;}catch{return '';}};
export function projectTranscript(events:readonly Envelope[],expanded:ReadonlySet<string>=new Set()):TranscriptMessage[]{
 const items:TranscriptMessage[]=[];const tools=new Map<string,{index:number;started:number;name:string;arguments:string}>();
 for(const event of events){
  if(event.type==='user.message')items.push({id:event.eventId,kind:'user',text:'You · '+String(event.payload.text)});
  else if(event.type==='assistant.delta'){const last=items.at(-1);if(last?.kind==='assistant')last.text+=String(event.payload.text);else items.push({id:event.eventId,kind:'assistant',text:String(event.payload.text)});}
  else if(event.type==='tool.requested'){const callId=String(event.payload.callId),name=String(event.payload.name),argumentsText=String(event.payload.arguments);const detail='Arguments\n'+limit(pretty(argumentsText));items.push({id:'tool:'+callId,kind:'tool',text:`Tool · running · ${name}${target(argumentsText)} · /tool ${callId}`,detail,expanded:expanded.has(callId)});tools.set(callId,{index:items.length-1,started:Date.parse(event.timestamp),name,arguments:argumentsText});}
  else if(event.type==='tool.completed'){const callId=String(event.payload.callId),tool=tools.get(callId);if(!tool)continue;const duration=Math.max(0,Date.parse(event.timestamp)-tool.started),result=String(event.payload.result),state=(()=>{try{const parsed=JSON.parse(result) as {state?:unknown};return typeof parsed.state==='string'?parsed.state:'completed';}catch{return 'completed';}})();items[tool.index]={id:'tool:'+callId,kind:'tool',text:`Tool · ${state} · ${tool.name}${target(tool.arguments)} · ${duration} ms · /tool ${callId}`,detail:'Arguments\n'+limit(pretty(tool.arguments))+'\n\nResult\n'+limit(pretty(result)),expanded:expanded.has(callId)};}
  else if(event.type==='verification.completed')items.push({id:'verification:'+String(event.payload.checkId)+':'+event.eventId,kind:'verification',text:`Verification · ${String(event.payload.checkId)} · ${String(event.payload.state)} · ${String(event.payload.provenance)}`,detail:limit(pretty(event.payload.result)),expanded:false});
 }
 return items;
}
