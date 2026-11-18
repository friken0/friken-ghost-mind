// ANSI projection of an articulated support. The joint uses the same
// triangle construction as LIFE's LifeKnee. Screen sections own their
// profile and local ink coordinates, while contacts stay in body-world units.
import {faunaCrossSections,faunaSectionSlope} from './ansi-fauna-profiles.mjs';

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const length=v=>Math.hypot(...v);
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));

export function solveAnsiLimb(hip,anchor,upper,lower,pole){
 const delta=anchor.map((v,i)=>v-hip[i]),distance=length(delta);
 const axis=distance>1e-8?delta.map(v=>v/distance):[0,1,0];
 const min=Math.abs(upper-lower),max=upper+lower;
 const epsilon=max*1e-6;
 const reach=clamp(distance,min+epsilon,max-epsilon);
 const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
 const height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const strip=v=>{
  const parallel=dot(v,axis);
  return v.map((n,i)=>n-parallel*axis[i]);
 };
 let bend=strip(pole);
 if(length(bend)<1e-8)bend=strip(Math.abs(axis[0])<.8?[1,0,0]:[0,0,1]);
 const bendLength=length(bend);
 const knee=hip.map((v,i)=>v+along*axis[i]+height*bend[i]/bendLength);
 const foot=reach===distance?anchor:hip.map((v,i)=>v+reach*axis[i]);
 return {knee,foot};
}

// Continuous screen-space cross sections, with front depth and a surface
// normal. Bend uses CraftCurveTube's parabolic centerline. The silhouette
// samples the whole profile at every render pass, without a segment count.
export function ansiLimbSection(start,end,{width,depth,curve=0,belly=0,cap=5,section=faunaCrossSections.saddle}){
 const [x,y,z]=start,[ex,ey,ez]=end,dx=ex-x,dy=ey-y;
 const span=Math.hypot(dx,dy);
 if(span<1e-4)return null;
 const co=dx/span,si=dy/span;
 const [w0,w1]=width,[d0,d1]=depth;
 const maxWidth=Math.max(w0,w1)+Math.abs(belly);
 const pad=maxWidth+Math.abs(curve)+cap;
 const bounds=[Math.min(x,ex)-pad,Math.min(y,ey)-pad,Math.max(x,ex)+pad,Math.max(y,ey)+pad];
 const front=Math.max(z,ez)+Math.max(d0,d1);
 function sample(px,py,out){
  const ax=px-x,ay=py-y;
  const longitudinal=ax*co+ay*si,t=clamp(longitudinal/span,0,1);
  const transverse=ay*co-ax*si;
  const center=4*curve*t*(1-t),radius=w0+(w1-w0)*t+4*belly*t*(1-t);
  const across=(transverse-center)/radius,endCap=(longitudinal-span*t)/cap;
  const cover=1-across*across-endCap*endCap;
  if(cover<=0)return -Infinity;
  const d=d0+(d1-d0)*t;
  const slope=(w1-w0+4*belly*(1-2*t))/span;
  const bendSlope=4*curve*(1-2*t)/span;
  const capWidth=Math.sqrt(1-endCap*endCap),v=across/capWidth,a=Math.abs(v);
  const height=section(a),profileSlope=faunaSectionSlope(section,a);
  const transverseSlope=d*profileSlope*Math.sign(v)/radius;
  const longitudinalSlope=endCap===0?
   (ez-z+(d1-d0)*height)/span-transverseSlope*(bendSlope+across*slope):
   -d*endCap*(height-a*profileSlope)/(cap*capWidth);
  const norm=1/Math.hypot(longitudinalSlope,transverseSlope,1);
  out[0]=t;out[1]=v;
  out[2]=(-co*longitudinalSlope+si*transverseSlope)*norm;
  out[3]=(-si*longitudinalSlope-co*transverseSlope)*norm;
  out[4]=norm;
  return z+(ez-z)*t+d*capWidth*height;
 }
 return {bounds,front,sample};
}
