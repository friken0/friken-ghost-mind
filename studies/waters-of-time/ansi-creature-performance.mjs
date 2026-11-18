// Seeded behavior clocks. The actor, face and appendages can all finish
// a gesture without waiting for the body animation to loop.
const sat=t=>Math.min(1,Math.max(0,t));
const smooth=t=>{const a=sat(t);return a*a*(3-2*a);};
const pulse=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
function random(seed,index){
 let n=(seed^Math.imul(index+1,0x9e3779b9))|0;
 n=Math.imul(n^(n>>>16),0x21f0aaad);
 n=Math.imul(n^(n>>>15),0x735a2d97);
 return ((n^(n>>>15))>>>0)/4294967296;
}
function event(seed,time,period,min,max){
 // Jitter the edges of each seeded interval as well as its start and
 // duration; no shared cadence where a new gesture is expected to land.
 const offset=random(seed,1)*period,t=time+offset;
 let slot=Math.floor(t/period);
 const edge=i=>period*(i+.38*random(seed,i*5+27));
 if(t<edge(slot))slot--;
 const base=edge(slot),end=edge(slot+1);
 const length=min+random(seed,slot*5+31)*(max-min);
 const start=base+random(seed,slot*5+29)*Math.max(0,end-base-length);
 return {p:(t-start)/length,slot,length};
}
export function creaturePerformance(seed,time,lineage){
 const glance=event(seed^9817,time,3.25,.54,1.39);
 const close=event(seed^20732,time,4.36,.14,.31);
 const beat=event(seed^12308,time,6.5,.94,2.67);
 const twitch=event(seed^61013,time,2.23,.23,.74);
 const sign=random(seed,glance.slot+234)>.39?1:-1;
 const look=pulse(glance.p,0,.12,.68,1);
 const b=pulse(beat.p,0,.24,.60,1);
 const flavor=Math.floor(random(seed,beat.slot+80)*4);
 const flick=pulse(twitch.p,0,.18,.44,1);
 const drift=.70*Math.sin(time*(.87+random(seed,19)*.67)+random(seed,20)*6.28)+
  .30*Math.sin(time*(.31+random(seed,52)*.27)+random(seed,49)*6.28);
 const double=random(seed,close.slot+502)>.76;
 const blink=double?Math.max(pulse(close.p,0,.14,.27,.43),.85*pulse(close.p,.53,.67,.81,1)):pulse(close.p,0,.32,.54,1);
 return {lookX:sign*look,lookY:(random(seed,glance.slot+114)*2-1)*look,
  blink,aperture:1+.13*drift+.24*look,
  sway:(flavor===1?-1:1)*b,flex:(flavor===2?-1:1)*b+flick*.32,
  rise:[-.018,-.011,-.038][lineage]*b,weight:(flavor===3?-b:b*.37),
  tremor:flick,drift};
}
export function limbPerformance(seed,index,time){
 const key=(seed^Math.imul(index+3,6937))|0;
 const note=event(key,time,2.8+random(key,4)*4.5,.43,1.65);
 const flick=pulse(note.p,0,.21,.48,1);
 const phi=random(key,5)*6.28;
 const reach=Math.sin(time*(1.1+random(key,6)*1.75)+phi);
 return [reach*.22+(random(key,note.slot+11)>.5?1:-1)*flick*.90,
  .26*Math.cos(time*(.72+random(key,9)*1.2)+phi)+flick*.68];
}

export function attackPerformance(seed,take,age,{release,impact}){
 const key=(seed^Math.imul(take+1,3917))|0;
 const n=random(key,6),side=random(key,9)>.5?1:-1;
 const anticip=release*(.27+n*.25);
 const windup=pulse(age,anticip,release*.88,release,impact);
 const launch=pulse(age,release-.055,release+(impact-release)*.49,impact+.07,impact+.45+n*.28);
 const follow=pulse(age,impact+.06,impact+.18+n*.12,impact+.33,impact+.75);
 const warp=age<0?age:age+(age<release?windup*(1-smooth((age-anticip)/(release-anticip))):age<impact?launch*Math.sin(Math.PI*(age-release)/(impact-release)):0)*(n-.5)*.19;
 return {windup,launch,follow,warp,side,n,lane:(n-.5)*.15,tilt:side*(.65+random(key,19)*.75)};
}
