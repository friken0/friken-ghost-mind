// Score JSON crosses the worker boundary. PCM is generated in this browser.
import {dotnet} from './_framework/dotnet.js';

const runtime=await dotnet.create();
const exports=await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName);
const receiver=exports.ScoreReceiver;
let lastComposition;
function compose(source){
 const {race,seed,ensemble=false}=source;
 if(lastComposition?.race===race&&lastComposition.seed===seed&&lastComposition.ensemble===ensemble)return lastComposition.score;
 const score=ensemble?receiver.ComposeEnsemble(race,seed):receiver.Compose(race,seed);
 lastComposition={race,seed,ensemble,score};
 return score;
}
self.addEventListener('message',async ({data})=>{
 const {id,source,rate,seconds}=data;
 try{
  const began=performance.now();
  const score=typeof source==='string'
   ?await fetch(source).then(response=>{
     if(!response.ok)throw Error('InfiniGen score HTTP '+response.status);
     return response.text();
    })
   :typeof source.score==='string'?source.score:compose(source);
  if(!data.stream){
   const output=receiver.Render(score,rate,seconds);
   const bytes=output.slice().buffer;
   const {tracks}=JSON.parse(score);
   self.postMessage({id,bytes,arrangement:{tracks:tracks.length,notes:tracks.reduce((n,t)=>n+t.notes.length,0)}},[bytes]);
   return;
  }
  const song=JSON.parse(score);
  const total=Math.round(song.bars*Math.max(4,song.stepsPerBar)*15/Math.max(40,song.bpm)*rate);
  const arrangement={tracks:song.tracks.length,notes:song.tracks.reduce((sum,t)=>sum+t.notes.length,0),
    seconds:total/rate,composeMs:performance.now()-began,renderMs:0};
  const rendering=performance.now();
  receiver.Open(score,rate);
  let carry=new Float32Array(0);
  for(let start=0;start<total;){
   const frames=Math.min(total-start,rate*(start<6*rate?3:6));
   const bytes=receiver.Window(start,frames);
   const samples=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
   const mixed=carry.length>samples.length?carry:samples;
   const add=mixed===carry?samples:carry;
   for(let i=0;i<add.length;i++)mixed[i]+=add[i];
   const left=new Float32Array(frames),right=new Float32Array(frames);
   for(let i=0;i<frames;i++){left[i]=mixed[2*i];right[i]=mixed[2*i+1];}
   carry=mixed.slice(2*frames);
   arrangement.renderMs=performance.now()-rendering;
   if(start===0)arrangement.firstMs=performance.now()-began;
   self.postMessage({id,start,total,left:left.buffer,right:right.buffer,arrangement},[left.buffer,right.buffer]);
   start+=frames;
  }
 }catch(error){self.postMessage({id,error:String(error.message??error)});}
});
self.postMessage({ready:true});
