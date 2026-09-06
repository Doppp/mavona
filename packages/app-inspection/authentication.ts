import {mkdir,realpath,stat,lstat,open,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,relative,join,dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {BrowserContext} from 'playwright';
export type AuthenticationState=Awaited<ReturnType<BrowserContext['storageState']>>;
export type AuthenticationReference={id:string;origin:string;expiresAt:number};
type StoredState={version:1;reference:AuthenticationReference;checkout:string;state:AuthenticationState};
const inside=(root:string,path:string)=>{const rel=relative(root,path);return rel===''||(rel!=='..'&&!rel.startsWith('../')&&!rel.startsWith('..\\')&&!rel.startsWith('/'));};
/** Dedicated protected local storage. State never belongs in flows, reports, events or Git. */
export class AuthenticationStore{
 constructor(private readonly root:string,private readonly clock:()=>number=Date.now){}
 private async directory(checkout:string,excludedRoot?:string):Promise<{root:string;checkout:string}>{
 const canonicalCheckout=await realpath(checkout);const lexical=resolve(this.root);if(inside(resolve(checkout),lexical))throw new Error('Authentication storage must be outside checkout');
 let ancestor=lexical;for(;;){try{const existing=await realpath(ancestor);if(inside(canonicalCheckout,existing)||(excludedRoot&&inside(await realpath(excludedRoot),existing)))throw new Error('Authentication storage must be outside checkout and artifacts');break;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;const parent=dirname(ancestor);if(parent===ancestor)throw error;ancestor=parent;}}await mkdir(lexical,{recursive:true,mode:0o700});if((await lstat(lexical)).isSymbolicLink())throw new Error('Authentication store cannot be a symlink');const root=await realpath(lexical);if(inside(canonicalCheckout,root))throw new Error('Authentication storage must be outside checkout');
 if(excludedRoot&&inside(await realpath(excludedRoot),root))throw new Error('Authentication storage must be outside artifacts');const mode=await stat(root);if((mode.mode&0o077)!==0||(process.getuid&&mode.uid!==process.getuid()))throw new Error('Authentication store requires private owner permissions');
 for(let parent=root;;parent=dirname(parent)){try{await lstat(join(parent,'.git'));throw new Error('Authentication storage must be outside Git');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}if(dirname(parent)===parent)break;}
 return {root,checkout:canonicalCheckout};
 }
 private validateState(value:unknown,origin:string):AuthenticationState{
 if(!value||typeof value!=='object')throw new Error('Invalid protected authentication state');const state=value as AuthenticationState;if(!Array.isArray(state.cookies)||!Array.isArray(state.origins)||state.cookies.length>1000||state.origins.length>1)throw new Error('Invalid protected authentication state');const url=new URL(origin);
 for(const cookie of state.cookies){if(!cookie||typeof cookie.name!=='string'||typeof cookie.value!=='string'||typeof cookie.domain!=='string'||cookie.domain.replace(/^\./,'')!==url.hostname.replace(/^\[|\]$/g,'')||typeof cookie.path!=='string'||typeof cookie.expires!=='number'||typeof cookie.httpOnly!=='boolean'||typeof cookie.secure!=='boolean'||!['Strict','Lax','None'].includes(cookie.sameSite))throw new Error('Authentication cookie outside approved scope');}
 for(const entry of state.origins){if(entry.origin!==origin||!Array.isArray(entry.localStorage)||entry.localStorage.some(item=>typeof item.name!=='string'||typeof item.value!=='string'))throw new Error('Authentication storage outside approved scope');}
 return state;
 }
 async save(state:AuthenticationState,scope:{checkout:string;origin:string;expiresAt:number;artifactRoot?:string}):Promise<AuthenticationReference>{
 if(!Number.isFinite(scope.expiresAt)||scope.expiresAt<=this.clock()||scope.expiresAt-this.clock()>24*3600000)throw new Error('Authentication expiry must be within 24 hours');const directory=await this.directory(scope.checkout,scope.artifactRoot);const reference={id:randomUUID(),origin:new URL(scope.origin).origin,expiresAt:scope.expiresAt};const record:StoredState={version:1,reference,checkout:directory.checkout,state:this.validateState(state,reference.origin)};const json=JSON.stringify(record);if(Buffer.byteLength(json)>2*1024*1024)throw new Error('Authentication state budget exceeded');const file=await open(join(directory.root,reference.id+'.json'),constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);try{await file.writeFile(json);await file.sync();}finally{await file.close();}return reference;
 }
 async load(id:string,scope:{checkout:string;origin:string;reuseApproved:boolean;artifactRoot?:string}):Promise<{reference:AuthenticationReference;state:AuthenticationState}>{
 if(!scope.reuseApproved)throw new Error('approval-required: explicit authentication reuse');if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid authentication reference');const directory=await this.directory(scope.checkout),path=join(directory.root,id+'.json');const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);let record:StoredState;try{const metadata=await file.stat();if((metadata.mode&0o077)!==0||metadata.size>2*1024*1024||(process.getuid&&metadata.uid!==process.getuid()))throw new Error('Unsafe authentication storage permissions or size');try{record=JSON.parse(await file.readFile('utf8')) as StoredState;}catch{throw new Error('Invalid protected authentication state');}}finally{await file.close();}
 if(record.version!==1||record.reference?.id!==id||record.checkout!==directory.checkout||record.reference.origin!==new URL(scope.origin).origin)throw new Error('Authentication reference outside approved scope');if(!Number.isFinite(record.reference.expiresAt)||record.reference.expiresAt<=this.clock()){await unlink(path);throw new Error('Authentication reference expired');}return {reference:record.reference,state:this.validateState(record.state,record.reference.origin)};
 }
 async revoke(id:string,checkout:string){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid authentication reference');const directory=await this.directory(checkout);await unlink(join(directory.root,id+'.json')).catch(error=>{if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;});}
}
