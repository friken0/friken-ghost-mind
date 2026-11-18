import {crossing} from './frik-crossing.mjs?v=first-crossing-4';
import {keeperLine,frikStoryCaption} from './ansi-frik-story.mjs?v=first-crossing-4';
import {traceTotal,recoveredReading,traceReadings,matrixStages,openFrikMatrix,frikTrace,traceInFocus,traceReturnCamera} from './frik-contact-matrix.mjs?v=first-crossing-4';
import {fractalPassOptions, mountAnsiFractal} from './ansi-fractal.mjs?v=frik-mind-46';
import {createFrikGpu} from './ansi-frik-gpu.mjs?v=first-crossing-4';
import {mountAnsiReviewCamera} from './ansi-review-camera.mjs?v=relay-15';
import {mountAudio} from './audio.mjs';
import {mountFrikStudyScore} from './frik-study-score.mjs?v=ensemble-1';
import {frikCameraRate,frikRewindRate,frikTraversalBoundary,frikMemoryNames,rewindArtTrip,endingReadSeconds} from './ansi-frik-story.mjs?v=first-crossing-4';
import {nextFrikMotionSeed,priorFrikMotionSeed} from './ansi-frik-motion.mjs?v=first-crossing-4';
import {createFrikMindInk, frikMindGrid, frikMindScenes,frikMindSceneSet, frikTeaserFlight, frikMindReview,frikMindFrameGrid} from './ansi-frik-mind.mjs?v=first-crossing-4';

const artwork = createFrikMindInk();

