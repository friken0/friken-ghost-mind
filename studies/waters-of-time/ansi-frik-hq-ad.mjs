import {ansiLightPulse} from './ansi-animation.mjs?v=surface-light-3';
import {frikStoryGrade,gradeFrikStory,frikStoryIndex} from './ansi-frik-story.mjs?v=lancing-1';

const letters={
 F:['11111','10000','10000','11110','10000','10000','10000'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 A:['01110','10001','10001','11111','10001','10001','10001'],
 C:['01111','10000','10000','10000','10000','10000','01111'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 H:['10001','10001','10001','11111','10001','10001','10001'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 K:['10001','10010','10100','11000','10100','10010','10001'],
 Q:['01110','10001','10001','10001','10101','10010','01101'],
};
export const frikAdText='FRIKTAL HQ';
export const frikAdBounds={x:.09,y:.25,width:59*.0139,height:7*.0475};
export const frikAdGate=[.09+56.5*.0139,.25+2.5*.0475,.028];
const mask=Array.from({length:7},(_,row)=>[...frikAdText].map(char=>
 letters[char]?.[row]??'00000').join('0'));
const clamp=t=>Math.max(0,Math.min(1,t));
const mix=(a,b,t)=>{
 const w=clamp(t),v=1-w;
 return Math.round((a>>16&255)*v+(b>>16&255)*w)<<16|
   Math.round((a>>8&255)*v+(b>>8&255)*w)<<8|Math.round((a&255)*v+(b&255)*w);
};
const occupied=(col,row)=>mask[row]?.[col]==='1';
const sources=new Map();
const shadows=new Map();
export function frikAdSource(pass,phase=0,trip=0){
 const key=pass+'/'+phase+'/'+trip;
 if(sources.has(key))return sources.get(key);
 const detail=pass>=3?2:1,columns=59*detail,rows=7*detail;
 const cells=Array.from({length:columns*rows},(_,i)=>{
  const x=i%columns,y=Math.floor(i/columns),col=Math.floor(x/detail),row=Math.floor(y/detail);
  if(!occupied(col,row))return {x,y,glyph:' ',fg:11,bg:null};
  const side=x%detail,down=y%detail,edge=!occupied(col,row-1);
  let glyph='█',fg='#57cbbf',bg='#226b7c';
  if(pass>=3){glyph=down===0&&edge?'▀':'█';fg=down===0?'#acf0d3':'#51b6b1';}
  if(pass>=4&&side===0&&!occupied(col-1,row)){glyph='▌';fg='#e6e4b1';}
  if(pass>=5&&row>2&&occupied(col,row+1)){glyph=side?'▒':'▓';fg='#4aabae';bg='#346b82';}
  if(pass>=6&&row===(phase%7)){fg='#c6f7e1';bg='#49999e';}
  if(pass>=7&&side===1&&down===1&&col%6===0){glyph='│';fg='#dcba81';bg='#387b8c';}
  if(pass>=8&&edge&&side===1&&down===0){glyph='╱';fg='#ededd1';bg='#80d9c5';}
  const color=hex=>trip?'#'+gradeFrikStory(parseInt(hex.slice(1),16),frikStoryGrade(5,trip)).toString(16).padStart(6,'0'):hex;
  return {id:'hq-'+col+'-'+row+'-'+side+'-'+down,x,y,glyph,fg:color(fg),bg:color(bg)};
 });
 const source={columns,rows,cells};
 if(sources.size>=32)sources.delete(sources.keys().next().value);
 sources.set(key,source);
 return source;
}

export function frikAdInk(x,y,f){
 const t=f.time;
 const circuit=Math.abs(y-.75-.028*Math.sin(x*18-t*.44));
 let ink=0x080c25;
 if(circuit<.012){
  ink=mix(ink,0x184779,1-circuit/.012);
  const direction=f.trip===2?-1:1;
  const train=x-direction*t*.17;
  const beat=Math.abs(train-Math.round(train/.48)*.48);
  const pulses=Math.max(0,1-Math.abs(beat-.028)/.012);
  ink=mix(ink,f.trip===2?0xffb87e:0x8beed3,pulses*(1-circuit/.012));
 }
 // Etched signal buses feed the letterpress; paired contacts sit at each bend.
 if(y>.115&&y<.81){
  const rim=Math.min(x,1-x);
  const rail=Math.abs(rim-.084-.011*Math.cos(y*19)-.06*Math.max(0,y-.52));
  const step=Math.abs(y*11-Math.round(y*11));
  if(rail<.017)ink=mix(ink,0x476080,Math.max(0,1-rail/.017)*.75);
  if(rail<.003)ink=mix(ink,0x7de9c9,.48+.22*Math.sin(y*13-t));
  if(rail<.008&&step<.050)ink=0xdcaf74;
 }
 const frame=Math.min(Math.abs(x-.044),Math.abs(x-.956),Math.abs(y-.109),Math.abs(y-.817));
 if(x>.043&&x<.957&&y>.108&&y<.818&&frame<.003)ink=0x5f6eaa;
 const u=(x-frikAdBounds.x)/frikAdBounds.width*59;
 const v=(y-frikAdBounds.y)/frikAdBounds.height*7;
 const col=Math.floor(u),row=Math.floor(v);
 if(occupied(col,row)){
  const a=u-col,b=v-row;
  const bevel=Math.min(a,1-a,b*.72,(1-b)*.72);
  ink=mix(0x13436b,0x49d7ce,clamp(.32-a*.27-b*.17+bevel*2.1));
  if(f.grade>2&&bevel<.13)ink=mix(ink,a+b<1?0xe5e8b5:0x302d75,.72);
  if(f.grade>4&&row===Math.floor(t*.74)%7)ink=mix(ink,0xdafaff,.54);
 }
 return ink;
}
const adCopy=[
 ['GHOST UPLINK > WATERS','TX 01   HUMAN HELLO / TWO PULSES'],
 ['GHOST UPLINK > ECHO TEST','TX 02   BROKEN DRUM / RETURN REQUESTED'],
 ['WATERS > GHOST INBOX','RX 03   OTHER ADDRESSES / LINE OPEN'],
];
export function paintFrikAd(put,data,scale,ox,oy){
 const {x,y,width,height}=frikAdBounds;
 const phase=data.effects?Math.floor(data.time*.74)%7:0;
 const source=frikAdSource(data.grade,phase,data.trip);
 if(data.grade>=2&&!shadows.has(data.grade))shadows.set(data.grade,
  {...source,cells:source.cells.map(cell=>cell.glyph===' '?cell:
   {...cell,fg:'#38345a',bg:'#38345a'})});
 if(data.grade>=2)put.cells('hq-shadow/'+data.grade,shadows.get(data.grade),
  ox+scale*(x+.006),oy+scale*(y+.013),scale*width,scale*height,.24);
 put.cells('hq-face/'+data.grade+'/'+phase+'/'+data.trip,source,ox+scale*x,oy+scale*y,scale*width,scale*height,.65);
 if(scale>.20){
  put.glyph('B B S',ox+scale*.50,oy+scale*.175,.022*scale,'#ffd978',{maxSize:160});
  const [headline,tagline]=adCopy[frikStoryIndex(data.trip)];
  put.glyph(headline,ox+scale*.50,oy+scale*.663,.017*scale,'#7ee6db',{maxSize:120});
  put.glyph(data.answered?'ACK   COLONY SHIP / TWO TAPS RECEIVED':tagline,ox+scale*.50,oy+scale*.738,
   .0105*scale,'#a4a7c5',{maxSize:96});
 }
 if(data.effects&&data.grade>3){
  const pulse=ansiLightPulse({flicker:'scanner',rate:.81,depth:.58},data.time,0,false);
  put.bloom(ox+scale*.50,oy+scale*.408,Math.min(.18,.14*scale),'#30b6f0',.30*pulse,
   {core:.17,halo:1.4,white:.5,aspect:2.8},data.grade);
 }
}
