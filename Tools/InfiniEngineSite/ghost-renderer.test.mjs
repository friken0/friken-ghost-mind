import test from 'node:test';
import assert from 'node:assert/strict';
import {GhostPortrait,portraitViewportSize,portraitAspectSource,portraitScissor} from './ghost-renderer.js';
import {dreamFace,dreamFrameUniforms} from '../ChromaticBBS/dream-face.mjs';

test('retained square sizing matches the prior policy while rect keeps actual pixels',()=>{
  for(const [width,height,dpr] of [[640,640,1],[900,480,2],[360,780,3],[0,0,2]]){
    const requested=Math.max(1,Math.round(width*dpr));
    const old=Math.max(1,Math.min(768,Math.round(width*Math.min(dpr,1.5))));
    for(const full of [false,true]){
      const dimensions=portraitViewportSize({width,height},dpr,{renderPolicy:{fullResolution:full}});
      assert.deepEqual([dimensions.width,dimensions.height],[full?requested:old,full?requested:old]);
    }
  }
  assert.deepEqual(portraitViewportSize({width:1200,height:600},2,dreamFace,'rect'),
    {width:2400,height:1200,requestedWidth:2400,requestedHeight:1200});
  assert.deepEqual(portraitViewportSize({width:400,height:800},2,dreamFace,'rect'),
    {width:800,height:1600,requestedWidth:800,requestedHeight:1600});
  assert.throws(()=>portraitViewportSize({width:400,height:800},2,dreamFace,'stretch'));
});

test('rect shader adapter changes view coordinates without changing face mathematics',()=>{
  for(const source of [dreamFace.bgShader,dreamFace.boltShader,...dreamFace.geometryShaders]){
    const adjusted=portraitAspectSource(source);
    assert.match(adjusted,/uniform vec2 u_viewAspect;/);
    assert.match(adjusted,/\(v_uv-vec2\(\.5\)\)\*u_viewAspect/);
    assert.equal((adjusted.match(/\bv_uv\b/g)||[]).length,2);
    // The original anatomy remains byte-identical after reversing just the
    // one declared view-coordinate transformation.
    const restored=adjusted.replace('varying vec2 v_uv;\nuniform vec2 u_viewAspect;\nvec2 gf_viewUV(){return vec2(.5)+(v_uv-vec2(.5))*u_viewAspect;}', 'varying vec2 v_uv;')
      .replace(/gf_viewUV\(\)/g,'v_uv');
    assert.equal(restored,source);
  }
});

test('bloom, depth and history resize together even when only viewport height changes',()=>{
  const saved=globalThis.devicePixelRatio;globalThis.devicePixelRatio=2;
  const textures=[],depth=[];
  let rect={width:900,height:450};
  const renderer=Object.create(GhostPortrait.prototype);
  Object.assign(renderer,{viewport:'rect',version:dreamFace,bloom:{},bloomTexture:{},bloomTarget:{},depthTarget:{},historyTexture:{},
    canvas:{width:0,height:0,dataset:{},getBoundingClientRect:()=>rect},
    gl:{bindTexture(){},texImage2D(...args){textures.push(args.slice(3,5));},bindFramebuffer(){},framebufferTexture2D(){},bindRenderbuffer(){},renderbufferStorage(...args){depth.push(args.slice(2,4));},framebufferRenderbuffer(){},checkFramebufferStatus(){return 1;},FRAMEBUFFER_COMPLETE:1}});
  try{
    renderer.resize();assert.deepEqual([renderer.canvas.width,renderer.canvas.height],[1800,900]);
    assert.deepEqual(textures,[[1800,900],[1800,900]]);assert.deepEqual(depth,[[1800,900]]);
    renderer.historyReady=true;renderer.bloomReady=true;rect={width:900,height:600};renderer.resize();
    assert.deepEqual(textures.slice(-2),[[1800,1200],[1800,1200]]);assert.deepEqual(depth.at(-1),[1800,1200]);
    assert.equal(renderer.historyReady,false);assert.equal(renderer.bloomReady,false);
  }finally{if(saved===undefined)delete globalThis.devicePixelRatio;else globalThis.devicePixelRatio=saved;}
});

