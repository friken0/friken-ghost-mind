/* Signal Dock: a raymarched modem, carrier aperture and recursive relay field.
 * Presentation follows the connection clock; it has no game/RNG authority.
 * One bounded WebGL canvas. Hidden/reduced/paused scenes stop time; CPU draw
 * submission and visible FPS are measured separately from unmeasured GPU cost. */
export const bootWorldBudget={pixels:310000,steps:76,fps:30};
export const bootWorldFragment=`precision highp float;
uniform vec2 uRes,uPointer;
uniform float uTime,uProgress,uPhase;
uniform vec4 uBands;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float rounded(vec3 p,vec3 b,float r){return box(p,b)-r;}
float torus(vec3 p,vec2 t){return length(vec2(length(p.xy)-t.x,p.z))-t.y;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec2 join(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec2 map(vec3 p){
 // Brushed metal modem with a vented face and armoured corners.
 vec3 m=p-vec3(0.,-.48,-.7);m.xz=rot(-.10)*m.xz;
 vec2 d=vec2(rounded(m,vec3(1.38,.24,.68),.11),1.);
 float panel=rounded(m-vec3(0.,.04,-.81),vec3(1.12,.135,.035),.025);
 d=join(d,vec2(panel,2.));
 vec3 q=m-vec3(0.,.35,0.);q.x=mod(q.x+.08,.16)-.08;
 float vent=box(q,vec3(.026,.085,.43));
 if(abs(m.x)<1.12)d.x=max(d.x,-vent);
 vec3 a=m-vec3(1.13,.45,.25);a.x=abs(m.x)-1.13;
 d=join(d,vec2(rounded(a,vec3(.055,.35,.055),.025),3.));
 vec3 foot=m;foot.x=abs(foot.x)-1.10;foot.z=abs(foot.z)-.48;
 d=join(d,vec2(rounded(foot-vec3(0.,-.33,0.),vec3(.14,.09,.13),.04),1.));
 // Four glass indicators, each gains a handshake stage rather than a fake RNG.
 for(int i=0;i<4;i++){
  vec3 led=m-vec3(-.73+float(i)*.45,.04,-.875);
  d=join(d,vec2(rounded(led,vec3(.12,.045,.026),.02),4.+float(i)));
 }
 // Concentric mechanical aperture: brass ribs around a cyan carrier throat.
 vec3 r=p-vec3(0.,.95,3.8);
 d=join(d,vec2(torus(r,vec2(2.30,.12)),3.));
 d=join(d,vec2(torus(r,vec2(2.56,.055)),1.));
 d=join(d,vec2(torus(r,vec2(2.02,.033)),8.));
 float ang=atan(r.y,r.x);vec3 ribs=r;ribs.xy=rot(-floor((ang+3.14159)/.523599)*.523599)*ribs.xy;
 d=join(d,vec2(rounded(vec3(length(r.xy)-2.29,mod(ang+.2618,.5236)-.2618,r.z),vec3(.24,.026,.17),.018),3.));
 // Physical data conduit climbs from the modem into the aperture.
 vec3 cable=p-vec3(0.,-.48,0.);float pathX=.82*sin(cable.z*.80);
 d=join(d,vec2(length(vec2(cable.x-pathX,cable.y+.18-.14*sin(cable.z*.7)))-.055,9.));
 // Distant folded relays: geometry, not a painted tunnel.
 if(p.z>5.){
  vec3 seed=p-vec3(0.,.95,5.7);seed.xy=rot(uTime*.12)*seed.xy;seed.yz=rot(.6+uTime*.09)*seed.yz;
  float gem=(dot(abs(seed),vec3(1.))-.44)*.57735;
  for(int k=0;k<4;k++){vec3 knot=seed;knot.xy=rot(float(k)*.7854+uTime*.07)*knot.xy;knot.yz=rot(float(k)*.64)*knot.yz;gem=min(gem,torus(knot,vec2(.56+float(k)*.075,.022)));}
  d=join(d,vec2(gem,12.));
  vec3 c=p-vec3(0.,.95,4.);float z=floor(c.z/3.6);c.z=mod(c.z,3.6)-1.8;c.xy=rot(z*.28+uProgress*.1)*c.xy;
  float frame=max(abs(length(c.xy)-max(2.5,4.8-z*.08))-.055,abs(c.z)-.055);
  d=join(d,vec2(frame,10.));
 }
 d=join(d,vec2(p.y+1.04,11.));return d;
}
vec3 normal(vec3 p){vec2 e=vec2(.0015,-.0015);return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}
vec3 sky(vec3 rd){
 vec3 col=vec3(.014,.025,.043)+vec3(.014,.06,.075)*pow(max(0.,1.-abs(rd.y)),4.);
 vec3 stars=floor(rd*260.);float s=hash(stars);col+=vec3(.8,.9,1.)*step(.995,s)*exp(-dot(fract(rd*260.)-.5,fract(rd*260.)-.5)*70.);vec3 fold=rd*2.;float filaments=0.;for(int i=0;i<4;i++){fold=abs(fold)/max(dot(fold,fold),.25)-.72;filaments+=exp(-abs(fold.x)*9.)*.25;}col+=vec3(.018,.055,.065)*filaments;
 float throat=pow(max(0.,dot(rd,normalize(vec3(0.,.04,1.)))),30.);return col+vec3(.015,.09,.10)*throat;
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
 vec3 ro=vec3(3.5+uPointer.x*.32,2.20+uPointer.y*.18,-7.2);
 vec3 target=vec3(-.1,.22,1.3);vec3 f=normalize(target-ro),r=normalize(cross(f,vec3(0.,1.,0.))),up=cross(r,f);
 vec3 rd=normalize(f*1.45+uv.x*r+uv.y*up),col=sky(rd);float travel=0.,glow=0.;vec2 hit=vec2(1.);
 for(int i=0;i<76;i++){
  vec3 p=ro+rd*travel;hit=map(p);
  vec3 g=p-vec3(0.,.95,3.8);float ring=abs(length(g.xy)-(1.98+uProgress*.05))+abs(g.z)*.6;
  glow+=.0014/(.02+ring*ring)*(.25+uProgress*.75);
  if(hit.x<.0015||travel>34.)break;travel+=max(.006,hit.x*.78);
 }
 if(travel<34.&&hit.x<.01){
  vec3 p=ro+rd*travel,n=normal(p),light=normalize(vec3(-3.,5.,-4.));
  float diffuse=max(dot(n,light),0.),spec=pow(max(dot(reflect(-light,n),-rd),0.),48.);
  float grain=hash(floor(p*220.));vec3 base=vec3(.075,.10,.11);float metal=.6;vec3 emit=vec3(0.);
  if(hit.y<1.5)base=vec3(.13,.17,.18)*( .76+grain*.24);
  else if(hit.y<2.5){base=vec3(.008,.023,.027);metal=.8;}
  else if(hit.y<3.5){base=vec3(.38,.25,.10)*(.72+grain*.28);metal=.9;}
  else if(hit.y<7.5){float stage=hit.y-4.;float on=step(stage*.24,uProgress)*step(.5,uPhase);base=vec3(.01,.025,.026);emit=mix(vec3(.025,.11,.13),stage>2.5?vec3(1.,.61,.14):vec3(.03,.85,.78),on)*(on*.9+.08);}
  else if(hit.y<8.5){base=vec3(.015,.18,.18);emit=vec3(.02,.70,.69)*(.25+uProgress*2.);}
  else if(hit.y<9.5){float pulse=pow(max(0.,sin(p.z*5.-uTime*3.)),12.);base=vec3(.06,.13,.14);emit=vec3(.02,.55,.62)*pulse*(.14+uProgress);}
  else if(hit.y<10.5){base=vec3(.03,.12,.14);emit=mix(vec3(.02,.24,.29),vec3(.64,.20,.48),.5+.5*sin(p.z*.34))* (.35+uProgress*.8);}
  else if(hit.y>11.5){base=vec3(.08,.28,.37);emit=mix(vec3(.06,.8,.85),vec3(.6,.10,.6),.5+.5*sin(p.x*7.+p.y*5.+uTime*.4))*(.4+uProgress*.8);}
  else{base=vec3(.014,.026,.031);vec2 cell=abs(fract(p.xz*.6)-.5);float grid=1.-smoothstep(.012,.025,min(cell.x,cell.y));emit=vec3(.01,.12,.14)*grid*.4;}
  float fres=pow(1.-max(0.,dot(n,-rd)),4.);float ao=clamp(map(p+n*.18).x/.18,.3,1.);
  col=base*(.19+diffuse*.85)*ao+spec*mix(vec3(.4),base,metal)*1.5+fres*vec3(.045,.12,.13)+emit;
  col=mix(col,sky(rd),1.-exp(-travel*.034));
 }
 col+=vec3(.015,.65,.68)*glow*(.8+uBands.y*.5);
 // Broad travelling arcs through the throat. Low frequency, no white strobe.
 vec3 at=ro+rd*((3.8-ro.z)/max(.01,rd.z));vec2 gate=at.xy-vec2(0.,.95);
 float radius=length(gate),angle=atan(gate.y,gate.x);
 float filament=exp(-pow((radius-1.84-.06*sin(angle*6.+uTime*.5))/.022,2.));
 col+=vec3(.08,.75,.72)*filament*(.15+uProgress)*step(0.,rd.z);
 float bloom=pow(max(0.,1.-radius/1.9),4.)*uProgress;col+=vec3(.025,.13,.16)*bloom;
 col*=2.5;col=col/(1.+col);col=pow(col,vec3(.85));col*=1.-.16*dot(uv,uv);
 gl_FragColor=vec4(col,1.);
}`;
export function mountBootWorld(canvas,{fps,energy=()=>[0,0,0,0],reduced=false}={}){
 let gl=null,program=null,raf=0,last=0,time=0,visible=false,paused=false,phase=0,progress=0;
 let pointer=[0,0],frames=0,stamp=0,read=false;
 const metrics={frames:0,drawMs:0,fps:0,pixels:0,renderer:'unavailable'};
 try{
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)throw Error('WebGL unavailable');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,bootWorldFragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  metrics.renderer='webgl-sdf';canvas.dataset.renderer='webgl-sdf';canvas.dataset.shader='ready';
 }catch(error){canvas.dataset.shader='failed';canvas.dataset.error=error.message;canvas.setAttribute('aria-label','Signal Dock unavailable: '+error.message);if(fps)fps.textContent='TEXT / NO WEBGL';return {set(){},show(){},metrics};}
 const uniform=name=>gl.getUniformLocation(program,name),u={r:uniform('uRes'),p:uniform('uPointer'),t:uniform('uTime'),v:uniform('uProgress'),s:uniform('uPhase'),b:uniform('uBands')};
 function draw(now){
  raf=0;if(!visible||document.hidden)return;
  if(now-last>=1000/bootWorldBudget.fps-.1){
   const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now-((now-last)%(1000/bootWorldBudget.fps));if(!paused&&!reduced)time+=dt;
   const rect=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.25,Math.sqrt(bootWorldBudget.pixels/Math.max(1,rect.width*rect.height)));
   const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   const begin=performance.now();gl.viewport(0,0,w,h);gl.useProgram(program);gl.uniform2f(u.r,w,h);gl.uniform2f(u.p,pointer[0],pointer[1]);gl.uniform1f(u.t,time);gl.uniform1f(u.v,progress);gl.uniform1f(u.s,phase);gl.uniform4fv(u.b,new Float32Array(energy()));gl.drawArrays(gl.TRIANGLES,0,6);
   metrics.frames++;metrics.drawMs=performance.now()-begin;metrics.pixels=w*h;canvas.dataset.drawMs=metrics.drawMs.toFixed(3);canvas.dataset.progress=progress.toFixed(3);canvas.dataset.frames=String(metrics.frames);
   if(!read){const pixels=new Uint8Array(4);gl.readPixels(w>>1,h>>1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);canvas.dataset.pixel=[...pixels].join(',');read=true;}
   frames++;if(now-stamp>=1000){metrics.fps=Math.round(frames*1000/(now-stamp));frames=0;stamp=now;if(fps)fps.textContent=metrics.fps+' FPS / SDF';}
  }
  raf=requestAnimationFrame(draw);
 }
 function show(value){visible=!!value;if(!visible){cancelAnimationFrame(raf);raf=0;}else if(!raf){last=performance.now();stamp=last;raf=requestAnimationFrame(draw);}}
 canvas.parentElement.addEventListener('pointermove',event=>{if(paused||reduced)return;const r=canvas.getBoundingClientRect();pointer=[Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,1-(event.clientY-r.top)/r.height*2))];});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(visible)show(true);});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();show(false);canvas.dataset.shader='lost';if(fps)fps.textContent='SDF CONTEXT LOST / RELOAD';});
 return {show,metrics,set(state){phase=state.phase??phase;progress=Math.max(0,Math.min(1,state.progress??progress));paused=!!state.paused;canvas.dataset.held=String(paused);}};
}
