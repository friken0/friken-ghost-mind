// A three-ring calibration puzzle. The packet selects its entry and reward.
// Ring phases wrap by three. The move counter belongs to the current visit.
export const relayPairs = Object.freeze({ab:[0,1], bc:[1,2], ca:[2,0]});
export const relayLimit = 5;
export function newLetterRelay() {
 return {rings:[1,0,2],moves:0,message:'Align all three rings to LOCK, then send.'};
}

export function advanceLetterRelay(relay, action) {
 if(action==='reset')return newLetterRelay();
 const aligned=relay.rings.every(phase=>phase===0);
 if(action==='send')return {...relay,sent:aligned,message:aligned
  ?'RETURN SIGNAL CONFIRMED'
  :'Static on the return line. All three rings must read LOCK.'};
 if(!Object.hasOwn(relayPairs,action)||relay.sent)return relay;
 if(relay.moves>=relayLimit)return {...relay,message:'No turns left. Reset the rings and try a fresh path.'};
 const pair=relayPairs[action];
 const rings=relay.rings.map((phase,i)=>pair.includes(i)?(phase+1)%3:phase);
 const moves=relay.moves+1;
 return {rings,moves,message:rings.every(phase=>phase===0)?'All three locked. Send when ready.'
  :moves===relayLimit?'No turns left. Reset the rings and try a fresh path.'
  :'Check all three rings after each turn.'};
}
