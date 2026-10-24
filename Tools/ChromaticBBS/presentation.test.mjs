import {choiceCommentary} from './commentary.mjs';
import {bootSignalEnvelope,bootCameraView,bootCameraFlight,bootCameraAt,bootHoverFocus,bootPick,bootProject,bootLampSignals} from './boot-world.mjs';
import {validateVoiceClips} from './recorded-voice.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {battlePlan} from './roll-battle.mjs';
import {castVoices,speechSegments,speechText,mountSpeech,speechUnits,neuralPassages,speechParagraph} from './speech.mjs';
import {responsePacket,validateResponse} from './response.mjs';
import {newGame,view,choose,encodeSeed} from './engine.mjs';
test('portal envelopes keep measured audio and terminal ink distinct, bounded and held on pause',()=>{
 const quiet={bands:[0,0,0,0],level:0,ink:0};
 const sound=bootSignalEnvelope(quiet,[1,.7,.4,.8],.18,0,.033);
 assert.ok(sound.level>0&&sound.bands[0]>sound.bands[2]);assert.equal(sound.ink,0);
 const typed=bootSignalEnvelope(quiet,[0,0,0,0],0,.75,.033);
 assert.equal(typed.level,0);assert.deepEqual(typed.bands,[0,0,0,0]);assert.equal(typed.ink,.75);
 assert.deepEqual(bootSignalEnvelope(sound,[0,0,0,0],0,0,1,{held:true}),sound);
 assert.deepEqual(bootSignalEnvelope(sound,[1,1,1,1],1,1,.03,{reduced:true}),quiet);
 const decay=bootSignalEnvelope(sound,[0,0,0,0],0,0,.1);assert.ok(decay.level<sound.level&&decay.level>0);
 const bounded=bootSignalEnvelope(quiet,[NaN,Infinity,-1,5],Infinity,NaN,.1);
 assert.ok([...bounded.bands,bounded.level,bounded.ink].every(x=>Number.isFinite(x)&&x>=0&&x<=1));
});
test('every legal die/stat/DC battle conserves subtraction and leaves exactly the signed margin',()=>{
  for(let die=1;die<=20;die++)for(let value=0;value<=20;value++)for(const dc of [12,15,18]){
    const roll={die,value,dc,total:die+value,success:die+value>=dc,stat:'INS'},source=JSON.stringify(roll),p=battlePlan(roll);
    let hp=p.units.map(u=>u.hp);
    for(const hit of p.hits){assert.equal(hit.damage,Math.min(hp[hit.p],hp[hit.d]));hp[hit.p]-=hit.damage;hp[hit.d]-=hit.damage;assert.deepEqual(hp,hit.remaining);}
    const a=p.units.reduce((n,u)=>n+(u.side==='player'?hp[u.id]:0),0),b=p.units.reduce((n,u)=>n+(u.side==='dc'?hp[u.id]:0),0);
    assert.equal(a-b,roll.total-dc);assert.equal(Math.min(a,b),0);assert.equal(JSON.stringify(roll),source);
  }
});
test('battle rejects inconsistent arithmetic, result, and oversized forces',()=>{
  const r={die:12,value:3,dc:15,total:15,success:true,stat:'INS'};assert.equal(battlePlan(r).margin,0);
  for(const patch of [{total:16},{success:false},{die:21},{value:-1},{dc:100}])assert.throws(()=>battlePlan({...r,...patch}));
});
test('only Ghost receives intelligible speech; scene prose never enters the queue',()=>{
  const voices=[{name:'Samantha',lang:'en-US',voiceURI:'sam'},{name:'Daniel',lang:'en-GB',voiceURI:'dan'}];
  const casting=castVoices(voices);assert.deepEqual(casting,{ghost:voices[1]});
  const lines=speechSegments({scene:'DO NOT SPEAK THIS.',ghost:'Oh, fk.'},casting);assert.deepEqual(lines.map(s=>s.role),['ghost']);assert.equal(lines[0].text,'Oh, fk.');assert.ok(lines[0].pitch<1);
  assert.deepEqual(castVoices([]),{ghost:null});assert.deepEqual(speechSegments({scene:'Silent description.'},casting),[]);
});
test('response packets are detached display data; producing or validating one never advances a game',()=>{
  const s=newGame({rngSeed:123}),before=encodeSeed(s),p=responsePacket(s,view(s));p.content.scene='changed';assert.equal(encodeSeed(s),before);
  assert.throws(()=>validateResponse({...p,schema:'unknown'}));assert.throws(()=>validateResponse({...p,choices:Array(4).fill(p.choices[0])}));
  assert.throws(()=>validateResponse({...p,voice:{scene:'ghost',ghost:'ghost'}}));
  const next=choose(s,view(s).choices[0].id),packet=responsePacket(next,view(next));assert.deepEqual(packet.receipt,next.lastReceipt);packet.receipt.notes.push('display only');assert.notDeepEqual(packet.receipt.notes,next.lastReceipt.notes);
});

