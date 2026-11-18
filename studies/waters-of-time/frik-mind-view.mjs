import {mountNativeResponseHost} from './native-response-host.mjs';
import {boardTerminalPage,boardTerminalGrid,mountAnsiTerminal} from './ansi-terminal.mjs?v=terminal-score-1';
import {ansiSceneProgram} from './ansi-scenes.mjs';
import {chapterSeconds,crossingFlight,crossingHints,flightTraceAt} from './lancing-route.mjs?v=lancing-2';
import {crossing} from './frik-crossing.mjs?v=nursery-stance-1';
import {keeperLine,frikStoryCaption} from './ansi-frik-story.mjs?v=nursery-stance-1';
import {traceTotal,recoveredReading,traceReadings,openFrikMatrix,frikTrace,traceInFocus,traceReturnCamera} from './frik-contact-matrix.mjs?v=brood-1';
import {fractalPassOptions, mountAnsiFractal} from './ansi-fractal.mjs?v=brood-1';
import {createFrikGpu} from './ansi-frik-gpu.mjs?v=nursery-stance-1';
import {mountAnsiReviewCamera} from './ansi-review-camera.mjs?v=brood-1';
import {mountAudio} from './audio.mjs';
import {mountFrikStudyScore} from './frik-study-score.mjs?v=score-windows-1';
import {frikCameraRate,frikRewindRate,frikTraversalBoundary,rewindArtTrip,endingReadSeconds} from './ansi-frik-story.mjs?v=nursery-stance-1';
import {nextFrikMotionSeed,priorFrikMotionSeed} from './ansi-frik-motion.mjs?v=lancing-2';
import {createFrikMindInk, frikMindGrid, frikMindScenes,frikMindSceneSet, frikTeaserFlight, frikMindReview,frikMindFrameGrid} from './ansi-frik-mind.mjs?v=nursery-stance-1';

const artwork = createFrikMindInk();

