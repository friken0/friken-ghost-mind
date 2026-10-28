import test from 'node:test';
import assert from 'node:assert/strict';
import {TURN_OUT_OF_TIME as packet} from './turn-out-of-time-data.mjs';
import {validateTurnOutOfTime,newReplyVisit,recordReplyVisit,validateReplyVisit} from './response-theater.mjs';
test('all authored doors are reachable and bounded; unknown destinations refuse',()=>{
  const data=validateTurnOutOfTime(packet),seen=new Set(),queue=[data.openingId];while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);queue.push(...data.nodes.find(n=>n.id===id).choices.map(c=>c.target));}assert.equal(seen.size,data.nodes.length);
  data.nodes[0].choices[0].target='nonexistent';assert.throws(()=>validateTurnOutOfTime(data),/target/);
});
test('an inspected alternative never overwrites the explicitly selected telling',()=>{
  let v=newReplyVisit(packet);const act=(id)=>{const c=packet.nodes.find(n=>n.id===v.current).choices.find(c=>c.id===id);v=recordReplyVisit(v,{kind:'choice',from:v.current,id:c.id,to:c.target},packet);};
  act('try-the-door');act('keep-original');assert.equal(v.selectedTelling,'demo-keep');act('compare-repair');assert.equal(v.current,'demo-repair');assert.equal(v.selectedTelling,'demo-keep');
  const copy=validateReplyVisit(JSON.parse(JSON.stringify(v)),packet);assert.deepEqual(copy,v);assert.equal(v.events.length,3);
});
test('visit cannot commit an unavailable choice and keeps its parent intact',()=>{
  const v=newReplyVisit(packet),before=structuredClone(v);assert.throws(()=>recordReplyVisit(v,{kind:'choice',from:'hello',id:'keep-original',to:'demo-keep'},packet),/pending/);assert.deepEqual(v,before);
});
test('visit retention is bounded and another reply cannot inherit its records',()=>{
  let v=newReplyVisit(packet);for(let i=0;i<300;i++)v=recordReplyVisit(v,{kind:'view',node:'hello'},packet);assert.equal(v.events.length,256);assert.equal(v.events.at(-1).sequence,300);assert.throws(()=>validateReplyVisit({...v,reply:'someone-else'},packet));
});
