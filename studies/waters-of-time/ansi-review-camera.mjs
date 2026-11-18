import {logoCamera} from './ansi-fractal.mjs?v=relay-15';

const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
export function reviewReliefAim(pointer){
 return [limit((pointer[0]-.5)*1.7,-1,1)*.115,
  limit((pointer[1]-.5)*1.7,-1,1)*.081];
}

/** Station Studies gestures for inspecting a retained ANSI artwork plane. */
export function mountAnsiReviewCamera(stage,{viewport=()=>({x:1,y:1}),onChange=()=>{},bounded=true,reliefAim=false,zoomRange=()=>[0,6]}={}){
 const events=new AbortController(),{signal}=events;
 const levels={wide:0,near:2.1,detail:5};
 let camera={level:0,centerX:.5,centerY:.5},preset='wide',drag=null;
 let cursor=[.5,.5],ray=[0,0],previous=0;
 function point(event){
  const r=stage.getBoundingClientRect();
  return {x:(event.clientX-r.left)/r.width,y:(event.clientY-r.top)/r.height};
 }
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
  if(event.button!==0||event.target!==stage||drag)return;
  drag={id:event.pointerId,at:performance.now(),point:point(event),camera,pan:false};
  stage.setPointerCapture(event.pointerId);
  stage.focus({preventScroll:true});
 },{signal});
 stage.addEventListener('pointermove',event=>{
  if(reliefAim&&(event.target===stage||drag?.id===event.pointerId)&&event.pointerType!=='touch'){
   const p=point(event);cursor=[limit(p.x,0,1),limit(p.y,0,1)];
  }
  if(drag?.id!==event.pointerId)return;
  const p=point(event),dx=p.x-drag.point.x,dy=p.y-drag.point.y;
  if(Math.hypot(dx,dy)>.018)drag.pan=true;
  if(!drag.pan)return;
  camera=move(drag.camera,{panX:-dx,panY:-dy});
  preset='';notify();
 },{signal});
 if(reliefAim)stage.addEventListener('pointerleave',()=>{cursor=[.5,.5];},{signal});
 stage.addEventListener('pointerup',event=>{
  if(drag?.id!==event.pointerId)return;
  const ended=drag;drag=null;
  if(!ended.pan)zoomTo(camera.level+Math.max(.7,(performance.now()-ended.at)/540),ended.point);
  else notify();
 },{signal});
 for(const type of ['pointercancel','lostpointercapture']){
  stage.addEventListener(type,event=>{
   if(drag?.id!==event.pointerId)return;
   if(drag.pan)camera=drag.camera;
   drag=null;notify();
  },{signal});
 }
 stage.addEventListener('contextmenu',event=>{
  if(event.target!==stage)return;
  event.preventDefault();zoomTo(camera.level-1,point(event));
 },{signal});
 stage.addEventListener('wheel',event=>{
  if(event.target!==stage)return;
  event.preventDefault();
  const dy=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?stage.clientHeight:1);
  zoomTo(camera.level-Math.sign(dy)*Math.min(.45,Math.abs(dy)*.005),point(event));
 },{signal,passive:false});
 stage.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.target!==stage)return;
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
  return {zoom:level,centerX,centerY,viewport:viewport(),preview:!!drag?.pan,roomAim,
   aim:drag&&!drag.pan?{...drag.point,level:Math.min(4,(now-drag.at)/540)}:undefined};
 }};
}
