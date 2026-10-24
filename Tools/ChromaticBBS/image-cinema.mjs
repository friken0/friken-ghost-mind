/** Adapted from the retained Krex StoryEngine _renderComicScene/drawImg:
 * Assets/StreamingAssets/GhostFace/modules/story-engine.js (cover * 1.15,
 * panRight/panLeft/zoomIn/zoomOut/kenBurns). Add bounded travel, pointer
 * focus, cursor-anchored wheel zoom and visibility/motion ownership. */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function imageFrame(w,h,iw,ih,{zoom=1,focus=[0,0],time=0,automatic=true}={}){
 if(![w,h,iw,ih,zoom,time,...focus].every(Number.isFinite)||Math.min(w,h,iw,ih)<=0)throw Error('Image camera dimensions');
 const driftZoom=automatic?1+.06*(1-Math.cos(time*.055))*.5:1;
 const scale=Math.max(w/iw,h/ih)*1.15*clamp(zoom,1,3)*driftZoom,sw=iw*scale,sh=ih*scale;
 const auto=automatic?[Math.sin(time*.055)*.40,Math.sin(time*.037+.7)*.25]:[0,0];
 const x=(w-sw)/2-clamp(focus[0]+auto[0],-1,1)*(sw-w)/2,y=(h-sh)/2-clamp(focus[1]+auto[1],-1,1)*(sh-h)/2;
 return {x,y,w:sw,h:sh,scale};
}
export function anchoredImageZoom(frame,w,h,point,nextScale){
 const sw=frame.w*nextScale/frame.scale,sh=frame.h*nextScale/frame.scale;
 const x=point[0]-(point[0]-frame.x)*nextScale/frame.scale,y=point[1]-(point[1]-frame.y)*nextScale/frame.scale;
 return [clamp(((w-sw)/2-x)/Math.max(.001,(sw-w)/2),-1,1),clamp(((h-sh)/2-y)/Math.max(.001,(sh-h)/2),-1,1)];
}
/** One effective pose, even when ownership changes. Returning starts at the
 * actual pointer pose; its pan bias drains slowly into the automatic path. */
