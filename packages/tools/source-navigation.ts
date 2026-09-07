import {readCommittedSource} from './source-history';
import {resolve,relative} from 'node:path';
import {sourceDiff,type SourceDiff} from './source-diff';
import {readSource,isWithin,selectLines,selectionIsCurrent,type SourceSnapshot,type SourceSelection} from './source';
export interface SourceView extends SourceSnapshot {line:number;wrap:boolean;query:string;matches:number[];selection?:SourceSelection;diff?:SourceDiff}
export class SourceNavigator {
 current:SourceView|null=null;private history:SourceView[]=[];
 constructor(private root:string){}
 rebaseRoot(root:string,previousRoot=this.root){const remap=(view:SourceView):SourceView=>{const absolute=resolve(previousRoot,view.path);if(!isWithin(root,absolute))throw new Error('Source snapshot outside new root');const path=relative(root,absolute);return {...view,path,...(view.selection?{selection:{...view.selection,path}}:{})};};this.history=this.history.map(remap);if(this.current)this.current=remap(this.current);this.root=root;}
 async open(path:string,line=1){const source=await readSource(this.root,path);if(!Number.isSafeInteger(line)||line<1||line>source.lineCount)throw new Error('Line outside source');if(this.current){this.history.push(this.current);if(this.history.length>30)this.history.shift();}this.current={...source,line,wrap:false,query:'',matches:[]};return this.current;}
 async openRevision(path:string,revision:string){const historical=await readCommittedSource(this.root,path,revision);if(this.current){this.history.push(this.current);if(this.history.length>30)this.history.shift();}this.current={...historical,line:1,wrap:false,query:'',matches:[]};}
 async showRevision(revision:string){const source=this.required();await this.openRevision(source.path,revision);}
 async showWorktree(){const source=this.required();await this.open(source.path,1);}
 back(){const previous=this.history.pop();if(previous)this.current=previous;return this.current;}
 goto(line:number){const source=this.required();if(!Number.isSafeInteger(line)||line<1||line>(source.diff?.text.split('\n').length??source.lineCount))throw new Error('Line outside source');this.current={...source,line};}
 search(query:string){if(!query||query.length>200)throw new Error('Search needs 1–200 literal characters');const source=this.required();const matches=(source.diff?.text??source.text).split('\n').flatMap((line,i)=>line.includes(query)?[i+1]:[]);this.current={...source,query,matches,line:matches.find(n=>n>=source.line)??matches[0]??source.line};}
 next(direction:1|-1){const source=this.required();const line=direction===1?source.matches.find(n=>n>source.line)??source.matches[0]:source.matches.findLast(n=>n<source.line)??source.matches.at(-1);if(line)this.current={...source,line};}
 select(start:number,end:number){const source=this.required();if(source.diff)throw new Error('Switch to source view before selecting source lines');this.current={...source,selection:selectLines(source,start,end)};}
 reference(){const selection=this.required().selection;if(!selection)throw new Error('Select a line range first');return structuredClone(selection);}
 async currentReference(reference:SourceSelection){return selectionIsCurrent(this.root,reference);}
 toggleWrap(){const source=this.required();this.current={...source,wrap:!source.wrap};}
 async refresh(){const source=this.required();const latest=source.revision==='worktree'?await readSource(this.root,source.path):await readCommittedSource(this.root,source.path,source.revision.slice(7));this.current={...latest,line:Math.min(source.line,latest.lineCount),wrap:source.wrap,query:'',matches:[]};}
 async showDiff(){const source=this.required();const after=await readSource(this.root,source.path);this.current={...source,diff:await sourceDiff(source,after),line:1,query:'',matches:[]};}
 showSource(){const {diff:_,...source}=this.required();this.current={...source,line:Math.min(source.line,source.lineCount),query:'',matches:[]};}
 close(){this.current=null;}
 private required(){if(!this.current)throw new Error('Open a source file first');return this.current;}
}
