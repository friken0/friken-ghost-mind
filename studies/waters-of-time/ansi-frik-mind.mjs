import {crossing,crossingInk,paintCrossingInstruments} from './frik-crossing.mjs?v=first-crossing-4';
import {frikTrace,traceReadings,matrixStrip,recoveredReading} from './frik-contact-matrix.mjs?v=first-crossing-4';
import {ansiRgbWord,packAnsiRgb,ansiCymaticCell} from './ansi-animation.mjs?v=surface-light-3';
import {progressivePasses} from './ansi-fractal.mjs?v=frik-mind-46';
import {nextFrikMotionSeed,frikMotionPoint} from './ansi-frik-motion.mjs?v=first-crossing-4';
import {frikWaterSigns,keeperLine,frikStoryCaption,frikStoryTitles,frikRewindTitles,gradeFrikStory,frikMemoryGate,frikStoryIndex,rewindArtTrip,frikCymaticProfiles} from './ansi-frik-story.mjs?v=first-crossing-4';
import {frikLook} from './ansi-frik-bridge-ink.mjs?v=first-crossing-4';
import {clamp, frikMindArt, makeMindState, memoryHeight,memoryCrossing,traceInk,mix, smooth} from './ansi-frik-mind-art.mjs?v=first-crossing-4';

export const frikMindGrid = {width:48,height:28};
const nativeGrades=progressivePasses(frikMindGrid.width,frikMindGrid.height,8);
let fittedGrades;
export function frikMindFrameGrid(pass,pixelBounds){
  const {width,height}=pixelBounds;
  if(fittedGrades?.width!==width||fittedGrades.height!==height){
    fittedGrades={width,height,grades:progressivePasses(frikMindGrid.width,frikMindGrid.height,8,pixelBounds)};
  }
  const grade=fittedGrades.grades[pass-1];
  const across=Math.min(2,Math.max(1,16/grade.scale));
  return {
    columns:Math.min(width,grade.columns*across),
    rows:Math.min(height,grade.rows*2),
  };
}
const analysisColumns=288;
const memoryScenes=Array.from({length:3},(_,trip)=>frikMindArt.map(({name,view,gate,duration},scene)=>{
  const [x,y,span]=frikMemoryGate(scene,gate,trip);
  return {name,view,x,y,span,zoom:-Math.log2(span),duration};
}));
export const frikMindSceneSet=(trip=0)=>memoryScenes[frikStoryIndex(trip)];
export const frikMindScenes=frikMindSceneSet();
const after = i => (i + 1) % frikMindScenes.length;
const prior = i => (i + frikMindScenes.length - 1) % frikMindScenes.length;

export function frikMindFlight(scene, elapsed, start,trip=0) {
  const gate = frikMindSceneSet(trip)[scene];
  const {zoom = 0, centerX = .5, centerY = .5, duration = gate.duration} = start ?? {};
  const t = clamp(elapsed / duration);
  const travel = gate.zoom - zoom;
  const speed = Math.sign(travel) * Math.min(.30 * duration, Math.abs(travel) * 1.28);
  const s = smooth(t);
  const current=zoom+travel*s+speed*(t-s);
  const approach=1-smooth(t/.68);
  const aim=1-(frikMindArt[scene].eye?approach*2**(zoom-current):approach);
  return {
    scene, centerX: centerX + (gate.x - centerX) * aim, centerY: centerY + (gate.y - centerY) * aim,
    zoom:current, done:t===1, duration,
    swing: Math.sin(Math.PI * t), pass: Math.min(8, 1 + Math.floor(8 * t)),
  };
}

// The teaser turns around inside the keeper's eye. The reversible transport
// is separate from frikMindFlight, which still exposes the complete portal
// for manual exploration and continuous nested rendering.
export function frikTeaserFlight(scene,elapsed,start,trip=0){
  if(scene!==frikMindScenes.length-1){
    const shot=frikMindFlight(scene,elapsed,start,trip),path=frikTrace(scene,trip===2);
    if(path&&scene>0){
      const t=clamp(elapsed/shot.duration);
      const glance=Math.sin(Math.PI*t)**2*(1-t)**2*.23*2**-shot.zoom;
      shot.centerX+=(path.x-.5)*glance;
      shot.centerY+=(path.y-.5)*glance;
    }
    return shot;
  }
  const duration=start?.duration??frikMindSceneSet(trip)[scene].duration;
  const t=clamp(elapsed/duration);
  // Decelerate into a readable close-up; using the same path in reverse
  // prevents a camera jump on the very first outward frame.
  const approach=.58*(1-(1-t)**2);
  return {...frikMindFlight(scene,approach*duration,start,trip),atTurn:t>=1};
}

