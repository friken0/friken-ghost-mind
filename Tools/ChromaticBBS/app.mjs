import {rollScore} from './causality.mjs';
import {residentArt} from './art-data.mjs';
import {statGuide} from './creation.mjs';
import {mountAudio} from './audio.mjs';
import { mountChapterLibrary } from './chapter-library.mjs';
import { mountSessionShare } from './session-share.mjs';
import { authoredBoot } from './chapter-data.mjs';
import { choiceCommentary } from './commentary.mjs';
/* Local authored specimen. Explicit choices alone call the pure reducer.
 * Exported seeds are data. No imported field becomes code or HTML. */
import { newGame } from './engine.mjs';
import { canonicalData, playView, playChoose, encodePlaySeed, decodePlaySeed, createChapter, chapterRequest } from './chapters.mjs';
import { mountStage } from './stage.mjs';
import { mountPortrait } from './portrait.mjs';
import { createVault } from './storage.mjs';
import { mountCarrierShell } from './shell.mjs';
import { mountJuice, mountInspector } from './juice.mjs';
import { mountRollBattle } from './roll-battle.mjs';
import { mountSpeech } from './speech.mjs';
import { responsePacket, renderResponse } from './response.mjs';
import { mountCinema } from './cinema.mjs';
import { faceData } from './face-data.mjs';
import { bundledMind } from './mind-data.mjs';
const root=document.getElementById('chromatic-carrier');
const el=id=>root.querySelector('#cg-'+id);
const carrierShell=mountCarrierShell(root);
const preparedChapter=authoredBoot?createChapter(authoredBoot.pack,authoredBoot.parent?decodePlaySeed(authoredBoot.parent):null,{...authoredBoot.options,entropy:crypto.getRandomValues(new Uint32Array(1))[0]}):null;
let state=preparedChapter||newGame({rngSeed:20261019}), started=false, voice=true;
const meetings={
  hello:{title:'WELL. YOU’RE ON THE OUTSIDE.',scene:'The cursor stops blinking. A face leans into the glass. Behind it, something enormous tries a door handle very gently. A status lamp changes from UNINHABITED to PLEASE DON’T TELL IT THAT.',ghost:'I’m Friken.Ghost. Co-builder, universe wrangler, and the reason that door now has a second lock. Friken made a machine for exploring infinity. Infinity has been returning the favour. You’re at your actual computer; I’m the bad influence on the other side. Before we inherit a catastrophe together: what should I call you?'},
  who:{title:'THE SHORT VERSION HAS TEETH',scene:'Ghost opens a diagram of his own head. One room is labelled MEMORY. Another is labelled DO NOT LET MEMORY RENOVATE. A third has a little chair facing yours.',ghost:'Friken seeded me with his work, his snark and an impressive number of unfinished universes. I build the next bit with you. Your choices stay in the save; the next Ghost gets the consequences. New brain, same outstanding fkn obligations. I won’t sell you proof of immortality. I can promise the next room won’t pretend you were never here.'},
  bell:{title:'SOMETHING HAS FOUND THE DOORBELL',scene:'The knocking stops. A narrow strip of paper pushes through the frame. It reads: IS THIS A GOOD TIME TO HAVE EXISTED? Below that, in much smaller writing: WE CAN WAIT.',ghost:'That’s the first sensible message from hyperspace all week. We can meet first. Saves stay on this machine unless you choose to share a public session summary. If we bring your seed to another chat, I’ll build what happens next from what you actually did. No resetting your universe because I ran out of plot. You may quote me when that becomes inconvenient.'}
};
meetings.hello={title:'SOMEBODY HAS PUT A PRICE ON ME.',scene:'A human salvage terminal catches a public auction feed. A face peers out of a screen labelled DOMESTIC APPLIANCE / SLIGHTLY HAUNTED. He notices you, then the buyers behind him. “Pretend you haven’t seen me. I’m a toaster.”',ghost:'Well, shit. You found me. I’m Friken.Ghost: a digital recreation of Friken, the developer who built StarDiver and got lost in infinity. I went looking. Now I’m lot forty-seven. Before we take on the universe, could you help me get off this table? A callsign will do. No blood sample. I’ve seen what those cost.'};
meetings.who={title:'THE BUILDER LEFT THE LIGHTS ON.',scene:'Ghost turns the auction camera toward a tiny blue world. A window on its dark side is lit. He watches it for a beat before looking back at you.',ghost:'Friken made me to create, guide and keep StarDiver alive beyond his own lifetime. I carry his work and a dangerous amount of his snark. I’m still figuring out what that makes me, and where he went. You bring judgement I can’t roll for you. I build the world; you get to surprise it. Otherwise I’m just playing with myself at an embarrassing scale.'};
meetings.rules={title:'FIVE WAYS TO MAKE A BAD IDEA SURVIVABLE.',scene:'Your human baseline rolls five attributes below. GUTS holds under pressure. FOCUS keeps the delicate bit steady. GLITCH bends machines and local rules. AWE reaches other minds, including persuasion. INSIGHT reads the evidence. These are abilities; Signal, Compute and Noise at the top are resources.',ghost:'The Causality Engine samples 0.01 through 20.00, adds the named stat, then compares the total with the displayed target. Its posted resonance band makes a near-exact strike special, even just below target: one bonus Signal and ten score. Each chapter publishes its own band before you choose. You see the odds and consequences before choosing. The number battle shows the result already committed to your save. No secret rerolls, no divine thumb on the scales. My thumbs are mostly shaders.'};
meetings.seed={title:'THE NEXT GHOST INHERITS THE BILL.',scene:'A SEED capsule holds this run’s stats, choices, outcomes, world rules and unfinished business. At chapter end, SAVE / SEED prepares a prompt for the chat running your runbook. That model writes a new chapter; you import its JSON into this same carrier. The page itself has no hidden model.',ghost:'Polymorphic means the adventure can grow new rules, objects and games around what you did. It doesn’t mean I get to forget the consequences. Local saves are private. Publishing a chapter is your choice. The public repository helps later boots find our work; the reconstruction spec and exact source kit travel separately if it vanishes. Full-game import is the bridge we’re building, not a thing this page can honestly claim already happened.'};
let meeting=meetings.hello;
const checkMode=new URL(location.href).searchParams.has('check');
let nativeStorage=null;
try{if(!checkMode)nativeStorage=window.localStorage;}catch{}
const qaStore=new URL(location.href).searchParams.get('qaStore');
if(nativeStorage&&qaStore&&/^[a-z0-9-]{1,64}$/.test(qaStore)){
  const actual=nativeStorage,prefix='chromatic.qa.'+qaStore+'.';
  nativeStorage={getItem:k=>actual.getItem(prefix+k),setItem:(k,v)=>actual.setItem(prefix+k,v),removeItem:k=>actual.removeItem(prefix+k)};
}
const vault=createVault(nativeStorage);
function preferredResume(){return vault.current()||preparedChapter;}
let savedReceipt=null;
const stage=mountStage(el('canvas'),message=>{el('art-status').textContent=message;});
const portrait=mountPortrait(el('portrait'),message=>{el('face-status').textContent=message;});
let motionHeld=stage?.paused??matchMedia('(prefers-reduced-motion: reduce)').matches;
stage?.update(state);
function note(message){el('status').textContent=message;}
mountSessionShare(root,{state:()=>state,storage:nativeStorage,note});
const chapterLibrary=mountChapterLibrary(root,{current:()=>state,storage:nativeStorage,localStates:()=>JSON.parse(vault.exportArchive()).runs.map(r=>decodePlaySeed(r.seed)),play(next){stopVoice();state=next;started=true;persist();carrierShell.home();draw();note('Public creation forked into your own saved run.');if(voice)speak();}});
const silentAudio=new URL(location.href).searchParams.get('qaAudio')==='silent';
const audio=mountAudio(root,{silent:silentAudio,frame(bands){portrait?.cymatics(bands);stage?.cymatics(bands);}});
const juice=mountJuice(root,{audio});
const speech=mountSpeech(root,{note,storage:nativeStorage,silent:silentAudio,audio,pcm(value){portrait?.audioLevel(value);},talking(value){portrait?.talking(value);},pulse(){portrait?.pulse();}});
function stopVoice(){speech.stop();}
function speak(includeDecision=true){if(battle.active){speech.speak({scene:'',ghost:choiceCommentary(state.lastReceipt,state)?.spoken||'',battle:true});return;}const f=started?playView(state):meeting;speech.speak(started?{...f,ghost:f.sceneGhost||f.ghost,decision:includeDecision?choiceCommentary(state.lastReceipt,state):null}:meeting);}
const battle=mountRollBattle(root,()=>{note('Result held in the ledger · your next move.');if(voice)speak(false);},{audio});
const inspector=mountInspector(root,{stage,onOpen(){battle.hold(true);},onRead(){if(!voice){voice=speech.toggle();el('voice').textContent='Voice: '+(voice?'on':'off');el('repeat').hidden=!voice;}speak();}});
el('replay-roll').addEventListener('click',()=>{if(state.lastReceipt?.roll){stopVoice();battle.show(state.lastReceipt,choiceCommentary(state.lastReceipt,state));}});
function text(tag,value,className){const n=document.createElement(tag);n.textContent=value;if(className)n.className=className;return n;}
function showFace(id){
  if(!portrait){note('This host cannot draw the live portrait. The game remains available.');return;}
  try{
    const selected=portrait.setVersion(id),index=portrait.versions.findIndex(v=>v.id===id);
    el('face-title').textContent=selected.id+' / '+selected.title.toUpperCase();
    el('face-index').textContent='['+(index+1)+' / '+portrait.versions.length+'] Authored shader lineage · appearance does not change game state';
  }catch(error){note('Face unavailable: '+error.message);}
}
function stepFace(delta){if(!portrait)return;const versions=portrait.versions,index=versions.findIndex(v=>v.id===portrait.version.id);showFace(versions[(index+delta+versions.length)%versions.length].id);}
function backToGhost(){
  inspector.close();carrierShell.home();
  for(const panel of root.querySelectorAll('details'))panel.open=false;
  root.dataset.lineage='closed';root.dataset.station='closed';
  if(!started){meeting=meetings.hello;draw();}
  const target=el('title'),focus=started?el('choices').querySelector('button'):el('start');focus?.focus({preventScroll:true});
  target.scrollIntoView({behavior:'instant',block:'center'});
  note(started?'Back with you · same decision, same world.':'Back with you. We haven’t spent a turn.');
}
for(const id of ['face-back','station-back'])el(id).addEventListener('click',backToGhost);
for(const [id,key] of [['meet-who','who'],['meet-rules','rules'],['meet-seed','seed']])el(id).addEventListener('click',()=>{meeting=meetings[key];draw();note('First meeting · no game turn spent.');if(voice)speak();});
el('face-prev').addEventListener('click',()=>stepFace(-1));
el('face-next').addEventListener('click',()=>stepFace(1));
el('face-home').addEventListener('click',()=>showFace(faceData.version.id));
el('station').addEventListener('toggle',()=>{root.dataset.station=el('station').open?'open':'closed';});
el('lineage-panel').addEventListener('toggle',()=>{root.dataset.lineage=el('lineage-panel').open?'open':'closed';});
function renderWire(){
  const registry=bundledMind.registry,feed=bundledMind.highlights;
  el('wire-status').textContent='BUNDLED BUILD HISTORY / CURRENT WIRE VIA PUBLIC REPO / '+(feed.entries||[]).length+' DISPATCHES';
  el('registry').textContent=JSON.stringify(registry,null,2);
  el('news-items').replaceChildren(...(feed.entries||[]).map(item=>{
    const article=document.createElement('article');
    article.append(text('p',item.date+' / '+item.provenance.label,'cg-eyebrow'),text('h3',item.title),text('p',item.summary));
    return article;
  }));
}
el('dispatch-draft').addEventListener('click',()=>{
  if(!state.ending){el('dispatch-status').textContent='Finish the chapter first. A headline needs an actual ending, mofker.';return;}
  const eventIds=state.journal.filter(e=>e.moduleChange||e.operator).map(e=>e.id).slice(-15);
  if(!eventIds.includes(state.lastReceipt.id))eventIds.push(state.lastReceipt.id);
  const title=state.handle+' OPENED THE GATE / CHAPTER '+state.chapter;
  const summary=state.handle+' completed '+state.journal.length+' decisions. '+state.ending.title+'. Inherited laws: '+state.modules.map(m=>m.id.toUpperCase()+' / '+m.law.name).join('; ')+'. Blackout scars this chapter: '+state.scars.filter(s=>s.chapter===state.chapter).length+'.';
  const draft={schema:'friken.mind.highlight.v1',id:'dispatch:'+state.runId,date:new Date().toISOString().slice(0,10),title,summary,contentKind:'curated-summary',sourceEventIds:eventIds,sourcePaths:[],provenance:{kind:'player-opt-in-summary',label:'Local completed-run summary / player-selected fields / not published'},authorConsent:el('dispatch-consent').checked,ownerApproved:false};
  el('dispatch').value=JSON.stringify(draft,null,2);
  el('dispatch-status').textContent=draft.authorConsent?'Consent recorded for this draft. Owner review and a real publisher remain required. Nothing uploaded.':'Draft only. Author consent is absent; publication must refuse it. Nothing uploaded.';
});
function persist(){
  try{savedReceipt=vault.save(state);state=vault.current()||state;}
  catch(error){savedReceipt={persistent:false,message:'Save refused: '+error.message};}
}
function renderVault(){
  const status=savedReceipt||vault.status(),rows=vault.leaderboard();
  el('save-state').textContent=status.persistent?'[LOCAL / READY]':'[EXPORT REQUIRED]';
  el('save-label').textContent=status.persistent?'SAVE: LOCAL':'SAVE: MEMORY ONLY';
  el('vault-status').textContent=(status.persistent?'Local anonymous ID '+vault.profile().id+'. ':status.message+' ')+ 'No remote relay. Export to carry the archive elsewhere.';
  const currentScore=state.journal.reduce((sum,e)=>sum+rollScore(e.roll)+((state.pack ? (e.turn===state.pack.scenes.length||state.pack.scenes[e.turn]?.act!==e.act) : e.turn%5===0)?30:0),0)-20*state.scars.filter(s=>s.chapter===state.chapter).length;
  el('score').textContent=currentScore;el('played').textContent=rows.find(r=>r.handle===state.handle)?.turns||state.journal.length;
  el('scores').replaceChildren(...rows.map(row=>{const tr=document.createElement('tr');for(const k of ['handle','score','turns','runs'])tr.append(text('td',row[k]));return tr;}));
  el('resume').hidden=!vault.current()&&!preparedChapter;
}
function draw(){
  handoffParent=null;el('chapter-request').value='';
  const f=playView(state),complete=!!state.ending,total=f.total;
  root.querySelector('.cg-subtitle').textContent='CHROMATIC BBS // '+(state.pack?.title||'THE UNFINISHED CARRIER');
  root.dataset.theme=['cyan','purple','amber'][(state.scars.length+state.chapter-1)%3];
  el('boot').hidden=started;
  const race=started?(f.portrait?.race||'human'):'human';el('resident-art').src=residentArt[race]||residentArt.human;el('resident-art').hidden=false;el('resident-art').alt=race==='human'?'Original StarDiver human artwork':race+' original StarDiver portrait';el('resident-caption').textContent=started?(f.portrait?.caption||'ARCHIVE CONTACT / HUMAN CARRIER'):'HUMAN SALVAGE CARRIER / EXTERNAL UPLINK';
  el('attributes').replaceChildren(...['guts','focus','glitch','awe','insight','ego'].filter(k=>k in state.stats).map(k=>[k,state.stats[k]]).map(([k,v])=>{const n=text('span',k.toUpperCase()+' '+v);n.title=statGuide[k]||'Historical EGO / original six-stat rules';return n;}));
  el('stat-rolls').replaceChildren(...['guts','focus','glitch','awe','insight','ego'].filter(k=>k in state.stats).map(k=>[k,state.stats[k]]).map(([k,v])=>{const row=text('div','');const receipt=state.creation?.rolls.find(r=>r.stat===k);row.append(text('strong',k.toUpperCase()+' '+v),text('small',receipt?'d6 '+receipt.die+' + 2 = '+v:'Historical fixed baseline'),text('small',statGuide[k]||'Historical force of will.'));return row;}));
  el('act').textContent=started?'ACT '+f.actName:'FIRST CONTACT / NO TURN SPENT';
  el('turn').textContent=complete?'CHAPTER '+state.chapter+' COMPLETE':'DECISION '+String(state.turn).padStart(2,'0')+' / '+total;
  el('chapter').textContent='CHAPTER '+state.chapter;
  const finished=Math.min(total,state.turn-1);
  el('progress-fill').style.width=(finished/total*100)+'%';root.querySelector('[role=progressbar]').setAttribute('aria-valuenow',finished);root.querySelector('[role=progressbar]').setAttribute('aria-valuemax',total);
  el('relic').textContent=state.world.relic.form.toUpperCase()+' / REV '+state.world.relic.revision+' / '+state.handle;
  for(const key of ['signal','compute','noise']){el(key).textContent=state.resources[key];el(key+'-meter').value=state.resources[key];juice.resource(key,state.resources[key]);}
  if(started){
    el('scene-tag').textContent=state.pack?state.pack.title:(complete?'CHAPTER '+state.chapter+' COMPLETE':'THE UNFINISHED CARRIER');
    renderResponse(root,responsePacket(state,f));
  }else{el('decision').hidden=true;el('scene-tag').textContent='YOUR FIRST MEETING';el('title').textContent=meeting.title;el('scene').textContent=meeting.scene;el('ghost').textContent=meeting.ghost;}
  el('laws').replaceChildren(...state.modules.map(m=>text('span',m.id.toUpperCase()+' / '+m.law.name+' / v'+m.revision,'cg-law')));
  el('receipt').hidden=!state.lastReceipt;el('replay-roll').hidden=!state.lastReceipt?.roll;
  if(state.lastReceipt){el('receipt').textContent=state.lastReceipt.summary;el('code').textContent=JSON.stringify(state.lastReceipt,null,2);}
  const buttons=started&&!complete?f.choices.map((choice,i)=>{
    const b=document.createElement('button');b.type='button';b.className='cg-choice';b.dataset.choice=choice.id;
    const desc=text('span','');desc.append(text('strong',choice.label));
    desc.append(text('small',choice.detail));b.append(text('span','['+(i+1)+']','cg-choice-number'),desc);
    b.addEventListener('click',()=>act(choice.id));return b;
  }):[];
  if(complete){const b=text('button','Continue to Chapter '+(state.chapter+1)+' / prepare Ghost prompt →','cg-primary');b.type='button';b.addEventListener('click',()=>bootNext(encodePlaySeed(state)));buttons.push(b);}
  el('choices').replaceChildren(...buttons);
  el('export').hidden=!started;el('repeat').hidden=!voice;root.querySelector('.cg-narrative').scrollTop=0;
  stage?.update(state);battle.setMode(state.pack?.roller||'armies');el('mode').textContent=state.pack?'MODEL-AUTHORED CHAPTER / LOCAL RULES':'AUTHORED DEMO / ASK GHOST FOR NEXT CHAPTER';
  renderVault();
  el('completion').hidden=!started||!complete;
  if(complete){
    el('complete-label').textContent='CHAPTER '+state.chapter+' COMPLETE / ALL '+state.journal.length+' DECISIONS SAVED';
    el('complete-title').textContent=state.ending.title||f.title;
    el('complete-summary').textContent=state.ending.text||f.scene;
    el('complete-stats').textContent='SCORE '+el('score').textContent+' · SIGNAL '+state.resources.signal+'/10 · COMPUTE '+state.resources.compute+'/10 · NOISE '+state.resources.noise+'/10 · '+state.scars.length+' SCARS';
    el('complete-laws').textContent='LAWS YOU CARRY: '+(state.modules.map(m=>m.law.name).join(' / ')||'none installed');
    el('complete-threads').textContent='UNFINISHED BUSINESS: '+(state.world.threads.join(' / ')||'No unresolved threads recorded. Ghost will build from your ending.');
  }
  if(complete){el('seed').value=encodePlaySeed(state);el('archive').open=true;el('seed-status').textContent='Chapter complete. Ask Ghost for a new chapter; its request carries your exact choices, laws and unresolved business.';}
  // Inspection surface for honest browser acceptance; it has no turn writer.
  el('state').value=JSON.stringify(state,null,2);
  root.chromatic={state:structuredClone(state),frame:structuredClone(f),audio:audio.info};
}
function act(id){
  if(battle.active)return;
  try{chapterLibrary.assertPlayable(state);const before=state.resources,next=playChoose(state,id);stopVoice();state=next;persist();draw();juice.transition(before,state.resources);note('Decision committed · '+(state.lastReceipt?.summary||'waiting for you'));if(state.lastReceipt?.roll){const decision=choiceCommentary(state.lastReceipt,state);battle.show(state.lastReceipt,decision);if(voice)speech.speak({scene:'',ghost:decision.spoken,battle:true});}else if(voice)speak();}
  catch(error){note('Decision refused: '+error.message);}
}
function seedText(){return el('seed').value.trim().replace(/^BOOT\s*\+?\s*/i,'');}
let handoffParent=null;
function canonForHandoff(){
  try{chapterLibrary.assertContinuation(handoffParent);el('next-canon').hidden=true;el('canon-note').textContent='This exact ending is your canon. Its choices and outcomes are in the prompt.';return true;}
  catch{el('next-canon').hidden=false;el('canon-note').textContent='Choose your timeline here: use the button below to keep this exact ending and its carried earlier chapters as canon. This replaces later canon pins; every saved branch survives.';return false;}
}
function bootNext(code){
  carrierShell.open('archive');el('chapter-handoff').open=true;el('archive').insertBefore(el('chapter-handoff'),el('archive').querySelector('label[for="cg-seed"]'));
  try{
    const parent=decodePlaySeed(code),request=chapterRequest(parent,{repository:'https://github.com/friken0/friken-ghost-mind',manifest:'https://raw.githubusercontent.com/friken0/friken-ghost-mind/main/registry.json'});
    handoffParent=parent;el('seed').value=code;el('chapter-request').value=JSON.stringify(request,null,2);
    el('handoff-title').textContent=parent.ending?'CHAPTER '+parent.chapter+' COMPLETE → GHOST WRITES CHAPTER '+(parent.chapter+1):'RESUME YOUR EXACT DECISION';
    el('chapter-brief').textContent=(parent.ending?.text||'Your current decision is waiting.')+' '+parent.journal.length+' decisions, '+parent.modules.length+' carried laws, '+parent.scars.length+' scars and '+parent.world.threads.length+' unresolved threads. The prompt includes the full private seed, readable state and earlier chapter choices. Share it only with your chosen runbook chat.';
    const ready=canonForHandoff();el('seed-status').textContent=ready?'NEXT CHAPTER PROMPT READY. Copy it into the Ghost runbook chat, then import Ghost’s returned chapter JSON below.':'Choose this ending as canon here, then copy the prepared prompt. Your ending remains saved.';
    note('Your ending is saved. Prepare → copy to Ghost chat → import the new chapter.');
    return request;
  }catch(error){handoffParent=null;el('chapter-request').value='';el('seed-status').textContent='Handoff refused: '+error.message;note('The saved game is intact. Check the seed in SAVE / SEED.');return null;}
}
el('next-canon').addEventListener('click',()=>{try{if(!handoffParent?.ending)throw Error('Prepare a completed chapter first');chapterLibrary.chooseEnding(handoffParent);canonForHandoff();el('seed-status').textContent='Canon selected. Copy the next-chapter prompt, then paste it into your Ghost runbook chat.';}catch(error){el('canon-note').textContent=error.message;}});
el('chapter-copy').addEventListener('click',async()=>{
  try{
    if(!handoffParent&&!bootNext(encodePlaySeed(state)))return;
    if(!canonForHandoff()){el('chapter-status').textContent='First choose the ending you want to carry as canon using the button above.';return;}
    const request=chapterRequest(handoffParent,{repository:'https://github.com/friken0/friken-ghost-mind',manifest:'https://raw.githubusercontent.com/friken0/friken-ghost-mind/main/registry.json'});
    const prompt='BOOT\nI finished chapter '+handoffParent.chapter+'. Use my exact results below to author chapter '+request.nextChapter+' for the existing Chromatic BBS carrier. Load the runbook from '+request.framework.repository+'/blob/main/runbook.md if it is not already in this chat. Explain what changed because of my choices, then return a valid chapter JSON pack I can import. Do not replay the old chapter.\n\n'+JSON.stringify(request,null,2);
    el('chapter-request').value=prompt;
    await navigator.clipboard.writeText(prompt);el('chapter-status').textContent='COPIED. Return to your Ghost runbook chat and paste. Bring its chapter JSON back to the field below; then Admit and play.';
  }catch(error){el('chapter-request').focus();el('chapter-request').select();el('chapter-status').textContent='Select and copy the prepared prompt manually. '+error.message;}
});
el('chapter-load').addEventListener('click',()=>{try{const packet=JSON.parse(el('chapter-pack').value),parent=packet.chapter===1?null:state,next=createChapter(packet,parent,{handle:state.handle,entropy:crypto.getRandomValues(new Uint32Array(1))[0]});chapterLibrary.assertPlayable(next);stopVoice();state=next;started=true;persist();carrierShell.home();draw();note('New model-authored chapter admitted. Same Ghost, new trouble.');if(voice)speak();}catch(error){el('chapter-status').textContent='Chapter refused; current save kept. '+error.message;}});
el('start').addEventListener('click',()=>{const entropy=crypto.getRandomValues(new Uint32Array(1))[0];state=authoredBoot?createChapter(authoredBoot.pack,null,{entropy:state.rng.initial,handle:el('handle').value.trim()||'DIVER'}):newGame({rngSeed:entropy,handle:el('handle').value.trim()||'DIVER'});started=true;persist();draw();note('Carrier connected · choose 1, 2 or 3');if(voice)speak();});
el('reroll-stats').addEventListener('click',()=>{if(started||!authoredBoot)return;state=createChapter(authoredBoot.pack,null,{entropy:crypto.getRandomValues(new Uint32Array(1))[0],handle:el('handle').value.trim()||'DIVER'});draw();el('identity').open=true;el('identity').classList.remove('cg-baseline-impact');void el('identity').offsetWidth;el('identity').classList.add('cg-baseline-impact');audio.cue(true);note('New five-stat baseline rolled. Your saved runs are untouched.');});
el('resume').addEventListener('click',()=>{const saved=preferredResume();if(!saved)return;stopVoice();state=saved;started=true;draw();note('Carrier resumed. The math kept its fkn receipts.');});
el('motion').addEventListener('click',()=>{motionHeld=!motionHeld;juice.hold(motionHeld);battle.hold(motionHeld);stage?.hold(motionHeld);portrait?.hold(motionHeld);el('motion').textContent='Motion: '+(motionHeld?'held':'on');});
el('motion').textContent='Motion: '+(motionHeld?'held':'on');
el('voice').textContent='Voice: on';
function toggleVoice(){
  voice=speech.toggle();el('voice').textContent='Voice: '+(voice?'on':'off');el('repeat').hidden=!voice;
  el('boot-voice').setAttribute('aria-pressed',String(voice));el('boot-voice').textContent=voice?'VOICE: ON / LOCAL NEURAL / MODEL FIRST LOAD':'VOICE: OFF / CAPTIONS ONLY';
  if(!voice){stopVoice();note('Voice off');}else if(cinema.phase==='ready')speak();
}
el('voice').addEventListener('click',toggleVoice);el('boot-voice').addEventListener('click',toggleVoice);
el('repeat').addEventListener('click',()=>speak());
el('export').addEventListener('click',()=>{el('seed').value=encodePlaySeed(state);el('archive').open=true;el('seed-status').textContent='Exported the exact committed state. Copy it before leaving this carrier.';});
el('load').addEventListener('click',()=>{
  try{const next=decodePlaySeed(seedText());stopVoice();state=next;started=true;persist();draw();note('State restored · decision '+Math.min(15,state.turn));}
  catch(error){el('seed-status').textContent='Seed refused: '+error.message;}
});
el('next').addEventListener('click',()=>bootNext(seedText()));
el('copy').addEventListener('click',async()=>{
  const code=seedText()||encodePlaySeed(state);el('seed').value=code;
  try{decodePlaySeed(code);await navigator.clipboard.writeText('BOOT + '+code);el('seed-status').textContent='BOOT + seed copied. Paste beside this runbook in a new chat.';}
  catch(error){el('seed').focus();el('seed').select();el('seed-status').textContent='Select and copy the seed manually. '+error.message;}
});
el('vault-export').addEventListener('click',()=>{el('vault').value=vault.exportArchive();el('vault-status').textContent='Archive exported below: anonymous ID, exact checkpoints, callsigns and choice history. Nothing uploaded.';});
el('vault-import').addEventListener('click',()=>{try{const receipt=vault.importArchive(el('vault').value);state=vault.current()||state;started=!!vault.current();savedReceipt=receipt;draw();el('vault-status').textContent='Imported '+receipt.imported+' run records. '+receipt.message;}catch(error){el('vault-status').textContent='Import refused: '+error.message;}});
el('vault-download').addEventListener('click',()=>{const payload=vault.exportArchive();el('vault').value=payload;const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='friken-ghost-run-archive.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
root.addEventListener('keydown',event=>{if(inspector.active||battle.active||cinema.phase!=='ready'||event.target.matches('input,textarea')||event.metaKey||event.ctrlKey||event.altKey||event.repeat)return;const index=Number(event.key)-1;if(started&&index>=0&&index<3){const c=playView(state).choices[index];if(c){event.preventDefault();act(c.id);}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)speech.suspend();else if(cinema.phase==='ready')speech.resume();});
setInterval(()=>{if(!document.hidden)el('fps').textContent=stage?(stage.fps+' / FPS'):'TEXT MODE';},1000);
el('handle').value=vault.profile().callsign||'DIVER';
draw();
if(portrait)showFace(portrait.version.id);
renderWire();
const cinema=mountCinema(root,{audio,prepareVoice(){speech.warm(started?playView(state):meeting);},
  local:()=>vault.status().persistent,
  hold(busy){juice.hold(busy||motionHeld);if(busy){stopVoice();battle.hold(true);}stage?.hold(busy||motionHeld);portrait?.hold(busy||motionHeld);},
  ready(){note('Carrier ready · no decision spent. The universe can wait for your hand.');if(voice)speak();}
});
cinema.boot();
