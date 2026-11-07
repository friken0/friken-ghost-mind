/* Original half-block ANSI paintings. A cell carries two palette pixels;
 * authored six-frame loops animate anatomy, flame, moonlight and packets.
 * No bitmap generation, WebGL, timer or independent animation clock. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const palettes=[[4,6,14,7,1,9,11],[4,5,13,7,1,3,11],[4,6,10,7,1,9,11],[4,12,6,7,3,9,11]];
export const ansiSceneKinds=Object.freeze(['eye','city','trip','serpent','vault','engine','forge','network','family','models','beacon','shipyard','source','original','repair','causality','rose','return','convoy','mailrun','quay','auction','layer-now','layer-echo','layer-archive','layer-witness','spiral-galaxy','monsoon-ridge','aurora-home','postmark-stamp']);
export function ansiSessionTheme(seed=0){const n=Number(seed)>>>0;return {palette:palettes[n%palettes.length],tempo:180+(n%9)*24,seed:n};}
const marqueeFont=Object.freeze({
 B:['11110','10001','10001','11110','10001','10001','11110'],I:['11111','00100','00100','00100','00100','00100','11111'],T:['11111','00100','00100','00100','00100','00100','00100'],C:['01111','10000','10000','10000','10000','10000','01111'],O:['01110','10001','10001','10001','10001','10001','01110'],N:['10001','11001','11001','10101','10011','10011','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],A:['01110','10001','10001','11111','10001','10001','10001'],R:['11110','10001','10001','11110','10100','10010','10001'],E:['11111','10000','10000','11110','10000','10000','11111']
});
function blockLettering(word,u,v,{x,y,width,height}){if(u<x||u>=x+width||v<y||v>=y+height)return false;const px=Math.floor((u-x)/width*(word.length*6-1)),letter=Math.floor(px/6),column=px%6,row=Math.floor((v-y)/height*7);return column<5&&marqueeFont[word[letter]]?.[row]?.[column]==='1';}
const TAU=2*Math.PI;
const quadrants=' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█';
const inks=['000000','aa0000','00aa00','aa5500','0000aa','aa00aa','00aaaa','aaaaaa',
 '555555','ff5555','55ff55','ffff55','5555ff','ff55ff','55ffff','ffffff'];
const rgb=inks.map(hex=>[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)));
const colourDistance=rgb.map(a=>rgb.map(b=>a.reduce((sum,n,i)=>sum+(n-b[i])**2,0)));

function grain(x,y,seed){
 let h=Math.imul(x+71,374761393)^Math.imul(y+139,668265263)^(seed>>>0);
 h=Math.imul(h^(h>>>16),0x85ebca6b);
 h=Math.imul(h^(h>>>13),0xc2b2ae35);
 return ((h^(h>>>16))>>>0)/4294967295;
}

// These bounded procedural plates sample the actual scene at the host time.
// Quarter-blocks give two samples across and down each ANSI character.
function livePlate(kind,width,height,seed){
 const W=width*2,H=height*2,theme=ansiSessionTheme(seed);
 const galaxy=kind==='spiral-galaxy',clearing=kind==='aurora-home';
 const scale=Math.min(W*.59,H*1.08);
 const sky=Uint8Array.from({length:W*H},(_,i)=>{
  const n=grain(i%W,Math.floor(i/W),seed);
  return n>.9988?7:n>.993?8:0;
 });
 const geometry=galaxy?Array.from(sky,(_,i)=>{
  const x=(i%W+.5-W*.50)/scale,y=(Math.floor(i/W)+.5-H*.50)*2/scale;
  const rx=.977*x-.213*y,ry=(.213*x+.977*y)/.57;
  const r=Math.hypot(rx,ry);
  return {r,near:clamp(.5+ry*.55,0,1),phase:Math.atan2(ry,rx)-1.85*Math.log(.15+r),
          grain:grain(i%W,Math.floor(i/W),seed+73)};
 }):null;
 const stars=galaxy?Array.from({length:230},(_,i)=>{
  const r=.13+.88*Math.sqrt(grain(i,1,seed));
  return {r,angle:(i%2)*Math.PI+1.85*Math.log(.15+r)+(grain(i,2,seed)-.5)*.95,
          z:(grain(i,3,seed)-.5)*(.20-.07*r),drift:.70+grain(i,4,seed)*.62,light:grain(i,5,seed)};
 }):[];
 const clouds=galaxy?null:Array.from({length:W},(_,x)=>{
  const u=x/W;
  return {bank:.29+.056*Math.sin(u*8+1)+.029*Math.sin(u*19),
          far:.62-.17*Math.sin(u*3.2+.43)-.035*Math.cos(u*14),
          mid:.74-.16*Math.sin(u*5.9+1.1)-.04*Math.sin(u*15),
          near:.88-.12*Math.cos(u*8.3)+.025*Math.sin(u*28)};
 });
 const lightning=[[.68,.24],[.65,.34],[.70,.38],[.65,.48],[.67,.52],[.61,.65]];
 const fork=[[.70,.38],[.74,.43],[.72,.50],[.79,.57]];
 const homes=[[.14,.77],[.22,.82],[.26,.83],[.80,.78]];
 const lineDistance=(x,y,points)=>{
  let d=1;
  for(let i=1;i<points.length;i++){
   const [ax,ay]=points[i-1],[bx,by]=points[i],dx=bx-ax,dy=by-ay;
   const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
   d=Math.min(d,Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }
  return d;
 };
 function frame(seconds){
  const pixels=sky.slice(),time=Number.isFinite(seconds)?Math.max(0,seconds):0;
  if(galaxy){
   for(let i=0;i<pixels.length;i++){
    const {r,near,phase,grain:n}=geometry[i];
    if(r>1.08)continue;
    const core=Math.exp(-r*r*25)*(.90+n*.12);
    const arm=Math.pow(Math.max(0,Math.cos(2*(phase-time*(.036+.058*r)))),6);
    const tail=Math.pow(Math.max(0,Math.cos(2*(phase-time*(.036+.058*r)-.34))),5);
    const glow=arm*Math.max(0,1-r*.87)*(.65+.35*near);
    if(core>.83)pixels[i]=15;
    else if(core>.55)pixels[i]=11;
    else if(core>.29)pixels[i]=n>.60?11:3;
    else if(glow>.64)pixels[i]=n>.66?14:6;
    else if(glow>.41)pixels[i]=n>.56?14:12;
    else if(glow>.21)pixels[i]=n>.76?12:4;
    else if(glow>.08&&n>.35)pixels[i]=n>.78?5:4;
    else if((tail>.59&&r>.19&&r<.94&&n>.31)||(r<.48&&n>.89))pixels[i]=5;
   }
   for(const s of stars){
    const a=s.angle+time*(.046+.145*s.r)*s.drift;
    const x=s.r*Math.cos(a),y=s.r*Math.sin(a)*.57+s.z;
    const col=Math.floor(W*.50+scale*(.977*x+.213*y));
    const row=Math.floor(H*.50+scale*(-.213*x+.977*y)/2);
    if(col<0||row<0||col>=W||row>=H)continue;
    const i=row*W+col;
    if(pixels[i]===15||pixels[i]===11)continue;
    const light=s.light+(y>0?.08:0);
    pixels[i]=light>.94?15:light>.75?14:light>.52?12:light>.22?6:5;
   }
  }else{
  const beat=(time+2.6)%9.7,flash=!clearing&&beat>4.6&&beat<5.1?Math.sin((beat-4.6)*2*Math.PI):0;
   for(let row=0;row<H;row++)for(let col=0;col<W;col++){
    const i=row*W+col,x=(col+.5)/W,y=(row+.5)/H,n=grain(col,row,seed+11);
    const {bank,far,mid,near}=clouds[col];
    const cloudEdge=bank+.17+.02*Math.sin(x*19+time*.23);
    const cloudVein=.034*Math.sin(x*11+y*18-time*.36);
    if(y>near) pixels[i]=0;
    else if(y>mid) pixels[i]=y<mid+.027&&n>.53?6:y<mid+.065?4:0;
    else if(y>far) pixels[i]=y<far+.038?(n>.50?12:4):y<far+.13?4:8;
    else if(!clearing&&y>bank&&y<cloudEdge){
     pixels[i]=y+cloudVein>cloudEdge-.04?(n>.42?8:4):4;
     if(y<bank+.022&&n>.75)pixels[i]=5;
    }
    if(clearing&&y<far){
     const ribbon=.29-.12*Math.sin(x*4+time*.20)+.035*Math.sin(x*12-time*.26);
     const distance=Math.abs(y-ribbon);
     if(distance<.013)pixels[i]=x>.70?14:6;
     else if(distance<.040&&n>.40)pixels[i]=x>.58?5:2;
     else if(distance<.074&&n>.75)pixels[i]=1;
    }
    if(y<far&&flash>.17){
     const d=Math.min(lineDistance(x,y,lightning),lineDistance(x,y,fork)*1.45);
     if(d<.007)pixels[i]=15;
     else if(d<.023*flash)pixels[i]=12;
    }
    // A small, recognisable cluster of roofs and warm windows in the valley.
    for(const [homeX,homeY] of homes){
     const dx=Math.abs(x-homeX),dy=y-homeY;
     if(dy>=0&&dy<.035&&dx<.017)pixels[i]=8;
     if(dy<0&&dy>-.024&&dx<.022*(dy+.024)/.024)pixels[i]=7;
     if(dy>.014&&dy<.026&&dx<.009)pixels[i]=n>.13?11:3;
    }
   }
  }
  return Array.from({length:width*height},(_,i)=>{
   const row=Math.floor(i/width),column=i%width,p=row*2*W+column*2;
   const sample=[pixels[p],pixels[p+1],pixels[p+W],pixels[p+W+1]];
   if(sample.every(colour=>colour===sample[0]))
    return {glyph:' ',fg:7,bg:sample[0],row:row+1,column:column+1};
   let fg=sample[0],bg=fg,best=Infinity;
   for(const a of sample)for(const b of sample){
    const score=sample.reduce((cost,c)=>cost+Math.min(colourDistance[c][a],colourDistance[c][b]),0);
    if(score<best){best=score;fg=a;bg=b;}
   }
   const mask=sample.reduce((out,c,j)=>out|(colourDistance[c][fg]<colourDistance[c][bg]?1<<j:0),0);
   return {glyph:quadrants[mask],fg,bg,row:row+1,column:column+1};
  });
 }
 return {kind,theme,cells:frame(0),tracks:[],frame};
}

function buildAnsiScene(kind,{width=44,height=14,seed=0,stage=0}={}){
 if(!Number.isInteger(width)||width<20||width>80||!Number.isInteger(height)||height<6||height>50)throw Error('Bounded ANSI painting required');
 if(['spiral-galaxy','monsoon-ridge','aurora-home'].includes(kind))return livePlate(kind,width,height,seed);
 const theme=ansiSessionTheme(seed),p=theme.palette,H=height*2;
 const noise=(x,y)=>{let h=Math.imul(x+71,374761393)^Math.imul(y+139,668265263)^(seed>>>0);h=Math.imul(h^(h>>>16),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967295;};
 function inside(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
 function foreground(x,y,frame){
  const u=(x+.5)/(width*2),v=(y+.5)/H,t=frame*Math.PI/3;
  if(kind==='postmark-stamp'){
   // Perforated first-issue stamp, paper shadow, two orbit marks and a seed.
   const qx=(u-.485)*2,qy=(v-.49)*2,edge=Math.max(Math.abs(qx)/.80,Math.abs(qy)/.91);
   if(edge>.99)return edge<1.07&&qx>-.76&&qy>-.86?8:noise(x,y)>.996?6:0;
   if(edge>.90){
    const along=Math.abs(qx)/.80>Math.abs(qy)/.91?qy:qx;
    return Math.abs(Math.sin(along*35.))>.88?0:edge>.96?7:15;
   }
   if(edge>.82)return 3;
   const a=Math.atan2((qy+.22)*1.30,qx),r=Math.hypot(qx,(qy+.22)*1.30);
   const petal=.22+.13*Math.cos(6*a)+.034*Math.sin(a*12);
   if(r<.072)return r<.031?15:11;
   if(r<petal&&r>.061){
    const vein=Math.abs(Math.sin(6*a))*r;
    if(vein<.016)return r>.14?15:11;
    return r>petal-.038?14:r<.18?13:12;
   }
   if(Math.abs(qx-.035*Math.sin(qy*6))<.027&&qy>-.04&&qy<.56)return 10;
   for(const side of [-1,1]){
    const dx=side*qx-.14,dy=qy-.28+side*.09+dx*.54;
    if(Math.hypot(dx/.15,dy/.067)<1)return dy<0?10:2;
   }
   const orbit=Math.hypot(qx,(qy+.13)*1.45);
   if(Math.abs(orbit-.53)<.015)return Math.sin(a*9+t)>.76?14:6;
   if(Math.abs(qy-.64)<.018&&Math.abs(qx)<.54)return qx<-.30||qx>.31?6:14;
   if(noise(x,y)>.978)return noise(x+22,y)>.6?15:8;
   return 4;
  }
  if(kind==='quay'){
   // A luggage-service room: wall, supervised hatch, suitcase, belt, route
   // record, isolated relay and worker. Never substitute a ship for the room.
   if(v>.76){if(v<.80)return 7;if(v<.86)return (Math.floor(u*40)+(stage===0?frame:0))%5===0?11:8;return Math.floor(u*27)%3===0?8:0;}
   const sx=.67+(stage===0?.035*Math.sin(t):0);
   if(Math.abs(u-sx)<.15&&v>.44&&v<.73){if(v<.47||Math.abs(u-sx)>.135)return 10;if(Math.abs(u-sx)>.10||v>.69)return 2;if(Math.abs(u-sx)<.008||Math.abs(u-sx-.078)<.008)return 6;return 2;}
   if(v>.39&&v<.45&&Math.abs(u-sx)<.06)return Math.abs(u-sx)>.038||v<.405?3:0;
   if(u>sx+.07&&u<sx+.13&&v>.47&&v<.59)return (x+y)%5===0?3:11;
   if(u>.51&&u<.96&&v>.14&&v<.74){
    if(u<.535||u>.935||v<.18)return 8;
    if(v<.24)return Math.floor(u*48)%2?7:11;
    if(u>.54&&u<.92){if(u<.57||u>.90)return 6;return 0;}
   }
   // Human porter in a blue service coat, visibly separated from equipment.
   if(Math.hypot((u-.30)*1.7,v-.32)<.065){if(v>.315&&v<.33&&(Math.abs(u-.281)<.008||Math.abs(u-.311)<.008))return 0;return v<.30?3:u<.29?7:15;}
   if(v>.38&&v<.69&&Math.abs(u-.30)<.09*(1-(v-.38))){if(Math.abs(u-.30)<.008)return 6;return u<.28?4:12;}
   if(v>.43&&v<.48&&u>.34&&u<.46)return 7;
   // Bench apparatus is connected by a visible cable, with a warning lamp.
   if(u>.055&&u<.20&&v>.47&&v<.70){if(v<.49||u<.065||u>.19)return 7;if(v<.56)return frame%3?9:11;return Math.floor(u*90)%3===0?6:0;}
   if(u>.07&&u<.18&&v>.23&&v<.40){if(v<.245)return 3;return Math.floor(v*H)%3===0?8:7;}
   if(u>.17&&u<.53&&Math.abs(v-(.72-.06*Math.sin(u*14)))<.01)return 6;
   if(v>.07&&v<.105)return u<.40?6:8;
   return Math.floor(u*8)%2===0?4:v>.72?8:0;
  }
  if(kind==='auction'){
   const globe=Math.hypot((u-.72)*1.3,v-.44);
   if(globe<.23){if(globe>.214)return 14;const window=u>.68&&u<.80&&v>.42&&v<.55;if(window)return Math.abs(u-.74)<.007||Math.abs(v-.485)<.007?3:11;return Math.sin(u*35+v*18)>.4?2:4;}
   if(u>.08&&u<.43&&v>.23&&v<.66){if(u<.10||u>.41||v<.26||v>.62)return 8;if(v<.29||v>.59)return 6;if(u>.18&&u<.33&&v>.39&&v<.43)return 14;return 0;}
   if(u>.05&&u<.46&&v>.66&&v<.71)return 7;
   if(v>.76&&v<.80)return 3;
   if(u>.47&&u<.51&&v>.64&&v<.76)return v<.67?9:3;
   if(u>.40&&u<.73&&Math.abs(v-(.72-.05*Math.sin(u*18)))<.012)return frame%3?6:14;
   if(v>.80)return Math.abs((u-.5)*2)<(v-.78)?8:0;
   if(v<.13)return Math.floor(u*29)%3?8:3;
   return Math.floor(u*12)%3===0?8:0;
  }
  if(kind==='eye'){
   const nx=(u-.5)*2,dy=(v-.5)*2,opening=.43*Math.pow(Math.max(0,1-nx*nx),.72),ex=(u-.5)*(width/height),ey=(v-.5)*2,iris=Math.hypot(ex,ey),pupil=.035+.008*Math.sin(t);
   if(Math.abs(dy)<opening&&Math.abs(nx)<.98){
    if(iris<.38){if((ex/pupil)**2+(ey/.33)**2<1)return 0;
     if(Math.hypot(ex+.10,ey+.14)<.045)return 15;
     const fibres=Math.sin(Math.atan2(ey,ex)*18+iris*24)+Math.cos(iris*40),ring=iris>.34;
     return ring?3:iris<.13?11:fibres>1?11:fibres>-.2?9:1;}
    return Math.abs(dy)>opening-.045?1:Math.abs(nx)>.64?1:Math.abs(nx)>.32?9:11;
   }
   if(Math.abs(dy)<opening+.065&&Math.abs(nx)<.99)return dy<0?12:6;
   const wx=x+1.1*Math.sin(y*.19),wy=y+.7*Math.sin(x*.14),row=Math.floor(wy/10);let nearest={d:9,dx:0,dy:0,variation:0};
   for(let rr=row-1;rr<=row+1;rr++){const offset=(rr%2)*7,col=Math.round((wx-offset)/14);for(let cc=col-1;cc<=col+1;cc++){const n=noise(cc,rr),cx=cc*14+offset+(n-.5),cy=rr*10+(noise(rr,cc)-.5),dx=(wx-cx)/(7.6+n*1.2),dy=(wy-cy)/(6.1+n*.9),d=dx*dx+dy*dy;if(d<nearest.d)nearest={d,dx,dy,variation:n};}}
   const {d,dx:scaleX,dy:scaleY,variation}=nearest,light=Math.max(0,1-d)*.48-scaleX*.16-scaleY*.19+variation*.08;
   if(d>.82)return 4;if(d>.66)return 12;
   if(light>.7&&noise(x,y)>.72)return 15;return light>.49?14:light>.18?12:4;
  }
  if(kind==='city'){
   // Bitcoin Billionaire: a gold coin over a working city, not a generic moon.
   const aspect=width/(height*2),dx=(u-.27)*aspect,dy=v-.515,coin=Math.hypot(dx,dy),horizon=.73,office=[13,14,11,10,14,13][frame];
   const letterHeight=Math.max(.105,7/H),signs=[['BITCOIN',{x:.22,y:.008,width:.56,height:letterHeight}],['BILLIONAIRE',{x:.045,y:.028+letterHeight,width:.91,height:letterHeight}]];
   for(const [word,box]of signs){if(blockLettering(word,u,v,box)){const glint=Math.abs(u-(frame/5));return glint<.035?15:v<box.y+.024?15:v<box.y+.051?11:9;}
    if(blockLettering(word,u-.009,v-.013,box))return 1;
    if(blockLettering(word,u-.004,v+.007,box))return 6;
   }
   const towers=[[.59,.67,.43],[.67,.75,.32],[.75,.81,.29],[.81,.87,.36],[.87,.94,.48]];
   for(const [left,right,top] of towers)if(u>left&&u<right&&v>top&&v<horizon+.035){
    if(v<top+.010)return 6;if(v<top+.025&&Math.floor(u*180)%4===0)return 4;
    // The large corner office is one intentional beacon in a quiet skyline.
    if(u>.765&&u<.795&&v>.425&&v<.46)return office;
    if(u>.760&&u<.800&&v>.419&&v<.466)return 7;
    const wx=Math.floor((u-left)*55),wy=Math.floor((v-top)*17),window=Math.abs(((u-left)*55)%1-.5)<.10&&Math.abs(((v-top)*17)%1-.5)<.11;
    if(window&&noise(wx+Math.floor(left*100),wy)>.25&&((wx*7+wy+frame)%17!==0))return wy%3===0?7:11;return u<left+.009?8:0;
   }
   if(inside(u,v,[[.752,.30],[.780,.235],[.808,.30]]))return 0;
   if(v>.655&&v<.69&&u<.60){const arches=Math.abs(Math.sin(u*27));if(v<.667||arches>.80)return v<.663?7:0;}
   if(coin<.145){
    const symbol=blockLettering('B',dx,dy,{x:-.073,y:-.105,width:.145,height:.21}),bars=(Math.abs(dx+.040)<.008||Math.abs(dx-.005)<.008)&&Math.abs(dy)<.133&&Math.abs(dy)>.10;
    if(symbol||bars)return 3;
    if(coin>.134)return dy<-.02?15:3;
    if(coin>.126)return 11;
    const shine=Math.abs(dx+dy*.7-(-.12+frame*.048))<.011;return shine?15:dy<.09?11:3;
   }
   if(v>horizon){const depth=(v-horizon)/(1-horizon),centre=.27+.027*Math.sin(v*58+Math.sin(t)*.6),span=.04+depth*.22,shimmer=Math.sin(v*149+Math.sin(t)*.65+u*16);
    if(Math.abs(u-centre)<span&&shimmer>.05){const edge=Math.abs(u-centre)/span;return edge<.33&&shimmer>.6?11:edge<.72?3:4;}
    if(Math.abs(u-.78)<.014+depth*.045&&Math.sin(v*112+t)>.55)return office;
    const wave=Math.sin(v*83+Math.sin(t)*.5+u*12);return wave>.86?4:0;
   }
   if(v>horizon-.018)return 0;
   const cloud=Math.sin(u*7+Math.sin(t)*.04)+Math.sin(v*27+u*3);if(coin<.16)return 6;
   return noise(x,y)>.997&&v<.55?7:cloud>.8&&v>.5?0:4;
  }
  if(kind==='trip'){
   // A garden with a legible focal flower. Music moves whole plants; the
   // backdrop must not compete through random per-cell colour changes.
   const aspect=width/(height*2),plants=[[.5,.36,.28],[.18,.53,.15],[.82,.52,.15]];
   for(let i=0;i<plants.length;i++){const [cx,cy,size]=plants[i],dx=(u-cx)*aspect,dy=v-cy,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),petal=.78+.22*Math.cos(a*9+r*8),edge=size*petal;
    if(r<edge){if(edge-r<.016)return 6;if(r<size*.20)return r<size*.07?15:11;const vein=Math.cos(a*9+r*8),rim=r/Math.max(.001,edge);return rim>.84?13:vein>.6?15:vein>-.25?13:5;}
    const stem=cx+.012*Math.sin((v-cy)*5),root=.93;
    if(v>cy+size*.45&&v<root&&Math.abs(u-stem)<.006)return 10;
    if(v>cy+size*.45&&v<root){for(const side of [-1,1]){const lx=(u-stem-side*.040)*aspect,ly=(v-(cy+.33+side*.035));const leaf=Math.abs(lx/.12)+Math.abs((ly+side*lx*.35)/.055);if(leaf<1)return leaf>.82?2:Math.abs(ly+side*lx*.35)<.010?10:2;}}
   }
   if(v>.93)return Math.floor(u*110)%9===0&&v<.98?2:0;
   // A few distant constellations and a soft garden arch, with empty space
   // separating the petal silhouette from the frame.
   const arch=Math.hypot((u-.5)*aspect,(v-.34)*.85);if(arch>.56&&arch<.565)return 4;
   return noise(x,y)>.998&&v<.74?8:0;
  }
  if(kind==='network'){
   // Server towers above a packet-lit road, with monitors and aerial links.
   const depth=Math.max(.1,v),perspective=(u-.5)/(depth+.2),road=Math.abs(perspective)<.35;
   if(v>.58&&road){if(Math.abs(Math.sin(v*45+t))<.22)return 14;if(Math.abs(perspective)>.30)return 6;return y%3===0?4:0;}
   const lane=Math.floor(u*5),lx=u*5-lane,roof=.12+noise(lane,17)*.28;
   if(v>roof&&v<.87&&lx>.1&&lx<.88){if(lx<.17||lx>.81)return 8;if(Math.abs((v-roof)*7%1-.5)<.12)return (Math.floor(x+frame)%7<2)?15:[6,3,5,2,4][lane];return lx<.5?4:1;}
   if(Math.abs(v-(.14+.045*Math.sin(u*9)))<.016)return Math.abs(u-frame/5)<.09?15:6;
   return noise(x,y)>.998?7:4;
  }
  if(kind==='causality'){
   const curve=.80-.55*Math.exp(-(((u-.35-frame*.045)/.16)**2));if(Math.abs(v-curve)<.035)return 11;
   if(Math.abs(u-.72)<.013&&v>.15&&v<.86)return 13;
   if(v>.86)return 8;if(v>curve&&v<.83&&Math.floor(x/3)%2===0)return p[0];
   return v<.22&&Math.abs(u-(.15+frame*.12))<.035?15:0;
  }
  if(kind==='serpent'){
   const head=Math.hypot((u-.5)*1.2,(v-.18)*1.4);if(head<.095){if(Math.abs(v-.16)<.022&&Math.abs(u-.5)>.025)return Math.abs(u-.5)<.045?0:14;if(v>.205&&Math.abs(u-.5)<.05)return frame===2?0:3;return u<.48?15:v>.205?3:11;}
   const axis=.5+.17*Math.sin((v-.18)*9),radius=.045*(1-(v-.2)*.65);if(v>.23&&v<.91&&Math.abs(u-axis)<radius)return Math.abs(u-axis)<radius*.25?15:Math.sin(v*170+u*33)>0?11:3;
   return 0;
  }
  if(kind==='rose'){
   const dx=(u-.5)*2,dy=(v-.43)*2,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),edge=.53+.17*Math.cos(a*7+r*9+frame*.09);
   if(r<edge)return Math.sin(a*8+r*17)>.65?15:r<.15?11:r<.35?13:5;
   if(Math.abs(dx+.1*Math.sin(dy*4))<.03&&dy>.4)return 2;return 0;
  }
  if(kind==='return'){
   const cx=.52,cy=.48,dx=u-cx,dy=v-cy,body=Math.abs(dx)<.31&&Math.abs(dy)<.22;
   if(body){const flap=Math.abs(dy-(.02-Math.abs(dx)*.62));
    if(Math.abs(dx)>.294||Math.abs(dy)>.203)return dy<0?15:3;
    if(flap<.012)return 3;
    if(Math.hypot(dx,dy-.05)<.048)return Math.abs(dx)<.015?11:1;
    if(dy<-.03&&dy>-.10&&dx<-.10)return 7;return dy<0?11:7;}
   if(u>.12&&u<.89&&v>.75&&v<.80)return v<.77?7:8;
   if(u>.16&&u<.24&&v>.80&&v<.94||u>.79&&u<.86&&v>.80&&v<.94)return 8;
   if(Math.abs(u-(.06+frame*.16))<.015&&v>.23&&v<.69)return 6;
   if(u>.84&&u<.94&&v>.17&&v<.63)return Math.floor(v*30)%3===0?14:4;
   return noise(x,y)>.996&&v<.7?8:0;
  }

  if(kind.startsWith('layer-')){
   const variant=['layer-now','layer-echo','layer-archive','layer-witness'].indexOf(kind);
   if(variant===0){
    if(u>.17&&u<.75&&v>.16&&v<.60){if(u<.2||u>.72||v<.20||v>.55)return 8;if(v>.27&&v<.31&&u<.60)return 14;if(v>.39&&v<.43&&u<.36)return frame%2?15:6;return 4;}
    if(v>.60&&v<.67&&u>.11&&u<.83)return 7;if(u>.40&&u<.48&&v>.55&&v<.65)return 8;
    if(v>.73&&v<.83&&u>.15&&u<.75)return y%3===0?8:7;
   }else if(variant===1){
    for(const cx of [.28,.72]){const rad=Math.hypot((u-cx)*1.4,(v-.4)*1.6);if(rad<.18)return rad<.055?15:Math.sin(Math.atan2(v-.4,u-cx)*5+frame*.16)>.3?7:3;}
    if(v>.19&&v<.68&&u>.10&&u<.90)return v>.63||u<.14||u>.86?8:4;
    if(v>.70&&v<.76)return Math.abs(Math.sin(u*28+frame*.5))>.75?11:3;
   }else if(variant===2){
    const lane=Math.floor(u*5),local=u*5-lane,roof=.17+.06*Math.abs(lane-2);
    if(v>roof&&v<.87&&local>.12&&local<.85){if(y%7===0)return 3;if(local<.20||local>.78)return 8;return x%3===0?3:5;}
    if(v>.87)return u>.38&&u<.62?Math.floor(v*50)%3===0?7:8:0;
   }else{
    const r=Math.hypot((u-.5)*1.2,(v-.44)*1.4);
    if(r<.26){if(r>.22)return 8;const jewel=Math.abs(u-.5)*2+Math.abs(v-.44);return jewel<.17?Math.sin(u*23+v*19+frame*.18)>.25?10:2:4;}
    if(v>.69&&v<.76&&u>.21&&u<.79)return 7;if(Math.abs(u-.5)<.03&&v>.65&&v<.8)return 8;
    if(Math.abs(v-.83)<.025)return Math.abs(u-frame/6)<.06?15:6;
   }
   if(v>.90)return 8;return 0;
  }
  if(kind==='models'){
   const lane=Math.min(2,Math.floor(u*3)),lx=(u*3-lane-.5)*2,dy=(v-.40)*2,rad=Math.hypot(lx*.8,dy);
   if(v>.17&&v<.76&&Math.abs(lx)<.81){
    if(Math.abs(lx)>.7||v<.20||v>.72)return [6,3,5][lane];
    if(lane===0&&rad<.38)return Math.sin(lx*15+dy*17+frame*.22)>.3?14:6;
    if(lane===1&&Math.max(Math.abs(lx),Math.abs(dy))<.27)return Math.abs(lx+dy)<.08?15:11;
    if(lane===2&&Math.abs(rad-.27)<.055)return Math.sin(Math.atan2(dy,lx)*6+frame*.2)>.2?13:7;
    if(v>.60&&v<.66)return (Math.floor(x+frame)%5<2)?15:8;return 4;
   }
   if(v>.80&&v<.86)return 7;if(v>.90)return 8;return 0;
  }
  if(kind==='family'){
   const lane=Math.min(2,Math.floor(u*3)),a=(u*3-lane-.5)*2,b=(v-.45)*3.6,ax=Math.abs(a);
   // Three authored materials and silhouettes: cut steel, bronze, hooded glass.
   const edge=lane===0?.76-Math.max(0,b-.24)*.62-Math.max(0,-b-.48)*.45:lane===1?.83-Math.max(0,b-.05)*.68-Math.max(0,-b-.36)*.38:.73-Math.max(0,b-.18)*.48;
   if(v>.71&&v<.92&&ax<.88){if(Math.abs(v-.74)<.02)return 7;return ax>.65?[4,3,5][lane]:ax<.15?8:[6,3,5][lane];}
   if(Math.abs(b)>.84||b<(lane===0?-.79+.12*ax:lane===1?-.72+.18*ax:-.86+.07*ax)||ax>edge)return v>.93&&ax<.65?8:0;
   const dark=[4,3,5][lane],mid=[6,3,5][lane],light=[7,7,7][lane];
   let colour=ax>edge-.09?dark:(a<-.18?mid:light);
   if(lane===2&&ax>edge-.22)return (Math.floor(ax*25+b*12)%3===0)?7:5;
   // Brow plates, recessed orbital rims and separately changing eyelids.
   const eyeX=Math.abs(a)-.34,eyeY=b+.20,eye=Math.abs(eyeX)/.19+Math.abs(eyeY)/.14;
   if(eye<1.38){if(eye>1)return lane===1?11:7;
    const blink=lane===0?(frame===3?.02:frame===4?.07:.11):lane===2?(frame===1?.02:frame===2?.06:.10):.11;
    if(Math.abs(eyeY)>blink)return dark;
    if(Math.abs(eyeX)<.035)return 0;
    return Math.abs(eyeX+.075)<.045&&eyeY<0?15:lane===1?14:lane===2?11:14;
   }
   if(Math.abs(b+.39+.10*ax)<.035&&ax>.13&&ax<.63)return lane===1?7:dark;
   // Faceted nose bridge and nostrils, cheek cuts, bevels and offset panel seams.
   if(ax<.13&&b>-.14&&b<.25)return ax<.035?15:a<0?dark:7;
   if(b>.17&&b<.26&&ax>.07&&ax<.17)return 0;
   if(Math.abs(b-(.16+.35*ax))<.035&&ax>.25)return dark;
   if(Math.abs(b-(.23+.35*ax))<.025&&ax>.26)return lane===0?14:lane===1?11:7;
   const mouthOpen=lane===0?[.035,.055,.11,.075,.04,.025][frame]:lane===2?[.035,.055,.035,.025,.035,.05][frame]:.055;
   if(ax<.30&&Math.abs(b-.43)<mouthOpen)return Math.abs(b-.43)>mouthOpen*.7?7:0;
   if(Math.abs(b-.55)<.025&&ax<.24)return mid;
   if(ax>edge-.18&&b>.20&&b<.55)return Math.floor(b*45)%2===0?0:7;
   if(lane===0&&(ax>.48||b<-.4)&&Math.abs((a+.12*b)*5%1)<.08)return 4;
   if(lane===1&&Math.abs(ax-.50+.13*Math.sin(b*7))<.028)return 3;
   if(lane===2&&Math.abs(ax+b*.4-.45)<.035)return 13;
   // Dither within a material, never a flat oval flood fill.

   if(ax<.46&&b<-.52)return (x%3===0)?light:dark;
   return colour;
  }
  if(kind==='convoy'){
   const planet=Math.hypot((u-.86)*1.25,(v-.54)*1.6);
   if(planet<.18){if(planet>.16)return 14;const fields=Math.sin(u*90)*Math.sin(v*64);return fields>.25?10:fields<-.5?3:2;}
   if(Math.abs(u-.72)<.012&&v>.2&&v<.85)return 5;
   const lane=Math.abs(v-(.75-.26*u));if(lane<.006)return 4;
   if(v>.8&&u<.3&&Math.floor(u*80)%7<3)return Math.floor(v*40)%2?3:8;
   return noise(x,y)>.995?7:noise(x,y)>.99?8:0;
  }
  if(kind==='mailrun'){
   const nodes=[[.15,.53],[.50,.32],[.85,.53]],step=Math.max(0,Math.min(3,stage));
   // Physical relay machines, glass cores and cable trunks in a dock cavern.
   for(let i=0;i<3;i++){const [cx,cy]=nodes[i],dx=u-cx,dy=v-cy,lit=i<step?10:i===step?14:3;
    if(Math.abs(dx)<.12&&Math.abs(dy)<.105&&Math.abs(dx)+Math.abs(dy)*.55<.16){
     if(Math.abs(dx)>.09||Math.abs(dy)>.075)return dx<0?7:8;
     if(Math.abs(dy+.025)<.015&&dx<.045)return lit;
     if(Math.abs(dy-.025)<.012&&dx<-.025)return frame%3===0?15:lit;
     return 4;
    }
    if(Math.abs(dx)<.025&&dy>.10&&dy<.20)return dx<0?7:8;
    if(Math.abs(dx)<.15&&dy>.19&&dy<.25)return dy<.22?7:8;
   }
   for(let i=0;i<2;i++){const a=nodes[i],b=nodes[i+1],t0=(u-a[0])/(b[0]-a[0]),yy=a[1]+(b[1]-a[1])*t0+.16;
    if(t0>0&&t0<1&&Math.abs(v-yy)<.018)return Math.abs(t0-frame/5)<.12?15:i<step?10:6;
    if(t0>0&&t0<1&&Math.abs(v-yy-.035)<.014)return 8;
   }
   if(v>.96)return 8;if(v>.87)return 4;
   if(u<.035||u>.965)return y%5===0?3:8;
   const sx=.10+.78*Math.min(1,step/3),sy=.80;
   if(Math.abs(v-sy)<.025&&Math.abs(u-sx)<.07)return Math.abs(u-sx)<.025?15:14;
   if(v>sy+.02&&v<sy+.08&&Math.abs(u-sx)<.04)return frame%2?6:11;
   return noise(x,y)>.995?7:0;
  }
  if(kind==='beacon'){
   // A receiver on a deserted shore: someone must still answer the line.
   const planet=Math.hypot((u-.76)*1.3,(v-.25)*2.1);
   if(planet<.24){const band=Math.sin(u*38+v*29);return planet>.21?13:band>.55?5:band>-.5?4:1;}
   const horizon=.73,water=v>horizon,beam=Math.abs(u-(.22+.56*frame/5));
   if(Math.abs(v-.30)<.012&&u>.29&&u<.85)return beam<.10?15:6;
   if(u>.17&&u<.38&&v>.29&&v<.77){const edge=.026+Math.max(0,v-.4)*.15,dx=Math.abs(u-.275);if(dx<edge){if(Math.abs(v-.48)<.025||Math.abs(v-.65)<.02)return 3;if(dx>edge-.015)return 14;if(x%5===0)return 8;return u<.275?6:4;}}
   if(Math.hypot((u-.275)*1.6,(v-.30)*3)<.13)return Math.abs(v-.30)<.025?11:Math.abs(u-.275)<.035?15:3;
   const cliff=.75+.035*Math.sin(u*20)+.015*Math.sin(u*53);if(v>cliff&&u<.46)return v>cliff+.06?1:8;
   if(water){const ripple=Math.sin(v*70-u*13+t)*.5+Math.cos(u*44+v*23)*.3;if(Math.abs(u-.76)<(.025+(v-horizon)*.12)&&ripple>.4)return 13;if(Math.abs(u-.29)<.08&&ripple>.12)return 11;return 4;}
   if(Math.abs((v-.8)+.13*Math.sin(u*7))<.006&&u>.4)return 6;
   return noise(x,y)>.997?15:noise(x,y)>.992?8:4;
  }
  if(kind==='shipyard'){
   // Dock gantries establish depth; a swept corvette has hull, bridge,
   // radiator wings, twin nacelles and live exhaust instead of a fish oval.
   const X=u,Y=v;
   const body=inside(X,Y,[[.57,.18],[.69,.52],[.61,.74],[.40,.74],[.32,.60]]),wing=inside(X,Y,[[.44,.40],[.25,.55],[.12,.76],[.43,.66],[.50,.57]])||inside(X,Y,[[.61,.40],[.81,.55],[.91,.76],[.60,.66],[.53,.57]]);
   if(body||wing){const seam=Math.abs(Y-.59)<.012||Math.abs(X-.49)<.012;
    if(Math.abs(X-(.54-.06*(Y-.2)))<.028&&Y<.5&&Y>.3)return Y<.39?15:14;
    if(wing){const side=X<.5?1:-1,cut=Math.abs(Y-(.76-Math.abs(X-.52)*.34));if(cut<.009)return 0;if(Y>.54&&Y<.60&&Math.abs(X-.52)>.15&&Math.floor(X*150)%4===0)return 0;return Y>.68?3:seam?4:X<.5?7:8;}
    if(seam)return 4;if(Math.abs(X-.53)<.018&&Y>.5)return 11;if(Y>.51&&Y<.69&&Math.abs(X-.53)>.045&&Math.floor(Y*100)%5<2)return X<.5?8:7;
    return X<.51?7:Y<.39?15:8;
   }
   for(const n of [.36,.66]){
    if(Math.abs(X-n)<.045&&Y>.56&&Y<.79)return Math.abs(X-n)>.032?3:Y>.73?14:7;
    if(Y>=.79&&Y<.86+.025*Math.sin(t)&&Math.abs(X-n)<.034*(1-(Y-.79)*6))return Y<.82?15:12;
   }
   // Service cradles, depth rails, work lights and an open star field.
   const rail=.06+.16*(1-Y);if(Math.abs(X-rail)<.014||Math.abs(X-(1-rail))<.014)return Math.floor(Y*35)%4===0?11:8;
   if(Y<.13||Y>.93)return x%11<2?6:y%3===0?8:4;
   if(Y>.86&&Y<.89&&X>.17&&X<.84)return Math.floor(X*48-frame)%8<2?11:3;
   if(Y>.14&&Y<.26&&Math.abs(X-.50)<.33&&Math.abs(Math.sin(X*24))<.25)return 8;
   return noise(x,y)>.996?7:noise(x,y)>.991?4:0;
  }
  if(kind==='original'||kind==='repair'){
   for(const cx of [.26,.73]){const dx=(u-cx)*1.3,dy=(v-.32),r=Math.hypot(dx,dy),a=Math.atan2(dy,dx)+t*.15;if(r<.19)return r<.035?15:Math.sin(a*3)>.25?8:6;}
   const wave=.65+.07*Math.sin(u*43)+(kind==='repair'?.025*Math.sin(u*91):0);if(Math.abs(v-wave)<.018)return kind==='repair'?11:14;
   return v>.84&&x%3===0?8:0;
  }
  if(kind==='source'){
   // A physical source workbench: recipe glass, cut solid, tool and calipers.
   if(u>.05&&u<.38&&v>.14&&v<.56){if(u<.065||u>.36||v<.16||v>.54)return 8;
    if(v>.23&&v<.25&&u<.29)return 14;if(v>.32&&v<.34&&u<.24)return 10;if(v>.40&&v<.46&&u<.31)return Math.floor(u*60+frame)%7<2?15:6;return 4;}
   const dx=(u-.67)*2,dy=(v-.39)*2,solid=Math.abs(dx)+Math.abs(dy)*.78;
   if(solid<.35){const cut=dx+dy*.4;if(Math.abs(cut-.05)<.025)return 0;
    if(solid>.30)return dy<0?15:3;
    const ribs=Math.abs(Math.sin(dx*36)*Math.cos(dy*28));return ribs>.87?15:cut>.05?3:11;}
   if(u>.47&&u<.86&&v>.66&&v<.68)return 7;
   if((Math.abs(u-.48)<.012||Math.abs(u-.85)<.012)&&v>.53&&v<.69)return 8;
   if(Math.abs(v-(.65-u*.45))<.011&&u>.74&&u<.93)return 7;
   if(Math.abs(u-.92)<.018&&v>.18&&v<.27)return 3;
   if(v>.75&&v<.79&&u>.04&&u<.95)return v<.77?7:8;
   if(v>.79&&v<.91&&(u>.1&&u<.16||u>.83&&u<.89))return 8;
   if(v>.79&&v<.85&&u>.23&&u<.67)return Math.floor(u*45)%5<3?3:4;
   return v>.94?8:noise(x,y)>.996&&v<.72?8:0;
  }

  if(kind==='vault'){
   const tower=Math.floor(u*4),local=(u*4)%1,roof=.14+Math.abs(tower-1.5)*.055;
   if(v<roof)return noise(x,y)>.997?7:0;
   if(local<.09||local>.91)return 8;
   if(v>.9)return 6;
   if(v<roof+.06)return p[2];
   if(Math.abs((v-roof)*6%1-.5)<.14){const stream=(Math.floor(x+frame*2)%11);return stream<2?15:stream<6?[14,11,13,10][tower]:8;}
   return local<.2?p[0]:0;
  }
  if(kind==='engine'){
   // The entity workshop: a carved mask suspended in its service cradle.
   const dx=(u-.5)*2,dy=(v-.44)*2,ax=Math.abs(dx),edge=.56-Math.max(0,dy-.15)*.38;
   const orbit=Math.hypot(dx*.88,dy*.8);if(orbit>.67&&orbit<.69)return Math.abs(Math.sin(Math.atan2(dy,dx)*8+t))>.65?14:6;
   if(dy>-.59&&dy<.66&&ax<edge){
    const eye=Math.hypot((ax-.27)/.18,(dy+.12)/.13);if(eye<1.3){if(eye>1)return 8;if(eye<.42)return frame===3?6:15;return eye<.82?14:0;}
    if(ax<.08&&dy>-.13&&dy<.22)return dx<-.025?6:dx>.025?7:15;
    if(ax>.06&&ax<.13&&dy>.16&&dy<.22)return 0;
    if(ax<.23&&Math.abs(dy-.37)<.035)return frame%3===1?11:0;
    if(Math.abs(dy-(.14+ax*.40))<.028&&ax>.17)return 3;
    if(ax>.39&&dy>.05&&dy<.38)return Math.floor(dy*50)%3===0?0:8;
    const seam=Math.abs(dx-.035*Math.sin(dy*7));if(seam<.012)return 11;
    return ax>edge-.05?8:dx<-.17?6:7;
   }
   for(const side of [-1,1]){const cx=.5+side*.39;if(Math.abs(u-cx)<.018&&v>.18&&v<.78)return u<cx?7:8;if(Math.abs(v-.64)<.012&&Math.abs(u-cx)<.11)return 3;}
   if(v>.81&&v<.85&&u>.14&&u<.86)return v<.826?7:8;
   if(v>.85&&v<.91&&u>.21&&u<.79)return Math.floor(u*48)%5===0?11:4;
   return noise(x,y)>.996&&v<.7?8:0;
  }
  // The forge: chamber walls, a suspended volume, flowing cuts and hot jets.
  const dx=(u-.5)*2,dy=(v-.44)*2,core=Math.abs(dx)+Math.abs(dy*.85);
  if(core<.61){const fold=Math.sin(dx*29+Math.sin(dy*14)*3)*Math.cos(dy*23);return fold>.65?15:fold>.1?11:fold>-.5?3:8;}
  if(Math.abs(dx)>.82)return x%3===0?8:p[0];
  const flame=.7+.08*Math.sin(x*.9+t)+.035*Math.cos(x*2-t);
  if(v>flame&&Math.abs(dx)<.7)return v>flame+.15?1:v>flame+.07?9:11;
  if(y%7===0&&Math.abs(dx)>.3)return p[2];return 0;
 }
 // Quiet environments keep their value below the lit subject. Deliberate
 // black recesses are part of the design; generic texture never fills them.
 function pixel(x,y,frame){
  const ink=foreground(x,y,frame);if(ink!==0)return ink;
  const u=(x+.5)/(width*2),v=(y+.5)/H;
  if(['eye','city','beacon','convoy','trip'].includes(kind))return 0;
  if(kind==='family')return 0;
  if(kind==='shipyard')return 0;
  if(['layer-now','layer-echo','layer-witness','models','vault'].includes(kind)&&v>.94)return y%3===0?8:0;
  return 0;
 }
 const cells=[],candidates=[],quadrants=' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█';
 const rgb=['000000','aa0000','00aa00','aa5500','0000aa','aa00aa','00aaaa','aaaaaa','555555','ff5555','55ff55','ffff55','5555ff','ff55ff','55ffff','ffffff'].map(h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)));
 const distance=(a,b)=>rgb[a].reduce((s,v,i)=>s+(v-rgb[b][i])**2,0);
 for(let row=0;row<height;row++)for(let column=0;column<width;column++){
  const frames=Array.from({length:6},(_,i)=>{const pixels=[pixel(column*2,row*2,i),pixel(column*2+1,row*2,i),pixel(column*2,row*2+1,i),pixel(column*2+1,row*2+1,i)],colours=[...new Set(pixels)];let best=null;
   for(const a of colours)for(const b of colours){const cost=pixels.reduce((n,c)=>n+Math.min(distance(c,a),distance(c,b)),0);if(!best||cost<best.cost)best={a,b,cost};}
   const {a,b}=best,mask=pixels.reduce((n,c,j)=>n|(distance(c,a)<distance(c,b)?1<<j:0),0),hue=kind==='eye'&&Math.hypot((column/width-.5)*(width/height),(row/height-.5)*2)<.39?[0,18,36,54,36,18][i]:0;
   // Dither belongs at a shading boundary, not across every flat sky or hull.
   if(colours.length===1&&a===8&&noise(column,row)>.72)return {glyph:'▓',fg:8,bg:0,hue};
   return {glyph:quadrants[mask],fg:a,bg:b,hue};});
  cells.push({...frames[0],row:row+1,column:column+1});
  if(new Set(frames.map(f=>JSON.stringify(f))).size>1)candidates.push({row:row+1,column:column+1,interval:theme.tempo*2,transition:theme.tempo*2,effect:kind==='family'?'flip':'hue-shift',frames});
 }
 const tracks=kind==='trip'?[]:candidates.length<=192?candidates:Array.from({length:192},(_,i)=>candidates[Math.floor(i*candidates.length/192)]);
 return {cells,tracks,theme,kind};
}

/** An art-only ANSI stream for a denser sprite grid inside a retained region. */
export function ansiSceneProgram(scene,{columns,rows}={}){
 const C=columns||Math.max(...scene.cells.map(c=>c.column)),R=rows||Math.max(...scene.cells.map(c=>c.row));let text='\x1b[2J',prior='';
 for(const c of scene.cells){if(c.column===1)text+='\x1b['+c.row+';1H';const style=c.fg+':'+c.bg;if(style!==prior){text+='\x1b['+(c.fg>7?90+c.fg-8:30+c.fg)+';'+(c.bg>7?100+c.bg-8:40+c.bg)+'m';prior=style;}text+=c.glyph;}
 return {text,grid:{columns:C,rows:R},animation:{tracks:scene.tracks,cymatics:scene.kind==='trip'?[]:[{row:1,column:1,width:C,height:R,style:scene.kind==='trip'?'trip':['city','beacon'].includes(scene.kind)?'water':scene.kind==='rose'?'foliage':'metal',intensity:scene.kind==='trip'?.9:.18}]}};
}

// Rebuilding six authored frames on every hover/score update stole main-
// thread time from input and speech. Eight immutable recipes bound the cache.
const sceneCache=new Map();
export function ansiScene(kind,options={}){
 const key=JSON.stringify([kind,options.width??44,options.height??14,options.seed??0,options.stage??0]);
 if(sceneCache.has(key)){const value=sceneCache.get(key);sceneCache.delete(key);sceneCache.set(key,value);return value;}
 const scene=buildAnsiScene(kind,options),freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;};
 freeze(scene);sceneCache.set(key,scene);if(sceneCache.size>8)sceneCache.delete(sceneCache.keys().next().value);return scene;
}
