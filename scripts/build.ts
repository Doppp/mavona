import {buildInputs} from '../packages/distribution/build-inputs';
import {readFile,writeFile,rm} from 'node:fs/promises';import {digest} from '../packages/tools/source';
import solidPlugin from '@opentui/solid/bun-plugin';
const inputs=await buildInputs(process.cwd());await rm('dist/build-info.json',{force:true});
const result=await Bun.build({entrypoints:['apps/mavona/main.ts'],target:'bun',external:['chromium-bidi/*'],plugins:[solidPlugin],compile:{outfile:'dist/mavona',autoloadBunfig:false,autoloadDotenv:false,autoloadTsconfig:false,autoloadPackageJson:false},define:{'process.env.MAVONA_COMPILED':JSON.stringify('1'),'process.env.OPENTUI_LIBC':JSON.stringify('glibc')}});
if(!result.success){for(const log of result.logs)console.error(log);process.exitCode=1;}

else {if(JSON.stringify(await buildInputs(process.cwd()))!==JSON.stringify(inputs))throw new Error('Source changed during build; packaging refused');await writeFile('dist/build-info.json',JSON.stringify({schemaVersion:1,...inputs,target:process.platform+'-'+process.arch,bun:Bun.version,binarySha256:digest(await readFile('dist/mavona')),builtAt:new Date().toISOString()},null,2)+'\n');}
