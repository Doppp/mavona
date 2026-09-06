import {render} from '@opentui/solid';
import {createCliRenderer} from '@opentui/core';
import {createSignal} from 'solid-js';
import {join,dirname} from 'node:path';
import {resumeSession} from '../sessions/lifecycle';
import {SessionStore} from '../sessions/store';
import {dataDirectory} from '../cli/run';
import {Screen,type ScreenModel} from './screen';
import {captureTerminalModes,restoreTerminalModes} from './terminal-handoff';
import {TuiController} from './controller';
export async function startTui(existing?:SessionStore):Promise<void>{
 const id=Bun.randomUUIDv7();let store=existing??new SessionStore(join(dataDirectory(),'sessions',id),id);
 const root=store.state.repository??process.cwd();if(!store.events.length)store.append('session.opened',{repository:root});
 const [model,setModel]=createSignal<ScreenModel>({repository:root,status:'Starting…',draft:store.state.draft,messages:[],source:null});
 const renderer=await createCliRenderer({exitOnCtrlC:false,exitSignals:['SIGQUIT','SIGABRT','SIGHUP','SIGPIPE','SIGBUS']});
 let pendingExit=false;let terminalModes:string|undefined;
 let controller:TuiController;
 const makeController=(session:SessionStore)=>{let next:TuiController;next=new TuiController(session.state.repository??root,session,model=>{if(controller!==next)return;setModel(model);if(pendingExit&&!model.running)renderer.destroy();},{switchSession:async targetId=>{
  if(controller.model.running)throw new Error('Active session cannot switch');const acquired=resumeSession(dirname(store.directory),targetId);let replacement:TuiController;try{replacement=makeController(acquired);}catch(error){acquired.close();throw error;}
  const previous=store;controller.cancel();store=acquired;controller=replacement;setModel(controller.model);previous.close();try{await controller.discover();}catch{setModel({...controller.model,status:'Session resumed; Rails discovery unavailable. Use /roots to retry. Effects were not replayed.'});}
 },copy:text=>renderer.copyToClipboardOSC52(text),suspend:()=>{renderer.suspend();terminalModes=captureTerminalModes();},resume:()=>{try{if(terminalModes)restoreTerminalModes(terminalModes);}finally{terminalModes=undefined;renderer.resume();}}});return next;};
 controller=makeController(store);setModel(controller.model);
 const interrupt=()=>{if(controller.model.running)controller.cancel();else renderer.destroy();};
 const terminate=()=>{pendingExit=true;controller.cancel();if(!controller.model.running)renderer.destroy();};
 process.on('SIGINT',interrupt);process.on('SIGTERM',terminate);
 const close=()=>{process.off('SIGINT',interrupt);process.off('SIGTERM',terminate);controller.cancel();store.close();};renderer.on('destroy',close);
 try{await render(()=> <Screen model={model} actions={{openSessions:()=>controller.openSessions(),openCommands:()=>controller.openCommands(),command:text=>controller.command(text),copySource:()=>controller.copySource(),openFiles:()=>controller.openFiles(),filterFiles:query=>controller.filterFiles(query),pickFile:id=>controller.pickFile(id),closePicker:()=>controller.closePicker(),draft:text=>controller.draft(text),submit:text=>controller.submit(text),closeSource:()=>controller.closeSource(),cancel:()=>controller.cancel(),approve:value=>controller.resolveApproval(value),close}}/>,renderer);await controller.discover();}
 catch(error){renderer.destroy();store.close();throw error;}
}
