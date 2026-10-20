/* One presentation-only effects plane. Audio defaults on through the shared standalone mixer; a future Unity adapter must route cues to FriktalAudioGen. */
export function mountJuice(root,{audio:bus}={}){
  const get=id=>root.querySelector('#cg-'+id),canvas=get('electric'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let sound=true,raf=0,last=0,phase=0,held=false;
  const timers=new Map();
  function cue(gain){if(sound)bus?.cue(gain);}
  async function unlock(){try{await bus?.unlock();}catch{get('sound').textContent='SFX: on / touch to enable';}}
  function soundLabel(){get('sound').textContent='SFX: '+(sound?'on':'off');get('sound').setAttribute('aria-pressed',String(sound));}
  get('sound').addEventListener('click',async()=>{sound=!sound;bus?.sfx(sound);soundLabel();if(sound){await unlock();cue(true);}});
  soundLabel();
  function resource(key,value){
    const pct=value*10,health=key==='noise'?100-pct:pct,card=get(key).parentElement;
    get(key+'-pct').textContent=pct+'%';card.dataset.health=health<30?'critical':health<60?'warning':'good';
    get(key+'-meter').setAttribute('aria-label',key+' '+pct+' percent'+(key==='noise'?' (lower is better)':''));
    card.style.setProperty('--cg-level',pct+'%');
  }
  function transition(before,after){
    for(const k of ['signal','compute','noise']){
      resource(k,after[k]);const delta=after[k]-before[k];if(!delta)continue;
      const number=get(k),card=number.parentElement,old=get(k+'-old'),burst=get(k+'-delta'),good=k==='noise'?delta<0:delta>0;
      clearTimeout(timers.get(k));card.classList.remove('cg-impact');void card.offsetWidth;card.dataset.change=good?'gain':'hit';old.textContent=before[k];burst.textContent=(delta>0?'+':'')+delta;card.classList.add('cg-impact');cue(good);
      timers.set(k,setTimeout(()=>{card.classList.remove('cg-impact');old.textContent='';burst.textContent='';},reduced.matches?4000:2400));
    }
  }
  function paint(now){
    raf=0;if(document.hidden||held||reduced.matches||!ctx)return;
    if(now-last<33){raf=requestAnimationFrame(paint);return;}phase+=(now-last>200?33:now-last)/1000;last=now;
    const r=root.getBoundingClientRect(),scale=Math.min(1,1600/Math.max(r.height,1)),w=Math.round(r.width*scale),h=Math.round(r.height*scale);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,r.width,r.height);
    const styles=getComputedStyle(root),color=styles.getPropertyValue('--cg-ink').trim(),accent=styles.getPropertyValue('--cg-accent').trim();
    for(const [index,box] of [...root.querySelectorAll('.cg-stage,.cg-turnpane,.cg-instruments,.cg-comms,#cg-inspector')].entries()){
      if(!box.getClientRects().length)continue;const b=box.getBoundingClientRect(),x=b.left-r.left,y=b.top-r.top,bw=b.width,bh=b.height,perimeter=2*(bw+bh);
      function point(d){d=(d%perimeter+perimeter)%perimeter;if(d<bw)return[x+d,y];d-=bw;if(d<bh)return[x+bw,y+d];d-=bh;if(d<bw)return[x+bw-d,y+bh];return[x,y+bh-(d-bw)];}
      for(let runner=0;runner<3;runner++){
        const travel=(phase*(85+index*11)+runner*perimeter/3)%perimeter;
        for(let part=0;part<18;part++){const a=point(travel-part*4),b=point(travel-(part+1)*4);ctx.strokeStyle=runner===1?accent:color;ctx.globalAlpha=(1-part/18)*.85;ctx.lineWidth=part<3?2:1;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
        const [sx,sy]=point(travel);ctx.globalAlpha=.8;ctx.fillStyle=color;ctx.fillRect(sx-2,sy-2,4,4);
      }
    }
    ctx.globalAlpha=1;raf=requestAnimationFrame(paint);
  }
  function hold(value){held=value;cancelAnimationFrame(raf);raf=0;if(held||reduced.matches)ctx?.clearRect(0,0,canvas.width,canvas.height);else{last=performance.now();raf=requestAnimationFrame(paint);}}
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;if(!document.hidden)hold(held);});
  reduced.addEventListener('change',()=>hold(held));hold(false);
  return {resource,transition,hold,unlock};
}
export function mountInspector(root,{stage,onRead,onOpen}){
  const get=id=>root.querySelector('#cg-'+id),bay=get('inspector'),slot=get('inspect-slot');let current=null,home=null,marker=null,returnY=0,opener=null;
  function close(){if(!current)return;home.insertBefore(current,marker);marker.remove();current=null;bay.hidden=true;delete root.dataset.inspect;window.scrollTo({top:returnY,behavior:'instant'});opener?.focus({preventScroll:true});}
  function open(kind,button){onOpen?.();if(current)close();current=get(kind==='face'?'portrait':'canvas');home=current.parentNode;marker=document.createComment('live viewer home');home.insertBefore(marker,current);returnY=window.scrollY;opener=button;slot.append(current);root.dataset.inspect=kind;bay.hidden=false;get('inspect-title').textContent=kind==='face'?'FRIKEN.GHOST / FACE TO FACE':'RELIC OBSERVATORY / DRAG TO ORBIT';get('inspect-tools').hidden=kind==='face';get('inspect-help').textContent=kind==='face'?'Move the pointer: eyes track within their sockets. Ghost’s spoken lines animate his mouth.':'Drag to orbit · wheel or pinch to zoom · double-click to reset · Escape goes back.';bay.scrollIntoView({block:'start',behavior:'instant'});get('inspect-back').focus({preventScroll:true});console.warn('[Chromatic inspector] open height',bay.getBoundingClientRect().height);}
  get('inspect-face').addEventListener('click',()=>open('face',get('inspect-face')));
  get('inspect-sdf').addEventListener('click',()=>open('sdf',get('inspect-sdf')));
  get('portrait').addEventListener('click',()=>{if(!current)open('face',get('inspect-face'));});
  get('canvas').addEventListener('click',()=>{if(!current&&get('canvas').dataset.dragged!=='true')open('sdf',get('inspect-sdf'));});
  get('inspect-back').addEventListener('click',close);
  get('inspect-read').addEventListener('click',onRead);
  for(const [id,amount] of [['inspect-in',-.15],['inspect-out',.15]])get(id).addEventListener('click',()=>stage?.zoom(amount));
  get('inspect-reset').addEventListener('click',()=>stage?.reset());
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&current){e.preventDefault();close();}});
  return {close,get active(){return !!current;}};
}
