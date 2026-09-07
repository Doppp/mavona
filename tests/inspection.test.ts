import { describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InspectionService, approveFlow, parseFlow, aggregateChecks, doctor } from '../packages/app-inspection/service';
import {browserEngines} from './helpers/browser-engines';
const fixture = () => Bun.serve({port:0, hostname:'127.0.0.1',fetch(req){ const u = new URL(req.url); if(u.pathname==='/bad')return new Response('failed',{status:500}); return new Response(`<html><head><title>Fixture</title></head><body><h1>Booking</h1><label>Name<input aria-label="Name"></label><button onclick="document.querySelector('h1').textContent='Saved'">Save</button><input type="password" value="SECRET_CANARY"><script>console.error('password=SECRET_CANARY');fetch('/bad');fetch('https://example.com/blocked');</script></body></html>`, {headers:{'content-type':'text/html'}}); }});
describe('inspection policy',()=>{
 test('parsing never grants effects and rejects arbitrary JavaScript',()=>{expect(()=>parseFlow({version:1,url:'http://127.0.0.1:3000',steps:[{op:'evaluate',script:'alert(1)'}]})).toThrow();expect(aggregateChecks([{status:'passed'},{status:'unknown'}])).toBe('unknown');expect(aggregateChecks([])).toBe('unknown');});
 test('loopback and exact flow grant binding',async()=>{const service=new InspectionService();const flow=parseFlow({version:1,url:'http://127.0.0.1:3000',steps:[]});expect((await service.run(flow)).status).toBe('unknown');expect(()=>approveFlow({...flow,url:'https://example.com'},'/tmp','user')).toThrow();});
 test('actual installed engine executes flow and sanitizes observations',async()=>{
 const available=await doctor(); if(!available.find(x=>x.browser==='chromium')?.available)throw new Error('Installed Chromium required for integration evidence; run explicit browser setup');
 const server=fixture(), dir=await mkdtemp(join(tmpdir(),'mavona-inspection-'));
 try {const flow=parseFlow({version:1,url:server.url.href,steps:[{op:'observe'},{op:'act',action:'fill',locator:{kind:'label',value:'Name'},value:'Ada'},{op:'act',action:'click',locator:{kind:'role',value:'button',name:'Save'}},{op:'assert',id:'saved',kind:'text',expected:'Saved',provenance:'user-approved',required:true},{op:'capture'}]});
 const service=new InspectionService();const result=await service.run(flow,approveFlow(flow,dir,'user'),{artifactDirectory:dir,secrets:['SECRET_CANARY']});
 expect(result.status).toBe('passed');expect(result.checks[0]?.status).toBe('passed');expect(result.artifacts).toHaveLength(1);expect(JSON.stringify(result)).not.toContain('SECRET_CANARY');expect(result.diagnostics.some(x=>x.kind==='blocked-request')).toBe(true);expect(result.diagnostics.some(x=>x.kind==='http-error')).toBe(true);
 }finally{server.stop(true);await rm(dir,{recursive:true,force:true});}
 });
});

for(const browser of browserEngines)test(`real ${browser}: flow binding, revocation and cancellation`,async()=>{
 const server=fixture(),dir=await mkdtemp(join(tmpdir(),'mavona-inspection-policy-'));const service=new InspectionService();
 try{const flow=parseFlow({version:1,url:server.url.href,browser,steps:[{op:'act',action:'fill',locator:{kind:'label',value:'Name'},value:'Ada'}]});const grant=approveFlow(flow,dir,'user');expect((await service.start(flow,grant,{artifactDirectory:dir,secrets:['SECRET_CANARY']})).state).toBe('ready');
 await expect(service.act({op:'act',action:'fill',locator:{kind:'label',value:'Name'},value:'UNAPPROVED'})).rejects.toThrow('approval-required');
 const observation=await service.observe();await expect(service.act({...flow.steps[0] as Extract<typeof flow.steps[number],{op:'act'}>,revision:observation.revision-1})).rejects.toThrow('Stale observation');
 grant.revoked=true;await expect(service.observe()).rejects.toThrow('approval-required');expect((await service.stop()).state).toBe('cancelled');
 const changed=parseFlow({...flow,steps:[{op:'observe'}]});expect((await new InspectionService().run(changed,approveFlow(flow,dir,'user'))).status).toBe('unknown');
 }finally{await service.stop();server.stop(true);await rm(dir,{recursive:true,force:true});}
},30000);

