import {mountAudio,normalizeVoice} from './audio.mjs';
/* Browser neural route. Trusted, pinned Kokoro runtime; chapter data never
 * becomes code. Weights download on first read, inference stays in the worker. */
export const neuralCast={ghost:[['am_michael','Michael / American male'],['am_onyx','Onyx / American male'],['am_adam','Adam / American male'],['bm_lewis','Lewis / British male'],['am_fenrir','Fenrir / American male'],['bm_fable','Fable / British male'],['bm_george','George / British male']],companion:[['af_heart','Heart / American female'],['af_bella','Bella / American female'],['bf_emma','Emma / British female']]};
export const neuralDefaultCastPolicy='natural-michael-2026-10-27';
/** Low-register Michael is the next audition candidate, not a claim that a
 * pitch meter or published quality grade establishes the deepest human voice.
 * Legacy Onyx defaults migrate once; subsequent explicit selections survive. */
export function applyNeuralDefaultCast(preferred){
 const known=neuralCast.ghost.some(([id])=>id===preferred.ghostNeural);let changed=false;
 if(preferred.castPolicy!==neuralDefaultCastPolicy||!known){if(!known||preferred.ghostNeural==='am_onyx'&&!preferred.ghostNeuralExplicit)preferred.ghostNeural='am_michael';preferred.castPolicy=neuralDefaultCastPolicy;changed=true;}
 if(!neuralCast.companion.some(([id])=>id===preferred.companionNeural)){preferred.companionNeural='af_heart';changed=true;}
 return changed;
}
export const neuralRelease={runtime:'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js',sha256:'6067712fe4c43cdb36c762f860a5ab8d96ea1d9c8882466438eb9f3d0d20be8f',model:'onnx-community/Kokoro-82M-v1.0-ONNX',revision:'1939ad2a8e416c0acfeecc08a694d14ef25f2231'};
export const neuralProfiles={cpu:{device:'wasm',dtype:'q8'},compact:{device:'wasm',dtype:'q4'},gpu:{device:'webgpu',dtype:'fp32'},gpu16:{device:'webgpu',dtype:'fp16'}};
// Automatic playback uses CPU profiles only. WebGPU can return plausible,
// finite 24 kHz PCM that is audibly corrupted; a speed probe cannot certify it.
// GPU profiles remain diagnostic bench targets, never automatic candidates.
export const neuralPlaybackPolicy='cpu-fidelity-2026-10-23';
export const automaticNeuralProfiles=['cpu','compact'];
export function repairNeuralPreferences(preferred){
 if(preferred.fidelityPolicy===neuralPlaybackPolicy)return false;
 if(['gpu','gpu16'].includes(preferred.performance))preferred.performance='auto';
 preferred.autoTiming=null;preferred.fidelityPolicy=neuralPlaybackPolicy;return true;
}
export function pickNeuralProfile(samples){
 const valid=samples.filter(s=>automaticNeuralProfiles.includes(s.profile)&&Number.isFinite(s.rtf)&&s.rtf>0);
 if(!valid.length)throw Error('No neural backend completed calibration');
 return valid.reduce((best,s)=>s.rtf<best.rtf?s:best).profile;
}
/** Immutable public assets only: never captions, generated speech or user data.
 * Cache keys depend on the pinned release, never this app's build/query string.
 * Kept self-contained because the same function is installed in the worker. */