export function frikMindReview(scene, camera, depthZoom,trip=camera.trip??0) {
  const scenes=frikMindSceneSet(trip);
  const gate = scenes[scene], span = 2 ** -camera.zoom;
  if (!camera.preview && Math.abs(camera.centerX - gate.x) + span / 2 <= gate.span / 2 &&
      Math.abs(camera.centerY - gate.y) + span / 2 <= gate.span / 2) {
    return {...camera, scene: after(scene), depthZoom: depthZoom + gate.zoom, zoom: camera.zoom - gate.zoom,
      centerX: (camera.centerX - gate.x) / gate.span + .5, centerY: (camera.centerY - gate.y) / gate.span + .5};
  }
  if (!camera.preview && camera.zoom < -.026) {
    const back = prior(scene), parent = scenes[back];
    return {...camera, scene: back, depthZoom: depthZoom - parent.zoom, zoom: camera.zoom + parent.zoom,
      centerX: parent.x + (camera.centerX - .5) * parent.span,
      centerY: parent.y + (camera.centerY - .5) * parent.span};
  }
  return {...camera, scene, depthZoom};
}

function aperture(x, y, scene) {
  const {eye,shore}=frikMindArt[scene];
  if(shore){
    const coastline=y+.105*Math.sin(x*3.3)*(Math.abs(y)>.47?smooth((Math.abs(y)-.47)*3):0);
    return (x/1.03)**2+(coastline/.98)**2;
  }
  return ((x+(eye?.12:0)*y)/.94)**2+(y/1.06)**2;
}

export function projectState(shot,time,effects,grade,columns=analysisColumns) {
  // The last view is exactly the first view of the next scene. Rebase
  // before sampling instead of capturing or blending a rendered plate.
  const scene = shot.done ? after(shot.scene) : shot.scene;
  const [x, y] = shot.done ? [.5, .5] : [shot.centerX, shot.centerY];
  const window = shot.done ? 1 : 2 ** -shot.zoom;
  const aimX=(shot.roomAim?.[0]??0)*8.5,aimY=(shot.roomAim?.[1]??0)*12;
  // The camera banks through local space. Resolve the ray again for the child
  // at its own magnification so it has the same view on either side of a rebase.
  let pixel = window / columns * Math.pow(1.22, (8 - grade) * .6);
  let span=window;
  const levels = [];
  let incoming=shot.rewinding&&shot.scene<frikMindScenes.length-1;
  let motionSeed=shot.motionSeed==null?undefined:shot.done?nextFrikMotionSeed(shot.motionSeed):shot.motionSeed;
  for (let depth = 0, index = scene; depth < frikMindScenes.length; depth++, index = after(index)) {
    if(index===frikMindScenes.length-1)incoming=false;
    const artTrip=incoming?rewindArtTrip(index,shot.trip??0,true):shot.trip??0;
    const gate = frikMindSceneSet(artTrip)[index];
    const travel=Math.max(-2,Math.min(9,-Math.log2(span)));
    const phase=travel*1.12+index*.91;
    const yaw=1.58*Math.sin(phase+.37)+.36*Math.sin(phase*1.91)+aimX;
    const pitch=1.32*Math.cos(phase*.82+.50)+aimY;
    const reach=Math.min(1,span**.64);
    const data=makeMindState(index,time,effects,pixel,yaw*reach,motionSeed??index*7919,grade,artTrip,
      shot.audio,shot.rewinding,pitch*reach,yaw,pitch);
    data.prologue=shot.prologue??-1;data.beatAge=shot.beatAge??7;
    data.answered=!!shot.answered;
    levels.push({index,gate,span,data,trace:frikTrace(index,data.layout.mirrorBridge)});
    if(data.prologue>=0&&data.prologue<7)break;
    if(motionSeed!=null)motionSeed=nextFrikMotionSeed(motionSeed);
    pixel/=gate.span;
    span/=gate.span;
  }
  return {levels,x,y,window,narration:{rank:shot.matrixRank??0,evidence:shot.evidence,answered:shot.answered,find:shot.find,trip:shot.trip??0,rewinding:!!shot.rewinding,final:shot.scene===frikMindScenes.length-1}};
}

