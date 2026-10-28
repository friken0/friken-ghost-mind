import test from 'node:test';
import assert from 'node:assert/strict';
import {ansiColourThemes,ansiColourTheme,ansiGeometry,createAnsiBuffer,connectionAnsi,dialerAnsi,heldAnsi,terminalHotspots,ansiSerialFrame,mountAnsiTerminal,bootAnsiCellRole,bootAnsiRail,promptAnsi,bootCommand,bootCommandCps,terminalConnectionStages} from './ansi-terminal.mjs';
import {bootScreenView,bootCameraView,bootCameraFlight,bootCameraAt,bootProject,bootPick,bootRenderScale} from './boot-world.mjs';

test('ANSI controls survive arbitrary serial boundaries and never become visible text',()=>{
 const text='\x1b[2J\x1b[3;7H\x1b[1;36;44mGHOST\x1b[0m\r\nREADY',whole=createAnsiBuffer(),serial=createAnsiBuffer();whole.feed(text);
 for(const char of text)serial.feed(char);assert.deepEqual(serial.cells,whole.cells);assert.equal(serial.cells[2*80+6].char,'G');assert.equal(serial.cells[2*80+6].fg,14);assert.equal(serial.cells[2*80+6].bg,4);assert.equal(serial.cells[3*80].char,'R');assert.ok(!serial.text.includes('\x1b'));
});
test('terminal is bounded, supports clear and scroll, and ignores unsupported escapes',()=>{
 const t=createAnsiBuffer({columns:20,rows:8});t.feed('NEVER EXECUTE\x1b[2JHELLO\x1b[1;3H\x1b[2K');assert.equal(t.text.trim(),'');
 t.feed('\x1b[8;1HEND\r\nLAST');assert.ok(t.text.includes('END'));assert.ok(t.text.includes('LAST'));assert.equal(t.cells.length,160);
 t.feed('\x1b[999999;999999HX');assert.equal(t.cells.at(-1).char,'X');assert.throws(()=>createAnsiBuffer({columns:100000}));
});
test('2400 bps counts control and glyph bytes at 8N1 rather than instantaneous lines',()=>{
 const stream=connectionAnsi({recipient:'Surreal'}),first=ansiSerialFrame(stream,1),last=ansiSerialFrame(stream,1000);assert.equal(first.count,240);assert.equal(last.count,stream.length);assert.equal(last.complete,true);assert.ok(first.duration>8&&first.duration<15);assert.throws(()=>ansiSerialFrame(stream,-1));
 const t=createAnsiBuffer();t.feed(last.text);assert.ok(t.text.includes('CALLER: SURREAL'));assert.ok(t.text.includes('CARRIER HELD'));assert.equal(t.text.split('\n').length,25);assert.ok(t.text.split('\n').every(row=>row.length===80));assert.ok(!connectionAnsi({recipient:'\x1b[2JBAD'}).includes('CALLER: \x1b'));
 assert.deepEqual(ansiGeometry,{columns:80,rows:25,cellWidth:16,cellHeight:32,bps:2400,bitsPerByte:10});
});
test('canvas is retained, exact stream can rewind and terminal reveal has no independent clock',()=>{
 const context={fillRect(){},fillText(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},globalAlpha:1},canvas={dataset:{},getContext:()=>context,setAttribute(){}};
 const terminal=mountAnsiTerminal({canvas,recipient:'Surreal'});assert.equal(canvas.width,1280);assert.equal(canvas.height,800);assert.equal(terminal.complete,false);terminal.update(4);const halfway=terminal.buffer.text;assert.ok(halfway.includes('GHOST')||halfway.includes('██'));terminal.reveal();assert.equal(terminal.complete,true);assert.ok(terminal.buffer.text.includes('CARRIER HELD'));terminal.update(4);assert.equal(terminal.complete,false);assert.equal(terminal.buffer.text,halfway);terminal.reset();assert.equal(terminal.elapsed,0);assert.equal(terminal.complete,false);assert.equal(terminal.buffer.text.trim(),'');
});
test('terminal occupies a real world point and has a deterministic legible held camera',()=>{
 const wide=bootCameraView(),screen=bootCameraView('screen');
 for(const aspect of [.6,1,1.6,2.4])assert.equal(bootPick(bootProject([-2.75,.54,.53],wide,aspect),wide,aspect),'screen');
 const flight=bootCameraFlight(wide,'screen',7);assert.deepEqual(bootCameraAt(flight,flight.duration),screen);assert.deepEqual(bootCameraFlight(wide,'screen',7),flight);assert.ok(screen.eye[2]<.53);
 for(const camera of [wide,screen]){const p=bootProject([-2.75,.54,.53],camera,1.6);assert.ok(p.every(Number.isFinite));}
});

