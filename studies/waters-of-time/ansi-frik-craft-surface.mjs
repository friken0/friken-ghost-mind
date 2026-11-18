import {InfiniTexture} from './vendor/sdf-craft/texture-engine.mjs';

// Bounded samples of the canonical physical finish fields. Anatomical UVs
// select a substrate; no independent noise engine or per-frame bake exists.
const size=64,materials=new Map();
for(const slot of [0,1,2,3,4,6,7]){
 const data=new Float32Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(let c=0;c<4;c++)
  data[(y*size+x)*4+c]=InfiniTexture.materialPattern(x/size,y/size,slot,137+slot*113,1,c);
 materials.set(slot,data);
}
export function frikCraftSurface(slot,u,v,channel=0){
 const data=materials.get(slot);
 const x=(u-Math.floor(u))*size,y=(v-Math.floor(v))*size;
 const col=Math.floor(x),row=Math.floor(y),a=x-col,b=y-row;
 const i=(row*size+col)*4+channel,j=(row*size+(col+1)%size)*4+channel;
 const k=(((row+1)%size)*size+col)*4+channel,l=(((row+1)%size)*size+(col+1)%size)*4+channel;
 return (data[i]*(1-a)+data[j]*a)*(1-b)+(data[k]*(1-a)+data[l]*a)*b;
}
