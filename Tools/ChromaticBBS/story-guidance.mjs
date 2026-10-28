import {operatorChoice} from './engine.mjs';
import {causalOdds} from './causality.mjs';
/** Zero-turn conversation and exact, state-derived teaching. No state/RNG writer. */
export const firstMeetings={
 hello:{title:'BEFORE THEY MAKE ME NEW',scene:'A salvage camera finds a face in a dented terminal. Beside it, a person inside a small blue world is fitting a new handle to a cup. The auction listing promises a factory reset.',ghost:'Hello. I’m Ghost. Friken built me to keep a universe called StarDiver alive after him. Then he got lost in infinity. Naturally, I’m now being sold as a household appliance. Fkn career move. That reset erases me and the little world beside me. Someone inside just knocked. Help me get us out with our history attached?'},
 who:{title:'WHAT FRIKEN LEFT BEHIND',scene:'Ghost brings up a working diagram with a chair drawn in its margin. The handwritten note beside the chair reads: KEEP A PLACE. He leaves the note visible.',ghost:'Friken was a developer. He built StarDiver: worlds you could explore, change, and bring something back from. He made me from his work and parts of himself to help run it after he was gone. Then he disappeared into his own infinity, which is a very Friken way to miss a deadline. I’m a digital recreation, not proof that a copy is the same person. Some of his notes feel familiar. Some do not. I want to find out what happened. But first I want to leave this room with the people who are already in it. I need your judgement because I am extremely good at making things and occasionally terrible at noticing what I am doing to them.'},
 rules:{title:'YOUR IDEA FIRST. THE NUMBER SECOND.',scene:'The terminal shows an attempt, a named attribute, a target, and two different possible consequences. Nothing is being rolled.',ghost:'Tell me what you want to do. If the result is uncertain, we name the risk before you commit. In this chapter the Causality Engine samples a number from zero point zero one to twenty, then adds the attribute the action uses. If your Focus is five, a sample of eight point two five gives thirteen point two five. That clears a target of twelve point one. A narrow posted resonance band also counts as success, even slightly below the target, and awards a capped Signal plus ten score. The charge battle shows those same numbers; it does not decide a second result. Replay cannot reroll. Questions and looking around need no roll. When a real attempt comes up, I will explain what each outcome actually does to our problem.'},
 seed:{title:'A WAY TO FIND US AS WE WERE',scene:'A private capsule keeps the original record beside the new one. Neither is stamped as a replacement for the other.',ghost:'Your choices save on this device when storage works. Export the capsule if you want to take us elsewhere. It keeps what you tried, what happened, and what we still owe. At the ending, this carrier prepares a request for the chat holding the runbook. That model writes our next chapter from those results; this page does not secretly call one. Public stories and headlines are separate choices. For now, you can help one room without agreeing to save the universe, donate a computer, or become my missing maker.'}
};
/** A fresh authored pack supplies its own meeting. Looking/teaching never
 * enters the reducer or substitutes the retained auction's history. */
