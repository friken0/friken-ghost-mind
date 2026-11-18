import {mandelEscape} from './ansi-mandel-field.mjs';
import {createRetainedRelief,reliefProjectPoint,reliefSourcePoint} from './ansi-parallax.mjs';
import {createAnsiDepthQueue} from './ansi-depth.mjs';
import {ansiFontFamily,ensureAnsiFont} from './ansi-ui.mjs';
// Retained ANSI cells, native glyph plates and procedural field layers.
// A field backend may supply a GPU-resident canvas through put.layer.
import {ansiColourResolver, ansiBloomProfile, ansiDitherModes, ansiDitherPixel, ansiFlicker, ansiLightPulse, ansiHueColour, ansiInkGlyph, ansiIris, ansiPhosphor, ansiRgbHex, ansiRgbWord, ansiSurfaceLightState, createAnsiLightPainter, isAnsiRgb, paintAnsiInkBands, paintAnsiSurfaceLight, packAnsiInk, packAnsiRgb, shadeAnsiWord} from './ansi-animation.mjs?v=surface-light-3';
import {ansiColourTheme, ansiPalette as FRACTAL_PALETTE,paintGlyph} from './ansi-terminal.mjs?v=frik-mind-46';
const vgaToAnsi=[0,4,2,6,1,5,3,7,8,12,10,14,9,13,11,15];
const ramps = [
 [0,1,9,3,11,15,14,6], [0,1,5,13,12,14,15,11], [0,1,3,11,15,7,9,5],
 [0,4,6,12,14,15,13,5], [0,2,3,10,11,15,14,6],
].map(ramp=>ramp.map(color=>vgaToAnsi[color]));
export const fractalFamilies = [
 'mandelbrot','julia','burning ship','tricorn','multibrot-3','celtic',
 'perpendicular ship','phoenix','buffalo','perpendicular celtic','multibrot-4','cubic armada',
];
const reflectUnit=value=>1-Math.abs(((value%2)+2)%2-1);

export function wrapAnsiText(text,width,measure){
 const lines=[];
 for(const paragraph of String(text).split('\n')){
  let line='';
  for(const word of paragraph.trim().split(/\s+/).filter(Boolean)){
   const candidate=line?line+' '+word:word;
   if(measure(candidate)<=width){line=candidate;continue;}
   if(line){lines.push(line);line='';}
   for(const char of word){
    if(line&&measure(line+char)>width){lines.push(line);line='';}
    line+=char;
   }
  }
  lines.push(line);
 }
 return lines;
}

export function ansiLetterboxInk(sample,u,v,time,pass,zoom,pose,axis){
 if(!axis)return sample(u,v,time,pass,zoom,pose);
 const edge=axis==='x'?u:v;
 const distance=Math.min(edge,1-edge);
 if(distance>=.05)return sample(u,v,time,pass,zoom,pose);
 const span=2**-zoom, limit=1-1e-7;
 const coarse=(sourcePass)=>{
  // One coarse lattice for the entire reflected band, in world coordinates.
  const step=2**(sourcePass-1);
  const x=Math.min(limit,reflectUnit(u)),y=Math.min(limit,reflectUnit(v));
  const cell=(q,n)=>Math.min(limit,(Math.floor(q*n)+.5)/n);
  return sample(cell(x,43*step),cell(y,19*step),time,sourcePass,zoom,pose);
 };
 const blend=Math.min(1,Math.max(0,distance/(.05*span)));
 const level=1+(pass-1)*blend,low=Math.floor(level);
 const a=coarse(low),fraction=level-low;
 if(fraction<.0001)return blend===1?sample(u,v,time,pass,zoom,pose):a;
 const b=low+1===pass?sample(u,v,time,pass,zoom,pose):coarse(low+1);
 if(!isAnsiRgb(a)||!isAnsiRgb(b))return fraction<.5?a:b;
 const blendChannel=shift=>Math.round((a>>shift&255)*(1-fraction)+(b>>shift&255)*fraction);
 return packAnsiRgb(blendChannel(16)<<16|blendChannel(8)<<8|blendChannel(0));
}
// The non-Julia iteration laws match FriktalMenuFractal.Step in the live Unity menu.
const portraits = {
 'burning ship':[-1.755,-.035,.17], 'tricorn':[-.58,.05,1],
 'multibrot-3':[0,0,1], 'celtic':[-.33,.45,.78],
 'perpendicular ship':[-1.50,-.02,.27], 'phoenix':[.25,0,.72],
 'buffalo':[-.35,.1,.88], 'perpendicular celtic':[-.48,.28,.78],
 'multibrot-4':[0,0,1], 'cubic armada':[-.45,.25,.85],
};
const familyId=Object.fromEntries(fractalFamilies.map((name,i)=>[name,i]));
const rampFor=item=>ramps[item.palette ?? (item.kind==='julia'?1:0)];
const echoInks={
 'Temperate shelf':[2,3,6,10],
 'Gas giant':[5,4,13,9],
};
export function echoTerrainInk(surface,n,u,v){
 const [rock,shadow,cliff,crest]=echoInks[surface.kind]??(surface.cold?[1,3,6,14]:[4,1,7,12]);
 const fault=Math.sin(u*48+Math.sin(v*17)*3)*Math.cos(v*40-u*20);
 const dust=Math.sin(u*193-v*137)*Math.sin(u*269+v*228);
 if(n<0)return packAnsiInk(fault>.25?rock:shadow,6+Math.round((fault+1)*2)+(dust>.52?2:0),fault<-.42?2:1);
 const stratum=.5+.5*Math.sin((n-2)*1.1+fault);
 const cut=n>16&&stratum>.83;
 return packAnsiInk(cut?crest:stratum>.48?cliff:rock,8+Math.floor(stratum*6),stratum<.18?2:0);
}
export const maxFractalZoom=40;
export const maxLogoZoom=13;
export function logoCamera(view,{level=view.level,anchorX=.5,anchorY=.5,panX=0,panY=0,bounded=true,minLevel=0,maxLevel=maxLogoZoom}={},viewport){
 const zoom=clamp(level,minLevel,maxLevel),oldSpan=2**-view.level,span=2**-zoom;
 const center=(value,anchor,pan,axis)=>{
  const edge=Math.min(.5,span*axis/2);
  const next=value+((anchor-.5)*(oldSpan-span)+pan*span)*axis;
  return bounded?clamp(next,edge,1-edge):next;
 };
 return {level:zoom,centerX:center(view.centerX,anchorX,panX,viewport?.x??1),centerY:center(view.centerY,anchorY,panY,viewport?.y??1)};
}

// Reproject the same world point through the old and new field cameras.
export function courierRoutePoint(from,to,{x,y}){
 const span=fieldSpan(from.kind,from.aspect)/2**from.zoom/3.6;
 const u=(x-.5)*span,v=(y-.5)*span/from.aspect;
 const factor=3.6*2**to.zoom/fieldSpan(to.kind,to.aspect);
 const dx=from.centerX-to.centerX+(from.turn?-v:u);
 const dy=from.centerY-to.centerY+(from.turn?u:v);
 return {x:.5+(to.turn?dy:dx)*factor,y:.5+(to.turn?-dx:dy)*factor*to.aspect};
}

export function courierApproach(field,view,point,ship,at){
 const facing=Math.abs(point.x-ship.x)<.025?ship.facing:Math.sign(point.x-ship.x);
 const turn=facing!==ship.facing;
 const target={x:.5+facing/6,y:clamp(point.y,.34,.66)};
 const projected=courierRoutePoint(field,view,point);
 const unit=fieldSpan(view.kind,view.aspect)/2**view.zoom/3.6;
 const dx=(projected.x-target.x)*unit,dy=(projected.y-target.y)*unit/view.aspect;
 const centerX=view.centerX+(view.turn?-dy:dx),centerY=view.centerY+(view.turn?dx:dy);
 // The old one-third framing measured from the center. Close a
 // third of the actual clear space between the nose and the mark.
 const offset=2/9+(ship.nose??0)/3;
 const x=target.x-facing*offset,y=target.y;
 const duration=1.25+Math.hypot(x-ship.x,y-ship.y)*1.15+(turn?.28:0);
 return {centerX,centerY,route:{from:ship,field,point,target,x,y,facing,turn,at,duration,
  depth:clamp((view.zoom-field.zoom)*2,-1,1)}};
}
// Hold scale during the dive. Camera zoom and hull recovery then share
// the same second half of the maneuver, while the pan never stops.
export function courierDepthBlend(travel){
 const t=clamp((travel-.43)/.57,0,1);
 return t*t*(3-2*t);
}
export function courierTravel(route,progress){
 const delay=route.turn?.15:.06,t=clamp((progress-delay)/(1-delay),0,1);
 return t*t*(3-2*t);
}
function routePose(route,time,reduced){
 if(route.manual)return {x:route.x,y:route.y,facing:route.facing,flip:1,scale:1,p:1};
 const p=reduced?1:clamp((time-route.at)/route.duration,0,1);
 const travel=courierTravel(route,p);
 const fold=route.turn?clamp(p/.26,0,1):1;
 const approach=Math.min(1,travel/.43);
 const scale=1-.66*route.depth*(Math.sin(approach*Math.PI/2)-courierDepthBlend(travel));
 return {x:route.from.x+(route.x-route.from.x)*travel,y:route.from.y+(route.y-route.from.y)*travel
  +Math.sin(travel*Math.PI)*(route.y>=route.from.y?-.041:.041),
  facing:fold<.5?route.from.facing:route.facing,flip:Math.max(.075,Math.abs(Math.cos(Math.PI*fold))),scale,p};
}

export function menuFractal(seed) {
 const family=fractalFamilies[(seed>>>8)%fractalFamilies.length];
 return {kind:family,palette:(seed>>>16)%ramps.length,flight:true,seed};
}
export function escapeField(x,y,kind='mandelbrot',limit=100){
 return escapeFamily(x,y,familyId[kind],limit);
}
function escapeFamily(x,y,family,limit){
 if(family===0)return mandelEscape(x,y,limit);
 const julia=family===1;
 let a=julia?x:0,b=julia?y:0,previousA=0,previousB=0;
 const cr=julia?-.7:x,ci=julia?.27015:y;
 for(let i=0;i<limit;i++){
  const aa=a*a,bb=b*b;
  if(aa+bb>256)return i+1-Math.log2(Math.log2(aa+bb)/2);
  let real=aa-bb, imag=2*a*b;
  switch(family){
   case 2: imag=Math.abs(imag); break;
   case 3: imag=-imag; break;
   case 4: real=a*(aa-3*bb);imag=b*(3*aa-bb);break;
   case 5: real=Math.abs(real);break;
   case 6: imag=-2*Math.abs(a)*b;break;
   case 7: real-=.48*previousA;imag-=.48*previousB;break;
   case 8: real=Math.abs(real);imag=-Math.abs(imag);break;
   case 9: real=Math.abs(real);imag=-2*Math.abs(a)*b;break;
   case 10: {const fourth=real*real-imag*imag;imag=2*real*imag;real=fourth;break;}
   case 11: real=Math.abs(a)*(aa-3*bb);imag=Math.abs(b)*(3*aa-bb);break;
  }
  previousA=a;previousB=b;
  a=real+cr;b=imag+ci;
 }
 return -1;
}
function fieldSpan(kind,aspect) {
 return Math.max(kind==='julia'?3.4:3.6,aspect*(kind==='julia'?2.4:2.8))*(portraits[kind]?.[2]??1);
}

export function fractalCamera(view,aspect,{level=view.level,anchorX=.5,anchorY=.5,panX=0,panY=0}={}) {
 const nextLevel=Math.max(0,Math.min(maxFractalZoom,level));
 const oldScale=2**(-view.level), nextScale=2**(-nextLevel);
 const span=fieldSpan(view.kind,aspect)/3.6;
 const adjust=(center,delta,axisSpan)=>{
  const limit=axisSpan*(1-nextScale)/2;
  const target=center+delta;
  return Math.max(.5-limit,Math.min(.5+limit,target));
 };
 const dx=span*((anchorX-.5)*(oldScale-nextScale)+panX*nextScale);
 const dy=span/aspect*((anchorY-.5)*(oldScale-nextScale)+panY*nextScale);
 return {...view,level:nextLevel,centerX:adjust(view.centerX,view.turn?-dy:dx,span),
  centerY:adjust(view.centerY,view.turn?dx:dy,view.turn?span:span/aspect)};
}

function fractalSampler({kind='mandelbrot',zoom=0,centerX=.5,centerY=.5,aspect=1.6,turn=false}={}){
 const span=fieldSpan(kind,aspect)/2**zoom, verticalSpan=span/aspect;
 const [originX,originY]=portraits[kind]??[kind==='julia'?0:-.65,0];
 const x=originX+(centerX-.5)*3.6,y=originY+(centerY-.5)*3.6;
 const family=familyId[kind],limit=Math.min(1200,90+zoom*24);
 return (u,v)=>turn?escapeFamily(x-(v-.5)*verticalSpan,y+(u-.5)*span,family,limit):
  escapeFamily(x+(u-.5)*span,y+(v-.5)*verticalSpan,family,limit);
}
export function fractalSample(u,v,options){return fractalSampler(options)(u,v);}
export function fractalSurveyContacts(view, origin, range) {
 const sample=fractalSampler(view), contacts=new Map();
 const span=fieldSpan(view.kind,view.aspect)/2**view.zoom;
 const cell=2**Math.floor(Math.log2(span/22));
 const columns=42,rows=24;
 const solid=Array.from({length:columns*rows},(_,i)=>sample((i%columns+.5)/columns,
  (Math.floor(i/columns)+.5)/rows)<0);
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const i=row*columns+col;
  const u=(col+.5)/columns,v=(row+.5)/rows;
  for(const [dx,dy,valid] of [[1/columns,0,col+1<columns&&solid[i]!==solid[i+1]],
   [0,1/rows,row+1<rows&&solid[i]!==solid[i+columns]]]){
   if(!valid)continue;
   const distance=Math.hypot((u+dx/2-origin.x)*view.aspect,v+dy/2-origin.y);
   if(distance>range+.04||distance<.06)continue;
   let lo=0,hi=1;
   for(let step=0;step<7;step++){
    const t=(lo+hi)/2;
    if((sample(u+dx*t,v+dy*t)<0)===solid[i])lo=t;else hi=t;
   }
   const x=u+dx*(lo+hi)/2,y=v+dy*(lo+hi)/2;
   const refinedDistance=Math.hypot((x-origin.x)*view.aspect,y-origin.y);
   if(refinedDistance>range||refinedDistance<.10)continue;
   const wx=(view.centerX-.5)*3.6+(view.turn?-(y-.5)*span/view.aspect:(x-.5)*span);
   const wy=(view.centerY-.5)*3.6+(view.turn?(x-.5)*span:(y-.5)*span/view.aspect);
   const id=[view.worldId,view.kind,Math.log2(cell),Math.floor(wx/cell),Math.floor(wy/cell)].filter(n=>n!==undefined).join('/');
   if(!contacts.has(id))contacts.set(id,{id,x,y,distance:refinedDistance});
  }
 }
 return [...contacts.values()].sort((a,b)=>a.distance-b.distance);
}
export function fractalCells(columns,rows,options={},phase=0){
 const ramp=rampFor(options),cells=[],sample=fractalSampler(options);
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
  const n=sample((x+.5)/columns,(y+.5)/rows);
  if(options.surface){
   const shade=echoTerrainInk(options.surface,n,x/columns,y/rows);
   cells.push({glyph:'▒',fg:shade&15,bg:(echoInks[options.surface.kind]??[1,8])[1]});
   continue;
  }
  if(n<0){cells.push({glyph:' ',fg:0,bg:0});continue;}
  const t=Math.max(0,(n-2)*.28+phase),k=Math.floor(t)% (ramp.length-1),f=t-Math.floor(t);
  const glyph=['░','▒','▓'][Math.min(2,Math.floor(f*3))];
  cells.push({glyph,bg:ramp[k],fg:ramp[k+1]});
 }
 if(options.flight){
  const pixels=new Map();
  visitFlight(columns*16,rows*32,0,options,(x,y,size,ink)=>{
   const left=Math.max(0,Math.floor(x/16)),right=Math.min(columns-1,Math.floor((x+size-1)/16));
   const top=Math.max(0,Math.floor(y/16)),bottom=Math.min(rows*2-1,Math.floor((y+size-1)/16));
   for(let half=top;half<=bottom;half++)for(let col=left;col<=right;col++){
    const index=Math.floor(half/2)*columns+col;
    if(!pixels.has(index))pixels.set(index,[cells[index].bg,cells[index].bg]);
    pixels.get(index)[half%2]=ink;
   }
  });
  for(const [index,[fg,bg]] of pixels)cells[index]={glyph:'▀',fg,bg};
 }
 return cells;
}
// Small topology LUT, inspired by structure-based ASCII synthesis.
const contourTemplates=[
 ['─','000111000'],['│','010010010'],['/','001010100'],['\\','100010001'],
 ['+','010111010'],['X','101010101'],['V','101101010'],['^','010101101'],
 ['L','100100111'],['┐','111001001'],['┌','111100100'],['┘','001001111'],
 ['O','010101010'],['T','111010010'],['┴','010010111'],
 ['╱','011010110'],['╲','110010011'],['─','111000000'],['─','000000111'],
 ['│','100100100'],['│','001001001'],
].map(([symbol,shape])=>[symbol,parseInt(shape,2)]);
const popcount=Array.from({length:512},(_,n)=>n.toString(2).replaceAll('0','').length);
const contourTable=Array.from({length:512},(_,mask)=>{
 let symbol='',best=0;
 for(const [glyph,template] of contourTemplates){
  const score=popcount[mask&template]/popcount[mask|template];
  if(score>=.64&&score>best){symbol=glyph;best=score;}
 }
 return symbol;
});
export function contourGlyph(samples,minContrast){
 let lo=Infinity,hi=-Infinity;
 for(const level of samples){lo=Math.min(lo,level);hi=Math.max(hi,level);}
 if(hi-lo<minContrast)return '';
 const threshold=(hi+lo)*.5;
 let mask=0;
 for(const level of samples)mask=(mask<<1)|Number(level>threshold);
 return contourTable[mask]||contourTable[511^mask];
}
const detailScales=[1,2,4,8];
export const fractalPassOptions=Object.freeze([1,2,3,4,5,6,7,8]);
export const fractalFilters=Object.freeze(['classic','detail','clean']);
const inkSteps=64;

