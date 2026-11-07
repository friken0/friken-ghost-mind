import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeReplyProgram,causalApproaches,nativeRoomIds,nativeMemoryLayers,nativeWrap} from './native-response-program.mjs';
import {TURN_OUT_OF_TIME as packet} from './turn-out-of-time-data.mjs';
import {createAnsiBuffer} from './ansi-terminal.mjs';
import {replyIllustrations,bitcoinIllustrations} from './illustration-data.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base={packet,current:'hello',screen:'map',progress:{rooms:[],score:0,percent:0},answers:{},bbIllustrations:bitcoinIllustrations};
function decode(p){const b=createAnsiBuffer(p.grid);b.feed(p.text);return b;}
const overlap=(a,b)=>a.row<b.row+b.height&&a.row+a.height>b.row&&a.column<b.column+b.width&&a.column+a.width>b.column;
const screens=['map','tools','layer','topic','illustrations','bb-images','answers','roll','ending','packet','words','motion-lab','trip','door-game','crew-builder'];
test('every screen fits portrait, classic and wide grids with one action pane and compact settings',()=>{
 for(const grid of [{columns:80,rows:25},{columns:80,rows:39},{columns:108,rows:25},{columns:160,rows:50}])for(const screen of screens){
  const p=nativeReplyProgram({...base,grid,screen,receipt:'ROW\n'.repeat(80)}),b=decode(p);assert.equal(b.cells.length,grid.columns*grid.rows);assert.equal(b.cells[0].char,'╔');assert.equal(b.cells.at(-1).char,'╝');assert.ok(p.text.length<128000);
  for(const h of [...p.hotspots,...p.fields]){assert.ok(h.row>=1&&h.column>=1&&h.row+h.height<=grid.rows+1&&h.column+h.width<=grid.columns+1);if(['voice','music','sfx','motion','verb:skirmish','speed'].includes(h.id))assert.equal(h.row,grid.rows-1);else if(!p.fields.includes(h)&&!h.id.startsWith('secret:'))assert.ok(h.column>=49,screen+' has competing actions outside its pane');}
  for(let i=0;i<p.hotspots.length;i++)for(let j=i+1;j<p.hotspots.length;j++)assert.equal(overlap(p.hotspots[i],p.hotspots[j]),false,screen+': '+p.hotspots[i].id+' vs '+p.hotspots[j].id);
  for(const f of p.fields)for(const h of p.hotspots)assert.equal(overlap(f,h),false);
 }
});
test('every authored choice is reachable and its entire label is drawn without ellipsis',()=>{
 for(const n of packet.nodes){const seen=new Set();for(let page=0;page<8;page++){const p=nativeReplyProgram({...base,screen:'topic',current:n.id,actionPage:page}),b=decode(p);for(const h of p.hotspots.filter(h=>h.id.startsWith('choice:'))){const label=n.choices.find(c=>'choice:'+c.id===h.id).label,printed=Array.from({length:h.height},(_,i)=>b.cells.slice((h.row-1+i)*80+h.column-1,(h.row-1+i)*80+h.column-1+h.width).map(c=>c.char).join('').trim()).join(' ').replace(/^\[.\] /,'');assert.equal(printed,label.replace(/\s+/g,' ').trim());seen.add(h.id);}if(!p.hotspots.some(h=>h.id==='actions-next'))break;}
  assert.deepEqual([...seen].sort(),n.choices.map(c=>'choice:'+c.id).sort());
 }
});
test('hover details extend the selected hit region and keys animate together without moving text',()=>{
 const p=nativeReplyProgram({...base,screen:'topic',current:'demo',focus:'choice:keep-original'});const hits=p.hotspots.filter(h=>h.id==='choice:keep-original');assert.equal(hits.length,2);assert.equal(hits[1].height,3);const keys=p.animation.tracks.filter(t=>t.effect==='pulse');assert.ok(keys.length>=6);assert.ok(keys.every(t=>!t.at&&t.interval===1200));assert.ok(p.animation.tracks.some(t=>t.effect==='flip'&&t.row===hits[0].row&&t.column===hits[0].column+1));
});
test('spoken dialogue is absent from interactive pages; source values and original capture provenance survive',()=>{
 const authored=structuredClone(packet);for(const n of authored.nodes){n.paragraphs=['PRIVATE_GHOST_TEXT'];n.companion='PRIVATE_ELSE_TEXT';}
 for(const current of authored.nodes.map(n=>n.id))for(const screen of ['map','topic'])assert.doesNotMatch(decode(nativeReplyProgram({...base,packet:authored,screen,current})).text,/PRIVATE_GHOST_TEXT|PRIVATE_ELSE_TEXT/);
 const p=nativeReplyProgram({...base,screen:'answers',answers:{question:'First\nExact line.',principle:'Second.'}});assert.equal(p.fields[0].value,'First\nExact line.');assert.equal(p.fields[0].maxLength,1200);
 for(const [screen,list]of [['illustrations',replyIllustrations],['bb-images',bitcoinIllustrations]])for(let i=0;i<list.length;i++){const p=nativeReplyProgram({...base,screen,illustrationIndex:i}),image=p.illustration;assert.equal(image.source,list[i].source);assert.equal(createHash('sha256').update(readFileSync(new URL('../../'+image.source,import.meta.url))).digest('hex'),image.sha256);for(const h of p.hotspots)assert.equal(overlap(h,image),false);}
});
test('optional fight is a bounded inset on the current page and never a competing destination',()=>{
 for(const screen of ['map','topic','tools','illustrations','ending']){const p=nativeReplyProgram({...base,screen,skirmishOn:true}),b=decode(p);assert.ok(p.arena);assert.match(b.text,/GLYPH FIGHT/);for(const h of p.hotspots)assert.equal(overlap(h,p.arena),false);assert.ok(!p.hotspots.some(h=>h.id==='game-start'));}
 for(const screen of ['answers','packet','words'])assert.equal(nativeReplyProgram({...base,screen,skirmishOn:true}).arena,undefined);
});
test('all memory layers, tools and typed return remain reachable without compulsory tours',()=>{
 const tools={hotspots:[0,1,2].flatMap(actionPage=>nativeReplyProgram({...base,screen:'tools',actionPage}).hotspots)};for(const id of ['topic:models','topic:bob-family','topic:source','topic:rose','topic:causality','verb:words'])assert.ok(tools.hotspots.some(h=>h.id===id));
 const ids=new Set();for(let actionPage=0;actionPage<3;actionPage++)for(const h of nativeReplyProgram({...base,screen:'topic',current:'memory',actionPage}).hotspots)ids.add(h.id);for(const id of Object.keys(nativeMemoryLayers))assert.ok(ids.has('layer:'+id));
 const p=nativeReplyProgram({...base,screen:'ending'});assert.ok(p.hotspots.some(h=>h.id==='copy'));assert.ok(p.hotspots.some(h=>h.id==='verb:answers'));assert.equal(nativeWrap('abcdefghij',4).join(''),'abcdefghij');
});
test('Causality retains exact result and resonance semantics',()=>{
 const r={die:9.95,value:4,dc:14.1,total:13.95,success:true,grade:'resonance',resonance:{lower:13.9,upper:14.4}},before=JSON.stringify(r),p=nativeReplyProgram({...base,screen:'roll',roll:r,rollProgress:1});assert.match(decode(p).text,/RESONANCE \/ the gate recognises your ship/);assert.equal(JSON.stringify(r),before);assert.ok(p.hotspots.some(h=>h.id==='roll-start'));assert.ok(!nativeReplyProgram({...base,screen:'roll',roll:r,rollProgress:.5}).hotspots.some(h=>h.id==='roll-start'));
});

