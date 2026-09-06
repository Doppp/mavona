import type {Locality} from './security';
export type ProviderErrorCategory='authentication'|'authorization'|'rate_limit'|'quota'|'timeout'|'connection'|'malformed_response'|'unsupported_capability'|'context_limit'|'safety_refusal'|'unknown_provider_error'|'cancelled';
export class ProviderError extends Error {constructor(readonly category:ProviderErrorCategory,message:string){super(message);this.name='ProviderError';}}
export type ProviderEvent=
 |{type:'text.delta';text:string}
 |{type:'tool.delta';index:number;callId?:string;name?:string;argumentsDelta?:string}
 |{type:'reasoning.status';status:string}
 |{type:'usage';inputTokens?:number;outputTokens?:number;cachedTokens?:number;imageTokens?:number}
 |{type:'completed';finishReason:string}
 |{type:'cancelled'};
export interface ToolDefinition {type:'function';function:{name:string;description:string;parameters:Record<string,unknown>}}
export interface ProviderMessage {role:'system'|'user'|'assistant'|'tool';content:string;blocks?:import('./images').InputBlock[];tool_call_id?:string;tool_calls?:{id:string;type:'function';function:{name:string;arguments:string}}[]}
export interface ProviderRequest {model:string;messages:ProviderMessage[];tools?:ToolDefinition[];maxOutputTokens?:number}
export interface Provider {stream(request:ProviderRequest,signal:AbortSignal):AsyncGenerator<ProviderEvent>}
export interface Connection {id:string;baseUrl:string;locality:Locality}
export interface ModelCapabilities {streaming:boolean;tools:boolean;instructions:boolean;structuredOutput:boolean;contextWindow?:number;images:boolean;locality:Locality|'subscription';source:'preset'|'provider_metadata'|'bounded_preflight'|'user_override'|'unknown';observedAt:string}
export function requireChangeCapabilities(c:ModelCapabilities):void {if(!c.streaming||!c.tools||!c.instructions||c.source==='unknown')throw new ProviderError('unsupported_capability','Change tasks require demonstrated streaming, instructions and tools');}
export function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new ProviderError('malformed_response','malformed provider object');return value as Record<string,unknown>;}
export function string(value:unknown):string {if(typeof value!=='string')throw new ProviderError('malformed_response','malformed provider text');return value;}
export function index(value:unknown):number {if(!Number.isSafeInteger(value)||(value as number)<0)throw new ProviderError('malformed_response','malformed provider index');return value as number;}
function usageDetails(raw:unknown):{cachedTokens?:number;imageTokens?:number}{if(raw===undefined||raw===null)return {};const d=object(raw);return {...(d.cached_tokens!==undefined?{cachedTokens:index(d.cached_tokens)}:{}),...(d.image_tokens!==undefined?{imageTokens:index(d.image_tokens)}:{})};}
export function usage(value:unknown,input='input_tokens',output='output_tokens'):Extract<ProviderEvent,{type:'usage'}>{const u=object(value);return {type:'usage',...(u[input]!==undefined?{inputTokens:index(u[input])}:{}),...(u[output]!==undefined?{outputTokens:index(u[output])}:{}),...(u.cache_read_input_tokens!==undefined?{cachedTokens:index(u.cache_read_input_tokens)}:{}),...usageDetails(u.input_tokens_details??u.prompt_tokens_details)};}
// Deliberately small JSON Schema subset used by Mavona tools. Unsupported keywords fail closed.
export function validateArguments(value:unknown,schema:Record<string,unknown>,depth=0):void {
 if(depth>24)throw new ProviderError('malformed_response','Tool arguments nesting limit');
 const fail=()=>{throw new ProviderError('malformed_response','Tool arguments do not match schema');};
 const allowed=new Set(['type','properties','required','additionalProperties','items','enum','description','minimum','maximum','minLength','maxLength','minItems','maxItems','title']);
 if(Object.keys(schema).some(k=>!allowed.has(k)))throw new ProviderError('unsupported_capability','Unsupported tool schema keyword');
 if(schema.enum!==undefined&&(!Array.isArray(schema.enum)||!schema.enum.some(v=>JSON.stringify(v)===JSON.stringify(value))))fail();
 switch(schema.type){case 'object':{const obj=object(value);const props=object(schema.properties??{});if(schema.required!==undefined){if(!Array.isArray(schema.required))fail();for(const key of schema.required as unknown[])if(typeof key!=='string'||!Object.hasOwn(obj,key))fail();}for(const [key,v]of Object.entries(obj)){if(Object.hasOwn(props,key))validateArguments(v,object(props[key]),depth+1);else if(schema.additionalProperties===false)fail();else if(typeof schema.additionalProperties==='object')validateArguments(v,object(schema.additionalProperties),depth+1);}break;}
 case 'array':if(!Array.isArray(value))fail();else{if(typeof schema.minItems==='number'&&value.length<schema.minItems||typeof schema.maxItems==='number'&&value.length>schema.maxItems)fail();for(const v of value)validateArguments(v,object(schema.items??{}),depth+1);}break;
 case 'string':if(typeof value!=='string')fail();else if(typeof schema.minLength==='number'&&value.length<schema.minLength||typeof schema.maxLength==='number'&&value.length>schema.maxLength)fail();break;
 case 'number':case 'integer':if(typeof value!=='number'||!Number.isFinite(value)||schema.type==='integer'&&!Number.isSafeInteger(value))fail();else if(typeof schema.minimum==='number'&&value<schema.minimum||typeof schema.maximum==='number'&&value>schema.maximum)fail();break;
 case 'boolean':if(typeof value!=='boolean')fail();break;case 'null':if(value!==null)fail();break;case undefined:break;default:throw new ProviderError('unsupported_capability','Unsupported tool schema type');
 }
}
export async function collectTurn(events:AsyncIterable<ProviderEvent>,tools:readonly ToolDefinition[]=[]):Promise<{text:string;toolCalls:{id:string;name:string;arguments:Record<string,unknown>}[];usage:Extract<ProviderEvent,{type:'usage'}>;finishReason:string}>{
 let text='';let finishReason:string|undefined;let total=0;let tokenUsage:Extract<ProviderEvent,{type:'usage'}>={type:'usage'};const calls=new Map<number,{id:string;name:string;args:string}>();
 for await(const event of events){if(finishReason)throw new ProviderError('malformed_response','Events after completion');if(event.type==='cancelled')throw new ProviderError('cancelled','Provider request cancelled');if(event.type==='text.delta'){text+=event.text;total+=event.text.length;}else if(event.type==='usage')tokenUsage={...tokenUsage,...event};else if(event.type==='completed')finishReason=event.finishReason;else if(event.type==='tool.delta'){
  index(event.index);let c=calls.get(event.index);if(!c){if(calls.size>=32)throw new ProviderError('malformed_response','Tool call limit');c={id:'',name:'',args:''};calls.set(event.index,c);}if(event.callId){if(c.id&&c.id!==event.callId)throw new ProviderError('malformed_response','Conflicting tool identity');c.id=event.callId;}if(event.name){if(c.name&&c.name!==event.name)throw new ProviderError('malformed_response','Conflicting tool name');c.name=event.name;}c.args+=event.argumentsDelta??'';total+=(event.argumentsDelta??'').length;
 }if(total>4*1024*1024)throw new ProviderError('malformed_response','Turn output limit');}
 if(!finishReason)throw new ProviderError('malformed_response','Unfinished provider turn');
 if(['length','max_tokens','incomplete'].includes(finishReason))throw new ProviderError('context_limit','Provider output truncated');
 if(['content_filter','refusal'].includes(finishReason))throw new ProviderError('safety_refusal','Provider refused request');
 const ids=new Set<string>();const toolCalls=[...calls.values()].map(c=>{if(!c.id||ids.has(c.id)||!c.name)throw new ProviderError('malformed_response','Missing or duplicate tool identity');ids.add(c.id);const tool=tools.find(t=>t.function.name===c.name);if(!tool)throw new ProviderError('malformed_response','Unknown tool');let args:Record<string,unknown>;try{args=object(JSON.parse(c.args));}catch{throw new ProviderError('malformed_response','Incomplete tool arguments');}validateArguments(args,tool.function.parameters);return {id:c.id,name:c.name,arguments:args};});
 return {text,toolCalls,usage:tokenUsage,finishReason};
}
