// Three acts of one teaser. Actor transforms own their portals and contacts.
export const frikMemoryNames=['Survivors · jade','What the water kept · amber','The answering dark · violet'];
const layouts=[
 {bridge:{x:0,y:0,scale:1},visitor:{x:.034,y:.104,scale:.88,mirror:true},
  distant:{x:.001,y:.307,scale:.215},mirrorBridge:false},
 {bridge:{x:-.105,y:.028,scale:.94},visitor:{x:-.091,y:.200,scale:.80,mirror:true},
  distant:{x:.008,y:.249,scale:.244},mirrorBridge:false},
 {bridge:{x:.155,y:.005,scale:.98},visitor:{x:.190,y:.090,scale:.96,mirror:true},
  distant:{x:.009,y:.285,scale:.218},mirrorBridge:true},
];
export const frikMemoryLayout=trip=>layouts[frikStoryIndex(trip)];
export const frikActorPoint=(actor,x,y)=>[actor.x+actor.scale*(actor.mirror?1-x:x),actor.y+actor.scale*y];
export function frikMemoryGate(scene,gate,trip){
 const layout=frikMemoryLayout(trip);
 if(scene===0){
  const point=frikActorPoint(layout.bridge,gate[0],gate[1]);
  return [...point,gate[2]*layout.bridge.scale];
 }
 if(scene===6){
  const base=layouts[0].visitor,actor=layout.visitor;
  return [actor.x+(gate[0]-base.x)*actor.scale/base.scale,
   actor.y+(gate[1]-base.y)*actor.scale/base.scale,gate[2]*actor.scale/base.scale];
 }
 return gate;
}
export const frikCymaticProfiles=[
 {modes:[2,3],gain:1.05,tint:'#39e6ce',kind:'nodes',grid:[19,9]},
 {modes:[3,5],gain:1.35,tint:'#ffa761',kind:'rings',grid:[23,11]},
 {modes:[4,7],gain:1.65,tint:'#bb7dff',kind:'spiral',grid:[25,13]},
];
// First contact follows the rescue. The keeper can show the two wrecks and their
// common carrier. The identity and original purpose of the satellites lie beyond this encounter.
// Each seven-shot act follows the existing eye/world/creature/eye route.
// The keeper is testifying. The board carries messages from the same case.
export const frikStoryTitles=[
 Array(7).fill('FRIKEN.GHOST  /  FIRST SIGNAL'),
 Array(7).fill('FRIKEN.GHOST  /  LOSS RECORD'),
 Array(7).fill('FRIKEN.GHOST  /  RETURN CHANNEL'),
];
// Seven water signs in the keeper’s written account: vessel, home, gate, brood,
 // shore, answer and paired boats. The native signs survive the English gloss.
