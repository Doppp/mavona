import {render} from '@opentui/solid';
import {createCliRenderer} from '@opentui/core';
import {createSignal} from 'solid-js';
import {join} from 'node:path';
import {SessionStore} from '../sessions/store';
import {dataDirectory} from '../cli/run';
import {Screen,type ScreenModel} from './screen';
import {TuiController} from './controller';
export async function startTui(existing?:SessionStore):Promise<void>{
 const id=Bun.randomUUIDv7();const store=existing??new SessionStore(join(dataDirectory(),'sessions',id),id);
 const root=store.state.repository??process.cwd();if(!store.events.length)store.append('session.opened',{repository:root});
 const [model,setModel]=createSignal<ScreenModel>({repository:root,status:'Starting…',draft:store.state.draft,messages:[],source:null});
 const controller=new TuiController(root,store,next=>setModel(next));setModel(controller.model);
 const renderer=await createCliRenderer({exitOnCtrlC:false});
 const close=()=>{controller.cancel();store.close();};renderer.on('destroy',close);
 try{await render(()=> <Screen model={model} actions={{draft:text=>controller.draft(text),submit:text=>controller.submit(text),closeSource:()=>controller.closeSource(),cancel:()=>controller.cancel(),approve:value=>controller.resolveApproval(value),close}}/>,renderer);await controller.discover();}
 catch(error){renderer.destroy();store.close();throw error;}
}
