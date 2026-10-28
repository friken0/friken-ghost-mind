import test from 'node:test';
import assert from 'node:assert/strict';
import {ansiBlockPixel,sweepAnsiGlyphBodies,createAnsiSkirmish,mountAnsiSkirmish,ansiSkirmishLimits} from './ansi-skirmish.mjs';

function advance(scene,seconds,start=0){for(let n=0;n<=seconds*60;n++)scene.update(start+n/60);return scene.snapshot();}

test('swept rounds hit occupied glyph pixels, pass empty holes and respect body rotation',()=>{
 assert.equal(ansiBlockPixel('▀',2,2),true);assert.equal(ansiBlockPixel('▀',2,12),false);assert.equal(ansiBlockPixel('▐',1,2),false);assert.equal(ansiBlockPixel('▐',6,2),true);
 const mask=new Uint8Array(8*16);for(let y=0;y<16;y++)mask[y*8]=1;
 const part={x:100,y:100,width:8,height:16,angle:0,visible:true,alpha:1,mask};
 const fast=sweepAnsiGlyphBodies({x:0,y:100},{x:300,y:100},[part]);assert.ok(fast);assert.ok(Math.abs(fast.x-96)<1);
 mask.fill(0);assert.equal(sweepAnsiGlyphBodies({x:0,y:100},{x:300,y:100},[part]),null);
 for(let y=0;y<16;y++)mask[y*8]=1;part.angle=Math.PI/2;
 const rotated=sweepAnsiGlyphBodies({x:100,y:0},{x:100,y:200},[part]);assert.ok(rotated);assert.ok(Math.abs(rotated.y-96)<1);
});

test('identical seed and caller clocks reproduce actual combat, while another seed changes it',()=>{
 const a=createAnsiSkirmish({seed:'same'}).start(),b=createAnsiSkirmish({seed:'same'}).start(),c=createAnsiSkirmish({seed:'another'}).start();
 advance(a,8);advance(b,8);advance(c,8);assert.deepEqual(a.snapshot(),b.snapshot());assert.notDeepEqual(a.snapshot().actors,c.snapshot().actors);
 const state=a.state;assert.equal(state.counts.actors,4);assert.ok(state.blue.score+state.red.score>0);assert.ok(state.blue.hp+state.red.hp<1072);
});

test('limb damage releases its joint chain; chest death releases a ragdoll and awards one kill',()=>{
 const s=createAnsiSkirmish({autoFire:false}).start();s.hit('R1','arm-r',30,{killer:'B1'});let a=s.snapshot().actors.find(a=>a.id==='R1');
 assert.equal(a.alive,true);assert.equal(a.parts.find(p=>p.id==='arm-r').severed,true);assert.equal(a.parts.find(p=>p.id==='hand-r').dynamic,true);assert.equal(a.parts.find(p=>p.id==='chest').dynamic,false);
 s.hit('R1','chest',100,{vx:100,vy:-90,killer:'B1'});a=s.snapshot().actors.find(a=>a.id==='R1');assert.equal(a.alive,false);assert.ok(a.parts.every(p=>p.dynamic));assert.equal(s.state.blue.kills,1);assert.equal(s.state.red.alive,1);
 s.hit('R1','chest',100,{killer:'B1'});assert.equal(s.state.blue.kills,1);
});

test('detached parts retain visible momentum, settle on the floor and only then fade',()=>{
 const s=createAnsiSkirmish({autoFire:false}).start();s.hit('R1','chest',100,{vx:120,vy:-130});advance(s,.5);
 const falling=s.snapshot().actors[2].parts;assert.ok(falling.some(p=>Math.abs(p.vy)>10));assert.ok(falling.every(p=>p.alpha===1));
 advance(s,30,.5);const fallen=s.snapshot().actors[2].parts;assert.ok(fallen.every(p=>!p.visible&&p.alpha===0&&p.settled>1));assert.equal(s.state.counts.debris,0);
});

test('pea, heavy and grenade shots are distinct and all resource counts remain bounded',()=>{
 const s=createAnsiSkirmish({autoFire:false}).start();for(const name of ['pea','heavy','grenade'])assert.equal(s.fire('B1',name,{x:900,y:650}),true);
 const first=s.snapshot().bullets;assert.deepEqual(first.map(b=>b.glyph),['.','●','*']);assert.ok(first[2].vy<0);assert.ok(first[1].damage>first[0].damage);
 for(let n=0;n<70;n++)s.fire('B1','pea',{x:900,y:650});assert.equal(s.state.counts.bullets,ansiSkirmishLimits.bullets);assert.equal(s.fire('B1','heavy',{x:900,y:650}),false);
 for(let n=0;n<90;n++)s.hit('R1','arm-l',1);assert.equal(s.state.counts.debris,ansiSkirmishLimits.debris);
 advance(s,2);assert.ok(s.state.counts.bullets<=48&&s.state.counts.debris<=128);assert.ok(s.drainEvents().length<=48);
});

