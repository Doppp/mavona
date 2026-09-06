import {captureRepositoryState,type RepositoryState} from '../tools/repository-state';
import {readSource,digest} from '../tools/source';
import type {SessionStore} from '../sessions/store';
import type {Verifier} from '../agent/loop';
export interface AcceptanceFile {path:string;digest:string;text:string}
export interface AcceptanceSnapshot {schemaVersion:1;root:string;digest:string;files:AcceptanceFile[]}
export interface AcceptanceReview {schemaVersion:1;id:string;repositoryDigest:string;before:AcceptanceSnapshot;after:AcceptanceSnapshot;changes:{path:string;before:AcceptanceFile|null;after:AcceptanceFile|null}[];checks:{id:string;argv:string[];cwd:string;required:boolean}[]}
/** Capture criteria before inference. Persisted text is a sanitized review surface, never authority. */
export async function captureAcceptance(store:SessionStore,state:RepositoryState,verifiers:readonly Verifier[],prior?:AcceptanceSnapshot):Promise<AcceptanceSnapshot>{
 if(state.status!=='passed')throw new Error('Acceptance inspection requires a complete repository fingerprint');
 const paths=[...new Set([...Object.keys(state.files).filter(path=>/(?:^|\/)(?:test|spec)\//.test(path)),...verifiers.flatMap(check=>(check.criteria??[]).map(file=>file.path)),...prior?.files.map(file=>file.path)??[]])].sort();
 if(paths.length>1000)throw new Error('Acceptance file budget exceeded');const files:AcceptanceFile[]=[];let bytes=0;
 for(const path of paths){if(!state.files[path])continue;const source=await readSource(state.root,path,256*1024);if(source.digest!==state.files[path]!.digest)throw new Error('Acceptance changed while being captured');bytes+=Buffer.byteLength(source.text);if(bytes>8*1024*1024)throw new Error('Acceptance byte budget exceeded');files.push({path,digest:source.digest,text:store.sanitizeText(source.text)});}
 return {schemaVersion:1,root:state.root,digest:digest(JSON.stringify(files.map(({path,digest})=>({path,digest})))),files};
}
export function acceptanceBaseline(store:SessionStore):AcceptanceSnapshot|undefined {const event=store.events.findLast(event=>event.type==='acceptance.baseline');return event?JSON.parse(String(event.payload.snapshot)) as AcceptanceSnapshot:undefined;}
export function makeAcceptanceReview(before:AcceptanceSnapshot,after:AcceptanceSnapshot,state:RepositoryState,verifiers:readonly Verifier[]):AcceptanceReview{
 if(before.root!==after.root)throw new Error('Acceptance belongs to another repository');
 const checks=verifiers.map(({id,argv,cwd,required})=>({id,argv,cwd:cwd??'.',required}));const previous=new Map(before.files.map(file=>[file.path,file]));const current=new Map(after.files.map(file=>[file.path,file]));const changes=[...new Set([...previous.keys(),...current.keys()])].sort().filter(path=>previous.get(path)?.digest!==current.get(path)?.digest).map(path=>({path,before:previous.get(path)??null,after:current.get(path)??null}));
 return {schemaVersion:1,id:digest(JSON.stringify({root:state.root,before:before.digest,after:after.digest,repository:state.digest,checks})),repositoryDigest:state.digest,before,after,changes,checks};
}
export async function adoptAcceptance(store:SessionStore,review:AcceptanceReview,reason:string):Promise<void>{
 if(!reason.trim()||reason.length>4096)throw new Error('Adoption requires a bounded review reason');
 const state=await captureRepositoryState(review.after.root);const current=await captureAcceptance(store,state,[],review.after);
 if(state.digest!==review.repositoryDigest||current.digest!==review.after.digest)throw new Error('Reviewed acceptance or repository changed; review again');
 store.append('acceptance.adopted',{reviewId:review.id,reason:reason.trim()});store.append('acceptance.baseline',{snapshot:JSON.stringify(current)});store.append('verification.invalidated',{reason:'Acceptance explicitly adopted; checks still require independent execution'});
}
export function latestAcceptanceReview(store:SessionStore):AcceptanceReview|undefined {const event=store.events.findLast(event=>event.type==='acceptance.review.requested');return event?JSON.parse(String(event.payload.review)) as AcceptanceReview:undefined;}
export async function adoptRecordedAcceptance(store:SessionStore,reviewId:string,reason:string):Promise<void>{
 const review=latestAcceptanceReview(store);if(!review||review.id!==reviewId)throw new Error('Exact latest acceptance review ID required');if(store.state.repository!==review.after.root||!store.state.mutationAllowed)throw new Error('Reconcile session effects before adoption');
 const {WorktreeLease}=await import('../tools/worktree');const lease=await WorktreeLease.acquire(review.after.root,store.sessionId);try{await adoptAcceptance(store,review,reason);}finally{lease.close();}
}
