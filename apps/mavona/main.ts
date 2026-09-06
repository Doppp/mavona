import { main } from '../../packages/cli/main';
try {
 if(process.env.MAVONA_COMPILED==='1'&&process.argv[2]==='--mavona-browser-download-worker'&&process.connected&&typeof process.send==='function'){const {registry}=await import('playwright-core/lib/coreBundle');registry.runOopDownloadBrowserMain();}
 else process.exitCode=await main(process.argv.slice(2));
}
catch { console.error('Mavona operation failed. Check the path, permissions and Git installation.'); process.exitCode=5; }
