import {ImageCamera,imageFrame,imageWheelZoom,anchoredImageZoom} from './image-cinema.mjs';
import {depthAngles,mountImageDepth} from './image-depth.mjs';

/* Real captures inside the retained ANSI frame. The host owns this clock. */
export function illustrationPop(age){const t=Math.max(0,age);return {scale:t>=1?1:1-Math.exp(-t*7)*Math.cos(t*11),angle:t>=1?0:Math.sin(t*15)*Math.exp(-t*6)*.065};}

function packagedImage(url) {
 if(!/^data:image\/(webp|png|jpeg);base64,/.test(url)) throw Error('Only packaged renderer captures admitted');
 const image = new Image();
 image.src = url;
 return image.decode().then(() => image);
}

export function mountAnsiIllustration(root,{host}={}){
 if(!root?.ownerDocument||!host?.rect)throw Error('ANSI host required');
 const doc=root.ownerDocument;
 const slot=doc.createElement('div');
 slot.style.cssText='position:absolute;z-index:2;pointer-events:auto;touch-action:none;display:none;overflow:hidden;';
 slot.className='native-illustration-slot';
 slot.setAttribute('role','img');
 const canvas=doc.createElement('canvas');
 canvas.className='native-illustration';
 canvas.style.cssText='display:block;width:100%;height:100%;';
 slot.append(canvas);
 root.append(slot);
 const ctx=canvas.getContext('2d',{alpha:false}), lifecycle=new AbortController(),opts={signal:lifecycle.signal};
 let image=null,item=null,key='',request=0,camera=new ImageCamera(),age=0,last=null,layoutKey='',held=false;
 let depthCanvas=null,depth=null,drag=null,lastPose='';

 function frame() {
  const {width:w,height:h}=canvas,{width:iw,height:ih}=image;
  if(!item.contain) return imageFrame(w,h,iw,ih,{zoom:camera.effectiveZoom,focus:camera.focus,automatic:false});
  const s=Math.min(w/iw,h/ih)*camera.effectiveZoom,sw=iw*s,sh=ih*s;
  return {x:(w-sw)/2-camera.focus[0]*Math.max(0,sw-w)/2,
          y:(h-sh)/2-camera.focus[1]*Math.max(0,sh-h)/2,w:sw,h:sh,scale:s};
 }
 function paint() {
  if(!image||!item||slot.style.display==='none')return;
  const f=frame(),angles=depthAngles(held?[0,0]:camera.focus);
  const pose=[canvas.width,canvas.height,f.x,f.y,f.scale,...angles].map(v=>v.toFixed(4)).join(',');
  if(pose===lastPose)return;
  lastPose=pose;
  const rendered=depth?.paint(f,angles);
  canvas.style.visibility=rendered?'hidden':'visible';
  if(depthCanvas)depthCanvas.hidden=!rendered;
  if(!rendered){
   ctx.fillStyle='#101b25';
   ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(image,f.x,f.y,f.w,f.h);
  }
  canvas.dataset.camera=[f.x,f.y,f.scale].map(v=>v.toFixed(3)).join(',');
  slot.dataset.renderer=rendered?'depth-webgl2':'poster';
  slot.dataset.tilt=angles.map(a=>(a*180/Math.PI).toFixed(2)).join(',');
  slot.dataset.zoom=camera.effectiveZoom.toFixed(2);
 }
 function layout() {
  if(!item)return;
  const fit=host.rect(),base=root.getBoundingClientRect();
  const w=item.width*fit.cellWidth,h=item.height*fit.cellHeight;
  if(!(w>0&&h>0))return;
  const left=fit.left-base.left+(item.column-1)*fit.cellWidth;
  const top=fit.top-base.top+(item.row-1)*fit.cellHeight;
  const next=[left,top,w,h,item.id].join(':');
  if(layoutKey===next)return;
  layoutKey=next;
  Object.assign(slot.style,{left:left+'px',top:top+'px',width:w+'px',height:h+'px'});
  const density=Math.min(2,doc.defaultView.devicePixelRatio||1);
  canvas.width=Math.ceil(w*density);
  canvas.height=Math.ceil(h*density);
  if(depthCanvas){depthCanvas.width=canvas.width;depthCanvas.height=canvas.height;}
  lastPose='';
 }
 function clear() {
  request++;
  depth?.destroy();
  depthCanvas?.remove();
  depth=null;depthCanvas=null;image=null;drag=null;
  camera=new ImageCamera();
  age=0;last=null;layoutKey='';lastPose='';
 }
 function load(next) {
  const stamp=request;
  slot.setAttribute('aria-label',next.alt);
  canvas.dataset.source=next.source;
  canvas.dataset.sha256=next.sha256;
  delete slot.dataset.renderer;
  packagedImage(next.url).then(poster=>{
   if(stamp!==request)return;
   image=poster;
   paint();
  }).catch(()=>{});
  if(!next.depth)return;
  const names=['background','subject','backgroundDepth','subjectDepth'];
  Promise.all(names.map(name=>packagedImage(next.depth[name]))).then(images=>{
   if(stamp!==request)return;
   const [background,subject]=images;
   if(background.width!==subject.width||background.height!==subject.height)return;
   const surface=doc.createElement('canvas');
   surface.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
   const renderer=mountImageDepth(surface,Object.fromEntries(names.map((name,i)=>[name,images[i]])));
   if(!renderer)return;
   depthCanvas=surface;depth=renderer;
   slot.append(surface);
   surface.addEventListener('webglcontextlost',event=>{event.preventDefault();lastPose='';paint();},opts);
   surface.addEventListener('webglcontextrestored',()=>{
    if(depthCanvas!==surface)return;
    depth=mountImageDepth(surface,Object.fromEntries(names.map((name,i)=>[name,images[i]])));
    lastPose='';paint();
   },opts);
   layoutKey='';layout();paint();
  }).catch(()=>{});
 }
 const point=event=>{
  const r=slot.getBoundingClientRect();
  return [(event.clientX-r.left)/r.width,(event.clientY-r.top)/r.height];
 };
 slot.addEventListener('wheel',event=>{
  event.preventDefault();
  if(!image||camera.pressed)return;
  const old=frame(),[x,y]=point(event);
  const zoom=imageWheelZoom(camera.zoom,event.deltaY,event.deltaMode,slot.clientHeight);
  camera.zoomAt(zoom,anchoredImageZoom(old,canvas.width,canvas.height,[x*canvas.width,y*canvas.height],old.scale*zoom/camera.zoom));
  paint();
 },{...opts,passive:false});
 slot.addEventListener('pointermove',event=>{
  const [x,y]=point(event);
  if(drag?.id===event.pointerId&&image){
   const f=frame();
   camera.move([drag.focus[0]+(drag.x-x)*canvas.width/Math.max(1,(f.w-canvas.width)/2),
                drag.focus[1]+(drag.y-y)*canvas.height/Math.max(1,(f.h-canvas.height)/2)]);
   if(held){camera.focus=[...camera.target];paint();}
  }else if(!held)camera.move([x*2-1,y*2-1]);
 },opts);
 slot.addEventListener('pointerleave',()=>{if(!drag)camera.leave();},opts);
 slot.addEventListener('pointerdown',event=>{
  if(event.button!==0||drag)return;
  const [x,y]=point(event);
  drag={id:event.pointerId,x,y,focus:[...camera.focus]};
  camera.press(true);
  if(held){camera.pressScale=1.85;paint();}
  slot.setPointerCapture(event.pointerId);
 },opts);
 const release=event=>{
  if(event.pointerId!==drag?.id)return;
  drag=null;camera.press(false);
  const [x,y]=point(event);
  if(x<0||x>1||y<0||y>1||event.type!=='pointerup')camera.leave();
  if(held){camera.pressScale=1;paint();}
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])slot.addEventListener(type,release,opts);
 return {canvas,update(next,show=true,clock=0,paused=false){
  const id=next?.id||'';
  if(id!==key){clear();key=id;if(next)load(next);}
  item=next||null;held=paused;
  const dt=last===null?0:Math.min(.1,Math.max(0,clock-last));last=clock;
  slot.style.display=item&&show?'block':'none';
  if(!item||!show)return;
  layout();
  if(!image)return;
  if(!held){age+=dt;camera.step(dt);}
  const pop=held?{scale:1,angle:0}:illustrationPop(age);
  slot.style.transform=`scale(${pop.scale}) rotate(${pop.angle}rad)`;
  canvas.dataset.popAge=age.toFixed(3);
  paint();
 },destroy(){clear();lifecycle.abort();slot.remove();}};
}