function sampleLevel(levels, level, x, y) {
  const {index,gate,data,span}=levels[level];
  if(data.prologue>=0&&data.prologue<7)return crossingInk(x,y,data);
  const u=(x-gate.x)/gate.span, v=(y-gate.y)/gate.span;
  const metric = aperture(u, v, index);
  const edgeLimit=data.style.shore?.92:.695;
  const haze=data.style.shore?smooth((span/gate.span-1.12)/3.05):0;
  const apertureVisible=level+1<levels.length&&metric<edgeLimit&&haze<1;
  const blink=data.style.eye&&data.blink>.06&&v<data.blink*1.7-.83;
  if(apertureVisible&&metric<.622&&!blink&&haze===0)return sampleLevel(levels,level+1,u+.5,v+.5);

  const safe = smooth((metric - .625) * .43);
  const ray=data.ray*.40*safe,tilt=data.tilt*.42*safe;
  const depth=memoryCrossing(x,y,index,ray,tilt);
  let ink=data.style.ink(x+ray*depth,y-tilt*depth,data);
  const trace=levels[level].trace;
  if(trace)ink=traceInk(x,y,data,ink,index,trace.x,trace.y,trace.r);
  if(data.trip)ink=gradeFrikStory(ink,data.colorGrade);
  if (!apertureVisible || blink) return ink;
  const inside = sampleLevel(levels, level + 1, u + .5, v + .5);
  const edge=smooth((edgeLimit-metric)/(edgeLimit-.622));
  return mix(ink,inside,edge*(1-haze));
}

