import {createMemo,For} from 'solid-js';
interface Message {id:string;text:string}
interface Chunk {id:string;messages:readonly Message[];text:string}
/** Keep native renderables bounded while retaining every message and its stable identity. */
export function Transcript(props:{messages:()=>readonly Message[]}){
 let previousMessages:readonly Message[]|undefined;let previous:Chunk[]=[];
 const chunks=createMemo(()=>{const messages=props.messages();if(messages===previousMessages)return previous;const next:Chunk[]=[];for(let offset=0;offset<messages.length;offset+=250){const slice=messages.slice(offset,offset+250);const old=previous[offset/250];next.push(old&&old.messages.length===slice.length&&old.messages.every((message,index)=>message===slice[index])?old:{id:slice[0]!.id,messages:slice,text:slice.map(message=>message.text).join('\n\n')+'\n\n'});}previousMessages=messages;previous=next;return next;});
 return <For each={chunks()}>{chunk=><text id={'transcript-'+chunk.id}>{chunk.text}</text>}</For>;
}
