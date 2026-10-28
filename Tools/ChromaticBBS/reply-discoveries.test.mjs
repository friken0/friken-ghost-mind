import test from 'node:test';
import assert from 'node:assert/strict';
import {replyDiscoveries,canDiscover,discoveryIds,discoveryPoints,replyRewardFrame} from './reply-discoveries.mjs';
import {TURN_OUT_OF_TIME as packet} from './turn-out-of-time-data.mjs';
import {newReplyVisit,recordReplyVisit,validateReplyVisit} from './response-theater.mjs';
import {mindProgress} from './mind-adventure.mjs';
import {crewTrial,workshopRoll} from './door-and-crew.mjs';
import {nativeReplyProgram} from './native-response-program.mjs';
test('an artwork discovery pays its defined bonus once and persists beyond bounded event retention',()=>{
 let v=recordReplyVisit(newReplyVisit(packet),{kind:'view',node:'bbs'},packet),before=mindProgress(v).score;
 assert.equal(canDiscover('night-office',v,'trip'),false);
 v=recordReplyVisit(v,{kind:'discovery',id:'night-office',source:'city',points:999999},packet);
 assert.equal(mindProgress(v).score-before,128);assert.deepEqual(discoveryIds(v),['night-office']);
 assert.throws(()=>recordReplyVisit(v,{kind:'discovery',id:'night-office',source:'city'},packet),/available/);
 for(let i=0;i<300;i++)v=recordReplyVisit(v,{kind:'view',node:'hello'},packet);
 assert.equal(v.events.length,256);assert.equal(discoveryPoints(validateReplyVisit(JSON.parse(JSON.stringify(v)),packet)),128);
 assert.throws(()=>discoveryPoints({discoveries:['fake']}));assert.throws(()=>discoveryPoints({discoveries:['night-office','night-office']}));
});
test('the hidden sysop requires the archive visit, exact inferred name and an actual completed order',()=>{
 let v=newReplyVisit(packet);assert.equal(canDiscover('wintermute',v,'crew'),false);
 v=recordReplyVisit(v,{kind:'view',node:'memory'},packet);
 const configure=c=>recordReplyVisit(v,{kind:'workshop',value:{crew:c}},packet);
 assert.equal(canDiscover('wintermute',configure(crewTrial({name:'Wintermute'})),'crew'),false);
 const completed=crewTrial({name:'Wintermute',role:'sysop',action:'sandbox',roll:workshopRoll('crew','sandbox','sysop',.01)});
 assert.equal(completed.passed,false,'finding a name must not require lucky combat');
 v=configure(completed);assert.equal(canDiscover('wintermute',v,'crew'),true);
 v=recordReplyVisit(v,{kind:'discovery',id:'wintermute',source:'crew'},packet);assert.equal(discoveryPoints(v),512);
 assert.equal(canDiscover('wintermute',v,'crew'),false);
});
test('score envelopes pay the exact delta, finish at the authoritative score and settle under reduced motion',()=>{
 const reward={from:25,to:537,label:'OLD ICE',bonus:true};assert.equal(replyRewardFrame(reward,0).score,25);
 assert.ok(replyRewardFrame(reward,.4).score>25);assert.equal(replyRewardFrame(reward,1).score,537);
 assert.equal(replyRewardFrame(reward,4).active,false);assert.equal(replyRewardFrame(reward,4).opacity,0);
 const still=replyRewardFrame(reward,0,{reduced:true});assert.equal(still.score,537);assert.equal(still.scale,1);assert.equal(still.rise,0);
 assert.throws(()=>replyRewardFrame({from:5,to:5},0));assert.throws(()=>replyRewardFrame(reward,-1));
});
test('artwork discoveries have cell-aligned local targets without replacing the contextual action pane',()=>{
 for(const [screen,current,id]of [['topic','bbs','night-office'],['trip','hello','petunia-protocol']])for(const grid of [{columns:80,rows:25},{columns:80,rows:39},{columns:160,rows:50}]){
  const p=nativeReplyProgram({packet,screen,current,grid}),h=p.hotspots.find(h=>h.id==='secret:'+id);assert.ok(h);assert.ok(h.column>=3&&h.column+h.width<49);assert.ok(h.row>=p.sprite.row&&h.row+h.height<=p.sprite.row+p.sprite.height);assert.equal(h.key,undefined,'no accidental global hotkey');
  const d=nativeReplyProgram({packet,screen:'discovery',secretId:id,grid});assert.ok(d.text.includes('SECRET KEPT'));assert.ok(d.hotspots.some(h=>h.id==='back'&&h.key==='Enter'));assert.ok(d.text.includes(String(replyDiscoveries[id].points)));
 }
});
