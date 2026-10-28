import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnsiAnimator,ansiEffects,drawAnsiCell} from './ansi-animation.mjs';

test('each transition has exact endpoints and finite bounded cell layers',()=>{
  for(const effect of ansiEffects){
    const animation=createAnsiAnimator({seed:713,maxRate:60});
    animation.set('cell',{glyph:'A',fg:11,bg:0});
    animation.tween('cell',{glyph:'B',fg:14},{at:100,duration:400,wait:50,effect});
    assert.equal(animation.sample('cell',100).glyph,'A');
    assert.equal(animation.sample('cell',550).glyph,'B');
    assert.equal(animation.sample('cell',550).settled,true);
    for(let time=0;time<=600;time++){
      const frame=animation.sample('cell',time);
      assert.ok(frame.layers.length>=1&&frame.layers.length<=2);
      for(const layer of frame.layers){
        assert.equal([...layer.glyph].length,1,effect);
        for(const key of ['alpha','scaleX','scaleY'])assert.ok(Number.isFinite(layer[key])&&layer[key]>=0&&layer[key]<=4,effect+' '+key);
      }
    }
  }
  const flip=createAnsiAnimator({maxRate:60});flip.set('x',{glyph:'A'}).tween('x',{glyph:'B'},{duration:400,effect:'flip'});
  assert.ok(flip.sample('x',200).layers[0].scaleX<1e-10);
  const shrink=createAnsiAnimator({maxRate:60});shrink.set('x',{glyph:'A'}).tween('x',{glyph:'B'},{duration:400,effect:'shrink-return'});
  assert.equal(shrink.sample('x',200).layers[0].scaleY,0);
});

test('playlists honour hold interval, finite repeats, once and seeded choose-once',()=>{
  const animation=createAnsiAnimator({seed:'same-host',maxRate:60});
  const frames=[{glyph:'A',fg:10},{glyph:'B',fg:11},{glyph:'C',fg:14}];
  animation.cycle('line',frames,{at:100,interval:200,transition:80,mode:'once'});
  assert.equal(animation.sample('line',220).glyph,'A');
  assert.equal(animation.sample('line',300).glyph,'B');
  assert.equal(animation.sample('line',500).glyph,'C');
  assert.equal(animation.sample('line',9000).settled,true);
  animation.cycle('repeat',frames,{interval:200,transition:80,duration:900,settle:'first'});
  assert.equal(animation.sample('repeat',900).glyph,'A');
  assert.equal(animation.sample('repeat',900).settled,true);
  animation.cycle('choice',frames,{mode:'choose-once'});
  const mirror=createAnsiAnimator({seed:'same-host'});mirror.cycle('choice',frames,{mode:'choose-once'});
  assert.deepEqual(animation.sample('choice',200),mirror.sample('choice',1000));
  for(const key of ['repeat','line'])assert.equal(animation.sample(key,101,{reducedMotion:true}).settled,true);
});

test('dirty cells settle and unregister without polling static text',()=>{
  const a=createAnsiAnimator();a.set('static',{glyph:'S'});a.set('live',{glyph:'A'}).tween('live',{glyph:'B'},{duration:100,effect:'scan'});
  assert.deepEqual(a.changed(0).map(x=>x.id).sort(),['live','static']);
  assert.deepEqual(a.changed(1),[],'sub-rate input cannot create another paint');
  assert.deepEqual(a.changed(101).map(x=>x.id),['live']);
  assert.equal(a.stats.active,0);assert.deepEqual(a.changed(1000),[]);
  a.unregister('live');assert.deepEqual(a.changed(1001),[{id:'live',frame:null}]);
  assert.equal(a.unregister('missing'),false);assert.throws(()=>a.changed(99),/monotonic/);
  a.clear();assert.equal(a.size,0);assert.deepEqual(a.changed(0),[]);
});

test('reduced motion settles once and can resume an admitted live cycle',()=>{
  const a=createAnsiAnimator();a.cycle('live',['A','B'],{interval:200});
  assert.equal(a.changed(0,{reducedMotion:true})[0].frame.glyph,'B');
  assert.deepEqual(a.changed(100,{reducedMotion:true}),[]);
  const resumed=a.changed(120,{reducedMotion:false});assert.equal(resumed.length,1);assert.equal(resumed[0].frame.settled,false);
});

