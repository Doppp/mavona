import {test,expect} from 'bun:test';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {SessionStore} from '../packages/sessions/store';
import {TuiController} from '../packages/tui/controller';
test('terminal controller persists drafts and opens source without inference',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-ui-controller-'));const store=new SessionStore(join(root,'.sessions'),'test');
 try{await mkdir(join(root,'app'));await writeFile(join(root,'app/order.rb'),'class Order\nend\n');
 const controller=new TuiController(root,store,()=>{});controller.draft('unfinished 注文');expect(store.state.draft).toBe('unfinished 注文');
 await controller.submit('/open app/order.rb:2');expect(controller.model.source?.path).toBe('app/order.rb');expect(controller.model.source?.line).toBe(2);
 expect(store.events.some(e=>e.type==='provider.selected')).toBe(false);
 await controller.submit('change order');expect(controller.model.messages.at(-1)?.text).toContain('/connect');
 expect(controller.model.draft).toBe('change order');
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('connection selection and verifier configuration make no inference calls',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-ui-connect-'));const store=new SessionStore(join(root,'.sessions'),'test');
 try{const controller=new TuiController(root,store,()=>{});await controller.submit('/connect ollama fixture');expect(controller.model.connection).toContain('LOCAL');
 await controller.submit('/verify ["bun","test"]');expect(controller.verifiers[0]?.argv).toEqual(['bun','test']);
 expect(store.events.some(e=>e.type==='tool.requested')).toBe(false);
 await controller.submit('/connect missing model');expect(controller.model.connection).toContain('ollama');
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
