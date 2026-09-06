import {presets} from './registry';import {validateEndpoint} from './security';import type {Connection} from './types';
export type ProviderSelection={connection:Connection;model:string};
export function validModelId(value:unknown):value is string{return typeof value==='string'&&value.length>0&&value.length<=256&&!/[\u0000-\u001f\u007f-\u009f]/.test(value);}
export function selectProvider(provider:string,model:string,endpoint?:string,locality?:string):ProviderSelection{
 if(!/^[a-z][a-z0-9_-]{0,63}$/.test(provider)||!validModelId(model))throw new Error('Invalid provider or model ID');const preset=presets.find(item=>item.id===provider);let connection:Connection;
 if(endpoint!==undefined){if(locality!=='local'&&locality!=='remote')throw new Error('Custom endpoint requires explicit locality');connection={id:provider,baseUrl:validateEndpoint(endpoint,locality).href,locality};}else{if(locality!==undefined||!preset)throw new Error('Choose a preset or explicit endpoint');connection={id:preset.id,baseUrl:preset.baseUrl,locality:preset.locality};}
 validateEndpoint(connection.baseUrl,connection.locality);return {connection,model};
}
export function restoreSelection(raw:string):ProviderSelection{const value:unknown=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid selection');const record=value as Record<string,unknown>;if(Object.keys(record).some(key=>!['provider','model','endpoint','locality'].includes(key))||typeof record.provider!=='string'||typeof record.model!=='string'||typeof record.endpoint!=='string'||typeof record.locality!=='string')throw new Error('Invalid persisted selection');return selectProvider(record.provider,record.model,record.endpoint,record.locality);}
export function selectionRecord(selection:ProviderSelection){return JSON.stringify({provider:selection.connection.id,model:selection.model,endpoint:selection.connection.baseUrl,locality:selection.connection.locality});}
