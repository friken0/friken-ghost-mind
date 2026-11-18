/* Caller-clock ANSI choreography. No timer, DOM, font, random source, audio,
 * rendering loop or paragraph scan. Only registered/affected cells change. */
// Classic ANSI colors and the full RGB222 palette used by ANSI++.
export const ansiPalette=Object.freeze(['#000000','#aa0000','#00aa00','#aa5500','#0000aa','#aa00aa','#00aaaa','#aaaaaa','#555555','#ff5555','#55ff55','#ffff55','#5555ff','#ff55ff','#55ffff','#ffffff']);
export const ansiColourModes=Object.freeze(['16','64','rgb']);
const levels=['00','55','aa','ff'];
const cube=levels.flatMap(r=>levels.flatMap(g=>levels.map(b=>'#'+r+g+b)));
export const ansiPalette64=Object.freeze([...ansiPalette,...cube.filter(ink=>!ansiPalette.includes(ink))]);

const component=n=>n.toString(16).padStart(2,'0');
export const ansiRGB=(r,g,b)=>'#'+component(r)+component(g)+component(b);
const indexedLevels=[0,95,135,175,215,255];
function indexedRGB(value){
 if(value<232){
  const n=value-16;
  return ansiRGB(indexedLevels[Math.floor(n/36)],indexedLevels[Math.floor(n/6)%6],indexedLevels[n%6]);
 }
 const tone=8+(value-232)*10;
 return ansiRGB(tone,tone,tone);
}
const channels=hex=>[1,3,5].map(i=>Number.parseInt(hex.slice(i,i+2),16));

export function ansiColourResolver(mode='rgb',base=ansiPalette){
 const cache=new Map(),candidates=(mode==='64'?ansiPalette64:ansiPalette).map((hex,i)=>[channels(hex),base[i]??hex]);
 return value=>{
  if(Number.isInteger(value)&&value>=0&&value<16)return base[value];
  if(cache.has(value))return cache.get(value);
  const color=Number.isInteger(value)&&value>=16&&value<256?indexedRGB(value):value;
  if(mode==='rgb'||!/^#[0-9a-f]{6}$/i.test(color??''))return color;
  const [r,g,b]=channels(color);
  let best=Infinity,result;
  for(const [[cr,cg,cb],ink] of candidates){
   const score=2*(r-cr)**2+4*(g-cg)**2+3*(b-cb)**2;
   if(score<best){best=score;result=ink;}
  }
  if(cache.size>=2048)cache.clear();
  cache.set(value,result);
  return result;
 };
}

export function ansiSGRColour(value,background=false){
 const prefix=background?48:38;
 if(typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))return prefix+';2;'+channels(value).join(';');
 if(!Number.isInteger(value)||value<0||value>255)throw Error('ANSI ink requires a palette index or #rrggbb');
 if(value>=16)return prefix+';5;'+value;
 return (value<8?(background?40:30):(background?92:82))+value;
}

