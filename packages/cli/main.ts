import { inspectRepository } from '../rails/discovery';
import { routeTask } from '../rails/routing';
export async function main(args:string[]):Promise<number> {
 if (args[0]==='--version') {console.log('mavona 0.1.0-dev.1');return 0;}
 if(args.length===0 && process.stdin.isTTY){const {startTui}=await import('../tui/start');await startTui();return 0;}
 if (args[0]==='--help'||args.length===0) {console.log('Mavona v0.1 development build\n\n  mavona inspect [PATH] [--format json]\n  mavona --version\n\nRun without arguments for the terminal. Use run TASK --provider ID --model ID with explicit execution grants.\n  mavona sessions list|show|export|fork|archive [ID]\n  mavona resume ID [--format json]');return 0;}
 if(args[0]==='app'){const {appCommand}=await import('./app');return appCommand(args.slice(1));}
 if(args[0]==='run'){const {runCommand}=await import('./run');return runCommand(args.slice(1));}
 if(args[0]==='sessions'||args[0]==='resume'){const {sessionCommand}=await import('./sessions');return sessionCommand(args.slice(1),args[0]==='resume');}
 if(args[0]==='providers'){const {presets}=await import('../providers/registry');console.log(JSON.stringify({schemaVersion:1,providers:presets.map(p=>({id:p.id,locality:p.locality,endpoint:p.baseUrl,status:'configurable',liveVerified:false}))},null,2));return 0;}
 if(args[0]==='inspect') {
  const rest=args.slice(1);let task:string|undefined;const taskIndex=rest.indexOf('--task');
  if(taskIndex>=0){task=rest[taskIndex+1];if(!task?.trim())throw new Error('Task text required');rest.splice(taskIndex,2);}
  const formatIndex=rest.indexOf('--format');
  if(formatIndex>=0) {if(rest[formatIndex+1]!=='json')throw new Error('Only --format json is currently supported');rest.splice(formatIndex,2);}
  if(rest.length>1||rest.some(a=>a.startsWith('-')))throw new Error('Usage: mavona inspect [PATH] [--format json]');
  const result=await inspectRepository(rest[0]??process.cwd());const routing=task?routeTask(task,result):undefined;const {selectVerifiers}=await import('../verification/selection');console.log(JSON.stringify(routing?{...result,routing,verification:await selectVerifiers(result,routing)}:result,null,2));return result.status==='selected'?0:2;
 }
 console.error('Command unavailable in this development slice. Use --help.');return 2;
}
