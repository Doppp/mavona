import {join} from 'node:path';
import {parseArguments,single} from './options';
import {dataDirectory} from './run';
import {listSessions,sessionPath,readHistory,exportSession,forkSession,resumeSession} from '../sessions/lifecycle';
export async function sessionCommand(raw:string[],resume=false):Promise<number>{
 const args=parseArguments(raw,['data-dir','format','effect','reason'],[]);const format=single(args,'format','json');if(format!=='json')throw new Error('Session output supports json');
 const root=join(single(args,'data-dir',dataDirectory())!,'sessions');const operation=resume?'resume':args.positionals.shift()??'list';
 const id=args.positionals.shift();if(args.positionals.length)throw new Error('Unexpected session arguments');
 if(operation==='list'){if(id)throw new Error('List takes no session ID');console.log(JSON.stringify({schemaVersion:1,sessions:listSessions(root)},null,2));return 0;}
 if(!id)throw new Error('Session ID required');
 if(operation==='show'){const history=readHistory(sessionPath(root,id),id);console.log(JSON.stringify({schemaVersion:1,...history},null,2));}
 else if(operation==='export')console.log(JSON.stringify(exportSession(root,id),null,2));
 else if(operation==='fork'){const store=forkSession(root,id,Bun.randomUUIDv7());try{console.log(JSON.stringify({schemaVersion:1,id:store.sessionId,mutationAllowed:store.state.mutationAllowed,source:id}));}finally{store.close();}}
 else if(operation==='reconcile'){const effect=single(args,'effect'),reason=single(args,'reason');if(!effect||!reason)throw new Error('Use sessions reconcile ID --effect EFFECT_ID --reason inspected-current-state');const store=resumeSession(root,id);try{const {reconcileEffect}=await import('../sessions/reconciliation');console.log(JSON.stringify({schemaVersion:1,id,...await reconcileEffect(store,effect,reason)}));}finally{store.close();}}
 else if(operation==='resume'){
  const store=resumeSession(root,id);
  if(process.stdin.isTTY&&!args.values.has('format')){try{const {startTui}=await import('../tui/start');await startTui(store);}catch(error){store.close();throw error;}}
  else {try{console.log(JSON.stringify({schemaVersion:1,id,...store.state,effectReplay:'never',verificationFresh:false}));}finally{store.close();}}
 }else if(operation==='archive'||operation==='unarchive'){
  const store=resumeSession(root,id);try{store.append('session.archived',{archived:operation==='archive'});console.log(JSON.stringify({schemaVersion:1,id,archived:operation==='archive'}));}finally{store.close();}
 }else throw new Error('Unknown session operation');
 return 0;
}
