import {resolveCredential} from './security';
export interface CredentialCommand {argv:string[];stdin?:string}
export type CredentialRunner=(command:CredentialCommand)=>Promise<{code:number;stdout:string}>;
export class SecureStoreError extends Error {constructor(message:string){super(message);this.name='SecureStoreError';}}
// Never log this command: the macOS security utility accepts its password via argv.
export const runCredentialCommand:CredentialRunner=async command=>{
 let child:ReturnType<typeof Bun.spawn>;try{child=Bun.spawn(command.argv,{stdin:command.stdin===undefined?'ignore':new TextEncoder().encode(command.stdin),stdout:'pipe',stderr:'ignore',env:Object.fromEntries(['HOME','PATH','USER','LOGNAME','DBUS_SESSION_BUS_ADDRESS','XDG_RUNTIME_DIR'].flatMap(k=>process.env[k]===undefined?[]:[[k,process.env[k]!]]))});}catch{throw new SecureStoreError('Operating-system secure store unavailable');}
 const timer=setTimeout(()=>child.kill(),10000);try{if(!child.stdout||typeof child.stdout==='number')throw new SecureStoreError('Invalid secure store response');const stdout=await new Response(child.stdout).text();const code=await child.exited;if(stdout.length>65536)throw new SecureStoreError('Invalid secure store response');return {code,stdout};}catch{throw new SecureStoreError('Operating-system secure store failed');}finally{clearTimeout(timer);}
};
export class SecureCredentialStore {
 constructor(private platform:NodeJS.Platform=process.platform,private runner:CredentialRunner=runCredentialCommand,private locate:(name:string)=>string|null=name=>Bun.which(name)){}
 private command():string {const path=this.platform==='darwin'?this.locate('security'):this.platform==='linux'?this.locate('secret-tool'):null;if(!path)throw new SecureStoreError('Operating-system secure storage unavailable; use environment or session credentials');return path;}
 private account(provider:string):string {if(!/^[a-z][a-z0-9_-]{0,63}$/.test(provider))throw new SecureStoreError('Invalid credential provider');return `provider:${provider}`;}
 private async execute(argv:string[],stdin?:string){try{return await this.runner({argv,...(stdin!==undefined?{stdin}:{})});}catch{throw new SecureStoreError('Operating-system secure storage failed; no credential was saved to plaintext');}}
 async read(provider:string):Promise<string|undefined>{const account=this.account(provider);const cmd=this.command();const result=await this.execute(this.platform==='darwin'?[cmd,'find-generic-password','-s','com.mavona.credentials','-a',account,'-w']:[cmd,'lookup','service','com.mavona.credentials','account',account]);if(result.code===(this.platform==='darwin'?44:1))return;if(result.code!==0)throw new SecureStoreError('Operating-system secure storage read failed');return result.stdout.replace(/\r?\n$/,'')||undefined;}
 async save(provider:string,value:string):Promise<void>{const account=this.account(provider);if(!value||value.length>16384||value.includes('\0')||value.includes('\n'))throw new SecureStoreError('Invalid credential');const cmd=this.command();const result=await this.execute(this.platform==='darwin'?[cmd,'add-generic-password','-U','-s','com.mavona.credentials','-a',account,'-w',value]:[cmd,'store','--label=Mavona provider credential','service','com.mavona.credentials','account',account],this.platform==='linux'?value:undefined);if(result.code!==0)throw new SecureStoreError('Operating-system secure storage save failed; use environment or session credentials explicitly');}
 async remove(provider:string):Promise<void>{const account=this.account(provider);const cmd=this.command();const result=await this.execute(this.platform==='darwin'?[cmd,'delete-generic-password','-s','com.mavona.credentials','-a',account]:[cmd,'clear','service','com.mavona.credentials','account',account]);if(result.code!==0&&result.code!==(this.platform==='darwin'?44:1))throw new SecureStoreError('Operating-system secure storage deletion failed');}
 available():boolean{try{this.command();return true;}catch{return false;}}
}
export class CredentialVault {
 #session=new Map<string,string>();selection:string|undefined;
 constructor(private store=new SecureCredentialStore()){}
 select(provider:string):void{this.selection=provider;}
 async save(provider:string,value:string,persistent=false):Promise<void>{if(persistent){await this.store.save(provider,value);this.#session.delete(provider);}else this.#session.set(provider,value);}
 async resolve(provider:string,names:readonly string[],environment:Record<string,string|undefined>=process.env){return resolveCredential(names,environment,this.#session.get(provider),async()=>this.store.available()?this.store.read(provider):undefined);}
 async logout(provider:string):Promise<void>{this.#session.delete(provider);if(this.selection===provider)this.selection=undefined;if(this.store.available())await this.store.remove(provider);}
}