test('all rigs have actual capture bounds, persistent selection, wrapped titles and explicit Back',()=>{
 for(const effect of ['blink','breathe','serpent','flame','water','ripple','flutter','hover','recoil','faces']){const p=nativeReplyProgram({...base,screen:'motion-lab',rigEffect:effect});assert.ok(p.sprite.width>0&&p.sprite.height>0&&p.sprite.row>0,effect);assert.equal(p.sprite.effect,effect);assert.ok([0,1,2].some(actionPage=>nativeReplyProgram({...base,screen:'motion-lab',rigEffect:effect,actionPage}).hotspots.some(h=>h.id==='rig:'+effect&&h.ariaLabel.includes('CURRENT'))));assert.ok(p.hotspots.some(h=>h.id==='back'));}
 const p=nativeReplyProgram({...base,screen:'topic',current:'bob-family'}),b=decode(p);assert.ok(!b.text.split('\n')[3].includes('...'));assert.ok(b.text.includes('Same launch.'));
 const images=nativeReplyProgram({...base,screen:'bb-images'});assert.ok(images.hotspots.some(h=>h.id==='illustration:0'&&h.ariaLabel.includes('CURRENT')));
});
test('playable Door and crew show resources, typed name and real action routes in the one pane',()=>{for(const grid of [{columns:80,rows:25},{columns:80,rows:39}]){const door=nativeReplyProgram({...base,grid,screen:'door-game'}),crew=nativeReplyProgram({...base,grid,screen:'crew-builder'});assert.match(decode(door).text,/FUEL 5\/5.*HULL 6\/6/);assert.ok(door.hotspots.some(h=>h.id==='door:direct'));assert.ok(crew.fields.some(f=>f.id==='crew-name'));assert.ok(crew.hotspots.some(h=>h.id==='crew-order:sandbox'));}});