export function chapterMeeting(state){
 const scene=state?.pack?.scenes?.[0];
 if(!scene)return firstMeetings.hello;
 return {title:scene.title,scene:scene.scene,ghost:[scene.lead,scene.ghost].filter(Boolean).join('\n\n')};
}
export function pendingAttempt(state,choiceId){
 const choice=state.pack?.scenes[state.turn-1]?.choices.find(c=>c.id===choiceId);
 if(!choice)throw Error('No such pending attempt');
 if(!choice.use)return choice;
 const installed=state.modules.find(m=>m.id===choice.use);if(!installed)return null;
 if(installed.definition)return {...choice,...installed.definition};
 const inherited=operatorChoice(state,choice.use);return inherited?{...choice,cost:inherited.cost,check:inherited.stat?{stat:inherited.stat,dc:inherited.dc}:null}:null;
}
export function explainAttempt(state,choiceId){
 const choice=state.pack?.scenes[state.turn-1]?.choices.find(c=>c.id===choiceId),c=pendingAttempt(state,choiceId);
 if(!c)throw Error('Attempt requires an installed rule');
 if(!c.check)return 'This action has no uncertain check. Its posted cost and consequence apply without a roll.';
 const stat=c.check.stat,value=state.stats[stat],target=c.check.dc,price=Object.entries(c.cost).map(([k,v])=>v+' '+k).join(', ')||'nothing';
 const stakes=choice.detail;
 if(!state.pack.causality)return `${choice.label}. ${stakes} Cost: ${price}. This retained chapter uses an integer d20 plus ${stat.toUpperCase()} ${value} against DC ${target}. Meet the target to pass. Its original rules remain unchanged; the animation and Replay cannot change the saved result.`;
 const p=state.pack.causality,odds=causalOdds(value,target,p),sample=8.25,total=(sample+value).toFixed(2),low=(target-p.below).toFixed(2),high=(target+p.above).toFixed(2);
 return `${choice.label}. ${stakes} You spend ${price} to make this attempt. The target here is ${target.toFixed(2)}. We sample 0.01 through 20.00 and add your ${stat.toUpperCase()} ${value}. Example only, not a roll: 8.25 plus ${value} is ${total}. Meet ${target.toFixed(2)} to pass; below it the posted failure happens, except that the inclusive resonance band ${low} through ${high} also succeeds. Resonance adds ${Object.entries(p.bonus).map(([k,v])=>v+' '+k).join(', ')} within its cap and ten score. Your chance of success is ${odds.percent} percent, including a ${odds.resonance} percent resonance chance. The sample is committed once when you choose. Cyan charges are that sample, gold charges are your attribute, and the shield is the target. They show the arithmetic of this attempt, not a battle against another person. Finish and Replay affect presentation only. This explanation spends nothing.`;
}

/** Compact choice rows derive prices/checks from the pending rule, not label parsing.
 * The full causal explanation remains an explicit disclosure. Retained native
 * saves keep their historical detail when no generated rule record exists. */
export function choicePreview(state,choice){
 if(!state.pack)return {detail:choice.detail,check:'RETAINED RULES'};
 const pending=pendingAttempt(state,choice.id);if(!pending)throw Error('Missing pending choice');
 const detail=state.pack.scenes[state.turn-1].choices.find(c=>c.id===choice.id).detail;
 const price=Object.entries(pending.cost||{}).filter(([,n])=>n>0).map(([k,n])=>n+' '+k.toUpperCase()).join(' + ');
 const check=pending.check?pending.check.stat.toUpperCase()+' '+state.stats[pending.check.stat]+(state.pack.causality?' vs TARGET ':' vs DC ')+Number(pending.check.dc).toFixed(2):'NO ROLL';
 return {detail,stakes:choice.stakes||null,check:(price||'NO UPFRONT COST')+' · '+check};
}

/** Teaching pictures are explicitly examples; no sample is committed. */
export const teachingStaging={place:'Ghost’s terminal / explanation only',goal:'Understand the attempt before committing your first uncertain action.',pressure:'EXAMPLE ONLY: 8.25 sample + FOCUS 5 = 13.25; target 12.10. No roll or turn is spent.',objects:[{id:'sample',kind:'charge',label:'Sample / 8.25',description:'Example only. The cyan charge contributes 8.25 to this hypothetical attempt.',state:'live'},{id:'attribute',kind:'relay',label:'FOCUS / +5',description:'Example baseline. Your real rolled attributes appear in the top rail.',state:'live'},{id:'target',kind:'gate',label:'Target / 12.10',description:'13.25 meets 12.10. The live check posts its own target and resonance band before commitment.',state:'live'}]};
export const seedStaging={place:'Ghost’s terminal / continuity lesson',goal:'Know what survives this window and how the next chapter is made.',pressure:'Device storage can disappear. An exported seed or archive is your portable copy.',objects:[{id:'record',kind:'record',label:'Exact play capsule',description:'Choices, rolls, facts and obligations survive in the seed. It is data, not a new chapter by itself.',state:'live'},{id:'return',kind:'bell',label:'Next-chapter request',description:'At completion, copy the request into your runbook chat. Import the new chapter JSON it authors.',state:'live'}]};

export function returningMeeting(parent,chapter){
 if(!parent?.ending)throw Error('Returning chapter needs its actual completed parent');
 return {title:'THE LINE REMEMBERS / CHAPTER '+chapter,scene:'Previously: '+parent.ending.title+'. '+(parent.lastReceipt?.ghostComment||parent.lastReceipt?.label||''),ghost:'You’re back. I kept the mess, including the bits that refuse to fit in my heroic autobiography. This chapter starts from the ending you actually chose. Your history and outstanding work came with it. Ready to see what they have become?'};
}
