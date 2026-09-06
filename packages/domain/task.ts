import { type Envelope, isKnown } from '../protocol/events';
export type Correctness='passed'|'failed'|'unknown';
export interface Check {id:string;required:boolean;state:Correctness;fresh:boolean;provenance:'repository'|'user-approved'|'protected-grader'|'model-proposed'}
export function correctness(checks:readonly Check[]):Correctness {
 const required=checks.filter(c=>c.required);
 const accepted=(c:Check)=>c.fresh&&c.provenance!=='model-proposed';
 if(required.some(c=>accepted(c)&&c.state==='failed'))return 'failed';
 if(!required.length||required.some(c=>!accepted(c)||c.state!=='passed'))return 'unknown';
 return 'passed';
}
export interface SessionState {railsRoot:string|null;reconciledEffects:Record<string,string>;references:Record<string,string>;draft:string;repository:string|null;effects:Record<string,Correctness>;mutationAllowed:boolean;unsupported:boolean;messages:{id:string;role:'user'|'assistant';text:string}[]}
export function replay(events:readonly Envelope[]):SessionState {
 const state:SessionState={railsRoot:null,reconciledEffects:{},references:{},draft:'',repository:null,effects:{},mutationAllowed:true,unsupported:false,messages:[]};
 for(const event of events){
  if(!isKnown(event)){state.unsupported=true;continue;}
  switch(event.type){
   case 'draft.reference.added':state.references[event.payload.referenceId]=event.payload.reference;break;
   case 'draft.reference.removed':delete state.references[event.payload.referenceId];break;
   case 'rails.root.selected':state.railsRoot=event.payload.root;break;
   case 'repository.selected':state.repository=event.payload.repository;state.railsRoot=null;break;
   case 'session.opened':state.repository=event.payload.repository;break;
   case 'draft.changed':state.draft=event.payload.text;break;
   case 'user.message':state.messages.push({id:event.eventId,role:'user',text:event.payload.text});break;
   case 'assistant.delta':state.messages.push({id:event.eventId,role:'assistant',text:event.payload.text});break;
   case 'effect.reconciled':
    if(!Object.hasOwn(state.effects,event.payload.effectId))throw new Error('Reconciliation without effect intent');
    state.reconciledEffects[event.payload.effectId]=event.payload.reason;break;
   case 'effect.requested':
    if(Object.hasOwn(state.effects,event.payload.effectId))throw new Error('Duplicate effect identity');
    state.effects[event.payload.effectId]='unknown';break;
   case 'effect.completed':
    if(!Object.hasOwn(state.effects,event.payload.effectId))throw new Error('Effect result without intent');
    state.effects[event.payload.effectId]=event.payload.state;break;
  }
 }
 state.mutationAllowed=!state.unsupported&&!Object.entries(state.effects).some(([id,outcome])=>outcome==='unknown'&&!Object.hasOwn(state.reconciledEffects,id));
 return state;
}
