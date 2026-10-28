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
  for(const h of [...p.hotspots,...p.fields]){assert.ok(h.row>=1&&h.column>=1&&h.row+h.height<=grid.rows+1&&h.column+h.width<=grid.columns+1);if(['voice','music','sfx','motion','verb:skirmish','speed'].includes(h.id))assert.equal(h.row,grid.rows-1);else if(!p.fields.includes(h))assert.ok(h.column>=49,screen+' has competing actions outside its pane');}
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
 const p=nativeReplyProgram({...base,screen:'topic',current:'bob-family'}),b=decode(p);assert.ok(!b.text.split('\n')[3].includes('...'));assert.ok(b.text.includes('family resemblance'));
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
