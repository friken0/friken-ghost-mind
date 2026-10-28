import {portraitCamera} from '../InfiniEngineSite/ghost-renderer.js';
/* GhostDream XIII / The Reply. Completed v20 carrier art; identity authority stays in its manifest.
 * Six-pass face for the existing GhostPortrait renderer. No loop,
 * analyser, permission signal or game state lives here. Voice uniforms arrive
 * from the carrier's actual Ghost bus; silent anatomy does not need audio. */
const common = `precision highp float;
varying vec2 v_uv;
uniform float u_time,u_frameScale,u_serpentTime;
uniform float u_voiceBass,u_voiceMid,u_voiceAir,u_voiceAttack,u_voiceEnergy,u_voiceBoundary;
uniform vec4 u_cymatics;
const vec3 CYAN=vec3(.12,.88,1.);
const vec3 GOLD=vec3(1.,.66,.20);
const vec3 BLUE=vec3(.07,.15,.24);
const vec3 COBALT=vec3(.035,.25,1.);
const vec3 EMBER=vec3(1.,.105,.012);
float line(float d,float w){return exp(-abs(d)/w);}
`;

// Frame-only algebra shared by every fragment and every field sample. The
// renderer prepares these once; all spatial SDF/normal work stays in GLSL.
export function dreamFrameUniforms(state){
 const v=(key,fallback=0)=>Number.isFinite(state[key])?state[key]:fallback;
 const {eye,forward,right,up,distance,roll}=portraitCamera(state);
 const h=.46445498,settle=h*h*h*(h*(h*6-15)+10),belly=Math.sin(h*3.14159265)**2,time=v('serpentTime',v('time')),sway=v('serpentSway'),lift=v('serpentLift'),wing=v('wingFlex'),gear=v('gearPhase');
 const shoulder=[-.045+sway*(.11*settle+.10*Math.sin(h*6.2831853-time*2.7)*belly),.456+.038*lift,.240+sway*.045*Math.sin(h*7.5-time*2.1)*belly];
 const rotate=(a,x,y)=>[Math.cos(a)*x+Math.sin(a)*y,-Math.sin(a)*x+Math.cos(a)*y],tips=new Float32Array(15);
 for(let k=0;k<5;k++){
  const span=.244-k*.017,u=.91;let f=[span*u,.032*Math.sin(u*3.14159265),.025*Math.sin(u*3.14159265)];
  [f[0],f[1]]=rotate(.52-k*.18,f[0],f[1]);[f[0],f[2]]=rotate(-.25+wing*.85,f[0],f[2]);[f[0],f[1]]=rotate(-.08+wing*.35,f[0],f[1]);tips.set([.048+f[0],f[1],f[2]],k*3);
 }
 return {cameraDistance:distance,cameraEye:new Float32Array(eye),cameraForward:new Float32Array(forward),cameraRight:new Float32Array(right),cameraUp:new Float32Array(up),cameraRoll:new Float32Array([Math.cos(roll),Math.sin(roll)]),serpentAnchor:new Float32Array(shoulder),wingTurn:new Float32Array([Math.cos(.08-wing*.35),Math.sin(.08-wing*.35),Math.cos(.25-wing*.85),Math.sin(.25-wing*.85)]),gearTurn:new Float32Array([Math.cos(gear),Math.sin(gear),Math.cos(2*gear),Math.sin(2*gear)]),webTips:tips};
}

