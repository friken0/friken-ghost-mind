import {roomReliefCrossing} from './ansi-parallax.mjs';
import {frikMotionSource} from './ansi-frik-motion.mjs?v=lancing-2';
import {frikCraftSurface} from './ansi-frik-craft-surface.mjs?v=lancing-2';

// Shapes read in the coordinate system of the supplied standing sketch.
// The drawing supplies proportions. These ink, relief and movement
// fields are authored for the ANSI++ viewer.
const outlines = [
  // Far leg and three splayed toes
  [1,[248,468,269,451,289,452,302,475,303,512,299,554,303,588,319,614,337,632,
    352,660,343,694,337,734,333,783,332,834,340,867,356,874,378,875,
    405,879,433,898,402,895,374,899,402,918,435,946,404,936,367,919,
    337,917,309,923,284,942,263,974,263,950,280,923,301,905,305,884,
    304,850,308,810,308,765,306,715,292,678,280,651,280,617,281,583,
    269,540,254,510]],
  // Near leg, deeper knee and toe that takes the weight
  [2,[183,449,212,470,242,479,230,509,218,546,212,575,202,606,199,620,
    220,605,231,610,227,630,212,652,200,674,187,699,181,728,178,771,
    170,810,164,854,166,877,173,899,186,912,204,930,211,963,188,947,
    169,927,149,922,128,946,107,983,93,1026,87,1007,92,969,101,944,
    117,923,91,934,65,945,35,960,48,941,65,925,97,909,128,895,
    138,875,142,848,145,812,151,777,154,741,150,712,157,685,171,657,
    178,630,176,599,176,566,181,534,183,509,173,478]],
  // Far arm passes behind the shoulder
  [3,[253,253,276,264,289,283,305,312,320,342,334,367,344,401,352,429,
    365,460,372,494,376,529,375,558,381,591,386,615,392,637,382,656,
    365,654,354,635,351,608,351,579,347,545,340,516,339,493,329,470,
    316,442,307,416,295,383,283,352,272,325,246,291]],
  // Neck rolls forward from the rib cage
  [4,[159,310,173,268,190,238,195,209,196,184,203,160,214,138,230,117,
    251,99,272,88,295,86,313,96,318,115,306,135,288,138,270,141,
    258,151,249,172,245,192,247,216,259,239,275,257,287,280,279,305,
    260,319,210,332,179,331]],
  // Sternum owns the widest plate, then tapers to the pelvis
  [5,[185,240,213,242,245,247,273,264,293,281,307,304,318,335,321,376,
    315,410,303,440,290,458,272,471,245,482,224,500,208,511,187,492,
    178,465,170,432,163,399,157,365,160,326,169,293]],
  [6,[190,245,216,249,246,254,275,268,303,288,318,316,330,354,331,391,
    324,426,309,453,286,478,256,497,228,506,203,491,187,469,174,436,
    166,402,165,357,170,316,178,277]],
  // Frontal skull in three-quarter profile with hanging lower face
  [7,[260,101,241,88,226,61,265,76,247,43,281,62,275,30,303,50,320,42,348,43,371,51,390,65,404,77,
    419,78,435,91,434,116,424,138,417,155,402,161,391,152,387,168,
    375,186,360,190,346,182,342,163,325,160,302,151,287,140,270,138,
    254,132,249,115]],
  [8,[340,78,361,68,381,73,393,87,392,108,382,124,383,144,392,155,
    388,168,376,177,365,171,358,160,357,146,362,131,355,117,342,106]],
  // Distinct square teeth against the jaw shadow
  [9,[339,167,356,169,362,177,359,195,353,201,339,196,334,177]],
  [9,[363,174,380,173,386,181,382,198,374,212,363,206,360,183]],
  // Near forelimb with a weight-bearing elbow and a tapered inner ridge
  [10,[164,276,155,259,140,231,171,247,190,264,196,282,187,293,178,325,160,352,143,383,128,414,119,450,
    117,477,122,511,128,550,128,576,133,609,143,631,141,657,124,663,
    111,644,106,615,107,585,101,556,101,532,94,500,91,467,94,440,
    105,410,118,377,130,345,147,312]],
  // One curved blade per wrist. The additional points at each hinge
  // define an overlapping growth ridge rather than a second finger.
  [11,[361,629,362,607,355,582,339,558,325,533,316,508,312,484,321,495,
    335,510,354,531,373,554,388,580,397,605,397,628,390,649,373,651]],
  [12,[107,626,112,604,126,579,147,558,168,535,179,506,185,472,191,485,
    196,499,192,521,184,537,188,516,177,548,167,566,169,549,156,584,151,609,144,637,130,653,114,648]],
];