function blendInk(a,b,t){
 const channel=shift=>Math.round(((a>>>shift)&255)*(1-t)+((b>>>shift)&255)*t)<<shift;
 return (0xff000000|channel(16)|channel(8)|channel(0))>>>0;
}
export function progressivePasses(width,height,levels=4,pixelBounds){
 if(!fractalPassOptions.includes(levels))throw Error('Choose between one and eight ANSI passes');
 const cap=Math.max(8,Math.min(26,1536/width,768/height));
 const detail=[.16,.36,.62,1];
 const passes=Array.from({length:levels},(_,index)=>{
  const scale=2**index;
  if(index<4)return {scale,columns:width*scale,rows:height*scale};
  const density=8+(cap-8)*detail[index-4];
  return {scale,columns:Math.ceil(width*density),rows:Math.ceil(height*density),probe:index-3};
 });
 if(pixelBounds){
  let previousColumns=0;
  for(const pass of passes){
   const across=Math.min(2,Math.max(1,16/pass.scale));
   const columns=Math.max(pass.columns,Math.ceil(previousColumns/across));
   pass.columns=Math.max(1,Math.min(columns,Math.floor(pixelBounds.width/across)));
   pass.rows=Math.max(1,Math.min(pass.rows,Math.floor(pixelBounds.height/2)));
   previousColumns=pass.columns*across;
  }
 }
 return passes;
}

// Presentation is separate from the received cell grid. Fine sheets must
// survive the canvas copy before a display filter can reconstruct them.
export function ansiPlateBacking(width,height,passes,{smooth=false,pixelBounds}={}){
 const last=passes.at(-1);
 const backing=smooth
  ? {width:Math.max(width*16,last.columns),height:Math.max(height*32,last.rows*2)}
  : {width:width*16,height:height*32};
 return pixelBounds
  ? {width:Math.min(backing.width,pixelBounds.width),height:Math.min(backing.height,pixelBounds.height)}
  : backing;
}

// Each saturated pass adds another point inside the same display cell.
export function refinementProbe(index){
 return index ? [
  ((index*.61803398875)%1-.5)*.88,
  ((index*.41421356237)%1-.5)*.88,
 ] : [0,0];
}

export function accumulateEscape(value,mean=0,hits=0){
 return value<0 ? [mean,hits] : [mean+(value-mean)/(hits+1),hits+1];
}
export function refinementBudget(baseCells,baud,seconds,baseBytes=baseCells) {
 return visibleCells(baseCells,Math.max(0,seconds*baud/(baseBytes*10)));
}
function visibleCells(baseCells,progress) {
 return detailScales.slice(1).reduce((total,scale,index)=>{
  return total+Math.floor(Math.min(1,Math.max(0,progress-index))*baseCells*scale**2);
 },baseCells);
}

const activeLoupes=new WeakMap();
// Shared inspection chrome for retained ANSI plates and their mesh presentation.
export function mountAnsiLoupe(root,source,inspect){
 const doc=root.ownerDocument,input=doc.defaultView?.SDUI;
 if(!input?.press)return null;
 const button=doc.createElement('button'),glass=doc.createElement('canvas'),icon=doc.createElement('canvas');
 const ctx=glass.getContext('2d'),iconInk=icon.getContext('2d');
 const controller=new AbortController(),{signal}=controller;
 const title='Inspect ANSI characters';
 button.type='button';button.className='ansi-ink-loupe';
 button.setAttribute('aria-label',title);button.setAttribute('aria-pressed','false');button.title=title;
 button.style.cssText='position:absolute;z-index:4;display:none;border:1px solid currentColor;background:#000;color:#55ffff;padding:2px;cursor:zoom-in;line-height:0;';
 glass.className='ansi-ink-inspection';
 glass.setAttribute('aria-label','Magnified artwork and character passes');
 glass.style.cssText='position:absolute;z-index:3;display:none;image-rendering:pixelated;touch-action:none;cursor:crosshair;';
 icon.width=icon.height=16;
 iconInk.strokeStyle='#55ffff';iconInk.lineWidth=2;
 iconInk.beginPath();iconInk.arc(6,6,4.2,0,Math.PI*2);iconInk.stroke();
 iconInk.beginPath();iconInk.moveTo(9,9);iconInk.lineTo(15,15);iconInk.stroke();
 button.append(icon);root.append(glass,button);
 let enabled=false,point={x:.5,y:.5},bounds='',frame=null;
 const clampPoint=(x,y)=>({x:clamp(x,0,1),y:clamp(y,0,1)});
 function paint(){
  if(!enabled||!frame)return;
  const w=glass.width,h=glass.height;
  const bands=inspect?.(point)??[];
  const picture=bands.length?Math.floor(h*.57):h;
  const scale=12;
  const sw=source.width/scale,sh=source.height*picture/h/scale;
  const sx=clamp(point.x*source.width-sw/2,0,source.width-sw);
  const sy=clamp(point.y*source.height-sh/2,0,source.height-sh);
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
  ctx.drawImage(source,sx,sy,sw,sh,0,0,w,picture);
  if(frame.foreground)ctx.drawImage(frame.foreground,sx,sy,sw,sh,0,0,w,picture);
  const palette=ansiColourTheme(frame.theme).colours;
  const print=(text,x,y,height,color)=>{
   ctx.font=height+'px '+ansiFontFamily;ctx.textBaseline='top';ctx.fillStyle=color;ctx.fillText(text,x,y);
  };
  const header=Math.max(13,Math.min(22,Math.round(h*.052)));
  const headline=frame.pass?'INK LOUPE / 12× / PASS '+frame.pass:'INK LOUPE / 12×';
  ctx.fillStyle=palette[0];ctx.fillRect(0,0,headline.length*header*.62+10,header+7);
  print(headline,6,4,header,palette[11]);
  if(!bands.length)return;
  const pane=w/bands.length;
  const markHeight=Math.max(12,Math.min(header+5,Math.floor((h-picture-header-9)/bands[0].rows)));
  const cw=markHeight*.5;
  ctx.strokeStyle=palette[6];ctx.beginPath();ctx.moveTo(0,picture+.5);ctx.lineTo(w,picture+.5);ctx.stroke();
  for(const [i,band] of bands.entries()){
   const x=i*pane,head=band.label;
   print(head,x+8,picture+5,Math.min(header,pane*1.5/head.length),palette[14]);
   const gridX=x+Math.max(4,(pane-band.columns*cw)*.5);
   const gridY=picture+header+9;
   for(const [index,mark] of band.cells.entries()){
    if(!mark)continue;
    const cx=gridX+(index%band.columns)*cw,cy=gridY+Math.floor(index/band.columns)*markHeight;
    if(mark.bg!=null){ctx.fillStyle=typeof mark.bg==='string'?mark.bg:palette[mark.bg];ctx.fillRect(cx,cy,cw,markHeight);}
    ctx.fillStyle=typeof mark.fg==='string'?mark.fg:palette[mark.fg];
    ctx.font=markHeight+'px '+ansiFontFamily;ctx.textBaseline='top';
    paintGlyph(ctx,mark.glyph,cx,cy,cw,markHeight);
    if(mark.stroke){
     ctx.fillStyle=mark.stroke.ink;
     ctx.globalAlpha=mark.stroke.alpha;
     paintGlyph(ctx,mark.stroke.glyph,cx,cy,cw,markHeight);
     ctx.globalAlpha=1;
    }
   }
  }
 }
 function set(open){
  if(open&&!frame)return false;
  if(open){activeLoupes.get(root)?.();activeLoupes.set(root,close);}
  else if(activeLoupes.get(root)===close)activeLoupes.delete(root);
  enabled=open;glass.style.display=enabled?'block':'none';
  button.setAttribute('aria-pressed',String(enabled));
  button.setAttribute('aria-label',enabled?'Close ANSI character inspection':title);
  source.dataset.loupe=String(enabled);
  if(open)paint();
  return true;
 }
 const close=()=>set(false);
 function move(event){
  if(!frame)return;
  const rect=(enabled?glass:source).getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
  if(enabled&&event.target===glass){point=clampPoint(x,y);paint();}
  else if(!enabled&&x>=0&&x<=1&&y>=0&&y<=1&&event.target!==button&&!button.contains(event.target))point={x,y};
 }
 input.press(button,()=>set(!enabled));
 root.addEventListener('pointermove',move,{signal});
 glass.addEventListener('pointerdown',move,{signal});
 root.addEventListener('keydown',event=>{
  if(!enabled)return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();set(false);return;}
  const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if(!direction)return;
  event.preventDefault();event.stopImmediatePropagation();
  point=clampPoint(point.x+direction[0]*.025,point.y+direction[1]*.025);paint();
 },{capture:true,signal});
 return {sync(info){
  if(!info){
   if(!frame)return;
   frame=null;bounds='';set(false);button.style.display='none';return;
  }
  frame=info;
  const {left,top,width,height}=source.style;
  const stamp=[left,top,width,height].join('/');
  if(stamp===bounds)return;
  bounds=stamp;
  const w=parseFloat(width),h=parseFloat(height);
  if(w<38||h<34){button.style.display='none';set(false);return;}
  const edge=Math.min(8,h*.065),size=Math.max(23,Math.min(30,h*.25));
  Object.assign(button.style,{display:'block',left:parseFloat(left)+edge+'px',
   top:parseFloat(top)+h-size-edge+'px',width:size+'px',height:size+'px'});
  Object.assign(glass.style,{left,top,width,height});
  glass.width=Math.round(w);glass.height=Math.round(h);
  if(enabled)paint();
 },refresh(){if(enabled)paint();},destroy(){close();controller.abort();button.remove();glass.remove();}};
}

// Reception belongs to the plate. Sampling belongs to the camera.
// Changing the camera can invalidate pixels without rewinding the carrier.
const hasSampledArt=item=>Boolean(item.sample||item.sampleArtBatch);

export const heldZoomDepth=seconds=>Math.min(8,.5+Math.max(0,seconds-.22)*2.3);
export const isArtPan=(dx,dy)=>Math.hypot(dx,dy)>=5;
export function beginArtGesture(event,point,seconds){
 return {id:event.pointerId,at:seconds,startX:event.clientX,startY:event.clientY,point,moved:false};
}
export function updateArtPan(drag,event){
 drag.moved ||= isArtPan(event.clientX-drag.startX,event.clientY-drag.startY);
 return drag.moved;
}
export function artHoldAim(drag,seconds,remaining){
 if(!drag||drag.moved||seconds-drag.at<.22)return null;
 return {...drag.point,level:Math.min(Math.max(0,remaining),heldZoomDepth(seconds-drag.at))};
}
function drawReviewAim(ctx,canvas,aim,colorTheme,glyph){
   const {x,y,level}=aim,w=Math.max(10,canvas.width*.44/2**level),h=Math.max(10,canvas.height*.44/2**level);
   const cx=x*canvas.width,cy=y*canvas.height;
   const palette=ansiColourTheme(colorTheme).colours;
   ctx.strokeStyle=palette[0];ctx.lineWidth=4;ctx.strokeRect(cx-w/2,cy-h/2,w,h);
   ctx.strokeStyle=palette[11];ctx.lineWidth=2;ctx.strokeRect(cx-w/2,cy-h/2,w,h);
   glyph(ctx,'+ '+level.toFixed(1)+' DEPTH',Math.max(0,Math.min(canvas.width-96,cx-w/2)),Math.max(0,cy-h/2-20),9,palette[15]);
  }

