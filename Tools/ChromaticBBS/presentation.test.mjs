import {choiceCommentary} from './commentary.mjs';
import {bootSignalEnvelope} from './boot-world.mjs';
import {validateVoiceClips} from './recorded-voice.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {battlePlan} from './roll-battle.mjs';
import {castVoices,speechSegments,speechText,mountSpeech,speechUnits,neuralPassages} from './speech.mjs';
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
test('female narrator and male Ghost casting remain distinct; narration never shares the Ghost role',()=>{
  const voices=[{name:'Samantha',lang:'en-US',voiceURI:'sam'},{name:'Daniel',lang:'en-GB',voiceURI:'dan'}];
  const casting=castVoices(voices);assert.equal(casting.ghost.voiceURI,'dan');assert.equal(casting.narrator.voiceURI,'sam');
  const lines=speechSegments({scene:'A door opens.',ghost:'Oh, fk.'},casting);assert.deepEqual(lines.map(s=>s.role),['narrator','ghost']);assert.equal(lines[0].pitch,1);assert.ok(lines[1].pitch<1);assert.equal(lines[0].text,'A door opens.');
  assert.equal(castVoices([voices[1]]).narrator,null);assert.deepEqual(castVoices([]),{ghost:null,narrator:null});
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
      assert.equal(r.eventId,state.lastReceipt.id);assert.equal(r.playerAction,state.lastReceipt.label);assert.ok(r.spoken.includes(r.playerAction.replace(/ · /g,', ')));assert.ok(!r.comment.includes('find the next opening'));
      assert.equal(encodeSeed(state),before);reactions.add(r.comment);
      if(state.lastReceipt.roll){checked++;assert.ok(r.rollText.includes(String(state.lastReceipt.roll.total)));if(!state.lastReceipt.roll.success){failed++;assert.ok(r.comment.includes('didn’t take'));}}
    }
  }
  assert.ok(reactions.size>=30);assert.ok(checked>0&&failed>0);
});
test('listeners hear Ghost acknowledge the choice before female narration and the next Ghost line',()=>{
  const casting={ghost:{voiceURI:'david'},narrator:{voiceURI:'female'}};
  const lines=speechSegments({scene:'Next scene.',ghost:'Next response.',decision:{spoken:'You chose the private route.'}},casting);
  assert.deepEqual(lines.map(s=>s.role),['ghost','narrator','ghost']);assert.equal(lines[0].text,'You chose the private route.');assert.equal(lines[1].text,'Next scene.');
});

test('speech reads uppercase emphasis as words and deliberately spells known initialisms',()=>{
  assert.equal(speechText('WHO WAS HERE? WHO gets TOMORROW?'),'who was here? who gets tomorrow?');
  assert.equal(speechText('DON’T SHOOT. We CAN FIX THIS. NASA says OK.'),'don’t shoot. We can fix this. nasa says ok.');
  assert.equal(speechText('GPU / SDF / AI / DC / UI / BBS'),'G P U / S D F / A I / D C / U I / B B S');
  assert.equal(speechText('Who? I am Friken.Ghost. W. H. O. GPUs and GPU’s.'),'Who? I am Friken.Ghost. W. H. O. G P U’s and G P U’s.');
  const line='WHO checks the SDF?';assert.equal(speechText(speechText(line)),speechText(line));
});

test('both browser voices receive speech normalization without altering captions or choice text',async()=>{
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
    assert.deepEqual(spoken.map(line=>line.text),['You chose who gets tomorrow.','who was here?','The G P U knows who.']);
    assert.deepEqual(spoken.map(line=>line.voice.voiceURI),['dan','sam','dan']);
    assert.ok(beginnings[1]-beginnings[0]>=40&&beginnings[1]-beginnings[0]<200&&beginnings[2]-beginnings[1]>=60&&beginnings[2]-beginnings[1]<220,'sentence breaths are short and real');
    assert.equal(JSON.stringify(frame),before);assert.equal(speechSegments(frame,castVoices(voices))[1].text,'WHO WAS HERE?');
    spoken.length=0;speech.speak({scene:'One sentence. Another sentence.',ghost:''});speech.stop();await new Promise(resolve=>setTimeout(resolve,350));assert.equal(spoken.length,1,'cancelling during the sentence gap never queues later speech');
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
  speech.speak({scene:'A line worth hearing.',ghost:'Then Ghost answers.'});
  assert.equal(spoken.length,1);document.hidden=true;speech.suspend();
  assert.match(nodes.get('#cg-voice').textContent,/paused/);
  document.hidden=false;speech.resume();assert.equal(spoken.length,2);assert.equal(spoken[1].text,spoken[0].text);
  spoken[1].onend();await new Promise(r=>setTimeout(r,100));assert.equal(spoken[2].voice.voiceURI,'dan');
  document.hidden=true;speech.suspend();speech.toggle();document.hidden=false;speech.resume();assert.equal(spoken.length,3,'explicit voice off must not resume on return');
  speech.toggle();document.hidden=true;speech.speak({scene:'Queued while hidden.',ghost:''});assert.equal(spoken.length,3);
  document.hidden=false;speech.resume();assert.equal(spoken[3].text,'Queued while hidden.');speech.stop();
  const cold=mountSpeech(root,{note(){},pulse(){},talking(){},storage:{getItem:()=>null}});
  assert.doesNotThrow(()=>cold.warm({scene:'Hello.',ghost:''}));assert.match(nodes.get('#cg-voice').textContent,/retry/,'missing Worker must report retry without breaking Dial');cold.stop();
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});


test('neural head start retains every original caption offset with bounded later passages',()=>{
 const text='Hello, Friken.Ghost. '+('A signal answers without an invitation. '.repeat(18))+'\n\nWHO goes next?';
 const units=neuralPassages(text);assert.equal(units[0].text,'Hello, Friken.Ghost.');
 for(const u of units){assert.equal(text.slice(u.start,u.end).trim(),u.text);assert.ok(u.text.length<=180);}
 assert.equal(units.map(u=>u.text).join(' ').replace(/\s+/g,' '),text.replace(/\s+/g,' '));
});
