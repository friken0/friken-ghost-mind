// Admission and compilation of geometry DATA. No eval, fetch or host execution.
import {craftCatalogue as catalogue} from './runtime-catalogue.mjs';
import {CraftEval,CraftCompose,SourceSha256} from './craft.mjs';
const primitives=new Map(catalogue.primitives.map(p=>[p.key,p]));
const angleLimit=Math.fround(Math.PI),minimumExtent=Math.fround(catalogue.limits.minimumHalfExtent);
const fail=message=>{throw new TypeError(`SDF recipe: ${message}`);};
const record=(v,path,keys)=>{
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.getPrototypeOf(v)!==Object.prototype)fail(`${path} must be an object`);
 for(const k of Object.keys(v))if(!keys.includes(k))fail(`${path}.${k} is not admitted`);
};
const text=(v,path,max=120)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u001f]/u.test(v))fail(`${path} must be nonempty text of at most ${max} characters`);return v;};
const number=(v,path,lo,hi)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)fail(`${path} must be finite in ${lo}..${hi}`);return Math.fround(v);};
const vector=(v,n,path,lo,hi)=>{if(!Array.isArray(v)||v.length!==n)fail(`${path} needs ${n} numbers`);return Array.from(v,(x,i)=>number(x,`${path}[${i}]`,lo,hi));};
export function admitRecipe(input){
 record(input,'root',['schema','edition','geometry','seed','intent','parts','sockets','skin']);
 if(input.schema!=='friktal.sdf.recipe.v1'||input.edition!==catalogue.edition)fail('unsupported schema or geometry edition');
 if(input.geometry!==SourceSha256)fail('geometry source hash is unavailable; load its exact library, never silently regenerate');
 const skin=input.skin??{race:'human',seed:0,scale:3};record(skin,'skin',['race','seed','scale']);
 if(!catalogue.races.includes(skin.race))fail('unknown skin race');
 if(!Number.isInteger(skin.seed)||skin.seed<0||skin.seed>2147483647)fail('skin seed must be a nonnegative signed integer');
 number(skin.scale,'skin.scale',.25,32);
 text(input.seed,'seed',128);record(input.intent,'intent',['name','role','culture']);
 for(const k of ['name','role','culture'])text(input.intent[k],`intent.${k}`,256);
 if(!Array.isArray(input.parts)||!input.parts.length||input.parts.length>catalogue.limits.parts)fail(`parts must contain 1..${catalogue.limits.parts} leaves`);
 const ids=new Set();let cost=0,packedCount=0;
 const parts=Array.from(input.parts,(p,i)=>{
  const path=`parts[${i}]`;record(p,path,['id','primitive','material','position','rotation','size','variation','motion','modifiers']);
  text(p.id,`${path}.id`,64);if(ids.has(p.id))fail(`duplicate part ${p.id}`);ids.add(p.id);
  const prim=primitives.get(p.primitive);if(!prim)fail(`${path}.primitive is unknown`);
  cost+=prim.cost;number(p.material,`${path}.material`,1,8);if(!Number.isInteger(p.material))fail('material must be an integer');
  const position=vector(p.position,3,`${path}.position`,-10000,10000),rotation=vector(p.rotation,3,`${path}.rotation`,-angleLimit,angleLimit);
  const size=vector(p.size,3,`${path}.size`,minimumExtent,10000),variation=vector(p.variation,2,`${path}.variation`,0,1);
  let motion={kind:'static',rate:0,phase:0};
  if(p.motion){record(p.motion,`${path}.motion`,['kind','rate','phase']);if(!['static','spin-z'].includes(p.motion.kind))fail('unsupported motion; use a host-owned rig adapter');
   motion={kind:p.motion.kind,rate:number(p.motion.rate,`${path}.motion.rate`,-8,8),phase:number(p.motion.phase,`${path}.motion.phase`,-angleLimit,angleLimit)};
   if(motion.kind==='static'&&(motion.rate!==0||motion.phase!==0))fail('static motion cannot carry spin');
  }
  if(p.modifiers!=null&&(!Array.isArray(p.modifiers)||p.modifiers.length>8))fail('at most 8 local modifiers per part');
  const modifiers=Array.from(p.modifiers??[],(m,j)=>{
   const path=`parts[${i}].modifiers[${j}]`;
   record(m,path,['operation','primitive','material','position','rotation','size','variation']);
   if(!['union','subtract','intersect'].includes(m.operation))fail(`${path}.operation is unknown`);
   const primitive=primitives.get(m.primitive);if(!primitive)fail(`${path}.primitive is unknown`);
   cost+=primitive.cost;
   if(!Number.isInteger(m.material)||m.material<1||m.material>8)fail(`${path}.material must be an integer in 1..8`);
   return {operation:m.operation,primitive:m.primitive,material:m.material,
    position:vector(m.position,3,`${path}.position`,-10000,10000),
    rotation:vector(m.rotation,3,`${path}.rotation`,-angleLimit,angleLimit),
    size:vector(m.size,3,`${path}.size`,minimumExtent,10000),
    variation:vector(m.variation,2,`${path}.variation`,0,1)};
  });
  packedCount+=modifiers.length?modifiers.length+2:1;
  return {id:p.id,primitive:p.primitive,material:p.material,position,rotation,size,variation,motion,...(modifiers.length?{modifiers}:{})};
 });
 if(packedCount>catalogue.limits.parts)fail('expanded scope packet exceeds part admission limit');
 if(cost>catalogue.limits.constructionCost)fail(`construction cost ${cost} exceeds ${catalogue.limits.constructionCost}`);
 const sockets=input.sockets??[];if(!Array.isArray(sockets)||sockets.length>32)fail('at most 32 sockets');
 const names=new Set();const admittedSockets=Array.from(sockets,(s,i)=>{
  record(s,`sockets[${i}]`,['id','part','point','axis']);text(s.id,'socket.id',64);if(names.has(s.id))fail('duplicate socket');names.add(s.id);
  const part=parts.find(p=>p.id===s.part);if(!part)fail('socket references missing part');
  const point=vector(s.point,3,'socket.point',-10000,10000),axis=vector(s.axis,3,'socket.axis',-1,1);
  if(Math.abs(Math.hypot(...axis)-1)>.001)fail('socket axis must be normalized');
  if(point.some((x,j)=>Math.abs(x)>part.size[j]+.00001))fail('socket lies outside its complete part extents');
  return {id:s.id,part:s.part,point,axis};
 });
 return {schema:input.schema,edition:input.edition,geometry:input.geometry,seed:input.seed,skin:{race:skin.race,seed:skin.seed,scale:Math.fround(skin.scale)},intent:{...input.intent},parts,sockets:admittedSockets};
}
export function compileRecipe(input){
 const recipe=admitRecipe(input),packet=[];
 let bound=.5;
 const emit=(p,type,op,size=p.size,variation=p.variation)=>{
  const radius=Math.hypot(...size)+.01;
  packet.push(...[type,op+.9,p.material,radius,...p.position,p.rotation[1],...size,p.rotation[2],p.rotation[0],0,...variation,
   p.motion?.kind==='spin-z'?4:0,0,p.motion?.rate??0,p.motion?.phase??0].map(Math.fround));
  return radius;
 };
 for(const p of recipe.parts){
  let radius;
  if(!p.modifiers?.length)radius=emit(p,primitives.get(p.primitive).id,0);
  else{
   const extent=[...p.size];
   // A rotated modifier fits its circumsphere; only union can enlarge scope.
   for(const m of p.modifiers)if(m.operation==='union'){
    const r=Math.hypot(...m.size);
    for(let j=0;j<3;j++)extent[j]=Math.max(extent[j],Math.abs(m.position[j])+r);
   }
   radius=emit(p,43,0,extent.map(Math.fround),[p.modifiers.length+1,0]);
   emit({...p,position:[0,0,0],rotation:[0,0,0],motion:null},primitives.get(p.primitive).id,4);
   for(const m of p.modifiers)emit(m,primitives.get(m.primitive).id,4+operationCode(m.operation));
  }
  bound=Math.max(bound,Math.hypot(...p.position)+radius);
 }
 return {schema:'friktal.sdf.compiled.v1',edition:recipe.edition,partAbi:catalogue.partAbi,
  recipe,partCount:packet.length/20,packet,bound:bound*1.08};
}
const operationCode=op=>op==='subtract'?2:op==='intersect'?4:0;
function localQuery(part,point){
 const q=point.map((v,i)=>v-part.position[i]);
 rotatePair(q,1,2,-part.rotation[0]);rotatePair(q,0,2,-part.rotation[1]);rotatePair(q,0,1,-part.rotation[2]);return q;
}
function localDistance(part,q){return CraftEval(primitives.get(part.primitive).id,...q,...part.size,...part.variation);}

