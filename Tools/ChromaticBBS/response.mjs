import {validateTransmission} from './alien-comms.mjs';
import {choiceCommentary} from './commentary.mjs';
/* Response data boundary: a renderer cannot choose, evaluate code, or save. */
export function responsePacket(state,frame){
  return validateResponse({schema:'friken.ghost.response.v1',kind:state.ending?'outcome':'scene',source:{kernel:state.pack?'FG:C26/2':'FG:C26/1',runId:state.runId,chapter:state.chapter,turn:state.turn,parent:state.parent||null},content:{title:frame.title,scene:frame.scene,ghost:frame.sceneGhost||frame.ghost,...(frame.lead?{lead:frame.lead}:{}),...(frame.transmission?{transmission:frame.transmission}:{})},choices:frame.choices.map(c=>({id:c.id,label:c.label,detail:c.detail})),receipt:state.lastReceipt?structuredClone(state.lastReceipt):null,artifact:{form:state.world.relic.form,revision:state.world.relic.revision},decision:choiceCommentary(state.lastReceipt,state),voice:{scene:'silent',ghost:'ghost'}});
}
export function validateResponse(packet){
  if(!packet||JSON.stringify(packet).length>48000||packet.schema!=='friken.ghost.response.v1'||!['scene','outcome','news','inspection'].includes(packet.kind))throw Error('Unsupported response packet');
  const str=(x,n)=>typeof x==='string'&&x.length<=n&&!/[\u0000-\u0008]/.test(x);
  if(!packet.source||!['FG:C26/1','FG:C26/2'].includes(packet.source.kernel)||!str(packet.source.runId,100)||!Number.isInteger(packet.source.turn)||packet.source.turn<1||packet.source.turn>(packet.source.kernel==='FG:C26/2'?21:16)||!Number.isInteger(packet.source.chapter)||packet.source.chapter<1)throw Error('Invalid response provenance');
  if(!packet.content||!['title','scene','ghost'].every(k=>str(packet.content[k],6000))||!Array.isArray(packet.choices)||packet.choices.length>3||packet.choices.some(c=>!str(c.id,100)||!str(c.label,300)||!str(c.detail,1500))||new Set(packet.choices.map(c=>c.id)).size!==packet.choices.length)throw Error('Invalid response content');
  if(packet.decision!=null&&(!str(packet.decision.eventId,100)||!str(packet.decision.choiceId,100)||!str(packet.decision.playerAction,300)||!str(packet.decision.comment,1200)||!str(packet.decision.spoken,2000)))throw Error('Invalid decision commentary');
  if(packet.content.transmission!==undefined)validateTransmission(packet.content.transmission);
  if(packet.content.lead!==undefined&&!str(packet.content.lead,1800))throw Error('Invalid Ghost introduction');
  if(packet.voice?.scene!=='silent'||packet.voice?.ghost!=='ghost')throw Error('Invalid voice routing');
  // This validates display shape, not authenticity or canonical game state.
  return structuredClone(packet);
}
export function renderResponse(root,packet){
  const p=validateResponse(packet);
  for(const k of ['title','scene','ghost'])root.querySelector('#cg-'+k).textContent=p.content[k];
  const lead=root.querySelector('#cg-ghost-lead');if(lead){lead.textContent=p.content.lead||'';lead.parentElement.hidden=!p.content.lead;}
  const decision=root.querySelector('#cg-decision');decision.hidden=!p.decision;
  if(p.decision){root.querySelector('#cg-player-action').textContent='YOU / '+p.decision.playerAction;root.querySelector('#cg-choice-comment').textContent=p.decision.comment;}
  root.responsePacket=structuredClone(p);
  return p;
}
