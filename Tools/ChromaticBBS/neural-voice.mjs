import {mountAudio,normalizeVoice} from './audio.mjs';
/* Browser neural route. Trusted, pinned Kokoro runtime; chapter data never
 * becomes code. Weights download on first read, inference stays in the worker. */
export const neuralCast={ghost:[['bm_george','George / British male'],['am_michael','Michael / American male'],['am_fenrir','Fenrir / American male']],narrator:[['af_heart','Heart / American female'],['bf_emma','Emma / British female'],['af_bella','Bella / American female']]};
export const neuralRelease={runtime:'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js',sha256:'6067712fe4c43cdb36c762f860a5ab8d96ea1d9c8882466438eb9f3d0d20be8f',model:'onnx-community/Kokoro-82M-v1.0-ONNX',revision:'1939ad2a8e416c0acfeecc08a694d14ef25f2231'};
function neuralWorker(config){
  let model,loading,latest=null,running=false;const downloads=new Map();
  async function load(){
    if(model)return model;if(loading)return loading;
    loading=(async()=>{
      postMessage({type:'status',text:'Downloading verified Kokoro runtime / first use ~100 MB including model.'});
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
      model=await runtime.KokoroTTS.from_pretrained(config.model,{dtype:'q8',device:'wasm',progress_callback:p=>{const n=Math.round(p.progress||0);if(p.status==='progress'&&downloads.get(p.file)!==n){downloads.set(p.file,n);postMessage({type:'status',text:'Kokoro / '+p.file+' / '+n+'%'});}}});
      postMessage({type:'ready'});return model;
    })();
    try{return await loading;}catch(e){loading=null;throw e;}
  }
  async function drain(){
    if(running)return;running=true;
    while(latest){const job=latest;latest=null;
      try{const engine=await load();postMessage({type:'status',text:'Kokoro / generating '+job.voice+' locally / captions available'});const audio=await engine.generate(job.text,{voice:job.voice,speed:job.speed});
        postMessage({type:'audio',id:job.id,samples:audio.audio,sampleRate:audio.sampling_rate},[audio.audio.buffer]);
      }catch(error){postMessage({type:'error',id:job.id,message:error.message});}
    }running=false;
  }
  onmessage=event=>{
    if(event.data.type==='warm'){void load().catch(error=>postMessage({type:'warm-error',message:error.message}));return;}
    if(event.data.type==='cancel'){if(latest)postMessage({type:'cancelled',id:latest.id,message:'cancelled'});latest=null;return;}
    if(event.data.type==='generate'){latest=event.data;void drain();}
  };
}
export function mountNeuralVoice({status,level,talking,audio}){
  audio??=mountAudio(null);
  let worker=null,epoch=0,request=0,pending=null,context=null,source=null,analyser=null,raf=0,finish=null;
  // Replaying a paused line must not pay inference again. Exact local PCM only,
  // bounded to 90 seconds total and four units; never stored or uploaded.
  const cache=new Map(),jobs=new Map();let cachedSamples=0;
  const keyFor=(text,voice,speed)=>JSON.stringify([text,voice,speed]);
  function remember(key,message){
    if(!key||!(message.samples instanceof Float32Array))return;
    if(cache.has(key))cachedSamples-=cache.get(key).samples.length;
    cache.delete(key);cache.set(key,message);cachedSamples+=message.samples.length;
    while(cache.size>4||cachedSamples>24000*90){const key=cache.keys().next().value;cachedSamples-=cache.get(key).samples.length;cache.delete(key);}
  }
  function ensureWorker(){
    if(worker)return;
    const url=URL.createObjectURL(new Blob(['('+neuralWorker.toString()+')('+JSON.stringify(neuralRelease)+');'],{type:'text/javascript'}));
    try{worker=new Worker(url,{type:'module'});}finally{URL.revokeObjectURL(url);}
    worker.onmessage=event=>{const m=event.data;
      if(m.type==='status'){status(m.text);return;}
      if(m.type==='ready'){status('Kokoro / local neural model ready');return;}
      if(m.type==='warm-error'){status('Voice unavailable: '+m.message+' · Read scene to retry.');return;}
      const key=jobs.get(m.id);jobs.delete(m.id);
      if(m.type==='audio')remember(key,m);
      if(!pending||pending.id!==m.id)return;
      const job=pending;pending=null;clearTimeout(job.timer);m.type==='audio'?job.resolve(m):job.reject(Error(m.message));
    };
    worker.onerror=event=>{clearTimeout(pending?.timer);pending?.reject(Error(event.message||'Neural worker failed'));pending=null;jobs.clear();worker.terminate();worker=null;status('Voice unavailable: '+(event.message||'Neural worker failed')+' · Read scene to retry.');};
  }
  function stop(){epoch++;worker?.postMessage({type:'cancel'});clearTimeout(pending?.timer);pending?.reject(Error('cancelled'));pending=null;
    if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}
    cancelAnimationFrame(raf);raf=0;level?.(0);talking?.(false);audio.speaking(false);finish?.();finish=null;
  }
  async function unlock(){
    const graph=await audio.unlock();context=graph.context;return graph;
  }
  async function prepare(text,{voice,speed=1}){
    const own=epoch,key=keyFor(text,voice,speed),cached=cache.get(key);
    if(cached)return {...cached,epoch:own};
    ensureWorker();if(pending)throw Error('Neural queue already has a prepared sentence');
    const id=++request;
    const message=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{if(pending?.id!==id)return;pending=null;jobs.clear();worker?.terminate();worker=null;reject(Error('Speech took too long to prepare. Read scene retries the voice'));},120000);
      pending={id,resolve,reject,timer};jobs.set(id,key);
      worker.postMessage({type:'generate',id,text,voice,speed});
    });
    if(epoch!==own)throw Error('cancelled');return {...message,epoch:own};
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
  return {speak,stop,prepare,play,unlock,warm(){ensureWorker();worker.postMessage({type:'warm'});}};
}
