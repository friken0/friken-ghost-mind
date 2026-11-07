/* Author-side Kokoro only. Use a local pinned model directory and local runtime. */
import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {TURN_OUT_OF_TIME} from './turn-out-of-time-data.mjs';
import {validateTurnOutOfTime} from './response-theater.mjs';
import {authoredReplyVoiceFrames} from './reply-voice-scenes.mjs';
import {authoredVoiceClips,voiceClipKey} from './speech.mjs';

const [input,runtime,weights,output,previous]=process.argv.slice(2);
if(!output)throw Error('Usage: node render-reply-voice.mjs surreal|REPLY.json KOKORO_JS MODEL_DIR OUTPUT.json [PREVIOUS.json]');
const packet=validateTurnOutOfTime(input==='surreal'?TURN_OUT_OF_TIME:JSON.parse(await readFile(input,'utf8')));
const clips=authoredVoiceClips(authoredReplyVoiceFrames(packet));
const seed=previous?JSON.parse(await readFile(previous,'utf8')):null;
if(seed&&(seed.schema!=='friktal.reply-voice.v1'||seed.reply!==packet.id))throw Error('Prior recording belongs to a different reply');
const {KokoroTTS,env}=await import(pathToFileURL(resolve(runtime)));
env.allowRemoteModels=false;
const engine=await KokoroTTS.from_pretrained(resolve(weights),{device:'cpu',dtype:'q8'});
const recordings={};
for(const [i,{text,voice,speed}] of clips.entries()){
  const key=voiceClipKey(text,voice,speed);
  if(seed&&Object.hasOwn(seed.recordings,key)){recordings[key]=seed.recordings[key];continue;}
  const tokenizer=engine.tokenizer;
  let phonemes='';
  engine.tokenizer=new Proxy(tokenizer,{apply(target,self,args){phonemes=args[0];return Reflect.apply(target,self,args);}});
  let result;
  try{result=await engine.generate(text,{voice,speed});}finally{engine.tokenizer=tokenizer;}
  const {audio,sampling_rate:rate}=result;
  if(rate!==24000||!phonemes||!audio.length||!audio.some(v=>Number.isFinite(v)&&Math.abs(v)>.00001))
    throw Error('Invalid locally rendered Kokoro clip '+(i+1));
  const pcm=Buffer.from(audio.buffer,audio.byteOffset,audio.byteLength);
  const mp3=spawnSync('ffmpeg',['-v','error','-f','f32le','-ar','24000','-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','32k','-f','mp3','pipe:1'],{input:pcm});
  if(mp3.status!==0)throw Error('Voice encoding failed: '+mp3.stderr);
  recordings[key]={audio:mp3.stdout.toString('base64'),phonemes};
  if(i%8===0||i+1===clips.length)console.log('Rendered',i+1,'/',clips.length);
}
await writeFile(output,JSON.stringify({schema:'friktal.reply-voice.v1',reply:packet.id,recordings})+'\n');
