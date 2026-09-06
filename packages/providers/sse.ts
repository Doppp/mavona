export async function* decodeSSE(stream:ReadableStream<Uint8Array>,maxRecordBytes=1024*1024,maxTotalBytes=16*1024*1024):AsyncGenerator<string>{
 const reader=stream.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let buffer='';let total=0;let data:string[]=[];let recordBytes=0;
 try{
  while(true){
   const {value,done}=await reader.read();
   if(done){buffer+=decoder.decode();if(buffer.length||data.length)throw new Error('malformed incomplete SSE record');break;}
   total+=value.byteLength;if(total>maxTotalBytes)throw new Error('Provider output limit');
   buffer+=decoder.decode(value,{stream:true});
   let newline:number;
   while((newline=buffer.indexOf('\n'))>=0){
    const line=buffer.slice(0,newline).replace(/\r$/,'');buffer=buffer.slice(newline+1);
    recordBytes+=new TextEncoder().encode(line).byteLength;if(recordBytes>maxRecordBytes)throw new Error('Provider record limit');
    if(line===''){if(data.length)yield data.join('\n');data=[];recordBytes=0;}
    else if(line.startsWith('data:'))data.push(line.slice(5).replace(/^ /,''));
   }
   if(buffer.length>maxRecordBytes)throw new Error('Provider record limit');
  }
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
