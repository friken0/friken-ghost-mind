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
  const lines=[{role:'narrator',text:frame.scene,voice:casting.narrator,rate:.96,pitch:1},
    {role:'ghost',text:frame.ghost,voice:casting.ghost,rate:.91,pitch:.80}];
  if(frame.decision)lines.unshift({role:'ghost',text:frame.decision.spoken,voice:casting.ghost,rate:.91,pitch:.80});
  return lines;
}
export function mountSpeech(root,{note,pulse,talking,pcm,storage,silent=false}){
  const get=id=>root.querySelector('#cg-'+id),supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
  let enabled=true,generation=0,settle=null,preferred={},casting={ghost:null,narrator:null};
  try{preferred=JSON.parse(storage?.getItem('friken.chromatic.voices.v1')||'{}');}catch{}
  const recorded=mountRecordedVoice(root,recordedVoiceClips,{note,level(value){pcm?.(value);},gate(){talking?.(false);}});
  function stop(){generation++;if(supported)speechSynthesis.cancel();recorded.stop();settle?.();settle=null;talking?.(false);}
  function refresh(){
    const voices=supported?speechSynthesis.getVoices():[];casting=castVoices(voices,preferred);
    for(const role of ['ghost','narrator']){
      get(role+'-voice-name').textContent=casting[role]?.name||(role==='narrator'?'Captions / no distinct voice':'No device voice available');
      const host=get(role+'-voices');host.replaceChildren();
      const options=voices.filter(v=>/^en\b/i.test(v.lang)||v.voiceURI===casting[role]?.voiceURI);
      for(const v of options){const label=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='cg-'+role+'-cast';radio.checked=v.voiceURI===casting[role]?.voiceURI;
        radio.addEventListener('change',()=>{stop();preferred[role]=v.voiceURI;try{storage?.setItem('friken.chromatic.voices.v1',JSON.stringify(preferred));}catch{}refresh();note('Voice cast updated. Use Read this scene to audition.');});
        label.append(radio,document.createTextNode(v.name+' / '+v.lang+(v.localService?' / device':' / service')));host.append(label);}
    }
    get('voice-note').textContent=supported?(voices.length?'Female narrator + separate male Ghost. David recording generator is on the Windows checkout; current device voice is a fallback. Select by listening. Service voices may send text through their provider.':'Waiting for the browser’s voice inventory. Captions are ready.'):'This host has no speech API. Both roles remain captioned.';
  }
  function speak(frame){
    stop();if(!enabled||silent)return;
    const token=generation;
    async function run(){
      for(const segment of speechSegments(frame,casting)){
        if(token!==generation)return;
        if(recorded.has(segment.role,segment.text)){await recorded.play(segment.role,segment.text);continue;}
        if(!segment.voice||!segment.text)continue;
        await new Promise(resolve=>{
          settle=resolve;
          const line=new SpeechSynthesisUtterance(segment.text);line.voice=segment.voice;line.lang=segment.voice.lang;line.rate=segment.rate;line.pitch=segment.pitch;
          line.onstart=()=>{if(token===generation){talking?.(segment.role==='ghost');note(segment.role.toUpperCase()+' / device fallback / '+segment.voice.name+' speaking');}};
          line.onboundary=()=>{if(token===generation&&segment.role==='ghost')pulse();};
          line.onend=()=>{if(token===generation){talking?.(false);if(segment.role==='ghost')note('Voice finished · your move.');}resolve();};
          line.onerror=e=>{if(token===generation){talking?.(false);note('Voice unavailable: '+e.error+' · captions remain.');}resolve();};
          speechSynthesis.speak(line);
        });
      }
    }
    void run();
  }
  if(supported)speechSynthesis.addEventListener('voiceschanged',refresh);
  get('voice-settings').addEventListener('toggle',()=>{if(get('voice-settings').open){refresh();console.warn('[Chromatic speech] voice settings height',get('voice-settings').getBoundingClientRect().height);}});
  refresh();
  return {speak,stop,toggle(){if(!supported&&!recordedVoiceClips.length){note('This host has no browser voice or recorded pack · captions remain.');return false;}enabled=!enabled;if(!enabled)stop();return enabled;},get enabled(){return enabled;}};
}
