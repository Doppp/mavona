import { createSignal, createEffect, For, Show } from 'solid-js';
import { useKeyboard, useRenderer } from '@opentui/solid';
import type { TextareaRenderable } from '@opentui/core';
export interface ScreenModel {repository:string;status:string;draft:string;messages:{id:string;text:string}[];connection?:string|undefined;running?:boolean;usage?:string;approval?:{id:string;text:string}|undefined;source:{path:string;text:string;digest:string;line?:number}|null}
export interface ScreenActions {draft(text:string):void;submit(text:string):Promise<void>;closeSource():void;close():void;cancel?():void;approve?(approved:boolean):void}
export function Screen(props:{model:()=>ScreenModel;actions:ScreenActions}) {
 const renderer=useRenderer(); let input:TextareaRenderable|undefined;const [busy,setBusy]=createSignal(false);
 createEffect(()=>{const draft=props.model().draft;if(input&&input.plainText!==draft)input.setText(draft);});
 let lastInterrupt=0;let lastEscape=0;
 useKeyboard(key=>{
  if(props.model().approval){
   key.preventDefault();if(key.name==='y'&&!key.ctrl)props.actions.approve?.(true);else if(key.name==='n'||key.name==='escape')props.actions.approve?.(false);else if(key.ctrl&&key.name==='c')props.actions.cancel?.();return;
  }
  if(key.name==='escape'&&props.model().running&&!props.model().source){key.preventDefault();if(Date.now()-lastEscape<1000)props.actions.cancel?.();lastEscape=Date.now();return;}
  if(key.name==='escape'&&props.model().source){props.actions.closeSource();return;}
  if(key.ctrl&&key.name==='c'){
   key.preventDefault();
   if(props.model().running){props.actions.cancel?.();return;}
   if(Date.now()-lastInterrupt<1000){props.actions.close();renderer.destroy();}
   else {input?.setText('');props.actions.draft('');lastInterrupt=Date.now();}
  }
 });
 const submit=async()=>{if(busy()||!input?.plainText.trim())return;setBusy(true);try{await props.actions.submit(input.plainText);input.setText(props.model().draft);}finally{setBusy(false);}};
 return <box flexDirection="column" width="100%" height="100%" paddingX={1}>
  <box height={3} borderStyle="single" border={['bottom']}><text><strong>Mavona</strong>  {props.model().repository}  ·  {props.model().connection??'NO PROVIDER'}</text></box>
  <Show when={props.model().source} fallback={<scrollbox flexGrow={1}><text>{props.model().status}</text><For each={props.model().messages}>{m=><box paddingY={1}><text>{m.text}</text></box>}</For></scrollbox>}>
   <box flexDirection="column" flexGrow={1}>
    <text>Source · worktree · {props.model().source?.path} · Esc close</text>
    <scrollbox flexGrow={1}><text>{props.model().source?.text.split('\n').map((line,i)=>`${String(i+1).padStart(4)}  ${line}`).join('\n')}</text></scrollbox>
   </box>
  </Show>
  <Show when={props.model().approval} fallback={<box height={0}/>}><box flexDirection="column" border borderStyle="double" maxHeight={14}><text>Approve exact action? · Y approve once · N deny · Esc deny</text><scrollbox><text>{props.model().approval?.text}</text></scrollbox></box></Show>
  <box borderStyle="single" border={true} minHeight={4} maxHeight={8}>
   <textarea ref={value=>{input=value;}} focused={!props.model().approval} initialValue={props.model().draft} placeholder="/help · /files · /open path · /connect provider model"
    onContentChange={()=>props.actions.draft(input?.plainText??'')}
    keyBindings={[{name:'return',action:'submit'},{name:'return',shift:true,action:'newline'},{name:'j',ctrl:true,action:'newline'},{name:'linefeed',action:'newline'}]}
    onSubmit={()=>{void submit();}} />
  </box>
  <text height={1}>STRICT · {busy()?'working':'idle'} · {props.model().usage??''} · Enter submit · Ctrl+J newline · Ctrl+C twice exit</text>
 </box>;
}
