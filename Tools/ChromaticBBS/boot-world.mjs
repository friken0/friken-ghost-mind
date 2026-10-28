import {mountAnsiTerminal} from './ansi-terminal.mjs';
import {craftShaderSource} from './vendor/sdf-craft/craft-shader.mjs';
import {requestMaterialAtlas,releaseMaterialOwner} from './vendor/sdf-craft/materials-client.mjs';
/* Signal Dock: a raymarched modem, carrier aperture and recursive relay field.
 * Presentation follows the connection clock; it has no game/RNG authority.
 * One bounded WebGL canvas. Hidden/reduced/paused scenes stop time; CPU draw
 * submission and visible FPS are measured separately from unmeasured GPU cost. */
export const bootWorldBudget={steps:76,fps:30,pixelRatio:'auto'};
// One layout anchor drives aperture geometry, light, focus and ray picking.
export const bootPortalCenter=Object.freeze([2.4,.95,3.8]);
export function bootRenderScale(requested='auto',{pixelRatio=1,apple=false}={}){
 const native=Number.isFinite(pixelRatio)&&pixelRatio>0?pixelRatio:1;
 if(requested==='native')return native;
 if(requested==='auto')return apple&&native>1?1:native;
 if(Number.isFinite(requested)&&requested>0)return requested;
 throw Error('Boot pixelRatio must be auto, native or a positive number');
}
// Audio envelopes follow the single mixer; terminal ink is a separate signal.
export function bootSignalEnvelope(previous,bands,rms,ink,dt,{held=false,reduced=false}={}){
 const zero={bands:[0,0,0,0],level:0,ink:0};if(reduced)return zero;
 if(held)return previous;
 const clamp=x=>Number.isFinite(x)?Math.max(0,Math.min(1,x)):0;
 const smooth=(old,next)=>old+(next-old)*(1-Math.exp(-Math.min(.1,Math.max(0,dt))*(next>old?24:5)));
 return {bands:Array.from({length:4},(_,i)=>smooth(previous.bands[i],clamp(bands?.[i]))),level:smooth(previous.level,clamp(rms*5)),ink:Math.max(clamp(ink),previous.ink*Math.exp(-Math.max(0,dt)*5))};
}
// Shared CPU camera math matches the shader basis and its vertical lens.
const bootViews={wide:{eye:[-4.8,1.85,-6.6],look:[-.9,.35,1.5],lens:1.25},modem:{eye:[2.,1.25,-3.7],look:[0.,-.22,-.7],lens:1.65},portal:{eye:[bootPortalCenter[0]+.8,1.3,-2.1],look:[bootPortalCenter[0],bootPortalCenter[1],bootPortalCenter[2]+.4],lens:1.15}};
// Frame the complete physical bezel, never just its center. Leave a bottom
// command band while keeping the screen normal perpendicular to the camera.
export function bootScreenView(aspect=1.6,height=900,{reply=false}={}){
 if(!Number.isFinite(aspect)||aspect<=0||!Number.isFinite(height)||height<=0)throw Error('Valid terminal viewport required');
 const distance=3.18,bottom=reply?0:Math.min(.35,150/height),heightShare=reply?.88:Math.min(.60,1-bottom-.14);
 const lens=Math.min(reply?1.3:.90,(reply?.94:.85)*distance*aspect/3.84,heightShare*distance/2.62);
 const lift=(bottom*.72+.045)*distance/(2*lens),y=.54-lift;
 return {eye:[-2.75,y,-2.65],look:[-2.75,y,.53],lens};
}
export function bootCameraView(mode='wide',{aspect=1.6,height=900,reply=false}={}){if(mode==='screen')return bootScreenView(aspect,height,{reply});const v=bootViews[mode];if(!v)throw Error('Unknown dock view');return {eye:[...v.eye],look:[...v.look],lens:v.lens*(mode==='wide'?Math.min(1,aspect/1.6):1)};}
// Each approach gets a bounded dolly arc and lens. Entropy is presentation-only.
export function bootCameraFlight(from,mode,seed=0,viewport){
 const to=bootCameraView(mode,viewport);let n=seed>>>0;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;},side=rand()*2-1;
 if(mode!=='wide'&&mode!=='screen'){to.eye[0]+=(rand()-.5)*(mode==='modem'?.5:.6);to.eye[1]+=(rand()-.5)*.3;to.eye[2]+=(rand()-.5)*.35;to.lens*=.95+rand()*.1;}
 const control=[.28,.78].map((t,i)=>from.eye.map((v,k)=>v+(to.eye[k]-v)*t+(k===0?side*(i?.35:.9):k===1?(i?.18:.42):0)));
 return {from:{eye:[...from.eye],look:[...from.look],lens:from.lens},to,control,duration:2.35+rand()*.65};
}
export function bootCameraAt(flight,age,{reduced=false}={}){
 const p=reduced?1:Math.max(0,Math.min(1,age/flight.duration));if(p<=0)return {eye:[...flight.from.eye],look:[...flight.from.look],lens:flight.from.lens};if(p>=1)return {eye:[...flight.to.eye],look:[...flight.to.look],lens:flight.to.lens};const t=p*p*(3-2*p),q=1-t;
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
// The analytic glass is drawn in front of the field shader, so its exact
// rectangle has the same first-hit priority here. Other device bounds are
// sorted by positive ray distance, never by an arbitrary object list order.
export function bootPick(pointer,camera,aspect){
 const b=bootBasis(camera),rd=vnorm(b.f.map((v,i)=>v*camera.lens+b.r[i]*pointer[0]*aspect*.5+b.up[i]*pointer[1]*.5)),ro=camera.eye;
 const screenT=(.53-ro[2])/rd[2];if(screenT>0&&Math.abs(ro[0]+rd[0]*screenT+2.75)<1.6&&Math.abs(ro[1]+rd[1]*screenT-.54)<1.0)return 'screen';
 function boxHit(lo,hi){let near=0,far=1e4;for(let i=0;i<3;i++){if(Math.abs(rd[i])<1e-8){if(ro[i]<lo[i]||ro[i]>hi[i])return Infinity;}else{const a=(lo[i]-ro[i])/rd[i],c=(hi[i]-ro[i])/rd[i];near=Math.max(near,Math.min(a,c));far=Math.min(far,Math.max(a,c));}}return far>=near&&far>0?Math.max(0,near):Infinity;}
 const hits=[{mode:'modem',depth:boxHit([-1.65,-1.02,-1.75],[1.65,.8,.2])},{mode:'screen',depth:boxHit([-4.67,-.81,.385],[-.83,1.81,1.26])}];
 const portalT=(bootPortalCenter[2]-ro[2])/rd[2];if(portalT>0&&Math.hypot(ro[0]+rd[0]*portalT-bootPortalCenter[0],ro[1]+rd[1]*portalT-bootPortalCenter[1])<2.8)hits.push({mode:'portal',depth:portalT});
 hits.sort((a,b)=>a.depth-b.depth);return Number.isFinite(hits[0].depth)?hits[0].mode:'wide';
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
uniform sampler2D uSkinAlbedo,uSkinMatrix;
uniform float uSkinReady;
uniform sampler2D uTerminal;
uniform float uTerminalReady;
${craftShaderSource}
const vec3 BOOT_PORTAL=vec3(${bootPortalCenter.join(',')});
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float rounded(vec3 p,vec3 b,float r){return box(p,b)-r;}
float torus(vec3 p,vec2 t){return length(vec2(length(p.xy)-t.x,p.z))-t.y;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec2 join(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec2 map(vec3 p){
 // Brushed metal modem with a vented face and armoured corners.
 vec3 m=p-vec3(0.,-.48,-.7);m.xz=rot(-.10)*m.xz;
 float hull=rounded(m,vec3(1.38,.24,.68),.11);
 float hatch=rounded(m-vec3(0.,.26,.02),vec3(.82,.105,.39),.035);
 hull=max(hull,-hatch);
 vec2 d=vec2(hull,1.);
 d=join(d,vec2(rounded(m-vec3(0.,.20,.02),vec3(.73,.018,.31),.018),2.));
 float panel=rounded(m-vec3(0.,.04,-.81),vec3(1.12,.135,.035),.025);
 d=join(d,vec2(panel,2.));
 vec3 q=m-vec3(0.,.35,0.);q.x=mod(q.x+.08,.16)-.08;
 float vent=box(q,vec3(.026,.085,.43));
 if(abs(m.x)<1.12)d.x=max(d.x,-vent);
 vec3 a=m-vec3(1.13,.45,.25);a.x=abs(m.x)-1.13;
 float mast=CraftCurveTube(a.x,a.z,a.y,.35,.045,.018,.043,.026);
 d=join(d,vec2(mast,3.));
 vec3 foot=m;foot.x=abs(foot.x)-1.10;foot.z=abs(foot.z)-.48;
 d=join(d,vec2(rounded(foot-vec3(0.,-.33,0.),vec3(.14,.09,.13),.04),1.));
 // GHOSTLINK phase modem: suspended octahedral core and three carrier coils.
 vec3 core=m-vec3(0.,.69,.02);core.xz=rot(uTime*.16)*core.xz;
 float pulseScale=1.+uBands.x*.10;
 float crystal=CraftEval(40.,core.x,core.y,core.z,.30*pulseScale,.33*pulseScale,.30*pulseScale,.72,.46);
 d=join(d,vec2(crystal,13.));
 for(int k=0;k<3;k++){vec3 coil=m-vec3(0.,.42+float(k)*.17,.02);coil.xz=rot(float(k)*.7)*coil.xz;coil.y+=.03*sin(CraftAngle(coil.z,coil.x)*6.+uTime*.7)*uBands.y;d=join(d,vec2(torus(coil.xzy,vec2(.42+float(k)*.07,.023)),14.));}
 vec3 bolt=m;bolt.x=abs(m.x)-1.24;bolt.z=abs(m.z)-.55;bolt.y-=.23;d=join(d,vec2(length(bolt)-.07,3.));
 vec3 armour=m;armour.x=abs(m.x)-1.35;armour.y-=.02;
 float cheek=max(rounded(armour,vec3(.14,.27,.57),.045),abs(armour.z)+armour.y*.35-.59);d=join(d,vec2(cheek,1.));
 vec3 gasket=m-vec3(0.,.13,0.);float seam=max(rounded(gasket,vec3(1.47,.012,.77),.05),-rounded(gasket,vec3(1.34,.08,.64),.03));d=join(d,vec2(seam,15.));
 // Four glass indicators, each gains a handshake stage rather than a fake RNG.
 for(int i=0;i<4;i++){
  vec3 led=m-vec3(-.73+float(i)*.45,.04,-.875);
  d=join(d,vec2(rounded(led,vec3(.12,.045,.026),.02),4.+float(i)));
 }
 // SDF terminal: recessed glass, split bezel, service slots and seated stand.
 vec3 monitor=p-vec3(-2.75,.50,.85);
 float housing=rounded(monitor,vec3(1.83,1.22,.32),.09);
 housing=max(housing,-rounded(monitor-vec3(0.,.04,-.31),vec3(1.65,1.04,.24),.07));
 d=join(d,vec2(housing,16.));
 float rim=max(rounded(monitor-vec3(0.,.04,-.37),vec3(1.72,1.10,.04),.055),-rounded(monitor-vec3(0.,.04,-.37),vec3(1.62,1.0,.09),.045));
 d=join(d,vec2(rim,3.));
 vec3 fins=monitor;fins.x=abs(fins.x)-1.77;fins.y=mod(fins.y+.045,.09)-.045;
 if(abs(monitor.y)<.82&&monitor.z>-.12)d.x=max(d.x,-box(fins,vec3(.12,.018,.27)));
 d=join(d,vec2(rounded(monitor-vec3(0.,-1.35,.08),vec3(.24,.24,.16),.04),16.));
 d=join(d,vec2(rounded(monitor-vec3(0.,-1.50,-.02),vec3(.75,.065,.47),.035),16.));
 vec3 screw=monitor-vec3(0.,0.,-.37);screw.xy=abs(screw.xy)-vec2(1.74,1.13);
 d=join(d,vec2(length(screw)-.035,3.));
 // Concentric mechanical aperture: brass ribs around a cyan carrier throat.
 vec3 r=p-BOOT_PORTAL;
 d=join(d,vec2(torus(r,vec2(2.30,.12)),3.));
 d=join(d,vec2(torus(r,vec2(2.56,.055)),1.));
 vec3 living=r;living.xy*=1.-.045*uBands.x;
 d=join(d,vec2(torus(living,vec2(2.02,.033+.018*uDrive.x)),8.));
 float ang=CraftAngle(r.y,r.x);vec3 ribs=r;
 float sector=floor(ang/.52359878+.5)*.52359878;ribs.xy=rot(sector)*ribs.xy;
 vec3 bearing=ribs-vec3(2.30,0.,0.);
 d=join(d,vec2(CraftEval(35.,bearing.x,bearing.y,bearing.z,.27,.18,.22,.5,.4),3.));
 // Keyed collars and the root bus share the nearest angular sector.
 vec3 collar=ribs-vec3(2.52,0.,0.);
 float keyed=rounded(collar,vec3(.12,.065,.085),.02);
 keyed=max(keyed,-box(collar,vec3(.15,.025,.045)));d=join(d,vec2(keyed,2.));
 // Physical data conduit climbs from the modem into the aperture.
 vec3 cable=p-vec3(0.,-.48,0.);float route=clamp((cable.z+.7)/4.5,0.,1.);route=route*route*(3.-2.*route);
 float pathX=.82*sin(cable.z*.80)*(1.-route)+BOOT_PORTAL.x*route;
 // The lateral route has |dx/dz|<1.73;2.25 conservatively bounds its
 // combined spatial gradient, preserving safe march distances.
 float conduit=(length(vec2(cable.x-pathX,cable.y+.18-.14*sin(cable.z*.7)))-.055)/2.25;
 conduit=max(conduit,abs(cable.z-1.55)-2.45);d=join(d,vec2(conduit,9.));
 // Distant folded relays: geometry, not a painted tunnel.
 if(p.z>5.){
  vec3 seed=(p-BOOT_PORTAL-vec3(0.,0.,1.9))/(1.+uDrive.x*.20+uDrive.y*.08);seed.xy=rot(uTime*.12)*seed.xy;seed.yz=rot(.6+uTime*.09)*seed.yz;
  float gem=(dot(abs(seed),vec3(1.))-.44)*.57735;
  for(int k=0;k<4;k++){vec3 knot=seed;knot.xy=rot(float(k)*.7854+uTime*.07)*knot.xy;knot.yz=rot(float(k)*.64)*knot.yz;gem=min(gem,torus(knot,vec2(.56+float(k)*.075,.022)));}
  d=join(d,vec2(gem,12.));
  vec3 c=p-BOOT_PORTAL-vec3(0.,0.,.2);float z=floor(c.z/3.6);c.z=mod(c.z,3.6)-1.8;c.xy=rot(z*.28+uProgress*.1)*c.xy;
  float frame=max(abs(length(c.xy)-max(2.5,4.8-z*.08))-.055,abs(c.z)-.055);
  d=join(d,vec2(frame,10.));
 }
 d=join(d,vec2(p.y+1.04,11.));return d;
}
vec2 bootSkinUv(vec2 uv,float tile){vec2 cell=vec2(mod(tile,4.),floor(tile/4.));return (cell+vec2(1./128.)+fract(uv*2.5)*(1.-2./128.))/vec2(4.,2.);}
void bootSkin(vec3 p,vec3 n,float id,out vec3 base,out vec4 matrix){
 vec3 q=p,nn=n;
 if(id<7.5){q=p-vec3(0.,-.48,-.7);q.xz=rot(-.10)*q.xz;nn.xz=rot(-.10)*nn.xz;}
 else if(id<9.0){q=p-BOOT_PORTAL;}
 float role=id<1.5?(abs(q.x)>1.07?1.:0.):id<2.5?2.:id<3.5?1.:id<8.5?3.:2.;
 if(role<1.5&&abs(mod(q.z+q.x*.24+.12,.48)-.24)<.012)role=3.;
 float bank=step(.5,fract(q.y*.65+q.z*.31));float tile=role+bank*4.;
 vec3 a=abs(nn);vec2 uv=a.x>a.y&&a.x>a.z?q.zy:a.y>a.z?q.xz:q.xy;
 vec2 tex=bootSkinUv(uv,tile);vec4 alb=texture2D(uSkinAlbedo,tex);matrix=texture2D(uSkinMatrix,tex);
 base=pow(max(alb.rgb,vec3(0.)),vec3(2.2));
}
vec3 normal(vec3 p){vec2 e=vec2(.0015,-.0015);return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}
vec3 sky(vec3 rd){
 vec3 col=vec3(.014,.025,.043)+vec3(.014,.06,.075)*pow(max(0.,1.-abs(rd.y)),4.);
 vec3 stars=floor(rd*260.);float s=hash(stars);col+=vec3(.8,.9,1.)*step(.995,s)*exp(-dot(fract(rd*260.)-.5,fract(rd*260.)-.5)*70.);vec3 fold=rd*2.;float filaments=0.;for(int i=0;i<4;i++){fold=abs(fold)/max(dot(fold,fold),.25)-.72;filaments+=exp(-abs(fold.x)*9.)*.25;}col+=vec3(.018,.055,.065)*filaments;
 float throat=pow(max(0.,dot(rd,normalize(vec3(0.,.04,1.)))),30.);return col+vec3(.015,.09,.10)*throat;
}
vec3 terminalGlass(vec2 tex){
 vec3 ink=texture2D(uTerminal,vec2(1.-tex.x,tex.y)).rgb;
 float edge=pow(1.-max(abs(tex.x-.5),abs(tex.y-.5))*1.25,.3);
 return ink*edge+vec3(.002,.005,.009);
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
 vec3 ro=uEye;
 vec3 target=uLook;vec3 f=normalize(target-ro),r=normalize(cross(f,vec3(0.,1.,0.))),up=cross(r,f);
 vec3 rd=normalize(f*uLens+uv.x*r+uv.y*up),col=sky(rd);float travel=0.,glow=0.;vec2 hit=vec2(1.);
 // The screen is an analytic world plane inside the SDF bezel. Its direct
 // emission bypasses marching/tonemapping so 80 columns stay pixel-legible.
 float screenDepth=(.53-ro.z)/rd.z;
 vec3 screenPoint=ro+rd*screenDepth-vec3(-2.75,.54,.53);
 if(rd.z>0.&&screenDepth>0.&&screenPoint.x> -1.6&&screenPoint.x<1.6&&abs(screenPoint.y)<1.0&&uTerminalReady>.5){
  vec2 tex=vec2(screenPoint.x/3.2+.5,.5-screenPoint.y/2.);
  gl_FragColor=vec4(terminalGlass(tex),1.);return;
 }

 for(int i=0;i<76;i++){
  vec3 p=ro+rd*travel;hit=map(p);
  vec3 g=p-BOOT_PORTAL;float ring=abs(length(g.xy)-(1.98+uProgress*.05))+abs(g.z)*.6;
  glow+=.0014/(.02+ring*ring)*(.25+uProgress*.75);
  if(hit.x<.0015||travel>34.)break;travel+=max(.006,hit.x*.78);
 }
 if(travel<34.&&hit.x<.01){
  vec3 p=ro+rd*travel,n=normal(p),light=normalize(vec3(-3.,5.,-4.));
  float diffuse=max(dot(n,light),0.),spec=pow(max(dot(reflect(-light,n),-rd),0.),48.);
  float grain=hash(floor(p*220.));vec3 base=vec3(.075,.10,.11);float metal=.6;vec3 emit=vec3(0.);
  if(hit.y>15.5){base=vec3(.08,.11,.14);metal=.8;}
  else if(hit.y<1.5)base=vec3(.13,.17,.18)*( .76+grain*.24);
  else if(hit.y<2.5){base=vec3(.008,.023,.027);metal=.8;}
  else if(hit.y<3.5){base=vec3(.38,.25,.10)*(.72+grain*.28);metal=.9;}
  else if(hit.y<7.5){float stage=hit.y-4.;float on=stage<.5?uLamps.x:stage<1.5?uLamps.y:stage<2.5?uLamps.z:uLamps.w;base=vec3(.01,.025,.026);vec3 hue=stage<.5?vec3(.03,.85,.78):stage<1.5?vec3(.34,.23,1.):stage<2.5?vec3(.9,.09,.5):vec3(1.,.61,.14);emit=hue*(.025+on*2.5);}
  else if(hit.y<8.5){base=vec3(.015,.18,.18);emit=vec3(.02,.70,.69)*(.25+uProgress*2.+uDrive.x*3.+uDrive.y);}
  else if(hit.y<9.5){float pulse=pow(max(0.,sin(p.z*5.-uTime*3.)),12.);base=vec3(.06,.13,.14);emit=vec3(.02,.55,.62)*pulse*(.14+uProgress+uDrive.x*2.+uDrive.y*1.5);}
  else if(hit.y<10.5){base=vec3(.03,.12,.14);emit=mix(vec3(.02,.24,.29),vec3(.64,.20,.48),.5+.5*sin(p.z*.34))* (.35+uProgress*.8);}
  else if(hit.y>12.5){base=vec3(.015,.04,.06);emit=mix(vec3(.02,.9,.8),vec3(.7,.15,1.),.5+.5*sin(p.y*12.+uTime))* (.3+uDrive.x*1.5+uBands.y);}
  else if(hit.y>11.5){base=vec3(.08,.28,.37);emit=mix(vec3(.06,.8,.85),vec3(.6,.10,.6),.5+.5*sin(p.x*7.+p.y*5.+uTime*.4))*(.4+uProgress*.8);}
  else{base=vec3(.014,.026,.031);vec2 cell=abs(fract(p.xz*.6)-.5);float grid=1.-smoothstep(.012,.025,min(cell.x,cell.y));emit=vec3(.01,.12,.14)*grid*.4;}
  if(uSkinReady>.5&&(hit.y<3.5||(hit.y>8.5&&hit.y<9.5)||hit.y>14.5)){
   vec3 skin;vec4 matrix;bootSkin(p,n,hit.y,skin,matrix);
   float luminance=dot(skin,vec3(.2126,.7152,.0722));
   skin=mix(vec3(luminance),skin,.20);
   base=mix(base,skin,.22)*clamp(.88+luminance*.30,.88,1.08);metal=matrix.g;
   spec=pow(max(dot(reflect(-light,n),-rd),0.),mix(110.,8.,clamp(matrix.b,.1,.96)));
   emit+=vec3(.04,.40,.42)*matrix.r*(.05+uBands.x*.12+uDrive.y*.08);
  }
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
 vec3 at=ro+rd*((BOOT_PORTAL.z-ro.z)/max(.01,rd.z));vec2 gate=at.xy-BOOT_PORTAL.xy;
 float radius=length(gate),angle=CraftAngle(gate.y,gate.x);
 float breath=.018*sin(uTime*.8)+uBands.x*.12+uDrive.y*.025;
 float contour=radius-1.84-breath-(.025+uBands.y*.10)*sin(angle*6.+uTime*.5);
 float filament=exp(-pow(contour/(.022+uBands.z*.02),2.));
 float gateDepth=(BOOT_PORTAL.z-ro.z)/max(.01,rd.z),visible=step(gateDepth-.12,travel)*step(0.,rd.z);
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
const bootGlassFragment=`precision highp float;
uniform vec2 uRes;uniform vec3 uEye,uLook;uniform float uLens;uniform sampler2D uTerminal,uBackground;
void main(){vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;vec3 f=normalize(uLook-uEye),r=normalize(cross(f,vec3(0.,1.,0.))),up=cross(r,f),rd=normalize(f*uLens+uv.x*r+uv.y*up);float depth=(.53-uEye.z)/rd.z;vec3 p=uEye+rd*depth-vec3(-2.75,.54,.53);vec3 col=texture2D(uBackground,gl_FragCoord.xy/uRes).rgb;
 if(rd.z>0.&&depth>0.&&abs(p.x)<1.6&&abs(p.y)<1.){vec2 tex=vec2(.5-p.x/3.2,.5-p.y/2.);col=texture2D(uTerminal,tex).rgb*pow(1.-max(abs(tex.x-.5),abs(tex.y-.5))*1.25,.3)+vec3(.002,.005,.009);}gl_FragColor=vec4(col,1.);}`;
export function mountBootWorld(canvas,{fps,focusLabel,viewButtons={},energy=()=>[0,0,0,0],level=()=>0,reduced=false,pixelRatio='auto',terminal:terminalOptions={}}={}){
 let gl=null,program=null,glassProgram=null,backgroundTexture=null,backgroundFramebuffer=null,backgroundSize=[0,0],screenCache=false,skinTextures=[],skinReady=false,terminalTexture=null,terminalRevision=-1,externalDisplay=null,externalRevision=0,terminalReply=false,destroyed=false,vertexBuffer=null,shaderObjects=[],raf=0,last=0,time=0,visible=false,paused=false,phase=0,progress=0;
 let pointer=[0,0],camera=bootCameraView('wide',{aspect:canvas.getBoundingClientRect().width/Math.max(1,canvas.getBoundingClientRect().height)}),focus='wide',candidate=null,candidateAt=0,pointerLast=[-1e4,-1e4],flight=null,flightAge=0,frames=0,stamp=0,read=false;
 let signal={bands:[0,0,0,0],level:0,ink:0},pendingInk=0;
 const terminal=mountAnsiTerminal(terminalOptions);let terminalElapsed=0,terminalManual=false,terminalComplete=false;
 const metrics={frames:0,drawMs:0,fps:0,pixels:0,renderer:'unavailable'};
 try{
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)throw Error('WebGL unavailable');
  const shader=(type,source)=>{const s=gl.createShader(type);shaderObjects.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,bootWorldFragment));gl.bindAttribLocation(program,0,'a');gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  glassProgram=gl.createProgram();gl.attachShader(glassProgram,shader(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(glassProgram,shader(gl.FRAGMENT_SHADER,bootGlassFragment));gl.bindAttribLocation(glassProgram,0,'a');gl.linkProgram(glassProgram);if(!gl.getProgramParameter(glassProgram,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(glassProgram));
  gl.useProgram(program);const buffer=vertexBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  metrics.renderer='webgl-sdf';canvas.dataset.renderer='webgl-sdf';canvas.dataset.shader='ready';
 }catch(error){canvas.dataset.shader='failed';canvas.dataset.error=error.message;canvas.setAttribute('aria-label','Signal Dock unavailable: '+error.message);if(fps)fps.textContent='TEXT / NO WEBGL';return {set(){},show(){},focus(){},destroy(){},terminal,metrics};}
 const uniform=name=>gl.getUniformLocation(program,name),u={r:uniform('uRes'),p:uniform('uPointer'),t:uniform('uTime'),v:uniform('uProgress'),s:uniform('uPhase'),b:uniform('uBands'),d:uniform('uDrive'),eye:uniform('uEye'),look:uniform('uLook'),lens:uniform('uLens'),lamps:uniform('uLamps'),skinA:uniform('uSkinAlbedo'),skinM:uniform('uSkinMatrix'),skinReady:uniform('uSkinReady'),terminal:uniform('uTerminal'),terminalReady:uniform('uTerminalReady')};
 // A single admitted Human material bake; no per-frame texture generation.
 const skinOwner={};
 for(let unit=0;unit<2;unit++){
  const tex=gl.createTexture();skinTextures.push(tex);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([80,95,100,128]));
 }
 canvas.dataset.materialStatus='loading';
 requestMaterialAtlas(skinOwner,{race:'human',seed:596564,scale:2.5}).then(({baked})=>{
  if(destroyed)return;
  for(let unit=0;unit<2;unit++){
   gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,skinTextures[unit]);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,baked.width,baked.height,0,gl.RGBA,gl.UNSIGNED_BYTE,unit?baked.matrix:baked.albedo);
  }
  skinReady=true;screenCache=false;canvas.dataset.materialStatus='ready';canvas.dataset.materialPages='8';
  releaseMaterialOwner(skinOwner);if(visible&&!raf)show(true);
 }).catch(error=>{releaseMaterialOwner(skinOwner);canvas.dataset.materialStatus='failed';canvas.dataset.materialError=error.message;});
 terminalTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,terminalTexture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 backgroundTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,backgroundTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 backgroundFramebuffer=gl.createFramebuffer();
 const glassU=Object.fromEntries(['uRes','uEye','uLook','uLens','uTerminal','uBackground'].map(name=>[name,gl.getUniformLocation(glassProgram,name)]));
 const bandBuffer=new Float32Array(4),lifecycle=new AbortController(),listen={signal:lifecycle.signal};
 function selectView(mode,{reply}={}){const layoutChanged=reply!==undefined&&terminalReply!==reply;if(reply!==undefined)terminalReply=!!reply;if(mode!==focus||layoutChanged){screenCache=false;const entropy=new Uint32Array(1);crypto.getRandomValues(entropy);const rect=canvas.getBoundingClientRect();flight=bootCameraFlight(camera,mode,entropy[0],{aspect:rect.width/Math.max(1,rect.height),height:Math.max(1,rect.height),reply:terminalReply});flightAge=0;}focus=mode;candidate=null;canvas.dataset.focus=focus;if(focusLabel)focusLabel.textContent=mode==='wide'?'GHOSTLINK / MODEM · ANSI SCREEN · PORTAL':mode==='modem'?'PHASE MODEM / EDGE TO PULL BACK':mode==='screen'?'ANSI / 80 COLUMNS / 2400 BPS / EDGE TO PULL BACK':'CARRIER APERTURE / EDGE TO PULL BACK';for(const [key,button]of Object.entries(viewButtons))button?.setAttribute('aria-pressed',String(key===mode));if(visible&&!raf)show(true);}
 for(const [mode,button]of Object.entries(viewButtons))button?.addEventListener('click',()=>selectView(mode),listen);selectView('wide');
 function draw(now){
  raf=0;if(destroyed||!visible||document.hidden)return;
  if(now-last>=1000/bootWorldBudget.fps-.1){
   const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now-((now-last)%(1000/bootWorldBudget.fps));if(!paused&&!reduced)time+=dt;
   const rect=canvas.getBoundingClientRect(),scale=bootRenderScale(pixelRatio,{pixelRatio:devicePixelRatio||1,apple:/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent||'')});canvas.dataset.renderScale=String(scale);
   const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;screenCache=false;}
   signal=bootSignalEnvelope(signal,energy(),level(),pendingInk,dt,{held:paused,reduced});pendingInk=0;bandBuffer.set(signal.bands);
   if(!terminalManual)terminalElapsed=progress*terminal.duration;const terminalChanged=terminal.update(terminalElapsed,{reveal:terminalComplete||terminal.mode!=='receiving',time,reducedMotion:reduced});if(terminalChanged&&terminalElapsed>0&&!terminal.complete)pendingInk=Math.max(pendingInk,.65);
   if(terminalRevision!==(externalDisplay?externalRevision:terminal.revision)){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,terminalTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,externalDisplay||terminal.canvas);terminalRevision=externalDisplay?externalRevision:terminal.revision;}
   if(candidate&&time-candidateAt>(candidate==='wide'?.65:.2))selectView(candidate);if(flight&&!paused){flightAge+=dt;camera=bootCameraAt(flight,flightAge,{reduced});}if(focus==='wide'&&(!flight||flightAge>=flight.duration))camera=bootCameraView('wide',{aspect:rect.width/Math.max(1,rect.height)});if(!flight||flightAge>=flight.duration){if(focus==='screen')camera=bootScreenView(rect.width/Math.max(1,rect.height),Math.max(1,rect.height),{reply:terminalReply});else if(focus==='wide')camera=bootCameraView('wide',{aspect:rect.width/Math.max(1,rect.height),height:Math.max(1,rect.height)});}canvas.dataset.cameraTravel=flight?Math.min(1,flightAge/flight.duration).toFixed(3):'1';const lamps=bootLampSignals(progress,phase,signal,time);
   const begin=performance.now();gl.viewport(0,0,w,h);const heldScreen=focus==='screen'&&(!flight||flightAge>=flight.duration);
   const drawGlass=()=>{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(glassProgram);gl.uniform2f(glassU.uRes,w,h);gl.uniform3fv(glassU.uEye,camera.eye);gl.uniform3fv(glassU.uLook,camera.look);gl.uniform1f(glassU.uLens,camera.lens);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,terminalTexture);gl.uniform1i(glassU.uTerminal,2);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,backgroundTexture);gl.uniform1i(glassU.uBackground,3);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.renderMode='native-cached-bezel-live-glass';};
   if(heldScreen&&screenCache)drawGlass();
   else{
    // Render the retained bezel directly into an RGBA target. Copying the
    // opaque default framebuffer into RGBA is not portable across drivers.
    // The texture is never sampled while its framebuffer is bound.
    if(heldScreen){
     gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,backgroundTexture);
     if(backgroundSize[0]!==w||backgroundSize[1]!==h){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);backgroundSize=[w,h];}
     gl.bindFramebuffer(gl.FRAMEBUFFER,backgroundFramebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,backgroundTexture,0);
     const status=gl.checkFramebufferStatus(gl.FRAMEBUFFER);canvas.dataset.bezelFramebuffer=String(status);
     if(status!==gl.FRAMEBUFFER_COMPLETE)throw Error('Native bezel framebuffer incomplete: '+status);
    }else gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.useProgram(program);gl.uniform2f(u.r,w,h);gl.uniform2f(u.p,pointer[0],pointer[1]);gl.uniform1f(u.t,time);gl.uniform1f(u.v,progress);gl.uniform1f(u.s,phase);gl.uniform4fv(u.b,bandBuffer);gl.uniform2f(u.d,signal.level,signal.ink);gl.uniform3fv(u.eye,camera.eye);gl.uniform3fv(u.look,camera.look);gl.uniform1f(u.lens,camera.lens);gl.uniform4fv(u.lamps,lamps);
    for(let unit=0;unit<2;unit++){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,skinTextures[unit]);}
    gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,terminalTexture);gl.uniform1i(u.terminal,2);gl.uniform1f(u.terminalReady,1);gl.uniform1i(u.skinA,0);gl.uniform1i(u.skinM,1);gl.uniform1f(u.skinReady,skinReady?1:0);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.renderMode='native-sdf';
    if(heldScreen){screenCache=true;drawGlass();}
   }
   metrics.frames++;metrics.drawMs=performance.now()-begin;metrics.pixels=w*h;canvas.dataset.drawMs=metrics.drawMs.toFixed(3);canvas.dataset.progress=progress.toFixed(3);canvas.dataset.frames=String(metrics.frames);
   if(!read){const pixels=new Uint8Array(4);gl.readPixels(w>>1,h>>1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);canvas.dataset.pixel=[...pixels].join(',');read=true;}
   frames++;if(now-stamp>=1000){metrics.fps=Math.round(frames*1000/(now-stamp));frames=0;stamp=now;if(fps)fps.textContent=metrics.fps+' FPS / SDF';
    // Cadence counts actual native draws; screen focus caches its static bezel.
   }
   canvas.dataset.pixels=String(w*h);canvas.dataset.ansiBytes=terminal.canvas.dataset.serialBytes;canvas.dataset.ansiComplete=String(terminal.complete);canvas.dataset.ansiColumns='80';canvas.dataset.ansiPaintMs=terminal.canvas.dataset.paintMs;canvas.dataset.ansiChangedCells=terminal.canvas.dataset.changedCells;
   canvas.dataset.focus=focus;canvas.dataset.lens=camera.lens.toFixed(4);canvas.dataset.eye=camera.eye.map(x=>x.toFixed(4)).join(',');canvas.dataset.look=camera.look.map(x=>x.toFixed(4)).join(',');canvas.dataset.lamps=lamps.map(x=>x.toFixed(3)).join(',');
   canvas.dataset.audioDrive=signal.level.toFixed(3);canvas.dataset.inkDrive=signal.ink.toFixed(3);canvas.dataset.bands=signal.bands.map(x=>x.toFixed(3)).join(',');
  }
  if(!terminalReply||flight&&flightAge<flight.duration)raf=requestAnimationFrame(draw);
 }
 function show(value){if(destroyed)return;visible=!!value;if(!visible){cancelAnimationFrame(raf);raf=0;}else if(!raf){last=performance.now();stamp=last;raf=requestAnimationFrame(draw);}}
 // Camera focus is selected by explicit press. Pointer motion never flies
 // away from a control; the host uses pick() with its shared press binding.
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(visible)show(true);},listen);
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();show(false);releaseMaterialOwner(skinOwner);canvas.dataset.shader='lost';if(fps)fps.textContent='SDF CONTEXT LOST / RELOAD';},listen);
 function screenRect(){const rect=canvas.getBoundingClientRect(),aspect=rect.width/Math.max(1,rect.height),corners=[[-4.35,1.54,.53],[-1.15,-.46,.53]].map(point=>bootProject(point,camera,aspect)),left=Math.min(...corners.map(p=>(p[0]+1)*.5*rect.width)),top=Math.min(...corners.map(p=>(1-p[1])*.5*rect.height)),width=Math.abs(corners[0][0]-corners[1][0])*.5*rect.width,height=Math.abs(corners[0][1]-corners[1][1])*.5*rect.height;return {x:left,y:top,left:rect.left+left,top:rect.top+top,width,height,right:rect.left+left+width,bottom:rect.top+top+height};}
 function screenCell(clientX,clientY){const rect=canvas.getBoundingClientRect(),aspect=rect.width/Math.max(1,rect.height),pointer=[(clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2],basis=bootBasis(camera),ray=vnorm(basis.f.map((v,i)=>v*camera.lens+basis.r[i]*pointer[0]*aspect*.5+basis.up[i]*pointer[1]*.5)),depth=(.53-camera.eye[2])/ray[2];if(depth<=0||ray[2]<=0)return null;const point=camera.eye.map((v,i)=>v+ray[i]*depth),u=.5-(point[0]+2.75)/3.2,v=.5-(point[1]-.54)/2.;if(u<0||u>=1||v<0||v>=1)return null;const column=Math.floor(u*80),row=Math.floor(v*25),hotspot=terminal.hotspots.find(h=>column>=h.column&&column<h.column+h.width&&row>=h.row&&row<h.row+h.height);return {u,v,column,row,hotspot:hotspot?.id||null};}
 return {show,metrics,terminal,focus:selectView,screenRect,screenCell,pick(clientX,clientY){const rect=canvas.getBoundingClientRect();return bootPick([(clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2],camera,rect.width/Math.max(1,rect.height));},setDisplay(source,revision=performance.now()){externalDisplay=source;externalRevision=revision;terminalRevision=-1;if(visible&&!raf)show(true);},freeze(){terminalReply=true;if(visible&&!raf)show(true);},resume(){terminalReply=false;if(visible&&!raf)show(true);},destroy(){if(destroyed)return;show(false);destroyed=true;lifecycle.abort();releaseMaterialOwner(skinOwner);for(const tex of skinTextures)gl.deleteTexture(tex);gl.deleteTexture(terminalTexture);gl.deleteTexture(backgroundTexture);gl.deleteFramebuffer(backgroundFramebuffer);gl.deleteProgram(glassProgram);gl.deleteBuffer(vertexBuffer);for(const shader of shaderObjects)gl.deleteShader(shader);gl.deleteProgram(program);},set(state){if(state.terminalReply!==undefined)terminalReply=!!state.terminalReply;if(state.terminalMode){if(terminal.mode!==state.terminalMode){terminalElapsed=0;terminalComplete=state.terminalMode!=='receiving';}terminal.setMode(state.terminalMode,state.terminalControls||{});}else if(state.terminalControls)terminal.setControls(state.terminalControls);if(state.terminalFocus!==undefined)terminal.setFocus(state.terminalFocus);if(state.terminalReset){terminal.reset();terminalElapsed=0;terminalComplete=false;}if(state.terminalElapsed!==undefined){terminalManual=true;terminalElapsed=Math.max(0,state.terminalElapsed);}if(state.terminalComplete!==undefined)terminalComplete=!!state.terminalComplete;if(state.focus)selectView(state.focus);if(state.reset){screenCache=false;camera=bootCameraView();focus='wide';flight=null;flightAge=0;selectView('wide');pointerLast=[-1e4,-1e4];}phase=state.phase??phase;progress=Math.max(0,Math.min(1,state.progress??progress));if(state.paused!==undefined)paused=!!state.paused;pendingInk=Math.max(pendingInk,state.ink||0);canvas.dataset.held=String(paused);if(visible&&!raf)show(true);}};
}
