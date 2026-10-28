import {causalResult} from './causality.mjs';
import {ensureAnsiFont,ansiFontFamily} from './ansi-ui.mjs';
import {ansiPalette} from './ansi-terminal.mjs';

/* Original glyph-body toy. One caller clock; no network, RNG from the game,
 * timer, RAF or audio. Numeric causality receipts remain another owner's law. */
const CW=8,CH=16,STEP=1/120,GRAVITY=390;
export const ansiSkirmishLimits=Object.freeze({actors:4,bullets:48,debris:128,events:48,steps:16});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function finite(v,label,a=-1e6,b=1e6){if(!Number.isFinite(v)||v<a||v>b)throw Error('Invalid skirmish '+label);return v;}
function random(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const patterns=Object.freeze([
 {id:'chest',parent:null,x:0,y:-35,hp:66,rows:['▐██▌','▐██▌']},
 {id:'head',parent:'chest',x:0,y:-69,hp:28,rows:[' ▄▄ ','▐▀▀▌']},
 {id:'hip',parent:'chest',x:0,y:-9,hp:28,rows:['▐▄▄▌']},
 {id:'arm-l',parent:'chest',x:-22,y:-34,hp:20,rows:['▐','▐']},
 {id:'hand-l',parent:'arm-l',x:-28,y:-11,hp:14,rows:['▄█']},
 {id:'arm-r',parent:'chest',x:22,y:-34,hp:20,rows:['▌','▌']},
 {id:'hand-r',parent:'arm-r',x:31,y:-20,hp:16,rows:['█▀▀']},
 {id:'leg-l',parent:'hip',x:-10,y:17,hp:24,rows:['▐','▐']},
 {id:'boot-l',parent:'leg-l',x:-13,y:39,hp:14,rows:['▄▄']},
 {id:'leg-r',parent:'hip',x:10,y:17,hp:24,rows:['▌','▌']},
 {id:'boot-r',parent:'leg-r',x:15,y:39,hp:14,rows:['▄▄']}
]);
const weapons=Object.freeze({pea:{glyph:'.',speed:690,damage:12,impulse:58,cooldown:.29,radius:1},heavy:{glyph:'●',speed:480,damage:29,impulse:145,cooldown:.86,radius:3},grenade:{glyph:'*',speed:270,damage:42,impulse:230,cooldown:1.6,radius:3,fuse:1.75}});

/** Exact canonical block occupancy. Coordinates are font pixels, not cells. */
export function ansiBlockPixel(glyph,x,y){
 if(x<0||x>=CW||y<0||y>=CH)return false;
 if(glyph==='█')return true;if(glyph==='▀')return y<8;if(glyph==='▄')return y>=8;
 if(glyph==='▌')return x<4;if(glyph==='▐')return x>=4;return false;
}
function maskFor(rows,masks){const width=Math.max(...rows.map(r=>[...r].length))*CW,height=rows.length*CH,mask=new Uint8Array(width*height),cells=[];
 for(let cy=0;cy<rows.length;cy++)for(const [cx,glyph]of [...rows[cy]].entries()){if(glyph===' ')continue;cells.push({x:cx*CW,y:cy*CH,glyph});const actual=masks?.[glyph];for(let py=0;py<CH;py++)for(let px=0;px<CW;px++)if(actual?actual[py*CW+px]:ansiBlockPixel(glyph,px,py))mask[(cy*CH+py)*width+cx*CW+px]=1;}
 return {width,height,mask,cells};
}
function local(part,x,y){const c=Math.cos(part.angle),s=Math.sin(part.angle),dx=x-part.x,dy=y-part.y;return {x:dx*c+dy*s+part.width/2,y:-dx*s+dy*c+part.height/2};}
function occupied(part,x,y,r=0){const p=local(part,x,y);for(const [ox,oy]of r?[[0,0],[r,0],[-r,0],[0,r],[0,-r]]:[[0,0]]){const a=Math.floor(p.x+ox),b=Math.floor(p.y+oy);if(a>=0&&a<part.width&&b>=0&&b<part.height&&part.mask[b*part.width+a])return true;}return false;}

/** Sweeps through actual occupied pixels; never tunnels through a thin limb. */
export function sweepAnsiGlyphBodies(from,to,parts,radius=0){
 for(const v of [from?.x,from?.y,to?.x,to?.y])finite(v,'sweep coordinate');finite(radius,'sweep radius',0,16);
 let closest=null;const dx=to.x-from.x,dy=to.y-from.y;
 for(const part of parts){if(!part.visible||part.alpha<=0)continue;const a=local(part,from.x,from.y),b=local(part,to.x,to.y),vx=b.x-a.x,vy=b.y-a.y;let lo=0,hi=1;
  for(const [origin,delta,min,max]of [[a.x,vx,-radius,part.width+radius],[a.y,vy,-radius,part.height+radius]]){if(Math.abs(delta)<1e-9){if(origin<min||origin>max){lo=2;break;}}else{let p=(min-origin)/delta,q=(max-origin)/delta;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);}}
  if(lo>hi||lo>1||hi<0)continue;lo=Math.max(0,lo);hi=Math.min(closest?.t??1,hi);if(lo>hi)continue;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*(hi-lo)/.65));for(let i=0;i<=steps;i++){const t=lo+(hi-lo)*i/steps,x=from.x+dx*t,y=from.y+dy*t;if(occupied(part,x,y,radius)){if(!closest||t<closest.t)closest={part,t,x,y};break;}}
 }return closest;
}

