import { render } from '@opentui/solid';
import { createCliRenderer } from '@opentui/core';
import { createSignal } from 'solid-js';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { inspectRepository } from '../rails/discovery';
import { readSource } from '../tools/source';
import { SessionStore } from '../sessions/store';
import { Screen, type ScreenModel } from './screen';
export async function startTui():Promise<void> {
 const sessionId=Bun.randomUUIDv7();
 const base=process.platform==='darwin'?join(homedir(),'Library','Application Support','Mavona'):join(process.env.XDG_DATA_HOME??join(homedir(),'.local','share'),'mavona');
 const store=new SessionStore(join(base,'sessions',sessionId),sessionId);
 store.append('session.opened',{repository:process.cwd()});
 const [model,setModel]=createSignal<ScreenModel>({repository:process.cwd().split('/').pop()??'',status:'Discovering Rails application…',draft:'',messages:[],source:null});
 const renderer=await createCliRenderer({exitOnCtrlC:false});
 const close=()=>store.close(); renderer.on('destroy',close);
 let files:string[]=[];let root=process.cwd();
 try {
  await render(()=> <Screen model={model} actions={{
   draft(text){setModel(m=>({...m,draft:text}));},
   async submit(text){
    store.append('draft.changed',{text});
    const add=(text:string)=>setModel(m=>({...m,messages:[...m.messages,{id:Bun.randomUUIDv7(),text}]}));
    try{
     if(text==='/help')add('/files · list discovered files\n/open <path> · local source snapshot\n/close · return to conversation\nNo provider is connected. Coding tasks are unavailable in this development slice.');
     else if(text==='/files')add(files.slice(0,200).join('\n')||'No Rails files discovered.');
     else if(text==='/close')setModel(m=>({...m,source:null}));
     else if(text.startsWith('/open ')){const source=await readSource(root,text.slice(6).trim());setModel(m=>({...m,source}));}
     else {add('Task not submitted: provider integration is not yet implemented. Your draft is retained.');return;}
     setModel(m=>({...m,draft:''}));store.append('draft.changed',{text:''});
    }catch{add('Source unavailable: check path, excluded-file policy, encoding or size. Draft retained.');}
   },closeSource(){setModel(m=>({...m,source:null}));},close
  }}/>,renderer);
  const discovery=await inspectRepository(root);root=discovery.repository;files=discovery.files;
  setModel(m=>({...m,status:discovery.status==='selected'?`Rails ${discovery.facts.railsVersion??'unknown'} · ${discovery.facts.testFrameworks.join(', ')||'tests unknown'} · runtime unchecked`:'Choose a Git-backed Rails application. Static diagnostics available through mavona inspect.'}));
 }catch(error){renderer.destroy();store.close();throw error;}
}
