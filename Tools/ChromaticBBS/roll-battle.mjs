import {createLife,drawLifeTheater} from './life-theater.mjs';
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
export function mountRollBattle(root,onContinue){
  const get=id=>root.querySelector('#cg-roll-'+id),box=get('battle'),canvas=get('canvas'),ctx=canvas.getContext('2d');
  let plan=null,raf=0,elapsed=0,last=0,paused=false,active=false,phase='closed',mode='armies',colony=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  function colors(){const s=getComputedStyle(root);return ['--cg-bg','--cg-line','--cg-ink','--cg-accent','--cg-warn','--cg-text'].map(k=>s.getPropertyValue(k).trim());}
  function status(){
    phase=elapsed>=plan.duration?'resolved':paused?'paused':elapsed<1700?'gathering':elapsed<3500?'sample-locked':elapsed<5200?'stat-feeds-life':elapsed<7600?'threshold':'bloom';
    box.dataset.phase=phase;get('phase').textContent=phase==='resolved'?'RESULT HELD / YOUR MOVE':phase.toUpperCase()+' / RECEIPT LOCKED';
    get('continue').hidden=phase!=='resolved';get('pause').hidden=phase==='resolved';get('finish').hidden=phase==='resolved';get('pause').textContent=paused?'RESUME BATTLE':'PAUSE BATTLE';
    get('replay').hidden=phase!=='resolved';
    if(phase==='resolved')get('result').textContent=(plan.roll.grade==='resonance'?'RESONANCE / EXACT STRIKE':plan.roll.success?'PASS':'FAIL FORWARD')+' · '+plan.roll.die+' + '+plan.roll.value+' = '+plan.roll.total+' vs DC '+plan.roll.dc+' · '+(plan.margin===0?'EXACT TIE / MEETS DC':(plan.margin>0?'+':'')+plan.margin+' MARGIN');
    else get('result').textContent='Life gathers → your stat feeds it → the threshold answers. Same locked outcome on replay.';
  }
  function draw(){
    if(!plan||!ctx)return;
    drawLifeTheater(ctx,canvas,plan.roll,elapsed,plan.duration,colony,colors());
  }
  function tick(now){if(!active||paused)return;elapsed=Math.min(plan.duration,elapsed+Math.max(0,Math.min(70,now-last)));last=now;draw();status();if(elapsed<plan.duration)raf=requestAnimationFrame(tick);}
  function play(){cancelAnimationFrame(raf);colony=createLife(Math.round(plan.roll.die*100)*65537+Math.round(plan.roll.dc*100));elapsed=reduced.matches||!ctx?plan.duration:0;paused=false;last=performance.now();draw();status();if(elapsed<plan.duration)raf=requestAnimationFrame(tick);}
  function hold(value){if(!active||elapsed>=plan.duration)return;paused=value;cancelAnimationFrame(raf);status();if(!paused){last=performance.now();raf=requestAnimationFrame(tick);}}
  function close(){if(!active)return;active=false;cancelAnimationFrame(raf);phase='closed';box.hidden=true;root.dataset.roll='closed';onContinue?.();}
  get('pause').addEventListener('click',()=>hold(!paused));
  get('finish').addEventListener('click',()=>{cancelAnimationFrame(raf);elapsed=plan.duration;paused=false;draw();status();});
  get('replay').addEventListener('click',play);get('continue').addEventListener('click',close);
  const resize=new ResizeObserver(()=>{if(active)draw();});resize.observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hold(true);});
  return {setMode(value){if(!['armies','balance'].includes(value))throw Error('Unknown roll theater');mode=value;box.dataset.theater=mode;},show(receipt,decision=null){get('comment').textContent=decision?.comment||'';plan=battlePlan(receipt.roll);plan.duration=9400;active=true;box.hidden=false;root.dataset.roll='open';get('choice').textContent=receipt.label;get('math').textContent=(plan.roll.system?'CAUSAL ':'d20 ')+plan.roll.die+' + '+plan.roll.stat.toUpperCase()+' '+plan.roll.value+' vs DC '+plan.roll.dc;canvas.setAttribute('aria-label',get('math').textContent+'; '+(plan.roll.success?'pass':'fail')+'. Life gathers into the sample, the stat feeds it, and the surge tests the target. The animation replays the committed result.');play();box.scrollIntoView({block:'center',behavior:'instant'});},hold,close,get active(){return active;},get phase(){return phase;}};
}
