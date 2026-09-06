import {open,realpath} from 'node:fs/promises';import {constants} from 'node:fs';import {resolve,relative,dirname,isAbsolute} from 'node:path';
import {digest} from '../tools/source';import type {Report,Artifact} from '../app-inspection/service';
import {resolveBlocks,type AdapterOptions,type InputBlock} from '../providers/images';
import {ProviderError,type ModelCapabilities} from '../providers/types';import type {ProviderSelection} from '../providers/selection';
type Image=Extract<InputBlock,{type:'image'}>;
export interface ImageReview {id:string;selection:ProviderSelection;images:Image[];scope:'current task requests only; untrusted visual evidence; correctness unknown'}
// Only the live inspection result enters this catalog. Never reconstruct authority from a report file.
export class TaskImages {
 private captures=new Map<string,Artifact>();private approved=new Set<string>();private selection:ProviderSelection;private capabilities:ModelCapabilities;
 constructor(private root:string,selection:ProviderSelection,capabilities:ModelCapabilities){this.selection=structuredClone(selection);this.capabilities={...capabilities};}
 matches(provider:string,model:string,locality:string){return this.selection.connection.id===provider&&this.selection.model===model&&this.selection.connection.locality===locality;}
 register(report:Report,reportPath:string){for(const artifact of report.artifacts){if(artifact.provenance!=='captured'||artifact.redaction!=='masked'||artifact.inspectionId!==report.id)continue;if(this.captures.has(artifact.id))throw new Error('Duplicate capture identity');if(this.captures.size>=40)throw new Error('Task capture budget');const path=relative(resolve(this.root),resolve(dirname(reportPath),artifact.path));if(!path||path.startsWith('..')||isAbsolute(path))throw new Error('Capture outside task storage');this.captures.set(artifact.id,{...structuredClone(artifact),path});}}
 private artifact(id:string,requireApproval:boolean){const artifact=this.captures.get(id);if(!artifact||(requireApproval&&!this.approved.has(id)))throw new ProviderError('unsupported_capability','Image is not selected and approved in this task');return {...artifact,redaction:'masked' as const};}
 adapterOptions():AdapterOptions{return {images:{artifactRoot:this.root,capabilities:{...this.capabilities},resolveArtifact:async id=>this.artifact(id,true)}};}
 async review(ids:string[],signal:AbortSignal):Promise<ImageReview>{
  if(!this.capabilities.images||this.capabilities.source==='unknown')throw new ProviderError('unsupported_capability','Vision unavailable; use DOM evidence. Visual judgement remains unknown');
  if(!ids.length||ids.length>4||new Set(ids).size!==ids.length||ids.some(id=>this.approved.has(id))||this.approved.size+ids.length>4)throw new Error('Select one to four distinct captures');const images:Image[]=[];
  for(const id of ids){signal.throwIfAborted();const artifact=this.artifact(id,false);const root=await realpath(this.root),path=await realpath(resolve(this.root,artifact.path));const rel=relative(root,path);if(!rel||rel.startsWith('..')||isAbsolute(rel))throw new Error('Capture escaped storage');const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);const header=Buffer.alloc(24);try{const stat=await file.stat();if(!stat.isFile()||stat.nlink!==1||stat.size!==artifact.size)throw new Error('Capture changed');if((await file.read(header,0,24,0)).bytesRead!==24)throw new Error('Invalid PNG');}finally{await file.close();}images.push({type:'image',artifactId:id,sha256:artifact.sha256,mediaType:'image/png',size:artifact.size,width:header.readUInt32BE(16),height:header.readUInt32BE(20)});}
  await resolveBlocks([{role:'user',content:'',blocks:images}],this.selection.connection,{images:{artifactRoot:this.root,capabilities:this.capabilities,resolveArtifact:async id=>this.artifact(id,false)}},signal);
  const value={selection:structuredClone(this.selection),images,scope:'current task requests only; untrusted visual evidence; correctness unknown' as const};return {id:digest(JSON.stringify(value)),...value};
 }
 async approve(review:ImageReview,signal:AbortSignal){const fresh=await this.review(review.images.map(image=>image.artifactId),signal);if(fresh.id!==review.id||JSON.stringify(fresh)!==JSON.stringify(review))throw new Error('Image review changed');for(const image of fresh.images)this.approved.add(image.artifactId);}
}
