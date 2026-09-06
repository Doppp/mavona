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
test('selected context persists and stale source blocks submission before capability inference',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-ui-reference-'));const store=new SessionStore(join(root,'.sessions'),'test');
 try{await writeFile(join(root,'order.rb'),'class Order\nend');const controller=new TuiController(root,store,()=>{});
  await controller.submit('/open order.rb');await controller.submit('/select 1:2');await controller.submit('/attach');expect(Object.keys(store.state.references)).toHaveLength(1);
  await writeFile(join(root,'order.rb'),'changed');await controller.submit('/connect ollama fixture');await controller.submit('Change selected code');expect(controller.model.messages.at(-1)?.text).toContain('Selected source changed');expect(store.events.some(e=>e.type==='task.started')).toBe(false);
  const restored=new TuiController(root,store,()=>{});await restored.submit('/references');expect(restored.model.messages.at(-1)?.text).toContain('order.rb:1–2');
 }finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('terminal reconciliation records an explanation while preserving unknown effect truth',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-ui-reconcile-'));await Bun.spawn(['git','init','-q',root]).exited;const store=new SessionStore(join(root,'.mavona','sessions','test'),'test');store.append('session.opened',{repository:root});store.append('effect.requested',{effectId:'interrupted',kind:'command'});
 try{const controller=new TuiController(root,store,()=>{});await controller.submit('/reconcile interrupted Inspected current worktree and application state');expect(store.state.effects.interrupted).toBe('unknown');expect(store.state.mutationAllowed).toBe(true);expect(controller.model.messages.at(-1)?.text).toContain('prior verification is stale');}
 finally{store.close();await rm(root,{recursive:true,force:true});}
});
test('file picker and selected-source copy preserve draft and make no provider request',async()=>{
 const root=await mkdtemp(join(tmpdir(),'mavona-ui-file-picker-'));await Bun.spawn(['git','init','-q',root]).exited;await mkdir(join(root,'config'));await mkdir(join(root,'app/models'),{recursive:true});await writeFile(join(root,'config/application.rb'),'');await writeFile(join(root,'app/models/order.rb'),'# 注文\nclass Order\nend\n');const store=new SessionStore(join(root,'.mavona/sessions/test'),'test');let copied='';
 try{const controller=new TuiController(root,store,()=>{},{suspend(){},resume(){},copy(text){copied=text;return true;}});controller.draft('unfinished task');await controller.openFiles('amord');expect(controller.model.picker?.items[0]?.path).toBe('app/models/order.rb');await controller.pickFile(controller.model.picker!.items[0]!.id);expect(controller.model.draft).toBe('unfinished task');await controller.submit('/select 1:2');controller.draft('unfinished task');controller.copySource();expect(controller.model.draft).toBe('unfinished task');expect(copied).toBe('# 注文\nclass Order');expect(store.events.some(event=>event.type==='provider.selected'||event.type==='tool.requested')).toBe(false);}
 finally{store.close();await rm(root,{recursive:true,force:true});}
});
