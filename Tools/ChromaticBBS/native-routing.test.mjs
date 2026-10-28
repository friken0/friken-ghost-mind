import {replyDiscoveries,canDiscover,discoveryIds} from './reply-discoveries.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {localWorkshop,mailrun,mailrunLegs,crewTrial,crewRoles,workshopCheck,workshopRoll} from './door-and-crew.mjs';
import {TURN_OUT_OF_TIME as packet} from './turn-out-of-time-data.mjs';
import {nativeReplyProgram,nativeMemoryLayers,nativeRoomIds,causalApproaches} from './native-response-program.mjs';
import {newReplyVisit,recordReplyVisit} from './response-theater.mjs';
import {mindProgress,causalDemo,causalAttributes} from './mind-adventure.mjs';
import {normalizeNativeProgram} from './native-response-host.mjs';
import {ansiColourThemes,createAnsiBuffer} from './ansi-terminal.mjs';
import {bitcoinIllustrations,replyIllustrations} from './illustration-data.mjs';

// Exercise the real browser controller branches without starting its renderer,
// downloads or boot. Only host effects are substituted; reducers and programs
// are the actual production modules. Source extraction is deliberately narrow.
const source=fs.readFileSync(new URL('./turn-out-of-time.mjs',import.meta.url),'utf8');
function declaration(name){const match=new RegExp('(?:^|\\n)(?:async )?function '+name+'\\(').exec(source);assert.ok(match,'Missing controller helper '+name);const start=match.index+(source[match.index]==='\n'?1:0),tail=source.slice(start),next=/\n(?:async )?function \w+\(/.exec(tail);return tail.slice(0,next?next.index:tail.length);}
function harness(){
 const context=vm.createContext({packet:structuredClone(packet),replyDiscoveries,canDiscover,discoveryIds,ansiColourThemes,causalApproaches,newReplyVisit,recordReplyVisit,mindProgress,causalDemo,causalAttributes,nativeReplyProgram,nativeMemoryLayers,normalizeNativeProgram,bitcoinIllustrations,replyIllustrations,localWorkshop,mailrun,mailrunLegs,crewTrial,crewRoles,workshopCheck,workshopRoll,structuredClone,console,document:{activeElement:null,body:{}}});
 const helpers=['totalScore','discover','record','programState','render','voice','authoredVoiceFrame','primeLikelyReplies','voiceFrame','readCurrent','readDetail','show','choose','returnPacket','rollStart','nativeTick','workshopAction','nativeAction'].map(declaration).join('\n');
 vm.runInContext(`
  let screenHistory=[],visit=newReplyVisit(packet),current=visit.current,history=[],state={screen:'map',layer:'now',page:0,focus:null,receipt:'',rollProgress:1,illustrationIndex:0},draft={},boardStatus='LOCAL TEST',boardReceipt={mode:'offline-local'},held=false,overlayKind=null,overlayExitTimer=0,illustrator=null,meshPainter=null,rollAnimation=null,gameRunning=false,skirmish=null,arenaOpen=false,connected=true,silent=true,saveStatus='',retina=true,portrait=null;
  let lastClock=0,lastHUD=0,pendingNote=null;let artSeed=42,bps=14400,pendingRead=null,firstProgram=true,sfxOn=true;const speeds=[300,1200,2400,9600,14400,21100,56000];function placeArena(){};
  const params={has:name=>name==='qaMemory'},calls={stops:0,close:0,arenaClears:0,artifactClears:0,rose:0,rng:0,controls:0},frames=[],copies=[],notes=[],programs=[],uiViews=[];
  const clean=text=>String(text??'').replace(/[\\x00-\\x1f\\x7f]/g,' '),node=id=>packet.nodes.find(n=>n.id===id);
  const spoken=${source.split('\n').find(line=>line.startsWith('const spoken=')).slice('const spoken='.length)}
  const ui={show(id){uiViews.push(id);},ready(){},note(text){notes.push(text);}},speech={enabled:false,stop(){calls.stops++;},primeFrames(){},warm(){},speak(frame){frames.push(frame);},toggle(){this.enabled=!this.enabled;return this.enabled;}},audio={musicOn:false,uiCue(){},battleCue(){},sfx(){},toggleMusic(){this.musicOn=!this.musicOn;}};
  const native={get program(){return programs.at(-1)||nativeReplyProgram(programState());},grid:{columns:80,rows:25},clock:0,terminal:{complete:true,setBps(){}},element:{focus(){}},reward(value){calls.rewards=(calls.rewards||[]).concat(value);},show(program){programs.push(normalizeNativeProgram(program));},patch(){},setPalette(){},setReducedMotion(){}};
  const crypto={getRandomValues(bits){calls.rng++;bits[0]=1799;return bits;}},navigator={clipboard:{async writeText(value){if(globalThis.failClipboard)throw Error('clipboard denied');copies.push(value);}}};
  function note(text){notes.push(text);}function controls(){calls.controls++;}function closeOverlay(){overlayKind=null;calls.close++;}function clearArena(){arenaOpen=false;skirmish=null;gameRunning=false;calls.arenaClears++;}function clearArtifact(){calls.artifactClears++;}
  function music(){audio.toggleMusic();render(true);}function motion(){held=!held;render(true);}function ensurePortrait(){}
  function openRose(){calls.rose++;overlayKind='artifact';}function openArena(){state.skirmishOn=!state.skirmishOn;arenaOpen=state.skirmishOn;skirmish={snapshot:{local:true},start(){this.started=true;},pause(value){this.paused=value;},reset(){this.started=false;}};render(true);}
  ${helpers}
  globalThis.api={action:nativeAction,tick:nativeTick,render,packetText:returnPacket,record,show,
   init({screen='map',id='hello',ready=false}={}){visit=newReplyVisit(packet);if(ready){for(const id of ['identity','memory','greater-mind','models','bob-family','source','demo'])visit=recordReplyVisit(visit,{kind:'view',node:id},packet);visit=recordReplyVisit(visit,{kind:'choice',from:'demo',id:'keep-original',to:'demo-keep'},packet);visit=recordReplyVisit(visit,{kind:'view',node:'demo-keep'},packet);}current=id;visit=recordReplyVisit(visit,{kind:'view',node:id},packet);state.screen=screen==='skirmish'?'map':screen;draft={...(visit.answers||{})};if(screen==='skirmish')openArena();},
   complete(value){native.terminal.complete=value;},drainRead(){if(pendingRead&&native.terminal.complete){const fn=pendingRead;pendingRead=null;fn();}},draft(value){draft={...value};},state(value){Object.assign(state,value);},overlay(value){overlayKind=value;},speakerEnabled(value){speech.enabled=value;},
   snapshot(){return structuredClone({visit,current,state,draft,calls,frames,copies,notes,arenaOpen,overlayKind,gameRunning,skirmish,uiViews,program:programs.at(-1)});},
   snapshotJSON(){return JSON.stringify({visit,current,state,draft,calls,frames,copies,notes,arenaOpen,overlayKind,gameRunning,uiViews,program:programs.at(-1)});}
  };
 `,context);
 const api=context.api;return {...api,snapshot:()=>JSON.parse(api.snapshotJSON()),clipboardFail:value=>{context.failClipboard=value;}};
}
const unpack=text=>JSON.parse(text.slice(text.indexOf('\n\n{')+2));

test('every currently visible native action ID reaches a real controller route',async()=>{
 for(const screen of ['map','layer','topic','illustrations','answers','roll','ending','packet','words','tools','trip','door-game','crew-builder']){
  const state={screen,packet,current:'demo',layer:'now',progress:{rooms:nativeRoomIds,ready:true,score:80,percent:100},selectedTelling:'demo-keep',receipt:'line\n'.repeat(80)},ids=[...new Set(nativeReplyProgram(state).hotspots.map(h=>h.id))];
  for(const id of ids){const h=harness();h.init({screen,id:'demo',ready:true});await h.action(id);assert.ok(!h.snapshot().notes.some(n=>n.includes('not available')),screen+' / '+id+' fell through the controller');}
 }
});
test('topic/choice routing uses the actual authored transition and keeps inspected alternatives separate from canon',async()=>{
 const h=harness();h.init();await h.action('topic:demo');let v=h.snapshot();assert.equal(v.current,'demo');assert.equal(v.state.screen,'topic');assert.ok(v.uiViews.includes('demo'));await h.action('choice:keep-original');assert.equal(h.snapshot().visit.selectedTelling,'demo-keep');await h.action('choice:compare-repair');v=h.snapshot();assert.equal(v.current,'demo-repair');assert.equal(v.visit.selectedTelling,'demo-keep');assert.equal(unpack(h.packetText()).selectedTelling,'demo-keep');
});
test('memory depth read and voice-on use the chosen layer, with separate Else speech',async()=>{
 const h=harness();h.init();h.overlay('ghost');await h.action('layer:archive');let s=h.snapshot();assert.equal(s.overlayKind,null);assert.equal(s.state.layer,'archive');assert.ok(s.calls.stops>0);await h.action('verb:read');s=h.snapshot();assert.equal(s.frames.at(-1).ghost,nativeMemoryLayers.archive.title+'. '+nativeMemoryLayers.archive.text);assert.equal(s.frames.at(-1).companion,nativeMemoryLayers.archive.companion);await h.action('voice');assert.equal(h.snapshot().frames.at(-1).ghost,s.frames.at(-1).ghost);
});
test('answer display/export uses saved exact words; saving can also clear a previously retained answer',async()=>{
 const h=harness();h.init({ready:true});const exact={question:'  Exact question?\nWith its original newline.  ',principle:'Do not flatten my wording.'};h.draft(exact);await h.action('save-input');assert.deepEqual(h.snapshot().visit.answers,exact);assert.deepEqual(unpack(h.packetText()).answers,exact);
 h.draft({question:'UNSAVED CHANGE',principle:''});await h.action('verb:ending');let s=h.snapshot();assert.equal(s.program.fields.length,0);assert.ok(!s.program.text.includes('UNSAVED CHANGE'));assert.deepEqual(unpack(s.state.receipt).answers,exact);assert.deepEqual(unpack(s.state.receipt).answerPrompts,packet.answerPrompts,'the next model must know which real questions those words answered');
 await h.action('verb:answers');h.draft({question:'',principle:''});await h.action('save-input');assert.deepEqual(unpack(h.packetText()).answers,{question:'',principle:''});
});
test('answers and complete words replace old overlays; words show the actual current topic',async()=>{
 const h=harness();h.init({screen:'skirmish'});h.overlay('ghost');await h.action('verb:answers');let s=h.snapshot();assert.equal(s.arenaOpen,true,'ambient fight preference survives but is hidden by input screens');assert.equal(s.overlayKind,null);assert.deepEqual(s.program.fields.map(f=>f.id),['question','principle']);
 await h.action('topic:identity');await h.action('verb:words');s=h.snapshot();assert.equal(s.current,'identity');assert.equal(s.state.screen,'words');assert.ok(s.program.text.includes('COMPLETE WORDS'));assert.ok(s.program.text.includes(packet.nodes.find(n=>n.id==='identity').title.slice(0,25)));assert.ok(s.program.pagination.pages>1);
 const visitBefore=s.visit,transcript=[];for(let page=0;page<s.program.pagination.pages;page++){const b=createAnsiBuffer();b.feed(h.snapshot().program.text);transcript.push(...b.text.split('\n').slice(4,20).map(line=>[...line].slice(2,46).join('').trimEnd()));if(page+1<s.program.pagination.pages)await h.action('next-page');}
 const body=transcript.join(' ').replace(/\s+/g,' '),authored=packet.nodes.find(n=>n.id==='identity');for(const paragraph of [...authored.paragraphs,authored.companion])assert.ok(body.includes(paragraph.replace(/\s+/g,' ')),'full WORDS pages must retain the actual Ghost and Else body');assert.deepEqual(h.snapshot().visit,visitBefore,'paging a transcript must not spend another room or mutate canon');
 for(let i=0;i<20;i++)await h.action('next-page');s=h.snapshot();assert.equal(s.state.page,s.program.pagination.pages-1);
});
test('a caller can end and copy immediately without manufacturing visits, a selected story or answers',async()=>{
 const h=harness();h.init();await h.action('verb:ending');let s=h.snapshot(),receipt=unpack(s.state.receipt);assert.equal(s.state.screen,'ending');assert.equal(receipt.completion,'transmission-complete');assert.ok(s.program.hotspots.some(h=>h.id==='copy'));assert.deepEqual(receipt.progress.rooms,[]);assert.equal(receipt.selectedTelling,null);assert.deepEqual(receipt.answers,{});await h.action('copy');assert.deepEqual(unpack(h.snapshot().copies.at(-1)),receipt);
 const explored=harness();explored.init({ready:true});await explored.action('verb:ending');s=explored.snapshot();assert.equal(unpack(s.state.receipt).progress.ready,true);assert.equal(unpack(s.state.receipt).selectedTelling,'demo-keep');assert.ok(s.program.hotspots.some(h=>h.id==='copy'));
});
test('real illustration routes select each retained capture, wrap both ways and do not invent play history',async()=>{
 const h=harness();h.init();const before=h.snapshot().visit;h.overlay('ghost');await h.action('verb:illustrations');let s=h.snapshot();assert.equal(s.state.screen,'illustrations');assert.equal(s.overlayKind,null);assert.ok(s.calls.stops>0);
 for(let i=0;i<replyIllustrations.length;i++){await h.action('illustration:'+i);s=h.snapshot();assert.equal(s.state.illustrationIndex,i);assert.equal(s.program.illustration.id,'quarry-'+i);assert.match(s.program.illustration.sha256,/^[0-9a-f]{64}$/);await h.action('verb:read');const frame=h.snapshot().frames.at(-1);assert.equal(frame.ghost,replyIllustrations[i].title+'. '+replyIllustrations[i].note,'read must describe the capture actually on screen');assert.ok(frame.companion);}
 await h.action('illustration-next');assert.equal(h.snapshot().state.illustrationIndex,0);await h.action('illustration-prev');assert.equal(h.snapshot().state.illustrationIndex,4);assert.deepEqual(h.snapshot().visit,before,'inspecting real art is not a campaign event or an implicit branch choice');
});
test('copy rebuilds from the latest saved answers and roll rather than exporting a stale packet',async()=>{
 const h=harness();h.init({ready:true});await h.action('verb:ending');h.record({kind:'answer',id:'question',text:'A later exact question.'});h.record({kind:'roll',result:causalDemo(10.1)});await h.action('copy');const receipt=unpack(h.snapshot().copies.at(-1));assert.equal(receipt.answers.question,'A later exact question.');assert.equal(receipt.demonstrationRoll.die,10.1);assert.equal(receipt.progress.score,mindProgress(h.snapshot().visit).score);
 h.clipboardFail(true);await h.action('copy');const s=h.snapshot();assert.equal(s.state.screen,'packet');assert.ok(s.program.pagination.pages>=1);
});
test('reading pauses the existing skirmish, and roll start creates exactly one real receipt while busy',async()=>{
 const h=harness();h.init({screen:'skirmish'});const clearCount=h.snapshot().calls.arenaClears;await h.action('verb:read');let s=h.snapshot();assert.equal(s.arenaOpen,true);assert.equal(s.calls.arenaClears,clearCount);await h.action('verb:roll');await h.action('roll-start');await h.action('roll-start');s=h.snapshot();assert.equal(s.calls.rng,1);assert.equal(s.state.screen,'roll');assert.equal(s.state.rollProgress,0);assert.ok(s.program.text.includes('SIX LOCKS'));
});

test('actor overlays wait for actual ANSI completion even when reading was requested earlier',async()=>{const h=harness();h.init();h.complete(false);await h.action('verb:read');assert.equal(h.snapshot().frames.length,0);h.complete(true);h.drainRead();assert.equal(h.snapshot().frames.length,1);assert.ok(h.snapshot().frames[0].ghost.startsWith(packet.nodes[0].title));});

test('double-click fast finish skips the handshake but starts receiving, never jumps into held/fullscreen',()=>{const commands=[],context=vm.createContext({performance:{now:()=>20000},connected:false,connecting:true,world:{terminal:{mode:'command',commandDuration:2},set(s){commands.push(s);this.terminal.mode=s.terminalMode;}},modemDuration:8,bootAt:0,modemStarted:false,terminalStarted:false,boardStatus:'local test',audio:{musicOn:false,stopModem(){},connection(){}},speech:{enabled:true},root:{dataset:{}},dial(){throw Error('Already dialing');}});vm.runInContext(declaration('finishHandshake')+'\nfinishHandshake();',context);assert.equal(commands.length,1);assert.equal(commands[0].terminalMode,'receiving');assert.equal(commands[0].terminalElapsed,0);assert.equal(context.bootAt,10000);assert.equal(context.root.dataset.connectionSkipped,'handshake-only');vm.runInContext('finishHandshake();',context);assert.equal(commands.length,1,'repeated double-click cannot restart a receiving logo');});

test('the real Door and crew controller saves exact outcomes and exports both, without a model call',async()=>{const h=harness();h.init();await h.action('verb:door-game');for(const id of ['piggyback','spoof','boost']){await h.action('door:'+id);for(let n=0;n<66;n++)h.tick((['piggyback','spoof','boost'].indexOf(id)*66+n+1)/10);await h.action('trial-continue');}assert.equal(h.snapshot().visit.workshop.door.won,true);await h.action('verb:crew-builder');h.state({crewDraft:'SURREAL'});await h.action('crew-role:quartermaster');await h.action('crew-order:filters');for(let n=0;n<66;n++)h.tick(20+n/10);await h.action('trial-continue');const receipt=unpack(h.packetText(true));assert.equal(receipt.workshop.crew.name,'SURREAL');assert.equal(receipt.workshop.crew.passed,true);assert.equal(receipt.workshop.door.score,73);assert.match(receipt.workshop.crew.artifact,/six air filters/);});

test('Back restores both visible screen and Read source, including image and topic navigation',async()=>{const h=harness();h.init();await h.action('topic:memory');await h.action('topic:identity');await h.action('back');assert.equal(h.snapshot().current,'memory');await h.action('verb:read');assert.ok(h.snapshot().frames.at(-1).ghost.startsWith(packet.nodes.find(n=>n.id==='memory').title));await h.action('verb:bb-images');await h.action('illustration:1');await h.action('back');assert.equal(h.snapshot().state.screen,'topic');assert.equal(h.snapshot().current,'memory');await h.action('verb:read');assert.ok(h.snapshot().frames.at(-1).ghost.startsWith(packet.nodes.find(n=>n.id==='memory').title));});

test('both artwork secrets retain unique rewards and the hidden sysop returns to the crew bay',async()=>{
 const h=harness();h.init();await h.action('topic:bbs');await h.action('secret:night-office');assert.equal(h.snapshot().state.screen,'discovery');assert.deepEqual(h.snapshot().visit.discoveries,['night-office']);const rewardCount=h.snapshot().calls.rewards.length;
 await h.action('back');await h.action('secret:night-office');assert.equal(h.snapshot().calls.rewards.length,rewardCount,'inspecting an already found office does not pay twice');
 await h.action('verb:trip');await h.action('secret:petunia-protocol');assert.ok(h.snapshot().visit.discoveries.includes('petunia-protocol'));
 await h.action('topic:memory');await h.action('topic:demo-repair');await h.action('verb:crew-builder');h.state({crewDraft:'Wintermute'});await h.action('crew-order:sandbox');for(let i=1;i<=66;i++)h.tick(i*.1);await h.action('trial-continue');assert.equal(h.snapshot().state.screen,'discovery');assert.ok(h.snapshot().visit.discoveries.includes('wintermute'));
 assert.equal(unpack(h.packetText()).discoveries.length,3);await h.action('back');assert.equal(h.snapshot().state.screen,'crew-builder');assert.equal(h.snapshot().visit.workshop.crew.name,'Wintermute');
});
