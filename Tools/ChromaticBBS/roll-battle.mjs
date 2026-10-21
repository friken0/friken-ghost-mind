import {createBattleLife,drawLifeTheater,battleTimeline,crossedBattleEvents} from './life-theater.mjs';
/* Receipt theater, inspired by Krex Army Fight v3 (story-engine.js).
 * Presentation never owns a die, reducer, score, or save writer. */
export function battlePlan(roll){
  const causal=roll?.system==='causality-v1',round=n=>Math.round(n*100)/100;
  if(!roll||!Number.isFinite(roll.die)||roll.die<(causal?.01:1)||roll.die>20||!Number.isInteger(roll.value)||roll.value<0||roll.value>20||!Number.isFinite(roll.dc)||roll.dc<1||roll.dc>40||roll.total!==round(roll.die+roll.value)||roll.success!==(roll.grade==='resonance'||roll.total>=roll.dc))throw Error('Inconsistent roll receipt');
  const units=[];
  function army(n,side,kind){while(n>0){const hp=Math.min(4,n);units.push({id:units.length,side,kind,hp:round(hp)});n=round(n-hp);}}
  army(roll.die,'player','die');army(roll.value,'player','stat');army(roll.dc,'dc','dc');
  const hp=units.map(u=>u.hp),hits=[];
  const playerCount=units.findIndex(u=>u.side==='dc');
  let p=0,d=playerCount;
  while(p<playerCount&&d<units.length){const damage=Math.min(hp[p],hp[d]);hp[p]=round(hp[p]-damage);hp[d]=round(hp[d]-damage);hits.push({p,d,damage,remaining:[...hp]});if(hp[p]===0)p++;if(hp[d]===0)d++;}
  return {roll:{...roll},units,hits,survivors:hp,margin:round(roll.total-roll.dc),duration:2200+hits.length*520+650};
}
export function mountRollBattle(root,onContinue,{audio}={}){
  const get=id=>root.querySelector('#cg-roll-'+id),box=get('battle'),canvas=get('canvas'),ctx=canvas.getContext('2d');
  let plan=null,raf=0,elapsed=0,last=0,paused=false,active=false,phase='closed',mode='armies',colony=null,events=[],readoutAt=-1,frames=0,frameStart=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function colors(){const s=getComputedStyle(root);return ['--cg-bg','--cg-line','--cg-battle-you','--cg-battle-world','--cg-warn','--cg-text'].map(k=>s.getPropertyValue(k).trim());}
  function status(){
    const nextPhase=elapsed>=plan.duration?'resolved':paused?'paused':elapsed<900?'gathering':elapsed<4000?'sample-assault':elapsed<6400?'stat-salvo':elapsed<7600?'crossfire':'outcome';
    if(phase===nextPhase)return;phase=nextPhase;
    box.dataset.phase=phase;get('phase').textContent=phase==='resolved'?'RESULT HELD / YOUR MOVE':phase.toUpperCase()+' / RECEIPT LOCKED';
    get('continue').hidden=phase!=='resolved';get('pause').hidden=phase==='resolved';get('finish').hidden=phase==='resolved';get('pause').textContent=paused?'RESUME BATTLE':'PAUSE BATTLE';
    get('replay').hidden=phase!=='resolved';
    if(phase==='resolved')get('result').textContent=(plan.roll.grade==='resonance'?'RESONANCE / EXACT STRIKE':plan.roll.success?'PASS':'FAIL FORWARD')+' · '+plan.roll.die+' + '+plan.roll.value+' = '+plan.roll.total+' vs TARGET '+plan.roll.dc+' · '+(plan.margin===0?'EXACT TIE / MEETS TARGET':(plan.margin>0?'+':'')+plan.margin+' MARGIN')+(plan.roll.grade==='resonance'?' / EXACT BONUS: '+Object.entries(plan.roll.bonus||{}).map(([k,v])=>k.toUpperCase()+' '+(v>0?'+':'')+v).join(', ')+', SCORE +10 (caps apply)':'');
    else get('result').textContent='OPEN THE REALITY GATE. Each labelled charge removes its value from the magenta shield. Gold charges are your stat boost. Exact-band alignment can unlock a surviving shield.';
  }
  function draw(){
    if(!plan||!ctx)return;
    const view=drawLifeTheater(ctx,canvas,plan.roll,elapsed,plan.duration,colony,colors(),events);
    const readoutKey=[view.generation,view.assault.spent,view.assault.open].join(':');if(readoutKey!==readoutAt){readoutAt=readoutKey;const a=view.assault,share=Math.round(a.absorbed/a.target*100);
      get('you-count').textContent=(a.reserve/100).toFixed(2);get('you-detail').textContent=a.hits+' / '+a.packets+' CHARGES LANDED · '+(a.overflow/100).toFixed(2)+' THROUGH';
      get('world-count').textContent=(a.shield/100).toFixed(2);get('world-detail').textContent=(a.absorbed/100).toFixed(2)+' / '+(a.target/100).toFixed(2)+' ABSORBED';
      get('leader').textContent=a.aligned?'EXACT ALIGNMENT / '+(a.shield/100).toFixed(2)+' SHIELD BYPASSED':a.open?'GATE OPEN / SIGNAL THROUGH':share+'% SHIELD CLEARED / '+(a.shield/100).toFixed(2)+' TO GO';
      get('territory').style.setProperty('--cg-share',share+'%');
      get('force').textContent=view.force.toFixed(2);get('charge').textContent=(view.force>=plan.roll.dc?'+':'')+(view.force-plan.roll.dc).toFixed(2);get('event').textContent=view.event.label;box.dataset.fieldLeader=a.open?'you':'world';
    }
    frames++;const age=performance.now()-frameStart;if(age>0)get('fps').textContent=Math.round(frames*1000/age)+' FPS / '+canvas.dataset.frameMs+' ms CPU';
  }
  function tick(now){if(!active||paused)return;const before=elapsed;elapsed=Math.min(plan.duration,elapsed+Math.max(0,Math.min(70,now-last)));last=now;for(const e of crossedBattleEvents(events,before,elapsed))audio?.battleCue(e);draw();status();if(elapsed<plan.duration)raf=requestAnimationFrame(tick);}
  function play(){cancelAnimationFrame(raf);audio?.stopBattle();colony=createBattleLife(Math.round(plan.roll.die*100)*65537+Math.round(plan.roll.dc*100));readoutAt=-1;frames=0;frameStart=performance.now();elapsed=reduced.matches||!ctx?plan.duration:0;paused=false;last=performance.now();if(!elapsed)audio?.battleCue(events[0]);draw();status();if(elapsed<plan.duration)raf=requestAnimationFrame(tick);}
  function hold(value){if(!active||elapsed>=plan.duration)return;paused=value;cancelAnimationFrame(raf);audio?.stopBattle();status();if(!paused){frames=0;frameStart=performance.now();last=performance.now();raf=requestAnimationFrame(tick);}}
  function close(){if(!active)return;active=false;cancelAnimationFrame(raf);audio?.stopBattle();phase='closed';box.hidden=true;root.dataset.roll='closed';onContinue?.();}
  get('pause').addEventListener('click',()=>hold(!paused));
  get('finish').addEventListener('click',()=>{cancelAnimationFrame(raf);audio?.stopBattle();elapsed=plan.duration;paused=false;draw();status();});
  get('replay').addEventListener('click',play);get('continue').addEventListener('click',close);
  const resize=new ResizeObserver(()=>{if(active)draw();});resize.observe(canvas);
  new IntersectionObserver(entries=>{if(active&&!box.hidden&&!entries[0].isIntersecting)hold(true);}).observe(box);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hold(true);});
  return {setMode(value){if(!['armies','balance'].includes(value))throw Error('Unknown roll theater');mode=value;box.dataset.theater=mode;},show(receipt,decision=null){get('comment').textContent=decision?.comment||'';plan=battlePlan(receipt.roll);plan.duration=9400;events=battleTimeline(plan.roll);get('force').textContent='0.00';get('target').textContent=plan.roll.dc.toFixed(2);get('stat').textContent=plan.roll.stat.toUpperCase()+' +'+plan.roll.value;get('band').textContent=plan.roll.resonance?'EXACT BAND '+plan.roll.resonance.lower.toFixed(2)+'–'+plan.roll.resonance.upper.toFixed(2):'TOTAL ≥ TARGET';box.dataset.outcome=plan.roll.grade||(plan.roll.success?'pass':'fail');active=true;box.hidden=false;root.dataset.roll='open';get('choice').textContent=receipt.label;get('math').textContent=(plan.roll.system?'CAUSAL ':'d20 ')+plan.roll.die+' + '+plan.roll.stat.toUpperCase()+' '+plan.roll.value+' vs TARGET '+plan.roll.dc;canvas.setAttribute('aria-label',get('math').textContent+'; '+(plan.roll.success?'pass':'fail')+'. Your cyan sample charges and gold stat boost assault a magenta shield. Each hit removes its printed value. Open the gate by clearing the shield or matching the exact band. Conway cells are the living wake.');play();box.scrollIntoView({block:'center',behavior:'instant'});},hold,close,get active(){return active;},get phase(){return phase;}};
}