test('shared causal trial hides stat changes, exposes Continue and makes boarding part of the encounter, never a menu toggle',()=>{const p=nativeReplyProgram({...base,screen:'roll',rollTrial:true,rollBoarding:true,rollReturn:'door-game',roll:{die:18,value:5,dc:12.6,total:23,success:true,grade:'pass'},rollProgress:1});assert.ok(p.arena);assert.ok(p.hotspots.some(h=>h.id==='trial-continue'));assert.ok(!p.hotspots.some(h=>h.id.startsWith('stat:')||h.id==='verb:skirmish'));const scene=nativeReplyProgram({...base,screen:'door-game'});assert.equal(scene.animation.cymatics.length,1);assert.ok(scene.animation.tracks.length>0);});

test('dense paintings declare monotone serial reveal bounds so detail cannot pop in after arrival',()=>{
 const p=nativeReplyProgram({packet,current:'bbs',screen:'topic'}),s=p.sprite;assert.equal(s.source.kind,'city');assert.equal(s.revealOffsets.length,s.width*s.height);
 assert.ok(s.revealOffsets.every((n,i)=>Number.isInteger(n)&&n>0&&n<=p.text.length&&(!i||n>s.revealOffsets[i-1])));
 const partial=createAnsiBuffer({columns:p.grid.columns,rows:p.grid.rows});partial.feed(p.text.slice(0,s.revealOffsets[0]));assert.equal(partial.cells[(s.row-1)*p.grid.columns+s.column-1].char,p.text[s.revealOffsets[0]-1]);
});


test('all five causal aptitudes use distinct gate techniques while retaining one exact result',()=>{const receipt={die:10,value:6,total:16,dc:14.1,success:true,grade:'pass',resonance:{lower:13.9,upper:14.4}},pictures=new Set();for(const stat of Object.keys(causalApproaches)){const p=nativeReplyProgram({packet,screen:'roll',rollStat:stat,roll:receipt,rollProgress:.37});const buffer=createAnsiBuffer();buffer.feed(p.text);assert.ok(buffer.text.includes(causalApproaches[stat].name));assert.ok(buffer.text.includes('16.00'));pictures.add(buffer.text);}assert.equal(pictures.size,5);assert.deepEqual(receipt,{die:10,value:6,total:16,dc:14.1,success:true,grade:'pass',resonance:{lower:13.9,upper:14.4}});});

test('animation examples remain directly discoverable from both workbench and More',()=>{for(const [screen,current]of [['topic','source'],['tools','hello']]){const p=nativeReplyProgram({packet,screen,current});assert.equal(p.hotspots[0].id,'nav:motion-lab');assert.match(p.hotspots[0].ariaLabel,/animation|mesh|rigs/i);}});

