import {playLetterRelay,newLetterRelay,saveLetterRelay,restoreLetterRelay,firstContactText,postmarkSpecimen,openedLetterComms} from './letter-relay.mjs';
import {paintLetterRelay,pickRelaySignal} from './letter-relay-art.mjs';
import {replyDiscoveries,canDiscover,discoveryIds} from './reply-discoveries.mjs';
import {ansiColourThemes} from './ansi-terminal.mjs';
import {TURN_OUT_OF_TIME as targetedPacket} from './turn-out-of-time-data.mjs';
import {mountResponseTheater,newReplyVisit,validateReplyVisit,recordReplyVisit} from './response-theater.mjs';
import {mountPortrait} from './portrait.mjs';
import {mountBootWorld} from './boot-world.mjs';
import {mountAudio,openingTrackIndex} from './audio.mjs';
import {authoredSpeechFrame,mountSpeech} from './speech.mjs';
import {replyVoice} from './reply-media.mjs';
import {crewVoice,discoveryVoice,doorVoice,replyAnswerSaved,replyDetailVoice,replyIllustrationVoice,workshopVoice} from './reply-voice-scenes.mjs';
import {mountStage} from './stage.mjs';
import {modemDuration} from './modem.mjs';
import {ghostBoard,readGhostBoard} from './ghostlink-transport.mjs';
import {mountNativeResponseHost} from './native-response-host.mjs';
import {nativeReplyProgram,nativeMemoryLayers,causalApproaches} from './native-response-program.mjs';
import {mindProgress,causalDemo,causalAttributes} from './mind-adventure.mjs';
import {mountAnsiSkirmish} from './ansi-skirmish.mjs';
import {mountAnsiMeshSprite} from './ansi-mesh.mjs';
import {localWorkshop,mailrun,mailrunLegs,crewTrial,crewRoles,workshopCheck,workshopRoll} from './door-and-crew.mjs';
import {mountAnsiIllustration} from './ansi-illustration.mjs';
import {bitcoinIllustrations,replyIllustrations} from './illustration-data.mjs';

import {renderAlienUtterance} from './alien-comms.mjs';
import {authoredBoot} from './chapter-data.mjs';
import {responseMode} from './framework-mode.mjs';
import {createRetainedChapter,retainedFramework} from './retained-chapter.mjs';

/* One retained terminal, one procedural overlay. The page plays authored data;
 * a new model turn happens only when the player carries its return packet. */
const root=document.querySelector('#chromatic-carrier'),params=new URL(location.href).searchParams;
const silent=params.get('qaAudio')==='silent',reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let chapterStorage=null;try{if(!params.has('qaMemory'))chapterStorage=localStorage;}catch{}
const chapterDriver=responseMode==='chapter'?createRetainedChapter(authoredBoot,{storage:chapterStorage}):null;
const packet=chapterDriver?.packet||targetedPacket;
const voiceGateEnabled=!chapterDriver;
root.dataset.frameworkHost='retained-ansi';root.dataset.frameworkVersion=retainedFramework.version;root.dataset.responseMode=responseMode;
const key='friken.turn-out-of-time.v1:'+packet.id+(params.has('qaStore')?':'+params.get('qaStore'):'');
let storage=null,visit=newReplyVisit(packet),saveStatus='LOCAL VISIT';
try{storage=localStorage;if(!params.has('qaMemory')){const raw=storage.getItem(key);if(raw)visit=validateReplyVisit(JSON.parse(raw),packet);}}catch{saveStatus='MEMORY ONLY / COPY BEFORE LEAVING';}
let ui,audio,speech,native=null,world=null,bootCanvas=null,portrait=null,artifact=null,artifactCanvas=null;
let screenHistory=[],current=visit.current,history=[],connected=false,connecting=false,tick=0,bootAt=0,bootPauseAt=0,flightRAF=0;
let terminalStarted=false,modemStarted=false,held=reduce,musicTouched=false,sfxOn=true,retina=params.get('pixels')!=='native'&&/Mac|iPad|iPhone/.test(navigator.platform||navigator.userAgent);
let boardRead=null,boardStatus='NOT CONNECTED',boardReceipt={mode:'not-connected'},activeSpeaker=null,overlayKind=null,overlayExitTimer=0,speechEndTimer=0,illustrator=null,meshPainter=null;
let arena=null,arenaField=null,skirmish=null,gameTime=0,gameRunning=false,arenaPaused=false,rollAnimation=null,lastClock=0,lastHUD=0;
const artSeed=crypto.getRandomValues(new Uint32Array(1))[0],speeds=[300,1200,2400,9600,14400,21100,56000];let bps=14400,pendingRead=null,firstProgram=true;
const relayKey=key+':relay';
function loadLetterRelay(){
 if(!packet.relay)return null;
 try{return restoreLetterRelay(params.has('qaMemory')?null:JSON.parse(storage?.getItem(relayKey)||'null'));}
 catch{return newLetterRelay();}
}
let letterFrame=null,letterArtKey='',letterClock=0,letterLastAt=null,letterLastStrike=null,letterSentAt=null;
let voiceBadge='';let state={letterRelay:loadLetterRelay(),actionPage:0,skirmishOn:false,screen:'map',paletteIndex:0,layer:'now',page:0,focus:null,receipt:'',rollProgress:1,illustrationIndex:0},draft={...(visit.answers||{})},pendingNote=null;
const node=id=>packet.nodes.find(n=>n.id===id),clean=text=>String(text??'').replace(/[\x00-\x1f\x7f]/g,' ');

