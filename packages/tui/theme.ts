export type TerminalThemeName='dark'|'light'|'no-color';
export interface TerminalTheme {name:TerminalThemeName;color:boolean;background:string;foreground:string;muted:string;accent:string;border:string;focus:string;selection:string}
const themes:Record<TerminalThemeName,TerminalTheme>={
 dark:{name:'dark',color:true,background:'#10141c',foreground:'#f2f5f8',muted:'#aeb8c7',accent:'#8bd5ff',border:'#7d8ba3',focus:'#ffd166',selection:'#29496b'},
 light:{name:'light',color:true,background:'#fbfcfe',foreground:'#18202b',muted:'#4b596b',accent:'#005ea8',border:'#56657a',focus:'#8a4f00',selection:'#cde8ff'},
 'no-color':{name:'no-color',color:false,background:'transparent',foreground:'white',muted:'white',accent:'white',border:'white',focus:'white',selection:'transparent'}
};
export function detectedTerminalTheme(env:Readonly<Record<string,string|undefined>>=process.env):TerminalThemeName {if(env.NO_COLOR!==undefined)return 'no-color';const background=Number(env.COLORFGBG?.split(';').at(-1));return Number.isFinite(background)&&background>=7?'light':'dark';}
export function effectiveTerminalTheme(saved:TerminalThemeName|undefined,env:Readonly<Record<string,string|undefined>>=process.env):TerminalThemeName {return env.NO_COLOR!==undefined?'no-color':saved??detectedTerminalTheme(env);}
export function terminalTheme(name:TerminalThemeName|undefined):TerminalTheme {return themes[name??detectedTerminalTheme()];}
export function parseTerminalTheme(value:string):TerminalThemeName {if(value==='dark'||value==='light'||value==='no-color')return value;throw new Error('Theme must be dark, light or no-color');}
