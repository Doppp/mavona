export const INSPECTION_PROFILES={
 desktop:{viewport:{width:1280,height:720},deviceScaleFactor:1,hasTouch:false,isMobile:false},
 tablet:{viewport:{width:820,height:1180},deviceScaleFactor:2,hasTouch:true,isMobile:true},
 mobile:{viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true},
} as const;
export type ProfileName=keyof typeof INSPECTION_PROFILES;
export type ProfileEvidence={id:ProfileName|'custom';status:'passed'|'unknown';reason:string;viewport:{width:number;height:number};deviceScaleFactor:number;hasTouch:boolean;isMobile:boolean;colorScheme:'light'|'dark';reducedMotion:'reduce'|'no-preference';unchecked:ProfileName[];realDevice:false};
export function inspectionProfile(flow:{profile?:ProfileName;viewport?:{width:number;height:number};colorScheme?:'light'|'dark';reducedMotion?:'reduce'|'no-preference'}):ProfileEvidence{
 const id=flow.profile??(flow.viewport?'custom':'desktop');const base=id==='custom'?{...INSPECTION_PROFILES.desktop,viewport:flow.viewport!}:INSPECTION_PROFILES[id];return {id,...structuredClone(base),status:'unknown',reason:'Requested emulation has not started',colorScheme:flow.colorScheme??'light',reducedMotion:flow.reducedMotion??'reduce',unchecked:(Object.keys(INSPECTION_PROFILES) as ProfileName[]).filter(name=>name!==id),realDevice:false};
}