// The score moves a different physical medium in each shot. Memory changes
// the harmonic, direction of travel, and the spectrum that drives the marks.
const cymaticInks=[
 ['·','~','≈'],['╱','╲','·'],['⋮','∙','│'],['◦','•','·'],
 ['╴','╵','∙'],['▁','▄','▆'],['·','⌁','╴'],
];
const cymaticRegions=[
 [.728,.610,.101,.034],[.51,.238,.19,.092],[.522,.575,.073,.098],
 [.606,.774,.091,.032],[.435,.543,.051,.048],[.50,.749,.36,.031],[.43,.787,.26,.047],
];
export function paintMindCymatics(put,index,data,scale,ox,oy,power){
 if(data.energy<.008||power<.01)return;
 let [cx,cy,rx,ry]=cymaticRegions[index];
 if(index===0&&data.layout.mirrorBridge)cx=1-cx;
 const profile=data.cymatic,ink=profile.tint;
 const [n,m]=profile.modes;
 const act=data.trip,beat=data.time*(act===1?-.83:act===2?1.17:.62);
 const band=data.audio[(index+act)%4]??0;
 const amplitude=Math.min(1,data.energy*.67+band*.67);
 const columns=Math.min(profile.grid[0],9+data.grade*2),rows=Math.min(profile.grid[1],5+data.grade);
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const u=2*col/(columns-1)-1,v=2*row/(rows-1)-1;
  if(index!==5&&u*u+v*v>1)continue;
  const a=Math.cos(u*Math.PI*n)*Math.cos(v*Math.PI*m)-Math.cos(u*Math.PI*m)*Math.cos(v*Math.PI*n);
  const radial=Math.hypot(u,v),angle=Math.atan2(v,u);
  let node,x0=cx+rx*u,y0=cy+ry*v;
  switch(index){
   case 0: // Standing waves on the surface of the navigation bowl.
    node=profile.kind==='nodes'?a:profile.kind==='rings'?Math.sin(radial*(n+data.bass)*6.28-beat):
     Math.sin(angle*3+radial*m*Math.PI-data.bass*2);
    break;
   case 1: // Aurora wrapped around the planet's curved limb.
    y0+=ry*(u*u*.72+.19*Math.sin(u*n+beat));
    node=Math.sin(v*7+u*(n+1)+beat+amplitude*Math.cos(u*m));break;
   case 2: // Water climbing the memory stem as two counterwound strands.
    x0=cx+rx*(.27*u+.46*Math.sin(v*m+beat+Math.PI*(col%2)));
    node=Math.sin(u*n+v*3-beat);break;
   case 3: // Three point sources under the nursery eggs interfere in the mud.
    node=Math.cos(Math.hypot(u+.52,v)*m*2-beat)+Math.cos(Math.hypot(u-.48,v)*n*2-beat);
    break;
   case 4: // An impulse runs along the Siltback's heat-sensitive gill comb.
    y0+=ry*.49*Math.cos(u*2.8);node=Math.sin(u*13-v*n-beat*2);break;
   case 5: // A live modem analyser with individual frequency bins.
    const bin=data.audio[(col+act)%4]??0;
    const height=Math.round((rows-1)*(.18+.75*bin)*(.72+.28*Math.cos(col*.6+beat)));
    if(act===0&&row!==rows-1-height)continue;
    if(act===1&&(row<rows-height-1||col%3===2))continue;
    if(act===2&&Math.abs(row-Math.floor(rows/2))!==Math.round(height*.5))continue;
    node=0;break;
   default: // Footfalls reach the keeper as paired pressure fronts.
    node=Math.sin((Math.hypot(u+.36,v*.56)+.16*Math.sin(u*m))*n*6-beat);
  }
  // On the second sounding the remembered impact interrupts the natural modes.
  // On the third a delayed answer arrives from the opposite side of each medium.
  if(act===1){
    if(index===1){x0=cx+rx*u; y0=cy+ry*(.30*u*u+.28*v);node=Math.sin(v*9+beat*2+.55*Math.sign(u));}
    if(index===2){x0=cx+rx*u*(.25+.62*Math.abs(v));node=Math.sin((v+.30*Math.abs(u))*11+beat);}
    if(index===3){x0=.598+.067*u;y0=.780+.029*v;node=Math.sin(13*Math.hypot(u*.8,v)-beat*2.8);}
    if(index===4){x0=.398+.031*Math.round((u+1));y0=.533+.028*v+.008*(u+1);node=Math.cos(v*5+u*3+beat);}
    if(index===6){x0=cx+rx*u;y0=cy+ry*(v+.28*u);node=Math.sin((v+.38*Math.abs(u))*8-beat);}
  }else if(act===2){
    const reply=Math.sin(beat+u*2.4),side=u<0?-1:1;
    if(index===1){x0=.49+rx*u;y0=cy+ry*(v*.42+side*.41+.30*u*u);node=Math.sin(v*6+side*beat);}
    if(index===2){x0=cx+rx*(side*.54+.20*reply+.16*v);node=Math.sin(v*m+side*beat);}
    if(index===3){x0=.603+.094*u;y0=.779+.027*v;node=Math.sin(Math.hypot(u-side*.79,v)*11-side*beat*2);}
    if(index===4){x0=.411+rx*(.49*u+side*.45);y0=.533+ry*(v*.63+u*.20);node=Math.sin(v*6+side*beat*2);}
    if(index===6){x0=cx+rx*u;y0=cy+ry*v;node=Math.cos((Math.hypot(u-side*.7,v*.6))*12-side*beat);}
  }
  if(Math.abs(node)>.31+amplitude*.26)continue;
  const x=ox+scale*x0,y=oy+scale*y0;
  if(x<0||x>1||y<0||y>1)continue;
  const symbol=cymaticInks[index][(col+row+act)%3];
  const cell=ansiCymaticCell({char:symbol,fg:ink,bg:null},{bands:data.audio,
    rms:data.audio?.[4]??0,time:data.time,x:col,y:row,intensity:.90,style:'water'});
  const layer=cell?.layers[0];
  if(layer)put.glyph(symbol,x,y,.012*Math.min(scale,2),ink,
    {alpha:Math.min(.94,amplitude*2.6)*power,hue:layer.hue,maxSize:22});
 }
 const pulse=Math.min(.38,amplitude*.53)*power;
 put.bloom(ox+scale*cx,oy+scale*cy,Math.min(.21,rx*scale),ink,pulse,
   {core:.035,halo:1.5,white:.12,falloff:'soft',aspect:Math.min(3,rx/ry)},data.grade);
}
// Invert the broad relief for native glyphs and bloom sources so they travel
// with the painted surface. The child eye stays on the convergence plane.
function surfaceSocket(u,v,index,gate,data){
 const metric=aperture((u-gate.x)/gate.span,(v-gate.y)/gate.span,index);
 const height=memoryHeight(u,v,index)*smooth((metric-.625)*.43);
 return [u-data.ray*.40*height,v+data.tilt*.42*height];
}
function lightAndMotes(put, state) {
  let scale = 1 / state.window, ox = .5 - state.x * scale, oy = .5 - state.y * scale;
  for (const {index, gate, data} of state.levels.slice(0, 3)) {
    if(data.prologue>=0&&data.prologue<7){paintCrossingInstruments(put,state);return;}
    if(data.style.paintCells&&gate.span*scale<2){
      data.style.paintCells(put,data,scale,ox,oy);
    }
    const actor=data.glyphActor??data.style.glyphActor??{scale:1,x:0,y:0};
    for(const cell of data.style.glyphs??[]){
      if(cell.pass>put.pass)continue;
      const p=data.rig?frikMotionPoint(cell.x,cell.y,data.rig,frikLook):[cell.x,cell.y];
      const [u,v]=surfaceSocket(actor.x+actor.scale*(actor.mirror?1-p[0]:p[0]),actor.y+actor.scale*p[1],index,gate,data);
      const x=ox+scale*u,y=oy+scale*v;
      const size=cell.size*scale*actor.scale;
      if(x<-.04||x>1.04||y<-.04||y>1.04||size<.003)continue;
      put.glyph(cell.glyph,x,y,size,cell.ink,{alpha:.66,maxSize:140});
    }
    if(data.effects){
      const aperture = gate.span * scale;
      const owner = 1 - smooth((aperture - .52) / .46);
      const [cx,cy]=cymaticRegions[index];
      const anchor=data.layout.mirrorBridge&&index===0?1-cx:cx;
      const [wx,wy]=surfaceSocket(anchor,cy,index,gate,data);
      paintMindCymatics(put,index,data,scale,ox+(wx-anchor)*scale,oy+(wy-cy)*scale,owner);
      for (const [lampIndex,lamp] of data.lights.entries()) {
        const {u,v,size,tint,shape}=lamp;
        const halo=size*scale;
        const power=lamp.power*data.levels[lampIndex]*owner*smooth((halo-.009)/.040);
        const [lx,ly]=surfaceSocket(u,v,index,gate,data);
        const sx=ox+scale*lx,sy=oy+scale*ly;
        if(power<=.02||sx<-.20||sx>1.20||sy<-.20||sy>1.20)continue;
        put.bloom(sx,sy,Math.min(.24,halo),'#'+tint.toString(16),power,shape,7);
      }
      const color='#'+data.style.lights[0].tint.toString(16);
      if (scale > .48 && owner > .02) {
        for (let i = 0; i < 5; i++) {
          const t = data.time * (.39 + i * .053) + i * 2.01;
          const px = ox + scale * (.5 + (.36 + .029 * i) * Math.sin(t));
          const py = oy + scale * (.46 + .285 * Math.cos(t * 1.56 + i));
          if (px > 0 && px < 1 && py > 0 && py < 1) {
            put.glyph(index === 4 ? '·' : i === 4 ? '✦' : '∙', px, py, .013 * Math.min(scale, 1.7), color,
              {alpha: owner * (.31 + .21 * Math.sin(t * 1.5)), maxSize: 14});
          }
        }
      }
    }
    ox += (gate.x - gate.span * .5) * scale;
    oy += (gate.y - gate.span * .5) * scale;
    scale *= gate.span;
  }
}

