import {test,expect} from 'bun:test';
import {CredentialVault,SecureCredentialStore,type CredentialCommand} from '../packages/providers/credentials';
import {subscriptionAssessment} from '../packages/providers/subscription';
test('secure store uses Mavona-owned names, scoped deletion and no plaintext fallback',async()=>{
 const calls:CredentialCommand[]=[];let failure=false;const runner=async(c:CredentialCommand)=>{calls.push(c);return {code:failure?1:0,stdout:c.argv.includes('find-generic-password')?'stored\n':''};};
 const store=new SecureCredentialStore('darwin',runner,()=>'/usr/bin/security');const vault=new CredentialVault(store);vault.select('openai');await vault.save('openai','session-key',false);expect((await vault.resolve('openai',['OPENAI_API_KEY'],{OPENAI_API_KEY:'env'}))?.source).toBe('environment');await vault.save('openai','persistent-key',true);expect(calls[0]?.argv).toContain('com.mavona.credentials');expect(calls[0]?.argv).toContain('provider:openai');await vault.logout('openai');expect(vault.selection).toBeUndefined();expect(calls.at(-1)?.argv[1]).toBe('delete-generic-password');
 failure=true;await expect(vault.save('openai','canary',true)).rejects.toThrow('secure');expect(JSON.stringify(vault)).not.toContain('canary');
});
test('Linux secret-tool receives secret on stdin and unavailable storage fails explicitly',async()=>{
 let command:CredentialCommand|undefined;const store=new SecureCredentialStore('linux',async c=>{command=c;return {code:0,stdout:''};},()=>'/usr/bin/secret-tool');await store.save('ollama','canary');expect(command?.stdin).toBe('canary');expect(command?.argv.join(' ')).not.toContain('canary');expect(command?.argv).toContain('com.mavona.credentials');
 const unavailable=new SecureCredentialStore('linux',async()=>{throw new Error('should not run');},()=>null);await expect(unavailable.save('ollama','key')).rejects.toThrow('unavailable');
 expect(subscriptionAssessment(false).inference).toBe('unavailable');expect(subscriptionAssessment(true).reason).toBe('subscription_agent_loop_unsupported');
});
test('secure-store subprocess transport works against a fake executable without real credential writes',async()=>{
 const {mkdtemp,writeFile,rm}=await import('node:fs/promises');const {join}=await import('node:path');const {tmpdir}=await import('node:os');const dir=await mkdtemp(join(tmpdir(),'mavona-vault-'));const path=join(dir,'fake-security');
 try{await writeFile(path,'#!/bin/sh\ncase "$1" in\n find-generic-password) printf "fixture-value\\n";;\n add-generic-password|delete-generic-password) exit 0;;\n *) exit 2;;\nesac\n',{mode:0o700});const store=new SecureCredentialStore('darwin',undefined,()=>path);await store.save('openai','fixture-key');expect(await store.read('openai')).toBe('fixture-value');await store.remove('openai');}finally{await rm(dir,{recursive:true,force:true});}
});
