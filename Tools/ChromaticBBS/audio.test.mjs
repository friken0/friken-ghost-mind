import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mountAudio,renderInterfaceCue} from './audio.mjs';
import {electricPoint} from './juice.mjs';
import {musicTracks} from './music-data.mjs';

test('music defaults off through connection; explicit boot toggle starts it and reconnect retains the gate',async()=>{
 const names=['window','document','requestAnimationFrame','cancelAnimationFrame','fetch','location'];
 const saved=new Map(names.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const originalTrack=musicTracks[0];
 let downloads=0,starts=0,stops=0;const events={},nodes=new Map();
 const node=()=>({gain:{value:1,setTargetAtTime(){}},connect(){},disconnect(){},setAttribute(){},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},click(){this.listeners.click?.();}});
 try{
  const bytes=Buffer.from('test-only decoded-audio fixture');
  musicTracks[0]={...originalTrack,sha256:createHash('sha256').update(bytes).digest('hex')};
  globalThis.fetch=async()=>{downloads++;return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  globalThis.location={href:'https://example.test/'};globalThis.document={addEventListener(){}};globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  globalThis.window={addEventListener(){},AudioContext:class{state='suspended';currentTime=0;sampleRate=48000;createGain(){return node();}createAnalyser(){return {...node(),frequencyBinCount:1024};}createDynamicsCompressor(){return {...node(),threshold:{},knee:{},ratio:{}};}async resume(){this.state='running';}async decodeAudioData(){return {duration:1,numberOfChannels:1,getChannelData:()=>new Float32Array([.1,.2])};}createBufferSource(){return {...node(),start(){starts++;},stop(){stops++;}};}}};
  const attrs={};const root={setAttribute(k,v){attrs[k]=v;},querySelector(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},addEventListener(type,fn){events[type]=fn;}};
  const audio=mountAudio(root);await audio.unlock();events.pointerdown();await new Promise(r=>setTimeout(r,5));await audio.startMusic();
  assert.equal(downloads,0);assert.equal(starts,0);assert.equal(audio.info.music,'paused');assert.equal(audio.musicOn,false);
  audio.connection(true);assert.equal(attrs['data-carrier-connected'],'true','silent music must not leave connection telemetry stale');assert.equal(starts,0);assert.equal(downloads,0);nodes.get('#cg-boot-music').click();for(let i=0;i<100&&audio.info.music!=='playing';i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(audio.info.music,'playing');assert.equal(starts,1);assert.equal(downloads,1);
  audio.connection(false);assert.equal(stops,1);assert.equal(audio.info.music,'waiting-for-connection');events.pointerdown();await new Promise(r=>setTimeout(r,5));assert.equal(starts,1);
  audio.connection(true);for(let i=0;i<20&&starts===1;i++)await new Promise(r=>setTimeout(r,5));assert.equal(starts,2);assert.equal(downloads,1,'reconnect reuses the verified decoded track');audio.connection(false);
 }finally{musicTracks[0]=originalTrack;for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});

test('electric current stays on its frame at every corner and wraps in both directions',()=>{
 const box=[11,19,370,240],perimeter=1220,before=JSON.stringify(box);
 for(let d=-3000;d<4000;d+=7.125){const [x,y,nx,ny]=electricPoint(box,d);assert.ok(x>=11&&x<=381&&y>=19&&y<=259);assert.ok(x===11||x===381||y===19||y===259);assert.equal(Math.abs(nx)+Math.abs(ny),1);assert.deepEqual(electricPoint(box,d+perimeter),electricPoint(box,d));}
 assert.deepEqual(electricPoint(box,370),[381,19,1,0]);assert.deepEqual(electricPoint(box,610),[381,259,0,1]);assert.equal(JSON.stringify(box),before);
});
test('tactile UI cues are distinct, quiet finite PCM with no unstable sample-rate path',()=>{
 const signatures=new Set();for(const rate of [8000,24000,48000])for(const kind of ['tap','switch','scan','deal']){
  const pcm=renderInterfaceCue(kind,rate);assert.ok(pcm.length<=rate*.2);assert.ok(pcm.every(Number.isFinite));assert.ok(pcm.some(x=>Math.abs(x)>.001));assert.ok(pcm.every(x=>Math.abs(x)<=.022));assert.equal(pcm[0],0);assert.ok(Math.abs(pcm.at(-1))<.00001);signatures.add(createHash('sha256').update(Buffer.from(pcm.buffer)).digest('hex'));
 }assert.equal(signatures.size,12);assert.throws(()=>renderInterfaceCue('unknown'));assert.throws(()=>renderInterfaceCue('tap',200000));
});