export function createNeuralAssetCache(config,{fetch:network=globalThis.fetch.bind(globalThis),caches:store=globalThis.caches,report=()=>{}}={}){
 const name='friken-kokoro-assets-'+config.revision+'-'+config.sha256.slice(0,12),pending=new Map(),opened=new Map();let disabled=false;
 const prefix='https://huggingface.co/'+config.model+'/resolve/'+config.revision+'/',wasm='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/';
 const keyFor=input=>{try{const u=new URL(typeof input==='string'||input instanceof URL?input:input.url);u.hash='';u.search='';return u.href===config.runtime||u.href.startsWith(prefix)||u.href.startsWith(wasm)?u.href:null;}catch{return null;}};
 // Cooperate with the runtime's existing exact-URL model/voice caches. There
 // is one stored copy of a 92/305 MB model, not a second private duplicate.
 const bucket=key=>key?.startsWith(prefix)?key.slice(prefix.length).startsWith('voices/')?'kokoro-voices':'transformers-cache':name;
 async function cache(key){if(disabled)return null;if(!store){disabled=true;report({type:'cache',state:'unavailable',text:'Voice asset cache unavailable on this host / downloads continue for this visit'});return null;}try{const id=bucket(key);if(!opened.has(id))opened.set(id,store.open(id));return await opened.get(id);}catch(error){disabled=true;report({type:'cache',state:'unavailable',text:'Voice asset cache unavailable / '+error.message+' / downloads continue for this visit'});return null;}}
 async function fetchAsset(input,init={}){
  const key=keyFor(input),method=(init.method||input?.method||'GET').toUpperCase();
  if(!key||!['GET','HEAD'].includes(method))return network(input,init);
  const c=await cache(key);let hit;
  try{hit=await c?.match(key);}catch(error){report({type:'cache',state:'read-failed',text:'Voice cache read failed / '+error.message});}
  if(hit){report({type:'cache',state:'hit',file:key.split('/').at(-1),text:'Voice cache / '+key.split('/').at(-1)+' / stored on this device'});return method==='HEAD'?new Response(null,{status:hit.status,headers:hit.headers}):hit;}
  // Transformers may request a HEAD before the GET. A prior cached GET answers
  // offline; uncached HEAD is never stored as an empty model response.
  // A stalled connection has an idle deadline, not a short total deadline:
  // a slow but progressing first download is allowed to finish and be cached.
  const controller=new AbortController(),signal=init.signal||input?.signal;let idle;
  const abort=()=>controller.abort(signal?.reason),arm=()=>{clearTimeout(idle);idle=setTimeout(()=>controller.abort(Error('Voice asset download stalled for two minutes')),120000);},clear=()=>{clearTimeout(idle);signal?.removeEventListener('abort',abort);};
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});arm();
  let response;try{response=await network(input,{...init,signal:controller.signal});}catch(error){clear();throw error;}
  clearTimeout(idle);
  if(method==='HEAD'||!response.ok||response.status!==200){clear();return response;}
  const file=key.split('/').at(-1),total=Number(response.headers.get('content-length'))||0;let received=0,last=0;
  report({type:'cache',state:'download',file,loaded:0,total,text:'Voice download / '+file+' / '+(total?(total/1048576).toFixed(1)+' MB':'size pending')});
  let out=response;
  if(response.body&&typeof ReadableStream!=='undefined'){
   const reader=response.body.getReader();out=new Response(new ReadableStream({async pull(stream){try{arm();const {done,value}=await reader.read();clearTimeout(idle);if(done){clear();stream.close();return;}received+=value.byteLength;const now=Date.now();if(now-last>500||received===total){last=now;report({type:'cache',state:'download',file,loaded:received,total,text:'Voice download / '+file+' / '+(received/1048576).toFixed(1)+(total?' / '+(total/1048576).toFixed(1):'')+' MB'});}stream.enqueue(value);}catch(error){clear();stream.error(error);}},cancel(reason){clear();return reader.cancel(reason);}}),{status:response.status,statusText:response.statusText,headers:response.headers});
  }
  else clear();
  if(c){const copy=out.clone(),write=Promise.resolve().then(()=>c.put(key,copy)).then(()=>report({type:'cache',state:'stored',file,text:'Voice cache / '+file+' / saved for offline reuse'})).catch(error=>report({type:'cache',state:'write-failed',file,text:'Voice cache could not save '+file+' / '+error.message+' / this visit can still speak'}));pending.set(key,write);void write.finally(()=>pending.delete(key));}
  return out;
 }
 return {name,fetch:fetchAsset,keyFor,async remove(input){const key=keyFor(input),c=await cache(key);if(!c||!key)return false;try{await pending.get(key);return await c.delete(key);}catch(error){report({type:'cache',state:'clear-failed',text:'Voice cache entry could not be cleared / '+error.message});return false;}},async flush(){await Promise.all([...pending.values()]);}};
}
/** Exact locally generated PCM, separate from immutable model assets.
 * Stable across page/build reloads on the same origin. No network fetch.
 * Bounded 512 clips / 256 MiB; corrupt entries are discarded and regenerated. */