/** Pure seeded simulation. Host time is monotonic seconds; paused time is free. */
export function createAnsiSkirmish({seed='glyph-war-713',columns=160,rows=48,autoFire=true,glyphMasks}={}){
 if(!Number.isInteger(columns)||columns<80||columns>256||!Number.isInteger(rows)||rows<24||rows>96)throw Error('Bounded skirmish dimensions required');
 let rand,actors=[],bullets=[],debris=[],bursts=[],events=[],time=0,last=null,accumulator=0,started=false,paused=false,serial=0,context=null,resolved=false,revision=0;
 const width=columns*CW,height=rows*CH,floor=height-CH*2;
 function emit(kind,data={}){events.push(Object.freeze({kind,time,...data}));if(events.length>ansiSkirmishLimits.events)events.shift();}
 function partFor(template,actor){const m=maskFor(template.rows,glyphMasks);return {...m,maskRevision:0,id:template.id,parent:template.parent,actor:actor.id,team:actor.team,ox:template.x,oy:template.y,x:actor.x+template.x,y:actor.y+template.y,vx:0,vy:0,angle:0,av:0,hp:template.hp,maxHp:template.hp,alpha:1,visible:true,dynamic:false,severed:false,settled:0,fade:0};}
 function reset(nextSeed=seed){if(!['string','number'].includes(typeof nextSeed)||String(nextSeed).length>128)throw Error('Bounded skirmish seed required');seed=nextSeed;rand=random(seed);time=0;last=null;accumulator=0;started=false;paused=false;serial=0;context=null;resolved=false;bullets=[];debris=[];bursts=[];events=[];
  actors=Array.from({length:4},(_,i)=>{const team=i<2?'blue':'red',a={id:(team==='blue'?'B':'R')+(i%2+1),team,x:width*(i<2?.15+(i%2)*.18:.67+(i%2)*.18),y:floor-48,face:i<2?1:-1,alive:true,score:0,kills:0,cooldown:.25+rand()*.5,weapon:i===1?'grenade':i===2?'heavy':'pea',phase:rand()*6.28};a.parts=patterns.map(p=>partFor(p,a));return a;});revision++;return api;}
 function start(receipt){if(receipt!==undefined){const raw=JSON.stringify(receipt);if(typeof raw!=='string'||raw.length>8192)throw Error('Bounded skirmish context required');context=JSON.parse(raw);if(context.causality){const r=context.causality,e=causalResult(r.die,r.value,r.dc,{precision:2,below:.2,above:.3,bonus:{signal:1}});if(e.total!==r.total||e.success!==r.success||e.grade!==r.grade)throw Error('Exact boarding causality required');}}started=true;paused=false;last=null;emit('start',{contextOnly:Boolean(context)});revision++;return api;}
 const allParts=()=>actors.flatMap(a=>a.parts.filter(p=>p.visible));
 function fragment(x,y,vx,vy,glyph,team,angle=0){if(debris.length>=ansiSkirmishLimits.debris)return;debris.push({id:++serial,x,y,vx,vy,glyph,team,angle,av:(rand()-.5)*8,alpha:1,settled:0,fade:0,width:CW,height:CH});}
 function shred(part,x,y,power){const at=local(part,x,y),radius=clamp(power*.16,2,6);for(let yy=Math.max(0,Math.floor(at.y-radius));yy<Math.min(part.height,at.y+radius);yy++)for(let xx=Math.max(0,Math.floor(at.x-radius));xx<Math.min(part.width,at.x+radius);xx++)if(Math.hypot(xx-at.x,yy-at.y)<=radius)part.mask[yy*part.width+xx]=0;part.maskRevision++;
  for(let n=0;n<Math.min(5,2+Math.floor(power/12));n++)fragment(x,y,(rand()-.5)*100,(rand()-.9)*120,n%2?'▄':'▀',part.team);
 }
 function detach(actor,part){if(part.severed)return;part.severed=true;const release=p=>{p.dynamic=true;p.vx=actor.face*25+(rand()-.5)*35;p.vy=-25-rand()*40;p.av=(rand()-.5)*4;for(const child of actor.parts.filter(c=>c.parent===p.id))release(child);};release(part);emit('detach',{actor:actor.id,part:part.id,team:actor.team});}
 function die(actor,killer){if(!actor.alive)return;actor.alive=false;for(const p of actor.parts){p.dynamic=true;p.vx+=actor.face*20+(rand()-.5)*60;p.vy-=rand()*45;p.av+=(rand()-.5)*5;}if(killer){killer.score+=60;killer.kills++;}emit('death',{actor:actor.id,team:actor.team,killer:killer?.id??null});}
 function damage(actor,part,value,vx=0,vy=0,killer,x=part.x,y=part.y){if(!part.visible)return;const amount=Math.min(part.hp,value);part.hp=Math.max(context?.causality&&!resolved&&['chest','head'].includes(part.id)?1:0,part.hp-amount);part.vx+=vx;part.vy+=vy;if(killer)killer.score+=amount;shred(part,x,y,Math.max(2,amount));emit('impact',{actor:actor.id,part:part.id,damage:amount,team:actor.team});
  if(part.hp<=0){if(part.id==='chest'||part.id==='head')die(actor,killer);else detach(actor,part);}
 }
 function fire(id,weaponName,target){const actor=actors.find(a=>a.id===id),weapon=weapons[weaponName];if(!actor||!actor.alive||!weapon)throw Error('Live actor and known skirmish weapon required');if(bullets.length>=ansiSkirmishLimits.bullets)return false;
  const hand=actor.parts.find(p=>p.id==='hand-r');if(hand.dynamic||!hand.visible||hand.hp<=0)return false;
  const enemy=actors.find(a=>a.alive&&a.team!==actor.team),aim=target??(enemy?{x:enemy.x,y:enemy.y-30}:null);if(!aim)return false;finite(aim.x,'aim x',0,width);finite(aim.y,'aim y',0,height);
  const x=hand.x+actor.face*22,y=hand.y,dx=aim.x-x,dy=aim.y-y,angle=Math.atan2(dy,dx)+(rand()-.5)*.075,speed=weapon.speed;
  bullets.push({id:++serial,actor:actor.id,team:actor.team,weapon:weaponName,x,y,px:x,py:y,vx:Math.cos(angle)*speed,vy:weaponName==='grenade'?-190-rand()*30:Math.sin(angle)*speed,age:0,...weapon});emit('fire',{actor:id,weapon:weaponName,team:actor.team});return true;
 }
 function explode(b){bursts.push({x:b.x,y:b.y,age:0,team:b.team});if(bursts.length>8)bursts.shift();const killer=actors.find(a=>a.id===b.actor);
  for(const actor of actors.filter(a=>a.team!==b.team))for(const p of actor.parts){const dx=p.x-b.x,dy=p.y-b.y,d=Math.max(1,Math.hypot(dx,dy));if(d<82){const scale=1-d/82;damage(actor,p,b.damage*scale,dx/d*b.impulse*scale,dy/d*b.impulse*scale,killer);}}
  for(let n=0;n<16;n++){const angle=rand()*Math.PI*2,speed=40+rand()*190;fragment(b.x,b.y,Math.cos(angle)*speed,Math.sin(angle)*speed,'▄',b.team);}emit('explosion',{x:b.x,y:b.y,team:b.team});
 }
 function settle(p,dt){const c=Math.abs(Math.cos(p.angle)),s=Math.abs(Math.sin(p.angle)),hh=(p.width*s+p.height*c)/2,hw=(p.width*c+p.height*s)/2;
  if(p.y+hh>=floor){p.y=floor-hh;if(p.vy>16){p.vy*=-.32;p.vx*=.78;p.av*=.72;}else{p.vy=0;p.vx*=.9;p.av*=.9;}}
  if(p.x<hw){p.x=hw;p.vx=Math.abs(p.vx)*.55;}if(p.x>width-hw){p.x=width-hw;p.vx=-Math.abs(p.vx)*.55;}
  if(p.y+hh>=floor-.5&&Math.abs(p.vx)<7&&Math.abs(p.vy)<7&&Math.abs(p.av)<.25)p.settled+=dt;else p.settled=0;
  if(p.settled>1.15){p.fade+=dt;p.alpha=Math.max(0,1-p.fade/.85);}if(p.alpha<=0)p.visible=false;
 }
 function integrate(p,dt){p.vy+=GRAVITY*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.av*dt;p.vx*=.999;p.av*=.998;settle(p,dt);}
 function step(dt){time+=dt;
  for(const a of actors){if(a.alive){const enemy=actors.filter(e=>e.alive&&e.team!==a.team).sort((u,v)=>Math.abs(u.x-a.x)-Math.abs(v.x-a.x))[0];if(enemy){a.face=enemy.x>a.x?1:-1;const d=Math.abs(enemy.x-a.x),walk=d>width*.28?1:d<width*.13?-1:0;a.x=clamp(a.x+a.face*walk*22*dt,48,width-48);a.cooldown-=dt;
    for(const p of a.parts.filter(p=>!p.dynamic)){p.x=a.x+p.ox*(a.face===1?1:-1);p.y=a.y+p.oy+Math.sin(time*8+a.phase+(p.id.endsWith('-l')?0:Math.PI))*(p.id.startsWith('leg')||p.id.startsWith('boot')?3:1);p.angle=(p.id.startsWith('arm')?Math.sin(time*3+a.phase)*.09:0);}
    if(autoFire&&a.cooldown<=0){fire(a.id,a.weapon,{x:enemy.x,y:enemy.y-30+(rand()-.5)*70});a.cooldown=weapons[a.weapon].cooldown*(.9+rand()*.3);}
   }}for(const p of a.parts.filter(p=>p.dynamic&&p.visible))integrate(p,dt);
   // Joint constraints retain chains after a severed root or chest death.
   for(let pass=0;pass<3;pass++)for(const p of a.parts){if(!p.dynamic||!p.visible||p.severed||!p.parent)continue;const q=a.parts.find(q=>q.id===p.parent);if(!q?.visible)continue;const dx=p.x-q.x,dy=p.y-q.y,d=Math.max(.001,Math.hypot(dx,dy)),rest=Math.hypot(p.ox-q.ox,p.oy-q.oy),error=(d-rest)*.35;if(Math.abs(error)>.01){const f=q.dynamic?.5:1;p.x-=dx/d*error*f;p.y-=dy/d*error*f;if(q.dynamic){q.x+=dx/d*error*.5;q.y+=dy/d*error*.5;}}}
  }
  const keep=[];for(const b of bullets){b.age+=dt;b.px=b.x;b.py=b.y;if(b.weapon==='grenade')b.vy+=GRAVITY*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(b.weapon==='grenade'&&b.y>=floor-b.radius){b.y=floor-b.radius;b.vy=-Math.abs(b.vy)*.52;b.vx*=.76;}
   const candidates=actors.filter(a=>a.team!==b.team).flatMap(a=>a.parts),hit=sweepAnsiGlyphBodies({x:b.px,y:b.py},b,candidates,b.radius);
   if(hit){b.x=hit.x;b.y=hit.y;const a=actors.find(a=>a.id===hit.part.actor);if(b.weapon==='grenade')b.age=b.fuse;else damage(a,hit.part,b.damage,b.vx/Math.max(1,b.speed)*b.impulse,b.vy/Math.max(1,b.speed)*b.impulse,actors.find(a=>a.id===b.actor),hit.x,hit.y);}
   if(b.weapon==='grenade'&&b.age>=b.fuse){explode(b);continue;}if(hit&&b.weapon!=='grenade')continue;if(b.x<0||b.x>width||b.y<32||b.y>height||b.age>4)continue;keep.push(b);
  }bullets=keep;
  for(const p of debris)integrate(p,dt);debris=debris.filter(p=>p.alpha>0);for(const b of bursts)b.age+=dt;bursts=bursts.filter(b=>b.age<.42);revision++;
 }
 function summary(){const team=name=>{const members=actors.filter(a=>a.team===name);return {alive:members.filter(a=>a.alive).length,hp:Math.round(members.filter(a=>a.alive).reduce((n,a)=>n+a.parts.reduce((n,p)=>n+p.hp,0),0)),maxHp:members.reduce((n,a)=>n+a.parts.reduce((n,p)=>n+p.maxHp,0),0),score:Math.round(members.reduce((n,a)=>n+a.score,0)),kills:members.reduce((n,a)=>n+a.kills,0)};};const blue=team('blue'),red=team('red'),winner=!blue.alive&&!red.alive?'draw':!blue.alive?'red':!red.alive?'blue':null,settled=Boolean(winner)&&!bullets.length&&!debris.length&&!actors.some(a=>a.parts.some(p=>p.dynamic&&p.visible));return {time,running:started&&!paused&&!settled,paused,started,settled,blue,red,counts:{actors:actors.length,bullets:bullets.length,debris:debris.length},winner,revision};}
 const api={start,reset,resolve(){if(!context?.causality)throw Error('A boarding causality receipt is required');if(resolved)return summary();resolved=true;const winner=context.causality.success?'blue':'red',killer=actors.find(a=>a.team===winner&&a.alive);for(const a of actors.filter(a=>a.team!==winner))die(a,killer);emit('causal-resolution',{winner,grade:context.causality.grade});revision++;return summary();},pause(value=true){if(typeof value!=='boolean')throw Error('Boolean pause required');paused=value;last=null;return api;},fire,
  hit(actorId,partId,amount,{vx=0,vy=0,killer}={}){const a=actors.find(a=>a.id===actorId),p=a?.parts.find(p=>p.id===partId);if(!p)throw Error('Known skirmish body part required');finite(amount,'damage',0,200);finite(vx,'impulse x',-1000,1000);finite(vy,'impulse y',-1000,1000);damage(a,p,amount,vx,vy,actors.find(a=>a.id===killer));revision++;return summary();},
  update(seconds){finite(seconds,'clock',0,Number.MAX_SAFE_INTEGER);if(last!==null&&seconds<last)throw Error('Skirmish clock must be monotonic');if(last===null){last=seconds;return {...summary(),steps:0};}const delta=Math.min(.12,seconds-last);last=seconds;if(!started||paused||summary().settled)return {...summary(),steps:0};accumulator+=delta;let steps=0;while(accumulator>=STEP-1e-10&&steps<ansiSkirmishLimits.steps){step(STEP);accumulator-=STEP;steps++;}return {...summary(),steps};},
  drainEvents(){const out=events;events=[];return out;},
  snapshot(){return structuredClone({...summary(),seed,width,height,floor,context,actors,bullets,debris,bursts});},
  get state(){return summary();},get dimensions(){return {width,height,columns,rows};}
 };reset();return api;
}

