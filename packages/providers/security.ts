export type Locality='local'|'remote';
export function validateEndpoint(input:string,locality:Locality):URL {
 const url=new URL(input);
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Invalid provider endpoint');
 const local=url.hostname==='localhost'||url.hostname==='[::1]'||/^127\.(?:\d{1,3}\.){2}\d{1,3}$/.test(url.hostname);
 if(locality==='local'&&!local)throw new Error('Local provider endpoint must be loopback');
 if(locality==='remote'&&url.protocol!=='https:')throw new Error('Remote provider endpoint requires HTTPS');
 return url;
}
export function validateConfig(value:unknown,depth=0):void {
 if(depth>30)throw new Error('Configuration nesting limit');
 if(value&&typeof value==='object')for(const [key,child]of Object.entries(value)){
  if(key==='credentialEnvironmentVariable'){if(typeof child!=='string'||!/^[A-Z_][A-Z0-9_]*$/.test(child))throw new Error('Invalid credential environment name');continue;}
  if(/api.?key|token|secret|password|credential/i.test(key))throw new Error('Secrets are not allowed in configuration');
  validateConfig(child,depth+1);
 }
}
export async function resolveCredential(names:readonly string[],environment:Record<string,string|undefined>,session:string|undefined,secureStore:()=>Promise<string|undefined>):Promise<{value:string;source:'environment'|'session'|'secure-store'}|null>{
 for(const name of names)if(environment[name])return {value:environment[name]!,source:'environment'};
 if(session)return {value:session,source:'session'};
 const stored=await secureStore();return stored?{value:stored,source:'secure-store'}:null;
}
