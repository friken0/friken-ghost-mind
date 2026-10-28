import {ensureAnsiFont,ansiFontFamily} from './ansi-ui.mjs';
import {ansiPalette} from './ansi-terminal.mjs';

/* Explicitly mounted AFTER the connection handoff. Importing this module does
 * not create a canvas, load a font, fetch assets, or schedule a clock. */
const printable=value=>typeof value==='string'&&value.length>=1&&value.length<=2&&[...value].length===1&&!/[\x00-\x1f\x7f]/.test(value);
function number(value,name,min,max,integer=false){if(!Number.isFinite(value)||value<min||value>max||integer&&!Number.isInteger(value))throw Error('Invalid ANSI sprite '+name);return value;}
function colour(value){if(value==null)return null;if(Number.isInteger(value)&&value>=0&&value<=255)return value;if(typeof value==='string'&&value.length<=80&&(/^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|[a-z]{1,24})$/i.test(value)||/^(?:rgb|hsl)a?\([\d.,% /+-]+\)$/i.test(value)))return value;throw Error('Invalid ANSI sprite colour');}
function palette(value=ansiPalette){if(!Array.isArray(value)||!value.length||value.length>256)throw Error('Bounded ANSI sprite palette required');return Object.freeze(value.map(c=>{if(typeof colour(c)!=='string')throw Error('Sprite palettes contain literal colours');return c;}));}
function frame(input,defaults){
 let cells=[],columns=0,rows=0;
 if(typeof input==='string'){
  if(input.length>8192)throw Error('Sprite text frame exceeds its bounded input budget');
  const lines=input.replace(/\r\n/g,'\n').split('\n');rows=lines.length;
  for(let y=0;y<lines.length;y++){const glyphs=[...lines[y]];columns=Math.max(columns,glyphs.length);for(let x=0;x<glyphs.length;x++){const glyph=glyphs[x];if(!printable(glyph))throw Error('Printable glyphs required; ANSI escape execution is not supported');if(glyph!==' '||defaults.bg!=null)cells.push({x,y,glyph,fg:defaults.fg,bg:defaults.bg});}}
 }else{
  const descriptors=Array.isArray(input)?input:input?.cells;if(!Array.isArray(descriptors)||descriptors.length>2048)throw Error('Sprite frame needs multiline text or bounded cell descriptors');
  const seen=new Set();for(const value of descriptors){if(!value||typeof value!=='object')throw Error('Invalid sprite cell');const x=number(value.x,'cell x',0,127,true),y=number(value.y,'cell y',0,63,true),glyph=value.glyph??value.char;if(!printable(glyph))throw Error('One printable glyph per sprite cell');const key=x+':'+y;if(seen.has(key))throw Error('Duplicate sprite cell');seen.add(key);columns=Math.max(columns,x+1);rows=Math.max(rows,y+1);cells.push({x,y,glyph,fg:colour(value.fg===undefined?defaults.fg:value.fg),bg:colour(value.bg===undefined?defaults.bg:value.bg)});}
  if(!Array.isArray(input)){columns=Math.max(columns,input.columns??0);rows=Math.max(rows,input.rows??0);}
 }
 columns=Math.max(1,columns);rows=Math.max(1,rows);number(columns,'frame columns',1,128,true);number(rows,'frame rows',1,64,true);if(columns*rows>2048)throw Error('Sprite frame exceeds 2048 cells');
 return Object.freeze({columns,rows,cells:Object.freeze(cells.map(Object.freeze))});
}
function checkPalette(frames,inks){for(const f of frames)for(const c of f.cells)for(const value of [c.fg,c.bg])if(typeof value==='number'&&value>=inks.length)throw Error('Sprite palette index is missing');}
function spec(input,maxFps){
 if(!input||typeof input!=='object'||!Array.isArray(input.frames)||!input.frames.length||input.frames.length>16)throw Error('ANSI sprite needs 1..16 frames');
 const inks=palette(input.palette),defaults={fg:colour(input.fg??14),bg:colour(input.bg)},frames=Object.freeze(input.frames.map(f=>frame(f,defaults)));checkPalette(frames,inks);
 const columns=Math.max(...frames.map(f=>f.columns)),rows=Math.max(...frames.map(f=>f.rows)),fps=Math.min(maxFps,number(input.fps??8,'frame rate',0,240)),mode=input.mode??(input.loop===false?'once':'loop');if(!['once','loop'].includes(mode))throw Error('Sprite mode must be once or loop');
 return {frames,palette:inks,columns,rows,cost:columns*rows,fps,mode,duration:input.duration===undefined?Infinity:number(input.duration,'duration',.001,3600),x:number(input.x??0,'x',-4096,4096),y:number(input.y??0,'y',-4096,4096),scale:number(input.scale??1,'scale',.125,8),alpha:number(input.alpha??1,'alpha',0,1),visible:input.visible!==false,playing:input.playing!==false,frame:input.frame==null?null:number(input.frame,'manual frame',0,frames.length-1,true),z:number(input.z??0,'layer',-1000,1000,true),at:0,paused:0,paletteRevision:0};
}
function indexAt(s,time,reduced){if(s.frame!==null)return s.frame;if(reduced||!s.playing||!s.fps)return s.paused;const elapsed=Math.max(0,time-s.at);if(elapsed>=s.duration)return s.frames.length-1;const step=Math.floor(elapsed*s.fps+1e-9);return s.mode==='once'?Math.min(s.frames.length-1,step):step%s.frames.length;}
function bounds(s,columns,rows){if(!s.visible||s.alpha===0)return null;const x=Math.max(0,Math.floor(s.x)),y=Math.max(0,Math.floor(s.y)),right=Math.min(columns,Math.ceil(s.x+s.columns*s.scale)),bottom=Math.min(rows,Math.ceil(s.y+s.rows*s.scale));return right>x&&bottom>y?{x,y,width:right-x,height:bottom-y}:null;}
const overlap=(a,b)=>a&&b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
function merged(rects){const out=[];for(let rect of rects.filter(Boolean)){let i=0;while(i<out.length){const r=out[i];if(overlap(rect,r)){const x=Math.min(rect.x,r.x),y=Math.min(rect.y,r.y);rect={x,y,width:Math.max(rect.x+rect.width,r.x+r.width)-x,height:Math.max(rect.y+rect.height,r.y+r.height)-y};out.splice(i,1);i=0;}else i++;}out.push(rect);}return out;}

