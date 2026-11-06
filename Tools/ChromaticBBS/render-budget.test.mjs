import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameBudget,portraitViewportSize} from '../InfiniEngineSite/ghost-renderer.js';

function advance(budget,{start=1,fps=60,seconds=3}={}){
 let changes=0,time=start;for(let i=0;i<fps*seconds;i++){time+=1000/fps;if(budget.sample(time))changes++;}return {time,changes};
}
test('native mode and healthy devices keep full field density',()=>{
 const native=createFrameBudget(),fast=createFrameBudget({enabled:true});
 advance(native,{fps:10,seconds:12});advance(fast,{fps:60,seconds:12});
 assert.equal(native.scale,1);assert.equal(fast.scale,1);
 assert.throws(()=>createFrameBudget({targetFps:20}));
});
test('startup and isolated stalls cannot lower resolution; sustained slow frames can',()=>{
 const b=createFrameBudget({enabled:true});assert.equal(b.scale,1);
 advance(b,{fps:10,seconds:.6});assert.equal(b.scale,1);
 b.sample(5000);assert.equal(b.scale,1,'hidden/startup gap resets the observation window');
 advance(b,{start:5000,fps:20,seconds:3});assert.ok(b.scale<1&&b.scale>=.375);
 const dims=portraitViewportSize({width:1280,height:800},1,{renderPolicy:{fullResolution:true}},'rect');
 assert.deepEqual([dims.width,dims.height],[1280,800],'output/terminal dimensions stay native');
});
test('fallback remains bounded and recovers cautiously after workload falls',()=>{
 const b=createFrameBudget({enabled:true});const low=advance(b,{fps:8,seconds:9});
 assert.equal(b.scale,.375);const initial=b.scale;
 const healthy=advance(b,{start:low.time,fps:60,seconds:6});assert.equal(b.scale,initial,'no immediate quality oscillation');
 advance(b,{start:healthy.time,fps:60,seconds:20});assert.ok(b.scale>initial&&b.scale<=1);
 const scale=b.scale;b.reset();b.sample(100000);assert.equal(b.scale,scale,'new visibility requires fresh timing, not a forced quality change');
});