export function mountAnsiFractal(root,{host,textureOnly=false,frameBudget=4}){
 const doc=root.ownerDocument,canvas=doc.createElement('canvas');
 canvas.className='ansi-fractal-layer';
 canvas.style.cssText='position:absolute;pointer-events:none;z-index:1;image-rendering:pixelated;display:none';
 if(!textureOnly)root.append(canvas);
 const ctx=canvas.getContext('2d',{alpha:false});
 ensureAnsiFont();
 const paletteWords=palette=>palette.map(hex=>{
  const n=parseInt(hex.slice(1),16);
  return (0xff000000|((n&255)<<16)|(n&65280)|(n>>>16))>>>0;
 });
 let colorTheme='ansi', colors=paletteWords(FRACTAL_PALETTE);
 const shadeRamp=()=>colors.map(word=>Array.from({length:16},(_,dim)=>shadeAnsiWord(word,dim)));
 let shaded=shadeRamp(),lightPainter,inkMode='rgb',resolveColour=ansiColourResolver();

 const cleanInks=new Map(),overlayInks=new Map();
 const glyph=(context,text,x,y,width,colour)=>{
  context.font=width*2+'px '+ansiFontFamily;
  context.textBaseline='top';
  context.fillStyle=colour;
  if([...text].length===1)paintGlyph(context,text,x,y,width,width*2);
  else context.fillText(text,x,y,width*text.length);
 };
 let plateKey='', plateIdentity='', sampled=null, layers=[], passes=[], progress=0, previousTime=0, lastFrame='';
 let skip=false, cameraRefining=false, snapshot=null, terrain=null, plateStart=0, directGrade=false;
 let wasPreview=false,previewLayer=null,reliefRenderer,shownRelief,reliefInkStamp='',reliefRevision=0;
 const flightRasters=new Map();
 const sameCamera=(a,b)=>a&&a.centerX===b.centerX&&a.centerY===b.centerY&&a.zoom===b.zoom&&
  a.viewport?.x===b.viewport?.x&&a.viewport?.y===b.viewport?.y;
 let objects,objectsContext,flightCamera,edgeLamps;
 let displayKey='',overlayStamp='',inkStamp='',inkRaster,inkContext;
 const objectSprites=new Map();
 const cellPlates=new Map();
 const spriteJobs=new Set();
 let spriteEpoch=0;
 function spriteRaster(columns,rows){
  const sprite=doc.createElement('canvas');
  sprite.width=columns;sprite.height=rows;
  const context=sprite.getContext('2d'),image=context.createImageData(columns,rows);
  return {sprite,context,image,pixels:new Uint32Array(image.data.buffer),cursor:0};
 }
 function sampleSprite(raster,sample,frame,deadline){
  const {sprite,context,image,pixels}=raster,columns=sprite.width,rows=sprite.height;
  let index=raster.cursor;
  for(;index<pixels.length;index++){
   if((index&63)===0&&performance.now()>=deadline)break;
   const x=index%columns,y=(index-x)/columns;
   const material=sample((x+.5)/columns,(y+.5)/rows,frame);
   pixels[index]=material<0?0:isAnsiRgb(material)?ansiRgbWord(material):shaded[material&15][15-(material>>4&15)];
  }
  raster.cursor=index;
  if(index!==pixels.length)return false;
  context.putImageData(image,0,0);
  raster.cursor=0;
  return true;
 }
 function objectSprite(key,columns,rows,sample,frame,deadline=Infinity,refine=false){
  key=[colorTheme,key,columns,rows].join('/');
  let cached=objectSprites.get(key);
  if(cached){
   objectSprites.delete(key);objectSprites.set(key,cached);
   cached.seen=spriteEpoch;
   if(cached.frame===frame||!refine&&performance.now()>=deadline)return cached.raster.sprite;
  }else{
   const preview=refine?Math.min(1,Math.sqrt(4000/(columns*rows))):1;
   const raster=spriteRaster(Math.max(1,Math.ceil(columns*preview)),Math.max(1,Math.ceil(rows*preview)));
   cached={raster,seen:spriteEpoch};
   if(objectSprites.size>=64){
    const oldest=objectSprites.keys().next().value;
    spriteJobs.delete(objectSprites.get(oldest));
    objectSprites.delete(oldest);
   }
   objectSprites.set(key,cached);
   if(preview<1){
    sampleSprite(raster,sample,frame,Infinity);
    cached.preview=true;
   }
  }
  if(refine&&(cached.pending||cached.preview||columns*rows>5000)){
   const now=performance.now();
   if(!cached.pending&&now>=(cached.nextPaint??0)){
    cached.pending={sample,frame,columns,rows};
    spriteJobs.add(cached);
   }
  }else{
   sampleSprite(cached.raster,sample,frame,Infinity);
   cached.frame=frame;
  }
  return cached.raster.sprite;
 }
 function refineSprites(deadline){
  // Drawing order should not decide which faces get sharp. Finish newly
  // visible sprites first, then distribute animation updates in queue order.
  for(const cached of spriteJobs){
   if(cached.seen===spriteEpoch)continue;
   cached.pending=null;spriteJobs.delete(cached);
  }
  while(spriteJobs.size&&performance.now()<deadline){
   const cached=[...spriteJobs].find(sprite=>sprite.preview)??spriteJobs.values().next().value;
   const job=cached.pending;
   job.raster??=cached.scratch??spriteRaster(job.columns,job.rows);
   if(!sampleSprite(job.raster,job.sample,job.frame,deadline))break;
   cached.scratch=cached.preview?null:cached.raster;
   cached.raster=job.raster;cached.frame=job.frame;
   cached.pending=null;cached.preview=false;cached.nextPaint=performance.now()+70;
   spriteJobs.delete(cached);
  }
 }
 function drawSheet({view,layer,count},item,phase,flow){
  const scale=2**(item.zoom-view.zoom);
  const span=fieldSpan(item.kind,item.aspect)/2**item.zoom;
  const unit=item.plane?2**item.zoom:3.6/span;
  const sx=scale*(view.viewport?.x??1)/(item.viewport?.x??1),sy=scale*(view.viewport?.y??1)/(item.viewport?.y??1);
  const dx=(view.centerX-item.centerX)*unit/(item.viewport?.x??1),dy=(view.centerY-item.centerY)*unit/(item.viewport?.y??1);
  const x=.5*(1-sx)+(item.turn?dy:dx);
  const y=.5*(1-sy)+(item.turn?-dx:dy)*(item.plane?1:item.aspect);
  paintLayer(layer,phase,item,count);
  if(flow>1)drawRows(layer,count,[.53*(1-flow)*canvas.width,.48*(1-flow)*canvas.height,canvas.width*flow,canvas.height*flow]);
  else if(sameCamera(view,item))drawRows(layer,count);
  else drawRows(layer,count,[x*canvas.width,y*canvas.height,canvas.width*sx,canvas.height*sy]);
 }

 function makeLayer(item,pass,prior){
  // Hold the output at 16×32 backing pixels per original cell. The
  // fourth layer gets 2×4 shade masks instead of quadrupling the raster.
  const cellWidth=Math.max(1,Math.min(4,16/pass.scale)), cellHeight=cellWidth*2;
  const raster=doc.createElement('canvas');
  raster.width=pass.columns*cellWidth;
  raster.height=pass.rows*cellHeight;
  const context=raster.getContext('2d',{alpha:false});
  const size=pass.columns*pass.rows,values=hasSampledArt(item)?null:new Float32Array(size);
  const across=Math.min(2,cellWidth);
  const parent=values&&pass.probe?prior:null;
  const layer={...pass,canvas:raster,context,values,filled:0,cellWidth,cellHeight,parent,across,
   art:hasSampledArt(item)?new Uint32Array(size*across*2):null,
   hits:parent?new Uint8Array(size):null,counts:parent?new Uint8Array(size):null,
   samples:(parent?.samples??0)+1,
   image:context.createImageData(raster.width,raster.height)};
  return layer;
 }
 function sampleThrough(layer,item,count,deadline){
  const {columns,rows,values,probe,parent,hits,counts}=layer;
  const [offsetX,offsetY]=refinementProbe(probe??0);
  const sample=fractalSampler(item);
  const sameGrid=parent?.columns===columns&&parent?.rows===rows;
  for(let i=layer.filled;i<count;i++){
   if((i&63)===0&&performance.now()>deadline)break;
   const x=i%columns,y=Math.floor(i/columns);
   let n=sample((x+.5+offsetX)/columns,(y+.5+offsetY)/rows);
   if(hits){
    let total=1,escaping=Number(n>=0),sum=n<0?0:n;
    if(sameGrid){
     const prior=parent.values[i],priorHits=parent.hits?.[i]??Number(prior>=0);
     total+=parent.counts?.[i]??1;
     escaping+=priorHits;sum+=priorHits*prior;
    }else if(probe>=3){
     const cx=Math.floor(x*parent.columns/columns),cy=Math.floor(y*parent.rows/rows);
     const a=parent.values[cy*parent.columns+cx];
     const b=parent.values[cy*parent.columns+Math.min(parent.columns-1,cx+1)];
     const c=parent.values[Math.min(parent.rows-1,cy+1)*parent.columns+cx];
     // Spend extra subcell probes where the outline or a narrow escape
     // band would otherwise disappear between two high-resolution cells.
     if((a<0)!==(b<0)||(a<0)!==(c<0)||a>=0&&Math.max(Math.abs(a-b),Math.abs(a-c))>1.2){
      for(const [dx,dy] of [[.21,.73],[.77,.26],[.72,.76]]){
       const mark=sample((x+dx)/columns,(y+dy)/rows);
       if(mark>=0){sum+=mark;escaping++;}
       total++;
      }
     }
    }
    counts[i]=total;hits[i]=escaping;
    n=escaping?sum/escaping:-1;
   }
   values[i]=n;layer.filled=i+1;
  }
 }
 function sampleArtThrough(layer,item,frame,count,deadline){
  if(item.artPose&&!frame.artPose)frame.artPose=item.artPose(frame.artPhase??0);
  const {columns,rows,across,scale}=layer;
  const pass=Math.log2(scale)+1;
  const span=item.plane?2**-item.zoom:1,spanX=span*(item.viewport?.x??1),spanY=span*(item.viewport?.y??1);
  const left=item.plane?item.centerX-spanX/2:0,top=item.plane?item.centerY-spanY/2:0;
  const [ox,oy]=refinementProbe(item.plane?layer.probe??0:0);
  if(item.sampleArtBatch){
   if(frame.filled===count||performance.now()>deadline)return;
   item.sampleArtBatch({left,top,spanX,spanY,ox,oy,columns,rows,across,from:frame.filled,count,out:frame.art,pose:frame.artPose,pass});
   frame.filled=count;
   return;
  }
  for(let i=frame.filled;i<count;i++){
   if((i&63)===0&&performance.now()>deadline)break;
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<across;dx++){
    const u=(i%columns+(dx+.5+ox*.5)/across)/columns,v=(Math.floor(i/columns)+(dy+.5+oy*.5)*.5)/rows;
    const sampleX=left+u*spanX,sampleY=top+v*spanY;
    frame.art[(i*2+dy)*across+dx]=item.letterbox?
     ansiLetterboxInk(item.sample,sampleX,sampleY,frame.artPhase??0,pass,item.zoom,frame.artPose,item.letterbox):
     item.sample(sampleX,sampleY,frame.artPhase??0,pass,item.zoom,frame.artPose);
   }
   frame.filled=i+1;
  }
 }
 function advanceArt(layer,item,phase,deadline){
  if(phase===(layer.artPhase??0)&&!layer.nextArt)return;
  layer.nextArt??={art:layer.motionBuffer??new Uint32Array(layer.art.length),filled:0,artPhase:phase};
  const frame=layer.nextArt;
  sampleArtThrough(layer,item,frame,layer.filled,deadline);
  if(frame.filled===layer.filled){
   layer.motionBuffer=layer.art;layer.art=frame.art;layer.artPhase=frame.artPhase;layer.artPose=frame.artPose;layer.nextArt=null;
  }
 }
 const quadrantGlyphs=' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█';
 function quadrantInk(layer,index,out){
  const {art,across}=layer,base=index*across*2;
  let lo=Infinity,hi=-Infinity;
  for(let q=0;q<4;q++){
   const m=art[base+(q>>1)*across+(q%2)*Number(across===2)];
   const rgb=isAnsiRgb(m)?ansiRgbWord(m):shaded[m&15][15-(m>>>4&15)];
   out[3+q]=rgb;
   const y=(rgb&255)*2+(rgb>>>8&255)*5+(rgb>>>16&255)*2;
   lo=Math.min(lo,y);hi=Math.max(hi,y);
  }
  let bits=0,ar=0,ag=0,ab=0,an=0,br=0,bg=0,bb=0,bn=0;
  const split=(lo+hi)*.5;
  for(let q=0;q<4;q++){
   const n=out[3+q],r=n&255,g=n>>>8&255,b=n>>>16&255;
   if(r*2+g*5+b*2>split){bits|=1<<q;ar+=r;ag+=g;ab+=b;an++;}
   else{br+=r;bg+=g;bb+=b;bn++;}
  }
  out[0]=bits;
  out[1]=an?0xff000000|Math.round(ar/an)|(Math.round(ag/an)<<8)|(Math.round(ab/an)<<16):0xff000000;
  out[2]=0xff000000|Math.round(br/bn)|(Math.round(bg/bn)<<8)|(Math.round(bb/bn)<<16);
 }
 const hexWord=n=>'#'+(((n&255)<<16)|(n&65280)|(n>>>16&255)).toString(16).padStart(6,'0');
 function quadrantStroke(layer,col,row){
  // Fine passes share a two-pixel print area across adjacent sample cells.
  const stride=printWidth(layer)/layer.cellWidth;
  const center=Math.floor(stride/2);
  if(col%stride!==center||row%stride!==center||
     (row+stride-center)*layer.columns>layer.painted)return null;
  const index=row*layer.columns+col;
  const offset=index*layer.across*2;
  for(let i=0;i<layer.across*2;i++){
   const material=layer.art[offset+i],glyph=ansiInkGlyph(material);
   if(glyph===' ')continue;
   const rgb=isAnsiRgb(material);
   if(!rgb&&(material&15)===0)continue;
   const word=rgb?ansiRgbWord(material):shaded[material&15][15-((material>>>4)&15)];
   const luminance=(word&255)*2+(word>>>8&255)*5+(word>>>16&255)*2;
   const contrast=luminance>9*114?colors[0]:colors[15];
   return {glyph,ink:hexWord(blendInk(word,contrast,.55)),alpha:.85};
  }
  return null;
 }
 function fieldGlyph(layer,item,col,row,samples){
  const {columns,rows,values,art,across}=layer;
  const index=row*columns+col;
  if(index>=layer.filled)return null;
  if(art&&item.quadrantInk){
   const cell=new Uint32Array(7);
   quadrantInk(layer,index,cell);
   return {glyph:quadrantGlyphs[cell[0]],fg:hexWord(cell[1]),bg:hexWord(cell[2]),
    stroke:quadrantStroke(layer,col,row)};
  }
  const ramp=rampFor(item);
  let material=art?.[(index*2)*across]??0,explicit=ansiInkGlyph(material);
  if(art&&explicit===' '){
   for(let i=1;i<across*2;i++){
    const m=art[index*across*2+i],g=ansiInkGlyph(m);
    if(g!==' '){material=m;explicit=g;break;}
   }
  }
  const rgb=!!art&&isAnsiRgb(material);
  if(rgb&&explicit===' '&&!item.glyphInk)return {glyph:' ',stroked:false,fg:7,bg:ansiRgbHex(material)};
  for(let i=0;i<9;i++){
   const cx=clamp(col+i%3-1,0,columns-1),cy=clamp(row+Math.floor(i/3)-1,0,rows-1);
   const offset=cy*columns+cx;
   if(values){
    const n=values[offset];
    samples[i]=n<0?0:.4+Math.max(0,(n-2)*.20);
   }else{
    const m=art[offset*across*2];
    const shade=isAnsiRgb(m)?ansiRgbWord(m):shaded[m&15][15-(m>>>4&15)];
    samples[i]=((shade&255)*.2126+(shade>>>8&255)*.7152+(shade>>>16&255)*.0722)/255;
   }
  }
  const contour=contourGlyph(samples,art?.24:.30);
  const n=values?.[index]??0,t=Math.max(0,(n-2)*.28+(layer.phase??0));
  const band=Math.floor(t)%(ramp.length-1);
  const pattern=rgb?0:(material>>>8)&7;
  if(rgb&&explicit===' '&&!contour)return {glyph:' ',stroked:false,fg:7,bg:ansiRgbHex(material)};
  const density=art?(material&15)===0?' ':pattern?['█','▒','░','╱','╲','╳','─'][pattern]:'█':
   n<0?' ':['░','▒','▓','█'][Math.min(3,Math.floor((t%1)*4))];
  return {glyph:explicit!==' '?explicit:contour||density,stroked:explicit!==' '||!!contour,
   fg:art?(isAnsiRgb(material)?ansiRgbHex(material):material&15):ramp[Math.min(ramp.length-1,band+1)],bg:art?0:n<0?0:ramp[band]};
 }
 const printWidth=layer=>layer.art?Math.max(2,layer.cellWidth):([11,8,6,5,5,4,4,3][Math.log2(layer.scale)]??4);
 function paintFieldGlyphs(layer,item,first,last){
  const {context,canvas,columns,rows,cellWidth,cellHeight}=layer;
  // Fit a small real glyph over measured edges. On narrow cells use a
  // character spanning adjacent samples, and let the loupe show the ink grid.
  const step=printWidth(layer);
  const glyphHeight=step*2;
  const palette=ansiColourTheme(colorTheme).colours,samples=item.quadrantInk?null:new Float32Array(9);
  for(let y=first;y+glyphHeight<=last;y+=glyphHeight)for(let x=0;x+step<=canvas.width;x+=step){
   const col=Math.min(columns-1,Math.floor((x+step/2)/cellWidth));
   const row=Math.min(rows-1,Math.floor((y+glyphHeight/2)/cellHeight));
   if(item.quadrantInk){
    const mark=quadrantStroke(layer,col,row);
    if(mark){
     context.globalAlpha=mark.alpha;
     glyph(context,mark.glyph,x,y,step,mark.ink);
    }
    continue;
   }
   // Avoid reading edge neighborhoods across the serial paint boundary.
   if((row+1)*columns+col>=layer.filled)continue;
   const index=row*columns+col;
   if(layer.art&&!item.glyphInk&&ansiInkGlyph(layer.art[index*layer.across*2])===' ')continue;
   const mark=fieldGlyph(layer,item,col,row,samples);
   if(!mark?.stroked||mark.fg===0)continue;
   context.globalAlpha=layer.art?.58:.62;
   glyph(context,mark.glyph,x,y,step,typeof mark.fg==='string'?mark.fg:palette[mark.fg]);
  }
  context.globalAlpha=1;
 }
 function paintLayer(layer,phase,item,count=layer.filled){
  const filter=layer.art?'classic':item.filter??'classic';
  const detail=filter==='detail';
  if(layer.art)phase=layer.artPhase??0;
  else if(item.surface)phase=0;
  const sameInk=layer.phase===phase&&layer.theme===colorTheme&&layer.filter===filter;
  if(sameInk&&layer.painted>=count)return;
  layer.phase=phase;
  layer.theme=colorTheme;
  layer.filter=filter;
  const {context,canvas:raster,columns,values,cellWidth,cellHeight,image}=layer;
  const ramp=rampFor(item),pixels=new Uint32Array(image.data.buffer),worldSpan=item.surface?2**-item.zoom:0;
  if(filter==='clean'&&!cleanInks.has(ramp)){
   cleanInks.set(ramp,ramp.slice(1).map((high,band)=>Array.from({length:inkSteps+1},
    (_,step)=>blendInk(colors[ramp[band]],colors[high],step/inkSteps))));
  }
  const ink=filter==='clean'?cleanInks.get(ramp):null;
  const cell=item.quadrantInk&&layer.art?new Uint32Array(7):null;
  const start=sameInk?(layer.painted||0):0;
  layer.painted=count;
  for(let i=start;i<count;i++){
   const x=i%columns*cellWidth,y=Math.floor(i/columns)*cellHeight;
   if(hasSampledArt(item)||item.surface){
    const across=layer.across,blockWidth=cellWidth/across,blockHeight=cellHeight/2;
    if(item.sampleArtBatch&&cell&&across===1){
     const at=i*2, dst=y*raster.width+x;
     pixels[dst]=ansiRgbWord(layer.art[at]);
     pixels[dst+raster.width]=ansiRgbWord(layer.art[at+1]);
     continue;
    }
    if(cell)quadrantInk(layer,i,cell);
    for(let dy=0;dy<2;dy++)for(let dx=0;dx<across;dx++){
     if(cell){
      const mask=1<<(dy*2+dx);
      for(let py=0;py<blockHeight;py++){
       const start=(y+dy*blockHeight+py)*raster.width+x+dx*blockWidth;
       pixels.fill(cell[cell[0]&mask?1:2],start,start+blockWidth);
      }
      continue;
     }
     const material=item.surface?echoTerrainInk(item.surface,values[i],
      item.centerX+((i%columns+(dx+.5)/across)/columns-.5)*worldSpan,
      item.centerY+((Math.floor(i/columns)+(dy+.5)/2)/layer.rows-.5)*worldSpan):
      layer.art[(i*2+dy)*across+dx];
     const rgb=isAnsiRgb(material),dim=15-(material>>4&15);
     const shade=shaded[material&15],color=rgb?ansiRgbWord(material):shade[dim],pattern=rgb?0:(material>>>8)&7;
     for(let py=0;py<blockHeight;py++){
      const start=(y+dy*blockHeight+py)*raster.width+x+dx*blockWidth;
      if(!pattern){pixels.fill(color,start,start+blockWidth);continue;}
      for(let px=0;px<blockWidth;px++){
       const stipple=ansiDitherPixel(ansiDitherModes[pattern],x+dx*blockWidth+px,y+dy*blockHeight+py);
       pixels[start+px]=stipple?shade[Math.max(0,dim-4)]:color;
      }
     }
    }
    continue;
   }
   const n=values[i],coverage=layer.counts?layer.hits[i]/layer.counts[i]:1;
   const t=Math.max(0,(n-2)*.28+phase);
   const band=Math.floor(t)%(ramp.length-1);
   if(n<0||ink){
    const shade=n<0?colors[0]:ink[band][Math.round(t%1*inkSteps)];
    const color=n<0||coverage===1?shade:blendInk(colors[0],shade,coverage);
    for(let py=0;py<cellHeight;py++){
     const offset=(y+py)*raster.width+x;
     pixels.fill(color,offset,offset+cellWidth);
    }
    continue;
   }
   const density=detail ? t%1*4 : Math.floor((t%1)*3)+1;
   const low=colors[ramp[band]],high=colors[ramp[band+1]];
   // The fine filter uses actual subcell coverage at the edge and four
   // palette thresholds in the exterior instead of three fixed VGA shades.
   for(let py=0;py<cellHeight;py++)for(let px=0;px<cellWidth;px++){
    const mask=(x+px+(y+py)*3)%4;
    const edgeMask=((x+px)*3+(y+py)*5)%4;
    pixels[(y+py)*raster.width+x+px]=detail&&edgeMask+.5>coverage*4?colors[0]:
     mask+(detail?.5:0)<density?high:low;
   }
  }
  const first=Math.floor(start/columns)*cellHeight,last=Math.ceil(count/columns)*cellHeight;
  if(last>first){
   const printPitch=2*printWidth(layer);
   const prints=(layer.art&&(!item.sampleArtBatch||item.batchGlyphInk))||item.glyphInk&&layer.values;
   const from=prints?Math.floor(first/printPitch)*printPitch:first;
   context.putImageData(image,0,0,0,from,raster.width,last-from);
   if(prints)paintFieldGlyphs(layer,item,from,last);
  }
 }
 function drawRows(layer,count,[x,y,width,height]=[0,0,canvas.width,canvas.height]){
  const {canvas:raster,columns,cellWidth,cellHeight}=layer;
  const sx=width/raster.width,sy=height/raster.height;
  const rows=Math.floor(count/columns)*cellHeight, rest=(count%columns)*cellWidth;
  if(rows)ctx.drawImage(raster,0,0,raster.width,rows,x,y,width,rows*sy);
  if(rest)ctx.drawImage(raster,0,rows,rest,cellHeight,x,y+rows*sy,rest*sx,cellHeight*sy);
 }
 const loupe=textureOnly?null:mountAnsiLoupe(root,canvas,inspectionCells);
 let inspectOverlay=null,inspectionPass=1;
 function inspectionCells(point){
  const foreground=inspectOverlay?.(point,inspectionPass);
  if(foreground?.length)return foreground;
  const available=layers.filter(layer=>layer?.filled);
  if(!available.length||!sampled)return [];
  const indices=[...new Set([0,Math.min(3,available.length-1),available.length-1])];
  if(shownRelief){
   const span=2**-sampled.zoom,sx=span*(sampled.viewport?.x??1),sy=span*(sampled.viewport?.y??1);
   const x=sampled.centerX+(point.x-.5)*sx,y=sampled.centerY+(point.y-.5)*sy;
   const hit=reliefSourcePoint(shownRelief,x,y);
   point={x:point.x+(hit.x-x)/sx,y:point.y+(hit.y-y)/sy};
  }
  return indices.map(index=>{
   const layer=available[index],columns=11,rows=3,samples=new Float32Array(9);
   const x=clamp(Math.floor(point.x*layer.columns)-Math.floor(columns/2),0,Math.max(0,layer.columns-columns));
   const y=clamp(Math.floor(point.y*layer.rows)-1,0,Math.max(0,layer.rows-rows));
   const cells=Array.from({length:columns*rows},(_,i)=>fieldGlyph(layer,sampled,
    Math.min(layer.columns-1,x+i%columns),Math.min(layer.rows-1,y+Math.floor(i/columns)),samples));
   return {label:'P'+(layers.indexOf(layer)+1)+' / '+layer.columns+'×'+layer.rows,columns,rows,cells};
  });
 }
 function fillExposedDuringDrag(item,phase){
  const columns=Math.min(item.width,52),rows=Math.min(item.height,24);
  previewLayer??=makeLayer(item,{columns,rows,scale:1});
  const layer=previewLayer;
  layer.filled=0;layer.painted=0;layer.artPhase=phase;layer.artPose=null;
  if(hasSampledArt(item))sampleArtThrough(layer,item,layer,columns*rows,performance.now()+3);
  else sampleThrough(layer,item,columns*rows,performance.now()+3);
  paintLayer(layer,phase,item);
  drawRows(layer,layer.filled);
 }
 function update(item,ready,time,reduced=false){
  if(!item){
   shownRelief=null;
   inspectOverlay=null;
   loupe?.sync(null);
   if(!plateKey)return;
   canvas.style.display='none';if(objects)objects.style.display='none';displayKey='';overlayStamp='';plateKey='';plateIdentity='';sampled=null;layers=[];snapshot=null;terrain=null;previewLayer=null;return;
  }
  if(!ready){
   inspectOverlay=null;
   loupe?.sync(null);
   if(displayKey){canvas.style.display='none';if(objects)objects.style.display='none';displayKey='';}
   previousTime=time;return;
  }
  const theme=host.terminal?.colourTheme??'ansi';
  const colourMode=host.terminal?.colourMode??'rgb';
  if(inkMode!==colourMode||theme!==colorTheme){
   inkMode=colourMode;resolveColour=ansiColourResolver(colourMode,ansiColourTheme(theme).colours);
  }
  if(theme!==colorTheme){
   colorTheme=theme;colors=paletteWords(ansiColourTheme(theme).colours);
   shaded=shadeRamp();cleanInks.clear();overlayInks.clear();
   for(const layer of layers)if(layer)layer.phase=undefined;
   lastFrame='';
  }
  const identity=[item.id,item.width,item.height,item.kind,item.palette,item.seed,item.turn,item.surface?.kind].join('/');
  const next=identity+'/'+item.passes+'/'+(item.inkRevision??0)+'/'+Boolean(item.quadrantInk)+'/'+Boolean(item.nativeInkGrid)+
   '/'+item.pixelBounds?.width+'/'+item.pixelBounds?.height;
  const hasObjects=!!(item.overlay||item.inkLayers?.length||(!item.surfaceLighting&&item.lights?.length));
  if(hasObjects&&!objects&&!textureOnly){
   objects=doc.createElement('canvas');
   objects.className='ansi-plate-objects';
   objects.style.cssText=canvas.style.cssText;
   root.append(objects);
   objectsContext=objects.getContext('2d');
  }
  if(next!==plateKey){
   const resize=item.retainResize&&sampled?.id===item.id;
   if(sampled?.id!==item.id)loupe?.sync(null);
   if(plateIdentity!==identity){plateIdentity=identity;if(!resize)plateStart=time;flightCamera=null;}
   const received=resize?progress:0;
   // An in-world action rail changes the aperture while the same plate is on screen.
   const retained=resize&&item.retainCameraProgress?terrain:null;
   plateKey=next;sampled=null;layers=[];previousTime=time;lastFrame='';overlayStamp='';inkStamp='';
   snapshot=retained;terrain=retained;edgeLamps=null;cameraRefining=!!retained;directGrade=false;wasPreview=false;previewLayer=null;reliefInkStamp='';
   passes=progressivePasses(item.width,item.height,item.passes??4,item.pixelBounds);
   progress=Math.min(received,passes.length-1);
   const backing=ansiPlateBacking(item.width,item.height,passes,{smooth:item.nativeInkGrid,pixelBounds:item.pixelBounds});
   canvas.width=backing.width;canvas.height=backing.height;
   if(hasSampledArt(item))canvas.dataset.artwork=item.id;
   else delete canvas.dataset.artwork;
  }

  const baseCells=item.width*item.height,elapsed=Math.max(0,time-previousTime);
  const age=Math.max(0,time-plateStart);
  const completeAt=passes.length-1;
  const instant=skip||reduced||item.instantPasses;
  skip=false;
  if(instant) progress=completeAt;
  else progress=Math.min(completeAt,progress+elapsed*item.bps/(10*(item.baseBytes??baseCells)));
  previousTime=time;

  const moved=sampled&&(!hasSampledArt(item)||item.plane)&&!sameCamera(sampled,item);
  if(snapshot&&item.surfaceProjection!==undefined&&snapshot.projection!==item.surfaceProjection)snapshot=null;
  if(moved&&(!wasPreview||!snapshot)&&terrain&&terrain.projection===item.surfaceProjection)snapshot={...terrain,shipPx:shipPick?.px};
  wasPreview=!!item.preview;
  if(moved && (!item.preview||!snapshot)){
   // Reproject the last compatible ink while refreshing the camera crop.
   // Ordinary Doors still receive the new samples at their line rate.
   if(!instant&&!item.retainCameraProgress)progress=0;
   cameraRefining=true;directGrade=false;
   sampled=item;layers=[];edgeLamps=null;
  } else if(!sampled) sampled=item;
  else if(!moved&&!item.preview&&!cameraRefining)snapshot=null;

  if(!textureOnly){
   const fit=host.rect();
   const clipPath=item.iris&&!reduced?ansiIris((time-item.iris.at)/item.iris.duration,item.iris.x,item.iris.y):'';
   const geometry=[fit.left,fit.top,fit.cellWidth,fit.cellHeight,item.column,item.row,item.width,item.height,clipPath,hasObjects,item.smoothInk,item.smoothSprites].join('/');
   if(geometry!==displayKey){
    const base=root.getBoundingClientRect();
    const bounds={display:'block',left:(fit.left-base.left+(item.column-1)*fit.cellWidth)+'px',
     top:(fit.top-base.top+(item.row-1)*fit.cellHeight)+'px',
     width:item.width*fit.cellWidth+'px',height:item.height*fit.cellHeight+'px',clipPath,
     imageRendering:item.smoothInk?'auto':'pixelated'};
    Object.assign(canvas.style,bounds);
    if(hasObjects)Object.assign(objects.style,bounds,{imageRendering:item.smoothSprites?'auto':bounds.imageRendering});
    else if(objects)objects.style.display='none';
    displayKey=geometry;
   }

  }
  const wanted=passes.map((pass,index)=>Math.floor(pass.columns*pass.rows*
   (index===0?1:Math.max(0,Math.min(1,progress-index+1)))));
  const finalIndex=wanted.findLastIndex(n=>n>0);
  const finalBottom=wanted[finalIndex]===passes[finalIndex].columns*passes[finalIndex].rows?finalIndex:finalIndex-1;
  const counts=passes.map(()=>0),deadline=performance.now()+(cameraRefining?Math.min(frameBudget*1.75,7):frameBudget);
  const phase=item.artFrame??(reduced||item.animated===false?0:Math.floor((item.phaseClock==='board'?time:age)*4)/4*.12);
  const basePhase=item.artPose?layers[0]?.artPhase??phase:phase;
  const directCamera=Boolean(item.retainCameraProgress&&cameraRefining&&finalIndex===completeAt&&finalBottom===completeAt);
  if(directCamera)directGrade=true;
  const first=directGrade?completeAt:snapshot||cameraRefining||hasSampledArt(item)?0:Math.min(3,finalBottom);
  for(let index=first;index<=finalIndex&&!(item.preview&&snapshot);index++){
   const layer=layers[index]??=makeLayer(sampled,passes[index],layers[index-1]);
   const wasFilled=layer.filled;
   if(layer.values&&layer.filled<wanted[index]){
    sampleThrough(layer,sampled,wanted[index],deadline);
    if(layer.filled===layer.values.length)layer.parent=null;
   }
   if(layer.art&&layer.filled<wanted[index]){
    layer.artPhase??=basePhase;
    sampleArtThrough(layer,sampled,layer,wanted[index],deadline);
   }
   counts[index]=Math.min(wanted[index],layer.filled);
   if(counts[index]<wanted[index]||(cameraRefining&&layer.filled>wasFilled&&
    layer.filled===layer.columns*layer.rows))break;
  }
  const top=counts.findLastIndex(count=>count>0);
  const bottom=counts.findLastIndex((count,index)=>count===passes[index].columns*passes[index].rows);
  const done=top===completeAt&&bottom===completeAt;
  if(done&&layers[top].art&&(item.artFrame!==undefined||!reduced&&item.animated!==false))advanceArt(layers[top],item,phase,deadline);
  if(!item.preview){
   if(snapshot&&bottom>=snapshot.pass)snapshot=null;
   if(top===finalIndex&&counts[top]===wanted[top])cameraRefining=false;
  }
  const retainedPass=snapshot?.pass??-1;
  const displayPass=Math.min(passes.length-1,Math.max(top,retainedPass));
  if(item.reliefField&&displayPass>=0){
   reliefRenderer??=createRetainedRelief(doc)||false;
   shownRelief=reliefRenderer&&item.reliefField(item.reliefPose,displayPass+1);
  }else shownRelief=null;
  // A room fixture uses the same projected point for its emitter, spill
  // and cast on actor ink. Changing the lighting leaves received ink intact.
  const fixtures=item.surfaceLighting&&item.lights?.map(lamp=>{
   if(!lamp.projected||!shownRelief)return lamp;
   const {x,y}=reliefProjectPoint(shownRelief,lamp.u,lamp.v);
   return {...lamp,u:x,v:y};
  });
  const lightingBeat=reduced?0:Math.floor(age*16)/16;
  inspectOverlay=item.inspectOverlay;inspectionPass=Math.max(1,displayPass+1);
  if(!textureOnly){
   const geometryStamp=[item.centerX,item.centerY,item.zoom,item.viewport?.x,item.viewport?.y,item.letterbox,colorTheme,reduced,displayPass,counts[top],item.smoothSprites,shownRelief?item.reliefFrame:''].join('/');
   const stamp=[item.aim?.x,item.aim?.y,item.aim?.level,item.overlayKey,geometryStamp,colourMode,item.depthOffset?.join(),layers[displayPass]?.artPhase].join('/');
   const redraw=hasObjects&&(!item.staticOverlay||stamp!==overlayStamp);
   if(redraw){
    spriteEpoch++;
    overlayStamp=stamp;
    if(objects.width!==canvas.width||objects.height!==canvas.height){
     objects.width=canvas.width;objects.height=canvas.height;
    }
    const palette=ansiColourTheme(colorTheme).colours;
    const width=objects.width,height=objects.height;
    const world=item.worldOverlay&&item.plane,scale=world?2**item.zoom:1;
    const viewX=world?item.viewport?.x??1:1,viewY=world?item.viewport?.y??1:1;
    const centerX=world?item.centerX:.5,centerY=world?item.centerY:.5;
    const projectX=x=>.5+(x-centerX)*scale/viewX,projectY=y=>.5+(y-centerY)*scale/viewY;
    const visible=(x,y,w,h)=>x+w>0&&x<1&&y+h>0&&y<1;
    objectsContext.clearRect(0,0,width,height);
    if(item.letterbox){
     objectsContext.save();
     objectsContext.beginPath();
     objectsContext.rect(projectX(0)*width,projectY(0)*height,scale/viewX*width,scale/viewY*height);
     objectsContext.clip();
    }
    objectsContext.imageSmoothingEnabled=false;
    const put=(x,y,w,h,ink)=>{
     x=projectX(x);y=projectY(y);w*=scale/viewX;h*=scale/viewY;
     if(!visible(x,y,w,h))return;
     if(typeof ink==='string')objectsContext.fillStyle=ink;
     else if(isAnsiRgb(ink))objectsContext.fillStyle=ansiRgbHex(ink);
     else if(ink<16)objectsContext.fillStyle=palette[ink];
     else{
      const material=ink&255;
      if(!overlayInks.has(material)){
       const word=shaded[material&15][15-(material>>>4&15)];
       overlayInks.set(material,'rgb('+(word&255)+' '+(word>>>8&255)+' '+(word>>>16&255)+')');
      }
      objectsContext.fillStyle=overlayInks.get(material);
     }
     objectsContext.fillRect(Math.round(x*width),Math.round(y*height),
      Math.max(1,Math.round(w*width)),Math.max(1,Math.round(h*height)));
    };
    const depthQueue=createAnsiDepthQueue(item.depthOffset);
    const layer=(image,x,y,w,h)=>{
     x=projectX(x);y=projectY(y);w*=scale/viewX;h*=scale/viewY;
     if(!visible(x,y,w,h))return;
     const smoothing=objectsContext.imageSmoothingEnabled;
     objectsContext.imageSmoothingEnabled=!!item.smoothInk;
     objectsContext.drawImage(image,x*width,y*height,w*width,h*height);
     objectsContext.imageSmoothingEnabled=smoothing;
    };
    // A region carries its glyph plate, bounds, and light at one depth.
    put.layer=(image,x=0,y=0,w=1,h=1,depth)=>{
     if(depth===undefined)layer(image,x,y,w,h);
     else depthQueue.add(depth,(dx,dy)=>layer(image,x+dx,y+dy,w,h));
    };
    // Retain actual authored characters, their colours and their source grid.
    // The shared glyph painter compiles a plate once for each source revision.
    put.cells=(key,source,x=0,y=0,w=1,h=1,depth)=>{
     const identity=key+'/'+colorTheme+'/'+inkMode;
     let raster=cellPlates.get(identity);
     if(!raster){
      raster=doc.createElement('canvas');
      raster.width=source.columns*8;raster.height=source.rows*16;
      const context=raster.getContext('2d');
      context.font='16px '+ansiFontFamily;context.textBaseline='top';
      for(const cell of source.cells){
       if(cell.bg!=null){context.fillStyle=resolveColour(cell.bg);context.fillRect(cell.x*8,cell.y*16,8,16);}
       if(cell.glyph===' ')continue;
       context.fillStyle=resolveColour(cell.fg);
       paintGlyph(context,cell.glyph,cell.x*8,cell.y*16,8,16);
      }
      if(cellPlates.size>=32)cellPlates.delete(cellPlates.keys().next().value);
      cellPlates.set(identity,raster);
     }
     put.layer(raster,x,y,w,h,depth);
    };
    put.depthRegion=(depth,paint)=>depthQueue.add(depth,(dx,dy)=>paint({
     layer:(image,x,y,w,h)=>layer(image,x+dx,y+dy,w,h),
     glyph:(g,x,y,size,ink,style)=>put.glyph(g,x+dx,y+dy,size,ink,style),
     bloom:(x,y,size,ink,power,shape,pass)=>put.bloom(x+dx,y+dy,size,ink,power,shape,pass),
    }));
    put.pass=Math.max(1,displayPass+1);
    put.zoom=world?item.zoom:0;
    const smoothSprites=item.smoothSprites&&put.pass>=3;
    // Preserve the last painted pose when a crowd exhausts this frame.
    const spriteDeadline=smoothSprites?performance.now()+5:Infinity;
    const grade=passes[put.pass-1];
    put.grid={columns:grade.columns,rows:grade.rows};
    if(item.smoothSprites){
     // Match the displayed room pass, including retained ink during zoom.
     put.spritePixels={x:Math.min(width,grade.columns*2)*scale/viewX,
      y:Math.min(height,grade.rows*2)*scale/viewY};
    }
    put.viewBounds={left:centerX-viewX/(2*scale),right:centerX+viewX/(2*scale),
     top:centerY-viewY/(2*scale),bottom:centerY+viewY/(2*scale)};
    put.artPose=layers[displayPass]?.artPose;
    put.reliefPose=shownRelief?item.reliefPose:undefined;
    put.faceAim=item.faceAim&&world?{
     x:centerX+(item.faceAim.x-.5)*viewX/scale,
     y:centerY+(item.faceAim.y-.5)*viewY/scale,
    }:undefined;
    put.reliefField=shownRelief;
    put.reliefFrame=shownRelief?item.reliefFrame:undefined;
    put.surfacePoint=shownRelief?(x,y)=>reliefProjectPoint(shownRelief,x,y):null;
    put.surfaceSource=shownRelief?(x,y)=>reliefSourcePoint(shownRelief,x,y):null;
    if(fixtures&&fixtures.some(lamp=>lamp.cast)){
     const casts=fixtures.flatMap((lamp,index)=>{
      if(!lamp.cast||(lamp.minPass??1)>put.pass)return [];
      const {color,power}=ansiSurfaceLightState(lamp,palette,lightingBeat,index,reduced);
      const rgb=parseInt(color.slice(1),16);
      return [{lamp,power,r:rgb>>16&255,g:rgb>>8&255,b:rgb&255}];
     });
     put.lightTint=(x,y)=>{
      let r=1,g=1,b=1;
      for(const {lamp,power,r:lr,g:lg,b:lb} of casts){
       const dx=(x-lamp.u)/Math.max(.025,lamp.size*(lamp.spread??1)*.80);
       const dy=(y-lamp.v)/lamp.size-.50;
       const cast=Math.max(0,1-dx*dx-dy*dy*.50)**2*power*.26/255;
       r+=cast*lr;g+=cast*lg;b+=cast*lb;
      }
      return [r,g,b].map(n=>Math.round(n*25)/25);
     };
    }
    // A depth of one shares the world camera. Distant layers slide less;
    // foreground layers slide farther while retaining the same clip bounds.
    put.sprite=(key,x,y,w,h,columns,rows,sample,frame,depth=1,refine=false)=>{
     const magnify=1+(scale-1)*depth;
     x=.5+((x-.5)*magnify-(centerX-.5)*scale*depth)/viewX;
     y=.5+((y-.5)*magnify-(centerY-.5)*scale*depth)/viewY;
     w*=magnify/viewX;h*=magnify/viewY;
     if(!visible(x,y,w,h))return;
     objectsContext.imageSmoothingEnabled=!!smoothSprites;
     objectsContext.drawImage(objectSprite(key,columns,rows,sample,frame,spriteDeadline,smoothSprites&&refine),x*width,y*height,w*width,h*height);
     objectsContext.imageSmoothingEnabled=false;
    };
    put.shadow=(x,y,rx,ry,opacity)=>{
     x=projectX(x)*width;y=projectY(y)*height;
     rx*=width*scale/viewX;ry*=height*scale/viewY;
     objectsContext.save();
     objectsContext.translate(x,y);objectsContext.scale(rx,ry);
     const falloff=objectsContext.createRadialGradient(0,0,.18,0,0,1);
     falloff.addColorStop(0,'rgba(0,0,0,'+opacity+')');falloff.addColorStop(1,'transparent');
     objectsContext.fillStyle=falloff;objectsContext.fillRect(-1,-1,2,2);objectsContext.restore();
    };
    put.reflection=(key,x,y,w,h,columns,rows,sample,frame,opacity)=>{
     x=projectX(x);y=projectY(y);w*=scale/viewX;h*=scale/viewY;
     if(!visible(x,y,w,h))return;
     const reflected=objectSprite(key,columns,rows,sample,frame,spriteDeadline);
     objectsContext.save();
     objectsContext.globalAlpha=opacity;
     objectsContext.imageSmoothingEnabled=!!smoothSprites;
     objectsContext.drawImage(reflected,x*width,y*height,w*width,h*height);
     objectsContext.restore();
    };
    // Text keeps its measured bounds even when Chrome substitutes a font.
    put.textBlock=(text,x,y,w,h,size,ink,{maxSize=32,maxLines=3,alpha=1}={})=>{
     x=projectX(x);y=projectY(y);w*=scale/viewX;h*=scale/viewY;
     const boxW=w*width,boxH=h*height;
     if(boxW<=0||boxH<=0||!visible(x,y,w,h))return;
     const context=objectsContext;
     let font=Math.min(maxSize,Math.max(1,size*height*scale/viewY)),lines,lineHeight;
     context.save();
     for(let attempt=0;attempt<12;attempt++){
      context.font=font+'px '+ansiFontFamily;
      lines=wrapAnsiText(text,boxW,line=>context.measureText(line).width);
      lineHeight=font*1.18;
      if(lines.length<=maxLines&&lines.length*lineHeight<=boxH)break;
      font*=Math.min(.92,boxH/(lines.length*lineHeight),maxLines/lines.length);
     }
     context.font=font+'px '+ansiFontFamily;
     lines=wrapAnsiText(text,boxW,line=>context.measureText(line).width);
     lineHeight=font*1.18;
     context.beginPath();context.rect(x*width,y*height,boxW,boxH);context.clip();
     context.fillStyle=resolveColour(ink);context.globalAlpha=clamp(alpha,0,1);
     context.textAlign='center';context.textBaseline='top';
     const top=y*height+Math.max(0,(boxH-lines.length*lineHeight)/2);
     lines.forEach((line,i)=>context.fillText(line,x*width+boxW/2,top+i*lineHeight,boxW));
     context.restore();
     return {lines,fontSize:font,width:boxW,height:boxH};
    };
    put.glyph=(symbol,x,y,size,ink,{hue=0,alpha=1,maxSize=32,depth,rotate=0}={},context=objectsContext)=>{
     if(depth!==undefined){
      depthQueue.add(depth,(dx,dy)=>put.glyph(symbol,x+dx,y+dy,size,ink,{hue,alpha,maxSize,rotate},context));
      return;
     }
     x=projectX(x);y=projectY(y);
     const px=Math.min(maxSize,Math.max(1,size*height*scale/viewY));
     if(x< -px/width||x>1+px/width||y< -px/height||y>1+px/height)return;
     context.globalAlpha=clamp(alpha,0,1);
     const color=hue?resolveColour(ansiHueColour(resolveColour(ink),(hue+360)%360,colourMode!=='rgb')):resolveColour(ink);
     if(rotate){
      context.save();context.translate(x*width,y*height-px*.5);context.rotate(rotate);
      glyph(context,symbol,-px*symbol.length*.5,-px*.5,px,color);
      context.restore();
     }else glyph(context,symbol,x*width-px*symbol.length*.5,y*height-px,px,color);
     context.globalAlpha=1;
    };
    put.bloom=(x,y,size,ink,power,shape=1,sourcePass=displayPass+1,context=objectsContext)=>{
     x=projectX(x);y=projectY(y);
     const radius=size*height*scale/viewY;
     const extent=typeof shape==='object'?radius*Math.max(shape.core??1,shape.halo??1)*Math.max(1,shape.aspect??1):radius;
     if(!visible(x-extent/width,y-extent/height,2*extent/width,2*extent/height))return;
     lightPainter??=createAnsiLightPainter(doc);
     const pass=Math.max(1,Math.min(item.passes??4,sourcePass));
     if(typeof shape==='object'){
      lightPainter.bloom(context,{x:x*width,y:y*height,radius,color:resolveColour(ink),power,pass,shape});
      return;
     }
     const core=ansiBloomProfile(pass);
     lightPainter.glow(context,{x:x*width,y:y*height,width:radius*shape*2.3,height:radius*2.3,
      color:resolveColour(ink),power:power*.77,pass});
     lightPainter.glow(context,{x:x*width,y:y*height,width:radius*core.radius,height:radius*core.radius,
      color:resolveColour(ink),power,pass});
    };
    // Reuse completed still ink through light, animation and actor frames.
    // A new serial row or camera pose composites the visible passes again.
    const paintInk=(context,animated)=>paintAnsiInkBands(item.inkLayers,{
     pass:displayPass+1,age,reduced,animated,
     receive(pass,v){
      if(pass<=bottom+1||pass<=retainedPass+1)return true;
      const layer=passes[pass-1],reception=(counts[pass-1]??0)/(layer.columns*layer.rows);
      return reception>=1||projectY(v)<=reception;
     },
     bloom:(u,v,size,ink,power,pass,shape)=>put.bloom(u,v,size,ink,power,shape??1,pass,context),
     glyph:(symbol,u,v,size,ink,alpha,hue)=>put.glyph(symbol,u,v,size,ink,{alpha,hue,maxSize:width*.38},context),
    });
    if(item.inkLayers?.length){
     if(!inkRaster){inkRaster=doc.createElement('canvas');inkContext=inkRaster.getContext('2d');}
     if(inkRaster.width!==width||inkRaster.height!==height){
      inkRaster.width=width;inkRaster.height=height;inkStamp='';
     }
     if(inkStamp!==geometryStamp+'/'+colourMode){
      inkStamp=geometryStamp+'/'+colourMode;
      inkContext.clearRect(0,0,width,height);
      paintInk(inkContext,false);
     }
     objectsContext.drawImage(inkRaster,0,0);
     if(!reduced)paintInk(objectsContext,true);
    }
    item.overlay?.(age,put,reduced,time,(text,x,y,ink,span=12)=>{
     x=projectX(x);y=projectY(y);
     if(x<0||x>1||y<0||y>1)return;
     const glyphWidth=Math.max(6,Math.min(15,span/76*width/text.length));
     glyph(objectsContext,text,x*width-glyphWidth*text.length/2,y*height,glyphWidth,palette[ink]);
    });
    depthQueue.flush();
    if(!item.surfaceLighting&&item.lights?.length){
     lightPainter??=createAnsiLightPainter(doc);
     const pass=Math.max(1,Math.min(item.passes??4,displayPass+1));
     const core=ansiBloomProfile(pass);
     for(const [index,lamp] of item.lights.entries()){
      if(lamp.minPass>pass)continue;
      const flicker=ansiLightPulse(lamp,age,index,reduced);
      const radius=lamp.size*Math.min(objects.height,objects.width*.68);
      const scale=item.plane?2**item.zoom:1;
      const x=(.5+(lamp.u-(item.plane?item.centerX:.5))*scale/(item.viewport?.x??1))*objects.width;
      const y=(.5+(lamp.v-(item.plane?item.centerY:.5))*scale/(item.viewport?.y??1))*objects.height;
      if(x< -radius||x>objects.width+radius||y< -radius||y>objects.height+radius)continue;
      lightPainter.glow(objectsContext,{x,y,width:radius*(lamp.kind==='area'?2.3:1),height:radius,
       color:palette[lamp.color],power:lamp.power*(.66+.34*flicker)*.65,pass,kind:lamp.kind});
      lightPainter.glow(objectsContext,{x,y,width:radius*Math.max(.40,core.radius),height:radius*Math.max(.40,core.radius),
       color:palette[lamp.color],power:lamp.power*(.72+.28*flicker)*.92,pass});
     }
    }
    if(item.letterbox)objectsContext.restore();
    if(item.aim)drawReviewAim(objectsContext,objects,item.aim,colorTheme,glyph);
    if(smoothSprites&&spriteJobs.size)refineSprites(performance.now()+4);
   }

  }
  const flyFactor=reduced?1:1-Math.exp(-Math.min(.16,elapsed)*10);
  const ship=item.flight?(()=>{
   flightCamera??={};
   const focus=item.shipFocus??{x:20,y:7};
   for(const [key,value] of Object.entries({inspect:item.inspect?1:0,cutaway:item.cutaway?1:0,
    zoom:item.zoom??0,logScale:Math.log2(item.magnify??1),focusX:focus.x,focusY:focus.y})){
    flightCamera[key]=(flightCamera[key]??value)+((value)-(flightCamera[key]??value))*flyFactor;
   }
   return flightPosition(canvas.width,canvas.height,reduced?0:age,item.seed,item,flightCamera,
    item.route?routePose(item.route,time,reduced):null);
  })():null;
  const flow=item.cameraScale??(item.flow&&!reduced?1.12+.12*Math.sin(age*2.9):1);
  const stamp=[item.smoothInk,flow,item.centerX,item.centerY,item.zoom,item.preview,counts[top],top,bottom,retainedPass,cameraRefining,hasSampledArt(item)||item.surface?0:phase,
   item.flightEffect&&item.flightEffect.revision,item.engine?.at,item.hull?.id,
   ship&&[Math.round(ship.x),Math.round(ship.y),ship.px.toFixed(2),ship.flip.toFixed(2),ship.facing,
    ship.cutaway.toFixed(2),item.pilot?.step,item.pilot?.armed,item.pilot?.attack&&Math.min(9,Math.floor((time-item.pilot.attack.at)*25)),item.pilot?.attack?.at,item.kit?.weapon.id,item.life?.width,reduced?0:Math.floor(age*24)].join(','),

   item.aim?.level,item.aim?.x,item.aim?.y,shownRelief?item.reliefFrame:'',
   layers[top]?.artPhase,fixtures?.length,fixtures&&fixtures.some(lamp=>lamp.flicker)?lightingBeat:0,item.filter,colorTheme].join('/');
  loupe?.sync(displayPass>=0?{theme:colorTheme,pass:displayPass+1,foreground:hasObjects?objects:null}:null);
  if(stamp===lastFrame){if(hasObjects)loupe?.refresh();return;}
  lastFrame=stamp;

  ctx.imageSmoothingEnabled=!!item.smoothInk;
  ctx.imageSmoothingQuality='low';
  ctx.fillStyle=ansiColourTheme(colorTheme).colours[0];
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const painted=[];
  for(let index=Math.max(first,bottom);index<=top;index++){
   if(counts[index])painted.push({view:sampled,layer:layers[index],count:counts[index]});
  }
  if(snapshot&&item.preview)fillExposedDuringDrag(item,phase);
  const sheets=snapshot?[...snapshot.painted,...painted]:painted;
  if(snapshot){
   // Order by apparent detail at the new zoom. Old pixels keep their ink
   // and replace fresh pixels only while they actually contain more detail.
   const density=({view,layer})=>layer.columns*(1+.05*(layer.samples-1))*
    (view===sampled?1:2**(view.zoom-item.zoom)*.73);
   sheets.sort((a,b)=>density(a)-density(b));
  }
  for(const sheet of sheets)drawSheet(sheet,item,phase,flow);
  if(shownRelief){
   const inkStamp=[plateKey,item.centerX,item.centerY,item.zoom,item.viewport?.x,item.viewport?.y,
    item.preview,top,counts[top],bottom,retainedPass,colorTheme,item.filter].join('/');
   if(inkStamp!==reliefInkStamp){reliefInkStamp=inkStamp;reliefRevision++;}
   const projected=reliefRenderer.draw(canvas,reliefRevision,shownRelief,item);
   ctx.drawImage(projected,0,0);
  }
  if(fixtures?.length&&displayPass>=0){
   lightPainter??=createAnsiLightPainter(doc);
   const palette=ansiColourTheme(colorTheme).colours;
   ctx.save();
   if(item.clipLighting||item.letterbox){
    const scale=2**item.zoom,sx=scale/(item.viewport?.x??1),sy=scale/(item.viewport?.y??1);
    ctx.beginPath();
    ctx.rect((.5-item.centerX*sx)*canvas.width,(.5-item.centerY*sy)*canvas.height,sx*canvas.width,sy*canvas.height);
    ctx.clip();
   }
   fixtures.forEach((lamp,index)=>{
    if((lamp.minPass??1)<=displayPass+1)paintAnsiSurfaceLight(ctx,lightPainter,lamp,palette,
     item.worldOverlay&&item.plane?item:{},lightingBeat,index,reduced);
   });
   ctx.restore();
  }

  if(painted.length){
   // Keep the full current underpainting and its active strip on repeated moves.
   const retained=snapshot?snapshot.painted.filter(sheet=>sheet.view!==sampled).slice(-2):[];
   terrain={pass:displayPass,projection:item.surfaceProjection,painted:[...retained,...painted]};
  }
  if(!hasSampledArt(item)&&item.filter==='detail'&&!item.preview&&bottom>=0){
   if(!edgeLamps){
    const source=layers.find(layer=>layer?.values&&layer.filled===layer.values.length);
    if(source){
     const {values,columns,rows}=source,marks=[];
     // Search the actual escape boundary in four bounded windows. Nothing
     // emits in a viewport filled with solid interior or open space.
     for(const [u,v] of [[.25,.30],[.73,.33],[.34,.72],[.75,.71]]){
      let best=Infinity,position=null;
      for(let j=-7;j<=7;j++)for(let i=-11;i<=11;i++){
       const x=Math.round(u*columns)+i,y=Math.round(v*rows)+j,offset=y*columns+x;
       if(x<1||x>=columns-1||y<1||y>=rows-1)continue;
       const value=values[offset],distance=i*i+j*j*2;
       if(value<5||value>45||distance>=best)continue;
       if(values[offset-1]>=0&&values[offset+1]>=0&&values[offset-columns]>=0&&values[offset+columns]>=0)continue;
       best=distance;position=[(x+.5)/columns,(y+.5)/rows];
      }
      if(position)marks.push(position);
     }
     edgeLamps=marks;
    }
   }
   if(edgeLamps?.length){
    lightPainter??=createAnsiLightPainter(doc);
    const pass=Math.max(1,displayPass+1),radius=ansiBloomProfile(pass).radius;
    const palette=ansiColourTheme(colorTheme).colours,ramp=rampFor(item);
    for(const [i,[x,y]] of edgeLamps.entries()){
     const size=canvas.height*.13*radius;
     lightPainter.glow(ctx,{x:x*canvas.width,y:y*canvas.height,width:size,height:size,
      color:palette[ramp[(i+4)%ramp.length]],power:.24*ansiFlicker(1,age,i,reduced),pass});
    }
   }
  }
  if(ship){
   const palette=ansiColourTheme(colorTheme).colours;
   if(!item.surface)visitStars(canvas.width,canvas.height,reduced?0:age,item,(x,y,size,ink)=>{
    ctx.fillStyle=palette[ink];ctx.fillRect(x,y,size,size);
   });
   if(ship.cutaway>.005){
    ctx.fillStyle='rgba(0,0,0,'+(.40*ship.cutaway)+')';
    ctx.fillRect(0,0,canvas.width,canvas.height);
   }
   const fraction=top<0?0:counts[top]/(passes[top].columns*passes[top].rows);
   // The in-flight ship keeps its received ink. After arrival a new strip
   // replaces it only when that strip can carry more apparent detail.
   const carried=snapshot?Math.max(0,retainedPass-Math.max(0,
    Math.floor(Math.log2(ship.px/(snapshot.shipPx??ship.px))))):0;
   const base=item.preview&&retainedPass>=0?retainedPass:Math.max(carried,bottom);
   const pass=Math.max(base,top);
   const hullInk=item.hull?.ink??item.hullInk??(item.turn?courierSideInk:courierInk);
   const local=(u,v)=>({x:hullWidth/2+(u*canvas.width-ship.x-hullWidth*ship.px/2)/ship.sx,
    y:(v*canvas.height-ship.y)/ship.px});
   const floor=item.hull?.floor??(item.turn?sideDeckFloor:deckFloor);
   const deck=item.hull?.deck??item.deckArt??(item.turn?sideDeckInk:deckInk);
   const a=local(0,0),b=local(1,1);
   const bounds={left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),top:a.y,bottom:b.y};
   function drawHull(level,coverage,surface){
    if(coverage<=0)return;
    const bottom=bounds.top+(bounds.bottom-bounds.top)*coverage;
    const density=Math.min(18,2**(level-1))*2**Math.max(0,Math.floor(Math.log2(ship.px/48)));
    const tile=(lo,hi,max)=>[Math.max(0,Math.floor(lo*density/48)*48),Math.min(max*density,Math.ceil(hi*density/48)*48)];
    const [left,right]=tile(bounds.left,bounds.right,hullWidth);
    const [top,end]=tile(bounds.top,bounds.bottom,hullHeight);
    if(right<=left||end<=top)return;
    const key=[level,colorTheme,!!item.turn,item.hull?.id,surface,item.glyphInk,density,left,top,right,end].join('/');
    let raster=flightRasters.get(key);
    if(!raster){
     raster=doc.createElement('canvas');
     raster.width=right-left;raster.height=end-top;
     const inkCtx=raster.getContext('2d'),image=inkCtx.createImageData(raster.width,raster.height);
     const pixels=new Uint32Array(image.data.buffer);
     for(let y=0;y<raster.height;y++)for(let x=0;x<raster.width;x++){
      const u=(left+x+.5)/density,v=(top+y+.5)/density;
      let material=surface==='deck'?(floor(u,v)?deck(u,v,level):-1):hullInk(u,v,level,null);
      if(material<0)continue;
      if(isAnsiRgb(material)){
       const color=ansiRgbWord(material);
       pixels[y*raster.width+x]=surface==='dimmed hull'?shadeAnsiWord(color,12):color;
       continue;
      }
      if(level>=3&&density>18){
       const ink=material&15,dim=15-((material>>4)&15);
       const tooth=Math.sin(u*53+Math.sin(v*37)*.55)+.30*Math.sin(v*92+u*3);
       material=packAnsiInk(ink,clamp(dim+(tooth>1?1:tooth<-.72?-3:-1),0,15),material>>8);
      }
      const weave=material>>8;
      const shade=clamp(15-((material>>4)&15)+(weave&&ansiDitherPixel(ansiDitherModes[weave],left+x,top+y)?2:0),0,15);
      pixels[y*raster.width+x]=shaded[material&15][surface==='dimmed hull'?Math.round(shade*.8):shade];
     }
     inkCtx.putImageData(image,0,0);
     if(item.glyphInk&&density>=2){
      const step=4,samples=new Float32Array(9),deck=surface==='deck';
      for(let y=0;y<raster.height-7;y+=8)for(let x=0;x<raster.width-3;x+=4){
       if(!pixels[(y+4)*raster.width+x+2])continue;
       for(let i=0;i<9;i++){
        const color=pixels[(y+1+Math.floor(i/3)*2)*raster.width+x+(i%3)]>>>0;
        samples[i]=((color&255)*.2126+(color>>>8&255)*.7152+(color>>>16&255)*.0722)/255;
       }
       const symbol=contourGlyph(samples,.29);
       if(symbol)glyph(inkCtx,symbol,x,y,step,palette[deck?7:surface==='dimmed hull'?7:15]);
      }
     }
     if(flightRasters.size>=14)flightRasters.delete(flightRasters.keys().next().value);
     flightRasters.set(key,raster);
    }
    const rows=Math.min(raster.height,Math.max(0,Math.round(bottom*density)-top));
    if(rows)ctx.drawImage(raster,0,0,raster.width,rows,left/density,top/density,raster.width/density,rows/density);
   }
   const level=pass+1;
   lightPainter??=createAnsiLightPainter(doc);
   const engine=shipEnginePhase(!item.inspect&&!item.route?.manual&&item.route?.at>(item.engine?.at??-Infinity)?item.route:item.engine,time);
   ctx.save();
   ctx.translate(ship.x+hullWidth*ship.px/2,ship.y);
   ctx.scale(ship.sx,ship.px);
   ctx.translate(-hullWidth/2,0);
   function drawSurface(surface){
    drawHull(base+1,1,surface);
    if(pass>base)drawHull(level,fraction,surface);
   }
   if(ship.cutaway<.995)drawSurface('hull');
   if(ship.cutaway>.005){
    ctx.globalAlpha=ship.cutaway;
    drawSurface('dimmed hull');
    drawSurface('deck');
    paintCourierCrew(ctx,palette,item,ship,level,time,age,reduced,bounds);
    ctx.restore();
    for(const [i,lamp] of (item.hull?.lamps??fixtures).entries()){
     const x=ship.x+lamp.x*ship.px,y=ship.y+lamp.y*ship.px;
     const radius=Math.min(230,lamp.reach*ship.px);
     if(x< -radius||x>canvas.width+radius||y< -radius||y>canvas.height+radius)continue;
     lightPainter.glow(ctx,{x,y,width:radius,height:radius*.57,color:palette[lamp.color],
      power:ship.cutaway*.40*ansiFlicker(lamp.flicker,age,i,reduced),pass:level,kind:lamp.kind});
    }
   }else{
    ctx.restore();
    const bloom=Math.max(.53,ansiBloomProfile(level).radius)*ship.px;
    paintEngines(ctx,lightPainter,palette,ship,engine,bloom,level,reduced?0:age,item.turn);
   }
   if(item.route?.field&&!item.inspect){
    const route=item.route,target=courierRoutePoint(route.field,item,route.point);
    const x=target.x*canvas.width,y=target.y*canvas.height;
    if(target.x>=0&&target.x<=1&&target.y>=0&&target.y<=1){
     const size=ship.routePhase<1?11:8;
     ctx.strokeStyle=palette[14];ctx.lineWidth=2;
     ctx.globalAlpha=ship.routePhase<1?.82:.58;
     for(const h of [-1,1])for(const v of [-1,1]){
      ctx.beginPath();ctx.moveTo(x+h*size*.48,y+v*size);
      ctx.lineTo(x+h*size,y+v*size);ctx.lineTo(x+h*size,y+v*size*.48);ctx.stroke();
     }
     ctx.globalAlpha=1;
    }
    canvas.dataset.scanTarget=[target.x,target.y].map(value=>value.toFixed(4)).join(',');
   }else delete canvas.dataset.scanTarget;
   item.flightEffect?.paint(ctx,ship,palette,reduced);
   canvas.dataset.engine=engine.mode;
   canvas.dataset.cutaway=String(!!item.cutaway);
   canvas.dataset.shipZoom=(item.magnify??1).toFixed(3);
   canvas.dataset.shipFocus=[item.shipFocus?.x??20,item.shipFocus?.y??7].join(',');
   canvas.dataset.facing=String(ship.facing);
   canvas.dataset.flightProgress=ship.routePhase.toFixed(3);
   canvas.dataset.courierPass=String(pass+1);
   canvas.dataset.courierProgress=(pass===top?fraction:1).toFixed(3);
   canvas.dataset.fractalProgress=fraction.toFixed(3);
   shipPick={...ship,width:canvas.width,height:canvas.height,hullInk,bounds,panels:item.hull?.panels??bridgePanels};
   visitComet(canvas.width,canvas.height,ship,(x,y,size,ink)=>{
    ctx.fillStyle=palette[ink];ctx.fillRect(x,y,size,size);
   });
   canvas.dataset.shipPose=[ship.x/canvas.width,ship.y/canvas.height,ship.px].map(n=>n.toFixed(3)).join(',');
  } else {shipPick=null;delete canvas.dataset.shipPose;delete canvas.dataset.courierPass;}
  if(item.aim&&!hasObjects)drawReviewAim(ctx,canvas,item.aim,colorTheme,glyph);
  if(item.entry&&!reduced){
   const p=clamp((time-item.entry)/1.08,0,1);
   if(p<1){
    const palette=ansiColourTheme(colorTheme).colours;
    ctx.save();
    for(let y=0;y<canvas.height;y+=4){
     ctx.globalAlpha=ansiPhosphor(p,y/canvas.height,age*4);
     ctx.fillStyle=palette[y%16<8?6:14];ctx.fillRect(0,y,canvas.width,2);
    }
    ctx.restore();
   }
  }
  canvas.dataset.aimDepth=item.aim?.level.toFixed(2)??'';
  canvas.dataset.pass=String(displayPass+1);
  canvas.dataset.complete=String(done && !item.preview);
  canvas.dataset.zoom=String(item.zoom??0);
  if(item.plane){
   canvas.dataset.cameraCenter=[item.centerX,item.centerY].join(',');
   canvas.dataset.cameraSpan=[(item.viewport?.x??1)*2**-item.zoom,(item.viewport?.y??1)*2**-item.zoom].join(',');
  }else {delete canvas.dataset.cameraCenter;delete canvas.dataset.cameraSpan;}
  canvas.dataset.refining=String(cameraRefining);
  canvas.dataset.samplePass=String(top+1);
  canvas.dataset.cells=String(counts[top]??0);
  canvas.dataset.detailGrid=top<0?'':layers[top].columns+'×'+layers[top].rows;
  canvas.dataset.passes=String(passes.length);
  canvas.dataset.palettePhase=phase.toFixed(2);
  if(item.artPose)canvas.dataset.artFrame=String(layers[displayPass]?.artPhase??'');
  else delete canvas.dataset.artFrame;
  if(item.reliefField&&shownRelief)canvas.dataset.reliefFrame=String(item.reliefFrame);
  else delete canvas.dataset.reliefFrame;

  canvas.dataset.courier=String(!!item.flight);
  canvas.dataset.orientation=item.turn?'side':'top';
  canvas.dataset.filter=item.filter??'classic';
  loupe?.refresh();
 }

 let shipPick=null;
 return {canvas,inkBands:inspectionCells,surfaceSource(x,y){return shownRelief?reliefSourcePoint(shownRelief,x,y):{x,y};},setOpacity(value){
   const opacity=value===1?'':String(value);
   if(canvas.style.opacity===opacity)return;
   canvas.style.opacity=opacity;
   if(objects)objects.style.opacity=opacity;
  },capture(){
   if(!displayKey||!canvas.width)return null;
   const image=doc.createElement('canvas');
   image.width=canvas.width;image.height=canvas.height;
   const context=image.getContext('2d');
   context.drawImage(canvas,0,0);
   if(objects&&objects.style.display!=='none')context.drawImage(objects,0,0);
   return {image,rect:canvas.getBoundingClientRect()};
  },reveal(){skip=true;},update,destroy(){reliefRenderer?.destroy?.();loupe?.destroy();canvas.remove();objects?.remove();},
  shipBounds(){return shipPick?.bounds;},
  shipDeckPoint(u,v){
   if(!shipPick)return null;
   const {x,y,px,sx,width,height}=shipPick;
   return {x:hullWidth/2+(u*width-x-hullWidth*px/2)/sx,y:(v*height-y)/px};
  },
  bridgePanelAt(u,v){
   if(!shipPick)return null;
   const {x,y,px,sx,width,height}=shipPick;
   const a=hullWidth/2+(u*width-x-hullWidth*px/2)/sx,b=(v*height-y)/px;
   return shipPick.panels.find(panel=>Math.abs(panel.x-a)<.98&&Math.abs(panel.y-b)<.37)?.id??null;
  },
  shipPoint(){return shipPick?{facing:shipPick.facing,
   x:(shipPick.x+hullWidth*shipPick.px*.5)/shipPick.width,
   nose:19*cruisePixel(shipPick.width,shipPick.height)/shipPick.width,
   y:(shipPick.y+hullHeight*shipPick.px*.5)/shipPick.height,
   range:3.5*hullHeight*shipPick.px/shipPick.height}:null;},
  hitsShip(u,v){
   if(!shipPick||canvas.style.display==='none')return false;
   const {width,height,px,sx,x,y,hullInk}=shipPick;
   return hullInk(hullWidth/2+(u*width-x-hullWidth*px/2)/sx,(v*height-y)/px,1,null)>=0;
  }};
}

