import {musicTracks} from './music-data.mjs';
import {renderModem,modemDuration} from './modem.mjs';
/* One standalone audio owner: measured mixer -> cymatics. No microphone access.
 * All buses share one context. Browser autoplay refusal remains a visible state. */
export function normalizeVoice(samples,target=.14){
  if(!(samples instanceof Float32Array)||!samples.length)throw Error('Invalid PCM');
  let sum=0,count=0,peak=0;
  for(const x of samples){if(!Number.isFinite(x))throw Error('Nonfinite PCM');peak=Math.max(peak,Math.abs(x));if(Math.abs(x)>.005){sum+=x*x;count++;}}
  const rms=Math.sqrt(sum/Math.max(count,1)),gain=rms>.001?Math.min(8,target/rms):1;
  const output=Float32Array.from(samples,x=>.94*Math.tanh(x*gain/.94));
  let after=0,n=0;for(const x of output)if(Math.abs(x)>.005){after+=x*x;n++;}
  return {samples:output,inputRms:rms,outputRms:Math.sqrt(after/Math.max(n,1)),gain,peak};
}
export function spectrumBands(frequency,wave,sampleRate,fftSize,previous=0){
  const hz=sampleRate/fftSize;
  const energy=(lo,hi)=>{let s=0,n=0;for(let i=Math.max(1,Math.floor(lo/hz));i<Math.min(frequency.length,Math.ceil(hi/hz));i++){s+=frequency[i]/255;n++;}return Math.min(1,s/Math.max(1,n));};
  let sq=0;for(const x of wave)sq+=x*x;
  const rms=Math.sqrt(sq/Math.max(wave.length,1));
  return {bands:[energy(35,190),energy(190,2200),energy(2200,10000),Math.min(1,Math.max(0,rms-previous)*12)],rms,level:Math.min(1,rms*5)};
}
/* Deterministic, short battle cues. One existing SFX bus, no extra context.
 * FM charge, pitched lances, filtered debris and a receipt-specific resolve. */
