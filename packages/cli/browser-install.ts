// Pinned Playwright 1.63.0 registry boundary used by its own supported install CLI.
import {registry as registryModule} from 'playwright-core/lib/coreBundle';
const registry=registryModule.registry;
export type BrowserEngine='chromium'|'firefox'|'webkit';
export async function browserInstall(engine:string,dryRun:boolean){
 if(!['chromium','firefox','webkit'].includes(engine))throw new Error('Choose chromium, firefox or webkit');
 const executables=registry.resolveBrowsers([engine],{});
 const plan={schemaVersion:1,browser:engine,playwrightVersion:'1.63.0',downloadSize:'unknown',osDependencies:'Not installed automatically; see Playwright host diagnostics',executables:executables.map(e=>({name:e.name,directory:e.directory,urls:e.downloadURLs??[]}))};
 console.log(JSON.stringify(plan,null,2));if(dryRun)return 0;
 // This entry is reachable only through the explicit app install command. No host packages or sudo.
 await registry.install(executables,{force:false,gc:false});
 await registry.validateHostRequirementsForExecutablesIfNeeded(executables,'javascript');return 0;
}
