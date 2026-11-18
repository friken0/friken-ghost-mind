import {globeAtlas} from './frik-planet-atlas.mjs';
import {frikFieldSource} from './ansi-frik-field-generated.mjs?v=nursery-stance-1';
import {frikBridgeFields,frikLook} from './ansi-frik-bridge-ink.mjs?v=brood-1';
import {frikMindFields} from './ansi-frik-mind-art.mjs?v=nursery-stance-1';
import {frikAdSource,frikAdBounds} from './ansi-frik-hq-ad.mjs?v=lancing-2';
import {projectState} from './ansi-frik-mind.mjs?v=nursery-stance-1';

const vertex=`#version 300 es
void main(){vec2 p=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);gl_Position=vec4(p,0.,1.);}`;
const names=['bridge','orbit','coreMemory','coast','heatSight','frikAdInk','tideSight'];
const floats=['time','pixel','primary','pulse','waterLight','blink','grade','trip','throat','swimA','swimB','ray','tilt','bass','energy','bearing','elevation','level','prologue','beatAge','travel'];
const bools=['effects','distant','hasRig'];
const fragment=index=>`#version 300 es
precision highp float;precision highp int;
${frikFieldSource}
uniform State sceneState;
uniform sampler2D childInk;
uniform vec2 outputSize,viewCenter;
uniform float viewSpan;
uniform vec3 optics;
uniform vec3 gate,tracePort;
uniform bool childVisible;
uniform mat3 colorGrade;
out vec4 outInk;
void main(){
 vec2 screen=vec2(gl_FragCoord.x,outputSize.y-gl_FragCoord.y)/outputSize;
 vec2 p=viewCenter+(screen-.5)*viewSpan;
 State f=sceneState;
 ${index===0?`if(f.prologue>=0.&&f.prologue<7.){
  vec2 local=(p-gate.xy)/gate.z;
  float d2=dot(local,local);
  bool hasInner=childVisible&&d2<.82;
  float color=hasInner&&d2<=.52?0.:crossingInk(p.x,p.y,f);
  if(hasInner)color=inkMix(color,packInk(texture(childInk,vec2(screen.x,1.-screen.y)).rgb*255.),fieldSmooth((.82-d2)/.30));
  outInk=vec4(unpackInk(crossingForeground(p.x,p.y,f,color))/255.,1.);return;
 }`:''}
 vec2 d=(p-gate.xy)/gate.z;
 float metric=${[0,3,4,6].includes(index)?'square(d.x)+square(d.y*28./48.)':index===1?'square(d.x/1.03)+square((d.y+.105*sin(d.x*3.3)*(abs(d.y)>.47?fieldSmooth((abs(d.y)-.47)*3.):0.))/.98)':'square(d.x/.94)+square(d.y/1.06)'};
 float lid=f.blink*(1.-fieldSmooth((gate.z/viewSpan-.54)/.32));
 bool blink=${[0,6].includes(index)?'lid>.06&&d.y<lid*1.7-.83':'false'};
 bool child=childVisible&&metric<optics.y&&optics.z>0.&&!blink;
 vec3 inside=vec3(0.);
 if(child)inside=texture(childInk,vec2(screen.x,1.-screen.y)).rgb;
 if(child&&metric<=optics.x&&optics.z==1.){outInk=vec4(inside,1.);return;}
 float safe=fieldSmooth((metric-.625)*.43),ray=f.ray*.40*safe,tilt=f.tilt*.42*safe;
 float depth=memoryCrossing(p.x,p.y,${index}.0,ray,tilt);
 float ink=${names[index]}(p.x+ray*depth,p.y-tilt*depth,f);
 ${[0,1,2,3,4,5].includes(index)?'ink=traceInk(p.x,p.y,f,ink,'+index+'.0,tracePort.x,tracePort.y,tracePort.z);':''}
 if(f.trip>0.)ink=packInk(clamp(colorGrade*unpackInk(ink),0.,255.));
 if(child)ink=inkMix(ink,packInk(inside*255.),fieldSmooth((optics.y-metric)/(optics.y-optics.x))*optics.z);
 outInk=vec4(unpackInk(ink)/255.,1.);
}`;

