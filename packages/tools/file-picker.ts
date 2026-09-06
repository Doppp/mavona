import {digest,excluded} from './source';
export interface FileChoice {id:string;path:string;score:number}
export function fuzzyFiles(paths:readonly string[],query:string,limit=200):FileChoice[]{
 if(query.length>256||!Number.isSafeInteger(limit)||limit<1||limit>200)throw new Error('File picker query limit');const needle=Array.from(query.toLowerCase().replace(/\s+/g,''));const choices:FileChoice[]=[];
 for(const path of new Set(paths)){if(excluded(path))continue;const characters=Array.from(path.toLowerCase());let position=0,score=0,previous=-2;for(const letter of needle){const index=characters.indexOf(letter,position);if(index<0){score=-Infinity;break;}score+=10+(index===previous+1?12:0)+(index===0||'/_.-'.includes(characters[index-1]!)?15:0)-Math.min(index-position,20);previous=index;position=index+1;}if(score===-Infinity)continue;score-=characters.length/100;choices.push({id:digest(path),path,score});}
 return choices.sort((a,b)=>b.score-a.score||(a.path<b.path?-1:a.path>b.path?1:0)).slice(0,limit);
}
