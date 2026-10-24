import {compileFacialPerformance,facialCue} from './facial-rig.mjs';
import { mountNeuralVoice, neuralCast, neuralRelease, pickNeuralProfile, automaticNeuralProfiles, neuralPlaybackPolicy, repairNeuralPreferences } from './neural-voice.mjs';
import { mountRecordedVoice } from './recorded-voice.mjs';
import { recordedVoiceClips } from './voice-data.mjs';
/* Ghost casting and exact-text recorded clips; no cloning claim. Browser voices do
 * not expose gender/timbre: known names are hints, listeners choose. */
export function castVoices(voices,preferred={}){
  const english=voices.filter(v=>/^en\b/i.test(v.lang)),pool=english.length?english:voices;
  const ghost=voices.find(v=>v.voiceURI===preferred.ghost)||pool.find(v=>/\bDavid\b/i.test(v.name))||pool.find(v=>/\b(Daniel|Alex|George|Oliver|Arthur|Fred|Thomas|Tom|Aaron|James|Guy)\b/i.test(v.name))||pool[0]||null;
  return {ghost};
}
/** Scene prose is always silent. Ghost introduces a contact before the alien
 * speaks, then responds. Choice acknowledgement remains first and never rerolls. */
export function speechSegments(frame,casting={}){
  const ghost=(text,field)=>({role:'ghost',text,voice:casting.ghost,rate:.91,pitch:.80,field});
  const lines=[];
  if(frame.decision?.spoken)lines.push(ghost(frame.decision.spoken,'choice-comment'));
  if(frame.lead)lines.push(ghost(frame.lead,'ghost-lead'));
  if(frame.transmission)lines.push({role:'alien',text:'',transmission:frame.transmission,field:null});
  if(frame.ghost)lines.push(ghost(frame.ghost,frame.battle?'roll-comment':frame.ghostField==='inspect-help'?'inspect-help':'ghost'));
  return lines;
}
// Typography is not pronunciation. Ordinary shouted words become speech words;
// only this explicit vocabulary gets letter names. Keep captions/clip keys exact.
const letterNames=new Set(['AI','API','BBS','CPU','CSS','DC','DM','FPS','GPU','HTML','HTTP','HTTPS','ID','JS','LLM','NPC','PCM','RMS','RNG','SDF','TTS','UI','URI','URL','USB','VR','XML']);
export function speechText(text){
  return text.replace(/\b[A-Za-z]+(?:['’][A-Za-z]+)?\b/g,word=>{
    const parts=/^([A-Z]{2,})(s|['’][sS])?$/.exec(word);
    if(!parts)return word.length>1&&word===word.toUpperCase()?word.toLowerCase():word;
    const [,base,suffix='']=parts;
    if(letterNames.has(base))return base.split('').join(' ')+(suffix?"’s":'');
    return word.toLowerCase();
  });
}
// Sentence offsets refer to original captions, not the pronunciation rewrite.
export function speechUnits(text,{coalesce=false}={}){
  const units=[],limit=coalesce?320:400;
  for(const sentence of new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)){
    const raw=sentence.segment;let at=0;
    while(raw.slice(at).trim()){
      let end=Math.min(raw.length,at+limit);
      if(end<raw.length){const space=raw.slice(at,end).lastIndexOf(' ');if(space>0)end=at+space+1;}
      const value=raw.slice(at,end),trimmed=value.trim();
      units.push({text:trimmed,start:sentence.index+at+value.indexOf(trimmed),end:sentence.index+end,pause:end<raw.length?20:/\n\s*\n/.test(value)?160:/[!?][”"’')]*\s*$/.test(value)?90:60});at=end;
    }
  }
  for(let i=0;i<units.length;i++)if(/\n\s*\n/.test(text.slice(units[i].start,units[i+1]?.start??text.length)))units[i].pause=160;
  if(!coalesce)return units;
  // Kokoro owns punctuation prosody within a passage. Avoid a new inference
  // request (and double pause) at every period; retain paragraphs and offsets.
  const passages=[];
  for(const unit of units){
    const prior=passages.at(-1),combined=prior?text.slice(prior.start,unit.end).trimEnd():'';
    if(prior&&prior.pause<160&&combined.length<=limit){prior.text=combined;prior.end=unit.end;prior.pause=unit.pause;}
    else passages.push({...unit});
  }
  return passages.map(unit=>({...unit,pause:unit.pause===160?120:40}));
}
// Give the first sentence its own small head start. The remaining speech
// keeps bounded passages and the model's punctuation, not per-period delays.
export function neuralPassages(text){
  const first=speechUnits(text,{coalesce:true})[0];if(!first)return [];
  const sentence=speechUnits(first.text)[0];
  const end=first.start+sentence.end;
  return [{text:text.slice(first.start,end).trim(),start:first.start,end,pause:40},
    ...speechUnits(text.slice(end),{coalesce:true}).map(unit=>({...unit,start:unit.start+end,end:unit.end+end}))];
}
// Source paragraph identity survives sentence and inference-buffer splits.
export function speechParagraph(text,offset){
  return (text.slice(0,offset).match(/\r?\n[ \t]*\r?\n(?:[ \t]*\r?\n)*/g)||[]).length;
}
function captionOffset(text,spokenIndex){
  let spoken=0;
  for(const token of text.matchAll(/\s+|\S+/g)){
    const length=speechText(token[0]).length;
    if(spokenIndex<=spoken+length)return token.index+Math.min(token[0].length,Math.ceil((spokenIndex-spoken)*token[0].length/length));
    spoken+=length;
  }
  return text.length;
}
export function mountReadAlong(root){
  let entries=[],revealed=false,queued=null;
  const get=id=>root.querySelector('#cg-'+id),button=get('reveal');
  function finish(){
    for(const e of entries){if(e.node.textContent===e.full)e.node.textContent=e.full;e.node.removeAttribute('data-reading');}
    entries=[];queued=null;if(button)button.hidden=true;root.querySelector('.cg-story')?.setAttribute('aria-live','polite');
  }
  button?.addEventListener('click',()=>{revealed=true;finish();});
  function prepare(segments,defer=false){
    finish();revealed=false;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    if(defer){prepare(segments,false);return;}
    for(const segment of segments){
      const node=get(segment.field);if(!node||!node.textContent)continue;
      const full=node.textContent,offset=segment.text.indexOf(full);if(offset<0)continue;
      const read=document.createElement('span'),unread=document.createElement('span');unread.className='cg-read-unread';unread.textContent=full;
      node.replaceChildren(read,unread);node.setAttribute('data-reading','waiting');entries.push({segment,node,full,offset,read,unread});
    }
    if(entries.length){if(button)button.hidden=false;root.querySelector('.cg-story')?.setAttribute('aria-live','off');}
  }
  function progress(segment,index){
    if(revealed)return;const e=entries.find(x=>x.segment===segment);if(!e)return;
    let n=Math.max(e.shown||0,Math.min(e.full.length,index-e.offset));if(n>0&&/[\uDC00-\uDFFF]/.test(e.full[n]||''))n--;e.shown=n;e.read.textContent=e.full.slice(0,n);e.unread.textContent=e.full.slice(n);e.node.setAttribute('data-reading',n===e.full.length?'complete':'speaking');
  }
  return {prepare,progress,finish,begin(){if(queued&&!revealed){const segments=queued;prepare(segments);}}};
}
export function mountSpeech(root,{note,pulse,talking,pcm,articulate,storage,silent=false,audio,alien}){
  const get=id=>root.querySelector('#cg-'+id),supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  let enabled=true,generation=0,settle=null,timer=0,preferred={},casting={ghost:null};
  let currentFrame=null,active=false,cursor=0,suspended=null,isPlaying=false;
  function report(message){
    if(preferred.engine==='device'&&/Kokoro|neural/i.test(message))return;
    if(isPlaying&&/generating|composing|loading|model ready/i.test(message))return;
    get('voice-note').textContent=message;note(message);
    const phase=/unavailable|too long/i.test(message)?'retry':/paused/i.test(message)?'paused':/speaking/i.test(message)?'speaking':/download|loading|Kokoro \/ .*%/i.test(message)?'loading':/compos|generat|buffer/i.test(message)?'preparing':'on';
    const button=get('voice');if(button){button.textContent='Voice: '+(enabled?phase:'off');button.title=message;button.dataset.voicePhase=enabled?phase:'off';}
    const boot=get('boot-voice');if(boot){boot.textContent=enabled?'VOICE: ON / '+phase.toUpperCase():'VOICE: OFF';boot.title=message;}
  }
  try{const saved=JSON.parse(storage?.getItem('friken.chromatic.voices.v1')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))preferred=saved;}catch{}
  preferred.engine=preferred.engine==='device'?'device':'neural';
  const policyChanged=preferred.castPolicy!=='cpu-fenrir-2026-10-22';
  if(policyChanged){preferred.performance='compact';if(!preferred.ghostNeural||preferred.ghostNeural==='bm_george')preferred.ghostNeural='am_fenrir';preferred.castPolicy='cpu-fenrir-2026-10-22';}
  const depthChanged=preferred.depthPolicy!=='onyx-2026-10-22';
  if(depthChanged){if(!preferred.ghostNeural||['am_fenrir','am_michael','bm_fable','bm_george'].includes(preferred.ghostNeural))preferred.ghostNeural='am_onyx';preferred.depthPolicy='onyx-2026-10-22';}
  const autoChanged=preferred.autoPolicy!=='measured-auto-2026-10-22';
  if(autoChanged){preferred.performance='auto';preferred.autoPolicy='measured-auto-2026-10-22';}
  preferred.performance=['auto','cpu','compact'].includes(preferred.performance)?preferred.performance:'auto';
  const fidelityChanged=repairNeuralPreferences(preferred);
  const autoHost=()=>neuralRelease.sha256+':'+(globalThis.navigator?.userAgent||'unknown')+':'+(globalThis.navigator?.hardwareConcurrency||1)+':'+(get('portrait')?.dataset?.revision||'face')+':native/60/warm3:'+neuralPlaybackPolicy+':'+preferred.ghostNeural;
  const validAuto=()=>preferred.autoTiming?.host===autoHost()&&Date.now()-preferred.autoTiming.at<21600000&&automaticNeuralProfiles.includes(preferred.autoTiming.profile);
  let calibrating=null,calibrationEpoch=0,slowReads=0;

  const readAlong=mountReadAlong(root);
  const neural=mountNeuralVoice({status:report,level:pcm,talking,audio,profile:preferred.performance==='auto'?(validAuto()?preferred.autoTiming.profile:'compact'):preferred.performance,work(info){root.dispatchEvent?.(new CustomEvent('cg-neural-work',{detail:info}));root.setAttribute?.('data-voice-pending',String(info.pending));},metrics(m){
    const rtf=m.generateMs/1000/m.audioSeconds;if(preferred.performance==='auto'&&!calibrating){if(m.audioSeconds>=3)slowReads=rtf>1.05?slowReads+1:0;if(slowReads>=3&&Date.now()-(preferred.autoTiming?.at||0)>300000){preferred.autoTiming=null;save();}}root.setAttribute?.('data-voice-rtf',rtf.toFixed(3));root.setAttribute?.('data-voice-device',m.device);root.setAttribute?.('data-voice-phases',JSON.stringify(m));
    const label=get('voice-metrics');if(label)label.textContent=m.device+' / '+m.dtype+' · '+(m.generateMs/1000).toFixed(2)+'s compute / '+m.audioSeconds.toFixed(2)+'s audio · '+rtf.toFixed(2)+'× real time (lower is faster)';
  }});
  const save=()=>{try{storage?.setItem('friken.chromatic.voices.v1',JSON.stringify(preferred));}catch{}};
  async function ensureAuto(){
    if(preferred.performance!=='auto')return;
    if(validAuto()){neural.setProfile(preferred.autoTiming.profile);root.setAttribute?.('data-voice-auto',JSON.stringify(preferred.autoTiming));return;}
    if(calibrating){await calibrating.catch(error=>{if(error.message!=='cancelled')throw error;});return ensureAuto();}
    const own=++calibrationEpoch;
    calibrating=(async()=>{
      const trials=[],probe='Keep the line open. I am measuring this machine so the next sentence does not leave you waiting.';
      for(const profile of automaticNeuralProfiles){
        if(own!==calibrationEpoch)throw Error('cancelled');
        neural.setProfile(profile);report('Kokoro / calibrating '+profile+' under this live renderer…');
        try{
          const warm=await neural.prepare(probe,{voice:preferred.ghostNeural,speed:.94,reuse:false});
          if(own!==calibrationEpoch)throw Error('cancelled');
          const message=await neural.prepare(probe,{voice:preferred.ghostNeural,speed:.94,reuse:false});
          if(own!==calibrationEpoch)throw Error('cancelled');
          const m=message.metrics;trials.push({profile,...m,warmup:warm.metrics,rtf:m.generateMs/1000/m.audioSeconds});
        }catch(error){if(own!==calibrationEpoch||error.message==='cancelled')throw error;trials.push({profile,error:error.message});}
      }
      const profile=pickNeuralProfile(trials);neural.setProfile(profile);
      preferred.autoTiming={host:autoHost(),at:Date.now(),profile,trials};slowReads=0;save();
      root.setAttribute?.('data-voice-auto',JSON.stringify(preferred.autoTiming));
      report('Kokoro / auto selected '+profile+' from measured CPU synthesis / GPU audio quarantined');
    })().finally(()=>{calibrating=null;});
    return calibrating;
  }
  const recorded=mountRecordedVoice(root,recordedVoiceClips,{note,level(value){pcm?.(value);},gate(){talking?.(false);}});
  function stop(preserveCalibration=true){if(!preserveCalibration){calibrationEpoch++;}articulate?.(null);alien?.stop();isPlaying=false;active=false;currentFrame=null;suspended=null;generation++;clearTimeout(timer);timer=0;if(!preserveCalibration||!calibrating)neural.stop();readAlong.finish();if(supported)speechSynthesis.cancel();recorded.stop();settle?.();settle=null;talking?.(false);}
  function refresh(){
    const voices=supported?speechSynthesis.getVoices():[];casting=castVoices(voices,preferred);
    for(const mode of ['auto','cpu','compact']){const node=get('performance-'+mode);if(node)node.checked=mode===preferred.performance;}
    for(const engine of ['neural','device']){const control=get('engine-'+engine);if(control)control.checked=preferred.engine===engine;}
    for(const role of ['ghost']){
      if(preferred.engine==='neural'){
        const options=neuralCast[role],key=role+'Neural';if(!options.some(([id])=>id===preferred[key]))preferred[key]=options[0][0];
        get(role+'-voice-name').textContent='Kokoro / '+options.find(([id])=>id===preferred[key])[1];
        const host=get(role+'-voices');host.replaceChildren();
        for(const [id,name] of options){const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='cg-'+role+'-cast';radio.checked=id===preferred[key];radio.addEventListener('change',()=>{stop(false);preferred[key]=id;save();refresh();note('Neural cast changed. Read scene to audition.');});label.append(radio,document.createTextNode(name));host.append(label);}continue;
      }
      get(role+'-voice-name').textContent=casting[role]?.name||'No device voice available';
      const host=get(role+'-voices');host.replaceChildren();
      const options=voices.filter(v=>/^en\b/i.test(v.lang)||v.voiceURI===casting[role]?.voiceURI);
      for(const v of options){const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='cg-'+role+'-cast';radio.checked=v.voiceURI===casting[role]?.voiceURI;
        radio.addEventListener('change',()=>{stop();preferred[role]=v.voiceURI;try{storage?.setItem('friken.chromatic.voices.v1',JSON.stringify(preferred));}catch{}refresh();note('Voice cast updated. Use Read this scene to audition.');});
        label.append(radio,document.createTextNode(v.name+' / '+v.lang+(v.localService?' / device':' / service')));host.append(label);}
    }
    get('voice-note').textContent=preferred.engine==='neural'?'Kokoro 82M / local neural speech. Onyx male / automatic measured CPU selection. First calibration compares q8 and q4 under the live renderer; results are local for six hours and rechecked after sustained slow generation. WebGPU speech is quarantined because it can return corrupted audio despite a successful speed test. GPU profiles remain available only in the diagnostic benchmark. Assets load from jsDelivr + Hugging Face; cached when permitted. Story text stays on this device. Ghost speaks directly to you; alien calls use their own source vocals. Scene descriptions remain silent. Read-along is playback-paced, approximate.':supported?(voices.length?'Ghost dialogue and alien source vocals; scene descriptions are silent. David recording generator is on the Windows checkout; current device voice is a fallback. Select by listening. Service voices may send text through their provider.':'Waiting for the browser’s voice inventory. Captions are ready.'):'This host has no speech API. Ghost and alien captions remain readable.';
  }
  function pause(ms,token){return new Promise(resolve=>{if(token!==generation){resolve();return;}settle=resolve;timer=setTimeout(()=>{timer=0;settle=null;resolve();},ms);});}
  function speak(frame,from=0){
    stop(true);if(!enabled||silent)return;
    if(document.hidden){suspended={frame,from};report('Voice paused while this tab is hidden. Return to resume.');return;}
    currentFrame=frame;cursor=from;active=true;
    const token=generation,segments=speechSegments(frame,casting);readAlong.prepare(segments,true);
    for(const key of ['voice-first-ms','voice-max-gap-ms','voice-play-count'])root.removeAttribute?.('data-'+key);
    async function run(){
      try{
        const tasks=segments.flatMap(segment=>segment.role==='alien'?[{segment,isAlien:true}]:recorded.has(segment.role,segment.text)?[{segment,clip:true}]:(preferred.engine==='neural'?neuralPassages(segment.text):speechUnits(segment.text)).map(unit=>({segment,unit})));
        const prepared=new Map();let lastPlaybackEnd=0,maxGap=0,playCount=0;const requestedAt=performance.now();
        if(preferred.engine==='neural'&&tasks.some(t=>!t.clip)){await neural.unlock();await ensureAuto();if(token!==generation)return;}
        const prepare=task=>neural.prepare(speechText(task.unit.text),{voice:preferred[task.segment.role+'Neural']||neuralCast[task.segment.role][0][0],speed:task.segment.role==='ghost'?.94:.98});
        function prime(index){for(let i=index;i<Math.min(tasks.length,index+3);i++){if(tasks[i].clip||tasks[i].isAlien||prepared.has(i))continue;const job=prepare(tasks[i]);job.catch(()=>{});prepared.set(i,job);}}
        if(preferred.engine==='neural')prime(from);
        for(let index=from;index<tasks.length;index++){
          cursor=index;
          const {segment,unit,clip,isAlien}=tasks[index];
          if(token!==generation)return;
          if(isAlien){talking?.(false);await alien?.play(segment.transmission);cursor=index+1;continue;}
          if(clip){await recorded.play(segment.role,segment.text);if(token===generation)readAlong.progress(segment,segment.text.length);continue;}
          if(preferred.engine==='device'&&!segment.voice){readAlong.progress(segment,segment.text.length);continue;}
          const spoken=speechText(unit.text);
          const paragraph=token+':'+segments.indexOf(segment)+':'+speechParagraph(segment.text,unit.start);
          const poseCue=(plan,fraction)=>({...facialCue(plan,fraction),paragraph});
          if(preferred.engine==='neural'){
              report('Kokoro / composing '+segment.role+' performance…');
              prime(index);const message=await prepared.get(index);prepared.delete(index);if(token!==generation)return;
              prime(index+1);
              // A tiny first sentence must not outrun a much longer next
              // inference. Start with two real ready buffers in this same
              // spoken segment, while the third continues in the worker.
              if(playCount===0&&tasks[index+1]?.unit&&tasks[index+1].segment===segment){
                report('Kokoro / buffering continuous speech…');
                await prepared.get(index+1);if(token!==generation)return;
              }
              const facePlan=compileFacialPerformance({text:spoken,phonemes:message.phonemes||''});
              root.setAttribute?.('data-face-timing',facePlan.source+' / '+facePlan.timing);
              await neural.play(message,{role:segment.role,
                onStart(){if(token===generation){isPlaying=true;const now=performance.now();if(lastPlaybackEnd)maxGap=Math.max(maxGap,now-lastPlaybackEnd);playCount++;root.setAttribute?.('data-voice-play-count',String(playCount));root.setAttribute?.('data-voice-max-gap-ms',maxGap.toFixed(1));if(playCount===1)root.setAttribute?.('data-voice-first-ms',(now-requestedAt).toFixed(1));readAlong.begin();report(segment.role.toUpperCase()+' / Kokoro neural / speaking locally');}},
                onProgress(fraction){if(token===generation){if(segment.role==='ghost')articulate?.(poseCue(facePlan,fraction));readAlong.progress(segment,unit.start+Math.floor(unit.text.length*fraction));}}});
              lastPlaybackEnd=performance.now();isPlaying=false;
            }else{
              await new Promise((resolve,reject)=>{
                settle=resolve;const line=new SpeechSynthesisUtterance(spoken);line.voice=segment.voice;line.lang=segment.voice.lang;line.rate=segment.rate;line.pitch=segment.pitch;
                let animation=0;const facePlan=compileFacialPerformance({text:spoken});
                const finish=()=>{cancelAnimationFrame(animation);if(token===generation){talking?.(false);readAlong.progress(segment,unit.end);}resolve();};
                line.onstart=()=>{if(token!==generation)return;readAlong.begin();talking?.(segment.role==='ghost');report(segment.role.toUpperCase()+' / device / '+segment.voice.name+' speaking');
                  const began=performance.now(),seconds=Math.max(.5,unit.text.split(/\s+/).length/(2.6*segment.rate));
                  const type=()=>{if(token!==generation)return;const fraction=Math.min(.96,(performance.now()-began)/1000/seconds);if(segment.role==='ghost')articulate?.(poseCue(facePlan,fraction));readAlong.progress(segment,unit.start+Math.floor(unit.text.length*fraction));animation=requestAnimationFrame(type);};type();};
                line.onboundary=event=>{if(token!==generation)return;cancelAnimationFrame(animation);const end=event.charIndex+(event.charLength||spoken.slice(event.charIndex).match(/^\S+/)?.[0].length||0);readAlong.progress(segment,unit.start+captionOffset(unit.text,end));if(segment.role==='ghost'){articulate?.(poseCue(facePlan,event.charIndex/Math.max(1,spoken.length)));pulse();}};
                line.onend=finish;line.onerror=e=>{cancelAnimationFrame(animation);talking?.(false);reject(Error('Device voice unavailable: '+e.error));};
                speechSynthesis.speak(line);
              });
            }
            if(token!==generation)return;
            readAlong.progress(segment,unit.end);cursor=index+1;talking?.(false);articulate?.(null);await pause(unit.pause,token);
        }
        if(token===generation){active=false;currentFrame=null;readAlong.finish();report('Voice finished · your move.');}
      }catch(error){if(token===generation){active=false;currentFrame=null;neural.stop();readAlong.finish();talking?.(false);report('Voice unavailable: '+error.message+'. Read scene retries; VOICE CAST offers another engine.');}}
    }
    void run();
  }
  for(const engine of ['neural','device'])get('engine-'+engine)?.addEventListener('change',()=>{stop(false);preferred.engine=engine;save();refresh();report(engine==='neural'?'Kokoro selected / next Read loads the local neural model.':'Ghost / device route ready. Hear Ghost to audition.');});
  for(const mode of ['auto','cpu','compact'])get('performance-'+mode)?.addEventListener('change',()=>{stop(false);preferred.performance=mode;if(mode!=='auto')neural.setProfile(mode);else preferred.autoTiming=null;save();refresh();note('Neural execution changed. Read scene loads the selected model.');});
  if(supported)speechSynthesis.addEventListener('voiceschanged',refresh);
  get('voice-settings').addEventListener('toggle',()=>{if(get('voice-settings').open){refresh();console.warn('[Chromatic speech] voice settings height',get('voice-settings').getBoundingClientRect().height);}});
  refresh();if(policyChanged||depthChanged||autoChanged||fidelityChanged)save();
  return {speak,stop,
    suspend(){if(active&&currentFrame){const next={frame:currentFrame,from:cursor};stop(false);suspended=next;report('Voice paused while this tab is hidden. Return to resume.');}neural.release();},
    resume(){if(enabled&&suspended&&!document.hidden){const next=suspended;speak(next.frame,next.from);}},
    warm(frame){if(enabled&&!silent&&preferred.engine==='neural'){try{
      neural.warm();if(preferred.performance==='auto'&&!validAuto())return;const tasks=frame?speechSegments(frame,casting).filter(segment=>segment.role!=='alien').flatMap(segment=>neuralPassages(segment.text).map(unit=>({segment,unit}))):[];
      for(const {segment,unit}of tasks.slice(0,3))void neural.prepare(speechText(unit.text),{voice:preferred[segment.role+'Neural']||neuralCast[segment.role][0][0],speed:segment.role==='ghost'?.94:.98}).catch(error=>{if(error.message!=='cancelled')report('Voice unavailable: '+error.message+' · Read scene to retry.');});
    }catch(error){report('Voice unavailable: '+error.message+' · Read scene to retry.');}}},
    unlock:()=>neural.unlock(),toggle(){if(preferred.engine==='device'&&!supported&&!recordedVoiceClips.length){note('This host has no browser voice or recorded pack · captions remain.');return false;}enabled=!enabled;if(!enabled)stop(false);return enabled;},get enabled(){return enabled;}};
}