const byId = id => document.getElementById(id);
const stage = byId('stage'), rate = byId('rate'), details = byId('details'), status = byId('status');
const dive = byId('dive'), retreat = byId('return'), effectsButton = byId('effects');
const filteringButton=byId('filtering');
const musicButton=byId('music'),musicStatus=byId('music-status');
const memoryButtons=[...byId('memories').querySelectorAll('button')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const passButtons = new Map();
const scaleButtons = [...byId('scales').querySelectorAll('button')];
const exploreButton=byId('explore'),calibrate=byId('calibrate'),matrixReading=byId('matrix-reading'),guide=byId('trace-guide');
let storage;try{storage=window.localStorage;}catch{}
const matrix=openFrikMatrix(storage);
const answer=byId('answer');
SDUI.press(answer,()=>{if(!answer.hidden&&matrix.answer()){revision++;showMatrix();}});
let excursion,rejoin,listenKey='',listenTime=0,traceKey='',traceTime=0;
function showMatrix(){
  const activeRank=Math.max(matrix.rank,trip===2?3:trip);
  const canTune=matrix.ready&&activeRank===matrix.rank;
  const progress=activeRank===3?'online':matrix.ready?matrix.points+' evidence · calibration ready':matrix.points+' / '+matrix.needed+' evidence';
  matrixReading.textContent=matrixStages[activeRank]+' · '+progress+' · '+matrix.finds+'/'+traceTotal+' memory paths';
  answer.disabled=matrix.answered;
  answer.textContent=matrix.answered?'Two taps received':'Send two taps';
  calibrate.disabled=!canTune;
  calibrate.textContent=canTune?'Tune '+matrix.next:'Calibrate matrix';
}
window.addEventListener('storage',()=>{matrix.sync();showMatrix();revision++;});
SDUI.press(calibrate,()=>{if(matrix.tune()){showMatrix();revision++;}});
let shown;
let cap = 8, revision = 0, effects = true;
let filtering=false;
let scene = 0, depthZoom = 0, time = 0, elapsed = 0, start;
let trip=0,direction=1,endingAge=0,chapter=-1,readAge=0,readScene='',holdPose;
const nextReading=byId('next-reading'),chapterTitle=byId('chapter-title'),chapterCopy=byId('chapter-copy');
function enterReading(){
  mode='reading';readAge=0;holdPose=camera.frame(performance.now());updateControls();
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
const audio=mountAudio(document.querySelector('main'),{frame(bands){
  audioBands=musicWanted?bands:[0,0,0,0];audioRms=musicWanted?audio.info.rms:0;
  audioBeat++;
  stage.dataset.cymaticSignal=audioBands.map(n=>n.toFixed(3)).join(',');
  if(audioBeat%8===0&&musicWanted&&musicState==='playing')musicStatus.textContent=
    'FrikBridge · '+(stage.dataset.scoreTracks??'…')+' tracks · '+(stage.dataset.scoreNotes??'…')+' notes · live signal '+Math.round(Math.min(1,audioRms*12)*100)+'%';
}});
const score=mountFrikStudyScore(audio,stage,state=>{
  musicState=state;
  musicStatus.textContent=musicWanted?'InfiniGen · FrikBridge · '+state:'';
},{ensemble:true});
function setMusic(on){
  musicWanted=on;musicAsked=true;
  musicButton.textContent=on?'Music on':'Music off';
  musicButton.setAttribute('aria-pressed',String(on));
  if(on)void score.play();
  else{score.stop();audioBands=[0,0,0,0];audioRms=0;}
}
window.addEventListener('pagehide',()=>score.stop());
function musicGesture(event){
  if(!musicAsked&&!event.target.closest?.('#music,#dive,#replay'))setMusic(true);
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

SDUI.grant(document.querySelector('main'), 'Standalone Frik ANSI++ viewer');
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

function holdFlight() {
  heldRay = shot?.swing ?? 0;
  mode = 'hold';
}

function updateControls() {
  showMatrix();
  nextReading.hidden=chapter<0&&mode!=='reading';
  nextReading.disabled=!!excursion;
  dive.hidden=chapter>=0||mode==='reading';
  exploreButton.hidden=chapter>=0;
  exploreButton.textContent=excursion?'Rejoin stream':'Dilate time';
  exploreButton.disabled=mode==='rejoin';exploreButton.setAttribute('aria-pressed',String(!!excursion));
  guide.hidden=!excursion;
  dive.disabled=!!excursion;
  dive.textContent = mode === 'flight' ? 'Hold motion' : mode === 'hold' ? 'Resume motion' : 'Infinizoom';
  dive.setAttribute('aria-pressed', String(mode === 'flight'));
  retreat.disabled = mode === 'review' && !scene && !depthZoom && !shot?.zoom;
  effectsButton.textContent = effects ? 'Effects on' : 'Effects off';
  effectsButton.setAttribute('aria-pressed', String(effects));
  filteringButton.textContent=filtering?'Filtering on':'Filtering off';
  filteringButton.setAttribute('aria-pressed',String(filtering));
  for(const button of memoryButtons)button.setAttribute('aria-pressed',String(Number(button.dataset.memory)===trip));
  byId('memory-name').textContent=frikMemoryNames[trip];
}

const camera = mountAnsiReviewCamera(stage, {
  reliefAim: true,
  zoomRange: () => excursion ? [0,13] : mode !== 'review' || depthZoom !== 0 ? [-4, 13] : [0, 13],
  onChange(preset) {
    if(mode==='opening')mode='opening-inspect';
    if (mode === 'flight'||mode==='reading')holdFlight();
    if(mode==='rejoin'){mode='explore';rejoin=undefined;}
    for (const button of scaleButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.scale === preset));
    }
    updateControls();
  },
});

for (const button of scaleButtons) {
  SDUI.press(button, () => {
    const gate = frikMindSceneSet(routeTrip())[scene];
    camera.go(button.dataset.scale, [gate.x, gate.y]);
  });
}
function clearFrameReceipt(){
  shown=undefined;
  liveFrame=undefined;
  delete viewer.canvas.dataset.inkFrameGrid;
  delete viewer.canvas.dataset.inkFramePass;
}
function selectPass(value) {
  if(cap!==value)clearFrameReceipt();
  cap=value;
  for (const [pass, button] of passButtons) button.setAttribute('aria-pressed', String(pass === value));
  viewer.reveal();
}
for (const value of fractalPassOptions) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = value;
  button.setAttribute('aria-label', 'Pass ' + value);
  byId('render-passes').append(button);
  passButtons.set(value, button);
  SDUI.press(button, () => selectPass(value));
}
selectPass(8);
for(const button of memoryButtons)SDUI.press(button,()=>{
  chapter=-1;readScene='';excursion=rejoin=undefined;endingAge=0;trip=Number(button.dataset.memory);direction=1;mode='hold';start=undefined;elapsed=0;
  motionSeed=nextFrikMotionSeed(motionSeed);
  depthZoom=frikMindSceneSet(trip).slice(0,scene).reduce((sum,gate)=>sum+gate.zoom,0);
  camera.go('wide');clearFrameReceipt();updateControls();viewer.reveal();
});
// Stable specimen links open the same retained camera at a physical memory.
const specimen=new URLSearchParams(location.search).get('specimen');
const specimenScenes=new Map([['belljaw',3],['siltback',4],['uplink',5]]);
if(specimenScenes.has(specimen)){
  scene=specimenScenes.get(specimen);
  depthZoom=frikMindSceneSet(trip).slice(0,scene).reduce((sum,gate)=>sum+gate.zoom,0);
  mode='hold';
}
updateControls();

