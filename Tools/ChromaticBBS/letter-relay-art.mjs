/* The retained terminal paints and hit-tests the same bounded cell frame. */
import {ansiScene} from './ansi-scenes.mjs';
import {relayHops,relaySignals,relayBlock} from './letter-relay.mjs';

const tau=Math.PI*2;
const grain=(i,seed)=>((Math.imul(i+1,0x9e3779b1)^Math.imul(seed+9,0x85ebca6b))>>>0)/4294967296;
const wrap=(n,max)=>((n%max)+max)%max;
const branches=[
 [[.24,.01],[.26,.18],[.21,.24],[.31,.36],[.28,.48]],
 [[.76,.02],[.66,.15],[.69,.21],[.62,.33],[.64,.47]],
 [[.44,.00],[.49,.17],[.40,.25],[.48,.32],[.37,.50]],
 [[.88,.01],[.89,.15],[.79,.29],[.83,.35],[.74,.51]]
];
const parts={
 storm:['    ╭╮    ╭╮    ','  ╔═╧╧════╧╧═╗  ','  ╚══╣▓▓▓▓╠══╝  ','     ╚════╝     '],
 shield:['      ╔╦══╗     ','   ╔══╝║▒▒╠╗    ','   ╚══╗║▒▒╠╝    ','      ╚╩══╝     '],
 boost:['    ◥███▆▃      ','      ◥███▆◤    ','        ╲╱      ','     ══╩╩══     '],
 bypass:['     ╔╦════╦╗   ','     ║║    ║║   ','     ╚╩════╩╝   ','    ▄██▄  ▄██▄  '],
 air:['      ──╋──     ','    ────╋────   ','    ╶───╋───╴   ','      ▄▄█▄▄     '],
 cable:['      ▄██▄      ','     █╔══╗█     ','     █╚══╝█═╕   ','      ▀██▀  ╘╴  ']
};

export function relayTargets(relay,region){
 const {row,column,width:w,height:h}=region,station=relayHops[relay.history.length];
 if(station)return station.routes.map((part,i)=>({
  id:part.id,row:row+Math.max(2,h-8),column:column+(i===0?2:w-21),
  width:19,height:7,key:String(i+1)
 }));
 return relay.sent?[]:[{id:relay.assembled?'send':'assemble',row:row+Math.max(2,h-8),
  column:column+Math.floor(w/2)-11,width:22,height:7,key:'f'}];
}

