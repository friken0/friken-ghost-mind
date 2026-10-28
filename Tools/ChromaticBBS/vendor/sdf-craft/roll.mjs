import {admitRecipe} from './recipe.mjs';
import {SourceSha256} from './craft.mjs';
// These are small construction studies, not race canon or a replacement for
// the game's family grammars. Models can author their own admitted recipes.
export function rollStudy(kind='relic',seed='first-light'){
 let state=2166136261;for(const c of `${kind}/${seed}`){state^=c.codePointAt(0);state=Math.imul(state,16777619)>>>0;}
 const skinSeed=state>>>1;
 const r=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const parts=[],sockets=[];
 const add=(id,primitive,position,size,material=1,rotation=[0,0,0],motion)=>parts.push({id,primitive,position,size,material,rotation:rotation.map(v=>Math.atan2(Math.sin(v),Math.cos(v))),variation:[.25+r()*.5,.25+r()*.5],...(motion?{motion}:{})});
 const intent={culture:'construction study; no canon asserted'};
 if(kind==='relic'){
  intent.name='The Unspent Memory';intent.role='An open archive lantern with an isolated resonant core and serviceable outer ribs';
  add('vault','lamellar-pod',[0,0,0],[.75,1,.75],1);
  add('winding','coiled-sweep',[0,0,0],[.45,.45,.55],6,[Math.PI/2,0,0]);
  add('memory','cleaved-crystal',[0,.02,0],[.40,.50,.40],4,[0,.32,0]);
  add('bearing','hinge-gear',[0,-.70,0],[.65,.65,.25],6,[Math.PI/2,0,0]);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;
   add(`root-${i}`,'sweep-tube',[Math.cos(a)*.40,-.66,Math.sin(a)*.40],[.32,.25,.50],2,[Math.PI/2,0,a]);
  }
  sockets.push({id:'suspension',part:'vault',point:[.15,.91,0],axis:[0,1,0]});
 }else if(kind==='organism'){
  intent.name='Listening Sail';intent.role='A suspended, hollow sensory organism; folded lateral vanes feed a protected central organ';
  add('mantle','section-loft',[0,0,.38],[.55,.75,.44],1);
  parts.at(-1).modifiers=[-1,1].map(side=>({operation:'subtract',primitive:'section-loft',material:2,
   position:[side*.23,.30,-.30],rotation:[0,0,side*.24],size:[.18,.18,.38],variation:[.5,.2]}));
  add('organ','lamellar-pod',[0,0,0],[.62,.80,.52],1);
  add('sensor','aperture-housing',[0,.43,-.40],[.41,.33,.27],6);
  for(const side of [-1,1]){
   add(`sail-${side}`,'feather-vane',[side*.65,.05,0],[.80,.48,.20],1,[0,side*.2,side*-.30]);
   add(`tendon-${side}`,'sweep-tube',[side*.20,-.70,0],[.30,.25,.70],2,[Math.PI/2,0,side*.24]);
  }
  sockets.push({id:'sensor-axis',part:'sensor',point:[0,0,-.1674],axis:[0,0,-1]});
 }else if(kind==='machine'){
  intent.name='Aperture Relay';intent.role='An instrument chassis with open throat, geared azimuth bearing, vented housing and a replaceable lens';
  add('chassis','vault-plate',[0,-.50,0],[.85,.45,.65],1);
  add('stator','ribbed-duct',[0,-.325,0],[.36,.36,.24],2,[Math.PI/2,0,0]);
  add('drive','hinge-gear',[0,-.07,0],[.60,.60,.26],6,[Math.PI/2,0,0],{kind:'spin-z',rate:.24,phase:.37});
  add('throat','ribbed-duct',[0,.28,0],[.50,.50,.42],2,[Math.PI/2,0,0]);
  add('lens','aperture-housing',[0,.65,0],[.65,.55,.35],1,[-Math.PI/2,0,0]);
  sockets.push({id:'aperture',part:'lens',point:[0,0,-.217],axis:[0,0,-1]});
  sockets.push({id:'bearing-rim',part:'drive',point:[.36,0,0],axis:[0,0,1]});
 }else if(kind==='scope'){
  intent.name='Local Cut Assembly';intent.role='Asymmetric rotated cavity, attached lug and locally intersected boundary; a physical scope witness';
  add('housing','section-loft',[.15,.05,0],[.8,.6,.35],1,[.40,-.50,.10],{kind:'spin-z',rate:.24,phase:.37});
  parts.at(-1).modifiers=[
   {operation:'subtract',primitive:'section-loft',material:2,position:[.10,.05,.20],rotation:[.35,.40,.22],size:[.20,.40,.20],variation:[.3,.6]},
   {operation:'union',primitive:'aperture-housing',material:6,position:[.70,0,0],rotation:[.30,.10,.70],size:[.30,.24,.25],variation:[.6,.3]},
   {operation:'intersect',primitive:'section-loft',material:2,position:[0,0,0],rotation:[.08,.12,.06],size:[2,.9,2],variation:[1,.5]}
  ];
  sockets.push({id:'root-mount',part:'housing',point:[0,-.5,0],axis:[0,-1,0]});
 }else throw new TypeError('Study must be relic, organism, machine or scope');
 return admitRecipe({schema:'friktal.sdf.recipe.v1',edition:'living-form-1',geometry:SourceSha256,seed:String(seed),skin:{race:kind==='organism'?'benev':kind==='relic'?'moknon':'human',seed:skinSeed,scale:3},intent,parts,sockets});
}
