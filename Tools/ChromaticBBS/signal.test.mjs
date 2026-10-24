import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {imageFrame,anchoredImageZoom,ImageCamera,imageWheelZoom} from './image-cinema.mjs';import {sdfExpression,createChapter,playView,playChoose,encodePlaySeed,decodePlaySeed,validateChapter,sdfBounds} from './chapters.mjs';import {validateSpecimen,specimenFinding} from './scanner.mjs';import {performingFace,dampedFlight} from './portrait.mjs';import {faceData,faceLibrary} from './face-data.mjs';import {choiceCommentary} from './commentary.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('./chapters/lot-forty-seven.json',import.meta.url)));
test('bounded Krex cover-fit camera cannot reveal empty edges across long pans and extreme aspect ratios',()=>{
 for(const [w,h]of [[320,180],[150,480],[1600,900]])for(const [iw,ih]of [[1280,768],[480,1280]])for(const time of [0,20,300,1e6])for(const focus of [[0,0],[1,1],[-1,-1]]){
 const f=imageFrame(w,h,iw,ih,{time,focus,zoom:2});assert.ok(f.x<=.00001&&f.y<=.00001);assert.ok(f.x+f.w>=w-.00001&&f.y+f.h>=h-.00001);}
 assert.throws(()=>imageFrame(0,1,1,1));assert.throws(()=>imageFrame(1,1,1,1,{zoom:NaN}));
});
test('wheel zoom preserves the image point under the cursor until an edge clamp is needed',()=>{
 const w=600,h=320,iw=1280,ih=768,f=imageFrame(w,h,iw,ih,{automatic:false}),point=[350,190],newScale=f.scale*1.3;
 const focus=anchoredImageZoom(f,w,h,point,newScale),g=imageFrame(w,h,iw,ih,{zoom:1.3,focus,automatic:false});
 assert.ok(Math.abs((point[0]-f.x)/f.scale-(point[0]-g.x)/g.scale)<1e-8);assert.ok(Math.abs((point[1]-f.y)/f.scale-(point[1]-g.y)/g.scale)<1e-8);
});
test('all eighteen scene specimens have distinct admitted geometry and useful bounded readings',()=>{
 assert.equal(new Set(pack.scenes.map(s=>JSON.stringify(s.artifact))).size,18);
 for(const s of pack.scenes){validateSpecimen(s.specimen);assert.ok(sdfExpression(s.artifact));assert.equal(s.specimen.readings.length,3);assert.ok(s.specimen.readings.every(r=>r.text.length>35));}
 const s=createChapter(pack),before=encodePlaySeed(s);validateSpecimen(pack.scenes[0].specimen);assert.equal(encodePlaySeed(s),before);
 const bad=structuredClone(pack.scenes[0].specimen);bad.readings[1].id=bad.readings[0].id;assert.throws(()=>validateSpecimen(bad));
});
test('surface performance retains recognizable anatomy and admits measured full-face modes rather than mouth rings',()=>{
 const shader=performingFace(faceLibrary.versions.find(v=>v.id==='v19.0').shader);for(const name of ['u_voiceBass','u_voiceMid','u_voiceAir','u_voiceAttack','jawMode','browMode','eyeKeep'])assert.ok(shader.includes(name));assert.ok(shader.includes('float returnWave=0.'));assert.ok(shader.includes('u_frameScale'));assert.equal(performingFace('old independent shader'),'old independent shader');
});
test('spoken outcomes never prepend the selected UI button label',()=>{
 let s=createChapter(pack);s=playChoose(s,'vote');const c=choiceCommentary(s.lastReceipt,s);assert.equal(c.playerAction,s.lastReceipt.label);assert.ok(!c.spoken.includes('You chose:'));assert.ok(!c.spoken.includes(s.lastReceipt.label));assert.equal(c.spoken,c.comment);assert.ok(playView(s).choices.length);
});

