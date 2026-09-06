import { inspectRepository } from '../rails/discovery';
export async function main(args:string[]):Promise<number> {
 if (args[0]==='--version') {console.log('mavona 0.1.0-dev.1');return 0;}
 if(args.length===0 && process.stdin.isTTY){const {startTui}=await import('../tui/start');await startTui();return 0;}
 if (args[0]==='--help'||args.length===0) {console.log('Mavona v0.1 development build\n\n  mavona inspect [PATH] [--format json]\n  mavona --version\n\nRun without arguments in a terminal for the development source viewer. Coding tasks are not available in this slice.');return 0;}
 if(args[0]==='inspect') {
  const rest=args.slice(1); const formatIndex=rest.indexOf('--format');
  if(formatIndex>=0) {if(rest[formatIndex+1]!=='json')throw new Error('Only --format json is currently supported');rest.splice(formatIndex,2);}
  if(rest.length>1||rest.some(a=>a.startsWith('-')))throw new Error('Usage: mavona inspect [PATH] [--format json]');
  const result=await inspectRepository(rest[0]??process.cwd()); console.log(JSON.stringify(result,null,2));return result.status==='selected'?0:2;
 }
 console.error('Command unavailable in this development slice. Use --help.');return 2;
}
