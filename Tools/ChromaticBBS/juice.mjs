/* C26.17: one non-interactive electric plane, real UI events, one SFX bus.
 * Effects own presentation only; never draw a game sample or write state. */
export function electricPoint(box,distance){
 const [x,y,w,h]=box,p=2*(w+h);let d=((distance%p)+p)%p;
 if(d<w)return [x+d,y,0,-1];d-=w;
 if(d<h)return [x+w,y+d,1,0];d-=h;
 if(d<w)return [x+w-d,y+h,0,1];return [x,y+h-(d-w),-1,0];
}
export function mountJuice(root,{audio:bus}={}){
 const get=id=>root.querySelector('#cg-'+id),doc=root.ownerDocument,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=doc.createElement('canvas');canvas.id='cg-electric';canvas.setAttribute('aria-hidden','true');root.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Electric frame needs Canvas 2D');
 let sound=true,held=false,raf=0,last=0,phase=0,frames=0,dirty=true,measured=0,rects=[],ink='',gold='',energy=0,energyAt=0,serial=0,sceneKey=null,hot=null,laser=null;
 const timers=new Map(),bursts=[],animations=new Set();let frameRect=root.getBoundingClientRect();
 const play=kind=>{if(sound)bus?.uiCue?.(kind);};
 function clearAnimations(){for(const a of animations)a.cancel();animations.clear();}
 function animate(node,keys,options){if(!node||held||reduced.matches)return;const a=node.animate?.(keys,options);if(a){animations.add(a);a.finished.then(()=>animations.delete(a),()=>animations.delete(a));}}
 function flash(node,name='cg-signal-arrival'){
  if(!node)return;clearTimeout(timers.get(node));node.classList.remove(name);void node.offsetWidth;node.classList.add(name);
  timers.set(node,setTimeout(()=>{node.classList.remove(name);timers.delete(node);},800));
 }
 async function unlock(){try{await bus?.unlock();}catch{get('sound').textContent='SFX: on / touch to enable';}}
 function soundLabel(){get('sound').textContent='SFX: '+(sound?'on':'off');get('sound').setAttribute('aria-pressed',String(sound));}
 get('sound').addEventListener('click',async()=>{sound=!sound;bus?.sfx(sound);soundLabel();if(sound){await unlock();play('tap');}});soundLabel();
 function measure(now){
  frameRect=root.getBoundingClientRect();const {width:w,height:h}=frameRect;if(!w||!h)return;
  const scale=Math.min(devicePixelRatio||1,1,Math.sqrt(1000000/(w*h))),cw=Math.max(1,Math.round(w*scale)),ch=Math.max(1,Math.round(h*scale));
  if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}ctx.setTransform(cw/w,0,0,ch/h,0,0);canvas.dataset.pixels=String(cw*ch);
  const colors=getComputedStyle(root);ink=colors.getPropertyValue('--cg-ink').trim();gold=colors.getPropertyValue('--cg-warn').trim();
  rects=[{box:[3,3,w-6,h-6],outer:true}];
  const targets=root.querySelectorAll('.cg-header,.cg-prose,.cg-transmission-view,.cg-worldpane,.cg-face,.cg-choice,.cg-window-nav,.cg-utility-window,#cg-inspector,.cg-power-head');
  for(const n of targets){
   if(rects.length>=13)break;if(!n.checkVisibility({checkVisibilityCSS:true}))continue;
   let r=n.getBoundingClientRect(),left=Math.max(frameRect.left+3,r.left),right=Math.min(frameRect.right-3,r.right),top=Math.max(frameRect.top+3,r.top),bottom=Math.min(frameRect.bottom-3,r.bottom);
   for(let p=n.parentElement;p&&p!==root;p=p.parentElement){
    if(!p.matches('.cg-prose,.cg-narrative,.cg-action-dock,.cg-utility-window,#cg-inspector'))continue;const clip=p.getBoundingClientRect();left=Math.max(left,clip.left);right=Math.min(right,clip.right);top=Math.max(top,clip.top);bottom=Math.min(bottom,clip.bottom);
   }
   if(right-left>24&&bottom-top>15)rects.push({box:[left-frameRect.left+1,top-frameRect.top+1,right-left-2,bottom-top-2],choice:n.classList.contains('cg-choice'),hot:n===hot});
  }
  measured=now;dirty=false;canvas.dataset.targets=String(rects.length);
 }
 function stream(box,start,length,color,index,alpha){
  const steps=24,p=2*(box[2]+box[3]),head=electricPoint(box,start),tail=electricPoint(box,start-length);
  const gradient=ctx.createLinearGradient(tail[0],tail[1],head[0]+.01,head[1]+.01);gradient.addColorStop(0,'transparent');gradient.addColorStop(.7,color);gradient.addColorStop(1,ink);
  ctx.beginPath();
  for(let j=0;j<=steps;j++){const t=j/steps,at=electricPoint(box,start-length+t*length),jag=Math.sin((start/p*19+j*1.9+index)*7.1)*Math.sin(t*Math.PI)*1.7,x=at[0]+at[2]*jag,y=at[1]+at[3]*jag;if(j)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
  ctx.strokeStyle=gradient;ctx.globalAlpha=alpha;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=alpha*.9;ctx.lineWidth=.7;ctx.stroke();
  ctx.fillStyle=ink;ctx.globalAlpha=alpha;ctx.shadowColor=ink;ctx.shadowBlur=8;ctx.fillRect(head[0]-1.4,head[1]-1.4,2.8,2.8);ctx.shadowBlur=0;
 }
 function ornament(box,outer=false){
  const [x,y,w,h]=box,cut=outer?12:5,reach=Math.min(outer?58:26,w/5,h/4);
  ctx.strokeStyle=gold;ctx.shadowBlur=0;
  for(const [inset,alpha,width]of (outer?[[0,.75,2],[3,.32,1],[7,.52,1]]:[[0,.55,1.4],[3,.18,1]])){
   const l=x+inset,t=y+inset,r=x+w-inset,b=y+h-inset,c=Math.max(2,cut-inset*.5);
   ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(l+c,t);ctx.lineTo(r-c,t);ctx.lineTo(r,t+c);ctx.lineTo(r,b-c);ctx.lineTo(r-c,b);ctx.lineTo(l+c,b);ctx.lineTo(l,b-c);ctx.lineTo(l,t+c);ctx.closePath();ctx.stroke();
  }
  for(const [cx,cy,sx,sy]of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){
   ctx.save();ctx.translate(cx,cy);ctx.scale(sx,sy);ctx.globalAlpha=.9;ctx.lineWidth=outer?2.5:1.5;
   ctx.beginPath();ctx.moveTo(1,reach);ctx.lineTo(1,cut);ctx.quadraticCurveTo(1,1,cut,1);ctx.lineTo(reach,1);ctx.stroke();
   ctx.globalAlpha=.6;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(5,reach*.75);ctx.lineTo(5,cut+3);ctx.lineTo(cut+3,5);ctx.lineTo(reach*.75,5);ctx.stroke();
   if(outer){ctx.globalAlpha=.7;ctx.fillStyle=gold;ctx.beginPath();ctx.moveTo(8,13);ctx.lineTo(13,8);ctx.lineTo(18,8);ctx.lineTo(8,18);ctx.closePath();ctx.fill();ctx.fillRect(reach+5,0,12,2);ctx.fillRect(0,reach+5,2,12);}
   ctx.restore();
  }
 }
 function paint(now){
  raf=0;if(document.hidden){canvas.dataset.motion='hidden';return;}
  if(!held&&!reduced.matches&&now-last<(root.dataset.inspect==='face'?48:32)){raf=requestAnimationFrame(paint);return;}
  const cpuAt=performance.now();
  const dt=Math.min(.06,Math.max(0,(now-(last||now))/1000));last=now;if(!held&&!reduced.matches)phase+=dt;
  if(dirty&&now-measured>90)measure(now);if(!rects.length)measure(now);
  const w=frameRect.width,h=frameRect.height;if(!w||!h)return;
  ctx.clearRect(0,0,w,h);
  if(!held&&!reduced.matches&&now-energyAt>90){energy=Math.min(1,Math.max(0,(bus?.info?.rms||0)*4));root.style.setProperty('--cg-flow-energy',energy.toFixed(2));energyAt=now;}
  for(const [i,r]of rects.entries()){
   if(r.outer||r.choice||i>1)ornament(r.box,r.outer);
   const [x,y,rw,rh]=r.box,p=2*(rw+rh);ctx.strokeStyle=i%3===0?gold:ink;ctx.globalAlpha=r.outer?.34:.13;ctx.lineWidth=1;ctx.strokeRect(x,y,rw,rh);
   const heads=r.outer?5:r.choice?1:2;for(let j=0;j<heads;j++)stream(r.box,phase*(r.outer?145:85+i*7)+p*j/heads+i*83,Math.min(p*.28,r.outer?180:105),j%2?gold:ink,i+j,.65+energy*.25);
  }
  for(let i=bursts.length-1;i>=0;i--){
   const b=bursts[i],age=(now-b.at)/b.life;if(age>=1){bursts.splice(i,1);continue;}
   ctx.globalAlpha=(1-age)*.85;ctx.strokeStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=7;ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(b.x+b.dx*age,b.y+b.dy*age);ctx.lineTo(b.x+b.dx*(age+.12),b.y+b.dy*(age+.12));ctx.stroke();ctx.shadowBlur=0;
  }
  if(laser){
   const age=now-laser.at;
   if(age>460){laser=null;root.classList.remove('cg-cursor-hit');}
   else{
    const [x,y]=laser.to,[sx,sy]=laser.from,fade=1-age/460;
    ctx.save();ctx.strokeStyle=gold;ctx.fillStyle=ink;ctx.shadowColor=ink;ctx.shadowBlur=12;
    if(age<105){ctx.globalAlpha=1-age/120;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(x,y);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle=ink;ctx.stroke();}
    ctx.globalAlpha=fade;ctx.lineWidth=1.5;
    for(let j=0;j<2;j++){ctx.beginPath();ctx.arc(x,y,5+age*(j?.095:.055),0,Math.PI*2);ctx.stroke();}
    for(let j=0;j<12;j++){const a=j*2.399963;const r=age*.11;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);ctx.lineTo(x+Math.cos(a)*(r+7),y+Math.sin(a)*(r+7));ctx.stroke();}
    // This cursor echo shakes; hit testing and the actual OS pointer do not.
    const shake=Math.max(0,1-age/220)*5,dx=Math.sin(age*.24)*shake,dy=Math.cos(age*.31)*shake;
    ctx.translate(x+dx,y+dy);ctx.shadowBlur=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(3,20);ctx.lineTo(8,14);ctx.lineTo(16,13);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   }
  }
  ctx.globalAlpha=1;canvas.dataset.cpuPaintMs=(performance.now()-cpuAt).toFixed(3);frames++;canvas.dataset.frameStyle='engraved-gold-rails';canvas.dataset.frames=String(frames);canvas.dataset.phase=phase.toFixed(3);canvas.dataset.motion=reduced.matches?'reduced':held?'held':'flowing';
  if(!held&&!reduced.matches)raf=requestAnimationFrame(paint);
 }
 function wake(immediate=false){dirty=true;if(immediate)measured=0;if(!raf&&!document.hidden)raf=requestAnimationFrame(paint);}
 function burst(node,color=ink){
  if(held||reduced.matches)return;const r=node?.getBoundingClientRect();if(!r?.width||!r.height)return;
  const x=r.left-frameRect.left+r.width/2,y=r.top-frameRect.top+r.height/2;
  for(let i=0;i<8;i++){const a=(++serial*2.399963+i*.71),speed=18+(i%3)*14;bursts.push({x,y,dx:Math.cos(a)*speed,dy:Math.sin(a)*speed,color:color||gold,at:performance.now(),life:400+(i%3)*90});}
  if(bursts.length>64)bursts.splice(0,bursts.length-64);wake();
 }
 function hold(value){held=!!value;root.classList.toggle('cg-motion-held',held);if(held||reduced.matches){clearAnimations();bursts.length=0;laser=null;root.classList.remove('cg-cursor-hit');}cancelAnimationFrame(raf);raf=0;last=0;wake(true);}
 function resource(key,value){
  const pct=value*10,health=key==='noise'?100-pct:pct,card=get(key).parentElement;
  get(key+'-pct').textContent=pct+'%';card.dataset.health=health<30?'critical':health<60?'warning':'good';
  get(key+'-meter').setAttribute('aria-label',key+' '+pct+' percent'+(key==='noise'?' (lower is better)':''));card.style.setProperty('--cg-level',pct+'%');
 }
 function transition(before,after){
  for(const k of ['signal','compute','noise']){
   resource(k,after[k]);const delta=after[k]-before[k];if(!delta)continue;
   const card=get(k).parentElement,old=get(k+'-old'),label=get(k+'-delta'),good=k==='noise'?delta<0:delta>0;
   clearTimeout(timers.get(k));card.classList.remove('cg-impact');void card.offsetWidth;card.dataset.change=good?'gain':'hit';old.textContent=before[k];label.textContent=(delta>0?'+':'')+delta;card.classList.add('cg-impact');burst(card,good?ink:gold);if(sound)bus?.cue(good);
   timers.set(k,setTimeout(()=>{card.classList.remove('cg-impact');old.textContent='';label.textContent='';timers.delete(k);},reduced.matches?4000:2400));
  }
 }
 function scene(key){
  if(key===sceneKey)return;sceneKey=key;const prose=root.querySelector('.cg-prose');if(prose)prose.scrollTop=0;root.dataset.juiceScene=String(Number(root.dataset.juiceScene||0)+1);
  flash(root.querySelector('.cg-prose'));flash(root.querySelector('.cg-visual-bay'));wake(true);
  for(const [i,n]of [...root.querySelectorAll('.cg-scene-context>h2,.cg-scene-context>#cg-scene')].entries())animate(n,[{opacity:.45},{opacity:1}],{duration:500,delay:i*70,easing:'ease-out'});
 }
 function deal(){
  if(held||reduced.matches)return;const cards=[...root.querySelectorAll('.cg-choice')];
  cards.forEach((card,i)=>{flash(card,'cg-dealt');for(const [column,n]of [...card.children].entries())animate(n,[
   {transform:'translateY(-85%) rotateX(88deg)',opacity:0,filter:'blur(3px)'},
   {transform:'translateY(12%) rotateX(-12deg)',opacity:1,filter:'blur(0px)',offset:.72},
   {transform:'translateY(-3%) rotateX(3deg)',opacity:1,offset:.9},
   {transform:'none',opacity:1,filter:'none'}
  ],{duration:480,delay:i*75+column*18,easing:'cubic-bezier(.16,.8,.23,1)',fill:'backwards'});});
  if(cards.length){burst(cards[0],gold);play('deal');}wake(true);
 }
 const button=e=>e.target?.closest?.('button,summary');
 root.addEventListener('pointerover',e=>{const b=button(e);if(!b||b===hot)return;hot?.classList.remove('cg-hot');hot=b;b.classList.add('cg-hot');wake();});
 root.addEventListener('pointerout',e=>{const b=button(e);if(!b||b.contains(e.relatedTarget))return;if(doc.activeElement!==b)b.classList.remove('cg-hot');if(hot===b)hot=null;wake();});
 root.addEventListener('focusin',e=>{const b=button(e);if(b){b.classList.add('cg-hot');hot=b;wake();}});
 root.addEventListener('focusout',e=>{const b=button(e);b?.classList.remove('cg-hot');if(hot===b)hot=null;wake();});
 root.addEventListener('click',e=>{
  const b=button(e);if(!b||b.disabled)return;flash(b,'cg-pressed');burst(b);
  if(!b.classList.contains('cg-choice')&&!b.matches('#cg-sound,#cg-music,#cg-boot-music,#cg-motion,[data-window],.cg-utility-window>button,#cg-inspect-face,#cg-inspect-sdf,#cg-alien-open,#cg-inspect-back,#cg-return-call')&&!b.closest('.cg-view-modes,.cg-scan-tabs'))play('tap');
 });
 for(const [name,selector,kind]of [['cg-view-change','.cg-visual-bay','switch'],['cg-scan-reading','.cg-scanner-notes','scan'],['cg-window-change','.cg-utility-window','switch'],['cg-inspection-change','#cg-inspector','switch']]){
  root.addEventListener(name,()=>{const n=root.querySelector(selector);flash(n);burst(n,gold);play(kind);wake(true);});
 }
 root.addEventListener('cg-portrait-pulse',event=>{
  if(held||reduced.matches||document.hidden||root.dataset.inspect!=='face')return;
  const {from,to}=event.detail||{};
  if(![...(from||[]),...(to||[])].every(Number.isFinite)||from?.length!==2||to?.length!==2)return;
  const r=root.getBoundingClientRect();
  if(to[0]<r.left||to[0]>r.right||to[1]<r.top||to[1]>r.bottom)return;
  laser={at:performance.now(),from:[from[0]-r.left,from[1]-r.top],to:[to[0]-r.left,to[1]-r.top]};
  root.classList.add('cg-cursor-hit');clearTimeout(timers.get('laser-cursor'));
  timers.set('laser-cursor',setTimeout(()=>{root.classList.remove('cg-cursor-hit');timers.delete('laser-cursor');},470));
  play('scan');canvas.dataset.cursorHits=String(Number(canvas.dataset.cursorHits||0)+1);wake();
 });
 const observer=new ResizeObserver(()=>wake(true));observer.observe(root);
 const mutations=new MutationObserver(()=>wake());mutations.observe(get('screen'),{childList:true,subtree:true});
 root.addEventListener('scroll',()=>wake(),{capture:true,passive:true});
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(document.hidden){canvas.dataset.motion='hidden';clearAnimations();}else wake(true);});
 reduced.addEventListener('change',()=>hold(held));
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);observer.disconnect();mutations.disconnect();clearAnimations();for(const t of timers.values())clearTimeout(t);timers.clear();});
 wake(true);return {resource,transition,deal,scene,hold,unlock};
}
export function mountInspector(root,{stage,onRead,onOpen,faceStory=()=>null}){
  const get=id=>root.querySelector('#cg-'+id),bay=get('inspector'),slot=get('inspect-slot');let current=null,home=null,marker=null,returnY=0,opener=null,notes=null,notesHome=null,notesMarker=null,scrollHomes=[];
  function close(){if(!current)return;if(notes){notesHome.insertBefore(notes,notesMarker);notesMarker.remove();notes=null;}home.insertBefore(current,marker);marker.remove();current=null;bay.hidden=true;delete root.dataset.inspect;for(const [n,top,left]of scrollHomes){n.scrollTop=top;n.scrollLeft=left;}scrollHomes=[];window.scrollTo({top:returnY,behavior:'instant'});opener?.focus({preventScroll:true});root.dispatchEvent(new CustomEvent('cg-inspection-change'));}
  function open(kind,button){if(!['face','sdf','alien'].includes(kind))throw Error('Unknown inspection');onOpen?.();if(current)close();scrollHomes=[...root.querySelectorAll('.cg-narrative,.cg-prose,.cg-scanner-notes,.cg-transmission-view,.cg-alien-call')].map(n=>[n,n.scrollTop,n.scrollLeft]);current=get(kind==='alien'?'alien-call':kind==='face'?'portrait':'canvas');home=current.parentNode;marker=document.createComment('live viewer home');home.insertBefore(marker,current);returnY=window.scrollY;opener=button;slot.append(current);if(kind==='sdf'){notes=root.querySelector('.cg-scanner-notes');if(notes){notesHome=notes.parentNode;notesMarker=document.createComment('scanner notes home');notesHome.insertBefore(notesMarker,notes);slot.append(notes);}}root.dataset.inspect=kind;bay.hidden=false;get('inspect-title').textContent=kind==='alien'?'ALIEN VIEWSCREEN / LIVE TRANSLATION':kind==='face'?'FRIKEN.GHOST / FACE TO FACE':(root.dataset.specimenName||'ARTIFACT SCANNER')+' / DRAG TO ORBIT';get('inspect-tools').hidden=kind!=='sdf';const companion=kind==='face'?faceStory():null;get('inspect-read').textContent=kind==='alien'?'HEAR ALIEN SIGNAL':companion?'MEET '+companion.name.toUpperCase():'HEAR GHOST + ALIENS';get('inspect-help').textContent=kind==='alien'?'Decoder accuracy is an in-world estimate. Cyan is clear; amber tentative; dashed phrases uncertain. Back or Escape returns to the same choice.':kind==='face'?companion?.spoken||'Move the pointer: eyes track within their sockets. Ghost’s spoken lines animate his mouth.':'Drag to orbit · wheel or pinch to zoom · double-click to reset · Escape goes back.';bay.scrollIntoView({block:'start',behavior:'instant'});get('inspect-back').focus({preventScroll:true});console.warn('[Chromatic inspector] open height',bay.getBoundingClientRect().height);root.dispatchEvent(new CustomEvent('cg-inspection-change'));}
  get('inspect-face').addEventListener('click',()=>open('face',get('inspect-face')));
  get('inspect-sdf').addEventListener('click',()=>open('sdf',get('inspect-sdf')));
  get('portrait').addEventListener('click',()=>{if(!current)open('face',get('inspect-face'));});
  get('canvas').addEventListener('click',()=>{if(!current&&get('canvas').dataset.dragged!=='true')open('sdf',get('inspect-sdf'));});
  get('inspect-back').addEventListener('click',close);
  get('inspect-read').addEventListener('click',()=>onRead(root.dataset.inspect));
  for(const [id,amount] of [['inspect-in',-.15],['inspect-out',.15]])get(id).addEventListener('click',()=>stage?.zoom(amount));
  get('inspect-reset').addEventListener('click',()=>stage?.reset());
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&current){e.preventDefault();close();}});
  return {open,close,get active(){return !!current;}};
}
