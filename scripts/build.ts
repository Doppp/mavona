import solidPlugin from '@opentui/solid/bun-plugin';
const result=await Bun.build({entrypoints:['apps/mavona/main.ts'],target:'bun',plugins:[solidPlugin],compile:{outfile:'dist/mavona',autoloadBunfig:false,autoloadDotenv:false,autoloadTsconfig:false,autoloadPackageJson:false},define:{'process.env.OPENTUI_LIBC':JSON.stringify('glibc')}});
if(!result.success){for(const log of result.logs)console.error(log);process.exitCode=1;}
