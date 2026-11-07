/* Friktal postmark bloom v1. An authored implicit field with a conservative
 * step, a bounded camera intersection, and a sealed circuit as its seed.
 * Object-space growth and shading. No textures, external inputs or old rose. */
export const postmarkBloomFragment = `precision highp float;
uniform vec2 uResolution,uPointer,cgOrbit;
uniform vec4 uAudio;
uniform vec3 uCircuit;
uniform float uTime,uGrowth,cgZoom;
const float TAU=6.2831853;
mat2 turn(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float ell(vec3 p,vec3 r){float a=length(p/r),b=length(p/(r*r));return b<.001?-min(r.x,min(r.y,r.z)):a*(a-1.)/b;}
float ball(vec3 p,float r){return length(p)-r;}
vec2 join(vec2 a,vec2 b){return a.x<b.x?a:b;}
float band(float lo,float hi,float x){return smoothstep(lo,hi,x);}
vec3 prism(float phase){
  return .55+.45*cos(TAU*(phase+vec3(.02,.34,.68)));
}
float stem(vec3 p){
  float y=clamp(p.y,-.82,.27);
  vec2 axis=vec2(.085*sin((y+.7)*3.7)-.047,.06*sin((y+.82)*4.1));
  return length(vec3(p.xz-axis,p.y-y))-(.047-.014*band(-.82,.26,y));
}
vec2 leaf(vec3 p,float side,float age){
  float y=side>0.?-.30:-.51;
  vec3 q=p-vec3(side*.26*age,y,-.015);
  q.x*=side;
  q.xy=turn(.34)*q.xy;
  q.y+=.26*q.x*q.x;
  q.z+=.16*q.x;
  return vec2(ell(q,vec3(.31*age+.01,.036,.11*age+.009)),2.);
}
// Fold around an anchored crown. Each whorl has its own opening phase,
// hinge angle and cross section. The notch carves two lobes into each tip.
vec2 petal(vec3 p,float phase,float tier,float count,float flutter){
  float a=atan(p.z,p.x),stepAngle=TAU/count;
  float twist=tier*.43+uCircuit.x*.18;
  float sector=floor((a-twist)/stepAngle+.5);
  float angle=sector*stepAngle+twist;
  vec2 radial=turn(angle)*p.xz;
  float bend=mix(1.45,.21+tier*.12+uCircuit.z*.185,phase)+flutter;
  vec2 edge=turn(bend)*vec2(radial.x-.085,p.y-(.22+tier*.045));
  float span=mix(.25,.63-tier*.145,phase);
  vec3 q=vec3(edge.x-span*.70,edge.y,radial.y);
  float u=q.x/span;
  q.y-=.12*u*u-.038*sin(u*3.5);
  float scoop=1.-.30*clamp(u,0.,1.);
  float shell=ell(q,vec3(span,.038-tier*.005,mix(.091,.237-tier*.036,phase)*scoop));
  float cut=ell(q-vec3(span*.94,-.085,0.),vec3(.12,.28,.040+phase*.018));
  return vec2(max(shell,-cut),3.+tier);
}
vec2 field(vec3 p){
  float age=band(.04,.42,uGrowth);
  vec2 d=vec2(stem(p),1.);
  d=join(d,leaf(p,1.,age));
  d=join(d,leaf(p,-1.,age));
  vec3 q=p-vec3(.022,.217,0.);
  float a=atan(q.z,q.x);
  float calyx=ell(q,vec3(.196+.018*cos(a*6.),.113,.196+.018*cos(a*6.)));
  d=join(d,vec2(calyx,2.));
  float outer=band(.16,.76,uGrowth),inner=band(.34,.96,uGrowth);
  float bass=smoothstep(.015,.60,sqrt(uAudio.x));
  float sway=bass*(.11+.08*cos(a*2.+uTime*2.5))*sin(a*2.-uTime*2.1)*outer;
  d=join(d,petal(p,outer,0.,6.,sway));
  d=join(d,petal(p,inner,1.,5.,sway*.48));
  vec3 bud=p-vec3(.024,.49-mix(0.,.151,inner),0.);
  float husk=ell(bud,vec3(mix(.23,.17,outer),mix(.23,.082,outer),mix(.23,.17,outer)));
  float groove=pow(max(0.,cos(a*6.)),9.)*.022*(1.-outer);
  float cup=ell(bud-vec3(0.,.091,0.),vec3(.125,.10,.125));
  d=join(d,vec2(max(husk+groove,-cup),6.));
  // One seated anther ring; the negative space inside the cup stays open.
  float spoke=TAU/9.,tipAngle=floor((a+spoke*.5)/spoke)*spoke;
  vec3 k=vec3(turn(tipAngle)*bud.xz,bud.y).xzy;
  k-=vec3(.106,.065*inner,.0);
  if(inner>.08)d=join(d,vec2(ball(k,.025*inner),7.));
  return d;
}
vec3 normalAt(vec3 p){
  vec2 e=vec2(.0017,-.0017);
  return normalize(e.xyy*field(p+e.xyy).x+e.yyx*field(p+e.yyx).x+
    e.yxy*field(p+e.yxy).x+e.xxx*field(p+e.xxx).x);
}
float hash(vec2 p){return fract(sin(dot(p,vec2(61.7,113.3)))*48317.2);}
void main(){
  vec2 uv=(gl_FragCoord.xy-uResolution*.5)/uResolution.y;
  float ratio=uResolution.x/uResolution.y;
  float bass=smoothstep(.015,.60,sqrt(uAudio.x));
  float mids=smoothstep(.02,.62,sqrt(uAudio.y));
  float highs=smoothstep(.02,.64,sqrt(uAudio.z));
  float flux=max(mids,bass*.78)*smoothstep(.28,.88,uGrowth);
  vec3 bg=vec3(.011,.021,.047)+vec3(.039,.034,.083)*exp(-length(uv*vec2(1.,1.7))*.9);
  vec2 pix=uv*95.;
  float star=step(.993,hash(floor(pix)))*pow(max(0.,1.-length(fract(pix)-.5)*2.),3.);
  bg+=vec3(.34,.62,.90)*star;
  float halo=length((uv-vec2(0.,.04))*vec2(1.,1.34));
  bg+=vec3(.13,.20,.32)*exp(-120.*abs(halo-.42))*.37;
  bg+=vec3(.15,.08,.29)*exp(-23.*abs(halo-.44))*(.10+.19*uAudio.y);
  float angle=atan(uv.y,uv.x),radial=length(uv);
  float arm=.5+.5*cos(5.*angle+11.*log(.14+radial)-uTime*.22);
  bg+=mix(vec3(.095,.054,.18),prism(angle/TAU+radial-uTime*.078)*.38,flux)*
    pow(arm,4.)*exp(-4.5*abs(radial-.34))*(.23+.76*flux);
  float haloPhase=halo-.44-.038*bass*sin(6.*angle-uTime*2.);
  float braid=exp(-90.*abs(haloPhase))*pow(.55+.45*cos(7.*angle+uTime*.9),2.);
  bg+=prism(angle/TAU+halo*2.-uTime*.13)*braid*flux*(.23+.46*highs);
  float az=cgOrbit.x+uPointer.x*.24+uTime*.072+.21;
  float el=clamp(cgOrbit.y+uPointer.y*.12,-1.1,1.0)+.53;
  vec3 eye=vec3(cos(el)*sin(az),sin(el),cos(el)*cos(az))*3.75;
  vec3 f=normalize(vec3(0.,.02,0.)-eye),right=normalize(cross(f,vec3(0.,1.,0.))),up=cross(right,f);
  vec3 ray=normalize(f+(right*uv.x+up*uv.y)*.94*cgZoom/max(.62,min(1.,ratio)));
  float b=dot(eye,ray), discriminant=b*b-dot(eye,eye)+1.69;
  if(discriminant<0.){gl_FragColor=vec4(pow(bg,vec3(.83)),1.);return;}
  float root=sqrt(discriminant),t=max(0.,-b-root),limit=-b+root;
  vec3 p=eye;vec2 hit=vec2(1.,0.);
  for(int i=0;i<72;i++){
    p=eye+ray*t;hit=field(p);
    if(hit.x<.00145||t>limit)break;
    t+=max(.0008,hit.x*.61);
  }
  vec3 col=bg;
  if(hit.x<.00145&&t<=limit){
    vec3 n=normalAt(p),light=normalize(vec3(-.62,.81,.66));
    float lambert=max(0.,dot(n,light)),rim=pow(1.-max(0.,dot(n,-ray)),2.6);
    float highlight=max(0.,dot(n,normalize(light-ray)));
    float a=atan(p.z,p.x),r=length(p.xz),strand=sin(a*23.+r*23.);
    vec3 base,edge;float gloss;
    if(hit.y<1.5){base=vec3(.07,.25,.17)*(.88+.12*strand);edge=vec3(.12,.45,.30);gloss=31.;}
    else if(hit.y<2.5){
      float ribs=exp(-17.*abs(sin(p.x*26.+abs(p.z)*41.)));
      base=mix(vec3(.035,.25,.19),vec3(.20,.61,.36),ribs*.55);
      edge=vec3(.20,.52,.31);gloss=39.;
    }else if(hit.y<5.5){
      float tine=hit.y-3.,tip=band(.27,.69,r);
      vec3 low=mix(vec3(.21,.11,.40),vec3(.35,.075,.28),uCircuit.x);
      vec3 high=mix(vec3(.43,.72,1.),vec3(.98,.55,.70),uCircuit.x);
      float veins=exp(-22.*abs(sin(a*(12.+tine*3.+(1.-uCircuit.y)*3.)+.63*sin(r*16.))));
      float pulse=pow(.5+.5*cos(17.*r+a*.95-uTime*2.8),2.2);
      float wavePhase=r*.89+a/TAU+.19*tine-uTime*.19;
      vec3 ribbon=prism(wavePhase+.10*cos(8.*r-uTime*1.8));
      base=mix(low,high,tip*.85+.10)*(1.+.11*strand);
      base=mix(base,base*.38+ribbon*.88,flux*(.27+.53*pulse));
      base+=mix(vec3(.15,.57,.64),prism(wavePhase+.28),flux)*veins*
        (.18+(.55+.42*(1.-uCircuit.y))*mids*pulse);
      base+=prism(wavePhase-.17)*tip*highs*pulse*.24;
      edge=mix(mix(vec3(.38,.77,.99),vec3(1.,.69,.63),uCircuit.x),ribbon,flux*.7);gloss=54.;
    }else{
      float cup=hit.y>6.5?1.:.36;
      base=vec3(.72,.36,.13)*cup;edge=vec3(1.,.74,.31)*cup;gloss=61.;
      if(hit.y<6.5){
        float seam=exp(-18.*abs(sin(a*3.)));
        base=mix(vec3(.43,.21,.18),vec3(.93,.54,.25),seam);
        edge=vec3(.90,.60,.25)*(.5+.5*seam);
      }
      base+=mix(edge,prism(a/TAU-uTime*.18),flux)*highs*.55;
    }
    float cavity=clamp(field(p+n*.035).x/.031,.36,1.);
    col=base*(.33+.72*lambert)*cavity+edge*(rim*.31+pow(highlight,gloss)*.46);
  }
  gl_FragColor=vec4(pow(max(col,0.),vec3(.83)),1.);
}`;