export const ansiEffects=Object.freeze(['flip','fade','dither','shrink-return','scan','scramble','pulse','hue-shift']);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const clock=t=>{if(!Number.isFinite(t)||t<0||t>Number.MAX_SAFE_INTEGER)throw Error('Nonnegative caller clock required');return t;};
const hash=value=>{let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const cellId=id=>{if(typeof id!=='string'||!id.length||id.length>96)throw Error('Bounded ANSI cell ID required');return id;};
function colour(value){
  if(value==null)return null;
  if(Number.isInteger(value)&&value>=0&&value<=255)return value;
  if(typeof value==='string'&&value.length<=80&&(/^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|[a-z]{1,24})$/i.test(value)||/^(?:rgb|hsl)a?\([\d.,% /+-]+\)$/i.test(value)))return value;
  throw Error('ANSI colour must be a palette index or literal canvas colour');
}
function state(value,prior={}){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('ANSI cell state required');
  const glyph=value.glyph??value.char??prior.glyph??' ';
  if(typeof glyph!=='string'||[...glyph].length!==1||/[\x00-\x1f\x7f]/.test(glyph))throw Error('One printable Unicode glyph per ANSI cell');
  const number=(key,def,max)=>{const n=value[key]??prior[key]??def;if(!Number.isFinite(n)||n<0||n>max)throw Error('Invalid ANSI '+key);return n;};
  return {glyph,hue:number('hue',0,360),fg:colour(value.fg===undefined?prior.fg:value.fg),bg:colour(value.bg===undefined?prior.bg:value.bg),alpha:number('alpha',1,1),scaleX:number('scaleX',1,4),scaleY:number('scaleY',1,4)};
}
const layer=(s,extra={})=>({...s,...extra});
const scrambleGlyphs=[...'░▒▓█╱╲┼┤├<>01'];
function still(s){return {...s,char:s.glyph,glyphs:[s.glyph],layers:[layer(s)],effect:'none',progress:1,settled:true,active:false,ditherThreshold:1,scan:1};}
function transition(a,b,p,effect,seed){
  if(p<=0)return {...still(a),effect,progress:0,settled:false,active:true};
  if(p>=1)return still(b);
  const target=p<.5?a:b,frame={...still(target),effect,progress:p,settled:false,active:true,glyphs:[a.glyph,b.glyph]};
  if(effect==='fade')frame.layers=[layer(a,{alpha:a.alpha*(1-p)}),layer(b,{alpha:b.alpha*p})];
  else if(effect==='hue-shift'){const delta=((b.hue-a.hue+540)%360)-180;frame.layers=[layer(target,{hue:(a.hue+delta*p+360)%360})];}
  else if(effect==='flip')frame.layers=[layer(target,{scaleX:target.scaleX*Math.abs(Math.cos(Math.PI*p))})];
  else if(effect==='shrink-return'){
    const size=Math.abs(1-2*p),pop=p>.5?1+.12*Math.sin((p-.5)*2*Math.PI):1;
    frame.layers=[layer(target,{scaleX:target.scaleX*size*pop,scaleY:target.scaleY*size*pop})];
  }else if(effect==='dither'){
    frame.ditherThreshold=p;frame.layers=[layer(a,{dither:{threshold:p,invert:true}}),layer(b,{dither:{threshold:p,invert:false}})];
  }else if(effect==='scan'){
    frame.scan=p;frame.layers=[layer(a,{scan:{from:p,to:1}}),layer(b,{scan:{from:0,to:p}})];
  }else if(effect==='scramble'){
    const glyph=p<.84?scrambleGlyphs[hash(seed+':'+Math.floor(p*12))%scrambleGlyphs.length]:b.glyph;
    frame.glyph=glyph;frame.char=glyph;frame.glyphs=[glyph];frame.layers=[layer(target,{glyph})];
  }else if(effect==='pulse'){
    Object.assign(frame,b,{char:b.glyph,glyphs:[b.glyph]});
    frame.layers=[layer(b,{scaleX:b.scaleX*(1+.16*Math.sin(p*Math.PI)),scaleY:b.scaleY*(1+.16*Math.sin(p*Math.PI))})];
  }
  return frame;
}
function effectName(effect){if(!ansiEffects.includes(effect))throw Error('Unknown ANSI transition');return effect;}