// The same analytic hull supplies the flight sprite, pointer hit test and close-up.
const hullWidth=40,hullHeight=14;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const hatch=(n,spacing,width)=>Math.abs(n-Math.round(n/spacing)*spacing)<width;
export function courierInk(x,y,pass,thrust=0){
 const side=y-7,d=Math.abs(side);
 const nose=38.4-d*1.84;
 const spine=Math.min(2.35,.69+(x-6)*.21,.4+(39-x)*.31);
 const podCenter=4.15+(x-11)*.024,pod=Math.abs(d-podCenter);
 const podRadius=Math.min(1.2,.47+(x-6)*.24,.21+(31.7-x)*.27);
 const onPod=x>6&&x<32&&pod<podRadius;
 const onBody=x>6&&x<nose&&d<spine;
 const onWing=d<5.85&&d>1.65&&x>10.8+(d-2)*2.25&&x<31.5-(d-2)*.70;
 const onFin=d>=4.7&&d<6.6&&x>8+(d-4.7)*2.5&&x<16+(d-4.7)*2.4;
 const exhaust=6.8-x;
 const trail=exhaust>0&&exhaust<6.5&&Math.abs(d-4.04)<(1-exhaust/7)*(.72+.07*Math.sin(x*2+thrust));
 if(trail&&thrust!==null){
  if(pass>=6&&hatch(x*1.3+d,1.2,.10))return 12;
  return exhaust<1.2?15:exhaust<2.7?14:exhaust<4.6?6:4;
 }
 if(!onBody&&!onPod&&!onWing&&!onFin)return -1;

 const upper=side<0;
 const cockpit=onBody&&x>27.6&&x<35.8&&d<(.45+.63*Math.sin((x-27.6)/8.2*Math.PI));
 const cargo=onBody&&x>12&&x<24&&d<1.45;
 const armor=onPod?(d<podCenter?7:8):onBody?(upper?7:8):upper?12:4;
 let ink=cockpit?6:cargo?3:armor;
 if(pass>=2){
  if(onPod){
   if(pod>podRadius-.24)ink=d>podCenter?4:15;
   else if(x<9.7)ink=pod<.45?6:8;
   else if(x<12.2||x>27.7)ink=pod<.33?3:7;
   else if(pod<.37)ink=4;
  } else if(onBody){
   if(cockpit)ink=upper?14:6;
   else if(d>spine-.26||nose-x<.46)ink=upper?15:4;
   else if(cargo)ink=d<.9?3:6;
   else if(d<.22)ink=upper?15:7;
  } else if(onFin)ink=d>6.18?14:8;
  else if(d<2.45||d>5.59)ink=6;
 }
 if(pass>=3){
  if(onPod&&x>12.6&&x<27.4&&pod<.48){
   ink=hatch(x,.82,.13)?8:pod<.23?6:4;
  }else if(cockpit){
   if(hatch(x+d*.7,1.45,.11))ink=4;
   else if(upper&&d>.35&&d<.55)ink=15;
  }else if(cargo&&hatch(x,2.1,.20))ink=8;
  else if(!onBody&&!onPod&&hatch(x+d*1.4,3,.14))ink=8;
 }
 if(pass>=4){
  if(onPod&&x<9.8&&hatch(x,.72,.12))ink=pod<.40?15:6;
  if(cargo&&d>.66&&d<1.23&&hatch(x-.52,2.1,.29))ink=11;
  if(onWing&&!onPod&&!onBody&&d>2.65&&d<3.3&&x>16&&x<27)ink=6;
  if(onFin&&d>5.99&&hatch(x,2,.25))ink=11;
 }
 if(pass>=5){
  if(onPod&&x>13&&x<27&&pod>.55&&pod<.81&&hatch(x-.19,1.18,.26))ink=14;
  if(cargo&&d<.56&&hatch(x-d*.68,.58,.12))ink=upper?11:8;
  if(onBody&&x>35.6&&d<.36&&hatch(x,.78,.19))ink=15;
 }
 if(pass>=6){
  if(onWing&&!onBody&&!onPod&&x>16&&x<27&&d>2.83&&d<3.18&&hatch(x,1.26,.17))ink=15;
  if(cockpit&&upper&&x>30&&x<34.1&&Math.abs(d-.16-(x-30)*.095)<.09)ink=15;
 }
 if(pass>=7){
  if(onPod&&x>12.6&&x<27.4&&pod>.33&&pod<.47&&hatch(x-.33,.82,.16))ink=12;
  if(cargo&&d>1.21&&d<1.4&&hatch(x,1.05,.13))ink=15;
 }
 if(pass>=8){
  if(onBody&&!cargo&&!cockpit&&d>spine-.49&&d<spine-.29&&hatch(x+.22*d,.92,.10))ink=upper?14:6;
  if(onFin&&d>5.26&&d<5.51&&hatch(x,.76,.13))ink=7;
 }
 return ink;
}
export function courierSideInk(x,y,pass,thrust=0){
 const top=Math.max(4.2,6.3-(x-5.4)*.37,4.1+(x-30)*.23);
 const bottom=Math.min(9.35,7.55+(x-4)*.50,7.35+(39-x)*.25);
 const armor=x>5.3&&x<39&&y>top&&y<bottom;
 const tower=ellipse(x,y,16.3,4.8,5.5,2.1)<1&&y>3.15;
 const fin=x>8.9&&x<15.8&&y>2.2+(x-10)*.48&&y<5.16;
 const engine=Math.min(ellipse(x,y,9.8,5.05,4.35,1.42),ellipse(x,y,10.3,8.85,4.85,1.36));
 const trail=5.8-x;
 if(thrust!==null&&trail>0&&trail<5.3&&Math.min(Math.abs(y-5.15),Math.abs(y-8.9))<.55*(1-trail/6))
  return trail<1.1?15:trail<2.5?14:3;
 if(!armor&&!tower&&!fin&&engine>=1)return -1;
 if(engine<1&&x<12){
  const ring=engine>.68;
  if(x<6.6)return ring?8:pass>1?11:3;
  if(pass>=3&&hatch(x-y*.12,.69,.11))return ring?14:4;
  if(pass>=6&&!ring&&hatch(y,.24,.043))return 11;
  return ring?8:6;
 }
 if(fin&&!armor)return pass>3&&hatch(x+y*1.1,.72,.1)?15:y<3.95?3:8;
 if(tower&&!armor){
  if(pass>4&&hatch(x,.74,.10))return y<4?15:11;
  return y<3.85?7:y<4.28?3:4;
 }
 const canopy=x>27.8&&x<36.5&&y<top+.99&&y>top+.22;
 if(canopy){
  if(pass>=3&&hatch(x+y*.34,1.48,.13))return 4;
  return pass>=5&&y<top+.4?15:y<top+.53?11:3;
 }
 if(y-top<.24)return pass>=2?15:7;
 if(bottom-y<.35)return pass>=4&&hatch(x,.83,.10)?11:8;
 if(y>7.88&&y<8.48&&x>12&&x<27){
  if(pass>=5&&hatch(x,.89,.12))return 8;
  return y<8.09?14:6;
 }
 if(y>5.75&&y<6.65&&x>13&&x<27){
  const port=ellipse(x%2.06,y,1.03,6.2,.45,.28);
  if(pass>=2&&port<1)return port>.63?3:pass>=5?15:11;
 }
 if(pass>=4&&hatch(x-y*.35,2.6,.082))return 8;
 if(pass>=7&&hatch(x,.61,.08)&&hatch(y,.41,.08))return y<7?15:3;
 return y<6.0?7:y<7.62?3:8;
}
export function shipEnginePhase(engine,time){
 const age=time-(engine?.at??-Infinity);
 if(engine?.duration){
  const t=clamp(age/engine.duration,0,1),dy=engine.y-engine.from.y;
  const side=Math.abs(dy)>Math.abs(engine.x-engine.from.x)*.58?Math.sign(dy):0;
  if(engine.turn&&t<.22)return {mode:'TURN',power:.65,side:side||engine.facing};
  if(t<.62)return {mode:'THRUST',power:Math.min(1,.42+t*3),side};
  if(t<1)return {mode:'BRAKE',power:.18+.78*Math.sin(Math.PI*(t-.62)/.38),side:-side};
  return {mode:'IDLE',power:.18,side:0};
 }
 if(age<.40)return {mode:engine.reverse?'RETRO':'THRUST',power:1,side:engine.side??0};
 if(age<.74)return {mode:'BRAKE',power:1-(age-.40)/.34,side:-(engine.side??0)};
 return {mode:'IDLE',power:.18,side:0};
}
function paintEngines(ctx,painter,palette,ship,engine,bloom,pass,age,sideView){
 const {px,x,y,facing,flip}=ship;
 const fore=engine.mode==='BRAKE'||engine.mode==='RETRO';
 const mains=(sideView?[5.15,8.9]:[3,11]).map(y=>({x:6,y,dx:-1,dy:0}));
 const ports=fore?[{x:31,y:4.3,dx:1,dy:-.36},{x:31,y:9.7,dx:1,dy:.36}]:mains;
 if(engine.side)ports.push({x:21,y:engine.side>0?2:12,dx:-.2,dy:-engine.side});
 const ink=fore?14:11;
 for(const [index,port] of ports.entries()){
  const ox=x+(20+(port.x-20)*facing*flip)*px,oy=y+port.y*px;
  const extent=px*(2+engine.power*11);
  if(ox< -extent||ox>ctx.canvas.width+extent||oy< -extent||oy>ctx.canvas.height+extent)continue;
  const n=Math.ceil(engine.power*13);
  for(let step=n;step>=0;step--){
   const flicker=.75+.25*Math.sin(age*31+index*1.7-step*.86), t=step/(n+1);
   const d=px*step*(.50+.29*flicker);
   const a=ox+port.dx*facing*d,b=oy+port.dy*d;
   const w=px*Math.max(.10,(1-t)*(.33+.83*engine.power)*flicker);
   ctx.fillStyle=palette[t<.15?15:t<.44?ink:t<.74?(fore?12:3):(fore?4:9)];
   ctx.fillRect(Math.round(a-w/2),Math.round(b-w/2),w*(1.55-t*.75),w);
   if(engine.power>.42&&step>2){
    ctx.fillStyle=palette[fore?6:9];
    ctx.fillRect(Math.round(a),Math.round(b+w*Math.sin(step*4.8+age*9)*1.65),w*.29,w*.30);
   }
  }
  const size=Math.min(110,bloom);
  painter.glow(ctx,{x:ox,y:oy,width:size*(3+engine.power*7),height:size*(1.7+engine.power*2.5),
   color:palette[ink],power:engine.power*.88,pass});
 }
}

