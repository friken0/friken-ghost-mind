import test from 'node:test';
import assert from 'node:assert/strict';
import {createNeuralPcmCache,mountNeuralVoice,pickNeuralProfile,repairNeuralPreferences,neuralPlaybackPolicy,createNeuralAssetCache,neuralRelease,neuralCast,neuralDefaultCastPolicy,applyNeuralDefaultCast} from './neural-voice.mjs';

test('Michael is the natural default; legacy Onyx migrates once and subsequent explicit casts survive',()=>{
 const release=JSON.stringify(neuralRelease),fresh={engine:'neural',performance:'auto'};assert.equal(applyNeuralDefaultCast(fresh),true);assert.equal(fresh.ghostNeural,'am_michael');assert.equal(fresh.companionNeural,'af_heart');assert.equal(fresh.castPolicy,neuralDefaultCastPolicy);assert.equal(neuralCast.ghost[0][0],'am_michael');assert.equal(neuralCast.companion[0][0],'af_heart');assert.equal(applyNeuralDefaultCast(fresh),false);
 const legacy={castPolicy:'cpu-fenrir-2026-10-22',ghostNeural:'am_onyx',engine:'neural',performance:'cpu'};assert.equal(applyNeuralDefaultCast(legacy),true);assert.equal(legacy.ghostNeural,'am_michael');assert.equal(legacy.performance,'cpu');
 fresh.ghostNeural='am_onyx';fresh.ghostNeuralExplicit=true;assert.equal(applyNeuralDefaultCast(fresh),false);assert.equal(fresh.ghostNeural,'am_onyx','a later listener selection survives the next reload');
 fresh.companionNeural='af_bella';assert.equal(applyNeuralDefaultCast(fresh),false);assert.equal(fresh.companionNeural,'af_bella','a valid female companion selection also survives reload');
 const explicit={castPolicy:'previous-policy',ghostNeural:'am_onyx',ghostNeuralExplicit:true};applyNeuralDefaultCast(explicit);assert.equal(explicit.ghostNeural,'am_onyx');
 for(const voice of ['am_fenrir','bm_lewis','am_adam']){const p={ghostNeural:voice};applyNeuralDefaultCast(p);assert.equal(p.ghostNeural,voice,'another selected cast is not mistaken for the old automatic Onyx default');}
 assert.equal(JSON.stringify(neuralRelease),release,'cast changes do not change model/runtime/revision cache URLs');
});