function paintStoryCaption(put,state){
  let level=0;
  while(level+1<state.levels.length&&state.levels[level].gate.span/state.levels[level].span>.83)level++;
  const {index}=state.levels[level];
  const chapter=state.levels[0].data.prologue;
  if(chapter>=0){
    const [title,line]=crossing[chapter];
    put.depthRegion(1,()=>{
      put(.035,.79,.93,.20,'#060d1cf0');
      put.textBlock(title.toUpperCase(),.06,.803,.88,.038,.030,'#f7ce94',{maxSize:26,maxLines:1});
      put.textBlock(line,.06,.856,.88,.119,.035,'#ebf3e8',{maxSize:29,maxLines:3});
    });
    return;
  }
  const {trip,rewinding,final}=state.narration;
  const act=frikStoryIndex(trip),line=final?frikMindScenes.length-1:index;
  const {rank,find}=state.narration;
  const trace=state.levels[0].trace;
  const side=find&&trace?.id===find?trace:null;
  const recovered=rewinding?null:recoveredReading(line,act,rank,state.narration.evidence,state.narration.answered);
  const view=side?traceReadings[side.id][rank>=2?1:0]:act===2&&!rewinding?keeperLine(line,state.narration.answered):recovered??frikStoryCaption(line,trip,rewinding);
  put.depthRegion(1,()=>{
    put(.035,.802,.93,.195,'#050b18ed');
    const title=side?'FRIKEN.GHOST  /  '+side.name.toUpperCase():
      rewinding?frikRewindTitles[act]:act===2?'THE KEEPER  /  WATERS TRANSCRIPTION':frikStoryTitles[act][line]+' · '+(act+1)+'/3';
    put.textBlock(title,.06,.807,.88,.035,.029,'#ffd890',{maxSize:26,maxLines:1});
    const carrier=side?'TRACE  /  '+side.concept.toUpperCase():act===2&&!rewinding?frikWaterSigns[line]+'    /    '+matrixStrip(line,3,act).split('   /   ').at(-1).toUpperCase():matrixStrip(line,rank,act);
    put.textBlock(carrier,.06,.846,.88,.034,.025,'#86d7d2',{maxSize:22,maxLines:1});
    put.textBlock(view,.06,.892,.88,.094,.034,'#e1ece4',{maxSize:30,maxLines:2});
  });
}

