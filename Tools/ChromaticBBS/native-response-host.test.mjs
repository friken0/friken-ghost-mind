import test from 'node:test';
import assert from 'node:assert/strict';
import {mountAnsiTerminal} from './ansi-terminal.mjs';
import {nativeReplyProgram} from './native-response-program.mjs';
import {TURN_OUT_OF_TIME as packet} from './turn-out-of-time-data.mjs';
import {nativeTerminalGrid,nativeTerminalFit,nativeTerminalCell,normalizeNativeProgram,mountNativeResponseHost} from './native-response-host.mjs';

function fakeHost(){
 const raf=new Map(),paint=[],observers=[];let serial=0;
 const context={globalAlpha:1,fillRect(...args){paint.push(['fill',...args]);},clearRect(...args){paint.push(['clear',...args]);},fillText(...args){paint.push(['glyph',...args]);},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},drawImage(...args){paint.push(['image',...args]);}};
 class Node{constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.dataset={};this.style={};this.attrs={};this.events=new Map();this.value='';this.selectionStart=this.selectionEnd=0;this.rect={left:20,top:40,width:1000,height:900,right:1020,bottom:940};}append(...nodes){for(const n of nodes){n.remove?.();n.parentElement=this;this.children.push(n);}}remove(){if(this.parentElement){const a=this.parentElement.children,i=a.indexOf(this);if(i>=0)a.splice(i,1);this.parentElement=null;}}setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}addEventListener(k,fn){const a=this.events.get(k)||[];a.push(fn);this.events.set(k,a);}fire(k,values={}){const event={target:this,key:'',preventDefault(){this.prevented=true;},stopPropagation(){},...values};for(const fn of this.events.get(k)||[])fn(event);return event;}getContext(type,options){this.contextOptions=options;return context;}getBoundingClientRect(){return this.rect;}focus(){this.ownerDocument.activeElement=this;this.fire('focus');}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b;}}
 const doc={hidden:false,activeElement:null,events:new Map(),createElement:tag=>new Node(tag,doc),addEventListener(k,fn){const a=this.events.get(k)||[];a.push(fn);this.events.set(k,a);}};
 const win={SDUI:{press(node,fn){node.press=fn;return node;},grant(){}},requestAnimationFrame(fn){raf.set(++serial,fn);return serial;},cancelAnimationFrame(id){raf.delete(id);},addEventListener(){}};doc.defaultView=win;
 const root=doc.createElement('div'),overlayRoot=doc.createElement('div'),canvas=doc.createElement('canvas'),terminal=mountAnsiTerminal({canvas});
 return {doc,win,root,overlayRoot,canvas,terminal,context,paint,raf,observers,flush(now){const [id,fn]=raf.entries().next().value;raf.delete(id);fn(now);},ResizeObserver:class{constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.closed=true;}}};
}

