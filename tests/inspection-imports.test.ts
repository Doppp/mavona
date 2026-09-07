import {expect,test} from 'bun:test';
import {link,mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {PNG} from 'pngjs';
import {approvedImageImport,prepareImageImport} from '../packages/app-inspection/imports';

test('image import review binds contained regular PNG bytes and refuses drift or linked files',async()=>{const directory=await mkdtemp(join(tmpdir(),'mavona-import-policy-')),root=join(directory,'repo'),outside=join(directory,'outside.png');await mkdir(root);const png=(red:number)=>{const image=new PNG({width:2,height:2});for(let index=0;index<image.data.length;index+=4){image.data[index]=red;image.data[index+3]=255;}return PNG.sync.write(image);};try{await writeFile(join(root,'one.png'),png(1));const review=await prepareImageImport(root,'one.png');expect((await approvedImageImport(root,'one.png',review.id)).length).toBe(review.size);await writeFile(join(root,'one.png'),png(2));await expect(approvedImageImport(root,'one.png',review.id)).rejects.toThrow('fresh review');await writeFile(outside,png(3));await expect(prepareImageImport(root,outside)).rejects.toThrow('outside');await link(outside,join(root,'linked.png'));await expect(prepareImageImport(root,'linked.png')).rejects.toThrow('Invalid imported image file');}finally{await rm(directory,{recursive:true,force:true});}});
