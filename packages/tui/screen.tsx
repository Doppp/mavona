import {Transcript} from './transcript';
import {SourceBody} from './source-body';
import { createSignal, createEffect, Show } from 'solid-js';
import { useKeyboard, useRenderer, useTerminalDimensions } from '@opentui/solid';
import type { TextareaRenderable,ScrollBoxRenderable,SelectRenderable } from '@opentui/core';
export interface ScreenModel {inspection?:import('./inspection').InspectionDrawer|undefined;sourcePanePercent?:number;picker?:{title?:string;query:string;items:{id:string;path:string;line?:number;digest?:string}[]}|undefined;repository:string;status:string;draft:string;messages:{id:string;text:string}[];connection?:string|undefined;running?:boolean;usage?:string;approval?:{id:string;text:string}|undefined;source:{path:string;text:string;digest:string;line?:number;wrap?:boolean;query?:string;matches?:number[];selection?:{start:number;end:number};diff?:{text:string;beforeDigest:string;afterDigest:string;additions:number;deletions:number}}|null}
export interface ScreenActions {closeInspection?():void;openSessions?():Promise<void>;openCommands?():void;command?(text:string):Promise<void>;copySource?():void;openFiles?():Promise<void>;filterFiles?(query:string):void;pickFile?(id:string):Promise<void>;closePicker?():void;draft(text:string):void;submit(text:string):Promise<void>;closeSource():void;close():void;cancel?():void;approve?(approved:boolean):void}
export function Screen(props:{model:()=>ScreenModel;actions:ScreenActions}) {
 const renderer=useRenderer();const dimensions=useTerminalDimensions();const wide=()=>dimensions().width>=120; let input:TextareaRenderable|undefined;const [busy,setBusy]=createSignal(false);
 createEffect(()=>{const draft=props.model().draft;if(input&&input.plainText!==draft)input.setText(draft);});
 let approvalScroll:ScrollBoxRenderable|undefined;
 let inspectionScroll:ScrollBoxRenderable|undefined;
 let transcriptScroll:ScrollBoxRenderable|undefined;let sourceScroll:ScrollBoxRenderable|undefined;let lastSourcePosition='';
 const positionSource=()=>{const source=props.model().source;const key=source?`${source.path}:${source.digest}:${source.line}:${source.diff?.afterDigest??'source'}`:'';if(sourceScroll&&source&&key!==lastSourcePosition&&sourceScroll.scrollHeight>0){sourceScroll.scrollTo({x:0,y:Math.max(0,(source.line??1)-1)});lastSourcePosition=key;}};
 let picker:SelectRenderable|undefined;
 let lastInterrupt=0;let lastEscape=0;
 useKeyboard(key=>{
  if(props.model().approval){
   key.preventDefault();if(['up','down','pageup','pagedown','home','end'].includes(key.name)){if(key.name==='home')approvalScroll?.scrollTo(0);else if(key.name==='end')approvalScroll?.scrollTo(approvalScroll.scrollHeight);else approvalScroll?.scrollBy((key.name==='up'||key.name==='pageup'?-1:1)*(key.name.startsWith('page')?8:1));return;}if(key.name==='y'&&!key.ctrl)props.actions.approve?.(true);else if(key.name==='n'||key.name==='escape')props.actions.approve?.(false);else if(key.ctrl&&key.name==='c')props.actions.cancel?.();return;
  }
  if(props.model().picker){if(key.name==='escape'||key.ctrl&&key.name==='c'){key.preventDefault();props.actions.closePicker?.();}else if(key.name==='down'||key.name==='up'){key.preventDefault();if(key.name==='down')picker?.moveDown();else picker?.moveUp();}else if(key.name==='return'){key.preventDefault();const option=picker?.getSelectedOption();if(typeof option?.value==='string')void props.actions.pickFile?.(option.value);}return;}
  if(key.ctrl&&key.name==='end'&&!props.model().source&&!props.model().inspection){key.preventDefault();transcriptScroll?.scrollTo(transcriptScroll.scrollHeight);return;}
  if(key.ctrl&&key.shift&&key.name==='c'&&props.model().source){key.preventDefault();props.actions.copySource?.();return;}
  if(key.ctrl&&key.name==='o'){key.preventDefault();void props.actions.openSessions?.();return;}
  if(key.ctrl&&key.name==='p'){key.preventDefault();props.actions.openCommands?.();return;}
  if(key.ctrl&&(key.name==='d'||key.name==='r')){key.preventDefault();void props.actions.command?.(key.name==='d'?'/diff':'/rails');return;}
  if(props.model().inspection){if(key.name==='escape'||key.ctrl&&key.name==='c'){key.preventDefault();props.actions.closeInspection?.();return;}if(['up','down','pageup','pagedown','home','end'].includes(key.name)){key.preventDefault();if(key.name==='home')inspectionScroll?.scrollTo(0);else if(key.name==='end')inspectionScroll?.scrollTo(inspectionScroll.scrollHeight);else inspectionScroll?.scrollBy((key.name==='up'||key.name==='pageup'?-1:1)*(key.name.startsWith('page')?Math.max(1,dimensions().height-10):1));return;}}
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
  <Show when={props.model().picker} fallback={<box height={0}/>}><box border borderStyle="single" flexDirection="column" height={12}><text>{props.model().picker?.title??'Files'} · type to filter · ↑↓ choose · Enter choose · Esc close</text><input value={props.model().picker?.query??''} focused={!!props.model().picker&&!props.model().approval} maxLength={256} onInput={value=>props.actions.filterFiles?.(value)} /><select ref={value=>{picker=value;}} options={props.model().picker?.items.map(item=>({name:item.path+(item.line?':'+item.line:''),description:'',value:item.id}))??[]} showDescription={false} showScrollIndicator={true} flexGrow={1}/></box></Show>
  <Show when={props.model().inspection} fallback={<box flexDirection="row" flexGrow={1}>
   <scrollbox id="transcript" visible={!props.model().source||wide()} ref={value=>{transcriptScroll=value;}} stickyScroll={true} stickyStart="bottom" flexGrow={1} width={wide()&&props.model().source?`${100-(props.model().sourcePanePercent??40)}%`:'100%'}><text>{props.model().status}</text><Transcript messages={()=>props.model().messages}/></scrollbox>
   <Show when={props.model().source}>
    <box flexDirection="column" width={wide()?`${props.model().sourcePanePercent??40}%`:'100%'} flexShrink={0}>
     <text height={2} flexShrink={0}>{props.model().source?.path}{'\n'}{props.model().source?.diff?`Diff ${props.model().source?.diff?.beforeDigest.slice(0,8)} → ${props.model().source?.diff?.afterDigest.slice(0,8)}`:'Source · worktree snapshot'} · line {props.model().source?.line??1} · {props.model().source?.selection?`selected ${props.model().source?.selection?.start}–${props.model().source?.selection?.end}`:'Esc close'}</text>
     <scrollbox ref={value=>{sourceScroll=value;lastSourcePosition='';}} renderBefore={positionSource} scrollX={!props.model().source?.wrap} flexGrow={1}><SourceBody source={()=>props.model().source!}/></scrollbox>
    </box>
   </Show>
  </box>}><box flexDirection="column" flexGrow={1}><text height={2}>App Inspection · recorded evidence{'\n'}↑↓ PgUp/PgDn scroll · Esc close · Ctrl+P commands</text><scrollbox ref={value=>{inspectionScroll=value;}} flexGrow={1}><text>{props.model().inspection?.text}</text></scrollbox></box></Show>
  <Show when={props.model().approval} fallback={<box height={0}/>}><box flexDirection="column" border borderStyle="double" height={Math.min(14,Math.max(6,dimensions().height-10),Math.max(5,(props.model().approval?.text.split('\n').length??1)+4))} flexShrink={0}><text height={2} flexShrink={0}>Approve exact action? · Y approve · N/Esc deny · PgUp/PgDn scroll</text><scrollbox ref={value=>{approvalScroll=value;}} flexGrow={1} minHeight={0}><text>{props.model().approval?.text}</text></scrollbox></box></Show>
  <box borderStyle="single" border={true} minHeight={4} maxHeight={8}>
   <textarea ref={value=>{input=value;}} focused={!props.model().approval&&!props.model().picker&&!props.model().inspection} initialValue={props.model().draft} placeholder="/help · /files · /open path · /connect provider model"
    onContentChange={()=>props.actions.draft(input?.plainText??'')}
    keyBindings={[{name:'return',action:'submit'},{name:'return',shift:true,action:'newline'},{name:'j',ctrl:true,action:'newline'},{name:'linefeed',action:'newline'}]}
    onSubmit={()=>{void submit();}} />
  </box>
  <text height={1}>STRICT · {busy()||props.model().running?'working':'idle'} · {props.model().usage??''} · Enter submit · Ctrl+J newline · Ctrl+C twice exit</text>
 </box>;
}
