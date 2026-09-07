import {expect,test} from 'bun:test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnOwnedServer,startServer} from '../packages/app-inspection/lifecycle';

test('approved owned server captures sanitized bounded logs and stops its process while attached servers survive',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-owned-server-')),script=join(root,'server.ts');await writeFile(script,`const port=Number(process.argv[2]);console.log('boot token=SERVER_LOG_CANARY?private=yes');const server=Bun.serve({hostname:'127.0.0.1',port,fetch:()=>new Response('owned')});process.on('SIGTERM',()=>{server.stop(true);process.exit(0)});await new Promise(()=>{});`);const reservation=Bun.serve({hostname:'127.0.0.1',port:0,fetch:()=>new Response('reserved')}),port=reservation.port!;reservation.stop(true);const url=`http://127.0.0.1:${port}/health`;let owned;
 try{owned=await startServer(url,()=>spawnOwnedServer(root,[process.execPath,script,String(port)]),{healthTimeoutMs:5000});expect((await fetch(url)).status).toBe(200);await Bun.sleep(20);expect(owned.logs().join('\n')).not.toContain('SERVER_LOG_CANARY');expect(owned.logs().join('\n')).toContain('[REDACTED]');await owned.stop();await expect(fetch(url)).rejects.toThrow();const attachedServer=Bun.serve({hostname:'127.0.0.1',port,fetch:()=>new Response('attached')});try{const {attachServer}=await import('../packages/app-inspection/lifecycle');const attached=await attachServer(url);await attached.stop();expect((await fetch(url)).status).toBe(200);}finally{attachedServer.stop(true);}}
 finally{await owned?.stop();await rm(root,{recursive:true,force:true});}
},10000);

test('health timeout stops the owned process and never claims successful startup',async()=>{
 const reservation=Bun.serve({hostname:'127.0.0.1',port:0,fetch:()=>new Response('reserved')}),port=reservation.port!;reservation.stop(true);let stopped=false;await expect(startServer(`http://127.0.0.1:${port}/`,async()=>({stop:async()=>{stopped=true;}}),{healthTimeoutMs:20})).rejects.toThrow('health timeout');expect(stopped).toBe(true);
});
