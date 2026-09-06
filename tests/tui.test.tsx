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
