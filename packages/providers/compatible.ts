import {resolveBlocks,wireBlocks,type AdapterOptions} from './images';
import {validateEndpoint} from './security';
import {streamJSON,bearer} from './transport';
import {ProviderError,object,string,index,usage,type Connection,type ProviderEvent,type ProviderRequest} from './types';
export type {ProviderEvent} from './types';
export type CompatibleRequest=ProviderRequest;
export class CompatibleProvider {
 constructor(readonly connection:Connection,private credential?:string,private options:AdapterOptions={}){validateEndpoint(connection.baseUrl,connection.locality);}
 async *stream(request:ProviderRequest,signal:AbortSignal):AsyncGenerator<ProviderEvent>{
 const blocks=await resolveBlocks(request.messages,this.connection,this.options,signal);
 const {maxOutputTokens,...rest}=request;const messages=request.messages.map(m=>{const {blocks:_,...message}=m;return {...message,...(blocks.has(m)?{content:wireBlocks(blocks.get(m)!,'compatible')}:{})};});let finish:string|undefined;let done=false;
 for await(const chunk of streamJSON(this.connection,'/chat/completions',{...rest,messages,...(maxOutputTokens?{max_tokens:maxOutputTokens}:{}),stream:true},bearer(this.credential),signal)){
 if(chunk==='[DONE]'){done=true;break;}if(chunk.usage)yield usage(chunk.usage,'prompt_tokens','completion_tokens');
 if(!Array.isArray(chunk.choices)||chunk.choices.length>1)throw new ProviderError('malformed_response','malformed provider choices');
 for(const raw of chunk.choices){const choice=object(raw);const delta=object(choice.delta);if(delta.content!==undefined&&delta.content!==null){const text=string(delta.content);if(text)yield{type:'text.delta',text};}
 if(delta.refusal)throw new ProviderError('safety_refusal','Provider refused request');
 if(delta.tool_calls!==undefined){if(!Array.isArray(delta.tool_calls))throw new ProviderError('malformed_response','malformed tool deltas');for(const rawCall of delta.tool_calls){const call=object(rawCall);const fn=call.function===undefined?{}:object(call.function);yield {type:'tool.delta',index:index(call.index),...(call.id!=null?{callId:string(call.id)}:{}),...(fn.name!=null?{name:string(fn.name)}:{}),...(fn.arguments!=null?{argumentsDelta:string(fn.arguments)}:{})};}}
 if(choice.finish_reason!=null)finish=string(choice.finish_reason);
 }}if(!done||!finish)throw new ProviderError('malformed_response','malformed unfinished provider stream');yield{type:'completed',finishReason:finish};
 }
}