const byId = id => document.getElementById(id);
const screen=document.querySelector('main'),stage=byId('stage'),status=byId('status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const chapterTitle=byId('chapter-title'),chapterCopy=byId('chapter-copy');
let storage;try{storage=window.localStorage;}catch{}
const matrix=openFrikMatrix(storage);
let settings=false,expanded=false,focus=null,chromeKey='',fps='— FPS',guide='',frameDetails='';
const terminal=mountAnsiTerminal({canvas:document.createElement('canvas'),cursor:false,animation:true});
const host=mountNativeResponseHost(screen,{terminal,gridForRect:boardTerminalGrid,maxFps:20,
  label:'GhostLINK / The Lancing: Human Hubris',onAction:storyAction,onFocus:id=>{focus=id;}});
host.element.append(stage);
host.focus();
let fitKey='';
function storyFrame(){
  const fit=host.rect(),grid=host.grid,{columns:C,rows:R}=grid;
  // The frame and the art occupy the same character rectangle as a board room.
  const margin=expanded?0:C<70?1:3,top=expanded?1:3;
  const h=Math.max(3,Math.min(R-top-(settings?8:2),Math.floor((C-2*margin-2)*7/24)));
  const w=Math.min(C-2*margin-2,Math.round(h*24/7));
  const col=1+Math.floor((C-w-2)/2),row=Math.max(top,Math.floor((R-h-(settings?7:1))/2));
  const geometry=[fit.left,fit.top,fit.cellWidth,fit.cellHeight,col,row,w,h].join('/');
  if(fitKey!==geometry){
    fitKey=geometry;
    const root=screen.getBoundingClientRect();
    Object.assign(stage.style,{left:(fit.left-root.left+col*fit.cellWidth)+'px',
      top:(fit.top-root.top+row*fit.cellHeight)+'px',width:w*fit.cellWidth+'px',height:h*fit.cellHeight+'px'});
  }
  const next=bookmark?'Resume story':mode==='hold'?'Resume':chapter>=0||mode==='reading'?'Continue':'';
  const canAdvance=!settings&&!!next&&!excursion&&!returning&&(!routeFlight||bookmark);
  const hint=guide||(chapter>=0?crossingHints[chapter]:'');
  const key=JSON.stringify([geometry,settings,expanded,focus,canAdvance,next,chapterTitle.textContent,fps,
    settings&&[effects,filtering,cap,musicWanted,musicState,frameDetails,hint,mode,matrix.score,matrix.ready,matrix.answered,scene,chapter]]);
  if(key===chromeKey)return;
  chromeKey=key;
  const {box,put,rule,action,hotspots,cells,tracks,inkStyles}=boardTerminalPage(grid,focus);
  const title='THE LANCING: HUMAN HUBRIS';
  if(row>1)put(row-1,col+1,'GHOSTLINK',6);
  if(row>1)put(row-1,col+w-8,fps.padStart(8),8);
  box(row,col,w+2,h+2,title,6);
  action('flight-screen',row,col+w-7,7,'I',expanded?'↙':'↗',{label:expanded?'Restore frame':'Full screen'});
  const foot=row+h+1;
  if(canAdvance)action('continue',foot,col+2,17,'Enter',next,{primary:true});
  else if(!settings&&excursion)action('explore',foot,col+2,19,'T','Rejoin stream');
  action('settings',foot,col+w-13,12,'F2',settings?'Close':'Setup',{fg:7,label:settings?'Close settings':'Terminal settings'});
  if(settings){
    const y=foot+1,mid=Math.min(C-21,Math.max(22,Math.floor(C*.48)));
    rule(y,'TERMINAL SETTINGS');
    action('passes',y+1,3,19,'Q',cap+' passes');
    action('filtering',y+1,mid,21,'Z','Filter '+(filtering?'on':'off'));
    action('effects',y+2,3,19,'E','Effects '+(effects?'on':'off'));
    action('music',y+2,mid,21,'V','Music '+(musicWanted?'on':'off'));
    if(chapter<0)action('explore',y+3,3,19,'T',excursion?'Rejoin stream':'Dilate time');
    if(chapter<0&&matrix.ready)action('calibrate',y+3,mid,20,'C','Tune matrix');
    if(chapter<0&&scene===5&&!matrix.answered)action('answer',y+4,3,20,'A','Send two taps');
    if(chapter>=0||!matrix.ready){
      const audioLabel=musicState==='playing'?stage.dataset.scoreTracks+' tracks / '+Math.round(stage.dataset.scoreSeconds)+'s':
        musicState==='synthesizing'?'Preparing score':musicState==='idle'?'':musicState;
      put(y+3,mid,audioLabel,7);
    }
    put(y+4,mid,matrix.finds+'/'+traceTotal+' paths  '+matrix.score+'/100',7);
    put(y+5,3,hint||frameDetails,8);
  }
  const page=ansiSceneProgram({cells:cells.map((cell,i)=>({...cell,column:i%C+1,row:Math.floor(i/C)+1})),tracks},grid);
  host.show({grid,text:page.text,hotspots,settingsOpen:settings,animation:{tracks,ink:inkStyles}},{immediate:true,preserve:true});
}
async function storyAction(id){
  if(id==='settings'||id==='settings-close'){settings=id==='settings'&&!settings;focus=null;}
  else if(id==='flight-screen'){
    expanded=!expanded;
    if(expanded&&!document.fullscreenElement&&screen.requestFullscreen){try{await screen.requestFullscreen();}catch{/* Embedded board keeps the expanded cell frame. */}}
    else if(!expanded&&document.fullscreenElement)await document.exitFullscreen();
  }else if(id==='continue'){if(mode==='hold'&&!bookmark)resumeFlight();else proceed();}
  else if(id==='music')setMusic(!musicWanted);
  else if(id==='passes'){cap=fractalPassOptions[cap%fractalPassOptions.length];clearFrameReceipt();viewer.reveal();}
  else if(id==='effects')effects=!effects;
  else if(id==='filtering')filtering=!filtering;
  else if(id==='explore')toggleExploration();
  else if(id==='calibrate'&&matrix.tune())revision++;
  else if(id==='answer'&&matrix.answer())revision++;
  storyFrame();
}
document.addEventListener('fullscreenchange',()=>{expanded=!!document.fullscreenElement;chromeKey='';});
window.addEventListener('storage',()=>{matrix.sync();revision++;});

let excursion,rejoin,listenKey='',listenTime=0,traceKey='',traceTime=0;
let shown;
let cap = 8, revision = 0, effects = true;
let filtering=false;
let scene = 0, depthZoom = 0, time = 0, elapsed = 0, start;
let routeFlight,bookmark,returning,flightFind='';
let trip=0,direction=1,endingAge=0,chapter=-1,readAge=0,readScene='',holdPose;

function enterReading(){
  mode='reading';readAge=0;holdPose=camera.frame(performance.now());
}
function readDrift(base,age){
  if(reduced.matches)return base;
  const span=2**-base.zoom,phase=scene*.72+Math.max(0,chapter)*.32;
  return {...base,zoom:base.zoom+.026*(1-Math.cos(age*.19)),
   centerX:base.centerX+.010*span*(Math.sin(age*.16+phase)-Math.sin(phase)),
   centerY:base.centerY+.007*span*(Math.cos(age*.13+phase)-Math.cos(phase))};
}
const routeTrip=()=>rewindArtTrip(scene,trip,direction<0);
let audioBands=[0,0,0,0],audioRms=0,musicWanted=false,musicAsked=false,musicState='idle',audioBeat=0;
const audio=mountAudio(document.querySelector('main'),{musicLevel:1,frame(bands){
  audioBands=musicWanted?bands:[0,0,0,0];audioRms=musicWanted?audio.info.rms:0;
  audioBeat++;
  stage.dataset.cymaticSignal=audioBands.map(n=>n.toFixed(3)).join(',');
}});
const score=mountFrikStudyScore(audio,stage,state=>{musicState=state;},{ensemble:true});
function setMusic(on){
  musicWanted=on;musicAsked=true;
  if(on)void score.play();
  else{score.stop();audioBands=[0,0,0,0];audioRms=0;}
}
window.addEventListener('pagehide',()=>score.stop());
function musicGesture(event){
  if(!musicAsked&&!settings&&event.key!=='F2')setMusic(true);
}
document.querySelector('main').addEventListener('pointerdown',musicGesture,{capture:true});
document.querySelector('main').addEventListener('keydown',musicGesture,{capture:true});
let motionSeed=crypto.getRandomValues(new Uint32Array(1))[0];
let mode='review',shot,heldRay=0,composited=0;
let pixelBounds,liveFrame;
let sourceMarks=[],sourceSheets=[];
let layerMs=0,lightMs=0,viewerMs=0;
function measurePixels(){
  const ratio=devicePixelRatio||1;
  const rect=viewer.canvas.getBoundingClientRect();
  const bounds={width:Math.max(1,Math.round((rect.width||stage.clientWidth)*ratio)),
    height:Math.max(1,Math.round((rect.height||stage.clientHeight)*ratio))};
  if(pixelBounds?.width===bounds.width&&pixelBounds.height===bounds.height)return;
  pixelBounds=bounds;
  artwork.fitBase(bounds);
  clearFrameReceipt();
}


const viewer = mountAnsiFractal(stage, {
  frameBudget: 5,
  host: {
    rect() {
      const rect = stage.getBoundingClientRect();
      return {
        left: rect.left + stage.clientLeft, top: rect.top + stage.clientTop,
        cellWidth: stage.clientWidth / frikMindGrid.width, cellHeight: stage.clientHeight / frikMindGrid.height,
      };
    },
  },
});
measurePixels();
const resizeObserver=new ResizeObserver(measurePixels);
resizeObserver.observe(stage);
resizeObserver.observe(viewer.canvas);
window.addEventListener('resize',measurePixels);

function rememberRoute(){
  if(returning){bookmark=returning.mark;returning=undefined;mode=chapter>=0?'opening-inspect':'hold';}
  if(!bookmark&&!excursion&&['opening','reading','flight','crossing'].includes(mode)){
    bookmark={pose:camera.frame(performance.now()),mode,scene,depthZoom,chapter,travel:shot?.travel??0};
    mode=chapter>=0?'opening-inspect':'hold';

  }
}
function returnToStory(){
  if(!bookmark)return false;
  const from=camera.frame(performance.now()),goal=bookmark.pose;
  const aligned=Math.abs(from.zoom-goal.zoom)<.0001&&Math.hypot(from.centerX-goal.centerX,from.centerY-goal.centerY)<.0001*2**-goal.zoom;
  returning={from,age:aligned?2.35:0,mark:bookmark};
  scene=bookmark.scene;depthZoom=bookmark.depthZoom;mode='return-story';return true;
}
function holdFlight() {
  heldRay = shot?.swing ?? 0;
  mode = 'hold';
}

const camera = mountAnsiReviewCamera(stage, {
  reliefAim: true,onInspect:rememberRoute,
  bounded:false,
  zoomRange: () => excursion ? [0,13] : mode !== 'review' || depthZoom !== 0 ? [-4, 13] : [0, 13],
  onChange(preset) {
    if(mode==='opening')mode='opening-inspect';
    if (mode === 'flight'||mode==='reading')holdFlight();
    if(mode==='rejoin'){mode='explore';rejoin=undefined;}
  },
});

function clearFrameReceipt(){
  shown=undefined;
  liveFrame=undefined;
  delete viewer.canvas.dataset.inkFrameGrid;
  delete viewer.canvas.dataset.inkFramePass;
}
function reset() {
  bookmark=returning=routeFlight=undefined;flightFind='';chapter=-1;readScene='';
  excursion=rejoin=undefined;
  motionSeed=nextFrikMotionSeed(motionSeed);
  scene = 0;
  trip=0;direction=1;endingAge=0;
  depthZoom = 0;
  time = 0;
  elapsed = 0;
  start = undefined;
  shot = undefined;
  mode = 'review';
  heldRay = 0;
  camera.go('wide');

}
function toggleExploration(){
  if(!excursion){
    const pose=camera.frame(performance.now());
    excursion={pose,mode};
    mode='explore';traceTime=0;traceKey='';
    const path=frikTrace(scene,routeTrip()===2);
    guide='Time ×⅛ · Hold to zoom, drag to pan, right-click to back out. '+(path?.hint??'The clearest side signals come from the bowl, satellite, nursery and modem.');
  }else{
    rejoin={pose:camera.frame(performance.now()),age:0};
    mode='rejoin';
  }

}
function resumeFlight(){
  if(!musicAsked || (mode==='review' && musicWanted))setMusic(true);
  if(returnToStory())return;
  if (mode === 'flight') {
    rememberRoute();
  } else if(direction<0||endingAge>0){
    mode='flight';
  } else {
    const pose = camera.frame(performance.now());
    const gate = frikMindSceneSet(routeTrip())[scene];
    const remaining = Math.abs(gate.zoom - pose.zoom);
    start = {...pose, duration: pose.zoom === 0 ? gate.duration :
      Math.max(2.3, Math.min(gate.duration, remaining / .44))};
    elapsed = 0;
    if (reduced.matches && mode === 'review') {
      // A single settled arrival provides a starting point to inspect.
      scene = (scene + 1) % frikMindScenes.length;
      depthZoom += gate.zoom;
      camera.go('wide');
      mode = 'hold';
    } else mode = 'flight';
  }
  viewer.reveal();

}
reduced.addEventListener('change', () => {
  if (reduced.matches && mode === 'flight') holdFlight();

});
function startCrossing(){
  reset();chapter=0;mode='opening';readAge=0;revision++;clearFrameReceipt();viewer.reveal();
}
function proceed(){
  if(excursion||returning||returnToStory()||routeFlight)return;
  if(chapter>=0){
    matrix.hearChapter(chapter);
    routeFlight={start:camera.frame(performance.now()),age:0};
    mode='crossing';
  }else if(mode==='reading'){
    const pose=camera.frame(performance.now()),gate=frikMindSceneSet(trip)[scene];
    readScene=trip+'/'+scene;
    start={...pose,duration:Math.max(4,gate.duration*(1-pose.zoom/gate.zoom))};elapsed=0;mode='flight';
  }

}
// Old gallery links resolve to the same first chapter as the board door.
const entry=new URL(location.href);
if(entry.searchParams.has('specimen')){
  entry.searchParams.delete('specimen');history.replaceState(history.state,'',entry);
}
startCrossing();
const requested=['earth','receiver','yard','launch','lancing','scan','cutter','waters'].indexOf(entry.searchParams.get('chapter'));
if(requested>=0)chapter=requested;
if(entry.searchParams.get('chapter')==='nursery'){
  chapter=-1;
  scene=frikMindScenes.findIndex(gate=>gate.name==='The Flooded Caldera');
  depthZoom=frikMindSceneSet(trip).slice(0,scene).reduce((sum,gate)=>sum+gate.zoom,0);
  readScene=trip+'/'+scene;
  enterReading();
}
storyFrame();
if(!entry.searchParams.has('gpu-audit')&&!entry.searchParams.has('gpu-bench'))void score.prepare();

let inkFrames;
try{inkFrames=createFrikGpu(document);}
catch(error){status.hidden=false;status.textContent='GPU field stopped · '+error.message.split('\n')[0];throw error;}
window.addEventListener('pagehide',()=>inkFrames.dispose());
if(new URLSearchParams(location.search).has('gpu-audit')){
 const {auditFrikGpu}=await import('./ansi-frik-gpu-audit.mjs?v=brood-1');
 const proof=await auditFrikGpu(inkFrames,artwork,{deep:new URLSearchParams(location.search).get('gpu-audit')==='deep'});
 const output=document.createElement('output');output.id='gpu-audit';
 output.textContent=JSON.stringify(proof);document.querySelector('main').append(output);
}
if(new URLSearchParams(location.search).has('gpu-bench')){
 const {benchFrikFrames}=await import('./ansi-frik-frame-bench.mjs?v=brood-1');
 const proof=await benchFrikFrames(inkFrames,document,frikMindFrameGrid(8,pixelBounds),status);
 const output=document.createElement('output');output.id='gpu-bench';output.hidden=true;
 output.textContent=JSON.stringify(proof);document.querySelector('main').append(output);
}
const framePose = {zoom: 0, centerX: .5, centerY: .5, viewport: {x:1,y:1}};
function inspectLiveInk(point){
  if(!liveFrame)return [];
  const {raster,spec}=liveFrame;
  const columns=Math.min(11,raster.width),rows=Math.min(3,Math.ceil(raster.height/2));
  const height=Math.min(rows*2,raster.height);
  const left=Math.max(0,Math.min(raster.width-columns,Math.floor(point.x*raster.width)-5));
  const top=Math.max(0,Math.min(raster.height-height,Math.floor(point.y*raster.height)-3));
  const raw=inkFrames.read(left,top,columns,height),pixels=new Uint8Array(raw.length);
  for(let y=0;y<height;y++)pixels.set(raw.subarray((height-1-y)*columns*4,(height-y)*columns*4),y*columns*4);
  const color=(col,row)=>{
    const offset=(Math.min(height-1,row)*columns+col)*4;
    return '#'+((pixels[offset]<<16)|(pixels[offset+1]<<8)|pixels[offset+2]).toString(16).padStart(6,'0');
  };
  const cells=Array.from({length:columns*rows},(_,i)=>{
    const col=i%columns,row=Math.floor(i/columns)*2;
    return {glyph:'▀',fg:color(col,row),bg:color(col,row+1)};
  });
  const bands=[{label:'P'+spec.pass+' colour / '+spec.columns+'×'+spec.rows,columns,rows,cells}];
  const sheet=sourceSheets.find(sheet=>point.x>=sheet.x&&point.x<sheet.x+sheet.w&&
    point.y>=sheet.y&&point.y<sheet.y+sheet.h);
  if(sheet){
    const {source}=sheet,cols=Math.min(11,source.columns),count=Math.min(3,source.rows);
    const x=Math.max(0,Math.min(source.columns-cols,Math.floor((point.x-sheet.x)/sheet.w*source.columns)-5));
    const y=Math.max(0,Math.min(source.rows-count,Math.floor((point.y-sheet.y)/sheet.h*source.rows)-1));
    bands.push({label:'Native BBS cells',columns:cols,rows:count,
      cells:Array.from({length:cols*count},(_,i)=>source.cells[(y+Math.floor(i/cols))*source.columns+x+i%cols])});
  }
  const marks=sourceMarks.slice().sort((a,b)=>
    Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y)).slice(0,7);
  if(marks.length)bands.push({label:'Authored glyphs',columns:marks.length,rows:1,
    cells:marks.map(mark=>({glyph:mark.glyph,fg:mark.ink,bg:'#000000'}))});
  return bands;
}
const overlay=(_age,put)=>{
  const pass=put.pass,grid=frikMindFrameGrid(pass,pixelBounds);
  const frame=inkFrames.use({shot,time,effects,pass,revision,stamp:frameStamp+'/'+pass,depthZoom,...grid});
  liveFrame=frame;
  if(frame){
    shown=frame.spec;
    const started=performance.now();
    put.layer(frame.raster);
    layerMs=performance.now()-started;
    if(frame.spec.stamp!==lastPresented){
      composited++;lastPresented=frame.spec.stamp;
      viewer.canvas.dataset.inkFrameGrid=frame.spec.columns+'×'+frame.spec.rows;
      viewer.canvas.dataset.inkFramePass=String(frame.spec.pass);
      viewer.canvas.dataset.inkRenderer='gpu';
      viewer.canvas.dataset.inkGpuMs=frame.stats.gpuMs.toFixed(2);
      viewer.canvas.dataset.inkGpuCompleted=String(frame.stats.completed);
      viewer.canvas.dataset.inkSubmitCpuMs=frame.stats.submitMs.toFixed(2);
      viewer.canvas.dataset.inkSceneClock=frame.spec.time.toFixed(3);
      const pose=frame.spec.shot;
      viewer.canvas.dataset.inkCamera=[pose.scene,pose.centerX,pose.centerY,pose.zoom].join(',');
      viewer.canvas.dataset.inkMemory=String(pose.trip??0);
    }
  }
  const lit=frame?.spec??{shot,time,effects};
  const lightTime=mode==='review'&&!shot.zoom?time:lit.time;
  const started=performance.now();
  sourceMarks.length=0;sourceSheets.length=0;
  const glyph=put.glyph;
  put.glyph=(symbol,x,y,size,ink,style)=>{
    if([...symbol].length===1)sourceMarks.push({glyph:symbol,x,y,ink});
    glyph(symbol,x,y,size,ink,style);
  };
  const cells=put.cells;
  put.cells=(key,source,x,y,w,h,depth,opacity)=>{
    if(x+w>0&&x<1&&y+h>0&&y<1)sourceSheets.unshift({source,x,y,w,h});
    cells(key,source,x,y,w,h,depth,opacity);
  };
  if(frame?.spec.stamp===frameStamp+'/'+put.pass)artwork.paintProjectedLights(put,frame.projected);
  else artwork.paintLights(put,{...lit.shot,audio:[...audioBands,audioRms]},lightTime,effects,cap);
  lightMs=performance.now()-started;
};