const left = .280, top = .063, sx = .000666, sy = .000834;
const width = 1024, height = 600;
// The trunk keeps all of its ink behind the arms. Each forelimb and blade
// has its own scan contours, queried in its own rotating coordinate frame.
const limbIds=[3,11,10,12];
const shape=outlines.filter(([id])=>!limbIds.includes(id));
const armRows=2048;
const armSpans=new Float32Array(armRows*4*4).fill(-1);
for(const [part,vertices] of outlines){
  const layer=limbIds.indexOf(part);
  if(layer<0)continue;
  for(let row=0;row<armRows;row++){
    const v=((row+.5)/armRows-top)/sy,cuts=[];
    for(let i=0,j=vertices.length-2;i<vertices.length;j=i,i+=2){
      const a=vertices[j+1],b=vertices[i+1];
      if((a>v)!==(b>v))cuts.push(left+sx*(vertices[j]+(vertices[i]-vertices[j])*(v-a)/(b-a)));
    }
    cuts.sort((a,b)=>a-b);
    if(cuts.length>4)throw Error('Increase the arm span capacity for this outline');
    armSpans.set(cuts,(row*4+layer)*4);
  }
}
function armCross(x,y,layer){
  const row=Math.floor(y*armRows);
  if(row<0||row>=armRows)return -2;
  const offset=(row*4+layer)*4;
  for(let i=0;i<4;i+=2){
    const lo=armSpans[offset+i],hi=armSpans[offset+i+1];
    if(x>=lo&&x<hi)return 2*(x-lo)/(hi-lo)-1;
  }
  return -2;
}
function limbInkAt(x,y,f,layer,beneath,shoulder,wrist){
  const near=layer>=2,blade=layer%2===1;
  const px=near?.393:.452,py=near?.288:.287;
  const dx=(x-px)*1.714285714,dy=y-py;
  const c=Math.cos(shoulder),s=Math.sin(shoulder);
  x=px+(c*dx+s*dy)/1.714285714;
  y=py-s*dx+c*dy;
  if(blade){
    const wx=near?.364:.530,wy=near?.590:.589;
    const ux=(x-wx)*1.714285714,uy=y-wy,cs=Math.cos(wrist),sn=Math.sin(wrist);
    x=wx+(cs*ux+sn*uy)/1.714285714;
    y=wy-sn*ux+cs*uy;
  }
  const side=armCross(x,y,layer);
  if(side < -1)return beneath;
  const round=Math.sqrt(Math.max(0,1-side*side));
  const key=clamp(.18+round*.62-side*.26-(near?0:.16));
  let ink=mix(blade?0x33383c:0x132f39,blade?0xe1bd83:0xa8a373,key);
  if(blade){
    const bevel=smooth((side+.55+.13*Math.sin(y*26))*6);
    ink=mix(ink,0x59645b,bevel*.34);
    ink=mark(ink,0xe7d4a3,Math.abs(side+.58)*.014,.0014,f.pixel);
  }else{
    const joint=oval(x,y,near?.349:.517,near?.451:.468,.018,.030);
    ink=light(ink,0x304b47,joint,.50);
  }
  const cuff=y-.587+(near?-.35:.31)*(x-(near?.364:.530));
  ink=mark(ink,0x46554b,Math.abs(cuff),.0034,f.pixel);
  return ink;
}
function paintArm(x,y,f,near,under){
  if(y<.205||y>.70)return under;
  const rig=f.rig,arm=rig?(near?rig.leftArm:rig.rightArm):0;
  const claw=rig?(near?rig.leftClaw:rig.rightClaw):0;
  const shoulder=arm*(near?-.39:.31),wrist=claw*(near?.61:-.54);
  const layer=near?2:0;
  return limbInkAt(x,y,f,layer+1,limbInkAt(x,y,f,layer,under,shoulder,wrist),shoulder,wrist);
}