export function createAnsiAnimator({seed=0,maxCells=8000,maxRate=30}={}){
  if(!Number.isInteger(maxCells)||maxCells<1||maxCells>8000||!Number.isFinite(maxRate)||maxRate<1||maxRate>60||!['number','string'].includes(typeof seed)||String(seed).length>96)throw Error('Bounded ANSI animation budget required');
  const records=new Map(),active=new Set(),dirty=new Set(),painted=new Map(),quantum=1000/maxRate;
  let lastChanged=-1,lastReduced=false;
  function room(id){cellId(id);if(!records.has(id)&&records.size>=maxCells)throw Error('ANSI animated-cell budget exceeded');}
  function settled(record){return record.kind==='tween'?record.to:record.kind==='cycle'?record.frames[record.settle==='first'?0:record.frames.length-1]:record.value;}
  function naturalEnd(record){if(record.kind==='tween')return record.at+record.wait+record.duration;if(record.kind==='cycle')return record.at+record.duration;return 0;}
  function sample(id,time,{reducedMotion=false}={}){
    cellId(id);clock(time);const record=records.get(id);if(!record)return null;
    if(record.kind==='static')return still(record.value);
    if(reducedMotion)return still(settled(record));
    const elapsed=Math.max(0,time-record.at),tick=Math.floor(elapsed/quantum+1e-8)*quantum;
    if(time<record.at)return {...still(record.kind==='tween'?record.from:record.frames[0]),active:true,settled:false};
    if(record.kind==='tween'){
      if(elapsed>=record.wait+record.duration)return still(record.to);
      return transition(record.from,record.to,clamp((tick-record.wait)/record.duration),record.effect,record.seed);
    }
    if(elapsed>=record.duration)return still(settled(record));
    const step=Math.floor(tick/record.interval),index=step%record.frames.length;
    if(record.mode==='once'&&step>=record.frames.length-1)return still(record.frames.at(-1));
    const from=record.frames[index],to=record.frames[(index+1)%record.frames.length];
    const phase=tick-step*record.interval,p=record.transition?clamp((phase-(record.interval-record.transition))/record.transition):0;
    return {...transition(from,to,p,record.effect,record.seed+':'+step),active:true,settled:false};
  }
  function put(id,record,live=false){room(id);records.set(id,record);dirty.add(id);if(live)active.add(id);else active.delete(id);return api;}
  const api={
    set(id,value){return put(id,{kind:'static',value:state(value,records.has(id)?settled(records.get(id)):undefined)});},
    tween(id,next,{at=0,duration=300,wait=0,effect='fade'}={}){
      room(id);clock(at);effectName(effect);
      if(!Number.isFinite(duration)||duration<0||duration>60000||!Number.isFinite(wait)||wait<0||wait>60000)throw Error('Bounded ANSI tween duration required');
      const prior=sample(id,at),from=prior?state(prior):state(next),to=state(next,from);
      if(duration===0&&wait===0)return api.set(id,to);
      return put(id,{kind:'tween',at,duration,wait,effect,from,to,seed:hash(seed+':'+id)},true);
    },
    cycle(id,playlist,{at=0,interval=120,transition:transitionMs=90,effect='fade',mode='loop',duration,settle='last'}={}){
      room(id);clock(at);effectName(effect);
      if(!Array.isArray(playlist)||playlist.length<1||playlist.length>16||!['loop','once','choose-once'].includes(mode)||!['first','last'].includes(settle)||!Number.isFinite(interval)||interval<=0||interval>60000||!Number.isFinite(transitionMs)||transitionMs<0||transitionMs>60000)throw Error('Bounded ANSI playlist required');
      const baseline=records.has(id)?settled(records.get(id)):undefined;
      const frames=playlist.map(value=>state(typeof value==='string'?{glyph:value}:value,baseline));
      if(mode==='choose-once')return api.set(id,frames[hash(seed+':'+id)%frames.length]);
      if(frames.length===1)return api.set(id,frames[0]);
      interval=Math.max(quantum,interval);transitionMs=Math.min(interval,transitionMs);
      const length=mode==='once'?(frames.length-1)*interval:Infinity;
      if(duration!==undefined&&(!Number.isFinite(duration)||duration<=0||duration>86400000))throw Error('Finite ANSI duration must be in1..86400000ms');
      return put(id,{kind:'cycle',at,interval,transition:transitionMs,effect,mode,duration:Math.min(duration??Infinity,length),settle,frames,seed:hash(seed+':'+id)},true);
    },
    sample,
    changed(time,{reducedMotion=false}={}){
      clock(time);if(time<lastChanged)throw Error('ANSI changed() requires a monotonic caller clock');lastChanged=time;
      if(reducedMotion&&lastReduced&&dirty.size===0)return [];
      const candidates=new Set([...active,...dirty]),changes=[];lastReduced=reducedMotion;
      for(const id of candidates){
        const record=records.get(id),frame=sample(id,time,{reducedMotion}),signature=JSON.stringify(frame);
        if(signature!==painted.get(id)){changes.push({id,frame});if(frame)painted.set(id,signature);else painted.delete(id);}
        if(!record||time>=naturalEnd(record))active.delete(id);
      }
      dirty.clear();return changes;
    },
    unregister(id){cellId(id);if(!records.has(id))return false;records.delete(id);active.delete(id);dirty.add(id);return true;},
    clear(){records.clear();active.clear();dirty.clear();painted.clear();lastChanged=-1;lastReduced=false;},
    get size(){return records.size;},
    get stats(){return {cells:records.size,active:active.size,dirty:dirty.size,maxCells,maxRate};}
  };
  return api;
}

