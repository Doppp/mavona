import {test,expect} from 'bun:test';
import {presets,createProvider,CapabilityCache,preflightCapabilities,discoverModels} from '../packages/providers/registry';
import {requireChangeCapabilities,type Provider} from '../packages/providers/types';
test('presets preserve explicit endpoint and no subscription agent loop',()=>{
 expect(presets.map(p=>p.id)).toEqual(['openai','anthropic','deepseek','qwen','kimi','glm','openrouter','ollama','lmstudio']);
 expect(()=>createProvider('codex')).toThrow('subscription_agent_loop_unsupported');expect(()=>createProvider('custom')).toThrow();
 expect(createProvider('ollama').connection.locality).toBe('local');
});
test('capabilities are checkout-free synthetic proof, keyed by endpoint/model and expire',async()=>{
 let now=1000;const cache=new CapabilityCache(100,()=>now);const c={id:'ollama',baseUrl:'http://localhost:11434/v1/',locality:'local' as const};
 const fake:Provider={async *stream(request){expect(JSON.stringify(request)).not.toContain('app/');yield{type:'tool.delta',index:0,callId:'c',name:'mavona_capability_probe',argumentsDelta:'{"ok":true}'};yield{type:'completed',finishReason:'tool_calls'};}};
 const cap=await preflightCapabilities(fake,'test','local',new AbortController().signal);requireChangeCapabilities(cap);cache.set(c,'test',cap);expect(cache.get({...c,baseUrl:'http://localhost:11434/v1'},'test')?.source).toBe('bounded_preflight');expect(cache.get(c,'other')).toBeUndefined();now=1100;expect(cache.get(c,'test')).toBeUndefined();expect(()=>requireChangeCapabilities({...cap,source:'unknown'})).toThrow();
});
test('model discovery is bounded local GET with no task payload and rejects redirects',async()=>{
 let redirect=false;const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(r){expect(r.method).toBe('GET');expect(new URL(r.url).pathname).toBe('/v1/models');return redirect?new Response(null,{status:302,headers:{location:'https://example.com'}}):Response.json({data:[{id:'explicit-model'}]});}});
 try{const c={id:'stub',baseUrl:`http://127.0.0.1:${server.port}/v1`,locality:'local' as const};expect(await discoverModels(c,new AbortController().signal)).toEqual(['explicit-model']);redirect=true;await expect(discoverModels(c,new AbortController().signal)).rejects.toThrow('redirect');}finally{server.stop(true);}
});
