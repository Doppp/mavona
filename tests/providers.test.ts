import {test,expect} from 'bun:test';
import {validateEndpoint,validateConfig,resolveCredential} from '../packages/providers/security';
import {decodeSSE} from '../packages/providers/sse';
import {CompatibleProvider} from '../packages/providers/compatible';
test('locality prevents non-loopback/userinfo/remote plaintext and config cannot store secrets',()=>{
 for(const url of ['http://example.com/v1','http://localhost.evil/v1','http://user:password@localhost/v1','file:///tmp/x'])expect(()=>validateEndpoint(url,'local')).toThrow();
 for(const url of ['http://127.0.0.1:11434/v1','http://[::1]:1234/v1','http://localhost:1234/v1'])expect(validateEndpoint(url,'local')).toBeInstanceOf(URL);
 expect(()=>validateEndpoint('http://example.com/v1','remote')).toThrow();
 expect(()=>validateConfig({models:[{nested:{apiKey:'canary'}}]})).toThrow();
 expect(()=>validateConfig({model:{id:'qwen'}})).not.toThrow();
 expect(()=>validateConfig({credentialEnvironmentVariable:'VLLM_API_KEY'})).not.toThrow();
});
test('credential sources have explicit environment/session/store precedence',async()=>{
 const store=async()=> 'stored';
 expect(await resolveCredential(['KEY'],{KEY:'environment'},'session',store)).toEqual({value:'environment',source:'environment'});
 expect(await resolveCredential(['KEY'],{},'session',store)).toEqual({value:'session',source:'session'});
 expect(await resolveCredential(['KEY'],{},undefined,store)).toEqual({value:'stored',source:'secure-store'});
});
test('SSE decoder handles split UTF-8 and multiline data, and refuses unfinished records',async()=>{
 const bytes=new TextEncoder().encode(':comment\r\ndata: {"text":\r\ndata: "注文"}\r\n\r\n');
 const stream=new ReadableStream<Uint8Array>({start(c){for(const b of bytes)c.enqueue(new Uint8Array([b]));c.close();}});
 const result=[];for await(const event of decodeSSE(stream))result.push(event);
 expect(result).toEqual(['{"text":\n"注文"}']);
 const bad=new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode('data: {}'));c.close();}});
 await expect(async()=>{for await(const event of decodeSSE(bad))void event;}).toThrow();
});
test('actual compatible transport streams text/tools via local stub and refuses redirects',async()=>{
 let mode='stream';let received:unknown;
 const server=Bun.serve({hostname:'127.0.0.1',port:0,async fetch(request){
  received=await request.json();
  if(mode==='redirect')return new Response(null,{status:302,headers:{location:'https://example.com'}});
  return new Response('data: {"choices":[{"delta":{"content":"hello"}}]}\n\ndata: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"c1","function":{"name":"read_file","arguments":"{}"}}]}}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}\n\ndata: [DONE]\n\n',{headers:{'content-type':'text/event-stream'}});
 }});
 try{
  const adapter=new CompatibleProvider({id:'stub',baseUrl:`http://127.0.0.1:${server.port}/v1`,locality:'local'});
  const events=[];for await(const event of adapter.stream({model:'test',messages:[{role:'user',content:'hello'}]},new AbortController().signal))events.push(event);
  expect(events.map(e=>e.type)).toEqual(['text.delta','tool.delta','completed']);expect(received).toMatchObject({model:'test',stream:true});
  mode='redirect';await expect(async()=>{for await(const e of adapter.stream({model:'test',messages:[]},new AbortController().signal))void e;}).toThrow('redirect');
 }finally{server.stop(true);}
});
test('malformed streams never emit successful completion and cancellation aborts transport',async()=>{
 const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(){return new Response('data: {bad}\n\n',{headers:{'content-type':'text/event-stream'}});}});
 try{
  const adapter=new CompatibleProvider({id:'stub',baseUrl:`http://127.0.0.1:${server.port}/v1`,locality:'local'});
  await expect(async()=>{for await(const e of adapter.stream({model:'test',messages:[]},new AbortController().signal))void e;}).toThrow('malformed');
  const controller=new AbortController();controller.abort();
  await expect(async()=>{for await(const e of adapter.stream({model:'test',messages:[]},controller.signal))void e;}).toThrow();
 }finally{server.stop(true);}
});

test('active cancellation ends an unfinished HTTP stream without completion',async()=>{
 const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(){return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n'));}}),{headers:{'content-type':'text/event-stream'}});}});
 const controller=new AbortController();const events:string[]=[];
 try{
  const provider=new CompatibleProvider({id:'stub',baseUrl:`http://127.0.0.1:${server.port}/v1`,locality:'local'});
  await expect(async()=>{for await(const event of provider.stream({model:'test',messages:[]},controller.signal)){events.push(event.type);controller.abort();}}).toThrow();
  expect(events).toEqual(['text.delta']);
 }finally{server.stop(true);}
});
