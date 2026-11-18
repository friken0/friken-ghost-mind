// Orthographic section lofts for the ANSI fauna field. Each station is
// [along, lateral offset, half width, front height] in local coordinates.
const scute = [[-1,.12,.08,.16],[-.79,.05,.63,.74],[-.37,-.04,.98,1],
 [.29,-.06,.91,.91],[.73,.03,.58,.59],[1,.20,.03,.08]];
const keel = [[-1,.23,.02,.06],[-.76,.15,.59,.56],[-.32,-.08,.94,.96],
 [.20,-.06,.75,.89],[.65,.06,.59,.67],[1,.21,.17,.16]];
const mantle = [[-1,.07,0,.03],[-.74,-.17,.38,.38],[-.37,-.11,.78,.66],
 [.05,.07,.91,.85],[.49,.14,.79,.94],[.77,.18,.58,.82],[1,.24,.13,.19]];
const basin = [[-1,.13,.07,.15],[-.76,-.04,.66,.72],[-.34,-.09,.94,.98],
 [.18,-.01,.88,1],[.61,.13,.66,.86],[1,.21,.12,.21]];
const saddle = [[-1,.08,.03,.05],[-.78,-.01,.55,.52],[-.51,-.12,.93,.88],
 [-.15,-.02,.73,.79],[.27,.13,.57,.67],[.62,.08,.81,.94],[1,-.02,.20,.19]];
const petal = [[-1,.23,.14,.12],[-.65,.13,.43,.49],[-.29,-.08,.89,.78],
 [.22,-.18,.81,.73],[.63,-.05,.39,.56],[1,.29,.01,.08]];
const chisel = [[-1,0,.31,.31],[-.73,-.07,.71,.75],[-.28,.04,.99,.98],
 [.30,.12,.77,.80],[.72,.17,.52,.65],[1,.10,.44,.49]];

const between=(a,b,t)=>a+(b-a)*t;

function facet(v) {
 return v<.43 ? 1-v*.24 : .8968*(1-v)/.57;
}

// Reuse these sections along articulated shafts as well as across lofts.
// The paired ridges of a channel carry its walls above the recessed floor.
export const faunaCrossSections={
 scute:facet,
 keel:v=>1-v,
 mantle:v=>(1-v*v)*(1-.33*v),
 basin:v=>v<.56 ? .28+v*.71 : .6776*(1-v)/.44,
 saddle:v=>1-v*(.25+.75*v),
 petal:v=>1-v*(.62+.38*v),
 chisel:v=>v<.64 ? 1-v*.16 : .8976*(1-v)/.36,
};

export function faunaSectionSlope(section,across){
 const low=Math.max(0,across-.002),high=Math.min(1,across+.002);
 return (section(high)-section(low))/(high-low);
}

const stations={scute,keel,mantle,basin,saddle,petal,chisel};

