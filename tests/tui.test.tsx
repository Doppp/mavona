import { test, expect } from 'bun:test';
import { testRender } from '@opentui/solid';
import { createSignal } from 'solid-js';
import { Screen, type ScreenModel } from '../packages/tui/screen';
test('real renderer preserves bracketed multiline paste without submission through resize',async()=>{
 const [model,setModel]=createSignal<ScreenModel>({repository:'orders',status:'unchecked',draft:'',messages:[],source:null});
 const submitted:string[]=[];
 const setup=await testRender(()=> <Screen model={model} actions={{draft(text){setModel(m=>({...m,draft:text}));},async submit(text){submitted.push(text);},closeSource(){},close(){}}}/>,{width:80,height:24});
 try {
  await setup.renderOnce();expect(setup.captureCharFrame()).toContain('NO PROVIDER');
  await setup.mockInput.pasteBracketedText('注文\nhello 👋é');await setup.renderOnce();
  expect(submitted).toEqual([]);expect(model().draft).toBe('注文\nhello 👋é');
  setup.resize(60,18);await setup.renderOnce();expect(model().draft).toBe('注文\nhello 👋é');
  setup.mockInput.pressEnter();await setup.renderOnce();expect(submitted).toEqual(['注文\nhello 👋é']);
 }finally {setup.renderer.destroy();}
});
test('approval owns focus and streamed state renders while preserving the draft',async()=>{
 const [model,setModel]=createSignal<ScreenModel>({repository:'orders',status:'unchecked',draft:'keep this',messages:[],source:null});
 const decisions:boolean[]=[];let cancelled=false;
 const setup=await testRender(()=> <Screen model={model} actions={{draft:text=>setModel(m=>({...m,draft:text})),async submit(){},closeSource(){},close(){},approve:value=>{decisions.push(value);setModel(m=>({...m,approval:undefined}));},cancel:()=>{cancelled=true;}}}/>,{width:80,height:24});
 try{
  await setup.renderOnce();setModel(m=>({...m,running:true,messages:[{id:'stream-1',text:'Actual streamed output'}],approval:{id:'approval-1',text:'["bun","test"]'}}));await setup.renderOnce();
  expect(setup.captureCharFrame()).toContain('Actual streamed output');expect(setup.captureCharFrame()).toContain('Approve exact action');
  setup.mockInput.pressKey('y');await setup.renderOnce();expect(decisions).toEqual([true]);expect(model().draft).toBe('keep this');
  setup.mockInput.pressKey('c',{ctrl:true});await setup.renderOnce();expect(cancelled).toBe(true);expect(model().draft).toBe('keep this');
 }finally{setup.renderer.destroy();}
});
test('source opens at the requested line and background output preserves its snapshot and draft',async()=>{
 const text=Array.from({length:100},(_,i)=>`source-line-${i+1}`).join('\n');const [model,setModel]=createSignal<ScreenModel>({repository:'orders',status:'ready',draft:'preserved',messages:[],source:{path:'注文.rb',text,digest:'snapshot',line:40,wrap:false}});
 const setup=await testRender(()=> <Screen model={model} actions={{draft:value=>setModel(m=>({...m,draft:value})),async submit(){},closeSource:()=>setModel(m=>({...m,source:null})),close(){}}}/>,{width:80,height:24});
 try{await setup.renderOnce();await setup.renderOnce();expect(setup.captureCharFrame()).toContain('source-line-40');setModel(m=>({...m,messages:[{id:'new-output',text:'Background stream'}]}));await setup.renderOnce();expect(setup.captureCharFrame()).toContain('source-line-40');expect(model().draft).toBe('preserved');expect(model().source?.digest).toBe('snapshot');}
 finally{setup.renderer.destroy();}
});
test('native fuzzy picker owns keyboard focus and opens the selected stable identity without altering draft',async()=>{
 const [model,setModel]=createSignal<ScreenModel>({repository:'orders',status:'ready',draft:'unfinished task',messages:[],source:null,picker:{query:'',items:[{id:'id-order',path:'app/models/order.rb'},{id:'id-customer',path:'app/models/customer.rb'}]}});const picked:string[]=[];
 const setup=await testRender(()=> <Screen model={model} actions={{draft:text=>setModel(m=>({...m,draft:text})),async submit(){throw Error('Picker must not submit a task');},closeSource(){},close(){},filterFiles:query=>setModel(m=>({...m,picker:{...m.picker!,query}})),pickFile:async id=>{picked.push(id);setModel(m=>({...m,picker:undefined}));},closePicker:()=>setModel(m=>({...m,picker:undefined}))}}/>,{width:80,height:24});
 try{await setup.renderOnce();setup.mockInput.pressArrow('down');setup.mockInput.pressEnter();await setup.renderOnce();expect(picked).toEqual(['id-customer']);expect(model().draft).toBe('unfinished task');expect(setup.captureCharFrame()).toContain('unfinished task');}finally{setup.renderer.destroy();}
});
test('long transcript retains reading position during streaming and supports explicit jump to latest',async()=>{
 const [model,setModel]=createSignal<ScreenModel>({repository:'orders',status:'ready',draft:'preserved',messages:Array.from({length:1000},(_,i)=>({id:'message-'+i,text:'Transcript message '+i})),source:null});const setup=await testRender(()=> <Screen model={model} actions={{draft:text=>setModel(m=>({...m,draft:text})),async submit(){},closeSource(){},close(){}}}/>,{width:80,height:24});
 try{await setup.renderOnce();const scroll=setup.renderer.root.findDescendantById('transcript') as import('@opentui/core').ScrollBoxRenderable;scroll.scrollTo(30);await setup.renderOnce();const position=scroll.scrollTop;setModel(m=>({...m,messages:[...m.messages,{id:'latest',text:'Latest streamed message'}]}));await setup.renderOnce();expect(scroll.scrollTop).toBe(position);expect(model().draft).toBe('preserved');setup.mockInput.pressKey('END',{ctrl:true});await setup.renderOnce();expect(setup.captureCharFrame()).toContain('Latest streamed message');}
 finally{setup.renderer.destroy();}
});
test('source becomes a wide pane and closing its narrow overlay retains transcript position',async()=>{
 const [model,setModel]=createSignal<ScreenModel>({repository:'orders',status:'ready',draft:'preserved',messages:Array.from({length:100},(_,i)=>({id:'m-'+i,text:'Conversation message '+i})),source:null});const setup=await testRender(()=> <Screen model={model} actions={{draft:text=>setModel(m=>({...m,draft:text})),async submit(){},closeSource:()=>setModel(m=>({...m,source:null})),close(){}}}/>,{width:80,height:24});
 try{await setup.renderOnce();const transcript=setup.renderer.root.findDescendantById('transcript') as import('@opentui/core').ScrollBoxRenderable;transcript.scrollTo(20);await setup.renderOnce();const position=transcript.scrollTop;setModel(m=>({...m,source:{path:'order.rb',text:'class Order\nend',digest:'fixture',line:1}}));await setup.renderOnce();setup.resize(140,30);await setup.renderOnce();expect(setup.captureCharFrame()).toContain('Conversation message');expect(setup.captureCharFrame()).toContain('class Order');setup.resize(80,24);await setup.renderOnce();setup.mockInput.pressEscape();await setup.renderOnce();const returned=setup.renderer.root.findDescendantById('transcript') as import('@opentui/core').ScrollBoxRenderable;expect(returned.scrollTop).toBe(position);expect(model().draft).toBe('preserved');}
 finally{setup.renderer.destroy();}
});