function memoryAssetStorage(){
 const stores=new Map();return {stores,async open(name){if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return {async match(key){return entries.get(key)?.clone();},async put(key,response){const body=await response.arrayBuffer();entries.set(key,new Response(body,{status:response.status,headers:response.headers}));},async delete(key){return entries.delete(key);}};}};
}
test('immutable runtime, voice, model and WASM assets survive a fresh cache client and work offline',async()=>{
 const storage=memoryAssetStorage(),events=[],urls=[neuralRelease.runtime,'https://huggingface.co/'+neuralRelease.model+'/resolve/'+neuralRelease.revision+'/onnx/model_quantized.onnx','https://huggingface.co/'+neuralRelease.model+'/resolve/'+neuralRelease.revision+'/voices/am_onyx.bin','https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.wasm'];let requests=0;
 const config={...neuralRelease},online=createNeuralAssetCache(config,{caches:storage,fetch:async()=>{requests++;return new Response('actual asset',{headers:{'content-length':'12'}});},report:e=>events.push(e)});
 for(const url of urls)assert.equal(await (await online.fetch(url)).text(),'actual asset');await online.flush();assert.equal(requests,4);
 const offline=createNeuralAssetCache(config,{caches:storage,fetch:async()=>{throw Error('offline');},report:e=>events.push(e)});
 for(const url of urls)assert.equal(await (await offline.fetch(url+'?appBuild=next')).text(),'actual asset');
 assert.equal((await offline.fetch(urls[1],{method:'HEAD'})).headers.get('content-length'),'12');
 assert.equal(events.filter(e=>e.state==='hit').length,5);assert.ok(events.some(e=>e.state==='download'&&e.loaded===12));
 assert.equal(offline.keyFor('https://huggingface.co/'+config.model+'/resolve/main/onnx/model.onnx'),null,'mutable revisions cannot contaminate the pinned cache');
 assert.equal(offline.keyFor('https://unrelated.test/session.json'),null,'player data is not an asset');
});
test('old transformer cache downloads are adopted by exact pinned URL without redownloading',async()=>{
 const storage=memoryAssetStorage(),url='https://huggingface.co/'+neuralRelease.model+'/resolve/'+neuralRelease.revision+'/onnx/model_quantized.onnx';
 await (await storage.open('transformers-cache')).put(url,new Response('existing weight'));
 const cache=createNeuralAssetCache(neuralRelease,{caches:storage,fetch:async()=>{throw Error('must not fetch');}});
 assert.equal(await (await cache.fetch(url)).text(),'existing weight');
});
test('cache denial and quota failure leave usable downloads and report the actual limitation',async()=>{
 for(const caches of [{async open(){throw Error('private storage denied');}},{async open(){return {async match(){},async put(){throw Error('quota full');}};}}]){
  const events=[],cache=createNeuralAssetCache(neuralRelease,{caches,fetch:async()=>new Response('usable'),report:e=>events.push(e)});
  assert.equal(await (await cache.fetch(neuralRelease.runtime)).text(),'usable');await cache.flush();assert.ok(events.some(e=>['unavailable','write-failed'].includes(e.state)));
 }
});
test('failed targeted cache repair is reported and never clears unrelated caches',async()=>{
 const events=[],cache=createNeuralAssetCache(neuralRelease,{caches:{async open(){return {async delete(){throw Error('read only');}};}},report:e=>events.push(e)});
 assert.equal(await cache.remove(neuralRelease.runtime),false);assert.equal(events.at(-1).state,'clear-failed');
});
test('only a non-silent completed audio clock returns a played receipt; stale, cancelled and early ends do not',async()=>{
 const saved=new Map(['cancelAnimationFrame','requestAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let source;const progress=[];
 const context={state:'running',currentTime:0,createBuffer(channels,length,rate){return {duration:length/rate,copyToChannel(){}};},createAnalyser(){return {getFloatTimeDomainData(pcm){pcm.fill(.1);},disconnect(){},connect(){}};},createBufferSource(){source={connect(){},disconnect(){},start(){},stop(){}};return source;}},audio={async unlock(){return {context};},graph:()=>({voice:{}}),speaking(){},voiceReceipt(){}};
 try{
  globalThis.cancelAnimationFrame=()=>{};globalThis.requestAnimationFrame=()=>1;
  const voice=mountNeuralVoice({status(){},audio}),message={epoch:0,samples:new Float32Array(2400).fill(.1),sampleRate:24000};
  await assert.rejects(voice.play({...message,samples:new Float32Array(2400)},{role:'ghost'}),/silent PCM/);
  let pending=voice.play(message,{role:'ghost',onProgress:f=>progress.push(f)});await new Promise(resolve=>setImmediate(resolve));source.onended();await assert.rejects(pending,/before its PCM clock/);assert.ok(!progress.includes(1));
  progress.length=0;pending=voice.play(message,{role:'ghost',onProgress:f=>progress.push(f)});await new Promise(resolve=>setImmediate(resolve));context.currentTime=.1;source.onended();assert.equal((await pending).played,true);assert.equal(progress.at(-1),1);
  pending=voice.play(message,{role:'ghost'});await new Promise(resolve=>setImmediate(resolve));voice.stop();assert.equal((await pending).played,false);await assert.rejects(voice.play(message,{role:'ghost'}),/cancelled/);
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

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
 assert.deepEqual(states.at(-1),{busy:true,pending:1,cachedClips:0,device:'wasm'},'the cancelled active GPU dispatch still owns headroom');
 worker.onmessage({data:{type:'audio',id:aid,samples:new Float32Array([.1]),sampleRate:24000}});
 assert.deepEqual(states.at(-1),{busy:false,pending:0,cachedClips:0,device:'wasm'});
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

test('prepared and cached PCM retain their requested actor and cannot play as a different chosen cast',async()=>{
 const saved=new Map(['Worker','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker,created=0;
 try{
  globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){created++;worker=this;}postMessage(m){this.last=m;}terminate(){}};
  const voice=mountNeuralVoice({status(){},audio:{speaking(){}}});
  await assert.rejects(voice.prepare('Explicit actor required.',{voice:'unknown'}),/explicit supported neural voice/);assert.equal(created,0);
  const pending=voice.prepare('Keep the actor.',{voice:'am_michael',speed:.94}),id=worker.last.id;
  worker.onmessage({data:{type:'audio',id,samples:new Float32Array([.2]),sampleRate:24000}});
  const original=await pending,cached=await voice.prepare('Keep the actor.',{voice:'am_michael',speed:.94});assert.equal(original.voice,'am_michael');assert.equal(cached.voice,'am_michael');assert.equal(cached.speed,.94);assert.equal(cached.samples,original.samples);
  await assert.rejects(voice.play(cached,{role:'companion',voice:'af_heart'}),/does not match the selected voice/);voice.stop();
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

test('all seven reply passages survive stop and replay with zero additional inference jobs',async()=>{
 const saved=new Map(['Worker','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker;const sent=[];
 try{
  globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){worker=this;}postMessage(m){sent.push(m);this.last=m;}terminate(){}};
  const voice=mountNeuralVoice({status(){},audio:{speaking(){}}}),passages=Array.from({length:7},(_,i)=>({text:'Authored passage '+i+'.',voice:i===6?'af_heart':'am_michael',speed:i===6?.98:.94})),original=[];
  for(const passage of passages){const pending=voice.prepare(passage.text,passage),id=worker.last.id;worker.onmessage({data:{type:'audio',id,samples:new Float32Array(24000*4).fill(.1),sampleRate:24000}});original.push(await pending);}
  assert.equal(sent.filter(m=>m.type==='generate').length,7);voice.stop();
  for(let i=0;i<passages.length;i++){const replay=await voice.prepare(passages[i].text,passages[i]);assert.equal(replay.samples,original[i].samples);assert.equal(replay.voice,passages[i].voice);assert.notEqual(replay.epoch,original[i].epoch);}
  assert.equal(sent.filter(m=>m.type==='generate').length,7,'replaying the seventh unit cannot cyclically evict the first');voice.stop();
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

test('the predictive reply PCM cache still evicts beyond its192-passage bound',async()=>{
 const saved=new Map(['Worker','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker;const sent=[];
 try{
  globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){worker=this;}postMessage(m){sent.push(m);this.last=m;}terminate(){}};
  const voice=mountNeuralVoice({status(){},audio:{speaking(){}}});
  for(let i=0;i<193;i++){const pending=voice.prepare('Bounded passage '+i,{voice:'am_michael'}),id=worker.last.id;worker.onmessage({data:{type:'audio',id,samples:new Float32Array([.1]),sampleRate:24000}});await pending;}
  await voice.prepare('Bounded passage 32',{voice:'am_michael'});assert.equal(sent.filter(m=>m.type==='generate').length,193);
  const first=voice.prepare('Bounded passage 0',{voice:'am_michael'});assert.equal(sent.filter(m=>m.type==='generate').length,194);worker.onmessage({data:{type:'audio',id:worker.last.id,samples:new Float32Array([.1]),sampleRate:24000}});await first;voice.stop();
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

test('beginning playback preserves in-flight warm synthesis; full navigation stop still cancels it',async()=>{
 const names=['Worker','cancelAnimationFrame'],saved=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let worker;const sent=[];
 try{globalThis.cancelAnimationFrame=()=>{};globalThis.Worker=class{constructor(){worker=this;}postMessage(m){sent.push(m);}terminate(){}};
  const v=mountNeuralVoice({status(){},audio:{speaking(){}}}),warm=v.prepare('Read the title and the whole reply.',{voice:'am_michael',speed:.94}),id=sent.at(-1).id;
  worker.onmessage({data:{type:'started',id}});v.stop({keepPrepared:true});const reader=v.prepare('Read the title and the whole reply.',{voice:'am_michael',speed:.94});assert.equal(sent.filter(m=>m.type==='generate').length,1);assert.equal(sent.filter(m=>m.type==='cancel').length,0);
  worker.onmessage({data:{type:'audio',id,samples:new Float32Array([.1,.2]),sampleRate:24000}});assert.equal((await warm).epoch,(await reader).epoch);
  const pending=v.prepare('A different topic.',{voice:'am_michael'});v.stop();await assert.rejects(pending,/cancelled/);assert.equal(sent.filter(m=>m.type==='cancel').length,1);
 }finally{for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});


test('generated PCM persists across a new cache instance with exact actor, engine and text identity',async()=>{
 const {webcrypto}=await import('node:crypto'),entries=new Map(),events=[],store={async open(){return {async match(key){return entries.get(typeof key==='string'?key:key.url)?.clone();},async put(key,response){entries.set(key,response.clone());},async delete(key){return entries.delete(typeof key==='string'?key:key.url);},async keys(){return [...entries.keys()].map(url=>new Request(url));}};}};
 const config={...neuralRelease,device:'wasm',dtype:'q8'},options={caches:store,crypto:webcrypto,origin:'http://localhost:4332',report:e=>events.push(e)},a=createNeuralPcmCache(config,options),clip={samples:Float32Array.from([.1,-.2,.3,0]),sampleRate:24000,voice:'am_michael',speed:.94,phonemes:'həloʊ'};
 assert.equal(await a.put('Hello.',clip),true);await a.flush();const reloaded=createNeuralPcmCache(config,options),saved=await reloaded.get('Hello.','am_michael',.94);assert.deepEqual(saved.samples,clip.samples);assert.equal(saved.phonemes,clip.phonemes);assert.equal(saved.persistent,true);
 assert.equal(await reloaded.get('Hello!','am_michael',.94),null);assert.equal(await reloaded.get('Hello.','af_heart',.94),null);assert.equal(await reloaded.get('Hello.','am_michael',1),null);assert.equal(await createNeuralPcmCache({...config,dtype:'q4'},options).get('Hello.','am_michael',.94),null);assert.ok(events.some(e=>e.state==='stored')&&events.some(e=>e.state==='hit'));
 const key=await a.keyFor('Hello.','am_michael',.94);assert.ok(!key.includes('Hello'));entries.set(key,new Response(new Uint8Array([1,2,3])));assert.equal(await reloaded.get('Hello.','am_michael',.94),null);assert.equal(entries.has(key),false);assert.ok(events.some(e=>e.state==='discarded'));
 const unavailable=createNeuralPcmCache(config,{caches:null});assert.equal(unavailable.available,false);assert.equal(await unavailable.get('Hello.','am_michael',.94),null);assert.equal(await unavailable.put('Hello.',clip),false);
});