test('opaque Reply draws real depth first and culls only the overwritten background',()=>{
  const make=(opaque,background)=>{
    const draws=[];let program,depth,range=[0,1],write=true;
    const gl=new Proxy({LESS:11,EQUAL:12,FRAMEBUFFER_COMPLETE:1,
      isContextLost:()=>false,getAttribLocation:()=>0,
      useProgram(p){program=p;},depthFunc(v){depth=v;},depthRange(a,b){range=[a,b];},depthMask(v){write=v;},
      drawArrays(){draws.push({program,depth,range:[...range],write});}}, {get:(target,key)=>key in target?target[key]:(()=>{})});
    const r=Object.create(GhostPortrait.prototype);
    Object.assign(r,{canvas:{width:1500,height:900,dataset:{}},version:{...dreamFace,opaqueGeometry:opaque},gl,
      programs:Array.from({length:5},(_,i)=>({program:i,uniforms:[]})),bloom:{program:'bloom',uniforms:[]},depthTarget:{},
      bloomTarget:{},bloomTexture:{},historyTexture:null,cymatics:[0,0,0,0],timer:null,queries:[],profileEvery:0,
      expression:()=>({}),gpuPasses:[],quad:{},background});
    r.draw(8);return {draws,r};
  };
  const native=make(true),retained=make(false),overlay=make(true,false);
  assert.deepEqual(overlay.draws.map(d=>d.program),[2,3,4,'bloom']);
  assert.deepEqual(native.draws.map(d=>d.program),[2,3,4,0,1,'bloom']);
  assert.deepEqual(retained.draws.map(d=>d.program),[0,1,2,3,4,'bloom']);
  for(const d of native.draws.filter(d=>typeof d.program==='number'&&d.program>=2)){
    assert.equal(d.depth,11);assert.deepEqual(d.range,[0,1]);assert.equal(d.write,true);
  }
  for(const d of native.draws.filter(d=>d.program===0||d.program===1)){
    assert.equal(d.depth,12);assert.deepEqual(d.range,[1,1]);assert.equal(d.write,false);
  }
  assert.equal(native.r.canvas.dataset.backgroundCulling,'opaque-depth');
  assert.deepEqual(native.draws.at(-1).range,[0,1]);
});

test('profiling cadence is explicit and does not change renderer resolution',()=>{
  const r=Object.create(GhostPortrait.prototype);r.canvas={width:1554,height:1400};
  r.setProfiling(1);assert.equal(r.profileEvery,1);assert.equal(r.profileCursor,0);
  r.setProfiling(0);assert.equal(r.profileEvery,0);
  assert.throws(()=>r.setProfiling(-1));assert.throws(()=>r.setProfiling(601));
  assert.deepEqual([r.canvas.width,r.canvas.height],[1554,1400]);
});

test('conservative scissors contain projected AABB rays at every held camera pose',()=>{
  const norm=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  for(const [width,height] of [[1554,1400],[2200,900],[800,1400]])for(const yaw of [-1.1,-.55,0,.55,1.1])for(const roll of [-.14,0,.14]){
    const scalar={headYaw:yaw,headPitch:.08,headRoll:roll,headZoom:1.08,frameScale:.73};
    const d=2.4/scalar.headZoom,eye=[Math.sin(yaw)*Math.cos(.08)*d,Math.sin(.08)*d,Math.cos(yaw)*Math.cos(.08)*d];
    const forward=norm(eye.map((v,i)=>(i===1?-.015:0)-v)),right=norm(cross(forward,[0,1,0])),up=cross(right,forward);
    for(const bounds of dreamFace.geometryBounds){
      const [x,y,w,h]=portraitScissor(bounds,scalar,width,height,'rect');
      assert.ok(x>=0&&y>=0&&w>=0&&h>=0&&x+w<=width&&y+h<=height);
      // Test interior and face points, not only the corners used to build
      // the projection: perspective extrema must still enclose every ray.
      for(let ix=-2;ix<=2;ix++)for(let iy=-2;iy<=2;iy++)for(let iz=-2;iz<=2;iz++){
        const v=[ix,iy,iz].map((n,k)=>bounds.center[k]+n*.5*bounds.extent[k]-eye[k]);
        const z=dot(v,forward),px=dot(v,right)*2.2/z,py=dot(v,up)*2.2/z;
        const qx=Math.cos(roll)*px-Math.sin(roll)*py,qy=Math.sin(roll)*px+Math.cos(roll)*py;
        const sx=(qx/scalar.frameScale/(width/Math.min(width,height))+1)*width*.5;
        const sy=(qy/scalar.frameScale/(height/Math.min(width,height))+1)*height*.5;
        if(sx>=0&&sx<width&&sy>=0&&sy<height)assert.ok(sx>=x&&sx<=x+w&&sy>=y&&sy<=y+h,'an existing field ray cannot be removed');
      }
    }
  }
});


