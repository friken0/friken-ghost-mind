import {GhostPortrait} from '../InfiniEngineSite/ghost-renderer.js';
import {dreamFace} from './dream-face.mjs';
import {faceData} from './face-data.mjs';

/** Explicit QA only: a calibration sample captured from real voice playback,
 * never an oscillator or a made-up spectrum. No work runs on module import. */
export function validateFaceVoiceSample(sample){
 if(!sample||!['neural-pcm','recorded-pcm'].includes(sample.source)||!Number.isFinite(sample.level)||sample.level<=.001||sample.level>1||!Array.isArray(sample.bands)||sample.bands.length!==4||!sample.bands.every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw Error('A measured, non-silent PCM calibration sample is required');
 return {source:sample.source,level:sample.level,bands:[...sample.bands],note:String(sample.note||'fixed replay of measured playback envelope')};
}

/** Runs the unchanged production geometry at a fixed pose/time. These are raw
 * WebGL RGBA pixels, before CSS compositing. Native dimensions are explicit;
 * no production resolution policy, SDF, camera or march count is modified. */
export function runFacePixelCheck({voiceSample,size=640,alphaOnly=false,onFrame=()=>{}}={}){
 const sample=alphaOnly?null:validateFaceVoiceSample(voiceSample);
 if(!Number.isInteger(size)||size<320||size>1024)throw Error('Pixel check native size must be320..1024');
 const canvas=document.createElement('canvas');
 canvas.getBoundingClientRect=()=>({left:0,top:0,width:size,height:size,right:size,bottom:size});
 const errors=[],renderer=new GhostPortrait(canvas,faceData.vertex,error=>errors.push(String(error)),{viewport:'rect',background:false,pixelRatio:1,profileEvery:0});
 renderer.motion=false;
 const fixed={...dreamFace.defaults,headYaw:0,headPitch:0,headRoll:0,headZoom:1,frameScale:.73,gearPhase:0,shift:0,shiftSerial:0,emergenceReveal:1};
 let state={...fixed};renderer.expression=()=>state;
 const read=()=>{renderer.draw(8);const data=new Uint8Array(size*size*4);renderer.gl.readPixels(0,0,size,size,renderer.gl.RGBA,renderer.gl.UNSIGNED_BYTE,data);const error=renderer.gl.getError();if(error)throw Error('Pixel probe WebGL error '+error);return data;};
 const rgba=(data,x,y)=>[...data.slice((y*size+x)*4,(y*size+x)*4+4)],coverage=data=>{let solid=0,partial=0,clear=0;for(let i=3;i<data.length;i+=4){const a=data[i];if(a===255)solid++;else if(a===0)clear++;else partial++;}return {solid,partial,clear};};
 try{
  renderer.setVersion(dreamFace);
  renderer.emergence=false;const raw=read();
  renderer.emergence=true;const settled=read();onFrame({kind:'settled',dataURL:canvas.toDataURL()});
  state={...fixed,emergenceReveal:.36};const opening=read();onFrame({kind:'opening',dataURL:canvas.toDataURL()});
  state={...fixed,emergenceReveal:0};const closed=read();
  state=sample?{...fixed,voiceEnergy:sample.level,voiceBass:sample.bands[0],voiceMid:sample.bands[1],voiceAir:sample.bands[2],voiceAttack:sample.bands[3]}:{...fixed};const voiced=read();if(sample)onFrame({kind:'measured-voice',dataURL:canvas.toDataURL()});
  // Only samples that are actual opaque geometry in the raw render count as
  // feathered contours. Bloom/fog over empty pixels cannot satisfy this gate.
  const feathered=[],seamSamples=[];let centre=null,centreDistance=Infinity,changed=0,sum=0,count=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=(y*size+x)*4;if(raw[i+3]!==255)continue;
   const distance=Math.hypot(x-size*.5,y-size*.5);
   if(settled[i+3]===255&&distance<centreDistance){centreDistance=distance;centre={x,y,rgba:rgba(settled,x,y)};}
   if(settled[i+3]>=12&&settled[i+3]<=243&&feathered.length<12&&!feathered.some(p=>Math.hypot(p.x-x,p.y-y)<size*.10))feathered.push({x,y,rgba:rgba(settled,x,y),rawAlpha:raw[i+3]});
   if(x<size*.22||x>size*.78||y<size*.23||y>size*.77||settled[i+3]<160)continue;
   const delta=(Math.abs(voiced[i]-settled[i])+Math.abs(voiced[i+1]-settled[i+1])+Math.abs(voiced[i+2]-settled[i+2]))/3;sum+=delta;count++;if(delta>=3)changed++;
   // Blue/gold relief already present in silence, away from the eye rows.
   const inlay=(settled[i+2]>settled[i]*1.6&&settled[i+2]>55)||(settled[i]>settled[i+2]*1.6&&settled[i]>70);
   if(inlay&&delta>=4&&Math.abs(y-size*.62)>size*.055&&seamSamples.length<10&&!seamSamples.some(p=>Math.hypot(p.x-x,p.y-y)<size*.05))seamSamples.push({x,y,silent:rgba(settled,x,y),voiced:rgba(voiced,x,y),meanAbsRGB:+delta.toFixed(2)});
  }
  const result={schema:'friktal.face-pixels.v1',revision:dreamFace.revision,nativeSize:[canvas.width,canvas.height],source:sample,centre,feathered,alpha:{raw:coverage(raw),settled:coverage(settled),opening:coverage(opening),closed:coverage(closed)},speech:sample?{changedPixels:changed,comparedPixels:count,meanAbsRGB:+(sum/Math.max(1,count)).toFixed(3),inlaySamples:seamSamples}:null,errors};
  if(errors.length||!centre||feathered.length<4||result.alpha.closed.clear!==size*size||result.alpha.opening.solid>=result.alpha.settled.solid||sample&&(changed<100||seamSamples.length<3))throw Error('Face pixel acceptance failed: '+JSON.stringify(result));
  return result;
 }finally{renderer.destroy();}
}

/** Static camera review, not audio evidence. Uses the exact production fields,
 * native pixels and conservative scissors for wide / travelling / Else shots. */
export function renderSpeakerFraming({size=640,onFrame=()=>{}}={}){
 if(!Number.isInteger(size)||size<320||size>1024)throw Error('Bounded framing review size required');
 const canvas=document.createElement('canvas');canvas.getBoundingClientRect=()=>({left:0,top:0,width:size,height:size,right:size,bottom:size});
 const errors=[],renderer=new GhostPortrait(canvas,faceData.vertex,error=>errors.push(String(error)),{viewport:'rect',background:false,pixelRatio:1,profileEvery:0});renderer.motion=false;
 let state={...dreamFace.defaults,headYaw:.18,headPitch:-.035,headRoll:0,frameScale:.84,emergenceReveal:1,serpentTime:8};renderer.expression=()=>state;
 try{renderer.setVersion(dreamFace);for(const [kind,focus]of [['Ghost / wide',0],['Camera travel / silent',.5],['Else / close-up',1]]){state={...state,companionFocus:focus};renderer.draw(8);onFrame({kind,dataURL:canvas.toDataURL()});}if(errors.length)throw Error(errors.join('; '));return {revision:dreamFace.revision,shots:3,nativeSize:[canvas.width,canvas.height],audio:'silent camera review only'};}finally{renderer.destroy();}
}