function note(text){ui?.note(text);pendingNote=clean(text).slice(0,77);}
function dimTerminal(value){native?.element.classList.toggle('native-terminal-dim',!!value);}
function totalScore(v=visit){if(chapterDriver)return chapterDriver.model().score;const w=localWorkshop(v.workshop);return mindProgress(v).score+w.door.score+w.crew.score;}
function record(entry,celebration={}){const before=totalScore();visit=recordReplyVisit(visit,entry,packet);const after=totalScore();if(after>before&&packet.layout!=='letter')native?.reward({from:before,to:after,label:celebration.label||({view:'NEW DOOR EXPLORED',answer:'YOUR WORDS KEPT',choice:'A DIRECTION CHOSEN',roll:'CAUSALITY ANSWERED',workshop:'REAL WORK DONE'}[entry.kind]||'DISCOVERY'),bonus:!!celebration.bonus});if(!params.has('qaMemory'))try{if(!storage)throw Error('No storage');storage.setItem(key,JSON.stringify(visit));saveStatus='SAVED ON THIS DEVICE';}catch{saveStatus='MEMORY ONLY / COPY BEFORE LEAVING';}}
function keepRelay(){
 if(params.has('qaMemory'))return;
 try{
  if(!storage)throw Error('Storage unavailable');
  storage.setItem(relayKey,JSON.stringify(saveLetterRelay(state.letterRelay)));
 }catch{saveStatus='LOCAL SAVE UNAVAILABLE';}
}
function letterArtFrame(program,clock){
 const region=program.letterScene,relay=state.letterRelay;
 if(!region){
  letterFrame=null;letterLastAt=null;letterArtKey='';
  audio.weather(0);return null;
 }
 const still=held||reduce||!!overlayKind;
 if(letterLastAt!==null&&!still)letterClock+=Math.min(.15,clock-letterLastAt);
 letterLastAt=clock;
 const time=Math.floor(letterClock*14)/14,sendAge=letterSentAt===null?1:clock-letterSentAt;
 const key=[time,still,program.grid.columns,program.grid.rows,relay.zoom,relay.reticle,relay.locked,
  relay.history.length,relay.assembled,relay.sent,relay.sent?Math.min(14,Math.floor(sendAge*14)):0,state.focus].join('|');
 if(key!==letterArtKey){
  letterArtKey=key;
  letterFrame=paintLetterRelay(relay,region,program.grid,time,{seed:artSeed,held:still,sendAge,focus:state.focus});
 }
 const storm=letterFrame.storm;
 audio.weather(storm?(overlayKind ? .19 : storm.covered ? .34 : .88):0);
 if(storm?.strike!=null&&storm.strike!==letterLastStrike&&!still){
  letterLastStrike=storm.strike;
  audio.uiCue(storm.strike%2?'thunder-far':'thunder-near');
 }
 return letterFrame.cells;
}
function letterWheel(cell,delta){
 const region=native?.program.letterScene,relay=state.letterRelay;
 if(!region||!cell||!relay||relay.locked||cell.row<region.row||cell.row>=region.row+region.height||
  cell.column<region.column||cell.column>=region.column+region.width)return false;
 if(delta!==0&&relay.zoom!==(delta<0))letterAction('zoom');
 return true;
}
function letterAction(action,cell=null){
 const before=state.letterRelay;
 if(!before||current!==packet.relay?.entry||state.screen!=='topic'||overlayKind)return;
 if(action==='collect'){
  if(!before.sent||state.letterTransmitPending)return;
  audio.uiCue('score');return show(packet.relay.reward);
 }
 let signal=null;
 if(action==='scene'){
  if(before.locked)return;
  action='sample';signal=cell?pickRelaySignal(letterFrame?.points||[],cell)||'empty':null;
 }
 const next=playLetterRelay(before,action,signal);
 if(next===before)return;
 speech.stop();pendingRead=null;
 state.letterRelay=next;state.actionPage=0;
 if(next.sent&&!before.sent){
  letterSentAt=native.clock;state.letterTransmitPending=!(held||reduce);audio.uiCue('transmit');
 }else if(next.locked&&!before.locked)audio.uiCue('carrier');
 else if(next.eggs.length>before.eggs.length)audio.uiCue('secret');
 else if(next.history.length>before.history.length)audio.uiCue('switch');
 else if(next.assembled&&!before.assembled)audio.uiCue('carrier');
 else if(action==='sample'||action==='send'||action==='assemble')audio.uiCue('reject');
 if(next.locked||next.eggs.length)keepRelay();
 render(true);
}
function programState(){return {...state,saveStatus,chapter:chapterDriver?.model(),grid:native?.grid,artSeed,bps,paletteLabel:ansiColourThemes[state.paletteIndex||0].label,workshop:localWorkshop(visit.workshop),bbIllustrations:bitcoinIllustrations,attributes:chapterDriver?Object.fromEntries(Object.entries(causalAttributes).map(([k,v])=>[k,{...v,value:chapterDriver.model().stats[k]}])):causalAttributes,sfxOn,packet,current,discoveries:discoveryIds(visit),progress:packet.layout==='letter'?{explored:(visit.visited||[]).filter(id=>id!==packet.openingId)}:{...mindProgress(visit),score:totalScore()},selectedTelling:visit.selectedTelling,answers:state.screen==='answers'?draft:(visit.answers||{}),roll:rollAnimation?.receipt||state.rollResult||(state.rollPreview?null:visit.roll),boardStatus,voiceOn:speech?.enabled!==false,musicOn:audio?.musicOn||false,held,physics:skirmish?.snapshot};}
function render(immediate=false){if(!native)return;const program=nativeReplyProgram(programState());if(!program.letterScene&&state.letterRelay)audio.weather(0);state.page=program.pagination?.page??state.page;native.show(program,{immediate});firstProgram=false;meshPainter?.update(program.sprite,native.terminal.complete,native.clock,held||reduce||!!overlayKind,{bands:audio.info.bands,rms:audio.info.rms});illustrator?.update(program.illustration,native.terminal.complete,native.clock,held||reduce);placeArena();if(document.activeElement===document.body)native.element.focus({preventScroll:true});}
function controls(){
 const entry=openingVoice;
 const voiceStatus=entry?(entry.error?'VOICE PREP FAILED / RETRY OR READ':entry.total&&entry.ready===entry.total?'OPENING VOICE READY':entry.total?'PREPARING OPENING VOICE '+entry.ready+'/'+entry.total:'PREPARING OPENING VOICE'):'';
 world?.set({terminalMode:world.terminal.mode,terminalControls:{music:audio.musicOn,voice:speech.enabled,paused:held,boardStatus,voiceStatus}});
}
function connectBoard(){if(boardRead)return boardRead;boardStatus='HTTPS / READING PUBLIC REGISTRY';root.dataset.boardTransport='checking';controls();boardRead=readGhostBoard().then(r=>{boardReceipt=r;boardStatus='PUBLIC REGISTRY / '+r.version+' / '+r.files+' FILES';root.dataset.boardTransport=r.mode;root.dataset.boardVersion=r.version;controls();if(native)note(boardStatus);return r;}).catch(error=>{boardReceipt={mode:'offline-local',repository:ghostBoard.repository,reason:error.message};boardStatus='REPO UNAVAILABLE / LOCAL COPY';root.dataset.boardTransport='offline-local';controls();if(native)note(boardStatus);return boardReceipt;});return boardRead;}
function music(){musicTouched=true;audio.toggleMusic();controls();render(true);}
function voice(){
 const on=speech.toggle();controls();
 if(!on){openingVoice?.controller.abort();openingVoice=null;finishPageWithoutVoice();closeOverlay();}
 else if(connected){if(!voiceGateEnabled)primeLikelyReplies();void nativeAction('verb:read');}
 else startOpeningVoice();
 render(true);
}
function motion(){held=!held;if(connecting){if(held){bootPauseAt=performance.now();audio.modemPause();}else if(bootPauseAt){bootAt+=performance.now()-bootPauseAt;bootPauseAt=0;if(modemStarted&&!terminalStarted)audio.modemResume(Math.max(0,(performance.now()-bootAt)/1000-(world?.terminal.commandDuration||2.3)));}}world?.set({paused:held});controls();portrait?.hold(held||overlayKind!=='ghost');artifact?.hold(held);native?.setReducedMotion(held||reduce);render(true);}
function clearArena(){gameRunning=false;skirmish?.destroy();skirmish=null;arena?.remove();arena=arenaField=null;}
function clearArtifact(){delete root.dataset.inspect;artifact?.dispose();artifact=null;artifactCanvas?.remove();artifactCanvas=null;}
function closeOverlay(){clearTimeout(speechEndTimer);clearTimeout(overlayExitTimer);const wasFace=overlayKind==='ghost';activeSpeaker=null;overlayKind=null;portrait?.talking(false);portrait?.speaker(null);void portrait?.focusSpeaker(null,{immediate:held||reduce});portrait?.emerge(false,{immediate:reduce});artifact?.hold(true);native?.overlay(false);dimTerminal(false);if(wasFace&&!reduce){overlayExitTimer=setTimeout(()=>{if(!overlayKind){portrait?.hold(true);ui?.overlay(false);}},940);}else{portrait?.hold(true);ui?.overlay(false);}}
function ensurePortrait(){clearArtifact();if(!portrait)portrait=mountPortrait(ui.canvas,note,{viewport:'rect',background:false,pixelRatio:retina?Math.min(1,(devicePixelRatio||1)*.75):undefined,profileEvery:params.has('profile')?30:0});ui.canvas.hidden=false;return portrait;}
function openSpeaker(role){if(!connected||!role)return;clearTimeout(speechEndTimer);clearTimeout(overlayExitTimer);activeSpeaker=role;overlayKind='ghost';gameRunning=false;skirmish?.pause(true);ensurePortrait();portrait?.speaker(role);portrait?.emerge(true,{immediate:reduce});portrait?.hold(held);ui.overlay(true,role==='companion'?'ELSE / LIVE SIGNAL':'FRIKEN.GHOST / LIVE SIGNAL');native?.overlay(true);dimTerminal(true);}
function authoredVoiceFrame(id){return chapterDriver?chapterDriver.voice():authoredSpeechFrame(node(id));}
function primeLikelyReplies(){if(chapterDriver){speech.primeFrames(chapterDriver.prime());return;}const ids=[current,...node(current).choices.map(c=>c.target),packet.openingId,'bbs','identity','demo','memory','greater-mind',...packet.nodes.map(n=>n.id)],ordered=[...new Set(ids)];speech.primeFrames(ordered.filter(id=>node(id)).map(authoredVoiceFrame));}

