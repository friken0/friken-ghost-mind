import {compileFacialPerformance,facialCue} from './facial-rig.mjs';
import { mountNeuralVoice, neuralCast, neuralRelease, automaticNeuralProfiles, neuralPlaybackPolicy, repairNeuralPreferences, applyNeuralDefaultCast } from './neural-voice.mjs';
/* The selected engine owns both fixed session actors through preparation and
 * replay. No timeout recasts a neural actor as a device voice. Browser voices
 * do not expose gender/timbre: known names are hints, listeners choose. */
const maleNames=['Alex','Daniel','David','George','Oliver','Arthur','Fred','Thomas','Tom','Aaron','James','Guy'];
const femaleNames=['Samantha','Victoria','Karen','Moira','Tessa','Serena','Ava','Allison','Susan','Zira','Jenny','Aria'];
const knownMale=voice=>maleNames.some(name=>new RegExp('\\b'+name+'\\b','i').test(voice.name));
const maleFrom=items=>maleNames.map(name=>items.find(v=>new RegExp('\\b'+name+'\\b','i').test(v.name))).find(Boolean);
export function localMaleVoice(voices,preferred={}){
  const local=voices.filter(v=>/^en\b/i.test(v.lang)&&v.localService===true&&knownMale(v));
  return local.find(v=>v.voiceURI===preferred.ghost)||maleFrom(local)||null;
}
export function localFemaleVoice(voices,preferred={}){
  const local=voices.filter(v=>/^en\b/i.test(v.lang)&&v.localService===true&&femaleNames.some(name=>new RegExp('\\b'+name+'\\b','i').test(v.name)));
  return local.find(v=>v.voiceURI===preferred.companion)||femaleNames.map(name=>local.find(v=>new RegExp('\\b'+name+'\\b','i').test(v.name))).find(Boolean)||null;
}
export function castVoices(voices,preferred={}){
  const english=voices.filter(v=>/^en\b/i.test(v.lang)),pool=english.length?english:voices;
  const local=pool.filter(v=>v.localService!==false);
  const ghost=voices.find(v=>v.voiceURI===preferred.ghost)||maleFrom(local)||maleFrom(pool)||local[0]||pool[0]||null;
  return {ghost};
}
/** Scene prose is always silent. Ghost introduces a contact before the alien
 * speaks, then responds. Choice acknowledgement remains first and never rerolls. */