test('native80×25 canvas letterboxes without stretching or clipped cell edges',()=>{
 for(const [width,height]of [[1554,600],[1554,900],[700,1200],[375,680],[2560,1440]]){
  const fit=nativeTerminalFit({left:17,top:31,width,height});assert.ok(Math.abs(fit.width/fit.height-1.6)<1e-12);assert.ok(fit.left>=17&&fit.top>=31&&fit.right<=width+17+1e-9&&fit.bottom<=height+31+1e-9);
  assert.deepEqual(nativeTerminalCell(fit,fit.left+.01,fit.top+.01),{row:1,column:1});assert.deepEqual(nativeTerminalCell(fit,fit.right-.01,fit.bottom-.01),{row:25,column:80});assert.equal(nativeTerminalCell(fit,fit.right,fit.bottom),null);
 }
});
test('program admission uses1-based cell rectangles and bounds actual editable values',()=>{
 const p=normalizeNativeProgram({text:'\x1b[2J',hotspots:[{id:'nav:map',row:25,column:70,width:9,key:'Escape'}],fields:[{id:'name',row:5,column:3,width:20,height:1,value:'Surreal',maxLength:40}]});assert.equal(p.hotspots[0].height,1);assert.equal(p.fields[0].value,'Surreal');
 assert.throws(()=>normalizeNativeProgram({...p,hotspots:[{id:'bad',row:0,column:1,width:2}]}));assert.throws(()=>normalizeNativeProgram({...p,fields:[{id:'too-long',row:1,column:1,width:80,value:'x'.repeat(41),maxLength:40}]}));assert.throws(()=>normalizeNativeProgram({...p,fields:[...p.fields,...p.fields]}));
});
test('one host retains the exact boot canvas, streams at240cps and projects native fields onto the same grid',()=>{
 const f=fakeHost(),old=globalThis.ResizeObserver;globalThis.ResizeObserver=f.ResizeObserver;const actions=[],answers=[],focus=[];
 try{
  f.terminal.setMode('prompt');const host=mountNativeResponseHost(f.root,{terminal:f.terminal,onAction:id=>actions.push(id),onInput:(id,v)=>answers.push([id,v]),onFocus:id=>focus.push(id)});
  assert.equal(host.canvas,f.canvas);assert.equal(f.raf.size,1);
  host.show({text:'\x1b[2J\x1b[1;1H'+('X'.repeat(600)),hotspots:[{id:'verb:read',row:22,column:3,width:10,key:'1'}],fields:[{id:'name',row:5,column:10,width:20,height:1,value:'Surreal'}]});assert.equal(f.terminal.mode,'program');assert.ok(!f.terminal.buffer.text.includes('Friken.Ghost.exe'));
  f.flush(1000);f.flush(2000);assert.equal(f.canvas.dataset.serialBytes,'240');assert.equal(f.raf.size,1);const field=host.element.children.find(n=>n.dataset.ansiField==='name'),rect=host.rect();assert.equal(parseFloat(field.style.left),rect.left-f.root.rect.left+9*rect.cellWidth);assert.equal(parseFloat(field.style.top),rect.top-f.root.rect.top+4*rect.cellHeight);assert.equal(field.press,undefined,'native editing is never swallowed by a container press binder');field.value='Friken';field.fire('input');assert.deepEqual(answers,[['name','Friken']]);
  host.show({...host.program,text:'\x1b[2J\x1b[22;3H[ READ ]'},{immediate:true});f.canvas.rect=rect;host.canvas.press({clientX:rect.left+3*rect.cellWidth,clientY:rect.top+21.5*rect.cellHeight});assert.deepEqual(actions,['verb:read']);host.element.fire('keydown',{key:'Escape'});assert.equal(actions.at(-1),'back');host.element.fire('keydown',{key:'1'});assert.equal(actions.at(-1),'verb:read');
  field.focus();field.setSelectionRange(2,4);host.show(host.program,{immediate:true});assert.deepEqual([field.selectionStart,field.selectionEnd],[2,4]);host.destroy();assert.equal(f.raf.size,0);assert.equal(f.root.children.length,0);assert.ok(f.observers.every(o=>o.closed));
 }finally{if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old;}
});
test('caption overlay is another transparent ANSI terminal with only a cell-aligned invisible BACK action',()=>{
 const f=fakeHost(),old=globalThis.ResizeObserver;globalThis.ResizeObserver=f.ResizeObserver;const actions=[];
 try{const host=mountNativeResponseHost(f.root,{terminal:f.terminal,overlayRoot:f.overlayRoot,onAction:id=>actions.push(id)});host.caption('The line is still open.',{speaker:'companion',visible:true});assert.equal(host.captionTerminal.canvas.contextOptions.alpha,true);assert.equal(host.captionTerminal.canvas.dataset.transparent,'true');assert.match(host.captionTerminal.buffer.text,/ELSE/);assert.match(host.captionTerminal.buffer.text,/The line is still open/);assert.equal(f.raf.size,1);const back=f.overlayRoot.children.find(n=>n.tagName==='BUTTON');assert.equal(back.style.opacity,undefined);assert.match(back.style.cssText,/opacity:0/);back.press();assert.deepEqual(actions,['overlay-back']);host.overlay(false);assert.equal(host.captionTerminal.canvas.hidden,true);host.destroy();assert.equal(f.overlayRoot.children.length,0);}finally{if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old;}
});