// The seven common profiles remain available to every planet. These seven
// roles add planet-specific silhouettes and cross sections for each.
// A role describes the attachment and lets the recipe choose the shape.
const regionalProfiles=[
 {
  shield:['imbricate',[[-1,-.12,.20,.24],[-.66,-.12,.71,.72],[-.36,-.09,1,1],[.30,.08,.85,.87],[.68,.18,.72,.48],[1,.24,.10,.10]],v=>v<.52?1-v*.20:.896*(1-v)/.48],
  spine:['splitKeel',[[-1,.23,.09,.10],[-.73,.17,.58,.65],[-.28,-.06,.95,1],[.18,-.14,.56,.76],[.72,.14,.66,.73],[1,.21,.14,.12]],v=>(1-v)*(.72+.75*v)],
  bearing:['dovetail',[[-1,-.02,.62,.41],[-.65,.03,.91,.75],[-.21,.05,.74,.86],[.38,-.07,.54,.81],[.70,.02,.84,1],[1,.08,.77,.49]],v=>Math.min(.96,(1-v)*2.4)],
  blade:['obsidian',[[-1,.24,.28,.23],[-.71,.10,.93,.64],[-.25,-.03,.82,1],[.23,-.15,.51,.76],[.71,-.22,.27,.44],[1,-.32,.03,.04]],v=>(1-v)*(1-.50*v)],
  edge:['shard',[[-1,.32,.16,.12],[-.54,.02,.93,.71],[-.16,-.16,.79,1],[.36,.05,.60,.70],[.73,.24,.32,.37],[1,.37,.03,.04]],v=>1-v*v*v],
  organ:['furnace',[[-1,.09,.08,.12],[-.72,-.08,.55,.65],[-.24,-.05,.88,1],[.31,.09,.83,.79],[.76,.21,.39,.42],[1,.30,.04,.04]],v=>v<.44?.48+v*.88:.8672*(1-v)/.56],
  sole:['wedge',[[-1,-.18,.21,.18],[-.69,-.11,.58,.67],[-.23,.04,.75,1],[.34,.14,.85,.69],[.77,.12,.93,.41],[1,.08,.60,.19]],v=>Math.min(1,(1-v)*2.8)],
 },
 {
  shield:['nacreLobe',[[-1,.19,.04,.08],[-.70,-.08,.67,.45],[-.28,-.24,.72,.89],[.16,-.06,.94,.96],[.55,.21,.66,.73],[1,.29,.07,.08]],v=>(1-v*v)*(.96-.12*v)],
  spine:['capillary',[[-1,-.21,.18,.23],[-.74,-.12,.53,.67],[-.35,.01,.69,.83],[.16,.17,.50,.72],[.62,.11,.82,.99],[1,-.14,.16,.15]],v=>v<.66?.33+.80*v:.858*(1-v)/.34],
  bearing:['valve',[[-1,-.12,.07,.17],[-.70,.09,.66,.72],[-.28,.17,.77,.88],[.08,-.04,.91,.99],[.62,-.17,.61,.55],[1,.15,.16,.09]],v=>v<.30?.76+v*.58:.934*(1-v)/.70],
  blade:['hydrofoil',[[-1,-.28,.08,.07],[-.69,-.19,.53,.45],[-.23,-.12,.94,.88],[.33,.04,.72,.69],[.76,.24,.43,.34],[1,.37,.03,.06]],v=>(1-v*v)*(1-.63*v)],
  edge:['gillComb',[[-1,-.15,.10,.12],[-.68,-.13,.53,.51],[-.24,.07,.89,.93],[.23,.14,.56,.70],[.61,.03,.77,.56],[1,-.22,.11,.15]],v=>(1-v)*(.65+.55*Math.sin(2*Math.PI*v)**2)],
  organ:['cistern',[[-1,-.24,.07,.08],[-.65,-.16,.64,.46],[-.31,-.03,.91,.88],[.21,.11,.75,1],[.68,.03,.57,.86],[1,-.10,.27,.29]],v=>v<.68?.18+1.10*v:.928*(1-v)/.32],
  sole:['pedalFold',[[-1,.20,.08,.08],[-.74,.09,.72,.47],[-.18,-.12,.88,.76],[.42,.09,.96,.89],[.76,.22,.52,.48],[1,.30,.19,.13]],v=>(1-v)*(.85+.40*v)],
 },
 {
  shield:['barkFold',[[-1,-.15,.05,.09],[-.68,-.04,.74,.65],[-.22,.13,.83,1],[.16,.11,.60,.74],[.61,-.11,.83,.86],[1,-.26,.12,.12]],v=>(1-v*v)*(.75+.24*Math.sin(3*Math.PI*v)**2)],
  spine:['tendon',[[-1,.12,.49,.53],[-.61,-.07,.77,.80],[-.24,-.17,.92,1],[.25,-.05,.53,.69],[.63,.18,.39,.44],[1,.20,.21,.27]],v=>1-v*(.06+.94*v*v)],
  bearing:['knuckle',[[-1,.07,.29,.27],[-.77,.14,.65,.62],[-.31,.09,.85,.86],[.17,-.12,.95,1],[.66,-.05,.44,.56],[1,-.18,.20,.25]],v=>Math.min(1,(1-v)*1.8)*(1-.27*v)],
  blade:['quill',[[-1,-.07,.28,.27],[-.62,-.10,.59,.69],[-.19,-.04,.82,1],[.31,.09,.57,.63],[.73,.23,.32,.37],[1,.38,.02,.05]],v=>(1-v)*(.86+.45*v)],
  edge:['bract',[[-1,-.22,.07,.10],[-.64,-.10,.41,.43],[-.19,.06,.86,.95],[.29,.19,.71,.86],[.69,.06,.46,.42],[1,-.16,.06,.08]],v=>(1-v)*(1+.25*Math.sin(Math.PI*v))],
  organ:['seedPod',[[-1,.21,.07,.09],[-.69,.10,.40,.37],[-.14,-.06,.93,.88],[.30,-.15,.87,1],[.72,.06,.58,.52],[1,.21,.16,.15]],v=>(1-v*v)*(.90+.10*Math.sin(3*Math.PI*v))],
  sole:['splitHoof',[[-1,.04,.40,.39],[-.66,.14,.66,.70],[-.20,-.06,.77,.96],[.25,-.13,.89,.81],[.68,.06,.81,.67],[1,.04,.65,.37]],v=>v<.38?.59+.95*v:.951*(1-v)/.62],
 },
];

