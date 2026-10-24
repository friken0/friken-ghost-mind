/* Performance data only. Phoneme ORDER may be actual Kokoro G2P output;
 * durations are weighted estimates fitted to a real playback clock, never
 * claimed forced alignment. No timer, speech engine, emotion oracle or RNG. */
const shapes={
 rest:[0,0,0,1,0,0,0,0],closed:[.03,0,0,1,0,.08,0,0],
 open:[.95,.10,.25,0,.18,.42,.13,0],wide:[.28,0,1,0,.12,.65,.08,.10],
 round:[.45,1,0,0,.05,.18,.04,0],teeth:[.15,.05,.35,.5,0,1,.02,.12],
 dental:[.32,.05,.30,0,.90,.60,.04,.08],lateral:[.45,.10,.25,0,1,.50,.05,0],
 sibilant:[.14,.20,.42,.15,.18,.9,.04,.16],back:[.40,.12,.15,0,.35,.35,.02,0]
};
export const facialFields=['jaw','round','wide','press','tongue','teeth','brow','squint'];
function category(p){
 if(/[\s.,!?;:…—-]/u.test(p))return 'rest';
 if(/[mbp]/u.test(p))return 'closed';if(/[fv]/u.test(p))return 'teeth';
 if(/[θð]/u.test(p))return 'dental';if(/[lɫ]/u.test(p))return 'lateral';
 if(/[szʃʒʧʤtʦd]/u.test(p))return 'sibilant';
 if(/[uʊoɔOwʋ]/u.test(p))return 'round';if(/[iɪeɛEj]/u.test(p))return 'wide';
 if(/[aɑæɐʌɒA]/u.test(p))return 'open';if(/[kɡgŋɹrɜɚ]/u.test(p))return 'back';
 return 'back';
}
export function compileFacialPerformance({text='',phonemes=''}={}){
 if(typeof text!=='string'||typeof phonemes!=='string'||text.length>24000||phonemes.length>24000)throw Error('Invalid bounded facial performance input');
 const actual=!!phonemes.trim(),source=actual?phonemes:text.toLowerCase().replace(/th/g,'θ').replace(/sh|ch/g,'ʃ').replace(/oo/g,'u').replace(/ee/g,'i');
 const units=[];let emphasis=0;
 for(const p of source){
  if(/[ˈˌ]/u.test(p)){emphasis=p==='ˈ'?.16:.08;continue;}
  if(/[ːˑ˘͡\u0300-\u036f]/u.test(p)){if(units.length)units.at(-1).weight*=1.25;continue;}
  const kind=category(p),punct=/[.,!?;:…]/u.test(p);
  const weight=kind==='rest'?(punct?1.2:.30):kind==='open'||kind==='round'||kind==='wide'?1.25:kind==='closed'?.65:.85;
  const values=shapes[kind].slice();values[6]=Math.min(.45,values[6]+emphasis+(/[!?]/u.test(p)?.16:0));emphasis*=.4;
  units.push({kind,values,weight});
 }
 const total=units.reduce((n,u)=>n+u.weight,0)||1;let at=0;
 const cues=units.map(u=>{const start=at/total;at+=u.weight;return {...u,start,end:at/total};});
 return {schema:'friken.ghost.facial-performance.v1',source:actual?'kokoro-phoneme-order':'grapheme-approximation',timing:'weighted-estimate-on-playback-clock',cues};
}
export function facialCue(plan,fraction){
 if(!plan||!Array.isArray(plan.cues)||!Number.isFinite(fraction))throw Error('Invalid facial playback position');
 const rest=Object.fromEntries(facialFields.map((n,i)=>[n,shapes.rest[i]]));
 if(fraction<0||fraction>=1||!plan.cues.length)return {...rest,kind:'rest',source:plan.source,timing:plan.timing};
 const i=plan.cues.findIndex(c=>fraction<c.end),current=plan.cues[Math.max(0,i)],previous=plan.cues[Math.max(0,i-1)];
 const t=Math.max(0,Math.min(1,(fraction-current.start)/Math.max(.00001,current.end-current.start)/.32)),ease=t*t*(3-2*t);
 const result={kind:current.kind,source:plan.source,timing:plan.timing};
 for(let j=0;j<facialFields.length;j++)result[facialFields[j]]=previous.values[j]+(current.values[j]-previous.values[j])*ease;
 return result;
}