const cruisePixel=(width,height,scale=1)=>Math.min(width/64,height/25,Math.min(width/174,height/55)*scale);
function flightPosition(width,height,time,seed=0,view={},camera=view,route=null){
 const scale=route?route.scale:Math.min(1.8,1+(camera.zoom??0)*.14);
 const inspect=camera.inspect??0;
 const normal=cruisePixel(width,height,scale);
 const px=Math.max(1,normal+(Math.min(width/47,height/17.4)*2**(camera.logScale??0)-normal)*inspect);
 const centerX=route?.x??(.66+.055*Math.sin(time*.79+seed%7));
 const centerY=route?.y??(.68+.055*Math.sin(time*.97));
 const x=(centerX+(.5-centerX)*inspect)*width-px*(20+((camera.focusX??20)-20)*inspect);
 const y=(centerY+(.5-centerY)*inspect)*height-px*(7+((camera.focusY??7)-7)*inspect);
 const facing=inspect>.03?1:route?.facing??1,flip=inspect>.03?1:route?.flip??1;
 return {px,sx:px*facing*flip,x,y,flip,facing,cutaway:camera.cutaway??0,routePhase:route?.p??1,
  thrust:Math.floor(time*9)%5,comet:(time*.11+seed%17/17)%1};
}
function visitStars(width,height,time,{seed=0,centerX=.5,centerY=.5},put){
 const random=n=>((Math.imul(n^seed,0x45d9f3b)>>>8)&65535)/65536;
 for(let i=1;i<=86;i++){
  const depth=i%3+1;
  const x=((random(i*23)+time*.011*depth-(centerX-.5)*depth*.32)%1+1)%1;
  const y=((random(i*43+9)-(centerY-.5)*depth*.27)%1+1)%1;
  const size=depth===3?2:1;
  put(Math.floor(x*width),Math.floor(y*height),size,depth===3?15:depth===2?7:8);
 }
}

