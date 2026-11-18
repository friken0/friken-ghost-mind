const measured=new WeakMap();
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

// The worker renders one immutable score in chronological windows. Schedule every
// window on the audio clock so animation frames never determine musical timing.
export function mountScorePlayer(audio,status=()=>{}){
 let worker,ready=false,serial=0,active=null,resumeKey,resumeAt=0;
 const cache=new Map(),pending=new Map();
 function sourceNode(play,buffer,at,offset,loop=false){
  const node=play.context.createBufferSource();
  node.buffer=buffer;node.loop=loop;
  node.connect(play.gain);
  play.nodes.add(node);
  node.onended=()=>{node.disconnect();play.nodes.delete(node);};
  node.start(at,offset);
 }
 function pump(play){
  const {tape,context}=play;
  if(!play.gain||!tape.buffer||play.looping)return;
  if(play.origin===null){
   if(play.offset>=tape.frames/tape.rate&&!tape.done)return;
   play.origin=context.currentTime+.08-play.offset;
   play.gain.gain.setTargetAtTime(play.volume,context.currentTime,.04);
   status('playing',tape.arrangement);
   if(tape.done){
    sourceNode(play,tape.buffer,play.origin+play.offset,play.offset,true);
    play.looping=true;return;
   }
  }
  for(;play.next<tape.chunks.length;play.next++){
   const chunk=tape.chunks[play.next],time=chunk.start/tape.rate;
   const offset=Math.max(0,play.offset-time);
   if(offset>=chunk.buffer.duration)continue;
   let at=play.origin+time+offset;
   if(at<context.currentTime){
    const delay=context.currentTime+.04-at;
    play.origin+=delay;at+=delay;
    tape.arrangement.underruns=(tape.arrangement.underruns||0)+1;
   }
   sourceNode(play,chunk.buffer,at,offset);
  }
  if(tape.done){
   sourceNode(play,tape.buffer,play.origin+tape.buffer.duration,0,true);
   play.looping=true;
   status('playing',tape.arrangement);
  }
 }
 function stop(){
  if(active){
   const play=active;
   resumeKey=play.tape.key;
   resumeAt=play.origin===null?play.offset:Math.max(0,play.context.currentTime-play.origin)%play.tape.buffer.duration;
   if(play.gain){
    const now=play.context.currentTime;
    play.gain.gain.setTargetAtTime(0,now,.015);
    for(const node of play.nodes)node.stop(now+.08);
   }
   active=null;
  }
  status('idle');
 }
 function fail(tape,error){
  pending.delete(tape.id);cache.delete(tape.key);
  if(active?.tape===tape){stop();status(error.message);}
  tape.reject(error);
 }
 function receive({data}){
  if(data.ready){
   ready=true;for(const tape of pending.values())worker.postMessage(tape.request);
   return;
  }
  const tape=pending.get(data.id);
  if(!tape)return;
  if(data.error){fail(tape,Error(data.error));return;}
  try{
   const context=audio.graph().context;
   if(data.bytes){
    const pcm=new Float32Array(data.bytes);
    tape.buffer=context.createBuffer(2,pcm.length/2,tape.rate);
    for(let c=0;c<2;c++){
     const channel=tape.buffer.getChannelData(c);
     for(let i=0;i<channel.length;i++)channel[i]=pcm[i*2+c];
    }
    tape.frames=tape.buffer.length;
   }else{
    if(!tape.buffer)tape.buffer=context.createBuffer(2,data.total,tape.rate);
    if(tape.frames!==data.start)throw Error('Out-of-order score window');
    const left=new Float32Array(data.left),right=new Float32Array(data.right);
    const chunk=context.createBuffer(2,left.length,tape.rate);
    chunk.copyToChannel(left,0);chunk.copyToChannel(right,1);
    tape.buffer.copyToChannel(left,0,data.start);tape.buffer.copyToChannel(right,1,data.start);
    tape.chunks.push({start:data.start,buffer:chunk});tape.frames+=left.length;
   }
   tape.arrangement={...data.arrangement,underruns:tape.arrangement?.underruns??0};
   tape.done=tape.frames===tape.buffer.length;
   if(active?.tape===tape)pump(active);
   if(tape.done){
    tape.chunks.length=0;pending.delete(tape.id);tape.resolve(tape.buffer);
    for(const [key,item] of cache){
     if(cache.size<=3)break;
     if(item.done&&item!==active?.tape)cache.delete(key);
    }
   }
  }catch(error){fail(tape,error);}
 }
 function request(source,{rate=48000,seconds=0}={}){
  const key=JSON.stringify([source.id??source,rate,seconds]);
  if(cache.has(key))return cache.get(key);
  if(!worker){
   worker=new Worker(new URL('./score-worker.mjs?v=score-windows-1',import.meta.url),{type:'module',name:'InfiniGen Audio'});
   worker.onmessage=receive;
   worker.onerror=()=>{
    for(const tape of pending.values())fail(tape,Error('InfiniGen browser runtime unavailable'));
    worker.terminate();worker=null;ready=false;
   };
  }
  const id=++serial,tape={id,key,rate,frames:0,chunks:[],request:{id,source,rate,seconds,stream:seconds===0}};
  tape.promise=new Promise((resolve,reject)=>{tape.resolve=resolve;tape.reject=reject;});
  pending.set(id,tape);cache.set(key,tape);
  if(ready)worker.postMessage(tape.request);
  return tape;
 }
 async function play(source,{rate=48000,gain=.7}={}){
  const tape=request(source,{rate});
  if(active?.tape===tape)return;
  if(active)stop();
  tape.promise.catch(()=>{});
  const play=active={tape,volume:gain,offset:resumeKey===tape.key?resumeAt:0,origin:null,next:0,nodes:new Set()};
  status('synthesizing');
  try{
   const graph=await audio.unlock();
   if(active!==play)return;
   play.context=graph.context;play.gain=graph.context.createGain();
   play.gain.gain.value=0;play.gain.connect(graph.music);
   pump(play);
  }catch(error){
   if(active===play){stop();status(error.message);}
  }
 }
 return {prepare:(source,options)=>request(source,options).promise,play,stop};
}