export function speechSegments(frame,casting={}){
  const ghost=(text,field)=>({role:'ghost',text,voice:casting.ghost,rate:.94,pitch:1,field});
  const lines=[];
  if(frame.decision?.spoken)lines.push(ghost(frame.decision.spoken,'choice-comment'));
  if(frame.lead)lines.push(ghost(frame.lead,'ghost-lead'));
  if(frame.transmission)lines.push({role:'alien',text:'',transmission:frame.transmission,field:null});
  if(frame.ghost)lines.push(ghost(frame.ghost,frame.battle?'roll-comment':frame.ghostField==='inspect-help'?'inspect-help':'ghost'));
  if(typeof frame.companion==='string'&&frame.companion.trim())lines.push({role:'companion',text:frame.companion,voice:casting.companion,rate:.98,pitch:1,field:'companion'});
  if(typeof frame.ghostReply==='string'&&frame.ghostReply.trim())lines.push(ghost(frame.ghostReply,'ghost-reply'));
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
export function speechUnits(text,{coalesce=false,maxLength=null}={}){
  const units=[],limit=maxLength??(coalesce?320:400);if(!Number.isInteger(limit)||limit<80||limit>400)throw Error('Bounded speech passage required');
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
  const first=speechUnits(text,{coalesce:true,maxLength:120})[0];if(!first)return [];
  const sentence=speechUnits(first.text,{maxLength:120})[0],end=first.start+sentence.end;
  return [{text:text.slice(first.start,end).trim(),start:first.start,end,pause:40},...speechUnits(text.slice(end),{coalesce:true,maxLength:120}).map(unit=>({...unit,start:unit.start+end,end:unit.end+end}))];
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
/** Snapshot the requested engine and both actors. Readiness, queue pressure,
 * voice-inventory events and replay cache hits never recast an active line. */
export function speechCastSnapshot(preferred={},casting={}){
 const plan={engine:preferred.engine==='device'?'device':'neural'};
 for(const role of ['ghost','companion']){
  const selected=preferred[role+'Neural'],neural=neuralCast[role].some(([id])=>id===selected)?selected:neuralCast[role][0][0];
  plan[role]=Object.freeze({voice:casting[role]||null,neural,rate:role==='ghost'?.94:.98,pitch:1});
 }
 return Object.freeze(plan);
}
export function mountReadAlong(root){
  let entries=[],revealed=false,queued=null;
  const get=id=>root.querySelector('#cg-'+id),button=get('reveal');
  function emit(e,state,index=e.index||0){
    if(e.state===state&&e.index===index)return;e.state=state;e.index=index;
    // Reusable captions describe the original dialogue, independent of a
    // paragraph panel or reduced-motion preference. Nothing is a scene timer.
    const Event=root.ownerDocument?.defaultView?.CustomEvent||globalThis.CustomEvent;
    if(root.dispatchEvent&&Event)root.dispatchEvent(new Event('cg-caption',{detail:{field:e.segment.field,text:e.segment.text,index,state}}));
  }
  function finish(reveal=false){
    // read + unread always concatenate to the full caption. That equality is
    // NOT proof of speech: flattening it used to reveal entire failed buffers.
    for(const e of entries){if(e.node){if(reveal||e.shown>=e.full.length)e.node.textContent=e.full;e.node.removeAttribute('data-reading');}if(e.state!=='complete')emit(e,'waiting');}
    entries=[];queued=null;if(button)button.hidden=true;root.querySelector('.cg-story')?.setAttribute('aria-live','polite');
  }
  button?.addEventListener('click',()=>{revealed=true;for(const e of entries)if(e.node){e.node.textContent=e.full;e.node.removeAttribute('data-reading');}if(button)button.hidden=true;root.querySelector('.cg-story')?.setAttribute('aria-live','polite');});
  function prepare(segments,defer=false){
    finish();revealed=false;
    const animated=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(defer){prepare(segments,false);return;}
    for(const segment of segments){
      if(!segment.field||typeof segment.text!=='string'||!segment.text.length)continue;
      const node=get(segment.field),full=node?.textContent||segment.text,offset=segment.text.indexOf(full),e={segment,node,full,offset:Math.max(0,offset),read:null,unread:null,index:0,state:null};
      if(animated&&node&&node.textContent&&offset>=0){const read=document.createElement('span'),unread=document.createElement('span');unread.className='cg-read-unread';unread.textContent=full;node.replaceChildren(read,unread);node.setAttribute('data-reading','waiting');e.read=read;e.unread=unread;}
      entries.push(e);emit(e,'waiting',0);
    }
    if(entries.some(e=>e.read)){if(button)button.hidden=false;root.querySelector('.cg-story')?.setAttribute('aria-live','off');}
  }
  function progress(segment,index){
    const e=entries.find(x=>x.segment===segment);if(!e)return;
    let at=Math.max(e.index||0,Math.min(segment.text.length,Math.max(0,Number.isFinite(index)?Math.floor(index):0)));if(at>0&&/[\uDC00-\uDFFF]/.test(segment.text[at]||''))at--;if(at>(e.index||0))emit(e,at===segment.text.length?'complete':'speaking',at);
    if(revealed||!e.read)return;let n=Math.max(e.shown||0,Math.min(e.full.length,at-e.offset));if(n>0&&/[\uDC00-\uDFFF]/.test(e.full[n]||''))n--;if(n===(e.shown??0))return;e.shown=n;e.read.textContent=e.full.slice(0,n);e.unread.textContent=e.full.slice(n);e.node.setAttribute('data-reading',n===e.full.length?'complete':'speaking');
  }
  return {prepare,progress,finish,begin(segment,index=0){if(queued&&!revealed){const segments=queued;prepare(segments);}const e=entries.find(x=>x.segment===segment);if(e)emit(e,'speaking',Math.max(e.index||0,Math.min(segment.text.length,index)));}};
}
export function mountSpeech(root,{note,pulse,talking,pcm,articulate,speaker,companionTalking,companionPulse,beforeSpeaker,ended,onState,storage,silent=false,audio,alien}){
  const get=id=>root.querySelector('#cg-'+id),supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  let enabled=true,generation=0,settle=null,timer=0,preferred={},casting={ghost:null},deviceCasting={ghost:null,companion:null};
  let backgroundSafe=false;let persistentHits=0,persistentWrites=0;let warmQueue=[],warmBusy=false,warmDone=0,warmTotal=0;let currentFrame=null,active=false,cursor=0,suspended=null,isPlaying=false,currentSpeaker=null;
  function setSpeaker(role){if(currentSpeaker===role)return;currentSpeaker=role;root.setAttribute?.('data-voice-speaker',role||'none');speaker?.(role);}
  function report(message){
    if(preferred.engine==='device'&&/Kokoro|neural/i.test(message))return;
    if(isPlaying&&/generating|composing|loading|model ready|Voice cache|Voice download/i.test(message))return;
    get('voice-note').textContent=message;note(message);
    const phase=/unavailable|too long|cache paused/i.test(message)?'retry':warmBusy&&!active?'caching':/paused/i.test(message)?'paused':/speaking/i.test(message)?'speaking':/download|loading|Kokoro \/ .*%/i.test(message)?'loading':/compos|generat|buffer|prepar|waiting/i.test(message)?'preparing':'on';
    onState?.({phase:/Voice finished/i.test(message)?'complete':phase,text:phase==='caching'?'CACHING LIKELY REPLIES '+warmDone+'/'+warmTotal+' / YOUR MOVE':message});
    const button=get('voice');if(button){button.textContent='Voice: '+(enabled?phase:'off');button.title=message;button.dataset.voicePhase=enabled?phase:'off';}
    const boot=get('boot-voice');if(boot){boot.textContent=enabled?'VOICE: ON / '+phase.toUpperCase():'VOICE: OFF';boot.title=message;}
  }
  try{const saved=JSON.parse(storage?.getItem('friken.chromatic.voices.v1')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))preferred=saved;}catch{}
  preferred.engine=preferred.engine==='device'?'device':'neural';
  const policyChanged=applyNeuralDefaultCast(preferred);
  const autoChanged=preferred.autoPolicy!=='measured-auto-2026-10-22';
  if(autoChanged){preferred.performance='auto';preferred.autoPolicy='measured-auto-2026-10-22';}
  preferred.performance=['auto','cpu','compact'].includes(preferred.performance)?preferred.performance:'auto';
  const fidelityChanged=repairNeuralPreferences(preferred);
  // A face edit/app build does not alter model weights or this host's CPU.
  // Never download a second 305 MB model merely to benchmark before speaking.
  const autoHost=()=>neuralRelease.sha256+':'+(globalThis.navigator?.userAgent||'unknown')+':'+(globalThis.navigator?.hardwareConcurrency||1)+':startup-cache-v2:'+neuralPlaybackPolicy+':'+preferred.ghostNeural;
  const validAuto=()=>preferred.autoTiming?.host===autoHost()&&automaticNeuralProfiles.includes(preferred.autoTiming.profile);
  let calibrating=null,calibrationEpoch=0;

  const readAlong=mountReadAlong(root);
  const neural=mountNeuralVoice({status:report,level:pcm,talking,audio,profile:preferred.performance==='auto'?(validAuto()?preferred.autoTiming.profile:'cpu'):preferred.performance,asset(info){if(info.type==='pcm-cache'){if(info.state==='hit')root.setAttribute?.('data-voice-persistent-hits',String(++persistentHits));if(info.state==='stored')root.setAttribute?.('data-voice-persistent-writes',String(++persistentWrites));}root.setAttribute?.(info.type==='pcm-cache'?'data-voice-pcm-cache':'data-voice-cache',JSON.stringify(info));},work(info){root.dispatchEvent?.(new CustomEvent('cg-neural-work',{detail:info}));root.setAttribute?.('data-voice-pending',String(info.pending));root.setAttribute?.('data-voice-cached-clips',String(info.cachedClips));if(!info.pending)queueMicrotask(pumpWarm);},metrics(m){
    const rtf=m.generateMs/1000/m.audioSeconds;if(preferred.performance==='auto'&&validAuto()){preferred.autoTiming.lastRtf=rtf;preferred.autoTiming.lastGenerateMs=m.generateMs;save();}root.setAttribute?.('data-voice-rtf',rtf.toFixed(3));root.setAttribute?.('data-voice-device',m.device);root.setAttribute?.('data-voice-phases',JSON.stringify(m));
    const label=get('voice-metrics');if(label)label.textContent=m.device+' / '+m.dtype+' · '+(m.generateMs/1000).toFixed(2)+'s compute / '+m.audioSeconds.toFixed(2)+'s audio · '+rtf.toFixed(2)+'× real time (lower is faster)';
  }});
  const save=()=>{try{storage?.setItem('friken.chromatic.voices.v1',JSON.stringify(preferred));}catch{}};
  async function ensureAuto(){
    if(preferred.performance!=='auto')return;
    if(!validAuto()){preferred.autoTiming={host:autoHost(),at:Date.now(),profile:'cpu',reason:'smallest CPU download; real passages supply performance metrics'};save();}
    neural.setProfile(preferred.autoTiming.profile);root.setAttribute?.('data-voice-auto',JSON.stringify(preferred.autoTiming));
  }
  let framingAbort=null;
  function stop(preserveCalibration=true,keepPrepared=false){if(!preserveCalibration)warmQueue=[];framingAbort?.abort();framingAbort=null;if(!preserveCalibration){calibrationEpoch++;}articulate?.(null);alien?.stop();isPlaying=false;active=false;backgroundSafe=false;currentFrame=null;suspended=null;generation++;clearTimeout(timer);timer=0;if(!preserveCalibration||!calibrating)neural.stop({keepPrepared});readAlong.finish();if(supported)speechSynthesis.cancel();settle?.();settle=null;talking?.(false);companionTalking?.(false);audio?.speaking(false);setSpeaker(null);}
  function refresh(){
    const voices=supported?speechSynthesis.getVoices():[],available={...castVoices(voices,preferred),companion:localFemaleVoice(voices,preferred)};
    for(const role of ['ghost','companion'])if(!deviceCasting[role]&&available[role])deviceCasting[role]=available[role];
    casting={...deviceCasting};
    for(const mode of ['auto','cpu','compact']){const node=get('performance-'+mode);if(node)node.checked=mode===preferred.performance;}
    for(const engine of ['neural','device']){const control=get('engine-'+engine);if(control)control.checked=preferred.engine===engine;}
    for(const role of ['ghost','companion']){
      if(preferred.engine==='neural'){
        const options=neuralCast[role],key=role+'Neural';if(!options.some(([id])=>id===preferred[key]))preferred[key]=options[0][0];
        const name=get(role+'-voice-name');if(name)name.textContent='Kokoro / '+options.find(([id])=>id===preferred[key])[1];
        const host=get(role+'-voices');if(!host)continue;host.replaceChildren();
        for(const [id,name] of options){const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='cg-'+role+'-cast';radio.checked=id===preferred[key];radio.addEventListener('change',()=>{stop(false);preferred[key]=id;preferred[key+'Explicit']=true;save();refresh();note('Neural cast changed. Read scene to audition.');});label.append(radio,document.createTextNode(name));host.append(label);}continue;
      }
      const name=get(role+'-voice-name');if(name)name.textContent=casting[role]?.name||'No device voice available';
      const host=get(role+'-voices');if(!host)continue;host.replaceChildren();
      const options=voices.filter(v=>/^en\b/i.test(v.lang)||v.voiceURI===casting[role]?.voiceURI);
      for(const v of options){const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='cg-'+role+'-cast';radio.checked=v.voiceURI===casting[role]?.voiceURI;
        radio.addEventListener('change',()=>{stop();preferred[role]=v.voiceURI;deviceCasting[role]=v;try{storage?.setItem('friken.chromatic.voices.v1',JSON.stringify(preferred));}catch{}refresh();note('Voice cast updated. Use Read this scene to audition.');});
        label.append(radio,document.createTextNode(v.name+' / '+v.lang+(v.localService?' / device':' / service')));host.append(label);}
    }
    get('voice-note').textContent=preferred.engine==='neural'?'Kokoro 82M / local neural speech. Default audition candidate: low-register Michael at natural pitch and 0.94 speed. Else uses Heart, a separate female cast. Choose the cast by ear. CPU q8 starts with the smaller ~92 MB download; CPU q4 (~305 MB) is an explicit option. Performance is measured on real dialogue, with no startup benchmark. Pinned runtime, model and voice assets persist in this browser for offline reuse when storage permits. Your selected cast stays fixed through loading, pauses and replay. A slow preparation never switches to a device voice; choose Device explicitly if wanted. WebGPU speech remains quarantined for audio corruption. Story text stays on this device. Ghost speaks directly; alien calls use source vocals. Scene descriptions stay silent. Read-along follows actual playback; phoneme positions within PCM are approximate.':supported?(voices.length?'Ghost dialogue and alien source vocals; scene descriptions are silent. David recording generator is on the Windows checkout; the explicit Device cast is separate. Select by listening. Service voices may send text through their provider.':'Waiting for the browser’s voice inventory. Captions are ready.'):'This host has no speech API. Ghost and alien captions remain readable.';
  }
  async function pumpWarm(){
    if(!warmQueue.length||warmBusy||(active&&!backgroundSafe)||!enabled||silent||document.hidden||preferred.engine!=='neural'||neural.pending)return;
    warmBusy=true;const job=warmQueue.shift();
    try{await neural.prepare(job.text,{voice:job.voice,speed:job.speed});warmDone++;onState?.({phase:'caching',text:'CACHING LIKELY REPLIES '+warmDone+'/'+warmTotal+' / YOUR MOVE'});}
    catch(error){if(error.message==='cancelled')warmQueue.unshift(job);else{report('Voice cache paused: '+error.message);warmQueue=[];}}
    finally{warmBusy=false;if(warmQueue.length&&(!active||backgroundSafe)&&!document.hidden&&enabled)queueMicrotask(pumpWarm);}
  }
  function primeFrames(frames){
    if(!Array.isArray(frames)||frames.length>32)throw Error('At most32 likely reply frames');
    const plan=speechCastSnapshot(preferred,casting),seen=new Set(),queue=[],lanes=frames.map(frame=>speechSegments(frame,casting).filter(s=>s.role!=='alien').flatMap(segment=>neuralPassages(segment.text).map(unit=>({text:speechText(unit.text),voice:plan[segment.role].neural,speed:plan[segment.role].rate}))));
    // Complete the current destination first, then give each probable next
    // destination three opening passages before filling deeper paragraphs.
    // Foreground Read owns its own three-job look-ahead.
    const first=lanes.shift()||[];lanes.unshift([]);const depth=Math.max(0,...lanes.map(a=>a.length));for(const job of first){const key=JSON.stringify(job);if(!seen.has(key)){seen.add(key);queue.push(job);}}for(let at=0;at<depth;at+=3)for(const lane of lanes)for(const job of lane.slice(at,at+3)){const key=JSON.stringify(job);if(!seen.has(key)){seen.add(key);queue.push(job);}}
    warmQueue=queue.slice(0,192);warmDone=0;warmTotal=warmQueue.length;queueMicrotask(pumpWarm);
  }
  function pause(ms,token){return new Promise(resolve=>{if(token!==generation){resolve();return;}settle=resolve;timer=setTimeout(()=>{timer=0;settle=null;resolve();},ms);});}
  function speak(frame,from=0){
    stop(true,true);if(!enabled||silent)return;
    if(document.hidden){suspended={frame,from};report('Voice paused while this tab is hidden. Return to resume.');return;}
    currentFrame=frame;cursor=from;active=true;
    framingAbort=new AbortController();const framingSignal=framingAbort.signal;
    const token=generation,plan=speechCastSnapshot(preferred,casting),segments=speechSegments(frame,{ghost:plan.ghost.voice,companion:plan.companion.voice});readAlong.prepare(segments,true);
    root.setAttribute?.('data-voice-route',plan.engine);root.setAttribute?.('data-voice-cast',JSON.stringify(Object.fromEntries(['ghost','companion'].map(role=>[role,plan.engine==='neural'?plan[role].neural:plan[role].voice?.voiceURI||'unavailable']))));
    for(const key of ['voice-first-ms','voice-max-gap-ms','voice-play-count'])root.removeAttribute?.('data-'+key);
    async function run(){
      try{
        const tasks=segments.flatMap(segment=>segment.role==='alien'?[{segment,isAlien:true}]:(plan.engine==='neural'?neuralPassages(segment.text):speechUnits(segment.text)).map(unit=>({segment,unit})));
        const prepared=new Map(),readyJobs=new Set();let framedRole=null,lastPlaybackEnd=0,maxGap=0,playCount=0;const requestedAt=performance.now();
        if(plan.engine==='neural'&&tasks.some(t=>!t.isAlien)){await neural.unlock();await ensureAuto();if(token!==generation)return;}
        const prepare=task=>neural.prepare(speechText(task.unit.text),{voice:plan[task.segment.role].neural,speed:plan[task.segment.role].rate});
        function prime(index){for(let i=index;i<Math.min(tasks.length,index+3);i++){if(tasks[i].isAlien||prepared.has(i))continue;const job=prepare(tasks[i]);job.then(()=>{readyJobs.add(i);if(token===generation&&tasks.every((t,n)=>t.isAlien||n<from||readyJobs.has(n))){backgroundSafe=true;queueMicrotask(pumpWarm);}},()=>{});prepared.set(i,job);}}
        if(plan.engine==='neural')prime(from);
        for(let index=from;index<tasks.length;index++){
          cursor=index;
          const {segment,unit,isAlien}=tasks[index];
          if(token!==generation)return;
          if(isAlien){talking?.(false);setSpeaker(null);await alien?.play(segment.transmission);cursor=index+1;continue;}
          if(plan.engine==='device'&&!segment.voice)throw Error('No device voice is available; captions remain unread');
          const spoken=speechText(unit.text);
          const paragraph=token+':'+segments.indexOf(segment)+':'+speechParagraph(segment.text,unit.start);
          const poseCue=(plan,fraction)=>({...facialCue(plan,fraction),paragraph});
          let message;
          if(plan.engine==='neural'){
              report('Kokoro / preparing part '+(index+1)+' of '+tasks.length+' / '+segment.role+' / '+plan[segment.role].neural+' / keeping your selected voice…');
              prime(index);message=await prepared.get(index);
              if(token!==generation)return;
              prepared.delete(index);prime(index+1);
          }
          if(beforeSpeaker&&framedRole!==segment.role){await beforeSpeaker(segment.role,{signal:framingSignal});if(token!==generation)return;framedRole=segment.role;}
          if(message){
              const facePlan=compileFacialPerformance({text:spoken,phonemes:message.phonemes||''});
              root.setAttribute?.('data-face-timing',facePlan.source+' / '+facePlan.timing);
              const receipt=await neural.play(message,{role:segment.role,voice:plan[segment.role].neural,
                onStart(){if(token===generation){isPlaying=true;setSpeaker(segment.role);companionTalking?.(segment.role==='companion',{measured:true});const now=performance.now();if(lastPlaybackEnd)maxGap=Math.max(maxGap,now-lastPlaybackEnd);playCount++;root.setAttribute?.('data-voice-play-count',String(playCount));root.setAttribute?.('data-voice-max-gap-ms',maxGap.toFixed(1));if(playCount===1)root.setAttribute?.('data-voice-first-ms',(now-requestedAt).toFixed(1));readAlong.begin(segment,unit.start);report((segment.role==='companion'?'ELSE':segment.role.toUpperCase())+' / Kokoro neural / speaking locally');}},
                onProgress(fraction){if(token===generation){if(segment.role==='ghost')articulate?.(poseCue(facePlan,fraction));readAlong.progress(segment,unit.start+Math.floor(unit.text.length*fraction));}}});
              if(token!==generation)return;if(!receipt?.played)throw Error('Neural playback did not complete; captions remain unread');lastPlaybackEnd=performance.now();isPlaying=false;companionTalking?.(false,{measured:true});setSpeaker(null);
            }else{
              await new Promise((resolve,reject)=>{
                settle=resolve;const voice=segment.voice,line=new SpeechSynthesisUtterance(spoken);line.voice=voice;line.lang=voice.lang;line.rate=segment.rate;line.pitch=segment.pitch;
                let animation=0,started=false;const facePlan=compileFacialPerformance({text:spoken});
                const finish=()=>{cancelAnimationFrame(animation);if(token!==generation){resolve();return;}isPlaying=false;talking?.(false);companionTalking?.(false);audio?.speaking(false);setSpeaker(null);if(!started){reject(Error('Device voice ended without starting playback; captions remain unread'));return;}readAlong.progress(segment,unit.end);resolve();};
                line.onstart=()=>{if(token!==generation)return;started=true;isPlaying=true;setSpeaker(segment.role);readAlong.begin(segment,unit.start);talking?.(segment.role==='ghost');companionTalking?.(segment.role==='companion');if(segment.role==='companion')companionPulse?.();audio?.speaking(true);report((segment.role==='companion'?'ELSE':segment.role.toUpperCase())+' / device / '+voice.name+' speaking');
                  const began=performance.now(),seconds=Math.max(.5,unit.text.split(/\s+/).length/(2.6*segment.rate));
                  const type=()=>{if(token!==generation)return;const fraction=Math.min(.96,(performance.now()-began)/1000/seconds);if(segment.role==='ghost')articulate?.(poseCue(facePlan,fraction));readAlong.progress(segment,unit.start+Math.floor(unit.text.length*fraction));animation=requestAnimationFrame(type);};type();};
                // Device boundaries are approximate articulation cues, not
                // PCM measurements. Else has her own channel and no new clock.
                line.onboundary=event=>{if(token!==generation)return;cancelAnimationFrame(animation);const end=event.charIndex+(event.charLength||spoken.slice(event.charIndex).match(/^\S+/)?.[0].length||0);readAlong.progress(segment,unit.start+captionOffset(unit.text,end));if(segment.role==='ghost'){articulate?.(poseCue(facePlan,event.charIndex/Math.max(1,spoken.length)));pulse();}else if(segment.role==='companion')companionPulse?.();};
                line.onend=finish;line.onerror=e=>{cancelAnimationFrame(animation);if(token!==generation){resolve();return;}isPlaying=false;talking?.(false);companionTalking?.(false);audio?.speaking(false);setSpeaker(null);reject(Error('Device voice unavailable: '+e.error));};
                speechSynthesis.speak(line);
              });
            }
            if(token!==generation)return;
            readAlong.progress(segment,unit.end);cursor=index+1;talking?.(false);articulate?.(null);await pause(unit.pause,token);
        }
        if(token===generation){active=false;currentFrame=null;readAlong.finish();setSpeaker(null);report('Voice finished · your move.');ended?.({state:'complete'});queueMicrotask(pumpWarm);}
      }catch(error){if(token===generation){active=false;currentFrame=null;neural.stop();readAlong.finish();talking?.(false);companionTalking?.(false);audio?.speaking(false);setSpeaker(null);report('Voice unavailable: '+error.message+'. Read retries your selected voice; captions remain.');ended?.({state:'error',message:error.message});}}
    }
    void run();
  }
  for(const engine of ['neural','device'])get('engine-'+engine)?.addEventListener('change',()=>{stop(false);preferred.engine=engine;save();refresh();report(engine==='neural'?'Kokoro selected / next Read loads the local neural model.':'Ghost / device route ready. Hear Ghost to audition.');});
  for(const mode of ['auto','cpu','compact'])get('performance-'+mode)?.addEventListener('change',()=>{stop(false);preferred.performance=mode;if(mode!=='auto')neural.setProfile(mode);else preferred.autoTiming=null;save();refresh();note('Neural execution changed. Read scene loads the selected model.');});
  if(supported)speechSynthesis.addEventListener('voiceschanged',refresh);
  get('voice-settings').addEventListener('toggle',()=>{if(get('voice-settings').open)refresh();});
  refresh();if(policyChanged||autoChanged||fidelityChanged)save();
  return {speak,stop,primeFrames,
    suspend(){if(active&&currentFrame){const next={frame:currentFrame,from:cursor},plan=warmQueue;stop(false);warmQueue=plan;suspended=next;report('Voice paused while this tab is hidden. Return to resume.');}neural.release();},
    resume(){queueMicrotask(pumpWarm);if(enabled&&suspended&&!document.hidden){const next=suspended;speak(next.frame,next.from);}},
    warm(frame){const warmGeneration=generation;if(enabled&&!silent&&preferred.engine==='neural')void(async()=>{try{
      if(!frame)neural.warm();if(preferred.performance==='auto'&&!validAuto())await ensureAuto();
      if(!enabled||document.hidden||warmGeneration!==generation)return;
      const plan=speechCastSnapshot(preferred,casting);
      const tasks=frame?speechSegments(frame,casting).filter(segment=>segment.role!=='alien').flatMap(segment=>neuralPassages(segment.text).map(unit=>({segment,unit}))):[];
      for(const {segment,unit}of tasks.slice(0,3))void neural.prepare(speechText(unit.text),{voice:plan[segment.role].neural,speed:plan[segment.role].rate}).catch(error=>{if(error.message!=='cancelled')report('Voice unavailable: '+error.message+' · Read scene to retry.');});
    }catch(error){if(error.message!=='cancelled')report('Voice unavailable: '+error.message+' · Read scene to retry.');}})();},
    unlock:()=>neural.unlock(),toggle(){if(preferred.engine==='device'&&!supported){note('This host has no browser voice · captions remain.');return false;}enabled=!enabled;if(!enabled)stop(false);return enabled;},get enabled(){return enabled;}};
}
