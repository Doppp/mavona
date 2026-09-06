import {inspectRepository} from '../rails/discovery';
import {SourceNavigator} from '../tools/source-navigation';
import type {SourceSelection} from '../tools/source';
import {SessionStore} from '../sessions/store';
import {ExecutionPolicy,type PreparedAction} from '../tools/policy';
import {runTask,type Verifier} from '../agent/loop';
import {CredentialVault} from '../providers/credentials';
import {createProvider,presets,preflightCapabilities} from '../providers/registry';
import {editorHandoff,type EditorAdapter} from '../tools/editor';
import {argvJSON} from '../cli/options';
import type {Envelope} from '../protocol/events';
import type {ScreenModel} from './screen';
export class TuiController {
 model:ScreenModel;verifiers:Verifier[]=[];
 private editor:EditorAdapter|undefined;
 private source:SourceNavigator;private references=new Map<string,SourceSelection>();
 private files:string[]=[];private selection:{provider:string;model:string}|undefined;
 private active:AbortController|undefined;private approval:((approved:boolean)=>void)|undefined;
 private policy:ExecutionPolicy;private vault=new CredentialVault();
 constructor(private root:string,private store:SessionStore,private changed:(model:ScreenModel)=>void,private terminal?:{suspend:()=>void|Promise<void>;resume:()=>void|Promise<void>}){
  this.policy=new ExecutionPolicy(root);this.source=new SourceNavigator(root);
  for(const [id,value] of Object.entries(store.state.references))this.references.set(id,JSON.parse(value) as SourceSelection);
  const editor=store.events.findLast(event=>event.type==='editor.configured');if(editor)this.editor={argv:argvJSON(String(editor.payload.argv)),terminal:editor.payload.terminal===true};
  this.model={repository:root.split('/').pop()??root,status:'Discovering Rails application…',draft:store.state.draft,messages:store.state.messages.map(m=>({id:m.id,text:`${m.role}: ${m.text}`})),source:null};
 }
 private update(change:Partial<ScreenModel>){this.model={...this.model,...change};this.changed(this.model);}
 private add(text:string,id=Bun.randomUUIDv7()){this.update({messages:[...this.model.messages,{id,text:this.store.sanitizeText(text)}]});}
 async discover(){const result=await inspectRepository(this.root);this.files=result.files;this.update({status:result.status==='selected'?`Rails ${result.facts.railsVersion??'unknown'} · ${result.facts.testFrameworks.join(', ')||'tests unknown'} · runtime unchecked`:'Choose a Git-backed Rails application; static inspection remains available.'});}
 draft(text:string){if(text===this.model.draft)return;const event=this.store.append('draft.changed',{text});this.update({draft:String(event.payload.text)});}
 closeSource(){this.source.close();this.update({source:null});}
 cancel(){this.active?.abort();this.resolveApproval(false);}
 resolveApproval(approved:boolean){const resolve=this.approval;this.approval=undefined;this.update({approval:undefined});resolve?.(approved);}
 private approve(action:PreparedAction,signal:AbortSignal):Promise<boolean>{
  if(signal.aborted)return Promise.resolve(false);
  return this.requestApproval(action.identity,JSON.stringify({checkout:action.root,action:action.action,executable:action.executable,settingsDigest:action.settingsDigest},null,2)+'\nRepository commands execute application code; not an OS sandbox.',signal);
 }
 private requestApproval(id:string,text:string,signal:AbortSignal):Promise<boolean>{
  if(signal.aborted)return Promise.resolve(false);
  return new Promise(resolve=>{const cancelled=()=>this.resolveApproval(false);signal.addEventListener('abort',cancelled,{once:true});this.approval=value=>{signal.removeEventListener('abort',cancelled);resolve(value);};this.update({approval:{id,text:this.store.sanitizeText(text)}});});
 }
 private event(event:Envelope){
  if(event.type==='assistant.delta'){
   const last=this.model.messages.at(-1);const id=last?.id.startsWith('assistant:')?last.id:`assistant:${event.eventId}`;
   const messages=last?.id===id?[...this.model.messages.slice(0,-1),{id,text:last.text+String(event.payload.text)}]:[...this.model.messages,{id,text:String(event.payload.text)}];this.update({messages});
  }else if(event.type==='tool.requested')this.add(`Tool · ${event.payload.name} · running`,event.eventId);
  else if(event.type==='verification.completed')this.add(`Verification · ${event.payload.checkId} · ${event.payload.state}\n${event.payload.result}`,event.eventId);
  else if(event.type==='usage.reported')this.update({usage:`${event.payload.inputTokens} in / ${event.payload.outputTokens} out`});
 }
 async submit(text:string){
  if(this.active)return;
  this.draft(text);
  try{
   if(text==='/help')this.add('/files [query] · /open path[:line] · /close\n/find text · /next · /previous · /goto line · /back · /wrap · /refresh · /diff · /source\n/select start:end · /attach · /references · /detach ID\n/connect provider model · /disconnect · /providers\n/verify ["command","argument"] · /checks · /revoke · /reconcile\n/app doctor · /app run flow.json\n/editor terminal|gui JSON_ARGV · /edit\nType a task after connecting. Effects require approval. Credentials come from environment or OS secure storage; never paste them into the composer.');
   else if(text==='/files'||text.startsWith('/files ')){const query=text.slice(7).trim().toLowerCase();this.add(this.files.filter(p=>p.toLowerCase().includes(query)).slice(0,200).join('\n')||'No matching Rails files.');}
   else if(text==='/close')this.closeSource();
   else if(text.startsWith('/open ')){const match=/^(.*?)(?::([1-9]\d*))?$/.exec(text.slice(6).trim())!;await this.source.open(match[1]!,Number(match[2]??1));this.update({source:this.source.current});}
   else if(text.startsWith('/find ')){this.source.search(text.slice(6));this.update({source:this.source.current});}
   else if(text.startsWith('/goto ')){this.source.goto(Number(text.slice(6)));this.update({source:this.source.current});}
   else if(text==='/next'||text==='/previous'){this.source.next(text==='/next'?1:-1);this.update({source:this.source.current});}
   else if(text==='/back'){this.source.back();this.update({source:this.source.current});}
   else if(text==='/diff'){await this.source.showDiff();this.update({source:this.source.current});}
   else if(text==='/source'){this.source.showSource();this.update({source:this.source.current});}
   else if(text==='/wrap'){this.source.toggleWrap();this.update({source:this.source.current});}
   else if(text==='/refresh'){await this.source.refresh();this.update({source:this.source.current});}
   else if(text.startsWith('/select ')){const match=/^(\d+)(?::(\d+))?$/.exec(text.slice(8).trim());if(!match)throw new Error('Use /select start:end');this.source.select(Number(match[1]),Number(match[2]??match[1]));this.update({source:this.source.current});}
   else if(text==='/attach'){const reference=this.source.reference();const id=Bun.randomUUIDv7();this.references.set(id,reference);this.store.append('draft.reference.added',{referenceId:id,reference:JSON.stringify(reference)});this.add(`Draft reference ${id} · ${reference.path}:${reference.start}–${reference.end} · ${reference.digest.slice(0,12)}. /detach ID removes it. No model request made.`);}
   else if(text.startsWith('/detach ')){const id=text.slice(8).trim();if(!this.references.has(id))throw new Error('Unknown reference ID');this.references.delete(id);this.store.append('draft.reference.removed',{referenceId:id});}
   else if(text==='/references')this.add([...this.references].map(([id,r])=>`${id} · ${r.path}:${r.start}–${r.end}`).join('\n')||'No selected context.');
   else if(text.startsWith('/editor ')){
    const match=/^(terminal|gui) (.+)$/.exec(text.slice(8));if(!match)throw new Error('Use /editor terminal|gui JSON_ARGV');const argv=argvJSON(match[2]!);this.editor={argv,terminal:match[1]==='terminal'};this.store.append('editor.configured',{argv:JSON.stringify(argv),terminal:this.editor.terminal});this.add('Editor adapter configured. /edit opens the selected source at its line after exact-action approval. Save files before returning; GUI handoff retains ownership until explicit return.');
   }
   else if(text==='/edit'){
    if(!this.editor||!this.source.current)throw new Error('Configure an editor and open a source first');if(this.editor.terminal&&!this.terminal)throw new Error('Terminal handoff unavailable');
    this.active=new AbortController();this.update({running:true});let intent:Envelope|undefined;const effectId=Bun.randomUUIDv7();
    try{const result=await editorHandoff({root:this.root,path:this.source.current.path,line:this.source.current.line,adapter:this.editor,policy:this.policy,signal:this.active.signal,approve:action=>this.approve(action,this.active!.signal),suspend:()=>this.terminal?.suspend(),resume:()=>this.terminal?.resume(),beforeLaunch:()=>{this.store.append('verification.invalidated',{reason:'External editor handoff started; prior checks are stale'});intent=this.store.append('effect.requested',{effectId,kind:'command'});},confirmReturn:async()=>{if(!await this.requestApproval('editor-return-'+effectId,'Have you finished editing and saved the files? Y returns to Mavona and reconciles the current worktree. N leaves the effect unknown.',this.active!.signal))throw new Error('Editor return not confirmed');}});
     if(intent)this.store.append('effect.completed',{effectId,state:result.cancelled?'unknown':result.exitCode===0?'passed':'failed'},intent.eventId);this.store.append('repository.snapshot',{snapshot:JSON.stringify(result.after),reason:'editor-return'});this.store.append('verification.invalidated',{reason:'External editor handoff; saved file and Git state reconciled, prior checks are stale'});this.add(`Editor returned · ${result.cancelled?'cancelled':result.exitCode}\nSaved changes: ${result.changed.paths.join(', ')||'none observed'}\nPre-existing changes: ${result.changed.preexistingPaths.join(', ')||'none'}\nSource snapshot retained. Use /refresh; all execution grants revoked and prior verification is stale.`);
    }catch(error){if(intent)this.store.append('effect.completed',{effectId,state:'unknown'},intent.eventId);throw error;}
   }
   else if(text==='/app doctor'){const {doctor}=await import('../app-inspection/service');this.add(JSON.stringify(await doctor(),null,2));}
   else if(text.startsWith('/app run ')){
    const {readFlow}=await import('../cli/app');const {digestFlow,approveFlow}=await import('../app-inspection/service');const {runInspection}=await import('../agent/inspection');
    const flow=await readFlow(text.slice(9).trim());const grant=approveFlow(flow,this.root,'explicit-user');this.active=new AbortController();this.update({running:true});
    if(!await this.requestApproval(digestFlow(flow),JSON.stringify({checkout:this.root,origins:grant.origins,flow},null,2)+'\nBrowser navigation and actions can mutate the development application.',this.active.signal)){this.add('Browser flow denied. No browser was started.');return;}
    const result=await runInspection({root:this.root,flow,store:this.store,signal:this.active.signal,onEvent:event=>{if(event.type==='inspection.event')this.update({status:'App Inspection · '+JSON.parse(String(event.payload.event)).operation});}});
    this.add(`App Inspection · ${result.report.status}\n${result.report.checks.map(check=>`${check.id} · ${check.status} · ${check.provenance}`).join('\n')}\nLocal report: ${result.reportPath}`);
    if(result.exitCode!==0)return;
   }
   else if(text==='/providers')this.add(presets.map(p=>`${p.id} · ${p.locality.toUpperCase()} · ${new URL(p.baseUrl).host}`).join('\n'));
   else if(text.startsWith('/connect ')){
    const parts=text.trim().split(/\s+/);if(parts.length!==3)throw new Error('Use /connect provider model');const preset=presets.find(p=>p.id===parts[1]);if(!preset)throw new Error('Unknown provider; use /providers');
    this.selection={provider:preset.id,model:parts[2]!};this.update({connection:`${preset.locality.toUpperCase()} · ${preset.id} / ${parts[2]}`});this.add(`Selected ${preset.id} / ${parts[2]}. Capabilities unchecked. ${preset.locality==='remote'?'Submitting a task sends repository context to this provider and can incur charges.':'Repository context stays on the selected local endpoint.'}`);
   }else if(text==='/disconnect'){this.selection=undefined;this.update({connection:undefined});this.policy.revoke();}
   else if(text.startsWith('/verify ')){const argv=argvJSON(text.slice(8));this.verifiers.push({id:`user-check-${this.verifiers.length+1}`,argv,required:true,provenance:'user-approved',timeoutMs:60000});this.add('Required verifier configured. Execution will request exact-action approval.');}
   else if(text==='/checks')this.add(JSON.stringify(this.verifiers,null,2));
   else if(text==='/reconcile'){const {captureRepositoryState}=await import('../tools/repository-state');const snapshot=await captureRepositoryState(this.root);this.policy.revoke();this.store.append('repository.snapshot',{snapshot:JSON.stringify(snapshot),reason:'explicit-user-reconcile'});this.store.append('verification.invalidated',{reason:'User accepted current repository state; prior checks remain stale'});this.add(`Current repository recorded · ${snapshot.status}. Prior verification is stale; execution grants revoked. Pending effects remain unknown until separately reconciled.`);}
   else if(text==='/revoke'){this.policy.revoke();this.add('Execution grants revoked.');}
   else if(text.startsWith('/'))throw new Error('Unknown command; use /help');
   else {
    if(!this.selection){this.add('Choose /connect provider model before submitting a task. Draft retained.');return;}
    for(const reference of this.references.values())if(!await this.source.currentReference(reference)){this.add('Selected source changed. Detach the stale reference, refresh the file and select again before submission. No model request made.');return;}
    const selection=this.selection;const preset=presets.find(p=>p.id===selection.provider)!;
    this.active=new AbortController();this.update({running:true});this.add(`You · ${text}`);
    const credential=await this.vault.resolve(preset.id,preset.credentialNames);if(credential)this.store.addSecret(credential.value);
    const provider=createProvider(preset.id,credential?.value);
    const capabilities=await preflightCapabilities(provider,selection.model,preset.locality,this.active.signal);
    const result=await runTask({root:this.root,task:text,provider,providerId:preset.id,model:selection.model,capabilities,store:this.store,policy:this.policy,signal:this.active.signal,verifiers:this.verifiers,references:[...this.references.values()],onEvent:event=>this.event(event),approve:action=>this.approve(action,this.active!.signal)});
    this.add(`Task · ${result.status} · correctness ${result.correctness}`);
    if(result.exitCode!==0)return;
   }
   // Typing during a run is a new draft and must survive completion.
   if(this.model.draft===text)this.draft('');
  }catch{this.add('Operation could not continue. Draft retained; check connection, path or command syntax. Effects and verification remain recorded in this session.');}
  finally{this.active=undefined;this.resolveApproval(false);this.update({running:false});}
 }
}
