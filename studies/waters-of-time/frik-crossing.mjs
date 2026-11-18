// The lens shape is drawn from the public-domain NASA frame STS088-724-66.
// Coordinates describe the cranked shoulder, broad chipped heel and long lower spar.
import {mandelEscape} from './ansi-mandel-field.mjs';
import {flightTraces} from './lancing-route.mjs?v=lancing-2';
import {globeAtlas} from './frik-planet-atlas.mjs';
import {clamp,mix,smooth} from './ansi-frik-color.mjs';
export const crossing=[
 ['Earth · 1899','We called it the Black Knight. It passed over Earth long before anyone thought to listen. Every time it crosses Colorado, three pulses fall out of the sky.'],
 ['Colorado Springs · The receiver','Nikola Tesla disconnects his transmitter. Outside the shed, the Rockies go blue before dawn. Inside, the needle jumps anyway. On a strip of paper he marks three strokes. The next three land right on top of them.'],
 ['The Black Knight · A thousand years','The Black Knight sent us plans for a gate to a planet we named New Earth. For a thousand years, one crew finished its shift and another took its place.'],
 ['Earth orbit · Launch day','Every city turns its lights on for the first colony ship. A girl at our aft window waves a paper Earth. A billion people wave back.'],
 ['New Earth · Aft window','We cross. New Earth fills the bow windows. At the stern the girl can still see home through the doorway. A line of light goes in blue and comes out white. She folds her paper Earth and puts it in her pocket.'],
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
 const visibility=state.visibility??1;
 const sign=(label,x,y,size,color,alpha=1)=>put.glyph(label,project(x,state.x),project(y,state.y),
  size/state.window,color,{maxSize:36,alpha:alpha*visibility});
 const t=f.time;
 const lamp=(x,y,r,ink,power)=>{
  const u=project(x,state.x),v=project(y,state.y);
  if(f.effects&&u>-.1&&v>-.1&&u<1.1&&v<1.1)put.bloom(u,v,Math.min(.14,r/state.window),ink,power*visibility,'point',5);
 };
 if(n===1){lamp(.866,.265,.046,'#ffc78d',.53+.1*Math.cos(t*1.9));lamp(.28,.152,.028,'#b8d6f7',.15+.3*smooth((Math.cos(t*3)-.68)*3));}
 if(n===2||n===3){
  for(let k=0;k<6;k++){
   const a=k*Math.PI/3+t*.18;
   lamp(.643+.202*Math.cos(a),.421+.290*Math.sin(a),.014,'#8ae1e4',.39);
  }
 }
 for(const p of flightTraces){
  if(p.chapter!==n||state.window>.25)continue;
  sign(p.name.toUpperCase(),p.x,p.y-.012,.00095,'#f7dc9e');
 }
 if(state.window<.16&&n===1){
  sign('OPEN   /   3:07 AM',.521,.554,.00082,'#ffdea8');
  sign('REPLY  /   N.T.',.741,.757,.00078,'#60463a');
 }

 if(n===0){
  if(state.window<.10)sign('BUS 07   ╫   BYPASS',.659,.391,.00074,'#b0f2ce');
  sign('EARTH   /   NIGHT PASS',.185,.16,.013,'#bcd6d0');
  sign('·   ·   ·',.515,.415,.026,'#b8f3db',.55+.35*Math.cos(t*2));
 }else if(n===1){
  sign('N. TESLA',.393,.670,.009,'#503e3b');
  sign('WESTINGHOUSE  /  No. 3',.671,.483,.008,'#45333b');
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
function cloudGrain(x,y){
 const i=Math.floor(x),j=Math.floor(y),fx=smooth(x-i),fy=smooth(y-j);
 const a=Math.cos(i*13+j*27)*Math.sin(i*17-j*11),b=Math.cos((i+1)*13+j*27)*Math.sin((i+1)*17-j*11);
 const c=Math.cos(i*13+(j+1)*27)*Math.sin(i*17-(j+1)*11),d=Math.cos((i+1)*13+(j+1)*27)*Math.sin((i+1)*17-(j+1)*11);
 return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}
export function globeInk(dx,dy,t,world,pixel){
 const r=dx*dx+dy*dy,z=Math.sqrt(Math.max(0,1-r)),lat=world===0?dy*.94-z*.342:dy*.984+z*.178;
 const u=Math.atan2(dx,world===0?z*.94+dy*.342:z*.984-dy*.178)/(2*Math.PI)+.5,v=Math.asin(Math.max(-1,Math.min(1,lat)))/Math.PI+.5;
 const spin=world===0?-.28+.023*Math.sin(t*.11):t*.0038,land=globeChannel(u+spin,v,world,0)/185,water=globeChannel(u+spin,v,world,1)/17;
 const low=globeChannel(u+spin*.71,v,world,2)/255,high=globeChannel(u+spin*1.32,v,world,3)/255;
 const sun=clamp(.29-.44*dx-.20*dy+.59*z);
 let color=mix(mix(world?0x1c514c:0x274c3c,world?0xa4b995:0xc7b67d,land),mix(0x3a9baf,0x123564,water),clamp(water*16));
 color=mix(color,0xe1ece0,smooth((Math.abs(lat)-.82)*8)*.90);
 const lon=u+spin;
 const fine=smooth((.003-pixel)*430);
 const landRelief=cloudGrain(lon*92,v*130);
 color=mix(color,water>.1?0x287d9a:0xd2ab76,.12+.105*landRelief);
 const wind=u+spin*.71+t*.0007,eddy=cloudGrain(wind*16,v*23),stream=cloudGrain(wind*66+eddy*2.2,v*95-eddy);
 let folds=.64*eddy+.36*stream;
 if(fine>.01)folds+=fine*(.22*cloudGrain(wind*273+stream*3,v*380)+.09*cloudGrain(wind*801,v*1070));
 const vapor=clamp((low*.80+high*.54-.13+.34*folds)*1.33);
 color=mix(color,0x426274,.23*smooth((low+high-.54)*4)*(1-vapor));
 color=mix(color,0xf8f0df,vapor);
 color=mix(0x071028,color,sun);
 return mix(color,0x80d9f1,clamp((r-.87)*6)*(.30+.49*sun));
}
export function knightInk(u,v,under,pixel,t){
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
 const panelU=d*12+Math.floor(v*19)*.37,panelV=v*21;
 const pu=panelU-Math.floor(panelU),pv=panelV-Math.floor(panelV);
 if(pv<.036||pu<.029)ink=mix(ink,0x0c1721,.91);
 const trunk=Math.abs(d-.42-.043*Math.sin(v*24));
 const via=Math.hypot(pu-.79,pv-.63);
 const etch=Math.min(Math.abs(pv-.63),Math.abs(pu-.23-.35*Math.max(0,pv-.32)));
 if(trunk<.009||(pu>.23&&pu<.79&&etch<.022)||via<.075)ink=mix(ink,via<.035?0xf7e5ae:0x55c1b3,.85);
 if(pu>.78&&pu<.87&&pv>.13&&pv<.40)ink=mix(ink,0xafa383,.65);
 if(pixel<.00048){
  // Inside each hatch live smaller carrier boards. Feed tracks join pads
  // and terminate at a die; clear metal between packages stays quiet.
  let bx=pu,by=pv,footprint=pixel*212;
  for(let level=0;level<4;level++){
   if(footprint>.12||bx<.12||bx>.90||by<.10||by>.89)break;
   const kx=(bx-.12)*6.41,ky=(by-.10)*5.06;
   bx=kx-Math.floor(kx);by=ky-Math.floor(ky);
   const die=bx>.31&&bx<.73&&by>.25&&by<.71;
   const legs=Math.cos(by*96);
   if(die)ink=mix(ink,0x17393d,.63);
   if(by>.26&&by<.71&&legs>.70&&((bx>.21&&bx<.31)||(bx>.73&&bx<.83)))ink=mix(ink,0xc7ac79,.75);
   const feed=Math.abs(by-.78+.23*Math.max(0,bx-.47));
   if(feed<.014&&bx>.16&&bx<.88)ink=mix(ink,0x65dfcf,.68+.3*Math.cos(t*2-kx*3));
   if(Math.hypot(bx-.15,by-.78)<.033)ink=0xdbcb85;
   if(!die)break;
   footprint*=6;
  }
 }
 if(d>.948)ink=0xc3ccc5;
 return ink;
}
// The hull's long axis runs from the drive bells (-x) to the observation crown.
function courierHull(x,y,f,under){
 if(x<-1.60||x>1.12||Math.abs(y)>.95)return under;
 let ink=under;
 const keel=Math.abs(y-.07);
 if(x>-.84&&x<.92&&keel<.086)ink=mix(0x25394b,0xceae82,clamp(.81-keel*8));
 // Open Pratt trusses between pressure vessels, with a continuous service line.
 if(x>-.68&&x<.64&&Math.abs(y+.07)<.22){
  const rail=Math.abs(Math.abs(y+.07)-.18);
  const web=Math.abs(Math.abs(((x+1)*6)%1-.5)-.5*(y+.25)/.36);
  if(rail<.026||web<.058)ink=mix(0x3e4657,0xe7b66f,clamp(.8-y*2));
 }
 // Three ribbed, paired cylindrical habitats offset in perspective.
 for(const k of [0,1,2]){
  const xx=x+.37-k*.30,yy=y+.29-k*.032;
  const d=(xx/.152)**2+(yy/.285)**2;
  if(d<1){
   const normal=Math.sqrt(1-d),ribs=.5+.5*Math.cos(xx*141);
   ink=mix(0x243448,0xd4cbbb,clamp(.18+.82*normal-.85*yy-.18*ribs));
   if(Math.abs(xx)<.027)ink=mix(0x825338,0xfbb671,normal);
   if(Math.abs(yy+.072)<.024&&Math.cos(xx*111)>.12)ink=0xffdc94;
  }
 }
 // Angled radiator leaves, separated by dark vacuum rather than one solid wing.
 for(const sign of [-1,1]){
  const blade=(y-sign*.53+f.tilt*.19)*sign;
  const across=x+.50+blade*.72;
  if(Math.abs(blade)<.29&&Math.abs(across)<.16){
   const grid=Math.abs(Math.sin(across*83)*Math.sin(blade*61));
   ink=mix(0x17273f,0x697cb4,.23+.55*grid);
   if(Math.abs(across)>.143||Math.abs(blade)>.267)ink=0xb99359;
  }
  const bell=y-sign*.245,engine=x+.81;
  if(engine>-.39&&engine<.22&&Math.abs(bell)<.10+.12*Math.max(0,-engine)){
   ink=mix(0x1b2437,0xa78976,clamp(.76-Math.abs(bell)*5+.13*Math.cos(engine*73)));
  }
  if(x< -1.17){
   const plume=Math.exp(-Math.abs(bell)*22)*clamp((x+1.58)*2.5);
   ink=mix(ink,0x73e5ff,plume*(.8+.19*Math.sin(f.time*6+x*42)));
  }
 }
 // A rotating gravity wheel straddles the keel. Passing spokes are visible through its bore.
 const wx=(x+.23-f.ray*.15)/.178,wy=(y+.11+f.tilt*.20)/.69,wr=Math.hypot(wx,wy),wa=Math.atan2(wy,wx);
 if(wr<1.05&&wr>.84){
  const rim=Math.sqrt(Math.max(0,1-((wr-.945)/.108)**2));
  const cabin=.5+.5*Math.cos(wa*19-f.time*.62);
  ink=mix(0x41323a,0xdba571,clamp(.18+.65*rim-.16*wy));
  if(wr<.94&&wr>.88&&cabin>.54)ink=0xffdd8c;
 }else if(wr<.87&&wr>.21&&Math.abs(Math.sin(wa*3-f.time*.095))<.045)ink=0xa89d88;
 // Porcelain bow shield with a cut-back underside and wraparound glass bridge.
 const nose=(x-.58)/.47,cheek=(y+.035+.08*nose)/(.27-.06*nose);
 const shell=nose*nose+cheek*cheek;
 if(shell<1&&y<.21-.10*nose){
  ink=mix(0x394658,0xf1d8a7,clamp(.16+.80*Math.sqrt(1-shell)-cheek*.24));
  if(cheek>-.48&&cheek<-.21&&x>.60)ink=Math.cos(x*98)>.78?0x6c5c51:0x24627a;
  if(shell>.90&&y<-.03)ink=0xffe7ae;
  const inlay=Math.abs(cheek-.33+.21*Math.sin(nose*4));
  if(nose<.51&&inlay<.070)ink=0xa35743;
  if(nose<.54&&Math.abs(cheek+.07)<.044&&Math.cos(nose*49)>.18)ink=0x395368;
 }
 return ink;
}
function mountainLine(x,band){
 const ridge=Math.abs(Math.sin(x*4.1+band*1.7));
 return .28+.094*band+.141*ridge+.047*Math.abs(Math.sin(x*19+ridge*9))+
 .019*Math.abs(Math.sin(x*63+ridge*15))+.006*Math.sin(x*211+band)+.002*Math.sin(x*641);
}
function frontRange(x,y,f,sky){
 let ink=mix(sky,0x9b626b,clamp(y*1.8)*.62);
 for(const k of [0,1,2]){
  const px=x+f.ray*.006*k,ridge=mountainLine(px,k);
  if(y<ridge)continue;
  const fall=y-ridge;
  const vein=Math.sin(px*39+8*Math.sin(px*12)+fall*19)+.4*Math.sin(px*123+fall*55);
  const gull=px+.19*fall+.047*Math.sin(7*px+fall*10);
  const h=mountainLine(gull+.002,k)-mountainLine(gull,k);
  ink=mix(k===0?0x434364:k===1?0x32334c:0x192d38,k===0?0xe6bcb1:k===1?0x9b7a7e:0x586165,
   clamp(.36+h*39+.16*vein-.72*fall));
  if(k<2&&fall<.014+.020*vein&&h<.0014)ink=mix(ink,0xf8d5bd,.55);
  if(k===2&&fall>.035){
   const p=px*128,tree=Math.abs(p-Math.round(p));
   if(fall<.113&&tree<fall*3.7)ink=mix(ink,0x102430,.72);
  }
 }
 if(f.pixel<.0014&&y>mountainLine(x,0)&&y<.64){
  const talus=mandelEscape(-.74631+.022*x,.10882+.037*(y-mountainLine(x,0)),64);
  const layer=talus<0?0:.5+.5*Math.cos(talus*1.9);
  ink=mix(ink,0xcaad99,smooth((.0014-f.pixel)*1200)*.21*layer);
 }
 // Windows of the town below the ridge, reflected in the wet rail cut.
 const street=.579+.022*Math.sin(x*9)+.008*Math.cos(x*36);
 if(Math.abs(y-street)<.0024&&Math.sin(x*437)>.84)ink=0xe7ac75;
 if(x>.031&&x<.222){
  const roof=.614-.28*Math.min(x-.031,.222-x);
  if(y>roof&&y<.665){
   ink=y<roof+.009?0x9e8381:0x3d3944;
   if(Math.abs(y-.637)<.008&&Math.cos(x*240)>.45)ink=0xd9a674;
  }
 }
 const lead=Math.abs(y-.29-.31*(x-.26)-.048*Math.sin((x-.26)*7));
 if(x>.26&&x<.74&&lead<.002)ink=0x252638;
 return ink;
}
function gateFoundry(x,y,f,under){
 let dx=(x-.643)/.239,dy=(y-.421)/.346;
 const base=Math.hypot(dx,dy);
 if(base<.75||base>1.42)return under;
 // Two relief samples follow the groove into its outer wall. The edge
 // envelope pins the silhouette and leaves the portal registration intact.
 const retain=smooth((base-.78)*20)*smooth((1.39-base)*18);
 const cross=(base-.971)/.114,round=Math.sqrt(Math.max(0,1-cross*cross));
 const panel=.5+.5*Math.cos(Math.atan2(dy,dx)*48);
 const raised=.35*round+.13*panel+.16*Math.exp(-Math.abs(base-1.18)*46);
 const qx=dx-f.ray*raised,qy=dy+f.tilt*raised;
 const second=Math.hypot(qx,qy),slat=.5+.5*Math.cos(Math.atan2(qy,qx)*96+second*65);
 const height=retain*(raised+.10*round*slat);
 dx-=f.ray*height;dy+=f.tilt*height;
 const r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),w=a*12/Math.PI;
 if(r<.76||r>1.39)return under;
 const cell=w-Math.floor(w),sector=Math.abs(cell-.5);
 const spoke=Math.abs(Math.sin(a*12)),lit=clamp(.60-.24*dx-.46*dy);
 const gantry=Math.abs(r-1.18);
 let ink=under;
 // Outer lattice and counterweighted radial buttresses.
 if(gantry<.048&&(gantry>.034||Math.abs(Math.sin(a*108+(r-1.18)*74))>.75))ink=mix(0x313f53,0xc79964,lit);
 if(r>1.02&&r<1.33&&spoke<.13+.31*clamp((1.32-r)*4)){
  ink=mix(0x28384e,0xcab998,clamp(lit+.25*Math.cos(r*85)-spoke));
  if(spoke<.061&&r>1.13)ink=mix(ink,0x72e2e0,.85);
 }
 if(r>.86&&r<1.075){
  const cross=(r-.96)/.108,round=Math.sqrt(Math.max(0,1-cross*cross));
  ink=mix(0x1c2438,0xb1a48b,clamp(lit*.87*round+.095*Math.cos(a*168)));
  if(sector>.469)ink=0x172535;
  if(r>.957&&r<1.006&&sector<.36){
   ink=mix(0x29364b,0x625e60,round*.74);
   const louvers=Math.cos((cell*21+r*7)*6.28);
   if(louvers>.19)ink=mix(ink,0xe6bc79,.65*lit);
   if(f.pixel<.00035){
    const rivet=Math.hypot((cell*23)%1-.5,(r-.963)*36-.5);
    if(rivet<.115)ink=mix(0x24313d,0xd9b590,clamp(.8-rivet*3));
    const slit=Math.abs(Math.sin(cell*977+r*192));
    if(r>.980&&r<.986&&slit>.35)ink=mix(ink,0x9dd4c9,.7);
   }
  }
  if(Math.abs(r-1.054)<.009||Math.abs(r-.88)<.008)ink=mix(0x44747c,0xeff4d8,lit);
 }
 const tooth=.825+.036*Math.cos(a*24-f.time*.26);
 if(r>tooth&&r<.885&&sector<.41)ink=mix(0x265a6b,0xb9fff0,clamp(.80-(r-tooth)*11));
 const coil=Math.abs(r-.833-.012*Math.sin(a*24-f.time*.74));
 const pulse=.53+.42*Math.cos(a*6-f.time*1.7);
 if(coil<.042)ink=mix(ink,0x67dfe8,Math.exp(-coil*98)*pulse);
 return ink;
}
function brokenEarth(dx,dy,age,t,pixel,under){
 const q=smooth((age-4)/7),x=dx,y=dy;
 let ink=under;
 // The largest pieces retain their original coastlines and curved limb.
 for(const k of [0,1,2,3]){
  const sx=k===0?-.43:k===1?.38:k===2?-.24:.28,sy=k===0?-.28:k===1?-.26:k===2?.34:.45;
  const spin=(k-1.5)*q*.15,px=x-sx*q,py=y-sy*q;
  const ax=px*Math.cos(spin)-py*Math.sin(spin),ay=px*Math.sin(spin)+py*Math.cos(spin);
  const u=ax+.16*ay+.075*Math.sin(ay*7)+.034*Math.sin(ay*22);
  const v=ay-.41*ax+.047*Math.sin(ax*14)-.019*Math.cos(ax*36);
  if((u>0)!==(k===1||k===3)||(v>0)!==(k>=2)||ax*ax+ay*ay>1)continue;
  ink=globeInk(ax,ay,t,0,pixel);
  const edge=Math.min(Math.abs(u),Math.abs(v));
  ink=mix(ink,0xff894e,smooth((age-2.4)/1.9)*Math.exp(-edge*16));
  ink=mix(ink,0xffe5ab,smooth((age-3.1)/1.7)*Math.exp(-edge*69));
  const wave=Math.hypot(ax+.58,ay-.24);
  for(const n of [0,.35,.83]){
   const ring=Math.abs(wave-(age-1.65-n)*.54);
   ink=mix(ink,0xffdbab,Math.exp(-ring*54)*clamp((4.7-age)*.7));
  }
 }
 if(q>.01){
  for(let n=1;n<=30;n++){
   const a=n*2.399,dist=.18+(n%5)*.17+q*(.53+(n%7)*.135);
   const rx=x-dist*Math.cos(a),ry=y-dist*Math.sin(a);
   if(Math.abs(rx)+Math.abs(ry+.45*rx)<(.014+.007*(n%4))*q)ink=ry<0?0xffa561:0x774a49;
  }
 }
 const corona=Math.hypot(x+.58,y-.24);
 const wavefront=Math.abs(corona-(age-1.65)*.54);
 if(x*x+y*y>1&&age>1.65&&age<5.8)ink=mix(ink,0xffb783,Math.exp(-wavefront*42)*smooth((5.8-age)*.8)*.86);
 const path=Math.abs(y+.40*x),front=-2.4+(age-1)*2.3;
 if(x<front&&age>1&&age<4.7){
  const power=smooth((age-1)*3)*smooth((4.7-age)*1.5);
  ink=mix(ink,0xff642f,power*Math.exp(-path*19));
  ink=mix(ink,0xffffdd,power*Math.exp(-path*127));
 }
 return ink;
}
function workshop(x,y,f,ink){
 const shade=.5+.5*Math.sin(x*4.1);
 // Timber eaves and diagonal braces frame the open west wall.
 const roof=.06+.17*Math.abs(x-.46);
 if(y<roof){
  ink=mix(0x151822,0x4a3841,clamp(y*4+.13*Math.sin(x*71)));
  if(Math.abs(y-roof+.013)<.007)ink=mix(0x735747,0xb58b60,shade);
 }
 if(x>.923&&Math.abs(x-.963)<.022)ink=mix(0x25232e,0x634835,clamp((.985-x)*19));
 const wire=y-.18-.092*Math.sin(x*3.12);
 if(x>.38&&Math.abs(wire)<.0016)ink=0x29252c;
 // The hanging cage lamp throws an amber pool over the ledger and portrait.
 const bulb=Math.hypot((x-.866)*1.72,y-.265);
 ink=mix(ink,0xefad70,.38*Math.exp(-bulb*13));
 if(Math.abs(x-.866)<.0017&&y>.078&&y<.23)ink=0x332931;
 const bell=(x-.866)/.033;
 if(Math.abs(bell)<1&&y>.222&&y<.239+.009*(1-bell*bell))ink=mix(0x4a3d3b,0xd3a36b,1-Math.abs(bell));
 if(bulb<.019)ink=mix(0xdb9b53,0xfff3c0,1-bulb*35);
 // Planks, inlaid copper busbars and the planed lip of the operating bench.
 if(y>.714){
  const grain=Math.sin(148*y+3*Math.sin(19*x+11*y))+.48*Math.cos(101*y-x*15);
  ink=mix(0x33222d,0x996747,clamp(.46+.11*grain+.18*x-(y-.71)*1.7));
  if(Math.abs(y-.803+.03*x)<.004)ink=0xc69a6c;
 }
 return ink;
}
// Hand-drawn cabinet-card engraving. Landmarks use Sarony's c.1893 portrait
// as a proportion reference. Only these authored contours enter the renderer.
// Gaussian relief models broad bone and cartilage; the print strokes follow it.
function portraitPlane(x,y,cx,cy,rx,ry,slope){
 const dx=(x-cx)/rx,dy=(y-cy-(x-cx)*slope)/ry;
 return Math.exp(-dx*dx-dy*dy);
}
function engravedEye(x,y,cx,cy,width,height,under){
 const u=(x-cx)/width;
 if(Math.abs(u)>1.14)return under;
 const arch=Math.max(0,1-u*u);
 const v=y-cy+u*1.9,upper=-height*arch*(1-.23*u),lower=.58*height*arch*(1+.31*u);
 let ink=under;
 if(Math.abs(u)<1){
  ink=mix(ink,0x695650,.57*Math.exp(-Math.abs(v-upper+3.1)*.64)*arch);
  if(v>upper&&v<lower){
   const iris=Math.hypot(x-cx+2.5,v+1.8);
   ink=mix(0x827160,0xe1c8a4,clamp(.36+v*.09+.35*arch));
   if(iris<height*.99)ink=mix(0x293137,0x856a50,clamp(.32+.45*v/height+.12*Math.cos(iris*3)));
   if(iris<height*.49)ink=0x25262b;
   if(Math.hypot(x-cx+3.2,v+2.5)<.87)ink=0xffe7ae;
  }
  ink=mix(ink,0x322d31,clamp(1.26-Math.abs(v-upper)*.63)*Math.sqrt(arch));
  const bag=lower+4.2+2.4*u;
  ink=mix(ink,0x99755d,Math.exp(-Math.abs(v-bag)*.54)*arch*.49);
  ink=mix(ink,0xffdfac,clamp(1.05-Math.abs(v-lower-1.25)*.58)*arch*.67);
 }
 return ink;
}
function operatorInk(x,y,f,under){
 // A dated field record stands in the wooden strip beside the receiver.
 // Its top leans a few degrees toward the gauge. The brass rail seats the base.
 const u=(x-.392+(y-.48)*.030)/.084,v=(y-.488)/.210;
 if(Math.abs(u)>1.05||v< -1.02||v>1.11)return under;
 const edge=Math.max(Math.abs(u)-.97,Math.abs(v)-1);
 let ink=under;
 if(edge<.050)ink=mix(ink,0x231e26,clamp((.050-edge)*15)*.72);
 if(edge<=0){
  ink=mix(0x3e3435,0x977659,clamp(.45+.17*u-.20*v));
  if(edge<-.022)ink=mix(0xc2a47c,0xf2d7a6,clamp(.62-.22*u-.17*v));
  if(Math.abs(edge+.067)<.003)ink=0x927555;
 }
 const oval=((u+.008)/.847)**2+((v+.066)/.820)**2;
 if(oval<1.04){
  ink=mix(0x6d624e,0xf1c992,clamp((oval-.97)*24));
  if(oval<1){
   // Photo coordinates are mirrored so Tesla watches the real needle.
   const px=170-u*128,py=170+(v+.055)*174;
   const density=.5+.5*Math.cos((py+.17*px)*2.0);
   const near=smooth((.00095-f.pixel)*1400);
   ink=mix(0x45424a,0xb39d81,clamp(.61-.33*oval+.0014*(px-160)-.075*near*density));
   // Sections describe a continuous cranium, temple, jaw angle and chin.
   let left=0,right=0;
   for(const [y0,y1,l0,l1,r0,r1] of [
    [42,47,185,159,185,216],[47,56,159,133,216,232],[56,66,133,107,232,241],
    [66,78,107,88,241,247],[78,100,88,77,247,252],[100,118,77,75,252,254],
    [118,128,75,81,254,250],[128,155,81,86,250,240],[155,176,86,89,240,245],
    [176,197,89,98,245,238],[197,214,98,111,238,229],[214,233,111,112,229,218],
    [233,248,112,120,218,209],[248,260,120,123,209,196],[260,273,123,132,196,180],
    [273,281,132,144,180,162],[281,283,144,153,162,153]]){
    if(py>=y0&&py<y1){const k=(py-y0)/(y1-y0);left=l0+(l1-l0)*k;right=r0+(r1-r0)*k;}
   }
   const ear=((px-244+.23*(py-174))/21)**2+((py-175)/30)**2;
   if((px>left&&px<right)||ear<1){
    // Broad light from the bench. A narrow temple, hollow cheek and rounded
    // chin use the same tonal field all the way down to single-cell marks.
    let tone=.74-.0040*(px-138)-.0011*(py-168);
    tone+=.17*portraitPlane(px,py,121,131,62,39,-.2);
    tone-=.31*portraitPlane(px,py,160,161,22,10,-.14)+.28*portraitPlane(px,py,101,167,17,9,-.12);
    tone+=.22*portraitPlane(px,py,169,183,29,12,-.32);
    tone-=.28*portraitPlane(px,py,192,214,32,21,-.68);
    tone-=.29*portraitPlane(px,py,145,252,23,4,-.14);
    tone-=.14*portraitPlane(px,py,198,235,16,25,.68);
    tone+=.31*portraitPlane(px,py,151,268,29,12,-.21);
    // Paired bridge planes, alar wings and septum taper into the cheek.
    const bridgeX=134-.245*(py-164);
    tone+=.16*portraitPlane(px,py,bridgeX-3,186,7,28,0);
    tone-=.29*portraitPlane(px,py,bridgeX+8,193,7,24,.6);
    tone+=.27*portraitPlane(px,py,128,208,12,6,-.1);
    tone-=.56*portraitPlane(px,py,135,214,6.4,2.7,-.23);
    tone-=.25*portraitPlane(px,py,144,211,4.3,5.1,-.18);
    tone+=.22*portraitPlane(px,py,140,208,5.5,3.8,.28);
    tone-=.14*portraitPlane(px,py,151,221,2.8,9.1,.71);
    tone-=.28*portraitPlane(px,py,118,203,2.3,8.0,-.21);
    tone-=.20*portraitPlane(px,py,119,214,4,2.1,.28);
    tone+=.18*portraitPlane(px,py,138,243,17,3.7,-.15);
    const sweep=py+.22*px+.0021*(px-146)*(px-146)+3.8*Math.sin(py*.055);
    const cut=smooth((Math.cos(sweep*1.78)-.62)*4);
    const cross=smooth((Math.cos((px-.25*py)*1.9)-.84)*7);
    const engraved=tone-near*(cut*.095*clamp((.86-tone)*2)+cross*.055*clamp((.46-tone)*4));
    ink=mix(0x4b3b3e,0xf5d8aa,clamp(engraved));
    // Two unequal sockets turn the face. Brow hairs taper at both ends.
    ink=engravedEye(px,py,102.2,169.4,11.6,4.4,ink);
    ink=engravedEye(px,py,161.1,160.9,16.5,4.8,ink);
    for(const [cx,cy,r,w] of [[100,159.4,14,3.1],[161,149.2,21,3.7]]){
     const s=(px-cx)/r,curve=cy+3.6*s*s-.8*s;
     const b=(1-s*s)-((py-curve)/w)**2;
     if(b>0)ink=mix(ink,0x423637,clamp(b*1.75)*(.82+.06*Math.cos(px*2.1+py*.9)));
    }
    const lipX=(px-142)/26;
    if(Math.abs(lipX)<1){
     const part=238.5-2.9*lipX-1.4*Math.cos(lipX*2.9);
     ink=mix(ink,0x644643,Math.exp(-Math.abs(py-part)*1.05)*(1-lipX*lipX));
    }
    // Two swept moustache lobes cling to the upper lip, with a cut at the philtrum.
    const m=(px-141)/31,m2=Math.abs(m);
    const upper=216.0+11.2*m2*m2+3.0*Math.exp(-m*m*26)-2.4*m;
    const lower=233.7-3.0*m+2.7*(1-m2)-3.6*m2*m2;
    if(m2<1&&py>upper&&py<lower){
     const curl=px-(.6+1.3*m)*(py-upper)+.9*Math.sin(py*.20+m);
     const body=clamp(Math.min((1-m2)*8,(py-upper)*.49,(lower-py)*.57));
     ink=mix(ink,mix(0x332e33,0x836649,.26+.20*Math.cos(curl*1.85)),body);
    }
    if(ear<1){
     const inner=portraitPlane(px,py,245,173,10,20,.37);
     const helix=Math.exp(-Math.abs(ear-.70)*10);
     ink=mix(0x6f5148,0xe1b68a,clamp(.59+.23*helix-.42*inner+.14*(py-175)/30));
     ink=mix(ink,0x594442,.74*portraitPlane(px,py,242,177,5.5,8.1,.55));
     ink=mix(ink,0xe6be93,.77*portraitPlane(px,py,246,167,3.2,10,.52));
     const fold=px-243-.36*(py-174)+.035*(py-174)*(py-174);
     ink=mix(ink,0x745447,.67*Math.exp(-fold*fold*.15)*portraitPlane(px,py,242,175,16,15,0));
    }
    // The part divides two comb directions; highlights bend with each lock.
    const fringe=94+31*Math.exp(-((px-81)/18)*((px-81)/18))-5*Math.exp(-((px-139)/33)*((px-139)/33))+
      8*Math.exp(-((px-197)/20)*((px-197)/20))+62*smooth((px-202)/28);
    if(py<fringe&&ear>.98){
     const partX=122+.72*(95-py)+.010*(95-py)*(95-py);
     const d=px-partX;
     const lock=py-.0019*(px-160)*(px-160)+8.5*Math.sin((px-112)*.037)+.22*px;
     const back=px+.64*py+4*Math.sin(py*.083);
     const comb=d>0?lock+.00082*d*d:back+2.9*Math.sin(px*.091+py*.05);
     const sheen=.48*portraitPlane(px,py,173,65,48,13,.20)+.39*portraitPlane(px,py,99,79,26,11,-.6);
     ink=mix(0x24252d,0xb89977,clamp(.085+sheen*(.74+.43*Math.cos(comb*.54))+.067*Math.cos(comb*1.67)*near+.39*Math.exp(-Math.abs(d)*.53)));
    }
   }
  }
 }
 // Folded brass lip casts a contact shadow across the bottom of the card.
 if(v>.973&&v<1.076&&Math.abs(u)<1.028)ink=mix(0x564136,0xc99f68,clamp(1-(v-.976)*10+.10*u));
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
  ink=workshop(x,y,f,frontRange(x,y,f,ink));
  const background=ink;
  const tower=Math.abs(x-.28),height=.65-y;
  if(height>0&&height<.51&&tower<.006+.047*(1-height/.51)){
   ink=mix(0x704740,0xe0af78,clamp(.75-tower*10));
   if(tower>.0025&&tower<.042*(1-height/.51)&&Math.abs(Math.sin(height*69+tower*153))>.28)ink=tower<.004?0x50414a:background;
   if(height>.14&&height<.38&&tower<.005)ink=mix(0x6b443a,0xc18655,.5+.45*Math.cos(height*740));
  }
  const torus=((x-.28)/.068)**2+((y-.164)/.025)**2;
  if(torus<1)ink=mix(0x745449,0xf5d19a,clamp((1-torus)*.6+.34-(y-.164)*15));
  const sparkX=x-.28;
  const sparkY=y-.148+Math.abs(sparkX)*.59+.006*Math.sin(sparkX*227+f.time*9)+.002*Math.sin(sparkX*945);
  if(sparkX>0&&sparkX<.094){
   const flash=smooth((Math.cos(f.time*3)-.69)*3);
   ink=mix(ink,0xb3c3ff,Math.exp(-Math.abs(sparkY)*219)*flash);
  }
  if(y>.43&&y<.73&&x>.48&&x<.88){
   ink=mix(0x272839,0x927f65,clamp(.57+(x-.66)*1.7));
   const bevel=Math.min(x-.48,.88-x,y-.43,.73-y);
   if(bevel<.012)ink=mix(0x4b3840,0xc8a67d,clamp(.7+.3*Math.sin((x+y)*15)));
   if(bevel>.011&&bevel<.017)ink=0x403540;
   const grain=.5+.5*Math.cos(x*176+2*Math.sin(y*38));ink=mix(ink,0x624435,.16*grain);
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
  ink=operatorInk(x,y,f,ink);
  const knife=Math.abs(y-.548+.52*(x-.525));
  if(x>.505&&x<.554&&knife<.0035)ink=0xe7bd79;
  for(const k of [0,1]){
   const socket=Math.hypot((x-.513-k*.048)*1.72,y-.555);
   if(socket<.007)ink=mix(0x674936,0xe5c18b,1-socket*60);
  }
  // The mahogany receiver has a glass sight and a wound brass armature.
  const lens=Math.hypot((x-.672)/.044,(y-.572)/.066);
  if(lens<1.12)ink=mix(0x202d3a,0xe2b77b,clamp(.52+.39*Math.cos(lens*27)-(y-.572)*4));
  if(x>.48&&x<.88&&y>.69&&y<.715&&Math.sin(x*214)>.13)ink=0xc7a170;
  return ink;
 }
 if(chapter===0){
  const dx=(x-.34)/.51,dy=(y-.75)/(.51*1.72),r=dx*dx+dy*dy;
  if(r<1){
   ink=globeInk(dx,dy,t,0,f.pixel);
   const fine=smooth((.0018-f.pixel)*800);
   if(fine>.001){
    const drainage=mandelEscape(-.7461+dx*.034,.1135+dy*.031,62);
    const terraces=.5+.5*Math.cos(drainage*2.7+dx*38);
    const vein=clamp((.115-Math.abs(Math.sin(drainage*1.7)))*7);
    ink=mix(ink,0xe0bb9c,fine*.22*terraces);
    ink=mix(ink,0xb1e3db,fine*.31*vein);
    if(f.pixel<.00016){
     const stone=cloudGrain(dx*2200+terraces*4,dy*3100+Math.sin(dx*27+dy*31)*2);
     ink=mix(ink,stone>0?0xe3d5ae:0x294e62,.22*Math.abs(stone));
     if(f.pixel<.000018){
      const grit=cloudGrain(dx*28300+stone,dy*32600);
      ink=mix(ink,0xd0dbb4,.13+.12*grit);
     }
    }
   }
  }
  if(r>=1&&r<1.075)ink=mix(ink,0x8cddf3,Math.exp(-(r-1)*64)*.75);
  const creep=f.ray*.0015,range=Math.hypot((x-.65)*1.72,y-.44);
  const ping=range-t*.058,tip=Math.abs(ping-Math.floor(ping/.43)*.43-.08);
  if(x<.65&&tip<.0025)ink=mix(ink,0x9fe3dc,.45*smooth((.65-x)*12));
  return knightInk((x-.66-creep)/.194,(y-.135-f.tilt*.001)/.51,ink,f.pixel,t);
 }
 if(chapter===2||chapter===3){
  const dx=(x-.16)/.41,dy=(y-.93)/.71,r=dx*dx+dy*dy;
  if(r<1)ink=globeInk(dx,dy,t,0,f.pixel);
  if(r>1&&r<1.06)ink=mix(ink,0x88cfec,Math.exp(-(r-1)*74)*.68);
  // The construction cradle stays in both launch shots. Copper cranes dwarf the tugs.
  const rail=y-.68+.21*(x-.36),span=x-.09;
  if(span>0&&span<.70&&Math.abs(rail)<.023){
   if(Math.abs(rail)>.016||Math.abs(Math.sin(span*167+rail*72))>.66)ink=mix(0x283844,0xcf9c6e,.61-rail*9);
  }
  for(const k of [0,1,2,3]){
   const cx=.26+.091*k,cy=.68-.21*(cx-.36),height=cy-y;
   if(height>0&&height<.104&&Math.abs(x-cx)<.003+.008*(1-height/.104))ink=0xae8164;
   if(Math.abs(y-cy+.103+.32*(x-cx))<.003&&Math.abs(x-cx)<.037)ink=0xe3b478;
   const wire=Math.abs(x-cx-.028);
   if(wire<.0014&&height>.035&&height<.109)ink=0xcdad8c;
  }
  return gateFoundry(x+f.ray*.0014,y-f.tilt*.0011,f,ink);
 }
 // New Earth stays on the near side. The shrinking aperture admits the view
 // of the Solar System only on its inside. It has no physical ring here.
 const after=chapter>=5;
 const age=after?23:f.beatAge;
 const turn=smooth(age/4),close=smooth((age-12)/5);
 const px=.22-.28*turn,py=.60+.22*turn,rad=.50-.22*turn;
 const ndx=(x-px)/rad,ndy=(y-py)/(rad*1.72),nr=ndx*ndx+ndy*ndy;
 if(nr<1)ink=globeInk(ndx,ndy,t,1,f.pixel);
 if(nr>1&&nr<1.07)ink=mix(ink,0x9ceacf,.7*Math.exp(-(nr-1)*64));
 const portalX=1.42-.87*turn,portalY=.47-.07*turn;
 const width=(.19+.075*turn)*(1-close),height=.39*(1-close);
 if(width>.001){
  const ix=(x-portalX)/width,iy=(y-portalY)/height,rr=ix*ix+iy*iy;
  if(rr<1){
   ink=mix(0x030817,0x1d243c,clamp(.5+.28*iy));
   ink=brokenEarth(ix/.56,iy/.64,Math.max(0,age-3.4),t,f.pixel,ink);
   // Remnants of the old, physical gate are back on the Solar side.
   const debris=Math.cos(ix*61+iy*37)*Math.sin(iy*54);
   if(age>9&&rr>.62&&debris>.83)ink=0xbc9671;
  }
  if(Math.abs(rr-1)<.27)ink=mix(ink,0x80dee6,Math.exp(-Math.abs(rr-1)*23)*(.75+.20*Math.cos(iy*24-t*4)));
 }
 // Follow the colony from above the bow to its aft quarter as Earth comes into view.
 const shipX=-.34+.55*smooth(age/2.9),shipY=.47+.20*turn,size=.156+.063*turn;
 ink=courierHull((x-shipX)/(size*(1-.39*turn)),(y-shipY+(.30-.72*turn)*(x-shipX))/(size*(.62+.14*turn)),f,ink);
 if(chapter===4)return ink;
 const approach=chapter===5?smooth(f.beatAge/4):1,droneX=1.28-.69*approach,droneY=.26+.11*approach;
 const ux0=(x-droneX)/.19,uy0=(y-droneY)/.22;
 const cut=uy0+.49*ux0,opening=chapter===6?(.075+.038*pulse)*smooth(f.beatAge/2.6):0;
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
 const frigate=chapter===5?(1-smooth((f.beatAge-.9)/4))*.53:0;
 const fx=(x-.82-frigate)/.116,fy=(y-.235+.48*(x-.82-frigate))/.089;
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
 if(chapter===6&&x>.52&&x<.82&&f.beatAge>.65){
  const beam=y-.23+.56*(x-.82);
  ink=mix(ink,0x5bebdc,.32*Math.exp(-Math.abs(beam)*47));
  if(Math.abs(beam)<.004)ink=0xfff2bb;
  const ribbon=beam+.056+.034*Math.sin(x*49-t*3);
  if(Math.abs(ribbon)<.010&&Math.cos(x*130-t*4)>.0)ink=0xa4dcef;
 }
 return ink;
}

// Foreground geometry occludes a live portal on the launch side.
export function crossingForeground(x,y,f,ink){
 if(f.prologue!==3)return ink;
 const travel=f.travel,entry=smooth(f.beatAge/6.5);
 const scale=(.216-.065*entry)*(1-smooth((travel-.12)/.80));
 if(scale<.0001)return ink;
 const cx=-.32+.70*entry+travel*.29,cy=.64-.15*entry-.073*travel;
 return courierHull((x-cx)/scale,(y-cy+.24*(x-cx))/(scale*.65),f,ink);
}
