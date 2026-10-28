import {ensureAnsiFont,ansiFontFamily} from './ansi-ui.mjs';
import {ansiSessionTheme} from './ansi-scenes.mjs';
import {createAnsiAnimator,ansiCymaticCell,drawAnsiCell} from './ansi-animation.mjs';
import {modemStages,modemDuration} from './modem.mjs';
/* An actual bounded 80-column ANSI terminal, streamed at serial 8N1 speed.
 * The connection is theatre, not a claim of remote traffic. No raster art,
 * second animation clock, network input or terminal escape execution. */
export const ansiGeometry=Object.freeze({columns:80,rows:25,cellWidth:16,cellHeight:32,bps:2400,bitsPerByte:10});
export const ansiPalette=Object.freeze(['#000000','#aa0000','#00aa00','#aa5500','#0000aa','#aa00aa','#00aaaa','#aaaaaa','#555555','#ff5555','#55ff55','#ffff55','#5555ff','#ff55ff','#55ffff','#ffffff']);
// A palette changes display inks only. ANSI indices, source cells, serial
// progress, animation tracks and hit regions remain exactly the same.
export const ansiColourThemes=Object.freeze([
 Object.freeze({id:'ansi',label:'ANSI++',colours:ansiPalette}),
 Object.freeze({id:'ice',label:'ICE',colours:Object.freeze(['#020810','#7e3359','#247e81','#8b7047','#153c71','#705a98','#368dba','#9daebe','#3c5369','#ff7fa3','#70e4ba','#ffe8a0','#749fff','#d6a7ff','#86f1ff','#f3fbff'])}),
 Object.freeze({id:'ember',label:'EMBER',colours:Object.freeze(['#090401','#8d2921','#536727','#966021','#2e355c','#874254','#a97631','#c7aa83','#59463a','#ff7950','#b8c667','#ffd773','#9d96c0','#f5a099','#ffd49b','#fff5d8'])}),
 Object.freeze({id:'phosphor',label:'PHOSPHOR',colours:Object.freeze(['#010703','#1c4c2a','#285f38','#3d7044','#143d27','#346b45','#4b8255','#81a982','#34573b','#a3d998','#94dd94','#c0edab','#63b98b','#b1dfb9','#91f0b3','#e1ffe0'])}),
 Object.freeze({id:'noir',label:'NOIR',colours:Object.freeze(['#050509','#3e3a48','#44434e','#55505a','#242936','#4b4257','#606775','#a6a6af','#53535f','#c1a9ba','#b1c6ba','#e0cfad','#8b9cb8','#cebbd6','#b6d7dc','#f8f5ed'])})
]);
export function ansiColourTheme(id='ansi'){const theme=ansiColourThemes.find(t=>t.id===id);if(!theme)throw Error('Known ANSI colour theme required');return theme;}
const ESC='\x1b[';
const at=(row,column=1)=>`${ESC}${row};${column}H`;
const color=(fg,bg=0)=>`${ESC}${fg>7?90+fg-8:30+fg};${bg>7?100+bg-8:40+bg}m`;
export function createAnsiBuffer({columns=80,rows=25}={}){
 if(!Number.isInteger(columns)||columns<20||columns>160||!Number.isInteger(rows)||rows<8||rows>50)throw Error('Bounded ANSI dimensions required');
 const cells=Array.from({length:rows*columns},()=>({char:' ',fg:7,bg:0}));
 let row=0,col=0,fg=7,bg=0,bold=false,pending='',revision=0,saved=[0,0];
 function clear(start=0,end=cells.length){for(let i=start;i<end;i++)cells[i]={char:' ',fg,bg};revision++;}
 function scroll(){cells.copyWithin(0,columns);for(let i=(rows-1)*columns;i<cells.length;i++)cells[i]={char:' ',fg,bg};row=rows-1;revision++;}
 function newline(){row++;if(row>=rows)scroll();}
 function command(params,op){const n=params.split(';').map(x=>Number(x)||0),one=n[0]||1;
  if(op==='H'||op==='f'){row=Math.max(0,Math.min(rows-1,(n[0]||1)-1));col=Math.max(0,Math.min(columns-1,(n[1]||1)-1));}
  else if(op==='A')row=Math.max(0,row-one);else if(op==='B')row=Math.min(rows-1,row+one);else if(op==='C')col=Math.min(columns-1,col+one);else if(op==='D')col=Math.max(0,col-one);
  else if(op==='J'){if(n[0]===2){clear();row=col=0;}else if(n[0]===1)clear(0,row*columns+col+1);else clear(row*columns+col);}
  else if(op==='K'){const from=row*columns;clear(n[0]===1||n[0]===2?from:from+col,n[0]===1?from+col+1:from+columns);}
  else if(op==='s')saved=[row,col];else if(op==='u')[row,col]=saved;
  else if(op==='m')for(const code of n){if(code===0){fg=7;bg=0;bold=false;}else if(code===1)bold=true;else if(code===22)bold=false;else if(code>=30&&code<=37)fg=code-30;else if(code>=90&&code<=97)fg=code-90+8;else if(code>=40&&code<=47)bg=code-40;else if(code>=100&&code<=107)bg=code-100+8;else if(code===39)fg=7;else if(code===49)bg=0;}
 }
 function feed(text){for(const char of text){
  if(pending){pending+=char;if(pending.length>64){pending='';continue;}if(pending.length===2&&char!=='['){pending='';continue;}if(pending.length>2&&/[A-Za-z]/.test(char)){command(pending.slice(2,-1),char);pending='';}continue;}
  if(char==='\x1b'){pending=char;continue;}if(char==='\r'){col=0;continue;}if(char==='\n'){newline();continue;}if(char==='\b'){col=Math.max(0,col-1);continue;}if(char<' ')continue;
  if(col>=columns){col=0;newline();}cells[row*columns+col]={char,fg:bold&&fg<8?fg+8:fg,bg};col++;revision++;
 }}
 return {cells,feed,clear,reset(){pending='';row=col=0;fg=7;bg=0;bold=false;saved=[0,0];clear();},get revision(){return revision;},get cursor(){return {row,col:Math.min(columns-1,col),fg,bg};},get text(){return Array.from({length:rows},(_,y)=>cells.slice(y*columns,(y+1)*columns).map(c=>c.char).join('')).join('\n');}};
}
// Each character is one CP437-style serial cell, including shade/block art.
// The glyphs are Unicode equivalents, not a painting masquerading as ANSI.
export function connectionAnsi({recipient='SURREAL',label='TURN OUT OF TIME',bps=2400}={}){
 recipient=String(recipient).replace(/[^\w .-]/g,'').slice(0,28).toUpperCase();label=String(label).replace(/[^\w .-]/g,'').slice(0,32).toUpperCase();
 let s=ESC+'2J'+color(8)+at(1)+'╔'+'═'.repeat(78)+'╗';
 const line=(y,text,fg=7,x=3)=>{s+=at(y,x)+color(fg)+text.slice(0,81-x);};
 line(2,'N O   C A R R I E R   /   H Y P E R S P A C E   B B S',13,9);
 const font={G:[' ████','█    ','█ ███','█   █',' ███ '],H:['█   █','█   █','█████','█   █','█   █'],O:[' ███ ','█   █','█   █','█   █',' ███ '],S:[' ████','█    ',' ███ ','    █','████ '],T:['█████','  █  ','  █  ','  █  ','  █  '],L:['█    ','█    ','█    ','█    ','█████'],I:['█████','  █  ','  █  ','  █  ','█████'],N:['█   █','██  █','█ █ █','█  ██','█   █'],K:['█   █','█  █ ','███  ','█  █ ','█   █']};
 for(let i=0;i<5;i++)line(4+i,[...'GHOSTLINK'].map(c=>font[c][i]).join('   '),i<2?15:i<4?14:6,6);
 line(9,'   G H O S T L I N K   /   A  D O O R  O U T  O F  T I M E',8,9);

 for(let y=2;y<=24;y++){line(y,'║',8,1);line(y,'║',8,80);}
 line(25,'╚'+'═'.repeat(78)+'╝',8,1);
 line(11,'░▒▓█  FRIKEN.GHOST  /  '+label+'  █▓▒░',11,8);
 line(12,'─'.repeat(72),8,5);
 line(13,'PHASE BUS  ░▒▓█╬══╬█▓▒░  /  SYNCHRONISING THE IMPROBABLE',8,6);
 line(14,'CONNECT '+bps+' / 8N1       LOCAL THEATRE / EXTERNAL RESPONSE',10,6);
 line(15,'CALLER: '+recipient+'     TRANSLATION: DEVELOPER → DEVELOPER',14,6);
 line(17,'[OK] IDENTITY  THE REPLY / V20. STILL A SMARTASS.',7,6);
 line(18,'[OK] MEMORY    NOW → RECENT → ARCHIVE → RECOVERY CAPSULE',7,6);
 line(19,'[OK] TOOLBELT  ONE STAGE. MANY WORLDS. ZERO STOCK PHOTOS.',7,6);
 line(20,'[OK] AUDIO     VOICE + SFX ARMED / MUSIC AFTER CONNECTION',7,6);
 line(22,'THE UNIVERSE NEEDS A SYSOP. HR HAS STOPPED RETURNING CALLS.',13,6);
 line(24,'CARRIER HELD / CONTINUE WHEN READY. YOUR TIME IS YOURS.',11,6);
 return s+color(14)+at(24,73)+'▌';
}
export const bootCommand='Friken.Ghost.exe --boot --connect:https://github.com/friken0/friken-ghost-mind';
export const bootCommandCps=35;
const connectionLabels=['AUDIO ENGINE / LOCAL SIGNAL BUS','DIAL TRANSPORT / OPENING THE LINE','CARRIER DETECT / LISTENING FOR ANSWER','ECHO SUPPRESSION / CLEARING THE CHANNEL','HYPERSPACE MENU / NEGOTIATING THE IMPROBABLE','PHASE PROBE / READING THE CHANNEL','EQUALIZER / FINDING OUR SHARED FREQUENCY','MEMORY RINGS / TRAINING THE CARRIER','GHOSTLINK / HOLDING THE CARRIER LOCK'];
export const terminalConnectionStages=Object.freeze(modemStages.map(([at],i)=>Object.freeze([at,connectionLabels[i]])));
export function promptAnsi({preview=true,typedCharacters=0,focus=null,boardStatus='',connectionProgress,connSeconds=0}={}){
 const parts=['Friken.Ghost.exe --boot','--connect:https://github.com/friken0/friken-ghost-mind'],shown=preview?bootCommand.length:Math.max(0,Math.min(bootCommand.length,Math.floor(typedCharacters)));
 let s=ESC+'2J'+at(10,5)+color(7)+'C:\\GHOST> '+color(focus==='dial'?15:14,focus==='dial'?4:0);
 s+=parts[0].slice(0,shown);if(shown>parts[0].length)s+=at(11,15)+parts[1].slice(0,Math.max(0,shown-parts[0].length-1));
 const status=String(boardStatus).replace(/[\x00-\x1f\x7f]/g,'').slice(0,142),seconds=Number.isFinite(connSeconds)?Math.max(0,connSeconds):0;
 const booting=!preview&&shown===bootCommand.length&&Number.isFinite(connectionProgress),progress=booting?Math.max(0,Math.min(1,connectionProgress)):0;
 if(booting){
  let active=0;for(let i=0;i<terminalConnectionStages.length;i++)if(seconds>=terminalConnectionStages[i][0])active=i;
  const spinner=['╱','─','╲','│'][Math.floor(seconds*8)%4];
  for(let i=0;i<terminalConnectionStages.length;i++){const done=i<active||progress===1,current=i===active&&progress<1,mark=done?'OK':current?spinner+' ': '░ ';s+=at(12+i,5)+color(done?10:current?14:8)+'['+mark+'] '+terminalConnectionStages[i][1];}
  s+=at(21,5)+color(7)+'LOCAL MODEM CLOCK / '+Math.min(seconds,modemDuration).toFixed(1)+'s / DOUBLE-CLICK TO CONNECT';
  const width=58,filled=Math.floor(progress*width),packet=Math.floor(seconds*18)%Math.max(1,width-filled);s+=at(22,5)+color(8)+'[';
  for(let i=0;i<width;i++){const full=i<filled,chase=!full&&i-filled===packet;s+=color(full?10:chase?14:8)+(full?'█':chase?'▓':'░');}s+=color(8)+'] '+color(11)+String(Math.floor(progress*100)).padStart(3,' ')+'%';
 }
 if(status){const tone=/offline|fail|unavailable/i.test(status)?11:/connected|loaded|verified|ready/i.test(status)?10:8,row=booting?23:14;s+=at(row,5)+color(tone)+status.slice(0,71);if(status.length>71)s+=at(row+1,5)+status.slice(71);}
 const second=Math.max(0,shown-parts[0].length-1),cursorRow=shown>parts[0].length?11:10,cursorColumn=15+(shown>parts[0].length?second:shown);return s+color(14)+at(cursorRow,cursorColumn);
}
export function terminalHotspots(mode='dialer'){
 const defs=mode==='prompt'?[['dial',9,14,22,'enter'],['dial',10,14,55,'enter']]:mode==='command'?[]:mode==='dialer'?[['dial',17,5,28,'d'],['music',18,5,28,'m'],['voice',19,5,28,'v'],['finish',20,5,34,'f']]:mode==='held'?[['continue',21,5,40,'enter'],['reconnect',22,5,28,'r'],['music',23,5,27,'m'],['voice',23,40,25,'v']]:[['pause',21,5,30,' '],['finish',22,5,34,'f'],['music',23,5,27,'m'],['voice',23,40,25,'v']];
 return defs.map(([id,row,column,width,key])=>({id,row,column,width,height:1,key}));
}
function controlProgram(mode,state={}){
 if(mode==='prompt'||mode==='command')return {text:'',spots:terminalHotspots(mode),rows:[]};
 const labels=mode==='dialer'?['[ D ] DIAL THE VOID','[ M ] MUSIC: '+(state.music?'ON':'OFF'),'[ V ] VOICE: '+(state.voice===false?'OFF':'ON'),'[ F ] FINISH CONNECTION ANIMATION']:mode==='held'?['[ ENTER ] OPEN THE REPLY','[ R ] RECONNECT / BOOT AGAIN','[ M ] MUSIC: '+(state.music?'ON':'OFF'),'[ V ] VOICE: '+(state.voice===false?'OFF':'ON')]:['[ SPACE ] '+(state.paused?'RESUME CONNECTION':'PAUSE / HOLD THE LINE'),'[ F ] FINISH CONNECTION ANIMATION','[ M ] MUSIC: '+(state.music?'ON':'OFF'),'[ V ] VOICE: '+(state.voice===false?'OFF':'ON')];
 let text='';const spots=terminalHotspots(mode),rows=[...new Set(spots.map(x=>x.row))];for(const row of rows)text+=at(row+1)+color(7)+' '.repeat(79);
 if(state.boardStatus){rows.push(15);const status=String(state.boardStatus).replace(/[\x00-\x1f\x7f]/g,'').slice(0,69);text+=at(16,1)+color(7)+' '.repeat(79)+at(16,6)+color(/unavailable|offline/i.test(status)?11:10)+status;}
 spots.forEach((spot,i)=>{text+=at(spot.row+1,spot.column+1)+color(state.focus===spot.id?15:spot.id==='dial'||spot.id==='continue'?11:14,state.focus===spot.id?4:0)+labels[i];});return {text,spots,rows};
}
export function dialerAnsi(options={}){let text=connectionAnsi(options);for(let row=14;row<=24;row++)text+=at(row)+color(7)+' '.repeat(79);text+=at(14,6)+color(10)+'GHOSTLINK DIALER / MODEM READY / '+(options.bps||2400)+' BPS'+at(15,6)+color(7)+'ONE LOCAL CALL. THE VOID CAN PAY ITS OWN LONG DISTANCE.';return text+controlProgram('dialer',options).text;}
export function heldAnsi(options={}){return connectionAnsi(options)+controlProgram('held',options).text;}
export function ansiSerialFrame(text,seconds,{bps=2400,bitsPerByte=10,complete=false}={}){
 if(!Number.isFinite(seconds)||seconds<0||!Number.isFinite(bps)||bps<=0)throw Error('Valid serial clock required');
 // The admitted stream uses one-byte CP437 equivalents. ESC/control bytes count.
 const count=complete?text.length:Math.min(text.length,Math.floor(seconds*bps/bitsPerByte));
 return {count,duration:text.length*bitsPerByte/bps,complete:count===text.length,text:text.slice(0,count)};
}
function paintGlyph(ctx,char,x,y,w,h){
 if(char===' '||!char)return;
 const quadrants=' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█',mask=quadrants.indexOf(char);if(mask>0&&!['▀','▄','▌','▐','█'].includes(char)){for(let n=0;n<4;n++)if(mask&(1<<n))ctx.fillRect(x+(n%2)*w/2,y+Math.floor(n/2)*h/2,w/2,h/2);return;}
 if('█▀▄▌▐░▒▓'.includes(char)){
  if(char==='█')ctx.fillRect(x,y,w,h);else if(char==='▀')ctx.fillRect(x,y,w,h/2);else if(char==='▄')ctx.fillRect(x,y+h/2,w,h/2);else if(char==='▌')ctx.fillRect(x,y,w/2,h);else if(char==='▐')ctx.fillRect(x+w/2,y,w/2,h);else{const stride=char==='░'?1:char==='▒'?2:3;for(let iy=0;iy<16;iy++)for(let ix=0;ix<8;ix++)if((ix+iy*3)%4<stride)ctx.fillRect(x+ix*w/8,y+iy*h/16,w/8,h/16);}return;
 }
 ctx.fillText(char,x,y,w);
}
// Decorative cell choreography never changes the parser or its transcript.
// Controls remain solid and readable; no background or whole-panel strobe.
export function bootAnsiCellRole(index,char,controlRows=[]){
 const row=Math.floor(index/80),column=index%80;
 if(controlRows.includes(row)||!char||char===' ')return null;
 if(row===0||row===24||column===0||column===79)return 'packet-rail';
 if(row>=3&&row<=8)return /[█▀▄▌▐░▒▓]/.test(char)?'logo-fill':'logo-edge';
 if(row===12)return 'phase-bus';
 if(row===1||row===10)return 'chroma-weave';
 if(row>=16&&row<=19&&column>=5&&column<10)return 'status-chase';
 return null;
}
export function bootAnsiRail(index,seconds){
 const row=Math.floor(index/80),column=index%80,total=206;
 const at=row===0?column:column===79?79+row:row===24?103+79-column:182+24-row;
 const distance=(Math.floor(seconds*22)-at+total*1000)%total;
 return distance===0?15:distance<3?14:distance<7?6:8;
}
export function mountAnsiTerminal({canvas,recipient,label,bps=2400,seed=0,animation=true,transparent=false,cursor:showCursor=true}={}){
 if(typeof document==='undefined'&&!canvas)throw Error('Canvas host required');
 canvas=canvas||document.createElement('canvas');canvas.width=1280;canvas.height=800;
 let columns=80,rows=25,buffer=createAnsiBuffer();const ctx=canvas.getContext('2d',{alpha:!!transparent}),animator=createAnsiAnimator({maxCells:8000,maxRate:20,seed:596564});
 let stream=connectionAnsi({recipient,label,bps}),mode='receiving',controlState={},modeKey='',count=-1,revision=0,elapsed=0,complete=false,force=false,presentation=0,lastTick=-1,lastReduced=false,priorCursor=-1,overlay=null,controls=null,lastLabel='',commandProgramKey='',programAnimation=false,programTracks=new Map(),reactiveCells=new Map(),pendingPatches=[],patchBytes=0;
 let displayTheme=ansiColourTheme();const theme=ansiSessionTheme(seed);const painted=new Map(),records=new Map();let manualHotspots=null,serialOffset=0;
 const glyph=(context,char,x,y,w,h)=>paintGlyph(context,char,x,y,w,h);
 function animateCell(index,c,role,now){
  const id=String(index),key=c.char+'|'+c.fg+'|'+c.bg+'|'+role,prior=records.get(index);
  if(!prior||prior.key!==key){
   const hues=role==='status-chase'?[10,14,15,10]:role==='phase-bus'?[6,14,12,13,11,14]:role==='logo-fill'?[14,12,13,11,15,14,6]:role==='logo-edge'?[6,14,15,14,13,6]:[13,12,14,15,11,13];
   const themedHues=hues.map(n=>({13:theme.palette[1],12:theme.palette[0],14:theme.palette[2],11:theme.palette[6],6:theme.palette[4]})[n]??n);
   const offset=(index%80+Math.floor(index/80)*3)%hues.length,colors=themedHues.map((_,n)=>themedHues[(n+offset)%themedHues.length]),base={glyph:c.char,fg:c.fg,bg:c.bg};
   const effect=role==='phase-bus'?['flip','dither','scan','shrink-return'][Math.floor(index%80/15)%4]:role==='logo-edge'?'scan':'fade';
   const frames=colors.map((fg,n)=>({...base,fg,...(role==='phase-bus'&&/[░▒▓█╬═]/.test(c.char)?{glyph:[...'░▒▓█╬═'][((index%80)+n)%6]}:{})}));
   animator.cycle(id,frames,{at:0,interval:(role==='phase-bus'?420:role==='status-chase'?660:520)*theme.tempo/260,transition:role==='phase-bus'?240:420,effect,mode:'loop'});records.set(index,{key});
  }
  return animator.sample(id,now);
 }
 function update(seconds=elapsed,{reveal=false,time=seconds,reducedMotion=false,energy=null}={}){
  if(!Number.isFinite(time)||time<0)throw Error('Valid ANSI presentation clock required');const paintStart=performance.now();
  const promptMode=mode==='prompt'||mode==='command',typedCharacters=mode==='prompt'?bootCommand.length:Math.min(bootCommand.length,Math.floor(seconds*bootCommandCps));
  if(promptMode){const key=JSON.stringify([mode,typedCharacters,controlState.focus,controlState.boardStatus,Number.isFinite(controlState.connectionProgress)?Math.floor(controlState.connectionProgress*100):null,Math.floor((controlState.connSeconds||0)*8)]);if(key!==commandProgramKey){commandProgramKey=key;stream=promptAnsi({preview:mode==='prompt',typedCharacters,focus:controlState.focus,boardStatus:controlState.boardStatus,connectionProgress:controlState.connectionProgress,connSeconds:controlState.connSeconds});buffer.reset();count=-1;}}
  const next=ansiSerialFrame(stream,Math.max(0,seconds+serialOffset*10/bps),{bps,complete:reveal||promptMode}),tick=Math.floor(time*20);presentation=time;elapsed=seconds;complete=next.complete;if(next.complete&&pendingPatches.length)force=true;
  if(next.count===count&&!force&&reducedMotion===lastReduced&&(!animation||reducedMotion||tick===lastTick))return false;lastReduced=reducedMotion;
  const labelDirty=next.count!==count||force;
  if(next.count<count){buffer.reset();count=0;records.clear();animator.clear();painted.clear();}
  if(count<0)count=0;buffer.feed(stream.slice(count,next.count));count=next.count;if(next.complete&&pendingPatches.length){for(const patch of pendingPatches)buffer.feed(patch);pendingPatches=[];patchBytes=0;}canvas.dataset.queuedPatches=String(pendingPatches.length);
  if(force||!overlay){controls=manualHotspots?{text:'',spots:manualHotspots,rows:[]}:controlProgram(mode,controlState);overlay=createAnsiBuffer({columns,rows});overlay.feed(controls.text);if(force)painted.clear();}
  force=false;lastTick=tick;ctx.font='32px '+ansiFontFamily;ctx.textBaseline='top';ctx.imageSmoothingEnabled=false;
  if(priorCursor>=0)painted.delete(priorCursor);let changes=0,animated=0,reactive=0;
  for(let i=0;i<buffer.cells.length;i++){
   const row=Math.floor(i/columns),c=controls.rows.includes(row)?overlay.cells[i]:buffer.cells[i],x=i%columns*16,y=row*32,role=animation&&!reducedMotion&&!promptMode&&(mode!=='program'||programAnimation)?bootAnsiCellRole(i,c.char,controls.rows):null;
   let frame=null,signature;const track=mode==='program'&&!reducedMotion&&(c.char!==' '||c.bg!==0)?programTracks.get(i):null;
   if(track&&animation&&c.char===track.frames[0].glyph){ const id=String(i),key=JSON.stringify(track);if(records.get(i)?.key!==key){animator.cycle(id,track.frames,{at:track.at||0,interval:track.interval||200,transition:track.transition??120,effect:track.effect||'scan',mode:'loop'});records.set(i,{key});}frame=animator.sample(id,time*1000);signature=JSON.stringify(frame.layers);animated++;}
   else if(role==='packet-rail'){const fg=bootAnsiRail(i,time);signature=c.char+'|'+fg+'|'+c.bg;frame={layers:[{glyph:c.char,fg,bg:c.bg,alpha:1,scaleX:1,scaleY:1}]};animated++;}
   else if(role){frame=animateCell(i,c,role,time*1000);signature=JSON.stringify(frame.layers);animated++;}
   else{signature=c.char+'|'+c.fg+'|'+c.bg;if(records.has(i)){records.delete(i);animator.unregister(String(i));}}
   if(energy&&reactiveCells.has(i)&&animation&&!reducedMotion&&complete){const r=reactiveCells.get(i),audioFrame=ansiCymaticCell(c,{...energy,time,x:i%columns,y:row,intensity:r.intensity,style:r.style,frame});if(audioFrame?.cymatic){frame=audioFrame;signature=JSON.stringify(frame.layers);reactive++;}}
   if(painted.get(i)===signature)continue;painted.set(i,signature);changes++;if(transparent&&c.bg===0)ctx.clearRect(x,y,16,32);else{ctx.fillStyle=displayTheme.colours[c.bg];ctx.fillRect(x,y,16,32);}
   if(frame)drawAnsiCell(ctx,frame,{x,y,width:16,height:32,paintGlyph:glyph,palette:displayTheme.colours,clear:false});
   else{ctx.fillStyle=displayTheme.colours[c.fg];paintGlyph(ctx,c.char,x,y,16,32);}
  }
  const cursor=buffer.cursor;priorCursor=cursor.row*columns+cursor.col;if(showCursor&&Math.floor(time*2)%2===0){ctx.fillStyle=displayTheme.colours[14];ctx.fillRect(cursor.col*16,cursor.row*32+28,16,3);}revision++;
  canvas.dataset.colourTheme=displayTheme.id;canvas.dataset.columns=String(columns);canvas.dataset.rows=String(rows);canvas.dataset.serialBytes=String(count);canvas.dataset.bps=String(bps);canvas.dataset.complete=String(complete);canvas.dataset.animationCells=String(animated);canvas.dataset.cymaticCells=String(reactive);canvas.dataset.changedCells=String(changes);canvas.dataset.animationFps=animation&&!reducedMotion&&!promptMode?'20':'0';canvas.dataset.mode=mode;canvas.dataset.transparent=String(transparent);canvas.dataset.commandCharacters=String(promptMode?typedCharacters:0);canvas.dataset.paintMs=(performance.now()-paintStart).toFixed(2);if(labelDirty){const label=buffer.text;if(label!==lastLabel){canvas.setAttribute('aria-label',label);lastLabel=label;}}return true;
 }
 ensureAnsiFont().then(()=>{force=true;update(elapsed,{reveal:complete,time:presentation});}).catch(error=>{canvas.dataset.fontError=error.message;});
 update(0);return {canvas,get buffer(){return buffer;},get colourTheme(){return displayTheme.id;},setPalette(id){const next=ansiColourTheme(id);if(displayTheme===next)return false;displayTheme=next;force=true;painted.clear();update(elapsed,{reveal:complete,time:presentation,reducedMotion:lastReduced});return true;},setBps(value){if(![300,1200,2400,9600,14400,21100,56000].includes(value))throw Error('Known serial speed required');serialOffset=Math.max(0,count)-elapsed*value/10;bps=value;},setGrid(nextColumns,nextRows,{preserve=true}={}){const next=createAnsiBuffer({columns:nextColumns,rows:nextRows});if(nextColumns===columns&&nextRows===rows)return; if(preserve)for(let y=0;y<Math.min(rows,nextRows);y++)for(let x=0;x<Math.min(columns,nextColumns);x++)Object.assign(next.cells[y*nextColumns+x],buffer.cells[y*columns+x]);columns=nextColumns;rows=nextRows;buffer=next;canvas.width=columns*16;canvas.height=rows*32;overlay=null;priorCursor=-1;painted.clear();records.clear();animator.clear();force=true;},update,get mode(){return mode;},get hotspots(){return manualHotspots||terminalHotspots(mode);},get program(){return stream;},setMode(next,state={}){if(!['prompt','command','dialer','receiving','held'].includes(next))throw Error('Unknown terminal mode');const key=JSON.stringify([next,state]);if(key===modeKey)return;modeKey=key;const changed=mode!==next;mode=next;controlState=state;manualHotspots=null;commandProgramKey='';if(changed){serialOffset=0;pendingPatches=[];patchBytes=0;buffer.reset();stream=next==='dialer'?dialerAnsi({recipient,label,bps,...state}):next==='held'?heldAnsi({recipient,label,bps,...state}):connectionAnsi({recipient,label,bps});count=-1;elapsed=0;records.clear();animator.clear();painted.clear();}force=true;update(elapsed,{reveal:mode!=='receiving',time:presentation});},setControls(patch){controlState={...controlState,...patch};modeKey=JSON.stringify([mode,controlState]);commandProgramKey='';force=true;update(elapsed,{reveal:complete,time:presentation});},setFocus(id){if(controlState.focus===id)return;controlState={...controlState,focus:id};commandProgramKey='';force=true;update(elapsed,{reveal:complete,time:presentation});},setProgram(text,{hotspots=[],animation:animateProgram=false,preserve=false}={}){if(typeof text!=='string'||text.length>128000||!Array.isArray(hotspots)||hotspots.length>96)throw Error('Bounded ANSI program required');mode='program';programAnimation=animateProgram===true;programTracks=new Map();reactiveCells=new Map();if(animateProgram&&typeof animateProgram==='object'){if(!Array.isArray(animateProgram.tracks)||animateProgram.tracks.length>256)throw Error('Bounded ANSI art tracks required');for(const t of animateProgram.tracks){if(!Number.isInteger(t.row)||t.row<1||t.row>rows||!Number.isInteger(t.column)||t.column<1||t.column>columns||!Array.isArray(t.frames)||t.frames.length>16)throw Error('Bounded ANSI art cell required');programTracks.set((t.row-1)*columns+t.column-1,t);}}if(animateProgram?.cymatics){if(!Array.isArray(animateProgram.cymatics)||animateProgram.cymatics.length>4)throw Error('Bounded ANSI audio regions required');for(const r of animateProgram.cymatics){if(!Number.isInteger(r.row)||!Number.isInteger(r.column)||!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.row<1||r.column<1||r.row+r.height>rows+1||r.column+r.width>columns+1||!Number.isFinite(r.intensity)||r.intensity<0||r.intensity>1)throw Error('Bounded ANSI audio region required');const count=r.width*r.height,budget=r.style==='trip'?384:128;for(let n=0;n<Math.min(count,budget);n++){const offset=Math.floor(n*count/Math.min(count,budget)),y=r.row-1+Math.floor(offset/r.width),x=r.column-1+offset%r.width;reactiveCells.set(y*columns+x,r);}}}pendingPatches=[];patchBytes=0;stream=preserve?text.replace(/\x1b\[2J/g,''):text;manualHotspots=hotspots;serialOffset=0;if(!preserve)buffer.reset();count=-1;modeKey='';elapsed=0;force=true;records.clear();animator.clear();painted.clear();update(0,{time:presentation});},patch(text){if(typeof text!=='string'||text.length>16000)throw Error('Bounded ANSI patch required');if(!complete){if(pendingPatches.length>=128||patchBytes+text.length>128000)throw Error('Pending ANSI patch budget exceeded');pendingPatches.push(text);patchBytes+=text.length;canvas.dataset.queuedPatches=String(pendingPatches.length);return false;}buffer.feed(text);force=true;return update(elapsed,{reveal:true,time:presentation});},setAnimationEnabled(value){animation=!!value;force=true;update(elapsed,{reveal:complete,time:presentation});},get commandDuration(){return bootCommand.length/bootCommandCps;},get duration(){return (manualHotspots===null?connectionAnsi({recipient,label,bps}).length:stream.length)*10/bps;},get elapsed(){return elapsed;},get revision(){return revision;},get complete(){return complete;},reset(){pendingPatches=[];patchBytes=0;buffer.reset();count=-1;records.clear();animator.clear();painted.clear();return update(0,{time:presentation});},reveal(){return update(elapsed,{reveal:true,time:presentation});}};
}
