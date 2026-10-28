import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnsiSpriteScene,mountAnsiSprites,ansiSpritePresets} from './ansi-sprites.mjs';

test('sprite frames use caller seconds, cap their rate and settle finite sequences without an idle redraw',()=>{
 const s=createAnsiSpriteScene({maxFps:30});s.add('once',{frames:['A','B','C'],fps:120,mode:'once'});
 assert.equal(s.update(0).sprites[0].frameIndex,0);assert.equal(s.update(.01).changed,false);assert.equal(s.update(1/30).sprites[0].frameIndex,1);assert.equal(s.update(2/30).sprites[0].frameIndex,2);assert.equal(s.update(100).changed,false);assert.equal(s.get('once').frameIndex,2);
 assert.throws(()=>s.update(99),/monotonic/);assert.equal(s.get('once',0).frameIndex,0,'historical pure samples do not move the live clock');
 const loop=createAnsiSpriteScene();loop.add('loop',{frames:['1','2','3'],fps:2,duration:1});assert.equal(loop.get('loop',.5).frameIndex,1);assert.equal(loop.get('loop',1).frameIndex,2);assert.equal(loop.get('loop',100).frameIndex,2);
});
test('movement clears old bounds, redraws overlaps in stable order and replacement art invalidates the same frame index',()=>{
 const s=createAnsiSpriteScene({columns:20,rows:10});s.add('back',{frames:['ABCDE'],z:-1}).add('front',{frames:['X'],x:1});
 let u=s.update(0);assert.equal(u.rects.length,1);assert.deepEqual(u.sprites.map(x=>x.id),['back','front']);
 s.set('front',{x:10});u=s.update(.1);assert.deepEqual(u.rects,[{x:1,y:0,width:1,height:1},{x:10,y:0,width:1,height:1}]);
 assert.equal(s.update(.2).changed,false);s.add('front',{frames:['Y'],x:10});assert.equal(s.update(.3).changed,true,'rerolled glyphs at the same location/frame must repaint');
 s.remove('front');u=s.update(.4);assert.deepEqual(u.rects,[{x:10,y:0,width:1,height:1}]);assert.deepEqual(u.sprites.map(x=>x.id),['back']);s.clear();assert.equal(s.size,0);assert.equal(s.update(.5).rects.length,1);assert.equal(s.update(.6).changed,false);
});
test('sprites admit bounded recipes atomically and never execute ANSI escape strings',()=>{
 const s=createAnsiSpriteScene({maxSprites:2,maxCells:4});s.add('a',{frames:['AB']}).add('b',{frames:['CD']});assert.equal(s.cells,4);
 assert.throws(()=>s.add('c',{frames:['X']}),/budget/);assert.throws(()=>s.add('a',{frames:['XYZ']}),/budget/);assert.equal(s.get('a').frame.cells.map(x=>x.glyph).join(''),'AB');
 assert.throws(()=>s.add('a',{frames:Array(17).fill('X')}),/1..16/);assert.throws(()=>s.add('a',{frames:['\x1b[31m']}),/escape/);assert.throws(()=>s.add('a',{frames:[[{x:0,y:0,glyph:'A'},{x:0,y:0,glyph:'B'}]]}),/Duplicate/);assert.throws(()=>s.add('a',{frames:['X'],palette:['#000'],fg:14}),/palette index/);
 assert.throws(()=>s.set('a',{x:3,alpha:5}));assert.equal(s.get('a').x,0,'invalid patches do not partially move a sprite');assert.throws(()=>s.set('a',{frame:20}));assert.throws(()=>s.set('a',{frames:['bad']}));assert.throws(()=>createAnsiSpriteScene({maxCells:8001}));assert.throws(()=>createAnsiSpriteScene({maxFps:60}));
 assert.ok(Object.isFrozen(s.get('a').frame.cells));assert.ok(Object.isFrozen(s.get('a')));
});
test('manual selection, pause/resume, reduced motion and offscreen clipping remain deterministic',()=>{
 const s=createAnsiSpriteScene({columns:10,rows:8});s.add('moth',{...ansiSpritePresets.packetMoth,fps:2,x:-1,y:-1,scale:2});
 assert.deepEqual(s.get('moth').bounds,{x:0,y:0,width:5,height:5});s.update(.5);s.set('moth',{playing:false});assert.equal(s.get('moth',100).frameIndex,1);s.update(100);s.set('moth',{playing:true});assert.equal(s.get('moth',100.5).frameIndex,2);
 s.set('moth',{frame:3});assert.equal(s.get('moth',200).frameIndex,3);s.set('moth',{frame:null});assert.equal(s.get('moth',200,{reducedMotion:true}).frameIndex,1);
 s.set('moth',{x:100});assert.equal(s.get('moth').bounds,null);s.update(101);assert.equal(s.update(102).changed,false,'offscreen animation does not paint the canvas');
});
function fixture(){
 const draws=[],clears=[],nodes=[];let clip;const ctx={globalAlpha:1,save(){},restore(){},beginPath(){},rect(...args){clip=args;},clip(){},clearRect(...args){clears.push(args);},fillRect(){},fillText(...args){draws.push({args,ink:this.fillStyle,font:this.font,clip});}};
 const doc={hidden:false,createElement(type){assert.equal(type,'canvas');const n={dataset:{},style:{},setAttribute(){},getContext(type){assert.equal(type,'2d');return ctx;},remove(){this.removed=true;}};nodes.push(n);return n;}},root={ownerDocument:doc,append(node){this.child=node;}};
 return {root,doc,nodes,ctx,draws,clears};
}
test('explicit mount uses the shared font, paints exact scaled glyph coordinates and no render loop',async()=>{
 const saved=new Map(['requestAnimationFrame','setTimeout'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),f=fixture();let sprite;
 try{
  globalThis.requestAnimationFrame=()=>{throw Error('sprite layer must not create RAF');};globalThis.setTimeout=()=>{throw Error('sprite layer must not create a timer');};
  assert.equal(f.nodes.length,0,'there is no implicit global mount');sprite=mountAnsiSprites(f.root,{columns:20,rows:10,cellWidth:8,cellHeight:16});assert.equal(f.nodes.length,1);await sprite.ready;
  sprite.add('sample',{frames:[[{x:1,y:1,glyph:'X',fg:11}]],x:2,y:3,scale:2,alpha:.5});assert.deepEqual(sprite.update(0),{painted:true,cells:1,rects:1});assert.deepEqual(f.draws[0].args,['X',32,80,16]);assert.match(f.draws[0].font,/32px GhostVGA/);assert.equal(f.draws[0].ink,'#ffff55');assert.deepEqual(f.draws[0].clip,[32,80,16,32],'font ink is clipped to its exact cell, so descenders cannot leave uncleared trails');
  const n=f.draws.length;assert.equal(sprite.update(.5).painted,false);assert.equal(f.draws.length,n);f.doc.hidden=true;sprite.set('sample',{x:5});assert.equal(sprite.update(1).painted,false);f.doc.hidden=false;assert.equal(sprite.update(1).painted,true);
  sprite.destroy();assert.equal(f.root.child.removed,true);assert.equal(sprite.update(2).painted,false);assert.throws(()=>sprite.add('late',{frames:['X']}),/destroyed/);
 }finally{sprite?.destroy();for(const[k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
test('dirty compositor restores the exposed background without repainting every static glyph',async()=>{
 const f=fixture(),s=mountAnsiSprites(f.root,{columns:20,rows:10});await s.ready;s.add('back',{frames:['ABCDE'],z:-1}).add('front',{frames:['X'],x:1});s.update(0);f.draws.length=0;f.clears.length=0;
 s.set('front',{x:10});assert.equal(s.update(.001).painted,false);const update=s.update(.1);assert.equal(update.cells,2);assert.deepEqual(f.draws.map(d=>d.args),[['B',8,0,8],['X',80,0,8]]);assert.deepEqual(f.clears,[[8,0,8,16],[80,0,8,16]]);s.remove('front');assert.equal(s.update(.2).cells,0);s.destroy();
});
