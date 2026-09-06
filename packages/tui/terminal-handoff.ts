import {spawnSync} from 'node:child_process';
// Unix terminal-editor handoff only. Preserve the actual user's pre-editor modes,
// including when a killed editor cannot restore them itself. No shell interpolation.
export function captureTerminalModes():string{
 const result=spawnSync('/bin/stty',['-g'],{env:{PATH:'/usr/bin:/bin',LANG:'C'},stdio:[0,'pipe','pipe'],timeout:1000,maxBuffer:4096});const state=result.stdout?.toString().trim();
 if(result.status!==0||!state||!/^[A-Za-z0-9:=]+$/.test(state))throw new Error('Terminal mode snapshot unavailable');return state;
}
export function restoreTerminalModes(state:string):void{
 if(!/^[A-Za-z0-9:=]+$/.test(state)||state.length>4096)throw new Error('Invalid terminal mode snapshot');const result=spawnSync('/bin/stty',[state],{env:{PATH:'/usr/bin:/bin',LANG:'C'},stdio:[0,'ignore','pipe'],timeout:1000,maxBuffer:4096});if(result.status!==0)throw new Error('Terminal mode restoration failed');
}
