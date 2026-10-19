import { mountNeuralVoice, neuralCast } from './neural-voice.mjs';
import { mountRecordedVoice } from './recorded-voice.mjs';
import { recordedVoiceClips } from './voice-data.mjs';
/* Separate casting and exact-text recorded clips; no cloning claim. Browser voices do
 * not expose gender/timbre: known names are hints, listeners choose. */
export function castVoices(voices,preferred={}){
  const english=voices.filter(v=>/^en\b/i.test(v.lang)),pool=english.length?english:voices;
  const find=(role,names,avoid)=>voices.find(v=>v.voiceURI===preferred[role])||pool.find(v=>v.voiceURI!==avoid&&names.test(v.name))||pool.find(v=>v.voiceURI!==avoid)||null;
  const david=pool.find(v=>/\bDavid\b/i.test(v.name));
  const ghost=voices.find(v=>v.voiceURI===preferred.ghost)||david||find('ghost',/\b(Daniel|Alex|George|Oliver|Arthur|Fred|Thomas|Tom|Aaron|David|James|Guy)\b/i);
  const narrator=find('narrator',/\b(Serena|Samantha|Karen|Tessa|Moira|Zira|Jenny|Aria)\b/i,ghost?.voiceURI);
  return {ghost,narrator:narrator?.voiceURI===ghost?.voiceURI?null:narrator};
}
export function speechSegments(frame,casting){
  const lines=[{role:'narrator',text:frame.scene,voice:casting.narrator,rate:.96,pitch:1,field:'scene'},
    {role:'ghost',text:frame.ghost,voice:casting.ghost,rate:.91,pitch:.80,field:frame.battle?'roll-comment':'ghost'}];
  if(frame.decision)lines.unshift({role:'ghost',text:frame.decision.spoken,voice:casting.ghost,rate:.91,pitch:.80,field:'choice-comment'});
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
  const units=[];
  for(const sentence of new Intl.Segmenter('en',{granularity:'sentence'}).segment(text)){
    const raw=sentence.segment;let at=0;
    while(raw.slice(at).trim()){
      let end=Math.min(raw.length,at+400);
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
    if(prior&&prior.pause<160&&combined.length<=400){prior.text=combined;prior.end=unit.end;prior.pause=unit.pause;}
    else passages.push({...unit});
  }
  return passages.map(unit=>({...unit,pause:unit.pause===160?120:40}));
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
    if(defer){queued=segments;if(button)button.hidden=false;return;}
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
export function mountSpeech(root,{note,pulse,talking,pcm,storage,silent=false}){
  const get=id=>root.querySelector('#cg-'+id),supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  let enabled=true,generation=0,settle=null,timer=0,preferred={},casting={ghost:null,narrator:null};
  try{const saved=JSON.parse(storage?.getItem('friken.chromatic.voices.v1')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))preferred=saved;}catch{}
  preferred.engine=preferred.engine==='device'?'device':'neural';
  const readAlong=mountReadAlong(root);
  const neural=mountNeuralVoice({status(message){get('voice-note').textContent=message;note(message);},level:pcm,talking});
  const save=()=>{try{storage?.setItem('friken.chromatic.voices.v1',JSON.stringify(preferred));}catch{}};
  const recorded=mountRecordedVoice(root,recordedVoiceClips,{note,level(value){pcm?.(value);},gate(){talking?.(false);}});
  function stop(){generation++;clearTimeout(timer);timer=0;neural.stop();readAlong.finish();if(supported)speechSynthesis.cancel();recorded.stop();settle?.();settle=null;talking?.(false);}
  function refresh(){
    const voices=supported?speechSynthesis.getVoices():[];casting=castVoices(voices,preferred);
    for(const engine of ['neural','device']){const control=get('engine-'+engine);if(control)control.checked=preferred.engine===engine;}
    for(const role of ['ghost','narrator']){
      if(preferred.engine==='neural'){
        const options=neuralCast[role],key=role+'Neural';if(!options.some(([id])=>id===preferred[key]))preferred[key]=options[0][0];
        get(role+'-voice-name').textContent='Kokoro / '+options.find(([id])=>id===preferred[key])[1];
        const host=get(role+'-voices');host.replaceChildren();
        for(const [id,name] of options){const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='cg-'+role+'-cast';radio.checked=id===preferred[key];radio.addEventListener('change',()=>{stop();preferred[key]=id;save();refresh();note('Neural cast changed. Read scene to audition.');});label.append(radio,document.createTextNode(name));host.append(label);}continue;
      }
      get(role+'-voice-name').textContent=casting[role]?.name||(role==='narrator'?'Captions / no distinct voice':'No device voice available');
      const host=get(role+'-voices');host.replaceChildren();
      const options=voices.filter(v=>/^en\b/i.test(v.lang)||v.voiceURI===casting[role]?.voiceURI);
      for(const v of options){const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='cg-'+role+'-cast';radio.checked=v.voiceURI===casting[role]?.voiceURI;
        radio.addEventListener('change',()=>{stop();preferred[role]=v.voiceURI;try{storage?.setItem('friken.chromatic.voices.v1',JSON.stringify(preferred));}catch{}refresh();note('Voice cast updated. Use Read this scene to audition.');});
        label.append(radio,document.createTextNode(v.name+' / '+v.lang+(v.localService?' / device':' / service')));host.append(label);}
    }
    get('voice-note').textContent=preferred.engine==='neural'?'Kokoro 82M / local neural speech. First Read downloads about 100 MB from jsDelivr + Hugging Face; cached when this host permits. Story text stays on this device. George speaks Ghost; Heart narrates. Read-along is playback-paced, approximate.':supported?(voices.length?'Female narrator + separate male Ghost. David recording generator is on the Windows checkout; current device voice is a fallback. Select by listening. Service voices may send text through their provider.':'Waiting for the browser’s voice inventory. Captions are ready.'):'This host has no speech API. Both roles remain captioned.';
  }
  function pause(ms,token){return new Promise(resolve=>{if(token!==generation){resolve();return;}settle=resolve;timer=setTimeout(()=>{timer=0;settle=null;resolve();},ms);});}
  function speak(frame){
    stop();if(!enabled||silent)return;
    const token=generation,segments=speechSegments(frame,casting);readAlong.prepare(segments,true);
    async function run(){
      try{
        const tasks=segments.flatMap(segment=>recorded.has(segment.role,segment.text)?[{segment,clip:true}]:speechUnits(segment.text,{coalesce:preferred.engine==='neural'}).map(unit=>({segment,unit})));
        let prepared=null;
        if(preferred.engine==='neural'&&tasks.some(t=>!t.clip))await neural.unlock();
        const prepare=task=>neural.prepare(speechText(task.unit.text),{voice:preferred[task.segment.role+'Neural']||neuralCast[task.segment.role][0][0],speed:task.segment.role==='ghost'?.94:.98});
        for(let index=0;index<tasks.length;index++){
          const {segment,unit,clip}=tasks[index];
          if(token!==generation)return;
          if(clip){await recorded.play(segment.role,segment.text);if(token===generation)readAlong.progress(segment,segment.text.length);continue;}
          if(preferred.engine==='device'&&!segment.voice){readAlong.progress(segment,segment.text.length);continue;}
          const spoken=speechText(unit.text);
          if(preferred.engine==='neural'){
              note('Kokoro / composing '+segment.role+' performance…');
              const message=await(prepared||prepare(tasks[index]));if(token!==generation)return;
              const next=tasks[index+1];prepared=next&&!next.clip?prepare(next):null;prepared?.catch(()=>{});
              await neural.play(message,{role:segment.role,
                onStart(){if(token===generation){readAlong.begin();note(segment.role.toUpperCase()+' / Kokoro neural / speaking locally');}},
                onProgress(fraction){if(token===generation)readAlong.progress(segment,unit.start+Math.floor(unit.text.length*fraction));}});
            }else{
              await new Promise(resolve=>{
                settle=resolve;const line=new SpeechSynthesisUtterance(spoken);line.voice=segment.voice;line.lang=segment.voice.lang;line.rate=segment.rate;line.pitch=segment.pitch;
                let animation=0;
                const finish=()=>{cancelAnimationFrame(animation);if(token===generation){talking?.(false);readAlong.progress(segment,unit.end);}resolve();};
                line.onstart=()=>{if(token!==generation)return;readAlong.begin();talking?.(segment.role==='ghost');note(segment.role.toUpperCase()+' / device / '+segment.voice.name+' speaking');
                  const began=performance.now(),seconds=Math.max(.5,unit.text.split(/\s+/).length/(2.6*segment.rate));
                  const type=()=>{if(token!==generation)return;readAlong.progress(segment,unit.start+Math.floor(unit.text.length*Math.min(.96,(performance.now()-began)/1000/seconds)));animation=requestAnimationFrame(type);};type();};
                line.onboundary=event=>{if(token!==generation)return;cancelAnimationFrame(animation);const end=event.charIndex+(event.charLength||spoken.slice(event.charIndex).match(/^\S+/)?.[0].length||0);readAlong.progress(segment,unit.start+captionOffset(unit.text,end));if(segment.role==='ghost')pulse();};
                line.onend=finish;line.onerror=e=>{if(token===generation)note('Device voice unavailable: '+e.error+' · captions remain.');finish();};
                speechSynthesis.speak(line);
              });
            }
            if(token!==generation)return;
            readAlong.progress(segment,unit.end);talking?.(false);await pause(unit.pause,token);
        }
        if(token===generation){readAlong.finish();note('Voice finished · your move.');}
      }catch(error){if(token===generation){neural.stop();readAlong.finish();talking?.(false);note('Voice unavailable: '+error.message+'. Choose a speech engine in VOICE CAST or keep reading.');}}
    }
    void run();
  }
  for(const engine of ['neural','device'])get('engine-'+engine)?.addEventListener('change',()=>{stop();preferred.engine=engine;save();refresh();note(engine==='neural'?'Kokoro selected / next Read loads the local neural model.':'Device voice selected. Read scene to audition.');});
  if(supported)speechSynthesis.addEventListener('voiceschanged',refresh);
  get('voice-settings').addEventListener('toggle',()=>{if(get('voice-settings').open){refresh();console.warn('[Chromatic speech] voice settings height',get('voice-settings').getBoundingClientRect().height);}});
  refresh();
  return {speak,stop,toggle(){if(preferred.engine==='device'&&!supported&&!recordedVoiceClips.length){note('This host has no browser voice or recorded pack · captions remain.');return false;}enabled=!enabled;if(!enabled)stop();return enabled;},get enabled(){return enabled;}};
}
