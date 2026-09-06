export interface Arguments {positionals:string[];values:Map<string,string[]>;flags:Set<string>}
export function parseArguments(args:string[],valueFlags:readonly string[],booleanFlags:readonly string[]=[]):Arguments{
 const result:Arguments={positionals:[],values:new Map(),flags:new Set()};
 for(let i=0;i<args.length;i++){
  const arg=args[i]!;if(arg==='--'){result.positionals.push(...args.slice(i+1));break;}
  if(!arg.startsWith('--')){result.positionals.push(arg);continue;}
  const key=arg.slice(2);
  if(booleanFlags.includes(key)){result.flags.add(key);continue;}
  if(!valueFlags.includes(key))throw new Error('Unknown option');
  const value=args[++i];if(value===undefined||value.startsWith('--'))throw new Error('Option value required');
  result.values.set(key,[...(result.values.get(key)??[]),value]);
 }
 return result;
}
export function single(args:Arguments,key:string,fallback?:string):string|undefined{const values=args.values.get(key);if(values&&values.length>1)throw new Error('Duplicate option');return values?.[0]??fallback;}
export function argvJSON(value:string):string[]{const parsed:unknown=JSON.parse(value);if(!Array.isArray(parsed)||!parsed.length||!parsed.every(x=>typeof x==='string'&&!x.includes('\0')))throw new Error('Command must be a JSON argument array');return parsed;}