export function renderBattleCue(kind,side=0,sampleRate=24000){
 const profiles={deploy:[.36,80,240],sample:[.22,300,920],reinforce:[.5,110,660],pressure:[.42,160,60],volley:[.2,side?740:410,side?170:1300],impact:[.34,95,32],collapse:[.58,65,22],resonance:[.6,330,990],victory:[.5,220,660],defeat:[.5,150,55]};
 const p=profiles[kind];if(!p)throw Error('Unknown battle cue '+kind);
 const [duration,start,end]=p,samples=new Float32Array(Math.ceil(duration*sampleRate));let phase=0,rng=1337,noise=0;
 for(let i=0;i<samples.length;i++){const t=i/sampleRate,u=t/duration,attack=Math.min(1,t/.008),tail=Math.pow(1-u,kind==='collapse'?1.5:2.4);rng=(Math.imul(rng,1664525)+1013904223)>>>0;noise=noise*.65+((rng>>>8)/8388608-1)*.35;
  const hz=start*Math.pow(end/start,u);phase+=Math.PI*2*hz/sampleRate;
  const blast=['impact','collapse','pressure'].includes(kind),chord=['victory','resonance','reinforce'].includes(kind);
  let v=Math.sin(phase+Math.sin(phase*2.01)*Math.exp(-u*6)*2)*.1;
  if(blast)v+=noise*.32+Math.sin(phase*.51)*.14;
  if(chord)v+=Math.sin(phase*1.25)*.055+Math.sin(phase*1.5)*.055;
  samples[i]=Math.tanh(v*attack*tail);
 }
 return samples;
}
export function mountAudio(root,{frame=()=>{},silent=false}={}){
  const get=id=>root?.querySelector('#cg-'+id);
  let context=null,mix=null,musicGain=null,voiceGain=null,sfxGain=null,analyser=null;
  let frequency=null,wave=null,raf=0,last=0,previous=0,musicSource=null,musicTrim=null,musicBuffer=null,track=0,musicEpoch=0,musicOffset=0,musicAt=0,musicOn=false,musicArmed=false,soundOn=true,speaking=false,modemSource=null,modemBuffer=null,modemStart=0,modemOffset=0,modemEnd=null,connecting=false;
  const battleBuffers=new Map(),battleSources=new Set();
  const info={battle:{cues:0,voices:0,peakVoices:0,last:'none'},context:'locked',music:'paused',track:musicTracks[0]?.title,frames:0,rms:0,bands:[0,0,0,0],voiceRelativeMusicGain:.55,voice:{},sampleMs:0};
  function label(){root?.setAttribute?.('data-music-state',info.music);root?.setAttribute?.('data-carrier-connected',String(musicArmed));const b=get('music');const bootMusic=get('boot-music');if(bootMusic){bootMusic.textContent='MUSIC: '+(musicOn?'ON':'OFF');bootMusic.setAttribute('aria-pressed',String(musicOn));}if(b){b.textContent='Music: '+(musicOn?'on':'off');b.setAttribute('aria-pressed',String(musicOn));}const t=get('track-name');if(t)t.textContent=musicTracks[track]?.title||'NO TRACK';const s=get('music-state');if(s)s.textContent=info.music==='playing'?'PLAYING / VOICE × 0.55':musicOn?'ON / '+info.music.toUpperCase().replaceAll('-',' '):'PAUSED BY YOU';}
  function graph(){
    if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Web Audio unavailable');context=new Audio();mix=context.createGain();voiceGain=context.createGain();musicGain=context.createGain();sfxGain=context.createGain();analyser=context.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.45;frequency=new Uint8Array(analyser.frequencyBinCount);wave=new Float32Array(analyser.fftSize);voiceGain.connect(mix);musicGain.connect(mix);sfxGain.connect(mix);mix.connect(analyser);const limiter=context.createDynamicsCompressor();limiter.threshold.value=-3;limiter.knee.value=3;limiter.ratio.value=12;analyser.connect(limiter);limiter.connect(context.destination);sfxGain.gain.value=.8;musicGain.gain.value=.55;}
    return {context,voice:voiceGain,music:musicGain,sfx:sfxGain,mix};
  }
  function sample(now){
    raf=0;if(!context||context.state!=='running'||document.hidden)return;
    if(now-last>=33){const began=performance.now();last=now;analyser.getByteFrequencyData(frequency);analyser.getFloatTimeDomainData(wave);const read=spectrumBands(frequency,wave,context.sampleRate,analyser.fftSize,previous);previous=read.rms;info.rms=read.rms;info.bands=read.bands;info.frames++;info.context=context.state;info.sampleMs=performance.now()-began;root?.setAttribute('data-audio-rms',read.rms.toFixed(4));frame(read.bands,read.level);for(const [i,id]of ['bass','mid','air'].entries()){const e=get('audio-'+id);if(e){e.style.setProperty('--cg-level',Math.round(read.bands[i]*100)+'%');e.textContent=Math.round(read.bands[i]*100)+'%';}}}
    raf=requestAnimationFrame(sample);
  }
  async function unlock(){if(silent)throw Error('Explicit QA audio mute');const g=graph();await Promise.race([context.resume(),new Promise(r=>setTimeout(r,250))]);if(context.state!=='running'){info.context=context.state;throw Error('Touch Connect to enable audio');}info.context='running';if(!raf)raf=requestAnimationFrame(sample);return g;}
  function gain(){if(!context)return;musicGain.gain.setTargetAtTime(.55,context.currentTime,.12);}
  function pauseMusic(){musicEpoch++;if(musicSource){musicOffset=(musicOffset+context.currentTime-musicAt)%(musicBuffer?.duration||1);musicSource.onended=null;try{musicSource.stop();}catch{}musicSource.disconnect();musicSource=null;}musicTrim?.disconnect();musicTrim=null;info.music=musicOn?(musicArmed?'waiting-for-touch':'waiting-for-connection'):'paused';label();}
  async function startMusic(){
    if(!musicOn||!musicArmed||silent||musicSource)return;const own=++musicEpoch;
    try{await unlock();if(own!==musicEpoch)return;info.music='loading';label();
      if(!musicBuffer){const t=musicTracks[track];if(!t)throw Error('No retained soundtrack');const r=await fetch(new URL(t.path,location.href));if(!r.ok)throw Error('Track HTTP '+r.status);const bytes=await r.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==t.sha256)throw Error('Track integrity mismatch');if(own!==musicEpoch)return;const decoded=await context.decodeAudioData(bytes);if(own!==musicEpoch)return;musicBuffer=decoded;let sq=0,n=0;for(let c=0;c<decoded.numberOfChannels;c++){const a=decoded.getChannelData(c);for(let i=0;i<a.length;i+=16){sq+=a[i]*a[i];n++;}}info.musicRms=Math.sqrt(sq/Math.max(1,n));}
      if(own!==musicEpoch)return;musicSource=context.createBufferSource();musicSource.buffer=musicBuffer;musicSource.loop=true;musicTrim=context.createGain();musicTrim.gain.value=Math.min(3,.14/Math.max(.01,info.musicRms));musicSource.connect(musicTrim);musicTrim.connect(musicGain);musicAt=context.currentTime;musicSource.start(0,musicOffset);gain();info.music='playing';label();
    }catch(error){if(own===musicEpoch){info.music=/Touch/.test(error.message)?'waiting-for-touch':error.message;label();}}
  }
  function stopModem(){if(modemSource){modemSource.onended=null;try{modemSource.stop();}catch{}modemSource.disconnect();modemSource=null;}connecting=false;gain();}
  async function modem(offset=0,onEnd=()=>{}){
    stopModem();if(silent)return false;try{await unlock();connecting=true;gain();if(!modemBuffer){const data=renderModem(context.sampleRate);modemBuffer=context.createBuffer(1,data.length,context.sampleRate);modemBuffer.copyToChannel(data,0);}modemOffset=offset;modemEnd=onEnd;modemSource=context.createBufferSource();modemSource.buffer=modemBuffer;const g=context.createGain();g.gain.value=soundOn?.55:0;modemSource.connect(g);g.connect(mix);modemStart=context.currentTime;modemSource.onended=()=>{modemSource=null;connecting=false;gain();onEnd();};modemSource.start(0,Math.min(offset,modemDuration-.01));return true;}catch{return false;}
  }
  function cue(positive=true){if(!soundOn||silent||!context||context.state!=='running')return;const at=context.currentTime,osc=context.createOscillator(),g=context.createGain();osc.type=positive?'sine':'triangle';osc.frequency.setValueAtTime(positive?260:130,at);osc.frequency.exponentialRampToValueAtTime(positive?780:50,at+.16);g.gain.setValueAtTime(.035,at);g.gain.exponentialRampToValueAtTime(.001,at+.22);osc.connect(g);g.connect(sfxGain);osc.onended=()=>{osc.disconnect();g.disconnect();};osc.start();osc.stop(at+.24);}
  function stopBattle(){for(const source of battleSources){source.onended=null;try{source.stop();}catch{}source.disconnect();}battleSources.clear();info.battle.voices=0;}
  function battleCue(event){
    if(!soundOn||silent||document.hidden||!context||context.state!=='running')return false;
    const key=event.kind+':'+event.side;
    if(!battleBuffers.has(key)){const pcm=renderBattleCue(event.kind,event.side,context.sampleRate),buffer=context.createBuffer(1,pcm.length,context.sampleRate);buffer.copyToChannel(pcm,0);battleBuffers.set(key,buffer);}
    if(battleSources.size>=6){const oldest=battleSources.values().next().value;oldest.onended=null;oldest.stop();oldest.disconnect();battleSources.delete(oldest);}
    const source=context.createBufferSource();source.buffer=battleBuffers.get(key);source.connect(sfxGain);battleSources.add(source);source.onended=()=>{source.disconnect();battleSources.delete(source);info.battle.voices=battleSources.size;};source.start();info.battle.cues++;info.battle.voices=battleSources.size;info.battle.peakVoices=Math.max(info.battle.peakVoices,battleSources.size);info.battle.last=event.kind;root?.setAttribute('data-battle-cues',String(info.battle.cues));root?.setAttribute('data-battle-cue',event.kind);return true;
  }
  function toggleMusic(){musicOn=!musicOn;info.music=musicOn?(musicArmed?'waiting-for-touch':'waiting-for-connection'):'paused';if(musicOn)void startMusic();else pauseMusic();label();}
  get('music')?.addEventListener('click',toggleMusic);get('boot-music')?.addEventListener('click',toggleMusic);
  get('music-next')?.addEventListener('click',()=>{pauseMusic();track=(track+1)%musicTracks.length;musicBuffer=null;musicOffset=0;musicOn=true;void startMusic();label();});
  const touch=()=>{if(silent)return;void unlock().then(()=>{if(musicOn&&musicArmed)void startMusic();}).catch(()=>{});};root?.addEventListener?.('pointerdown',touch,{capture:true});root?.addEventListener?.('keydown',touch,{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBattle();cancelAnimationFrame(raf);raf=0;frame([0,0,0,0],0);}else if(context?.state==='running'&&!raf)raf=requestAnimationFrame(sample);});
  window.addEventListener?.('pagehide',()=>{pauseMusic();stopModem();stopBattle();cancelAnimationFrame(raf);void context?.close();});label();
  return {graph,unlock,startMusic,pauseMusic,connection(ready){musicArmed=!!ready;info.carrierConnected=musicArmed;if(musicArmed){if(musicOn)void startMusic();}else pauseMusic();label();},modem,stopModem,cue,battleCue,stopBattle,info,speaking(value){speaking=!!value;info.speaking=speaking;gain();},sfx(value){soundOn=!!value;if(!soundOn)stopBattle();if(sfxGain)sfxGain.gain.value=soundOn?.8:0;},modemPause(){if(modemSource)modemOffset+=context.currentTime-modemStart;const offset=modemOffset;stopModem();return offset;},modemResume(offset){void modem(offset,modemEnd);},voiceReceipt(role,receipt){info.voice[role]=receipt;root?.setAttribute('data-'+role+'-rms',receipt.outputRms.toFixed(4));},get musicOn(){return musicOn;}};
}