test('pause excludes hidden time, context receipts cannot dictate winner and clocks are bounded',()=>{
 const s=createAnsiSkirmish({autoFire:false}).start({roll:20,target:1,success:true});s.update(0);s.update(.1);const t=s.state.time;s.pause(true);s.update(100);s.pause(false);s.update(101);assert.equal(s.state.time,t);s.update(101.1);assert.ok(s.state.time>t&&s.state.time<t+.11);
 assert.equal(s.state.winner,null);assert.equal(s.snapshot().context.success,true);assert.throws(()=>s.update(100),/monotonic/);assert.throws(()=>s.update(NaN));assert.throws(()=>s.start({text:'x'.repeat(9000)}));
 s.reset('fresh');assert.equal(s.state.started,false);assert.equal(s.state.blue.score,0);assert.equal(s.snapshot().context,null);
});

test('grenades arc, bounce from the floor, then emit one finite explosion',()=>{
 const s=createAnsiSkirmish({autoFire:false}).start();s.fire('B1','grenade',{x:1200,y:650});advance(s,1.4);
 const b=s.snapshot().bullets[0];assert.ok(b);assert.ok(b.vy<0,'the falling grenade bounced upward');assert.ok(b.y<s.snapshot().floor);
 s.drainEvents();advance(s,.5,1.4);assert.equal(s.snapshot().bullets.length,0);assert.equal(s.drainEvents().filter(e=>e.kind==='explosion').length,1);assert.ok(s.state.counts.debris>0);
});

test('canvas host uses one uniform aspect fit, exact glyph clips and no independent scheduling',async()=>{
 const calls=[],canvases=[];const doc={hidden:false,createElement(tag){assert.equal(tag,'canvas');let current='█';const context=new Proxy({
  fillText(g){current=g;calls.push(['glyph',g]);},scale(x,y){calls.push(['scale',x,y]);},rect(...a){calls.push(['clip',...a]);},getImageData(){const data=new Uint8ClampedArray(8*16*4);for(let y=0;y<16;y++)for(let x=0;x<8;x++)data[(y*8+x)*4+3]=ansiBlockPixel(current,x,y)?255:0;return {data};}
 },{get(t,k){return k in t?t[k]:(()=>{});},set(t,k,v){t[k]=v;return true;}});const c={width:0,height:0,dataset:{},style:{},setAttribute(){},getContext(){return context;},remove(){this.removed=true;}};canvases.push(c);return c;}};
 const root={ownerDocument:doc,append(){},getBoundingClientRect(){return {width:1000,height:300};}};
 const view=mountAnsiSkirmish(root,{autoFire:false});await view.ready;view.start();view.update(0);view.update(.1);
 assert.equal(view.canvas.width,1000);assert.equal(view.canvas.height,300);assert.ok(calls.filter(c=>c[0]==='scale').every(c=>c[1]===c[2]));assert.equal(Number(view.canvas.dataset.fitScale),300/768);assert.ok(calls.some(c=>c[0]==='clip'&&c[3]===8&&c[4]===16));
 view.destroy();assert.equal(view.canvas.removed,true);assert.deepEqual(view.update(2),{painted:false});
});

test('privateer boarding preserves live contenders until the authoritative causal result resolves',async()=>{const {causalResult}=await import('./causality.mjs');for(const die of [.01,18]){const r=causalResult(die,5,12.6,{precision:2,below:.2,above:.3,bonus:{signal:1}}),s=createAnsiSkirmish({seed:'boarding',autoFire:false});s.start({causality:r});s.hit('B1','chest',200);s.hit('B2','head',200);assert.equal(s.state.blue.alive,2,'cosmetic damage cannot kill the canonical winner early');const resolved=s.resolve();assert.equal(resolved.winner,r.success?'blue':'red');assert.equal(s.resolve().winner,resolved.winner);assert.ok(s.snapshot().actors.filter(a=>a.team!==(r.success?'blue':'red')).every(a=>a.parts.every(p=>p.dynamic)));}});