test('point-and-click relay fits actual parts, gates launch, and exports the same circuit',async()=>{
 const {newLetterRelay,advanceLetterRelay,relayForecast,relayHops,playLetterRelay,
  saveLetterRelay,restoreLetterRelay,firstContactText}=await import('./letter-relay.mjs');
 const {paintLetterRelay,pickRelaySignal,relayTargets}=await import('./letter-relay-art.mjs');
 const fresh=newLetterRelay(),grid={columns:80,rows:25};
 const contact={origin:'Friktal',destination:'Child galaxy',greeting:'Hello, little universe 🌌.',question:'What can I do under your stars?'};
 const letter={...base,packet:{...packet,layout:'letter',relay:{entry:'hello',contact}},screen:'topic',grid};
 const scope=nativeReplyProgram({...letter,letterRelay:fresh});
 assert.match(decode(scope).text,/FIND THE ADDRESS/);
 assert.ok(scope.hotspots.some(h=>h.id==='relay:zoom'));
 assert.equal(playLetterRelay(fresh,'sample','nav-pair').locked,false);
 const zoom=playLetterRelay(fresh,'zoom');
 const first=paintLetterRelay(zoom,scope.letterScene,grid,0),second=paintLetterRelay(zoom,scope.letterScene,grid,1.5);
 assert.notDeepEqual(first.points,second.points);
 for(const point of second.points)assert.equal(pickRelaySignal(second.points,point),point.id);
 assert.equal(playLetterRelay(zoom,'sample','drifter').locked,false);
 const bonus=playLetterRelay(zoom,'sample','pulsar');
 const ground=playLetterRelay(bonus,'sample','nav-pair');
 assert.deepEqual(ground.eggs,['dog-star']);
 const workshop=nativeReplyProgram({...letter,letterRelay:ground});
 assert.match(decode(workshop).text,/CLICK INPUT PART/);
 assert.match(decode(workshop).text,/-1 CHG  -1 SIG → 5 CHG  2 SIG/);
 assert.match(workshop.hotspots.find(h=>h.id==='relay:storm').ariaLabel,/5 charge and 2 bars/);
 for(const t of relayTargets(ground,workshop.letterScene)){
  const {id,row,column,width,height}=workshop.hotspots.find(h=>h.id==='relay:'+t.id);
  assert.deepEqual({id:id.slice(6),row,column,width,height,key:t.key},t);
 }
 const storm=paintLetterRelay(ground,workshop.letterScene,grid,3.6);
 assert.notDeepEqual(storm.cells,paintLetterRelay(ground,workshop.letterScene,grid,8).cells);
 assert.equal(paintLetterRelay(ground,workshop.letterScene,grid,3.6,{held:true}).storm.strike,null);
 const schematic=nativeReplyProgram({...letter,letterRelay:playLetterRelay(ground,'map')});
 assert.match(decode(schematic).text,/RESERVE 1 CHARGE AND AT LEAST 3 BARS/);
 assert.match(decode(schematic).text,/Buried cable\s+-2 CHG/);
 const [a,b,c]=relayHops.map(hop=>hop.routes);
 const routes=a.flatMap(first=>b.flatMap(second=>c.map(third=>[first,second,third])));
 const wins=routes.map(path=>[path.map(route=>route.id).join(','),path.map(route=>route.id)
  .concat('assemble','send').reduce(advanceLetterRelay,ground)]).filter(([,state])=>state.sent);
 assert.deepEqual(wins.map(([path])=>path),['storm,boost,cable','shield,boost,air','shield,bypass,cable']);
 assert.ok(wins.every(([,state])=>state.charge===0&&state.signal===3));
 const weak=['storm','bypass','air','assemble','send'].reduce((state,id)=>playLetterRelay(state,id),ground);
 assert.equal(weak.sent,false);assert.match(weak.message,/Need at least 3 bars/);
 const undo=playLetterRelay(weak,'undo');
 assert.deepEqual(undo.history.map(hop=>hop.id),['storm','bypass']);
 assert.deepEqual(relayForecast(undo,c[1]),{charge:2,signal:2});
 const valid=['storm','boost','cable'].reduce(advanceLetterRelay,ground);
 assert.equal(playLetterRelay(valid,'send').sent,false);
 const sealed=playLetterRelay(wins[0][1],'plate-mark');
 assert.deepEqual(saveLetterRelay(restoreLetterRelay(saveLetterRelay(sealed))),saveLetterRelay(sealed));
 const text=firstContactText(sealed,contact);
 assert.equal(firstContactText(valid,contact),'');
 assert.match(text,/Hello, little universe 🌌\./u);
 const packed=JSON.parse(Buffer.from(text.match(/FGHELLO1\.([A-Za-z0-9_-]+)/)[1],'base64url').toString('utf8'));
 assert.deepEqual(packed.circuit.map(({id,charge,signal})=>[id,charge,signal]),[['storm',5,2],['boost',3,3],['cable',1,3]]);
 assert.deepEqual(packed.launch,{chargeSpent:1,chargeLeft:0,signal:3});
 assert.equal(packed.marginNotes.length,2);
 const plaque=nativeReplyProgram({...letter,screen:'letter-signal',letterRelay:sealed});
 assert.match(decode(plaque).text,/CIRCUIT RECORDED/);
 assert.ok(plaque.hotspots.some(h=>h.id==='letter:copy-signal'));
 const raw=nativeReplyProgram({...letter,screen:'letter-signal-text',letterRelay:sealed});
 assert.equal(raw.fields[0].value,text);
 assert.equal(raw.fields[0].readOnly,true);
});

