import {test,expect} from 'bun:test';
import {OpenAIResponsesProvider} from '../packages/providers/openai';
import {AnthropicProvider} from '../packages/providers/anthropic';
import {collectTurn,ProviderError} from '../packages/providers/types';
const tools=[{type:'function' as const,function:{name:'read_file',description:'Read',parameters:{type:'object',properties:{path:{type:'string'}},required:['path'],additionalProperties:false}}}];
const request={model:'stub',messages:[{role:'system' as const,content:'policy'},{role:'user' as const,content:'read'}],tools};
for(const route of ['openai','anthropic'] as const)test(`${route} native wire, fragmented tool assembly and tool result roundtrip`,async()=>{
 let body:any;let path='';
 const chunks=route==='openai'?[
 {type:'response.output_item.added',output_index:0,item:{type:'function_call',id:'item',call_id:'call',name:'read_file',arguments:''}},
 {type:'response.function_call_arguments.delta',output_index:0,delta:'{"path":'},
 {type:'response.function_call_arguments.delta',output_index:0,delta:'"app/a.rb"}'},
 {type:'response.completed',response:{status:'completed',usage:{input_tokens:8,output_tokens:4}}}
 ]:[{type:'message_start',message:{usage:{input_tokens:8,output_tokens:0}}},{type:'content_block_start',index:0,content_block:{type:'tool_use',id:'call',name:'read_file',input:{}}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:'{"path":'}},{type:'content_block_delta',index:0,delta:{type:'input_json_delta',partial_json:'"app/a.rb"}'}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:'tool_use'},usage:{output_tokens:4}},{type:'message_stop'}];
 const server=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(r){body=await r.json();path=new URL(r.url).pathname;return new Response(chunks.map(c=>`data: ${JSON.stringify(c)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}});
 try{const connection={id:route,baseUrl:`http://127.0.0.1:${server.port}/v1`,locality:'local' as const};const p=route==='openai'?new OpenAIResponsesProvider(connection):new AnthropicProvider(connection);
 const result=await collectTurn(p.stream(request,new AbortController().signal),tools);expect(result.toolCalls).toEqual([{id:'call',name:'read_file',arguments:{path:'app/a.rb'}}]);expect(result.usage).toMatchObject({inputTokens:8,outputTokens:4});expect(path).toBe(route==='openai'?'/v1/responses':'/v1/messages');
 await collectTurn(p.stream({...request,messages:[...request.messages,{role:'assistant',content:'',tool_calls:[{id:'call',type:'function',function:{name:'read_file',arguments:'{"path":"app/a.rb"}'}}]},{role:'tool',tool_call_id:'call',content:'file body'}]},new AbortController().signal),tools);
 expect(JSON.stringify(body)).toContain(route==='openai'?'function_call_output':'tool_result');expect(body.stream).toBe(true);
 }finally{server.stop(true);}
});
test('tool assembly refuses incomplete, duplicate identity, unknown tools and invalid schema',async()=>{
 for(const arg of ['{','{"path":1}','{"path":"ok","extra":true}']){async function* events(){yield {type:'tool.delta' as const,index:0,callId:'c',name:'read_file',argumentsDelta:arg};yield {type:'completed' as const,finishReason:'tool_calls'};}
 await expect(collectTurn(events(),tools)).rejects.toBeInstanceOf(ProviderError);}
});
test('assembly rejects missing terminal, duplicate call IDs and unknown tool names',async()=>{
 for(const mode of ['terminal','duplicate','unknown']){async function* events(){yield {type:'tool.delta' as const,index:0,callId:'c',name:mode==='unknown'?'run_shell':'read_file',argumentsDelta:'{"path":"ok"}'};if(mode==='duplicate')yield {type:'tool.delta' as const,index:1,callId:'c',name:'read_file',argumentsDelta:'{"path":"ok"}'};if(mode!=='terminal')yield {type:'completed' as const,finishReason:'tool_calls'};}
 await expect(collectTurn(events(),tools)).rejects.toBeInstanceOf(ProviderError);}
});
for(const route of ['openai','anthropic'] as const)test(`${route} rejects redirects, truncation, HTTP errors and cancellation without exposing credentials`,async()=>{
 let mode='redirect';const secret='provider-secret-canary';const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(){if(mode==='redirect')return new Response(secret,{status:302,headers:{location:'https://example.com'}});if(mode==='http')return new Response(secret,{status:401});return new Response('data: {}\n\n',{headers:{'content-type':'text/event-stream'}});}});
 try{const connection={id:route,baseUrl:`http://127.0.0.1:${server.port}/v1`,locality:'local' as const};const p=route==='openai'?new OpenAIResponsesProvider(connection,secret):new AnthropicProvider(connection,secret);
 for(const next of ['redirect','http','truncated']){mode=next;let error:unknown;try{await collectTurn(p.stream(request,new AbortController().signal),tools);}catch(e){error=e;}expect(error).toBeInstanceOf(ProviderError);expect(String(error)).not.toContain(secret);expect((error as ProviderError).category).toBe(next==='redirect'?'connection':next==='http'?'authentication':'malformed_response');}
 const controller=new AbortController();controller.abort();await expect(collectTurn(p.stream(request,controller.signal),tools)).rejects.toMatchObject({category:'cancelled'});
 }finally{server.stop(true);}
});
test('usage reports supplied cached/image counts and leaves absent metrics unknown',async()=>{
 const {usage}=await import('../packages/providers/types');expect(usage({input_tokens:5,output_tokens:2})).toEqual({type:'usage',inputTokens:5,outputTokens:2});expect(usage({input_tokens:5,input_tokens_details:{cached_tokens:3,image_tokens:2}})).toMatchObject({cachedTokens:3,imageTokens:2});expect(()=>usage({input_tokens:-1})).toThrow();
});
