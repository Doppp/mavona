import { createServer, request } from 'node:http';
import { connect } from 'node:net';
import type { Socket } from 'node:net';
/** Owned enforcing proxy. Browser redirects traverse this boundary even where Playwright routing skips them. */
export async function createPolicyProxy(allowed:(url:string)=>boolean,blocked:(url:string)=>void):Promise<{url:string;stop:()=>Promise<void>}>{
 const sockets=new Set<Socket>();const server=createServer((incoming,outgoing)=>{let target:URL;try{target=new URL(incoming.url??'');if(target.protocol!=='http:'||!allowed(target.href))throw new Error('Denied');}catch{blocked(incoming.url??'');outgoing.writeHead(403);outgoing.end('Browser network scope denied');return;}
 const headers:Record<string,string|string[]|undefined>={...incoming.headers,host:target.host};delete headers['proxy-authorization'];delete headers['proxy-connection'];
 const upstream=request(target,{method:incoming.method??'GET',headers},response=>{outgoing.writeHead(response.statusCode??502,response.headers);response.pipe(outgoing);});upstream.on('error',()=>{if(!outgoing.headersSent)outgoing.writeHead(502);outgoing.end();});upstream.setTimeout(15000,()=>upstream.destroy());incoming.on('aborted',()=>upstream.destroy());incoming.pipe(upstream);
 });
 server.on('connect',(incoming,client,head)=>{const address=incoming.url??'';let target:URL;try{target=new URL('https://'+address);if(!allowed(target.href))throw new Error('Denied');}catch{blocked('https://'+address);client.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}
 const upstream=connect({host:target.hostname.replace(/^\[|\]$/g,''),port:Number(target.port)||443},()=>{client.write('HTTP/1.1 200 Connection Established\r\n\r\n');if(head.length)upstream.write(head);client.pipe(upstream);upstream.pipe(client);});sockets.add(upstream);upstream.once('close',()=>sockets.delete(upstream));upstream.on('error',()=>client.destroy());client.on('error',()=>upstream.destroy());client.once('close',()=>upstream.destroy());
 });
 // Browser WebSocket routing owns WebSockets; an unhandled proxy upgrade is refused.
 server.on('upgrade',(incoming,socket)=>{blocked(incoming.url??'');socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');});
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket));});
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>resolve());});const address=server.address();if(!address||typeof address==='string')throw new Error('Policy proxy unavailable');return {url:`http://127.0.0.1:${address.port}`,stop:async()=>{for(const socket of sockets)socket.destroy();await new Promise<void>(resolve=>server.close(()=>resolve()));}};
}