export function paintLetterRelay(relay,region,grid,time,{seed=0,held=false,sendAge=1,focus=null}={}){
 const {width:w,height:h,row,column}=region,cells=Array(grid.rows*grid.columns),points=[];
 let storm=null;
 const put=(x,y,glyph,fg=7,bg=0)=>{
  if(x>=0&&x<w&&y>=0&&y<h)cells[(row+y-1)*grid.columns+column+x-1]={glyph,fg,bg};
 };
 const label=(x,y,line,fg,bg=0)=>Array.from(line).forEach((glyph,i)=>put(x+i,y,glyph,fg,bg));
 if(!relay.locked){
  const zoom=relay.zoom?1.65:1;
  const columns=relay.zoom?68:w,rows=relay.zoom?Math.min(50,Math.round(h*1.48)):h;
  const plate=ansiScene('spiral-galaxy',{width:columns,height:rows,seed}).frame(time);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=Math.floor(((x+.5)/w-.5)*columns/zoom+columns/2);
   const sy=Math.floor(((y+.5)/h-.5)*rows/zoom+rows/2);
   const {glyph,fg,bg}=plate[sy*columns+sx];
   put(x,y,glyph,fg,bg);
  }
  for(let i=0;i<relaySignals.length;i++){
   const id=relaySignals[i],a=i*tau/3+time*(.16+i*.003)+seed%17*.33;
   const x=Math.round(w*(.5+Math.cos(a)*(.19+i*.022)*zoom));
   const y=Math.round(h*(.49+Math.sin(a)*(.14+i*.014)*zoom));
   const phase=wrap(time+i*.61,2.65),count=i===0?2:i===1?1:3;
   const bright=held||phase<count*.30&&phase%.30<.14;
   const glyph=relay.zoom?['◎','◇','✦'][i]:'·',fg=bright?[15,14,13][i]:[11,6,5][i];
   if(relay.reticle===i){put(x-1,y,'[',15);put(x+1,y,']',15);}
   put(x,y,glyph,fg);
   points.push({id,row:row+y,column:column+x});
  }
  label(1,0,relay.zoom?' 1.65X / OPTICAL SCOPE ':' 1.00X / WIDE FIELD ',14,4);
  if(relay.zoom&&held)label(1,h-1,' ◎ TWO    ◇ ONE    ✦ THREE ',11);
  return {cells,points,storm};
 }
 const hop=relay.history.length;
 const strike=Math.floor((time+.9)/4.15),age=wrap(time+.9,4.15);
 const flash=held||relay.sent?0:Math.max(0,1-age/.68);
 const bolt=branches[(strike+(seed%4)+hop)%branches.length];
 storm=relay.sent?null:{strike:flash>0?strike:null,covered:hop>0};
 for(let x=0;x<w;x++){
  const far=h*(.47+.08*Math.sin(x*.19)+.04*Math.cos(x*.61));
  const near=h*(.54+.09*Math.sin(x*.25+1)+.03*Math.cos(x*.72));
  for(let y=0;y<h;y++){
   const high=Math.sin(x*.20-time*.35)+.56*Math.sin(x*.47-time*.78+1.1);
   const low=Math.sin(x*.17-time*.69)+.48*Math.cos(x*.59-time*1.11);
   if(y<far){
    const cloud=y<h*(.17+high*.08)?4:y<h*(.29+low*.077)?5:0;
    const lit=flash>.38&&cloud!==0;
    const shade=grain(y*w+x,seed);
    put(x,y,cloud?(shade>.74?'▒':shade>.44?'░':' '):' ',lit?14:cloud===5?8:12,lit?4:cloud);
   }else if(y<near)put(x,y,grain(x+y*w,seed)>.67?'▖':'▒',flash>.52?6:8,4);
   else put(x,y,grain(x+y*w,seed)>.86?'·':' ',y>h*.85?6:2,0);
  }
 }
 if(flash>.04){
  const stroke=(ax,ay,bx,by,fg)=>{
   const steps=Math.max(Math.abs(bx-ax),Math.abs(by-ay),1);
   for(let i=0;i<=steps;i++){
    const x=Math.round(ax+(bx-ax)*i/steps),y=Math.round(ay+(by-ay)*i/steps);
    put(x,y,by===ay?'─':bx>ax?'╲':'╱',fg,4);
   }
  };
  for(let i=1;i<bolt.length;i++){
   const [[ax,ay],[bx,by]]=bolt.slice(i-1,i+1);
   stroke(Math.round(w*ax),Math.round(h*ay),Math.round(w*bx),Math.round(h*by),flash>.45?15:12);
  }
  const [forkX,forkY]=bolt[2];
  stroke(Math.round(w*forkX),Math.round(h*forkY),Math.round(w*(forkX+(strike%2?.13:-.13))),Math.round(h*(forkY+.12)),14);
  if(strike%3!==1){
   const [x,y]=bolt[1];
   stroke(Math.round(w*x),Math.round(h*y),Math.round(w*(x+(strike%2?-.09:.11))),Math.round(h*(y+.13)),12);
  }
 }
 if(!relay.sent){
  for(let i=0;i<Math.min(76,w*h/5);i++){
   const fall=grain(i+170,seed),depth=i%3,yy=wrap(grain(i+600,seed)*h+time*(3+depth*2.5),h-1);
   const x=Math.floor(wrap(fall*w-time*(1.7+depth*1.3),w)),y=Math.floor(yy);
   if(y<h*.85)put(x,y,depth===0?'·':'╱',depth===2?6:8);
   else if(yy%1<.27)put(x,y,'≈',6);
  }
 }
 const targets=relayTargets(relay,region);
 const station=relayHops[hop];
 label(1,0,' '+(station?.name||'ROOF TRANSMITTER')+' ',14,4);
 const platform=h-2;
 for(let x=1;x<w-1;x++)put(x,platform,x%5===0?'╪':'═',6);
 label(1,platform+1,'╱▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒╲',8);
 for(const x of [1,w-2])for(let y=2;y<platform;y++)put(x,y,y%3===0?'╪':'║',8);
 if(station){
  const feed=['SERVICE FEED','DISH ARRAY','ROOF PATCH PANEL'][hop];
  label(2,2,'╞══ '+feed+' ═══════╪═══╡',flash>.2?15:6);
  if(hop===1)label(w-10,4,'◥███◤',11);
  if(hop===2)label(w-10,4,'╶─╋─╴',13);
  for(const [i,area] of targets.entries()){
   const x=area.column-column,y=area.row-row,part=station.routes[i];
   const hot=focus==='relay:'+part.id,edge=hot?15:14,metal=hot?15:[11,10,13][hop];
   const bg=hot?4:0;
   label(x,y,'╔'+'═'.repeat(17)+'╗',edge,bg);
   for(let line=1;line<6;line++)label(x,y+line,'║'+' '.repeat(17)+'║',edge,bg);
   parts[part.id].forEach((line,k)=>label(x+1,y+1+k,line,k===2?edge:metal,bg));
   label(x+1,y+5,'['+area.key+'] '+['FIT INPUT','FIT GAIN','FIT OUTPUT'][hop],edge,bg);
   label(x,y+6,'╚'+'═'.repeat(17)+'╝',edge,bg);
  }
 }else if(!relay.sent){
  const target=targets[0],x=target.column-column,y=target.row-row,hot=focus==='relay:'+target.id;
  const blocked=!!relayBlock(relay),edge=blocked?8:relay.assembled?10:14,bg=hot?4:0;
  const rack=['╔═══════╦════╦═══════╗','║   ◉   ║ ╱╲ ║   ◉   ║','╠═══════╩═╦══╩═══════╣',
   '║         ║          ║','║      [■ ■ ■]       ║',
   blocked?'║     RACK LOCKED    ║':relay.assembled?'║ [F] LAUNCH SIGNAL  ║':'║ [F] CLOSE CIRCUIT  ║','╚════════════════════╝'];
  rack.forEach((line,i)=>label(x,y+i,line,i===1||i===4?15:edge,bg));
 }else{
  const travel=held?1:Math.min(1,sendAge/.9),px=Math.floor(5+travel*(w-11));
  label(2,4,'─'.repeat(Math.max(1,px-2))+'◆',11);
  label(3,7,travel===1?'SEALED / READY TO CARRY':'SIMULATING TRANSMISSION',10,4);
 }

 return {cells,points,storm};
}

export function pickRelaySignal(points,cell){
 if(!cell)return null;
 let id=null,best=2.5;
 for(const point of points){
  const distance=(point.column-cell.column)**2+2*(point.row-cell.row)**2;
  if(distance<best){best=distance;id=point.id;}
 }
 return id;
}