/** Rotate an ANSI palette colour in HSL, preserving its lightness/saturation. */
export function ansiHueColour(hex,degrees=0,asHex=false){
 if(!Number.isFinite(degrees)||degrees<0||degrees>360)throw Error('Bounded ANSI hue required');if(!degrees||!/^#[0-9a-f]{6}$/i.test(hex))return hex;
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;if(!d)return hex;
 const h=((max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60+degrees)%360;
 const s=d/(1-Math.abs(2*l-1));
 if(!asHex)return `hsl(${h.toFixed(2)} ${(s*100).toFixed(2)}% ${(l*100).toFixed(2)}%)`;
 const a=s*Math.min(l,1-l);
 return '#'+[0,8,4].map(n=>{
  const k=(n+h/30)%12;
  const channel=l-a*Math.max(-1,Math.min(k-3,9-k,1));
  return Math.round(channel*255).toString(16).padStart(2,'0');
 }).join('');
}
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
/** Paint with the caller's existing font/glyph routine. The helper preserves
 * context state, clips every cell and never registers another animation loop.
 * Supply a palette for indexed colours; null colours preserve the caller ink. */
export function drawAnsiCell(ctx,frame,{x=0,y=0,width=16,height=32,paintGlyph,palette,resolveColour,resolveHue,clear=true}={}){
  if(!ctx||typeof paintGlyph!=='function'||![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)throw Error('ANSI glyph printer and bounded cell rectangle required');
  const resolve=value=>{if(value==null)return null;if(resolveColour)return resolveColour(value);if(typeof value==='number'){if(!Array.isArray(palette)||typeof palette[value]!=='string')throw Error('ANSI indexed colour has no palette entry');return palette[value];}return value;};
  const shade=(value,hue)=>value==null?'':resolveHue?resolveHue(value,hue):ansiHueColour(resolve(value)||'',hue);
  ctx.save();try{
    ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();if(clear)ctx.clearRect(x,y,width,height);
    if(!frame)return;
    for(const s of frame.layers){
      ctx.save();try{
        ctx.globalAlpha*=s.alpha;
        if(s.dither){ctx.beginPath();for(let row=0;row<4;row++)for(let col=0;col<4;col++)if(((bayer[row*4+col]+.5)/16<s.dither.threshold)!==s.dither.invert)ctx.rect(x+col*width/4,y+row*height/4,width/4,height/4);ctx.clip();}
        if(s.scan){ctx.beginPath();ctx.rect(x,y+height*s.scan.from,width,height*(s.scan.to-s.scan.from));ctx.clip();}
        const bg=shade(s.bg,s.hue||0),fg=shade(s.fg,s.hue||0);if(bg){ctx.fillStyle=bg;ctx.fillRect(x,y,width,height);}if(fg)ctx.fillStyle=fg;
        ctx.translate(x+width/2,y+height/2);ctx.scale(s.scaleX,s.scaleY);
        paintGlyph(ctx,s.glyph,-width/2,-height/2,width,height);
      }finally{ctx.restore();}
    }
  }finally{ctx.restore();}
}

/** Measured audio only. A display layer never edits source glyphs or choices. */
export function ansiCymaticCell(cell,{bands=[],rms=0,time=0,x=0,y=0,intensity=.18,style='metal',frame=null,reduced=false}={}){
 const energy=clamp(Number.isFinite(rms)?rms*5:0),low=clamp(Number.isFinite(bands[0])?bands[0]:0),high=clamp(Number.isFinite(bands[2])?bands[2]:0),power=Math.max(energy,low,high);
 if(reduced||power<.005)return frame;
 const strength=clamp(intensity,0,1),wave=Math.sin(time*.65+x*.12-y*.09),hue=(style==='trip'?180+100*wave:24*wave)*strength*power;
 const layers=(frame?.layers||[{glyph:cell.char,fg:cell.fg,bg:cell.bg,alpha:1,scaleX:1,scaleY:1}]).map(l=>({...l,hue:((l.hue||0)+hue+360)%360,scaleY:(l.scaleY||1)*(1+(style==='foliage'?.14:.035)*low*strength),alpha:Math.min(1,(l.alpha??1)*(.94+.06*power))}));
 return {...(frame||{}),layers,active:true,cymatic:true};
}

// ANSI++ ink is presentation metadata. The serial stream still carries plain
// glyphs and SGR. Every receiver can choose to ignore these optional effects.
export const ansiDitherModes=Object.freeze(['off','checker','ordered','diagonal','reverse','crosshatch','scanlines']);
export const ansiFlickerModes=Object.freeze(['off','breathe','ember','fluorescent','fault','double-pulse','beacon','heartbeat','relay','ramp','lantern','arc','scanner','neon','storm','afterglow']);
const level=n=>Number.isInteger(n)&&n>=0&&n<=15;
const lightAliases=Object.freeze({'slow-flow':1,candle:10});
const flickerId=mode=>typeof mode==='string'?(lightAliases[mode]??ansiFlickerModes.indexOf(mode)):mode;
const within=(n,lo,hi)=>Number.isFinite(n)&&n>=lo&&n<=hi;

export function ansiBloomShape(value={}){
 const {core=1,halo=1,white=.62,falloff='soft',aspect=1}=value;
 if(!within(core,0,4)||!within(halo,0,8)||!within(white,0,1)||
  !within(aspect,.15,5)||!['tight','soft','mist'].includes(falloff))throw Error('Bounded ANSI bloom required');
 return {core,halo,white,falloff,aspect};
}
export function ansiInk(value={}){
 const {dim=15,bloom=0,dither='off',light,bloomShape}=value;
 if(!level(dim)||!level(bloom)||!ansiDitherModes.includes(dither))throw Error('ANSI ink requires 0–15 levels and a known dither');
 if(light!==undefined&&(!light||!['point','area'].includes(light.kind)||
  !level(light.color??14)||!level(light.power??8)||!level(flickerId(light.flicker??0))||
  !within(light.rate??1,.05,8)||!within(light.depth??1,0,1)||
  !Number.isFinite(light.radius??2)||(light.radius??2)<.25||(light.radius??2)>10))throw Error('Bounded ANSI light required');
 const ink={dim,bloom,dither,light:light&&{kind:light.kind,color:light.color??14,power:light.power??8,flicker:light.flicker??0,radius:light.radius??2}};
 if(bloomShape!==undefined)ink.bloomShape=ansiBloomShape(bloomShape);
 if(light?.rate!==undefined)ink.light.rate=light.rate;
 if(light?.depth!==undefined)ink.light.depth=light.depth;
 return ink;
}
export function ansiDitherPixel(mode,x,y){
 switch(mode){
  case 'checker':return (x+y)%2===0;
  case 'ordered':return bayer[(y&3)*4+(x&3)]<5;
  case 'diagonal':return ((x+y)&3)===0;
  case 'reverse':return ((x-y)&3)===0;
  case 'crosshatch':return ((x+y)&7)===0||((x-y)&7)===0;
  case 'scanlines':return (y&3)===1;
  default:return false;
 }
}
export function ansiFlicker(mode,time,seed=0,held=false){
 mode=flickerId(mode);
 if(!mode||held)return 1;
 const t=time+seed*.117,p=(hz)=>t*hz%1;
 const wave=hz=>.5+.5*Math.sin(t*hz*6.283185307);
 const decay=(phase,rate)=>Math.exp(-phase*rate);
 const noise=hz=>{const n=Math.sin((Math.floor(t*hz)+17)*78.233+seed*12.9898)*43758.5453;return n-Math.floor(n);};
 switch(mode){
  case 1:return .58+.42*wave(.44);
  case 2:return .65+.24*wave(1.3)+.11*noise(6);
  case 3:return noise(12)>.82?.38:1;
  case 4:return p(.38)<.17?.24:.94;
  case 5:return .47+.53*Math.max(decay(p(.52),10),decay((p(.52)+.78)%1,17));
  case 6:return .45+.55*decay(p(.68),6);
  case 7:return .55+.45*Math.max(decay(p(.79),20),.72*decay((p(.79)+.81)%1,15));
  case 8:return p(1.1)<.43?1:.48;
  case 9:return .47+.53*p(.58);
  case 10:return .70+.16*wave(.83)+.14*wave(2.37);
  case 11:return .55+.45*noise(11);
  case 12:return .46+.54*wave(.94)**3;
  case 13:return .72+.28*(noise(8)>.24?1:0);
  case 14:return .48+.52*(noise(4)>.82?1:wave(.33)*.45);
  case 15:return .57+.43*decay(p(.34),2.8);
  default:return 1;
 }
}

export function ansiLightPulse(lamp,time,seed=0,held=false){
 const preset=lamp.flicker==='slow-flow'?.47:1;
 const wave=ansiFlicker(lamp.flicker,time*(lamp.rate??preset),seed,held);
 return 1-(lamp.depth??1)*(1-wave);
}

export function ansiBloomProfile(pass=1){
 const detail=Math.max(0,Math.min(7,pass-1));
 return {radius:1.25/(1+detail*.75),white:.08+detail*.09};
}
// Bands are additive. A later glyph never erases an earlier cell's ground.
export function paintAnsiInkBands(bands,{pass,age=0,reduced=false,animated=false,receive=()=>true,glyph,bloom}) {
 for(const band of bands) {
  if(band.pass>pass)break;
  for(const mark of band.marks) {
   const {u,v,size,ink,hue=0,pulse=0,alpha=1,bloom:power=0,bloomShape}=mark;
   if(Boolean(pulse&&!reduced)!==animated||!receive(band.pass,v))continue;
   const beat=animated?Math.sin(age*pulse+u*13):0;
   if(power)bloom(u,v,size,ink,power*(.78+beat*.22),band.pass,bloomShape);
   glyph(mark.glyph,u,v,size,ink,alpha*(1+beat*.17),hue*beat);
  }
 }
}
// Fixture spill has a world-space footprint. The glyph's bloom shrinks
// with its ink layer, while the lamp continues lighting nearby material.
export function ansiSurfaceLightState(lamp,palette,time,index,held){
 const flicker=ansiLightPulse(lamp,time,index,held);
 let color=typeof lamp.color==='string'?lamp.color:palette[lamp.color];
 if(!lamp.emitter)return {color,power:lamp.power*(.47+.53*flicker)};
 const hue=Math.round((1-flicker)*lamp.emitter.hue/2)*2;
 color=ansiHueColour(color,hue,true);
 return {color,power:lamp.power*(.20+.80*flicker**2)};
}

export function paintAnsiSurfaceLight(ctx,painter,lamp,palette,view,time,index,held){
 const {width,height}=ctx.canvas;
 const span=2**-(view.zoom??0),sx=span*(view.viewport?.x??1),sy=span*(view.viewport?.y??1);
 const x=(.5+(lamp.u-(view.centerX??.5))/sx)*width;
 const y=(.5+(lamp.v-(view.centerY??.5))/sy)*height;
 const radius=lamp.size*height/sy;
 const spread=lamp.spread??(lamp.kind==='area'?1.86:1);
 if(x+radius*spread<0||x-radius*spread>width||y+radius<0||y-radius>height)return;
 if(lamp.surface){
  const {left,top,right,bottom}=lamp.surface;
  ctx.save();ctx.beginPath();
  ctx.rect(x+(left-lamp.u)*width/sx,y+(top-lamp.v)*height/sy,
   (right-left)*width/sx,(bottom-top)*height/sy);
  ctx.clip();
 }
 const {power,color}=ansiSurfaceLightState(lamp,palette,time,index,held);
 painter.glow(ctx,{x,y:y+radius*(lamp.down?.36:0),width:radius*spread*1.85,height:radius*1.74,
  color,power:power*.72,kind:lamp.down?'downlight':lamp.kind,blend:'screen'});
 if(lamp.bloomShape){
  painter.bloom(ctx,{x,y,radius,color,power,pass:lamp.pass??5,shape:lamp.bloomShape});
 }
 if(lamp.emitter){
  const w=lamp.emitter.width*width/sx,h=lamp.emitter.height*height/sy;
  painter.glow(ctx,{x,y,width:w*2.6,height:h*2.9,color,power,pass:4,kind:'area',blend:'screen'});
  if(!lamp.emitter.soft){
   ctx.save();
   ctx.globalCompositeOperation='screen';ctx.globalAlpha=Math.min(1,power*1.28);
   ctx.fillStyle=color;
   ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,Math.min(w,h)*.36);ctx.fill();
   ctx.restore();
  }
 }else{
  const core=Math.min(radius*.33,Math.max(5,height*.036/sy));
  painter.glow(ctx,{x,y,width:core*1.8,height:core*1.6,color,
   power:power*.83,pass:5,blend:'screen'});
 }
 if(lamp.surface)ctx.restore();
}
// High bits of the sampled material carry an optional printing character.
export const ansiMaterialGlyphs=Object.freeze(Array.from(' ─│/\\+XVL┐┌┘O┴.:=░▒▓╳#<>01⊙○╴╵╱T'));
const materialGlyphIndex=new Map(ansiMaterialGlyphs.map((glyph,index)=>[glyph,index]));
const RGB_INK=0x20000000,RGB_MASK=0xffffff;
export const isAnsiRgb=ink=>ink>=RGB_INK;
export const packAnsiRgb=rgb=>RGB_INK|(rgb&RGB_MASK);
export const ansiRgbHex=ink=>'#'+(ink&RGB_MASK).toString(16).padStart(6,'0');
export const ansiRgbWord=ink=>(0xff000000|((ink&255)<<16)|(ink&0xff00)|((ink>>>16)&255))>>>0;
export const packAnsiGlyph=(ink,glyph)=>ink|((materialGlyphIndex.get(glyph)??0)<<(isAnsiRgb(ink)?24:11));
export const ansiInkGlyph=ink=>ansiMaterialGlyphs[(ink>>>(isAnsiRgb(ink)?24:11))&31];
export function packAnsiInk(color,dim=15,dither=0){return (color&15)|((15-dim)<<4)|(dither<<8);}

// Reusable, deterministic effects for the higher-detail plates.
export function ansiIris(progress,x=.5,y=.5){
 const t=Math.max(0,Math.min(1,progress)),size=8+140*t*t*(3-2*t);
 return t===1?'':`circle(${size}% at ${x*100}% ${y*100}%)`;
}
export function ansiPhosphor(progress,scanline,phase=0){
 const ridge=scanline+Math.sin(scanline*25+phase)*.12;
 return Math.max(0,.56*(1-progress)-Math.max(0,progress-ridge)*.8);
}
export function ansiTrajectory(points,progress){
 const t=Math.max(0,Math.min(1,progress)),s=1-t,[a,b,c]=points;
 return [s*s*a[0]+2*s*t*b[0]+t*t*c[0],s*s*a[1]+2*s*t*b[1]+t*t*c[1]];
}
export function shadeAnsiWord(word,dim){
 const factor=dim/15;
 return (0xff000000|(Math.round((word>>>16&255)*factor)<<16)|
  (Math.round((word>>>8&255)*factor)<<8)|Math.round((word&255)*factor))>>>0;
}

// Dither is rasterized once per pattern and glyph size. Glows share a small
// atlas of 48px kernels; painting one lamp is a single scaled blit.
export function createAnsiLightPainter(doc){
 const kernels=new Map(),patterns=new Map();
 const raster=(width,height)=>{
  const canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;
 };
 return {
  dither(ctx,mode,x,y,w,h){
   if(mode==='off')return;
   let mask=patterns.get(mode);
   if(!mask){
    mask=raster(8,16);const ink=mask.getContext('2d');ink.fillStyle='#0007';
    for(let py=0;py<16;py++)for(let px=0;px<8;px++)if(ansiDitherPixel(mode,px,py))ink.fillRect(px,py,1,1);
    patterns.set(mode,mask);
   }
   ctx.drawImage(mask,x,y,w,h);
  },
  bloom(ctx,{x,y,radius,color,power,pass=1,shape}){
   const {core,halo,white,falloff,aspect}=ansiBloomShape(shape);
   if(halo)this.glow(ctx,{x,y,width:2*radius*halo*aspect,height:2*radius*halo,
    color,power:power*.77,pass,profile:{white:0,falloff}});
   if(core)this.glow(ctx,{x,y,width:2*radius*core*aspect,height:2*radius*core,
    color,power,pass,profile:{white,falloff:'tight'}});
  },
  glow(ctx,{x,y,width,height,color,power,pass=1,kind='point',blend='lighter',profile}){
   if(power<=0||width<=0||height<=0)return;
   const key=[color,pass,kind,profile?.white,profile?.falloff].join('/');
   let kernel=kernels.get(key);
   if(!kernel){
    if(kernels.size>=96)kernels.delete(kernels.keys().next().value);
    kernel=raster(48,48);const ink=kernel.getContext('2d'),{white}=ansiBloomProfile(pass);
    const directional=kind==='downlight';
    const halo=directional?ink.createRadialGradient(24,14,0,24,19,28):ink.createRadialGradient(24,24,0,24,24,24);
    if(profile){
     const inner=.012+profile.white*.25;
     const skirt=profile.falloff==='mist'?.73:profile.falloff==='tight'?.26:.49;
     halo.addColorStop(0,profile.white>0?'#fff':color);
     halo.addColorStop(Math.min(skirt*.84,inner),color);
     halo.addColorStop(skirt,color+(profile.falloff==='mist'?'49':'70'));
     halo.addColorStop(1,color+'00');
    }else{
     halo.addColorStop(0,'#fff');halo.addColorStop(Math.min(kind==='area'?.52:.28,white*.55),color);
     halo.addColorStop(kind==='area'||directional?.56:.31,color+'70');halo.addColorStop(1,color+'00');
    }
    ink.fillStyle=halo;ink.fillRect(0,0,48,48);
    if(directional){
     const image=ink.getImageData(0,0,48,48),data=image.data;
     for(let y=0;y<48;y++)for(let x=0;x<48;x++){
      const aperture=4+y*.53,edge=Math.max(0,Math.min(1,(aperture-Math.abs(x-23.5))/8));
      data[(y*48+x)*4+3]*=edge*edge*Math.min(1,y/8);
     }
     ink.putImageData(image,0,0);
    }
    kernels.set(key,kernel);
   }
   ctx.save();ctx.globalCompositeOperation=blend;ctx.globalAlpha=Math.min(1,power);
   ctx.imageSmoothingEnabled=true;ctx.drawImage(kernel,x-width/2,y-height/2,width,height);ctx.restore();
  },
 };
}
