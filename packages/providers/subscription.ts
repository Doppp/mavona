import {ProviderError} from './types';
// Reviewed official documentation 2026-09-06. Client dynamic tools are experimental,
// and app-server retains Codex generation, built-in tools and persisted thread state.
// https://learn.chatgpt.com/docs/app-server
// https://learn.chatgpt.com/docs/auth
export function subscriptionAssessment(detected:boolean){return {provider:'chatgpt',detected,inference:'unavailable' as const,reason:'subscription_agent_loop_unsupported' as const,reviewedAt:'2026-09-06',officialInterface:true,agentLoopOwnership:'not_demonstrated' as const,entitlement:'unknown' as const,authentication:'unknown' as const,source:'https://learn.chatgpt.com/docs/app-server'};}
// Binary presence is diagnostic only. No credential files, login or account requests.
export function detectSubscription(locate:(name:string)=>string|null=name=>Bun.which(name)){return subscriptionAssessment(Boolean(locate('codex')));}
export function refuseSubscriptionInference():never{throw new ProviderError('unsupported_capability','subscription_agent_loop_unsupported');}
