import test from 'node:test';
import assert from 'node:assert/strict';
import {mountNeuralVoice} from './neural-voice.mjs';

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
