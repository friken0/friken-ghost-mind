import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {composeStory,validateCondition,validateEchoes,matchesStory,storyAudit,dramaticHandoff} from './storycraft.mjs';
import {createChapter,playChoose,playView,encodePlaySeed,decodePlaySeed,chapterRequest,validateChapter} from './chapters.mjs';
import {responsePacket} from './response.mjs';
const pack=JSON.parse(fs.readFileSync(new URL('./chapters/lot-forty-seven.json',import.meta.url)));
function route({query='ask-prime',next='find-prime',returning='open-line',boundary='partner',law='shelter-law',lastJob='retain-source'}={}){
 let s=createChapter(pack,null,{entropy:19,handle:'SYNTHETIC-DRAMA'});
 while(!s.ending){const scene=s.pack.scenes[s.turn-1],ids={'lot-47':'vote',window:'shade','private-socket':'ask-pip','quiet-return':'small-promise',terms:boundary,custody:'own-up',security:'manual-transfer',causality:'observe','archive-call':query,'archive-question':'verify-question','archive-answer':'accept-address','return-cost':'protect-source',workshop:law,lock:'service','world-reply':'close-viewing',collection:lastJob,'next-address':next,'leave-line':returning};s=playChoose(s,ids[scene.id]);responsePacket(s,playView(s));}
 return s;
}
test('all earlier matching causes compose, exclusions hold, and composing never writes the source',()=>{
 const node={title:'T',scene:'Room',ghost:'Hello',echoes:[{id:'a',when:{all:['a']},ghost:'First'},{id:'b',when:{all:['b'],none:['closed']},ghost:'Second'}]},before=JSON.stringify(node);
 assert.equal(composeStory(node,['a','b']).ghost,'Hello\n\nFirst\n\nSecond');assert.equal(composeStory(node,['a','b','closed']).ghost,'Hello\n\nFirst');assert.equal(JSON.stringify(node),before);
 assert.equal(matchesStory({any:['x','y'],none:['z']},['y']),true);assert.equal(matchesStory({all:['x'],any:['x','y']},[]),false);
});
test('conditional prose is bounded data and rejects executable, contradictory and oversized fragments',()=>{
 for(const c of [{},{all:[]},{all:['a'],none:['a']},{all:()=>true},{eval:'yes'},{any:Array(9).fill('x')}])assert.throws(()=>validateCondition(c));
 assert.throws(()=>validateEchoes([{id:'a',when:{all:['x']},ghost:'x'.repeat(601)}]));
 const p=structuredClone(pack);p.scenes[0].echoes=[{id:'over',when:{all:['x']},ghost:'z'.repeat(600)}];p.scenes[0].ghost='q'.repeat(1500);assert.throws(()=>validateChapter(p),/Composed scene budget/);
 const script=structuredClone(pack);script.scenes[0].echoes=[{id:'execute',when:{all:['x']},ghost:()=>{}}];assert.throws(()=>validateChapter(script));
});
test('old C26.14 pack and choices retain exact canonical bytes through the new composition path',()=>{
 const code=fs.readFileSync(new URL('./fixtures/c26-14-unfinished.seed',import.meta.url),'utf8').trim(),s=decodePlaySeed(code);assert.equal(encodePlaySeed(s),code);assert.equal(s.pack.id,'lot-forty-seven-the-open-seat');assert.equal(s.turn,8);playView(s);assert.equal(encodePlaySeed(s),code);
});
test('maker destination only names Service Nine when the selected archive question established it',()=>{
 const known=route(),unknown=route({query:'ask-window'});assert.notEqual(known.ending.title,unknown.ending.title);assert.ok(playView(known).scene.includes('SERVICE NINE'));assert.ok(!playView(unknown).scene.includes('SERVICE NINE'));assert.ok(known.world.facts.includes('query-maker'));assert.ok(!unknown.world.facts.includes('query-maker'));assert.deepEqual(decodePlaySeed(encodePlaySeed(known)),known);
});
test('the chosen motive and return setting change the actual saved ending and prompt',()=>{
 const invitation=route({next:'visit-world',returning:'seal-copy'}),work=route({next:'help-crew',returning:'leave-note'});
 assert.ok(invitation.ending.title.includes('RING'));assert.ok(invitation.ending.text.includes('deliberate reopening'));assert.ok(!invitation.ending.text.includes('private knock channel is open'));
 assert.ok(work.ending.title.includes('PUMP'));assert.ok(work.ending.text.includes('unfinished work and permissions'));assert.notEqual(invitation.ending.text,work.ending.text);
 const before=encodePlaySeed(work),request=chapterRequest(work);assert.ok(request.dramaticContext.openObligations.includes('next-restore-cargo-return'));assert.ok(!request.instruction.includes('First greet and onboard'));assert.equal(request.dramaticContext.ending.scene,work.ending.text);assert.equal(encodePlaySeed(work),before);
});
test('the last maintenance task settles only its actual debt; unrelated work still travels',()=>{
 const unpaid=route(),paid=route({lastJob:'repay-small-repair'});assert.ok(unpaid.world.threads.includes('repair-pip-clamp'));assert.ok(playView(unpaid).scene.includes('Pip’s connection repair stays'));
 assert.ok(!paid.world.threads.includes('repair-pip-clamp'));assert.ok(paid.world.threads.includes('restore-cargo-return'));assert.ok(playView(paid).scene.includes('One small debt is actually finished'));assert.ok(!playView(paid).scene.includes('Pip’s connection repair stays'));
});
test('a partner can hold Ghost to his own terms and later see a changed method',()=>{
 let s=createChapter(pack,null,{entropy:19});while(s.pack.scenes[s.turn-1].id!=='return-cost'){const id=s.pack.scenes[s.turn-1].id,c=playView(s).choices;s=playChoose(s,id==='terms'?'partner':c.at(-1).id);}
 assert.ok(playView(s).ghost.includes('You told me to ask first'));s=playChoose(s,'ask-vark-rule');assert.ok(playView(s).ghost.includes('ask-first agreement'));assert.ok(playView(s).scene.includes('outside of Ghost’s casing'));assert.ok(s.world.facts.includes('search-feed-locked'));
});
test('story inventory has produced causes for every conditional return and four distinct ending routes',()=>{
 const audit=storyAudit(pack);assert.deepEqual(audit.unproducedFacts,[]);assert.equal(audit.endingRoutes.length,4);assert.ok(audit.conditionalReturns>=25);assert.equal(audit.scenes,18);
 const handoff=dramaticHandoff(route());handoff.witnessedFacts.push('display-only');assert.ok(!route().world.facts.includes('display-only'));
});
