import {createMemo,For,onCleanup,Show} from 'solid-js';
import {sourceSyntax} from './source-highlighting';
import type {TerminalThemeName} from './theme';
import {terminalTheme} from './theme';
import type {TranscriptMessage} from './transcript-items';
interface Chunk {id:string;messages:readonly TranscriptMessage[];text:string;rich:boolean}
/** Keep native renderables bounded while retaining every stable transcript item. */
export function Transcript(props:{messages:()=>readonly TranscriptMessage[];theme?:()=>TerminalThemeName|undefined}){
 const style=sourceSyntax(props.theme?.());onCleanup(()=>style.destroy());
 let previousMessages:readonly TranscriptMessage[]|undefined;let previous:Chunk[]=[];
 const chunks=createMemo(()=>{const messages=props.messages();if(messages===previousMessages)return previous;const next:Chunk[]=[];const richAfter=Math.max(0,messages.length-500);for(let offset=0;offset<messages.length;offset+=250){const slice=messages.slice(offset,offset+250),rich=offset+slice.length>richAfter||slice.some(message=>message.expanded),old=previous[offset/250];next.push(old&&old.rich===rich&&old.messages.length===slice.length&&old.messages.every((message,index)=>message===slice[index])?old:{id:slice[0]!.id,messages:slice,text:slice.map(message=>message.text+(message.expanded&&message.detail?'\n'+message.detail:'')).join('\n\n')+'\n\n',rich});}previousMessages=messages;previous=next;return next;});
 return <For each={chunks()}>{chunk=><Show when={chunk.rich} fallback={<text id={'transcript-'+chunk.id}>{chunk.text}</text>}><box id={'transcript-'+chunk.id} flexDirection="column"><For each={chunk.messages}>{message=>message.kind==='assistant'?<markdown content={message.text} syntaxStyle={style} fg={terminalTheme(props.theme?.()).foreground} conceal={true} streaming={true} internalBlockMode="top-level" tableOptions={{style:'columns',wrapMode:'word'}} />:<box flexDirection="column" border={message.kind==='tool'||message.kind==='verification'} borderStyle={message.kind==='verification'?'double':'single'}><text>{message.text}</text><Show when={message.expanded&&message.detail}><text>{message.detail}</text></Show></box>}</For></box></Show>}</For>;
}