function rotatePair(p,a,b,t){const c=Math.cos(t),s=Math.sin(t),x=p[a],y=p[b];p[a]=c*x+s*y;p[b]=-s*x+c*y;}
export function socketPose(recipe,id,time=0){
 if(!Number.isFinite(time)||Math.abs(time)>1e6)fail('socket clock must be finite and relative to the host epoch');
 const socket=recipe.sockets.find(s=>s.id===id);if(!socket)fail('missing socket');
 const part=recipe.parts.find(p=>p.id===socket.part);if(!part)fail('socket lost its part');
 const pose=v=>{const q=[...v];if(part.motion.kind==='spin-z')rotatePair(q,0,1,time*part.motion.rate+part.motion.phase);
  rotatePair(q,0,1,part.rotation[2]);rotatePair(q,0,2,part.rotation[1]);rotatePair(q,1,2,part.rotation[0]);return q;};
 return {point:pose(socket.point).map((v,i)=>v+part.position[i]),axis:pose(socket.axis)};
}
// Reference evaluator for witnesses and portable hosts. Native still uses
// production FndShipPrim, not this JS function.
export function recipeDistance(recipe,point,time=0){
 point=vector(point,3,'query',-1e6,1e6);if(!Number.isFinite(time)||Math.abs(time)>1e6)fail('query clock must be finite and relative to the host epoch');
 let distance=1e6;
 for(const part of recipe.parts){
  const q=localQuery(part,point);
  if(part.motion.kind==='spin-z')rotatePair(q,0,1,-(time*part.motion.rate+part.motion.phase));
  let own=localDistance(part,q);
  for(const m of part.modifiers??[])own=CraftCompose(own,localDistance(m,localQuery(m,q)),operationCode(m.operation));
  distance=Math.min(distance,own);
 }
 return distance;
}