test('physical ANSI screen fits square and wide stages above the bottom command band',()=>{
 for(const [w,h] of [[1554,1518],[1280,800],[1920,1080],[700,900],[375,680]]){
  const camera=bootScreenView(w/h,h),points=[[-4.67,-.76,.53],[-.83,1.80,.53]].map(p=>bootProject(p,camera,w/h));
  const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
  const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  assert.ok(minX>=-.86&&maxX<=.86,`${w}x${h} horizontal bezel containment`);
  assert.ok(maxY<.99&&minY>-.8,`${w}x${h} vertical bezel containment`);
  const glassBottom=bootProject([-2.75,-.46,.53],camera,w/h)[1],pixelsFromBottom=(1+glassBottom)*h/2;
  assert.ok(pixelsFromBottom>=Math.min(150,h*.22),`${w}x${h} bottom commands stay clear`);
 }
});

test('dialer and held actions are real terminal cells with bounded matching hotspots',()=>{
 const a=createAnsiBuffer(),b=createAnsiBuffer();a.feed(dialerAnsi({music:false}));b.feed(heldAnsi({voice:false}));
 assert.match(a.text,/DIAL THE VOID/);assert.match(a.text,/MUSIC: OFF/);assert.match(b.text,/OPEN THE REPLY/);assert.match(b.text,/VOICE: OFF/);
 for(const mode of ['dialer','held','receiving'])for(const h of terminalHotspots(mode)){assert.ok(h.column>=0&&h.row>=0&&h.column+h.width<=80&&h.row+h.height<=25);}
 const context={fillRect(){},fillText(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},globalAlpha:1},canvas={dataset:{},getContext:()=>context,setAttribute(){}};const t=mountAnsiTerminal({canvas});t.setMode('dialer');assert.ok(t.complete);assert.ok(t.buffer.text.includes('MODEM READY'));assert.equal(t.hotspots[0].id,'dial');t.setMode('receiving');assert.equal(t.complete,false);t.setMode('held');assert.ok(t.complete);assert.equal(t.hotspots[0].id,'continue');assert.throws(()=>t.setMode('unknown'));
});


test('Apple Retina auto uses exact CSS pixels and explicit native keeps full DPR',()=>{
 assert.equal(bootRenderScale('auto',{pixelRatio:2,apple:true}),1);
 assert.equal(bootRenderScale('native',{pixelRatio:2,apple:true}),2);
 assert.equal(bootRenderScale('auto',{pixelRatio:1.5,apple:false}),1.5);
 assert.equal(bootRenderScale(1.25,{pixelRatio:2,apple:true}),1.25);
 assert.throws(()=>bootRenderScale('quarter'));
});


test('boot choreography leaves controls and transcript unchanged while dirty cells animate',()=>{
 const context={fillRect(){},fillText(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},globalAlpha:1},canvas={dataset:{},getContext:()=>context,setAttribute(){}};
 const t=mountAnsiTerminal({canvas});t.setMode('dialer');const transcript=t.buffer.text,serial=canvas.dataset.serialBytes,revision=t.revision;
 assert.equal(t.update(0,{reveal:true,time:.001}),false);
 assert.equal(t.update(0,{reveal:true,time:.16}),true);assert.equal(t.buffer.text,transcript);assert.equal(canvas.dataset.serialBytes,serial);assert.ok(t.revision>revision);assert.ok(Number(canvas.dataset.animationCells)>200);assert.ok(Number(canvas.dataset.changedCells)<2000);
 for(const h of t.hotspots)for(let x=h.column;x<h.column+h.width;x++)assert.equal(bootAnsiCellRole(h.row*80+x,'X',t.hotspots.map(h=>h.row)),null);
 assert.notEqual(bootAnsiRail(0,0),bootAnsiRail(0,1));assert.equal(t.update(0,{reveal:true,time:.16,reducedMotion:true}),true);assert.equal(canvas.dataset.animationCells,'0');assert.equal(t.update(0,{reveal:true,time:.32,reducedMotion:true}),false);t.setAnimationEnabled(false);const still=t.revision;assert.equal(t.update(0,{reveal:true,time:2}),false);assert.equal(t.revision,still);
});