export class ImageCamera{
 constructor(){this.zoom=1;this.focus=[0,0];this.target=[0,0];this.inside=false;this.time=0;this.age=0;this.phase=0;this.anchor=[0,0];this.startZoom=1;this.pressed=false;this.pressScale=1;}
 get effectiveZoom(){return clamp(this.zoom*this.pressScale,1,3);}
 press(active){this.pressed=active;}
 move(target){this.inside=true;this.target=target.map(x=>clamp(x,-1,1));}
 leave(){this.press(false);if(!this.inside)return;this.inside=false;this.age=0;this.phase=this.time;this.anchor=[...this.focus];this.startZoom=this.zoom;}
 zoomAt(zoom,focus){this.zoom=zoom;this.focus=[...focus];this.move(focus);}
 step(dt,held=false){
  if(held)return;
  this.pressScale+=((this.pressed?1.85:1)-this.pressScale)*(1-Math.exp(-dt*(this.pressed?8:6)));
  this.time+=dt;
  if(this.inside){this.focus=this.focus.map((x,i)=>x+(this.target[i]-x)*(1-Math.exp(-dt*7)));return;}
  this.age+=dt;
  const path=t=>[Math.sin(t*.055)*.40,Math.sin(t*.037+.7)*.25],now=path(this.time),start=path(this.phase),bias=Math.exp(-this.age/12);
  this.focus=now.map((x,i)=>clamp(x+(this.anchor[i]-start[i])*bias,-1,1));
  const t=clamp(this.age,0,1),ease=t*t*(3-2*t);
  this.zoom=this.age<=1?this.startZoom+(1-this.startZoom)*ease:1+.03*(1-Math.cos((this.age-1)*.055));
 }
}
/** Twice the previous logarithmic wheel travel; normalize browser wheel units. */
export function imageWheelZoom(zoom,deltaY,deltaMode=0,height=800){return clamp(zoom*Math.exp(-deltaY*(deltaMode===1?16:deltaMode===2?height:1)*.0028),1,3);}
export function mountImageCinema(image,{held=()=>false}={}){
 const host=image.parentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let pointer=null,raf=0,visible=false,last=0,camera=new ImageCamera(),source=image.getAttribute('src');
 function render(motion){
  const r=host.getBoundingClientRect();if(!r.width||!r.height||!image.complete||!image.naturalWidth)return;
  const f=imageFrame(r.width,r.height,image.naturalWidth,image.naturalHeight,{zoom:camera.effectiveZoom,focus:camera.focus,automatic:false});
  image.style.width=f.w+'px';image.style.height=f.h+'px';image.style.left=f.x+'px';image.style.top=f.y+'px';image.style.objectFit='fill';image.style.transform='none';
  image.dataset.camera=[f.x,f.y,f.scale].map(n=>n.toFixed(3)).join(',');image.dataset.zoom=camera.effectiveZoom.toFixed(3);image.dataset.pressed=String(camera.pressed);image.dataset.cinema=motion?(camera.inside?'pointer':camera.age<1?'returning':'auto'):'held';
 }
 function paint(now=performance.now()){
  raf=0;if(!visible||document.hidden||!image.complete||!image.naturalWidth)return;
  const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;const motion=!held()&&!reduced.matches;
  camera.step(dt,!motion);render(motion);
  if(motion)raf=requestAnimationFrame(paint);
 }
 function wake(){if(!raf&&visible)raf=requestAnimationFrame(paint);}
 const move=e=>{if(held()||reduced.matches||e.pointerType==='touch')return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;camera.move([(e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1]);wake();};
 const release=e=>{if(e&&pointer!==null&&e.pointerId!==pointer)return;camera.press(false);const captured=pointer;pointer=null;if(captured!==null&&host.hasPointerCapture?.(captured))host.releasePointerCapture(captured);wake();};
 const down=e=>{if(e.button!==0||held()||reduced.matches||e.target.closest?.('button,a,input'))return;e.preventDefault();move(e);pointer=e.pointerId;camera.press(true);host.setPointerCapture?.(pointer);wake();};
 const leave=()=>{release();camera.leave();wake();};
 const wheel=e=>{if(camera.pressed)return;if(held()||reduced.matches||!image.complete||!image.naturalWidth)return;e.preventDefault();const r=host.getBoundingClientRect();if(!r.width||!r.height)return;const old=imageFrame(r.width,r.height,image.naturalWidth,image.naturalHeight,{zoom:camera.effectiveZoom,focus:camera.focus,automatic:false});const next=imageWheelZoom(camera.zoom,e.deltaY,e.deltaMode,r.height),scale=old.scale*next/camera.zoom;camera.zoomAt(next,anchoredImageZoom(old,r.width,r.height,[e.clientX-r.left,e.clientY-r.top],scale));render(true);wake();};
 const reset=()=>{camera=new ImageCamera();last=0;wake();};
 host.addEventListener('pointerdown',down);host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.addEventListener('lostpointercapture',release);window.addEventListener('blur',leave);host.addEventListener('pointermove',move,{passive:true});host.addEventListener('pointerleave',leave);host.addEventListener('wheel',wheel,{passive:false});image.addEventListener('load',wake);
 const observe=new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(raf);raf=0;last=0;}});observe.observe(host);
 const resize=new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=0;paint();});resize.observe(host);
 const changes=new MutationObserver(()=>{const next=image.getAttribute('src');if(next!==source){source=next;reset();}});changes.observe(image,{attributes:true,attributeFilter:['src']});
 const visibility=()=>{if(document.hidden)leave();cancelAnimationFrame(raf);raf=0;last=0;wake();};document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);
 return {refresh:visibility,destroy(){cancelAnimationFrame(raf);observe.disconnect();resize.disconnect();changes.disconnect();host.removeEventListener('pointerdown',down);host.removeEventListener('pointerup',release);host.removeEventListener('pointercancel',release);host.removeEventListener('lostpointercapture',release);window.removeEventListener('blur',leave);host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);host.removeEventListener('wheel',wheel);image.removeEventListener('load',wake);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);}};
}
