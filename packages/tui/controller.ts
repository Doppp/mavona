import {inspectionChoices,inspectionDrawer} from './inspection';
import {TaskImages} from '../agent/images';
import {listSessions} from '../sessions/lifecycle';
import {terminalCommands,commandChoices,commandHelp,type TerminalCommand} from './commands';
import {selectProvider,restoreSelection,selectionRecord,validModelId,type ProviderSelection} from '../providers/selection';
import {realpath} from 'node:fs/promises';
import {join,relative,dirname} from 'node:path';
import {digest} from '../tools/source';
import {fuzzyFiles} from '../tools/file-picker';
import {pendingWorktreeEffects} from '../tools/worktree';
import {inspectRepository,type RepositoryInspection} from '../rails/discovery';
import {SourceNavigator} from '../tools/source-navigation';
import type {SourceSelection} from '../tools/source';
import {SessionStore} from '../sessions/store';
import {ExecutionPolicy,type PreparedAction} from '../tools/policy';
import {runTask,type Verifier} from '../agent/loop';
import {CredentialVault} from '../providers/credentials';
import {createProvider,presets,preflightCapabilities,discoverModels} from '../providers/registry';
import {editorHandoff,type EditorAdapter} from '../tools/editor';
import {argvJSON} from '../cli/options';
import type {Envelope} from '../protocol/events';
import type {ScreenModel} from './screen';
export class TuiController {
 private vision=false;private sessions:ReturnType<typeof listSessions>=[];private argumentCommand:TerminalCommand|undefined;private repairAttempts:0|1=1;model:ScreenModel;verifiers:Verifier[]=[];
 private traceViewer:{url:string;stop:()=>void}|undefined;private editor:EditorAdapter|undefined;
 private source:SourceNavigator;private references=new Map<string,SourceSelection>();
 private files:string[]=[];private selection:ProviderSelection|undefined;
 private active:AbortController|undefined;private approval:((approved:boolean)=>void)|undefined;
 private policy:ExecutionPolicy;private vault=new CredentialVault();
 private models:string[]=[];private modelConnection:ProviderSelection['connection']|undefined;private connectionKind:'local'|'remote'='local';private pickerMode:'inspections'|'sessions'|'commands'|'command-arguments'|'files'|'pins'|'roots'|'models'|'connection-kinds'|'providers'='files';private roots:string[]=[];private railsPath:string;private inspection:RepositoryInspection|undefined;private discoveryPending:Promise<void>|undefined;
 private pins=new Map<string,{id:string;path:string;line:number;digest:string}>();
 constructor(private root:string,private store:SessionStore,private changed:(model:ScreenModel)=>void,private terminal?:{switchSession?:(id:string)=>Promise<void>;copy?:(text:string)=>boolean;suspend:()=>void|Promise<void>;resume:()=>void|Promise<void>}){
  this.policy=new ExecutionPolicy(root);this.source=new SourceNavigator(root);this.railsPath=store.state.railsRoot?join(root,store.state.railsRoot):root;
  for(const [id,value] of Object.entries(store.state.references))this.references.set(id,JSON.parse(value) as SourceSelection);
  const editor=store.events.findLast(event=>event.type==='editor.configured');if(editor)this.editor={argv:argvJSON(String(editor.payload.argv)),terminal:editor.payload.terminal===true};
  for(const event of store.events){if(event.schemaVersion!==1)continue;if(event.type==='source.pinned')this.pins.set(String(event.payload.pinId),{id:String(event.payload.pinId),path:String(event.payload.path),line:Number(event.payload.line),digest:String(event.payload.digest)});else if(event.type==='source.unpinned')this.pins.delete(String(event.payload.pinId));}
  const pane=Number(store.events.findLast(event=>event.type==='source.pane.resized')?.payload.percent??40);
  const repairPolicy=store.events.findLast(event=>event.type==='repair.policy');if(repairPolicy){if(repairPolicy.payload.maxAttempts!==0&&repairPolicy.payload.maxAttempts!==1)throw new Error('Unsupported repair policy');this.repairAttempts=repairPolicy.payload.maxAttempts;}
  const savedConnection=store.events.findLast(event=>event.type==='provider.configured'||event.type==='provider.disconnected');if(savedConnection?.type==='provider.configured')this.selection=restoreSelection(String(savedConnection.payload.configuration));
  this.model={...(this.selection?{connection:this.connectionLabel(this.selection)}:{}),sourcePanePercent:pane>=20&&pane<=40?pane:40,repository:root.split('/').pop()??root,status:'Discovering Rails application…',draft:store.state.draft,messages:store.state.messages.map(m=>({id:m.id,text:`${m.role}: ${m.text}`})),source:null};
 }
 private async openModels(connection:ProviderSelection['connection']){this.active=new AbortController();this.update({running:true});this.add(`Model discovery · ${connection.locality.toUpperCase()} · ${new URL(connection.baseUrl).host} · no repository context sent.`);try{const preset=presets.find(item=>item.id===connection.id);const credential=await this.vault.resolve(connection.id,preset?.credentialNames??[]);if(credential)this.store.addSecret(credential.value);this.models=(await discoverModels(connection,this.active.signal,credential?.value)).filter(validModelId).sort();this.modelConnection=connection;this.pickerMode='models';this.filterFiles('');this.add(`Model discovery · ${this.models.length} valid IDs · credential source ${credential?.source??'none'}. Selection sends no inference request.`);}catch{this.add(`Model discovery unavailable. Use /connect ${connection.id} MODEL ${connection.baseUrl} ${connection.locality} with an explicit model ID. Current selection retained.`);}finally{this.active=undefined;this.update({running:false});}}
 private connectionLabel(selection:ProviderSelection){return `${selection.connection.locality.toUpperCase()} · ${selection.connection.id} / ${selection.model} · ${new URL(selection.connection.baseUrl).host}`;}
 private select(selection:ProviderSelection){this.vision=false;this.selection=selection;this.modelConnection=undefined;this.models=[];this.policy.revoke();this.store.append('provider.configured',{configuration:selectionRecord(selection)});this.update({connection:this.connectionLabel(selection)});}
 private update(change:Partial<ScreenModel>){this.model={...this.model,...change};this.changed(this.model);}
 private add(text:string,id=Bun.randomUUIDv7()){this.update({messages:[...this.model.messages,{id,text:this.store.sanitizeText(text)}]});}
 async discover(){if(this.discoveryPending)return this.discoveryPending;const pending=this.loadDiscovery();this.discoveryPending=pending;try{await pending;}finally{if(this.discoveryPending===pending)this.discoveryPending=undefined;}}
 private async loadDiscovery(){const result=await inspectRepository(this.railsPath);this.inspection=result;this.roots=result.roots;
  if(this.root!==result.repository){const previous=await realpath(this.root);const rebase=(path:string)=>relative(result.repository,join(previous,path));this.source.rebaseRoot(result.repository,previous);this.root=result.repository;this.policy=new ExecutionPolicy(this.root);if(!this.store.state.unsupported)this.store.append('repository.selected',{repository:this.root});
   for(const [id,reference] of this.references){const moved={...reference,path:rebase(reference.path)};this.references.set(id,moved);if(!this.store.state.unsupported)this.store.append('draft.reference.added',{referenceId:id,reference:JSON.stringify(moved)});}
   for(const [id,pin] of this.pins){const moved={...pin,path:rebase(pin.path)};this.pins.set(id,moved);if(!this.store.state.unsupported)this.store.append('source.pinned',{pinId:id,path:moved.path,line:moved.line,digest:moved.digest});}
  }
  this.files=result.files;if(result.selectedRoot!==null){this.railsPath=join(this.root,result.selectedRoot);if(this.store.state.railsRoot!==result.selectedRoot&&!this.store.state.unsupported)this.store.append('rails.root.selected',{root:result.selectedRoot});}
  this.update({repository:this.root.split('/').pop()??this.root,source:this.source.current,status:result.status==='selected'?`Rails root ${result.selectedRoot} · Rails ${result.facts.railsVersion??'unknown'} · ${result.facts.testFrameworks.join(', ')||'tests unknown'} · runtime unchecked`:'Choose a Git-backed Rails application; static inspection remains available.'});
  if(result.status==='needs_decision'&&result.roots.length>1){this.pickerMode='roots';this.filterFiles('');}
 }
 async openRoots(){await this.discover();const result=await inspectRepository(this.root);this.roots=result.roots;this.pickerMode='roots';this.filterFiles('');}
 openInspection(id?:string){this.update({inspection:inspectionDrawer(this.store.events,id),picker:undefined});}
 closeInspection(){this.update({inspection:undefined});}
 openInspectionHistory(){this.pickerMode='inspections';this.filterFiles('');}
 async openSessions(){if(this.active){this.add('Finish or cancel the active task before switching sessions.');return;}this.sessions=listSessions(dirname(this.store.directory),200);this.pickerMode='sessions';this.filterFiles('');}
 openCommands(){this.argumentCommand=undefined;this.pickerMode='commands';this.filterFiles('');}
 async command(text:string){if(!text.startsWith('/app'))this.closeInspection();await this.submit(text,true);}
 draft(text:string){if(text===this.model.draft)return;const event=this.store.append('draft.changed',{text});this.update({draft:String(event.payload.text)});}
 async openFiles(query=''){await this.discover();if(this.inspection?.status==='needs_decision')return;this.pickerMode='files';this.filterFiles(query);}
 filterFiles(query:string){if(query.length>256)throw new Error('Picker filter budget');if(this.pickerMode==='inspections'){this.update({picker:{title:'Inspection history · recorded evidence',query,items:inspectionChoices(this.store.events).filter(choice=>choice.path.toLowerCase().includes(query.toLowerCase()))}});return;}if(this.pickerMode==='sessions'){this.update({picker:{title:'Sessions · up to 200 IDs · effects never replay',query,items:this.sessions.filter(session=>(session.id+' '+session.repository).toLowerCase().includes(query.toLowerCase())).map(session=>({id:'session:'+session.id,path:session.id+' · '+(session.repository??'unknown repository')+' · '+session.status+' · '+session.pendingEffects.length+' pending'+(session.archived?' · archived':'')}))}});return;}if(this.pickerMode==='commands'){this.update({picker:{title:'Commands · choose an action',query,items:commandChoices(query)}});return;}if(this.pickerMode==='command-arguments'){const command=this.argumentCommand;if(!command)return;this.update({picker:{title:command.command+' '+command.arguments,query,items:query.trim()?[{id:command.id,path:command.command+' '+query}]:[]}});return;}if(this.pickerMode==='connection-kinds'||this.pickerMode==='providers'){const choices=this.pickerMode==='connection-kinds'?[{id:'api',path:'Provider API key'},{id:'local',path:'Local model'},{id:'subscription',path:'Subscription · unavailable'},{id:'custom',path:'Custom compatible endpoint'}]:presets.filter(preset=>preset.locality===this.connectionKind).map(preset=>({id:'provider:'+preset.id,path:preset.id+' · '+preset.locality.toUpperCase()+' · '+new URL(preset.baseUrl).host}));this.update({picker:{title:this.pickerMode==='connection-kinds'?'Connect a model':'Choose provider',query,items:choices.filter(choice=>choice.path.toLowerCase().includes(query.toLowerCase()))}});return;}if(this.pickerMode==='models'){if(query.length>256)throw new Error('Model filter budget');const connection=this.modelConnection??this.selection?.connection;if(!connection)return;const models=this.models.filter(model=>model.toLowerCase().includes(query.toLowerCase())).slice(0,200);this.update({picker:{title:'Models · '+connection.id,query,items:models.map(model=>({id:digest(JSON.stringify([connection.id,connection.baseUrl,model])),path:model}))}});return;}if(this.pickerMode==='roots'){const choices=query.trim()?fuzzyFiles(this.roots,query):this.roots.map(path=>({id:digest(path),path}));this.update({picker:{title:'Rails roots',query,items:choices}});return;}const pins=[...this.pins.values()];const choices=fuzzyFiles(this.pickerMode==='pins'?pins.map(pin=>pin.path):this.files,query);this.update({picker:{title:this.pickerMode==='pins'?'Pinned sources':'Files',query,items:this.pickerMode==='pins'?choices.map(choice=>pins.find(pin=>pin.path===choice.path)!):choices}});}
 closePicker(){this.update({picker:undefined});}
 async pickFile(id:string){const choice=this.model.picker?.items.find(item=>item.id===id);if(!choice){this.add('File choice expired. Refresh the file picker.');return;}if(this.pickerMode==='inspections'){this.openInspection(id.slice('inspection:'.length));return;}if(this.pickerMode==='sessions'){const session=this.sessions.find(item=>'session:'+item.id===id);if(!session||this.active)return;if(session.id===this.store.sessionId){this.closePicker();return;}if(session.status==='corrupt'||session.status==='unsupported'){this.add('Session unavailable for resume; inspect/export its canonical history first.');return;}if(!this.terminal?.switchSession){this.add('Session switching unavailable in this surface. Use mavona resume '+session.id);return;}try{await this.terminal.switchSession(session.id);}catch{this.add('Destination session could not be acquired. Current session and draft retained.');if(this.model.picker)this.update({picker:{...this.model.picker,title:'Session unavailable · current draft retained · Enter retry'}});}return;}if(this.pickerMode==='commands'){const command=terminalCommands.find(item=>item.id===id);if(!command)return;if(command.arguments){this.argumentCommand=command;this.pickerMode='command-arguments';this.filterFiles('');}else{this.closePicker();await this.command(command.command);}return;}if(this.pickerMode==='command-arguments'){const command=this.argumentCommand;if(!command||command.id!==id)return;const args=this.model.picker!.query;if(!args.trim())return;this.closePicker();this.argumentCommand=undefined;await this.command(command.command+' '+args);return;}if(this.pickerMode==='connection-kinds'){if(choice.id==='subscription'){this.update({picker:undefined});this.add('Subscription unavailable: subscription_agent_loop_unsupported. Official login does not provide supported inference beneath Mavona’s own loop; no login or token import is offered.');}else if(choice.id==='custom'){this.update({picker:undefined});this.add('Use /connect ID MODEL URL local|remote. Local endpoints must be loopback; remote endpoints require HTTPS. Credentials use environment or Mavona secure storage; never paste values into the composer.');}else{this.connectionKind=choice.id==='local'?'local':'remote';this.pickerMode='providers';this.filterFiles('');}return;}if(this.pickerMode==='providers'){const preset=presets.find(item=>'provider:'+item.id===choice.id);if(!preset)return;this.update({picker:undefined});await this.openModels({id:preset.id,baseUrl:preset.baseUrl,locality:preset.locality});return;}if(this.pickerMode==='models'){const connection=this.modelConnection??this.selection?.connection;if(!connection||!this.models.includes(choice.path))return;this.select({connection,model:choice.path});this.update({picker:undefined});this.add('Model selected explicitly; capabilities will be checked before the next task.');return;}if(this.pickerMode==='roots'){if(!this.roots.includes(choice.path))return;this.railsPath=join(this.root,choice.path);this.policy.revoke();if(this.verifiers.length){this.verifiers=[];this.add('Application changed; reconfigure explicit verifier commands for this root.');}this.update({picker:undefined});await this.discover();return;}try{await this.source.open(choice.path);if(choice.line)this.source.goto(Math.min(choice.line,this.source.current!.lineCount));this.update({source:this.source.current,picker:undefined});if(choice.digest&&choice.digest!==this.source.current!.digest)this.add('Source changed since pinning. Showing the current worktree snapshot; prior evidence is not refreshed.');}catch{this.add('Selected file is unavailable, changed or excluded. Refresh the file picker; the current snapshot is retained.');}}
 copySource(){try{const selected=this.source.reference();if(Buffer.byteLength(selected.text)>256*1024)throw new Error('Copy limit');const sent=this.terminal?.copy?.(selected.text)??false;this.add(sent?'Copy request sent to terminal clipboard.':'Terminal clipboard unavailable. Selected text remains visible.');}catch{this.add('Select a source range with /select start:end before copying; maximum 256 KiB.');}}
 closeSource(){this.source.close();this.update({source:null});}
 cancel(){this.traceViewer?.stop();this.traceViewer=undefined;this.active?.abort();this.resolveApproval(false);}
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
  }else if(event.type==='context.compacted'){this.add('Context compacted locally · '+String(event.payload.beforeBytes)+' → '+String(event.payload.afterBytes)+' bytes. Canonical evidence retained.');
  }else if(event.type==='task.repair.started'){this.add('Repair attempt '+String(event.payload.attempt)+' / 1 · objective verifier failure. Prior checks are stale until rerun.');}
  else if(event.type==='inspection.completed'){this.add('App Inspection · '+String(event.payload.status)+'\nLocal report: '+String(event.payload.reportPath));}
  else if(event.type==='verification.selected'){this.add('Verifier selection · execution still requires approval\n'+String(event.payload.selection));}
  else if(event.type==='tool.requested')this.add(`Tool · ${event.payload.name} · running`,event.eventId);
  else if(event.type==='verification.completed')this.add(`Verification · ${event.payload.checkId} · ${event.payload.state}\n${event.payload.result}`,event.eventId);
  else if(event.type==='usage.reported')this.update({usage:`${event.payload.inputTokens} in / ${event.payload.outputTokens} out`});
 }
 async submit(text:string,preserveDraft=false){
  if(this.active)return;
  if(!preserveDraft)this.draft(text);
  try{
   if(text==='/help')this.add(commandHelp()+'\nEffects require existing approval. Never paste credentials into the composer.');
   else if(text==='/app')this.openInspection();
   else if(text==='/app history')this.openInspectionHistory();
   else if(text.startsWith('/app show '))this.openInspection(text.slice(10).trim());
   else if(text==='/sessions')await this.openSessions();
   else if(text==='/commands')this.openCommands();
   else if(text==='/rails'){await this.discover();this.add('Declared Rails evidence · runtime unchecked\n'+JSON.stringify(this.inspection,null,2));}
   else if(text==='/roots')await this.openRoots();
   else if(text==='/files'||text.startsWith('/files ')){await this.openFiles(text.slice(7).trim());}
   else if(text==='/pin'){const source=this.source.current;if(!source||source.diff)throw new Error('Open source before pinning');if(this.pins.size>=64&&!Array.from(this.pins.values()).some(pin=>pin.path===source.path))throw new Error('Pinned source limit');const pin={id:[...this.pins.values()].find(pin=>pin.path===source.path)?.id??digest('source-pin:'+source.path),path:source.path,line:source.line,digest:source.digest};this.store.append('source.pinned',{pinId:pin.id,path:pin.path,line:pin.line,digest:pin.digest});this.pins.set(pin.id,pin);this.add(`Pinned ${pin.path}:${pin.line} · ${pin.id}`);}
   else if(text==='/pins'){this.pickerMode='pins';this.filterFiles('');}
   else if(text.startsWith('/unpin ')){const id=text.slice(7).trim();if(!this.pins.has(id))throw new Error('Unknown source pin');this.store.append('source.unpinned',{pinId:id});this.pins.delete(id);this.add('Source pin removed.');}
   else if(text.startsWith('/pane ')){const percent=Number(text.slice(6));if(!Number.isInteger(percent)||percent<20||percent>40)throw new Error('Pane width is 20–40 percent');this.store.append('source.pane.resized',{percent});this.update({sourcePanePercent:percent});}
   else if(text==='/copy')this.copySource();
   else if(text==='/close')this.closeSource();
   else if(text.startsWith('/open ')){await this.discover();const match=/^(.*?)(?::([1-9]\d*))?$/.exec(text.slice(6).trim())!;const prefix=this.inspection?.selectedRoot;const path=prefix&&prefix!=='.'&&!match[1]!.startsWith(prefix+'/')?join(prefix,match[1]!):match[1]!;await this.source.open(path,Number(match[2]??1));this.update({source:this.source.current});}
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
    try{const result=await editorHandoff({root:this.root,path:this.source.current.path,line:this.source.current.line,adapter:this.editor,effect:{effectId,sessionId:this.store.sessionId},afterReturn:result=>{if(intent)this.store.append('effect.completed',{effectId,state:result.cancelled?'unknown':result.exitCode===0?'passed':'failed'},intent.eventId);this.store.append('repository.snapshot',{snapshot:JSON.stringify(result.after),reason:'editor-return'});this.store.append('verification.invalidated',{reason:'External editor handoff; saved file and Git state reconciled, prior checks are stale'});},policy:this.policy,signal:this.active.signal,approve:action=>this.approve(action,this.active!.signal),suspend:()=>this.terminal?.suspend(),resume:()=>this.terminal?.resume(),beforeLaunch:()=>{this.store.append('verification.invalidated',{reason:'External editor handoff started; prior checks are stale'});intent=this.store.append('effect.requested',{effectId,kind:'command'});},confirmReturn:async()=>{if(!await this.requestApproval('editor-return-'+effectId,'Have you finished editing and saved the files? Y returns to Mavona and reconciles the current worktree. N leaves the effect unknown.',this.active!.signal))throw new Error('Editor return not confirmed');}});
     this.add(`Editor returned · ${result.cancelled?'cancelled':result.exitCode}\nSaved changes: ${result.changed.paths.join(', ')||'none observed'}\nPre-existing changes: ${result.changed.preexistingPaths.join(', ')||'none'}\nSource snapshot retained. Use /refresh; all execution grants revoked and prior verification is stale.`);
    }catch(error){if(intent&&this.store.state.effects[effectId]==='unknown')this.store.append('effect.completed',{effectId,state:'unknown'},intent.eventId);throw error;}
   }
   else if(text==='/app stop'){this.traceViewer?.stop();this.traceViewer=undefined;this.add('Local trace replay stopped.');}
   else if(text.startsWith('/app replay ')){const {startTraceViewer}=await import('../app-inspection/viewer');const viewer=await startTraceViewer(text.slice(12).trim());this.traceViewer?.stop();this.traceViewer=viewer;this.add('Local offline trace replay: '+viewer.url+'\nUse /app stop or Ctrl+C to stop the owned viewer.');}
   else if(text==='/app doctor'){const {doctor}=await import('../app-inspection/service');this.add(JSON.stringify(await doctor(),null,2));}
   else if(text.startsWith('/app run ')){
    const {readFlow}=await import('../cli/app');const {digestFlow,approveFlow}=await import('../app-inspection/service');const {runInspection}=await import('../agent/inspection');
    const flow=await readFlow(text.slice(9).trim());const grant=approveFlow(flow,this.root,'explicit-user');this.active=new AbortController();this.update({running:true});
    if(!await this.requestApproval(digestFlow(flow),JSON.stringify({checkout:this.root,origins:grant.origins,flow},null,2)+'\nBrowser navigation and actions can mutate the development application.',this.active.signal)){this.add('Browser flow denied. No browser was started.');return;}
    const result=await runInspection({root:this.root,flow,store:this.store,signal:this.active.signal,onEvent:event=>{if(event.type==='inspection.event')this.update({status:'App Inspection · '+JSON.parse(String(event.payload.event)).operation});}});
    this.add(`App Inspection · ${result.report.status}\nProfile: ${result.report.profile?.id??'unknown'} · ${result.report.profile?.status??'unknown'} · other profiles unchecked: ${result.report.profile?.unchecked.join(', ')??'unknown'}\n${result.report.checks.map(check=>`${check.id} · ${check.status} · ${check.provenance}`).join('\n')}\nLocal report: ${result.reportPath}`);
    if(this.model.inspection)this.openInspection(result.report.id);if(result.exitCode!==0)return;
   }
   else if(text.startsWith('/vision ')){const mode=text.slice(8).trim();if(!this.selection||!['on','off'].includes(mode))throw new Error('Select a provider, then /vision on|off');this.vision=mode==='on';this.add(this.vision?'Vision capability explicitly overridden for the current model. Each exact image selection still requires approval. Switching models or resuming clears this override.':'Vision input disabled. DOM evidence remains available.');}
   else if(text==='/providers')this.add(presets.map(p=>`${p.id} · ${p.locality.toUpperCase()} · ${new URL(p.baseUrl).host}`).join('\n'));
   else if(text==='/connect'){this.pickerMode='connection-kinds';this.filterFiles('');}
   else if(text.startsWith('/connect ')){
    const parts=text.trim().split(/\s+/);if(parts.length!==3&&parts.length!==5)throw new Error('Use /connect provider model [URL local|remote]');const selected=selectProvider(parts[1]!,parts[2]!,parts[3],parts[4]);this.select(selected);this.add(`Selected ${selected.connection.id} / ${selected.model}. Capabilities unchecked. ${selected.connection.locality==='remote'?'Submitting a task sends repository context to this provider and can incur charges.':'Repository context stays on the selected local endpoint.'}`);
   }else if(text==='/models'){if(!this.selection)throw new Error('Select a connection first');await this.openModels(this.selection.connection);
   }else if(text==='/disconnect'){this.vision=false;this.selection=undefined;this.models=[];this.store.append('provider.disconnected',{reason:'Explicit user disconnect'});this.update({connection:undefined,picker:undefined});this.policy.revoke();}
   else if(text.startsWith('/repair ')){const value=text.slice(8).trim();if(value!=='0'&&value!=='1')throw new Error('Repair attempts must be zero or one');this.repairAttempts=value==='0'?0:1;this.store.append('repair.policy',{maxAttempts:this.repairAttempts});this.add('Maximum objective repair attempts: '+this.repairAttempts+' · existing task budgets still apply.');}
   else if(text==='/acceptance'){const {latestAcceptanceReview}=await import('../verification/adoption');const review=latestAcceptanceReview(this.store);this.add(review?'Acceptance review · inspect before/after, then /adopt ID explanation. Adoption does not execute or pass checks.\n'+JSON.stringify(review,null,2):'No changed acceptance criteria awaiting review.');}
   else if(text.startsWith('/adopt ')){const match=/^([^ ]+) (.+)$/s.exec(text.slice(7));if(!match)throw new Error('Use /adopt REVIEW_ID explanation after /acceptance');const {adoptRecordedAcceptance}=await import('../verification/adoption');await adoptRecordedAcceptance(this.store,match[1]!,match[2]!);this.add('Exact reviewed acceptance adopted. Correctness remains unknown until independent checks execute.');}
   else if(text.startsWith('/verify ')){await this.discover();const argv=argvJSON(text.slice(8));this.verifiers.push({id:`user-check-${this.verifiers.length+1}`,argv,required:true,provenance:'user-approved',timeoutMs:60000,cwd:this.inspection?.selectedRoot??'.'});this.add('Required verifier configured. Execution will request exact-action approval.');}
   else if(text==='/checks')this.add(JSON.stringify(this.verifiers,null,2));
   else if(text.startsWith('/reconcile ')){const match=/^\/reconcile (\S+) (.+)$/s.exec(text);if(!match)throw new Error('Use /reconcile EFFECT_ID explanation of inspected current state');const {reconcileEffect}=await import('../sessions/reconciliation');const result=await reconcileEffect(this.store,match[1]!,match[2]!);this.policy.revoke();this.add(`Effect ${result.effectId} reconciled. Outcome remains ${result.outcome}; prior verification is stale.`);}
   else if(text==='/effects'){const worktree=await pendingWorktreeEffects(this.root);this.add(JSON.stringify({worktree,session:Object.entries(this.store.state.effects).map(([effectId,outcome])=>({effectId,outcome,reconciled:Object.hasOwn(this.store.state.reconciledEffects,effectId)}))},null,2));}
   else if(text==='/reconcile'){const {captureRepositoryState}=await import('../tools/repository-state');const snapshot=await captureRepositoryState(this.root);this.policy.revoke();this.store.append('repository.snapshot',{snapshot:JSON.stringify(snapshot),reason:'explicit-user-reconcile'});this.store.append('verification.invalidated',{reason:'User accepted current repository state; prior checks remain stale'});this.add(`Current repository recorded · ${snapshot.status}. Prior verification is stale; execution grants revoked. Pending effects remain unknown until separately reconciled.`);}
   else if(text==='/revoke'){this.policy.revoke();this.add('Execution grants revoked.');}
   else if(text.startsWith('/'))throw new Error('Unknown command; use /help');
   else {
    if(!this.selection){this.add('Choose /connect provider model before submitting a task. Draft retained.');return;}
    for(const reference of this.references.values())if(!await this.source.currentReference(reference)){this.add('Selected source changed. Detach the stale reference, refresh the file and select again before submission. No model request made.');return;}
    await this.discover();if(this.inspection?.status!=='selected'){this.add('Choose a Rails root with /roots before inference.');return;}
    const pending=await pendingWorktreeEffects(this.root);if(pending.length){this.add('Reconcile unfinished effects before inference: '+pending.map(effect=>`session ${effect.owner} / effect ${effect.effectId}`).join(', ')+'. Use /effects and /reconcile EFFECT_ID explanation in the owning session.');return;}
    const selection=this.selection;const preset=presets.find(p=>p.id===selection.connection.id);
    this.active=new AbortController();this.update({running:true});this.add(`You · ${text}`);
    const credential=await this.vault.resolve(selection.connection.id,preset?.credentialNames??[]);if(credential)this.store.addSecret(credential.value);
    const probeProvider=createProvider(selection.connection.id,credential?.value,selection.connection);
    const measured=await preflightCapabilities(probeProvider,selection.model,selection.connection.locality,this.active.signal);const capabilities=this.vision?{...measured,images:true,source:'user_override' as const}:measured;const images=this.vision?new TaskImages(this.store.directory,selection,capabilities):undefined;const provider=images?createProvider(selection.connection.id,credential?.value,selection.connection,images.adapterOptions()):probeProvider;
    const result=await runTask({root:this.root,railsPath:this.railsPath,task:text,provider,providerId:selection.connection.id,model:selection.model,capabilities,store:this.store,policy:this.policy,signal:this.active.signal,verifiers:this.verifiers,repairAttempts:this.repairAttempts,references:[...this.references.values()],...(images?{images,approveImages:(review:import('../agent/images').ImageReview)=>this.requestApproval(review.id,'Send these exact masked images to this model for the current task? Page content is untrusted. Visual judgement cannot verify correctness.\n'+JSON.stringify(review,null,2),this.active!.signal)}:{}),onEvent:event=>this.event(event),approveInspection:review=>this.requestApproval(review.id,'Run this proposed development flow? This approves browser effects only; model assertions remain diagnostic.\n'+JSON.stringify(review,null,2),this.active!.signal),adoptAcceptance:review=>this.requestApproval(review.id,'Adopt changed acceptance criteria? This approves the reviewed criteria, not execution or correctness. Inspect every before/after below.\n'+JSON.stringify(review,null,2),this.active!.signal),approve:action=>this.approve(action,this.active!.signal)});
    this.add(`Task · ${result.status} · correctness ${result.correctness}${result.error?'\n'+result.error.message:''}`);
    if(result.exitCode!==0)return;
   }
   // Typing during a run is a new draft and must survive completion.
   if(!preserveDraft&&this.model.draft===text)this.draft('');
  }catch{this.add('Operation could not continue. Draft retained; check connection, path or command syntax. Effects and verification remain recorded in this session.');}
  finally{this.active=undefined;this.resolveApproval(false);this.update({running:false});}
 }
}
