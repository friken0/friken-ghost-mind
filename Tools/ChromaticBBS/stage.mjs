/* CHROMATIC specimen stage. One bounded SDF field consumes committed game
 * state. This renderer has no gameplay authority and never advances a turn. */
import { roseSource } from './rose-data.mjs';
import { sdfExpression, contentChecksum } from './chapters.mjs';
export function mountStage(canvas, report = () => {}) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false,
    powerPreference: 'low-power', preserveDrawingBuffer: true });
  if (!gl) { report('WebGL unavailable · story controls remain available'); return null; }
  const vertex = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fragment = `precision highp float;
uniform vec2 resolution,gaze,orbit;
uniform float clock,form,noise,seed,mouth,branch,wounds,zoom;
uniform vec3 ink,accent;
float smoothMin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float ellipse(vec3 p,vec3 r){float k0=length(p/r),k1=length(p/(r*r));return k0*(k0-1.)/max(k1,.0001);}
float torus(vec3 p,vec2 r){return length(vec2(length(p.xz)-r.x,p.y))-r.y;}
float rose(vec3 p){
  p.xz*=rot(.16*sin(clock*.18));
  float a=atan(p.z,p.x),r=length(p.xz);
  float d=length(p-vec3(0.,-.18,0.))-.23;
  for(int i=0;i<5;i++){
    float f=float(i),tier=.27+f*.13;
    float count=5.+mod(f+branch,3.);
    float edge=tier+(.10+.016*f)*cos(a*count+f*1.2+r*3.);
    vec2 q=vec2(r-edge,p.y-.23+f*.115+.12*cos(a*count+f));
    float petal=length(q*vec2(.72,1.))-(.025+.006*f);
    d=smoothMin(d,petal,.075);
  }
  d=smoothMin(d,ellipse(p-vec3(0.,-.6,0.),vec3(.055,.52,.055)),.04);
  vec3 leaf=p-vec3(.22,-.65,0.);leaf.xy*=rot(.8);
  return smoothMin(d,ellipse(leaf,vec3(.3,.055,.12)),.06);
}
float face(vec3 p){
  float d=ellipse(p-vec3(0.,.08,0.),vec3(.69,.84,.32));
  d=smoothMin(d,ellipse(p-vec3(0.,-.56,0.),vec3(.43,.28,.28)),.18);
  vec3 e=p;e.x=abs(e.x);e-=vec3(.29,.18,.29);
  e.xy-=gaze*vec2(.055,.035);
  d=max(d,-ellipse(e,vec3(.20,.13,.19)));
  d=max(d,-ellipse(p-vec3(0.,-.35,.27),vec3(.21,.025+mouth*.13,.15)));
  float bridge=ellipse(p-vec3(0.,.015,.32),vec3(.06+branch*.015,.16,.12));
  d=smoothMin(d,bridge,.075);
  vec3 ring=p;ring.yz*=rot(1.5708);
  float halo=torus(ring,vec2(1.05,.018));
  return min(d,halo);
}
float gate(vec3 p){
  p.xy*=rot(.09*sin(clock*.16));
  vec3 q=p;q.yz*=rot(1.5708);
  float d=torus(q,vec2(.75,.07+branch*.018));
  vec3 r=p;r.xy*=rot(clock*.09);r.yz*=rot(1.5708);
  d=min(d,torus(r,vec2(1.03,.023)));
  r=p;r.xy*=rot(-clock*.1);r.xz*=rot(.6);r.yz*=rot(1.5708);
  d=min(d,torus(r,vec2(1.15,.015)));
  float heart=ellipse(p,vec3(.18,.22,.18));
  return smoothMin(d,heart,.12);
}
float field(vec3 p){
  p.xz*=rot(orbit.x+gaze.x*.22+sin(clock*.12)*.15);
  p.yz*=rot(orbit.y+gaze.y*.11);
  float seedShape=length(p)-.28+.012*sin(p.x*18.)*sin(p.y*18.);
  float d=form<0.?mix(seedShape,rose(p),form+1.):(form<1.?mix(rose(p),face(p),form):mix(face(p),gate(p),form-1.));
  float scar=length(p-vec3(.32,.45,.20))-(.04+min(wounds,4.)*.055);
  if(wounds>0.)d=max(d,-scar);
  return (d+.0025*noise*sin(p.x*42.+clock)*sin(p.y*38.))*.65;
}
vec3 normalAt(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(field(p+e.xyy)-field(p-e.xyy),field(p+e.yxy)-field(p-e.yxy),field(p+e.yyx)-field(p-e.yyx)));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+seed)*43758.5453);}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;
  vec3 bg=vec3(.018,.012,.046);
  float nebula=sin(uv.x*7.+clock*.05)*sin(uv.y*9.-clock*.06);
  bg+=accent*.018*(1.+nebula);
  vec2 stars=floor(uv*145.);float h=hash(stars);
  bg+=ink*step(.996,h)*pow(max(0.,1.-length(fract(uv*145.)-.5)*2.),5.)*.7;
  float grid=abs(sin((atan(uv.y,uv.x)+clock*.012)*16.));
  bg+=ink*.012*pow(1.-grid,8.)/(.3+length(uv));
  float framing=form<0.?mix(1.25,1.9,form+1.):mix(1.9,2.55,form*.5);
  vec3 ro=vec3(0.,.06,3.65),rd=normalize(vec3(uv*framing*zoom,-3.));
  float t=0.;float nearGlow=0.;bool hit=false;
  for(int i=0;i<76;i++){
    vec3 p=ro+rd*t;float d=field(p);
    nearGlow+=.0006/(.007+abs(d));
    if(d<.0018){hit=true;break;}
    t+=d*.72;if(t>6.5)break;
  }
  vec3 col=bg;
  if(hit){
    vec3 p=ro+rd*t,n=normalAt(p),l=normalize(vec3(-2.,3.,4.));
    float diff=max(0.,dot(n,l)),rim=pow(1.-max(0.,dot(n,-rd)),2.4);
    float shade=clamp(field(p+n*.06)/.06,.2,1.);
    vec3 spectral=.5+.5*cos(vec3(0.,2.,4.)+p.y*4.+p.x*2.+clock*.07+seed*.0001);
    vec3 base=mix(ink,accent,.5+.5*sin(p.y*6.+p.x*3.+clock*.08));
    col=(base*.45+spectral*.3)*(.16+diff*.76)*shade;
    col+=ink*rim*.7+vec3(1.)*pow(max(0.,dot(reflect(-l,n),-rd)),40.)*.65;
    col+=accent*.05*sin(p.y*100.+clock*.3);
  }
  col+=ink*min(.1,nearGlow*.004);
  col*=.96+.04*sin(gl_FragCoord.y*1.7);
  col*=1.-.22*dot(uv,uv);
  gl_FragColor=vec4(pow(max(col,vec3(0.)),vec3(.85)),1.);
}`;
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  let program,roseProgram;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    // Keep the recovered source verbatim; these three declared changes bind
    // its original curved golden-angle petals to the committed world recipe.
    const roseFragment=roseSource.fragment
      .replace('uniform float uTime;','uniform float uTime,cgBranch,cgScars,cgNoise,cgZoom;uniform vec2 cgOrbit;')
      .replace('uPointer.x*.42','uPointer.x*.42+cgOrbit.x')
      .replace('uPointer.y*.24','uPointer.y*.24+cgOrbit.y')
      .replace('vec3 rd=normalize(uu*uv.x+vv*uv.y+ww*1.78);','vec3 rd=normalize(uu*uv.x*cgZoom+vv*uv.y*cgZoom+ww*1.78);')
      .replace('count=5.0+fi','count=5.0+fi+mod(cgBranch,3.0)')
      .replace('return vec3(boundary,height,fi+sector*.017);','height+=cgNoise*.006*sin(q.x*23.+uTime*.4)*cos(q.y*19.);\n return vec3(boundary,height,fi+sector*.017);')
      .replace('if(surface.x<0.0&&','if((cgScars<.5||distance(point.xy,vec2(.28,.28))>.06*min(cgScars,4.))&&surface.x<0.0&&');
    roseProgram=gl.createProgram();
    gl.attachShader(roseProgram,compile(gl.VERTEX_SHADER,roseSource.vertex));
    gl.attachShader(roseProgram,compile(gl.FRAGMENT_SHADER,roseFragment));
    gl.linkProgram(roseProgram);
    if(!gl.getProgramParameter(roseProgram,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(roseProgram));
  } catch (error) { report(`SDF compile failed: ${error.message}`); return null; }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const attr = gl.getAttribLocation(program, 'p');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  let uniforms = Object.fromEntries(['resolution','gaze','clock','form','noise','seed','mouth','branch','wounds','ink','accent','zoom','orbit'].map(k=>[k,gl.getUniformLocation(program,k)]));
  const roseUniforms=Object.fromEntries(['uResolution','uPointer','uModes','uTime','uAudio','cgBranch','cgScars','cgNoise','cgZoom','cgOrbit'].map(k=>[k,gl.getUniformLocation(roseProgram,k)]));
  let recipeKey=null;
  function setRecipe(recipe){
    const key=recipe?contentChecksum(recipe):null;if(key===recipeKey)return;
    const begin=fragment.indexOf('float field(vec3 p){'),end=fragment.indexOf('vec3 normalAt');
    const body=recipe?`float cgBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float field(vec3 p){p.xz*=rot(orbit.x+gaze.x*.22+sin(clock*.12)*.15);p.yz*=rot(orbit.y+gaze.y*.11);return (${sdfExpression(recipe)})*.65;}
`:null;
    const source=recipe?fragment.slice(0,begin)+body+fragment.slice(end):fragment;
    const next=gl.createProgram();try{gl.attachShader(next,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(next,compile(gl.FRAGMENT_SHADER,source));gl.linkProgram(next);if(!gl.getProgramParameter(next,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(next));}catch(error){gl.deleteProgram(next);throw error;}
    gl.deleteProgram(program);program=next;recipeKey=key;canvas.dataset.recipe=key||'legacy';
    uniforms=Object.fromEntries(['resolution','gaze','clock','form','noise','seed','mouth','branch','wounds','ink','accent','zoom','orbit'].map(k=>[k,gl.getUniformLocation(program,k)]));
  }
  let state=null, currentForm=-1, targetForm=-1, pose=[0,0], target=[0,0], mouthLevel=0;
  let paused=matchMedia('(prefers-reduced-motion: reduce)').matches, raf=0, last=0, elapsed=0;
  let orbit=[0,0],zoom=1;
  let frameCount=0, frameAt=0, fps=0, lost=false, visible=true;
  let palette=[[.23,.95,.91],[.96,.22,.62]];
  function draw(now=performance.now()) {
    if (lost||!visible){raf=0;return;}
    const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;
    if(!paused)elapsed+=dt;
    const k=paused?1:1-Math.exp(-dt*4);
    currentForm+=(targetForm-currentForm)*k;
    pose=pose.map((v,i)=>v+(target[i]-v)*k);
    mouthLevel*=Math.exp(-dt*12);
    const rect=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.25,800/Math.max(rect.width,1));
    const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    const isRose=!state?.pack&&state?.world.relic.form==='rose';
    const selected=isRose?roseProgram:program;
    gl.useProgram(selected);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const attribute=gl.getAttribLocation(selected,isRose?'aPosition':'p');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
    canvas.dataset.renderer=state?.pack?'generated-csg':isRose?'golden-whorl-surfaces':'SDF';
    if(isRose){
      const branchValue=Math.max(0,['witness','negative','echo'].indexOf(state?.modules.find(m=>m.id==='observe')?.law.id));
      gl.uniform1f(roseUniforms.cgZoom,zoom);gl.uniform2f(roseUniforms.cgOrbit,...orbit);
      gl.uniform2f(roseUniforms.uResolution,w,h);gl.uniform2f(roseUniforms.uPointer,...pose);
      gl.uniform2f(roseUniforms.uModes,3+branchValue,5+branchValue);
      gl.uniform1f(roseUniforms.uTime,elapsed);gl.uniform4f(roseUniforms.uAudio,0,0,0,0);
      gl.uniform1f(roseUniforms.cgBranch,branchValue);gl.uniform1f(roseUniforms.cgScars,state?.scars.length||0);
      gl.uniform1f(roseUniforms.cgNoise,(state?.resources.noise||0)/10);
    }else{
    gl.uniform1f(uniforms.zoom,zoom);gl.uniform2f(uniforms.orbit,...orbit);
    gl.uniform2f(uniforms.resolution,w,h);gl.uniform2f(uniforms.gaze,...pose);
    gl.uniform1f(uniforms.clock,elapsed);gl.uniform1f(uniforms.form,currentForm);
    gl.uniform1f(uniforms.mouth,paused?0:mouthLevel);
    gl.uniform1f(uniforms.noise,(state?.resources.noise||0)/10);
    gl.uniform1f(uniforms.branch,Math.max(0,['witness','negative','echo'].indexOf(state?.modules.find(m=>m.id==='observe')?.law.id)));
    gl.uniform1f(uniforms.wounds,state?.scars.length||0);
    gl.uniform1f(uniforms.seed,(state?.rng.initial||1)%997);
    gl.uniform3f(uniforms.ink,...palette[0]);gl.uniform3f(uniforms.accent,...palette[1]);
    }
    gl.drawArrays(gl.TRIANGLES,0,6);
    frameCount++;
    if(now-frameAt>1000){fps=Math.round(frameCount*1000/(now-frameAt));frameCount=0;frameAt=now;}
    if(!paused&&!document.hidden)raf=requestAnimationFrame(draw);else raf=0;
  }
  function wake(force=false){if(force){cancelAnimationFrame(raf);raf=0;visible=canvas.getClientRects().length>0&&canvas.clientWidth>0&&canvas.clientHeight>0;}if(!raf&&visible)draw();}
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(raf);raf=0;last=0;}else wake();});visibilityObserver.observe(canvas);
  const observer=new ResizeObserver(()=>{if(!raf)draw();});observer.observe(canvas);
  const touches=new Map();let dragStart=null,previousPoint=null,pinchDistance=0;
  const inspecting=()=>canvas.closest('#chromatic-carrier')?.dataset.inspect==='sdf';
  function zoomBy(delta){zoom=Math.max(.45,Math.min(2.4,zoom+delta));canvas.dataset.zoom=Math.round(100/zoom)+'%';wake();}
  function reset(){orbit=[0,0];zoom=1;canvas.dataset.zoom='100%';wake();}
  canvas.dataset.zoom='100%';
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||(event.pointerType==='touch'&&!inspecting()))return;
    touches.set(event.pointerId,[event.clientX,event.clientY]);canvas.dataset.dragged='false';dragStart=[event.clientX,event.clientY];previousPoint=dragStart;
    canvas.setPointerCapture(event.pointerId);if(touches.size===2){const a=[...touches.values()];pinchDistance=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);}
  });
  canvas.addEventListener('pointermove',event=>{
    const r=canvas.getBoundingClientRect();
    if(touches.has(event.pointerId)){
      touches.set(event.pointerId,[event.clientX,event.clientY]);
      if(touches.size===2){const a=[...touches.values()],distance=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinchDistance>0)zoomBy((pinchDistance-distance)/r.width);pinchDistance=distance;canvas.dataset.dragged='true';return;}
      if(previousPoint){orbit[0]+=(event.clientX-previousPoint[0])/r.width*6;orbit[1]=Math.max(-1.35,Math.min(1.35,orbit[1]+(event.clientY-previousPoint[1])/r.height*3));}
      previousPoint=[event.clientX,event.clientY];if(dragStart&&Math.hypot(event.clientX-dragStart[0],event.clientY-dragStart[1])>5)canvas.dataset.dragged='true';
      canvas.dataset.orbit=orbit.map(n=>n.toFixed(3)).join(',');wake();
    }else{target=[Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,1-(event.clientY-r.top)/r.height*2))];if(!paused)wake();}
  });
  for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,event=>{touches.delete(event.pointerId);previousPoint=null;pinchDistance=0;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);});
  canvas.addEventListener('wheel',event=>{if(!inspecting())return;event.preventDefault();zoomBy(Math.max(-.18,Math.min(.18,event.deltaY*.001)));},{passive:false});
  canvas.addEventListener('dblclick',reset);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;if(!document.hidden)wake();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);report('Graphics context lost · reload to restore art');});
  report('SDF ready');wake();
  return {
    zoom:zoomBy,reset,
    update(next){const node=next.pack?.scenes[Math.min(next.turn-1,next.pack.scenes.length-1)];try{setRecipe(node?.artifact||null);}catch(error){report('Generated SDF refused: '+error.message);return;}state=next;targetForm=({seed:-1,rose:0,face:1,gate:2})[next.world.relic.form];
      report(next.pack?'MODEL CSG / READY':next.world.relic.form==='rose'?'GOLDEN WHORLS / READY':'SDF ready');
      const palettes=[[[.23,.95,.91],[.96,.22,.62]],[[.85,.4,1],[.15,.95,.8]],[[1,.65,.23],[.5,.6,1]]];
      palette=palettes[(next.scars.length+next.chapter-1)%3];
      if(paused)currentForm=targetForm;wake(true);},
    hold(value){paused=value;cancelAnimationFrame(raf);raf=0;last=0;wake();},
    pulse(){if(!paused){mouthLevel=.8;wake();}},
    get fps(){return paused?'HELD':fps;}, get paused(){return paused;},
    dispose(){cancelAnimationFrame(raf);observer.disconnect();visibilityObserver.disconnect();gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteProgram(roseProgram);}
  };
}
