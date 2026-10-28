/* Pure 80x25 reply program for the retained GhostLink ANSI terminal.
 * No DOM, timers, audio, randomness or story mutation. Coordinates are 1-based. */
import {mailrun,mailrunLegs,crewTrial,crewRoles,workshopCheck} from './door-and-crew.mjs';
import {ansiMeshEffects} from './ansi-mesh.mjs';
import {causalOdds} from './causality.mjs';
import {causalAttributes} from './mind-adventure.mjs';
import {ansiScene} from './ansi-scenes.mjs';
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
 archive:Object.freeze({title:'LONG / THE ORIGINALS',target:'memory',colour:13,text:'Original source shards, indices, provenance and hashes. Reconstructed stories must name their surviving evidence. A checksum cannot regrow a deleted byte.',companion:'Keep the embarrassing original too. It often explains why the polished version is trying quite so hard.'}),
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
 const current=packet.nodes.find(n=>n.id===state.current)||packet.nodes.find(n=>n.id===packet.openingId)||packet.nodes[0];
 const progress=state.progress||{},rooms=nativeRoomIds.filter(id=>Array.isArray(progress.rooms)&&progress.rooms.includes(id)),telling=typeof state.selectedTelling==='string'&&packet.nodes.some(n=>n.id===state.selectedTelling)?state.selectedTelling:null,ready=progress.ready===true;
 const cells=Array.from({length:C*R},()=>({glyph:' ',fg:7,bg:0})),hotspots=[],fields=[];let interactive=true,artTop=5,pagination=null,illustration=null,arena=null,sprite=null;const tracks=[],actions=[],cymatics=[];
 const ink=(r,c,glyph,fg=7,bg=0)=>{if(r>=1&&r<=R&&c>=1&&c<=C)cells[(r-1)*C+c-1]={glyph,fg,bg};};
 function put(r,c,text,fg=7,bg=0,width=C-c+1){const value=[...safe(text).replace(/\n/g,' ')].slice(0,Math.max(0,Math.min(width,C-c+1)));for(let i=0;i<value.length;i++)ink(r,c+i,value[i],fg,bg);}
 function clear(r,c,width,height,bg=0){for(let y=r;y<r+height;y++)for(let x=c;x<c+width;x++)ink(y,x,' ',7,bg);}
 function box(r,c,width,height,title='',fg=8,bg=0){clear(r,c,width,height,bg);for(let x=0;x<width;x++){ink(r,c+x,x===0?'╔':x===width-1?'╗':'═',fg,bg);ink(r+height-1,c+x,x===0?'╚':x===width-1?'╝':'═',fg,bg);}for(let y=1;y<height-1;y++){ink(r+y,c,'║',fg,bg);ink(r+y,c+width-1,'║',fg,bg);}if(title)put(r,c+2,' '+cut(title,width-6)+' ',fg,bg,width-4);}
 function button(id,r,c,width,label,key,fg=14,height=1,ariaLabel=label){const selected=state.focus===id,bg=selected?4:0;clear(r,c,width,height,bg);const rows=nativeWrap(label,width);for(let i=0;i<Math.min(height,rows.length);i++)put(r+i,c,rows[i],selected?15:fg,bg,width);if(interactive){hotspots.push({id,row:r,column:c,width,height,...(key?{key}:{}),ariaLabel:single(ariaLabel,700)});const glyph=[...label][1];if(label.startsWith('[')&&glyph)tracks.push({row:r,column:c+1,interval:selected?480:1200,transition:selected?480:1200,effect:selected?'flip':'pulse',frames:[{glyph,fg:selected?15:fg,bg,scaleX:.82,scaleY:.82},{glyph,fg:selected?15:fg,bg,scaleX:1,scaleY:1}]});}}
 function lines(r,c,width,text,maxRows,fg=7){const wrapped=nativeWrap(text,width);for(let i=0;i<Math.min(maxRows,wrapped.length);i++)put(r+i,c,wrapped[i],fg,0,width);if(wrapped.length>maxRows&&maxRows>0)put(r+maxRows-1,c,cut(wrapped[maxRows-1],Math.max(0,width-4))+' ...',fg,0,width);return wrapped.length;}
 function horizontal(row,label=''){put(row,1,'╠'+'═'.repeat(C-2)+'╣',8);if(label)put(row,3,' '+cut(label,C-8)+' ',6);}
 function footer(){let x=3;for(const [id,label,key,fg]of [
 ['voice','[V]Voice '+(state.voiceOn===false?'OFF':'ON'),'v',14],['music','[U]Music '+(state.musicOn?'ON':'OFF'),'u',7],['sfx','[S]SFX '+(state.sfxOn===false?'OFF':'ON'),'s',7],['motion','[P]Move '+(state.held?'OFF':'ON'),'p',7],['speed','[B]'+(state.bps||14400),'b',11],['palette','[L]'+(state.paletteLabel||'ANSI++'),'l',13]]){button(id,R-1,x,id==='speed'?9:label.length,label,key,fg);x+=label.length+1;}}
 box(1,1,C,R);const percent=Math.round(bounded(progress.percent,0,100));
 const score=Math.max(0,Math.floor(finite(progress.score)));put(1,3,' SCORE '+(score>999999?'999999+':String(score).padStart(4,'0'))+' ',11,0,15);
 put(1,18,' DOORS '+rooms.length+'/6 ',14);put(1,32,' SEEN '+('█'.repeat(Math.round(percent/10))+'░'.repeat(10-Math.round(percent/10)))+' '+String(percent).padStart(3)+'% ',10);
 put(1,C-20,' PRIVATE LINE ',6);put(2,3,cut('FRIKEN.GHOST / '+packet.title,44),14,0,44);put(2,49,cut(packet.recipient||'CALLER',15).toUpperCase()+' / GHOSTLINK',11,0,C-50);horizontal(3);horizontal(R-3);
 put(R-2,3,' '+cut(state.boardStatus||'LOCAL PRIVATE VISIT / NO SILENT UPLOADS',C-8)+' ',8,0,C-6);
 const add=(id,label,detail='',key=null,selected=false)=>actions.push({id,label:selected?label+' (CURRENT)':label,detail,key,selected});
 function painting(kind,requestedHeight=null,requestedWidth=44){const h=requestedHeight??(state.skirmishOn?Math.max(7,R-15):Math.min(36,R-artTop-3)),scene=ansiScene(kind,{width:requestedWidth,height:h,seed:state.artSeed||0,stage:state.workshop?.door?.leg||0});for(const c of scene.cells)ink(c.row+artTop-1,c.column+2,c.glyph,c.fg,c.bg);for(const t of scene.tracks)tracks.push({...t,row:t.row+artTop-1,column:t.column+2});if(kind!=='trip')cymatics.push({row:artTop,column:3,width:requestedWidth,height:h,style:kind==='trip'?'trip':['city','beacon'].includes(kind)?'water':['rose','return'].includes(kind)?'foliage':'metal',intensity:kind==='trip'?.9:.18});const effect=({trip:'breathe',eye:'blink',serpent:'serpent',city:'water',vault:'hover',engine:'breathe',forge:'flame',network:'ripple',family:'faces',models:'flutter',beacon:'hover',shipyard:'hover',source:'recoil',original:'water',repair:'ripple',causality:'water',rose:'breathe',return:'hover','layer-now':'breathe','layer-echo':'water','layer-archive':'hover','layer-witness':'ripple'})[kind];if(kind!=='convoy')sprite={row:artTop,column:3,width:requestedWidth,height:h,effect:effect||'none',period:effect==='blink'?7+(state.artSeed||0)%4:effect==='water'?4:6,amplitude:effect==='blink'?1:.7,source:{kind,seed:state.artSeed||0,stage:state.workshop?.door?.leg||0}};}
 function actionPane(){
  const x=49,w=C-50,hintRows=R>=30?6:3,hintStart=R-5-hintRows,pageRow=hintStart-1,available=R-12-hintRows,pages=[[]];let used=0;
  for(const a of actions){const rows=nativeWrap('['+(a.key||((actions.indexOf(a)%9)+1))+'] '+a.label,w),cost=rows.length+1;if(used&&used+cost-1>available){pages.push([]);used=0;}pages.at(-1).push({...a,rows});used+=cost;}
  const page=Math.floor(bounded(state.actionPage,0,pages.length-1));let y=6;put(4,x,'YOUR NEXT MOVE',6,0,w);
  for(const a of pages[page]){const key=a.key||String(actions.findIndex(v=>v.id===a.id)+1);button(a.id,y,x,w,'['+key+'] '+a.label,key,a.selected?10:7,a.rows.length,a.label+'. '+a.detail);y+=a.rows.length+1;}
  if(pages.length>1){button('actions-prev',pageRow,x,9,'[←] Prev','ArrowLeft',14);put(pageRow,x+10,(page+1)+'/'+pages.length,11);button('actions-next',pageRow,C-12,10,'[→] Next','ArrowRight',14);}
  const active=actions.find(a=>a.id===state.focus),contextHint=state.screen==='door-game'?(mailrun(state.workshop?.door?.actions||[]).log.at(-1)||'Goal: recover the packet through three hops. Costs are printed before you commit.'):state.screen==='crew-builder'?'Type a name, choose a job, then issue a trial order. Results stay in your local packet.':state.screen==='motion-lab'?'CURRENT rig: '+(state.rigEffect||'blink').toUpperCase()+'. Motion runs after the screen is drawn.':'Choose a question. Ghost speaks after this screen arrives.',hint=active?.detail||contextHint;
  lines(hintStart,x,w,hint,hintRows,active?15:8);if(active)hotspots.push({id:active.id,row:hintStart,column:x,width:w,height:hintRows,ariaLabel:hint});
  button('verb:read',R-5,x,9,'[R] Read','r',14);button('verb:answers',R-5,x+10,10,'[A] Write','a',11);button('verb:ending',R-5,x+21,w-21,'[E] End','e',7);
  button('back',R-4,x,9,'[←] Back','Backspace',14);button('nav:map',R-4,x+10,9,'[M] Home','m',14);button('nav:tools',R-4,x+20,w-20,'[T] More','t',6);
 }

 function map(){
  put(4,3,'SURREAL / AN OLD FRIEND ON A NEW LINE',11,0,44);painting('eye');
  for(const a of [
   ['topic:bbs','Your game. Still going.','Bitcoin Billionaire: the game you made, and what keeps people coming back.'],
   ['topic:identity','HyperBit → Ghost','The companion idea that Friken kept working on.'],
   ['verb:illustrations','Inside the fractal shipyard','Real captures: quarry a volume, extract parts, build ships.'],
   ['topic:greater-mind','What did Friken build?','The shared library, versioned components and separate lives.'],
   ['verb:answers','What would YOU build?','Type your own ideas about companions and bringing BBSs back.'],
   ['topic:memory','Walk through my memory','Explore now, recent episodes, originals and a recovery kit.']])add(...a);
 }
 function topic(){
  const title=nativeWrap(current.title,44);title.forEach((line,i)=>put(4+i,3,line,11,0,44));artTop=4+title.length;painting(({bbs:'city',memory:'vault',horizon:'beacon',identity:'engine','greater-mind':'network',models:'models','bob-family':'family',source:'source',demo:'shipyard','demo-keep':'mailrun','demo-repair':'family',causality:'causality',rose:'rose'})[current.id]||'forge');
  if(current.id==='source'){add('nav:motion-lab','ANSI++ Animation Workbench','Ten working cell/bone/mesh examples: Blink, Breathe, Serpent, Flame, Water, Ripple and more.');add('verb:trip','Music-reactive hyperspace garden','See the ANSI++ cymatics and colour-flow showcase, then return here.');}
  if(current.id==='demo-keep')add('verb:door-game','PLAY / reclaim your engine','Three relay hops. Manage five fuel, six hull and six time. Every route lists its cost.');
  if(current.id==='demo-repair')add('verb:crew-builder','BUILD / commission a crewmate','Give them a name, choose their job and run a safe trial. The result joins your return packet.');
  if(current.id==='rose')add('verb:rose','Open the living rose','Drag to orbit. Wheel to zoom. Let the music drive its motion.');
  if(current.id==='causality')add('verb:roll','Try a causality dive','Choose GUTS, FOCUS, GLITCH, AWE or INSIGHT. See how it moves your odds before the sample is drawn.');
  if(current.id==='bbs')add('verb:bb-images','See the real Bitcoin Billionaire','Official FizzPow screenshots. This little office has had a hell of a long working life.');
  if(current.id==='memory')for(const [id,d]of Object.entries(nativeMemoryLayers))add('layer:'+id,d.title,d.text);
  for(const c of current.choices||[])add('choice:'+c.id,c.label,c.detail);
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
  const attributes=state.attributes||causalAttributes,selected=attributes[state.rollStat||'focus'],rollTarget=state.roll?.dc||14.1,odds=causalOdds(selected.value,rollTarget,{precision:2,below:.2,above:.3,bonus:{signal:1}});const approach=causalApproaches[state.rollStat||'focus'];const r=state.roll,phase=bounded(state.rollProgress,0,1,r?1:0),value=finite(r?.value,4),target=finite(r?.dc,14.1),total=finite(r?.total),delivered=total*phase,shield=Math.max(0,target-delivered),width=30;
  put(4,3,'CAUSALITY / SHIFT WHAT IS LIKELY',11,0,44);lines(6,3,44,r?'SAMPLE '+number(r.die)+' + SIGNAL '+number(value)+' = '+number(total):'Draw a sample. Add your signal. Break the target shield.',2,14);
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
  if(!r||phase>=1){lines(20,3,44,!r?'Choose an aptitude, then launch.':r.grade==='resonance'?'RESONANCE / the gate recognises your ship.':r.success?'DELIVERED / the farm gets its spring.':'BLOCKED / the convoy retreats with its seeds.',2,r?.success?10:11);add(state.rollReturn?'trial-continue':'roll-start',state.rollReturn?'Continue / apply this result':r?'Launch another convoy':'Launch the seed convoy','A local probability dive. The exact roll decides the whole battle before animation; effects never reroll it.','Enter');}else lines(20,3,44,gate===0?'GATE OPEN / taking the convoy through.':'SIX '+approach.verb+' / shift the gate outcome.',2,14);
  put(R-7,3,selected.title+' +'+selected.value+' / PASS '+odds.percent.toFixed(2)+'% / EXACT '+odds.resonance.toFixed(2)+'%',11,0,44);
  if(!state.rollTrial&&(!r||phase>=1))for(const [i,[id,d]]of Object.entries(attributes).entries())add('stat:'+id,d.title+' +'+d.value,d.text+' This training build changes the chance to open the lock.',String(i+1),id===(state.rollStat||'focus'));
 }
 function doorGame(){
  const d=mailrun(state.workshop?.door?.actions||[]),leg=mailrunLegs[Math.min(2,d.leg)];
  put(4,3,'MAILRUN 2400 / RECLAIM YOUR ENGINE',11,0,44);
  put(6,3,'HOPS '+d.leg+'/3   FUEL '+d.fuel+'/5   HULL '+d.hull+'/6',14);
  put(7,3,'TIME '+Math.max(0,d.time)+'/6   SCORE '+d.score,11);
  put(8,3,'BALANCED STATS +5 / ROUTES REQUIRE A DIVE',11,0,44);artTop=9;painting('mailrun',Math.min(36,R-15));lines(R-6,3,44,d.done?d.ending:leg.title+' / Read for the full situation.',3,d.done?(d.won?10:12):7);
  if(!d.done){for(const r of leg.routes)if(r.fuel<=d.fuel)add('door:'+r.id,r.label,'Fuel '+r.fuel+' Hull '+r.hull+' Time '+r.time+'. '+workshopCheck('door',r.id).statId.toUpperCase()+'+5 vs '+workshopCheck('door',r.id).dc.toFixed(2)+' ('+workshopCheck('door',r.id).odds.percent.toFixed(2)+'%). Fail:extra hull/time; exact:+1fuel.');}
  else {add('door:reset','Play again / fresh engine','Reset only this local Door receipt.');add('verb:packet','Keep my Door result','The exact route, resources, ending and score are included.');}
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
 function ending(){put(4,3,'END OF THIS CALL / KEEP THE LINE',11,0,44);painting('return');add('copy','Copy the next-reply packet','Paste it back into the Ghost chat. Your exact answers shape the next reply.','x');add('verb:packet','Inspect the packet','Read the exact local visit, choices and answers before sharing.');}
 function paged(screen){const body=screen==='packet'?state.receipt||'No packet prepared. Open End to keep this call.':current.title+'\n\nGHOST\n'+current.paragraphs.join('\n\n')+'\n\nELSE\n'+(current.companion||'');put(4,3,screen==='packet'?'YOUR NEXT GHOST / EXACT HANDOFF':'COMPLETE WORDS / OPTIONAL TRANSCRIPT',11,0,44);const content=nativeWrap(body,44),size=R-9,pages=Math.max(1,Math.ceil(content.length/size)),page=Math.floor(bounded(state.page,0,pages-1));pagination={page,pages};for(let i=0;i<size;i++)if(content[page*size+i]!==undefined)put(5+i,3,content[page*size+i],7,0,44);if(page>0)add('prev-page','Previous page','Page '+page+' of '+pages);if(page+1<pages)add('next-page','Next page','Page '+(page+2)+' of '+pages);if(screen==='packet')add('copy','Copy the complete packet','All pages, not just this screen.','x');}
 function trip(){put(4,3,'THE GARDEN BETWEEN BOARDS / MEASURED MUSIC',11,0,C-6);painting('trip',Math.min(36,R-8),Math.min(80,C-4));add('nav:tools','Leave the trip','Return to the workshop. Escape and Back also leave.');add('trip-toggle-music','Music / measured audio input','The garden responds to the existing music bus. Turn music on to feed it.');}
 function tools(){put(4,3,'THE WORKSHOP / OPTIONAL DETOURS',11,0,44);painting('forge');for(const a of [['nav:motion-lab','ANSI++ motion lab','Ten reusable weighted mesh rigs. Choose a finished painting and watch its bones move.'],['topic:rose','A flower made from mathematics','A procedural surface, measured music and a form the next Ghost can change.'],['topic:causality','A StarDiver shifts the odds','Five aptitudes, improbable choices, resonance and a universe with objections.'],['topic:models','Can you pick your brain?','Model choice and capability records.'],['topic:bob-family','Other Ghosts, same family?','Shared tools, separate experiences and canon.'],['topic:source','Open the workbench','Source access, revisions and tests.'],['verb:words','Read the complete words','Optional transcript, without repeating it under the speaking face.'],['verb:trip','Trip the hyperspace garden','A whole-field ANSI garden: living colour and music-reactive cells.']])add(...a);}
 const clamp=v=>bounded(v,0,1);
 function motionLab(){const effect=ansiMeshEffects.includes(state.rigEffect)?state.rigEffect:'blink',kind=({blink:'eye',breathe:'rose',serpent:'serpent',flame:'forge',water:'city',ripple:'network',flutter:'shipyard',hover:'beacon',recoil:'source',faces:'family'})[effect];put(4,3,'ANSI++ / WEIGHTED SPRITE BONES',11,0,44);painting(kind);sprite={...sprite,effect,period:effect==='blink'?6:4,amplitude:1};const hints={blink:'Two V-shaped lids. Fixed corners, smooth closure and a monotone cage that prevents texture fold-over.',breathe:'A chest/root bone expands the finished painting without changing its source cells.',serpent:'Three overlapping bones pass a travelling bend along a chain.',flame:'Root stays anchored while delayed tip bones stretch and curl.',water:'Four phased surface bones send a wave along the lower part of the picture.',ripple:'Radial bones expand outward from a fixed centre.',flutter:'Paired wing bones lift and settle with smooth authored keys.',hover:'A gentle translation returns to its exact rest pose.',recoil:'An impulse, damped return and rest before the next beat.',faces:'Steel: cell-keyed lids and mouth. Bronze: local eye and jaw bones. Hooded glass: cell blinks with brow and jaw warps.'};for(const e of ansiMeshEffects)add('rig:'+e,e.toUpperCase(),hints[e],null,e===effect);}
 const screen=state.screen||'map';
 if(screen==='trip')trip();else if(screen==='door-game')doorGame();else if(screen==='crew-builder')crewBuilder();else if(screen==='motion-lab')motionLab();else if(screen==='map')map();else if(screen==='illustrations'||screen==='bb-images')illustrations();else if(screen==='layer')layer();else if(screen==='topic')topic();else if(screen==='answers')answers();else if(screen==='roll')roll();else if(screen==='ending')ending();else if(screen==='packet'||screen==='words')paged(screen);else if(screen==='tools')tools();else throw Error('Unknown native reply screen');
 if(state.rollBoarding&&screen==='roll'){box(11,2,46,8,'BOARDERS / CREW vs RAIDERS',8);arena={row:12,column:3,width:44,height:6};}
 if(state.skirmishOn&&!state.rollBoarding&&!['answers','packet','words','roll','door-game','crew-builder'].includes(screen)){const y=R-10;box(y,2,46,7,'GLYPH FIGHT / LIVE HP + SCORE',8);arena={row:y+1,column:3,width:44,height:5};for(let i=tracks.length-1;i>=0;i--)if(tracks[i].column<48&&tracks[i].row>=y)tracks.splice(i,1);if(illustration&&illustration.row+illustration.height>y)illustration.height=y-illustration.row;}
 actionPane();footer();if(sprite)sprite.revealOffsets=[];let text=ESC+'0m'+ESC+'2J',last='';for(let row=0;row<R;row++){text+=ESC+(row+1)+';1H';for(let col=0;col<C;col++){const cell=cells[row*C+col],style=cell.fg+':'+cell.bg;if(style!==last){text+=ESC+(cell.fg>7?90+cell.fg-8:30+cell.fg)+';'+(cell.bg>7?100+cell.bg-8:40+cell.bg)+'m';last=style;}text+=cell.glyph;if(sprite&&row+1>=sprite.row&&row+1<sprite.row+sprite.height&&col+1>=sprite.column&&col+1<sprite.column+sprite.width)sprite.revealOffsets.push(text.length);}}text+=ESC+'0m'+ESC+R+';'+(C-1)+'H';
 return {text,grid:{columns:C,rows:R},hotspots,fields,animation:{tracks,cymatics},...(illustration?{illustration}:{}),...(arena?{arena}:{}),...(sprite?{sprite}:{}),...(pagination?{pagination}:{})};
}
