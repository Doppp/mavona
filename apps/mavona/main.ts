import { main } from '../../packages/cli/main';
try { process.exitCode=await main(process.argv.slice(2)); }
catch { console.error('Mavona operation failed. Check the path, permissions and Git installation.'); process.exitCode=5; }