test('bare executable prompt stays bare until the command types at the caller clock',()=>{
 const context={fillRect(){},fillText(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},globalAlpha:1},canvas={dataset:{},getContext:()=>context,setAttribute(){}};
 const t=mountAnsiTerminal({canvas});t.setMode('prompt',{focus:'dial'});assert.ok(t.buffer.text.includes('Friken.Ghost.exe --boot'));assert.ok(t.buffer.text.includes('--connect:https://github.com/friken0/friken-ghost-mind'));assert.ok(!t.buffer.text.includes('HYPERSPACE'));assert.equal(canvas.dataset.animationCells,'0');assert.equal(t.hotspots.length,2);assert.ok(t.hotspots.every(h=>h.id==='dial'));
 const rows=t.buffer.text.split('\n');assert.ok(rows.every(r=>r.length===80));assert.equal(t.buffer.cells[9*80+14].bg,4);assert.equal(t.commandDuration,bootCommand.length/bootCommandCps);
 t.setMode('command',{boardStatus:'HTTPS: contacting public registry'});assert.ok(!t.buffer.text.includes('Friken.Ghost.exe'));t.update(1,{time:1});assert.equal(canvas.dataset.commandCharacters,'35');assert.ok(t.buffer.text.includes('Friken.Ghost.exe --boot'));assert.ok(!t.buffer.text.includes('friken-ghost-mind'));
 t.update(t.commandDuration,{time:3});assert.equal(canvas.dataset.commandCharacters,'78');assert.ok(t.buffer.text.includes('friken-ghost-mind'));assert.equal(t.hotspots.length,0);assert.ok(t.duration>9&&t.duration<12);
 const safe=createAnsiBuffer();safe.feed(promptAnsi({boardStatus:'offline\x1b[2J fallback'}));assert.ok(safe.text.includes('offline[2J fallback'));assert.ok(safe.text.includes('Friken.Ghost.exe'));
 t.setMode('receiving');assert.equal(t.buffer.text.trim(),'');t.update(2,{time:4});assert.ok(!t.buffer.text.includes('C:\\GHOST>'));assert.ok(Number(canvas.dataset.animationCells)>0);
});


test('foreground glass owns overlapping clicks and the opposite wide shot favours the terminal',()=>{
 const wide=bootCameraView();assert.ok(wide.eye[0]<0);const distance=p=>Math.hypot(...p.map((v,i)=>v-wide.eye[i]));assert.ok(distance([-2.75,.54,.53])<distance([0,-.48,-.7]));
 for(const aspect of [.65,1,1.6,2.4])for(const x of [-4.3,-2.75,-1.2])for(const y of [-.4,.54,1.5])assert.equal(bootPick(bootProject([x,y,.53],wide,aspect),wide,aspect),'screen');
 assert.equal(bootPick(bootProject([0,.95,3.8],wide,1.6),wide,1.6),'screen','portal behind emitted glass cannot steal its click');assert.equal(bootPick(bootProject([1.8,1.5,3.8],wide,1.6),wide,1.6),'portal','visible aperture remains selectable');assert.equal(bootPick(bootProject([0,-.25,-.7],wide,1.6),wide,1.6),'modem');
});

test('modem-clock boot lines and packet meter precede the ANSI logo without inventing transport results',()=>{
 assert.deepEqual(terminalConnectionStages.map(s=>s[0]),[0,.75,2.55,3.25,6,7.6,9.1,11.4,15.2]);
 for(const seconds of [0,4,10.56,17.6]){const b=createAnsiBuffer();b.feed(promptAnsi({preview:false,typedCharacters:bootCommand.length,connectionProgress:seconds/17.6,connSeconds:seconds,boardStatus:'HTTPS offline / using bundled board'}));const text=b.text;assert.match(text,/AUDIO ENGINE/);assert.match(text,/HYPERSPACE MENU/);assert.match(text,/LOCAL MODEM CLOCK/);assert.match(text,/HTTPS offline/);assert.ok(!text.includes('public board manifest loaded'));assert.ok(!text.includes('HYPERSPACE   BBS'));assert.ok(text.split('\n').every(row=>row.length===80));const meter=text.split('\n')[21];assert.equal((meter.match(/█/g)||[]).length,Math.floor(seconds/17.6*58));}
 const typing=createAnsiBuffer();typing.feed(promptAnsi({preview:false,typedCharacters:35,connectionProgress:0,connSeconds:0}));assert.ok(!typing.text.includes('AUDIO ENGINE'));
});


