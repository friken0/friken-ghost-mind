/* Versioned five-stat creation. Separate stream: preview/reroll never rolls a decision. */
export const humanStats=['guts','focus','glitch','awe','insight'];
export function rollIdentity(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Creation seed');
 let x=seed;const rolls=humanStats.map(stat=>{do{x=(Math.imul(x,1664525)+1013904223)>>>0;}while(x>=4294967292);const die=x%6+1;return {stat,die,value:die+2};});
 return {system:'human-five-v1',seed,method:'d6+2',rolls};
}
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
export function creationStats(receipt){if(!receipt||receipt.system!=='human-five-v1'||canonical(rollIdentity(receipt.seed))!==canonical(receipt))throw Error('Creation receipt mismatch');return Object.fromEntries(receipt.rolls.map(r=>[r.stat,r.value]));}
export const statGuide={guts:'Hold when your body votes to leave. Endurance, nerve and force.',focus:'Keep one thing exact while everything else gets loud. Precision and stealth.',glitch:'Make a machine question its instructions. Hacking and bending local rules.',awe:'Reach a mind unlike yours. Presence, persuasion and impossible empathy.',insight:'Notice what the evidence refuses to say. Investigation and understanding.'};
