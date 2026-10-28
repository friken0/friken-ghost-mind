import {causalResult,causalOdds} from './causality.mjs';
/* Bounded, replayable local Door and crew trial. No hidden model or network job. */
export const mailrunLegs=Object.freeze([
 {title:'01 / THE QUARANTINE RELAY',text:'Your engine is the prize in a tournament you never entered. The entry receipt is three relays away. Get it home before the auction closes.',routes:[
  {id:'direct',label:'Burn around quarantine',fuel:3,hull:0,time:1,note:'Hot engines, clean receipt. The relay bills you for not using it.'},
  {id:'relay',label:'Take the inspection tunnel',fuel:1,hull:3,time:1,note:'The scanner removes three hull plates. Apparently they were suspicious.'},
  {id:'piggyback',label:'Hide in a bulk mail convoy',fuel:0,hull:0,time:3,note:'You survive seventeen advertisements for replacement captains.'}]},
 {title:'02 / THE PRIVATEER SYSOP',text:'A privateer board demands a toll. Their welcome screen says FRIENDLY COMMUNITY. Their gun says otherwise.',routes:[
  {id:'race',label:'Outrun their welcome committee',fuel:3,hull:1,time:1,note:'One scorch mark. You decline the newsletter.'},
  {id:'spoof',label:'Pose as technical support',fuel:1,hull:1,time:1,note:'They shoot once, then ask why their printer is offline.'},
  {id:'armor',label:'Repel their boarding party',fuel:0,hull:3,time:1,note:'Your crew holds the bridge; three hull plates stay with the boarders.'}]},
 {title:'03 / THE AUCTION UPLINK',text:'The auction clerk needs the original registration packet. The deadline is real. So, regrettably, is the clerk.',routes:[
  {id:'boost',label:'Punch straight through',fuel:2,hull:0,time:1,note:'Your receipt arrives hot enough to void its own warranty.'},
  {id:'stealth',label:'Use the quiet maintenance line',fuel:1,hull:0,time:2,note:'You find a quiet line. Someone has been watering it.'},
  {id:'bounce',label:'Bounce off the defence relay',fuel:0,hull:2,time:1,note:'The packet survives. Your paint has entered the public domain.'}]}]);
