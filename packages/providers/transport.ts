import {validateEndpoint} from './security';
import {decodeSSE} from './sse';
import {ProviderError,object,type Connection} from './types';
export async function* streamJSON(connection:Connection,path:string,body:unknown,headers:Record<string,string>,signal:AbortSignal):AsyncGenerator<Record<string,unknown>|'[DONE]'> {
 const timeout=AbortSignal.timeout(60000);const combined=AbortSignal.any([signal,timeout]);
 try{
 combined.throwIfAborted();const url=validateEndpoint(connection.baseUrl,connection.locality);url.pathname=url.pathname.replace(/\/$/,'')+path;
 const response=await fetch(url,{method:'POST',redirect:'manual',signal:combined,headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
 if(!response.ok){await response.body?.cancel();if(response.status>=300&&response.status<400)throw new ProviderError('connection','Provider redirect refused');throw new ProviderError(response.status===401?'authentication':response.status===403?'authorization':response.status===429?'rate_limit':response.status===413?'context_limit':'unknown_provider_error',`Provider HTTP ${response.status}`);}
 if(!response.body||!response.headers.get('content-type')?.includes('text/event-stream')){await response.body?.cancel();throw new ProviderError('malformed_response','malformed provider stream');}
 for await(const data of decodeSSE(response.body)){combined.throwIfAborted();if(data==='[DONE]'){yield data;break;}let chunk:Record<string,unknown>;try{chunk=object(JSON.parse(data));}catch{throw new ProviderError('malformed_response','malformed provider JSON');}if(chunk.error){const error=object(chunk.error);const code=String(error.code??error.type??'');throw new ProviderError(/quota/.test(code)?'quota':/context/.test(code)?'context_limit':/rate_limit/.test(code)?'rate_limit':/authentication/.test(code)?'authentication':'unknown_provider_error','Provider stream error');}yield chunk;}
 }catch(error){if(signal.aborted)throw new ProviderError('cancelled','Provider request cancelled');if(timeout.aborted)throw new ProviderError('timeout','Provider request timeout');if(error instanceof ProviderError)throw error;throw new ProviderError(error instanceof SyntaxError||error instanceof TypeError&&/encoded data/.test(error.message)?'malformed_response':'connection','Provider connection or malformed stream failure');}
}
export function bearer(credential?:string):Record<string,string>{return credential?{authorization:`Bearer ${credential}`}:{ };}