const parts = new Uint8Array(width * height);
const section = new Uint8Array(parts.length);
const boundaries=new Uint8Array(parts.length);
for (const [part, vertices] of shape) {
  for (let row = 0; row < height; row++) {
    const y = ((row + .5) / height - top) / sy;
    const cuts = [];
    for (let i = 0, j = vertices.length - 2; i < vertices.length; j = i, i += 2) {
      const ya = vertices[j + 1], yb = vertices[i + 1];
      if ((ya > y) !== (yb > y)) cuts.push(vertices[j] + (vertices[i] - vertices[j]) * (y - ya) / (yb - ya));
    }
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length; i += 2) {
      const l = (left + cuts[i] * sx) * width;
      const r = (left + cuts[i + 1] * sx) * width;
      const start = Math.ceil(l - .5), finish = Math.ceil(r - .5);
      for (let k = start; k < finish; k++) {
        const address = row * width + k;
        parts[address] = part;
        section[address] = Math.round((k + .5 - l) / (r - l) * 255);
      }
    }
  }
}

// The lookup accelerates interiors. Every source contour keeps its original
// polygon coordinates and is evaluated continuously when the camera reaches it.
for(const [,vertices] of shape){
  for(let i=0,j=vertices.length-2;i<vertices.length;j=i,i+=2){
    const ax=(left+vertices[j]*sx)*width,ay=(top+vertices[j+1]*sy)*height;
    const bx=(left+vertices[i]*sx)*width,by=(top+vertices[i+1]*sy)*height;
    const steps=Math.ceil(Math.max(Math.abs(bx-ax),Math.abs(by-ay))*2);
    for(let step=0;step<=steps;step++){
      const t=steps?step/steps:0;
      const col=Math.floor(ax+(bx-ax)*t),row=Math.floor(ay+(by-ay)*t);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const x=col+dx,y=row+dy;
        if(x>=0&&x<width&&y>=0&&y<height)boundaries[y*width+x]=1;
      }
    }
  }
}
let profileY,profileSpans=[];
function continuousProfile(x,y){
  if(profileY!==y){
    profileY=y;
    profileSpans=[];
    const v=(y-top)/sy;
    for(const [part,vertices] of shape){
      const cuts=[];
      for(let i=0,j=vertices.length-2;i<vertices.length;j=i,i+=2){
        const a=vertices[j+1],b=vertices[i+1];
        if((a>v)!==(b>v))cuts.push(left+sx*(vertices[j]+(vertices[i]-vertices[j])*(v-a)/(b-a)));
      }
      cuts.sort((a,b)=>a-b);
      for(let i=0;i<cuts.length;i+=2)profileSpans.push([part,cuts[i],cuts[i+1]]);
    }
  }
  for(let i=profileSpans.length-1;i>=0;i--){
    const [part,l,r]=profileSpans[i];
    if(x>=l&&x<r)return (part<<8)|Math.round((x-l)/(r-l)*255);
  }
  return 0;
}

