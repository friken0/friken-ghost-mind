import test from 'node:test';import assert from 'node:assert/strict';
import {poseAnsiGarden,ansiMeshEffects,ansiMeshRig,createAnsiMesh,poseAnsiMesh,ansiBonePose} from './ansi-mesh.mjs';
test('nine rigs preserve pinned boundaries, finite vertices and positive triangle area through complete cycles',()=>{
 for(const effect of ansiMeshEffects){const mesh=createAnsiMesh(ansiMeshRig(effect));assert.ok(mesh.vertices.every(v=>v.weights.length<=4&&v.weights.reduce((s,w)=>s+w.w,0)<=1));let moved=false;
  for(let k=0;k<=100;k++){const pose=poseAnsiMesh(mesh,k*.06);for(const v of pose){assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));if(v.u===0||v.u===1||v.v===0||v.v===1){assert.ok(Math.abs(v.x-v.u)<1e-10);assert.ok(Math.abs(v.y-v.v)<1e-10);}if(Math.hypot(v.x-v.u,v.y-v.v)>.001)moved=true;}
   for(const t of mesh.triangles){const [a,b,c]=t.map(i=>pose[i]);assert.ok((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0,effect+' folds its texture');}}
  assert.ok(moved,effect+' must animate');assert.ok(poseAnsiMesh(mesh,3,{held:true}).every(v=>v.x===v.u&&v.y===v.v));
 }
});
test('V-shaped lid rig closes the iris and returns to its authored rest without a discontinuous jump',()=>{const mesh=createAnsiMesh(ansiMeshRig('blink'));assert.equal(mesh.rig.bones.length,4);const open=poseAnsiMesh(mesh,0),closed=poseAnsiMesh(mesh,6*.8),idx=mesh.vertices.findIndex(v=>v.u===.5&&v.v===.25);assert.ok(Math.abs(closed[idx].y-.5)<Math.abs(open[idx].y-.5)*.4);assert.deepEqual(poseAnsiMesh(mesh,0),poseAnsiMesh(mesh,6));const b=mesh.rig.bones[0],a=ansiBonePose(b,.789),c=ansiBonePose(b,.790);assert.ok(Math.hypot(a.b[0]-c.b[0],a.b[1]-c.b[1])<.002);});
test('rig and grid budgets reject malformed or unbounded work',()=>{assert.throws(()=>ansiMeshRig('random'));assert.throws(()=>ansiMeshRig('flame',{period:0}));assert.throws(()=>createAnsiMesh(ansiMeshRig('water'),{columns:1000}));assert.throws(()=>poseAnsiMesh(createAnsiMesh(ansiMeshRig('breathe')),-1));});

test('face rig confines all warps to bronze/glass features; steel face is cell animated',()=>{const mesh=createAnsiMesh(ansiMeshRig('faces'),{columns:24,rows:20});for(let k=0;k<100;k++){const p=poseAnsiMesh(mesh,k*.06);for(const v of p)if(v.u<.34)assert.deepEqual([v.x,v.y],[v.u,v.v]);for(const t of mesh.triangles){const[a,b,c]=t.map(i=>p[i]);assert.ok((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0);}}});


test('music moves coherent plants without noise, boundary drift or folded triangles',()=>{const mesh=createAnsiMesh(ansiMeshRig('breathe'));for(const aspect of [1.1,2.3,3.2])for(let n=0;n<24;n++){const pose=poseAnsiGarden(mesh,n*.15,{aspect,bands:[1,.8]});for(const v of pose)assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));for(const t of mesh.triangles){const [a,b,c]=t.map(i=>pose[i]);assert.ok((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0);}assert.deepEqual(pose,poseAnsiGarden(mesh,n*.15,{aspect,bands:[1,.8]}));}const quiet=poseAnsiGarden(mesh,2,{bands:[0,0]});assert.ok(quiet.every(v=>v.x===v.u&&v.y===v.v));assert.deepEqual(quiet,poseAnsiGarden(mesh,2,{bands:[1,1],held:true}));assert.ok(poseAnsiGarden(mesh,2,{bands:[1,.8]}).some(v=>Math.hypot(v.x-v.u,v.y-v.v)>.01));});
