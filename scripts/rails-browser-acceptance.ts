import {spawn} from 'node:child_process';
import {join} from 'node:path';
const root=join(import.meta.dir,'..');
// Reserve an available loopback port, then require our owned fixture process to become healthy.
const reservation=Bun.serve({hostname:'127.0.0.1',port:0,fetch:()=>new Response('reserved')});const port=reservation.port!;reservation.stop(true);
const server=spawn('ruby',[join(root,'fixtures/rails-dogfood/bin/serve')],{cwd:root,detached:true,env:{PATH:process.env.PATH??'/usr/bin:/bin',HOME:process.env.HOME??'/tmp',DOGFOOD_PORT:String(port),RAILS_ENV:'test'},stdio:['ignore','pipe','pipe']});
let output='';const capture=(chunk:Buffer)=>{output=(output+chunk.toString()).slice(-16000);};server.stdout.on('data',capture);server.stderr.on('data',capture);
const url=`http://127.0.0.1:${port}`;let ready=false;
try{
 for(let attempt=0;attempt<200;attempt++){
  if(server.exitCode!==null)throw new Error('Rails fixture server exited before readiness');
  try{const response=await fetch(url+'/session/new',{signal:AbortSignal.timeout(500)});if(response.ok&&(await response.text()).includes('Customer')){ready=true;break;}}catch{}
  await Bun.sleep(100);
 }
 if(!ready)throw new Error('Rails fixture readiness timed out');
 const tests=Bun.spawn([process.execPath,'test','tests/inspection-rails.test.ts'],{cwd:root,env:{...process.env,MAVONA_RAILS_INSPECTION_URL:url},stdout:'inherit',stderr:'inherit'});process.exitCode=await tests.exited;
}catch(error){console.error(error instanceof Error?error.message:'Rails browser acceptance failed');console.error(output);process.exitCode=1;}
finally{if(server.pid){try{process.kill(-server.pid,'SIGTERM');}catch{}await Promise.race([new Promise<void>(resolve=>server.once('close',()=>resolve())),Bun.sleep(1000)]);if(server.exitCode===null)try{process.kill(-server.pid,'SIGKILL');}catch{}}}