export function createNeuralPcmCache(config,{caches:store=globalThis.caches,crypto:crypt=globalThis.crypto,origin=globalThis.location?.origin||'https://friken.invalid',report=()=>{}}={}){
 const name='friken-kokoro-generated-pcm-v1',available=!!store&&!!crypt?.subtle;let opened=null,disabled=false;const writes=new Set(),inventory=new Map();let inventoryReady=null,totalBytes=0;
 const digest=async bytes=>[...new Uint8Array(await crypt.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
 const keyFor=async(text,voice,speed)=>origin+'/.friken-local-pcm/'+await digest(new TextEncoder().encode(JSON.stringify([1,config.sha256,config.revision,config.model,config.device,config.dtype,text,voice,speed])));
 async function cache(){if(!available||disabled)return null;try{return await (opened??=store.open(name));}catch(error){disabled=true;report({type:'pcm-cache',state:'unavailable',text:'Generated voice stays in memory: '+error.message});return null;}}
 async function get(text,voice,speed){const c=await cache();if(!c)return null;const key=await keyFor(text,voice,speed);try{const response=await c.match(key);if(!response)return null;const bytes=await response.arrayBuffer();if(bytes.byteLength<8||bytes.byteLength>24000*90*4+100000||await digest(bytes)!==response.headers.get('x-friken-pcm-sha256'))throw Error('Damaged local voice clip');
   const size=new DataView(bytes).getUint32(0,true);if(size<20||size>100000||4+size>=bytes.byteLength)throw Error('Invalid voice metadata');const metadata=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,4,size))),raw=bytes.slice(4+size);if(raw.byteLength%4)throw Error('Invalid PCM length');const samples=new Float32Array(raw);
   if(metadata.schema!==1||metadata.voice!==voice||metadata.speed!==speed||metadata.sampleRate!==24000||samples.length!==metadata.count||!samples.length||samples.length>24000*90||typeof metadata.phonemes!=='string'||metadata.phonemes.length>24000||samples.some(n=>!Number.isFinite(n)||Math.abs(n)>100))throw Error('Invalid cached voice');
   report({type:'pcm-cache',state:'hit',text:'Generated voice / reused from this device'});return {samples,sampleRate:24000,voice,speed,phonemes:metadata.phonemes,persistent:true};
  }catch(error){await c.delete(key);report({type:'pcm-cache',state:'discarded',text:error.message+' / regenerating'});return null;}}
 async function put(text,message){const c=await cache();if(!c)return false;const {samples,voice,speed,phonemes,sampleRate}=message;if(!(samples instanceof Float32Array)||sampleRate!==24000||!samples.length||samples.length>24000*90)return false;
  const key=await keyFor(text,voice,speed),metadata=new TextEncoder().encode(JSON.stringify({schema:1,voice,speed,sampleRate,phonemes:phonemes||'',count:samples.length})),bytes=new Uint8Array(4+metadata.length+samples.byteLength);new DataView(bytes.buffer).setUint32(0,metadata.length,true);bytes.set(metadata,4);bytes.set(new Uint8Array(samples.buffer,samples.byteOffset,samples.byteLength),4+metadata.length);
  try{await c.put(key,new Response(bytes,{headers:{'content-type':'application/octet-stream','x-friken-pcm-sha256':await digest(bytes),'x-friken-pcm-bytes':String(bytes.length)}}));
   inventoryReady??=(async()=>{for(const request of await c.keys()){const entry=await c.match(request),url=typeof request==='string'?request:request.url,bytes=Number(entry?.headers.get('x-friken-pcm-bytes'))||0;inventory.set(url,bytes);totalBytes+=bytes;}})();await inventoryReady;
   totalBytes-=inventory.get(key)||0;inventory.delete(key);inventory.set(key,bytes.length);totalBytes+=bytes.length;
   for(const [old,size]of inventory){if(inventory.size<=512&&totalBytes<=256*1024*1024)break;await c.delete(old);inventory.delete(old);totalBytes-=size;}
   report({type:'pcm-cache',state:'stored',clips:inventory.size,bytes:totalBytes,text:'Generated voice / saved locally / '+inventory.size+' clips'});return true;
  }catch(error){report({type:'pcm-cache',state:'write-failed',text:'Voice cache full or unavailable / memory playback continues / '+error.message});return false;}}
 return {name,available,keyFor,get,put(text,message){const task=put(text,message);writes.add(task);void task.finally(()=>writes.delete(task));return task;},async flush(){await Promise.all([...writes]);}};
}
function neuralWorker(config){
  let model,loading,queue=[],running=false,engineInfo;const downloads=new Map();
  const assets=createNeuralAssetCache(config,{report:message=>postMessage(message)});
  globalThis.fetch=assets.fetch;
  async function load(){
    if(model)return model;if(loading)return loading;
    loading=(async()=>{
      postMessage({type:'status',text:'Loading Kokoro / device cache first / '+config.device+' '+config.dtype+' / first-use q8 weights ~92 MB; q4 ~305 MB.'});
      const response=await fetch(config.runtime);if(!response.ok)throw Error('Runtime download: HTTP '+response.status);
      const bytes=await response.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
      if(hash!==config.sha256){const removed=await assets.remove(config.runtime);throw Error('Neural runtime integrity mismatch; '+(removed?'its damaged cache entry was removed. Read again to retry.':'cached entry could not be cleared. Browser storage may require repair.'));}
      let code=new TextDecoder().decode(bytes);
      const template='remotePathTemplate:"{model}/resolve/{revision}/"',voices='/resolve/main/voices/';
      if(code.split(template).length!==2||code.split(voices).length!==2)throw Error('Pinned model-path adaptation changed');
      code=code.replace(template,'remotePathTemplate:"{model}/resolve/'+config.revision+'/"').replace(voices,'/resolve/'+config.revision+'/voices/');
      const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
      let runtime;try{runtime=await import(url);}finally{URL.revokeObjectURL(url);}
      runtime.env.wasmPaths='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/';
      const adapter=config.device==='webgpu'?await navigator.gpu?.requestAdapter():null;
      if(config.device==='webgpu'&&!adapter)throw Error('WebGPU unavailable on this host. Select CPU in VOICE CAST.');
      if(config.dtype==='fp16'&&!adapter?.features.has('shader-f16'))throw Error('GPU fp16 requires shader-f16 support on this adapter.');
      const device=config.device,dtype=config.dtype;
      engineInfo={device,dtype,isolated:crossOriginIsolated,cores:navigator.hardwareConcurrency};
      postMessage({type:'status',text:'Kokoro / loading '+device+' '+dtype+' / '+(device==='wasm'&&!crossOriginIsolated?'single CPU thread on this host':'local inference')});
      model=await runtime.KokoroTTS.from_pretrained(config.model,{dtype,device,progress_callback:p=>{const n=Math.round(p.progress||0);if(p.status==='progress'&&downloads.get(p.file)!==n){downloads.set(p.file,n);postMessage({type:'status',text:'Kokoro / '+p.file+' / '+n+'%'});}}});
      void assets.flush();postMessage({type:'ready',...engineInfo});return model;
    })();
    try{return await loading;}catch(e){loading=null;throw e;}
  }
  async function drain(){
    if(running)return;running=true;
    while(queue.length){const job=queue.shift(),dequeued=performance.now();postMessage({type:'started',id:job.id});
      try{const engine=await load();postMessage({type:'synthesizing',id:job.id});postMessage({type:'status',text:'Kokoro / generating '+job.voice+' locally / captions available'});const began=performance.now(),tokenizer=engine.tokenizer;let phonemes='',audio,phonemeAt=began;
        if(typeof tokenizer!=='function')throw Error('Pinned Kokoro tokenizer contract changed');
        // Capture the actual G2P string already sent to the verified runtime.
        // Proxy preserves the callable tokenizer and all of its properties;
        // no second phonemization, sentence split or inference is introduced.
        engine.tokenizer=new Proxy(tokenizer,{apply(target,self,args){phonemes=args[0];phonemeAt=performance.now();return Reflect.apply(target,self,args);}});
        try{audio=await engine.generate(job.text,{voice:job.voice,speed:job.speed});}finally{engine.tokenizer=tokenizer;}
        if(typeof phonemes!=='string'||!phonemes.length||phonemes.length>24000)throw Error('Pinned Kokoro phoneme capture unavailable');
        postMessage({type:'audio',id:job.id,phonemes,samples:audio.audio,sampleRate:audio.sampling_rate,metrics:{...engineInfo,generateMs:performance.now()-began,phonemizeMs:phonemeAt-began,modelMs:performance.now()-phonemeAt,queueMs:dequeued-job.queuedAt,loadMs:began-dequeued,audioSeconds:audio.audio.length/audio.sampling_rate}},[audio.audio.buffer]);
      }catch(error){postMessage({type:'error',id:job.id,message:error.message});}
    }running=false;
  }
  onmessage=event=>{
    if(event.data.type==='warm'){void load().catch(error=>postMessage({type:'warm-error',message:error.message}));return;}
    if(event.data.type==='cancel'){for(const job of queue)postMessage({type:'cancelled',id:job.id,message:'cancelled'});queue=[];return;}
    if(event.data.type==='generate'){queue.push({...event.data,queuedAt:performance.now()});void drain();}
  };
}
export function mountNeuralVoice({status,level,talking,audio,metrics=()=>{},work=()=>{},asset=()=>{},pcmCache=null,profile='cpu'}){
  audio??=mountAudio(null);
  let worker=null,epoch=0,request=0,context=null,source=null,analyser=null,raf=0,finish=null;
  // Retain a whole multi-actor reply through stop/replay. Four units caused
  // cyclic eviction in the seven-passage introduction. Exact local PCM only:
  // RAM:192 units /900 seconds (~86.4 MB); disk:512 clips /256 MiB.
  // Exact generated clips stay on this origin and are never uploaded.
  const cache=new Map(),jobs=new Map(),inflight=new Map();let cachedSamples=0;
  const persistent=()=>pcmCache||createNeuralPcmCache({...neuralRelease,...neuralProfiles[profile]},{report:asset});let disk=persistent();
  const keyFor=(text,voice,speed)=>JSON.stringify([text,voice,speed]);
  const workState=()=>work({busy:jobs.size>0,pending:jobs.size,cachedClips:cache.size,device:neuralProfiles[profile].device});
  function deadline(job,ms=120000){clearTimeout(job.timer);job.timer=setTimeout(()=>failWorker('Speech took too long to prepare. Read scene retries the voice'),ms);}
  function remember(key,message){
    if(!key||!(message.samples instanceof Float32Array))return;
    if(cache.has(key))cachedSamples-=cache.get(key).samples.length;
    cache.delete(key);cache.set(key,message);cachedSamples+=message.samples.length;
    while(cache.size>192||cachedSamples>24000*900){const key=cache.keys().next().value;cachedSamples-=cache.get(key).samples.length;cache.delete(key);}
  }
  function ensureWorker(){
    if(worker)return;
    const url=URL.createObjectURL(new Blob(['const createNeuralAssetCache='+createNeuralAssetCache.toString()+';('+neuralWorker.toString()+')('+JSON.stringify({...neuralRelease,...neuralProfiles[profile]})+');'],{type:'text/javascript'}));
    try{worker=new Worker(url,{type:'module'});}finally{URL.revokeObjectURL(url);}
    worker.onmessage=event=>{const m=event.data;
      if(m.type==='status'){status(m.text);return;}
      if(m.type==='cache'){asset(m);status(m.text);if(m.state==='download'||m.state==='hit'||m.state==='stored')for(const job of jobs.values())if(!job.synthesizing)deadline(job);return;}
      if(m.type==='ready'){status('Kokoro / '+m.device+' '+m.dtype+' / local model ready');return;}
      if(m.type==='warm-error'){status('Voice unavailable: '+m.message+' · Read scene to retry.');return;}
      const job=jobs.get(m.id);if(!job)return;
      if(m.type==='started'){job.started=true;return;}
      if(m.type==='synthesizing'){job.synthesizing=true;deadline(job,120000);return;}
      clearTimeout(job.timer);jobs.delete(m.id);inflight.delete(job.key);workState();
      const packet=m.type==='audio'?{...m,voice:job.voice,speed:job.speed}:m;
      if(m.type==='audio'){remember(job.key,packet);void disk.put(job.text,packet).catch(()=>{});if(m.metrics&&job.waiters.some(w=>w.epoch===epoch))metrics({...m.metrics,voice:job.voice});}
      for(const waiter of job.waiters)m.type==='audio'?waiter.resolve({...packet,epoch:waiter.epoch}):waiter.reject(Error(m.message));
    };
    worker.onerror=event=>{failWorker(event.message||'Neural worker failed');status('Voice unavailable: '+(event.message||'Neural worker failed')+' · Read scene to retry.');};
  }
  function failWorker(message){
    for(const job of jobs.values()){clearTimeout(job.timer);for(const waiter of job.waiters)waiter.reject(Error(message));}
    jobs.clear();inflight.clear();worker?.terminate();worker=null;workState();
  }
  function stop({keepPrepared=false}={}){if(!keepPrepared){epoch++;worker?.postMessage({type:'cancel'});
    for(const [id,job]of jobs){for(const waiter of job.waiters)waiter.reject(Error('cancelled'));job.waiters=[];
      if(!job.started){clearTimeout(job.timer);jobs.delete(id);inflight.delete(job.key);}}
    workState();}
    if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}
    cancelAnimationFrame(raf);raf=0;level?.(0);talking?.(false);audio.speaking(false);finish?.();finish=null;
  }
  async function unlock(){
    const graph=await audio.unlock();context=graph.context;return graph;
  }
  async function prepare(text,{voice,speed=1,reuse=true}){
    if(typeof text!=='string'||!text.trim()||text.length>24000||!Object.values(neuralCast).some(cast=>cast.some(([id])=>id===voice))||!Number.isFinite(speed)||speed<.5||speed>2)throw Error('An explicit supported neural voice and bounded passage are required');
    const own=epoch,key=keyFor(text,voice,speed),cached=reuse?cache.get(key):null;
    if(cached)return {...cached,epoch:own};
    if(reuse&&disk.available){const stored=await disk.get(text,voice,speed);if(own!==epoch)throw Error('cancelled');if(stored){remember(key,stored);workState();return {...stored,epoch:own};}}
    ensureWorker();let job=inflight.get(key);
    if(!job){
      if(jobs.size>=4)throw Error('Neural look-ahead limit reached');
      const id=++request;job={id,key,text,voice,speed,started:false,waiters:[],timer:0};deadline(job);
      jobs.set(id,job);inflight.set(key,job);workState();
      worker.postMessage({type:'generate',id,text,voice,speed});
    }
    return await new Promise((resolve,reject)=>job.waiters.push({resolve,reject,epoch:own}));
  }
  async function play(message,{role,voice,onStart,onProgress}){
    if(voice!==undefined&&message.voice!==voice)throw Error('Prepared PCM does not match the selected voice');
    const own=epoch;if(message.epoch!==own)throw Error('cancelled');await unlock();if(epoch!==own)throw Error('cancelled');
    const samples=message.samples;if(!(samples instanceof Float32Array)||!samples.length||samples.length>24000*90||message.sampleRate!==24000)throw Error('Invalid neural audio buffer');
    const normal=normalizeVoice(samples);audio.voiceReceipt(role,{voice:message.voice,inputRms:normal.inputRms,outputRms:normal.outputRms,gain:normal.gain});
    if(normal.peak<.00001)throw Error('Neural voice returned silent PCM; captions remain unread');
    const buffer=context.createBuffer(1,samples.length,message.sampleRate);buffer.copyToChannel(normal.samples,0);
    analyser??=context.createAnalyser();analyser.fftSize=512;
    source=context.createBufferSource();source.buffer=buffer;source.connect(analyser);analyser.disconnect();analyser.connect(audio.graph().voice);const playing=source;
    const started=context.currentTime,pcm=new Float32Array(512);
    return await new Promise((resolve,reject)=>{
      finish=()=>resolve({played:false,cancelled:true});playing.onended=()=>{if(epoch!==own){resolve({played:false,cancelled:true});return;}const elapsed=context.currentTime-started;cancelAnimationFrame(raf);raf=0;playing.disconnect();if(source===playing)source=null;level?.(0);talking?.(false);audio.speaking(false);finish=null;if(context.state!=='running'||elapsed<buffer.duration*.95){reject(Error('Audio playback ended before its PCM clock completed; captions remain unread'));return;}onProgress?.(1);resolve({played:true,duration:buffer.duration,elapsed});};
      function tick(){if(epoch!==own)return;analyser.getFloatTimeDomainData(pcm);let energy=0;for(const v of pcm)energy+=v*v;level?.(role==='ghost'?Math.min(1,Math.sqrt(energy/pcm.length)*5):0);onProgress?.(Math.min(1,(context.currentTime-started)/buffer.duration));raf=requestAnimationFrame(tick);}
      playing.start();audio.speaking(true);onStart?.();talking?.(role==='ghost');tick();
    });
  }
  async function speak(text,options){await unlock();const message=await prepare(text,options);await play(message,options);}
  return {speak,stop,prepare,play,unlock,get pending(){return jobs.size;},release(){stop();failWorker('Voice suspended');},setProfile(value){if(!neuralProfiles[value])throw Error('Unknown neural profile');if(value===profile)return;stop();failWorker('Neural profile changed');cache.clear();cachedSamples=0;profile=value;disk=persistent();},flushCache:()=>disk.flush(),warm(){ensureWorker();worker.postMessage({type:'warm'});}};
}
