import test from 'node:test';
import assert from 'node:assert/strict';
import {portraitEmergenceAt,speechSurfaceSignal} from './portrait.mjs';
import {validateFaceVoiceSample} from './face-pixel-check.mjs';

test('spatial presentation opens on its own bounded clock and reverses continuously',()=>{
 assert.equal(portraitEmergenceAt(0,1,0),0);assert.equal(portraitEmergenceAt(0,1,.9),1);
 const mid=portraitEmergenceAt(0,1,.45);assert.equal(mid,.5);assert.equal(portraitEmergenceAt(mid,0,0),mid);assert.equal(portraitEmergenceAt(mid,0,1),0);
 assert.throws(()=>portraitEmergenceAt(0,1,NaN));
});
test('measured RMS survives a missing spectrum while device boundaries remain explicitly approximate',()=>{
 assert.deepEqual(speechSurfaceSignal({speaking:true,measured:true,mouth:.37,boundary:.85}),{energy:.37,boundary:0,source:'measured-pcm'});
 assert.deepEqual(speechSurfaceSignal({speaking:true,mouth:.85,boundary:.61}),{energy:0,boundary:.61,source:'device-boundary-approximate'});
 assert.deepEqual(speechSurfaceSignal({speaking:false,measured:true,mouth:1,boundary:1}),{energy:0,boundary:0,source:'rest'});
 assert.deepEqual(speechSurfaceSignal({companion:true,companionMouth:.26}),{energy:.26,boundary:0,source:'measured-pcm'});
 assert.deepEqual(speechSurfaceSignal({companion:true,companionMouth:.8,companionDevice:true}),{energy:0,boundary:.8,source:'device-boundary-approximate'});
});
test('browser pixel probe refuses fabricated or silent calibration provenance',()=>{
 for(const source of ['oscillator','synthetic','device-boundary',''])assert.throws(()=>validateFaceVoiceSample({source,level:.3,bands:[0,0,0,0]}));
 assert.throws(()=>validateFaceVoiceSample({source:'neural-pcm',level:0,bands:[0,0,0,0]}));
 const input={source:'recorded-pcm',level:.35,bands:[0,0,0,0]};const copy=validateFaceVoiceSample(input);copy.bands[0]=1;assert.equal(input.bands[0],0);
});