export const frikWaterSigns=['╲≈╱  ·  ║','◉  ≈≈  ⌂','║  ◇  ╫','◌  ◌  ◉','≈  ╱╲  ≈','· ·  ≈  · ·','╲╱  ≈  ╲╱'];
export const frikTestimony=[
 'I held the water out to you. You looked for a mouth. I remember doing that the first time someone offered me a memory.',
 'This was our home. At low tide you could walk to my sister’s door. At high tide she sent a bowl across on a string.',
 'We built the gate we were given. The machine counted our ships as they fled. One tooth in its drum was broken. My ship passed in the gap.',
 'My sister marked that egg so she would know the first young one when it hatched. Listen. There is still someone inside knocking.',
 'The bank went out from under them. This water is the last place where anything that lived on that shore can still feel its feet touch mud.',
 'We found your ship by following the same scan. We gave the machine our dead to count. While it counted, we cut. Your little board sent two taps back. Other bowls are answering from much farther down.',
 'My sister would have pulled the string and sent the bowl back full. A million bowls are still knocking. Bring your ship alongside mine. Let us go and see who is inside.',
];
export function keeperLine(scene,answered=false){
 return scene===6&&answered?'Your hand tapped twice. Mine can do that too. A million bowls are still knocking. Bring your ship alongside mine. Let us go and see who is inside.':frikTestimony[scene];
}
export const frikStories=[
 [
  'The Frik ship pulls alongside our colony ship. Its captain holds out a bowl of water. The signal coming from it feels like someone counting heads.',
  'An ocean planet turns in his eye. The grief arrives before the picture. Captain, I think he is showing us where he lived.',
  'His claw touches the bowl. I get the smell of a wet doorstep. I have never had a doorstep.',
  'Three eggs. He keeps sending the chipped one. Whatever he wants us to understand, it lived here.',
  'Look through her eye. The swimmer has three warm gills. She knows exactly where he is.',
  'Trying a human hello. Two modem chirps, written into the water. If this works, I invented damp mail.',
  'His claw stays in the bowl. Our last picture of Earth comes up beside his shore. Oh. He knows.',
 ],
 [
  'Same doorstep. This time I can feel the weight of somebody leaving it for the last time.',
  'The black satellite opens. Their boats go through. The little lights on the coast go out from west to east.',
  'A collector follows their last ship. Its drum turns, catches, turns again. That missed beat is why anyone remembers.',
  'One last ordinary thing. He turns the chipped egg uphill. Its mother turns it right back.',
  'Through the swimmer I feel the bank lift. All four feet leave it. When they come down there is no bank.',
  'I send the collector’s broken rhythm down our reply line. The water gives me the rhythm of the drone they shot off our stern.',
  'The keeper sends the shore again. His feet are dry. Captain, I think this is what a grave looks like on a ship.',
 ],
 frikTestimony,
];
export const frikRewindLines=[
 'Replaying the carrier. The grief peaks a full second before the coast goes dark.',
 'Running our two-tap answer back through the water. Something kept the return address.',
 'Both ships keep the channel open. Replaying from first contact with the bindings we kept.',
];
export const frikRewindTitles=['GHOST  /  ISOLATING THE SECOND VOICE','GHOST  /  LISTENING ON RETURN','GHOST  /  MEMORY RETAINED'];
export const frikRewindRate=12;
export const frikCameraRate=.75;
export const frikStoryIndex=trip=>((trip%3)+3)%3;
// Reveal the incoming parent around its already visible child on the way out.
export const rewindArtTrip=(scene,trip,rewinding,last=6)=>rewinding&&scene<last?frikStoryIndex(trip+1):trip;
export const endingReadSeconds=trip=>Math.max(4.4,frikStories[frikStoryIndex(trip)].at(-1).split(/\s+/).length/2.7);
export function frikTraversalBoundary({scene,trip,direction,depthZoom},scenes){
 if(direction>0){
  if(scene===scenes.length-1)return {scene,trip,direction:-1,depthZoom,
    elapsed:scenes[scene].duration,seedStep:0};
  return {scene:scene+1,trip,direction,depthZoom:depthZoom+scenes[scene].zoom,elapsed:0,seedStep:1};
 }
 if(scene>0)return {scene:scene-1,trip,direction,depthZoom:depthZoom-scenes[scene-1].zoom,
   elapsed:scenes[scene-1].duration,seedStep:-1};
 return {scene:0,trip:frikStoryIndex(trip+1),direction:1,depthZoom:0,elapsed:0,seedStep:0};
}
export function frikStoryCaption(scene,trip=0,rewinding=false){
 const index=frikStoryIndex(trip);
 return rewinding?frikRewindLines[index]:frikStories[index][scene];
}

// Cross-channel grades provide distinct material palettes, rather than a
// barely visible RGB exposure change. Black remains black and relief survives.
const neutral=[1,0,0,0,1,0,0,0,1];
const copper=[.76,.52,.05,.12,.59,.12,.23,.09,.55];
const orchid=[.89,.18,.09,.05,.75,.13,.19,.18,.87];
const electric=[.28,.09,.29,.09,.72,.26,.18,.43,.79];
const gold=[.83,.38,.09,.19,.69,.06,.14,.06,.41];
const grades=[
 Array(7).fill(neutral),
 [copper,orchid,gold,copper,gold,gold,copper],
 [electric,electric,orchid,orchid,electric,orchid,electric],
];
export const frikStoryGrade=(scene,trip=0)=>grades[frikStoryIndex(trip)][scene];
export function gradeFrikStory(ink,grade){
 const r=ink>>16&255,g=ink>>8&255,b=ink&255;
 return Math.min(255,Math.round(r*grade[0]+g*grade[1]+b*grade[2]))<<16|
  Math.min(255,Math.round(r*grade[3]+g*grade[4]+b*grade[5]))<<8|
  Math.min(255,Math.round(r*grade[6]+g*grade[7]+b*grade[8]));
}
