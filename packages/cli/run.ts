import {inspectRepository} from '../rails/discovery';import {routeTask} from '../rails/routing';
import {pendingWorktreeEffects} from '../tools/worktree';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {realpath} from 'node:fs/promises';
import {parseArguments,single,argvJSON} from './options';
import {createProvider,presets,preflightCapabilities} from '../providers/registry';
import {CredentialVault} from '../providers/credentials';
import {ExecutionPolicy,settingsDigest} from '../tools/policy';
import {runTask,type Verifier} from '../agent/loop';
import {SessionStore} from '../sessions/store';
import type {Connection,ModelCapabilities} from '../providers/types';
export function dataDirectory(){return process.platform==='darwin'?join(homedir(),'Library','Application Support','Mavona'):join(process.env.XDG_DATA_HOME??join(homedir(),'.local','share'),'mavona');}
export async function runCommand(raw:string[]):Promise<number>{
 const args=parseArguments(raw,['provider','model','endpoint','locality','root','format','allow-write','allow-command','verify','max-turns','data-dir'],['trust-model-tools']);
 const task=args.positionals.join(' ');const providerId=single(args,'provider');const model=single(args,'model');
 const format=single(args,'format','json');if(!['json','jsonl','text'].includes(format!))throw new Error('Unsupported output format');
 if(!task||!providerId||!model){console.error('run requires a task, --provider and --model; no request was made.');return 2;}
 const requestedRoot=await realpath(single(args,'root',process.cwd())!);const inspection=await inspectRepository(requestedRoot,{declaredRoutes:true});const root=inspection.repository;const preset=presets.find(p=>p.id===providerId);
 const pending=await pendingWorktreeEffects(root);if(pending.length){const result={schemaVersion:1,status:'reconciliation_required',correctness:'unknown',exitCode:2,pendingEffects:pending,recovery:'Inspect the owning session; use sessions reconcile ID --effect EFFECT_ID --reason inspected-current-state'};console.log(format==='text'?result.recovery+' '+JSON.stringify(pending):JSON.stringify(format==='jsonl'?{schemaVersion:1,type:'result',result}:result));return 2;}
 const routing=routeTask(task,inspection);if(routing.status!=='PLAN_READY'){const result={schemaVersion:1,status:routing.status,correctness:'unknown',exitCode:2,reason:routing.reason,roots:inspection.roots};console.log(format==='text'?result.reason:JSON.stringify(format==='jsonl'?{schemaVersion:1,type:'result',result}:result));return 2;}
 const endpoint=single(args,'endpoint');let custom:Connection|undefined;
 if(endpoint){const locality=single(args,'locality');if(locality!=='local'&&locality!=='remote')throw new Error('Custom endpoint requires explicit locality');custom={id:providerId,baseUrl:endpoint,locality};}
 const connection=custom??preset;if(!connection)throw new Error('Provider configuration required');
 const vault=new CredentialVault();const credential=await vault.resolve(providerId,preset?.credentialNames??[]);
 const provider=createProvider(providerId,credential?.value,custom);const controller=new AbortController();const cancel=()=>controller.abort();process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
 let store:SessionStore|undefined;
 try{
  const capabilities:ModelCapabilities=args.flags.has('trust-model-tools')?{streaming:true,tools:true,instructions:true,structuredOutput:false,images:false,locality:connection.locality,source:'user_override',observedAt:new Date().toISOString()}:await preflightCapabilities(provider,model,connection.locality,controller.signal);
  const policy=new ExecutionPolicy(root);const verifiers:Verifier[]=(args.values.get('verify')??[]).map((value,i)=>({id:`user-check-${i+1}`,argv:argvJSON(value),required:true,provenance:'user-approved',timeoutMs:60000,cwd:inspection.selectedRoot!}));
  const commands=(args.values.get('allow-command')??[]).map(argvJSON);const paths=(args.values.get('allow-write')??[]).map(path=>inspection.selectedRoot==='.'||path.startsWith(inspection.selectedRoot!+'/')?path:join(inspection.selectedRoot!,path));
  if(commands.length||paths.length)policy.grantDevelopment({commands,writePaths:paths,settingsDigest:await settingsDigest(root,inspection.selectedRoot!)});
  const id=Bun.randomUUIDv7();store=new SessionStore(join(single(args,'data-dir',dataDirectory())!,'sessions',id),id,credential?[credential.value]:[]);
  const maxTurns=Number(single(args,'max-turns','8'));if(!Number.isSafeInteger(maxTurns)||maxTurns<1||maxTurns>50)throw new Error('Invalid turn budget');
  const result=await runTask({root,railsPath:join(root,inspection.selectedRoot!),task,provider,providerId,model,capabilities,store,policy,signal:controller.signal,verifiers,maxTurns,onEvent:event=>{if(format==='jsonl')console.log(JSON.stringify(event));else if(format==='text'&&event.type==='assistant.delta')process.stdout.write(String(event.payload.text));}});
  if(format==='text')console.log(`\n${result.status}: ${result.correctness} · session ${id}`);
  else console.log(JSON.stringify(format==='jsonl'?{schemaVersion:1,type:'result',result}:result));
  return result.exitCode;
 }finally{store?.close();process.off('SIGINT',cancel);process.off('SIGTERM',cancel);}
}
