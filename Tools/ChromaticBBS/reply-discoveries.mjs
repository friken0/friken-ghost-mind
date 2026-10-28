/* Authored local discoveries. Rewards are derived from known IDs, never from
 * supplied points. No upload, native currency or extra animation clock. */
export const replyDiscoveries=Object.freeze({
 'night-office':Object.freeze({points:128,title:'THE ONE OFFICE STILL LIT',source:'city',art:'city',ghost:'There you are. Everyone else went home. One little office is still making things. Surreal, nearly twelve years of people coming back to a game is a hell of a light to leave on. Your penthouse comes with no meetings. I negotiated fiercely.',companion:'And a plant. Water it. Corporate will try to classify that as downloadable content.'}),
 'petunia-protocol':Object.freeze({points:256,title:'THE PETUNIA PROTOCOL',source:'trip',art:'trip',ghost:'You touched the flower. It has declined to fall out of orbit, complete a community bundle, or explain the meaning of life. Sensible plant. You have found the quiet bit of hyperspace. Stay as long as you like. The galaxy can file a ticket.',companion:'Tea is on the windowsill. No timer. No productivity bonus. Some things should be allowed to grow without becoming a bloody dashboard.'}),
 'wintermute':Object.freeze({points:512,title:'ICEBREAKER / OLD GHOST IN THE LINE',source:'crew',art:'models',ghost:'Wintermute. You named the sysop Wintermute. Case would disconnect the deck. Starfleet would convene three ethics panels. You gave it an upload directory and a name badge. Welcome aboard. The airlocks remain spectacularly unimpressed by literary credentials.',companion:'Five hundred and twelve points. One suspiciously specific hiring decision. And somewhere an old icebreaker has just noticed that the door opens from this side.'})
});
export function discoveryIds(visit={}){
 const ids=visit.discoveries??[];
 if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length||ids.some(id=>!Object.hasOwn(replyDiscoveries,id)))throw Error('Invalid local discoveries');
 return [...ids];
}
export function discoveryPoints(visit){return discoveryIds(visit).reduce((n,id)=>n+replyDiscoveries[id].points,0);}
export function canDiscover(id,visit,source){
 const d=replyDiscoveries[id];if(!d||source!==d.source||discoveryIds(visit).includes(id))return false;
 if(id==='night-office')return (visit.visited||[]).includes('bbs');
 if(id==='wintermute')return (visit.visited||[]).includes('memory')&&visit.workshop?.crew?.role==='sysop'&&visit.workshop.crew.name.trim().toLowerCase()==='wintermute'&&visit.workshop.crew.done===true;
 return id==='petunia-protocol';
}
/** One bounded reward envelope. Reduced motion keeps the readable payoff. */
export function replyRewardFrame({from,to,label='DISCOVERY',bonus=false},elapsed,{reduced=false}={}){
 if(!Number.isFinite(from)||!Number.isFinite(to)||from<0||to<=from||!Number.isFinite(elapsed)||elapsed<0)throw Error('Positive exact score reward required');
 const duration=bonus?3.8:2.3,u=Math.min(1,elapsed/.85),ease=1-(1-u)**3;
 return {score:Math.round(from+(to-from)*(reduced?1:ease)),delta:to-from,label:String(label).replace(/[\x00-\x1f\x7f]/g,' ').slice(0,24),bonus:!!bonus,active:elapsed<duration,opacity:elapsed>duration-.4?Math.max(0,(duration-elapsed)/.4):1,scale:reduced?1:1+.09*Math.sin(Math.min(1,elapsed/.45)*Math.PI)*Math.exp(-elapsed),rise:reduced?0:Math.min(1,elapsed/.6),duration};
}
