/* Causality / LIFE WAR. B3/S23 Immigration Life supplies real team populations.
 * Combat FX illustrate a saved receipt; neither cells nor FX can reroll it.
 * 80x40 cells, 90 finite generations, cached history, bounded Canvas2D FX. */
const sat=n=>Math.max(0,Math.min(1,n));
export function lifeStep(cells,w,h){const next=new Uint8Array(cells.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)n+=cells[((y+dy+h)%h)*w+(x+dx+w)%w];next[y*w+x]=n===3||(cells[y*w+x]&&n===2)?1:0;}return next;}
export function createLife(seed,w=48,h=24){let n=seed>>>0;const cells=new Uint8Array(w*h);for(let i=0;i<cells.length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;cells[i]=(n>>>24)<80?1:0;}return {cells,w,h,generation:0};}
export function teamLifeStep(cells,w,h){
 const next=new Uint8Array(cells.length),live=[0,0],born=[0,0],lost=[0,0];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let a=0,b=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy){const v=cells[((y+dy+h)%h)*w+(x+dx+w)%w];if(v===1)a++;else if(v===2)b++;}
  const i=y*w+x,old=cells[i],n=a+b;
  const owner=old?(n===2||n===3?old:0):(n===3?(a>b?1:2):0);next[i]=owner;
  if(owner){live[owner-1]++;if(!old)born[owner-1]++;}else if(old)lost[old-1]++;
 }
 return {cells:next,live,born,lost};
}
export function createBattleLife(seed,w=80,h=40){
 const field=createLife(seed,w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(Math.abs(x-w/2)<2)field.cells[i]=0;else if(field.cells[i])field.cells[i]=x<w/2?1:2;}
 return {...field,history:[],generation:0};
}
export function battleFrame(field,generation){
 if(!field.history){field.history=[];for(let i=0;i<field.cells.length;i++)if(field.cells[i])field.cells[i]=i%field.w<field.w/2?1:2;}
 if(!field.history.length){const live=[0,0];for(const v of field.cells)if(v)live[v-1]++;field.history.push({cells:field.cells.slice(),live,born:[0,0],lost:[0,0],births:[0,0],losses:[0,0]});}
 const goal=Math.min(90,Math.max(0,Math.floor(generation)));
 while(field.history.length<=goal){const previous=field.history.at(-1),step=teamLifeStep(previous.cells,field.w,field.h);step.births=step.born.map((v,i)=>v+previous.births[i]);step.losses=step.lost.map((v,i)=>v+previous.losses[i]);field.history.push(step);}
 field.generation=goal;field.cells=field.history[goal].cells;return field.history[goal];
}
export function battleTimeline(roll){
 const beats=[{at:0,kind:'deploy',side:0,label:'TWO COLONIES. ONE BAD IDEA.'},{at:1200,kind:'sample',side:0,label:'CAUSAL SAMPLE LOCKED'},{at:3100,kind:'reinforce',side:0,label:roll.stat.toUpperCase()+' REINFORCEMENT'},{at:6400,kind:'pressure',side:1,label:'REALITY PUSHES BACK'},{at:7600,kind:'collapse',side:roll.success?0:1,label:roll.grade==='resonance'?'RESONANCE / EXACT STRIKE':roll.success?'YOU BREAK THROUGH':'REALITY HOLDS'},{at:8600,kind:roll.grade==='resonance'?'resonance':roll.success?'victory':'defeat',side:roll.success?0:1,label:roll.grade==='resonance'?'HOLY FK. DEAD CENTRE.':roll.success?'THE UNIVERSE BLINKED FIRST.':'THE UNIVERSE HAS FILED AN OBJECTION.'}];
 for(let i=0;i<12;i++)beats.push({at:650+i*535,kind:i%3===2?'impact':'volley',side:i%2,label:i%2?'REALITY / COUNTERFIRE':'YOU / SIGNAL LANCE'});
 return beats.sort((a,b)=>a.at-b.at).map((e,id)=>({...e,id}));
}
export function crossedBattleEvents(events,from,to){return events.filter(e=>e.at>from&&e.at<=to);}
export function drawLifeTheater(ctx,canvas,roll,elapsed,duration,colony,colors,events=battleTimeline(roll)){
 const began=performance.now();elapsed=Math.max(0,elapsed);const t=elapsed/1000;
 const w=canvas.clientWidth||600,h=canvas.clientHeight||340,d=Math.min(globalThis.devicePixelRatio||1,1.5);
 if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}ctx.setTransform(d,0,0,d,0,0);
 const [bg,line,ink,accent,gold,fg]=colors,team=[ink,accent],generation=Math.min(90,Math.floor(elapsed/100)),f=battleFrame(colony,generation),prev=colony.history[Math.max(0,generation-1)];
 const sample=sat((elapsed-1200)/1500),stat=sat((elapsed-3100)/1400),force=roll.die*sample+roll.value*stat;
 const last=events.filter(e=>e.at<=elapsed).at(-1),impact=events.filter(e=>['impact','reinforce','collapse'].includes(e.kind)&&elapsed>=e.at&&elapsed-e.at<650);
 const shake=elapsed<duration?impact.reduce((n,e)=>n+Math.exp(-(elapsed-e.at)/125)*(['collapse','reinforce'].includes(e.kind)?6:3),0):0;
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(Math.sin(t*79)*shake,Math.cos(t*93)*shake*.6);
 // A deep tactical well. Its cells are the actual Immigration Life population.
 const pad=16,top=32,bottom=h-30,fw=w-pad*2,fh=bottom-top,cw=fw/colony.w,ch=fh/colony.h;
 const haze=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,w*.65);haze.addColorStop(0,line);haze.addColorStop(1,bg);ctx.globalAlpha=.5;ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
 ctx.strokeStyle=line;ctx.lineWidth=.6;ctx.beginPath();for(let x=0;x<=colony.w;x+=4){const px=pad+x*cw;ctx.moveTo(px,top);ctx.lineTo(px,bottom);}for(let y=0;y<=colony.h;y+=4){const py=top+y*ch;ctx.moveTo(pad,py);ctx.lineTo(w-pad,py);}ctx.stroke();
 const lifeAge=elapsed%100/100;
 for(let side=1;side<=2;side++){
  ctx.fillStyle=team[side-1];ctx.globalAlpha=.19;ctx.beginPath();
  for(let i=0;i<f.cells.length;i++)if(f.cells[i]===side){const x=pad+(i%colony.w+.5)*cw,y=top+(Math.floor(i/colony.w)+.5)*ch;ctx.rect(x-cw*.8,y-ch*.8,cw*1.6,ch*1.6);}ctx.fill();
  ctx.globalAlpha=.85;ctx.beginPath();for(let i=0;i<f.cells.length;i++)if(f.cells[i]===side){const x=pad+(i%colony.w+.5)*cw,y=top+(Math.floor(i/colony.w)+.5)*ch,r=Math.max(1,Math.min(cw,ch)*.42);if(side===1)ctx.rect(x-r,y-r,r*2,r*2);else{ctx.moveTo(x,y-r*1.3);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r*1.3);ctx.lineTo(x-r,y);ctx.closePath();}}ctx.fill();
  // Births flare white; losses leave a falling, fading embers trail.
  ctx.fillStyle=fg;ctx.globalAlpha=(1-lifeAge)*.7;let sparks=0;
  for(let i=0;i<f.cells.length&&sparks<160;i++)if(f.cells[i]===side&&!prev.cells[i]){const x=pad+(i%colony.w+.5)*cw,y=top+(Math.floor(i/colony.w)+.5)*ch;ctx.fillRect(x-1,y-1,2,2);sparks++;}
  ctx.fillStyle=team[side-1];ctx.globalAlpha=(1-lifeAge)*.5;sparks=0;
  for(let i=0;i<f.cells.length&&sparks<160;i++)if(prev.cells[i]===side&&!f.cells[i]){const x=pad+(i%colony.w+.5)*cw,y=top+(Math.floor(i/colony.w)+.5)*ch;ctx.fillRect(x+Math.sin(i)*lifeAge*7,y+lifeAge*8,2,2);sparks++;}
 }
 ctx.globalAlpha=1;
 // The dispute opens a rotating plasma throat; the two coloured membranes
 // counter-rotate. This is analytical ribbon geometry, not extra randomness.
 const aperture=Math.min(fh*.4,w*.18)*(elapsed>=7600?1:.5+.5*stat),cx0=w*.5,cy0=top+fh*.5;
 ctx.globalCompositeOperation='lighter';
 for(let ring=0;ring<8;ring++){
  ctx.strokeStyle=elapsed>=7600&&roll.grade==='resonance'?gold:team[ring%2];ctx.globalAlpha=.2+ring*.055;ctx.lineWidth=ring%3===0?2.5:1;
  ctx.beginPath();for(let k=0;k<=100;k++){const a=k*Math.PI*2/100,warp=1+.16*Math.sin(a*5+t*2+ring*.5)+.08*Math.cos(a*9-t*3),r=aperture*(.25+ring*.095)*warp,angle=a+t*(ring%2?-.4:.3),x=cx0+Math.cos(angle)*r,y=cy0+Math.sin(angle)*r*.73;if(k)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
 }
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 // Ring reactors hold the two flags. Their projectiles are explicitly FX.
 const core=[{x:w*.1,y:h*.51},{x:w*.9,y:h*.51}],radius=Math.min(27,h*.09);
 for(let s=0;s<2;s++){const p=core[s];ctx.strokeStyle=team[s];ctx.fillStyle=bg;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.stroke();for(let r=0;r<3;r++){ctx.globalAlpha=.65-r*.17;ctx.beginPath();ctx.arc(p.x,p.y,radius+7+r*6,t*(s?-1:1)+r,Math.PI*1.4+t*(s?-1:1)+r);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle=team[s];ctx.font='bold '+(w<400?10:13)+'px ui-monospace,monospace';ctx.textAlign='center';ctx.fillText(s?'WORLD':'YOU',p.x,p.y+4);}
 for(const e of events){const age=(elapsed-e.at)/1000;if(age<0||age>1.2||!['volley','impact','reinforce','pressure','collapse'].includes(e.kind))continue;const s=e.side,start=core[s],end={x:w*(.45+.1*Math.sin(e.id*2.7)),y:top+fh*(.25+.5*((e.id*7%11)/10))},p=sat(age/.42),x=start.x+(end.x-start.x)*p,y=start.y+(end.y-start.y)*p;
  ctx.strokeStyle=e.kind==='reinforce'?gold:team[s];ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=e.kind==='collapse'?5:2;
  if(p<1){ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(w*.5,start.y+Math.sin(t*8)*25,x,y);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle=fg;ctx.beginPath();ctx.moveTo(start.x,start.y-3);ctx.lineTo(x,y-3);ctx.stroke();ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();}
  else{const q=sat((age-.42)/.78),size=(e.kind==='collapse'?130:65)*q;ctx.globalAlpha=(1-q)*.8;for(let r=0;r<3;r++){ctx.beginPath();ctx.ellipse(end.x,end.y,Math.max(.1,size-r*5),Math.max(.1,(size-r*5)*.6),0,0,Math.PI*2);ctx.stroke();}for(let k=0;k<22;k++){const a=k*2.399+e.id,dist=size*(.4+(k%4)*.25);ctx.fillRect(end.x+Math.cos(a)*dist,end.y+Math.sin(a)*dist*.6,3,2);}
   ctx.textAlign='center';ctx.font='bold '+(w<420?11:16)+'px ui-monospace,monospace';ctx.fillText(e.kind==='reinforce'?'STAT +'+roll.value:e.kind==='collapse'?(roll.success?'BREACH':'REPELLED'):s?'COUNTER':'SURGE',end.x,end.y-20-q*28);
  }
 }
 // Salvos split into six arcing micro-lances: a bounded 72-shot choreography.
 for(const e of events){if(!['volley','impact'].includes(e.kind))continue;for(let k=0;k<6;k++){
  const age=(elapsed-e.at-k*36)/1000;if(age<0||age>.85)continue;
  const p=sat(age/.45),start=core[e.side],tx=w*(.35+.3*((e.id*11+k*3)%17)/16),ty=top+fh*(.12+.76*((e.id*7+k*5)%19)/18),bend=Math.sin(k*2.4+e.id)*fh*.3;
  const x=start.x+(tx-start.x)*p,y=start.y+(ty-start.y)*p+Math.sin(p*Math.PI)*bend;
  ctx.strokeStyle=team[e.side];ctx.fillStyle=team[e.side];ctx.globalAlpha=(1-sat((age-.45)/.4))*.8;ctx.lineWidth=1.2;
  if(p<1){const q=Math.max(0,p-.15);ctx.beginPath();ctx.moveTo(start.x+(tx-start.x)*q,start.y+(ty-start.y)*q+Math.sin(q*Math.PI)*bend);ctx.lineTo(x,y);ctx.stroke();ctx.fillRect(x-2,y-2,4,4);}
  else{const q=(age-.45)/.4;for(let j=0;j<9;j++){const a=j*2.399+k,r=q*(20+j*3);ctx.fillRect(tx+Math.cos(a)*r,ty+Math.sin(a)*r*.7,2,2);}}
 }}
 // A pair of oscillating force membranes meet at the dispute, fed by the roll.
 if(elapsed<7600){for(let side=0;side<2;side++)for(let strand=0;strand<4;strand++){
  ctx.strokeStyle=team[side];ctx.globalAlpha=.13+strand*.03;ctx.lineWidth=1+strand*.5;ctx.beginPath();
  for(let j=0;j<=40;j++){const p=j/40,x=core[side].x+(w*.5-core[side].x)*p,y=core[side].y+Math.sin(p*13-t*(side?5:7)+strand)*Math.sin(p*Math.PI)*(12+strand*8)*(1+stat*.5);if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
 }}
 // Outcome aperture erupts in the receipt winner's colour, never colony score.
 if(elapsed>=7600){const q=sat((elapsed-7600)/1000),exact=roll.grade==='resonance',color=exact?gold:team[roll.success?0:1],cx=w*.5,cy=h*.5;ctx.strokeStyle=color;ctx.lineWidth=exact?3:2;
  for(let k=0;k<(exact?12:7);k++){const a=k*Math.PI*2/(exact?12:7)+t*.3,r=(22+k*5)*q;ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.5,Math.max(1,r*.3),Math.max(1,r*.8),a+t*.3,0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=.9;ctx.fillStyle=bg;ctx.fillRect(w*.22,cy-22,w*.56,46);ctx.fillStyle=color;ctx.textAlign='center';ctx.font='bold '+(w<420?16:h<240?21:27)+'px ui-monospace,monospace';ctx.fillText(exact?'EXACT STRIKE':roll.success?'BREAKTHROUGH':'REALITY HOLDS',cx,cy-1);ctx.font='12px ui-monospace,monospace';ctx.fillText(roll.total.toFixed(2)+' vs '+roll.dc.toFixed(2)+' / '+(exact?'RESONANCE':roll.success?'PASS':'FAIL FORWARD'),cx,cy+20);
 }
 // Tactical history: the last thirty population samples, no invented health.
 const graphW=Math.min(w*.24,160),graphH=21,gx=w*.5-graphW*.5,gy=31;
 for(let side=0;side<2;side++){ctx.strokeStyle=team[side];ctx.lineWidth=1.5;ctx.globalAlpha=.65;ctx.beginPath();const window=colony.history.slice(Math.max(0,generation-29),generation+1);for(let k=0;k<window.length;k++){const px=gx+k*graphW/29,py=gy+graphH-window[k].live[side]/Math.max(1,colony.history[0].live[side])*graphH;if(k)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.stroke();}
 ctx.globalAlpha=1;ctx.restore();ctx.textAlign='left';ctx.fillStyle=fg;ctx.font='bold '+(w<420?11:13)+'px ui-monospace,monospace';ctx.fillText('LIFE WAR // B3/S23',16,23);ctx.textAlign='right';ctx.fillStyle=gold;ctx.font='11px ui-monospace,monospace';ctx.fillText('GEN '+String(generation).padStart(2,'0')+' / 90',w-16,23);
 ctx.textAlign='center';ctx.fillStyle=elapsed>=7600?(roll.grade==='resonance'?gold:team[roll.success?0:1]):gold;ctx.font='bold '+(w<420?9:12)+'px ui-monospace,monospace';ctx.fillText(last?.label||'COLONIES ARMING',w/2,h-25);ctx.font='10px ui-monospace,monospace';ctx.fillStyle=fg;ctx.fillText('LIVE CELLS BELOW / SAVED ROLL DECIDES THE STORY',w/2,h-9);
 canvas.dataset.lifeGeneration=String(colony.generation);canvas.dataset.receipt=[roll.die,roll.total,roll.dc].join(':');canvas.dataset.force=force.toFixed(2);canvas.dataset.target=roll.dc.toFixed(2);canvas.dataset.grade=roll.grade||(roll.success?'pass':'fail');canvas.dataset.frameMs=(performance.now()-began).toFixed(3);canvas.dataset.population=f.live.join(':');
 return {frame:f,force,generation,event:last};
}