test('prepared frame vectors preserve camera, mirrored feather attachments and signed gear motion',()=>{
 const close=(a,b)=>assert.ok(Math.abs(a-b)<2e-7,`${a} != ${b}`),rotate=(a,x,y)=>[Math.cos(a)*x+Math.sin(a)*y,-Math.sin(a)*x+Math.cos(a)*y];
 for(const time of [0,.2,8,37,5000])for(const wingFlex of [0,.35,1])for(const serpentSway of [-.2,0,.2]){
  const state={time,wingFlex,serpentSway,serpentLift:.7,headYaw:-.41,headPitch:.08,headRoll:.13,headZoom:1.06,gearPhase:time*.38},f=dreamFrameUniforms(state);
  const h=.46445498,settle=h*h*h*(h*(h*6-15)+10),belly=Math.sin(h*3.14159265)**2;
  const shoulder=[-.045+serpentSway*(.11*settle+.10*Math.sin(h*6.2831853-time*2.7)*belly),.456+.038*.7,.240+serpentSway*.045*Math.sin(h*7.5-time*2.1)*belly];
  for(let n=0;n<3;n++)close(f.serpentAnchor[n],shoulder[n]);
  for(let k=0;k<5;k++){
   const span=.244-k*.017,u=.91;let v=[span*u,.032*Math.sin(u*3.14159265),.025*Math.sin(u*3.14159265)];
   [v[0],v[1]]=rotate(.52-k*.18,v[0],v[1]);[v[0],v[2]]=rotate(-.25+wingFlex*.85,v[0],v[2]);[v[0],v[1]]=rotate(-.08+wingFlex*.35,v[0],v[1]);
   for(const sign of [-1,0,1]){close(f.serpentAnchor[0]+sign*f.webTips[k*3],shoulder[0]+sign*(.048+v[0]));close(f.serpentAnchor[1]+f.webTips[k*3+1],shoulder[1]+v[1]);close(f.serpentAnchor[2]+f.webTips[k*3+2],shoulder[2]+v[2]);}
  }
  const d=2.4/state.headZoom,eye=[Math.sin(state.headYaw)*Math.cos(state.headPitch)*d,Math.sin(state.headPitch)*d,Math.cos(state.headYaw)*Math.cos(state.headPitch)*d];for(let n=0;n<3;n++)close(f.cameraEye[n],eye[n]);
  for(const sign of [-1,0,1]){
   const c2=sign?f.gearTurn[2]:1,s2=f.gearTurn[3]*sign;close(.9855847669*c2+.1691823491*s2,Math.cos(.17-2*state.gearPhase*sign));close(.1691823491*c2-.9855847669*s2,Math.sin(.17-2*state.gearPhase*sign));
  }
 }
});

test('prepared frame array uniforms upload once per geometry pass without changing draw order',()=>{
 const uploads=[],draws=[];let program;const gl=new Proxy({FLOAT:1,FLOAT_VEC2:2,FLOAT_VEC3:3,FLOAT_VEC4:4,LESS:11,EQUAL:12,
  isContextLost:()=>false,getAttribLocation:()=>0,useProgram(p){program=p;},drawArrays(){draws.push(program);},uniform3fv(location,value){uploads.push({program,location,value:[...value]});}}, {get:(target,key)=>key in target?target[key]:(()=>{})});
 const r=Object.create(GhostPortrait.prototype);Object.assign(r,{canvas:{width:1190,height:1139,dataset:{}},version:dreamFace,gl,programs:Array.from({length:5},(_,i)=>({program:i,uniforms:i>=2?[{name:'u_webTips[0]',type:3,size:5,location:'tips'}]:[]})),depthTarget:{},bloom:null,bloomTarget:null,cymatics:[0,0,0,0],timer:null,queries:[],profileEvery:0,expression:()=>({wingFlex:.35}),quad:{}});r.draw(8);
 assert.deepEqual(draws,[2,3,4,0,1]);assert.equal(uploads.length,3);assert.ok(uploads.every(u=>u.value.length===15&&u.value.every(Number.isFinite)));assert.deepEqual(uploads[0].value,uploads[2].value);assert.ok(Number(r.canvas.dataset.framePrepareMs)>=0);
});
