import test from 'node:test';
import assert from 'node:assert/strict';
import {mindProgress,causalDemo,tourRooms} from './mind-adventure.mjs';
import {newReplyVisit,recordReplyVisit} from './response-theater.mjs';
import {TURN_OUT_OF_TIME as packet} from './turn-out-of-time-data.mjs';
test('exploration score rewards actual visits and choices but ending is available immediately without chores',()=>{
 let v=newReplyVisit(packet);assert.equal(mindProgress(v).ready,true);assert.equal(mindProgress(v).score,0);assert.equal(mindProgress(v).percent,0);
 v=recordReplyVisit(v,{kind:'view',node:'identity'},packet);assert.equal(mindProgress(v).ready,true);assert.equal(mindProgress(v).score,10);
 v=recordReplyVisit(v,{kind:'view',node:'identity'},packet);assert.equal(mindProgress(v).score,10,'revisiting a room cannot farm exploration score');
 for(const node of tourRooms)v=recordReplyVisit(v,{kind:'view',node},packet);
 assert.equal(mindProgress(v).percent,86);assert.equal(mindProgress(v).ready,true);
 v=recordReplyVisit(v,{kind:'view',node:'demo'},packet);v=recordReplyVisit(v,{kind:'choice',from:'demo',id:'keep-original',to:'demo-keep'},packet);
 assert.equal(mindProgress(v).ready,true);assert.equal(mindProgress(v).score,80);
 const raw='  What happens when we disagree?\nKeep the original.  ';
 v=recordReplyVisit(v,{kind:'answer',id:'question',text:raw},packet);assert.equal(v.answers.question,raw);assert.equal(mindProgress(v).score,85);
 v=recordReplyVisit(v,{kind:'answer',id:'question',text:'Another question.'},packet);assert.equal(mindProgress(v).score,85,'editing a field cannot farm score');
 v=recordReplyVisit(v,{kind:'roll',result:causalDemo(10.10)},packet);assert.equal(v.roll.grade,'resonance');assert.equal(mindProgress(v).score,95);
});
test('input and roll admission reject forged fields/arithmetic and retained progress survives journal compaction',()=>{
 let v=newReplyVisit(packet);assert.throws(()=>recordReplyVisit(v,{kind:'answer',id:'__proto__',text:'x'},packet));assert.throws(()=>recordReplyVisit(v,{kind:'answer',id:'question',text:'x'.repeat(1201)},packet));assert.throws(()=>recordReplyVisit(v,{kind:'roll',result:{...causalDemo(2),success:true}},packet));
 for(const node of tourRooms)v=recordReplyVisit(v,{kind:'view',node},packet);
 for(let i=0;i<80;i++)v=recordReplyVisit(v,{kind:'answer',id:'question',text:'x'.repeat(1190)+String(i)},packet);
 assert.ok(JSON.stringify(v).length<=64000);assert.equal(mindProgress(v).rooms.length,6);assert.ok(v.answers.question.endsWith('79'));
});

test('all five aptitudes shift training odds while exact receipts remain admitted and replayable',()=>{for(const value of [3,4,5,6]){const r=causalDemo(10.10,value);let v=newReplyVisit(packet);v=recordReplyVisit(v,{kind:'roll',result:{...r,statId:'focus'}},packet);assert.equal(v.roll.value,value);assert.equal(v.roll.statId,'focus');assert.equal(v.roll.total,r.total);}});