/** Pure bounded sprite state, using monotonic caller seconds. No DOM or timers. */
export function createAnsiSpriteScene({columns=120,rows=50,maxFps=30,maxSprites=32,maxCells=8000}={}){
 number(columns,'columns',1,512,true);number(rows,'rows',1,256,true);number(maxFps,'compositor rate',1,30);number(maxSprites,'sprite budget',1,32,true);number(maxCells,'cell budget',1,8000,true);
 const sprites=new Map(),painted=new Map(),erased=[];let time=0,lastPaint=-Infinity,cost=0,reduced=false,serial=0;
 function id(value){if(typeof value!=='string'||!value.length||value.length>96)throw Error('Bounded ANSI sprite ID required');return value;}
 function snapshot(key,s,t,reduce){const frameIndex=indexAt(s,t,reduce),rect=bounds(s,columns,rows);return Object.freeze({id:key,x:s.x,y:s.y,scale:s.scale,alpha:s.alpha,visible:s.visible,z:s.z,serial:s.serial,palette:s.palette,frameIndex,frame:s.frames[frameIndex],bounds:rect?Object.freeze(rect):null,signature:[frameIndex,s.x,s.y,s.scale,s.alpha,s.visible,s.z,s.paletteRevision].join(':')});}
 const api={
  add(key,value){id(key);const s=spec(value,maxFps),old=sprites.get(key),nextCost=cost-(old?.cost||0)+s.cost;if(!old&&sprites.size>=maxSprites||nextCost>maxCells)throw Error('ANSI sprite admission budget exceeded');s.at=time;s.serial=old?.serial??++serial;sprites.set(key,s);cost=nextCost;return api;},
  set(key,state){id(key);const old=sprites.get(key);if(!old)throw Error('Unknown ANSI sprite');if(!state||typeof state!=='object'||Array.isArray(state))throw Error('Sprite state required');const s={...old};
   for(const [k,value]of Object.entries(state)){
    if(k==='x'||k==='y')s[k]=number(value,k,-4096,4096);
    else if(k==='scale')s.scale=number(value,k,.125,8);
    else if(k==='alpha')s.alpha=number(value,k,0,1);
    else if(k==='visible'){if(typeof value!=='boolean')throw Error('Sprite visibility must be boolean');s.visible=value;}
    else if(k==='z')s.z=number(value,k,-1000,1000,true);
    else if(k==='frame')s.frame=value===null?null:number(value,k,0,s.frames.length-1,true);
    else if(k==='palette'){s.palette=palette(value);checkPalette(s.frames,s.palette);s.paletteRevision++;}
    else if(k==='playing'){if(typeof value!=='boolean')throw Error('Sprite playing must be boolean');if(s.playing!==value){if(!value)s.paused=indexAt(s,time,reduced);else s.at=time-(s.fps?s.paused/s.fps:0);s.playing=value;}}
    else throw Error('Unknown sprite state '+k);
   }sprites.set(key,s);return api;
  },
  remove(key){id(key);const old=sprites.get(key);if(!old)return false;erased.push(painted.get(key)?.bounds);painted.delete(key);sprites.delete(key);cost-=old.cost;return true;},
  get(key,t=time,{reducedMotion=reduced}={}){id(key);number(t,'clock',0,Number.MAX_SAFE_INTEGER);const s=sprites.get(key);return s?snapshot(key,s,t,reducedMotion):null;},
  update(t,{reducedMotion=false}={}){number(t,'clock',0,Number.MAX_SAFE_INTEGER);if(t<time)throw Error('ANSI sprite clock must be monotonic');time=t;if(t-lastPaint<1/maxFps-1e-9)return {changed:false,rects:[],sprites:[]};
   const snapshots=[],dirty=erased.splice(0);for(const [key,s]of sprites){const next=snapshot(key,s,t,reducedMotion),prior=painted.get(key);snapshots.push(next);if(!prior||prior.signature!==next.signature||prior.frame!==next.frame||reduced!==reducedMotion){dirty.push(prior?.bounds,next.bounds);painted.set(key,next);}}
   reduced=reducedMotion;const rects=merged(dirty);if(!rects.length)return {changed:false,rects:[],sprites:[]};lastPaint=t;snapshots.sort((a,b)=>a.z-b.z||a.serial-b.serial);return {changed:true,rects,sprites:snapshots};
  },
  invalidate(){for(const s of painted.values())erased.push(s.bounds);painted.clear();return api;},
  clear(){for(const s of painted.values())erased.push(s.bounds);sprites.clear();painted.clear();cost=0;return api;},
  get size(){return sprites.size;},get cells(){return cost;},get dimensions(){return {columns,rows};}
 };return api;
}

