import {inspectRepository} from '../rails/discovery';
import {readSource} from '../tools/source';
import {SessionStore} from '../sessions/store';
import {ExecutionPolicy,type PreparedAction} from '../tools/policy';
import {runTask,type Verifier} from '../agent/loop';
import {CredentialVault} from '../providers/credentials';
import {createProvider,presets,preflightCapabilities} from '../providers/registry';
import {argvJSON} from '../cli/options';
import type {Envelope} from '../protocol/events';
import type {ScreenModel} from './screen';
export class TuiController {
 model:ScreenModel;verifiers:Verifier[]=[];
 private files:string[]=[];private selection:{provider:string;model:string}|undefined;
 private active:AbortController|undefined;private approval:((approved:boolean)=>void)|undefined;
 private policy:ExecutionPolicy;private vault=new CredentialVault();
 constructor(private root:string,private store:SessionStore,private changed:(model:ScreenModel)=>void){
  this.policy=new ExecutionPolicy(root);
  this.model={repository:root.split('/').pop()??root,status:'Discovering Rails application…',draft:store.state.draft,messages:store.state.messages.map(m=>({id:m.id,text:`${m.role}: ${m.text}`})),source:null};
 }
 private update(change:Partial<ScreenModel>){this.model={...this.model,...change};this.changed(this.model);}
 private add(text:string,id=Bun.randomUUIDv7()){this.update({messages:[...this.model.messages,{id,text:this.store.sanitizeText(text)}]});}
 async discover(){const result=await inspectRepository(this.root);this.files=result.files;this.update({status:result.status==='selected'?`Rails ${result.facts.railsVersion??'unknown'} · ${result.facts.testFrameworks.join(', ')||'tests unknown'} · runtime unchecked`:'Choose a Git-backed Rails application; static inspection remains available.'});}
 draft(text:string){if(text===this.model.draft)return;const event=this.store.append('draft.changed',{text});this.update({draft:String(event.payload.text)});}
 closeSource(){this.update({source:null});}
 cancel(){this.active?.abort();this.resolveApproval(false);}
 resolveApproval(approved:boolean){const resolve=this.approval;this.approval=undefined;this.update({approval:undefined});resolve?.(approved);}
 private approve(action:PreparedAction,signal:AbortSignal):Promise<boolean>{
  if(signal.aborted)return Promise.resolve(false);
  return new Promise(resolve=>{const cancelled=()=>this.resolveApproval(false);signal.addEventListener('abort',cancelled,{once:true});this.approval=value=>{signal.removeEventListener('abort',cancelled);resolve(value);};this.update({approval:{id:action.identity,text:JSON.stringify({checkout:action.root,action:action.action,executable:action.executable,settingsDigest:action.settingsDigest},null,2)+'\nRepository commands execute application code; not an OS sandbox.'}});});
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
   if(text==='/help')this.add('/files [query] · /open path[:line] · /close\n/connect provider model · /disconnect · /providers\n/verify ["command","argument"] · /checks · /revoke\nType a task after connecting. Effects require approval. Credentials come from environment or OS secure storage; never paste them into the composer.');
   else if(text==='/files'||text.startsWith('/files ')){const query=text.slice(7).trim().toLowerCase();this.add(this.files.filter(p=>p.toLowerCase().includes(query)).slice(0,200).join('\n')||'No matching Rails files.');}
   else if(text==='/close')this.closeSource();
   else if(text.startsWith('/open ')){const match=/^(.*?)(?::([1-9]\d*))?$/.exec(text.slice(6).trim())!;const source=await readSource(this.root,match[1]!);const line=Number(match[2]??1);if(line>source.text.split('\n').length)throw new Error('Line outside source');this.update({source:{...source,line}});}
   else if(text==='/providers')this.add(presets.map(p=>`${p.id} · ${p.locality.toUpperCase()} · ${new URL(p.baseUrl).host}`).join('\n'));
   else if(text.startsWith('/connect ')){
    const parts=text.trim().split(/\s+/);if(parts.length!==3)throw new Error('Use /connect provider model');const preset=presets.find(p=>p.id===parts[1]);if(!preset)throw new Error('Unknown provider; use /providers');
    this.selection={provider:preset.id,model:parts[2]!};this.update({connection:`${preset.locality.toUpperCase()} · ${preset.id} / ${parts[2]}`});this.add(`Selected ${preset.id} / ${parts[2]}. Capabilities unchecked. ${preset.locality==='remote'?'Submitting a task sends repository context to this provider and can incur charges.':'Repository context stays on the selected local endpoint.'}`);
   }else if(text==='/disconnect'){this.selection=undefined;this.update({connection:undefined});this.policy.revoke();}
   else if(text.startsWith('/verify ')){const argv=argvJSON(text.slice(8));this.verifiers.push({id:`user-check-${this.verifiers.length+1}`,argv,required:true,provenance:'user-approved',timeoutMs:60000});this.add('Required verifier configured. Execution will request exact-action approval.');}
   else if(text==='/checks')this.add(JSON.stringify(this.verifiers,null,2));
   else if(text==='/revoke'){this.policy.revoke();this.add('Execution grants revoked.');}
   else if(text.startsWith('/'))throw new Error('Unknown command; use /help');
   else {
    if(!this.selection){this.add('Choose /connect provider model before submitting a task. Draft retained.');return;}
    const selection=this.selection;const preset=presets.find(p=>p.id===selection.provider)!;
    this.active=new AbortController();this.update({running:true});this.add(`You · ${text}`);
    const credential=await this.vault.resolve(preset.id,preset.credentialNames);if(credential)this.store.addSecret(credential.value);
    const provider=createProvider(preset.id,credential?.value);
    const capabilities=await preflightCapabilities(provider,selection.model,preset.locality,this.active.signal);
    const result=await runTask({root:this.root,task:text,provider,providerId:preset.id,model:selection.model,capabilities,store:this.store,policy:this.policy,signal:this.active.signal,verifiers:this.verifiers,onEvent:event=>this.event(event),approve:action=>this.approve(action,this.active!.signal)});
    this.add(`Task · ${result.status} · correctness ${result.correctness}`);
    if(result.exitCode!==0)return;
   }
   // Typing during a run is a new draft and must survive completion.
   if(this.model.draft===text)this.draft('');
  }catch{this.add('Operation could not continue. Draft retained; check connection, path or command syntax. Effects and verification remain recorded in this session.');}
  finally{this.active=undefined;this.resolveApproval(false);this.update({running:false});}
 }
}
