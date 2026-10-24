import {mountAudio,normalizeVoice} from './audio.mjs';
/* Browser neural route. Trusted, pinned Kokoro runtime; chapter data never
 * becomes code. Weights download on first read, inference stays in the worker. */
export const neuralCast={ghost:[['am_onyx','Onyx / American male'],['am_adam','Adam / American male'],['bm_lewis','Lewis / British male'],['am_fenrir','Fenrir / American male'],['am_michael','Michael / American male'],['bm_fable','Fable / British male'],['bm_george','George / British male']]};
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
function neuralWorker(config){
  let model,loading,queue=[],running=false,engineInfo;const downloads=new Map();
  async function load(){
    if(model)return model;if(loading)return loading;
    loading=(async()=>{
      postMessage({type:'status',text:'Loading verified Kokoro runtime / First-use weights: GPU fp32 ~326 MB / CPU q8 ~92 MB / CPU q4 ~305 MB.'});
      const response=await fetch(config.runtime);if(!response.ok)throw Error('Runtime download: HTTP '+response.status);
      const bytes=await response.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
      if(hash!==config.sha256)throw Error('Neural runtime integrity mismatch');
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
      postMessage({type:'ready',...engineInfo});return model;
    })();
    try{return await loading;}catch(e){loading=null;throw e;}
  }
  async function drain(){
    if(running)return;running=true;
    while(queue.length){const job=queue.shift(),dequeued=performance.now();postMessage({type:'started',id:job.id});
      try{const engine=await load();postMessage({type:'status',text:'Kokoro / generating '+job.voice+' locally / captions available'});const began=performance.now(),tokenizer=engine.tokenizer;let phonemes='',audio,phonemeAt=began;
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
export function mountNeuralVoice({status,level,talking,audio,metrics=()=>{},work=()=>{},profile='compact'}){
  audio??=mountAudio(null);
  let worker=null,epoch=0,request=0,context=null,source=null,analyser=null,raf=0,finish=null;
  // Replaying a paused line must not pay inference again. Exact local PCM only,
  // bounded to 90 seconds total and four units; never stored or uploaded.
  const cache=new Map(),jobs=new Map(),inflight=new Map();let cachedSamples=0;
  const keyFor=(text,voice,speed)=>JSON.stringify([text,voice,speed]);
  const workState=()=>work({busy:jobs.size>0,pending:jobs.size,device:neuralProfiles[profile].device});
  function remember(key,message){
    if(!key||!(message.samples instanceof Float32Array))return;
    if(cache.has(key))cachedSamples-=cache.get(key).samples.length;
    cache.delete(key);cache.set(key,message);cachedSamples+=message.samples.length;
    while(cache.size>4||cachedSamples>24000*90){const key=cache.keys().next().value;cachedSamples-=cache.get(key).samples.length;cache.delete(key);}
  }
  function ensureWorker(){
    if(worker)return;
    const url=URL.createObjectURL(new Blob(['('+neuralWorker.toString()+')('+JSON.stringify({...neuralRelease,...neuralProfiles[profile]})+');'],{type:'text/javascript'}));
    try{worker=new Worker(url,{type:'module'});}finally{URL.revokeObjectURL(url);}
    worker.onmessage=event=>{const m=event.data;
      if(m.type==='status'){status(m.text);return;}
      if(m.type==='ready'){status('Kokoro / '+m.device+' '+m.dtype+' / local model ready');return;}
      if(m.type==='warm-error'){status('Voice unavailable: '+m.message+' · Read scene to retry.');return;}
      const job=jobs.get(m.id);if(!job)return;
      if(m.type==='started'){job.started=true;return;}
      clearTimeout(job.timer);jobs.delete(m.id);inflight.delete(job.key);workState();
      if(m.type==='audio'){remember(job.key,m);if(m.metrics&&job.waiters.some(w=>w.epoch===epoch))metrics(m.metrics);}
      for(const waiter of job.waiters)m.type==='audio'?waiter.resolve({...m,epoch:waiter.epoch}):waiter.reject(Error(m.message));
    };
    worker.onerror=event=>{failWorker(event.message||'Neural worker failed');status('Voice unavailable: '+(event.message||'Neural worker failed')+' · Read scene to retry.');};
  }
  function failWorker(message){
    for(const job of jobs.values()){clearTimeout(job.timer);for(const waiter of job.waiters)waiter.reject(Error(message));}
    jobs.clear();inflight.clear();worker?.terminate();worker=null;workState();
  }
  function stop(){epoch++;worker?.postMessage({type:'cancel'});
    for(const [id,job]of jobs){for(const waiter of job.waiters)waiter.reject(Error('cancelled'));job.waiters=[];
      if(!job.started){clearTimeout(job.timer);jobs.delete(id);inflight.delete(job.key);}}
    workState();
    if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}
    cancelAnimationFrame(raf);raf=0;level?.(0);talking?.(false);audio.speaking(false);finish?.();finish=null;
  }
  async function unlock(){
    const graph=await audio.unlock();context=graph.context;return graph;
  }
  async function prepare(text,{voice,speed=1,reuse=true}){
    const own=epoch,key=keyFor(text,voice,speed),cached=reuse?cache.get(key):null;
    if(cached)return {...cached,epoch:own};
    ensureWorker();let job=inflight.get(key);
    if(!job){
      if(jobs.size>=4)throw Error('Neural look-ahead limit reached');
      const id=++request;job={id,key,started:false,waiters:[],timer:setTimeout(()=>failWorker('Speech took too long to prepare. Read scene retries the voice'),120000)};
      jobs.set(id,job);inflight.set(key,job);workState();
      worker.postMessage({type:'generate',id,text,voice,speed});
    }
    return await new Promise((resolve,reject)=>job.waiters.push({resolve,reject,epoch:own}));
  }
  async function play(message,{role,onStart,onProgress}){
    const own=epoch;if(message.epoch!==own)return;await unlock();if(epoch!==own)return;
    const samples=message.samples;if(!(samples instanceof Float32Array)||!samples.length||samples.length>24000*90||message.sampleRate!==24000)throw Error('Invalid neural audio buffer');
    const normal=normalizeVoice(samples);audio.voiceReceipt(role,{inputRms:normal.inputRms,outputRms:normal.outputRms,gain:normal.gain});
    const buffer=context.createBuffer(1,samples.length,message.sampleRate);buffer.copyToChannel(normal.samples,0);
    analyser??=context.createAnalyser();analyser.fftSize=512;
    source=context.createBufferSource();source.buffer=buffer;source.connect(analyser);analyser.disconnect();analyser.connect(audio.graph().voice);
    const started=context.currentTime,pcm=new Float32Array(512);
    await new Promise(resolve=>{
      finish=resolve;source.onended=()=>{if(epoch===own){cancelAnimationFrame(raf);raf=0;source?.disconnect();source=null;level?.(0);talking?.(false);audio.speaking(false);onProgress?.(1);}finish=null;resolve();};
      function tick(){if(epoch!==own)return;analyser.getFloatTimeDomainData(pcm);let energy=0;for(const v of pcm)energy+=v*v;level?.(role==='ghost'?Math.min(1,Math.sqrt(energy/pcm.length)*5):0);onProgress?.(Math.min(1,(context.currentTime-started)/buffer.duration));raf=requestAnimationFrame(tick);}
      source.start();audio.speaking(true);talking?.(role==='ghost');onStart?.();tick();
    });
  }
  async function speak(text,options){await unlock();const message=await prepare(text,options);await play(message,options);}
  return {speak,stop,prepare,play,unlock,release(){stop();failWorker('Voice suspended');},setProfile(value){if(!neuralProfiles[value])throw Error('Unknown neural profile');if(value===profile)return;stop();failWorker('Neural profile changed');cache.clear();cachedSamples=0;profile=value;},warm(){ensureWorker();worker.postMessage({type:'warm'});}};
}
