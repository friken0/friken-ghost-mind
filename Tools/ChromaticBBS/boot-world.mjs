/* Signal Dock: a raymarched modem, carrier aperture and recursive relay field.
 * Presentation follows the connection clock; it has no game/RNG authority.
 * One bounded WebGL canvas. Hidden/reduced/paused scenes stop time; CPU draw
 * submission and visible FPS are measured separately from unmeasured GPU cost. */
export const bootWorldBudget={pixels:310000,steps:76,fps:30};
// Audio envelopes follow the single mixer; terminal ink is a separate signal.
export function bootSignalEnvelope(previous,bands,rms,ink,dt,{held=false,reduced=false}={}){
 const zero={bands:[0,0,0,0],level:0,ink:0};if(reduced)return zero;
 if(held)return previous;
 const clamp=x=>Number.isFinite(x)?Math.max(0,Math.min(1,x)):0;
 const smooth=(old,next)=>old+(next-old)*(1-Math.exp(-Math.min(.1,Math.max(0,dt))*(next>old?24:5)));
 return {bands:Array.from({length:4},(_,i)=>smooth(previous.bands[i],clamp(bands?.[i]))),level:smooth(previous.level,clamp(rms*5)),ink:Math.max(clamp(ink),previous.ink*Math.exp(-Math.max(0,dt)*5))};
}
// Shared CPU camera math matches the shader basis and its vertical lens.
const bootViews={wide:{eye:[3.5,2.2,-7.2],look:[-.1,.22,1.3],lens:1.45},modem:{eye:[2.,1.25,-3.7],look:[0.,-.22,-.7],lens:1.65},portal:{eye:[.8,1.3,-2.1],look:[0.,.95,4.2],lens:1.15}};
export function bootCameraView(mode='wide'){const v=bootViews[mode];if(!v)throw Error('Unknown dock view');return {eye:[...v.eye],look:[...v.look],lens:v.lens};}
// Each approach gets a bounded dolly arc and lens. Entropy is presentation-only.
export function bootCameraFlight(from,mode,seed=0){
 const to=bootCameraView(mode);let n=seed>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;},side=rand()*2-1;
 if(mode!=='wide'){to.eye[0]+=(rand()-.5)*(mode==='modem'?.5:.6);to.eye[1]+=(rand()-.5)*.3;to.eye[2]+=(rand()-.5)*.35;to.lens*=.95+rand()*.1;}
 const control=[.28,.78].map((t,i)=>from.eye.map((v,k)=>v+(to.eye[k]-v)*t+(k===0?side*(i?.35:.9):k===1?(i?.18:.42):0)));
 return {from:{eye:[...from.eye],look:[...from.look],lens:from.lens},to,control,duration:2.35+rand()*.65};
}
export function bootCameraAt(flight,age,{reduced=false}={}){
 const p=reduced?1:Math.max(0,Math.min(1,age/flight.duration)),t=p*p*(3-2*p),q=1-t;
 return {eye:flight.from.eye.map((v,k)=>q*q*q*v+3*q*q*t*flight.control[0][k]+3*q*t*t*flight.control[1][k]+t*t*t*flight.to.eye[k]),look:flight.from.look.map((v,k)=>v+(flight.to.look[k]-v)*t),lens:flight.from.lens+(flight.to.lens-flight.from.lens)*t+Math.sin(Math.PI*t)*.07};
}
// Empty interior is a hold region; only the outer 3% is a pull-back lane.
export function bootHoverFocus(hit,current,pointer){
 if(current==='wide')return hit==='wide'?null:hit;
 if(Math.max(Math.abs(pointer[0]),Math.abs(pointer[1]))>=.94)return 'wide';
 if(hit===current)return null;
 return hit==='wide'?null:hit;
}
const vsub=(a,b)=>a.map((v,i)=>v-b[i]),vdot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),vnorm=a=>{const n=Math.hypot(...a);return a.map(x=>x/n);},vcross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function bootBasis(c){const f=vnorm(vsub(c.look,c.eye)),r=vnorm(vcross(f,[0,1,0]));return {f,r,up:vcross(r,f)};}
export function bootProject(point,camera,aspect){const b=bootBasis(camera),p=vsub(point,camera.eye),z=vdot(p,b.f);return [vdot(p,b.r)/z*camera.lens*2/aspect,vdot(p,b.up)/z*camera.lens*2];}
export function bootPick(pointer,camera,aspect){
 const b=bootBasis(camera),rd=vnorm(b.f.map((v,i)=>v*camera.lens+b.r[i]*pointer[0]*aspect*.5+b.up[i]*pointer[1]*.5)),ro=camera.eye;
 let near=0,far=1e4;const lo=[-1.65,-1.02,-1.75],hi=[1.65,.8,.2];
 for(let i=0;i<3;i++){if(Math.abs(rd[i])<1e-8){if(ro[i]<lo[i]||ro[i]>hi[i])far=-1;}else{const a=(lo[i]-ro[i])/rd[i],c=(hi[i]-ro[i])/rd[i];near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));}}
 if(far>=near&&far>0)return 'modem';
 const t=(3.8-ro[2])/rd[2];if(t>0&&Math.hypot(ro[0]+rd[0]*t,ro[1]+rd[1]*t-.95)<2.8)return 'portal';return 'wide';
}
export function bootLampSignals(progress,phase,signal,time){
 const sat=x=>Math.max(0,Math.min(1,x)),[bass,mid,air]=signal.bands,live=phase>.5?1:0;
 return [.28+live*.22+bass*.42,live*(.1+.35*Math.pow(Math.max(0,Math.sin(time*6.)),6)+mid*.55),live*(progress>.18?1:0)*(.12+air*.65+signal.ink*.22),progress>=.98?.65+bass*.25+air*.1:live*(progress>.68?1:0)*(.08+.24*Math.pow(Math.max(0,Math.sin(time*3.)),4))].map(sat);
}
export const bootWorldFragment=`precision highp float;
uniform vec2 uRes,uPointer;
uniform float uTime,uProgress,uPhase;
uniform vec4 uBands;
uniform vec2 uDrive;
uniform vec3 uEye,uLook;
uniform float uLens;
uniform vec4 uLamps;
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
 // GHOSTLINK phase modem: suspended octahedral core and three carrier coils.
 vec3 core=m-vec3(0.,.69,.02);core.xz=rot(uTime*.16)*core.xz;
 float crystal=(dot(abs(core),vec3(1.))-.31-uBands.x*.035)*.57735;
 d=join(d,vec2(crystal,13.));
 for(int k=0;k<3;k++){vec3 coil=m-vec3(0.,.42+float(k)*.17,.02);coil.xz=rot(float(k)*.7)*coil.xz;coil.y+=.03*sin(atan(coil.z,coil.x)*6.+uTime*.7)*uBands.y;d=join(d,vec2(torus(coil.xzy,vec2(.42+float(k)*.07,.023)),14.));}
 vec3 bolt=m;bolt.x=abs(m.x)-1.24;bolt.z=abs(m.z)-.55;bolt.y-=.23;d=join(d,vec2(length(bolt)-.07,3.));
 vec3 armour=m;armour.x=abs(m.x)-1.35;armour.y-=.02;
 float cheek=max(rounded(armour,vec3(.14,.27,.57),.045),abs(armour.z)+armour.y*.35-.59);d=join(d,vec2(cheek,1.));
 vec3 gasket=m-vec3(0.,.13,0.);float seam=max(rounded(gasket,vec3(1.47,.012,.77),.05),-rounded(gasket,vec3(1.34,.08,.64),.03));d=join(d,vec2(seam,15.));
 // Four glass indicators, each gains a handshake stage rather than a fake RNG.
 for(int i=0;i<4;i++){
  vec3 led=m-vec3(-.73+float(i)*.45,.04,-.875);
  d=join(d,vec2(rounded(led,vec3(.12,.045,.026),.02),4.+float(i)));
 }
 // Concentric mechanical aperture: brass ribs around a cyan carrier throat.
 vec3 r=p-vec3(0.,.95,3.8);
 d=join(d,vec2(torus(r,vec2(2.30,.12)),3.));
 d=join(d,vec2(torus(r,vec2(2.56,.055)),1.));
 vec3 living=r;living.xy*=1.-.045*uBands.x;
 d=join(d,vec2(torus(living,vec2(2.02,.033+.018*uDrive.x)),8.));
 float ang=atan(r.y,r.x);vec3 ribs=r;ribs.xy=rot(-floor((ang+3.14159)/.523599)*.523599)*ribs.xy;
 d=join(d,vec2(rounded(vec3(length(r.xy)-2.29,mod(ang+.2618,.5236)-.2618,r.z),vec3(.24,.026,.17),.018),3.));
 // Physical data conduit climbs from the modem into the aperture.
 vec3 cable=p-vec3(0.,-.48,0.);float pathX=.82*sin(cable.z*.80);
 d=join(d,vec2(length(vec2(cable.x-pathX,cable.y+.18-.14*sin(cable.z*.7)))-.055,9.));
 // Distant folded relays: geometry, not a painted tunnel.
 if(p.z>5.){
  vec3 seed=(p-vec3(0.,.95,5.7))/(1.+uDrive.x*.20+uDrive.y*.08);seed.xy=rot(uTime*.12)*seed.xy;seed.yz=rot(.6+uTime*.09)*seed.yz;
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
 vec3 ro=uEye;
 vec3 target=uLook;vec3 f=normalize(target-ro),r=normalize(cross(f,vec3(0.,1.,0.))),up=cross(r,f);
 vec3 rd=normalize(f*uLens+uv.x*r+uv.y*up),col=sky(rd);float travel=0.,glow=0.;vec2 hit=vec2(1.);
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
  else if(hit.y<7.5){float stage=hit.y-4.;float on=stage<.5?uLamps.x:stage<1.5?uLamps.y:stage<2.5?uLamps.z:uLamps.w;base=vec3(.01,.025,.026);vec3 hue=stage<.5?vec3(.03,.85,.78):stage<1.5?vec3(.34,.23,1.):stage<2.5?vec3(.9,.09,.5):vec3(1.,.61,.14);emit=hue*(.025+on*2.5);}
  else if(hit.y<8.5){base=vec3(.015,.18,.18);emit=vec3(.02,.70,.69)*(.25+uProgress*2.+uDrive.x*3.+uDrive.y);}
  else if(hit.y<9.5){float pulse=pow(max(0.,sin(p.z*5.-uTime*3.)),12.);base=vec3(.06,.13,.14);emit=vec3(.02,.55,.62)*pulse*(.14+uProgress+uDrive.x*2.+uDrive.y*1.5);}
  else if(hit.y<10.5){base=vec3(.03,.12,.14);emit=mix(vec3(.02,.24,.29),vec3(.64,.20,.48),.5+.5*sin(p.z*.34))* (.35+uProgress*.8);}
  else if(hit.y>12.5){base=vec3(.015,.04,.06);emit=mix(vec3(.02,.9,.8),vec3(.7,.15,1.),.5+.5*sin(p.y*12.+uTime))* (.3+uDrive.x*1.5+uBands.y);}
  else if(hit.y>11.5){base=vec3(.08,.28,.37);emit=mix(vec3(.06,.8,.85),vec3(.6,.10,.6),.5+.5*sin(p.x*7.+p.y*5.+uTime*.4))*(.4+uProgress*.8);}
  else{base=vec3(.014,.026,.031);vec2 cell=abs(fract(p.xz*.6)-.5);float grid=1.-smoothstep(.012,.025,min(cell.x,cell.y));emit=vec3(.01,.12,.14)*grid*.4;}
  float fres=pow(1.-max(0.,dot(n,-rd)),4.);float ao=clamp(map(p+n*.18).x/.18,.3,1.);
  col=base*(.19+diffuse*.85)*ao+spec*mix(vec3(.4),base,metal)*1.5+fres*vec3(.045,.12,.13)+emit;
  // Every lamp sends coloured standing waves across actual surface points.
  for(int k=0;k<4;k++){
   vec3 lamp=vec3(-.73+float(k)*.45,.04,-.875);lamp.xz=rot(.10)*lamp.xz;lamp+=vec3(0.,-.48,-.7);float a=float(k);float power=k==0?uLamps.x:k==1?uLamps.y:k==2?uLamps.z:uLamps.w;
   float radial=length(p-lamp),crest=exp(-pow(sin(radial*(10.+uBands.z*4.)-uTime*(2.+uBands.y)-a*.8)/(.10+uBands.x*.12),2.));
   vec3 hue=k==0?vec3(.02,.8,.7):k==1?vec3(.3,.14,1.):k==2?vec3(.9,.04,.4):vec3(1.,.57,.08);
   col+=hue*crest*exp(-radial*.75)*power*(.17+uDrive.x*.6);
  }
  col=mix(col,sky(rd),1.-exp(-travel*.034));
 }
 // Analytic lamp bloom in the same world coordinates; stopped by occluders.
 for(int k=0;k<4;k++){
  vec3 lamp=vec3(-.73+float(k)*.45,.04,-.875);lamp.xz=rot(.10)*lamp.xz;lamp+=vec3(0.,-.48,-.7);float depth=dot(lamp-ro,rd),v=step(0.,depth)*step(depth-.12,travel),dist=length(ro+rd*max(0.,depth)-lamp);
  float power=k==0?uLamps.x:k==1?uLamps.y:k==2?uLamps.z:uLamps.w;vec3 hue=k==0?vec3(.02,.8,.7):k==1?vec3(.3,.14,1.):k==2?vec3(.9,.04,.4):vec3(1.,.57,.08);
  col+=hue*pow(.008/(.008+dist*dist),1.4)*power*.35*v;
 }
 col+=vec3(.015,.65,.68)*glow*(.8+uBands.y*.5);
 // Broad travelling arcs through the throat. Low frequency, no white strobe.
 vec3 at=ro+rd*((3.8-ro.z)/max(.01,rd.z));vec2 gate=at.xy-vec2(0.,.95);
 float radius=length(gate),angle=atan(gate.y,gate.x);
 float breath=.018*sin(uTime*.8)+uBands.x*.12+uDrive.y*.025;
 float contour=radius-1.84-breath-(.025+uBands.y*.10)*sin(angle*6.+uTime*.5);
 float filament=exp(-pow(contour/(.022+uBands.z*.02),2.));
 float gateDepth=(3.8-ro.z)/max(.01,rd.z),visible=step(gateDepth-.12,travel)*step(0.,rd.z);
 col+=vec3(.08,.75,.72)*filament*(.22+uProgress+uDrive.x*2.)*visible;
 // The open throat is a standing-wave membrane, not an opaque portal disc.
 float inside=1.-smoothstep(1.72,1.96,radius);
 float radial=sin(radius*(13.+uBands.z*5.)-uTime*(.7+uBands.y*.7));
 float lobes=sin(angle*5.+uTime*.22+uBands.y*2.)*sin(angle*3.-radius*2.);
 float nodes=exp(-abs(radial*lobes)*14.);
 float front=exp(-pow(sin(radius*6.-uTime*.85)/( .08+uBands.x*.18),2.));
 float wake=.05+uProgress*.12+uDrive.x*.8+uDrive.y*.24;
 vec3 membrane=mix(vec3(.015,.30,.32),vec3(.38,.07,.31),.5+.5*lobes);
 col+=inside*visible*(membrane*nodes*wake+vec3(.06,.46,.50)*front*wake*.55);
 float bloom=pow(max(0.,1.-radius/1.9),4.)*(uProgress+uDrive.x);col+=vec3(.025,.13,.16)*bloom*visible;
 col*=2.5;col=col/(1.+col);col=pow(col,vec3(.85));col*=1.-.16*dot(uv,uv);
 gl_FragColor=vec4(col,1.);
}`;
export function mountBootWorld(canvas,{fps,focusLabel,viewButtons={},energy=()=>[0,0,0,0],level=()=>0,reduced=false}={}){
 let gl=null,program=null,raf=0,last=0,time=0,visible=false,paused=false,phase=0,progress=0;
 let pointer=[0,0],camera=bootCameraView(),focus='wide',candidate=null,candidateAt=0,pointerLast=[-1e4,-1e4],flight=null,flightAge=0,frames=0,stamp=0,read=false,pixelBudget=bootWorldBudget.pixels,slow=0,fast=0;
 let signal={bands:[0,0,0,0],level:0,ink:0},pendingInk=0;
 const metrics={frames:0,drawMs:0,fps:0,pixels:0,renderer:'unavailable'};
 try{
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)throw Error('WebGL unavailable');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,bootWorldFragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  metrics.renderer='webgl-sdf';canvas.dataset.renderer='webgl-sdf';canvas.dataset.shader='ready';
 }catch(error){canvas.dataset.shader='failed';canvas.dataset.error=error.message;canvas.setAttribute('aria-label','Signal Dock unavailable: '+error.message);if(fps)fps.textContent='TEXT / NO WEBGL';return {set(){},show(){},metrics};}
 const uniform=name=>gl.getUniformLocation(program,name),u={r:uniform('uRes'),p:uniform('uPointer'),t:uniform('uTime'),v:uniform('uProgress'),s:uniform('uPhase'),b:uniform('uBands'),d:uniform('uDrive'),eye:uniform('uEye'),look:uniform('uLook'),lens:uniform('uLens'),lamps:uniform('uLamps')};
 const bandBuffer=new Float32Array(4);
 function selectView(mode){if(mode!==focus){const entropy=new Uint32Array(1);crypto.getRandomValues(entropy);flight=bootCameraFlight(camera,mode,entropy[0]);flightAge=0;}focus=mode;candidate=null;canvas.dataset.focus=focus;if(focusLabel)focusLabel.textContent=mode==='wide'?'GHOSTLINK / POINT AT MODEM OR PORTAL':mode==='modem'?'PHASE MODEM / EDGE TO PULL BACK':'CARRIER APERTURE / EDGE TO PULL BACK';for(const [key,button]of Object.entries(viewButtons))button?.setAttribute('aria-pressed',String(key===mode));}
 for(const [mode,button]of Object.entries(viewButtons))button?.addEventListener('click',()=>selectView(mode));selectView('wide');
 function draw(now){
  raf=0;if(!visible||document.hidden)return;
  if(now-last>=1000/bootWorldBudget.fps-.1){
   const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now-((now-last)%(1000/bootWorldBudget.fps));if(!paused&&!reduced)time+=dt;
   const rect=canvas.getBoundingClientRect(),scale=Math.min(devicePixelRatio||1,1.25,Math.sqrt(pixelBudget/Math.max(1,rect.width*rect.height)));
   const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   signal=bootSignalEnvelope(signal,energy(),level(),pendingInk,dt,{held:paused,reduced});pendingInk=0;bandBuffer.set(signal.bands);
   if(candidate&&time-candidateAt>(candidate==='wide'?.65:.2))selectView(candidate);if(flight&&!paused){flightAge+=dt;camera=bootCameraAt(flight,flightAge,{reduced});}canvas.dataset.cameraTravel=flight?Math.min(1,flightAge/flight.duration).toFixed(3):'1';const lamps=bootLampSignals(progress,phase,signal,time);
   const begin=performance.now();gl.viewport(0,0,w,h);gl.useProgram(program);gl.uniform2f(u.r,w,h);gl.uniform2f(u.p,pointer[0],pointer[1]);gl.uniform1f(u.t,time);gl.uniform1f(u.v,progress);gl.uniform1f(u.s,phase);gl.uniform4fv(u.b,bandBuffer);gl.uniform2f(u.d,signal.level,signal.ink);gl.uniform3fv(u.eye,camera.eye);gl.uniform3fv(u.look,camera.look);gl.uniform1f(u.lens,camera.lens);gl.uniform4fv(u.lamps,lamps);gl.drawArrays(gl.TRIANGLES,0,6);
   metrics.frames++;metrics.drawMs=performance.now()-begin;metrics.pixels=w*h;canvas.dataset.drawMs=metrics.drawMs.toFixed(3);canvas.dataset.progress=progress.toFixed(3);canvas.dataset.frames=String(metrics.frames);
   if(!read){const pixels=new Uint8Array(4);gl.readPixels(w>>1,h>>1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);canvas.dataset.pixel=[...pixels].join(',');read=true;}
   frames++;if(now-stamp>=1000){metrics.fps=Math.round(frames*1000/(now-stamp));frames=0;stamp=now;if(fps)fps.textContent=metrics.fps+' FPS / SDF';
    // Cadence is observed wall time, not a fabricated GPU-duration estimate.
    slow=metrics.fps<24?slow+1:0;fast=metrics.fps>=29?fast+1:0;
    if(slow>=2){pixelBudget=Math.max(150000,Math.round(pixelBudget*.78));slow=0;}
    if(fast>=6){pixelBudget=Math.min(bootWorldBudget.pixels,Math.round(pixelBudget*1.08));fast=0;}
   }
   canvas.dataset.pixels=String(w*h);
   canvas.dataset.focus=focus;canvas.dataset.lens=camera.lens.toFixed(4);canvas.dataset.eye=camera.eye.map(x=>x.toFixed(4)).join(',');canvas.dataset.look=camera.look.map(x=>x.toFixed(4)).join(',');canvas.dataset.lamps=lamps.map(x=>x.toFixed(3)).join(',');
   canvas.dataset.audioDrive=signal.level.toFixed(3);canvas.dataset.inkDrive=signal.ink.toFixed(3);canvas.dataset.bands=signal.bands.map(x=>x.toFixed(3)).join(',');
  }
  raf=requestAnimationFrame(draw);
 }
 function show(value){visible=!!value;if(!visible){cancelAnimationFrame(raf);raf=0;}else if(!raf){last=performance.now();stamp=last;raf=requestAnimationFrame(draw);}}
 const input=canvas.closest('.cg-boot-field')||canvas.parentElement;
 input.addEventListener('pointermove',event=>{
  if(paused||reduced||event.pointerType==='touch')return;
  const r=canvas.getBoundingClientRect();if(Math.hypot(event.clientX-pointerLast[0],event.clientY-pointerLast[1])<4)return;
  pointerLast=[event.clientX,event.clientY];pointer=[Math.max(-1,Math.min(1,(event.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,1-(event.clientY-r.top)/r.height*2))];
  if(flight&&flightAge<flight.duration*.85)return;
  const next=bootHoverFocus(bootPick(pointer,camera,r.width/r.height),focus,pointer);
  if(next!==candidate){candidate=next;candidateAt=time;}
 });
 input.addEventListener('pointerleave',()=>{if(!paused&&!reduced){candidate='wide';candidateAt=time;}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(visible)show(true);});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();show(false);canvas.dataset.shader='lost';if(fps)fps.textContent='SDF CONTEXT LOST / RELOAD';});
 return {show,metrics,set(state){if(state.reset){camera=bootCameraView();focus='wide';flight=null;flightAge=0;selectView('wide');pointerLast=[-1e4,-1e4];}phase=state.phase??phase;progress=Math.max(0,Math.min(1,state.progress??progress));paused=!!state.paused;pendingInk=Math.max(pendingInk,state.ink||0);canvas.dataset.held=String(paused);}};
}
