import test from 'node:test';
import assert from 'node:assert/strict';
import {lifeStep,teamLifeStep,createBattleLife,battleFrame,battleTimeline,crossedBattleEvents} from './life-theater.mjs';
import {renderBattleCue} from './audio.mjs';
const roll={die:9.1,value:5,total:14.1,dc:14.1,stat:'awe',success:true,grade:'resonance'};
test('Immigration ownership follows birth majority; survivors retain their faction',()=>{
 const cells=new Uint8Array(25);cells[11]=1;cells[12]=2;cells[13]=1;
 const f=teamLifeStep(cells,5,5);assert.equal(f.cells[7],1);assert.equal(f.cells[12],2);assert.equal(f.cells[17],1);assert.deepEqual(f.live,[2,1]);assert.deepEqual(f.born,[2,0]);assert.deepEqual(f.lost,[2,0]);
 assert.deepEqual(Uint8Array.from(f.cells,v=>v?1:0),lifeStep(Uint8Array.from(cells,v=>v?1:0),5,5));
});
test('live scoreboard conserves population across ninety generations and replay is exact',()=>{
 const field=createBattleLife(123);const initial=battleFrame(field,0).live;
 for(let g=1;g<=90;g++){const f=battleFrame(field,g);for(let s=0;s<2;s++)assert.equal(f.live[s],initial[s]+f.births[s]-f.losses[s]);assert.equal(f.live[0]+f.live[1],f.cells.reduce((n,v)=>n+!!v,0));}
 const ending=battleFrame(field,90);assert.equal(field.history.length,91);battleFrame(field,12);assert.deepEqual(battleFrame(field,90),ending);assert.deepEqual(battleFrame(createBattleLife(123),90),ending);assert.equal(field.history.length,91);
});
test('timeline events cross once, pause crosses none, and each outcome gets a distinct finale',()=>{
 const events=battleTimeline(roll),heard=[];for(let t=-1;t<9400;t+=37)heard.push(...crossedBattleEvents(events,t,Math.min(9400,t+37)));assert.deepEqual(heard.map(e=>e.id),events.map(e=>e.id));assert.deepEqual(crossedBattleEvents(events,3100,3100),[]);
 assert.equal(battleTimeline(roll).at(-1).kind,'resonance');assert.equal(battleTimeline({...roll,grade:'pass'}).at(-1).kind,'victory');assert.equal(battleTimeline({...roll,grade:'fail',success:false}).at(-1).kind,'defeat');
});
test('every synthesized battle family is finite, bounded, audible PCM with a silent tail',()=>{
 for(const kind of new Set([...battleTimeline(roll),...battleTimeline({...roll,success:false,grade:'fail'}),...battleTimeline({...roll,grade:'pass'})].map(e=>e.kind))){const a=renderBattleCue(kind),b=renderBattleCue(kind);assert.deepEqual(a,b);assert.ok(a.length<=14400);let peak=0,energy=0;for(const v of a){assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));energy+=v*v;}assert.ok(peak>.03&&peak<.8);assert.ok(Math.sqrt(energy/a.length)>.01);assert.ok(Math.abs(a.at(-1))<.0001);}
 assert.throws(()=>renderBattleCue('bogus'));
});

// Exercise every impact, not just the end card: no imaginary damage or ammo.
test('gate charges conserve cents at every hit, including overflow and exact-band bypass',async()=>{
 const {battleAssault}=await import('./life-theater.mjs');
 for(const [die,value,dc,grade] of [[15.74,6,17.2,'pass'],[4.12,6,17.2,'fail'],[11.15,6,17.2,'resonance'],[.01,0,40,'fail'],[20,20,1,'pass']]){
  const r={die,value,total:Math.round((die+value)*100)/100,dc,stat:'focus',grade,success:grade!=='fail'},events=battleTimeline(r);let previous=0;
  for(const e of events){const a=battleAssault(r,e.at,events);assert.equal(a.absorbed+a.overflow,a.spent);assert.equal(a.spent+a.reserve,a.total);assert.equal(a.shield+a.absorbed,a.target);assert.ok(a.spent>=previous);previous=a.spent;assert.ok(a.shield>=0&&a.reserve>=0);}
  const end=battleAssault(r,9400,events);assert.equal(end.spent,end.total);assert.equal(end.open,r.success);assert.equal(end.aligned,grade==='resonance');
  if(grade==='resonance'){assert.equal(end.shield,5);assert.equal(battleAssault(r,7599,events).open,false);}
 }
});
