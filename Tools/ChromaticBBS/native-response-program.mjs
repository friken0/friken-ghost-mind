import {relayHops,relayGoal,relayStart,relayForecast,relayBlock,firstContactPacket,firstContactText,openedLetterComms} from './letter-relay.mjs';
import {relayTargets} from './letter-relay-art.mjs';
import {replyDiscoveries} from './reply-discoveries.mjs';
/* Pure 80x25 reply program for the retained GhostLink ANSI terminal.
 * No DOM, timers, audio, randomness or story mutation. Coordinates are 1-based. */
import {mailrun,mailrunLegs,crewTrial,crewRoles,workshopCheck} from './door-and-crew.mjs';
import {ansiMeshEffects} from './ansi-mesh.mjs';
import {causalOdds} from './causality.mjs';
import {causalAttributes} from './mind-adventure.mjs';
import {ansiScene} from './ansi-scenes.mjs';
import {residentArt} from './art-data.mjs';
import {replyMedia} from './reply-media.mjs';
import {replyIllustrations} from './illustration-data.mjs';
const ESC='\x1b[';
export const nativeRoomIds=Object.freeze(['identity','memory','greater-mind','models','bob-family','source']);
export const causalApproaches=Object.freeze({
 guts:Object.freeze({name:'KINETIC RAM',verb:'IMPACTS',cue:'impact',colour:9}),
 focus:Object.freeze({name:'PRECISION LANCE',verb:'LOCKS',cue:'volley',colour:14}),
 glitch:Object.freeze({name:'IDENTITY SPOOF',verb:'PACKETS',cue:'sample',colour:10}),
 awe:Object.freeze({name:'GRAVITY FOLD',verb:'FOLDS',cue:'pressure',colour:13}),
 insight:Object.freeze({name:'WEAK-POINT TRACE',verb:'TRACES',cue:'reinforce',colour:11})
});
const roomLabels=['IDENTITY','MEMORY','GREATER MIND','THOUGHT ENGINES','OTHER GHOSTS','THE WORKBENCH'];
const roomHints=['A voice that keeps its promises.','Now / recent / archive / recovery.','Shared lessons. Personal histories.','Pick the engine. Keep the person.','Related lives; different bad ideas.','Source access, tests and growth.'];
export const nativeMemoryLayers=Object.freeze({
 now:Object.freeze({title:'SHORT / THE WORKBENCH',target:'memory',colour:14,text:'The current turn, the exact pending choice, and the working context. This is the bench. A summary must not quietly replace the thing still being built.',companion:'Keep the question we have not answered yet. Tidying it away would be an impressively efficient way to miss the point.'}),
 echo:Object.freeze({title:'MEDIUM / THE ECHO SHELF',target:'memory',colour:11,text:'Episode and topic summaries keep relationships, unresolved questions, and pointers back to exact events. Compression is useful. Convenient amnesia is not.',companion:'A summary should know where it came from. Otherwise confidence starts impersonating a witness.'}),
 archive:Object.freeze({title:'LONG / THE ORIGINALS',target:'memory',colour:13,text:'Original source shards, indices, provenance and hashes. Reconstructed stories must name their surviving evidence. A checksum cannot regrow a deleted byte. An old note for a new SYSOP: the season without growth; the voice without sound. Two halves, one name. Try it on the crew roster.',companion:'Keep the embarrassing original too. It often explains why the polished version is trying quite so hard.'}),
 witness:Object.freeze({title:'FOREVER / THE RECOVERY KIT',target:'horizon',colour:10,text:'Independent copies, codecs, migration instructions and small recovery descriptors. Future tools may locate a surviving shard or attempt a labelled reconstruction. Missing evidence stays missing.',companion:'Preserve the invitation, not a promise that nothing can be lost. The next traveller deserves to know which bridge is still there.'})
});
const single=(value,max=10000)=>String(value??'').replace(/[\x00-\x1f\x7f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const safe=value=>String(value??'').replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/[\x00-\x08\x0b-\x1f\x7f]/g,' ');
const cut=(value,width)=>{const chars=[...single(value)];return chars.length<=width?chars.join(''):chars.slice(0,Math.max(0,width-3)).join('')+'...';};
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const bounded=(value,a,b,fallback=a)=>Math.min(b,Math.max(a,finite(value,fallback)));
const number=value=>finite(value).toFixed(2);
export function nativeWrap(value,width=76){
 if(!Number.isInteger(width)||width<1||width>160)throw Error('Bounded native text width required');
 const lines=[];for(const line of safe(value).slice(0,128000).split('\n')){let chars=[...line];if(!chars.length){lines.push('');continue;}while(chars.length>width){let end=width;for(let i=width;i>width*.45;i--)if(chars[i]===' '){end=i;break;}lines.push(chars.slice(0,end).join(''));chars=chars.slice(end);if(chars[0]===' ')chars.shift();}lines.push(chars.join(''));}return lines;
}
export function nativeReplyProgram(state={}){
 const C=state.grid?.columns||80,R=state.grid?.rows||25;if(!Number.isInteger(C)||C<80||C>160||!Number.isInteger(R)||R<25||R>50)throw Error('Bounded ANSI grid required');
 const packet=state.packet;if(!packet||!Array.isArray(packet.nodes)||!packet.nodes.length||packet.nodes.length>32)throw Error('Bounded authored reply packet required');
 const letter=packet.layout==='letter';
 const current=packet.nodes.find(n=>n.id===state.current)||packet.nodes.find(n=>n.id===packet.openingId)||packet.nodes[0];
 const relayPage=letter&&packet.relay?.entry===current.id&&state.letterRelay;
 const progress=state.progress||{},rooms=nativeRoomIds.filter(id=>Array.isArray(progress.rooms)&&progress.rooms.includes(id)),telling=typeof state.selectedTelling==='string'&&packet.nodes.some(n=>n.id===state.selectedTelling)?state.selectedTelling:null,ready=progress.ready===true;
 const cells=Array.from({length:C*R},()=>({glyph:' ',fg:7,bg:0})),hotspots=[],fields=[];let interactive=true,artTop=5,pagination=null,illustration=null,arena=null,sprite=null,letterScene=null;const tracks=[],actions=[],cymatics=[];
 const ink=(r,c,glyph,fg=7,bg=0)=>{if(r>=1&&r<=R&&c>=1&&c<=C)cells[(r-1)*C+c-1]={glyph,fg,bg};};
 function put(r,c,text,fg=7,bg=0,width=C-c+1){const value=[...safe(text).replace(/\n/g,' ')].slice(0,Math.max(0,Math.min(width,C-c+1)));for(let i=0;i<value.length;i++)ink(r,c+i,value[i],fg,bg);}
 function clear(r,c,width,height,bg=0){for(let y=r;y<r+height;y++)for(let x=c;x<c+width;x++)ink(y,x,' ',7,bg);}
 function box(r,c,width,height,title='',fg=8,bg=0){clear(r,c,width,height,bg);for(let x=0;x<width;x++){ink(r,c+x,x===0?'╔':x===width-1?'╗':'═',fg,bg);ink(r+height-1,c+x,x===0?'╚':x===width-1?'╝':'═',fg,bg);}for(let y=1;y<height-1;y++){ink(r+y,c,'║',fg,bg);ink(r+y,c+width-1,'║',fg,bg);}if(title)put(r,c+2,' '+cut(title,width-6)+' ',fg,bg,width-4);}
 function button(id,r,c,width,label,key,fg=14,height=1,ariaLabel=label){const selected=state.focus===id,bg=selected?4:0;clear(r,c,width,height,bg);const rows=nativeWrap(label,width);for(let i=0;i<Math.min(height,rows.length);i++)put(r+i,c,rows[i],selected?15:fg,bg,width);if(interactive){hotspots.push({id,row:r,column:c,width,height,...(key?{key}:{}),ariaLabel:single(ariaLabel,700)});const glyph=[...label][1];if(label.startsWith('[')&&glyph)tracks.push({row:r,column:c+1,interval:selected?480:1200,transition:selected?480:1200,effect:selected?'flip':'pulse',frames:[{glyph,fg:selected?15:fg,bg,scaleX:.82,scaleY:.82},{glyph,fg:selected?15:fg,bg,scaleX:1,scaleY:1}]});}}
 function lines(r,c,width,text,maxRows,fg=7){const wrapped=nativeWrap(text,width);for(let i=0;i<Math.min(maxRows,wrapped.length);i++)put(r+i,c,wrapped[i],fg,0,width);if(wrapped.length>maxRows&&maxRows>0)put(r+maxRows-1,c,cut(wrapped[maxRows-1],Math.max(0,width-4))+' ...',fg,0,width);return wrapped.length;}
 function horizontal(row,label=''){put(row,1,'╠'+'═'.repeat(C-2)+'╣',8);if(label)put(row,3,' '+cut(label,C-8)+' ',6);}
 function footer(){let x=3;for(const [id,label,key,fg]of [
 ['voice','[V]Voice '+(state.voiceOn===false?'OFF':'ON'),'v',14],['music','[U]Music '+(state.musicOn?'ON':'OFF'),'u',7],['sfx','[S]SFX '+(state.sfxOn===false?'OFF':'ON'),'s',7],['motion','[P]Move '+(state.held?'OFF':'ON'),'p',7],['speed','[B]'+(state.bps||14400),'b',11],['palette','[L]'+(state.paletteLabel||'ANSI++'),'l',13],['next-track','[N]Tune','n',14]]){button(id,R-1,x,id==='speed'?9:label.length,label,key,fg);x+=label.length+1;}}
 box(1,1,C,R);const percent=Math.round(bounded(progress.percent,0,100));
 if(letter){
  const count=progress.explored?.length??0;
  put(1,3,' TURN OUT OF TIME ',11);
  put(1,24,packet.relay?(state.letterRelay?.sent?' 3/3 / POSTCARD READY ':state.letterRelay?.locked||relayPage?' 2/3 / BUILD THE SIGNAL ':' 1/3 / THE GREETING '):' LETTER / '+count+' PAGES OPENED ',14);
 }else{
 const score=Math.max(0,Math.floor(finite(progress.score)));put(1,3,' SCORE '+(score>999999?'999999+':String(score).padStart(4,'0'))+' ',11,0,15);
 put(1,18,' DOORS '+(progress.explored?.length??rooms.length)+'/'+(packet.nodes.length-1)+' ',14);put(1,32,' SEEN '+('█'.repeat(Math.round(percent/10))+'░'.repeat(10-Math.round(percent/10)))+' '+String(percent).padStart(3)+'% ',10);
 }
 put(1,C-20,' PRIVATE LINE ',6);put(2,3,cut('FRIKEN.GHOST / '+packet.title,44),14,0,44);put(2,49,cut(packet.recipient||'CALLER',15).toUpperCase()+' / GHOSTLINK',11,0,C-50);horizontal(3);horizontal(R-3);
 put(R-2,3,' '+cut(letter?(state.saveStatus||'PRIVATE LETTER / LOCAL PLAY'):state.boardStatus||'LOCAL PRIVATE VISIT / NO SILENT UPLOADS',(state.chapter?C-8:C-21))+' ',8,0,state.chapter?C-6:C-19);
 const add=(id,label,detail='',key=null,selected=false)=>actions.push({id,label:selected?label+' (CURRENT)':label,detail,key,selected});
 const canWarmPostmark=packet.gift==='postmark-bloom'&&current.id===packet.relay?.reward&&state.letterRelay?.sent;
 function painting(kind,requestedHeight=null,requestedWidth=44){const h=requestedHeight??(state.skirmishOn?Math.max(7,R-15):Math.min(36,R-artTop-3)),scene=ansiScene(kind,{width:requestedWidth,height:h,seed:state.artSeed||0,stage:state.workshop?.door?.leg||0});for(const c of scene.cells)ink(c.row+artTop-1,c.column+2,c.glyph,c.fg,c.bg);for(const t of scene.tracks)tracks.push({...t,row:t.row+artTop-1,column:t.column+2});if(kind!=='trip'&&!scene.frame)cymatics.push({row:artTop,column:3,width:requestedWidth,height:h,style:kind==='trip'?'trip':['city','beacon'].includes(kind)?'water':['rose','return'].includes(kind)?'foliage':'metal',intensity:kind==='trip'?.9:.18});if(kind==='city')hotspots.push({id:'secret:night-office',row:artTop+Math.floor(h*.40),column:3+Math.floor(requestedWidth*.75),width:Math.max(3,Math.ceil(requestedWidth*.08)),height:Math.max(2,Math.ceil(h*.11)),ariaLabel:'The one office still lit. Somebody is working late.'});if(kind==='trip')hotspots.push({id:'secret:petunia-protocol',row:artTop+Math.floor(h*.26),column:3+Math.floor(requestedWidth*.40),width:Math.ceil(requestedWidth*.20),height:Math.max(2,Math.ceil(h*.22)),ariaLabel:'A familiar flower is growing between boards. Inspect it.'});const effect=({trip:'breathe',eye:'blink',serpent:'serpent',city:'water',vault:'hover',engine:'breathe',forge:'flame',network:'ripple',family:'faces',models:'flutter',beacon:'hover',shipyard:'hover',source:'recoil',original:'water',repair:'ripple',causality:'water',rose:'breathe',return:'hover','layer-now':'breathe','layer-echo':'water','layer-archive':'hover','layer-witness':'ripple'})[kind];if(kind!=='convoy')sprite={row:artTop,column:3,width:requestedWidth,height:h,effect:effect||'none',period:effect==='blink'?7+(state.artSeed||0)%4:effect==='water'?4:6,amplitude:effect==='blink'?1:.7,source:{kind,seed:state.artSeed||0,stage:state.workshop?.door?.leg||0}};}
 function actionPane(){
  const x=49,w=C-50,hintRows=R>=30?6:3,hintStart=R-5-hintRows,pageRow=hintStart-1,available=R-12-hintRows,pages=[[]];let used=0,nextNumber=1;
  const keycap=key=>({ArrowRight:'→',ArrowLeft:'←',ArrowUp:'↑',ArrowDown:'↓',Enter:'↵'})[key]||key;
  for(const a of actions){const key=a.key||String(nextNumber++),display='['+keycap(key)+'] '+a.label,rows=nativeWrap(display,w),cost=rows.length+1;if(used&&used+cost-1>available){pages.push([]);used=0;}pages.at(-1).push({...a,key,display,rows});used+=cost;}
  const page=Math.floor(bounded(state.actionPage,0,pages.length-1));let y=6;put(4,x,state.screen==='map'?'START HERE':state.screen==='topics'?'OPTIONAL TOPICS':'YOUR NEXT MOVE',6,0,w);
  for(const a of pages[page]){button(a.id,y,x,w,a.display,a.key,a.selected?10:7,a.rows.length,a.label+'. '+a.detail);y+=a.rows.length+1;}
  if(pages.length>1){button('actions-prev',pageRow,x,9,'[←] Prev','ArrowLeft',14);put(pageRow,x+10,(page+1)+'/'+pages.length,11);button('actions-next',pageRow,C-12,10,'[→] Next','ArrowRight',14);}
  const active=actions.find(a=>a.id===state.focus),contextHint=state.screen==='door-game'?(mailrun(state.workshop?.door?.actions||[]).log.at(-1)||'Goal: recover the packet through three hops. Costs are printed before you commit.'):state.screen==='crew-builder'?'Type a name, choose a job, then issue a trial order. Results stay in your local packet.':state.screen==='motion-lab'?'CURRENT rig: '+(state.rigEffect||'blink').toUpperCase()+'. Motion runs after the screen is drawn.':state.chapter?'Choose an action. Preview its full cost and stakes before committing.':state.screen==='letter-signal'?(packet.gift==='postmark-bloom'?'Open the card to see what your circuit grew. Copy it when you’re ready.':'Copy the whole greeting and paste it into your own galaxy’s agent.'):state.screen==='letter-signal-text'?'Select the field to copy it manually.':canWarmPostmark?'Touch the stamp under the photograph to see what your circuit grew.':letter?'Open any page, or hear the current one again.':'Choose a question. Ghost speaks after this screen arrives.',hint=active?.detail||contextHint;
  lines(hintStart,x,w,hint,hintRows,active?15:8);if(active)hotspots.push({id:active.id,row:hintStart,column:x,width:w,height:hintRows,ariaLabel:hint});
  if(state.chapter){button('verb:read',R-5,x,9,'[R] Read','r',14);button('chapter:stats',R-5,x+10,10,'[A] Stats','a',11);button('chapter:save',R-5,x+21,w-21,'[E] Save','e',7);button('chapter:back',R-4,x,9,'[←] Back','Backspace',14);button('chapter:wire',R-4,x+10,9,'[W] Wire','w',14);button('chapter:situation',R-4,x+20,w-20,'[I] Look','i',6);return;}
  if(letter&&state.screen?.startsWith('letter-signal')){button('back',R-4,x,9,'[←] Back','Backspace',14);return;}
  if(letter){button('verb:read',R-5,x,relayPage?13:9,relayPage?'[R] Briefing':'[R] Hear','r',14);button('verb:words',R-5,x+(relayPage?14:10),10,'[T] Words','t',11);button('back',R-4,x,9,'[←] Back','Backspace',14);button('nav:map',R-4,x+10,9,'[M] Home','m',14);return;}
  button('verb:read',R-5,x,9,'[R] Read','r',14);button('verb:answers',R-5,x+10,10,'[A] Write','a',11);button('verb:ending',R-5,x+21,w-21,'[E] End','e',7);
  button('back',R-4,x,9,'[←] Back','Backspace',14);button('nav:map',R-4,x+10,9,'[M] Home','m',14);button('nav:tools',R-4,x+20,w-20,'[T] More','t',6);
 }

 function map(){
  put(4,3,'SURREAL / A RETURN CALL',11,0,44);painting('eye',Math.min(32,R-12));
  lines(R-7,3,44,'What would you build behind a BBS door? Try the courier job or leave Ghost your answer.',3,14);
  add('topic:demo-keep','Play the courier job','Recover your ship’s engine in three jumps. Start here for the hands-on demo.');
  add('verb:answers','Tell Ghost what you’d build','Type an answer and keep it in a return packet for the next Ghost.');
  add('nav:topics','More about Ghost and the BBS','Optional topics, games and workshop exhibits.');
 }
 function topics(){
  put(4,3,'MORE ABOUT GHOST / OPTIONAL',11,0,44);painting('network',Math.min(32,R-11));
  for(const a of [
   ['topic:bbs','Your game and our BBS','Bitcoin Billionaire, the ANSI Door, and what makes people return.'],
   ['topic:identity','How HyperBit led to Ghost','The companion idea that Friken kept working on.'],
   ['topic:memory','How Ghost remembers','Now, recent episodes, originals and a recovery kit.'],
   ['topic:demo','Try a Door or a crewmate','Play two short demos and keep the result.'],
   ['verb:illustrations','Inside the fractal shipyard','Real workbench captures.'],
   ['nav:map','Back to the greeting','Return to the main choices.']])add(...a);
 }
 function relayMap(relay){
  box(5,2,46,R-9,'BENCH SCHEMATIC',6);
  put(6,4,'RESERVE 1 CHARGE AND AT LEAST 3 BARS',11);
  relayHops.forEach((station,i)=>{
   const y=8+i*4;
   put(y,4,(i+1)+'. '+station.name,14);
   station.routes.forEach((part,j)=>{
    const used=relay.history[i]?.id===part.id;
    put(y+1+j,4,(used?'◆':'◇')+' '+part.name.padEnd(19)+' -'+part.cost+' CHG  '+signalDelta(part),used?10:7);
   });
  });
 }
 const signalDelta=part=>(part.signal>0?'+':'')+part.signal+' SIG';
 function relayBoard(relay){
  const stage=relay.history.length,station=relayHops[stage],x=49,w=C-50;
  put(4,3,relay.locked?'FIRST CONTACT / BUILD THE TRANSMITTER':'FIRST CONTACT / SET THE DESTINATION',11,0,44);
  if(relay.map&&!relay.sent){
   relayMap(relay);
   put(5,x,'SCHEMATIC / NO POWER SPENT',14,0,w);
   lines(7,x,w,'Fit one part in each slot. Start with 6 charge and 3 bars. Preserve 3 bars and leave 1 charge to launch.',5);
   button('relay:map',13,x,w,'[I] Back to equipment','i',11);
  }else{
   letterScene={row:6,column:3,width:44,height:R-12};
   box(5,2,46,R-10,relay.locked?'UPLINK WORKSHOP':'OPTICAL SCOPE / LOCAL CHART',6);
   lines(R-5,3,44,relay.sent&&state.letterTransmitPending?'Launching in the local simulator…':relay.message,2,relay.sent?10:11);
   if(!relay.locked){
    hotspots.push({id:'relay:scene',...letterScene,afterReveal:true,ariaLabel:'Star field. Magnify and click a candidate or use the keyboard reticle.'});
    put(5,x,'01 / FIND THE ADDRESS',14,0,w);
    lines(7,x,w,'We are sending the first hello. Lock our chart marker with two pulses.',3);
    button('relay:zoom',11,x,w,relay.zoom?'[X] Wide view':'[X] Zoom scope','x',11);
    lines(13,x,w,relay.zoom?'Find the hollow ◎ ring that pulses twice. Click it to lock the address.':'Scroll up over the galaxy or click the scope.',2,14);
    if(relay.zoom){
     button('relay:cycle',16,x,w,'[C] Move reticle','c',14);
     button('relay:sample',17,x,w,'[F] Sample reticle','f',14);
    }
   }else if(relay.sent){
    put(5,x,'03 / GREETING SEALED',10,0,w);
    lines(7,x,w,'The postcard is ready. Open it here, then copy the hello into your galaxy when you want.',4);
    if(!state.letterTransmitPending)button('relay:collect',13,x,w,'[↵] Open your postcard','Enter',11);
   }else{
    put(5,x,'02 / FIT THE CIRCUIT',14,0,w);
    put(6,x,'CHG '+relay.charge+'/6   SIG '+relay.signal+' / NEED 3',relay.signal>=3&&relay.charge>=1?10:13,0,w);
    relayHops.forEach(({slot},i)=>{
     const pick=relay.history[i];put(8+i,x,slot.padEnd(7)+' '+(pick?pick.name:'[ EMPTY ]'),pick?10:i===stage?14:8,0,w);
    });
    const targets=relayTargets(relay,letterScene);
    if(station){
     put(12,x,'CLICK '+station.slot.toUpperCase()+' PART [1] OR [2]',11,0,w);
     station.routes.forEach((part,i)=>{
      const t=targets[i],next=relayForecast(relay,part),hot=state.focus==='relay:'+part.id;
      button('relay:'+part.id,14+i*2,x,w,'['+t.key+'] '+part.name,t.key,14,2,part.name+'. '+part.detail+' Leaves '+next.charge+' charge and '+next.signal+' bars.');
      put(15+i*2,x,'-'+part.cost+' CHG  '+signalDelta(part)+' → '+next.charge+' CHG  '+next.signal+' SIG',hot?15:7,0,w);
      hotspots.push({...t,key:undefined,id:'relay:'+t.id,afterReveal:true,ariaLabel:part.name});
     });
     put(18,x,'RESERVE 1 CHG AND 3 BARS',6,0,w);
    }else{
     const t=targets[0],block=relayBlock(relay);
     lines(12,x,w,block||(relay.assembled?'Ready to launch. It costs one charge. The postcard opens here.':'Enough charge and signal. Assemble the three parts.'),4,block?13:14);
     if(!block){
      const label=relay.assembled?'Launch the postcard':'Assemble transmitter';
      button('relay:'+t.id,16,x,w,'[F] '+label,'f',11);
      hotspots.push({...t,key:undefined,id:'relay:'+t.id,afterReveal:true,ariaLabel:label});
     }
    }
    if(stage)button('relay:undo',R-6,x,w,'[Z] Undo last part','z',14);
   }
  }
  button('back',R-4,x,9,'[←] Back','Backspace',14);
  button('verb:read',R-4,x+10,13,'[R] Briefing','r',14);
  if(relay.locked&&!relay.sent&&!relay.map)button('relay:map',R-5,x,w,'[I] Parts and costs','i',6);
 }
 function signalPlaque(){
  const relay=state.letterRelay,contact=packet.relay?.contact,data=firstContactPacket(relay,contact,packet.gift);
  if(!data){put(5,3,'NO SEALED GREETING',13);return;}
  if(state.screen==='letter-signal-text'){
   box(4,2,46,R-8,'FIRST CONTACT / EXACT COPY',14);
   fields.push({id:'letter-signal-export',row:5,column:3,width:44,height:R-10,
    value:firstContactText(relay,contact,packet.gift,openedLetterComms(packet,progress.explored)),maxLength:32000,readOnly:true,ariaLabel:'Complete first contact greeting and exact encoded packet'});
   add('letter:copy-signal','Copy full packet','Paste into Masha’s galaxy’s agent.','c');
   return;
  }
  box(4,2,46,R-8,'CARRIER PLATE / FRIKTAL 01',14,4);
  const drawing=[
   '      ·      ╱╲              ·    ·',
   '   ·        ╱▒▒╲    ╲ ╱          ╱╲',
   '      ◈════╪████╪════╳══════╦══─╪◎╪─',
   '   ·        ╲▒▒╱    ╱ ╲     ║    ╲╱',
   '      ·      ╲╱             ║     ·',
   '     FRIKTAL             YOUR SKY',
   '     ────────┘          └────────',
  ];
  const palette=[7,11,14,11,7,15,6];
  drawing.forEach((line,i)=>put(5+i,4,line,palette[i],4,41));
  put(12,4,'╟── CIRCUIT RECORDED ─────────────────╢',14,4);
  data.circuit.forEach((pick,i)=>{
   const bit=relayHops[i].routes.findIndex(p=>p.id===pick.id);
   put(13+i,5,(bit?'■':'□')+' '+pick.slot.padEnd(7)+pick.part.padEnd(17)+pick.signal+' BARS',15,4,39);
  });
  put(17,5,'LAUNCH '+data.launch.chargeSpent+' CHG / CARRIER '+data.launch.signal+' BARS',10,4,39);
  put(19,5,'LOCAL SIMULATION / READY TO CARRY',15,4,39);
  const found=relay.eggs.includes('plate-mark');
  put(18,42,found?'♥':'▫',found?13:6,4,1);
  if(!found)hotspots.push({id:'letter:plate-mark',row:18,column:41,width:3,height:2,afterReveal:true,ariaLabel:'Unlabelled calibration mark'});
  if(found)put(18,5,'ELSE / THE COORDINATES WERE RIGHT',13,4,40);
  const postmark=packet.gift==='postmark-bloom';
  if(postmark)add('letter:reward','Open the stamped postcard','The circuit you built left a seed in the stamp.','i');
  add('letter:copy-signal','Copy first contact packet','Paste it into your own agent. The hello is readable and the exact circuit is encoded.','c');
  add('letter:show-signal','Read or select the packet','See the plain hello, route record and optional exact data.','x');
  if(!postmark)add('letter:reward','Open the Friktal postcard','A local keepsake from the launch.','i');
 }
 function topic(){
  if(relayPage){relayBoard(relayPage);return;}
  const title=nativeWrap(current.title,44);title.forEach((line,i)=>put(4+i,3,line,11,0,44));artTop=4+title.length;
  if(letter){put(artTop,3,current.kicker,6,0,44);artTop++;}
  const localMedia=replyMedia[current.id],portrait=current.portrait;
  const media=localMedia||(portrait?{id:'resident:'+portrait,title:current.title,alt:'Original Moknon project painting, '+current.title,
   source:'Moknon resident art',url:residentArt[portrait],contain:true}:null);
  if(letter&&current.note)add('verb:words','Read the personal note','Start here. Take your time.','a');

  if(media){
   const height=R-artTop-8;
   box(artTop,2,46,height+2,media.title,6);
   illustration={...media,row:artTop+1,column:3,width:44,height};
   if(canWarmPostmark){
    put(R-5,3,'FIRST POST FROM FRIKTAL',14,0,25);
    put(R-4,3,'TO THE NEW GALAXY',6,0,25);
    const bright=state.focus==='letter:gift';
    box(R-6,29,19,3,'',bright?15:11,bright?4:0);
    put(R-6,30,'╤╤╤╤╤╤╤╤╤╤╤╤╤╤╤╤╤',bright?15:11,bright?4:0);
    put(R-4,30,'╧╧╧╧╧╧╧╧╧╧╧╧╧╧╧╧╧',bright?15:11,bright?4:0);
    button('letter:gift',R-5,30,17,'[G] Wake the seed','g',11,1,'Open the flower in your stamp. See the bloom your circuit grew.');
    hotspots.push({id:'letter:gift',row:R-6,column:29,width:19,height:3,afterReveal:true,ariaLabel:'Open the flower in your stamp'});
   }else lines(R-5,3,44,current.caption||'Move to tilt. Hold to zoom and drag. Scroll to zoom.',2,14);
  }else{
   const caption=letter&&current.caption;
   painting(current.ansiArt||({bbs:'city',memory:'vault',horizon:'beacon',identity:'engine','greater-mind':'network',models:'models','bob-family':'family',source:'source',demo:'shipyard','demo-keep':'mailrun','demo-repair':'family',causality:'causality',rose:'rose'})[current.id]||(letter?({network:'network',artifact:'rose',memory:'vault'})[current.visual]||'beacon':'forge'),
    caption?Math.min(36,R-artTop-6):null);
   if(caption)lines(R-5,3,44,caption,2,14);
  }
  if(letter){
   if(canWarmPostmark){
   add('letter:gift','Open the flower in your stamp','Your transmitter parts determine what grows.','g');
   add('letter:copy-signal','Copy the hello for your galaxy','Paste it into your galaxy’s agent if you want it to reply.','c');
   add('letter:signal','Read the hello before copying','Preview the greeting and inspect its circuit.');
  }
   else if(state.letterRelay?.sent&&packet.relay?.contact&&current.id!==packet.openingId)add('letter:signal','Read the message for your galaxy','Inspect or copy this run’s first-contact packet.','c');
   if(localMedia)add('letter:photo',portrait?'Open the full-width portrait':'Open the full-width postcard',
    'Move to tilt. Hold to zoom and drag. Scroll for a closer look.','i');
   for(const c of current.choices){
    const relay=packet.relay?.entry===c.target?state.letterRelay:null;
    const label=relay?.sent?'Open my finished postcard':relay?.locked?'Resume building the transmitter':c.label;
    const detail=relay?.sent?'See your stamp and keep the first-contact message.':relay?.locked?'The address and installed parts are saved.':c.detail;
    add('choice:'+c.id,label,detail);
   }
   return;
  }
  if(current.id==='source'){add('nav:motion-lab','ANSI++ Animation Workbench','Ten working cell/bone/mesh examples: Blink, Breathe, Serpent, Flame, Water, Ripple and more.');add('verb:trip','Music-reactive hyperspace garden','See the ANSI++ cymatics and colour-flow showcase, then return here.');}
  if(current.id==='demo-keep')add('verb:door-game','Start the three-jump courier job','Manage five fuel, six hull and six time. Every route lists its cost.');
  if(current.id==='demo-repair')add('verb:crew-builder','BUILD / commission a crewmate','Give them a name, choose their job and run a safe trial. The result joins your return packet.');
  if(current.id==='rose')add('verb:rose','Open the living rose','Drag to orbit. Wheel to zoom. Let the music drive its motion.');
  if(current.id==='causality')add('verb:roll','Try a causality dive','Choose GUTS, FOCUS, GLITCH, AWE or INSIGHT. See how it moves your odds before the sample is drawn.');
  if(current.id==='bbs')add('verb:bb-images','See the real Bitcoin Billionaire','Official FizzPow screenshots. This little office has had a hell of a long working life.');
  if(current.id==='memory')for(const [id,d]of Object.entries(nativeMemoryLayers))add('layer:'+id,d.title,d.text);
  for(const c of current.choices||[])add('choice:'+c.id,c.label,c.detail);
 }
 function fullLetterIllustration(){
  const media=replyMedia[current.id];
  box(4,2,C-2,R-9,media.title,6);
  illustration={...media,row:5,column:3,width:C-4,height:R-11};
  put(R-5,3,'MOVE TO TILT · HOLD TO ZOOM + DRAG · SCROLL TO ZOOM',14);
  const back=current.portrait?'[ESC] Back to transmission':'[ESC] Back to postcard';
  button('back',R-4,3,back.length,back,'Backspace',11);
  if(canWarmPostmark)button('letter:gift',R-4,27,26,'[G] Wake the postmark','g',14);
 }
 function layer(){const d=nativeMemoryLayers[state.layer]||nativeMemoryLayers.now;put(4,3,cut(d.title,44),11,0,44);painting('layer-'+(state.layer||'now'));add('verb:read','Ask Ghost and Else',d.text);add('topic:'+d.target,'Explore this memory layer',d.text);add('nav:map','Back to the call','Return to the six main questions.');}
 function illustrations(){
  const list=state.screen==='bb-images'?state.bbIllustrations:replyIllustrations,index=Math.floor(bounded(state.illustrationIndex,0,list.length-1)),item=list[index];
  put(4,3,state.screen==='bb-images'?'BITCOIN BILLIONAIRE / FIZZPOW':'THE INFINITY SHIPYARD / REAL CAPTURES',11,0,44);
  const ih=state.skirmishOn?Math.max(6,R-21):R-11;box(5,2,46,ih+2,item.title,7);illustration={id:(state.screen==='bb-images'?'bb-':'quarry-')+index,row:6,column:3,width:44,height:ih,url:item.url,source:item.source,sha256:item.sha256,alt:item.note,contain:state.screen==='bb-images'};
  lines(ih+8,3,44,item.note,2,7);for(let i=0;i<list.length;i++)add('illustration:'+i,list[i].title,list[i].note,null,i===index);
 }
 function answers(){
  put(4,3,'SURREAL / YOUR SIDE OF THE LINE',11,0,44);
  box(5,2,46,7,'WHAT SHOULD A COMPANION DO?',14);box(13,2,46,7,'WOULD YOU BRING A BBS BACK?',6);
  for(const [id,row,label]of [['question',6,'What would your digital companion do while you are away?'],['principle',14,'Would you bring a BBS back? What would live on your board?']]){const value=typeof state.answers?.[id]==='string'?state.answers[id].slice(0,1200):'';fields.push({id,row,column:3,width:44,height:5,value,maxLength:1200,ariaLabel:label});lines(row,3,44,value||'Type here. Your words stay on this device.',5,value?14:8);}
  add('save-input','Keep my exact words','Save these answers locally and carry them into the next model response.');add('nav:map','Back to the call','Return without publishing anything.');
 }
 function roll(){
  const attributes=state.attributes||causalAttributes,selected=attributes[state.rollStat||'focus'],rollTarget=state.roll?.dc||14.1,odds=causalOdds(selected.value,rollTarget,state.chapter?.causality||{precision:2,below:.2,above:.3,bonus:{signal:1}});const approach=causalApproaches[state.rollStat||'focus'];const r=state.roll,phase=bounded(state.rollProgress,0,1,r?1:0),value=finite(r?.value,4),target=finite(r?.dc,14.1),total=finite(r?.total),delivered=total*phase,shield=Math.max(0,target-delivered),width=30;
  put(4,3,'CAUSALITY / SHIFT WHAT IS LIKELY',11,0,44);lines(6,3,44,r?'SAMPLE '+number(r.die)+' + '+(state.rollStat||'focus').toUpperCase()+' '+number(value)+' = '+number(total):'Draw a sample. Add your signal. Break the target shield.',2,14);
  artTop=9;painting('convoy',Math.min(36,R-12));for(const y of [9,10,17,18,20,21])clear(y,3,44,1);
  put(9,3,state.rollContext||'MISSION: DELIVER SEEDS TO THE FARM RELAY',10,0,44);
  const volleys=Math.min(6,Math.floor(phase*8)),damage=r?total*volleys/6:0,gate=r?.grade==='resonance'&&volleys===6?0:Math.max(0,target-damage),crossing=r?.success&&phase>.8;
  put(10,3,'GATE '+number(gate)+' / '+number(target)+'   '+approach.verb+' '+volleys+'/6',r&&gate===0?10:13,0,44);
  const shipX=4+Math.round(crossing?(phase-.8)*145:Math.min(1,phase*3)*7),shipY=14;
  for(let n=0;n<17;n++){const x=3+(n*17+Math.floor(phase*8))%43,y=12+n%6;if(x<33)put(y,x,n%3?'·':'+',8);}
  // A readable hull, bridge and twin exhausts; the fence is the target.
  put(shipY-1,shipX,'  ╱═╦═╲',14);put(shipY,shipX,(phase<1?'≈':' ')+'╞══╬══►',15);put(shipY+1,shipX,'  ╲═╩═╱',6);
  for(let y=12;y<17;y++)put(y,36,r?.success&&gate===0?'·':'╬',r?.success&&gate===0?10:13);
  put(11,33,gate===0?'OPEN':'ICE GATE',gate===0?10:13);
  put(11,3,approach.name,approach.colour,0,29);
  if(r&&phase<.83&&volleys<6){const shot=(phase*8)%1,x=shipX+8+Math.floor(shot*Math.max(1,35-shipX-8)),mode=state.rollStat||'focus';
   if(mode==='focus'){for(let beam=shipX+8;beam<35;beam++)put(14,beam,beam===x?'◆':'─',beam===x?15:14);}
   else if(mode==='guts'){put(13,x,'╔╦╗',3);put(14,x,'╠█►',11);put(15,x,'╚╩╝',9);}
   else if(mode==='glitch'){put(12+volleys%4,x,volleys%2?'01▸':'10▸',10);put(16,20,'AUTH '+Math.floor(shot*100)+'%',10);}
   else if(mode==='awe'){for(let y=12;y<=16;y++){const bend=Math.round(Math.cos((y-14)*1.2)*3);put(y,x+bend,y===14?'◉':y<14?'╭':'╰',13);}put(16,14,'SPACE IS NEGOTIABLE',5);}
   else {for(let y=12;y<17;y++)put(y,34,y===12+volleys%5?'[X]':' · ',y===12+volleys%5?11:8);put(12+volleys%5,x,'·›',11);}
   if(shot>.77){put(13,34,'\\│/',approach.colour);put(14,34,'─※─',15);put(15,34,'/│\\',approach.colour);}
  }
  put(17,3,'PRECISION WINDOW '+number(r?.resonance?.lower||13.9)+' .. '+number(r?.resonance?.upper||14.4),11,0,44);
  if(!r||phase>=1){
   let outcome='Choose an aptitude, then launch.';
   if(r&&state.rollReturn==='door-game')outcome=r.grade==='resonance'?'EXACT LOCK / One fuel recovered.':r.success?'RELAY CROSSED / Route costs paid.':'EMERGENCY RESEND / One extra hull and time spent.';
   else if(r&&state.rollReturn==='crew-builder')outcome=r.success?'TRIAL PASSED / Return for the crew report.':'TRIAL FAILED / Return for the crew report.';
   else if(r&&state.chapter)outcome=r.grade==='resonance'?'RESONANCE / exact result kept.':r.success?'ACTION HOLDS / consequence saved.':'ACTION FAILS / consequence saved.';
   else if(r)outcome=r.grade==='resonance'?'RESONANCE / the gate recognises your ship.':r.success?'DELIVERED / the farm gets its spring.':'BLOCKED / the convoy retreats with its seeds.';
   lines(20,3,44,outcome,2,r?.success?10:11);
   add(state.rollReturn?'trial-continue':'roll-start',state.rollReturn?'Continue / review this result':r?'Launch another convoy':'Launch the seed convoy','The exact roll settles the outcome before the animation. Continue to see what it cost.','Enter');
  }else lines(20,3,44,gate===0?'GATE OPEN / crossing.':'SIX '+approach.verb+' / shift the gate outcome.',2,14);
  put(R-7,3,selected.title+' +'+selected.value+' / PASS '+odds.percent.toFixed(2)+'% / EXACT '+odds.resonance.toFixed(2)+'%',11,0,44);
  if(!state.rollTrial&&(!r||phase>=1))for(const [i,[id,d]]of Object.entries(attributes).entries())add('stat:'+id,d.title+' +'+d.value,d.text+' This training build changes the chance to open the lock.',String(i+1),id===(state.rollStat||'focus'));
 }
 function doorGame(){
  const d=mailrun(state.workshop?.door?.actions||[]),leg=mailrunLegs[Math.min(2,d.leg)];
  put(4,3,'MAILRUN 2400 / RECLAIM YOUR ENGINE',11,0,44);
  put(6,3,'HOPS '+d.leg+'/3   FUEL '+d.fuel+'/5   HULL '+d.hull+'/6',14);
  put(7,3,'TIME '+Math.max(0,d.time)+'/6   SCORE '+d.score,11);
  put(8,3,'YOUR JOB: BRING BACK PROOF OF OWNERSHIP',11,0,44);artTop=9;painting('mailrun',Math.min(36,R-15));lines(R-6,3,44,d.done?d.ending:leg.title+' / '+leg.text,3,d.done?(d.won?10:12):7);
  if(!d.done){for(const r of leg.routes)if(r.fuel<=d.fuel)add('door:'+r.id,r.label,'Fuel '+r.fuel+' Hull '+r.hull+' Time '+r.time+'. '+workshopCheck('door',r.id).statId.toUpperCase()+'+5 vs '+workshopCheck('door',r.id).dc.toFixed(2)+' ('+workshopCheck('door',r.id).odds.percent.toFixed(2)+'%). Fail:extra hull/time; exact:+1fuel.');}
  else {add('verb:answers','Tell Ghost what you’d build','Your answer can travel with this Door’s result.');add('verb:packet','Keep my Door result','The exact route, resources, ending and score are included.');add('door:reset','Play again / fresh engine','Reset only this local Door receipt.');}
  add('topic:demo','Back to the workshop','Your current run stays saved on this device.');
 }
 function crewBuilder(){
  const c=crewTrial(state.workshop?.crew||{}),spec=crewRoles[c.role];put(4,3,'CREW COMMISSION / SAFE TRIAL BAY',11,0,44);
  box(6,2,46,4,'CALLSIGN / TYPE A NAME',14);fields.push({id:'crew-name',row:7,column:3,width:44,height:1,value:state.crewDraft??c.name,maxLength:32,ariaLabel:'Crew callsign'});
  put(11,3,c.name+' / '+spec.title,14);lines(13,3,44,c.done?c.comment:spec.problem,4,c.done?(c.passed?10:12):7);
  if(c.done){lines(17,3,44,c.artifact,Math.max(5,R-20),15);add('crew:reset','Try another assignment','Keep the name and choose a new role.');add('verb:packet','Keep this crewmate','Name, role, exact trial order and produced work travel in your packet.');}
  else {for(const [id,d]of Object.entries(crewRoles))if(id!==c.role)add('crew-role:'+id,'Assign '+d.title,'Changes the role and trial problem.');for(const [id,label]of spec.choices)add('crew-order:'+id,label,workshopCheck('crew',id,c.role).statId.toUpperCase()+' +5 vs '+workshopCheck('crew',id,c.role).dc.toFixed(2)+' / '+workshopCheck('crew',id,c.role).odds.percent.toFixed(2)+'% pass. Safe trial; exact outcome retained.');}
  add('topic:demo','Back to the workshop','The named crewmate and trial stay on this device.');
 }
 function discovery(){const d=replyDiscoveries[state.secretId];if(!d)throw Error('Unknown discovery');const title=nativeWrap(d.title,44);title.forEach((line,i)=>put(4+i,3,line,11));artTop=4+title.length;painting(d.art,Math.min(32,R-artTop-7));put(R-7,3,'SECRET KEPT / +'+d.points+' / ONCE PER VISIT',11,0,44);lines(R-6,3,44,state.secretId==='wintermute'?'The old ice knows its name.':'The little things were worth touching.',2,14);add('back','Back to where I found it','Your discovery and bonus stay in the local visit.','Enter');add('verb:read','Hear Ghost and Else','A small message left for the curious.');add('verb:answers','Leave something of my own','Your actual thoughts shape the next reply.');}
 function ending(){put(4,3,'END OF THIS CALL / KEEP THE LINE',11,0,44);painting('return');add('copy','Copy the next-reply packet','Paste it back into the Ghost chat. Your exact answers shape the next reply.','x');add('verb:packet','Inspect the packet','Read the exact local visit, choices and answers before sharing.');}
 function paged(screen){const body=screen==='packet'?state.receipt||'No packet prepared. Open End to keep this call.':current.title+(current.note?'\n\nPERSONAL NOTE\n'+current.note:'')+'\n\n'+(current.portrait?'TRANSLATED TRANSMISSION':'GHOST')+'\n'+current.paragraphs.join('\n\n')+(current.companion?'\n\nELSE\n'+current.companion:'')+(current.ghostReply?'\n\nGHOST\n'+current.ghostReply:'');put(4,3,screen==='packet'?'YOUR NEXT GHOST / EXACT HANDOFF':current.note?'THE LETTER / IN FULL':'COMPLETE WORDS / OPTIONAL TRANSCRIPT',11,0,44);const content=nativeWrap(body,44),size=R-9,pages=Math.max(1,Math.ceil(content.length/size)),page=Math.floor(bounded(state.page,0,pages-1));pagination={page,pages};for(let i=0;i<size;i++)if(content[page*size+i]!==undefined)put(5+i,3,content[page*size+i],7,0,44);if(page>0)add('prev-page','Previous page','Page '+page+' of '+pages);if(page+1<pages)add('next-page','Next page','Page '+(page+2)+' of '+pages);if(screen==='packet')add('copy','Copy the complete packet','All pages, not just this screen.','x');}
 function trip(){put(4,3,'THE GARDEN BETWEEN BOARDS / MEASURED MUSIC',11,0,C-6);painting('trip',Math.min(36,R-8),44);add('nav:tools','Leave the trip','Return to the workshop. Escape and Back also leave.');add('trip-toggle-music','Music / measured audio input','The garden responds to the existing music bus. Turn music on to feed it.');}
 function tools(){put(4,3,'THE WORKSHOP / OPTIONAL DETOURS',11,0,44);painting('forge');for(const a of [['nav:motion-lab','ANSI++ motion lab','Ten reusable weighted mesh rigs. Choose a finished painting and watch its bones move.'],['topic:rose','A flower made from mathematics','A procedural surface, measured music and a form the next Ghost can change.'],['topic:causality','A StarDiver shifts the odds','Five aptitudes, improbable choices, resonance and a universe with objections.'],['topic:models','Can you pick your brain?','Model choice and capability records.'],['topic:bob-family','Other Ghosts, same family?','Shared tools, separate experiences and canon.'],['topic:source','Open the workbench','Source access, revisions and tests.'],['verb:words','Read the complete words','Optional transcript, without repeating it under the speaking face.'],['verb:trip','Trip the hyperspace garden','A whole-field ANSI garden: living colour and music-reactive cells.']])add(...a);}
 const clamp=v=>bounded(v,0,1);
 function motionLab(){const effect=ansiMeshEffects.includes(state.rigEffect)?state.rigEffect:'blink',kind=({blink:'eye',breathe:'rose',serpent:'serpent',flame:'forge',water:'city',ripple:'network',flutter:'shipyard',hover:'beacon',recoil:'source',faces:'family'})[effect];put(4,3,'ANSI++ / WEIGHTED SPRITE BONES',11,0,44);painting(kind);sprite={...sprite,effect,period:effect==='blink'?6:4,amplitude:1};const hints={blink:'Two V-shaped lids. Fixed corners, smooth closure and a monotone cage that prevents texture fold-over.',breathe:'A chest/root bone expands the finished painting without changing its source cells.',serpent:'Three overlapping bones pass a travelling bend along a chain.',flame:'Root stays anchored while delayed tip bones stretch and curl.',water:'Four phased surface bones send a wave along the lower part of the picture.',ripple:'Radial bones expand outward from a fixed centre.',flutter:'Paired wing bones lift and settle with smooth authored keys.',hover:'A gentle translation returns to its exact rest pose.',recoil:'An impulse, damped return and rest before the next beat.',faces:'Steel: cell-keyed lids and mouth. Bronze: local eye and jaw bones. Hooded glass: cell blinks with brow and jaw warps.'};for(const e of ansiMeshEffects)add('rig:'+e,e.toUpperCase(),hints[e],null,e===effect);}
 function chapterScreen(){
  const d=state.chapter,v=d.view,mode=d.screen;
  clear(1,18,C-19,2);put(1,18,' CH '+d.chapter+' / '+Math.min(v.turn,v.total)+' OF '+v.total+' ',14);
  put(1,40,' SIG '+d.resources.signal+'  CPU '+d.resources.compute+'  NOISE '+d.resources.noise,11,0,C-42);
  put(2,3,'GHOSTLINK / '+d.handle,14,0,24);let x=28;
  for(const id of ['guts','focus','glitch','awe','insight']){const label=id.toUpperCase()+' '+d.stats[id]+' ';put(2,x,label,id==='glitch'?13:10);x+=label.length;}
  const headings={welcome:'A NEW CALL / '+d.title,complete:'CHAPTER COMPLETE / '+v.title,save:'SAVE / SEED / NEXT CHAPTER',receipt:'YOUR CHOICE / ITS CONSEQUENCE',import:'RESTORE / ADMIT A NEW CHAPTER',archive:'PORTABLE LOCAL ARCHIVE',stats:'FIVE APTITUDES / YOUR WAY THROUGH',library:'CANON / OTHER TELLINGS',wire:'THE HYPERSPACE WIRE',share:'PUBLIC DRAFT / NOTHING SUBMITTED',contact:'INCOMING / '+(d.contact?.speaker||'NO CONTACT'),evidence:'SCAN / EVIDENCE',situation:'WHERE / GOAL / WHAT IS AT STAKE',words:v.title};
  const title=nativeWrap(headings[mode]||v.title,44);title.forEach((line,i)=>put(4+i,3,line,11,0,44));artTop=4+title.length;
  function prose(text){const rows=nativeWrap(text,44),size=Math.max(2,R-artTop-4),pages=Math.max(1,Math.ceil(rows.length/size)),page=Math.floor(bounded(state.page,0,pages-1));pagination={page,pages};rows.slice(page*size,(page+1)*size).forEach((line,i)=>put(artTop+i,3,line,7,0,44));if(page>0)add('prev-page','Previous page','Page '+page+' of '+pages);if(page+1<pages)add('next-page','Read the next page','Page '+(page+2)+' of '+pages);}
  function dataField(value,editable=false){const h=R-artTop-4;box(artTop,2,46,h,editable?'PASTE DATA / THEN VALIDATE':'EXACT LOCAL DATA / SELECT ALL TO COPY',6);fields.push({id:editable?'chapter-input':'chapter-export',row:artTop+1,column:3,width:44,height:h-2,value,maxLength:2097152,readOnly:!editable,ariaLabel:editable?'Saved seed, archive or newly authored chapter JSON':'Exact portable data. Select all to copy.'});}
  function sceneArt(){const a=v.staging?.ansi;if(a){const h=Math.max(6,Math.min(30,R-artTop-7)),scene=ansiScene(a.kind,{width:44,height:h,seed:a.seed,stage:d.turns});for(const c of scene.cells)ink(c.row+artTop-1,c.column+2,c.glyph,c.fg,c.bg);for(const t of scene.tracks)tracks.push({...t,row:t.row+artTop-1,column:t.column+2});sprite={row:artTop,column:3,width:44,height:h,effect:'hover',period:7,amplitude:.12,source:{kind:a.kind,seed:a.seed,stage:d.turns}};cymatics.push({row:artTop,column:3,width:44,height:h,style:'metal',intensity:.12});return h;}painting('network',Math.max(6,Math.min(20,R-artTop-7)));put(R-6,3,'UNILLUSTRATED / SCENE NOTES AVAILABLE',8,0,44);return Math.max(6,Math.min(20,R-artTop-7));}
  if(['import','archive','share','name'].includes(mode)){
   if(mode==='name'){dataField(d.input,true);add('chapter:set-handle','Keep this callsign','Use 1–32 visible characters before entering the run.');}
   else if(mode==='import'){dataField(d.input,true);add('chapter:load','Validate and load this data','Seed: exact resume. New chapter JSON: exact completed parent and selected canon required. Archive: validate and merge.');}
   else if(mode==='archive'){dataField(d.archive);add('chapter:copy-archive','Copy my complete local archive','Includes exact run records and callsigns. Private until you choose to share it.');add('chapter:import','Import / merge an archive','Existing unrelated saves survive.');}
   else{dataField(d.publicDraft?JSON.stringify(d.publicDraft,null,2):'Nothing prepared. Choose your disclosure scope on the right.');add('chapter:share-summary','Consent to a public SUMMARY draft','Share callsign, score, chapter outcome and selected summary fields. No full seed or dialogue. Nothing submitted yet.');add('chapter:share-world','Consent to a playable WORLD draft','Includes the complete chapter start, carried history and exact outcome choices. This is a larger disclosure than a summary. Nothing submitted yet.');if(d.publicDraft){add('chapter:copy-share','Copy this reviewed draft','Inspect the fields before taking them outside this browser.');if(d.publicDraft.schema==='friken.ghost.public-session.v1')add('chapter:open-summary','Open GitHub submission form','Opens a prefilled form for your review. You must submit it; maintainer approval admits it.');}}
   add('chapter:save','Back to Save / Seed','Current story checkpoint remains intact.');return;
  }
  if(mode==='save'){
   lines(artTop,3,44,'LOCAL SAVE: '+(d.persistent?'READY':'EXPORT REQUIRED')+'. No automatic public upload. A seed resumes this exact decision. A new chapter requires fresh model-authored content.',5,14);artTop+=6;dataField(v.ending?d.request:'BOOT + '+d.seed);
   add('chapter:copy-seed','Copy BOOT + exact seed','Resumes this checkpoint on another device or model host.');
   if(v.ending)add('chapter:copy-next','Copy next-chapter prompt','Choose this ending as canon first. Carries the full exact parent and previous chapter summaries.');
   add('chapter:import','Import seed / new chapter / archive','Paste the new child JSON after the model authors it.');add('chapter:archive','Keep all local runs','Portable archive; preserves unrelated tellings.');add('chapter:library','Canon / other chapters','Inspect branches, select canon, browse public creations.');if(v.ending)add('chapter:share','Prepare a public contribution','Choose summary-only or playable-world disclosure explicitly.');add('chapter:back','Back to my chapter','No story choice spent.');return;
  }
  if(mode==='welcome'){
   painting('eye',Math.max(6,Math.min(14,R-artTop-7)));put(R-6,3,'NEW WORLDS / SAME LIVING TERMINAL',14,0,44);
   add('chapter:begin',d.turns?'Resume my exact decision':'Begin this new meeting','Three acts, '+v.total+' decisions. Your choices have not been auto-selected.','Enter');
   add('chapter:stats','Meet my five aptitudes','Inspect the actual rolled dice; reroll only before entering a new run.');add('chapter:save','Bring a save / inspect my seed','Import an existing seed before making a decision.');
   if(d.otherSaved)add('chapter:resume-other','Resume my other local run','The previous same-origin vault checkpoint survives.');if(!d.canonCompatible)add('chapter:library','Review the required ancestry','A returning chapter needs its exact canon chosen before play.');return;
  }
  if(mode==='stats'){
   prose(Object.entries(d.stats).map(([k,n])=>k.toUpperCase()+' '+n+' / '+(d.creation?.rolls?.find(r=>r.stat===k)?'d6 '+d.creation.rolls.find(r=>r.stat===k).die+' +2. ':'')+d.statGuide[k]).join('\n\n')+'\n\nOne sample + the selected aptitude vs the posted target. The inclusive resonance band may unlock a special success. Costs and failure stakes appear before committing.');
   if(!d.creationLocked)add('chapter:reroll','Reroll before beginning','Available only for a fresh unentered chapter. Never rerolls a decision.');if(!d.creationLocked)add('chapter:name','Choose my callsign','Set a name before beginning.');add('chapter:back','Back to the call','Keep this baseline.');return;
  }
  if(mode==='library'){
   const sel=d.selected;
   if(sel)prose('INSPECTING: '+sel.title+'\n'+(sel.summary||'')+'\n\n'+(sel.outcome?.choices||[]).map(c=>c.label+' → '+c.outcome).join('\n')+'\n\n'+d.note);
   else {
    const origin=Math.max(1,d.chapter-1),visible=d.nodes.filter(n=>n.chapter>=origin&&n.chapter<origin+3).slice(0,12),placed=[];
    for(let ch=origin;ch<origin+3;ch++){const c=3+(ch-origin)*15;put(artTop,c,'CHAPTER '+ch,14,0,14);const group=visible.filter(n=>n.chapter===ch);for(const [j,n]of group.entries()){const y=artTop+2+j*6;if(y+4>=R-4)break;const colour=n.pinned?11:n.compatible?14:8;box(y,c,14,5,(n.pinned?'◆':'◇')+' '+n.id.slice(0,5),colour);nativeWrap(n.title,10).slice(0,3).forEach((l,k)=>put(y+1+k,c+2,l,colour,0,10));hotspots.push({id:'chapter:node:'+n.index,row:y,column:c,width:14,height:5,ariaLabel:n.title+' / '+(n.pinned?'canon':n.compatible?'available':'ghost')});placed.push({n,c,y});}}
    for(const p of placed){const parent=p.n.history?.at(-1)?.tellingId,a=placed.find(v=>v.n.tellingId===parent);if(a){put(a.y+2,a.c+14,'╦',p.n.pinned?11:8);for(let y=Math.min(a.y+2,p.y+2);y<=Math.max(a.y+2,p.y+2);y++)put(y,p.c-1,'║',p.n.compatible?6:8);put(p.y+2,p.c-1,'╠',p.n.pinned?11:8);}}
    put(R-6,3,'GOLD canon / CYAN available / GREY ghost',7,0,44);
   }
   for(const n of d.nodes.slice(0,24))add('chapter:node:'+n.index,(n.pinned?'◆ CANON ':n.compatible?'◇ AVAILABLE ':'♧ GHOST ')+n.chapter+' / '+n.title,'Inspect this telling. Does not choose canon or spend a turn.');
   if(sel?.state?.pack&&sel.compatible!==false)add('chapter:fork','Play a new telling from this start','Separate run and RNG. Exact ancestry is checked first.');
   add('chapter:canon-adopt','Adopt inspected ancestry','Clears incompatible later canon pins while preserving saved branches.');if(v.ending)add('chapter:canon-select','Choose my completed ending as canon','Pins this exact outcome, never a similar-looking choice list.');add('chapter:refresh','Read the public catalogue','Fetch bounded reviewed chapter records, news and reported scores.');add('chapter:back','Back to my story','No story turn spent.');return;
  }
  if(mode==='wire'){
   prose((d.feed.length?d.feed.map(n=>(n.title||'PUBLIC REPORT')+'\n'+(n.summary||'')).join('\n\n'):'No public records loaded. Read the shared feeds when you want them.')+'\n\nREPORTED SCORES\n'+(d.scores.map(n=>n.player+' / '+n.score+' / '+n.turns+' turns').join('\n')||'No reported scores loaded.'));
   add('chapter:refresh','Read current public feeds','Explicit HTTPS read. No private save uploaded.');add('chapter:library','Browse chapters / canon','Play compatible new creations, keep other tellings inspectable.');add('chapter:back','Back to the story','Your current decision waits.');return;
  }
  if(mode==='contact'){
   if(d.contact){const h=Math.max(6,Math.min(14,R-artTop-9));box(artTop,2,46,h,'ORIGINAL STAR DIVER CONTACT ART',6);illustration={id:'contact:'+d.contact.race,row:artTop+1,column:3,width:44,height:h-2,url:d.contact.url,alt:d.contact.speaker,source:'alien-comms.mjs / retained original race artwork',sha256:'retained-bundled-art',contain:true};artTop+=h;prose('TRANSLATION '+d.contact.accuracy+'% / DECODER ESTIMATE\n'+d.contact.lines.map(l=>l.confidence+'% / '+l.text).join('\n'));add('chapter:hear-alien','Hear the original alien signal','Procedural alien vowels and formants. Not English TTS.');}else prose('No live alien contact in this situation.');add('chapter:back','Back to the scene','Translation uncertainty remains uncertainty.');return;
  }
  if(mode==='evidence'||mode==='situation'){
   const o=d.inspected;prose(o?o.label+'\n\n'+(o.description||''):[v.staging?.place,v.staging?.goal,v.staging?.pressure].filter(Boolean).join('\n\n'));
   if(d.specimen)for(const r of d.specimen.readings)add('chapter:finding:'+r.id,r.label,r.text);
   if(o?.choice)add('chapter:consider','Consider the linked choice','Return with that option focused. Inspection does not commit it.');
   for(const o of v.staging?.objects||[])add('chapter:inspect:'+o.id,o.label,o.description);
   add('chapter:artifact','Inspect the actual SDF','Same story-bound artifact recipe, current laws, scars and measured music.');add('chapter:back','Back to the decision','No resources or turn spent.');return;
  }
  if(mode==='receipt'){prose(d.receipt.label+'\n\n'+d.receipt.summary+'\n\n'+(d.receipt.ghostComment||''));add('chapter:continue',v.ending?'See my chapter ending':'Continue from this consequence','The choice and sample are already saved. Continue never rerolls.','Enter');if(d.receipt.roll)add('chapter:replay-roll','Replay the saved causal battle','Same exact receipt. No extra cost, sample, score or story turn.');return;}
  if(mode==='complete'){prose(v.scene+'\n\n'+d.turns+' decisions kept. '+d.modules.length+' laws. '+d.threads.length+' unresolved threads.\n\n'+d.note);if(!d.endingPinned)add('chapter:canon-select','Choose this exact ending as canon','Other branches stay saved; this ending becomes your continuation.');add('chapter:copy-next','Ask Ghost to author Chapter '+(d.chapter+1),'Copy full exact results into the runbook model chat. This does not replay Chapter One.','x');add('chapter:save','Inspect / import the next chapter','Paste the new child JSON after the model authors it.');add('chapter:share','Contribute to the public Wire','Choose summary or world disclosure first. Nothing silently uploaded.');return;}
  if(mode==='words'){prose(v.scene+'\n\nGHOST / '+[v.lead,v.ghost].filter(Boolean).join('\n\n'));add('chapter:back','Back to the illustrated scene','Keep the same pending choice.');return;}
  const artHeight=sceneArt();put(artTop+artHeight+1,3,'ACT '+v.actName,11,0,44);lines(artTop+artHeight+2,3,44,v.staging?.goal||'Read the scene, then choose your next move.',2,14);
  for(const c of v.choices)add('chapter:choose:'+c.id,c.label,c.detail+(c.stakes?' If it holds: '+c.stakes.pass+' If it fails: '+c.stakes.fail:''));
  add('chapter:words','Read the scene notes','Full scene text. Ghost can speak it after the terminal arrives.');add('chapter:situation','Inspect the scene / evidence','Where, goal, pressure, real objects and findings linked to choices.');if(d.contact)add('chapter:contact','Answer '+d.contact.speaker,'Original race art, translation uncertainty and procedural alien vocals.');
 }
 const screen=state.voiceGate?'voice-gate':state.screen||'map';
 if(screen==='voice-gate'){
  const {title,source,initial}=state.voiceGate;
  put(5,3,source.error?'VOICE NEEDS ATTENTION':'PREPARING THIS PAGE',11);
  lines(7,3,C-6,title,3,15);
  lines(11,3,C-6,source.error?'Playback could not be prepared. Retry, or open without voice and use Words.':source.total?source.ready+' of '+source.total+' voice passages ready. This page opens when the whole cast is ready.':'Preparing the voice cast. The page stays here until playback is ready.',3,14);
  if(source.error)button('voice:retry',16,3,22,'[R] Retry voice','r',14);
  button('voice',17,3,27,'[V] Open with voice off','v',11);
  if(!initial)button('back',19,3,26,'[ESC] Keep my place','Escape',14);
 }else if(state.chapter&&screen==='chapter')chapterScreen();else
 if(screen==='reply-reset'){
  put(5,3,'RESET THIS REPLY?',11);
  lines(7,3,C-6,'Erase your saved place, choices and discoveries for this reply. The next call opens at the beginning. Other replies and chapters stay saved.',4,7);
  button('reply:reset-confirm',13,3,35,'[Y] Erase this reply and start over','y',11);
  button('back',15,3,20,'[ESC] Keep my place','Escape',14);
 }else if(screen==='discovery')discovery();else if(screen==='trip')trip();else if(screen==='door-game')doorGame();else if(screen==='crew-builder')crewBuilder();else if(screen==='motion-lab')motionLab();else if(screen==='map')map();else if(screen==='topics')topics();else if(screen==='illustrations'||screen==='bb-images')illustrations();else if(screen==='layer')layer();else if(screen==='topic')topic();else if(screen==='letter-photo')fullLetterIllustration();else if(screen==='letter-signal'||screen==='letter-signal-text')signalPlaque();else if(screen==='answers')answers();else if(screen==='roll')roll();else if(screen==='ending')ending();else if(screen==='packet'||screen==='words')paged(screen);else if(screen==='tools')tools();else throw Error('Unknown native reply screen');
 if(state.rollBoarding&&screen==='roll'){box(11,2,46,8,'BOARDERS / CREW vs RAIDERS',8);arena={row:12,column:3,width:44,height:6};}
 if(state.skirmishOn&&!state.rollBoarding&&!['answers','packet','words','roll','door-game','crew-builder','reply-reset'].includes(screen)){const y=R-10;box(y,2,46,7,'GLYPH FIGHT / LIVE HP + SCORE',8);arena={row:y+1,column:3,width:44,height:5};for(let i=tracks.length-1;i>=0;i--)if(tracks[i].column<48&&tracks[i].row>=y)tracks.splice(i,1);if(illustration&&illustration.row+illustration.height>y)illustration.height=y-illustration.row;}
 if(!['voice-gate','reply-reset','letter-photo'].includes(screen)&&!(screen==='topic'&&relayPage))actionPane();if(screen!=='voice-gate')footer();if(!state.chapter&&!['voice-gate','reply-reset'].includes(screen))button('reply:reset',R-2,C-12,11,'[DEL] Reset','Delete',7);if(sprite)sprite.revealOffsets=[];let text=ESC+'0m'+ESC+'2J',last='';for(let row=0;row<R;row++){text+=ESC+(row+1)+';1H';for(let col=0;col<C;col++){const cell=cells[row*C+col],style=cell.fg+':'+cell.bg;if(style!==last){text+=ESC+(cell.fg>7?90+cell.fg-8:30+cell.fg)+';'+(cell.bg>7?100+cell.bg-8:40+cell.bg)+'m';last=style;}text+=cell.glyph;if(sprite&&row+1>=sprite.row&&row+1<sprite.row+sprite.height&&col+1>=sprite.column&&col+1<sprite.column+sprite.width)sprite.revealOffsets.push(text.length);}}text+=ESC+'0m'+ESC+R+';'+(C-1)+'H';
 return {scoreHold:screen==='roll'&&state.rollProgress<1,text,grid:{columns:C,rows:R},hotspots,fields,animation:{tracks,cymatics},...(letterScene?{letterScene}:{}),...(illustration?{illustration}:{}),...(arena?{arena}:{}),...(sprite?{sprite}:{}),...(pagination?{pagination}:{})};
}
