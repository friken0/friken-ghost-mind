import {creaturePerformance,limbPerformance} from './ansi-creature-performance.mjs';
import {solveAnsiLimb} from './ansi-limb.mjs';

export const nextFrikMotionSeed=seed=>(Math.imul(seed,1664525)+1013904223)>>>0;
export const priorFrikMotionSeed=seed=>Math.imul(seed-1013904223,4276115653)>>>0;
const ratio=12/7;
const point=([x,y])=>[x*ratio,y,0];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const supports=[
  {hip:[.419,.475],knee:[.402,.626],foot:[.380,.805],pole:[1,0,0]},
  {hip:[.461,.455],knee:[.503,.618],foot:[.492,.793],pole:[-1,0,0]},
].map(rest=>{
  const hip=point(rest.hip),knee=point(rest.knee),foot=point(rest.foot);
  const upper=distance(hip,knee)*1.035,lower=distance(knee,foot)*1.035;
  const neutral=solveAnsiLimb(hip,foot,upper,lower,rest.pole);
  return {...rest,hip,foot,upper,lower,neutral};
});
export function frikIdleMotion(time,seed=0){
  const face=creaturePerformance(seed^51823,time,0);
  const torso=creaturePerformance(seed^173119,time*.61,0);
  const [leftArm,leftClaw]=limbPerformance(seed,0,time);
  const [rightArm,rightClaw]=limbPerformance(seed,1,time*.93);
  const [neck,neckFlex]=limbPerformance(seed,2,time*.67);
  const phase=(seed>>>8)/16777216*Math.PI*2;
  const breath=.62*Math.sin(time*.97+phase)+.23*Math.sin(time*Math.SQRT2*.41+phase*.73)+
    .15*Math.sin(time*Math.sqrt(3)*.29+phase*1.19);
  const pelvisX=torso.weight*.004+Math.sin(time*.39+phase)*.0015;
  const pelvisY=torso.sway*.003+breath*.0017;
  const legs=supports.map((rest,index)=>{
    const [shift]=limbPerformance(seed,index+3,time*(index?.79:1.07));
    const hip=[rest.hip[0]+(pelvisX+shift*.002)*ratio,rest.hip[1]+pelvisY,0];
    const solved=solveAnsiLimb(hip,rest.foot,rest.upper,rest.lower,rest.pole);
    return {x:(solved.knee[0]-rest.neutral.knee[0])/ratio,
      y:solved.knee[1]-rest.neutral.knee[1],foot:rest.foot};
  });
  return {face,breath,pelvisX,pelvisY,legs,leftArm,leftClaw,rightArm,rightClaw,neck,neckFlex,
    jaw:Math.max(0,face.flex)*.0028,head:face.drift*.022+neckFlex*.014};
}

const weight=(x,y,cx,cy,rx,ry)=>{
  const q=Math.max(0,1-((x-cx)/rx)**2-((y-cy)/ry)**2);
  return q*q;
};
export function frikMotionSource(x,y,rig,eye){
  const originalX=x,originalY=y;
  const chest=weight(x,y,.444,.365,.103,.202);
  x-=(originalX-.444)*rig.breath*.032*chest+rig.pelvisX*chest;
  y-=(originalY-.365)*rig.breath*.016*chest+rig.pelvisY*chest;
  const neck=weight(originalX,originalY,.433,.235,.055,.117);
  x-=(rig.neck*.009+rig.neckFlex*.004)*neck;
  y-=rig.neckFlex*.003*neck;
  const planted=Math.max(0,Math.min(1,(.785-originalY)/.065));
  const nearLeg=weight(originalX,originalY,.393,.631,.060,.170)*planted;
  const farLeg=weight(originalX,originalY,.495,.634,.045,.160)*planted;
  x-=rig.legs[0].x*nearLeg+rig.legs[1].x*farLeg;
  y-=rig.legs[0].y*nearLeg+rig.legs[1].y*farLeg;
  const head=Math.max(0,Math.min(1,(.244-originalY)/.047))*
    Math.max(0,Math.min(1,(originalX-.446)/.035));
  const angle=-rig.head*head,c=Math.cos(angle),s=Math.sin(angle);
  const dx=x-eye.x,dy=y-eye.y;
  x=eye.x+c*dx-s*dy;
  y=eye.y+s*dx+c*dy;
  y-=rig.jaw*weight(originalX,originalY,.530,.223,.035,.035);
  return [x,y];
}

export function frikMotionPoint(x,y,rig,eye){
  let u=x,v=y;
  for(let i=0;i<4;i++){
    const source=frikMotionSource(u,v,rig,eye);
    u+=x-source[0];v+=y-source[1];
  }
  return [u,v];
}
