/* Causality / GATECRASH. Exact charge impacts perform the saved arithmetic.
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
// Fixed-point charges are the visual receipt. One impact spends one charge;
// shield absorption + overflow always equals spent power. Life is the wake.
export function battleTimeline(roll){
 const events=[{at:0,kind:'deploy',side:0,label:'OBJECTIVE / OPEN THE REALITY GATE'},{at:900,kind:'sample',side:0,label:'SAMPLE '+roll.die.toFixed(2)+' / CHARGES ARMED'},{at:4000,kind:'reinforce',side:0,label:roll.stat.toUpperCase()+' +'+roll.value+' / BOOST SALVO'}];
 for(const [source,power,start]of [['sample',roll.die,1300],['stat',roll.value,4300]]){
  let left=Math.round(power*100),i=0;while(left>0){const cents=Math.min(300,left),at=start+i*290,packet=source+'-'+i;events.push({at,kind:'volley',side:0,source,cents,packet,label:(source==='stat'?roll.stat.toUpperCase():'SAMPLE')+' CHARGE / '+(cents/100).toFixed(2)});events.push({at:at+430,kind:'impact',side:0,source,cents,packet,label:'GATE HIT / −'+(cents/100).toFixed(2)+' RESISTANCE'});left-=cents;i++;}
 }
 events.push({at:7100,kind:'pressure',side:1,label:'GATE VERDICT / NO MORE CHARGES'},{at:7600,kind:'collapse',side:roll.success?0:1,label:roll.grade==='resonance'?'EXACT BAND / RESONANCE UNLOCK':roll.success?'GATE OPEN / SIGNAL THROUGH':'GATE HOLDS / SIGNAL REJECTED'},{at:8600,kind:roll.grade==='resonance'?'resonance':roll.success?'victory':'defeat',side:roll.success?0:1,label:roll.grade==='resonance'?'THE LOCK RECOGNISED YOUR FREQUENCY.':roll.success?'YOU GOT THROUGH. REALITY CAN SULK.':'REALITY KEPT THE DOOR. KEEP THE CONSEQUENCES.'});
 return events.sort((a,b)=>a.at-b.at).map((e,id)=>({...e,id}));
}
export function battleAssault(roll,elapsed,events=battleTimeline(roll)){
 const hits=events.filter(e=>e.kind==='impact'&&e.at<=elapsed),spent=hits.reduce((n,e)=>n+e.cents,0),total=Math.round(roll.total*100),target=Math.round(roll.dc*100),absorbed=Math.min(target,spent),shield=target-absorbed,reserve=total-spent,overflow=spent-absorbed,resonance=roll.grade==='resonance'&&elapsed>=7600;
 return {spent,absorbed,shield,reserve,overflow,total,target,hits:hits.length,packets:events.filter(e=>e.kind==='impact').length,open:shield===0||resonance,resonance,aligned:resonance&&shield>0};
}
export function crossedBattleEvents(events,from,to){return events.filter(e=>e.at>from&&e.at<=to);}
export function drawLifeTheater(ctx,canvas,roll,elapsed,duration,colony,colors,events=battleTimeline(roll)){
 const began=performance.now();elapsed=Math.max(0,elapsed);const t=elapsed/1000,w=canvas.clientWidth||600,h=canvas.clientHeight||340,d=Math.min(globalThis.devicePixelRatio||1,1.5);
 if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}ctx.setTransform(d,0,0,d,0,0);
 const [bg,line,cyan,pink,gold,fg]=colors,generation=Math.min(90,Math.floor(elapsed/100)),f=battleFrame(colony,generation),a=battleAssault(roll,elapsed,events),force=roll.total,last=events.filter(e=>e.at<=elapsed).at(-1),hits=events.filter(e=>e.kind==='impact'&&elapsed>=e.at&&elapsed-e.at<800);
 const ox=w*.12,gx=w*.76,cy=h*.51,r=Math.min(w*.16,h*.29),shotY=i=>cy+Math.sin(i*2.4)*r*.32,shake=elapsed<duration?hits.reduce((n,e)=>n+Math.exp(-(elapsed-e.at)/110)*2.4,0):0;
 const text=(s,x,y,size=12,color=fg,align='center')=>{ctx.globalAlpha=1;ctx.fillStyle=color;ctx.font='bold '+size+'px ui-monospace,monospace';ctx.textAlign=align;ctx.fillText(s,x,y);};
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(Math.sin(t*61)*shake,Math.cos(t*77)*shake*.5);
 const haze=ctx.createRadialGradient(gx,cy,0,gx,cy,w*.8);haze.addColorStop(0,line);haze.addColorStop(1,bg);ctx.fillStyle=haze;ctx.globalAlpha=.65;ctx.fillRect(0,0,w,h);
 // Conway populations are the low-contrast wake, never a competing score.
 const cw=(w-24)/colony.w,ch=(h-70)/colony.h;ctx.globalAlpha=.28;
 for(let side=1;side<=2;side++){ctx.fillStyle=side===1?cyan:pink;ctx.beginPath();for(let i=0;i<f.cells.length;i++)if(f.cells[i]===side){const x=12+(i%colony.w)*cw,y=35+Math.floor(i/colony.w)*ch;ctx.rect(x,y,Math.max(1,cw*.65),Math.max(1,ch*.65));}ctx.fill();}
 // Perspective signal rails converge on the one clearly marked destination.
 ctx.strokeStyle=line;ctx.lineWidth=1;ctx.globalAlpha=.6;
 for(let k=-4;k<=4;k++){ctx.beginPath();ctx.moveTo(0,cy+k*h*.14);ctx.lineTo(gx,cy+k*r*.16);ctx.stroke();}
 for(let k=0;k<10;k++){const p=((k/10+t*.12)%1),x=ox+(gx-ox)*p;ctx.beginPath();ctx.ellipse(x,cy,Math.max(1,r*.1),r*(1.5-p*.8),0,0,Math.PI*2);ctx.stroke();}
 // Left emitter: concentric charge rings, all fire toward the shield on right.
 ctx.globalAlpha=1;ctx.strokeStyle=cyan;ctx.lineWidth=2;ctx.fillStyle=bg;ctx.beginPath();ctx.arc(ox,cy,r*.39,0,Math.PI*2);ctx.fill();ctx.stroke();
 for(let k=0;k<4;k++){ctx.globalAlpha=.5-k*.08;ctx.beginPath();ctx.arc(ox,cy,r*(.46+k*.08),t*(k%2?-1:1)+k,t*(k%2?-1:1)+k+4.4);ctx.stroke();}
 text('YOU',ox,cy+4,w<400?11:16,cyan);text('TRANSMIT →',ox,cy+r*.9,w<400?8:11,cyan);
 // Every luminous shield segment is one equal share of the target resistance.
 const health=a.shield/a.target,openAge=a.open?sat((elapsed-(a.aligned?7600:(events.find(e=>e.kind==='impact'&&battleAssault(roll,e.at,events).shield===0)?.at||7600)))/600):0;
 const segments=16;ctx.lineWidth=3;
 for(let k=0;k<segments;k++){
  const angle=k*Math.PI*2/segments-Math.PI/2,live=k/segments<health,offset=openAge*(r*.7),rr=r+offset;
  ctx.strokeStyle=a.resonance?gold:live?pink:cyan;ctx.globalAlpha=live?.95:.22;ctx.beginPath();ctx.arc(gx,cy,rr,angle+.035,angle+Math.PI*2/segments-.035);ctx.stroke();
  const px=gx+Math.cos(angle+.19)*rr,py=cy+Math.sin(angle+.19)*rr;
  ctx.fillStyle=live?pink:cyan;ctx.fillRect(px-2,py-2,4,4);
 }
 // A mechanical hex iris opens outward; it is the gate, not an unexplained orb.
 for(let k=0;k<6;k++){
  const angle=k*Math.PI/3+t*.07,rr=r*(.83+openAge*.75);ctx.strokeStyle=a.resonance?gold:a.open?cyan:pink;ctx.globalAlpha=.5*(1-openAge*.55);ctx.lineWidth=2;ctx.beginPath();for(let j=0;j<4;j++){const az=angle+(j-1.5)*.18,rad=rr*(j===1||j===2?.82:1);const x=gx+Math.cos(az)*rad,y=cy+Math.sin(az)*rad;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();
 }
 ctx.globalAlpha=1;
 if(!a.open){ctx.fillStyle=bg;ctx.fillRect(gx-r*.65,cy-19,r*1.3,38);text((a.shield/100).toFixed(2),gx,cy+2,w<400?18:26,pink);text('SHIELD LEFT',gx,cy+19,w<400?8:10,pink);}
 else{for(let k=0;k<7;k++){ctx.strokeStyle=a.resonance?gold:cyan;ctx.globalAlpha=.12+k*.05;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(gx,cy,r*(.13+k*.085),r*(.18+k*.1),t*(k%2?-.2:.2),0,Math.PI*2);ctx.stroke();}text(a.resonance?'ALIGNED':'OPEN',gx,cy+5,w<400?16:24,a.resonance?gold:cyan);}
 text('REALITY GATE',gx,cy-r-12,w<400?10:13,pink);text('TO THE NEXT CONSEQUENCE',gx,cy+r+20,w<400?7:10,fg);
 // Charge train. A labelled core is the accounting unit; its swarm is its wake.
 for(const e of events){if(e.kind!=='volley')continue;const age=elapsed-e.at,land=e.at+430,slot=events.filter(x=>x.kind==='volley').findIndex(x=>x.id===e.id),y=shotY(slot),color=e.source==='stat'?gold:cyan;
  if(age<0&&elapsed>=(e.source==='stat'?4000:900)){const x=ox+(slot%4-1.5)*r*.2,yy=cy-r*.85-Math.floor(slot/4)*8;ctx.fillStyle=color;ctx.globalAlpha=.65;ctx.fillRect(x,yy,4,4);}
  if(age<0||age>1100)continue;
  if(elapsed<land){const p=sat(age/430),x=ox+(gx-r-ox)*p,yy=cy+(y-cy)*p+Math.sin(p*Math.PI)*Math.sin(slot*1.7)*r*.45;
   ctx.globalCompositeOperation='lighter';for(let k=0;k<20;k++){const q=Math.max(0,p-k*.009),xx=ox+(gx-r-ox)*q,sy=cy+(y-cy)*q+Math.sin(q*Math.PI)*Math.sin(slot*1.7)*r*.45+Math.sin(t*14+k)*4;ctx.fillStyle=color;ctx.globalAlpha=(1-k/20)*.55;ctx.fillRect(xx-2,sy-2,4,4);}for(let k=0;k<9;k++){const q=Math.max(0,p-.12),sx=ox+(gx-r-ox)*q,sy=cy+(y-cy)*q;ctx.strokeStyle=color;ctx.globalAlpha=.22;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+x)/2,yy+Math.sin(t*11+k*1.7)*18,x,yy);ctx.stroke();}ctx.globalCompositeOperation='source-over';ctx.fillStyle=color;ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,yy,5,0,Math.PI*2);ctx.fill();text((e.cents/100).toFixed(2),x,yy-12,w<400?10:14,color);
  }else{
   const q=(elapsed-land)/670,x=gx-r,y=shotY(slot);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.globalAlpha=(1-q)*.9;
   for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(x,y,Math.max(1,q*(40+k*14)),Math.max(1,q*(60+k*15)),0,0,Math.PI*2);ctx.stroke();}
   for(let k=0;k<32;k++){const az=k*2.399+slot,dist=q*(25+k*2);ctx.fillRect(x+Math.cos(az)*dist,y+Math.sin(az)*dist,2+k%2,2);}
   const before=battleAssault(roll,land-1,events),damage=Math.min(before.shield,e.cents);text(damage?'−'+(damage/100).toFixed(2):'THROUGH',x-12,y-22-q*30,w<400?12:18,color);
  }
 }
 // A surviving shield discharges back down the corridor at the failed verdict.
 if(elapsed>=7600&&!roll.success){const age=(elapsed-7600)/1000;for(let k=0;k<7;k++){const p=sat((age-k*.08)/1.25);if(p<=0||p>=1)continue;const x=gx-r-(gx-r-ox)*p;ctx.strokeStyle=pink;ctx.globalAlpha=(1-p)*.6;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,cy,4+p*18,r*(.8+p*.6),0,0,Math.PI*2);ctx.stroke();}}
 // Open channel pours forward. Failed shots end at the intact shield.
 if(a.open){ctx.globalCompositeOperation='lighter';for(let k=0;k<44;k++){const p=(t*.7+k/44)%1,x=gx-r*.4+p*w*.4,y=cy+Math.sin(k*2.4+t*3)*r*.45*(1-p);ctx.fillStyle=a.resonance?gold:cyan;ctx.globalAlpha=(1-p)*.6;ctx.fillRect(x,y,8+14*p,2);}ctx.globalCompositeOperation='source-over';}
 ctx.globalAlpha=1;ctx.restore();
 text('YOUR CHARGES → BREAK THE SHIELD → OPEN CHANNEL',w/2,20,w<400?8:12,gold);
 if(elapsed>=7600){const title=a.aligned?'RESONANCE UNLOCK':a.open?'SIGNAL DELIVERED':'SIGNAL REPELLED';text(title,w*.4,h-42,w<400?13:20,a.resonance?gold:a.open?cyan:pink);}
 else text(last?.label||'ARMING CHARGES',w/2,h-39,w<400?9:12,gold);
 text('CYAN: YOUR SAMPLE   GOLD: STAT BOOST   MAGENTA: SHIELD',w/2,h-21,w<400?7:10,fg);text('LIVING WAKE / CONWAY B3/S23 · GEN '+generation,w/2,h-7,w<400?7:9,fg);
 canvas.dataset.lifeGeneration=String(generation);canvas.dataset.receipt=[roll.die,roll.total,roll.dc].join(':');canvas.dataset.force=force.toFixed(2);canvas.dataset.target=roll.dc.toFixed(2);canvas.dataset.grade=roll.grade||(roll.success?'pass':'fail');canvas.dataset.frameMs=(performance.now()-began).toFixed(3);canvas.dataset.population=f.live.join(':');canvas.dataset.shield=(a.shield/100).toFixed(2);canvas.dataset.spent=(a.spent/100).toFixed(2);canvas.dataset.reserve=(a.reserve/100).toFixed(2);canvas.dataset.gate=a.aligned?'resonance':a.open?'open':'shielded';
 return {frame:f,force,generation,event:last,assault:a};
}