export function createFrikMindInk() {
  function sampler({levels, x, y, window}) {
    return (u, v) => packAnsiRgb(sampleLevel(levels, 0, x + (u - .5) * window, y + (v - .5) * window));
  }
  function sample(shot,time=0,effects=true,grade=8,columns=analysisColumns){
    return sampler(projectState(shot,time,effects,grade,columns));
  }
  const home = {scene:0, centerX:.5, centerY:.5, zoom:0};
  let resting=nativeGrades.map(({columns},i)=>
    sampler(projectState(home,0,false,i+1,columns)));
  return {
    sample,
    fitBase(pixelBounds){
      resting=nativeGrades.map((_,i)=>{
        const {columns}=frikMindFrameGrid(i+1,pixelBounds);
        return sampler(projectState(home,0,false,i+1,columns));
      });
    },
    base(u, v, _time, pass) {
      return resting[Math.min(pass, 8) - 1](u, v);
    },
    paintProjectedLights(put,state){
      lightAndMotes(put,state);paintStoryCaption(put,state);
    },
    paintLights(put,shot,time,effects,grade){
      const state=projectState(shot,time,effects,grade,put.grid.columns);
      lightAndMotes(put,state);
      paintStoryCaption(put,state);
    },
  };
}

export function renderFrikMindRows(artwork,spec,start,end,buffer){
  const {columns,rows,shot,time,effects,pass}=spec;
  const sample=artwork.sample(shot,time,effects,pass,columns);
  const length=(end-start)*columns;
  const words=buffer?.byteLength>=length*4?new Uint32Array(buffer,0,length):new Uint32Array(length);
  const u=new Float64Array(columns);
  for(let x=0;x<columns;x++)u[x]=(x+.5)/columns;
  for(let y=start,i=0;y<end;y++){
    const v=(y+.5)/rows;
    for(let x=0;x<columns;x++,i++)words[i]=ansiRgbWord(sample(u[x],v));
  }
  return words;
}
