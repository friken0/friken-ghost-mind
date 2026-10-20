/* Exact hundredth arithmetic. Seeded reproducibility is not physical randomness. */
export function validateCausality(policy){
 if(!policy||Object.keys(policy).sort().join(',')!=='above,below,bonus,precision'||policy.precision!==2)throw Error('Causality policy');
 for(const k of ['below','above'])if(!Number.isFinite(policy[k])||policy[k]<0||policy[k]>.5||Math.abs(Math.round(policy[k]*100)-policy[k]*100)>1e-7)throw Error('Resonance width');
 if(!policy.bonus||Object.keys(policy.bonus).some(k=>!['signal','compute','noise'].includes(k))||Object.values(policy.bonus).some(n=>!Number.isInteger(n)||n< -1||n>1))throw Error('Resonance bonus');
 return policy;
}
export function causalResult(sample,value,target,policy){
 validateCausality(policy);for(const n of [sample,value,target])if(!Number.isFinite(n)||Math.abs(n*100-Math.round(n*100))>1e-7)throw Error('Causality hundredths');
 if(sample<.01||sample>20||value<0||value>8||target<1||target>28)throw Error('Causality range');
 const total=Math.round(sample*100)+Math.round(value*100),dc=Math.round(target*100),lower=dc-Math.round(policy.below*100),upper=dc+Math.round(policy.above*100),exact=total>=lower&&total<=upper;
 return {system:'causality-v1',bonus:{...policy.bonus},die:sample,value,dc:target,total:total/100,success:exact||total>=dc,grade:exact?'resonance':total>=dc?'pass':'fail',resonance:{lower:lower/100,upper:upper/100}};
}
export function causalOdds(value,target,policy){validateCausality(policy);const lo=Math.round((target-value-policy.below)*100),hi=Math.round((target-value+policy.above)*100),count=(a,z)=>Math.max(0,Math.min(2000,z)-Math.max(1,a)+1);return {percent:count(lo,2000)/20,resonance:count(lo,hi)/20};}
export function rollScore(r){if(!r?.success)return 0;return r.system==='causality-v1'?(r.dc<=12.5?5:r.dc<=15.5?10:20)+(r.grade==='resonance'?10:0):({12:5,15:10,18:20}[r.dc]||0);}
export function nextCausalSample(rng){let x;do{rng.current=(Math.imul(rng.current,1664525)+1013904223)>>>0;x=rng.current;}while(x>=4294966000);return (x%2000+1)/100;}