const deckRooms=['ENGINE','RELAY','LIFE BAY','BRIDGE'];
const gates=[13.5,20,26.5];
const deckPalette=[14,13,10,11];
const corridorY=x=>7+.24*Math.sin((x-10)*.29);
const tank={x:23.0,y:4.70,rx:2.05,ry:.79};
const shafts=[12.5,18.2,26.1];
const atShaft=x=>shafts.some(ladder=>Math.abs(x-ladder)<.6);
const fixtures=[
 {x:10.1,y:5.18,color:14,reach:3.45,size:.23,kind:'area',flicker:2,power:.94},
 {x:16.6,y:8.46,color:13,reach:3.12,size:.22,kind:'area',flicker:10,power:.89},
 {x:tank.x,y:tank.y,color:10,reach:3.40,size:.25,kind:'area',flicker:1,power:1},
 {x:33.1,y:6.9,color:11,reach:3.80,size:.23,kind:'area',flicker:10,power:.94},
];
const ellipse=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2;
const tankRadius=(x,y)=>ellipse(x,y,tank.x,tank.y,tank.rx,tank.ry);

function deckRoom(x){return x<gates[0]?0:x<gates[1]?1:x<gates[2]?2:3;}
function sideDeckFloor(x,y){
 if(x<6.75||x>37.0||courierSideInk(x,y,1,null)<0)return false;
 if(y>6.1&&y<8&&x>7.5&&x<35.7)return true;
 if(atShaft(x)&&y>4.6&&y<9.05)return true;
 const chamber=[[10.45,6.55,3.3,2.1],[16.85,7.45,3.0,1.73],[23.12,6.2,3.43,1.83],[31.4,6.89,4.65,1.42]][deckRoom(x)];
 return ellipse(x,y,...chamber)<1;
}
function deckFloor(x,y){
 if(x<6.75||x>37.0||y<2.8||y>11.2)return false;
 const corridor=Math.abs(y-corridorY(x));
 if(corridor<.75&&x>7.5&&x<35.7)return true;
 switch(deckRoom(x)){
  case 0: return ellipse(x,y,10.55,7,3.8,3.85)<1;
  case 1: return ellipse(x,y,16.60,8.00+(x-16.6)*.27,3.67,2.67)<1;
  case 2: return ellipse(x,y,23.25,6.02,3.48,2.90)<1;
  default:return x>26.35&&Math.abs(y-7)<Math.min(1.88+(x-30)*.22,(37.15-x)*.57);
 }
}
// A cutaway only needs reframing when the current crop contains no deck.
export function courierDeckFocus(bounds,focus,side=false,layout){
 if(!bounds)return null;
 const floor=layout?.floor??(side?sideDeckFloor:deckFloor);
 const {left,right,top,bottom}=bounds;
 for(let j=0;j<=8;j++)for(let i=0;i<=12;i++){
  if(floor(left+(right-left)*i/12,top+(bottom-top)*j/8))return null;
 }
 let nearest={x:20,y:7},distance=Infinity;
 for(let y=3;y<11;y+=.25)for(let x=7;x<37;x+=.25){
  const d=(x-focus.x)**2+(y-focus.y)**2;
  if(d<distance&&floor(x,y)){nearest={x,y};distance=d;}
 }
 return nearest;
}
function deckBulkhead(x,y){
 return Math.abs(y-corridorY(x))>.65&&gates.some(gate=>Math.abs(x-gate)<.145);
}
function deckWalkable(x,y){
 return deckFloor(x,y)&&!deckBulkhead(x,y)&&tankRadius(x,y)>1.30&&
  ellipse(x,y,10.1,5.18,1.32,.86)>1&&ellipse(x,y,33.1,6.9,1.36,.42)>1;
}
export function courierDeckPosition(pilot,dx,dy,side=false,layout){
 const x=pilot.x+dx,y=pilot.y+dy;
 const floor=layout?.floor??sideDeckFloor;
 if(side&&(dy&&!(layout?.shaft??atShaft)(pilot.x)||!floor(x,y+.30)||!floor(x,y-.48)))return pilot;
 const walkable=layout?.walkable??(side?sideDeckFloor:deckWalkable);
 for(const t of [.5,1]){
  const a=pilot.x+dx*t,b=pilot.y+dy*t;
  if(!walkable(a,b)||!walkable(a-.19,b)||!walkable(a+.19,b)||
    !walkable(a,b-.19)||!walkable(a,b+.19))return pilot;
 }
 return {x,y,step:(pilot.step??0)+1,direction:dx?Math.sign(dx):pilot.direction??1,vertical:Math.sign(dy)};
}
export function courierDeckRoom({x},layout){return layout?.room(x)??deckRooms[deckRoom(x)];}
function courierProjection(aspect,zoom,mode,pilot){
 const close=mode==='captain';
 const width=close?Math.max(2.35,2.22*aspect):Math.max(hullWidth*1.1,hullHeight*1.22*aspect)/zoom;
 return {width,height:width/aspect,x:close?pilot.x:20,y:close?pilot.y:mode==='deck'?7:6.9};
}
export const courierWarpLights=[
 {u:.53,v:.48,color:14,size:.38,power:1,kind:'point',flicker:1},
 {u:.42,v:.62,color:13,size:.19,power:.59,kind:'area',flicker:12},
];
export function courierWarpOverlay(aspect){
 return (time,put,held)=>{
  for(let i=0;i<23;i++){
   const phase=(i*.61803+(held?0:time*.67))%1;
   const r=.026+phase**2*.66,angle=i*2.39996+phase*1.22;
   const dx=Math.cos(angle)*r/aspect,dy=Math.sin(angle)*r;
   const size=.004+phase*.009;
   for(let j=0;j<4;j++){
    const p=1-j*.030;
    put(.53+dx*p,.48+dy*p,size/aspect,size,j===0?15:j===1?14:j===2?12:6);
   }
  }
 };
}
// One suit recipe for the moving deck sprite and the close-up artwork.
function captainInk(x,y,pass,{stride=0,direction=1,vertical=0}={}){
 x*=direction;
 const bob=-.045*Math.abs(stride),tilt=vertical*.035+stride*.027;
 const footX=Math.abs(x),side=x<0?-1:1;
 for(const near of [1,-1]){
  const leg=y+Math.max(0,near*stride)*.11;
  const knee=near*(.095+stride*.15)*clamp((leg-.22)/.28,0,1)+.015;
  const foot=x-knee;
  if(leg<=.23||leg>=.66||foot<-.08||foot>(leg>.53?.16:.084))continue;
  if(leg>.50){
   if(leg>.63)return pass>=7&&hatch(foot,.05,.010)?8:0;
   return pass>=5&&hatch(leg,.061,.012)?7:leg>.61||near<0?8:6;
  }
  if(pass>=3&&ellipse(foot,leg,.018,.399,.076,.055)<1)
   return pass>=6&&Math.abs(leg-.388)<.008?11:8;
  return near>0&&Math.abs(foot-.029)<.024?12:4;
 }
 const hx=x-tilt,hy=y-bob;
 const head=Math.min(ellipse(hx,hy,.04,-.386,.229,.237),ellipse(hx,hy,.177,-.284,.123,.119));
 if(head<1){
  if(head>.84)return pass>=4&&hx<-.02&&hy<-.41?7:8;
  if(pass>=2&&head>.61&&hy<-.44&&hx<0)return 11;
  const visor=ellipse(hx,hy,.154,-.355,.155,.089);
  if(visor<1){
   if(visor>.77)return hx<.03?6:8;
   const arc=hy+.376+.51*(hx+.025)**2;
   if(arc>-.004&&arc<.017&&hx<.12)return 15;
   if(pass>=5&&hx>.08&&hx<.144&&hy>-.362&&hy<-.309&&hatch(hy,.018,.005))return 10;
   if(pass>=7&&hy>-.325&&hatch(hx-hy*.31,.037,.006))return 6;
   return hy<-.356?11:hy<-.321?3:1;
  }
  if(pass>=4&&hy<-.50&&Math.abs(hx+.036)<.04)return hy<-.53?15:7;
  if(pass>=8&&hatch(hx-hy*.43,.057,.008))return hy<-.49?7:8;
  return hx<.04?7:8;
 }
 if(hy>-.21&&hy<-.13&&Math.abs(hx)<.176)return hatch(hy,.032,.009)?6:8;
 const pack=ellipse(x,y,-.23,.025,.12,.233);
 if(pack<1)return pass>=3&&hatch(y,.071,.014)?8:pack>.67?7:6;
 const arm=y+stride*side*.11;
 const armCenter=.112+arm*(.26+stride*.52);
 if(arm>-.16&&arm<.31&&Math.abs(x-armCenter)<.104-.095*Math.abs(arm-.02)){
  if(arm>.20)return pass>=5&&arm>.26&&hatch(x,.035,.009)?15:6;
  if(arm>.06&&arm<.13)return pass>=4&&Math.abs(x-armCenter)<.035?11:8;
  return arm<-.05?12:x>armCenter?8:7;
 }
 if(y>-.19&&y<.34&&Math.abs(x+.012)<.23-Math.max(0,y+.09)*.19){
  if(y>.205&&y<.28)return footX<.058?11:pass>=7&&hatch(footX,.045,.009)?6:8;
  if(y>-.12&&y<.19&&Math.abs(footX-(.16+y*.31))<.035)return pass>=4&&hatch(y,.075,.015)?15:3;
  if(pass>=8&&y>.06&&y<.19&&footX<.065)return hatch(y,.036,.006)?6:8;
  if(pass>=6&&hatch(x+y*.24,.071,.010)&&y>-.10)return 6;
  if(pass>=3&&y>-.075&&y<.013&&footX<.11)return pass>=7&&x>-.02&&x<.027?15:14;
  if(y<-.11)return 12;
  return footX>.19?4:12;
 }
 return -1;
}
function captainTopInk(x,y,pass,{stride=0,direction=1}={}){
 x*=direction;
 const helmet=ellipse(x,y,.12,0,.246,.258);
 if(helmet<1){
  if(helmet>.80)return x>0?3:8;
  if(x>.18&&ellipse(x,y,.22,0,.125,.20)<1)return pass>4&&Math.abs(y)<.043?15:11;
  if(pass>2&&hatch(x+y*.48,.082,.015))return 8;
  return y<.03?7:3;
 }
 const shoulder=ellipse(x,y,-.16,0,.23,.39);
 if(shoulder<1)return pass>3&&Math.abs(y)>.23&&hatch(x,.079,.018)?11:shoulder>.79?8:12;
 const boot=ellipse(x+Math.sign(y)*stride*.14,y,-.43,Math.sign(y)*.18,.14,.09);
 if(boot<1)return pass>4&&hatch(x,.055,.013)?7:6;
 return -1;
}
const frameWidths=[1,.88,1.16],frameHeights=[1,1.09,.94];
const visorInks=[[11,3,1],[14,6,4],[13,5,1],[10,2,8]];
const uniformInks=[[12,4,14],[9,1,11],[10,2,14],[13,5,15],[7,8,11]];
export function captainSuitInk(x,y,pass,pose,appearance={},kit={},side=true){
 const frame=appearance.frame??0;
 const u=x/frameWidths[frame],v=y/frameHeights[frame];
 const ink=(side?captainInk:captainTopInk)(u,v,pass,pose);
 if(ink<0)return ink;
 const visor=side?v<-.265&&u*(pose.direction??1)>.004:v>-.23&&v<.23&&u*(pose.direction??1)>.18;
 if(visor){
  const tint=visorInks[appearance.visor??0];
  if(ink===11)return tint[0];
  if(ink===3)return tint[1];
  if(ink===1)return tint[2];
 }
 const uniform=uniformInks[appearance.uniform??0];
 if(ink===12)return kit.armor?.ink??uniform[0];
 if(ink===4)return uniform[1];
 if(ink===14)return uniform[2];
 return ink===3&&kit.suit?kit.suit.ink:ink;
}
export const bridgePanels=Object.freeze([
 {id:'ghostlink',x:28.15,y:6.10,ink:14,label:'LINK',lines:['GHOSTLINK', 'C:\\GHOST> ATDT', '  14400 / 8N1']},
 {id:'hq',x:30.60,y:6.07,ink:10,label:'HQ',lines:['╔ FRIKTAL HQ ╗','║ DOOR  FILE ║','╚ MAIL  DIAL ╝']},
 {id:'video',x:33.03,y:6.20,ink:13,label:'TV',lines:['◈ VIDEO ARCHIVE','░▒▓█ ▶ █▓▒░','   STARDIVER']},
]);
const lifeTicks=new WeakMap();
function paintCourierCrew(ctx,palette,item,ship,pass,time,age,held,bounds){
 const {pilot,life}=item;
 if(pilot){
  for(const panel of item.hull?.panels??bridgePanels){
   const {x,y,ink,lines}=panel;
   if(x+1<bounds.left||x-1>bounds.right||y+.4<bounds.top||y-.4>bounds.bottom)continue;
   ctx.fillStyle=palette[8];ctx.fillRect(x-1,y-.40,2,.77);
   ctx.fillStyle=palette[ink];ctx.fillRect(x-.94,y-.34,1.88,.65);
   ctx.fillStyle=palette[0];ctx.fillRect(x-.83,y-.255,1.66,.46);
   ctx.font='.128px '+ansiFontFamily;ctx.textBaseline='top';
   lines.forEach((line,index)=>{
    ctx.fillStyle=palette[index===0?15:ink];
    ctx.fillText(line,x-.75,y-.23+index*.135,1.47);
   });
   ctx.fillStyle=palette[ink];
   ctx.fillRect(x+.73,y+.22,.11,.045);
  }
 }
 if(life&&!item.hull&&bounds.left<tank.x+tank.rx&&bounds.right>tank.x-tank.rx&&
  bounds.top<tank.y+tank.ry&&bounds.bottom>tank.y-tank.ry){
  const tick=Math.floor(age*4);
  if(!held&&lifeTicks.get(life)!==tick)life.step();
  lifeTicks.set(life,tick);
  const w=2*tank.rx/life.width,h=2*tank.ry/life.height;
  for(let row=0;row<life.height;row++)for(let col=0;col<life.width;col++){
   const x=tank.x-tank.rx+col*w,y=tank.y-tank.ry+row*h;
   if(tankRadius(x+w/2,y+h/2)>.80||!life.cell(col,row))continue;
   ctx.fillStyle=palette[life.age(col,row)>.5?14:10];ctx.fillRect(x,y,w,h);
  }
 }
 if(!pilot)return;
 const {x,y}=pilot;
 const attack=pilot.attack;
 if(attack&&time-attack.at<.34){
  const {x:sx,y:sy,dx,dy,reach,ink,kind}=attack;
  const p=held?.56:clamp((time-attack.at)/(kind==='blade'?.23:.18),0,1);
  ctx.save();
  ctx.strokeStyle=palette[ink];ctx.fillStyle=palette[15];
  if(kind==='blade'){
   const angle=Math.atan2(dy,dx)+(p-.5)*2.1;
   ctx.globalAlpha*=1-p*.82;
   ctx.lineWidth=.055;
   for(let ring=0;ring<3;ring++){
    ctx.beginPath();ctx.arc(sx,sy,reach*(.83+ring*.083),angle-.75,angle+.21);ctx.stroke();
   }
  }else if(p<1){
   const end=reach*p,tail=Math.max(0,end-.62);
   ctx.lineWidth=.065;
   ctx.beginPath();ctx.moveTo(sx+dx*tail,sy+dy*tail);ctx.lineTo(sx+dx*end,sy+dy*end);ctx.stroke();
   ctx.fillRect(sx+dx*end-.06,sy+dy*end-.045,.12,.09);
  }else{
   const radius=.19+Math.max(0,time-attack.at-.18)*1.8;
   ctx.lineWidth=.025;ctx.globalAlpha*=clamp((.34-(time-attack.at))/.16,0,1);
   ctx.beginPath();ctx.arc(sx+dx*reach,sy+dy*reach,radius,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
 }
 if(x+1<bounds.left||x-1>bounds.right||y+1<bounds.top||y-1>bounds.bottom)return;
 const walk=held?0:Math.max(0,1-(time-(pilot.movedAt??-Infinity))/.13);
 const stride=Math.sin((pilot.gait??0)*4.4)*walk;
 const bob=held?0:(1-walk)*.025*Math.sin(time*4)-.042*Math.abs(stride);
 const pose={...pilot,stride};
 const density=Math.min(64,Math.max(12,ship.px/5));
 const shield=item.kit?.shield;
 for(let sy=-.73;sy<.73;sy+=1/density)for(let sx=-.60;sx<.60;sx+=1/density){
  const ink=captainSuitInk(sx,sy,pass,pose,item.appearance,item.kit,item.turn);
  if(ink>=0){
   ctx.fillStyle=palette[ink];
   ctx.fillRect(x+sx,y+sy+bob,1.05/density,1.05/density);
  }
 }
 if(shield){
  ctx.fillStyle=palette[shield.ink];ctx.fillRect(x-.26*(pilot.direction||1),y+.13+bob,.09,.09);
 }
 if(pilot.armed&&item.kit){
  const weapon=item.kit.weapon,dx=pilot.direction||1,dy=!item.turn?pilot.vertical:0;
  ctx.strokeStyle=palette[weapon.ink];ctx.lineWidth=weapon.kind==='blade'?.045:.09;
  ctx.beginPath();ctx.moveTo(x+(dy?0:dx*.24),y+(dy?dy*.18:.04)+bob);
  ctx.lineTo(x+(dy?0:dx*(weapon.kind==='blade'?.64:.53)),y+(dy?dy*.55:weapon.kind==='blade'?-.14:-.02)+bob);ctx.stroke();
 }

}
function deckInk(x,y,pass){
 const room=deckRoom(x),color=deckPalette[room],local=x-fixtures[room].x;
 const corridor=Math.abs(y-corridorY(x)),fixture=fixtures[room];
 const light=1-clamp(Math.hypot(local,y-fixture.y)/fixture.reach,0,1);
 const rim=!deckFloor(x-.22,y)||!deckFloor(x+.22,y)||!deckFloor(x,y-.19)||!deckFloor(x,y+.19);
 if(rim)return light>.28?color:7;
 if(deckBulkhead(x,y))return hatch(y,.36,.055)?7:8;
 if(gates.some(gate=>Math.abs(x-gate)<.10)&&corridor>.49)return 11;
 const tankRing=tankRadius(x,y);
 if(room===2&&tankRing<1.21)return tankRing>.95?(tankRing>1.10?6:10):packAnsiInk(2,4);
 if(room===0){
  const reactor=ellipse(x,y,10.1,5.18,1.32,.86);
  if(reactor<1)return reactor>.74?6:reactor<.14?15:hatch(x,.32,.065)?14:12;
  if(y>7.78&&Math.abs(y-8.55-(x-10)*.31)<.18)return hatch(x,.55,.10)?15:6;
 }
 if(room===1&&corridor>1.02&&x>15&&x<19&&Math.abs(y-8.95-(x-16.4)*.27)<.54){
  return hatch(x,.58,.095)?7:hatch(y,.35,.09)?13:5;
 }
 if(room===3){
  const console=ellipse(x,y,33.1,6.9,1.36,.42);
  if(console<1)return console>.62?3:hatch(x,.34,.09)?15:11;
  if(x>34.9&&Math.abs(y-7)>.38)return hatch(x,.43,.06)?15:14;
 }
 if(corridor<.72&&corridor>.56)return hatch(x,.78,.14)?15:color;
 const seam=pass>=2&&(hatch(x+y*.62,1.12,.055)||hatch(y,.87,.045));
 const floor=color===14?6:color===13?5:color===10?2:3;
 return packAnsiInk(seam?7:light>.42?floor:corridor<.56?4:8,
  Math.min(15,Math.round((seam?7:9)+light*(seam?6:7))),!seam&&pass>2&&light<.46?2:0);
}
function sideDeckInk(x,y,pass){
 const bay=deckRoom(x),fixture=fixtures[bay],color=fixture.color;
 const light=1-clamp(Math.hypot(x-fixture.x,y-fixture.y)/fixture.reach,0,1);
 if(!sideDeckFloor(x-.18,y)||!sideDeckFloor(x+.18,y)||!sideDeckFloor(x,y-.14))return color;
 if(atShaft(x)&&y<8.6&&y>4.8){
  const rung=hatch(y,.41,.075);
  if(rung||shafts.some(ladder=>Math.abs(Math.abs(ladder-x)-.43)<.07))return rung?6:14;
 }
 if(hatch(y-7.68,3,.10))return hatch(x,.77,.1)?15:color;
 if(gates.some(gate=>Math.abs(x-gate)<.15)&&y<6.65)return 7;
 const tankRing=tankRadius(x,y);
 if(bay===2&&tankRing<1.18)return tankRing>.87?10:packAnsiInk(2,5);
 if(bay===0&&ellipse(x,y,10.4,6.04,1.45,1.04)<1)return hatch(x,.4,.09)?14:6;
 if(bay===1&&x>14.3&&x<17.4&&y<6.85&&y>5.3)return hatch(y,.35,.08)?13:hatch(x,.74,.09)?15:5;
 if(bay===3&&x>31&&y>6.37&&y<6.65)return hatch(x,.50,.10)?15:11;
 const ribs=pass>1&&hatch(x+y*.18,1.18,.08);
 return packAnsiInk(ribs?7:light>.42?color:8,Math.round(7+7*light),pass>2&&!ribs?2:0);
}
export function courierPlate(mode,aspect,{zoom=1,pilot,side=false}={}){
 const view=courierProjection(aspect,zoom,mode,pilot);
 const hullInk=side?courierSideInk:courierInk,floor=side?sideDeckFloor:deckFloor;
 const interiorInk=side?sideDeckInk:deckInk;
 return (u,v,phase,pass)=>{
  const t=phase/.12;
  if(mode==='warp'){
   const x=(u-.53)*aspect,y=v-.48;
   const r=Math.hypot(x,y),a=Math.atan2(y,x);
   const lane=(a*1.5+Math.log(.05+r)*2.2-t*.25)/Math.PI;
   const band=Math.abs(lane-Math.round(lane));
   const depth=.77/(r+.15)-t*.63,crest=(depth%1+1)%1;
   const rail=Math.abs((a*9+Math.log(.08+r)*4-t*.61)/Math.PI%1);
   if(r<.057)return r<.026?0:r<.037?15:4;
   if(crest<.045)return band<.12?15:band<.34?6:4;
   if(band<.025)return crest<.42?14:3;
   if(band<.115)return crest<.32?3:4;
   if(band<.23&&crest<.34)return band<.17?5:8;
   if(pass>1&&rail<.048&&crest>.31&&crest<.79)return 4;
   if(pass>2&&rail<.022&&crest>.79&&crest<.91)return 7;
   return crest<.085?8:0;
  }
  const x=view.x+(u-.5)*view.width,y=view.y+(v-.5)*view.height;
  if(mode==='captain'){
   const suit=captainSuitInk(x-pilot.x,y-pilot.y,pass,pilot,undefined,undefined,side);
   if(suit>=0)return suit;
   if(ellipse(x,y,pilot.x,pilot.y+.52,.43,.28)<1)return packAnsiInk(8,8);
  }
  if((mode==='deck'||mode==='captain')&&floor(x,y))return interiorInk(x,y,pass);
  const hull=hullInk(x,y,pass,Math.floor(t*7));
  if(hull>=0)return mode==='deck'||mode==='captain'?packAnsiInk(hull,pass<2?12:11):hull;
  const col=Math.floor(u*97),row=Math.floor(v*55);
  if((col*53+row*17+row*col*31)%263<2)return (col+row)%3?8:7;
  return 0;
 };
}
function visitComet(width,height,{px,comet},put){
 if(comet<.45){
  const tip=Math.floor(width*(.12+comet*1.45)/px)*px;
  const tail=Math.floor(height*(.12+comet*.53)/px)*px;
  for(let i=0;i<7;i++){
   put(tip-i*px,tail-Math.floor(i/3)*px,px,i===0?15:i<3?14:6);
  }
 }
}
function visitFlight(width,height,time,view,put){
 const ship=flightPosition(width,height,time,view.seed,view);
 const sample=view.turn?courierSideInk:courierInk;
 const {px,x,y,thrust}=ship;
 for(let dy=0;dy<hullHeight;dy++)for(let dx=0;dx<hullWidth;dx++){
  const ink=sample(dx+.5,dy+.5,1,thrust);
  if(ink>=0)put(x+dx*px,y+dy*px,px,ink);
 }
 visitComet(width,height,ship,put);
}