/** Overlay admission is explicit: the carrier must finish its connection first.
 * root supplies placement; its existing animation clock calls update(seconds). */
export function mountAnsiSprites(root,{columns=120,rows=50,cellWidth=8,cellHeight=16,maxFps=30,maxSprites=32,maxCells=8000,paintGlyph}={}){
 if(!root?.ownerDocument)throw Error('ANSI sprites need a DOM root');number(cellWidth,'cell width',1,64);number(cellHeight,'cell height',1,128);if(columns*cellWidth>4096||rows*cellHeight>4096)throw Error('Sprite canvas exceeds 4096 pixels');
 const scene=createAnsiSpriteScene({columns,rows,maxFps,maxSprites,maxCells}),canvas=root.ownerDocument.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('ANSI sprite canvas unavailable');
 canvas.width=Math.ceil(columns*cellWidth);canvas.height=Math.ceil(rows*cellHeight);canvas.dataset.ansiSprites='v1';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;z-index:4';root.append(canvas);
 let destroyed=false,ready=false,revision=0;
 const loaded=ensureAnsiFont().then(()=>{if(destroyed)return false;ready=true;scene.invalidate();return true;});
 const glyph=paintGlyph||((context,char,x,y,w,h)=>{context.font=`${h}px ${ansiFontFamily}`;context.textBaseline='top';context.fillText(char,x,y,w);});
 const ink=(value,inks)=>typeof value==='number'?inks[value]:value;
 function update(seconds,options){if(destroyed||!ready||root.ownerDocument.hidden)return {painted:false,cells:0,rects:0};const changes=scene.update(seconds,options);if(!changes.changed)return {painted:false,cells:0,rects:0};let count=0;ctx.imageSmoothingEnabled=false;
  for(const rect of changes.rects){ctx.save();try{ctx.beginPath();ctx.rect(rect.x*cellWidth,rect.y*cellHeight,rect.width*cellWidth,rect.height*cellHeight);ctx.clip();ctx.clearRect(rect.x*cellWidth,rect.y*cellHeight,rect.width*cellWidth,rect.height*cellHeight);
   for(const s of changes.sprites){if(!overlap(s.bounds,rect))continue;ctx.save();try{ctx.globalAlpha=s.alpha;for(const cell of s.frame.cells){const x=s.x+cell.x*s.scale,y=s.y+cell.y*s.scale;if(!overlap({x,y,width:s.scale,height:s.scale},rect))continue;const px=x*cellWidth,py=y*cellHeight,w=s.scale*cellWidth,h=s.scale*cellHeight,fg=ink(cell.fg,s.palette),bg=ink(cell.bg,s.palette);if(bg){ctx.fillStyle=bg;ctx.fillRect(px,py,w,h);}if(fg){ctx.save();try{ctx.beginPath();ctx.rect(px,py,w,h);ctx.clip();ctx.fillStyle=fg;glyph(ctx,cell.glyph,px,py,w,h);}finally{ctx.restore();}}count++;}}finally{ctx.restore();}}
  }finally{ctx.restore();}}
  canvas.dataset.cells=String(count);canvas.dataset.revision=String(++revision);return {painted:true,cells:count,rects:changes.rects.length};
 }
 return {canvas,ready:loaded,add(...args){if(destroyed)throw Error('ANSI sprite layer destroyed');scene.add(...args);return this;},set(...args){if(destroyed)throw Error('ANSI sprite layer destroyed');scene.set(...args);return this;},remove:key=>!destroyed&&scene.remove(key),update,clear(){if(!destroyed)scene.clear();},get size(){return scene.size;},destroy(){if(destroyed)return;destroyed=true;scene.clear();canvas.remove();}};
}

// Original tiny glyph creatures; no raster assets or unrelated game artwork.
export const ansiSpritePresets=Object.freeze({
 packetMoth:Object.freeze({fps:8,fg:14,frames:Object.freeze(['╲░╱\n ◈ \n╱ ╲','─▒─\n ◈ \n ╳ ','╱▓╲\n ◈ \n╲ ╱','─▒─\n ◈ \n ╳ '])}),
 orbitWisp:Object.freeze({fps:6,fg:13,frames:Object.freeze([' ░◦\n ◇ \n◦░ ','░◦ \n ◇ \n ░◦','◦░ \n ◇ \n ░◦',' ░◦\n ◇ \n◦░ '])}),
 cursorCritter:Object.freeze({fps:5,fg:11,frames:Object.freeze([' ▄▀▄ \n▐• •▌\n ▀╥▀ \n ╱ ╲ ',' ▄▀▄ \n▐• •▌\n ▀╥▀ \n ╲ ╱ ',' ▄▀▄ \n▐─ ─▌\n ▀╥▀ \n ╱ ╲ '])})
});
