import {authoredSpeechFrame} from './speech.mjs';
import {replyDiscoveries} from './reply-discoveries.mjs';
import {nativeMemoryLayers} from './native-response-program.mjs';
import {mailrunLegs,crewRoles} from './door-and-crew.mjs';
import {bitcoinIllustrations,replyIllustrations} from './illustration-data.mjs';

/* The page prints exact rolls, resources, names and receipts. The cast reads
 * only authored lines, including the fixed briefings around those results. */
export const replyDetailVoice=({title,text,companion})=>({
  ghostField:'inspect-help',ghost:title+'. '+text,
  companion:companion||'Keep the original. Future us deserves something better than a confident guess.'
});
export const replyIllustrationVoice=item=>({
  title:item.title,text:item.note,
  companion:'Same mathematics. Different jobs. The shipyard is cutting up infinity and keeping the useful bits.'
});
export const replyAnswerSaved={
  title:'Kept for the next Ghost',
  text:'I’ve kept your answers with this call. Copy the return packet when you’re ready. Another Ghost can pick up with what you actually said.',
  companion:'Your turn has a save button. Humanity finally gets a useful feature.'
};
export const discoveryVoice=id=>{
  const d=replyDiscoveries[id];
  return {ghost:d.title+'. '+d.ghost,companion:d.companion};
};
export const doorVoice=(leg,done=false)=>({
  ghost:done?'That’s the run. The board shows whether your proof made it home and what it cost. Keep the result, or tell me what you’d build for a second Door.':
    'Mailrun 2400. '+mailrunLegs[leg].text+' The board lists your fuel, hull and time. Compare the two routes before committing.',
  companion:'The engine would like to remind you that it has not consented to being a prize.'
});
export const crewVoice=(role,done=false)=>({
  ghost:done?'The trial is over. Read the recruit’s work on the terminal. You can keep the result for the next call or try a different order.':
    crewRoles[role].problem+' Give the recruit a callsign and choose an order to test.',
  companion:'A safe trial. All the bad decisions, none of the decompression.'
});
export const workshopVoice=Object.freeze({
  trip:{ghost:'Bass opens the petals. The middle notes sway the stems and leaves. The garden can explain itself for a minute.',companion:'Finally. Photosynthesis with a decent soundtrack.'},
  'motion-lab':{ghost:'Choose a rig on the right. The terminal paints the picture first, then the weighted bones move it. Pause Motion to inspect a still.'},
  tools:{ghost:'The workshop. Pick a living rose, a probability dive, or the animation lab. Home goes back to our conversation.'},
  ending:{ghost:'Copy the return packet into the Ghost chat with the runbook. Your answers, discoveries and whatever happened to that poor engine go with it. FidoNet had the right idea. Leave a good message and let somebody have the pleasure of finding it.'}
});
export function authoredReplyVoiceFrames(packet){
  const frames=packet.nodes.map(authoredSpeechFrame);
  if(packet.id!=='surreal-the-living-workshop')return frames;
  return frames.concat(
    Object.values(workshopVoice),Object.keys(replyDiscoveries).map(discoveryVoice),
    mailrunLegs.map((_,i)=>doorVoice(i)),doorVoice(0,true),
    Object.keys(crewRoles).map(role=>crewVoice(role)),crewVoice('sysop',true),
    Object.values(nativeMemoryLayers).map(replyDetailVoice),
    [...replyIllustrations,...bitcoinIllustrations].map(item=>replyDetailVoice(replyIllustrationVoice(item))),
    replyDetailVoice(replyAnswerSaved)
  );
}