const clamp = x => Math.min(1, Math.max(0, x));
const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };
function mix(a, b, t) {
  if(t<=0)return a;
  if(t>=1)return b;
  const w = clamp(t), v = 1 - w;
  return (Math.round((a >> 16 & 255) * v + (b >> 16 & 255) * w) << 16) |
    (Math.round((a >> 8 & 255) * v + (b >> 8 & 255) * w) << 8) |
    Math.round((a & 255) * v + (b & 255) * w);
}
const oval = (x,y,cx,cy,rx,ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
const repeat = (n,s) => Math.abs(n - Math.round(n / s) * s);
const addr = (x, y) => Math.floor(y * height) * width + Math.floor(x * width);

function mark(ink, tint, d, w, pixel) {
  if (d > w + pixel || pixel > w * 6) return ink;
  return mix(ink, tint, Math.min(1, w / pixel) * clamp((w + pixel * .48 - d) / pixel));
}
function light(color, tint, distance, amount) {
  return distance < 1 ? mix(color, tint, (1 - distance) ** 2 * amount) : color;
}
const materials = [
  [0x071923,0x355248,0x8b9e75],[0x0d2027,0x52664c,0xacc087],
  [0x0d222b,0x365344,0x859e74],[0x0c212b,0x567058,0xa9b879],
  [0x091e25,0x3a5144,0x8aa36e],[0x182c2c,0x637b51,0xb9bd76],
  [0x10232b,0x647951,0xbcc88a],[0x293e32,0x7f9252,0xd1c782],
  [0x475341,0x9eaa79,0xe0d3a0],[0x0c232a,0x597151,0x9ab387],
  [0x243733,0x8c9b6e,0xd4c89a],[0x27372f,0xa7ad7b,0xe5d0a1],
];

// Both the neck and torso sample these same overlapping ventral folds.
// The outer lobes taper into the flank; the bottom lip rolls over its pad.
const folds = [
  [.187,.022,.034,.035], [.214,.027,.043,.047], [.246,.034,.054,.059],
  [.286,.041,.065,.076], [.334,.049,.076,.094], [.389,.056,.079,.110],
  [.445,.054,.066,.119], [.487,.042,.046,.095],
];
const flesh = part => part > 0 && part !== 9 && part < 11;
const compatible = (a,b) => a === b || flesh(a) && flesh(b);
function createFrikSurface() {
  const rawDepth = new Float32Array(parts.length);
  const overhang = new Float32Array(parts.length);
  let pigments = new Uint32Array(parts.length);
  for (let row = 0; row < height; row++) {
    const y = (row + .5) / height;
    for (let col = 0; col < width; col++) {
      const i = row * width + col;
      const part = parts[i];
      if (!part) continue;
      const x = (col + .5) / width;
      const rr = section[i] / 127.5 - 1;
      const crown = Math.sqrt(Math.max(0, 1 - rr * rr));
      let z = .26 + .33 * crown;
      let ink = materials[part - 1][1];
      if (part >= 4 && part <= 8) {
        const turn = smooth((y - .22) / .19);
        const keel = .445 - .019 * Math.exp(-((y - .218) ** 2) / .005) + .029 * turn;
        const flank = (x - keel) / (.039 + .031 * turn);
        const ventral = smooth((1 - Math.abs(flank)) * 2) * smooth((y - .156) * 18) *
          smooth((.509 - y) * 28);
        z = .37 + .21 * Math.sqrt(Math.max(0,1-flank*flank)) + .055 * crown;
        ink = mix(0x416859,0xa68d59,ventral * .8);
        for (const [bottom, length, halfWidth, drop] of folds) {
          if (Math.abs(y - bottom) > length + .016) continue;
          const lateral = (x - keel) / halfWidth;
          const wrap = Math.max(0,1-lateral*lateral);
          const lip = bottom - .019 * (1-wrap) + lateral*.004;
          const t = (y - lip + length) / length;
          // The last quarter is a rounded, overhanging lip with a contact shadow.
          const roll = Math.sqrt(Math.max(0,Math.sin(Math.PI*smooth(t/1.08))));
          z += drop * roll * wrap;
          const shadow = smooth((t-.87)/.16) * smooth((1.20-t)/.19) * wrap;
          overhang[i] = Math.max(overhang[i],shadow);
        }
        if (y < .234) {
          const skull = Math.sqrt(Math.max(0,1-oval(x,y,.515,.140,.081,.082)));
          const jaw = Math.sqrt(Math.max(0,1-oval(x,y,.531,.177,.049,.051)));
          const join = smooth((x-.459)*17)*smooth((.234-y)*19);
          const cheek=Math.max(0,1-oval(x,y,.537,.177,.037,.042));
          const nasal=Math.max(0,1-oval(x,y,.553,.174,.016,.026));
          const socket=oval(x,y,.493,.129,.031,.046);
          const brow=Math.exp(-((socket-1.20)**2)/.12)*smooth((.139-y)*40);
          const hinge=Math.max(0,1-oval(x,y,.525,.198,.022,.017));
          z = z*(1-join) + Math.min(1.10,.33+.53*skull+.22*jaw+.15*cheek+
            .08*nasal+.052*brow+.045*hinge)*join;
          ink = mix(ink,0x78865d,join);
        }
      }
      if (part <= 3 || part === 10) {
        const knee = (part <= 2 ? .602 : .448) + rr * .013;
        z += .084 * crown * Math.exp(-((y-knee)**2)/.0011);
        if (part === 10) z += .12 * crown * Math.exp(-((y-.318)**2)/.0027);
      }
      if(part!==9){
        const keel=.446+.029*smooth((y-.22)/.19);
        const ventral=part>=4&&part<=6&&Math.abs(x-keel)<.041;
        const slot=part===11||part===12?1:ventral?1:part<=3||part===10?4:0;
        const u=x*7+y*.47,v=y*3.1;
        z+=(frikCraftSurface(slot,u,v)-.5)*(ventral?.014:.009);
        ink=mix(ink,ventral?0xbbac76:0x2e5a54,frikCraftSurface(slot,u,v,1)*.24);
      }
      // Overlapping branchial shields share the shoulder's height field and rig.
      if ((part===10 || part===4 || part===7) && y<.42) {
        const shoulder=oval(x,y,.396,.296,.040,.105);
        const occiput=oval(x,y,.467,.125,.048,.048);
        const mask=smooth(1-Math.min(shoulder,occiput));
        const course=y+.48*x+.011*Math.cos(x*94);
        const plate=.5+.5*Math.cos(course*245);
        z+=mask*(.11*plate-.034);
        ink=mix(ink,mix(0x244858,0xbe9e51,plate),mask*.86);
      }
      if (part===5 || part===6) {
        const center=.444+.028*smooth((y-.24)/.19);
        const side=(x-center)/.066;
        const apron=smooth((1-Math.abs(side))*4)*smooth((y-.24)*16);
        const scallop=.5+.5*Math.cos((y-.020*(1-side*side))*121);
        ink=mix(ink,mix(0x794d32,0xe7bb79,scallop),apron*.78);
      }
      if(part===11 || part===12){
        const bevel=smooth(1-Math.abs(rr+.30)*2);
        z+=.11*bevel;
        ink=mix(0x25394a,0xd7ab72,.16+.73*bevel);
      }
      rawDepth[i] = z;
      pigments[i] = ink;
    }
  }
  // Regularize height and pigment at internal joins while preserving the mask.
  let relief = rawDepth;
  for (const stride of [1,width,1,width]) {
    const depth = new Float32Array(parts.length);
    const color = new Uint32Array(parts.length);
    for (let i=0; i<parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      let z = 6*relief[i], ink = pigments[i], weight = 6;
      for (let tap=-3; tap<=3; tap++) {
        const j = i+tap*stride;
        if (!tap || !compatible(part,parts[j])) continue;
        const w = 4-Math.abs(tap);
        weight += w;
        z += w*relief[j];
        ink = mix(ink,pigments[j],w/weight);
      }
      depth[i] = z/weight;
      color[i] = ink;
    }
    relief = depth;
    pigments = color;
  }
  const litSkin = new Uint32Array(parts.length);
  for (let i=0; i<parts.length; i++) {
    if (!parts[i]) continue;
    const z = relief[i];
    const nearby = j => compatible(parts[i],parts[j]) ? relief[j] : z;
    const dx = (nearby(i+2)-nearby(i-2))*39, dy = (nearby(i+2*width)-nearby(i-2*width))*28;
    const light = (.48+.70*dx+.76*dy)/Math.hypot(1,dx,dy);
    const lit = clamp(.13+light*.77+z*.18);
    let ink = mix(0x102b38,pigments[i],lit);
    ink = mix(ink,0xe5d79e,smooth((lit-.50)*1.8)*.48);
    litSkin[i] = mix(ink,0x172e32,overhang[i]*.61);
  }
  return {relief,litSkin};
}
const {relief,litSkin}=createFrikSurface();
function heightAt(x,y){
  const u=x*width-.5,v=y*height-.5,col=Math.floor(u),row=Math.floor(v);
  const i=row*width+col,fx=u-col,fy=v-row;
  return ((relief[i]??.5)*(1-fx)+(relief[i+1]??.5)*fx)*(1-fy)+
    ((relief[i+width]??.5)*(1-fx)+(relief[i+width+1]??.5)*fx)*fy;
}
function bodyInk(x,y,part){
  const u=x*width-.5,v=y*height-.5,col=Math.floor(u),row=Math.floor(v);
  const i=row*width+col,fx=u-col,fy=v-row;
  let r=0,g=0,b=0,total=0;
  for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
    const at=i+dx+dy*width;
    if(!compatible(part,parts[at]))continue;
    const weight=(dx?fx:1-fx)*(dy?fy:1-fy),color=litSkin[at];
    total+=weight;
    r+=(color>>16&255)*weight;g+=(color>>8&255)*weight;b+=(color&255)*weight;
  }
  return total?(Math.round(r/total)<<16)|(Math.round(g/total)<<8)|Math.round(b/total):materials[part-1][1];
}

