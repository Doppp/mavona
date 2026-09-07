import { expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InspectionService, approveFlow, parseFlow } from '../packages/app-inspection/service';
import { renderReport } from '../packages/app-inspection/report';
import {browserEngines} from './helpers/browser-engines';
const live=process.env.MAVONA_RAILS_INSPECTION_URL;
for(const browser of browserEngines)(live?test:test.skip)(`Rails Turbo/Stimulus canonical flow ${browser}`,async()=>{
 const dir=await mkdtemp(join(tmpdir(),`mavona-rails-${browser}-`));const future=new Date();future.setUTCDate(future.getUTCDate()+7+['chromium','firefox','webkit'].indexOf(browser));const date=future.toISOString().slice(0,10);
 const baseline=Bun.spawnSync(['sqlite3','-readonly',join(process.cwd(),'fixtures/rails-dogfood/tmp/dogfood_browser.sqlite3'),'SELECT scheduled_on FROM orders WHERE customer_id = (SELECT id FROM customers WHERE name = \'Bob\');']);expect(baseline.exitCode).toBe(0);const bobDate=baseline.stdout.toString().trim();
 const flow=parseFlow({version:1,url:new URL('/session/new',live!).href,browser,steps:[
 {op:'act',action:'select',locator:{kind:'label',value:'Customer'},value:'1'},
 {op:'act',action:'click',locator:{kind:'role',value:'button',name:'Sign in'}},
 {op:'act',action:'click',locator:{kind:'role',value:'link',name:'Order 1'}},
 {op:'act',action:'fill',locator:{kind:'label',value:'New date'},value:'2000-01-01'},
 {op:'act',action:'press',locator:{kind:'label',value:'New date'},value:'Tab'},
 {op:'act',action:'click',locator:{kind:'role',value:'button',name:'Reschedule order'}},
 {op:'assert',id:'validation',kind:'text',expected:'must be a future date',provenance:'configured-repository',required:true},
 {op:'act',action:'fill',locator:{kind:'label',value:'New date'},value:date},
 {op:'act',action:'press',locator:{kind:'label',value:'New date'},value:'Tab'},
 {op:'assert',id:'stimulus',kind:'text',expected:`Ready to request ${date}.`,provenance:'configured-repository',required:true},
 {op:'act',action:'click',locator:{kind:'role',value:'button',name:'Reschedule order'}},
 {op:'assert',id:'confirmation',kind:'text',expected:`Rescheduled for ${date}`,provenance:'configured-repository',required:true},
 {op:'capture'},
 {op:'act',action:'reload'},
 {op:'assert',id:'persistence-on-reload',kind:'text',expected:date,provenance:'configured-repository',required:true}
 ]});const report=await new InspectionService().run(flow,approveFlow(flow,dir,'development-fixture'),{artifactDirectory:dir});await writeFile(join(dir,'report.json'),JSON.stringify(report,null,2));await writeFile(join(dir,'report.html'),renderReport(report));console.log(`Rails ${browser} report: ${dir}`);if(report.status!=='passed')console.log(JSON.stringify(report));expect(report.status).toBe('passed');const query=Bun.spawnSync(['sqlite3','-readonly','-json',join(process.cwd(),'fixtures/rails-dogfood/tmp/dogfood_browser.sqlite3'),'SELECT orders.id AS order_id, customers.name, orders.scheduled_on FROM orders JOIN customers ON customers.id=orders.customer_id ORDER BY orders.id']);expect(query.exitCode).toBe(0);const rows=JSON.parse(query.stdout.toString());expect(rows).toEqual([{order_id:1,name:'Alice',scheduled_on:date},{order_id:2,name:'Bob',scheduled_on:bobDate}]);
},60000);
