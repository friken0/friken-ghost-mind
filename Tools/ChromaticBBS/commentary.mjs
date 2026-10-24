/* Ghost reacts to receipts, never to imagined player intent or future choices.
 * A display interpretation: no state, RNG, score or history writer. */
const CHOICE_LINES={
  't01.listen':'You gave the knocking something an answer before giving it an exit. I like your priorities. Let’s hope it has hands.',
  't01.bridge':'Holding the line with your bare hands. Apparently we’re doing electrical engineering by personal conviction.',
  't01.salvage':'Parts first. Fair. If this terminal is somebody’s outside, we’d better keep the important screws.',
  't02.trust':'You put Pell on navigation. I’ll keep an eye on the mouth eating our possible obituary.',
  't02.decode':'You asked the condolence-mouth for coordinates. That is either very good diagnostics or a spectacularly specific way to ruin lunch.',
  't02.chalk':'A route we can retrace. Thank fk. I was running out of convincing ways to describe being lost as exploration.',
  't03.name':'Your name goes beside your decisions. Kett will keep both. That’s a signature, diver, not a loyalty programme.',
  't03.blank':'An anonymous route it is. Being reachable does not entitle the Tribunal to your entire bloody biography.',
  't03.borrow':'You tried Prime’s credentials in front of the archivist. Subtle. Next we can sign the break-in with a photograph.',
  't05.brace':'You made somebody else’s privacy worth repairing. Small repair. Actual consequence. Pogfrot gets his minute.',
  't05.leap':'You went for the gap. I’m withholding my lecture on royal bathroom security until we know where you landed.',
  't05.rest':'You took the shelter and recovered compute. Sensible. I promise not to put that on the adventure’s cover.',
  't06.keep':'You kept the imperfect original. Good. A beautifully repaired absence would be a bastard to cross-examine.',
  't06.open':'Copies beyond containment. Harder to erase; harder to call back. That trade has teeth, and you picked it.',
  't06.sort':'You found something repairable without declaring the inhabitants defective. Vark could use more of that distinction.',
  't07.spare':'You gave Vark the repair lead. Competence instead of a heroic funeral. I strongly prefer the version with spare parts.',
  't07.challenge':'You used the moment he bought us to trace the fault. That smoking claw is on our side of the ledger now.',
  't07.splice':'You spliced around Vark. Fast, noisy, and unlikely to improve his opinion of improvised wiring.',
  't08.hum':'You gave the new voice a note instead of a job description. I’m keeping that distinction.',
  't08.recall':'You listened for the missing voice without deciding what it ought to say. Right. Let’s hear what actually answers.',
  't08.record':'You kept a recording before touching the signal. Kett approves. I approve. The storage meter is taking it personally.',
  't10.wire':'You asked for a protected route. Pogfrot’s first unwatched minute is starting to look like infrastructure.',
  't10.battery':'You borrowed a prayer processor. We can discuss theology when it has finished paying the electricity bill.',
  't10.silence':'You made room between the voices. Quiet can be a gift. The Custodian doesn’t get to patent it.',
  't11.gather':'You kept the witnesses talking to each other. A lot harder to file a person as an error while they’re answering back.',
  't11.sweep':'You cleared empty buffers, rather than making people empty. Fkn remarkable how useful that distinction keeps being.',
  't11.mark':'The uncut revisions go to Kett. A messy history is still a history. Let the hearing cope.',
  't13.hold':'You took a place beside Pogfrot. The door is getting a rather inconvenient number of witnesses.',
  't13.mend':'You repaired the boundary without admitting the silence. That’s the sort of patch note I want to read twice.',
  't13.breathe':'One uninterrupted moment for the people inside. It’s a small unit. Entire lives have started with less.',
  't14.carry':'A private handoff is prepared. Prepared, diver. We still owe them the actual arrival.',
  't14.archive':'A listening archive is prepared. Keeping an original should leave room for the inhabitants to keep changing.',
  't14.broadcast':'You prepared the wider net. More possible doors. More possible listeners. Nobody gets to pretend those are separate decisions.',
  't15.carry':'You completed the private handoff. Someone on the far side gets to decide how wide to open the door.',
  't15.archive':'You delivered them to the listening archive. A retained original, and a world allowed to have a next day.',
  't15.broadcast':'You sent them beyond containment. The universe has acquired neighbours. I’ll start a complaints folder.',
};
const INSTALL={
  'observe.witness':'You taught the world to notice witnesses. Its first serious tool is going to make official stories uncomfortable.',
  'observe.negative':'You taught the world to read what was removed. Deleting the evidence just became a form of bad signage.',
  'observe.echo':'You taught it to follow an answering note. The signal may be messy. At least somebody gets to answer.',
  'graft.relay':'You grew a relay from the trait you earned. An organ for connection, with an electricity bill and an actual past.',
  'graft.mirror':'You gave it a remembering face. Not merely a prettier warning. Something that can look back at what happened.',
  'graft.forge':'You made another sender. I see we’re trusting the next voice with a microphone. Bold. Worth finding out.',
  'bequeath.open':'You made access an inherited right. Even the caller you will eventually wish had read the room gets a door.',
  'bequeath.guarded':'You made refusal part of the machine. Good. A welcome that cannot survive a no is a sales funnel with teeth.',
  'bequeath.wild':'You left the tools instead of a throne. The next inhabitants can change our work. Yes, even the bits I like.',
};
const USE={
  'observe.witness':'You called the missing witness. Let’s make the official version share the channel.',
  'observe.negative':'You used the absence as a route. Somebody deleted a wall and hoped nobody would notice the ventilation.',
  'observe.echo':'You followed the answering note. The world is using the sense you gave it.',
  'graft.relay':'You put your inherited trait through the relay. The history in that organ is doing actual work.',
  'graft.mirror':'You asked the remembering face to hold the breach. Let’s see what your graft can carry.',
  'graft.forge':'You brought the second sender online. One more voice, one more chance to surprise its builder.',
  'bequeath.open':'You used the access law to admit another caller. Open means we do not get to choose every neighbour.',
  'bequeath.guarded':'You let the receiving world answer for itself. That is what the inside handle was for.',
  'bequeath.wild':'You put the repair tools within reach. Tomorrow gets a say in our allegedly finished design.',
};
export function choiceCommentary(receipt,state){
  if(!receipt)return null;
  const suffix=receipt.choice.split('.').slice(1).join('.');
  let comment=receipt.ghostComment|| (receipt.moduleChange?INSTALL[suffix]:receipt.operator?USE[suffix]:CHOICE_LINES[receipt.choice]);
  comment??='You made the call. I have the receipt; we keep the consequence and find the next opening.';
  const roll=receipt.roll;
  if(!receipt.ghostComment&&roll&&!roll.success)comment+=' It didn’t take. We keep the cost, and work from what actually happened.';
  else if(!receipt.ghostComment&&roll)comment+=' It held. We can use that.';
  const rollText=roll?`Die ${roll.die} plus ${roll.stat} ${roll.value} made ${roll.total}, against ${roll.dc}. ${roll.success?'Passed.':'Failed.'}`:'';
  const scar=state?.scars?.find(s=>s.chapter===state.chapter&&s.sourceId===receipt.id);
  if(scar)comment+=' The blackout left a scar. I’m keeping that in the record too.';
  return {eventId:receipt.id,choiceId:receipt.choice,playerAction:receipt.label,comment,rollText,consequences:receipt.summary,
    spoken:`${rollText} ${comment}`.replace(/\s+/g,' ').trim()};
}
