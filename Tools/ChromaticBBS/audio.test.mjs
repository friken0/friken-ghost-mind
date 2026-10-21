import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mountAudio} from './audio.mjs';
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
  const root={querySelector(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},addEventListener(type,fn){events[type]=fn;}};
  const audio=mountAudio(root);await audio.unlock();events.pointerdown();await new Promise(r=>setTimeout(r,5));await audio.startMusic();
  assert.equal(downloads,0);assert.equal(starts,0);assert.equal(audio.info.music,'paused');assert.equal(audio.musicOn,false);
  audio.connection(true);assert.equal(starts,0);assert.equal(downloads,0);nodes.get('#cg-boot-music').click();for(let i=0;i<100&&audio.info.music!=='playing';i++)await new Promise(r=>setTimeout(r,5));
  assert.equal(audio.info.music,'playing');assert.equal(starts,1);assert.equal(downloads,1);
  audio.connection(false);assert.equal(stops,1);assert.equal(audio.info.music,'waiting-for-connection');events.pointerdown();await new Promise(r=>setTimeout(r,5));assert.equal(starts,1);
  audio.connection(true);for(let i=0;i<20&&starts===1;i++)await new Promise(r=>setTimeout(r,5));assert.equal(starts,2);assert.equal(downloads,1,'reconnect reuses the verified decoded track');audio.connection(false);
 }finally{musicTracks[0]=originalTrack;for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