test('a native program exits prompt mode, keeps authored colours and defers patches until partial escapes finish',()=>{
 const calls=[],context={fillRect(){calls.push('fill');},fillText(){},clearRect(){calls.push('clear');},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},globalAlpha:1},canvas={dataset:{},getContext:()=>context,setAttribute(){}};
 const t=mountAnsiTerminal({canvas,transparent:true,animation:false,cursor:false});t.setMode('prompt');t.setProgram('\x1b[2J\x1b[1;1H\x1b[91m'+('X'.repeat(500)));t.update(.01);assert.equal(t.mode,'program');assert.equal(t.complete,false);t.patch('\x1b[4;5H\x1b[93mGO');assert.equal(t.complete,false);assert.equal(canvas.dataset.queuedPatches,'1');assert.ok(!t.buffer.text.includes('GO'));t.update(20);assert.equal(t.complete,true);assert.equal(t.buffer.cells[3*80+4].char,'G');assert.equal(t.buffer.cells[3*80+4].fg,11);assert.ok(!t.buffer.text.includes('Friken.Ghost.exe'));assert.equal(canvas.dataset.animationCells,'0');assert.ok(calls.includes('clear'));assert.equal(calls.filter(x=>x==='fill').length,0,'transparent zero-background cells do not paint a black panel');
});

test('authored illustration cells animate after serial arrival, stay off prose and respect reduced motion',()=>{
 const context={fillRect(){},fillText(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},globalAlpha:1},canvas={dataset:{},getContext:()=>context,setAttribute(){}};
 const terminal=mountAnsiTerminal({canvas,cursor:false});
 const text='\x1b[2J\x1b[9;11H▪\x1b[10;11HWORDS STAY STILL';
 const tracks=[{row:9,column:11,interval:200,transition:100,effect:'flip',frames:[{glyph:'▪',fg:14,bg:0},{glyph:'◆',fg:11,bg:0}]}];
 terminal.setProgram(text,{animation:{tracks}});terminal.update(0,{time:0});assert.equal(canvas.dataset.animationCells,'0','not yet received');
 terminal.reveal();terminal.update(1,{time:1,reveal:true});assert.equal(canvas.dataset.animationCells,'1');assert.ok(terminal.buffer.text.includes('WORDS STAY STILL'));
 terminal.update(1,{time:1.3,reveal:true,reducedMotion:true});assert.equal(canvas.dataset.animationCells,'0');assert.ok(terminal.buffer.text.includes('WORDS STAY STILL'));
 assert.throws(()=>terminal.setProgram(text,{animation:{tracks:Array(257).fill(tracks[0])}}),/Bounded/);
});


test('changing sixteen display inks preserves serial position, transcript and animation source',()=>{
 const context={fillRect(){},fillText(){},clearRect(){},save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},globalAlpha:1},canvas={dataset:{},getContext:()=>context,setAttribute(){}};
 const terminal=mountAnsiTerminal({canvas});terminal.update(4);const transcript=terminal.buffer.text,bytes=canvas.dataset.serialBytes;
 for(const theme of ansiColourThemes){assert.equal(theme.colours.length,16);assert.ok(theme.colours.every(c=>/^#[0-9a-f]{6}$/.test(c)));terminal.setPalette(theme.id);assert.equal(terminal.buffer.text,transcript);assert.equal(canvas.dataset.serialBytes,bytes);assert.equal(terminal.colourTheme,theme.id);assert.equal(canvas.dataset.colourTheme,theme.id);}
 terminal.setMode('held');assert.equal(terminal.colourTheme,'noir');assert.match(terminal.buffer.text,/OPEN THE REPLY/);assert.throws(()=>ansiColourTheme('made-up'));
});