test('actual ANSI subtitle glyph positions stay fixed; waits and stale completions cannot erase or replace them',()=>{
 const f=fakeHost(),old=globalThis.ResizeObserver;globalThis.ResizeObserver=f.ResizeObserver;let host;
 try{
  host=mountNativeResponseHost(f.root,{terminal:f.terminal,overlayRoot:f.overlayRoot});
  const text='A stable line stays exactly here while every word is spoken. The next sentence waits its turn.';
  let programs=0;const set=host.captionTerminal.setProgram;host.captionTerminal.setProgram=(...args)=>{programs++;return set(...args);};
  const cells=()=>host.captionTerminal.buffer.cells.slice(21*80+2,21*80+78),glyphs=()=>cells().map(c=>c.char).join('');
  host.captionProgress(text,{index:0,state:'waiting',visible:true});assert.equal(programs,0);assert.equal(host.captionTerminal.canvas.hidden,true);
  host.captionProgress(text,{index:0,state:'speaking',visible:true});const anchored=glyphs();assert.match(anchored,/A stable line stays exactly here/);assert.equal(cells()[0].fg,8,'unheard text is dim, never marked spoken');assert.equal(programs,1,'opening does not rebuild the same page twice');
  for(const index of [1,3,12,23,48]){host.captionProgress(text,{index,state:'speaking',visible:true});assert.equal(glyphs(),anchored);assert.equal(cells()[0].fg,15);}
  const before=programs,frame=host.captionFrame;
  host.captionProgress('Else must not appear until playback starts.',{speaker:'ELSE',field:'companion',index:0,state:'waiting',visible:true});assert.equal(programs,before);assert.equal(host.captionFrame,frame);assert.equal(glyphs(),anchored);assert.equal(host.captionTerminal.canvas.hidden,false);
  host.captionProgress(text,{index:text.length,state:'complete',visible:true});const finished=glyphs();assert.match(finished,/sentence waits its turn/);assert.match(host.captionTerminal.buffer.text,/The next/);
  host.captionProgress('Unheard.',{speaker:'ELSE',field:'companion',index:8,state:'complete',visible:true});assert.equal(glyphs(),finished);
  f.flush(1000);f.flush(5000);assert.equal(glyphs(),finished);assert.equal(host.captionTerminal.canvas.hidden,false,'no elapsed-time subtitle dismissal');
  host.captionProgress('Else now speaks.',{speaker:'ELSE',field:'companion',index:0,state:'speaking',visible:true});assert.match(host.captionTerminal.buffer.text,/ELSE/);assert.match(glyphs(),/Else now speaks/);assert.equal(cells()[0].fg,8);
  host.overlay(false);host.captionProgress('Else now speaks.',{speaker:'ELSE',field:'companion',index:15,state:'complete',visible:true});assert.equal(host.captionTerminal.canvas.hidden,true,'Back revokes delayed completion');
 }finally{host?.destroy();if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old;}
});

test('status patches and focus cannot finish a partial transfer; explicit reveal stays revealed across later ticks',()=>{
 const f=fakeHost(),old=globalThis.ResizeObserver;globalThis.ResizeObserver=f.ResizeObserver;const focus=[];let host;
 try{
  host=mountNativeResponseHost(f.root,{terminal:f.terminal,onFocus(id){focus.push(id);host.show(host.program,{immediate:true});}});
  const text='\x1b[2J\x1b[1;1HREAD '+('x'.repeat(700));host.show({text,hotspots:[{id:'read',row:1,column:1,width:4,key:'r'}]});f.flush(1000);f.flush(2000);assert.equal(f.canvas.dataset.serialBytes,'240');assert.equal(f.terminal.complete,false);
  host.patch('\x1b[25;3HSTATUS');assert.equal(f.canvas.dataset.serialBytes,'240');assert.equal(f.terminal.complete,false);assert.ok(!f.terminal.buffer.text.includes('STATUS'));
  const rect=host.rect();host.element.fire('pointermove',{clientX:rect.left+rect.cellWidth,clientY:rect.top+rect.cellHeight/2});assert.deepEqual(focus,[]);host.element.fire('keydown',{key:'Tab'});assert.deepEqual(focus,[]);assert.equal(f.terminal.complete,false);
  f.flush(3000);assert.equal(f.canvas.dataset.serialBytes,'480');assert.ok(!f.terminal.buffer.text.includes('STATUS'));f.flush(5000);assert.equal(f.terminal.complete,true);assert.deepEqual(focus,['read']);assert.match(f.terminal.buffer.text,/STATUS/);const completeCount=f.canvas.dataset.serialBytes;f.flush(6000);assert.equal(f.canvas.dataset.serialBytes,completeCount);assert.equal(f.terminal.complete,true);
  host.show({text:text+' NEW',hotspots:[]},{immediate:false});assert.equal(f.terminal.complete,false);assert.equal(f.canvas.dataset.serialBytes,'0');f.flush(7000);assert.equal(f.canvas.dataset.serialBytes,'240');host.reveal();assert.equal(f.terminal.complete,true);f.flush(8000);assert.equal(f.terminal.complete,true);host.destroy();
 }finally{host?.destroy();if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old;}
});


