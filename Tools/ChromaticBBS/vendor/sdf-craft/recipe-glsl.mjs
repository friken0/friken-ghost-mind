// Browser adapter for the same admitted data. Emit fixed GLSL function names
// and finite float literals only; no recipe string becomes executable source.
import {compileRecipe} from './recipe.mjs';
import {craftCatalogue} from './runtime-catalogue.mjs';
import {craftShaderSource} from './craft-shader.mjs';
const kinds=new Map(craftCatalogue.primitives.map(p=>[p.key,p.id]));
const f=n=>{const v=Math.fround(n);return Number.isInteger(v)?`${v}.0`:String(v);};
const vec=v=>`vec3(${v.map(f).join(',')})`;
const pose=(p,q)=>`CraftLocal(${q},${vec(p.position)},${vec(p.rotation)})`;
const field=(p,q)=>`CraftEval(${f(kinds.get(p.primitive))},${q}.x,${q}.y,${q}.z,${p.size.map(f).join(',')},${p.variation.map(f).join(',')})`;
export function isLivingRecipe(recipe){return recipe?.schema==='friktal.sdf.recipe.v1';}
export function livingBounds(input){
 const {recipe}=compileRecipe(input),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 const turn=(q,a,b,t)=>{const x=q[a],y=q[b],c=Math.cos(t),s=Math.sin(t);q[a]=c*x+s*y;q[b]=-s*x+c*y;};
 const corners=(lo,hi)=>Array.from({length:8},(_,i)=>[0,1,2].map(j=>(i&(1<<j))?hi[j]:lo[j]));
 const rotate=(q,r)=>{turn(q,0,1,r[2]);turn(q,0,2,r[1]);turn(q,1,2,r[0]);return q;};
 for(const p of recipe.parts){
  const lo=p.size.map(v=>-v),hi=[...p.size];
  for(const m of p.modifiers??[])if(m.operation==='union')for(const c of corners(m.size.map(v=>-v),m.size)){
   const q=rotate(c,m.rotation).map((v,i)=>v+m.position[i]);
   for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],q[i]);hi[i]=Math.max(hi[i],q[i]);}
  }
  if(p.motion.kind==='spin-z'){
   const radius=Math.hypot(Math.max(Math.abs(lo[0]),Math.abs(hi[0])),Math.max(Math.abs(lo[1]),Math.abs(hi[1])));
   lo[0]=lo[1]=-radius;hi[0]=hi[1]=radius;
  }
  for(const c of corners(lo,hi)){
   const q=rotate(c,p.rotation).map((v,i)=>v+p.position[i]);
   for(let i=0;i<3;i++){min[i]=Math.min(min[i],q[i]);max[i]=Math.max(max[i],q[i]);}
  }
 }
 return {min,max};
}

export function recipeShader(input,{leafLimit=32}={}){
 const compiled=compileRecipe(input),recipe=compiled.recipe;
 const leaves=recipe.parts.reduce((n,p)=>n+1+(p.modifiers?.length||0),0);
 // The close-up, analytically marched browser stage has its own honest budget.
 // Large native packets need a baked/profiled viewer rather than silent loss.
 if(leaves>leafLimit)throw new RangeError(`Living Form viewer allows ${leafLimit} visible leaves; this recipe has ${leaves}`);
 const bounds=livingBounds(recipe),center=bounds.min.map((v,i)=>(v+bounds.max[i])*.5);
 const unit=Math.max(.0001,...bounds.max.map((v,i)=>(v-bounds.min[i])*.5));
 const lines=['float LivingField(vec3 pointP,float clockP){float d=1e6;'];
 for(const [i,p] of recipe.parts.entries()){
  lines.push(`vec3 q${i}=${pose(p,'pointP')};`);
  if(p.motion.kind==='spin-z')lines.push(`q${i}.xy=CraftRotate(q${i}.xy,-(clockP*${f(p.motion.rate)}+${f(p.motion.phase)}));`);
  lines.push(`float own${i}=${field(p,`q${i}`)};`);
  for(const [j,m] of (p.modifiers??[]).entries()){
   const q=`m${i}_${j}`;lines.push(`vec3 ${q}=${pose(m,`q${i}`)};`);
   lines.push(`own${i}=CraftCompose(own${i},${field(m,q)},${f(m.operation==='subtract'?2:m.operation==='intersect'?4:0)});`);
  }
  lines.push(`d=min(d,own${i});`);
 }
 lines.push('return d;}');
 // Material resolution is a hit-only query. Each part owns up to eight
 // independent texture pages; its cut interior remains a separate region.
 lines.push('vec3 LivingCoord,LivingNormal,LivingAngles;float LivingTile,LivingSpin;void LivingResolve(vec3 pointP,vec3 normalP,float clockP){float best=1e6;');
 for(const [i,p] of recipe.parts.entries()){
  lines.push(`vec3 q${i}=${pose(p,'pointP')};vec3 n${i}=CraftLocal(normalP,vec3(0.0),${vec(p.rotation)});`);
  if(p.motion.kind==='spin-z')lines.push(`q${i}.xy=CraftRotate(q${i}.xy,-(clockP*${f(p.motion.rate)}+${f(p.motion.phase)}));n${i}.xy=CraftRotate(n${i}.xy,-(clockP*${f(p.motion.rate)}+${f(p.motion.phase)}));`);
  lines.push(`float own${i}=${field(p,`q${i}`)};bool cut${i}=false;`);
  for(const [j,m] of (p.modifiers??[]).entries()){
   const q=`m${i}_${j}`,d=`d${i}_${j}`;lines.push(`vec3 ${q}=${pose(m,`q${i}`)};float ${d}=${field(m,q)};`);
   if(m.operation==='subtract')lines.push(`if(-${d}>own${i})cut${i}=true;`);
   lines.push(`own${i}=CraftCompose(own${i},${d},${f(m.operation==='subtract'?2:m.operation==='intersect'?4:0)});`);
  }
  lines.push(`if(own${i}<best){best=own${i};vec3 local=q${i}/${vec(p.size)};LivingCoord=local+vec3(${f(i*.173)},${f(i*.397)},0.0);LivingNormal=n${i};LivingAngles=${vec(p.rotation)};LivingSpin=${p.motion.kind==='spin-z'?`clockP*${f(p.motion.rate)}+${f(p.motion.phase)}`:'0.0'};float role=cut${i}?2.0:CraftSurfaceRole(${f(kinds.get(p.primitive))},local.x,local.y,local.z,n${i}.x,n${i}.y,n${i}.z,${p.variation.map(f).join(',')});LivingTile=CraftMaterialTile(${f(p.material)},role,CraftSurfaceBank(local.x,local.y,local.z,${p.variation.map(f).join(',')}));}`);
 }
 lines.push('}');
 return {source:craftShaderSource+`
vec2 CraftRotate(vec2 q,float a){float c=cos(a),s=sin(a);return vec2(c*q.x+s*q.y,-s*q.x+c*q.y);}
vec3 CraftForward(vec3 q,vec3 angles){q.xy=CraftRotate(q.xy,angles.z);q.xz=CraftRotate(q.xz,angles.y);q.yz=CraftRotate(q.yz,angles.x);return q;}
vec3 CraftLocal(vec3 q,vec3 origin,vec3 angles){q-=origin;q.yz=CraftRotate(q.yz,-angles.x);q.xz=CraftRotate(q.xz,-angles.y);q.xy=CraftRotate(q.xy,-angles.z);return q;}
`+lines.join('\n'),bounds,center,unit,leaves,geometry:recipe.geometry};
}
