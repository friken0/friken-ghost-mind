// One bounded document worker. Bake once on a recipe change, never in draw().
// Each owner has at most one newest pending request; released owners own no work.
import {materialWorkerSource} from './material-worker-source.mjs?v=race26';
let worker=null,url=null,active=null,serial=0;
const pending=new Map(),owners=new Set(),atlasCache=new Map();
const cacheKey=skin=>JSON.stringify([skin.race,skin.seed,skin.textureSize||128,skin.culture||null]);
const abort=()=>new DOMException('Surface request superseded or released','AbortError');
function finish(){
 if(active||!pending.size)return;
 const [owner,job]=pending.entries().next().value;pending.delete(owner);active={...job,owner,id:++serial};
 if(!worker){
  url=URL.createObjectURL(new Blob([materialWorkerSource],{type:'text/javascript'}));worker=new Worker(url);
  worker.onmessage=({data})=>{
   if(!active||data.id!==active.id)return;
   const job=active;active=null;
   if(!owners.has(job.owner))job.reject(abort());
   else if(data.error)job.reject(new Error(data.error));
   else {atlasCache.delete(cacheKey(job.skin));atlasCache.set(cacheKey(job.skin),data);while(atlasCache.size>4)atlasCache.delete(atlasCache.keys().next().value);job.resolve(data);}
   finish();
  };
  worker.onerror=event=>{
   const error=new Error(event.message||'InfiniTexture worker failed');
   active?.reject(error);active=null;for(const job of pending.values())job.reject(error);pending.clear();
   worker.terminate();worker=null;URL.revokeObjectURL(url);url=null;
  };
 }
 worker.postMessage({id:active.id,skin:active.skin,tile:active.skin.textureSize||128});
}
export function requestMaterialAtlas(owner,skin){
 const previous=pending.get(owner);if(previous){previous.reject(abort());pending.delete(owner);}
 if(active?.owner===owner){active.reject(abort());active=null;worker?.terminate();worker=null;if(url)URL.revokeObjectURL(url);url=null;}
 const cached=atlasCache.get(cacheKey(skin));if(cached){atlasCache.delete(cacheKey(skin));atlasCache.set(cacheKey(skin),cached);owners.add(owner);finish();return Promise.resolve(cached);}

 if(!pending.has(owner)&&pending.size>=8)return Promise.reject(new Error('Surface worker owner budget exceeded'));
 owners.add(owner);
 if(pending.has(owner))pending.get(owner).reject(abort());
 return new Promise((resolve,reject)=>{pending.set(owner,{skin,resolve,reject});finish();});
}
export function releaseMaterialOwner(owner){
 owners.delete(owner);const job=pending.get(owner);if(job){job.reject(abort());pending.delete(owner);}
 if(!owners.size){
  active?.reject(abort());active=null;worker?.terminate();worker=null;
  if(url)URL.revokeObjectURL(url);url=null;
 }
}
