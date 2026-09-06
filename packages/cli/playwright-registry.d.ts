declare module 'playwright-core/lib/coreBundle' {
 interface Executable {name:string;directory?:string;downloadURLs?:string[]}
 export const registry:{runOopDownloadBrowserMain():void;registry:{resolveBrowsers(names:string[],options:Record<string,never>):Executable[];install(executables:Executable[],options:{force:boolean;gc:boolean}):Promise<void>;validateHostRequirementsForExecutablesIfNeeded(executables:Executable[],language:string):Promise<void>}};
}
