/** Bounded, data-only dramatic composition. Reads witnessed facts; never rolls,
 * resolves an action, invents a memory, or mutates canonical state. */
const fail=m=>{throw Error(m);};
const text=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
const fields=(v,names)=>{if(!v||Array.isArray(v)||typeof v!=='object'||Object.keys(v).some(k=>!names.includes(k)))fail('Unknown story field');};
export function validateCondition(c){
 fields(c,['all','any','none']);let count=0;
 for(const k of Object.keys(c)){if(!Array.isArray(c[k])||c[k].length>8||c[k].some(f=>!text(f,160))||new Set(c[k]).size!==c[k].length)fail('Story condition facts');count+=c[k].length;}
 if(!count||Object.keys(c).every(k=>c[k].length===0))fail('Empty story condition');
 if(c.all?.some(f=>c.none?.includes(f)))fail('Contradictory story condition');
}
export function matchesStory(c,facts){const set=new Set(facts);return (!c.all||c.all.every(f=>set.has(f)))&&(!c.any?.length||c.any.some(f=>set.has(f)))&&(!c.none||c.none.every(f=>!set.has(f)));}
export function validateEchoes(echoes){
 if(echoes===undefined)return;
 if(!Array.isArray(echoes)||echoes.length>8)fail('Story echo budget');const ids=new Set();
 for(const e of echoes){fields(e,['id','when','scene','lead','ghost']);if(!/^[a-z][a-z0-9-]{0,47}$/.test(e.id)||ids.has(e.id))fail('Story echo ID');ids.add(e.id);validateCondition(e.when);let count=0;for(const k of ['scene','lead','ghost'])if(e[k]!==undefined){if(!text(e[k],600))fail('Story echo text');count++;}if(!count)fail('Empty story echo');}
}
export function validateEndingVariants(variants){
 if(variants===undefined)return;
 if(!Array.isArray(variants)||variants.length>6)fail('Ending variant budget');const ids=new Set();
 for(const v of variants){fields(v,['id','when','title','scene','ghost']);if(!/^[a-z][a-z0-9-]{0,47}$/.test(v.id)||ids.has(v.id))fail('Ending variant ID');ids.add(v.id);validateCondition(v.when);if(!text(v.title,160)||!text(v.scene,3000)||!text(v.ghost,1000))fail('Ending variant writing');}
}
export function composeStory(base,facts,{ending=false}={}){
 const variant=ending?base.variants?.find(v=>matchesStory(v.when,facts)):null;
 const result={title:variant?.title||base.title,scene:variant?.scene||base.scene,lead:base.lead||'',ghost:variant?.ghost||base.ghost};
 for(const e of base.echoes||[])if(matchesStory(e.when,facts))for(const k of ['scene','lead','ghost'])if(e[k])result[k]=(result[k]?result[k]+'\n\n':'')+e[k];
 // Total composed writing is bounded independently of each admitted fragment.
 if(result.scene.length>6000||result.lead.length>1800||result.ghost.length>1800)fail('Composed story budget');
 return result;
}
export function dramaticHandoff(state){
 const p=state.pack;if(!p)return null;
 return {schema:'friken.ghost.dramatic-handoff.v1',source:'Exact retained state; proposals are not past events.',
  completed:!!state.ending,currentScene:state.ending?null:p.scenes[state.turn-1].id,
  decisions:state.journal.map(r=>({turn:r.turn,attempt:r.label,outcome:r.outcome,reaction:r.ghostComment})),
  witnessedFacts:[...state.world.facts],openObligations:[...state.world.threads],relationships:{...state.relations},
  ending:state.ending?composeStory(p.ending,state.world.facts,{ending:true}):null,
  nextAuthor:['Answer the selected next question through an action, not another compulsory first meeting.','Use three distinct witnessed causes: one early affordance, one relationship complication, one climax consequence.','Ask who still wants something incompatible with the plan. Give them useful leverage.','Keep unobserved branches unknown. Carry unpaid work and declined access. Do not elect a speculative clue as recovered history.']};
}
/** Editorial evidence, not a numerical quality score or mandatory plot generator. */
export function storyAudit(pack){
 const echoes=pack.scenes.flatMap(s=>(s.echoes||[]).map(e=>({scene:s.id,id:e.id,when:e.when}))),endings=(pack.ending.variants||[]).map(v=>({id:v.id,when:v.when}));
 const choices=pack.scenes.flatMap(s=>s.choices.map(c=>({scene:s.id,id:c.id,checked:!!c.check,guarded:!!c.use,facts:[...new Set([...c.success.facts,...c.failure.facts])],open:c.success.threads,resolve:c.success.resolve})));
 const conditions=[...echoes,...endings,...(pack.ending.echoes||[]).map(e=>({scene:'ending',id:e.id,when:e.when}))];
 const producers=new Set([...choices.flatMap(c=>c.facts),...pack.rules.flatMap(r=>[...r.success.facts,...r.failure.facts])]);
 return {schema:'friken.ghost.story-audit.v1',chapter:pack.id,decisions:pack.scenes.length,choicesOffered:choices.length,scenes:pack.scenes.length,conditionalReturns:conditions.length,endingRoutes:endings,returns:conditions,unproducedFacts:[...new Set(conditions.flatMap(e=>Object.values(e.when).flat()).filter(f=>!producers.has(f)))],unpaidThreads:[...new Set(choices.flatMap(c=>c.open))],editorialQuestions:['What does each person do here that another person cannot?','Where does Ghost admit a mistake and change his next action?','Which useful thing is genuinely unavailable because of the selected approach?','What earlier object returns changed at the ending?']};
}
