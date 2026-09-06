import {resolveBlocks,wireBlocks,type AdapterOptions} from './images';
import {validateEndpoint} from './security';
import {streamJSON} from './transport';
import {ProviderError,object,string,index,usage,type Connection,type ProviderRequest,type ProviderEvent} from './types';
// Native Messages wire contract: https://platform.claude.com/docs/en/build-with-claude/streaming
export class AnthropicProvider {
 constructor(readonly connection:Connection,private credential?:string,private options:AdapterOptions={}){validateEndpoint(connection.baseUrl,connection.locality);}
 async *stream(request:ProviderRequest,signal:AbortSignal):AsyncGenerator<ProviderEvent>{
 const imageBlocks=await resolveBlocks(request.messages,this.connection,this.options,signal);
 const messages:{role:'user'|'assistant';content:unknown[]}[]=[];for(const m of request.messages){if(m.role==='system')continue;const content:unknown[]=[];if(m.role==='tool'){if(!m.tool_call_id)throw new ProviderError('malformed_response','Missing tool result identity');content.push({type:'tool_result',tool_use_id:m.tool_call_id,content:m.content});}else{if(imageBlocks.has(m))content.push(...wireBlocks(imageBlocks.get(m)!,'anthropic'));else if(m.content)content.push({type:'text',text:m.content});for(const c of m.tool_calls??[]){let input:unknown;try{input=object(JSON.parse(c.function.arguments));}catch{throw new ProviderError('malformed_response','Invalid historical tool arguments');}content.push({type:'tool_use',id:c.id,name:c.function.name,input});}}
 const role=m.role==='assistant'?'assistant':'user';const previous=messages.at(-1);if(previous?.role===role)previous.content.push(...content);else messages.push({role,content});}
 let finish:string|undefined;let completed=false;let started=false;const blocks=new Set<number>();
 for await(const c of streamJSON(this.connection,'/messages',{model:request.model,system:request.messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n'),messages,tools:request.tools?.map(t=>({name:t.function.name,description:t.function.description,input_schema:t.function.parameters})),max_tokens:request.maxOutputTokens??4096,stream:true},{'anthropic-version':'2023-06-01',...(this.credential?{'x-api-key':this.credential}:{})},signal)){
 if(c==='[DONE]')break;
 switch(c.type){case 'message_start':if(started)throw new ProviderError('malformed_response','Duplicate message start');started=true;{const m=object(c.message);if(m.usage)yield usage(m.usage);}break;
 case 'content_block_start':{const i=index(c.index);if(blocks.has(i))throw new ProviderError('malformed_response','Duplicate content block');blocks.add(i);const b=object(c.content_block);if(b.type==='tool_use')yield{type:'tool.delta',index:i,callId:string(b.id),name:string(b.name)};else if(b.type==='text'&&b.text)yield{type:'text.delta',text:string(b.text)};break;}
 case 'content_block_delta':{const i=index(c.index);if(!blocks.has(i))throw new ProviderError('malformed_response','Delta outside content block');const d=object(c.delta);if(d.type==='text_delta')yield{type:'text.delta',text:string(d.text)};else if(d.type==='input_json_delta')yield{type:'tool.delta',index:i,argumentsDelta:string(d.partial_json)};break;}
 case 'content_block_stop':if(!blocks.delete(index(c.index)))throw new ProviderError('malformed_response','Unknown content block stop');break;
 case 'message_delta':{const d=object(c.delta);if(d.stop_reason!=null)finish=string(d.stop_reason);if(c.usage)yield usage(c.usage);break;}
 case 'message_stop':if(!started||blocks.size||!finish)throw new ProviderError('malformed_response','Incomplete message');completed=true;yield{type:'completed',finishReason:finish};break;
 }if(completed)break;
 }if(!completed)throw new ProviderError('malformed_response','malformed unfinished provider stream');
 }
}