test('the actual generated reply atlas is admitted and drawn by the retained real ANSI terminal',()=>{
 const f=fakeHost(),old=globalThis.ResizeObserver;globalThis.ResizeObserver=f.ResizeObserver;let host;
 try{
  const program=nativeReplyProgram({packet,current:'hello',screen:'map',progress:{rooms:[],score:0,ready:false,percent:0},selectedTelling:null,answers:{},voiceOn:true,musicOn:false});
  assert.ok(program.hotspots.length>16,'regression requires the full atlas, not a small mocked command bar');
  host=mountNativeResponseHost(f.root,{terminal:f.terminal});host.show(program,{immediate:true});
  assert.equal(host.canvas,f.canvas);assert.equal(host.terminal.complete,true);assert.equal(host.terminal.hotspots.length,program.hotspots.length);
  assert.match(host.terminal.buffer.text,/SCORE 0000/);assert.match(host.terminal.buffer.text,/DOORS 0\/6/);
  assert.equal(host.terminal.buffer.cells[0].char,'╔');assert.equal(host.terminal.buffer.cells[1999].char,'╝');
  assert.ok(f.paint.some(p=>p[0]==='glyph'&&p[1]==='╔'),'actual terminal glyph printer ran');
  const admitted=Array.from({length:96},(_,i)=>({id:'bounded-'+i,row:1,column:1,width:1,height:1}));
  assert.doesNotThrow(()=>host.terminal.setProgram('bounded',{hotspots:admitted}));
  assert.throws(()=>host.terminal.setProgram('over-budget',{hotspots:[...admitted,admitted[0]]}),/Bounded ANSI program/);
 }finally{host?.destroy();if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old;}
});

test('the host passes actual art tracks to its retained terminal and never animates unrelated control cells',()=>{
 const f=fakeHost(),old=globalThis.ResizeObserver;globalThis.ResizeObserver=f.ResizeObserver;let host;
 try{
  const program=nativeReplyProgram({packet,current:'hello',screen:'map',progress:{rooms:[],score:0,ready:true,percent:0},selectedTelling:null,answers:{},voiceOn:true,musicOn:false});
  const animated=new Set(program.animation.tracks.map(t=>(t.row-1)*80+t.column-1));assert.ok(animated.size>0);
  host=mountNativeResponseHost(f.root,{terminal:f.terminal});host.show(program,{immediate:true});f.flush(1000);f.flush(1200);
  assert.equal(Number(f.canvas.dataset.animationCells),animated.size,'track metadata must survive host admission rather than becoming a truthy boolean');
  const original=host.terminal.buffer.cells.map(c=>({...c}));f.flush(2400);assert.deepEqual(host.terminal.buffer.cells,original,'animation may paint but must not mutate source/canon text');
  const hotspot=program.hotspots.find(h=>h.id==='verb:ending');for(let i=0;i<hotspot.width;i++)if(i!==1)assert.ok(!animated.has((hotspot.row-1)*80+hotspot.column-1+i));assert.ok(animated.has((hotspot.row-1)*80+hotspot.column),'only the hotkey breathes');
  host.setReducedMotion(true);f.flush(3000);assert.equal(Number(f.canvas.dataset.animationCells),0,'reduced motion settles art tracks');assert.equal(host.terminal.complete,true);
 }finally{host?.destroy();if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old;}
});

test('adaptive grid fills viewport height within a single cell without distorting glyphs',()=>{for(const [width,height]of [[1554,1518],[2560,1440],[700,1200],[1554,900]]){const grid=nativeTerminalGrid({width,height}),fit=nativeTerminalFit({width,height},grid);if(width/height>=.8)assert.ok(height-fit.height<fit.cellHeight+1);assert.ok(width-fit.width<fit.cellWidth*2+1);assert.equal(fit.cellHeight,fit.cellWidth*2);assert.deepEqual(nativeTerminalCell(fit,fit.right-.01,fit.bottom-.01),{row:grid.rows,column:grid.columns});}});

test('promotion keeps the exact GhostLink canvas until fullscreen, then the next scene starts cleared',async()=>{
 const f=fakeHost(),old=globalThis.ResizeObserver;globalThis.ResizeObserver=f.ResizeObserver;let host;
 try{f.terminal.setMode('held');const oldCanvas=f.canvas,from={left:120,top:110,width:400,height:250};host=mountNativeResponseHost(f.root,{terminal:f.terminal});const done=host.promote({from,duration:.65});assert.equal(parseFloat(f.canvas.style.width),400);assert.equal(host.canvas,oldCanvas);f.flush(1000);f.flush(1400);assert.ok(parseFloat(f.canvas.style.width)>400);f.flush(1800);await done;assert.equal(host.canvas,oldCanvas);assert.deepEqual(host.grid,nativeTerminalGrid(f.root.getBoundingClientRect()));host.show({grid:host.grid,text:'\x1b[2J\x1b[1;1HNEW SCENE',hotspots:[]});assert.equal(f.terminal.buffer.text.trim(),'');f.flush(1900);assert.ok(!f.terminal.buffer.text.includes('GHOSTLINK'));}finally{host?.destroy();if(old===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=old;}
});