let lastPresented,previous=0,measuredAt=0,measuredFrames=inkFrames.stats.completed,measuredComposites=0,frameStamp='';
function tick(now) {
  requestAnimationFrame(tick);
  if (document.hidden) {
    previous = 0;
    measuredFrames = inkFrames.stats.completed;measuredComposites=composited;
    measuredAt = now;
    return;
  }
  const frameDelta = previous ? Math.min(.07, (now - previous) / 1000) : 0;
  const delta=settings?0:frameDelta;
  previous = now;
  const pose = camera.frame(now);
  if(!reduced.matches&&effects)time+=frameDelta*(excursion ? .125 : 1);
  if((chapter>=0&&!bookmark)||mode==='reading')readAge+=delta;
  if(mode==='return-story'){
    returning.age+=delta;
    const q=reduced.matches?1:Math.min(1,returning.age/2.35),mark=returning.mark;
    const view=traceReturnCamera(returning.from,mark.pose,q);
    shot={...view,scene,depthZoom};camera.set(view);
    if(q===1){
      mode=mark.mode;bookmark=returning=undefined;flightFind='';
      if(mode==='opening'||mode==='reading'){holdPose=view;readAge=chapter>=0?readAge:0;proceed();}

    }
  }else if(mode==='crossing'){
    routeFlight.age+=delta;
    // Let the aft-window witness and the departing colony finish their actions.
    const wait=chapter===4?Math.max(0,17-(readAge-routeFlight.age)):chapter===3?Math.max(0,4-(readAge-routeFlight.age)):0;
    const t=reduced.matches?1:Math.min(1,Math.max(0,routeFlight.age-wait)/chapterSeconds[chapter]);
    const view=crossingFlight(chapter,t,routeFlight.start,time);
    shot={...view,scene,depthZoom,travel:t};camera.set(view);
    if(t>=1){
      chapter++;routeFlight=undefined;readAge=0;revision++;
      const wide={zoom:0,centerX:.5,centerY:.5};camera.set(wide);shot={...wide,scene,depthZoom};
      if(chapter>=crossing.length){chapter=-1;readScene=trip+'/'+scene;enterReading();}
      else mode='opening';

    }
  }else if(mode==='opening'||mode==='reading'){
    const stationary=mode==='opening'?{zoom:0,centerX:.5,centerY:.5}:holdPose;
    const drift=readDrift(stationary,readAge);
    shot={...drift,scene,depthZoom};camera.set(drift);
  }else if(mode==='rejoin'){
    rejoin.age+=delta;
    const t=reduced.matches?1:Math.min(1,rejoin.age/2.6);
    const view=traceReturnCamera(rejoin.pose,excursion.pose,t);
    camera.set(view);shot={...view,scene,depthZoom};
    if(t>=1){
      const prior=excursion.mode;
      excursion=rejoin=undefined;
      mode=prior==='reading'?'reading':'flight';
      if(prior==='reading'){holdPose=view;readAge=0;}
      if(prior!=='reading'&&prior!=='flight'&&direction>0&&!endingAge){
        start={...view,duration:Math.max(2.5,frikMindSceneSet(trip)[scene].duration*(1-view.zoom/frikMindSceneSet(trip)[scene].zoom))};
        elapsed=0;
      }

    }
  }else if (mode === 'flight') {
    elapsed=Math.max(0,elapsed+delta*frikCameraRate*(direction>0?.72:-frikRewindRate));
    shot = frikTeaserFlight(scene, elapsed, start,routeTrip());
    camera.set(shot);
    if(direction>0&&readScene!==trip+'/'+scene&&elapsed>=Math.min(.8,shot.duration*.09)){readScene=trip+'/'+scene;enterReading();}
  } else {
    const view=excursion||chapter>=0||bookmark?{...pose,scene,depthZoom}:frikMindReview(scene, pose, depthZoom,routeTrip());
    if (view.scene !== scene) {
      motionSeed=view.depthZoom>depthZoom?nextFrikMotionSeed(motionSeed):priorFrikMotionSeed(motionSeed);
      scene = view.scene;
      depthZoom = view.depthZoom;
      heldRay = 0;
      camera.set(view);
    }
    shot = mode === 'hold' ? {...view, swing: heldRay + (pose.roomAim?.[0] ?? 0) * .8} : view;
  }
  shot.prologue=chapter;shot.travel??=bookmark?.travel??0;shot.beatAge=reduced.matches?(chapter===4?13:7):readAge;
  const reading=mode==='opening'||mode==='reading';
  shot.roomAim=reduced.matches?[0,0]:reading?[(pose.roomAim?.[0]??0)+.061*Math.sin(readAge*.21),
   (pose.roomAim?.[1]??0)+.036*Math.sin(readAge*.14)]:pose.roomAim;
  const discovery=chapter>=0&&mode==='opening-inspect'?flightTraceAt(chapter,shot):null;
  if(discovery&&flightFind!==discovery.id){if(matrix.discover(discovery.id))revision++;}
  if(discovery)guide='Recorded · '+discovery.name;
  else if(flightFind&&chapter>=0)guide='Inspect · '+crossingHints[chapter];
  flightFind=discovery?.id??'';
  const focus=discovery??(mode==='explore'?traceInFocus(scene,routeTrip(),shot):null);
  shot.find=focus?.id;shot.matrixRank=Math.max(matrix.rank,trip===2?3:trip);shot.evidence=matrix.evidence;shot.answered=matrix.answered;
  shot.motionSeed=motionSeed;
  shot.trip=trip;shot.rewinding=direction<0;shot.audio=[...audioBands,audioRms];
  const stamp = [revision, scene, shot.centerX, shot.centerY, shot.zoom, shot.done, shot.swing,
    effects, effects ? time : 0, pose.roomAim?.[0],pose.roomAim?.[1],shot.find,shot.matrixRank,cap,motionSeed,trip,direction].join('/');
  frameStamp=stamp;
  inkFrames.poll();
  const lightBeat=mode==='review'&&!shot.zoom&&effects?time:liveFrame?.spec.time;
  const overlayKey=[frameStamp,lightBeat,effects,filtering,audioBeat].join('/');
  const started=performance.now();
  viewer.update({
    id: 'frik-mind/' + revision, ...frikMindGrid, ...framePose, aim: pose.aim,
    row: 1, column: 1, passes: cap, plane: true, worldOverlay: true, quadrantInk: true,
    animated:false,instantPasses:true,sample:()=>0,sampleArtBatch:({out,from,count,across})=>out.fill(0,from*across*2,count*across*2),nativeInkGrid:true,pixelBounds,
    smoothInk:filtering,smoothSprites:filtering,
    inspectOverlay:inspectLiveInk,
    retainCameraProgress:true,retainResize:true,overlay,staticOverlay:true,overlayKey,
  }, true, now / 1000, reduced.matches);
  viewerMs=performance.now()-started;

  const presentedShot=shown?.shot??shot;
  const presentedTrip=presentedShot.trip??trip;
  const presentedScene=presentedShot.done?(presentedShot.scene+1)%frikMindScenes.length:presentedShot.scene;

  const prologue=presentedShot.prologue??-1;
  const section=prologue>=0?crossing[prologue][0]+' · '+(prologue+1)+'/'+crossing.length:frikMindScenes[presentedScene].name+' · Memory '+(presentedTrip+1)+'/3 · '+['Ghost inference','Voices aligned','Keeper transcription'][presentedTrip];
  if(chapterTitle.textContent!==section)chapterTitle.textContent=section;
  const currentFind=traceReadings[presentedShot.find];
  const spoken=discovery?discovery.line:currentFind?currentFind[presentedShot.matrixRank>=2?1:0]:prologue>=0?crossing[prologue][1]:presentedTrip===2&&!presentedShot.rewinding?keeperLine(presentedScene,presentedShot.answered):(!presentedShot.rewinding&&recoveredReading(presentedScene,presentedTrip,presentedShot.matrixRank,presentedShot.evidence,presentedShot.answered))||frikStoryCaption(presentedScene,presentedTrip,presentedShot.rewinding);
  if(chapterCopy.textContent!==spoken)chapterCopy.textContent=spoken;
  if(shown&&prologue<0&&!presentedShot.rewinding){
    const key=presentedTrip+'/'+presentedScene;
    listenTime=key===listenKey?listenTime+delta:0;listenKey=key;
    if(listenTime>=1.25){
      matrix.listen(presentedScene,presentedTrip);
      listenTime=-Infinity;
    }
  }
  if(shown&&mode==='explore'){
    const id=presentedShot.find;
    const path=frikTrace(presentedShot.scene,rewindArtTrip(presentedShot.scene,presentedTrip,presentedShot.rewinding)===2);
    let message;
    traceTime=id&&id===traceKey?traceTime+delta:0;traceKey=id;
    if(id&&traceTime>=.60){
      if(matrix.discover(id)){revision++;}
      message='Trace recorded · '+path.name+' · Back out to keep looking, or rejoin the stream.';
    }else{
      message='Time ×⅛ · Hold to zoom, drag to pan, right-click to back out. '+(path?.hint??'Try the bowl, satellite, nursery or modem.');
    }
    if(guide!==message)guide=message;
  }
  const pass=shown?.pass??(Number(viewer.canvas.dataset.samplePass)||0);
  const zoom=presentedShot.zoom+(shown?.depthZoom??depthZoom);
  const mult = zoom > 17 || zoom < -5 ? '2^' + zoom.toFixed(1) : (2 ** zoom).toFixed(zoom !== 0 && zoom < 8 ? 1 : 0);
  const pixels=shown?' · '+shown.columns+'×'+shown.rows+' px':'';
  const label = mult + '× / PASS ' + pass + ' OF ' + cap+pixels;
  frameDetails=label;
  if(inkFrames.error){status.hidden=false;status.textContent='GPU field stopped · '+inkFrames.error;}
  storyFrame();
  const lastInward=direction>0&&shot.atTurn;
  if(mode==='flight'&&lastInward)endingAge+=delta;
  if(mode==='flight'&&(direction<0?elapsed<=0:(shot.done||shot.atTurn))&&(!lastInward||endingAge>=endingReadSeconds(trip))){
    endingAge=0;
    const turnStart=lastInward?start:undefined;
    const next=frikTraversalBoundary({scene,trip,direction,depthZoom},frikMindSceneSet(routeTrip()));
    const overshoot=direction>0&&next.direction>0?Math.max(0,elapsed-shot.duration):0;
    ({scene,trip,direction,depthZoom,elapsed}=next);
    if(direction<0)depthZoom=frikMindSceneSet(routeTrip()).slice(0,scene).reduce((sum,gate)=>sum+gate.zoom,0);
    if(lastInward&&turnStart)elapsed=turnStart.duration;
    elapsed+=overshoot;
    if(next.seedStep>0)motionSeed=nextFrikMotionSeed(motionSeed);
    else if(next.seedStep<0)motionSeed=priorFrikMotionSeed(motionSeed);
    camera.set(direction<0?frikTeaserFlight(scene,elapsed,turnStart,routeTrip()):{zoom:0,centerX:.5,centerY:.5});
    start=turnStart;

  }
  if (!measuredAt) measuredAt = now;
  if (now - measuredAt >= 1000) {
    const completed=inkFrames.stats.completed-measuredFrames;
    const frameRate = Math.round(completed * 1000 / (now - measuredAt));
    fps = completed ? Math.min(frameRate,Math.round((composited-measuredComposites)*1000/(now-measuredAt))) + ' FPS' : '— FPS';
    Object.assign(viewer.canvas.dataset,{inkLayerCpuMs:layerMs.toFixed(2),
      inkLightCpuMs:lightMs.toFixed(2),inkViewerCpuMs:viewerMs.toFixed(2),inkGpuUploadedBytes:String(inkFrames.stats.bytesUploaded),
      samplingFilter:filtering?'linear':'nearest'});
    measuredFrames = inkFrames.stats.completed;measuredComposites=composited;
    measuredAt = now;
  }
}
requestAnimationFrame(tick);
