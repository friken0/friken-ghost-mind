import test from 'node:test';import assert from 'node:assert/strict';
import {compileFacialPerformance,facialCue,facialFields} from './facial-rig.mjs';
test('actual phoneme order is distinguished from estimated timing and device graphemes',()=>{
 const actual=compileFacialPerformance({text:'Bob sees you.',phonemes:'bɑb siːz juː.'});
 assert.equal(actual.source,'kokoro-phoneme-order');assert.equal(actual.timing,'weighted-estimate-on-playback-clock');
 assert.equal(actual.cues[0].kind,'closed');assert.equal(actual.cues[1].kind,'open');assert.ok(actual.cues.some(c=>c.kind==='round'));assert.equal(actual.cues.at(-1).kind,'rest');
 assert.equal(compileFacialPerformance({text:'fish'}).source,'grapheme-approximation');
});
test('all playback positions remain bounded and return to rest at stop instead of looping speech',()=>{
 const plan=compileFacialPerformance({phonemes:'ˈbɑːb θɪŋk fʊl!'});let end=0;
 for(const c of plan.cues){assert.equal(c.start,end);assert.ok(c.end>c.start);end=c.end;}assert.equal(end,1);
 for(let i=-1;i<=101;i++){const cue=facialCue(plan,i/100);for(const key of facialFields)assert.ok(Number.isFinite(cue[key])&&cue[key]>=0&&cue[key]<=1);}
 assert.equal(facialCue(plan,1).jaw,0);assert.equal(facialCue(plan,2).kind,'rest');assert.throws(()=>facialCue(plan,NaN));assert.throws(()=>compileFacialPerformance({text:'x'.repeat(24001)}));
});
test('labial closure, rounded vowel and tongue consonant retain distinct visible articulations',()=>{
 const at=phonemes=>facialCue(compileFacialPerformance({phonemes}),.6);
 assert.ok(at('m').press>.9);assert.ok(at('u').round>.9);assert.ok(at('i').wide>.9);assert.ok(at('l').tongue>.9);assert.ok(at('f').teeth>.9);assert.ok(at('ɑ').jaw>.8);
});
