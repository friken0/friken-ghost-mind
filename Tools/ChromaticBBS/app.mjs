import {mountStaging,continuityLabel} from './staging.mjs';
import {mountImageCinema} from './image-cinema.mjs';
import {mountScanner,specimenFinding} from './scanner.mjs';
import {firstMeetings,chapterMeeting,returningMeeting,teachingStaging,seedStaging,explainAttempt,pendingAttempt,choicePreview} from './story-guidance.mjs';
import {mountAlienComms,alienArtwork} from './alien-comms.mjs';
import {rollScore} from './causality.mjs';
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
const scanner=mountScanner(root,{consider(id){
  inspector.close();carrierShell.home();
  const choice=[...el('choices').children].find(b=>b.dataset.choice===id);if(!choice)return;
  for(const b of el('choices').children)b.classList.toggle('cg-evidence-choice',b===choice);
  choice.focus({preventScroll:true});choice.scrollIntoView({block:'nearest',behavior:'smooth'});
  note('Finding linked to this choice. Review its price and consequence; nothing committed.');
}});
const tableau=mountStaging(el('tableau'),{consider(objectId,ids){for(const button of el('choices').children)button.classList.toggle('cg-evidence-choice',ids.includes(button.dataset.choice));if(ids.length){const first=[...el('choices').children].find(n=>n.dataset.choice===ids[0]);first?.focus({preventScroll:true});}note('Inspected '+objectId.replaceAll('-',' ')+'. Related actions highlighted; no turn spent.');}});
const bootParent=authoredBoot?.parent?decodePlaySeed(authoredBoot.parent):null;
const preparedChapter=authoredBoot?createChapter(authoredBoot.pack,bootParent,{...authoredBoot.options,entropy:crypto.getRandomValues(new Uint32Array(1))[0]}):null;
let state=preparedChapter||newGame({rngSeed:20261019}), started=false, voice=true;
const meetings=firstMeetings;
const greetingMeeting=bootParent?returningMeeting(bootParent,preparedChapter.chapter):chapterMeeting(preparedChapter);
let meeting=greetingMeeting;
const qaMemory=new URL(location.href).searchParams.get('qaMemory')==='1';
let nativeStorage=null;
try{if(!qaMemory)nativeStorage=window.localStorage;}catch{}
const qaStore=new URL(location.href).searchParams.get('qaStore');
if(nativeStorage&&qaStore&&/^[a-z0-9-]{1,64}$/.test(qaStore)){
  const actual=nativeStorage,prefix='chromatic.qa.'+qaStore+'.';
  nativeStorage={getItem:k=>actual.getItem(prefix+k),setItem:(k,v)=>actual.setItem(prefix+k,v),removeItem:k=>actual.removeItem(prefix+k)};
}
const vault=createVault(nativeStorage);
function preferredResume(){return vault.current();}
let savedReceipt=null;
const stage=mountStage(el('canvas'),message=>{el('art-status').textContent=message;});
const portrait=mountPortrait(el('portrait'),message=>{el('face-status').textContent=message;});
let motionHeld=new URL(location.href).searchParams.get('qaMotion')==='held'||(stage?.paused??matchMedia('(prefers-reduced-motion: reduce)').matches);
stage?.update(state);
function note(message){el('status').textContent=message;}
mountSessionShare(root,{state:()=>state,storage:nativeStorage,note});
const chapterLibrary=mountChapterLibrary(root,{current:()=>state,storage:nativeStorage,localStates:()=>JSON.parse(vault.exportArchive()).runs.map(r=>decodePlaySeed(r.seed)),play(next){stopVoice();state=next;started=true;persist();carrierShell.home();draw();note('Public creation forked into your own saved run.');if(voice)speak();}});
const silentAudio=new URL(location.href).searchParams.get('qaAudio')==='silent';
const audio=mountAudio(root,{silent:silentAudio,frame(bands,level,vocal){portrait?.cymatics(bands);portrait?.voiceSpectrum(vocal||[0,0,0,0]);stage?.cymatics(bands);}});
const juice=mountJuice(root,{audio});
const alienComms=mountAlienComms(root,{audio,note,silent:silentAudio,enabled:()=>voice,stopSpeech:()=>speech.stop(),openView:button=>inspector.open('alien',button)});
const residentCinema=mountImageCinema(el('resident-art'),{held:()=>motionHeld});
const alienCinema=mountImageCinema(el('alien-image'),{held:()=>motionHeld});
const speech=mountSpeech(root,{note,storage:nativeStorage,silent:silentAudio,audio,alien:alienComms,pcm(value){portrait?.audioLevel(value);},articulate(cue){portrait?.articulate(cue);},talking(value){portrait?.talking(value);},pulse(){portrait?.pulse();}});
function stopVoice(){speech.stop();}
function speak(includeDecision=true){if(battle.active){speech.speak({scene:'',ghost:choiceCommentary(state.lastReceipt,state)?.spoken||'',battle:true});return;}const f=started?playView(state):meeting;speech.speak(started?{...f,ghost:f.sceneGhost||f.ghost,decision:includeDecision?choiceCommentary(state.lastReceipt,state):null}:meeting);}
const battle=mountRollBattle(root,()=>{note('Result held in the ledger · your next move.');if(voice)speak(false);},{audio});
const inspector=mountInspector(root,{stage,faceStory:()=>portrait?.companion,onOpen(){battle.hold(true);},onRead(kind){if(kind==='alien'){stopVoice();void alienComms.play();return;}if(!voice){voice=speech.toggle();el('voice').textContent='Voice: '+(voice?'on':'off');el('repeat').hidden=!voice;}if(kind==='face'&&portrait?.companion){speech.speak({scene:'',ghost:portrait.companion.spoken,ghostField:'inspect-help'});return;}speak();}});
root.addEventListener('cg-shell-leave',()=>inspector.close());
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
  if(!started){meeting=greetingMeeting;draw();}
  const target=el('title'),focus=started?el('choices').querySelector('button'):el('start');focus?.focus({preventScroll:true});
  target.scrollIntoView({behavior:'instant',block:'center'});
  note(started?'Back with you · same decision, same world.':'Back with you. We haven’t spent a turn.');
}
for(const id of ['face-back','station-back'])el(id).addEventListener('click',backToGhost);
const greeting=document.createElement('button');greeting.type='button';greeting.textContent='← First greeting';el('meet-who').parentElement.prepend(greeting);greeting.addEventListener('click',()=>{meeting=greetingMeeting;draw();if(voice)speak();});
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
  try{savedReceipt=vault.save(state);if(savedReceipt.run.seed!==encodePlaySeed(state))savedReceipt={persistent:false,message:'A newer checkpoint remains in the archive. This exact older checkpoint is open in memory; export its seed before branching or leaving.'};}
  catch(error){savedReceipt={persistent:false,message:'Save refused: '+error.message};}
}
function renderVault(){
  const status=savedReceipt||vault.status(),rows=vault.leaderboard();
  el('save-state').textContent=status.persistent?'[LOCAL / READY]':'[EXPORT REQUIRED]';
  el('save-label').textContent=status.persistent?(started?'SAVED ON THIS DEVICE':'DEVICE SAVE READY'):'MEMORY ONLY · EXPORT TO KEEP';
  el('vault-status').textContent=(status.persistent?'Local anonymous ID '+vault.profile().id+'. ':status.message+' ')+ 'No remote relay. Export to carry the archive elsewhere.';
  const currentScore=state.journal.reduce((sum,e)=>sum+rollScore(e.roll)+((state.pack ? (e.turn===state.pack.scenes.length||state.pack.scenes[e.turn]?.act!==e.act) : e.turn%5===0)?30:0),0)-20*state.scars.filter(s=>s.chapter===state.chapter).length;
  el('score').textContent=currentScore;el('played').textContent=rows.find(r=>r.handle===state.handle)?.turns||state.journal.length;
  el('scores').replaceChildren(...rows.map(row=>{const tr=document.createElement('tr');for(const k of ['handle','score','turns','runs'])tr.append(text('td',row[k]));return tr;}));
  el('resume').hidden=!vault.current();
}
function draw(){
  handoffParent=null;el('chapter-request').value='';
  const f=playView(state),complete=!!state.ending,total=f.total;alienComms.show(started&&!complete?f.transmission:null);
  root.querySelector('.cg-subtitle').textContent='CHROMATIC BBS // '+(state.pack?.title||'THE UNFINISHED CARRIER');
  root.dataset.theme=['cyan','purple','amber'][(state.scars.length+state.chapter-1)%3];
  el('boot').hidden=started;el('reroll-stats').hidden=!!authoredBoot?.parent;
  const contact=started&&!complete?f.transmission:null;el('resident-art').hidden=!contact;if(contact){el('resident-art').src=alienArtwork(contact.race);el('resident-art').alt=contact.race+' original StarDiver portrait';}el('resident-caption').textContent=contact?'LIVE CONTACT / '+contact.speaker:'';
  const situation=started?f.staging:meeting===meetings.rules?teachingStaging:meeting===meetings.seed?seedStaging:state.pack?.scenes[0]?.staging;tableau.update(situation,started?f.choices:[]);el('tableau').dataset.staged=situation?'yes':'';el('situation').hidden=!situation;for(const id of ['place','goal','pressure'])el(id).textContent=situation?.[id]||'';
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
  }else{el('ghost-lead').textContent='';el('ghost-lead').parentElement.hidden=true;el('decision').hidden=true;el('scene-tag').textContent='YOUR FIRST MEETING';el('title').textContent=meeting.title;el('scene').textContent=meeting.scene;el('ghost').textContent=meeting.ghost;}
  el('laws').replaceChildren(...state.modules.map(m=>text('span',m.id.toUpperCase()+' / '+m.law.name+' / v'+m.revision,'cg-law')));
  el('receipt').hidden=!state.lastReceipt;el('replay-roll').hidden=!state.lastReceipt?.roll;
  if(state.lastReceipt){const finding=specimenFinding(state.pack?.scenes[state.lastReceipt.turn-1],state.lastReceipt.choice);el('receipt').textContent=state.lastReceipt.summary+(finding?' Evidence / '+finding.label+': '+finding.text:'');el('code').textContent=JSON.stringify(state.lastReceipt,null,2);}
  const buttons=started&&!complete?f.choices.map((choice,i)=>{
    const b=document.createElement('button');b.type='button';b.className='cg-choice';b.dataset.choice=choice.id;
    const preview=choicePreview(state,choice),desc=text('span','','cg-choice-intent');desc.append(text('strong',choice.label));
    b.append(text('span',String(i+1),'cg-choice-number'),desc,text('span',preview.detail,'cg-choice-stakes'),text('span',preview.check,'cg-choice-check'));
    b.setAttribute('aria-label',choice.label+'. '+preview.detail+' '+preview.check);
    b.addEventListener('click',()=>act(choice.id));return b;
  }):[];
  if(complete){const b=text('button','Continue to Chapter '+(state.chapter+1)+' / prepare Ghost prompt →','cg-primary');b.type='button';b.addEventListener('click',()=>bootNext(encodePlaySeed(state)));buttons.push(b);}
  el('choices').replaceChildren(...buttons);
  const checked=started&&!complete&&state.pack?f.choices.filter(c=>!!pendingAttempt(state,c.id)?.check):[];
  el('causality-help').hidden=!checked.length;el('causality-explanation').textContent=checked.map(c=>explainAttempt(state,c.id)).join('\n\n');
  el('export').hidden=!started;el('repeat').hidden=!voice;root.querySelector('.cg-narrative').scrollTop=0;
  stage?.update(state);scanner.update(state,{active:started&&!complete,choices:f.choices});carrierShell.sync({key:state.runId+':'+state.chapter+':'+state.turn+':'+started,transmission:started&&!complete?f.transmission:null});juice.scene(state.runId+':'+state.chapter+':'+state.turn+':'+started+':'+(started?f.title:meeting.title));battle.setMode(state.pack?.roller||'armies');el('mode').textContent=state.pack?'MODEL-AUTHORED CHAPTER / LOCAL RULES':'AUTHORED DEMO / ASK GHOST FOR NEXT CHAPTER';
  renderVault();
  el('completion').hidden=!started||!complete;
  if(complete){
    el('complete-label').textContent='CHAPTER '+state.chapter+' COMPLETE / '+state.journal.length+' DECISIONS / '+(savedReceipt?.persistent?'SAVED ON THIS DEVICE':'EXPORT TO KEEP THIS TELLING');
    el('complete-title').textContent=state.ending.title||f.title;
    el('complete-summary').textContent='This telling is complete. Your choices and their consequences are saved below; the next chapter needs a new Ghost-authored pack.';
    el('complete-stats').textContent='SCORE '+el('score').textContent+' · SIGNAL '+state.resources.signal+'/10 · COMPUTE '+state.resources.compute+'/10 · NOISE '+state.resources.noise+'/10 · '+state.scars.length+' SCARS';
    el('complete-laws').textContent='LAWS YOU CARRY: '+(state.modules.map(m=>m.law.name).join(' / ')||'none installed');
    el('complete-threads').textContent='UNFINISHED BUSINESS: '+(state.world.threads.map(id=>continuityLabel(state.pack,id)).join(' / ')||'No unresolved threads recorded. Ghost will build from your ending.');
  }
  if(complete){el('seed').value=encodePlaySeed(state);el('archive').open=true;el('seed-status').textContent='Chapter complete. Ask Ghost for a new chapter; its request carries your exact choices, laws and unresolved business.';}
  // Inspection surface for honest browser acceptance; it has no turn writer.
  el('state').value=JSON.stringify(state,null,2);
  root.chromatic={state:structuredClone(state),frame:structuredClone(f),audio:audio.info};
}
function act(id){
  if(battle.active)return;
  try{chapterLibrary.assertPlayable(state);const before=state.resources,next=playChoose(state,id);stopVoice();state=next;persist();draw();juice.deal();juice.transition(before,state.resources);note('Decision committed · '+(state.lastReceipt?.summary||'waiting for you'));if(state.lastReceipt?.roll){const decision=choiceCommentary(state.lastReceipt,state);battle.show(state.lastReceipt,decision);if(voice)speech.speak({scene:'',ghost:decision.spoken,battle:true});}else if(voice)speak();}
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
    const ready=canonForHandoff();el('seed-status').textContent=ready?'NEXT CHAPTER PROMPT READY. Copy it into the Ghost runbook chat, then import Ghost’s returned chapter JSON below.':'Choose this ending as canon here, then copy the prepared prompt. Your ending remains in this carrier; export its seed to keep a portable copy.';
    note((savedReceipt?.persistent?'Your ending is saved. ':'Export this ending to keep it. ')+'Prepare → copy to Ghost chat → import the new chapter.');
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
el('start').addEventListener('click',()=>{const entropy=crypto.getRandomValues(new Uint32Array(1))[0];state=authoredBoot?createChapter(authoredBoot.pack,authoredBoot.parent?decodePlaySeed(authoredBoot.parent):null,{entropy:state.rng.initial,handle:el('handle').value.trim()||'DIVER'}):newGame({rngSeed:entropy,handle:el('handle').value.trim()||'DIVER'});started=true;persist();draw();note('Carrier connected · choose 1, 2 or 3');if(voice)speak();});
el('reroll-stats').addEventListener('click',()=>{if(started||!authoredBoot||authoredBoot.parent)return;state=createChapter(authoredBoot.pack,null,{entropy:crypto.getRandomValues(new Uint32Array(1))[0],handle:el('handle').value.trim()||'DIVER'});draw();el('identity').open=true;el('identity').classList.remove('cg-baseline-impact');void el('identity').offsetWidth;el('identity').classList.add('cg-baseline-impact');audio.cue(true);note('New five-stat baseline rolled. Your saved runs are untouched.');});
el('resume').addEventListener('click',()=>{const saved=preferredResume();if(!saved)return;stopVoice();state=saved;started=true;draw();note('Carrier resumed. The math kept its fkn receipts.');if(voice)speak();});
el('motion').addEventListener('click',()=>{motionHeld=!motionHeld;juice.hold(motionHeld);battle.hold(motionHeld);stage?.hold(motionHeld);portrait?.hold(motionHeld);residentCinema.refresh();alienCinema.refresh();el('motion').textContent=motionHeld?'Resume motion':'Pause motion';el('motion').setAttribute('aria-pressed',String(motionHeld));});
el('motion').textContent=motionHeld?'Resume motion':'Pause motion';el('motion').setAttribute('aria-pressed',String(motionHeld));
el('voice').textContent='Voice: on';
function toggleVoice(){
  voice=speech.toggle();el('voice').textContent='Voice: '+(voice?'on':'off');el('repeat').hidden=!voice;
  el('boot-voice').setAttribute('aria-pressed',String(voice));el('boot-voice').textContent=voice?'VOICE: ON / LOCAL NEURAL / MODEL FIRST LOAD':'VOICE: OFF / CAPTIONS ONLY';
  if(!voice){stopVoice();note('Voice off');}else if(cinema.phase==='ready')speak();
}
el('voice').addEventListener('click',toggleVoice);el('boot-voice').addEventListener('click',toggleVoice);
el('repeat').addEventListener('click',()=>speak());
el('explain-roll').addEventListener('click',()=>{stopVoice();if(!voice){voice=speech.toggle();}speech.speak({ghost:el('causality-explanation').textContent,scene:''});note('Explanation only. Your decision, resources and random stream are unchanged.');});
el('export').addEventListener('click',()=>{el('seed').value=encodePlaySeed(state);el('archive').open=true;el('seed-status').textContent='Exported the exact committed state. Copy it before leaving this carrier.';});
el('load').addEventListener('click',()=>{
  try{const next=decodePlaySeed(seedText());stopVoice();state=next;started=true;persist();draw();note('State restored · decision '+Math.min(playView(state).total,state.turn));if(voice)speak();}
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
root.addEventListener('keydown',event=>{if(root.dataset.window!=='encounter'||inspector.active||battle.active||cinema.phase!=='ready'||event.target.matches('input,textarea')||event.metaKey||event.ctrlKey||event.altKey||event.repeat)return;const index=Number(event.key)-1;if(started&&index>=0&&index<3){const c=playView(state).choices[index];if(c){event.preventDefault();act(c.id);}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)speech.suspend();else if(cinema.phase==='ready')speech.resume();});
// Count visible UI frames: the SDF is deliberately hidden in Transmission mode.
let uiFrames=0,uiFrameAt=performance.now();
function uiFrame(now){if(!document.hidden){uiFrames++;if(now-uiFrameAt>=1000){const faceRate=Number(el('portrait').dataset.renderFps);el('fps').textContent='UI '+Math.round(uiFrames*1000/(now-uiFrameAt))+' FPS / '+(motionHeld?'FACE HELD':faceRate?'FACE '+Math.round(faceRate):el('portrait').dataset.state==='ready'?'FACE READY':'FACE WARMING');uiFrames=0;uiFrameAt=now;}}else{uiFrames=0;uiFrameAt=now;}requestAnimationFrame(uiFrame);}
requestAnimationFrame(uiFrame);
el('handle').value=vault.profile().callsign||'DIVER';
draw();
if(portrait)showFace(portrait.version.id);
renderWire();
if(motionHeld){juice.hold(true);stage?.hold(true);portrait?.hold(true);}
console.log('[Chromatic] C26.26 / shared scene contract / native face');
const cinema=mountCinema(root,{audio,prepareVoice(){speech.warm(started?playView(state):meeting);},
  local:()=>vault.status().persistent,
  hold(busy){juice.hold(busy||motionHeld);if(busy){stopVoice();battle.hold(true);}stage?.hold(busy||motionHeld);portrait?.hold(busy||motionHeld);},
  ready(){note('Carrier ready · no decision spent. The universe can wait for your hand.');if(voice)speak();}
});
cinema.boot();
