// The lens shape is drawn from the public-domain NASA frame STS088-724-66.
// Coordinates describe the cranked shoulder, broad chipped heel and long lower spar.
import {globeAtlas} from './frik-planet-atlas.mjs';
import {clamp,mix,smooth} from './ansi-frik-color.mjs';
export const crossing=[
 ['Earth · 1899','We called it the Black Knight. It passed over Earth long before anyone thought to listen. Every time it crosses Colorado, three pulses fall out of the sky.'],
 ['Colorado Springs · The receiver','Nikola Tesla disconnects his transmitter. The needle jumps anyway. On a strip of paper he marks three strokes. The next three land right on top of them.'],
 ['The Black Knight · A thousand years','The Black Knight sent us plans for a gate to a planet we named New Earth. For a thousand years, one crew finished its shift and another took its place.'],
 ['Earth orbit · Launch day','Every city turns its lights on for the first colony ship. A girl at our aft window waves a paper Earth. A billion people wave back.'],
 ['New Earth · Aft window','We cross. From this side, Earth fits inside the ring. A white line passes through the Pacific. The two halves drift apart. The girl keeps waving.'],
 ['Colony ship · Contact astern','A machine follows us through. A second ship is chasing it. A sheet of red light crosses our bunks. One by one, our names appear on the machine.'],
 ['Frik cutter · Archive interrupted','The pursuer pours an ocean of memories into the scan. The machine tries to file every life at once. Its shield opens. A thin cutting beam goes clean through.'],
 ['First contact · The Waters','A claw dips into a bowl aboard the ship that saved us. Our receiver fills with the smell of rain. I’m Friken.Ghost, Captain. I can show you what came through.'],
];
// Instruments in the shot carry the same VGA glyphs as the BBS. They are
// attached to scene coordinates, so inspection keeps the labels on the objects.
export function paintCrossingInstruments(put,state){
 const f=state.levels[0].data,n=f.prologue;
 if(n<0||n>6)return;
 const project=(v,center)=>.5+(v-center)/state.window;
 const sign=(label,x,y,size,color,alpha=1)=>put.glyph(label,project(x,state.x),project(y,state.y),
  size/state.window,color,{maxSize:36,alpha});
 const t=f.time;
 if(n===0){
  sign('EARTH   /   NIGHT PASS',.185,.16,.013,'#bcd6d0');
  sign('·   ·   ·',.515,.415,.026,'#b8f3db',.55+.35*Math.cos(t*2));
 }else if(n===1){
  sign('COLORADO SPRINGS',.68,.484,.012,'#3a2931');
  sign('I   I   I',.74,.751,.012,'#3f3544');
 }else if(n===2){
  sign('ORBITAL YARD   /   GATE 01',.24,.16,.013,'#e8cb94');
  const lamps=2+Math.floor((.5+.5*Math.sin(t*.23))*6);
  sign('▥'.repeat(lamps)+'░'.repeat(8-lamps),.34,.61,.024,'#e9b974');
 }else if(n===3){
  sign('FIRST CROSSING',.31,.147,.020,'#ffe3a1');
  sign('GODSPEED FROM HOME',.309,.19,.013,'#a7dbce');
 }else if(n===4){
  sign('AFT GLASS  /  EARTH',.48,.126,.012,'#c0e8eb');
 }else if(n===5){
  const roll=['01  WALLACE, M.','02  CHEN, Y.','03  OKAFOR, A.','04  RAO, K.'];
  sign('SCAN   /   HUMAN',.72,.53,.016,'#ffc3a0');
  for(let i=0;i<3;i++)sign(roll[(i+Math.floor(t*.65))%4],.72,.565+.033*i,.012,'#ff9282',1-i*.15);
 }else{
  const memories=['FIRST RAIN','SISTER AT THE DOOR','HATCHLING','TIDE TABLE','LAST MORNING'];
  for(let i=0;i<5;i++){
   const phase=(t*.14+i/5)%1;
   sign(memories[i],.82-phase*.22,.24+phase*.14-.047*Math.sin(i+phase*5),.009,'#b0ebd6',Math.sin(phase*Math.PI));
  }
  sign('SCAN INTERRUPTED',.64,.61,.013,'#edc59a');
 }
}
export function globeChannel(u,v,world,channel){
 const x=(u-Math.floor(u))*384,y=clamp(v)*191;
 const ix=Math.floor(x),iy=Math.floor(y),jx=(ix+1)%384,jy=Math.min(191,iy+1);
 const base=world*384*192,fx=x-ix,fy=y-iy;
 const read=(a,b)=>globeAtlas[(base+b*384+a)*4+channel];
 return ((1-fx)*read(ix,iy)+fx*read(jx,iy))*(1-fy)+((1-fx)*read(ix,jy)+fx*read(jx,jy))*fy;
}
export function globeInk(dx,dy,t,world){
 const r=dx*dx+dy*dy,z=Math.sqrt(Math.max(0,1-r)),lat=dy*.984+z*.178;
 const u=Math.atan2(dx,z*.984-dy*.178)/(2*Math.PI)+.5,v=Math.asin(Math.max(-1,Math.min(1,lat)))/Math.PI+.5;
 const spin=t*.0038+(world===0?-.16:0),land=globeChannel(u+spin,v,world,0)/185,water=globeChannel(u+spin,v,world,1)/17;
 const low=globeChannel(u+spin*.71,v,world,2)/255,high=globeChannel(u+spin*1.32,v,world,3)/255;
 const sun=clamp(.29-.44*dx-.20*dy+.59*z);
 let color=mix(mix(world?0x1c514c:0x274c3c,world?0xa4b995:0xc7b67d,land),mix(0x3a9baf,0x123564,water),clamp(water*16));
 color=mix(color,0xe1ece0,smooth((Math.abs(lat)-.82)*8)*.90);
 color=mix(color,0xf0eddb,clamp(low*.94+high*.61));
 color=mix(0x071028,color,sun);
 return mix(color,0x80d9f1,clamp((r-.87)*6)*(.30+.49*sun));
}
export function knightInk(u,v,under){
 if(v<0||v>1||u<-.40||u>.49)return under;
 // Horizontal silhouette intervals, traced top to bottom through the folded outline.
 let left=0,right=0;
 for(const [y0,y1,l0,l1,r0,r1] of [[0,.075,-.08,-.08,-.08,.19],[.075,.18,-.08,-.07,.19,.32],[.18,.32,-.07,-.12,.32,.31],[.32,.42,-.12,-.22,.31,.39],[.42,.59,-.22,-.36,.39,.17],[.59,.655,-.36,-.22,.17,.10],[.655,.75,-.22,-.32,.10,.07],[.75,.86,-.32,-.15,.07,.04],[.86,.92,-.15,-.02,.04,.035],[.92,1,-.02,-.025,.035,-.025]]){
  if(v>=y0&&v<=y1){const q=(v-y0)/(y1-y0);left=l0+(l1-l0)*q;right=r0+(r1-r0)*q;}
 }
 if(u<left||u>right)return under;
 const d=(u-left)/Math.max(.0001,right-left);
 let ink=mix(0x050913,0x4c5966,clamp(.18+.34*Math.cos(12*d+v*6)+.29*d));
 if(Math.abs(d-.76+.08*Math.sin(v*6))<.038)ink=mix(ink,0xb6aba7,.71);
 if(d>.948)ink=0xc3ccc5;
 return ink;
}
function courierHull(x,y,f,under){
 const width=.12+.65*Math.sqrt(Math.max(0,1-x*x))*(1-.42*x);
 if(Math.abs(x)>1||Math.abs(y)>width)return under;
 const cylinder=Math.sqrt(Math.max(0,1-(y/width)**2));
 let ink=mix(0x20283b,0xd4c4a8,clamp(.12+.80*cylinder-.28*y));
 const ribs=Math.abs((x+.67)*11-Math.round((x+.67)*11));
 if(x>-.69&&x<.47&&ribs<.095)ink=mix(ink,0x464957,.76);
 if(x>.40&&x<.83&&y<0)ink=mix(ink,0x548c9a,.80);
 if(Math.abs(y+.075)<.083&&x<.26&&ribs>.27)ink=0xffcf79;
 return ink;
}
export function crossingInk(x,y,f){
 const chapter=f.prologue,t=f.time;
 const drift=Math.sin(t*.16),pulse=.5+.5*Math.cos(t*2.1);
 let ink=mix(0x030819,0x183952,clamp(.07+.45*y+.13*Math.sin(3*x+4*y)));
 const sx=x+.005*drift,sy=y+.002*Math.cos(t*.18);
 const a=Math.floor(sx*82),b=Math.floor(sy*48);
 const star=Math.cos(a*27+b*13)*Math.cos(b*37-a*11);
 if(star>.905&&Math.abs(sx*82-a-.5)+Math.abs(sy*48-b-.5)<.23)ink=mix(ink,0xe0e9cc,.52+.4*star);
 if(chapter===1){
  const horizon=.54+.09*Math.cos(x*7)+.023*Math.sin(x*29);
  if(y>horizon)ink=mix(0x24263a,0x091123,clamp((y-horizon)*4));
  const tower=Math.abs(x-.28),height=.65-y;
  if(height>0&&height<.51&&tower<.006+.047*(1-height/.51)){
   ink=mix(0x704740,0xe0af78,clamp(.75-tower*10));
   if(tower>.005&&Math.abs(Math.sin(height*96+tower*142))<.6)ink=0x212333;
  }
  const torus=((x-.28)/.068)**2+((y-.164)/.025)**2;
  if(torus<1)ink=mix(0xa27c62,0xffdca6,1-torus);
  if(y>.43&&y<.73&&x>.48&&x<.88){
   ink=mix(0x272839,0x927f65,clamp(.57+(x-.66)*1.7));
   const dial=((x-.67)/.14)**2+((y-.60)/.135)**2;
   if(dial<1&&y<.635){
    ink=mix(0xaa9773,0xf0d69e,1-dial);
    if(Math.abs(y-.642+(x-.65)*(.86+.56*pulse))<.005&&x>.65)ink=0x632b33;
    if(dial>.76&&Math.cos(Math.atan2(y-.60,x-.67)*27)>.62)ink=0x734d3a;
   }
  }
  // Receiver windings, terminal screws, a paper roll and three inked contact marks.
  if(x>.117&&x<.43&&y>.63&&y<.72){
   const w=(x-.117)/.313;
   ink=mix(0x613444,0xdb9263,clamp(.49+.38*Math.cos(w*135)-(y-.67)*3));
  }
  if(x>.46&&x<.91&&y>.725&&y<.775){
   ink=mix(0xddcba3,0x877961,clamp((y-.725)*11));
   const ticks=Math.abs(Math.sin((x-t*.009)*59));
   if(ticks<.12&&Math.cos((x-t*.009)*19)>.02&&y<.757)ink=0x383746;
  }
  // A three-quarter silhouette leans into the receiver, with one hand still on the switch.
  const head=((x-.395)/.029)**2+((y-.418)/.067)**2;
  const collar=((x-.382)/.060)**2+((y-.550)/.093)**2;
  if(collar<1)ink=mix(0x162234,0x465060,clamp(.68-(x-.38)*5+(y-.54)*1.8));
  if(head<1)ink=mix(0x352d39,0xc69b72,clamp(.46+(x-.397)*12+Math.sqrt(1-head)*.42));
  if(head<1&&y<.402+.009*Math.cos(x*127))ink=0x302d39;
  const nose=Math.abs(y-.426+.24*(x-.419));
  if(x>.415&&x<.432&&nose<.008)ink=0xbd9072;
  if(x>.406&&x<.423&&Math.abs(y-.446)<.004)ink=0x352832;
  const sleeve=Math.abs(y-.555+.25*(x-.41));
  if(x>.409&&x<.519&&sleeve<.017)ink=mix(0x343a48,0x8b847c,clamp(.8-sleeve*33));
  if(x>.501&&x<.544&&sleeve<.010)ink=0xc99c75;
  const signal=Math.abs(y-.32+.07*Math.sin(x*41-t*4)*Math.max(0,Math.cos(x*15-t)));
  if(x>.32&&x<.87&&signal<.004)ink=0x9de6dc;
  return ink;
 }
 const earthX=chapter===0?.30:chapter===2?.23:chapter===3?.15:chapter===4?.53:.09;
 const earthY=chapter===0?.83:chapter===2?.72:chapter===3?.78:chapter===4?.40:.30;
 const radius=chapter===0?.54:chapter===4?.185:chapter<=3?.30:.12;
 const dx=(x-earthX)/radius,dy=(y-earthY)/(radius*1.72);
 const crack=dy+.63*dx+.057*Math.sin(dx*13);
 const split=chapter===4?.18*smooth(f.beatAge/5.4):0;
 const hx=dx+(crack>0?-split*.22:split*.22),hy=dy+(crack>0?-split:split),r=hx*hx+hy*hy;
 const fissure=hy+.63*hx+.039*Math.sin(hx*16)+.010*Math.cos(hx*46);
 if(r<1.03){
  ink=globeInk(hx,hy,t,chapter>=5?1:0);
  if(r>1)ink=mix(ink,0x132f48,clamp((r-1)*31));
  if(chapter===4){
   const edge=crack>0?fissure:-fissure;
   if(edge<0){
    ink=mix(0x080e20,0x753b36,Math.exp(edge*29)*.66);
    const debris=Math.sin(hx*71+hy*143)*Math.cos(hx*137-hy*61+t*.13);
    if(debris>.89&&split>.04)ink=mix(0x967257,0xffba81,debris*.55);
   }else{
    const lava=Math.exp(-edge*47)*smooth(f.beatAge*1.1);
    ink=mix(ink,0xffc078,lava);
    const fault=Math.abs(fissure+.17*Math.sin(hx*6)-.075*Math.cos(hx*18));
    if(edge<.31&&fault<.009)ink=mix(ink,0xfa925a,(1-edge/.31)*smooth(f.beatAge/2));
   }
   const lance=Math.abs(crack+.004*Math.sin(dx*51));
   if(lance<.018&&f.beatAge<3.2)ink=mix(ink,0xffecb7,clamp((3.2-f.beatAge)*1.4));
  }
 }
 if(chapter===0){
  const range=Math.hypot((x-.65)*1.72,y-.44);
  const ping=range-t*.058,tip=Math.abs(ping-Math.floor(ping/.43)*.43-.08);
  if(x<.65&&tip<.004)ink=mix(ink,0x9fe3dc,.45*smooth((.65-x)*12));
  return knightInk((x-.66-drift*.006)/.194,(y-.135)/.51,ink);
 }
 if(chapter>=2&&chapter<=4){
  const cx=chapter===4?.53:.61,cy=chapter===4?.40:.43;
  const gx=(x-cx)/.235,gy=(y-cy)/.355;
  const ring=Math.hypot(gx,gy),angle=Math.atan2(gy,gx);
  if(ring>.91&&ring<1.11){
   const panel=.5+.5*Math.cos(angle*64);
   ink=mix(0x293448,0xc49c65,clamp(.57-gx*.27-gy*.27+.16*panel));
   if(panel<.06)ink=0x18283e;
   if(ring<.947)ink=chapter===2&&angle>.85?0x413445:0x9df6eb;
   if(chapter===2&&angle>.85&&Math.cos(angle*35+ring*36)<.14)ink=0x111a2a;
  }
  if(chapter===2){
   const yard=Math.abs(y-.68+.24*(x-.50));
   if(x>.13&&x<.77&&yard<.023)ink=mix(0x253339,0xcba575,.45+.30*Math.cos(x*180));
   for(const k of [0,1,2]){
    const px=.32+k*.073,py=.70-k*.023;
    if(Math.abs(x-px)<.004&&y>py-.11&&y<py)ink=0xbf955f;
    if(Math.abs(y-py+.10+.14*(x-px))<.004&&x>px-.03&&x<px+.029)ink=0xffcb80;
   }
  }
  if(chapter===3){
   const spark=Math.abs(Math.sin((x-.20)*101+(y-.41)*43));
   if(x>.06&&x<.35&&y>.31&&y<.60&&spark>.992)ink=mix(ink,0xffbb7b,pulse*.7);
   // Far-side harbour flares open in spokes above the cheering dock.
   for(const k of [0,1,2]){
    const ax=x-.19-.10*k,ay=(y-.28-.057*Math.cos(k*3))*.58;
    const fire=Math.hypot(ax,ay),phase=(t*.23+k*.33)%1;
    const spokes=.5+.5*Math.cos(Math.atan2(ay,ax)*13+k);
    if(fire<.049&&Math.abs(fire-.046*phase)<.0035&&spokes>.36)ink=mix(ink,0xffb973,(1-phase)*spokes);
   }
   const sail=smooth(f.beatAge/6),hullX=.43+.15*sail,hullScale=1-.39*sail;
   ink=courierHull((x-hullX)/(.18*hullScale),(y-.46+.14*(x-hullX))/(.065*hullScale),f,ink);
  }
  if(chapter===4){
   const rail=Math.abs(Math.abs(x-.52)+.60*(y-.41)-.53);
   if(rail<.05||y>.76)ink=mix(0x101d30,0x61717a,clamp(.65-rail*7));
  }
  if((chapter===3||chapter===4)&&y>.53&&x<.25){
   const head=((x-.117)/.026)**2+((y-.626)/.048)**2;
   const shoulder=((x-.106)/.071)**2+((y-.776)/.120)**2;
   const wave=.008*Math.sin(t*2),flag=Math.hypot((x-.199-wave)/.036,(y-.57)/.061);
   if(head<1||shoulder<1)ink=mix(0x0c1629,0x825455,clamp(.29+(x-.11)*7));
   if(Math.abs(x-.149-(.55+wave*6)*(.74-y))<.006&&y>.589&&y<.74)ink=0xb99872;
   if(flag<1)ink=mix(0x2d7796,0xadddb9,smooth((Math.sin((x-wave)*102+Math.cos(y*79)*1.8)+.50*Math.cos(y*88)-.20)*3));
  }
  return ink;
 }
 const ship=courierHull((x-.24)/.16,(y-.55+.18*(x-.24))/.058,f,ink);
 ink=ship;
 const droneX=.59,droneY=.37;
 const ux0=(x-droneX)/.19,uy0=(y-droneY)/.22;
 const cut=uy0+.49*ux0,opening=chapter===6?.075+.038*pulse:0;
 const ux=ux0+(cut<0?opening:-opening),uy=uy0+(cut<0?opening:-opening);

 const body=Math.abs(ux)*.55+Math.abs(uy)*.73;
 if(body<.79&&Math.abs(cut)>=opening){
  ink=mix(0x282138,0x9c7580,clamp(.60-ux*.20-uy*.47));
  const seam=Math.abs(Math.abs(ux)*.55+Math.abs(uy)*.73-.64);
  if(seam<.023)ink=mix(ink,0xe3a47f,.7);
  if(chapter===6&&Math.abs(cut)<opening+.040)ink=mix(ink,0xffb977,.8);
  const iris=Math.hypot(ux,uy);
  if(iris<.40)ink=mix(0x6e324f,0xffa080,clamp(.94-iris*1.3+.22*Math.cos(iris*32-t*2)));
 }
 const scan=Math.abs(y-.37+.46*(x-.59));
 if(chapter===5&&x>.15&&x<.59&&scan<(.59-x)*.39)ink=mix(ink,0xf95968,.17+.19*Math.cos(x*93+t*5));
 // Forked Frik cutter. The keel carries paired wet chambers and an exposed cutting prong.
 const fx=(x-.82)/.116,fy=(y-.235+.48*(x-.82))/.089;
 const boat=fx*fx+(fy/.62)**2;
 if(boat<1){
  const round=Math.sqrt(1-boat);
  ink=mix(0x123242,0x9fbead,clamp(.31+.55*round-fy*.38));
  const windows=Math.abs(Math.sin((fx+.82)*15));
  if(Math.abs(fy+.09)<.08&&windows>.53)ink=0xb2f4d3;
 }
 if(fx>-.98&&fx<1.22){
  const fork=.23+.42*(fx+.26)**2;
  const fin=Math.abs(Math.abs(fy)-fork);
  if(fin<.099*(1.25-.6*Math.abs(fx)))ink=mix(0x27606a,0xd6c295,clamp(.8-fin*7));
 }
 for(const k of [-.32,.27]){
  const bowl=((fx-k)/.19)**2+((fy+.39)/.23)**2;
  if(bowl<1)ink=mix(0x2e9daa,0xe6ffe1,clamp(1-bowl+.13*pulse));
 }
 if(chapter===6&&x>.52&&x<.82){
  const beam=y-.23+.56*(x-.82);
  ink=mix(ink,0x5bebdc,.32*Math.exp(-Math.abs(beam)*47));
  if(Math.abs(beam)<.004)ink=0xfff2bb;
  const ribbon=beam+.056+.034*Math.sin(x*49-t*3);
  if(Math.abs(ribbon)<.010&&Math.cos(x*130-t*4)>.0)ink=0xa4dcef;
 }
 return ink;
}
