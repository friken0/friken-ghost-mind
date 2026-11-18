const measured=new WeakMap(),arrangements=new WeakMap();
export function scorePlaybackTrim(buffer,targetRms){
  if(!targetRms)return 1;
  let stats=measured.get(buffer);
  if(!stats){
   let sum=0,count=0,peak=0;
   for(let channel=0;channel<buffer.numberOfChannels;channel++){
    const pcm=buffer.getChannelData(channel);
    for(let i=0;i<pcm.length;i+=8){sum+=pcm[i]*pcm[i];peak=Math.max(peak,Math.abs(pcm[i]));count++;}
   }
   stats={rms:Math.sqrt(sum/Math.max(1,count)),peak};measured.set(buffer,stats);
  }
  return Math.min(4,targetRms/Math.max(.004,stats.rms),.92/Math.max(.001,stats.peak));
 }

// Web Audio plays the shared synth's stereo float output through the regular music bus.
export function mountScorePlayer(audio,status=()=>{}){
 let worker,ready=false,serial=0,active,selected,playing;
 const buffers=new Map(),pending=new Map();
 const keyFor=(source,rate,seconds)=>JSON.stringify([source.id??source,rate,seconds]);
 function prepare(source,{rate=48000,seconds=0}={}){
  const key=keyFor(source,rate,seconds);
  if(buffers.has(key))return Promise.resolve(buffers.get(key));
  for(const job of pending.values())if(job.key===key)return job.promise;
  if(!worker){
   worker=new Worker(new URL('./score-worker.mjs?v=ensemble-1',import.meta.url),{type:'module',name:'InfiniGen Audio'});
   worker.onmessage=({data})=>{
    if(data.ready){
     ready=true;
     for(const job of pending.values())worker.postMessage(job.request);
     return;
    }
    const job=pending.get(data.id);
    if(!job)return;
    pending.delete(data.id);
    if(data.error){job.reject(Error(data.error));return;}
    try{
     const pcm=new Float32Array(data.bytes);
     const context=audio.graph().context,frames=pcm.length/2;
     const buffer=context.createBuffer(2,frames,job.rate);
     const left=buffer.getChannelData(0),right=buffer.getChannelData(1);
     for(let i=0;i<frames;i++){left[i]=pcm[i*2];right[i]=pcm[i*2+1];}
     if(buffers.size>=6)buffers.delete(buffers.keys().next().value);
     if(data.arrangement)arrangements.set(buffer,data.arrangement);
     buffers.set(job.key,buffer);job.resolve(buffer);
    }catch(error){job.reject(error);}
   };
   worker.onerror=()=>{
    for(const job of pending.values())job.reject(Error('InfiniGen browser runtime unavailable'));
    pending.clear();worker.terminate();worker=null;ready=false;
   };
  }
  const id=++serial,request={id,source,rate,seconds};
  let job;
  const promise=new Promise((resolve,reject)=>{job={key,rate,resolve,reject,request};});
  job.promise=promise;pending.set(id,job);
  if(ready)worker.postMessage(request);
  return promise;
 }
 function retire(playback){
  if(!playback)return;
  const time=playback.node.context.currentTime;
  playback.gain.gain.setTargetAtTime(0,time,.045);
  playback.node.stop(time+.25);
 }
 function stop(){
  active=null;selected=null;
  retire(playing);playing=null;status('idle');
 }
 function start(buffer,{context,music},volume,offset=0,targetRms=0){
  const node=context.createBufferSource(),gain=context.createGain();
  node.buffer=buffer;node.loop=true;
  node.connect(gain);gain.connect(music);
  gain.gain.value=0;
  gain.gain.setTargetAtTime(volume*scorePlaybackTrim(buffer,targetRms),context.currentTime,.06);
  node.onended=()=>{node.disconnect();gain.disconnect();};
  node.start(0,offset%buffer.duration);
  return {node,gain,started:context.currentTime-offset};
 }
 async function play(source,{rate=48000,gain=.7,targetRms=0}={}){
  const key=keyFor(source,rate,0);
  if(selected===key)return;
  stop();selected=key;
  const token=active=Symbol();
  status('synthesizing');
  try{
   const complete=buffers.get(key);
   const [graph,buffer]=await Promise.all([audio.unlock(),complete??prepare(source,{rate,seconds:8})]);
   if(active!==token)return;
   playing=start(buffer,graph,gain,0,targetRms);
   status('playing',arrangements.get(buffer));
   if(complete)return;
   const master=await prepare(source,{rate});
   if(active!==token)return;
   const opening=playing;
   playing=start(master,graph,gain,(graph.context.currentTime-opening.started)%opening.node.buffer.duration,targetRms);
   retire(opening);
  }catch(error){
   if(active===token){
    selected=null;
    if(!playing)status(error.message);
   }
  }
 }
 return {play,prepare,stop};
}
