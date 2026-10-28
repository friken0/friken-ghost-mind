import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {portraitCamera,portraitScissor} from '../InfiniEngineSite/ghost-renderer.js';
import {dreamFrameUniforms,dreamFace} from './dream-face.mjs';
import {mountSpeech} from './speech.mjs';

function portraitHarness(){
 let clock=0,instance;const host={dataset:{},addEventListener(){},removeEventListener(){}};
 const canvas={dataset:{},closest:()=>host,setAttribute(){},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:800})};
 class Renderer{constructor(){instance=this;this.motion=true;this.time=8;this.cymatics=[1,.6,.4,.8];}setVersion(v){this.version=v;}schedule(){}draw(){return this.expression?.(this.time);}resize(){}destroy(){}}
 const source=readFileSync(new URL('./portrait.mjs',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/export /g,'');
 const mount=new Function('GhostPortrait','faceData','faceLibrary','performance',source+'\nreturn mountPortrait;')(Renderer,{vertex:'',version:{id:'v20.0',title:'Reply',shader:'',defaults:{}}},{versions:[]},{now:()=>clock});
 const api=mount(canvas);return {api,canvas,draw(ms=33){clock+=ms;instance.time+=ms/1000;return instance.expression(instance.time);}};
}
test('actual portrait closure gates both mouths, freezes Else during Ghost and cancels interrupted camera waits',async()=>{
 const p=portraitHarness();p.api.speaker('ghost');p.api.talking(true);p.api.audioLevel(.5);p.api.companionTalking(true,{measured:true});p.api.companionLevel(1);
 let f=p.draw();assert.ok(f.talk>0);assert.equal(f.companionTalk,0);const wing=f.wingFlex,sway=f.serpentSway,time=f.serpentTime;
 for(let i=0;i<10;i++){p.api.audioLevel(.5);f=p.draw();assert.equal(f.companionTalk,0);assert.equal(f.wingFlex,wing);assert.equal(f.serpentSway,sway);assert.equal(f.serpentTime,time);}
 p.api.speaker('companion');p.api.companionTalking(true,{measured:true});p.api.companionLevel(.7);p.api.talking(true);f=p.draw();assert.equal(f.talk,0);assert.equal(f.jawOpen,0);assert.ok(f.companionTalk>.1);
 const camera=p.api.focusSpeaker('companion');p.draw(400);assert.ok(+p.canvas.dataset.companionFocus>0&&+p.canvas.dataset.companionFocus<1);p.draw(401);assert.equal(await camera,true);assert.equal(+p.canvas.dataset.companionFocus,1);
 p.api.companionTalking(false,{measured:true});p.api.companionLevel(1);f=p.draw();assert.equal(f.companionTalk,0,'late analyser data cannot reopen a silent mouth');
 const abort=new AbortController(),pending=p.api.focusSpeaker('ghost',{signal:abort.signal});abort.abort();assert.equal(await pending,false);
 const back=p.api.focusSpeaker('ghost');p.draw(900);assert.equal(await back,true);assert.equal(+p.canvas.dataset.companionFocus,0);
 p.api.destroy();
});
test('authored recording shots retain the requested look across speech cues and reject unsafe camera values',()=>{
 const p=portraitHarness();
 assert.throws(()=>p.api.stageShot({zoom:0}));assert.throws(()=>p.api.stageShot({yaw:NaN}));
 p.api.stageShot({yaw:-.64,pitch:.05,zoom:1.18,gazeX:-1});
 p.api.speaker('ghost');p.api.talking(true);p.api.audioLevel(.6);
 p.api.articulate({paragraph:'recorded-1',jaw:.5});p.draw(600);
 assert.equal(p.canvas.dataset.pose,'-0.640,0.050,0.000,1.180');
 p.api.articulate({paragraph:'recorded-2',jaw:.7});p.api.audioLevel(.6);p.draw(600);
 assert.equal(p.canvas.dataset.pose,'-0.640,0.050,0.000,1.180');
 p.api.releaseShot();p.api.articulate({paragraph:'normal-next',jaw:.4});p.api.audioLevel(.6);p.draw(50);p.draw(600);
 assert.notEqual(p.canvas.dataset.pose,'-0.640,0.050,0.000,1.180');p.api.destroy();
});
test('actual camera focuses the serpent, stays outside its head and shares exact field/scissor vectors throughout travel',()=>{
 const base=portraitCamera({headYaw:.18,headPitch:-.035}),close=portraitCamera({companionFocus:1});assert.ok(close.target[1]>.5);assert.ok(close.distance<base.distance*.25);assert.ok(close.eye[2]>.65,'camera remains in front of the forehead and serpent');
 for(const focus of [0,.1,.3,.5,.8,1]){
  const state={companionFocus:focus,headYaw:.38,headPitch:.05,headRoll:-.04,frameScale:.84},cam=portraitCamera(state),field=dreamFrameUniforms(state);
  for(const [name,expected]of [['cameraEye',cam.eye],['cameraForward',cam.forward],['cameraRight',cam.right],['cameraUp',cam.up]])for(let i=0;i<3;i++)assert.ok(Math.abs(field[name][i]-expected[i])<1e-6);
  for(const [width,height]of [[1280,800],[800,1280]])for(const bounds of dreamFace.geometryBounds){const [x,y,w,h]=portraitScissor(bounds,state,width,height,'rect');assert.ok(x>=0&&y>=0&&w>=0&&h>=0&&x+w<=width&&y+h<=height);}
 }
});
test('speech waits for each actor shot before device playback; cancellation during the move starts no voice',async()=>{
 const names=['window','document','speechSynthesis','SpeechSynthesisUtterance','requestAnimationFrame','cancelAnimationFrame'],saved=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let speech;const utterances=[],shots=[],pending=[],nodes=new Map(),voices=[{name:'Alex',lang:'en-US',voiceURI:'alex',localService:true},{name:'Samantha',lang:'en-US',voiceURI:'sam',localService:true}];
 const element=()=>({dataset:{},append(){},replaceChildren(){},addEventListener(){},pause(){},setAttribute(){},removeAttribute(){}}),step=()=>new Promise(r=>setTimeout(r,5));
 try{
  globalThis.document={hidden:false,createElement:element,createTextNode:()=>({})};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  globalThis.speechSynthesis={cancel(){},getVoices:()=>voices,addEventListener(){},speak(line){utterances.push(line);line.onstart();}};globalThis.window={speechSynthesis,SpeechSynthesisUtterance};
  const root={append(){},querySelector(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);}};
  speech=mountSpeech(root,{note(){},pulse(){},talking(){},audio:{speaking(){}},storage:{getItem:()=>JSON.stringify({engine:'device'})},beforeSpeaker(role,{signal}){shots.push(role);return new Promise(resolve=>{pending.push(resolve);signal.addEventListener('abort',()=>resolve(false),{once:true});});}});
  speech.speak({ghost:'Ghost asks.',companion:'Else answers.',ghostReply:'Ghost responds.'});await step();assert.deepEqual(shots,['ghost']);assert.equal(utterances.length,0);
  pending.shift()(true);await step();assert.equal(utterances[0].voice.voiceURI,'alex');utterances[0].onend();await new Promise(r=>setTimeout(r,80));assert.deepEqual(shots,['ghost','companion']);assert.equal(utterances.length,1,'Else waits for close-up');
  pending.shift()(true);await step();assert.equal(utterances[1].voice.voiceURI,'sam');utterances[1].onend();await new Promise(r=>setTimeout(r,80));assert.deepEqual(shots,['ghost','companion','ghost']);assert.equal(utterances.length,2,'Ghost waits for the return shot');pending.shift()(true);await step();assert.equal(utterances[2].voice.voiceURI,'alex');utterances[2].onend();await new Promise(r=>setTimeout(r,80));
  speech.speak({companion:'Cancelled before the camera arrives.'});await step();speech.stop();await step();assert.equal(utterances.length,3);
 }finally{speech?.stop();for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