test('admission caps cells, rates, playlist and control data',()=>{
  const a=createAnsiAnimator({maxCells:2,maxRate:10});a.set('a',{glyph:'A'});a.set('b',{glyph:'B'});
  assert.throws(()=>a.set('c',{glyph:'C'}),/budget/);a.unregister('b');a.set('c',{glyph:'C'});
  assert.throws(()=>a.cycle('a',Array(17).fill('A')),/playlist/);
  assert.throws(()=>a.set('a',{glyph:'\x1b'}),/printable/);
  assert.throws(()=>a.set('a',{glyph:'AB'}),/glyph/);
  assert.throws(()=>a.tween('a',{glyph:'A'},{duration:Infinity}),/duration/);
  assert.throws(()=>a.cycle('a',['A','B'],{duration:Infinity}),/duration/);
  assert.throws(()=>createAnsiAnimator({maxCells:8001}),/budget/);
  a.cycle('a',['A','B'],{interval:1,transition:1});
  assert.deepEqual(a.sample('a',0),a.sample('a',99),'rate is capped at10 changes/s');
});

test('the paint helper reuses the caller font and clips dither/scan to a cell',()=>{
  const calls=[],ctx={globalAlpha:1,fillStyle:'white',
    save(){calls.push(['save']);},restore(){calls.push(['restore']);},beginPath(){},rect(...v){calls.push(['rect',...v]);},clip(){calls.push(['clip']);},clearRect(...v){calls.push(['clear',...v]);},fillRect(...v){calls.push(['fill',...v]);},translate(...v){calls.push(['translate',...v]);},scale(...v){calls.push(['scale',...v]);}};
  const a=createAnsiAnimator({maxRate:60});a.set('x',{glyph:'A',fg:14,bg:0}).tween('x',{glyph:'B'},{duration:400,effect:'dither'});
  const printed=[];drawAnsiCell(ctx,a.sample('x',200),{x:32,y:64,width:16,height:32,palette:Array(16).fill('cyan'),paintGlyph(...args){printed.push(args.slice(1));}});
  assert.equal(printed.length,2);assert.deepEqual(printed.map(x=>x[0]),['A','B']);
  assert.deepEqual(printed[0].slice(1),[-8,-16,16,32]);
  assert.equal(calls.filter(x=>x[0]==='clip').length,3);
  assert.equal(calls.filter(x=>x[0]==='save').length,calls.filter(x=>x[0]==='restore').length);
  assert.throws(()=>drawAnsiCell(ctx,a.sample('x',200),{paintGlyph(){}}),/palette/);
});

test('8000 admitted cells retain bounded work and idle checks do no repaint',t=>{
  const a=createAnsiAnimator();const started=performance.now();
  for(let i=0;i<8000;i++)a.set('cell-'+i,{glyph:'─',fg:14});
  assert.equal(a.changed(0).length,8000);
  const initialMs=performance.now()-started,at=performance.now();
  for(let i=1;i<=1000;i++)assert.equal(a.changed(i).length,0);
  const idleMs=performance.now()-at;
  assert.ok(initialMs<2000&&idleMs<2000,'bounded diagnostic work, not a60FPS claim');
  t.diagnostic('8000 static cells: '+initialMs.toFixed(2)+'ms first paint;1000 idle polls: '+idleMs.toFixed(2)+'ms / no changes');
});

test('measured cymatics colour and grow display layers, while silence and reduced motion keep source intact',async()=>{const {ansiCymaticCell}=await import('./ansi-animation.mjs'),cell={char:'▓',fg:10,bg:2},before=JSON.stringify(cell);assert.equal(ansiCymaticCell(cell),null);const frame=ansiCymaticCell(cell,{bands:[.8,.4,.6],rms:.2,time:3,x:12,y:8,style:'foliage',intensity:.8});assert.equal(frame.cymatic,true);assert.ok(frame.layers[0].scaleY>1);assert.ok(frame.layers[0].hue>=0&&frame.layers[0].hue<360);assert.equal(ansiCymaticCell(cell,{bands:[1],rms:1,reduced:true}),null);assert.equal(JSON.stringify(cell),before);});