test('recorded voice packs bind exact role/text, reject remote sources and stay bounded',()=>{
  const clip={role:'ghost',text:'Hello.',voice:'David reference',data:'data:audio/wav;base64,UklGRg=='};
  const accepted=validateVoiceClips([clip]);accepted[0].text='other';assert.equal(clip.text,'Hello.');
  assert.throws(()=>validateVoiceClips([clip,clip]));assert.throws(()=>validateVoiceClips([{...clip,role:'system'}]));
  assert.throws(()=>validateVoiceClips([{...clip,data:'https://example.com/track.mp3'}]));
  assert.throws(()=>validateVoiceClips([{...clip,data:'data:audio/wav;base64,'+'A'.repeat(600001)}]));
});

test('Ghost acknowledges each chosen action and its actual result without changing state or RNG',()=>{
  const reactions=new Set();let checked=0,failed=0;
  for(let run=1;run<=45;run++){
    let state=newGame({rngSeed:run});
    while(state.turn<=15){const choices=view(state).choices;state=choose(state,choices[(run+state.turn)%3].id);const before=encodeSeed(state),r=choiceCommentary(state.lastReceipt,state);
      assert.equal(r.eventId,state.lastReceipt.id);assert.equal(r.playerAction,state.lastReceipt.label);assert.ok(!r.spoken.startsWith('You chose:'));assert.ok(r.spoken.includes(r.comment));assert.ok(!r.comment.includes('find the next opening'));
      assert.equal(encodeSeed(state),before);reactions.add(r.comment);
      if(state.lastReceipt.roll){checked++;assert.ok(r.rollText.includes(String(state.lastReceipt.roll.total)));if(!state.lastReceipt.roll.success){failed++;assert.ok(r.comment.includes('didn’t take'));}}
    }
  }
  assert.ok(reactions.size>=30);assert.ok(checked>0&&failed>0);
});
test('listeners hear actual choice acknowledgement before Ghost’s next direct line',()=>{
  const casting={ghost:{voiceURI:'david'},narrator:{voiceURI:'female'}};
  const lines=speechSegments({scene:'Next scene.',ghost:'Next response.',decision:{spoken:'You chose the private route.'}},casting);
  assert.deepEqual(lines.map(s=>s.role),['ghost','ghost']);assert.equal(lines[0].text,'You chose the private route.');assert.equal(lines[1].text,'Next response.');
});

test('speech reads uppercase emphasis as words and deliberately spells known initialisms',()=>{
  assert.equal(speechText('WHO WAS HERE? WHO gets TOMORROW?'),'who was here? who gets tomorrow?');
  assert.equal(speechText('DON’T SHOOT. We CAN FIX THIS. NASA says OK.'),'don’t shoot. We can fix this. nasa says ok.');
  assert.equal(speechText('GPU / SDF / AI / DC / UI / BBS'),'G P U / S D F / A I / D C / U I / B B S');
  assert.equal(speechText('Who? I am Friken.Ghost. W. H. O. GPUs and GPU’s.'),'Who? I am Friken.Ghost. W. H. O. G P U’s and G P U’s.');
  const line='WHO checks the SDF?';assert.equal(speechText(speechText(line)),speechText(line));
});

