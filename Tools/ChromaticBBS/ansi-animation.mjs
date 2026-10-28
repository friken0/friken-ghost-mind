/* Caller-clock ANSI choreography. No timer, DOM, font, random source, audio,
 * rendering loop or paragraph scan. Only registered/affected cells change. */
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
export function ansiHueColour(hex,degrees=0){
 if(!Number.isFinite(degrees)||degrees<0||degrees>360)throw Error('Bounded ANSI hue required');if(!degrees||!/^#[0-9a-f]{6}$/i.test(hex))return hex;
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;if(!d)return hex;
 const h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60,s=d/(1-Math.abs(2*l-1));return `hsl(${((h+degrees)%360).toFixed(2)} ${(s*100).toFixed(2)}% ${(l*100).toFixed(2)}%)`;
}
const bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
/** Paint with the caller's existing font/glyph routine. The helper preserves
 * context state, clips every cell and never registers another animation loop.
 * Supply a palette for indexed colours; null colours preserve the caller ink. */
export function drawAnsiCell(ctx,frame,{x=0,y=0,width=16,height=32,paintGlyph,palette,clear=true}={}){
  if(!ctx||typeof paintGlyph!=='function'||![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)throw Error('ANSI glyph printer and bounded cell rectangle required');
  const resolve=value=>{if(value==null)return null;if(typeof value==='number'){if(!Array.isArray(palette)||typeof palette[value]!=='string')throw Error('ANSI indexed colour has no palette entry');return palette[value];}return value;};
  ctx.save();try{
    ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();if(clear)ctx.clearRect(x,y,width,height);
    if(!frame)return;
    for(const s of frame.layers){
      ctx.save();try{
        ctx.globalAlpha*=s.alpha;
        if(s.dither){ctx.beginPath();for(let row=0;row<4;row++)for(let col=0;col<4;col++)if(((bayer[row*4+col]+.5)/16<s.dither.threshold)!==s.dither.invert)ctx.rect(x+col*width/4,y+row*height/4,width/4,height/4);ctx.clip();}
        if(s.scan){ctx.beginPath();ctx.rect(x,y+height*s.scan.from,width,height*(s.scan.to-s.scan.from));ctx.clip();}
        const bg=ansiHueColour(resolve(s.bg)||'',s.hue||0),fg=ansiHueColour(resolve(s.fg)||'',s.hue||0);if(bg){ctx.fillStyle=bg;ctx.fillRect(x,y,width,height);}if(fg)ctx.fillStyle=fg;
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