function voiceFrame(){
 if(chapterDriver)return chapterDriver.voice();
 const screen=state.screen;
 if(screen==='discovery')return discoveryVoice(state.secretId);
 if(screen==='door-game'){const d=mailrun(visit.workshop?.door?.actions||[]);return doorVoice(Math.min(2,d.leg),d.done);}
 if(screen==='crew-builder'){const c=crewTrial(visit.workshop?.crew||{});return crewVoice(c.role,c.done);}
 if(packet.layout!=='letter'&&Object.hasOwn(workshopVoice,screen))return workshopVoice[screen];
 if(packet.layout!=='letter'&&screen==='packet')return workshopVoice.ending;
 return authoredVoiceFrame(screen==='map'?packet.openingId:screen==='roll'?'causality':current);
}
function discover(id,source){
 const d=replyDiscoveries[id];if(!d)return false;
 const known=discoveryIds(visit).includes(id);
 if(!known&&!canDiscover(id,visit,source))return false;
 const frame=discoveryVoice(id);
 return requestVoicedPage({title:d.title,frame,apply(prepared){
  if(!known)record({kind:'discovery',id,source},{label:d.title,bonus:true});
  speech.stop(true,!!prepared);pendingRead=null;closeOverlay();clearArtifact();
  state.screen='discovery';state.secretId=id;state.actionPage=0;render();
  if(prepared)pendingRead=()=>speech.speak(frame,0,prepared);
 }});
}
let pageRequest=null,openingVoice=null;
function startOpeningVoice(){
 if(!voiceGateEnabled||silent||!speech.enabled||openingVoice)return;
 const controller=new AbortController(),entry={id:current,controller,ready:0,total:0,error:''};
 openingVoice=entry;root.dataset.openingVoice='preparing';
 entry.promise=speech.prepareFrame(authoredVoiceFrame(current),{signal:controller.signal,progress(ready,total){
  Object.assign(entry,{ready,total});root.dataset.openingVoice=ready===total?'ready':ready+'/'+total;controls();
  if(pageRequest?.source===entry)render(true);
 }}).catch(error=>{entry.error=error.message;root.dataset.openingVoice='error';controls();return null;});
}
function clearPageRequest(){
 const request=pageRequest;
 pageRequest=null;state.voiceGate=null;
 if(request?.source!==openingVoice)request?.source.controller.abort();
}
async function requestVoicedPage({title,frame,source=null,apply,initial=false}){
 if(!voiceGateEnabled||silent||!speech.enabled){apply(null);return;}
 speech.stop(true,true);closeOverlay();clearArtifact();pendingRead=null;
 clearPageRequest();
 const entry=source??{controller:new AbortController(),ready:0,total:0,error:''};
 const request={source:entry,title,frame,apply,initial};
 pageRequest=request;state.voiceGate=request;if(!entry.total||entry.ready<entry.total||entry.error)render(true);
 if(!entry.promise)entry.promise=speech.prepareFrame(frame,{signal:entry.controller.signal,progress(ready,total){
  Object.assign(entry,{ready,total});if(pageRequest===request)render(true);
 }}).catch(error=>{entry.error=error.message;return null;});
 const prepared=await entry.promise;
 if(pageRequest!==request)return;
 if(!prepared){render(true);return;}
 if(source===openingVoice)openingVoice=null;
 clearPageRequest();apply(prepared);
}
function finishPageWithoutVoice(){
 if(!pageRequest)return;
 const {apply}=pageRequest;clearPageRequest();apply(null);
}
function readCurrent(){
 if(!connected)return;
 if(!native?.terminal.complete){pendingRead=()=>readCurrent();return;}
 gameRunning=false;skirmish?.pause(true);clearArtifact();
 const frame=voiceFrame();
 if(!voiceGateEnabled){speech.speak(frame);return;}
 if(!speech.canPrepare(frame)){note('This tool is explained on the terminal. Return to the story to hear the cast.');return;}
 void requestVoicedPage({title:'Hear this page',frame,apply(prepared){render(true);if(prepared)speech.speak(frame,0,prepared);}});
}
function readDetail(detail){
 if(!native?.terminal.complete){pendingRead=()=>readDetail(detail);return;}
 gameRunning=false;skirmish?.pause(true);
 const frame=replyDetailVoice(detail);
 if(!voiceGateEnabled){speech.speak(frame);return;}
 if(!speech.canPrepare(frame)){note(detail.title+' / '+detail.text);return;}
 void requestVoicedPage({title:detail.title,frame,apply(prepared){render(true);if(prepared)speech.speak(frame,0,prepared);}});
}
function show(id,{remember=true,choice=null,initial=false}={}){
 if(!node(id))throw Error('Unknown reply node');
 const frame=authoredVoiceFrame(id);
 return requestVoicedPage({title:node(id).title,frame,source:openingVoice?.id===id?openingVoice:null,initial,apply(prepared){
  speech.stop(true,!!prepared);closeOverlay();clearArtifact();state.actionPage=0;
  if(choice){
   audio.uiCue('switch');record({kind:'choice',from:current,id:choice.id,to:id});
  }
  if(remember&&id!==current)history.push(current);
  current=id;record({kind:'view',node:id});ui.show(id);ui.ready();
  state.screen=chapterDriver?'chapter':id==='hello'&&packet.layout!=='letter'?'map':'topic';
  state.page=0;pendingRead=null;render();
  if(prepared)pendingRead=()=>speech.speak(frame,0,prepared);
  else if(!voiceGateEnabled&&speech.enabled&&!silent){speech.warm(voiceFrame());primeLikelyReplies();pendingRead=()=>readCurrent();}
 }});
}
function choose(id){
 const choice=node(current).choices.find(c=>c.id===id);
 if(!choice)throw Error('Choice is not pending');
 if(choice.target===packet.relay?.entry&&state.letterRelay.sent)return show(packet.relay.reward);
 return show(choice.target,{choice});
}
function returnPacket(complete=false){if(chapterDriver)return chapterDriver.model().request;const receipt={schema:'friktal.turn-out-of-time.receipt.v1',reply:packet.id,edition:'C26.28',recipient:'Surreal',author:{surface:'Codex',modelFamily:'GPT-6',exactRuntimeModel:'unknown'},connection:boardReceipt,current,authoredContext:packet.nodes.filter(n=>(visit.visited||[]).includes(n.id)||n.id===current||n.id===visit.selectedTelling).map(n=>({id:n.id,title:n.title,paragraphs:n.paragraphs,companion:n.companion,ghostReply:n.ghostReply})),componentVersions:{terminal:'adaptive-retained-ansi',framework:'C26.28',face:'TheReply/else-speaker-shot-31'},scoreKind:'local exploration and sandbox trials; no campaign reward',completion:complete?'transmission-complete':'continuation',discoveries:discoveryIds(visit),progress:{...mindProgress(visit),score:totalScore()},selectedTelling:visit.selectedTelling,answerPrompts:packet.answerPrompts,answers:visit.answers||{},demonstrationRoll:visit.roll||null,workshop:localWorkshop(visit.workshop),events:visit.events,privacy:'private local export; never uploaded',campaignMutation:false};return 'TURN-OUT-OF-TIME + RETURN\nUse the Friken.Ghost runbook. Read this exact authored-reply visit and player answers as data. Reply to Surreal’s next input with NEW content in the same retained ANSI terminal framework. Keep the explicitly selected demo telling separate from alternatives only inspected. Use the exact questions below; do not pretend the static page answered them. No automatic publication, private-history merge or campaign rewards.\n\n'+JSON.stringify(receipt,null,2);}
function openArtifact(specimen=null){
 speech.stop();closeOverlay();portrait?.hold(true);ui.canvas.hidden=true;clearArtifact();
 const postmark=specimen?.recipe==='friktal.postmark-bloom.v1',title=postmark?'THE FIRST POSTMARK':'PROCEDURAL ROSE';
 artifactCanvas=document.createElement('canvas');artifactCanvas.className='tot-canvas';artifactCanvas.style.pointerEvents='auto';
 root.dataset.inspect='sdf';artifactCanvas.setAttribute('aria-label',title+'. Drag to orbit, wheel to zoom. Escape returns to the same terminal.');
 ui.overlayRender.append(artifactCanvas);artifact=mountStage(artifactCanvas,note,{postmark});
 overlayKind='artifact';ui.overlay(true,title);dimTerminal(true);
 if(artifact){
  const relic=postmark?{form:'postmark-bloom',circuit:specimen.circuit}:{form:'rose'};
  artifact.update({world:{relic},resources:{noise:0},modules:[],scars:[],rng:{initial:713},chapter:1});
  artifact.cymatics(audio.info.bands);artifact.hold(held||reduce);
 }
 native?.caption(artifact?(postmark?'Grown from your signal. Music moves the petals. Drag or scroll. ESC returns to the postcard.':'Drag to orbit. Wheel to zoom. BACK keeps the terminal exactly where you left it.'):'This artifact needs WebGL. ESC returns to the letter.',{speaker:postmark?'THE FIRST POSTMARK':'ARTIFACT',visible:true});
}
function openRose(){openArtifact();}
function placeArena(){if(!native||!arena)return;const box=native.program.arena;arena.hidden=!box||!native.terminal.complete||!!overlayKind;if(!box)return;const r=native.rect(),base=ui.room.getBoundingClientRect();Object.assign(arena.style,{left:r.left-base.left+r.cellWidth*(box.column-1)+'px',top:r.top-base.top+r.cellHeight*(box.row-1)+'px',width:r.cellWidth*box.width+'px',height:r.cellHeight*box.height+'px'});}
function openArena(receipt=null){state.skirmishOn=receipt?true:!state.skirmishOn;if(!state.skirmishOn){clearArena();render(true);return;}arena=document.createElement('section');arena.className='native-skirmish';arena.style.cssText='position:absolute;z-index:3;pointer-events:none;overflow:hidden;background:#000;';arenaField=document.createElement('div');arenaField.style.cssText='position:absolute;inset:0;';arena.append(arenaField);native.element.append(arena);gameTime=0;gameRunning=true;arenaPaused=false;skirmish=mountAnsiSkirmish(arenaField,{seed:artSeed,columns:88,rows:24,compact:true,onEvent:e=>{const kind={fire:'volley',impact:'impact',detach:'impact',death:'collapse',explosion:'collapse'}[e.kind];if(kind)audio.battleCue({kind,side:e.team==='red'?1:0});}});skirmish.start(receipt?{causality:receipt}:undefined);render(true);}
function rollStart(workshopId=null){
 if(rollAnimation)return;
 state.rollPreview=false;const bits=new Uint32Array(1);do{crypto.getRandomValues(bits);}while(bits[0]>=4294966000);
 const sample=(bits[0]%2000+1)/100;let receipt,returnScreen=null;
 if(workshopId){const kind=workshopId.startsWith('door:')?'door':'crew',id=workshopId.split(':')[1],role=localWorkshop(visit.workshop).crew.role;
  receipt=workshopRoll(kind,id,role,sample);workshopAction(workshopId,receipt);returnScreen=state.screen;
  state.rollStat=receipt.statId;state.rollContext=kind==='door'?'MAILRUN / CROSS THE RELAY':'CREW TRIAL / VERIFY THE ORDER';
 }else{receipt={...causalDemo(sample,causalAttributes[state.rollStat||'focus'].value),statId:state.rollStat||'focus'};state.rollContext='CONVOY / DELIVER THE SEEDS';}
 speech.stop();closeOverlay();state.rollResult=receipt;state.rollTrial=!!workshopId;state.rollReturn=returnScreen;state.screen='roll';state.rollProgress=0;
 rollAnimation={receipt,elapsed:0,charge:-1,workshopId,returnScreen};state.rollBoarding=workshopId==='door:armor';if(state.rollBoarding){clearArena();openArena(receipt);}else{clearArena();state.skirmishOn=false;}render(true);
}