const skullPits = [
  [.515,.113,.0058,.0043],[.524,.118,.0036,.0062],[.536,.129,.0055,.0042],
  [.527,.139,.0043,.0055],[.518,.153,.0047,.0074],[.540,.150,.0063,.0050],
  [.532,.165,.0037,.0059],[.526,.179,.0050,.0067],[.544,.177,.0037,.0047],
];
const cheekFolds = [.159,.171,.184];
const legJoints=[.478,.626,.809],armJoints=[.346,.447,.594];

function naturalEye(x,y,f,beneath) {
  const u=(x-frikLook.x+(y-frikLook.y)*.135)/.0245, v=(y-frikLook.y)/.040;
  const r=u*u+v*v;
  if(r>1.29)return beneath;
  const z=Math.sqrt(Math.max(0,1-r));
  const gleam=clamp(.35-u*.38-v*.48+z*.22);
  const bevel=Math.sqrt(Math.max(0,1-((r-1.07)/.24)**2));
  let ink=r>.89?mix(0x15272a,0xa4b578,clamp(gleam*.67+bevel*.21)):0x102c33;
  ink=mark(ink,0x122e32,Math.abs(r-1.22)*.013,.0011,f.pixel);
  ink=mark(ink,0xc4d8a1,Math.abs(r-1.07)*.013,.0009,f.pixel);
  const iris=oval(u,v,.070,.043,.80,.86);
  if(iris<1){
    const dome=Math.max(0,1-iris);
    const radial=Math.atan2(v-.043+f.tilt*dome*1.8,u-.07-f.ray*dome*1.9);
    const weave=radial*29+iris*14+1.6*Math.sin(radial*7-iris*9);
    const fibers=.5+.5*Math.cos(weave);
    ink=mix(0x20394d,0xd19446,gleam);
    ink=mix(ink,0xffda78,clamp(dome*.18+fibers*.55+gleam*.22));
    ink=mark(ink,0x754636,Math.abs(iris-.57-.072*Math.cos(radial*11))*.015,.00065,f.pixel);
    ink=mark(ink,0xd8de97,Math.abs(iris-.89)*.013,.0010,f.pixel);
    const pupil=oval(u,v,.044,.071,.57,.62);
    if(pupil<1)ink=mix(0x040d17,0x12323a,clamp(1-pupil)*.63);
    ink=light(ink,0xd0ffee,oval(u,v,-.29,-.37,.21,.17),.92);
    ink=light(ink,0x80bfd1,oval(u,v,.27,.35,.25,.14),.53);
  }
  if(f.blink>0&&r<.82&&v<f.blink*1.44-.71){
    ink=v>f.blink*1.44-.82?0x142c31:mix(0x536e45,ink,.13);
  }
  return ink;
}