// The exact procedural source is GPU resident. Immutable masks/material fields
// upload once; a frame sends only state, bones, optics and camera uniforms.
// No readPixels, ImageData, worker stripes or GPU-to-CPU frame round trip.
export function createFrikGpu(doc){
 const canvas=doc.createElement('canvas');
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('Frik ANSI++ requires WebGL 2');
 const compile=(type,source)=>{
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
  return shader;
 };
 const vs=compile(gl.VERTEX_SHADER,vertex);
 const programs=names.map((name,i)=>{
  const fs=compile(gl.FRAGMENT_SHADER,fragment(i)),program=gl.createProgram();
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  return {program,loc:new Map(),name};
 });gl.deleteShader(vs);
 gl.disable(gl.DITHER);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
 const loc=(p,k)=>{if(!p.loc.has(k))p.loc.set(k,gl.getUniformLocation(p.program,k));return p.loc.get(k);};
 const textures=[];let immutableBytes=0;
 function upload(name,width,height,data,float=false,scalar=false){
  immutableBytes+=data.byteLength;
  const unit=textures.length,texture=gl.createTexture();textures.push({name,texture,unit});
  gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,float?(scalar?gl.R32F:gl.RGBA32F):gl.RGBA8,width,height,0,scalar?gl.RED:gl.RGBA,float?gl.FLOAT:gl.UNSIGNED_BYTE,data);
 }
 const b=frikBridgeFields,count=b.width*b.height;
 const mask=new Uint8Array(count*4),color=new Uint8Array(count*4),height=new Float32Array(count);
 for(let i=0;i<count;i++){
  mask[i*4]=b.parts[i];mask[i*4+1]=b.section[i];mask[i*4+2]=b.boundaries[i];
  const c=b.litSkin[i];color[i*4]=c>>16&255;color[i*4+1]=c>>8&255;color[i*4+2]=c&255;color[i*4+3]=255;
  height[i]=b.relief[i];
 }
 upload('armContours',4,b.armRows,b.armSpans,true);
 upload('frikMask',b.width,b.height,mask);upload('frikColor',b.width,b.height,color);upload('frikHeight',b.width,b.height,height,true,true);
 const bell=frikMindFields.bellSurface;
 upload('bellField',bell.width,bell.height,bell.rgb,true);
 {
  const field=frikMindFields.siltSurface;
  const data=new Float32Array(count*4);
  for(let i=0;i<count;i++){data[i*4]=field.depth[i];data[i*4+1]=field.light[i];data[i*4+2]=field.pigment[i]/255;data[i*4+3]=field.roughness[i]/255;}
  upload('siltField',b.width,b.height,data,true);
 }
 // Group exact segments by vertical extent. Each strip retains polygon draw
 // order and both endpoint coordinates for continuous intersection at any zoom.
 const stripCount=32;
 const strips=Array.from({length:stripCount},(_,row)=>{
  const strip=[];
  for(const [part,v] of b.shape){
   const start=strip.length;
   for(let i=0,j=v.length-2;i<v.length;j=i,i+=2){
    const y0=Math.fround(.063+v[j+1]*.000834),y1=Math.fround(.063+v[i+1]*.000834);
    if(Math.max(y0,y1)<row/stripCount || Math.min(y0,y1)>(row+1)/stripCount)continue;
    if(strip.length===start)strip.push(-1,part,0,0);
    strip.push(.280+v[j]*.000666,y0,.280+v[i]*.000666,y1);
   }
  }
  strip.push(-1,0,0,0);
  return strip;
 });
 const stripWidth=Math.max(...strips.map(strip=>strip.length/4));
 const edges=new Float32Array(stripWidth*stripCount*4);
 strips.forEach((strip,i)=>edges.set(strip,i*stripWidth*4));
 upload('frikEdges',stripWidth,stripCount,edges,true);
 upload('globeField',384,384,globeAtlas);
 const ad=new Uint8Array(59*7*4);for(const c of frikAdSource(1).cells)ad[(c.y*59+c.x)*4]=c.glyph===' '?0:255;
 upload('adMask',59,7,ad);
 const stars=frikMindFields.orbitStars;upload('starField',256,256,stars,true,true);
 for(const p of programs){gl.useProgram(p.program);for(const t of textures)gl.uniform1i(loc(p,t.name),t.unit);gl.uniform1i(loc(p,'childInk'),textures.length);}
 const targets=Array.from({length:2},()=>({texture:gl.createTexture(),framebuffer:gl.createFramebuffer()}));
 let dimensions='',lastStamp,front,completed=0,failed;
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();failed='GPU context lost; reload the study to restore its fields.';});
 const pending=[],timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 const stats={gpuMs:0,completed:0,submitMs:0,polls:0,draws:0,bytesUploaded:immutableBytes};
 const motion=new Float32Array(28*4);
 function poll(){
  while(pending.length){const q=pending[0];
   const status=gl.clientWaitSync(q.fence,0,0);
   if(status!==gl.ALREADY_SIGNALED&&status!==gl.CONDITION_SATISFIED)break;
   if(timer&&q.timer&&!gl.getQueryParameter(q.timer,gl.QUERY_RESULT_AVAILABLE))break;
   if(q.timer){if(!gl.getParameter(timer.GPU_DISJOINT_EXT))stats.gpuMs=gl.getQueryParameter(q.timer,gl.QUERY_RESULT)/1e6;gl.deleteQuery(q.timer);}
   gl.deleteSync(q.fence);pending.shift();completed++;
  }stats.completed=completed;stats.polls++;
 }
 function use(spec){
  if(failed)return front;
  if(spec.stamp===lastStamp)return front;
  // Bound GPU work, without changing detail or queuing frames into the future.
  if(pending.length>=2)return front;
  const started=performance.now(),{columns,rows,shot,time,effects,pass}=spec;
  const next=columns+'/'+rows;
  if(next!==dimensions){
   canvas.width=columns;canvas.height=rows;dimensions=next;
   for(const target of targets){
    gl.activeTexture(gl.TEXTURE0+textures.length);gl.bindTexture(gl.TEXTURE_2D,target.texture);
    for(const [key,value] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,columns,rows,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.bindFramebuffer(gl.FRAMEBUFFER,target.framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target.texture,0);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Frik field framebuffer is incomplete');
   }
  }
  const state=projectState(shot,time,effects,pass,columns),levels=[];
  let x=state.x,y=state.y,span=state.window,clip=[0,0,columns,rows];
  motion.fill(0);
  for(const level of state.levels){
   const {data,index,gate}=level;levels.push({...level,x,y,window:span,clip});
   if(data.rig){const r=data.rig,o=index*16;motion.set([r.breath,r.pelvisX,r.pelvisY,r.head,r.neck,r.neckFlex,r.leftArm,r.leftClaw,r.rightArm,r.rightClaw,r.legs[0].x,r.legs[0].y,r.legs[1].x,r.legs[1].y,r.jaw,r.face.blink],o);}
   const cx=.5+(gate.x-x)/span,cy=.5+(gate.y-y)/span,extent=gate.span/span*1.3;
   const vertical=data.style.ocular?Math.max(extent,gate.span/span*Math.sqrt(level.optics.outer)*48/28):extent;
   const left=Math.max(clip[0],Math.floor((cx-extent)*columns)),top=Math.max(clip[1],Math.floor((cy-vertical)*rows));
   const right=Math.min(clip[2],Math.ceil((cx+extent)*columns)),bottom=Math.min(clip[3],Math.ceil((cy+vertical)*rows));
   clip=[Math.max(0,left),Math.max(0,top),Math.min(columns,right),Math.min(rows,bottom)];
   if(clip[0]>=clip[2]||clip[1]>=clip[3])break;
   x=(x-gate.x)/gate.span+.5;y=(y-gate.y)/gate.span+.5;span/=gate.span;
  }
  const query=timer?gl.createQuery():null;if(query)gl.beginQuery(timer.TIME_ELAPSED_EXT,query);
  gl.viewport(0,0,columns,rows);gl.enable(gl.SCISSOR_TEST);
  let child,draws=0;
  for(let i=levels.length-1;i>=0;i--){
   const level=levels[i],{index,gate,data,clip}=level,p=programs[index];
   const target=i?targets[i%2]:null;
   gl.bindFramebuffer(gl.FRAMEBUFFER,target?.framebuffer??null);
   gl.scissor(clip[0],rows-clip[3],clip[2]-clip[0],clip[3]-clip[1]);
   gl.useProgram(p.program);
   gl.uniform2f(loc(p,'outputSize'),columns,rows);gl.uniform2f(loc(p,'viewCenter'),level.x,level.y);gl.uniform1f(loc(p,'viewSpan'),level.window);
   gl.uniform3f(loc(p,'gate'),gate.x,gate.y,gate.span);
   if(level.trace)gl.uniform3f(loc(p,'tracePort'),level.trace.x,level.trace.y,level.trace.r);
   gl.uniform1i(loc(p,'childVisible'),Boolean(child));
   gl.uniform3f(loc(p,'optics'),level.optics.inner,level.optics.outer,level.optics.transmission);
   gl.activeTexture(gl.TEXTURE0+textures.length);gl.bindTexture(gl.TEXTURE_2D,child?.texture??targets[(i+1)%2].texture);
   for(const k of floats)gl.uniform1f(loc(p,'sceneState.'+k),k==='level'?index:data[k]??0);
   for(const k of bools)gl.uniform1i(loc(p,'sceneState.'+k),k==='hasRig'?!!data.rig:!!data[k]);
   const actor=a=>[a.x,a.y,a.scale,a.mirror?1:0];
   gl.uniform4fv(loc(p,'bridgeActor'),actor(data.layout.bridge));gl.uniform4fv(loc(p,'visitorActor'),actor(data.layout.visitor));gl.uniform4fv(loc(p,'distantActor'),actor(data.layout.distant));
   gl.uniform1i(loc(p,'mirrorBridge'),data.layout.mirrorBridge);gl.uniform2fv(loc(p,'cymaticModes'),data.cymatic.modes);gl.uniform2f(loc(p,'frikEye'),frikLook.x,frikLook.y);
   gl.uniform4f(loc(p,'adBounds'),frikAdBounds.x,frikAdBounds.y,frikAdBounds.width,frikAdBounds.height);
   if(data.visitorContacts)gl.uniform3fv(loc(p,'visitorContacts[0]'),data.visitorContacts.flat());
   gl.uniform4fv(loc(p,'motion[0]'),motion);
   const g=data.colorGrade;gl.uniformMatrix3fv(loc(p,'colorGrade'),false,[g[0],g[3],g[6],g[1],g[4],g[7],g[2],g[5],g[8]]);
   gl.drawArrays(gl.TRIANGLES,0,3);draws++;child=target;
  }
  gl.disable(gl.SCISSOR_TEST);if(query)gl.endQuery(timer.TIME_ELAPSED_EXT);
  const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();pending.push({fence,timer:query});
  stats.submitMs=performance.now()-started;stats.draws=draws;
  lastStamp=spec.stamp;front={spec,raster:canvas,stats,projected:state};return front;
 }
 return {use,stats,canvas,poll,get error(){return failed;},
  // Explicit diagnostic/loupe read only. Never called by the playback loop.
  read(x,y,w,h){gl.bindFramebuffer(gl.FRAMEBUFFER,null);const out=new Uint8Array(w*h*4);gl.readPixels(x,canvas.height-y-h,w,h,gl.RGBA,gl.UNSIGNED_BYTE,out);return out;},
  dispose(){for(const q of pending){gl.deleteSync(q.fence);if(q.timer)gl.deleteQuery(q.timer);}for(const p of programs)gl.deleteProgram(p.program);for(const t of textures)gl.deleteTexture(t.texture);for(const t of targets){gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.framebuffer);}gl.getExtension('WEBGL_lose_context')?.loseContext();},
 };
}