function voiceIndicator(clock){
 if(!native?.terminal.complete||silent||state.voiceGate)return;
 const info=state.speechState,waiting=Number(root.dataset.voicePending)>0,phase=info?.phase||'on';
 let text='';if(speech.enabled&&(pendingRead||waiting||['preparing','loading','speaking','complete','retry','caching'].includes(phase))){
  const spin=['╱','─','╲','│'][Math.floor(clock*4)%4];
  text=phase==='caching'?info.text:phase==='speaking'?'VOICE ▷ ON THE LINE / MORE TO COME':phase==='complete'?'VOICE ✓ YOUR MOVE, '+packet.recipient.toUpperCase():phase==='retry'?'VOICE ! PAUSED / READ RETRIES THE SELECTED VOICE':spin+' '+(info?.text?.replace(/^Kokoro \/ /,'').replace(/ \/ keeping your selected voice…/,'')||'GHOST IS FINDING HIS VOICE / STILL HERE');
 }
 const label=text.slice(0,native.grid.columns-6);if(label===voiceBadge)return;voiceBadge=label;native.patch('\x1b[3;3H\x1b['+(phase==='complete'?'92':phase==='retry'?'93':'96')+'m'+(label||'═'.repeat(native.grid.columns-6)).padEnd(native.grid.columns-6));
}

function nativeTick(clock){
 if(state.letterTransmitPending&&clock-letterSentAt>=.92){state.letterTransmitPending=false;render(true);}
 illustrator?.update(native?.program.illustration,native?.terminal.complete,clock,held||reduce);if(pendingRead&&native?.terminal.complete){const read=pendingRead;pendingRead=null;read();}if(pendingNote&&native?.terminal.complete){native.patch('\x1b['+(native.grid.rows-2)+';3H\x1b[90m'+pendingNote.slice(0,native.grid.columns-6).padEnd(native.grid.columns-6));pendingNote=null;}const dt=Math.min(.1,Math.max(0,clock-lastClock));lastClock=clock;if(rollAnimation&&!overlayKind){rollAnimation.elapsed+=dt;state.rollProgress=held?1:Math.min(1,rollAnimation.elapsed/6.4);const charge=Math.floor(state.rollProgress*6);if(!held&&charge!==rollAnimation.charge){rollAnimation.charge=charge;audio.battleCue({kind:causalApproaches[state.rollStat||'focus'].cue,side:0});}if(state.rollProgress>=1){const receipt=rollAnimation.receipt;if(!rollAnimation.workshopId)record({kind:'roll',result:receipt});else state.rollReturn=rollAnimation.returnScreen;if(chapterDriver&&speech.enabled&&!silent){speech.warm(voiceFrame());pendingRead=()=>readCurrent();}if(state.rollBoarding)skirmish?.resolve();audio.battleCue({kind:receipt.success?'victory':'defeat',side:0});rollAnimation=null;}render(true);}if(skirmish){const live=!held&&!overlayKind&&!!native.program.arena&&native.terminal.complete;if(arenaPaused===live){arenaPaused=!live;skirmish.pause(arenaPaused);}if(live)gameTime+=dt;skirmish.update(gameTime);placeArena();if(live&&clock-lastHUD>.5){lastHUD=clock;const s=skirmish.snapshot,a=native.program.arena;native.patch('\x1b['+(a.row-1)+';4H\x1b[96m'+('BLUE '+s.blue.hp+'HP/'+s.blue.score+'pt  RED '+s.red.hp+'HP/'+s.red.score+'pt').padEnd(40).slice(0,40));}}}