function monocle(x,y,f,under) {
  const u=(x-.557+(y-.147)*-.44)/.0158, v=(y-.147)/.027;
  const r=u*u+v*v;
  if(r>1.46)return under;
  if(r>1.22&&under<0)return under;
  const lit=clamp(.43-u*.31-v*.49);
  let ink=mix(0x0b232f,0x638383,lit);
  if(r>1.22)return mix(under,0x0b1722,.78);
  if(r>.79){
    ink=mix(0x234150,0xb4d3bc,lit);
    ink=mark(ink,0xc79b59,Math.abs(r-.96)*.011,.0013,f.pixel);
    const seam=repeat(Math.atan2(v,u),Math.PI/8)*.010;
    if(r>.91&&r<1.13)ink=mark(ink,0x123c4b,seam,.0010,f.pixel);
    return ink;
  }
  const lens=1-Math.sqrt(Math.max(0,1-r));
  ink=mix(0x071827,0x16739d,lit*(1-lens)*.68);
  ink=light(ink,0x4bd9ed,oval(u,v,-.26,-.25,.47,.68),.63);
  ink=mark(ink,0x359fbb,Math.abs(r-.48)*.015,.0012,f.pixel);
  ink=mark(ink,0x90e6d5,Math.abs(v+.15-u*.26)*.022,.0011,f.pixel);
  const scan=(f.effects?Math.sin((f.time??0)*.76)*.34:0)-.15;
  ink=mark(ink,0x4dc9d9,Math.abs(v-scan)*.013,.0008,f.pixel);
  if(Math.abs(u)<.5)ink=mark(ink,0x65bcae,Math.abs(u+.14)*.015,.0008,f.pixel);
  ink=light(ink,0xdafcff,oval(u,v,-.35,-.34,.22,.17),.92);
  return ink;
}