for(const browser of browserEngines)test(`${browser} redirects, popup/frame resources and WebSockets cannot escape approved origin`,async()=>{
 let outsideRequests=0;const outside=Bun.serve({hostname:'127.0.0.1',port:0,fetch(){outsideRequests++;return new Response('outside');}});
 const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(req){if(new URL(req.url).pathname==='/redirect')return Response.redirect(new URL('/redirect-again',req.url).href);if(new URL(req.url).pathname==='/redirect-again')return Response.redirect(outside.url.href);return new Response(`<h1>Policy</h1><iframe src="${outside.url.href}"></iframe><img src="${outside.url.href}"><script>window.open('${outside.url.href}');new WebSocket('${outside.url.href.replace('http:','ws:')}');fetch('/redirect');</script>`,{headers:{'content-type':'text/html'}});}});
 const dir=await mkdtemp(join(tmpdir(),'mavona-inspection-egress-'));
 try{const flow=parseFlow({version:1,url:server.url.href,browser,steps:[{op:'act',action:'wait',value:'100'},{op:'assert',id:'policy',kind:'text',expected:'Policy',provenance:'user-approved',required:true}]});const report=await new InspectionService().run(flow,approveFlow(flow,dir,'user'),{artifactDirectory:dir});expect(outsideRequests).toBe(0);expect(report.diagnostics.some(d=>d.kind==='blocked-websocket')).toBe(true);expect(report.diagnostics.filter(d=>d.kind==='blocked-request').length).toBeGreaterThanOrEqual(3);expect(report.status).toBe('passed');}finally{server.stop(true);outside.stop(true);await rm(dir,{recursive:true,force:true});}
},30000);

test('owned server cleanup, attachment and occupied ports use explicit spawn capability',async()=>{
 const {startServer,attachServer}=await import('../packages/app-inspection/lifecycle');const server=fixture();let starts=0;try{await expect(startServer(server.url.href,async()=>{starts++;return {stop:async()=>{}};})).rejects.toThrow('Port occupied');expect(starts).toBe(0);const attached=await attachServer(server.url.href);await attached.stop();expect((await fetch(server.url)).status).toBe(200);await expect(startServer(server.url.href,undefined)).rejects.toThrow('approval-required');}finally{server.stop(true);}
 let stopCount=0;await expect(startServer('http://127.0.0.1:1',async()=>({stop:async()=>{stopCount++;}}),{healthTimeoutMs:1})).rejects.toThrow('health timeout');expect(stopCount).toBe(1);
});

test('offline report treats page instructions as data and refuses artifact traversal',async()=>{
 const {renderReport}=await import('../packages/app-inspection/report');const report=new InspectionService().snapshot();report.observations.push({id:'o',pageId:'p',revision:1,url:'http://127.0.0.1/',title:'',text:'<script>fetch("https://evil.test")</script>',timestamp:'now',untrusted:true});const html=renderReport(report);expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');expect(html).toContain("default-src 'none'");
 report.artifacts.push({id:'x',path:'../../secret.png',sha256:'',size:1,mediaType:'image/png',provenance:'captured',redaction:'masked',url:'',timestamp:'',browser:'',viewport:null,os:''});expect(()=>renderReport(report)).toThrow('Invalid managed artifact path');
});

test('artifact directory rejects repository symlink escape before writing',async()=>{
 const {symlink}=await import('node:fs/promises');const root=await mkdtemp(join(tmpdir(),'mavona-inspection-root-')),outside=await mkdtemp(join(tmpdir(),'mavona-inspection-outside-'));try{await symlink(outside,join(root,'escape'));const flow=parseFlow({version:1,url:'http://127.0.0.1:3000',steps:[]});const report=await new InspectionService().run(flow,approveFlow(flow,root,'user'),{artifactDirectory:join(root,'escape','new')});expect(report.status).toBe('unknown');expect(report.reason).toContain('escapes checkout');}finally{await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});}
});

 test('unavailable startup preserves named unknown required assertions',async()=>{const flow=parseFlow({version:1,url:'http://127.0.0.1:3000',steps:[{op:'assert',id:'not-run',kind:'text',expected:'required',provenance:'user-approved',required:true}]});const report=await new InspectionService().run(flow);expect(report.checks).toHaveLength(1);expect(report.checks[0]?.status).toBe('unknown');});
