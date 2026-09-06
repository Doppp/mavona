import {lstat} from 'node:fs/promises';import {resolve,relative,join,dirname} from 'node:path';
import {excluded,isWithin} from './source';
export interface FileIdentity {dev:string;ino:string}
export interface MutationScope {rootIdentity:FileIdentity;parents:({path:string}&FileIdentity)[];fileIdentity?:FileIdentity}
export const identity=(s:{dev:bigint;ino:bigint}):FileIdentity=>({dev:String(s.dev),ino:String(s.ino)});
export async function mutationScope(root:string,path:string,create=false):Promise<MutationScope>{
 if(typeof path!=='string'||!path||path.length>4096||path.includes('\0'))throw new Error('Invalid mutation path');const target=resolve(root,path);const normalized=relative(root,target);
 if(!isWithin(root,target)||!normalized||normalized!==path||excluded(normalized))throw new Error('Mutation path outside or excluded');
 const rootMetadata=await lstat(root,{bigint:true});if(!rootMetadata.isDirectory()||rootMetadata.isSymbolicLink())throw new Error('Invalid mutation checkout');
 const scope:MutationScope={rootIdentity:identity(rootMetadata),parents:[]};const parts=dirname(path)==='.'?[]:dirname(path).split('/');let prefix='';let missing=false;
 for(const part of parts){prefix=prefix?prefix+'/'+part:part;if(missing)continue;try{const metadata=await lstat(join(root,prefix),{bigint:true});if(!metadata.isDirectory()||metadata.isSymbolicLink())throw new Error('Mutation parent symlink or non-directory refused');scope.parents.push({path:prefix,...identity(metadata)});}catch(error){if(create&&(error as NodeJS.ErrnoException).code==='ENOENT')missing=true;else throw error;}}
 if(!missing){try{const leaf=await lstat(target,{bigint:true});if(create)throw new Error('Creation target already exists');if(leaf.isSymbolicLink())throw new Error('Mutation target symlink refused');if(!leaf.isFile())throw new Error('Mutation target must be a regular file');if(leaf.nlink!==1n)throw new Error('Mutation of a hardlink refused');scope.fileIdentity=identity(leaf);}catch(error){if(!create||(error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
 return scope;
}
