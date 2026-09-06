import type {ProcessResult} from './process';
export type EvaluationState='passed'|'failed'|'not_run'|'error';
export interface Grading {grader_status:EvaluationState;tests_status:EvaluationState;correctness:'passed'|'failed'|'unknown';notes:string}
const state=(value:unknown):EvaluationState=>['passed','failed','not_run','error'].includes(String(value))?value as EvaluationState:'error';
export function normalizeGrading(result:ProcessResult):Grading{
 let value:Record<string,unknown>;try{value=JSON.parse(result.stdout) as Record<string,unknown>;if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();}catch{return {grader_status:'error',tests_status:'not_run',correctness:'unknown',notes:'Invalid grader output'};}
 let grader=state(value.grader_status),tests=value.tests_status===undefined?'not_run' as const:state(value.tests_status);
 if(result.exitCode===null||result.timedOut||result.cancelled||result.outputLimited||result.unavailable||(result.exitCode!==0&&(grader==='passed'||tests==='passed'))){grader='error';tests='error';}
 return {grader_status:grader,tests_status:tests,correctness:grader==='passed'?'passed':grader==='failed'?'failed':'unknown',notes:typeof value.notes==='string'?value.notes.slice(0,6000):''};
}
export interface PairedOutcome {task_id:string;attempt:number;condition:'baseline'|'mavona';grader_status:EvaluationState}
export function pairedReport(results:readonly PairedOutcome[]){const pairs=new Map<string,Partial<Record<'baseline'|'mavona',EvaluationState>>>();for(const result of results){const key=JSON.stringify([result.task_id,result.attempt]);const pair=pairs.get(key)??{};if(pair[result.condition]!==undefined)throw new Error('Duplicate task/attempt/condition; do not overwrite outcomes');pair[result.condition]=result.grader_status;pairs.set(key,pair);}const counts={baseline_verified:0,mavona_verified:0,baseline_only:0,mavona_only:0,both_pass:0,both_fail:0,unknown:0};for(const pair of pairs.values()){const baseline=pair.baseline==='passed',mavona=pair.mavona==='passed';if(baseline)counts.baseline_verified++;if(mavona)counts.mavona_verified++;counts[baseline&&mavona?'both_pass':baseline?'baseline_only':mavona?'mavona_only':'both_fail']++;for(const value of [pair.baseline,pair.mavona])if(value===undefined||value==='not_run'||value==='error')counts.unknown++;}return counts;}
