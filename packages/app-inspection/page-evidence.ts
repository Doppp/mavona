import type {Locator} from 'playwright';import {randomUUID} from 'node:crypto';
export type DomElement={id:string;parentId?:string;tag:string;role?:string;roleSource?:'explicit-aria'|'html-hint';attributes:Record<string,string>;geometry:{x:number;y:number;width:number;height:number};disabled:boolean};
export type DomEvidence={kind:'rendered-dom-aria-hints';untrusted:true;accessibilityAudit:false;truncated:boolean;redactedSubtrees:number;elements:DomElement[]};
/** The traversal never copies form values, raw HTML, handlers or private/hidden subtrees. */
export async function renderedEvidence(scope:Locator,selectors:string[],sanitize:(text:string)=>string):Promise<{text:string;dom:DomEvidence;mutationRevision:number}>{
 if(await scope.count()!==1)throw new Error('Ambiguous or missing observation locator');
 const raw=await scope.evaluate((root,selectors)=>{
  type Row={parent?:number;tag:string;role?:string;roleSource?:'explicit-aria'|'html-hint';attributes:Record<string,string>;geometry:{x:number;y:number;width:number;height:number};disabled:boolean};
  const elements:Row[]=[],texts:string[]=[];let visited=0,length=0,truncated=false,redactedSubtrees=0;
  const privateNode=(node:Element)=>node.matches('script,style,noscript,template,[hidden],[data-mavona-private]')||selectors.some(selector=>node.matches(selector));
  const hidden=(node:Element)=>{const style=getComputedStyle(node);return style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse'||style.opacity==='0'||style.contentVisibility==='hidden';};
  const result=()=>({mutationRevision:(window as unknown as {__mavonaMutation:number}).__mavonaMutation,elements,text:texts.join('\n'),truncated,redactedSubtrees});
  let ancestors=0;for(let ancestor:Element|null=root;ancestor;ancestor=ancestor.parentElement??(ancestor.getRootNode() instanceof ShadowRoot?(ancestor.getRootNode() as ShadowRoot).host:null))if(++ancestors>100){truncated=true;return result();}else if(privateNode(ancestor)||hidden(ancestor)){redactedSubtrees++;return result();}
  const visit=(node:Node,depth:number,parent?:number)=>{
   if(++visited>5000||depth>30){truncated=true;return;}
   if(node.nodeType===Node.TEXT_NODE){const value=(node.textContent??'').trim();if(!value)return;const range=document.createRange();range.selectNodeContents(node);if(![...range.getClientRects()].some(rect=>rect.width>0&&rect.height>0))return;if(length+value.length+1>20000){truncated=true;return;}texts.push(value);length+=value.length+1;return;}
   if(node instanceof ShadowRoot){for(const child of node.childNodes){if(visited>=5000){truncated=true;break;}visit(child,depth+1,parent);}return;}if(!(node instanceof Element))return;if(privateNode(node)||hidden(node)){redactedSubtrees++;return;}
   const box=node.getBoundingClientRect();let current=parent;
   if(box.width>0&&box.height>0){if(elements.length<100){const rawTag=node.tagName.toLowerCase();const tag=/^[a-z][a-z0-9-]{0,63}$/.test(rawTag)?rawTag:'custom-element';const attributes:Record<string,string>={};for(const key of ['type','role','aria-label','aria-expanded','aria-checked','aria-pressed','aria-disabled','aria-level','aria-required','aria-invalid']){const value=node.getAttribute(key);if(value!==null){if(value.length<=256)attributes[key]=value;else truncated=true;}}
     const implicit:Record<string,string>={button:'button',a:'link',h1:'heading',h2:'heading',h3:'heading',h4:'heading',h5:'heading',h6:'heading',textarea:'textbox',select:'combobox',main:'main',nav:'navigation',ul:'list',ol:'list',li:'listitem',table:'table',tr:'row',th:'columnheader',td:'cell',img:'img'};const role=attributes.role??implicit[tag];const bounded=(n:number)=>Number.isFinite(n)?Math.max(-1000000,Math.min(1000000,n)):0;current=elements.length;elements.push({...(parent!==undefined?{parent}:{}),tag,...(role?{role,roleSource:attributes.role?'explicit-aria':'html-hint'}:{}),attributes,geometry:{x:bounded(box.x),y:bounded(box.y),width:bounded(box.width),height:bounded(box.height)},disabled:node.matches(':disabled')||node.getAttribute('aria-disabled')==='true'});
    }else truncated=true;}
   if(node.matches('input,textarea,select'))return;if(node.shadowRoot)visit(node.shadowRoot,depth+1,current);
   for(const child of node.childNodes){if(visited>=5000){truncated=true;break;}visit(child,depth+1,current);}
  };visit(root,0);return result();
 },selectors);
 const ids=raw.elements.map(()=>randomUUID());if(!Number.isSafeInteger(raw.mutationRevision)||raw.mutationRevision<0)throw new Error('Observation revision unavailable');return {mutationRevision:raw.mutationRevision,text:sanitize(raw.text),dom:{kind:'rendered-dom-aria-hints',untrusted:true,accessibilityAudit:false,truncated:raw.truncated,redactedSubtrees:raw.redactedSubtrees,elements:raw.elements.map((element,index)=>({id:ids[index]!,...(element.parent!==undefined?{parentId:ids[element.parent]!}:{}),tag:element.tag,...(element.role?{role:sanitize(element.role),roleSource:element.roleSource!}:{}),attributes:Object.fromEntries(Object.entries(element.attributes).map(([key,value])=>[key,sanitize(value)])),geometry:element.geometry,disabled:element.disabled}))}};
}
