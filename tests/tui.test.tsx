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
