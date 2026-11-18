import {logoCamera,heldZoomDepth,beginArtGesture,updateArtPan,artHoldAim} from './ansi-fractal.mjs?v=lancing-1';

const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
export function reviewReliefAim(pointer){
 return [limit((pointer[0]-.5)*1.7,-1,1)*.115,
  limit((pointer[1]-.5)*1.7,-1,1)*.081];
}

/** Station Studies gestures for inspecting a retained ANSI artwork plane. */
export function mountAnsiReviewCamera(stage,{viewport=()=>({x:1,y:1}),onChange=()=>{},onInspect=()=>{},bounded=true,reliefAim=false,zoomRange=()=>[0,6]}={}){
 const events=new AbortController(),{signal}=events;
 const levels={wide:0,near:2.1,detail:5};
 let camera={level:0,centerX:.5,centerY:.5},preset='wide',drag=null;
 let cursor=[.5,.5],ray=[0,0],previous=0;
 function point(event){
  const r=stage.getBoundingClientRect();
  return {x:(event.clientX-r.left)/r.width,y:(event.clientY-r.top)/r.height};
 }
 const artTarget=event=>!event.target.closest?.('button,a,input,[role=button]');
 function notify(){onChange(preset);}
 const move=(from,change)=>{
  const [minLevel,maxLevel]=zoomRange();
  return logoCamera(from,{...change,bounded:bounded&&minLevel>=0,minLevel,maxLevel},viewport());
 };
 function zoomTo(level,{x=.5,y=.5}={}){
  const [min,max]=zoomRange();
  const next=limit(level,min,max);
  camera=next===0&&min===0?{level:0,centerX:.5,centerY:.5}:move(camera,{level:next,anchorX:x,anchorY:y});
  preset='';notify();
 }
 function go(scale='wide',focus=[.5,.5]){
  preset=Object.hasOwn(levels,scale)?scale:'wide';
  const level=levels[preset];
  camera=move({level,centerX:level?focus[0]:.5,centerY:level?focus[1]:.5},{});
  notify();
 }
 stage.addEventListener('pointerdown',event=>{
  if(event.button!==0||!artTarget(event)||drag)return;
  onInspect();
  event.preventDefault();
  drag={...beginArtGesture(event,point(event),performance.now()/1000),camera};
  stage.setPointerCapture(event.pointerId);
  stage.focus({preventScroll:true});
 },{signal});
 stage.addEventListener('pointermove',event=>{
  if(reliefAim&&(artTarget(event)||drag?.id===event.pointerId)&&event.pointerType!=='touch'){
   const p=point(event);cursor=[limit(p.x,0,1),limit(p.y,0,1)];
  }
  if(drag?.id!==event.pointerId)return;
  const p=point(event),dx=p.x-drag.point.x,dy=p.y-drag.point.y;
  if(!updateArtPan(drag,event))return;
  camera=move(drag.camera,{panX:-dx,panY:-dy});
  preset='';notify();
 },{signal});
 if(reliefAim)stage.addEventListener('pointerleave',()=>{cursor=[.5,.5];},{signal});
 stage.addEventListener('pointerup',event=>{
  if(drag?.id!==event.pointerId)return;
  const ended=drag;drag=null;
  if(updateArtPan(ended,event)){
   const p=point(event);
   camera=move(ended.camera,{panX:ended.point.x-p.x,panY:ended.point.y-p.y});preset='';notify();
  }else zoomTo(camera.level+heldZoomDepth(performance.now()/1000-ended.at),ended.point);
 },{signal});
 for(const type of ['pointercancel','lostpointercapture']){
  stage.addEventListener(type,event=>{
   if(drag?.id!==event.pointerId)return;
   if(drag.moved)camera=drag.camera;
   drag=null;notify();
  },{signal});
 }
 stage.addEventListener('contextmenu',event=>{
  if(!artTarget(event))return;
  onInspect();
  event.preventDefault();zoomTo(camera.level-1,point(event));
 },{signal});
 stage.addEventListener('wheel',event=>{
  if(!artTarget(event))return;
  onInspect();
  event.preventDefault();
  const dy=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1);
  zoomTo(camera.level-Math.sign(dy)*Math.min(.45,Math.abs(dy)*.005),point(event));
 },{signal,passive:false});
 stage.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.target!==stage)return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape','0','+','=','-'].includes(event.key))onInspect();
  const direction={ArrowLeft:[-.10,0],ArrowRight:[.10,0],ArrowUp:[0,-.10],ArrowDown:[0,.10]}[event.key];
  if(direction){
   camera=move(camera,{panX:direction[0],panY:direction[1]});
   preset='';notify();
  }else if(event.key==='Escape'||event.key==='0')go();
  else if(event.key==='+'||event.key==='=')zoomTo(camera.level+1);
  else if(event.key==='-')zoomTo(camera.level-1);
  else return;
  event.preventDefault();event.stopPropagation();
 },{signal});
 return {go,set({zoom,centerX,centerY}){
  camera={level:zoom,centerX,centerY};
 },destroy:()=>events.abort(),frame(now){
  const {level,centerX,centerY}=camera;
  let roomAim;
  if(reliefAim){
   const target=reviewReliefAim(cursor);
   const blend=previous?1-Math.exp(-limit(now-previous,0,90)/84):1;
   previous=now;
   ray=ray.map((v,i)=>v+(target[i]-v)*blend);
   roomAim=ray.map(v=>Math.round(v*600)/600);
  }
  return {zoom:level,centerX,centerY,viewport:viewport(),preview:!!drag?.moved,roomAim,
   aim:artHoldAim(drag,now/1000,zoomRange()[1]-level)};
 }};
}

// Return via the enclosing scene. Translation is distributed in proportion
// to visible world width so a deep inspection never sweeps sideways at 100×.
export function returnArtCamera(from,to,t){
 const wide={zoom:0,centerX:.5,centerY:.5};
 const pivot=from.zoom<=.01?0:to.zoom<=.01?1:.55;
 const split=pivot>0&&pivot<1;
 const outward=split&&t<pivot;
 const a=split&&!outward?wide:from,b=outward?wide:to;
 const u=Math.max(0,Math.min(1,split?(outward?t/pivot:(t-pivot)/(1-pivot)):t));
 const ease=u*u*(3-2*u);
 const zoom=a.zoom+(b.zoom-a.zoom)*ease;
 const spanA=2**-a.zoom,spanB=2**-b.zoom;
 const shift=Math.abs(spanB-spanA)<.00001?ease:(2**-zoom-spanA)/(spanB-spanA);
 return {zoom,centerX:a.centerX+(b.centerX-a.centerX)*shift,centerY:a.centerY+(b.centerY-a.centerY)*shift};
}