export const workshopPolicy=Object.freeze({precision:2,below:.2,above:.3,bonus:Object.freeze({signal:1})});
export const workshopStats=Object.freeze({guts:5,focus:5,glitch:5,awe:5,insight:5});
const routeSpecs=[['direct','guts',12.5],['relay','focus',14.1],['piggyback','glitch',16.1],['race','guts',16.3],['spoof','glitch',13.4],['armor','awe',12.6],['boost','focus',13.1],['stealth','insight',14.1],['bounce','awe',15.3]];
export function workshopCheck(kind,id,role='sysop'){
 const spec=kind==='door'?routeSpecs.find(r=>r[0]===id):({sysop:[['sandbox','focus',12.5],['install','glitch',17.1]],quartermaster:[['filters','insight',12.5],['chairs','glitch',16.1]],navigator:[['charted','focus',12.5],['shortcut','awe',17.1]]})[role]?.find(r=>r[0]===id);
 if(!spec)throw Error('Unknown workshop check');return {statId:spec[1],value:workshopStats[spec[1]],dc:spec[2],odds:causalOdds(workshopStats[spec[1]],spec[2],workshopPolicy)};
}
export function workshopRoll(kind,id,role,sample){const spec=workshopCheck(kind,id,role);return {...causalResult(sample,spec.value,spec.dc,workshopPolicy),statId:spec.statId};}
function exactRoll(kind,id,role,roll){if(!roll)throw Error('A causality receipt is required');const exact=workshopRoll(kind,id,role,roll.die);if(JSON.stringify(exact)!==JSON.stringify(roll))throw Error('Workshop causality receipt does not match the choice');return exact;}
export function mailrun(actions=[]){
 if(!Array.isArray(actions)||actions.length>3)throw Error('Three mailrun routes maximum');
 let fuel=5,hull=6,time=6;const log=[];
 for(const [i,entry]of actions.entries()){const id=entry?.id,roll=exactRoll('door',id,null,entry?.roll);if(hull<=0||time<=0)throw Error('Mailrun already ended');const route=mailrunLegs[i].routes.find(r=>r.id===id);if(!route||route.fuel>fuel)throw Error('Unavailable mailrun route');fuel-=route.fuel;hull=Math.max(0,hull-route.hull);time-=route.time;if(!roll.success){hull=Math.max(0,hull-1);time--;log.push('CHECK FAILED / '+roll.total.toFixed(2)+' vs '+roll.dc.toFixed(2)+'. Emergency resend costs one extra hull and time.');}else{if(roll.grade==='resonance')fuel=Math.min(5,fuel+1);log.push((roll.grade==='resonance'?'RESONANCE / one fuel recovered. ':'PASS / ')+route.note);}}
 const done=actions.length===3||hull<=0||time<=0,won=done&&actions.length===3&&hull>0&&time>=0;
 return {actions:[...actions],leg:actions.length,fuel,hull,time,done,won,score:done?(won?40+hull*5+fuel*3+Math.max(0,time)*2:actions.length*5):0,log,ending:!done?null:won?'ENGINE RECLAIMED. The clerk apologises to the engine. You receive a complimentary pen.':'AUCTION LOST. Your engine has a new captain. Keep this receipt: revenge also needs paperwork.'};
}
export const crewRoles=Object.freeze({
 sysop:{title:'BBS SYSOP',problem:'A stranger uploads FREE_ENGINE_UPGRADE.EXE. It asks for the airlocks. What does your new sysop do?',choices:[['sandbox','Inspect it in a sealed sandbox'],['install','Reverse-engineer it under live load']],artifact:'A sealed file area, a hash manifest and a welcome bulletin. Untrusted Door code stays outside ship controls.'},
 quartermaster:{title:'QUARTERMASTER',problem:'Twelve velvet chairs cost the same as six air filters. The captain wants chairs. Your crew wants lungs.',choices:[['filters','Buy filters; log the refused order'],['chairs','Refit spare chairs into air filters']],artifact:'Supply order: six air filters. Velvet chairs: zero. Captain objections: filed under breathable atmosphere.'},
 navigator:{title:'NAVIGATOR',problem:'A shortcut saves fuel but crosses an unverified gate. The long route is charted. No live pilot is available.',choices:[['charted','Take the verified route'],['shortcut','Simulate and map the unknown gate']],artifact:'Route filed through two verified relays. Unknown gate marked for a staffed expedition. Fuel estimate and return path attached.'}
});
export function crewTrial({name='PATCH',role='sysop',action=null,roll=null}={}){
 if(typeof name!=='string'||name.length>32||/[\x00-\x1f\x7f]/.test(name)||!crewRoles[role])throw Error('Invalid crew configuration');
 const spec=crewRoles[role],valid=spec.choices.map(c=>c[0]);if(action!==null&&!valid.includes(action))throw Error('Unknown crew trial order');
 const done=action!==null,receipt=done?exactRoll('crew',action,role,roll):null,passed=!!receipt?.success;
 return {name:name.trim()||'PATCH',role,action,roll:receipt,done,passed,score:done?(passed?25:5):0,artifact:done?(passed?spec.artifact+(action===valid[1]?' Alternative method verified in the simulation.':''):role==='sysop'?'Sandbox report: the upload tried to open every airlock. Live installation failed the trial.':role==='quartermaster'?'Order held: the filter specification failed verification. No unsafe parts were fitted. The crew remains in the trial bay.':'Simulated route: unknown gate, no verified return. Assignment held for a live pilot.'):null,comment:!done?'A local trial, not a background AI worker.':passed?'COMMISSION PASSED / useful work, traceable decisions.':'TRIAL FAILED / simulation stopped before real ship controls.'};
}
export function localWorkshop(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['door','crew'].includes(k)))throw Error('Invalid local workshop');
 return {door:mailrun(value.door?.actions||[]),crew:crewTrial(value.crew||{})};
}
