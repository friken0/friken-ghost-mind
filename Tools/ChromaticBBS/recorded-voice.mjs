/* Mail Hour 03 playback spine: decoded media -> actual PCM RMS -> mouth.
 * Generation belongs to the missing Windows source, not this player. */
export function validateVoiceClips(clips){
  if(!Array.isArray(clips)||clips.length>128)throw Error('Invalid voice clip inventory');
  const seen=new Set();let bytes=0;
  for(const c of clips){
    if(!c||!['ghost','narrator'].includes(c.role)||typeof c.text!=='string'||c.text.length>6000||typeof c.voice!=='string'||c.voice.length>120||typeof c.data!=='string'||!/^data:audio\/(mpeg|mp3|wav|ogg);base64,[A-Za-z0-9+/=]+$/.test(c.data))throw Error('Invalid recorded voice clip');
    const key=c.role+'\0'+c.text;if(seen.has(key))throw Error('Duplicate voice text');seen.add(key);bytes+=c.data.length;
  }
  if(bytes>600000)throw Error('Inline voice pack exceeds budget; use an explicit hosted adapter');
  return clips.map(c=>({...c}));
}
export function mountRecordedVoice(root,clips,{note,level,gate}){
  const inventory=validateVoiceClips(clips),media=document.createElement('audio');media.preload='none';media.hidden=true;root.append(media);
  let context=null,analyser=null,samples=null,raf=0,smooth=0,active=false,token=0,finish=null;
  function reset(){cancelAnimationFrame(raf);raf=0;active=false;smooth=0;level(0);gate(false);media.dataset.playback='stopped';}
  function stop(){token++;media.pause();reset();finish?.(false);finish=null;}
  function sample(){if(!active||document.hidden)return;analyser.getFloatTimeDomainData(samples);let sum=0;for(const s of samples)sum+=s*s;const rms=Math.sqrt(sum/samples.length);smooth+=(Math.min(1,rms*5)-smooth)*.55;media.dataset.rms=rms.toFixed(5);level(smooth);raf=requestAnimationFrame(sample);}
  async function play(role,text){
    const clip=inventory.find(c=>c.role===role&&c.text===text);if(!clip)return null;
    stop();const own=token;const result=new Promise(resolve=>{finish=resolve;});
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('Audio analysis unavailable');
      if(!context){context=new Audio();analyser=context.createAnalyser();analyser.fftSize=512;samples=new Float32Array(512);const source=context.createMediaElementSource(media);source.connect(analyser);analyser.connect(context.destination);}
      await context.resume();if(own!==token)return false;
      media.src=clip.data;media.volume=.95;
      media.onplaying=()=>{if(own!==token)return;active=true;media.dataset.playback='recorded';gate(role==='ghost');note(role.toUpperCase()+' / '+clip.voice+' / recorded audio'+(role==='ghost'?' · real PCM mouth':''));if(role==='ghost')sample();};
      media.onended=()=>{if(own!==token)return;reset();finish?.(true);finish=null;};
      media.onerror=()=>{if(own!==token)return;reset();note('Recording unavailable · captions remain');finish?.(false);finish=null;};
      await media.play();
    }catch(error){if(own===token){reset();note('Recording needs playback permission · '+error.message);finish?.(false);finish=null;}}
    return result;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  return {play,stop,has:(role,text)=>inventory.some(c=>c.role===role&&c.text===text)};
}
