import {registry} from 'playwright-core/lib/coreBundle';
import {createHash,randomUUID} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export type VideoReport={status:'unknown';reason:string}|{status:'passed';path:string;size:number;sha256:string;mediaType:'video/webm';redaction:'masked';sampling:'bounded-checkpoint-sequence';frames:number;framesPerSecond:2;reason:string};
/** Only already-masked JPEG frames enter the encoder; native browser video remains disabled. */
export class MaskedVideo{
 private frames:Buffer[]=[];private bytes=0;private failed=false;
 add(frame:Buffer){if(this.frames.length>=600||this.bytes+frame.length>64*1024*1024){this.failed=true;return;}this.frames.push(frame);this.bytes+=frame.length;}
 async finish(directory:string,budget=64*1024*1024):Promise<VideoReport>{
  if(this.failed||!this.frames.length||budget<1024){this.frames=[];return {status:'unknown',reason:'Masked video frame budget exceeded or no frames recorded'};}
  const workspace=await mkdtemp(join(directory,'.video-')),output=join(workspace,'encoded.webm');let child:ReturnType<typeof Bun.spawn>|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  try{const executable=registry.registry.findExecutable('ffmpeg')?.executablePath();if(!executable)throw new Error('Managed FFmpeg unavailable');
   child=Bun.spawn([executable,'-loglevel','error','-f','image2pipe','-framerate','2','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','vp8','-deadline','realtime','-threads','1','-b:v','1M','-t','300','-fs',String(Math.min(budget,64*1024*1024)),output],{stdin:Buffer.concat(this.frames),stdout:'ignore',stderr:'ignore',env:{PATH:'/usr/bin:/bin',LANG:'C'}});
   let timedOut=false;timer=setTimeout(()=>{timedOut=true;child?.kill('SIGKILL');},30000);const exit=await child.exited;if(exit!==0||timedOut)throw new Error('Video encoder unavailable or failed');const bytes=await readFile(output);if(bytes.length<4||bytes.length>=Math.min(budget,64*1024*1024)||bytes.subarray(0,4).toString('hex')!=='1a45dfa3')throw new Error('Invalid or oversized video');
   const path=randomUUID()+'.webm';await writeFile(join(directory,path),bytes,{mode:0o600,flag:'wx'});return {status:'passed',path,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),mediaType:'video/webm',redaction:'masked',sampling:'bounded-checkpoint-sequence',frames:this.frames.length,framesPerSecond:2,reason:'Masked frames at flow checkpoints, played at 2 fps; pauses between checkpoints are not preserved'};
  }catch{return {status:'unknown',reason:'Masked video encoding unavailable or exceeded its budget'};}finally{if(timer)clearTimeout(timer);this.frames=[];await rm(workspace,{recursive:true,force:true});}
 }
}