/** Canvas host only. The existing response owns its clock, lease and controls. */
export function mountAnsiSkirmish(root,{seed='glyph-war-713',columns=160,rows=48,autoFire=true,compact=false,onEvent=()=>{}}={}){
 if(!root?.ownerDocument)throw Error('ANSI skirmish needs a mounted host');const canvas=root.ownerDocument.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('ANSI skirmish canvas unavailable');canvas.dataset.ansiSkirmish='v1';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Blue and Red glyph-body skirmish / local physics toy');canvas.style.cssText='width:100%;height:100%;display:block;pointer-events:none;image-rendering:pixelated';root.append(canvas);
 let scene=createAnsiSkirmish({seed,columns,rows,autoFire}),destroyed=false,loaded=false,wantedStart=false,wantedResolution=false,startContext,lastRevision=-1;const partInk=new Map();
 const ready=ensureAnsiFont().then(()=>{if(destroyed)return false;const atlas=root.ownerDocument.createElement('canvas');atlas.width=CW;atlas.height=CH;const a=atlas.getContext('2d',{willReadFrequently:true}),masks={};if(a?.getImageData){for(const glyph of ['█','▀','▄','▌','▐']){a.clearRect(0,0,CW,CH);a.font=`${CH}px ${ansiFontFamily}`;a.textBaseline='top';a.fillStyle=ansiPalette[15];a.fillText(glyph,0,0);const pixels=a.getImageData(0,0,CW,CH).data;const mask=new Uint8Array(CW*CH);for(let n=0;n<mask.length;n++)mask[n]=pixels[n*4+3]>96?1:0;masks[glyph]=mask;}}
  scene=createAnsiSkirmish({seed,columns,rows,autoFire,glyphMasks:masks});loaded=true;if(wantedStart)scene.start(startContext);if(wantedResolution)scene.resolve();draw(true);return true;});
 function glyph(char,x,y,fg,alpha=1,angle=0,w=CW,h=CH){ctx.save();try{ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.beginPath();ctx.rect(-w/2,-h/2,w,h);ctx.clip();ctx.fillStyle=fg;ctx.font=`${h}px ${ansiFontFamily}`;ctx.textBaseline='top';ctx.fillText(char,-w/2,-h/2,w);}finally{ctx.restore();}}
 function text(value,x,y,colour){ctx.fillStyle=colour;ctx.font=`${CH}px ${ansiFontFamily}`;ctx.textBaseline='top';ctx.fillText(value,x,y);}
 function partTexture(part){const key=part.actor+':'+part.id,old=partInk.get(key);if(old?.revision===part.maskRevision)return old.canvas;const image=old?.canvas??root.ownerDocument.createElement('canvas');image.width=part.width;image.height=part.height;const p=image.getContext('2d');p.clearRect(0,0,part.width,part.height);p.fillStyle=ansiPalette[part.team==='blue'?11:12];p.font=`${CH}px ${ansiFontFamily}`;p.textBaseline='top';for(const cell of part.cells){p.save();p.beginPath();p.rect(cell.x,cell.y,CW,CH);p.clip();p.fillText(cell.glyph,cell.x,cell.y,CW);p.restore();}for(let y=0;y<part.height;y++)for(let x=0;x<part.width;x++)if(!part.mask[y*part.width+x])p.clearRect(x,y,1,1);partInk.set(key,{revision:part.maskRevision,canvas:image});return image;}
 function draw(force=false){if(destroyed||!loaded)return;const rect=root.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height)),size=scene.dimensions,resized=canvas.width!==w||canvas.height!==h;if(resized){canvas.width=w;canvas.height=h;}const state=scene.state;if(!force&&!resized&&state.revision===lastRevision)return;lastRevision=state.revision;const s=scene.snapshot(),scale=Math.min(w/size.width,h/size.height),ox=(w-size.width*scale)/2,oy=(h-size.height*scale)/2;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.save();try{ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
   for(let x=0;x<size.width;x+=CW)glyph('▀',x+CW/2,s.floor+CH/2,ansiPalette[8]);
   if(compact){text(`${s.context?.causality?'CREW':'BLUE'} HP ${s.blue.hp}  SCORE ${s.blue.score}`,8,2,ansiPalette[14]);text(`${s.context?.causality?'RAIDERS':'RED'} HP ${s.red.hp}  SCORE ${s.red.score}`,size.width*.51,2,ansiPalette[9]);text(`${s.winner?'WINNER '+s.winner.toUpperCase():s.paused?'HELD':'LIVE'}  . PEA  ● HEAVY  * GRENADE`,8,20,ansiPalette[7]);}
   else {const bar=t=>{const n=Math.round(t.hp/t.maxHp*12);return '█'.repeat(n)+'░'.repeat(12-n);};text(`BLUE ${s.blue.alive}/2 HP${s.blue.hp} ${bar(s.blue)} SCORE${s.blue.score}`,8,8,ansiPalette[11]);text(`RED ${s.red.alive}/2 HP${s.red.hp} ${bar(s.red)} SCORE${s.red.score}`,size.width*.51,8,ansiPalette[12]);text(`LOCAL PHYSICS / ${s.paused?'HELD':s.winner?('WINNER '+s.winner.toUpperCase()):s.started?'LIVE':'READY'} / SHOTS ${s.counts.bullets}/48  FRAGMENTS ${s.counts.debris}/128`,8,28,ansiPalette[7]);text('. PEA / ● HEAVY / * GRENADE / SEVERED JOINTS FALL',8,46,ansiPalette[8]);}

   for(const a of s.actors)for(const p of a.parts){if(!p.visible)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=p.alpha;ctx.drawImage(partTexture(p),-p.width/2,-p.height/2);ctx.restore();}
   for(const p of s.debris)glyph(p.glyph,p.x,p.y,ansiPalette[p.team==='blue'?11:12],p.alpha,p.angle);
   for(const b of s.bullets){const colour=ansiPalette[b.team==='blue'?11:12];for(let n=1;n<4;n++)glyph('·',b.x-b.vx*.009*n,b.y-b.vy*.009*n,colour,.5/n);glyph(b.glyph,b.x,b.y,colour,1,0,b.weapon==='pea'?CW:CH,b.weapon==='pea'?CH:CH);}
   for(const b of s.bursts){const r=10+b.age*160;for(let i=0;i<18;i++){const a=i*Math.PI*2/18;glyph(i%2?'░':'▓',b.x+Math.cos(a)*r,b.y+Math.sin(a)*r,ansiPalette[i%2?14:15],1-b.age/.42);}}
  }finally{ctx.restore();}canvas.dataset.blueHp=String(s.blue.hp);canvas.dataset.redHp=String(s.red.hp);canvas.dataset.bullets=String(s.counts.bullets);canvas.dataset.debris=String(s.counts.debris);canvas.dataset.simSeconds=s.time.toFixed(3);canvas.dataset.fitScale=String(scale);canvas.dataset.density='1 CSS pixel';canvas.setAttribute('aria-label',hudLabel(s));}
 const hudLabel=s=>`Local glyph physics. Blue ${s.blue.alive} alive, ${s.blue.hp} HP, score ${s.blue.score}. Red ${s.red.alive} alive, ${s.red.hp} HP, score ${s.red.score}.`;
 const api={canvas,ready,resolve(){wantedResolution=true;if(loaded)scene.resolve();draw(true);return api;},start(receipt){wantedStart=true;startContext=receipt;if(loaded)scene.start(receipt);draw(true);return api;},update(seconds){if(destroyed||!loaded)return {painted:false};if(root.ownerDocument.hidden){scene.pause(true);return {painted:false};}const state=scene.update(seconds);for(const event of scene.drainEvents())onEvent(event);draw();return {...state,painted:true};},pause(value=true){scene.pause(value);draw(true);return api;},reset(nextSeed=seed){seed=nextSeed;wantedStart=false;scene.reset(seed);partInk.clear();lastRevision=-1;draw(true);return api;},get snapshot(){return scene.snapshot();},destroy(){if(destroyed)return;destroyed=true;scene.pause(true);partInk.clear();canvas.remove();}};return api;
}