test('Ghost-only device speech normalizes dialogue while preserving silent scene text and captions',async()=>{
  const saved=new Map(['window','document','speechSynthesis','SpeechSynthesisUtterance','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  const spoken=[],beginnings=[],voices=[{name:'Samantha',lang:'en-US',voiceURI:'sam'},{name:'Daniel',lang:'en-GB',voiceURI:'dan'}];
  const element=()=>({dataset:{},append(){},replaceChildren(){},addEventListener(){},pause(){},setAttribute(){},removeAttribute(){}}),nodes=new Map();
  try{
    globalThis.document={createElement:element,createTextNode:text=>text,addEventListener(){}};
    globalThis.cancelAnimationFrame=()=>{};
    globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
    globalThis.speechSynthesis={cancel(){},getVoices:()=>voices,addEventListener(){},speak(line){spoken.push(line);beginnings.push(Date.now());queueMicrotask(()=>line.onend());}};
    globalThis.window={speechSynthesis,SpeechSynthesisUtterance};
    const root={append(){},querySelector(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);}};
    const speech=mountSpeech(root,{note(){},pulse(){},talking(){},storage:{getItem:()=>JSON.stringify({engine:'device'})}});
    const frame={scene:'WHO WAS HERE?',ghost:'The GPU knows WHO.',decision:{spoken:'You chose WHO GETS TOMORROW.'}},before=JSON.stringify(frame);
    speech.speak(frame);await new Promise(resolve=>setTimeout(resolve,450));
    assert.deepEqual(spoken.map(line=>line.text),['You chose who gets tomorrow.','The G P U knows who.']);
    assert.deepEqual(spoken.map(line=>line.voice.voiceURI),['dan','dan']);
    assert.ok(beginnings[1]-beginnings[0]>=40&&beginnings[1]-beginnings[0]<220,'sentence breaths are short and real');
    assert.equal(JSON.stringify(frame),before);assert.equal(speechSegments(frame,castVoices(voices))[1].text,'The GPU knows WHO.');
    spoken.length=0;speech.speak({scene:'Silent scene.',ghost:'One sentence. Another sentence.'});speech.stop();await new Promise(resolve=>setTimeout(resolve,350));assert.equal(spoken.length,1,'cancelling during the sentence gap never queues later speech');
  }finally{
    for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});

test('sentence pacing preserves original offsets, decimals and in-word periods',()=>{
 const text='Hello, Friken.Ghost. WHO WAS HERE? Version 5.1 stays.';
 const units=speechUnits(text);assert.deepEqual(units.map(u=>u.text),['Hello, Friken.Ghost.','WHO WAS HERE?','Version 5.1 stays.']);
 for(const u of units){assert.equal(text.slice(u.start,u.end).trim(),u.text);assert.ok(u.pause>=40&&u.pause<=160);}
 assert.ok(units[1].pause>units[0].pause);
});

test('long imported sentences retain all text through bounded neural chunks',()=>{
 const text=('a curious star remembers the caller '+ 'through the dark corridor ').repeat(30)+'.';
 const units=speechUnits(text);assert.ok(units.length>2);assert.ok(units.every(u=>u.text.length<=400));
 assert.equal(units.map(u=>u.text).join(' ').replace(/\s+/g,' '),text.trim().replace(/\s+/g,' '));
 for(const u of units)assert.equal(text.slice(u.start,u.end).trim(),u.text);
});

// This is the regression: a period must not force another neural inference.
test('neural passages keep natural sentence prosody, paragraph breaks and exact bounded source',()=>{
 const text='WHO gets tomorrow? The universe filed an objection. I ate the form.';
 const units=speechUnits(text,{coalesce:true});assert.equal(units.length,1);assert.equal(units[0].text,text);assert.equal(units[0].pause,40);
 const paragraphs=text+'\n\nA second speaker waits.';
 const split=speechUnits(paragraphs,{coalesce:true});assert.equal(split.length,2);assert.equal(split[0].pause,120);
 const long=('The corridor remembers your answer. ').repeat(40);
 for(const u of speechUnits(long,{coalesce:true})){assert.ok(u.text.length<=400);assert.equal(long.slice(u.start,u.end).trim(),u.text);}
 assert.equal(speechUnits(long,{coalesce:true}).map(u=>u.text).join(' '),long.trim());
});

test('hidden speech resumes the unfinished unit, while explicit mute cancels resume',async()=>{
 const names=['window','document','speechSynthesis','SpeechSynthesisUtterance','cancelAnimationFrame'];
 const saved=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const spoken=[],voices=[{name:'Samantha',lang:'en-US',voiceURI:'sam'},{name:'Daniel',lang:'en-GB',voiceURI:'dan'}];
 const element=()=>({dataset:{},append(){},replaceChildren(){},addEventListener(){},pause(){},setAttribute(){},removeAttribute(){}}),nodes=new Map();
 try{
  globalThis.document={hidden:false,createElement:element,createTextNode:t=>t,addEventListener(){}};
  globalThis.cancelAnimationFrame=()=>{};globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  globalThis.speechSynthesis={cancel(){},getVoices:()=>voices,addEventListener(){},speak(line){spoken.push(line);}};
  globalThis.window={speechSynthesis,SpeechSynthesisUtterance};
  const root={append(){},querySelector(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);}};
  const speech=mountSpeech(root,{note(){},pulse(){},talking(){},storage:{getItem:()=>JSON.stringify({engine:'device'})}});
  speech.speak({scene:'Silent scene.',lead:'A line worth hearing.',ghost:'Then Ghost answers.'});
  assert.equal(spoken.length,1);document.hidden=true;speech.suspend();
  assert.match(nodes.get('#cg-voice').textContent,/paused/);
  document.hidden=false;speech.resume();assert.equal(spoken.length,2);assert.equal(spoken[1].text,spoken[0].text);
  spoken[1].onend();await new Promise(r=>setTimeout(r,100));assert.equal(spoken[2].voice.voiceURI,'dan');
  document.hidden=true;speech.suspend();speech.toggle();document.hidden=false;speech.resume();assert.equal(spoken.length,3,'explicit voice off must not resume on return');
  speech.toggle();document.hidden=true;speech.speak({scene:'Silent scene.',ghost:'Queued while hidden.'});assert.equal(spoken.length,3);
  document.hidden=false;speech.resume();assert.equal(spoken[3].text,'Queued while hidden.');speech.stop();
  const cold=mountSpeech(root,{note(){},pulse(){},talking(){},storage:{getItem:()=>null}});
  assert.doesNotThrow(()=>cold.warm({scene:'Hello.',ghost:''}));assert.match(nodes.get('#cg-voice').textContent,/retry/,'missing Worker must report retry without breaking Dial');cold.stop();
  for(const old of ['am_fenrir','am_michael','bm_fable','bm_george']){
   let written;const store={getItem:()=>JSON.stringify({engine:'neural',castPolicy:'cpu-fenrir-2026-10-22',autoPolicy:'measured-auto-2026-10-22',ghostNeural:old,performance:'gpu'}),setItem:(key,value)=>{written=JSON.parse(value);}};
   const migrated=mountSpeech(root,{note(){},storage:store});assert.equal(written.ghostNeural,'am_onyx');assert.equal(written.performance,'auto','unsafe saved GPU mode is repaired without changing the chosen voice');migrated.stop();
  }
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});


test('neural head start retains every original caption offset with bounded later passages',()=>{
 const text='Hello, Friken.Ghost. '+('A signal answers without an invitation. '.repeat(18))+'\n\nWHO goes next?';
 const units=neuralPassages(text);assert.equal(units[0].text,'Hello, Friken.Ghost.');
 for(const u of units){assert.equal(text.slice(u.start,u.end).trim(),u.text);assert.ok(u.text.length<=320);}
 assert.equal(units.map(u=>u.text).join(' ').replace(/\s+/g,' '),text.replace(/\s+/g,' '));
});

test('dock ray picking matches projected subjects and camera eases without overshoot or paused drift',()=>{
 const c=bootCameraView();for(const aspect of [.45,1,2,3])for(const [mode,p]of [['modem',[0,-.25,-.7]],['portal',[0,.95,3.8]]])assert.equal(bootPick(bootProject(p,c,aspect),c,aspect),mode);
 const flight=bootCameraFlight(c,'modem',13),end=bootCameraAt(flight,flight.duration);assert.deepEqual(end,flight.to);assert.deepEqual(bootCameraAt(flight,0),c);assert.deepEqual(bootCameraAt(flight,0,{reduced:true}),flight.to);assert.notDeepEqual(flight,bootCameraFlight(c,'modem',14));assert.deepEqual(flight,bootCameraFlight(c,'modem',13));assert.throws(()=>bootCameraView('missing'));
 for(let i=0;i<=100;i++){const v=bootCameraAt(flight,flight.duration*i/100);assert.ok(v.eye.every(Number.isFinite));assert.ok(v.eye[2]<-1.8);}
 assert.equal(bootHoverFocus('wide','modem',[.5,.6]),null);assert.equal(bootHoverFocus('wide','modem',[.95,0]),'wide');assert.equal(bootHoverFocus('portal','modem',[.4,.1]),'portal');assert.equal(bootHoverFocus('modem','wide',[0,0]),'modem');
});
test('four connection lamps preserve carrier state and receive real bounded audio energy',()=>{
 const quiet={bands:[0,0,0,0],level:0,ink:0},loud={bands:[1,.8,.6,.5],level:.7,ink:.2};const idle=bootLampSignals(0,0,quiet,1),pending=bootLampSignals(.4,2,quiet,1),connected=bootLampSignals(1,2,quiet,1),music=bootLampSignals(1,2,loud,1);
 assert.ok(idle[0]>0);assert.deepEqual(idle.slice(1),[0,0,0]);assert.equal(pending[3],0);assert.ok(connected[3]>.6);assert.ok(music.every((v,i)=>v>=connected[i]&&v<=1));
});

test('alien formants are deterministic bounded PCM, separate from intelligible TTS',async()=>{
 const {renderAlienUtterance,validateTransmission}=await import('./alien-comms.mjs');
 const base={race:'harkellinia',speaker:'PIP',accuracy:71,lines:[{text:'Please move the resident before the cargo bell.',confidence:92},{text:'Ownership / permission? Signal uncertain.',confidence:31}]};
 const a=renderAlienUtterance(base,16000),b=renderAlienUtterance(base,16000);assert.deepEqual(a,b);assert.ok(a.duration>1&&a.duration<12);assert.ok(a.syllables>=4);let peak=0,sq=0;for(const n of a.samples){assert.ok(Number.isFinite(n));peak=Math.max(peak,Math.abs(n));sq+=n*n;}assert.ok(peak>.05&&peak<.71);assert.ok(Math.sqrt(sq/a.samples.length)>.025);assert.equal(a.samples.at(-1),0);
 assert.notDeepEqual(a.samples,renderAlienUtterance({...base,race:'krex'},16000).samples);assert.deepEqual(validateTransmission(base),base);assert.throws(()=>validateTransmission({...base,accuracy:101}));assert.throws(()=>validateTransmission({...base,race:'not-an-art-asset'}));assert.throws(()=>validateTransmission({...base,lines:[{text:'x',confidence:-1}]}));assert.throws(()=>validateTransmission({...base,url:'https://untrusted.invalid'}));assert.throws(()=>renderAlienUtterance(base,1));
 const segments=speechSegments({scene:'Setup.',ghost:'My comment.',transmission:base},{});assert.deepEqual(segments.map(s=>s.role),['alien','ghost']);assert.equal(segments[0].text,'');assert.deepEqual(segments[0].transmission,base);
});

test('typed transmissions survive exact chapter save/replay; invalid confidence never enters a save',async()=>{
 const fs=await import('node:fs'),{createChapter,playView,playChoose,encodePlaySeed,decodePlaySeed,validateChapter}=await import('./chapters.mjs');const pack=JSON.parse(fs.readFileSync(new URL('./chapters/lot-forty-seven.json',import.meta.url)));const state=createChapter(pack,null,{entropy:23});const code=encodePlaySeed(state);assert.deepEqual(decodePlaySeed(code),state);const f=playView(state);assert.equal(f.transmission.accuracy,71);assert.ok(f.transmission.lines.some(x=>x.confidence<50));assert.equal(encodePlaySeed(state),code);const next=playChoose(state,f.choices[0].id);assert.notEqual(next.turn,state.turn);assert.deepEqual(playView(decodePlaySeed(encodePlaySeed(next))).transmission,playView(next).transmission);const bad=structuredClone(pack);bad.scenes[0].transmission.lines[0].confidence=999;assert.throws(()=>validateChapter(bad));
});


test('companion introduction uses the existing inspector caption and Ghost voice without scene narration',()=>{
 const frame={scene:'Remain silent.',ghost:'The serpent is Else.',ghostField:'inspect-help'};
 const lines=speechSegments(frame,{ghost:{name:'Daniel'}});
 assert.equal(lines.length,1);assert.equal(lines[0].role,'ghost');assert.equal(lines[0].field,'inspect-help');
 assert.equal(speechSegments({...frame,ghostField:'untrusted-selector'})[0].field,'ghost');
});

test('camera paragraph identity survives sentences and bounded neural buffer splits',()=>{
 const text='Hello. '+('This is another sentence. '.repeat(20))+'\n\nNext paragraph. Still the same shot.\r\n\r\nFinal paragraph.';
 const units=neuralPassages(text),keys=units.map(u=>speechParagraph(text,u.start));
 assert.ok(keys.filter(k=>k===0).length>2);
 assert.deepEqual([...new Set(keys)],[0,1,2]);
 assert.equal(speechParagraph('One. Two. Three.',15),0);
});