function reset() {
  chapter=-1;readScene='';
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
  updateControls();
}
SDUI.press(exploreButton,()=>{
  if(!excursion){
    const pose=camera.frame(performance.now());
    excursion={pose,mode};
    mode='explore';traceTime=0;traceKey='';
    const path=frikTrace(scene,routeTrip()===2);
    guide.textContent='Time ×⅛ · Hold to zoom, drag to pan, right-click to back out. '+(path?.hint??'The clearest side signals come from the bowl, satellite, nursery and modem.');
  }else{
    rejoin={pose:camera.frame(performance.now()),age:0};
    mode='rejoin';
  }
  updateControls();
});
SDUI.press(dive, () => {
  if(!musicAsked || (mode==='review' && musicWanted))setMusic(true);
  if (mode === 'flight') {
    holdFlight();
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
  updateControls();
});
SDUI.press(retreat, () => {
  reset();
  enterReading();
  revision++;
  clearFrameReceipt();
  viewer.reveal();
});
SDUI.press(byId('replay'), () => {
  if(!musicAsked || musicWanted)setMusic(true);
  reset();
  revision++;
  clearFrameReceipt();
  cap=8;
  for (const [pass, button] of passButtons) button.setAttribute('aria-pressed', String(pass === cap));
});
SDUI.press(effectsButton, () => {
  effects = !effects;
  updateControls();
});
SDUI.press(filteringButton,()=>{
  filtering=!filtering;
  updateControls();
});
SDUI.press(musicButton,()=>setMusic(!musicWanted));
reduced.addEventListener('change', () => {
  if (reduced.matches && mode === 'flight') holdFlight();
  updateControls();
});
function startCrossing(){
  reset();chapter=0;mode='opening';readAge=0;revision++;clearFrameReceipt();viewer.reveal();updateControls();
}
function proceed(){
  if(excursion)return;
  if(chapter>=0){
    chapter++;readAge=0;revision++;
    camera.set({zoom:0,centerX:.5,centerY:.5});
    if(chapter>=crossing.length){chapter=-1;readScene=trip+'/'+scene;enterReading();}
    else mode='opening';
  }else if(mode==='reading'){
    const pose=camera.frame(performance.now()),gate=frikMindSceneSet(trip)[scene];
    readScene=trip+'/'+scene;
    start={...pose,duration:Math.max(4,gate.duration*(1-pose.zoom/gate.zoom))};elapsed=0;mode='flight';
  }
  updateControls();
}
SDUI.press(nextReading,proceed);
SDUI.press(byId('restart-story'),startCrossing);
window.addEventListener('keydown',event=>{
  if(event.repeat||event.defaultPrevented||event.key!=='Enter'||event.target.closest?.('button,a,input')||nextReading.hidden)return;
  event.preventDefault();proceed();
});
camera.go();
if(!specimen&&!new URLSearchParams(location.search).has('gpu-audit')&&!new URLSearchParams(location.search).has('gpu-bench'))startCrossing();

let inkFrames;
try{inkFrames=createFrikGpu(document);}
catch(error){status.textContent='GPU field stopped · '+error.message.split('\n')[0];throw error;}
window.addEventListener('pagehide',()=>inkFrames.dispose());
if(new URLSearchParams(location.search).has('gpu-audit')){
 const {auditFrikGpu}=await import('./ansi-frik-gpu-audit.mjs?v=first-crossing-4');
 const proof=await auditFrikGpu(inkFrames,artwork,{deep:new URLSearchParams(location.search).get('gpu-audit')==='deep'});
 const output=document.createElement('output');output.id='gpu-audit';
 output.textContent=JSON.stringify(proof);document.querySelector('main').append(output);
}
if(new URLSearchParams(location.search).has('gpu-bench')){
 const {benchFrikFrames}=await import('./ansi-frik-frame-bench.mjs?v=first-crossing-4');
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
  put.cells=(key,source,x,y,w,h,depth)=>{
    if(x+w>0&&x<1&&y+h>0&&y<1)sourceSheets.unshift({source,x,y,w,h});
    cells(key,source,x,y,w,h,depth);
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
  const delta = previous ? Math.min(.07, (now - previous) / 1000) : 0;
  previous = now;
  const pose = camera.frame(now);
  if(!reduced.matches&&effects)time+=delta*(excursion ? .125 : 1);
  if(mode==='opening'||mode==='reading'){
    readAge+=delta;
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
      updateControls();
    }
  }else if (mode === 'flight') {
    elapsed=Math.max(0,elapsed+delta*frikCameraRate*(direction>0?.72:-frikRewindRate));
    shot = frikTeaserFlight(scene, elapsed, start,routeTrip());
    camera.set(shot);
    if(direction>0&&readScene!==trip+'/'+scene&&elapsed>=Math.min(.8,shot.duration*.09)){readScene=trip+'/'+scene;enterReading();}
  } else {
    const view=excursion||chapter>=0?{...pose,scene,depthZoom}:frikMindReview(scene, pose, depthZoom,routeTrip());
    if (view.scene !== scene) {
      motionSeed=view.depthZoom>depthZoom?nextFrikMotionSeed(motionSeed):priorFrikMotionSeed(motionSeed);
      scene = view.scene;
      depthZoom = view.depthZoom;
      heldRay = 0;
      camera.set(view);
    }
    shot = mode === 'hold' ? {...view, swing: heldRay + (pose.roomAim?.[0] ?? 0) * .8} : view;
  }
  shot.prologue=chapter;shot.beatAge=reduced.matches?7:readAge;
  const reading=mode==='opening'||mode==='reading';
  shot.roomAim=reduced.matches?[0,0]:reading?[(pose.roomAim?.[0]??0)+.061*Math.sin(readAge*.21),
   (pose.roomAim?.[1]??0)+.036*Math.sin(readAge*.14)]:pose.roomAim;
  const focus=mode==='explore'?traceInFocus(scene,routeTrip(),shot):null;
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
  answer.hidden=presentedScene!==5||chapter>=0;
  const prologue=presentedShot.prologue??-1;
  const section=prologue>=0?crossing[prologue][0]+' · '+(prologue+1)+'/'+crossing.length:frikMindScenes[presentedScene].name+' · Memory '+(presentedTrip+1)+'/3 · '+['Ghost inference','Voices aligned','Keeper transcription'][presentedTrip];
  if(chapterTitle.textContent!==section)chapterTitle.textContent=section;
  const currentFind=traceReadings[presentedShot.find];
  const spoken=currentFind?currentFind[presentedShot.matrixRank>=2?1:0]:prologue>=0?crossing[prologue][1]:presentedTrip===2&&!presentedShot.rewinding?keeperLine(presentedScene,presentedShot.answered):(!presentedShot.rewinding&&recoveredReading(presentedScene,presentedTrip,presentedShot.matrixRank,presentedShot.evidence,presentedShot.answered))||frikStoryCaption(presentedScene,presentedTrip,presentedShot.rewinding);
  if(chapterCopy.textContent!==spoken)chapterCopy.textContent=spoken;
  if(shown&&prologue<0&&!presentedShot.rewinding){
    const key=presentedTrip+'/'+presentedScene;
    listenTime=key===listenKey?listenTime+delta:0;listenKey=key;
    if(listenTime>=1.25){
      if(matrix.listen(presentedScene,presentedTrip))showMatrix();
      listenTime=-Infinity;
    }
  }
  if(shown&&mode==='explore'){
    const id=presentedShot.find;
    const path=frikTrace(presentedShot.scene,rewindArtTrip(presentedShot.scene,presentedTrip,presentedShot.rewinding)===2);
    let message;
    traceTime=id&&id===traceKey?traceTime+delta:0;traceKey=id;
    if(id&&traceTime>=.60){
      if(matrix.discover(id)){revision++;showMatrix();}
      message='Trace recorded · '+path.name+' · Back out to keep looking, or rejoin the stream.';
    }else{
      message='Time ×⅛ · Hold to zoom, drag to pan, right-click to back out. '+(path?.hint??'Try the bowl, satellite, nursery or modem.');
    }
    if(guide.textContent!==message)guide.textContent=message;
  }
  const pass=shown?.pass??(Number(viewer.canvas.dataset.samplePass)||0);
  const zoom=presentedShot.zoom+(shown?.depthZoom??depthZoom);
  const mult = zoom > 17 || zoom < -5 ? '2^' + zoom.toFixed(1) : (2 ** zoom).toFixed(zoom !== 0 && zoom < 8 ? 1 : 0);
  const pixels=shown?' · '+shown.columns+'×'+shown.rows+' px':'';
  const label = mult + '× / PASS ' + pass + ' OF ' + cap+pixels;
  if (details.textContent !== label) details.textContent = label;
  const {name}=frikMindScenes[presentedScene];
  const description=inkFrames.error?'GPU field stopped · '+inkFrames.error:
    prologue>=0?crossing[prologue][0]:name+' · '+(presentedTrip+1)+'/3'+(presentedShot.rewinding?' · rewinding':'');
  if (status.textContent !== description) status.textContent = description;
  const memoryLabel=(direction<0?frikMemoryNames[(trip+1)%3]+' · returning':frikMemoryNames[trip])+(presentedTrip!==trip?' · refining…':'');
  if(byId('memory-name').textContent!==memoryLabel)byId('memory-name').textContent=memoryLabel;
  if (retreat.disabled && shot.zoom > 0) retreat.disabled = false;
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
    updateControls();
  }
  if (!measuredAt) measuredAt = now;
  if (now - measuredAt >= 1000) {
    const completed=inkFrames.stats.completed-measuredFrames;
    const frameRate = Math.round(completed * 1000 / (now - measuredAt));
    rate.textContent = completed ? Math.min(frameRate,Math.round((composited-measuredComposites)*1000/(now-measuredAt))) + ' fps' : '— fps';
    Object.assign(viewer.canvas.dataset,{inkLayerCpuMs:layerMs.toFixed(2),
      inkLightCpuMs:lightMs.toFixed(2),inkViewerCpuMs:viewerMs.toFixed(2),inkGpuUploadedBytes:String(inkFrames.stats.bytesUploaded),
      samplingFilter:filtering?'linear':'nearest'});
    measuredFrames = inkFrames.stats.completed;measuredComposites=composited;
    measuredAt = now;
  }
}
requestAnimationFrame(tick);
