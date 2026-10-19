/* Receipt theater, inspired by Krex Army Fight v3 (story-engine.js).
 * Presentation never owns a die, reducer, score, or save writer. */
export function battlePlan(roll){
  if(!roll||!Number.isInteger(roll.die)||roll.die<1||roll.die>20||!Number.isInteger(roll.value)||roll.value<0||roll.value>20||!Number.isInteger(roll.dc)||roll.dc<1||roll.dc>40||roll.total!==roll.die+roll.value||roll.success!==(roll.total>=roll.dc))throw Error('Inconsistent roll receipt');
  const units=[];
  function army(n,side,kind){while(n>0){const hp=Math.min(4,n);units.push({id:units.length,side,kind,hp});n-=hp;}}
  army(roll.die,'player','die');army(roll.value,'player','stat');army(roll.dc,'dc','dc');
  const hp=units.map(u=>u.hp),hits=[];
  const playerCount=units.findIndex(u=>u.side==='dc');
  let p=0,d=playerCount;
  while(p<playerCount&&d<units.length){const damage=Math.min(hp[p],hp[d]);hp[p]-=damage;hp[d]-=damage;hits.push({p,d,damage,remaining:[...hp]});if(hp[p]===0)p++;if(hp[d]===0)d++;}
  return {roll:{...roll},units,hits,survivors:hp,margin:roll.total-roll.dc,duration:2200+hits.length*520+650};
}
export function mountRollBattle(root,onContinue){
  const get=id=>root.querySelector('#cg-roll-'+id),box=get('battle'),canvas=get('canvas'),ctx=canvas.getContext('2d');
  let plan=null,raf=0,elapsed=0,last=0,paused=false,active=false,phase='closed',mode='armies';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
  function colors(){const s=getComputedStyle(root);return ['--cg-bg','--cg-line','--cg-ink','--cg-accent','--cg-warn','--cg-text'].map(k=>s.getPropertyValue(k).trim());}
  function status(){
    phase=elapsed>=plan.duration?'resolved':paused?'paused':elapsed<700?'sampling':elapsed<1450?'deploying':elapsed<2200?'charging':elapsed>=2200+plan.hits.length*520?'resolving':'clashing';
    box.dataset.phase=phase;get('phase').textContent=phase==='resolved'?'RESULT HELD / YOUR MOVE':phase.toUpperCase()+' / RECEIPT LOCKED';
    get('continue').hidden=phase!=='resolved';get('pause').hidden=phase==='resolved';get('finish').hidden=phase==='resolved';get('pause').textContent=paused?'RESUME BATTLE':'PAUSE BATTLE';
    get('replay').hidden=phase!=='resolved';
    if(phase==='resolved')get('result').textContent=(plan.roll.success?'PASS':'FAIL FORWARD')+' · '+plan.roll.die+' + '+plan.roll.value+' = '+plan.roll.total+' vs DC '+plan.roll.dc+' · '+(plan.margin===0?'EXACT TIE / MEETS DC':(plan.margin>0?'+':'')+plan.margin+' MARGIN');
    else get('result').textContent='The numbers settle this. Your next move waits for you.';
  }
  function draw(){
    if(!plan||!ctx)return;
    const w=canvas.clientWidth||600,h=310,dpr=Math.min(2,devicePixelRatio||1);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==h*dpr){canvas.width=Math.round(w*dpr);canvas.height=h*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const [bg,line,ink,accent,gold,fg]=colors(),t=elapsed/1000,cx=w/2;
    if(mode==='balance'){
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);const progress=ease(elapsed/1800),scale=(w-50)/40,origin=25;
      ctx.font='bold 14px ui-monospace,monospace';ctx.fillStyle=fg;ctx.textAlign='left';ctx.fillText('CAUSAL BALANCE / ONE COMMITTED ROLL',20,28);
      const segments=[[plan.roll.die,ink,'DIE'],[plan.roll.value,gold,plan.roll.stat.toUpperCase()]];let x=origin;
      for(const [value,color,label]of segments){ctx.fillStyle=color;ctx.fillRect(x,80,value*scale*progress,38);ctx.fillStyle=fg;ctx.fillText(label+' '+value,x,68);x+=value*scale*progress;}
      ctx.fillStyle=accent;ctx.fillRect(origin,164,plan.roll.dc*scale*progress,38);ctx.fillStyle=fg;ctx.fillText('DEFENCE '+plan.roll.dc,origin,150);
      ctx.strokeStyle=line;for(let i=0;i<=40;i++){ctx.beginPath();ctx.moveTo(origin+i*scale,75);ctx.lineTo(origin+i*scale,210);ctx.stroke();}
      ctx.fillStyle=gold;ctx.font='bold 24px ui-monospace,monospace';ctx.fillText(plan.roll.total+' vs '+plan.roll.dc+' / '+(plan.margin>=0?'+':'')+plan.margin,20,258);
      canvas.dataset.remaining=plan.survivors.filter((_,i)=>plan.units[i].side==='player').reduce((a,b)=>a+b,0)+':'+plan.survivors.filter((_,i)=>plan.units[i].side==='dc').reduce((a,b)=>a+b,0);canvas.dataset.receipt=plan.roll.die+':'+plan.roll.total+':'+plan.roll.dc;return;
    }

    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    // Perspective circuit floor; one finite sweep, no idle animation.
    ctx.strokeStyle=line;ctx.lineWidth=.7;
    for(let i=-8;i<=8;i++){ctx.beginPath();ctx.moveTo(cx+i*12,100);ctx.lineTo(cx+i*w*.15,h);ctx.stroke();}
    for(let i=0;i<7;i++){let y=110+i*i*5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    function label(text,x,y,size,color=fg,align='center'){ctx.font='bold '+size+'px ui-monospace,monospace';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x,y);}
    label('DIE + '+plan.roll.stat.toUpperCase(),12,17,11,ink,'left');label('DC DEFENCE',w-12,17,11,accent,'right');
    const done=elapsed>=plan.duration,settled=elapsed>=2200+plan.hits.length*520,hitIndex=Math.max(-1,Math.min(plan.hits.length-1,Math.floor((elapsed-2200)/520)));
    const prevHp=hitIndex>0?plan.hits[hitIndex-1].remaining:plan.units.map(u=>u.hp);
    const fraction=clamp(((elapsed-2200)%520)/520),hit=elapsed>=2200?plan.hits[hitIndex]:null;
    const hp=settled?plan.survivors:hit&&fraction>.64?hit.remaining:prevHp;
    const player=plan.units.filter(u=>u.side==='player'),defenders=plan.units.filter(u=>u.side==='dc');
    const charge=ease((elapsed-1450)/750),deployment=ease((elapsed-700)/750);
    const positions=[];
    for(const u of plan.units){
      const team=u.side==='player'?player:defenders,i=team.indexOf(u),left=u.side==='player';
      const columns=Math.max(1,Math.floor((w*.43-16)/43)),col=i%columns,row=Math.floor(i/columns),rows=Math.ceil(team.length/columns);
      const homeX=left?25+col*43:w-25-col*43,homeY=135+row*Math.min(43,125/rows);
      let x=(left?-25:w+25)+(homeX-(left?-25:w+25))*deployment;
      let y=homeY;
      if(hit&&(hit.p===u.id||hit.d===u.id)&&!settled){const lunge=Math.sin(fraction*Math.PI);x+=(cx+(left?-18:18)-x)*lunge;y+=(178-y)*lunge;}
      else x+=(left?10:-10)*charge;
      positions[u.id]=[x,y];
      const value=elapsed<2200?u.hp:hp[u.id];if(value<=0)continue;
      const color=u.kind==='die'?ink:u.kind==='stat'?gold:accent;
      ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=bg;ctx.lineWidth=1.5;ctx.shadowColor=color;ctx.shadowBlur=8;
      ctx.beginPath();if(left){ctx.moveTo(0,-17);ctx.lineTo(17,0);ctx.lineTo(0,17);ctx.lineTo(-17,0);}else{ctx.rect(-15,-15,30,30);}ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      label(String(value),0,0,17,color);
      ctx.fillStyle=color;ctx.globalAlpha=.6;ctx.fillRect(-14,22,28*value/u.hp,2);ctx.restore();
    }
    // Acquisition ring condenses into two forces. Cycling faces are cosmetic.
    if(elapsed<1450){
      const fade=1-ease((elapsed-700)/750);ctx.globalAlpha=fade;
      for(let j=0;j<3;j++){ctx.strokeStyle=j===1?gold:ink;ctx.beginPath();ctx.ellipse(cx,165,47+j*13,24+j*11,t*(j%2?-1:1)+j,0,Math.PI*2);ctx.stroke();}
      label(String(elapsed<700?1+Math.floor(elapsed/47)%20:plan.roll.die),cx,165,44,ink);ctx.globalAlpha=1;
    }
    if(hit&&elapsed>=2200&&!settled){
      const impact=clamp((fraction-.55)/.45);
      if(impact>0){ctx.save();ctx.globalAlpha=1-impact;ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,178,8+impact*70,0,Math.PI*2);ctx.stroke();
        for(let j=0;j<20;j++){const a=j*2.39996+hitIndex,r=impact*(25+(j%5)*12),x=cx+Math.cos(a)*r,y=178+Math.sin(a)*r*.7;ctx.fillStyle=j%2?ink:accent;ctx.fillRect(x,y,3,3);}ctx.restore();
        label('−'+hit.damage+' EACH',cx,104,12,gold);
      }
    }
    const current=elapsed<2200?plan.units.map(u=>u.hp):hp;
    const leftTotal=plan.units.reduce((s,u)=>s+(u.side==='player'?current[u.id]:0),0),rightTotal=plan.units.reduce((s,u)=>s+(u.side==='dc'?current[u.id]:0),0);
    label('FORCE '+leftTotal,12,286,12,ink,'left');label('FORCE '+rightTotal,w-12,286,12,accent,'right');
    label(plan.roll.die+' + '+plan.roll.value+'  /  '+plan.roll.dc,cx,54,w<380?22:30,gold);
    if(done){ctx.fillStyle=bg;ctx.globalAlpha=.94;ctx.fillRect(0,105,w,98);ctx.globalAlpha=1;label(plan.roll.success?'BREACH':'HELD',cx,141,w<380?35:48,plan.roll.success?ink:accent);label(plan.margin===0?'TIE MEETS THE DC':(plan.margin>0?'+':'')+plan.margin+' / FINAL MARGIN',cx,183,12,gold);}
    canvas.dataset.remaining=leftTotal+':'+rightTotal;canvas.dataset.receipt=plan.roll.die+':'+plan.roll.total+':'+plan.roll.dc;
  }
  function tick(now){if(!active||paused)return;elapsed=Math.min(plan.duration,elapsed+Math.min(70,now-last));last=now;draw();status();if(elapsed<plan.duration)raf=requestAnimationFrame(tick);}
  function play(){cancelAnimationFrame(raf);elapsed=reduced.matches||!ctx?plan.duration:0;paused=false;last=performance.now();draw();status();if(elapsed<plan.duration)raf=requestAnimationFrame(tick);}
  function hold(value){if(!active||elapsed>=plan.duration)return;paused=value;cancelAnimationFrame(raf);status();if(!paused){last=performance.now();raf=requestAnimationFrame(tick);}}
  function close(){if(!active)return;active=false;cancelAnimationFrame(raf);phase='closed';box.hidden=true;root.dataset.roll='closed';onContinue?.();}
  get('pause').addEventListener('click',()=>hold(!paused));
  get('finish').addEventListener('click',()=>{cancelAnimationFrame(raf);elapsed=plan.duration;paused=false;draw();status();});
  get('replay').addEventListener('click',play);get('continue').addEventListener('click',close);
  const resize=new ResizeObserver(()=>{if(active)draw();});resize.observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hold(true);});
  return {setMode(value){if(!['armies','balance'].includes(value))throw Error('Unknown roll theater');mode=value;box.dataset.theater=mode;},show(receipt,decision=null){get('comment').textContent=decision?.comment||'';plan=battlePlan(receipt.roll);active=true;box.hidden=false;root.dataset.roll='open';get('choice').textContent=receipt.label;get('math').textContent='d20 '+plan.roll.die+' + '+plan.roll.stat.toUpperCase()+' '+plan.roll.value+' vs DC '+plan.roll.dc;canvas.setAttribute('aria-label',get('math').textContent+'; '+(plan.roll.success?'pass':'fail')+'. Every impact subtracts the same amount from both armies.');play();box.scrollIntoView({block:'center',behavior:'instant'});},hold,close,get active(){return active;},get phase(){return phase;}};
}
