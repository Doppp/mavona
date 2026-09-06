import { validateEndpoint, type Locality } from './security';
import { decodeSSE } from './sse';
export type ProviderEvent=
 |{type:'text.delta';text:string}
 |{type:'tool.delta';index:number;callId?:string;name?:string;argumentsDelta?:string}
 |{type:'usage';inputTokens?:number;outputTokens?:number}
 |{type:'completed';finishReason:string};
export interface CompatibleRequest {model:string;messages:{role:'system'|'user'|'assistant'|'tool';content:string;tool_call_id?:string}[];tools?:{type:'function';function:{name:string;description:string;parameters:Record<string,unknown>}}[]}
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('malformed provider object');return value as Record<string,unknown>;}
function optionalText(value:unknown):string|undefined{if(value===undefined||value===null)return undefined;if(typeof value!=='string')throw new Error('malformed provider text');return value;}
function count(value:unknown):number|undefined{if(value===undefined||value===null)return undefined;if(!Number.isSafeInteger(value)||(value as number)<0)throw new Error('malformed usage');return value as number;}
export class CompatibleProvider {
 constructor(readonly connection:{id:string;baseUrl:string;locality:Locality},private credential?:string){validateEndpoint(connection.baseUrl,connection.locality);}
 async *stream(request:CompatibleRequest,signal:AbortSignal):AsyncGenerator<ProviderEvent>{
  signal.throwIfAborted();
  const url=validateEndpoint(this.connection.baseUrl,this.connection.locality);url.pathname=url.pathname.replace(/\/$/,'')+'/chat/completions';
  const response=await fetch(url,{method:'POST',redirect:'manual',signal:AbortSignal.any([signal,AbortSignal.timeout(60000)]),headers:{'content-type':'application/json',...(this.credential?{authorization:`Bearer ${this.credential}`}:{})},body:JSON.stringify({...request,stream:true})});
  if(response.status>=300&&response.status<400){await response.body?.cancel();throw new Error('Provider redirect refused');}
  if(!response.ok){await response.body?.cancel();throw new Error(response.status===401?'Provider authentication failure':response.status===429?'Provider rate limit or quota':'Provider HTTP failure');}
  if(!response.body||!response.headers.get('content-type')?.includes('text/event-stream')){await response.body?.cancel();throw new Error('malformed provider stream');}
  let finish:string|undefined;let done=false;
  for await(const data of decodeSSE(response.body)){
   signal.throwIfAborted();
   if(data==='[DONE]'){done=true;break;}
   let chunk:Record<string,unknown>;try{chunk=object(JSON.parse(data));}catch{throw new Error('malformed provider JSON');}
   if(chunk.error)throw new Error('Provider stream error');
   if(chunk.usage){const usage=object(chunk.usage);const input=count(usage.prompt_tokens);const output=count(usage.completion_tokens);yield{type:'usage',...(input!==undefined?{inputTokens:input}:{}),...(output!==undefined?{outputTokens:output}:{})};}
   if(!Array.isArray(chunk.choices))throw new Error('malformed provider choices');
   if(chunk.choices.length>1)throw new Error('Multiple provider choices unsupported');
   for(const value of chunk.choices){
    const choice=object(value);const delta=object(choice.delta);
    const text=optionalText(delta.content);if(text)yield{type:'text.delta',text};
    if(delta.tool_calls!==undefined){
     if(!Array.isArray(delta.tool_calls))throw new Error('malformed tool deltas');
     for(const raw of delta.tool_calls){const call=object(raw);if(!Number.isSafeInteger(call.index)||(call.index as number)<0)throw new Error('malformed tool index');
      const fn=call.function===undefined?{}:object(call.function);const callId=optionalText(call.id),name=optionalText(fn.name),argumentsDelta=optionalText(fn.arguments);
      yield{type:'tool.delta',index:call.index as number,...(callId?{callId}:{}),...(name?{name}:{}),...(argumentsDelta!==undefined?{argumentsDelta}:{})};
     }
    }
    const reason=optionalText(choice.finish_reason);if(reason)finish=reason;
   }
  }
  if(!done||!finish)throw new Error('malformed unfinished provider stream');
  yield{type:'completed',finishReason:finish};
 }
}