function shadeBody(x, y, f, below) {
  let i = addr(x,y), part = parts[i];
  let cross=section[i]/127.5-1;
  if(boundaries[i]){
    const hit=continuousProfile(x,y);
    part=hit>>8;
    cross=(hit&255)/127.5-1;
  }
  if (!part) return below;
  if (Math.abs(f.ray) + Math.abs(f.tilt) > .002) {
    const ax = f.ray * .29, ay = f.tilt * -.28;
    const depth = roomReliefCrossing(heightAt,x,y,ax,ay) - .5;
    const tx = x + ax * depth, ty = y + ay * depth, candidate = addr(tx,ty);
    if (compatible(parts[candidate],part)) {
      i = candidate;
      part = parts[i];
      x = tx;
      y = ty;
    }
  }
  const [shade, middle, bright] = materials[part - 1];
  let ink = bodyInk(x,y,part);
  const p = f.pixel;
  if (part === 11 || part === 12) {
    const spine = Math.abs(cross + .16 + .19 * Math.sin(y * 28));
    ink = mark(ink, bright, spine * .011, .0018, p);
    ink = mark(ink, 0x1d3b37, Math.abs(cross - .64) * .017, .0023, p);
    const hinge = y + (part === 12 ? -.57 : .51) * (x - (part === 12 ? .365 : .532));
    ink = mark(ink, middle, Math.abs(hinge - .604), .0038, p);
  }
  if (part <= 3 || part === 10) {
    const joints = part <= 2 ? legJoints : armJoints;
    for (const center of joints) {
      const d = y - center + .027 * Math.sin(cross * 2);
      ink = mark(ink, shade, Math.abs(d), .0027, p);
      ink = mark(ink, bright, Math.abs(d - .006), .002, p);
    }
  }
  if (part === 7 || part === 8) {
    ink=light(ink,0xa6caa0,oval(x,y,.511,.116,.043,.048),.22);
    const bowl = oval(x,y,.512,.165,.051,.041);
    ink = light(ink, 0x19383a, bowl, .47);
    const rim = Math.abs(y - .108 + .056 * Math.sin(x * 18));
    ink = mark(ink,0xa1d8bc,rim,.0028,p);
    if (x > .503) {
      for (const [cx,cy,rx,ry] of skullPits) {
        if (Math.abs(x - cx) > rx || Math.abs(y - cy) > ry + .002) continue;
        const d = oval(x,y,cx,cy,rx,ry);
        if (d < 1) ink = mix(ink, d < .69 ? 0x233b37 : 0x799c6c, .74);
        ink = mark(ink,0xb5bd92,Math.abs(d - .94) * .006,.0012,p);
      }
    }
    if (x < .512 && y > .153) {
      const fold = y + .038 * Math.cos((x - .474) * 26);
      for (const seam of cheekFolds) ink = mark(ink,0x284c48,Math.abs(fold - seam - .026),.0019,p);
    }
    // Overlapping orbital rosettes sit on the bony cheek, leaving the nose
    // and lens clear. Raised rims catch basin light around a dark pore.
    const rosetteBed=oval(x,y,.497,.145,.051,.036);
    if(rosetteBed<1&&x>.470){
      const band=Math.floor((y+.22*x)/.011);
      const u=repeat(x+band*.006,.012)/.0051;
      const v=repeat(y+.22*x,.011)/.0042;
      const rosette=u*u+v*v;
      ink=mix(ink,0xb7895e,clamp(1-rosetteBed)*.45);
      if(rosette<1){
        ink=mix(ink,0x374447,.58*(1-rosette));
        ink=mark(ink,0xcba574,Math.abs(rosette-.83)*.005,.00085,p);
      }
    }
    const jaw = Math.abs(y - .204 + .19 * (x - .523));
    const mouth = smooth((x-.504)*65);
    ink = mix(ink,mark(ink,0x112735,jaw,.0078,p),mouth);
    const cheek=oval(x,y,.539,.176,.027,.032);
    ink=mark(ink,0x314f49,Math.abs(cheek-.93)*.013,.0013,p);
    ink=mark(ink,0xa3bd88,Math.abs(cheek-1.11)*.013,.0008,p);
    for(const cx of [.547,.557]){
      const nostril=oval(x,y,cx,.181+(cx-.55)*.32,.0032,.0047);
      ink=light(ink,0x122f35,nostril,.85);
      ink=mark(ink,0x9aac7c,Math.abs(nostril-1)*.004,.0007,p);
    }
  }
  if(part===9){
    const groove=Math.abs(x-.521+(y-.216)*.14);
    ink=mark(ink,0x434b41,groove,.0017,p);
    ink=light(ink,0xf7e4ab,oval(x,y,.516,.219,.014,.021),.39);
    const enamel=y-.215+.12*(x-.52);
    ink=mark(ink,0xd5bc87,repeat(enamel,.009),.0007,p);
    ink=mark(ink,0x766c4a,Math.abs(y-.236+.10*Math.cos(x*310)),.0011,p);
  }
  if (part !== 9 && part !== 11 && part !== 12) {
    const keel=.446+.029*smooth((y-.22)/.19);
    if(Math.abs(x-keel)>.033&&y>.21&&y<.54){
      const row=Math.floor((y+x*.16)/.011),u=repeat(x+(row%2)*.0045,.009);
      const v=repeat(y+x*.16,.011),scale=Math.hypot(u,v*.66);
      ink=mark(ink,mix(ink,shade,.37),Math.abs(scale-.0038),.0008,p);
      ink=mark(ink,mix(ink,bright,.45),Math.abs(scale-.0028),.00055,p);
    }
  }
  const key = oval(x + (y - .27) * .16,y,.449,.209,.131,.249);
  ink = light(ink, 0x8de3d6, key, .23);
  if (f.effects) {
    const water=oval(x,y,(f.waterX??.684),(f.waterY??.608),.275,.23);
    ink=light(ink,0x54dce6,water,.38*(f.waterLight??f.pulse));
    ink = light(ink, 0x389ca7, oval(x,y,.492,.736,.229,.302), .36 * f.pulse);
    if(part>=4&&part<=8&&y>.167&&y<.375&&x<.467){
      const vessel=x-.432-.008*Math.cos((y-.22)*32);
      const pore=repeat(y+.073*x,.019);
      const d=Math.abs(vessel)*.72+pore*.36;
      ink=mark(ink,mix(0x467a75,0xa9ebc9,.34+.47*f.pulse),d,.0018,p);
    }
  }

  return ink;
}

