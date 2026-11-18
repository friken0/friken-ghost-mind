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
  const score=typeof source==='string'
   ?await fetch(source).then(response=>{
     if(!response.ok)throw Error('InfiniGen score HTTP '+response.status);
     return response.text();
    })
   :typeof source.score==='string'?source.score:compose(source);
  const output=receiver.Render(score,rate,seconds);
  const bytes=output.byteLength===output.buffer.byteLength?output.buffer:output.slice().buffer;
  let arrangement;
  if(source.ensemble&&seconds>0){
   const {tracks}=JSON.parse(score);
   arrangement={tracks:tracks.length,notes:tracks.reduce((sum,track)=>sum+track.notes.length,0)};
  }
  self.postMessage({id,bytes,arrangement},[bytes]);
 }catch(error){self.postMessage({id,error:String(error.message??error)});}
});
self.postMessage({ready:true});