export const faunaRegionalProfiles=regionalProfiles.map(region=>Object.fromEntries(
 Object.entries(region).map(([role,[name,outline,cross]])=>{
  stations[name]=outline;
  faunaCrossSections[name]=cross;
  return [role,name];
 })));

const baseRoles={scute:'shield',keel:'spine',chisel:'bearing',petal:'blade',mantle:'edge',basin:'organ',saddle:'sole'};

export function rollFaunaProfile(world,base,seed,part){
 const role=world===2&&base==='petal'?'edge':world===2&&base==='mantle'?'blade':baseRoles[base];
 const roll=Math.imul((seed^Math.imul(part+1,0x9e3779b9))>>>0,0x45d9f3b);
 return role&&(roll>>>28)<11 ? faunaRegionalProfiles[world][role] : base;
}

export function faunaLoft(profile,x,y,z,w,h,d,tilt,{opening=0,twist=0,notch=0}={}){
 const sections=stations[profile],cross=faunaCrossSections[profile];
 const co=Math.cos(tilt),si=Math.sin(tilt);
 const rx=Math.abs(co)*w+Math.abs(si)*h,ry=Math.abs(si)*w+Math.abs(co)*h;
 return {
  bounds:[x-rx,y-ry,x+rx,y+ry],front:z+d,
  sample(px,py,out){
   const dx=px-x,dy=py-y;
   const u=(dx*co+dy*si)/w,v=(dy*co-dx*si)/h;
   if(Math.abs(u)>=1||Math.abs(v)>=1)return -Infinity;
   let i=1;
   while(u>sections[i][0])i++;
   const [start,a0,b0,c0]=sections[i-1],[end,a1,b1,c1]=sections[i];
   const du=end-start,t=(u-start)/du;
   const center=between(a0,a1,t)+twist*u*(1-u*u);
   const bite=Math.max(0,1-Math.abs(u-.24)*5);
   const sign=v<center?-1:1;
   const widthLimit=.99-sign*center;
   const biteWeight=notch*(sign>0?1:.36);
   const span=between(b0,b1,t);
   const width=Math.min(widthLimit,span*(1-biteWeight*bite));
   const lateral=(v-center)/width,across=Math.abs(lateral);
   if(across>=1||(opening&&u*u*1.24+lateral*lateral<opening))return -Infinity;
   const height=between(c0,c1,t),section=cross(across);
   const crossSlope=faunaSectionSlope(cross,across);
   const centerSlope=(a1-a0)/du+twist*(1-3*u*u);
   const biteSlope=bite>0?(u<.24?5:-5):0;
   const widthSlope=width===widthLimit?-sign*centerSlope:
    (b1-b0)/du*(1-biteWeight*bite)-span*biteWeight*biteSlope;
   const nx=-d*((c1-c0)/du*section-height*crossSlope*(sign*centerSlope+across*widthSlope)/width)/w;
   const ny=-d*height*crossSlope*sign/(width*h);
   const norm=1/Math.hypot(nx,ny,1);
   out[0]=(u+1)*.5;out[1]=(lateral+1)*.5;
   out[2]=(nx*co-ny*si)*norm;out[3]=(nx*si+ny*co)*norm;out[4]=norm;
   return z+d*height*section;
  },
 };
}
