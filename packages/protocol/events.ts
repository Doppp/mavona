export interface Payloads {
 'session.opened':{repository:string};
 'draft.changed':{text:string};
 'user.message':{text:string};
 'assistant.delta':{text:string};
 'effect.requested':{effectId:string;kind:'command'|'patch'|'browser'};
 'effect.completed':{effectId:string;state:'passed'|'failed'|'unknown'};
 'session.closed':{reason:string};
}
export type EventType=keyof Payloads;
export interface Envelope {protocolVersion:1;eventId:string;sessionId:string;sequence:number;timestamp:string;type:string;schemaVersion:number;payload:Record<string,unknown>;causedBy?:string}
export type KnownEvent = {[T in EventType]:Omit<Envelope,'type'|'payload'>&{type:T;payload:Payloads[T]}}[EventType];
const shapes:Record<EventType,Record<string,readonly string[]|null>>={
 'session.opened':{repository:null},'draft.changed':{text:null},'user.message':{text:null},'assistant.delta':{text:null},
 'effect.requested':{effectId:null,kind:['command','patch','browser']},
 'effect.completed':{effectId:null,state:['passed','failed','unknown']},'session.closed':{reason:null}
};
export function decode(value:unknown):Envelope {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid event');
 const e=value as Record<string,unknown>;
 if(e.protocolVersion!==1)throw new Error('Unsupported event protocol; upgrade Mavona');
 for(const key of ['eventId','sessionId','timestamp','type'])if(typeof e[key]!=='string'||e[key]==='')throw new Error('Invalid event identity');
 if(!Number.isSafeInteger(e.sequence)||(e.sequence as number)<1||!Number.isSafeInteger(e.schemaVersion)||(e.schemaVersion as number)<1||!Number.isFinite(Date.parse(e.timestamp as string)))throw new Error('Invalid event sequence/version/time');
 if(!e.payload||typeof e.payload!=='object'||Array.isArray(e.payload))throw new Error('Invalid payload');
 if(e.causedBy!==undefined&&typeof e.causedBy!=='string')throw new Error('Invalid causal ID');
 const event=e as unknown as Envelope;
 if(isKnown(event))for(const [key,allowed] of Object.entries(shapes[event.type])){
  const val=(event.payload as Record<string,unknown>)[key];if(typeof val!=='string'||(allowed&&!allowed.includes(val)))throw new Error('Invalid event payload');
 }
 return event;
}
export function isKnown(event:Envelope):event is KnownEvent {return event.schemaVersion===1&&Object.hasOwn(shapes,event.type);}
