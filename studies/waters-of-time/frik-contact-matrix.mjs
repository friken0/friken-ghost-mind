import {flightTraces} from './lancing-route.mjs';
// Offline instrument for one Frik encounter. Repeated samples of the same
// transmission are one piece of evidence, regardless of frame rate.
const shore={id:'shell',x:.599,y:.779,r:.026,name:'Under the chipped shell',concept:'answer',hint:'The brood mother keeps turning one shell uphill.'};
const paths=[
 {id:'measure',x:.728,y:.603,r:.026,name:'The flood gauge',concept:'home',hint:'A thin procession crosses the nearest bowl.'},
 {id:'tooth',x:.182,y:.232,r:.024,name:'One tooth short',concept:'spared',hint:'A filament runs into the missing corner of the satellite.'},
 {id:'tidebook',x:.232,y:.586,r:.024,name:'The ferryman’s tide book',concept:'departure',hint:'Follow the green pinpricks down the left cave wall.'},shore,
 {id:'molts',x:.797,y:.354,r:.025,name:'A wall of empty skins',concept:'before',hint:'A line of pale hooks leads away from the swimmer.'},
 {id:'post',x:.19,y:.705,r:.027,name:'The return address',concept:'together',hint:'A carrier light runs backwards below the F.'},null,
];
export function frikTrace(scene,mirror=false){
 const path=paths[scene];
 return scene===0&&mirror?{...path,x:1-path.x}:path;
}
export function traceInFocus(scene,trip,pose){
 const path=frikTrace(scene,trip===2);
 if(!path)return null;
 const footprint=2**-pose.zoom;
 const d=Math.hypot((pose.centerX-path.x)/path.r,(pose.centerY-path.y)/(path.r*1.45));
 return path.r/footprint>=.24&&d<.83?path:null;
}
export const traceReadings={
 measure:['Four scratches in the basin wall. Three stop at the flood line. The fourth kept growing.',
  'The water carries a doorpost. Someone marked a child’s height on it every flood season.'],
 tooth:['The broken wheel tries again. Same tooth. Same click. The ship slips between clicks.',
  'There. The Frik archive drum skipped one berth. Every Frik alive fits inside that mechanical error.'],
 shell:['Something in the dark taps twice. The animal outside answers with its chin.',
  'The shell was occupied. Ghost correction: the third beat belongs to the child.'],
 tidebook:['I thought these grooves were tide marks. They come in pairs. One deep, one shallow.','Two boatloads every flood. On the last row the ferryman scratched one stroke and put his tool down.'],
 molts:['Little hooks, all facing uphill. A whole animal ought to have more weight than that.','They are shed skins. The swimmer came back here every year. The last hook is bare.'],
 post:['My outgoing bit is back. Same address. Someone has added a second pulse.',
  'Our reply survived a round trip through their water. We can leave a message here.'],
};
export const traceTotal=paths.filter(Boolean).length+flightTraces.length;
const ids=new Set([...paths.filter(Boolean),...flightTraces].map(p=>p.id));
const key='friktal.frik-first-contact.matrix.v1';
export const matrixStages=['Carrier isolation','Hive / Waters separation','Affect alignment','Duplex matrix'];
const costs=[3,8,16];
export function openFrikMatrix(storage){
 const seen=new Set(),traces=new Set(),chapters=new Set();
 let rank=0,answered=false,evidence='';
 const points=()=>seen.size+traces.size*3;
 const complete=trip=>Array.from({length:7},(_,scene)=>seen.has(trip+'/'+scene)).every(Boolean);
 const readingRank=()=>complete(0)?(complete(1)?3:1):0;
 const earned=()=>Math.max(readingRank(),costs.filter(cost=>points()>=cost).length);
 function sync(){
  let saved;
  try{saved=JSON.parse(storage?.getItem(key)??'null');}catch{}
  if(Array.isArray(saved?.seen))for(const code of saved.seen){
   if(typeof code==='string'&&/^[0-2]\/[0-6]$/.test(code))seen.add(code);
  }
  if(Array.isArray(saved?.traces))for(const id of saved.traces)if(ids.has(id))traces.add(id);
  if(Array.isArray(saved?.chapters))for(const n of saved.chapters)if(Number.isInteger(n)&&n>=0&&n<8)chapters.add(n);
  answered ||= saved?.answered===true;
  rank=Math.max(rank,readingRank(),Math.min(earned(),Number.isInteger(saved?.rank)?saved.rank:0));
  evidence=[...traces].join(',');
 }
 sync();
 function save(){
  sync();
  try{storage?.setItem(key,JSON.stringify({chapters:[...chapters],seen:[...seen],traces:[...traces],rank,answered}));}catch{}
 }
 function record(group,id){
  if(group.has(id))return false;
  group.add(id);save();return true;
 }
 return {
  listen(scene,trip){return Number.isInteger(scene)&&scene>=0&&scene<7&&Number.isInteger(trip)&&trip>=0&&trip<3&&record(seen,trip+'/'+scene);},
  hearChapter(n){return Number.isInteger(n)&&n>=0&&n<8&&record(chapters,n);},
  get score(){return Math.round(70*(chapters.size+seen.size)/29+30*traces.size/traceTotal);},
  discover(id){return ids.has(id)&&record(traces,id);},
  tune(){if(rank>=earned())return false;rank++;save();return true;},
  answer(){if(answered)return false;answered=true;save();return true;},
  sync,
  get evidence(){return evidence;},get answered(){return answered;},
  get rank(){return rank;},get points(){return points();},get needed(){return costs[rank];},
  get ready(){return rank<earned();},get stage(){return matrixStages[rank];},get next(){return matrixStages[rank+1];},
  get finds(){return traces.size;},has:id=>traces.has(id),
 };
}
// Each aligned concept belongs to one voice. Missing fragments stay audible
// as gaps even at full calibration; a first encounter cannot resolve a motive.
const carriers=[
 ['vigilance','count','warm bodies','still aboard'],
 ['recognition','above-us','black beetle','door opened'],
 ['grief','hold','water keeps','last morning'],
 ['tenderness','three','one inside','turn gently'],
 ['alarm','rising','floor moved','no shore'],
 ['curiosity','two taps','your mark','send again'],
 ['longing','here','your loss too','come look with us'],
];
export function matrixStrip(scene,rank,trip){
 const [feeling,hive,water,joined]=carriers[scene];
 const affect=trip===1?['shock','dread','disbelief','protect','panic','doubt','absence'][scene]:
  trip===2?['trust','recognition','hope','expectation','wonder','surprise','resolve'][scene]:feeling;
 return ['AFFECT  '+affect.toUpperCase(),rank?'HIVE  '+hive:'HIVE  ···',
  rank>1?'WATERS  '+water:'WATERS  ≈≈',...(rank===3?[joined]:[])].join('   /   ');
}

// An observation can change the reading of a different scene on replay.
export function recoveredReading(scene,trip,rank,evidence='',answered=false){
 if(answered&&trip===2&&scene===6)return 'Your two taps. A pause. Two more, from under his claw. Captain, I can put one word in the dictionary. Us.';
 if(trip===0||rank<2)return null;
 const found=evidence.split(',');
 if(scene===0&&found.includes('measure'))return 'There’s the doorpost again. Four notches. On Earth we used kitchen walls. How do I tell him that was our custom too?';
 if(scene===2&&found.includes('tooth'))return 'Found the skipped berth in the drum. It has the shape of the ship we’re standing beside. Every living Frik fits in that mistake.';
 if(scene===4&&found.includes('shell'))return 'I called it an echo. The little heart in the egg keeps beating after the mother stops tapping. Two animals. Two witnesses.';
 if(scene===5&&found.includes('post'))return 'That strip of paper in the water is ours. On the way back it picked up an address. Someone in there knows where we live.';
 return null;
}

export {returnArtCamera as traceReturnCamera} from './ansi-review-camera.mjs?v=lancing-1';