function workshopAction(id,roll=null){
 speech.stop();closeOverlay();pendingRead=null;
 const w=localWorkshop(visit.workshop);
 if(id.startsWith('door:')){const action=id.slice(5);w.door=mailrun(action==='reset'?[]:[...w.door.actions,{id:action,roll}]);state.screen='door-game';}
 else {const name=clean(state.crewDraft??w.crew.name).slice(0,32);w.crew=crewTrial({name,role:id.startsWith('crew-role:')?id.slice(10):w.crew.role,action:id.startsWith('crew-order:')?id.slice(11):null,roll});state.screen='crew-builder';state.crewDraft=w.crew.name;}
 record({kind:'workshop',value:w});audio.uiCue('switch');state.actionPage=0;render(true);
 if(!roll&&w.door.done&&state.screen==='door-game')audio.battleCue({kind:w.door.won?'victory':'defeat',side:0});
 if(!roll&&w.crew.done&&state.screen==='crew-builder')audio.battleCue({kind:w.crew.passed?'victory':'defeat',side:0});
}
async function nativeAction(id,cell=null){
 if(pageRequest){
  if(id==='voice'){voice();return;}
  if(id==='voice:retry'){const {title,frame,apply,initial}=pageRequest;if(pageRequest.source===openingVoice)openingVoice=null;await requestVoicedPage({title,frame,apply,initial});return;}
  if(id==='back'&&!pageRequest.initial){clearPageRequest();render(true);return;}
  if(!['motion','sfx','music','palette','speed','next-track'].includes(id))return;
 }
 if(chapterDriver&&await chapterAction(id))return;const before={screen:state.screen,current,layer:state.layer,page:state.page,illustrationIndex:state.illustrationIndex,secretId:state.secretId,actionPage:state.actionPage,rollTrial:state.rollTrial,rollReturn:state.rollReturn,rollResult:state.rollResult,rollContext:state.rollContext,rollProgress:state.rollProgress,rollStat:state.rollStat,rollBoarding:state.rollBoarding};try{if(id==='next-track'){audio.nextTrack();note('GHOSTTRACKS / '+audio.info.track);return;}if(id.startsWith('secret:')){await discover(id.slice(7),id==='secret:night-office'?'city':'trip');return;}if(rollAnimation&&(id==='back'||id.startsWith('nav:')||['verb:ending','verb:packet','verb:answers','verb:rose'].includes(id))){if(!rollAnimation.workshopId)record({kind:'roll',result:rollAnimation.receipt});before.rollProgress=1;state.rollProgress=1;rollAnimation=null;clearArena();state.skirmishOn=false;state.rollBoarding=false;}if((id.startsWith('door:')&&id!=='door:reset')||id.startsWith('crew-order:')){rollStart(id);return;}if(id==='door:reset'||id.startsWith('crew-role:')||id==='crew:reset'){workshopAction(id);return;}if(id.startsWith('rig:')){state.rigEffect=id.slice(4);render(true);return;}if(id.startsWith('stat:')){if(rollAnimation)return;state.rollStat=id.slice(5);state.rollPreview=true;state.rollResult=null;render(true);return;}if(!['speed','palette','voice','music','sfx','motion','verb:skirmish'].includes(id))pendingRead=null;if(id.startsWith('illustration:')){state.illustrationIndex=Number(id.slice(13));render(true);return;}if(id.startsWith('topic:')){await show(id.slice(6));return;}if(id.startsWith('choice:')){await choose(id.slice(7));return;}if(id.startsWith('layer:')){speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.screen='layer';state.layer=id.slice(6);render();return;}if(id.startsWith('relay:')){await letterAction(id.slice(6),cell);return;}switch(id){
 case 'verb:door-game':case 'verb:crew-builder':speech.stop();closeOverlay();clearArtifact();state.screen=id==='verb:door-game'?'door-game':'crew-builder';state.actionPage=0;render();break;
 case 'nav:map':await show(packet.openingId,{remember:false});break;
 case 'nav:topics':speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.screen='topics';render();break;
 case 'back':if(state.rollBoarding){clearArena();state.skirmishOn=false;state.rollBoarding=false;}if(rollAnimation){if(!rollAnimation.workshopId)record({kind:'roll',result:rollAnimation.receipt});rollAnimation=null;state.rollReturn=null;state.rollTrial=false;}if(screenHistory.length){speech.stop();closeOverlay();clearArtifact();const prior=screenHistory.pop();current=prior.current;Object.assign(state,prior);if(packet.layout==='letter'&&before.current!==current)record({kind:'view',node:current});if(state.screen==='roll'&&state.rollResult)state.rollProgress=1;if(state.rollBoarding&&state.rollResult){openArena(state.rollResult);skirmish?.resolve();}ui.show(current);ui.ready();render();}else if(history.length)await show(history.pop(),{remember:false});else await nativeAction('nav:map');break;
 case 'verb:read':if(state.screen==='illustrations'||state.screen==='bb-images'){const item=(state.screen==='bb-images'?bitcoinIllustrations:replyIllustrations)[state.illustrationIndex];readDetail(replyIllustrationVoice(item));}else if(state.screen==='layer')readDetail(nativeMemoryLayers[state.layer]||nativeMemoryLayers.now);else readCurrent();break;
 case 'read-layer':case 'layer-read':readDetail(nativeMemoryLayers[state.layer]||nativeMemoryLayers.now);break;
 case 'verb:rose':case 'verb:inspect':openRose();break;
 case 'letter:gift':
  if(packet.gift==='postmark-bloom'&&current===packet.relay.reward&&state.letterRelay?.sent){
   audio.uiCue('carrier');openArtifact(postmarkSpecimen(state.letterRelay));
  }
  break;
 case 'reply:reset':
  if(chapterDriver||state.screen==='reply-reset')return;
  speech.stop();closeOverlay();clearArtifact();clearArena();state.skirmishOn=false;
  state.screen='reply-reset';state.actionPage=0;render();break;
 case 'reply:reset-confirm':
  if(chapterDriver||state.screen!=='reply-reset')return;
  if(storage&&!params.has('qaMemory')){
   try{
    storage.removeItem(relayKey);
    storage.removeItem(key);
   }catch{
    note('RESET COULD NOT CLEAR LOCAL STORAGE');
    return;
   }
  }
  location.reload();return;
 case 'overlay-back':speech.stop();closeOverlay();clearArtifact();native?.focus();break;
 case 'verb:illustrations':speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.screen='illustrations';render();break;
 case 'illustration-next':state.illustrationIndex=(state.illustrationIndex+1)%5;render(true);break;
 case 'illustration-prev':state.illustrationIndex=(state.illustrationIndex+4)%5;render(true);break;
 case 'verb:answers':speech.stop();closeOverlay();clearArtifact();state.actionPage=0;draft={...(visit.answers||{})};state.screen='answers';render();break;
 case 'save-input':for(const field of ['question','principle'])record({kind:'answer',id:field,text:draft[field]||''});state.screen='map';render(true);readDetail(replyAnswerSaved);break;
 case 'verb:roll':speech.stop();closeOverlay();state.actionPage=0;state.screen='roll';state.rollProgress=1;state.rollResult=null;state.rollTrial=false;state.rollReturn=null;state.rollContext='';render();break;
 case 'roll-start':rollStart();break;
 case 'trial-continue':if(state.rollReturn){clearArena();state.skirmishOn=false;state.rollBoarding=false;state.screen=state.rollReturn;state.rollReturn=null;state.rollTrial=false;state.actionPage=0;render();if(!voiceGateEnabled&&speech.enabled&&!silent){speech.warm(voiceFrame());primeLikelyReplies();pendingRead=()=>readCurrent();}}break;
 case 'replay':state.screen='roll';state.rollProgress=1;render(true);break;

 case 'game-start':if(!skirmish)openArena();skirmish?.start();gameRunning=true;break;
 case 'game-pause':gameRunning=!gameRunning;skirmish?.pause(!gameRunning);break;
 case 'game-reset':skirmish?.reset();gameTime=0;gameRunning=false;render(true);break;
 case 'palette':state.paletteIndex=((state.paletteIndex||0)+1)%ansiColourThemes.length;native.setPalette(ansiColourThemes[state.paletteIndex].id);render(true);note('DISPLAY INKS / '+ansiColourThemes[state.paletteIndex].label+' / [L] CYCLES ALL SCREENS');break;
 case 'trip-toggle-music':music();break;
 case 'verb:trip':speech.stop();closeOverlay();clearArtifact();state.screen='trip';state.actionPage=0;if(!audio.musicOn&&!silent)audio.toggleMusic();render();break;
 case 'nav:motion-lab':speech.stop();closeOverlay();clearArtifact();state.screen='motion-lab';state.actionPage=0;render();break;case 'speed':bps=speeds[(speeds.indexOf(bps)+1)%speeds.length];native.terminal.setBps(bps);{const h=native.program.hotspots.find(h=>h.id==='speed');if(h){native.show({...native.program,hotspots:native.program.hotspots.map(a=>a.id==='speed'?{...a,ariaLabel:'[B]'+bps}:a)});native.patch('\x1b['+h.row+';'+h.column+'H\x1b[93m'+('[B]'+bps).padEnd(h.width));}}note('LINE SPEED '+bps+' BPS');break;case 'sfx':sfxOn=!sfxOn;audio.sfx(sfxOn);render(true);break;case 'actions-prev':state.actionPage=Math.max(0,state.actionPage-1);render(true);break;case 'actions-next':state.actionPage++;render(true);break;case 'nav:tools':speech.stop();closeOverlay();clearArtifact();state.screen='tools';state.actionPage=0;render();break;case 'verb:bb-images':speech.stop();closeOverlay();state.screen='bb-images';state.illustrationIndex=0;state.actionPage=0;render();break;case 'voice':voice();break;case 'music':music();break;case 'motion':motion();break;
 case 'pixels':retina=!retina;portrait?.destroy();portrait=null;if(overlayKind==='ghost')ensurePortrait();render(true);break;
 case 'verb:ending':speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.receipt=returnPacket(mindProgress(visit).ready);state.screen='ending';state.page=0;render();break;
 case 'verb:packet':speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.receipt=returnPacket(mindProgress(visit).ready);state.screen='packet';state.page=0;render();break;
 case 'copy':state.receipt=returnPacket(mindProgress(visit).ready);try{await navigator.clipboard.writeText(state.receipt);note('COPIED. Paste into the model chat holding the runbook. NOTHING UPLOADED.');}catch{state.screen='packet';render(true);note('Clipboard unavailable. View the packet pages or export it from your browser.');}break;
 case 'letter:signal':
  if(!state.letterRelay?.sent||!packet.relay?.contact)break;
  speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.screen='letter-signal';render();break;
 case 'letter:reward':
  if(state.letterRelay?.sent)await show(packet.relay.reward);break;
 case 'letter:show-signal':
  if(!state.letterRelay?.sent||!packet.relay?.contact)break;
  state.actionPage=0;state.screen='letter-signal-text';render(true);break;
 case 'letter:copy-signal':{
  const greeting=firstContactText(state.letterRelay,packet.relay?.contact,packet.gift,openedLetterComms(packet,visit.visited));
  if(!greeting)break;
  try{await navigator.clipboard.writeText(greeting);saveStatus='COPIED / PASTE INTO YOUR GALAXY’S AGENT';}
  catch{state.actionPage=0;state.screen='letter-signal-text';saveStatus='CLIPBOARD UNAVAILABLE / SELECT THE PACKET';}
  render(true);break;
 }
 case 'letter:plate-mark':
  if(state.screen==='letter-signal'&&!state.letterRelay.eggs.includes('plate-mark')){
   state.letterRelay=playLetterRelay(state.letterRelay,'plate-mark');keepRelay();audio.uiCue('secret');render(true);
  }
  break;
 case 'letter:photo':speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.screen='letter-photo';render(true);break;
 case 'verb:words':speech.stop();closeOverlay();clearArtifact();state.actionPage=0;state.screen='words';state.page=0;render();break;
 case 'next-page':state.page++;render();break;case 'prev-page':state.page=Math.max(0,state.page-1);render();break;
 default:note('That command is not available in this terminal program.');
}}finally{const crewDiscovery=state.screen==='crew-builder'&&!rollAnimation&&canDiscover('wintermute',visit,'crew');if(crewDiscovery){screenHistory.push({...before,screen:'crew-builder',rollProgress:1,rollTrial:false,rollReturn:null});await discover('wintermute','crew');}if(!crewDiscovery&&id!=='back'&&(before.screen!==state.screen||before.current!==current)){screenHistory.push(before);if(screenHistory.length>40)screenHistory.shift();}}}
let chapterAlienSource=null;
function stopChapterAlien(){if(chapterAlienSource){chapterAlienSource.onended=null;try{chapterAlienSource.stop();}catch{}chapterAlienSource.disconnect();chapterAlienSource=null;audio?.speaking(false);}}
function showChapterArtifact(){speech.stop();stopChapterAlien();closeOverlay();portrait?.hold(true);ui.canvas.hidden=true;clearArtifact();artifactCanvas=document.createElement('canvas');artifactCanvas.className='tot-canvas';artifactCanvas.style.pointerEvents='auto';artifactCanvas.setAttribute('aria-label','Current chapter artifact. Drag to orbit, wheel to zoom. Back or Escape returns to the exact decision.');ui.overlayRender.append(artifactCanvas);artifact=mountStage(artifactCanvas,note);artifact?.update(chapterDriver.state);artifact?.hold(held);overlayKind='artifact';ui.overlay(true,'CURRENT CHAPTER / PROCEDURAL ARTIFACT');dimTerminal(true);native.caption('The actual scene recipe. Drag to orbit. Wheel to zoom. BACK keeps your pending decision.',{speaker:'EVIDENCE',visible:true});}
async function hearChapterAlien(){const contact=chapterDriver.model().view.transmission;if(!contact)return;stopChapterAlien();speech.stop();closeOverlay();if(silent||!speech.enabled){note('Translation ready / voice is off.');return;}try{const graph=await audio.unlock(),voice=renderAlienUtterance(contact,graph.context.sampleRate),buffer=graph.context.createBuffer(1,voice.samples.length,voice.sampleRate);buffer.copyToChannel(voice.samples,0);const source=graph.context.createBufferSource();source.buffer=buffer;source.connect(graph.voice);chapterAlienSource=source;audio.speaking(true);source.onended=()=>{if(chapterAlienSource===source){source.disconnect();chapterAlienSource=null;audio.speaking(false);note('Alien signal complete / translation uncertainty retained.');}};source.start();note('XENO VOCALS / '+contact.speaker);}catch(error){stopChapterAlien();note('Alien signal unavailable / '+error.message);}}
async function chapterAction(id){
 if(id==='overlay-back'){stopChapterAlien();return false;}
 if(['verb:read','chapter:read'].includes(id)){readCurrent();return true;}
 if(state.screen==='roll'&&['trial-continue','back','chapter:back'].includes(id)){
  speech.stop();stopChapterAlien();pendingRead=null;closeOverlay();clearArtifact();
  rollAnimation=null;state.screen='chapter';state.rollReturn=null;state.rollTrial=false;state.actionPage=state.page=0;render();
  if(speech.enabled&&!silent){speech.warm(voiceFrame());primeLikelyReplies();pendingRead=()=>readCurrent();}
  return true;
 }
 if(id==='back'||id==='nav:map')id='chapter:back';
 if(id==='next-page'||id==='prev-page'){state.page=Math.max(0,state.page+(id==='next-page'?1:-1));render(true);return true;}
 if(!id.startsWith('chapter:'))return false;
 if(rollAnimation){note('The exact result is saved. Let the battle resolve, or use Back to skip its display.');if(id!=='chapter:back')return true;rollAnimation=null;}
 try{
  speech.stop();stopChapterAlien();pendingRead=null;closeOverlay();clearArtifact();
  if(id==='chapter:artifact'){showChapterArtifact();return true;}
  if(id==='chapter:hear-alien'){await hearChapterAlien();return true;}
  if(id==='chapter:refresh'){note('Reading the public Wire / current save stays local.');await chapterDriver.refresh();render();return true;}
  if(id.startsWith('chapter:node:')){await chapterDriver.inspectPublic(Number(id.slice(13)));state.page=state.actionPage=0;render();return true;}
  const previousRun=chapterDriver.state.runId;let result;
  if(id==='chapter:replay-roll'){result={changed:true,roll:chapterDriver.model().receipt?.roll};if(!result.roll)throw Error('No saved check to replay');}
  else result=chapterDriver.action(id);
  if(result.copy){try{await navigator.clipboard.writeText(result.copy);note('COPIED / exact data. Nothing uploaded.');}catch{note('Clipboard unavailable / select the complete export field and copy.');}return true;}
  if(result.url){window.open(result.url,'_blank','noopener,noreferrer');return true;}
  if(chapterDriver.state.runId!==previousRun)audio.nextTrack();
  state.screen='chapter';state.page=0;state.actionPage=0;state.focus=result.focus||null;
  if(result.reward)native.reward(result.reward);
  render();
  if(result.roll){state.rollStat=result.roll.stat;state.rollResult=result.roll;state.rollContext='CHAPTER CHECK / '+chapterDriver.model().receipt.label;state.rollTrial=true;state.rollReturn='chapter';state.screen='roll';state.rollProgress=0;rollAnimation={receipt:result.roll,elapsed:0,charge:-1,workshopId:'chapter',returnScreen:'chapter'};render(true);}
  else if(speech.enabled&&!silent){speech.warm(voiceFrame());primeLikelyReplies();pendingRead=()=>readCurrent();}
 }catch(error){note('Not changed / '+error.message);}return true;
}
function bootAction(id){root.dataset.bootAction=id;if(connected)return;if(id==='dial'||id==='reconnect'){if(id==='reconnect'){if(world?.terminal.mode!=='held')return;boardRead=null;boardStatus='NOT CONNECTED';}dial();}else if(id==='finish')lock();else if(id==='continue'){if(world?.terminal.mode==='held')enter();else if(!connecting)dial();}else if(id==='music')music();else if(id==='voice')voice();else if(id==='pause')motion();}
function mountBoot(){
 const opening=node(packet.openingId);
 const cover=chapterDriver?null:{
  title:packet.title,
  art:packet.replyCover?.art||opening.ansiArt||({ghost:'engine',memory:'vault',network:'network',artifact:'rose'})[opening.visual],
  preview:packet.replyCover?.preview||opening.kicker
 };
bootCanvas=document.createElement('canvas');bootCanvas.className='tot-canvas';bootCanvas.tabIndex=0;bootCanvas.setAttribute('role','application');bootCanvas.setAttribute('aria-label','GhostLink terminal. D or Enter runs the highlighted command; click devices to focus; Escape returns wide.');ui.room.prepend(bootCanvas);world=mountBootWorld(bootCanvas,{reduced:reduce,adaptive:retina,pixelRatio:retina?Math.min(1,(devicePixelRatio||1)*.75):'native',terminal:{recipient:packet.recipient,label:chapterDriver?'MODEL-AUTHORED CHAPTER':packet.layout==='letter'?'PRIVATE LETTER':'TURN OUT OF TIME',bps,seed:artSeed,cover},energy:()=>audio.info.bands,level:()=>audio.info.rms});world?.set({terminalMode:'prompt',terminalControls:{voice:speech.enabled,music:audio.musicOn,boardStatus}});world?.show(true);SDUI.press(bootCanvas,e=>{const cell=world?.screenCell?.(e.clientX,e.clientY);if(bootCanvas.dataset.focus==='screen'&&Number(bootCanvas.dataset.cameraTravel)>=.999&&cell?.hotspot)bootAction(cell.hotspot);else world?.focus(world?.pick?.(e.clientX,e.clientY)||'wide');});bootCanvas.addEventListener('dblclick',event=>{event.preventDefault();finishHandshake();});bootCanvas.addEventListener('pointermove',e=>{const h=world?.screenCell?.(e.clientX,e.clientY)?.hotspot||null;world?.set({terminalFocus:h});bootCanvas.style.cursor=h?'pointer':'default';});bootCanvas.focus({preventScroll:true});}
function finishHandshake(){if(connected||!world||world.terminal.mode==='receiving'||world.terminal.mode==='held')return;if(!connecting){void dial();}bootAt=performance.now()-((world.terminal.commandDuration||2.3)+modemDuration)*1000;modemStarted=terminalStarted=true;audio.stopModem();audio.connection(true);world.set({phase:2,progress:1,terminalMode:'receiving',terminalElapsed:0,terminalControls:{boardStatus,music:audio.musicOn,voice:speech.enabled}});root.dataset.connectionSkipped='handshake-only';}
function lock(){void connectBoard();clearInterval(tick);tick=0;connecting=false;audio.stopModem();audio.connection(true);world?.set({phase:2,progress:1,terminalComplete:true,terminalMode:'held'});if(!chapterDriver&&bootCanvas?.dataset.focus==='wide')world?.focus('screen');controls();ui.connecting('CONNECT '+bps+' / YOUR LINE IS HELD','Continue when ready.',{held:true});}
async function dial(){if(connecting||connected)return;connecting=true;bootAt=performance.now();terminalStarted=modemStarted=false;void connectBoard();world?.set({terminalReset:true,terminalElapsed:0,phase:0,progress:0,terminalMode:'command'});controls();ui.connecting('GHOSTLINK / BOOTING','The command owns this terminal.');if(!silent){try{await audio.unlock();}catch{connecting=false;world?.set({terminalMode:'prompt'});ui.retry('Touch the command to unlock audio.');return;}if(!voiceGateEnabled){speech.warm(authoredVoiceFrame(current));primeLikelyReplies();}else startOpeningVoice();}clearInterval(tick);tick=setInterval(()=>{if(document.hidden||held){world?.set({paused:true});return;}const age=(performance.now()-bootAt)/1000,command=world?.terminal.commandDuration||2.3,dialAge=Math.max(0,age-command),ansiAge=Math.max(0,dialAge-modemDuration);if(age>=command&&!modemStarted){modemStarted=true;if(!silent)void audio.modem();}if(!terminalStarted)world?.set({terminalMode:'command',terminalElapsed:age,terminalControls:{music:audio.musicOn,voice:speech.enabled,boardStatus,connectionProgress:Math.min(1,dialAge/modemDuration),connSeconds:dialAge}});world?.set({phase:dialAge<modemDuration?1:2,progress:Math.min(1,dialAge/modemDuration),...(terminalStarted?{terminalElapsed:ansiAge}:{}),paused:held});if(dialAge>=modemDuration&&!terminalStarted){terminalStarted=true;world?.set({terminalMode:'receiving',terminalElapsed:0,terminalControls:{boardStatus,music:audio.musicOn,voice:speech.enabled}});}if(dialAge>=modemDuration+(world?.terminal.duration||10))lock();},50);}
function enter(){if(connected||flightRAF)return;clearInterval(tick);audio.stopModem();audio.connection(true);world?.set({paused:false});world?.focus('screen',{reply:true});world?.set({terminalReply:true});root.dataset.enterState='approaching';const began=performance.now();let previous=null,stable=0;const fit=async now=>{const rect=world?.screenRect?.();if(rect){const delta=previous?Math.max(...['x','y','width','height'].map(k=>Math.abs(previous[k]-rect[k]))):999;stable=delta<.4?stable+1:0;previous=rect;}if(now-began>400&&((stable>=3&&Number(bootCanvas.dataset.cameraTravel)>=.999)||(rect&&now-began>=2800)||world?.metrics.renderer!=='webgl-sdf')){const terminal=world.terminal,from=world.screenRect();world.freeze();connected=true;connecting=false;flightRAF=0;root.dataset.enterState='promoting';root.dataset.nativeConsole='true';ui.fullscreen();native=mountNativeResponseHost(ui.room,{terminal,overlayRoot:ui.faceLayer,reduced:held||reduce,onReward({bonus}){audio.uiCue(bonus?'secret':'score');},onGrid(){if(native&&root.dataset.enterState==='complete')render(true);},onAction:nativeAction,onInput(id,value){if(id==='chapter-input'){chapterDriver?.setInput(value);return;}if(id==='crew-name'){state.crewDraft=clean(value).slice(0,32);return;}if(['question','principle'].includes(id))draft[id]=value.slice(0,1200);},onFocus(id){state.focus=id;render(true);},onTick:nativeTick,sceneFrame:letterArtFrame,onSceneWheel:letterWheel,energy:()=>({bands:audio.info.bands,rms:audio.info.rms}),onPaint(clock){voiceIndicator(clock);meshPainter?.update(native?.program.sprite,native?.terminal.complete,clock,held||reduce||!!overlayKind,{bands:audio.info.bands,rms:audio.info.rms});},onError:error=>note('TERMINAL: '+error.message)});illustrator=mountAnsiIllustration(native.element,{host:native});meshPainter=mountAnsiMeshSprite(native.element,{host:native});await native.promote({from});world.destroy();world=null;bootCanvas.remove();bootCanvas=null;root.dataset.enterState='complete';native.element.focus({preventScroll:true});if(!audio.musicOn&&!musicTouched&&!silent)audio.toggleMusic();void show(current,{remember:false,initial:true});return;}flightRAF=requestAnimationFrame(fit);};flightRAF=requestAnimationFrame(fit);}
ui=mountResponseTheater(root,packet,{native:true,choose:c=>choose(c.id),read:readCurrent,inspect:openRose,export:()=>nativeAction('verb:packet'),stop:()=>nativeAction('overlay-back'),dial,skip:lock,continue:enter,camera:mode=>world?.focus(mode),music,voice,motion,sfx(){sfxOn=!sfxOn;audio.sfx(sfxOn);},back:()=>nativeAction('back')});
let previousTrack=-1;try{const raw=params.has('qaMemory')?null:storage?.getItem('friken.music.last-opening.v1');if(raw!==null)previousTrack=Number(raw);}catch{}const initialTrack=openingTrackIndex(artSeed,previousTrack);try{if(!params.has('qaMemory'))storage?.setItem('friken.music.last-opening.v1',String(initialTrack));}catch{}
audio=mountAudio(root,{silent,initialTrack,frame(bands,level,vocal,vocalLevel){portrait?.cymatics(bands);portrait?.voiceSpectrum(activeSpeaker==='companion'?[0,0,0,0]:vocal);if(activeSpeaker==='companion')portrait?.companionLevel(vocalLevel);artifact?.cymatics(bands);}});
speech=mountSpeech(root,{silent,audio,storage,note,recordings:chapterDriver?{}:replyVoice,onState(info){state.speechState=info;voiceBadge='';},beforeSpeaker(role,{signal}){openSpeaker(role);return portrait?.focusSpeaker(role,{signal,immediate:held||reduce});},speaker(role){activeSpeaker=role;portrait?.speaker(role);clearTimeout(speechEndTimer);if(role)openSpeaker(role);else if(overlayKind==='ghost')speechEndTimer=setTimeout(()=>{if(!activeSpeaker&&overlayKind==='ghost')closeOverlay();},1800);},pulse:()=>portrait?.pulse(),talking:value=>portrait?.talking(value),companionTalking:(value,evidence)=>portrait?.companionTalking(value,evidence),companionPulse:()=>portrait?.companionPulse(),pcm:value=>portrait?.audioLevel(activeSpeaker==='companion'?0:value),articulate:cue=>portrait?.articulate(cue),ended(receipt){void portrait?.focusSpeaker(null,{immediate:held||reduce});clearTimeout(speechEndTimer);if(overlayKind==='ghost')speechEndTimer=setTimeout(()=>{if(overlayKind==='ghost')closeOverlay();},receipt.state==='complete'?2200:3500);}});
root.addEventListener('cg-caption',event=>{
 const {field,text,index,state:phase}=event.detail||{};
 if(!connected||!['ghost','ghost-reply','companion','inspect-help'].includes(field)||typeof text!=='string')return;
 // Progress is an offset into one exact spoken source. The host compiles
 // fixed pages once; preparation, pauses and failures keep the last heard cue.
 // A completed page stays until actual playback enters its successor or Back.
 native?.captionProgress(text,{field,index,state:phase,speaker:field==='companion'?'ELSE':'GHOST',visible:true});
});
ui.standby();startOpeningVoice();mountBoot();
document.addEventListener('keydown',event=>{if(connected&&event.key==='Escape'&&overlayKind){event.preventDefault();event.stopPropagation();void nativeAction('overlay-back');return;}if(connected||event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;const id={d:'dial',f:'finish',Enter:'continue',m:'music',v:'voice',r:'reconnect',p:'pause',' ':'pause'}[event.key];if(event.key==='Escape'){world?.focus('wide');event.preventDefault();return;}if(id){event.preventDefault();bootAction(id);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(!pageRequest&&!openingVoice)speech.suspend();audio.weather(0);if(connecting){clearInterval(tick);tick=0;audio.modemPause();connecting=false;world?.set({terminalMode:'held',terminalComplete:true});}}else if(connected)speech.resume();});
window.addEventListener('resize',placeArena);window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});window.addEventListener('pagehide',()=>{openingVoice?.controller.abort();clearPageRequest();audio.weather(0);stopChapterAlien();clearInterval(tick);clearTimeout(speechEndTimer);clearTimeout(overlayExitTimer);illustrator?.destroy();meshPainter?.destroy();cancelAnimationFrame(flightRAF);speech.stop();world?.destroy();native?.destroy();portrait?.destroy();clearArtifact();clearArena();});
window.turnOutOfTime={get chapter(){return chapterDriver?.state||null;},get current(){return current;},get selectedTelling(){return visit.selectedTelling;},get events(){return structuredClone(visit.events);},get storageStatus(){return saveStatus;},data:packet};
