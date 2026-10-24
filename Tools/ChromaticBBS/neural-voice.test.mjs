import test from 'node:test';
import assert from 'node:assert/strict';
import {mountNeuralVoice,pickNeuralProfile,repairNeuralPreferences,neuralPlaybackPolicy} from './neural-voice.mjs';

test('neural warm-up is silent; completed PCM survives cancellation and uses exact cast/text keys',async()=>{
 const names=['Worker','cancelAnimationFrame'],saved=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const sent=[];let worker;
 try{
  globalThis.cancelAnimationFrame=()=>{};
  globalThis.Worker=class{constructor(){worker=this;}postMessage(m){sent.push(m);}terminate(){}};
  const voice=mountNeuralVoice({status(){},audio:{speaking(){}}});
  voice.warm();assert.deepEqual(sent.map(m=>m.type),['warm']);
  const first=voice.prepare('A real line.',{voice:'bm_george'}),id=sent.at(-1).id;
  worker.onmessage({data:{type:'audio',id,samples:new Float32Array([.2,-.2]),sampleRate:24000}});
  const pcm=await first;voice.stop();
  const cached=await voice.prepare('A real line.',{voice:'bm_george'});
  assert.equal(cached.samples,pcm.samples);assert.notEqual(cached.epoch,pcm.epoch);
  assert.equal(sent.filter(m=>m.type==='generate').length,1);
  const other=voice.prepare('A real line.',{voice:'af_heart'}),otherId=sent.at(-1).id;
  worker.onmessage({data:{type:'error',id:otherId,message:'Network unavailable'}});
  await assert.rejects(other,/Network unavailable/);
  const pending=voice.prepare('Paused during inference.',{voice:'bm_george'}),oldId=sent.at(-1).id;
  worker.onmessage({data:{type:'started',id:oldId}});voice.stop();await assert.rejects(pending,/cancelled/);
  worker.onmessage({data:{type:'audio',id:oldId,samples:new Float32Array([.1]),sampleRate:24000}});
  const recovered=await voice.prepare('Paused during inference.',{voice:'bm_george'});
  assert.equal(recovered.samples.length,1,'finished in-flight PCM is retained even after its reader cancelled');
  voice.stop();
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

test('stalled neural work releases its worker at the deadline and allows an explicit retry',async()=>{
 const names=['Worker','cancelAnimationFrame','setTimeout','clearTimeout'],saved=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 let deadline,workers=0,terminated=0,worker;
 try{
  globalThis.cancelAnimationFrame=()=>{};globalThis.setTimeout=(fn,ms)=>{assert.equal(ms,120000);deadline=fn;return 1;};globalThis.clearTimeout=()=>{};
  globalThis.Worker=class{constructor(){workers++;worker=this;}postMessage(m){this.last=m;}terminate(){terminated++;}};
  const voice=mountNeuralVoice({status(){},audio:{speaking(){}}});
  const pending=voice.prepare('Never returned.',{voice:'bm_george'});deadline();
  await assert.rejects(pending,/too long/);assert.equal(terminated,1);
  const retry=voice.prepare('Try again.',{voice:'bm_george'});assert.equal(workers,2);
  worker.onmessage({data:{type:'audio',id:worker.last.id,samples:new Float32Array([.2]),sampleRate:24000}});
  assert.equal((await retry).samples.length,1);voice.stop();
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});


test('look-ahead retains FIFO requests, deduplicates live text and reattaches to active warm inference',async()=>{
 const saved=new Map(['Worker','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker;const sent=[];
 try{globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){worker=this;}postMessage(m){sent.push(m);}terminate(){}};
 const voice=mountNeuralVoice({status(){},audio:{speaking(){}}});
 const first=voice.prepare('Opening.',{voice:'bm_george'}),firstId=sent.at(-1).id;
 worker.onmessage({data:{type:'started',id:firstId}});voice.stop();await assert.rejects(first,/cancelled/);
 const resumed=voice.prepare('Opening.',{voice:'bm_george'}),second=voice.prepare('Next.',{voice:'af_heart'}),secondId=sent.at(-1).id;
 const duplicate=voice.prepare('Next.',{voice:'af_heart'});
 assert.equal(sent.filter(x=>x.type==='generate').length,2,'active warm job and identical queued text each infer only once');
 worker.onmessage({data:{type:'audio',id:firstId,samples:new Float32Array([.1]),sampleRate:24000}});assert.equal((await resumed).samples.length,1);
 worker.onmessage({data:{type:'audio',id:secondId,samples:new Float32Array([.2]),sampleRate:24000}});assert.equal((await second).samples,(await duplicate).samples);
 voice.stop();
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});


test('neural compute lease covers queued and cancelled active inference until the last real job drains',async()=>{
 const saved=new Map(['Worker','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker;const states=[];
 try{globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){worker=this;}postMessage(m){this.last=m;}terminate(){}};
 const voice=mountNeuralVoice({status(){},work:x=>states.push(x),audio:{speaking(){}}});
 const a=voice.prepare('A.',{voice:'bm_george'}),aid=worker.last.id;
 worker.onmessage({data:{type:'started',id:aid}});
 const b=voice.prepare('B.',{voice:'bm_george'});assert.equal(states.at(-1).pending,2);
 voice.stop();await assert.rejects(a,/cancelled/);await assert.rejects(b,/cancelled/);
 assert.deepEqual(states.at(-1),{busy:true,pending:1,device:'wasm'},'the cancelled active GPU dispatch still owns headroom');
 worker.onmessage({data:{type:'audio',id:aid,samples:new Float32Array([.1]),sampleRate:24000}});
 assert.deepEqual(states.at(-1),{busy:false,pending:0,device:'wasm'});
 const n=states.length;await voice.prepare('A.',{voice:'bm_george'});assert.equal(states.length,n,'cached PCM never borrows GPU budget');voice.stop();
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});


test('same-text benchmark bypass performs fresh inference instead of timing a PCM cache hit',async()=>{
 const saved=new Map(['Worker','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker;const sent=[];
 try{globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){worker=this;}postMessage(m){sent.push(m);}terminate(){}};
 const voice=mountNeuralVoice({status(){},audio:{speaking(){}}});
 let promise=voice.prepare('Same words.',{voice:'am_fenrir'}),id=sent.at(-1).id;
 worker.onmessage({data:{type:'audio',id,samples:new Float32Array([.1]),sampleRate:24000}});await promise;
 await voice.prepare('Same words.',{voice:'am_fenrir'});assert.equal(sent.filter(m=>m.type==='generate').length,1);
 promise=voice.prepare('Same words.',{voice:'am_fenrir',reuse:false});id=sent.at(-1).id;
 assert.equal(sent.filter(m=>m.type==='generate').length,2);
 worker.onmessage({data:{type:'audio',id,samples:new Float32Array([.2]),sampleRate:24000}});assert.equal((await promise).samples[0],Math.fround(.2));voice.stop();
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

test('automatic selection cannot choose corrupted GPU audio just because it returns fastest',()=>{
 assert.equal(pickNeuralProfile([{profile:'cpu',rtf:.5},{profile:'compact',rtf:1.18},{profile:'gpu',rtf:.01}]),'cpu');
 assert.equal(pickNeuralProfile([{profile:'compact',rtf:.8},{profile:'gpu16',rtf:.001}]),'compact');
 assert.equal(pickNeuralProfile([{profile:'cpu',error:'failed'},{profile:'compact',rtf:1.1}]),'compact');
 assert.throws(()=>pickNeuralProfile([{profile:'gpu16',rtf:.1},{profile:'cpu',rtf:NaN}]),/No neural backend/);
});

test('fidelity policy invalidates old GPU timings without touching cast or game data',()=>{
 for(const performance of ['auto','gpu','gpu16','cpu','compact']){
  const prefs={performance,ghostNeural:'am_onyx',engine:'neural',autoTiming:{profile:'gpu16',at:123}};
  assert.equal(repairNeuralPreferences(prefs),true);
  assert.equal(prefs.performance,['gpu','gpu16'].includes(performance)?'auto':performance);
  assert.equal(prefs.autoTiming,null);assert.equal(prefs.ghostNeural,'am_onyx');
  assert.equal(prefs.fidelityPolicy,neuralPlaybackPolicy);assert.equal(repairNeuralPreferences(prefs),false);
 }
});


test('hidden-tab release frees the model worker while retaining exact completed PCM',async()=>{
 const saved=new Map(['Worker','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker,terminated=0,created=0;
 try{globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){worker=this;created++;}postMessage(m){this.last=m;}terminate(){terminated++;}};
 const v=mountNeuralVoice({status(){},audio:{speaking(){}}});const p=v.prepare('Keep.',{voice:'am_onyx'});
 worker.onmessage({data:{type:'audio',id:worker.last.id,samples:new Float32Array([.2]),sampleRate:24000}});const original=await p;
 v.release();assert.equal(terminated,1);assert.equal((await v.prepare('Keep.',{voice:'am_onyx'})).samples,original.samples);assert.equal(created,1);
 const next=v.prepare('New.',{voice:'am_onyx'});assert.equal(created,2);v.release();await assert.rejects(next,/cancelled/);
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
