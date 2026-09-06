import {resolveBlocks,wireBlocks,type AdapterOptions} from './images';
import {validateEndpoint} from './security';
import {streamJSON,bearer} from './transport';
import {ProviderError,object,string,index,usage,type Connection,type ProviderRequest,type ProviderEvent} from './types';
// Native Responses wire contract: https://developers.openai.com/api/docs/guides/function-calling
export class OpenAIResponsesProvider {
 constructor(readonly connection:Connection,private credential?:string,private options:AdapterOptions={}){validateEndpoint(connection.baseUrl,connection.locality);}
 async *stream(request:ProviderRequest,signal:AbortSignal):AsyncGenerator<ProviderEvent>{
 const blocks=await resolveBlocks(request.messages,this.connection,this.options,signal);
 const input:unknown[]=[];for(const m of request.messages){if(m.role==='tool'){if(!m.tool_call_id)throw new ProviderError('malformed_response','Missing tool result identity');input.push({type:'function_call_output',call_id:m.tool_call_id,output:m.content});}else{if(m.content||blocks.has(m))input.push({role:m.role,content:blocks.has(m)?wireBlocks(blocks.get(m)!,'responses'):m.content});for(const call of m.tool_calls??[])input.push({type:'function_call',call_id:call.id,name:call.function.name,arguments:call.function.arguments});}}
 let completed=false;
 for await(const c of streamJSON(this.connection,'/responses',{model:request.model,input,tools:request.tools?.map(t=>({type:'function',...t.function,strict:false})),stream:true,store:false,...(request.maxOutputTokens?{max_output_tokens:request.maxOutputTokens}:{})},bearer(this.credential),signal)){
 if(c==='[DONE]')break;
 switch(c.type){case 'response.output_text.delta':yield{type:'text.delta',text:string(c.delta)};break;
 case 'response.output_item.added':{const item=object(c.item);if(item.type==='function_call')yield{type:'tool.delta',index:index(c.output_index),callId:string(item.call_id),name:string(item.name),argumentsDelta:string(item.arguments??'')};break;}
 case 'response.function_call_arguments.delta':yield{type:'tool.delta',index:index(c.output_index),argumentsDelta:string(c.delta)};break;
 case 'response.refusal.delta':throw new ProviderError('safety_refusal','Provider refused request');
 case 'response.incomplete':throw new ProviderError('context_limit','Provider response incomplete');
 case 'response.failed':throw new ProviderError('unknown_provider_error','Provider response failed');
 case 'response.completed':{const r=object(c.response);if(r.status!=='completed')throw new ProviderError('malformed_response','Unexpected response status');if(r.usage)yield usage(r.usage);completed=true;yield{type:'completed',finishReason:'stop'};break;}
 }if(completed)break;
 }if(!completed)throw new ProviderError('malformed_response','malformed unfinished provider stream');
 }
}