test('pointer exit preserves pose, eases zoom to full framing and resumes a bounded scan without recentring',()=>{
 const camera=new ImageCamera();camera.step(120);camera.zoomAt(2.5,[.88,-.65]);const before={zoom:camera.zoom,focus:[...camera.focus]};camera.leave();assert.equal(camera.zoom,before.zoom);assert.deepEqual(camera.focus,before.focus);
 let previous=camera.zoom;for(let i=0;i<60;i++){camera.step(1/60);assert.ok(camera.zoom<=previous+1e-9);assert.ok(camera.zoom>=1);previous=camera.zoom;}assert.ok(Math.abs(camera.zoom-1)<1e-9);assert.ok(camera.focus[0]>.7,'exit retains the chosen side instead of chasing the center');
 const atReturn=[...camera.focus];for(let i=0;i<3600;i++)camera.step(1/60);assert.notDeepEqual(camera.focus,atReturn);assert.ok(camera.focus.every(x=>Math.abs(x)<=1));assert.ok(camera.zoom>=1&&camera.zoom<=1.06);
});
test('re-entry and paused return retain the exact effective image pose',()=>{
 const camera=new ImageCamera();camera.zoomAt(2,[.6,.4]);camera.leave();camera.step(.35);const before={zoom:camera.zoom,focus:[...camera.focus]};camera.step(10,true);assert.equal(camera.zoom,before.zoom);assert.deepEqual(camera.focus,before.focus);camera.move([-.7,-.9]);assert.equal(camera.zoom,before.zoom);assert.deepEqual(camera.focus,before.focus);camera.step(1/60);assert.ok(Math.abs(camera.focus[0]-before.focus[0])<.16);camera.leave();assert.equal(camera.zoom,before.zoom);camera.step(1);assert.equal(camera.zoom,1);
});
test('wheel sensitivity doubles logarithmic zoom travel and normalizes line and page input',()=>{
 const old=Math.exp(100*.0014),next=imageWheelZoom(1,-100);assert.ok(Math.abs(Math.log(next)/Math.log(old)-2)<1e-12);assert.equal(imageWheelZoom(1,-1,1),imageWheelZoom(1,-16));assert.equal(imageWheelZoom(1,-1,2,500),3);assert.equal(imageWheelZoom(2,10000),1);assert.equal(imageWheelZoom(2,-10000),3);
});
test('every diagnostic finding supports a real choice and is retained with exact chapter replay',()=>{
 for(const scene of pack.scenes){assert.ok(scene.specimen.question);assert.equal(new Set(scene.specimen.readings.map(r=>r.choice)).size,3);for(const choice of scene.choices){const finding=specimenFinding(scene,choice.id);assert.ok(finding&&finding.implication.length>45);}}
 const bad=structuredClone(pack);bad.scenes[0].specimen.readings[0].choice='invented-action';assert.throws(()=>validateChapter(bad),/missing choice/);
 const s=createChapter(pack),before=encodePlaySeed(s);specimenFinding(pack.scenes[0],'vote');assert.equal(encodePlaySeed(s),before);const next=playChoose(s,'vote');assert.ok(next.world.facts.includes('reset-on-record'));assert.deepEqual(decodePlaySeed(encodePlaySeed(next)),next);
});

test('CSG framing bounds include connected reset wiring and preserve subtraction envelopes',()=>{
 const cradle=sdfBounds(pack.scenes[0].artifact);assert.ok(cradle.min[1]<=-.58);assert.ok(cradle.min[0]<=-.58&&cradle.max[0]>=.61);
 const box={op:'box',size:[.4,.3,.2]},cut={op:'subtract',a:box,b:{op:'sphere',radius:1}};assert.deepEqual(sdfBounds(cut),sdfBounds(box));
 for(const scene of pack.scenes){const b=sdfBounds(scene.artifact);assert.ok(b.min.every((x,i)=>Number.isFinite(x)&&x<b.max[i]));}
});


test('critically damped flight keeps velocity continuous through a beat and settles without overshoot',()=>{
 let x=0,v=0,prior=0,largest=0;
 for(let i=0;i<80;i++){
  const next=dampedFlight(x,v,1,.05,5);largest=Math.max(largest,Math.abs(next[0]-x));
  [x,v]=next;assert.ok(x>=prior&&x<=1);prior=x;
 }
 assert.ok(largest<.10&&x>.999);const initial=x;
 for(let i=0;i<80;i++){[x,v]=dampedFlight(x,v,0,.05,5);assert.ok(x>=0&&x<=initial);}
 assert.ok(x<.001);assert.deepEqual(dampedFlight(.2,.1,.9,0),[.2,.1]);
 assert.throws(()=>dampedFlight(0,0,1,NaN));
});
test('reversing the flight target cannot jump the pose at the input boundary',()=>{
 let x=.1,v=.3;const immediate=dampedFlight(x,v,-.2,0);assert.deepEqual(immediate,[x,v]);
 const next=dampedFlight(x,v,-.2,.05,5);assert.ok(Math.abs(next[0]-x)<.02);
 for(const dt of [.008,.016,.05,.1,10])assert.ok(dampedFlight(.2,-.1,.8,dt).every(Number.isFinite));
});

// A held inspection is temporary, including release while still over the art.
test('press zoom is reversible inside the image, preserves wheel zoom and cannot jump on release',()=>{
 const c=new ImageCamera();c.zoomAt(1.3,[.4,-.3]);c.press(true);
 for(let i=0;i<60;i++)c.step(1/60);
 assert.ok(c.effectiveZoom>2.39&&c.effectiveZoom<=3);
 const atRelease=c.effectiveZoom;c.press(false);assert.equal(c.effectiveZoom,atRelease);
 for(let i=0;i<90;i++)c.step(1/60);
 assert.ok(Math.abs(c.effectiveZoom-1.3)<.001);assert.equal(c.inside,true);
 c.press(true);c.step(.1);const frozen=c.effectiveZoom;c.step(2,true);assert.equal(c.effectiveZoom,frozen);
 c.leave();assert.equal(c.pressed,false);c.step(1);assert.ok(c.effectiveZoom<1.002);
});

test('completed Reply is selected once while historical skin remains separately available',()=>{
 assert.equal(faceData.version.id,'v20.0');
 assert.equal(faceLibrary.versions.filter(v=>v.id==='v20.0').length,1);
 assert.ok(faceLibrary.versions.some(v=>v.id==='v19.0'));
 assert.equal(faceData.version.geometryShaders.length,3);
 assert.equal(faceData.version.renderPolicy.fullResolution,true);
});
