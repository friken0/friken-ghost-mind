import {stagingArt} from './staging-art.mjs';
import {validateCondition,matchesStory} from './storycraft.mjs';
/** One data-only situation for prose, scene props and choice affordances.
 * The tableau is an explicitly labelled schematic, not a recovered photograph.
 * No random stream, save, speech engine or animation loop belongs here. */
export const propKinds=['terminal','world','switch','cable','record','gate','relay','latch','pump','bell','map','charge'];
const states=['live','closed','damaged','repaired','warning','offline'];
const text=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v);
const fields=(v,names)=>{if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).some(k=>!names.includes(k)))throw Error('Unknown staging field');};
export function validateStaging(s){
 if(s===undefined)return;
 fields(s,['place','goal','pressure','objects','overrides','illustration']);
 for(const k of ['place','goal','pressure'])if(!text(s[k],240))throw Error('Staging '+k);
 if(!Array.isArray(s.objects)||s.objects.length<1||s.objects.length>4)throw Error('Staging object budget');
 if(s.illustration!==undefined&&!Object.hasOwn(stagingArt,s.illustration))throw Error('Unknown scene illustration');
 const ids=new Set();
 for(const o of s.objects){fields(o,['id','kind','label','description','state']);if(!/^[a-z][a-z0-9-]{0,39}$/.test(o.id)||ids.has(o.id)||!propKinds.includes(o.kind)||!text(o.label,70)||!text(o.description,350)||!states.includes(o.state))throw Error('Staging object');ids.add(o.id);}
 if(s.overrides!==undefined){if(!Array.isArray(s.overrides)||s.overrides.length>8)throw Error('Staging override budget');for(const v of s.overrides){fields(v,['when','goal','pressure','objects']);validateCondition(v.when);for(const k of ['goal','pressure'])if(v[k]!==undefined&&!text(v[k],240))throw Error('Staging override text');if(v.objects!==undefined){if(!Array.isArray(v.objects)||v.objects.length>4)throw Error('Staging override objects');for(const o of v.objects){fields(o,['id','state','description','label']);if(!ids.has(o.id)||o.state!==undefined&&!states.includes(o.state)||['label','description'].some(k=>o[k]!==undefined&&!text(o[k],k==='label'?70:350)))throw Error('Staging override target');}}}}
 return s;
}
export function resolveStaging(s,facts=[]){if(!s)return null;validateStaging(s);const out=structuredClone(s);for(const v of s.overrides||[])if(matchesStory(v.when,facts)){for(const k of ['goal','pressure'])if(v[k])out[k]=v[k];for(const change of v.objects||[])Object.assign(out.objects.find(o=>o.id===change.id),change);}delete out.overrides;return out;}
export function continuityLabel(pack,id){return pack?.glossary?.[id]||String(id).replace(/-/g,' ');}
// Fixed SVG vocabulary. Authored strings enter textContent, never SVG markup.
const drawings={
 terminal:'<path d="M40 30h130l15 87H28z" fill="url(#metal)"/><rect x="49" y="40" width="111" height="64" rx="9" fill="var(--cg-scene-0)" stroke="var(--cg-scene-1)"/><path d="m63 59 13 9-13 9m25 0h28" fill="none" stroke="var(--cg-scene-2)" stroke-width="5"/><path d="M37 125h144l9 15H26z" fill="var(--cg-scene-3)"/><path d="M48 134h101" stroke="var(--cg-scene-4)" stroke-dasharray="9 5"/>',
 world:'<circle cx="105" cy="79" r="59" fill="url(#planet)" stroke="var(--cg-scene-5)" stroke-width="2"/><path d="m63 49 22-16 17 9 22-4 8 14-17 13-6 17-21-6-3-18zM125 90l26-10 7 18-19 25-17-12z" fill="var(--cg-scene-6)" opacity=".85"/><ellipse cx="104" cy="80" rx="87" ry="19" fill="none" stroke="var(--cg-scene-7)" opacity=".7" transform="rotate(-19 104 80)"/><g class="cg-world-window"><path d="M86 72h47v41H86z" fill="var(--cg-scene-8)" stroke="var(--cg-scene-9)" stroke-width="4"/><path d="M109 75v35M89 91h41" stroke="var(--cg-scene-10)" stroke-width="3"/><path d="M94 103h26" stroke="var(--cg-scene-11)" stroke-width="3"/><circle cx="102" cy="85" r="4" fill="var(--cg-scene-12)"/><path d="m102 90 4 13m1-6 8-2" stroke="var(--cg-scene-12)" stroke-width="3"/><path d="M114 94h7v7h-7zm7 1q7 0 3 5" fill="none" stroke="var(--cg-scene-12)" stroke-width="2"/></g><g class="cg-world-shutter"><rect x="84" y="69" width="52" height="47" rx="3" fill="var(--cg-scene-13)" stroke="var(--cg-scene-14)"/><path d="M87 78h46m-46 9h46m-46 9h46m-46 9h46" stroke="var(--cg-scene-15)"/><path d="M100 89q0-11 8-11t8 11v10H99zm5 13h7" fill="none" stroke="var(--cg-scene-16)" stroke-width="2"/></g>',
 switch:'<path d="M43 65h128v64H43z" fill="url(#metal)" stroke="var(--cg-scene-17)"/><circle cx="105" cy="89" r="24" fill="var(--cg-scene-18)" stroke="var(--cg-scene-19)"/><path d="m104 87 8-53" stroke="var(--cg-scene-20)" stroke-width="15"/><path d="m54 111 24-9m56 0 25 9" stroke="var(--cg-scene-21)" stroke-width="4"/>',
 cable:'<path d="M30 105c60 0 24-65 79-65s8 72 67 64" fill="none" stroke="var(--cg-scene-22)" stroke-width="20"/><path d="M30 105c60 0 24-65 79-65s8 72 67 64" fill="none" stroke="var(--cg-scene-23)" stroke-width="5" stroke-dasharray="14 9"/><path d="M20 91h23v28H20zm145-3h24v29h-24z" fill="var(--cg-scene-24)" stroke="var(--cg-scene-25)"/><path d="m47 103 13-4m91-2 13 4" stroke="var(--cg-scene-26)" stroke-width="4"/>',
 record:'<path d="M38 27h137v111H38z" fill="url(#metal)" stroke="var(--cg-scene-27)"/><circle cx="106" cy="79" r="43" fill="var(--cg-scene-28)" stroke="var(--cg-scene-29)"/><circle cx="106" cy="79" r="27" fill="none" stroke="var(--cg-scene-30)" stroke-width="7"/><circle cx="106" cy="79" r="7" fill="var(--cg-scene-31)"/><path d="M43 46h126" stroke="var(--cg-scene-4)" stroke-dasharray="17 11"/>',
 gate:'<path d="M34 135V35l19-15h104l20 15v100h-24V44H57v91z" fill="url(#metal)" stroke="var(--cg-scene-32)"/><path d="M70 51v77m18-77v77m18-77v77m18-77v77m18-77v77" stroke="var(--cg-scene-33)" stroke-width="3" opacity=".8"/><ellipse cx="106" cy="83" rx="39" ry="48" fill="url(#glow)"/>',
 relay:'<path d="M35 109h144v27H35zM53 43h32v66H53zm77 0h32v66h-32z" fill="url(#metal)" stroke="var(--cg-scene-34)"/><path d="M68 57c18-31 63-31 77 0M68 89c18 30 63 30 77 0" fill="none" stroke="var(--cg-scene-35)" stroke-width="4"/><circle cx="68" cy="74" r="15" fill="var(--cg-scene-36)" stroke="var(--cg-scene-37)"/><circle cx="146" cy="74" r="15" fill="var(--cg-scene-36)" stroke="var(--cg-scene-37)"/>',
 latch:'<path d="M47 28h123v109H47z" fill="url(#metal)" stroke="var(--cg-scene-38)"/><path d="M59 38h99v89H59z" fill="var(--cg-scene-39)" stroke="var(--cg-scene-40)"/><path d="M137 82v27h-33" fill="none" stroke="var(--cg-scene-41)" stroke-width="8"/><circle cx="136" cy="79" r="10" fill="var(--cg-scene-42)"/>',
 pump:'<path d="M41 60h126v62H41z" fill="url(#metal)" stroke="var(--cg-scene-43)"/><circle cx="101" cy="91" r="29" fill="var(--cg-scene-44)" stroke="var(--cg-scene-45)"/><path d="m101 67 5 22 22 3-21 5-6 21-4-20-21-5 20-5z" fill="var(--cg-scene-46)"/><path d="M20 79h21v29H20zm147-1h27v29h-27z" fill="var(--cg-scene-47)"/>',
 bell:'<path d="M70 105V66q0-35 35-35t35 35v39l11 13H59z" fill="url(#metal)" stroke="var(--cg-scene-48)" stroke-width="4"/><path d="M92 128q14 12 27 0M47 53l-12-9m127 8 13-8" fill="none" stroke="var(--cg-scene-49)" stroke-width="4"/>',
 map:'<path d="m28 40 53-13 51 17 54-12v99l-54 9-51-17-53 14z" fill="var(--cg-scene-50)" stroke="var(--cg-scene-51)"/><path d="m81 27 0 95m51-78v95" stroke="var(--cg-scene-51)"/><path d="m48 103 42-38 34 38 37-51" fill="none" stroke="var(--cg-scene-52)" stroke-width="4" stroke-dasharray="8 5"/><circle cx="161" cy="52" r="8" fill="var(--cg-scene-53)"/>',
 charge:'<circle cx="106" cy="80" r="42" fill="url(#planet)" stroke="var(--cg-scene-54)"/><path d="M27 81h39m80 0h39m-78-61v18m0 85v17" stroke="var(--cg-scene-55)" stroke-width="5"/><path d="m110 48-22 36h19l-6 28 24-39h-19z" fill="var(--cg-scene-56)"/>'
};
export function mountStaging(host,{consider=()=>{}}={}){
 const doc=host.ownerDocument,node=(tag,cls='',txt='')=>{const n=doc.createElement(tag);n.className=cls;n.textContent=txt;return n;};
 const head=node('div','cg-tableau-head','SCENE RECONSTRUCTION / INTERACTIVE SCHEMATIC'),grid=node('div','cg-tableau-grid'),description=node('p','cg-tableau-reading');description.setAttribute('role','status');host.append(head,grid,description);let key='';
 return {update(value,choices=[]){const next=JSON.stringify([value,choices.map(c=>({id:c.id,label:c.label,focus:c.focus}))]);if(next===key)return;key=next;grid.replaceChildren();host.hidden=!value;if(!value)return;head.textContent='SCENE RECONSTRUCTION / PROCEDURAL SCHEMATIC';host.classList.remove('cg-tableau-illustrated');
  const ids=new Set(value.objects.map(o=>o.id));for(const c of choices)if(c.focus?.some(id=>!ids.has(id)))throw Error('Choice refers to absent scene object');
  for(const [i,o]of value.objects.entries()){
   const b=node('button','cg-scene-prop');b.type='button';b.dataset.object=o.id;b.dataset.propState=o.state;b.setAttribute('aria-label',o.label+' / '+o.state+' / inspect');
   const picture=doc.createElementNS('http://www.w3.org/2000/svg','svg');picture.setAttribute('viewBox','0 0 210 155');picture.setAttribute('aria-hidden','true');
   // Only fixed vocabulary, numeric per-mount prefix and enumerated state form SVG.
   const prefix='cg-prop-'+i+'-';picture.innerHTML=('<defs><linearGradient id="metal" x2=".5" y2="1"><stop stop-color="var(--cg-scene-57)"/><stop offset=".45" stop-color="var(--cg-scene-58)"/><stop offset="1" stop-color="var(--cg-scene-59)"/></linearGradient><radialGradient id="planet" cx=".3" cy=".2"><stop stop-color="var(--cg-scene-60)"/><stop offset=".48" stop-color="var(--cg-scene-61)"/><stop offset="1" stop-color="var(--cg-scene-62)"/></radialGradient><radialGradient id="glow"><stop stop-color="var(--cg-scene-63)" stop-opacity=".5"/><stop offset="1" stop-color="var(--cg-scene-63)" stop-opacity="0"/></radialGradient></defs>'+drawings[o.kind]).replaceAll('id="','id="'+prefix).replaceAll('url(#','url(#'+prefix);
   b.append(picture,node('strong','',o.label),node('span','cg-prop-condition',o.state.toUpperCase()));
   b.addEventListener('click',()=>{const related=choices.filter(c=>c.focus?.includes(o.id));description.textContent=o.description+(related.length?' Related actions: '+related.map(c=>c.label+(c.stakes?' — '+(c.stakes.pass===c.stakes.fail?c.stakes.pass:'If it holds: '+c.stakes.pass+' If it fails: '+c.stakes.fail):'')).join(' / ')+'.':'');for(const n of grid.children)n.setAttribute('aria-pressed',String(n===b));consider(o.id,related.map(c=>c.id));});grid.append(b);
  }
  description.textContent='Inspect a part to connect what you see with what you can do. No turn or resource is spent.';
 }};
}

/** Catch misspelled/dead fact guards while allowing exact inherited facts. */
export function validateStagingCauses(pack,inheritedFacts=[]){
 if(!pack.stagingVersion)return;
 const produced=new Set(inheritedFacts);
 for(const action of [...pack.rules,...pack.scenes.flatMap(s=>s.choices)])for(const result of ['success','failure'])for(const fact of action[result].facts)produced.add(fact);
 const conditions=pack.scenes.flatMap(s=>[...(s.staging?.overrides||[]).map(v=>v.when),...s.choices.map(c=>c.when).filter(Boolean)]).concat((pack.ending.staging?.overrides||[]).map(v=>v.when));
 for(const condition of conditions)for(const fact of ['all','any','none'].flatMap(k=>condition[k]||[]))if(!produced.has(fact))throw Error('Unproduced scene guard: '+fact);
}
