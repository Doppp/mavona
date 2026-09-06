declare module 'playwright-core/lib/coreBundle' {
 export const iso:{monotonicTime():number;TraceLoader:new()=>{contextEntries:{actions:unknown[];pages:{screencastFrames:unknown[]}[]}[];load(backend:{entryNames():Promise<string[]>;readText(name:string):Promise<string|undefined>;readBlob(name:string):Promise<Blob|undefined>;isLive():boolean;traceURL():string}):Promise<void>}};
 export const utils:{ZipFile:new(path:string)=>{_entries:Map<string,{uncompressedSize:number}>;entries():Promise<string[]>;read(name:string):Promise<Buffer>;close():void}};
 interface Executable {name:string;executablePath():string|undefined;directory?:string;downloadURLs?:string[]}
 export const registry:{runOopDownloadBrowserMain():void;registry:{findExecutable(name:string):Executable|undefined;resolveBrowsers(names:string[],options:Record<string,never>):Executable[];install(executables:Executable[],options:{force:boolean;gc:boolean}):Promise<void>;validateHostRequirementsForExecutablesIfNeeded(executables:Executable[],language:string):Promise<void>}};
}