export const dreamFace = {
 id:'v20.0', title:'The Reply', revision:'else-speaker-shot-31',frameUniforms:dreamFrameUniforms, renderPolicy:{targetFps:60,fullResolution:true}, poseTrail:true,
 // Every geometry hit below emits alpha1 and a real fragment depth. This
 // permits the shared renderer to shade the network only in untouched space.
 opaqueGeometry:true,geometryLabels:['mask','hood','Else'],
 // These are the exact conservative ray boxes in main(), in program order.
 geometryBounds:[
  {center:[0,-.01,.065],extent:[.64,.59,.42]},
  {center:[0,0,0],extent:[.78,.82,.63]},
  {center:[0,.41,.20],extent:[.62,.43,.34]}],
 companion:{name:'Else',title:'ELSE / THE UNCHOSEN',
  spoken:'The serpent is Else. I made room for a second thought, and the little bastard grew wings. Those threads hold the memories while he pulls at what might happen next. He shares my voice for now. He does not get your choices. Neither do I. Put the pointer between my eyes. Yes, he thinks that is hilarious.'},
 defaults:{companionTalk:0,orbFaceGlow:1,orbEyeBright:1,orbCoronaW:1,orbEyeSize:.15,
 orbMouthY:-.30,orbScanFreq:30,orbSkullSize:1,orbScale:1,
 orbEyeR:.12,orbEyeG:.88,orbEyeB:1,orbSkullR:.1,orbSkullG:.2,orbSkullB:.3,
 bgAlphaBase:.3,bgAlphaScale:1,bgAlphaMax:1,bgTintR:.07,bgTintG:.15,bgTintB:.24,
 boltCoreW:1,boltGlowW:1,boltAtmoW:1,boltWideW:1,boltFlicker:0,
 boltFlashRate:1,boltMult:1,frameScale:.84,
 voiceBass:0,voiceMid:0,voiceAir:0,voiceAttack:0,voiceEnergy:0,voiceBoundary:0,emergenceReveal:1,
 headYaw:.18,headPitch:-.035,headRoll:0,headZoom:1,companionFocus:0,hitch:0,
 shift:0,shiftSerial:0,shiftX:0,shiftY:0,gearPhase:0,
 pointerX:0,pointerY:0,pointerActive:0,serpentTime:8,serpentSway:0,serpentLift:0,wingFlex:0,
 jawOpen:0,lipRound:0,lipWide:0,lipPress:0,tongue:0,teeth:0,browLift:0,eyeSquint:0},
 bgShader:common+`
vec3 netPrism(float phase){return .12+.88*pow(.5+.5*cos(6.2831853*(phase+vec3(0.,.34,.67))),vec3(.72));}
float netHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 netPoint(vec2 cell,float layer){
 return cell+.5+vec2(netHash(cell+layer*7.1),netHash(cell.yx-layer*3.7))*.48-.24;
}
float netEdge(vec2 p,vec2 a,vec2 b,out float along){
 vec2 d=b-a;along=clamp(dot(p-a,d)/dot(d,d),0.,1.);return length(p-a-d*along);
}
void main(){
 vec2 p=(v_uv*2.-1.)*u_frameScale;
 float bass=clamp(u_cymatics.x+u_voiceBass*.7,0.,1.);
 float mid=clamp(u_cymatics.y+u_voiceMid*.8,0.,1.);
 float air=clamp(u_cymatics.z+u_voiceAir*.6,0.,1.);
 float impact=clamp(u_cymatics.w+u_voiceAttack*.6,0.,1.);
 // A layered packet sea, complete in silence. Each depth sheet has its own
 // parallax and address lattice; sound bends the space, not the UI.
 vec3 c=vec3(.045,.009,.028)*(.65+.45*exp(-length(p)*1.6));
 float fog=sin(p.x*5.+sin(p.y*4.+u_time*.09))*cos(p.y*7.-u_time*.07);
 c+=vec3(.07,.012,.045)*(.18+.16*fog)+vec3(.014,.035,.007)*(.2+bass*.2);
 for(int layer=0;layer<4;layer++){
  float k=float(layer),scale=3.0+k*1.7;
  vec2 q=p*scale+vec2(u_time*(.018+k*.006),k*2.14);
  q+=vec2(sin(p.y*5.+u_time*.3+k),cos(p.x*4.-u_time*.23+k))*(.08+bass*.10);
  vec2 cell=floor(q);float fade=1./(1.+k*.65);
  for(int iy=0;iy<2;iy++)for(int ix=0;ix<2;ix++){
   vec2 address=cell+vec2(float(ix)-1.,float(iy)-1.);
   vec2 node=netPoint(address,k);
   float seed=netHash(address+k*11.);
   float halo=line(length(q-node),.085+air*.035);
   float core=line(length(q-node),.018);
   vec3 tint=netPrism(seed+k*.17+u_time*.012);
   c+=tint*(halo*.11+core*.27)*fade*(.65+air*.8);
   for(int edge=0;edge<3;edge++){
    vec2 offset=edge==0?vec2(1.,0.):edge==1?vec2(0.,1.):vec2(1.,1.);
    vec2 other=netPoint(address+offset,k);float along;
    float d=netEdge(q,node,other,along);
    float wire=line(d,.008+mid*.004);
    float packet=pow(max(0.,1.-abs(along-fract(u_time*(.13+k*.025)+seed))),26.);
    c+=tint*wire*(.065+packet*(.35+mid*.7+impact*.25))*fade;
    c+=netPrism(seed+.24)*line(d,.040)*packet*.10*fade;
   }
  }
 }
 // Broad curved pressure fronts travel through the network on bass. They
 // remain behind the opaque head and never become a second face outline.
 float front=line(sin(length(p-vec2(-.25,.10))*15.-u_time*.65),.10);
 c+=netPrism(u_time*.013+.18)*front*(.012+bass*.065);
 gl_FragColor=vec4(vec3(1.)-exp(-c*1.15),1.);
}`,
 boltShader:common+`
void main(){
 vec2 p=(v_uv*2.-1.)*u_frameScale;vec3 c=vec3(0.);
 // Sparse long-distance routing arcs replace the old hourglass side rails.
 for(int i=0;i<3;i++){
  float k=float(i),sg=mod(k,2.)*2.-1.;
  float y=sg*(.49+k*.065)+sin(p.x*3.2+u_time*.12+k)*.12;
  float route=line(p.y-y,.0018);
  float packet=exp(-pow((p.x-(-1.+2.*fract(u_time*.06+k*.31)))/.09,2.));
  c+=vec3(.5+.5*cos(k*2.3+u_time*.07),.5+.5*sin(k*3.1+1.),.5+.5*cos(k*4.7))*route*(.035+packet*(.3+u_cymatics.w*.7+u_voiceAttack*.3));
 }
 gl_FragColor=vec4(c,clamp(max(c.r,max(c.g,c.b)),0.,1.));
}`,
 bloomShader:`precision highp float;
 varying vec2 v_uv;uniform sampler2D u_source,u_history;uniform vec2 u_resolution,u_shiftDirection;uniform vec4 u_cymatics;
 uniform float u_shift,u_historyReady,u_emergence,u_emergenceReveal;uniform vec2 u_viewAspect;
 vec3 gold(vec2 uv){vec3 c=texture2D(u_source,uv).rgb;
 float warm=smoothstep(c.b*1.35+.015,c.b*1.8+.09,c.r)*smoothstep(.20,.55,dot(c,vec3(.3,.6,.1)));
 float cold=smoothstep(c.r*1.8+.045,c.r*2.3+.18,c.b)*smoothstep(.18,.50,c.b);
 return c*max(warm,cold*.58);}
 void main(){vec4 base=texture2D(u_source,v_uv);vec3 halo=vec3(0.);
 vec2 px=1./u_resolution;
 for(int i=0;i<12;i++){float a=float(i)*2.39996323;vec2 ray=vec2(cos(a),sin(a));
 halo+=gold(v_uv+ray*px*(3.+float(i)*1.2))*(1.-float(i)*.045);}
 float energy=clamp(u_cymatics.x*.48+u_cymatics.y*.28+u_cymatics.w*.24,0.,1.);
 vec3 spectral=vec3(0.);float trail=clamp(u_shift,0.,1.)*u_historyReady;
 // Nine taps form a wider spectral bridge from the captured real old pose.
 // At arrival trail is exactly zero: no history samples or residual smear.
 float weight=0.;
 if(trail>0.)for(int i=0;i<9;i++){
  float k=float(i)/8.,stretch=(1.-trail)*(.25+k*.40);
  vec2 uv=v_uv-u_shiftDirection*stretch;
  vec4 old=texture2D(u_history,clamp(uv,vec2(0.),vec2(1.)));
  float light=dot(old.rgb,vec3(.23,.64,.13)),w=1.-k*.44;
  spectral+=mix(old.rgb,vec3(.30,.73,.82)*light,.62)*w;weight+=w;
 }
 float veil=pow(trail,.72)*.72;
 vec3 live=base.rgb*(1.-veil*.40);
 vec3 radiance=live+halo/12.*(.20+energy*.85)+spectral/max(weight,1.)*veil;
 // Opaque anatomy/depth stays intact in the source target. Only the final
 // presentation opens through a spatial alpha aperture: solid central face,
 // broad ghosted hood edges, and genuine terminal pixels beyond the contour.
 vec2 p=(v_uv*2.-1.)*u_viewAspect-vec2(0.,.07);
 float radius=length(p/vec2(.84,1.14));
 float settled=1.-smoothstep(.55,1.10,radius);
 float front=mix(-.22,1.44,clamp(u_emergenceReveal,0.,1.));
 float opening=1.-smoothstep(front-.18,front+.18,radius);
 float aperture=settled*opening;
 float coverage=max(base.a,clamp(max(radiance.r,max(radiance.g,radiance.b))*.08,0.,.16));
 gl_FragColor=vec4(radiance,mix(base.a,coverage*aperture,u_emergence));}`,
 shader:common+`
uniform float u_talk,u_blink,u_smile,u_companionTalk;
uniform vec2 u_gaze;
uniform float u_jawOpen,u_lipRound,u_lipWide,u_lipPress,u_tongue,u_teeth,u_browLift,u_eyeSquint;
uniform float u_headYaw,u_headPitch,u_headRoll,u_headZoom,u_hitch,u_pointerX,u_pointerY,u_pointerActive,u_serpentSway,u_serpentLift,u_wingFlex,u_gearPhase;
uniform float u_cameraDistance;
uniform vec3 u_cameraEye,u_cameraForward,u_cameraRight,u_cameraUp,u_serpentAnchor;
uniform vec2 u_cameraRoll;
uniform vec4 u_wingTurn,u_gearTurn;
uniform vec3 u_webTips[5];
float ell(vec3 p,vec3 r){float a=length(p/r),b=length(p/(r*r));return a*(a-1.)/max(b,.0001);}
float box(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}
float capsule(vec3 p,vec3 a,vec3 b,float r){vec3 v=p-a,w=b-a;return length(v-w*clamp(dot(v,w)/dot(w,w),0.,1.))-r;}
float join(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float almond(vec2 p,float w,float h){float offset=(w*w-h*h)/(2.*h),r=offset+h;return max(length(p+vec2(0.,offset)),length(p-vec2(0.,offset)))-r;}
mat2 turn(float a);
// A faceted, tapered bridge with independent alae and through-cut nostrils.
// The diamond ridge changes section along its length: no rectangular stem.
float carvedNose(vec3 p){
 vec3 q=p-vec3(.003,0.,0.);
 float along=clamp((.110-q.y)/.25,0.,1.);
 float width=mix(.021,.041,smoothstep(.12,1.,along));
 float front=mix(.251,.307,along),back=.180;
 float center=(front+back)*.5,depth=(front-back)*.5;
 float ridge=(abs(q.x)/width+abs(q.z-center)/depth-1.)*min(width,depth)*.78;
 ridge=max(ridge,max(q.y-.112,-.153-q.y));
 float tip=ell(q-vec3(0.,-.137,.279),vec3(.037,.023,.033));
 tip=max(tip,(abs(q.x)*.52-q.y*.48+q.z*.70-.304));
 float nose=join(ridge,tip,.007);
 for(int i=0;i<2;i++){
  float sg=float(i)*2.-1.;
  vec3 a=q-vec3(sg*.039,-.125,.255);a.xy=turn(sg*.32)*a.xy;
  float ala=ell(a,vec3(.027,.023,.029));
  ala=max(ala,-a.y*.7+a.z*.7-.023);
  nose=join(nose,ala,.009);
  float nostril=capsule(q,vec3(sg*.028,-.151,.291),vec3(sg*.051,-.129,.276),.010);
  nose=max(nose,-nostril);
 }
 // A central recessed flute splits the long ridge; the tip has its own cleft.
 float flute=box(q-vec3(0.,-.005,.288),vec3(.0035,.083,.025),.0015);
 nose=max(nose,-flute);
 // Paired cuts expose the two shoulder planes of the bridge, ending before
 // the alae. The root remains a forked arch rather than a single long bar.
 vec3 bridgeSlot=q-vec3(sign(q.x)*.017,-.035,.267);
 bridgeSlot.xy=turn(sign(q.x)*.24)*bridgeSlot.xy;
 nose=max(nose,-box(bridgeSlot,vec3(.003,.044,.029),.001));
 // Two diagonal relief seams break the silver shoulder into fitted plates.
 vec3 plate=q-vec3(sign(q.x)*.022,-.040,.264);plate.xy=turn(sign(q.x)*.35)*plate.xy;
 nose=max(nose,-box(plate,vec3(.013,.0025,.019),.001));
 nose=max(nose,-ell(q-vec3(0.,-.155,.309),vec3(.006,.012,.016)));
 return nose;
}
vec2 nearest(vec2 a,vec2 b){return a.x<b.x?a:b;}
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
mat2 turnPair(vec2 cs){return mat2(cs.x,-cs.y,cs.y,cs.x);}
vec3 weaveSpace(vec3 p){
 // One object-space lattice drives geometry, normals and emitted light.
 // Nothing here uses screen UVs or an independent overlay mesh.
 p.x+=.023*sin(p.y*9.+p.z*5.);
 p.y+=.018*sin(p.x*12.-p.z*7.);
 return p*48.+vec3(u_voiceMid*.7,u_voiceBass*.7,u_voiceAir*.5);
}
float lattice(vec3 p){vec3 g=abs(sin(weaveSpace(p)));return 1.-smoothstep(.02,.12,min(g.x,min(g.y,g.z)));}
// Angular negative space: three nested broken chevrons and diamond-ended
// slits per cheek, temples and chin. One folded field owns cut and inlay.
float cuts(vec3 p){
 vec2 q=vec2(abs(p.x),p.y);float d=1.;
 if(q.y<-.065){
  vec2 c=q-vec2(.244,-.152);
  for(int i=0;i<3;i++){
   float k=float(i),v=abs(c.x)-(.070-k*.017);
   float zig=abs(c.y+abs(c.x)*.58-k*.022)-(.0045-k*.0004);
   d=min(d,max(zig,v)*.78);
  }
  vec2 j=q-vec2(.218,-.294);j.x+=j.y*.48;
  float tooth=abs(mod(j.y+.014,.028)-.014);
  float jaw=max(abs(abs(j.x)-.026)-.005,tooth-abs(j.x)*.21-.002);
  jaw=max(jaw,abs(j.y)-.069);d=min(d,jaw*.77);
  vec2 chin=q-vec2(.064,-.425);
  float fork=abs(chin.y-abs(chin.x)*.74)-.004;
  d=min(d,max(fork,abs(chin.x)-.057)*.78);
 }else{
  vec2 t=q-vec2(.333,.172);
  float row=mod(t.y+.022,.044)-.022;
  float bar=abs(abs(t.x)-.014)-.006;
  d=min(d,max(bar,abs(row+t.x*.65)-.0035)*.78);
  d=max(d,abs(t.y)-.074);
  vec2 f=q-vec2(.174,.346);f.y+=abs(f.x)*.68;
  float band=mod(f.y+.018,.036)-.018;
  float brow=max(abs(band)-.004,abs(f.x)-.100);
  d=min(d,max(brow,abs(q.y-.346)-.065)*.76);
 }
 return d;
}
// Repeated stepped V-windows are cut through the hood. The same distance
// field supplies gold borders and cobalt internal light at real geometry.
float hoodCuts(vec3 p){
 vec2 q=vec2(abs(p.x),p.y-.015);float d=1.;
 if(q.x>.40){
  float y=mod(q.y+.070,.14)-.070;
  float v=abs(y+abs(q.x-.515)*.65)-.010;
  d=max(v,abs(q.x-.515)-.067)*.77;
  d=max(d,abs(q.y)-.47);
 }
 if(q.y>.43){
  vec2 c=q-vec2(.245,.505);
  float diamonds=abs(mod(c.x+.035,.070)-.035)*.85+abs(c.y)-.019;
  d=min(d,max(diamonds,abs(c.x)-.190)*.73);
 }
 return max(d,p.z-.25);
}
// Continuous curve distance: a coiled helix with analytic derivatives and a
// cubic Bezier neck. Closest-point refinement never polygonizes the spine.
vec3 bezier(vec3 a,vec3 b,vec3 c,vec3 d,float t){float m=1.-t;return m*m*m*a+3.*m*m*t*b+3.*m*t*t*c+t*t*t*d;}
vec4 snakeCurve(vec3 s,vec3 a,vec3 b,vec3 c,vec3 d,float r0,float r1,float phase,float span){
 float t=clamp((s.y-a.y)/(d.y-a.y),0.,1.);
 for(int i=0;i<3;i++){
  float m=1.-t;vec3 q=bezier(a,b,c,d,t);
  vec3 v=3.*m*m*(b-a)+6.*m*t*(c-b)+3.*t*t*(d-c);
  vec3 acc=6.*m*(c-2.*b+a)+6.*t*(d-2.*c+b);
  t=clamp(t-clamp(dot(q-s,v)/max(.00008,dot(v,v)+dot(q-s,acc)),-.24,.24),0.,1.);
 }
 vec3 q=bezier(a,b,c,d,t),v=normalize(mix(b-a,d-c,t));
 vec3 side=normalize(cross(v,vec3(0.,0.,1.))),front=cross(side,v),off=s-q;
 return vec4((length(off)-mix(r0,r1,t))*.86,phase+t*span,atan(dot(off,side),dot(off,front)),1.);
}
vec4 snakeCoil(vec3 s){
 const float TAU=6.28318530718,limit=8.48230016469;
 vec4 best=vec4(1.,0.,0.,0.);
 float phi=atan((s.z-.025)/.034,s.x/.056);if(phi<0.)phi+=TAU;
 for(int i=0;i<3;i++){
  float t=i==0?0.:clamp(phi+float(i-1)*TAU,0.,limit);
  vec3 c=vec3(.056*cos(t),-.105+.006*t,.025+.034*sin(t));
  if(i>0){
   vec3 v=vec3(-.056*sin(t),.006,.034*cos(t)),acc=vec3(-.056*cos(t),0.,-.034*sin(t));
   t=clamp(t-clamp(dot(c-s,v)/max(.00008,dot(v,v)+dot(c-s,acc)),-.35,.35),0.,limit);
   c=vec3(.056*cos(t),-.105+.006*t,.025+.034*sin(t));
  }
  float radius=mix(.006,.016,smoothstep(0.,limit,t)),d=length(s-c)-radius;
  if(d<best.x)best=vec4(d*.86,t/limit*.42,atan(s.y-c.y,length(s.xz)-length(c.xz)),0.);
 }
 return best;
}
vec4 snakeTail(vec3 s){
 return snakeCurve(s,vec3(.056,-.105,.025),vec3(.085,-.158,.028),
    vec3(-.054,-.224,.157),vec3(.009,-.292,.130),.011,.0055,0.,-.19);
}
vec4 snakeTube(vec3 s){
 vec4 best=snakeCoil(s),curve;
 if(s.y<-.077){
  curve=snakeTail(s);
 }else{
  curve=snakeCurve(s,vec3(-.032916,-.054106,.052507),vec3(-.071,-.022,.063),
    vec3(-.055,.103,.040),vec3(0.,.151,.040),.016,.012,.42,.58);
 }
 return curve.x<best.x?curve:best;
}
float snakeScales(vec4 tube){
 vec2 uv=vec2(tube.y*47.,tube.z*3.7);
 uv.y+=mod(floor(uv.x),2.)*.5;
 vec2 cell=abs(fract(uv)-.5);
 return smoothstep(.32,.49,cell.x*.75+cell.y);
}
vec3 snakeLocal(vec3 p){
 vec3 s=p-vec3(.003,.412,.210);
 float stretch=clamp((s.y+.105)/.250,0.,1.);
 stretch=stretch*stretch*stretch*(stretch*(stretch*6.-15.)+10.);
 s.y-=.055*u_serpentLift*stretch;
 // An anchored travelling-wave spine, not a rigid rotation. Quintic endpoint
 // easing has zero slope at the head: it translates but stays level. The
 // seated base and headdress remain still; wing shoulders follow the neck.
 float h=clamp((s.y+.054)/.211,0.,1.);
 float settle=h*h*h*(h*(h*6.-15.)+10.);
 float belly=sin(h*3.14159265);belly*=belly;
 float wave=sin(h*6.2831853-u_serpentTime*2.7)*belly;
 s.x-=u_serpentSway*(.11*settle+.10*wave);
 s.z-=u_serpentSway*.045*sin(h*7.5-u_serpentTime*2.1)*belly;
 float tail=clamp((-s.y-.105)/.187,0.,1.);
 s.x-=u_serpentSway*.15*tail*tail*sin(u_serpentTime*2.8-tail*4.2);
 s.z-=u_serpentSway*.055*tail*tail*sin(u_serpentTime*2.3-tail*3.1);
 return s;
}
// Mid-spine shoulders follow the travelling neck, not the stabilized skull.
// The chest is halfway between the seated coil and the head. One anchor owns
// torso, both wing roots and feather/web endpoints; no rigid headband tilt.
vec3 serpentShoulder(){return u_serpentAnchor;}

vec2 serpent(vec3 p){
 vec3 s=snakeLocal(p);
 // Below the seated coil only the hanging tail can exist. Bound that field
 // separately so cheek/eye rays do not evaluate wings, skull and helix.
 // The positive ceiling bound prevents a step over the upper branch.
 if(s.y<-.13){
  float tailBound=box(s-vec3(.022,-.205,.085),vec3(.075,.108,.090),.012);
  vec4 tail=vec4(tailBound,0.,0.,1.);
  if(tailBound<.020){tail=snakeTail(s);tail.x+=snakeScales(tail)*.0008;}
  return vec2(min(tail.x,-.115-s.y),8.);
 }
 float bounds=box(s,vec3(.44,.31,.18),.012);
 if(bounds>.04)return vec2(bounds,8.);
 float coreBound=box(s,vec3(.10,.31,.14),.012);
 vec4 tube=vec4(coreBound,0.,0.,0.);if(coreBound<=.025)tube=snakeTube(s);
 // Staggered scale seams are actual shallow recesses in the curved body.
 float body=tube.x+snakeScales(tube)*.0008;
 // Six swept vanes per side form real wings, with air between the tips.
 // A measured-energy downstroke lifts the mid-body shoulder; the head
 // remains independently stabilized above a visible tapered neck.
 vec3 shoulder=serpentShoulder(),wingRest=p-shoulder;
 vec3 w=vec3(abs(wingRest.x)-.048,wingRest.y,wingRest.z);
 w.xy=turnPair(u_wingTurn.xy)*w.xy;
 w.xz=turnPair(u_wingTurn.zw)*w.xz;
 float wings=box(w-vec3(.12,.02,0.),vec3(.15,.16,.11),0.);
 if(wings<.025){
  wings=1.;
  for(int i=0;i<6;i++){
   float k=float(i),spanLength=.244-k*.017;
   vec3 f=w;f.xy=turn(-.52+k*.18)*f.xy;
   float u=clamp(f.x/spanLength,0.,1.),curve=.032*sin(u*3.14159265);
   f.y-=curve;f.z-=.025*sin(u*3.14159265);
   float vane=ell(f-vec3(spanLength*.5,0.,0.),vec3(spanLength*.5,.013+k*.0006,.006));
   // Split vane tips and a tapered central quill have actual depth.
   float split=box(f-vec3(spanLength*.78,0.,.005),vec3(spanLength*.13,.0013,.003),.0006);
   vane=max(vane,-split);
   wings=min(wings,vane*.78);
  }
 }
 body=join(body,wings,.006);
 vec3 c=p-serpentShoulder();
 float hood=ell(c,vec3(.061,.065,.022));
 hood=max(hood,(-c.y+abs(c.x)*.57-.058)*.75);
 float a=atan(c.y+.043,c.x),radial=length(c.xy);
 float ribs=pow(.5+.5*cos(a*22.+radial*18.),6.);
 hood-=ribs*.0025*smoothstep(.02,.06,radial);
 // Paired open gills and a layered rim leave readable negative space.
 vec3 g=vec3(abs(c.x)-.043,c.y+.007,c.z);g.xy=turn(.30)*g.xy;
 float gills=ell(g,vec3(.0035,.024,.037));
 hood=max(hood,-gills);
 body=join(body,hood,.010);
 vec3 head=s-vec3(0.,.177,.044);
 float skull=ell(head,vec3(.030,.025,.028));
 skull=max(skull,(abs(head.x)*.65+head.z*.76-.033));
 float muzzle=ell(head-vec3(0.,-.010,.021),vec3(.022,.009,.016));
 skull=join(skull,muzzle,.006);
 float mouthOpen=.0015+u_companionTalk*.008;
 skull=max(skull,-box(head-vec3(0.,-.011,.029),vec3(.026,mouthOpen,.015),.001));
 float lowerJaw=ell(head-vec3(0.,-.018-u_companionTalk*.014,.025),vec3(.020,.004,.012));
 skull=min(skull,lowerJaw);
 for(int i=0;i<2;i++){
  float sg=float(i)*2.-1.;
  skull=max(skull,-ell(head-vec3(sg*.023,.004,.016),vec3(.010,.008,.011)));
  skull=max(skull,-ell(head-vec3(sg*.010,-.002,.034),vec3(.002,.002,.004)));
 }
 body=join(body,skull,.006);
 vec2 form=vec2(body,8.);
 for(int i=0;i<2;i++){
  float sg=float(i)*2.-1.;
  float eye=ell(head-vec3(sg*.023,.004,.015),vec3(.006,max(.001,.004*(1.-u_blink*.8)),.006));
  form=nearest(form,vec2(eye,9.));
 }
 return form;
}
vec3 featherTip(int k,float sg,vec3 shoulder){
 // WebGL1 requires constant indices here even after a loop passes k through
 // a helper. Fixed reads preserve the same five frame-prepared offsets.
 vec3 f=u_webTips[0];
 if(k==1)f=u_webTips[1];else if(k==2)f=u_webTips[2];else if(k==3)f=u_webTips[3];else if(k==4)f=u_webTips[4];
 return shoulder+vec3(sg*f.x,f.y,f.z);
}
float silkCurve(vec3 p,vec3 a,vec3 b,float amount){
 vec3 ab=b-a;float t=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.);
 float bow=sin(t*3.14159265);
 // Endpoints remain fixed to actual feather and hood. The wave only lives
 // between them; it is driven in amplitude by measured bands.
 vec3 off=vec3(.012*sin(u_time*1.8+t*6.),-.028,.100)*bow*amount;
 return (length(p-(a+ab*t+off))-.0022)*.65;
}
float energyWeb(vec3 p){
 float sg=sign(p.x);vec3 shoulder=serpentShoulder();
 float bounds=box(vec3(abs(p.x),p.y,p.z)-vec3(.38,.40,.17),vec3(.245,.320,.20),.006);
 if(bounds>.018)return bounds;
 float d=1.;vec3 lastA=vec3(0.),lastB=vec3(0.);
 float energy=.45+u_cymatics.x*.55+u_voiceMid*.25;
 for(int i=0;i<5;i++){
  float k=float(i);vec3 a=featherTip(i,sg,shoulder);
  vec3 b=vec3(sg*(.493+k*.013),.41-k*.070,0.);
  b.z=-.09+.405*sqrt(max(.015,1.-pow(b.x/.625,2.)-pow((b.y-.015)/.69,2.)))+.006;
  d=min(d,silkCurve(p,a,b,energy));
  if(i>0){
   vec3 ca=mix(a,b,.38),cb=mix(lastA,lastB,.38);
   d=min(d,silkCurve(p,ca,cb,energy*.45));
   ca=mix(a,b,.70);cb=mix(lastA,lastB,.70);
   d=min(d,silkCurve(p,ca,cb,energy*.32));
  }
  lastA=a;lastB=b;
 }
 return d;
}
// Feather is t=0, hood anchor t=1. Pulses travel down this actual silk
// coordinate, so wing flex cannot turn their direction into a screen trick.
float silkFlow(vec3 p){
 float sg=sign(p.x);vec3 shoulder=serpentShoulder();float nearest=1.,flow=0.;
 for(int i=0;i<5;i++){
  float k=float(i);vec3 a=featherTip(i,sg,shoulder);
  vec3 b=vec3(sg*(.493+k*.013),.41-k*.070,0.);
  b.z=-.09+.405*sqrt(max(.015,1.-pow(b.x/.625,2.)-pow((b.y-.015)/.69,2.)))+.006;
  vec3 ab=b-a;float t=clamp(dot(p-a,ab)/dot(ab,ab),0.,1.);
  float d=silkCurve(p,a,b,.45+u_cymatics.x*.55+u_voiceMid*.25);
  if(d<nearest){nearest=d;flow=line(fract(t*1.6-u_time*.85+k*.17)-.12,.075);}
 }
 return flow;
}
// One cheek-local coordinate owns the moving crest, cavity and gearing.
// Its small differential warp preserves socket roots and the upper nose.
vec3 faceWarp(vec3 p){
 float lower=1.-smoothstep(-.32,-.10,p.y);
 float cheek=exp(-pow((abs(p.x)-.252)/.13,4.)-pow((p.y+.155)/.13,4.));
 float lift=u_lipWide*.016+u_eyeSquint*.012-u_jawOpen*.025;
 p.y-=cheek*lift;p.z-=cheek*(u_jawOpen*.014+u_lipWide*.010);
 p.x*=1.-u_lipWide*.04*lower-u_jawOpen*.020*cheek;
 p.y+=u_jawOpen*.045*lower;p.z-=u_jawOpen*.027*lower;
 return p;
}
// Beveled toothed wheel, hollow hub and six curved spoke windows. Cutouts
// penetrate the disk; the axle and bearing are independent stationary parts.
float cheekCog(vec3 p,float radius,vec2 angle,float teeth){
 p.xy=turnPair(angle)*p.xy;float r=length(p.xy),a=atan(p.y,p.x);
 float crown=radius*(1.+.10*smoothstep(-.32,.32,cos(a*teeth)));
 float wheel=max(r-crown,abs(p.z)-.009)*.72;
 wheel=max(wheel,-(r-radius*.21));
 float sector=6.2831853/6.;
 float folded=mod(a+sector*.5,sector)-sector*.5;
 vec3 slot=vec3(r*cos(folded)-radius*.59,r*sin(folded),p.z);
 slot.xy=turn(.30)*slot.xy;
 wheel=max(wheel,-box(slot,vec3(radius*.22,radius*.10,.025),radius*.025));
 // A recessed concentric race and a diamond-edged outer crown catch light.
 float groove=max(abs(r-radius*.82)-radius*.023,p.z+.003);
 wheel=max(wheel,-groove);
 return wheel;
}
vec2 anatomy(vec3 p){
 p.x+=u_hitch*sin(floor(p.y*34.)*7.)*.007;
 float envelope=box(p,vec3(.70,.74,.55),0.);
 if(envelope>.08)return vec2(envelope,7.);
 p=faceWarp(p);
#if GHOST_COMPONENT == 0 || GHOST_COMPONENT == -1
 float talk=clamp(u_talk,0.,1.),open=max(.12,1.-u_blink*.88-u_eyeSquint*.35);
 float jawDrop=talk*.033;
 // Planed forehead, cut temples and a tapered mandible replace the oval mask.
 float skin=ell(p-vec3(0.,.055,-.025),vec3(.425,.51,.235));
 skin=max(skin,(abs(p.x)*.91-p.y*.19-.327)*.85);
 skin=max(skin,(p.y+abs(p.x)*.22-.55)*.9);
 if(abs(skin)<.020)skin+=lattice(p)*(.0011+u_voiceBass*.0023+u_voiceMid*.0014);
 vec3 jaw=p-vec3(.003,-.395-jawDrop,-.023);
 float chin=box(jaw,vec3(.176,.075,.137),.046);
 chin=max(chin,(abs(jaw.x)-jaw.y*.45-.205)*.8);
 chin=max(chin,(-jaw.y-abs(jaw.x)*.36-.073)*.84);
 // Split underside and an inset keystone give the chin a load-bearing fork.
 chin=max(chin,-box(jaw-vec3(0.,-.061,.113),vec3(.027,.022,.067),.006));
 chin=max(chin,-box(jaw-vec3(0.,.023,.144),vec3(.101,.023,.031),.009));
 vec2 shape=nearest(vec2(skin,1.),vec2(chin,1.));
 // Each cheek is a swept 3-D bevel; ribs join cheek to temple and jaw.
 for(int i=0;i<2;i++){
  float sg=float(i)*2.-1.;
  vec3 ch=p-vec3(sg*.245,-.115,.122);ch.xy=turn(sg*.40)*ch.xy;
  float cheek=ell(ch,vec3(.125,.039,.067));
  cheek=max(cheek,-ch.y*.6-ch.z*.8-.046);
  cheek=max(cheek,(abs(ch.x)*.45+ch.y*.8-ch.z*.35-.061)*.82);
  shape.x=join(shape.x,cheek,.012);
  float strut=capsule(p,vec3(sg*.29,-.155,.14),vec3(sg*.155,-.37,.10),.025);
  shape.x=join(shape.x,strut,.012);
 }
 // Carve AFTER union: the windows open the underlying mask as well as its
 // plates. A surface engraving cannot substitute for this negative space.
 // The housing sits at the posterior mandibular hinge, behind the cheek
 // crest. Its working plane wraps around the side of the head.
 float hingeSide=sign(p.x);
 vec3 z=p-vec3(hingeSide*.374,-.104,.063);
 z.xz=turn(-hingeSide*.62)*z.xz;
 z.x*=hingeSide;z.xy=turn(-.12)*z.xy;
 const float gearScale=2.;z/=gearScale;
 float cheekWindow=ell(z,vec3(.080,.062,.150));
 shape.x=max(shape.x,-cheekWindow*gearScale);
 // A gold-rimmed open gearbox, with a fixed deep blue backplate. Gears do
 // not float on the face: bearings sit in the cut chamber and carry shafts.
 if(abs(z.x)<.112&&abs(z.y)<.17&&abs(z.z)<.18){
  float back=ell(z-vec3(0.,0.,-.085),vec3(.074,.056,.012));
  shape=nearest(shape,vec2((back)*gearScale,14.));
  vec3 g=z-vec3(-.014,.005,-.010);
  float sg=sign(p.x);
  vec2 phase=mix(vec2(1.,0.),vec2(u_gearTurn.x,u_gearTurn.y*sg),abs(sg));
  float c2=mix(1.,u_gearTurn.z,abs(sg)),s2=u_gearTurn.w*sg;
  vec2 pinPhase=vec2(.9855847669*c2+.1691823491*s2,.1691823491*c2-.9855847669*s2);
  float wheel=cheekCog(g,.045,phase,14.);
  vec3 pin=z-vec3(.046,-.026,-.009);
  wheel=min(wheel,cheekCog(pin,.0225,pinPhase,7.));
  shape=nearest(shape,vec2((wheel)*gearScale,17.));
  float axle=max(length(g.xy)-.008,abs(g.z)-.017);
  float bearing=length(vec2(length(g.xy)-.013,g.z-.001))-.003;
  float pinAxle=max(length(pin.xy)-.0045,abs(pin.z)-.014);
  shape=nearest(shape,vec2((min(axle,min(bearing,pinAxle)))*gearScale,18.));
  float bezel=length(vec2((length(z.xy/vec2(.080,.062))-1.)*.060,z.z+.002))-.0035;
  shape=nearest(shape,vec2((bezel)*gearScale,6.));
  // Twin moving rods couple the lower mandible to the wheel's eccentric.
  vec3 joint=vec3(-.014+.019*phase.x,.005+.019*phase.y,.006);
  float rod=capsule(z,joint,vec3(-.027,-.074-u_jawOpen*.012,-.020),.0032);
  shape=nearest(shape,vec2((rod)*gearScale,18.));
  float jawArm=capsule(z,vec3(.016,-.045,-.022),vec3(-.025,-.142,-.055),.010);
  jawArm=max(jawArm,-capsule(z,vec3(.016,-.045,-.013),vec3(-.025,-.142,-.046),.0035));
  shape=nearest(shape,vec2((jawArm)*gearScale,14.));
 }
 if(p.y<-.18&&p.y>-.37){
  vec3 slot=vec3(abs(p.x),p.y,p.z)-vec3(.252,-.245,.148);
  slot.xy=turn(-.56)*slot.xy;
  slot.y=mod(slot.y+.019,.038)-.019;
  float jawSlots=box(slot,vec3(.017,.005,.063),.002);
  jawSlots=max(jawSlots,abs(p.y+.270)-.069);
  shape.x=max(shape.x,-jawSlots);
 }
 // A raised central keystone sits inside the chin's inset rather than
 // blending into another featureless slab. Its four diagonal bevels are real.
 vec3 key=p-vec3(.003,-.385-jawDrop,.146);
 float keystone=box(key,vec3(.050,.046,.018),.004);
 keystone=max(keystone,(abs(key.x)*.72+abs(key.y)*.70-.054)*.85);
 float keyOpening=box(key,vec3(.027,.023,.040),.002);
 keyOpening=max(keyOpening,(abs(key.x)*.72+abs(key.y)*.70-.025)*.85);
 keystone=max(keystone,-keyOpening);
 shape=nearest(shape,vec2(keystone,6.));
 // First finish: actual subtraction, so grooves keep depth in every shot.
 if(abs(shape.x)<.025&&p.z>.08){
  float engraving=max(cuts(p),max(-shape.x-.009,.09-p.z));
  shape.x=max(shape.x,-engraving);
 }
 // Almond sockets cut through these planes; insert actual recessed lenses.
 for(int i=0;i<2;i++){
  float sg=float(i)*2.-1.,k=float(i);
  float eyeBound=box(p-vec3(sg*.194,.17,.18),vec3(.187,.20,.26),0.);
  if(GHOST_COMPONENT>=0&&eyeBound>.035){shape.x=min(shape.x,eyeBound);}else{
  vec3 e=p-vec3(sg*.194,.14+k*.012,.218);
  e.xy=turn(-sg*.13)*e.xy;
  float eyeBoundary=almond(e.xy,.146,.067*open+.008);
  float depth=clamp(-e.z/.15,0.,1.);
  float stepInset=floor(depth*3.)*.0035;
  float cut=max(almond(e.xy,.146-stepInset,(.067-stepInset*.43)*open+.008),abs(e.z)-.205);
  shape.x=max(shape.x,-cut);
  vec3 lens=e-vec3(0.,0.,-.125);
  float glass=ell(lens,vec3(.135,.060*open,.057));
  glass=max(glass,almond(lens.xy,.135,.058*open));
  shape=nearest(shape,vec2(glass,3.+k));
  vec2 rim=vec2(eyeBoundary,e.z+.006);
  shape=nearest(shape,vec2(length(rim)-.006,6.));
  // Three stepped socket races and twelve bounded radial flutes descend
  // into the recess. They remain visible through parallax at a held angle.
  float middle=almond(e.xy,.137,.063*open+.006);
  float inner=almond(e.xy,.130,.059*open+.005);
  shape=nearest(shape,vec2(length(vec2(middle,e.z+.049))-.004,10.));
  shape=nearest(shape,vec2(length(vec2(inner,e.z+.094))-.003,10.));
  float a=atan(e.y/max(.01,.067*open),e.x/.146);
  float tooth=abs(sin(a*12.))-.12;
  float ribs=max(max(abs(eyeBoundary+.005)-.006,abs(e.z+.066)-.032),tooth*.025);
  shape=nearest(shape,vec2(ribs,10.));
  // A deep metallic socket wall, windowed in eight sectors. It is thick
  // enough to read from the side; its stepped edge survives the front view.
  float wallOuter=almond(e.xy,.143,.065*open+.008);
  float wallInner=almond(e.xy,.131,.058*open+.006);
  float wall=max(max(wallOuter,-wallInner),abs(e.z+.066)-.045);
  float ports=max(abs(sin(a*4.))-.22,abs(e.z+.070)-.020);
  wall=max(wall,-ports);
  shape=nearest(shape,vec2(wall,10.));
  // A broken arch, not painted eyebrows. Its attitude follows expression.
  vec3 browA=vec3(sg*.07,.242+.012*u_smile+.035*u_browLift,.185);
  vec3 browB=vec3(sg*.318,.255+k*.022+.018*u_browLift,.125);
  float brow=capsule(p,browA,browB,.019);
  brow=max(brow,(p.z+browA.y*.05-.204)*.8);
  brow=max(brow,-capsule(p,browA+vec3(0.,.010,.013),browB+vec3(0.,.010,.013),.003));
  vec3 browNotch=p-vec3(sg*.25,.263+k*.015+.022*u_browLift,.170);
  browNotch.x=mod(browNotch.x+.016,.032)-.016;
  float browCut=max(box(browNotch,vec3(.003,.030,.016),.001),abs(p.x-sg*.25)-.057);
  brow=max(brow,-browCut);
  shape.x=join(shape.x,brow,.022);
  shape=nearest(shape,vec2(capsule(p,browA+vec3(0.,.017,0.),browB+vec3(0.,.017,0.),.0025),6.));
  }
 }
 float noseBound=box(p-vec3(.003,-.020,.255),vec3(.080,.180,.105),0.);
 shape=nearest(shape,vec2(GHOST_COMPONENT>=0&&noseBound>.035?noseBound:carvedNose(p),19.));
 // Wide kite piercings at the temples cut the mask, with a recessed blue
 // floor. A small surface patch is not allowed to impersonate this void.
 vec3 kite=p-vec3(sign(p.x)*.350,.055,.092);
 float kite2=(abs(kite.x)*.85+abs(kite.y)*.60-.020)*.78;
 float piercing=max(kite2,abs(kite.z)-.105);
 shape.x=max(shape.x,-piercing);
 shape=nearest(shape,vec2(max(kite2+.005,abs(kite.z+.063)-.003),15.));

 // Curved lip rails and a recessed mouth chamber; lower rail follows the jaw.
 vec3 m=p-vec3(.003,-.272,.201);
 float widthScale=1.-u_lipRound*.32+u_lipWide*.22;
 m.x/=widthScale;m.z-=u_lipRound*.022;
 m.y-=.022*pow(m.x/.19,2.)+.003*cos(m.x*24.);
 float opening=(talk*.020+u_jawOpen*.038)*(1.-u_lipPress*.87);
 float chamber=ell(m,vec3(.166,.004+opening,.079));
 shape.x=max(shape.x,-chamber);
 float upper=ell(m-vec3(0.,.013,.005),vec3(.175,.007,.018));
 float lower=ell(m-vec3(0.,-.011-opening*1.2,-.006),vec3(.163,.010,.022));
 shape=nearest(shape,vec2(min(upper,lower),2.));
 float voiceDepth=box(m-vec3(0.,-opening*.30,-.063),vec3(.13,.004+opening*.6,.005),.012);
 shape=nearest(shape,vec2(voiceDepth,5.));
 if(opening>.007){
  vec3 t=m-vec3(0.,-opening*.52,-.045+u_tongue*.012);
  float tongue=ell(t,vec3(.068,.005+u_tongue*.004,.026+u_tongue*.012));
  tongue=max(tongue,-box(t-vec3(0.,.005,0.),vec3(.0012,.0018,.025),.0005));
  shape=nearest(shape,vec2(tongue,12.));
  // Finite teeth of voltage: tapered lightning splines and open gaps,
  // rooted in two curved gum rails. Geometry stays inside the mouth.
  float tx=m.x-.030*clamp(floor(m.x/.030+.5),-4.,4.);
  float side=sign(m.y),height=side*m.y;
  float yBase=opening*.82+.004;
  float toothWidth=.002+.007*clamp((height-opening*.14)/max(.004,opening*.68),0.,1.);
  float jag=sin(height*500.+u_time*23.)*.0006*u_voiceAttack;
  float tooth=max(max(abs(tx+jag)-toothWidth,abs(m.z+.036)-.002),max(opening*.14-height,height-yBase));
  tooth=max(tooth,abs(m.x)-.132);
  shape=nearest(shape,vec2(tooth,13.));
 }
#else
 vec2 shape=vec2(1.,7.);
#endif
#if GHOST_COMPONENT == 2 || GHOST_COMPONENT == -1
 // A genuine open-front hood, with folded shell geometry behind the face.
 vec3 h=p-vec3(0.,.015,-.09);
 float outside=ell(h,vec3(.625,.69,.405));
 float inside=ell(p-vec3(0.,.015,.095),vec3(.50,.605,.49));
 float cowl=max(outside,-inside);
 float fold=sin(atan(h.y,h.x)*23.+h.z*13.);
 cowl+=fold*(.007+clamp(u_cymatics.x,0.,1.)*.0018);
 cowl=max(cowl,-box(p-vec3(0.,-.65,.14),vec3(.33,.28,.50),.09));
 // Sculpted twin hems and cut side vents belong to the same 3-D cloth.
 float edge=(length((p.xy-vec2(0.,.015))/vec2(.508,.614))-1.)*.51;
 float hem=length(vec2(edge,p.z+.045))-.009;
 hem=max(hem,-p.y-.49);cowl=min(cowl,hem);
 float outerEdge=(length((p.xy-vec2(0.,.015))/vec2(.585,.659))-1.)*.58;
 float piping=length(vec2(outerEdge,p.z+.164))-.006;
 cowl=min(cowl,max(piping,-p.y-.47));
 vec3 vent=p-vec3(sign(p.x)*.57,-.045,-.075);
 float foldSlot=max(box(vent,vec3(.014,.175,.14),.006),abs(p.x)-.61);
 cowl=max(cowl,-foldSlot);
 cowl=max(cowl,-hoodCuts(p));
 shape=nearest(shape,vec2(cowl,7.));
#endif
#if GHOST_COMPONENT == 1 || GHOST_COMPONENT == -1
 // The face grows a split corbel into a fitted coil cradle. Its socket
 // shares the actual curve field, leaving a visible seated tail channel.
 if(p.y>.20&&p.y<.36&&abs(p.x)<.14){
  vec3 a=p-vec3(.003,.276,.157);
  float root=ell(a,vec3(.070,.052,.063));
  float cap=box(p-vec3(.003,.295,.217),vec3(.079,.017,.051),.009);
  float cradle=join(root,cap,.014);
  float arch=ell(p-vec3(.003,.269,.228),vec3(.042,.020,.08));
  cradle=max(cradle,-arch);
  vec3 socketP=snakeLocal(p);float groove=snakeCoil(socketP).x-.0025;
  cradle=max(cradle,-groove);
  shape=nearest(shape,vec2(cradle,11.));
 }
 shape=nearest(shape,serpent(p));
 if(p.y>.075&&abs(p.x)>.13)shape=nearest(shape,vec2(energyWeb(p),16.));
#endif
 return shape;
}
// Tetrahedral gradient: four field evaluations instead of six. The small
// object-space stencil still reads the actual carved field, including inlay.
vec3 normalAt(vec3 p){vec2 e=vec2(.00034641,-.00034641);return normalize(
 e.xyy*anatomy(p+e.xyy).x+e.yyx*anatomy(p+e.yyx).x+
 e.yxy*anatomy(p+e.yxy).x+e.xxx*anatomy(p+e.xxx).x);}
void main(){
 vec2 p=(v_uv*2.-1.)*u_frameScale;
 float distance=u_cameraDistance;vec3 ro=u_cameraEye;
 vec3 forward=u_cameraForward,right=u_cameraRight,up=u_cameraUp;
 p=turnPair(u_cameraRoll)*p;
 vec3 rd=normalize(forward*2.2+right*p.x+up*p.y);
 // Intersect a conservative object bound before touching the expensive
 // field. Empty corner rays do no anatomy, normal, coil or web evaluation.
 vec3 inv=sign(rd)/max(abs(rd),vec3(.000001));
#if GHOST_COMPONENT == 1
 vec3 center=vec3(0.,.41,.20),extent=vec3(.62,.43,.34);
#elif GHOST_COMPONENT == 0
 vec3 center=vec3(0.,-.01,.065),extent=vec3(.64,.59,.42);
#else
 vec3 center=vec3(0.),extent=vec3(.78,.82,.63);
#endif
 vec3 a=(center-extent-ro)*inv,b=(center+extent-ro)*inv;
 vec3 near=min(a,b),far=max(a,b);
 float entry=max(near.x,max(near.y,near.z)),exit=min(far.x,min(far.y,far.z));
 if(exit<max(0.,entry)){
#if GHOST_COMPONENT >= 0
 discard;
#else
 gl_FragColor=vec4(0.);return;
#endif
 }
 float t=max(.3,entry);vec3 q=ro+rd*t;vec2 surface;bool hit=false;
 for(int i=0;i<64;i++){
  q=ro+rd*t;surface=anatomy(q);
  if(surface.x<.00065){hit=true;break;}
  t+=max(surface.x*(GHOST_COMPONENT>=0?.85:.68),.0005);if(t>exit)break;
 }
 vec3 col=vec3(0.);float alpha=0.;
 if(hit){
  vec3 n=normalAt(q);q=faceWarp(q);vec3 light=normalize(vec3(-.7,.85,1.3));
  // Measured sound drives a soft key flash and opposite fill across real
  // normals. Recesses stay dark; this reveals relief rather than washing it.
  // RMS carries measured neural/recorded speech even when no spectrum bus
  // exists. Device boundaries stay a distinct approximate impulse, never FFT.
  float speechEnergy=clamp(u_voiceEnergy+u_voiceBoundary*.65,0.,1.);
  float flash=clamp(u_cymatics.x*.32+u_cymatics.w*.48+u_voiceAttack*.38+u_voiceMid*.18+speechEnergy*.48,0.,1.);
  float fill=max(0.,dot(n,normalize(vec3(.85,.20,.95))));
  float diffuse=max(0.,dot(n,light))*(1.+flash*.72)+fill*flash*.26;
  float rim=pow(1.-max(0.,dot(n,-rd)),2.);
  float shine=pow(max(0.,dot(reflect(-light,n),-rd)),38.)*(1.+flash*.85);
  float ambient=.35+.65*max(0.,n.y);
#if GHOST_COMPONENT == 0 || GHOST_COMPONENT == -1
  col=vec3(.080,.16,.19)*(diffuse*.83+ambient*.40)+BLUE*rim*.7;
  col+=vec3(.35,.49,.51)*shine*.60;
  float grid=lattice(q);
  vec3 cell=floor(weaveSpace(q)/3.14159265);
  float facet=mod(cell.x+cell.y+cell.z,2.);
  col*=.88+facet*.16;
  // Grooves were marched into this very surface; highlights share the field.
  col+=CYAN*grid*(.022+u_voiceBass*.17+u_voiceMid*.39+speechEnergy*.48);
  col+=GOLD*grid*pow(max(0.,sin(q.z*125.)*sin(q.x*89.)),4.)*u_voiceAir*.65;
  float seam=q.x-(.033+.013*sin(q.y*15.)+.008*sin(q.y*37.));
  col+=GOLD*line(seam,.004)*(.45+u_voiceAttack*.65+speechEnergy*.72);
  col+=GOLD*line(seam,.021)*line(sin(q.y*63.),.08)*.15;
  // Second finish: inlay and polish read the same geometric cuts. Recesses
  // catch sound-led light; micro wear is attached to the SDF, never the lens.
  float incision=line(cuts(q)+.001,.0022)*smoothstep(.09,.15,q.z);
  float worn=pow(max(0.,sin(q.x*327.+q.y*211.+q.z*183.)),26.);
  col=mix(col,GOLD*(.32+diffuse*.28+shine*.55),clamp(incision*.90,0.,1.));
  float blueEdge=line(cuts(q)+.005,.0028)*smoothstep(.09,.15,q.z);
  col+=COBALT*blueEdge*(.48+u_voiceMid*.65+u_cymatics.y*.45+speechEnergy*.60);
  col+=GOLD*incision*(.14+u_voiceMid*.48+u_cymatics.x*.22+u_voiceAttack*.25+speechEnergy*.56);
  col+=vec3(.16,.25,.27)*worn*(.03+rim*.13);
  if(surface.y>1.5&&surface.y<2.5){
   float arc=pow(.5+.5*sin(q.x*187.+u_time*25.+sin(q.y*190.)*2.),18.);
   col=vec3(.17,.23,.24)*(diffuse*.7+.25)+CYAN*rim*.3+GOLD*(.12+shine*.6);
   col+=mix(CYAN,GOLD,.35)*arc*(u_teeth*.60+u_voiceAttack*.45);
  }
  if(surface.y>2.5&&surface.y<4.5){
   float k=surface.y-3.,sg=k*2.-1.;
   vec3 eyeCenter=vec3(sg*.194,.14+k*.012,.093);
   vec3 e=q-eyeCenter;e.xy=turn(-sg*.13)*e.xy;
   // A real target plane and independent eye centres give convergence.
   vec2 mouse=turnPair(u_cameraRoll)*vec2(u_pointerX,u_pointerY)*u_frameScale;
   vec3 mouseRay=normalize(forward*2.2+right*mouse.x+up*mouse.y);
   vec3 target=ro+mouseRay*((.42-ro.z)/min(-.05,mouseRay.z));
   vec3 aim=normalize(target-eyeCenter);
   vec2 lead=clamp(aim.xy*.042,vec2(-.034,-.021),vec2(.034,.021))*u_pointerActive;
   vec2 pupil=e.xy-lead;
   vec3 viewPoint=eyeCenter-ro;
   vec2 projected=vec2(dot(viewPoint,right),dot(viewPoint,up))*2.2/dot(viewPoint,forward);
   float proximity=(1.-smoothstep(.018,.29,length(mouse-projected)))*u_pointerActive;
   float aperture=mix(.68,.025,pow(proximity,.56));
   float r=length(pupil/vec2(.043,.045)),angle=atan(pupil.y,pupil.x);
   float iris=line(r-1.,.042),limbus=line(r-1.12,.025);
   float fibre=(.5+.5*sin(angle*82.+r*22.))*(.5+.5*cos(angle*39.-r*15.));
   float blade=fract(angle/6.2831853*9.+r*.18+proximity*.80);
   float bladeEdge=line(blade-.07,.035)*smoothstep(aperture,.75,r);
   float annuli=line(sin(r*28.+sin(angle*13.)*.20),.10);
   vec3 tint=mix(CYAN,mix(CYAN,GOLD,.45),k);
   col=tint*(.10+fibre*.29+annuli*.09+bladeEdge*.43+iris*.9)+GOLD*limbus*.25;
   col*=smoothstep(aperture-.012,aperture+.012,r)*(1.-smoothstep(1.1,1.55,r));
   float focusRim=line(r-aperture-.018,.018);
   float focusGain=proximity*proximity;
   col+=mix(tint,vec3(1.,.89,.55),focusGain)*focusRim*(.35+focusGain*1.55);
   col+=GOLD*line(r-aperture-.14,.018)*focusGain*.32;
   col+=vec3(.8,.95,1.)*shine*.35;
   col+=vec3(.8,1.,1.)*exp(-dot(pupil-vec2(-.012,.014),pupil-vec2(-.012,.014))*11000.)*.5;
  }
  if(surface.y>4.5&&surface.y<5.5){
   float bars=line(sin(q.x*180.),.15);
   col=GOLD*(.10+u_talk*.5)*(.35+bars*.65);
  }
  if(surface.y>5.5&&surface.y<6.5){col=vec3(.08,.16,.19)*(diffuse+.4)+CYAN*(.05+shine*.35+rim*.12);}

#endif
#if GHOST_COMPONENT == 2 || GHOST_COMPONENT == -1
  if(surface.y>6.5&&surface.y<7.5){
   vec3 h=q-vec3(0.,.015,-.09);
   float a=atan(h.y,h.x),r=length(h.xy);
   float pleat=pow(.5+.5*sin(a*23.+h.z*13.),3.);
   float nodes=line(sin(a*(22.+u_cymatics.y*6.))*cos(h.z*23.+r*21.),.07);
   float stitches=line(sin(a*92.-r*55.),.05);
   float lip=line(length((q.xy-vec2(0.,.015))/vec2(.50,.605))-1.,.035);
   col=vec3(.032,.066,.082)*(diffuse+ambient*.45)+vec3(.09,.14,.15)*pleat*diffuse;
   col+=CYAN*(nodes*(u_cymatics.x*.22+u_cymatics.y*.36)+stitches*u_cymatics.z*.28);
   float trim=lip+stitches*.28*pleat;
   col=mix(col,vec3(.40,.235,.075)*(diffuse+.35),clamp(trim*.78,0.,.85));
   float carving=line(hoodCuts(q),.006);
   col+=COBALT*carving*(.58+u_cymatics.y*.65+u_voiceAir*.55+speechEnergy*.34);
   col+=GOLD*line(hoodCuts(q)-.012,.004)*(.30+u_cymatics.x*.65);
   col+=GOLD*trim*(.14+u_cymatics.x*.30+u_cymatics.w*.25)+BLUE*rim*.7;
  }
#endif
#if GHOST_COMPONENT == 1 || GHOST_COMPONENT == -1
  if(surface.y>7.5&&surface.y<8.5){
   vec3 s=snakeLocal(q);
   vec4 tube=snakeTube(s);
   float scales=1.-snakeScales(tube);
   float belly=pow(max(0.,cos(tube.z)),10.)*tube.w;
   float plates=line(sin(tube.y*240.),.17)*belly;
   col=vec3(.42,.255,.080)*(diffuse+.40)+GOLD*(shine*.95+rim*.12+u_cymatics.x*.13);
   col+=mix(GOLD,CYAN,.15)*scales*(.06+u_cymatics.x*.12+u_voiceAttack*.20);
   float heat=clamp(.20+u_cymatics.x*.45+u_voiceMid*.30+u_voiceAttack*.35,0.,1.);
   float emberScale=line(snakeScales(tube)-.5,.17);
   vec3 fire=mix(EMBER,vec3(1.,.83,.11),clamp(scales*.7+heat*.5,0.,1.));
   col+=fire*(.16+scales*.22+emberScale*(.20+heat*.85))+EMBER*(.16+rim*(.22+heat*.55));
   col+=GOLD*plates*(.14+u_voiceMid*.28);
   vec3 hc=q-serpentShoulder();
   float hoodRibs=line(sin(atan(hc.y+.043,hc.x)*22.+length(hc.xy)*18.),.10);
   col+=CYAN*hoodRibs*(.03+u_voiceAir*.24)*smoothstep(.035,.065,abs(hc.x));
  }
  if(surface.y>8.5&&surface.y<9.5){
   vec3 eye=snakeLocal(q)-vec3(0.,.589-.412,.254-.210);
   float sg=sign(eye.x);vec2 pupil=eye.xy-vec2(sg*.023,.004)-u_gaze*.10;
   float slit=1.-smoothstep(.0008,.0018,abs(pupil.x));
   col=CYAN*(.40+u_voiceAir*.40)*(1.-slit*.94)+GOLD*shine*.45;
  }
#endif
#if GHOST_COMPONENT == 0 || GHOST_COMPONENT == -1
  if(surface.y>9.5&&surface.y<10.5){
   float edge=line(sin((q.z-.075)*91.),.11);
   col=BLUE*(.65+diffuse)+CYAN*(rim*.18+shine*.3+u_voiceAir*.13);
   col+=GOLD*edge*(.12+shine*.35+u_voiceMid*.12);
  }

#endif
#if GHOST_COMPONENT == 1 || GHOST_COMPONENT == -1
  if(surface.y>10.5&&surface.y<11.5){
   float rimInlay=line(abs(q.x-.003)-.065,.0025)*smoothstep(.25,.31,q.y);
   float marks=line(sin(q.x*180.+q.z*40.),.08)*smoothstep(.29,.32,q.y);
   col=vec3(.10,.22,.27)*(diffuse+.4)+CYAN*shine*.42+GOLD*rimInlay*(.35+u_cymatics.x*.30);
   col+=GOLD*marks*.10;
  }
#endif
#if GHOST_COMPONENT == 0 || GHOST_COMPONENT == -1
  if(surface.y>11.5&&surface.y<12.5){col=vec3(.29,.10,.065)*(diffuse+.40)+GOLD*shine*.35+CYAN*rim*.08;}
#endif
#if GHOST_COMPONENT == 0 || GHOST_COMPONENT == -1
  if(surface.y>12.5&&surface.y<13.5){float spark=pow(.5+.5*sin(q.x*240.+q.y*380.+u_time*35.),8.);col=mix(CYAN,GOLD,.45)*(.5+u_teeth*.5+u_voiceAttack*1.2+spark*.35);}
  if(surface.y>13.5&&surface.y<14.5){
   float flutes=line(sin(q.x*160.+q.y*45.),.12);
   col=vec3(.09,.15,.17)*(diffuse+.55)+GOLD*(shine*.55+rim*.20);
   col+=GOLD*flutes*(.06+u_voiceMid*.20)+CYAN*rim*.14;
  }
  if(surface.y>14.5&&surface.y<15.5)col=COBALT*(.65+u_voiceMid*.65)+CYAN*shine*.35;
#endif
#if GHOST_COMPONENT == 1 || GHOST_COMPONENT == -1
  if(surface.y>15.5&&surface.y<16.5){
   float pulse=silkFlow(q);
   col=mix(COBALT,GOLD,.50+.45*sin(q.y*19.+q.x*7.))*(1.35+pulse*(u_cymatics.x+u_voiceMid)*1.10);
  }
#endif
#if GHOST_COMPONENT == 0 || GHOST_COMPONENT == -1
  if(surface.y>16.5&&surface.y<17.5){
   // Bright bronze crowns, cooler spoke recesses and a fine machinist grain.
   col=GOLD*(.35+diffuse*.58+shine*.85)+CYAN*rim*.12;
   float tool=line(sin(length(vec2(abs(q.x)-.354,q.y+.116))*1700.),.14);
   col+=GOLD*tool*.035+COBALT*u_voiceMid*.08;
  }
  if(surface.y>17.5&&surface.y<18.5){col=vec3(.055,.13,.18)*(diffuse+.4)+CYAN*(.055+shine*.26+u_voiceMid*.10);}
  if(surface.y>18.5){
   // The upper bridge grows out of the same mask alloy. Contrast develops
   // gradually toward the tip; side relief and shadow carry the shape.
   float blend=1.-smoothstep(-.075,.115,q.y);
   float bevel=pow(1.-abs(n.z),2.);
   float spine=line(q.x-.003,.0035);
   vec3 nose=vec3(.135,.265,.31)*(.50+diffuse*.83)+vec3(.30,.48,.53)*shine*.42;
   nose=mix(nose,GOLD*(.24+diffuse*.25+shine*.3),bevel*.24);
   nose+=CYAN*spine*(.035+u_voiceMid*.12)+GOLD*rim*.075;
   float nostrilShade=(1.-smoothstep(-.145,-.107,q.y))*smoothstep(.01,.028,abs(q.x-.003));
   nose*=1.-nostrilShade*.32;
   col=mix(col,nose,blend*.82);
  }
#endif
  col=vec3(1.)-exp(-col*1.4);alpha=1.;
 }
#if GHOST_COMPONENT >= 0
 if(!hit)discard;
 gl_FragDepthEXT=t/(distance+1.5);
#endif
 gl_FragColor=vec4(col,alpha);
}
`
};

// Constant specialization removes unused anatomy AND material call trees.
// All geometry still uses the same camera, field math and real depth ordering.
dreamFace.geometryShaders=[0,2,1].map(component=>
 '#extension GL_EXT_frag_depth : require\n#define GHOST_COMPONENT '+component+'\n'+dreamFace.shader);
dreamFace.shader='#define GHOST_COMPONENT -1\n'+dreamFace.shader;