test('the postmark unlocks on the reward postcard and travels with its exact circuit',async()=>{
 const {validateTurnOutOfTime}=await import('./response-theater.mjs');
 const {newLetterRelay,advanceLetterRelay,firstContactText,postmarkSpecimen}=await import('./letter-relay.mjs');
 const contact={origin:'Friktal',destination:'Child galaxy',greeting:'A living postmark.',question:'Where would it grow?'};
 const openingId='hello',entry='relay',reward='postcard';
 const letter={...packet,layout:'letter',gift:'postmark-bloom',openingId,relay:{entry,reward,contact},
  nodes:[{id:openingId,title:'Hello',kicker:'GREETING',visual:'network',paragraphs:['Hello.'],choices:[{id:'play',label:'Play',detail:'Build it.',target:entry}]},
   {id:entry,title:'Relay',kicker:'WORKSHOP',visual:'network',paragraphs:['Build it.'],choices:[]},
   {id:reward,title:'Postcard',kicker:'STAMP',visual:'artifact',paragraphs:['Touch it.'],choices:[]}]};
 const fresh=newLetterRelay(),locked={...fresh,locked:true};
 const valid=routes=>[...routes,'assemble','send'].reduce(advanceLetterRelay,locked);
 const first=valid(['storm','boost','cable']),other=valid(['shield','boost','air']);
 assert.equal(postmarkSpecimen(fresh),null);
 assert.notDeepEqual(postmarkSpecimen(first),postmarkSpecimen(other));
 const state={...base,packet:validateTurnOutOfTime(letter),current:openingId,screen:'topic',letterRelay:first};
 assert.ok(!nativeReplyProgram(state).hotspots.some(h=>h.id==='letter:gift'));
 assert.ok(!nativeReplyProgram({...state,current:reward,letterRelay:fresh}).hotspots.some(h=>h.id==='letter:gift'));
 const action=nativeReplyProgram({...state,current:reward}).hotspots.find(h=>h.id==='letter:gift');
 assert.equal(action.key,'g');
 assert.match(action.ariaLabel,/grown from your circuit/);
 const text=firstContactText(first,contact,letter.gift);
 const packed=JSON.parse(Buffer.from(text.match(/FGHELLO1\.([A-Za-z0-9_-]+)/)[1],'base64url').toString('utf8'));
 assert.deepEqual(packed.specimen,{recipe:'friktal.postmark-bloom.v1',circuit:[0,0,1]});
 assert.match(text,/Living postmark enclosed/);
 assert.throws(()=>validateTurnOutOfTime({...letter,gift:'unreviewed-shader'}),/Unknown letter gift/);
});

test('letter note is readable and visited Moknon comms join only the portable fiction',async()=>{
 const {validateTurnOutOfTime}=await import('./response-theater.mjs');
 const {newLetterRelay,advanceLetterRelay,firstContactText,openedLetterComms}=await import('./letter-relay.mjs');
 const contact={origin:'Friktal',destination:'Child galaxy',greeting:'Greetings.',question:'What grows there?',postscript:'Inside the stamp.'};
 const letter={...packet,layout:'letter',openingId:'hello',relay:{entry:'relay',reward:'postcard',contact},nodes:[
  {id:'hello',title:'Hello',kicker:'GREETING',visual:'network',paragraphs:['Hello.'],note:'Private note.',choices:[]},
  {id:'relay',title:'Relay',kicker:'WORKSHOP',visual:'network',paragraphs:['Build it.'],choices:[]},
  {id:'postcard',title:'Postcard',kicker:'STAMP',visual:'artifact',paragraphs:['Touch it.'],choices:[]},
  {id:'krex',title:'Krex',kicker:'COMMS',visual:'network',portrait:'krex',paragraphs:['A traffic report.'],choices:[]}]};
 const state={...base,packet:validateTurnOutOfTime(letter),current:'hello',screen:'topic'};
 assert.equal(nativeReplyProgram(state).hotspots.find(h=>h.id==='verb:words').key,'a');
 assert.match(decode(nativeReplyProgram({...state,screen:'words'})).text,/PERSONAL NOTE/);
 assert.equal(nativeReplyProgram({...state,current:'krex'}).illustration.id,'resident:krex');
 const relay=['storm','boost','cable','assemble','send'].reduce(advanceLetterRelay,newLetterRelay());
 const text=firstContactText(relay,contact,null,openedLetterComms(letter,['hello','krex']));
 const data=JSON.parse(Buffer.from(text.match(/FGHELLO1\.([A-Za-z0-9_-]+)/)[1],'base64url').toString('utf8'));
 assert.deepEqual(data.comms,['krex']);assert.equal(data.postscript,'Inside the stamp.');
 assert.doesNotMatch(text,/Private note\.|Inside the stamp\./);
 assert.deepEqual(openedLetterComms(letter,['hello']),[]);
});