export const frikLook = {x:left + 320 * sx,y:top + 79 * sy,span:.017};
// Authored cell strokes follow the fold tangent and the monocle instrument.
// These glyphs are source marks. The RGB surface remains an independent layer.
export const frikInkStrokes=folds.slice(2,7).flatMap(([y,,span],row)=>
  [-.56,0,.56].map((side,col)=>({
    id:'ventrum-'+row+'-'+col,x:.452+span*side,y:y-.008-.016*side*side,
    glyph:side<0?'╱':side>0?'╲':'─',size:.0065,ink:'#a4b284',pass:row<2?3:5,
  }))).concat([
  {id:'lens-reticle',x:.553,y:.145,glyph:'┼',size:.008,ink:'#a5f5df',pass:2},
  {id:'lens-track',x:.559,y:.154,glyph:'│',size:.006,ink:'#5497b6',pass:4},
  {id:'near-tendon',x:.391,y:.706,glyph:'╱',size:.008,ink:'#a4b58c',pass:4},
  {id:'far-tendon',x:.497,y:.716,glyph:'╲',size:.008,ink:'#64887f',pass:4},
  {id:'temple-cut',x:.528,y:.170,glyph:'╱',size:.005,ink:'#a5bd87',pass:6},
  {id:'jaw-hinge',x:.534,y:.190,glyph:'▗',size:.004,ink:'#789e80',pass:7},
  ...Array.from({length:8},(_,i)=>({id:'nape-scute-'+i,x:.419+.006*Math.sin(i*.69),
    y:.231+i*.016,glyph:i%2?'▖':'╱',size:.0045,ink:'#84b29b',pass:7})),
]);

export function frikStandingInk(x, y, f, under) {
  if (x < .235 || x > .659 || y < .078 || y > .943) return under;
  const worldX=x,worldY=y;
  under=paintArm(x,y,f,false,under);
  if(f.rig){
    const source=frikMotionSource(x,y,f.rig,frikLook);
    x=source[0];y=source[1];
  }
  const eye=naturalEye(x,y,f,-1);
  if(eye>=0)return eye;
  const lens=monocle(x,y,f,-1);
  if(lens>=0)return lens;
  let ink = shadeBody(x, y, f, under);
  if (y > .146 && y < .227 && x > .530 && x < .582) {
    const cable = Math.abs(oval(x,y,.552,.181,.020,.035) - 1);
    if(y>.172) {
      ink=mark(ink,0x071d2e,cable*.016,.0042,f.pixel);
      ink=mark(ink,0x7dbbb9,Math.abs(cable-.13)*.016,.0010,f.pixel);
    }
  }
  return paintArm(worldX,worldY,f,true,monocle(x,y,f,ink));
}

// Immutable source data shared by CPU reference and GPU field compiler.
export const frikBridgeFields={width,height,armSpans,armRows,parts,section,boundaries,relief,litSkin,shape,materials,skullPits,cheekFolds,legJoints,armJoints};
