import { InspectionService, approveFlow, parseFlow } from '../packages/app-inspection/service';
import { AuthenticationStore } from '../packages/app-inspection/authentication';
import { normalizePng, compareImages } from '../packages/app-inspection/images';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(req){const path=new URL(req.url).pathname;return new Response(path==='/frame'?'<label>Frame<input aria-label="Frame"></label>':path==='/download'?'token=COMPILED_CANARY':`<h1>Packaged inspection</h1><iframe data-testid="frame" src="/frame"></iframe><label>Upload<input type="file" aria-label="Upload"></label><button onclick="document.querySelector('h1').textContent=confirm('Continue?')?'Accepted':'Denied'">Confirm</button><a href="/download">Download</a>`,{headers:{'content-type':path==='/download'?'text/plain':'text/html','set-cookie':'session=COMPILED_CANARY; HttpOnly; SameSite=Lax; Path=/',...(path==='/download'?{'content-disposition':'attachment; filename="download.txt"'}:{})}});}});
const directory=await mkdtemp(join(tmpdir(),'mavona-inspection-spike-'));
const authDirectory=await mkdtemp(join(tmpdir(),'mavona-auth-spike-'));
const service=new InspectionService();
try{
 await writeFile(join(directory,'upload.txt'),'compiled upload');
 const flow=parseFlow({version:1,url:server.url.href,browser:process.argv[2]??'chromium',steps:[
  {op:'act',action:'select-frame',locator:{kind:'testId',value:'frame'},value:'frame'},
  {op:'act',action:'fill',locator:{kind:'label',value:'Frame'},value:'compiled frame'},
  {op:'assert',id:'packaged-frame',kind:'value',locator:{kind:'label',value:'Frame'},expected:'compiled frame',provenance:'user-approved',required:true},
  {op:'act',action:'main-frame'},
  {op:'act',action:'upload',locator:{kind:'label',value:'Upload'},value:'upload'},
  {op:'act',action:'click',locator:{kind:'role',value:'button',name:'Confirm'},dialog:{type:'confirm',decision:'accept'}},
  {op:'assert',id:'packaged-dom',kind:'text',expected:'Accepted',provenance:'user-approved',required:true},
  {op:'act',action:'download',locator:{kind:'role',value:'link',name:'Download'},value:'text'},
  {op:'capture'}]});
 const grant=approveFlow(flow,directory,'development-spike');const store=new AuthenticationStore(authDirectory);
 const started=await service.start(flow,grant,{artifactDirectory:directory});if(started.state!=='ready')throw new Error(started.reason);
 const reference=await service.saveAuthentication(store,{approved:true,expiresAt:Date.now()+60000});await service.stop();
 const report=await service.run(flow,grant,{artifactDirectory:directory,authentication:{store,referenceId:reference.id,reuseApproved:true},uploads:[{reference:'upload',path:join(directory,'upload.txt'),sha256:createHash('sha256').update('compiled upload').digest('hex')}],recording:{approved:true,includeObservations:true}});
 if(report.status!=='passed')throw new Error(report.reason??JSON.stringify(report.checks));
 const image=await readFile(join(directory,report.artifacts[0]!.path));const imported=normalizePng(image);const conditions={engine:report.artifacts[0]!.browser,viewport:{width:1280,height:720},fixtureRevision:'spike',fontsDigest:'spike',captureSettingsDigest:'spike'};
 if(compareImages(imported.bytes,imported.bytes,conditions,conditions,{reviewedBy:'development-spike',maxChangedPixelRatio:0}).status!=='passed')throw new Error('Compiled PNG comparison failed');
 if((await readFile(join(directory,report.downloads![0]!.path),'utf8')).includes('COMPILED_CANARY'))throw new Error('Compiled download redaction failed');
 console.log(JSON.stringify({status:report.status,engine:process.argv[2]??'chromium',browser:report.artifacts[0]!.browser,assertions:report.checks.length,captures:report.artifacts.length,downloads:report.downloads?.length,recording:!!report.recording,authentication:'explicit-reuse',rawTrace:'withheld'}));
}finally{await service.stop();server.stop(true);await rm(directory,{recursive:true,force:true});await rm(authDirectory,{recursive:true,force:true});}
