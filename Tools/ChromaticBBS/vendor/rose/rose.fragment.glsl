
precision highp float;
uniform vec2 uResolution,uPointer,uModes;
uniform float uTime;
uniform vec4 uAudio;
const float PI=3.14159265359;
const float GOLDEN=2.3999632297;
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec3 spectrum(float hue){return clamp(abs(fract(hue+vec3(0.0,0.6666667,0.3333333))*6.0-3.0)-1.0,0.0,1.0);}
// Seven finite golden-angle whorls, intersected as curved parametric surfaces.
// Folding each whorl produces 5..11 petals, without an expensive empty-space march.
vec3 petal(vec2 xy,float fi,float scale){
 float angle=atan(xy.y,xy.x),count=5.0+fi,stepAngle=2.0*PI/count;
 float twist=fi*GOLDEN+uAudio.y*0.10*sin(fi*1.7);
 float sector=floor((angle-twist)/stepAngle+0.5);
 vec2 local=rot(twist+sector*stepAngle)*xy;
 vec2 q=vec2((local.x-scale*.51)/(scale*.58),local.y/(scale*.33));
 q.y*=1.0+.13*q.x;
 float boundary=length(q)-1.0;
 q=clamp(q,vec2(-1.4),vec2(1.4));
 float fold=.012*sin(q.x*19.+fi*2.)*q.y*q.y;
 float tip=max(q.x,0.);
 float height=.055*fi+.08+scale*(.17*q.x*q.x+.15*tip*tip*tip+.14*q.y*q.y+fold);
 height+=scale*(uAudio.x*.10*sin(q.x*4.5+fi*1.1)+uAudio.y*.04*cos(q.y*9.+fi));
 return vec3(boundary,height,fi+sector*.017);
}
float veins(vec2 p){
 float r=length(p),a=atan(p.y,p.x);vec2 q=vec2(a*2.2,log(r+0.035)*2.8);float v=0.0,amp=.55;
 for(int i=0;i<4;i++){q=abs(fract(q+.5)-.5)*2.0;v+=amp*exp(-32.0*abs(q.x-q.y*.43));q=rot(GOLDEN)*q*1.92+vec2(.17,.29);amp*=.45;}
 return v;
}
void main(){
 vec2 uv=(gl_FragCoord.xy-uResolution*.5)/min(uResolution.x,uResolution.y);
 float t=uTime*.065;
 vec3 ro=vec3(0.0,-2.7,3.7);ro.xz=rot(uPointer.x*.42)*ro.xz;ro.yz=rot(uPointer.y*.24)*ro.yz;
 vec3 target=vec3(0.0,0.0,.20),ww=normalize(target-ro),uu=normalize(cross(ww,vec3(0.,0.,1.))),vv=cross(uu,ww);
 vec3 rd=normalize(uu*uv.x+vv*uv.y+ww*1.78);
 // Solve seven height surfaces along the camera ray; keep the nearest petal.
 vec3 rayOrigin=ro,rayDirection=rd;rayOrigin.xy=rot(t)*ro.xy;rayDirection.xy=rot(t)*rd.xy;
 float nearest=100.,layer=0.,layerScale=1.13,scale=1.13;vec3 p=vec3(0.),n=vec3(0.,0.,1.);vec2 hit=vec2(0.);bool found=false;
 for(int j=0;j<7;j++){
  float fi=float(j),travel=(.055*fi+.20-rayOrigin.z)/rayDirection.z;vec3 surface=vec3(0.);
  for(int k=0;k<7;k++){vec2 xy=(rayOrigin+rayDirection*travel).xy;surface=petal(xy,fi,scale);travel=mix(travel,(surface.y-rayOrigin.z)/rayDirection.z,.75);}
  vec3 point=rayOrigin+rayDirection*travel;surface=petal(point.xy,fi,scale);
  if(surface.x<0.0&&abs(point.z-surface.y)<.018&&travel>0.&&travel<nearest){nearest=travel;p=point;layer=fi;layerScale=scale;hit=vec2(0.,surface.z);found=true;}
  scale*=.74;
 }
 if(found){float e=.002;float h=petal(p.xy,layer,layerScale).y;float hx=petal(p.xy+vec2(e,0.),layer,layerScale).y;float hy=petal(p.xy+vec2(0.,e),layer,layerScale).y;n=normalize(vec3(-(hx-h)/e,-(hy-h)/e,1.));}
 float r=length(uv),a=atan(uv.y,uv.x),vig=exp(-1.4*dot(uv,uv));
 vec3 col=vec3(.007,.006,.022)+spectrum(a/(PI*2.)+.15+uAudio.y*.15)*.025*vig;
 // Nodal interference and a braided harmonic halo: musical bands control colour.
 float node=cos(uModes.x*uv.x*7.)*cos(uModes.y*uv.y*7.)-cos(uModes.y*uv.x*7.)*cos(uModes.x*uv.y*7.);
 col+=spectrum(node*.15+a*.11+uAudio.y*.7)*exp(-32.*abs(node))*(.03+uAudio.y*.2)*vig;
 float braid=r-(.45+.035*cos(a*5.+t)+.02*sin(a*8.-t)+uAudio.x*.035);
 col+=spectrum(a/(2.*PI)+uAudio.x*.65+uAudio.z*.5)*exp(-140.*abs(braid))*(.18+uAudio.w*.4);
 if(found){
  vec3 view=normalize(-rd);view.xy=rot(t)*view.xy;
  vec3 light=normalize(vec3(-.5,-.8,1.8));
  float diffuse=.22+.65*abs(dot(n,light)),rim=pow(1.-abs(dot(n,view)),2.7),spec=pow(max(dot(n,normalize(light+view)),0.),48.);
  float radial=length(p.xy),angle=atan(p.y,p.x);
  float cymatic=cos(uModes.x*p.x*5.)*cos(uModes.y*p.y*5.)-cos(uModes.y*p.x*5.)*cos(uModes.x*p.y*5.);
  float nodal=exp(-22.*abs(cymatic)),micro=veins(p.xy);
  // The music directly moves hue, nodal colour, iridescence and petal shape.
  float hue=hit.y*.139+angle*.105+radial*.16+uAudio.x*.38+uAudio.y*.51+uAudio.z*.79;
  vec3 pigment=spectrum(hue)*.92+vec3(.045,.014,.055);
  float silk=.86+.14*sin(radial*78.-angle*11.+hit.y*2.);
  col=pigment*diffuse*silk;
  col+=spectrum(hue+.30+cymatic*.09)*nodal*(.15+uAudio.y*.65);
  col+=spectrum(hue+.48+uAudio.z*.2)*micro*(.17+uAudio.z*.50);
  col+=spectrum(hue+.18)*rim*(.32+uAudio.x*.65);
  col+=mix(pigment,vec3(1.),.45)*spec*.6;
  if(hit.y>6.8)col+=spectrum(uAudio.x+uAudio.z)*.65;
 }
 col+=spectrum(a*.16+uAudio.x*.5+uAudio.z*.7)*exp(-8.*abs(r-.32))*(.01+uAudio.w*.04);
 // Golden-angle pollen orbiting the flower, with treble-driven colour.
 for(int k=0;k<14;k++){float fk=float(k),pa=fk*GOLDEN+t*.22;vec2 pollen=vec2(cos(pa),sin(pa))*(.50+fk*.009);col+=spectrum(fk*.17+uAudio.z*.8)*exp(-length(uv-pollen)*250.)*(.18+uAudio.z*.6);}
 col=pow(max(col/(1.+.25*max(col.r,max(col.g,col.b))),vec3(0.)),vec3(.88));
 gl_FragColor=vec4(col,1.0);
}
