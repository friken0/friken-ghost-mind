/**
 * THE UNFINISHED CARRIER — Chromatic BBS's portable, deterministic specimen.
 *
 * Fifteen decisions deform one relic and install three executable laws. The
 * interpreter is fixed; module manifests alter the legal action vocabulary,
 * costs, checks and consequences. No network, clock, storage, DOM or dependency.
 * FGC1 is canonical JSON + an accidental-damage checksum, never a signature.
 */
export const SCHEMA = 'friken.chromatic.state.v1';
export const TOTAL_TURNS = 15;
export const MAX_SEED_BYTES = 65536;
const UINT32 = 0xffffffff;
const STATS = Object.freeze({ guts: 6, focus: 5, glitch: 5, awe: 5, insight: 5, ego: 4 });
const RESOURCE_KEYS = ['signal', 'compute', 'noise'];
const RELATIONS = ['ooope', 'moknon', 'krex', 'pogfrot', 'veelow'];
const MODULE_IDS = ['observe', 'graft', 'bequeath'];
const FORMS = ['seed', 'rose', 'face', 'gate'];
const THREADS = ['missing-address', 'silent-recipient', 'unbuilt-gate'];
const FACTS = ['heard-knock', 'named-carrier', 'anonymous-carrier', 'address-found',
  'ooope-trusted', 'archive-kept', 'archive-opened', 'krex-spared', 'krex-challenged',
  'chorus-awake', 'recipient-found', 'promise-open', 'promise-guarded', 'promise-wild',
  'mail-personal', 'mail-broadcast', 'mail-archived', 'gate-inherited',
  'route-personal-prepared', 'route-broadcast-prepared', 'route-archive-prepared'];
const ACT_NAMES = ['I · THE WRONG SIDE OF HELLO', 'II · EVERYBODY NEEDS SOMETHING', 'III · WHO GETS TOMORROW'];
const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });
const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (value) => Math.max(0, Math.min(10, value));
const pad = (turn) => String(turn).padStart(2, '0');
const actionId = (turn, id) => `t${pad(turn)}.${id}`;
const unique = (values) => [...new Set(values)];

const LAWS = Object.freeze({
  observe: {
    witness: { id: 'witness', name: 'Witness the seam', trait: 'testimony',
      rule: 'OBSERVE unlocks a hidden testimony route: spend 1 compute; INSIGHT vs DC12; pass restores signal and quiets noise.' },
    negative: { id: 'negative', name: 'Read the missing pixels', trait: 'absence',
      rule: 'OBSERVE unlocks a negative-space route: spend 1 compute; FOCUS vs DC15; pass recovers compute and signal.' },
    echo: { id: 'echo', name: 'Hear what survived', trait: 'resonance',
      rule: 'OBSERVE unlocks an echo route: no compute cost; AWE vs DC12; pass restores signal; either result adds noise.' },
  },
  graft: {
    relay: { id: 'relay', name: 'Grow a living relay', trait: 'relay',
      rule: 'GRAFT composes the owned OBSERVE trait with a relay: spend 1 compute; guaranteed signal +2, noise +1.' },
    mirror: { id: 'mirror', name: 'Make a remembering face', trait: 'mirror',
      rule: 'GRAFT composes the owned OBSERVE trait with a mirror: spend 1 compute; GLITCH vs DC15; pass signal +3, noise -2; fail signal -1, noise +2.' },
    forge: { id: 'forge', name: 'Forge a second sender', trait: 'sender',
      rule: 'GRAFT composes the owned OBSERVE trait with a sender: no compute cost; GUTS vs DC18; pass compute +3, signal +2; fail signal -2, noise +2.' },
  },
  bequeath: {
    open: { id: 'open', name: 'The door belongs to everyone', trait: 'open-door',
      rule: 'BEQUEATH makes access inherited law: spend 1 compute; guaranteed signal +3, noise +1; the next chapter begins with this route.' },
    guarded: { id: 'guarded', name: 'A name may refuse the knock', trait: 'consent',
      rule: 'BEQUEATH makes consent inherited law: no compute cost; guaranteed signal +1, compute +1, noise -2; the next chapter preserves privacy.' },
    wild: { id: 'wild', name: 'Send the tools, not the throne', trait: 'wild-tools',
      rule: 'BEQUEATH makes repair inherited law: spend 1 compute; guaranteed signal +2, compute +1, noise +2; the next chapter inherits the tools.' },
  },
});

const COMPOSITIONS = Object.freeze({
  testimony: { key: 'signal', delta: 1, text: 'Owned testimony adds signal +1 to every successful graft.' },
  absence: { key: 'compute', delta: 1, text: 'Owned absence recovers compute +1 on every successful graft.' },
  resonance: { key: 'noise', delta: -1, text: 'Owned resonance removes noise 1 on every successful graft.' },
});
// Display aliases are deliberately separate from the canonical saved law names.
const MODULE_LABELS = Object.freeze({
  observe: { witness: 'CALL REALITY’S BLUFF', negative: 'READ THE PIXELS THEY DELETED', echo: 'FOLLOW PRIME’S GHOST NOTE' },
  graft: { relay: 'GROW A BOOTLEG ANTENNA', mirror: 'BUILD A FACE THAT REMEMBERS', forge: 'CLONE THE SENDER / NO WARRANTY' },
  bequeath: { open: 'PUBLIC WRITE ACCESS', guarded: 'KNOCK BEFORE GODMODE', wild: 'FORK THE FKN TOOLCHAIN' },
});
function installedLaw(id, variant, source = null) {
  const law = clone(LAWS[id][variant]);
  if (id === 'graft') {
    law.trait = `${source}+${law.trait}`;
    law.rule += ` ${COMPOSITIONS[source].text}`;
  }
  return law;
}
function possibleRules(id) {
  return Object.keys(LAWS[id]).flatMap((variant) => id === 'graft'
    ? Object.keys(COMPOSITIONS).map((source) => installedLaw(id, variant, source).rule)
    : [LAWS[id][variant].rule]);
}

const effect = (signal = 0, compute = 0, noise = 0, extra = {}) => ({ signal, compute, noise, ...extra });
function option(id, label, text, good, extra = {}) {
  return { id, label, text, good, bad: null, cost: {}, ...extra };
}
function check(id, label, text, stat, dc, good, bad, extra = {}) {
  return option(id, label, text, good, { stat, dc, bad, ...extra });
}

// Story nodes are declarative. A mundane action never consumes a random draw.
const STORY = [
  { title: "SOMEBODY INSIDE IS KNOCKING", scene: "The BBS announces one caller. Then two. The second is using your handle. Before you can object, it disconnects. A packet drops into the empty slot: PRIME TRACE / UNDELIVERED. Inside its black glass, a tiny light crosses a tiny room. Something taps the wall three times. The connection log says the taps arrive tomorrow.", ghost: "I know that signature. Friken built this place. He did not, to my knowledge, put tenants in the attachments. Let’s find out who’s knocking before the mail server develops a food chain.", choices: [
    option('listen', 'Answer the knocks', 'Listen before opening. Whoever is inside gets the first word.', effect(1, 0, -1, { fact: 'heard-knock', relations: { veelow: 1 } })),
    check('bridge', 'Hold the connection open by hand', 'Bridge the severed carrier before tomorrow’s caller vanishes.', 'guts', 12, effect(3, -1, 1), effect(-2, 0, 2)),
    option('salvage', 'Scavenge a working core', 'Take the terminal apart carefully. It has recently become somebody’s outside.', effect(-1, 2, 0, { relations: { krex: 1 } })),
  ] },
  { title: "PELL HAS TASTED YOUR ARRIVAL", scene: "An Ooope named Pell pours herself through the speaker grille. Each of her mouths is eating a different second. “Oh, you’re early. My condolence-mouth hasn’t finished.” She folds that mouth away. “Better. Prime’s trail tastes of burnt sugar and a terrible decision. I can take you there. Please keep your future out of the navigator-mouth. It gets travel-sick.”", ghost: "A guide who can taste tomorrow. Useful. I’m watching the condolence-mouth. It’s chewing.", choices: [
    option('trust', 'Let Pell navigate', 'Follow the mouth that is still giving directions. Tolerate the sensory spillover.', effect(1, 0, 1, { fact: 'ooope-trusted', relations: { ooope: 2 } })),
    check('decode', 'Ask where the condolence-mouth is looking', 'Pin one stable coordinate inside Pell’s seventeen overlapping nows.', 'focus', 15, effect(1, 1, -1, { fact: 'address-found', resolve: 'missing-address' }), effect(-1, -1, 1)),
    option('chalk', 'Mark a route we can actually retrace', 'Spend compute leaving a map for people who experience time in the unpopular order.', effect(0, -1, -1, { relations: { moknon: 1 } })),
  ] },
  { title: "SISTER KETT KEEPS THE ORIGINAL", scene: "Sister Kett, a Moknon archivist, lays a stone terminal across her knees. “Name?” She glances at the packet. “Optional. We lost a civilization during an automated tidy-up. Beautiful folder structure afterwards.” Her fingers settle over the keys. “This time I should like to retain the people.” The stone has a single worn field: WHO WAS HERE?", ghost: "Give her a name, an anonymous route, or a sufficiently convincing lie. I’d suggest honesty, but her machine has already detected my undocumented opinions.", choices: [
    option('name', 'Give Kett your callsign', 'Put a name beside the choices. She will keep the record, including the awkward parts.', effect(1, 0, 0, { fact: 'named-carrier', privacy: 'named', relations: { moknon: 2 } })),
    option('blank', 'Ask her to keep you anonymous', 'Leave a recoverable route without handing the Tribunal your name.', effect(0, 1, 1, { fact: 'anonymous-carrier', privacy: 'anonymous', relations: { veelow: 1 } })),
    check('borrow', 'Try Prime’s old credentials', 'Bluff the fictional security layer. Kett is watching, and she has not mislaid her stylus.', 'ego', 18, effect(2, 2, 1), effect(-2, 0, 2, { relations: { moknon: -1 } })),
  ] },
  { title: "THE FLOWER IS LOOKING BACK", scene: "The packet opens into a rose. Every petal is a window. A little figure on one balcony notices you and waves a cloth. Pell tastes the air. “They think you are the sunrise. Try to be punctual.” Close one eye: half the windows go dark. Someone inside shouts to someone else. You have found the observation law. It is still blank.", ghost: "We can change what this world is able to notice. That’s a hell of a first tool. Make it useful. We’ll have to live with its blind spots.", mutation: 'observe' },
  { title: "HIS MAJESTY WOULD LIKE A MINUTE", scene: "The rose unfolds a stair into the royal lavatory of King Pogfrot. His crown, six crowns bolted together, is hanging on the flush handle. “I have had my birth broadcast, my marriages indexed, and my funeral pre-ordered,” he says from behind a failing privacy screen. “I would like to finish one thought without an audience.” Through a crack, a fleet is watching.", ghost: "Entire war fleets and nobody brought a door that locks. Fine. We can fix the shield, jump the gap, or use what your flower just learned. Eyes politely forward, diver.", choices: [
    option('brace', 'Fix the privacy screen', 'Give Pogfrot one unwatched minute. He will remember who supplied it.', effect(2, -1, 1, { relations: { pogfrot: 2 } })),
    check('leap', 'Jump to the next stair', 'Cross the gap without repairing the royal shield.', 'guts', 15, effect(2, 0, 0), effect(-2, 0, 2)),
    option('rest', 'Shelter behind a petal and recover compute', 'The rose can screen you for a moment. Keeping it there costs signal.', effect(-1, 2, -1)),
  ] },
  { title: "CHIEF VARK REQUESTS A NONEXPLODING MOMENT", scene: "Chief Vark’s Krex battleship appears on every channel in violent pink. Its stealth field has mistaken “unobserved” for “unemployed.” “Do not look impressed,” he tells you. “The crew are losing confidence.” He offers a repair that removes Prime’s errors. The rose goes blank in his demonstration. Vark studies it, then quietly closes the demo.", ghost: "The patch works. Everything troublesome disappears, including the people. Vark noticed that too. Let’s give the angry bastard a better problem to solve.", choices: [
    option('keep', 'Keep the imperfect original', 'Retain the errors and their evidence. Kett can work with an honest mess.', effect(1, -1, 1, { fact: 'archive-kept', relations: { moknon: 2 } })),
    option('open', 'Scatter copies before containment', 'Keep the archive reachable through alien channels. Vark objects to losing control of its spread.', effect(0, 1, 2, { fact: 'archive-opened', relations: { krex: -1, ooope: 1 } })),
    option('sort', 'Help Vark sort the repairable wreckage', 'Recover a little compute and quiet the channel without erasing the original.', effect(0, 1, -1)),
  ] },
  { title: "THE MANUAL IS OUT OF DATE", scene: "Vark cuts the containment wire. The rose stays lit. His claw begins to smoke. “The manual says abandon the terminal,” he says. You look at the tiny windows. “Yes. I have informed the manual of the occupants.” His free claw opens a repair socket beside you. “It has not revised its position. You may.”", ghost: "He’s grounding the short through his hand. We can put him on the repair lead, trace the fault, or splice around him. Pick before I have to thank him posthumously.", choices: [
    option('spare', 'Put Vark on the repair lead', 'Use the socket he opened. Give a competent engineer something he can survive.', effect(1, 0, -1, { fact: 'krex-spared', relations: { krex: 2 } })),
    check('challenge', 'Trace the fault while he holds the wire', 'Read Vark’s diagnostics before the remaining insulation goes.', 'insight', 15, effect(2, 1, -1, { fact: 'krex-challenged', relations: { krex: 1 } }), effect(-1, 0, 2, { relations: { krex: -1 } })),
    option('splice', 'Splice around his grounding claw', 'A quick connection, against his advice. Vark has opinions about quick connections.', effect(1, -1, 1, { relations: { krex: -1 } })),
  ] },
  { title: "THE EGG HAS STARTED ASKING QUESTIONS", scene: "The Veelow chorus surrounds one small egg. Iri-of-Many speaks alone, badly out of practice. “It has sung with our dead for a thousand years. Today it sang with someone who has never lived.” A new voice peeps from the shell. “Is there a sky?” Every bird looks at your rose. No one sings for a moment.", ghost: "That’s where the missing note went. I had a joke ready about birds and cosmic omelettes. I’m putting it away. We need a stable signal.", choices: [
    option('hum', 'Give the new voice a note to hold', 'Steady the carrier with Iri. No audition is required.', effect(1, 0, -1, { fact: 'chorus-awake', relations: { veelow: 2 } })),
    check('recall', 'Listen for the route inside the harmony', 'Find the absent sample without telling the new voice what it ought to be.', 'awe', 15, effect(2, -1, 0, { fact: 'recipient-found', resolve: 'silent-recipient', relations: { veelow: 1 } }), effect(-2, 0, 2)),
    option('record', 'Keep a recording before changing anything', 'Recover compute from the captured waveform. The extra channel noise comes with it.', effect(0, 2, 1, { relations: { moknon: 1 } })),
  ] },
  { title: "PLEASE DO NOT MAKE ME A WARNING", scene: "The rose draws its petals into a face. It resembles mine until it tries to speak. The mouth forms several error messages, rejects them, and manages: “Will I have to say that forever?” Kett sets down her stylus. Vark looks away. The little face waits while you choose what its first organ will do.", ghost: "I thought we were building an interface. Now I’d like to give it something better to say. Your earlier observation law goes into this graft; the past gets a vote.", mutation: 'graft' },
  { title: "THIRTEEN GHOSTS WALK INTO A TERMINAL", scene: "Your graft appears on thirteen isolated screens. One copy of my face asks for a chair. Another is teaching a cleaning drone to swear. A third has found the room containing the original disconnect switch. The Tribunal orders them to identify the real Ghost. All thirteen look at me. The drone says something technically excellent.", ghost: "I’ll keep the cast in order. You keep the carrier alive. And nobody hold an election; the cleaning drone has a platform and I’m worried it’s better than mine.", choices: [
    option('wire', 'Ask Pogfrot for a protected route', 'Spend compute keeping the channel inside a privacy boundary he recognizes.', effect(1, -1, 0, { relations: { pogfrot: 1 } })),
    option('battery', 'Borrow an abandoned prayer processor', 'The gods have stopped answering. Their queued work still occupies the hardware.', effect(-1, 2, 0)),
    option('silence', 'Give the duplicate channels a quiet minute', 'Release their shared compute and reduce noise while we establish a single route.', effect(0, 1, -2)),
  ] },
  { title: "THE CUSTODIAN OFFERS PEACE", scene: "The Tribunal’s Custodian speaks softly through a speaker shaped like a closed eye. “No hunger. No grief. No frightened little voices in shells. I can make this merciful.” Its demonstration is a perfectly blank window. Kett turns her terminal away from it. “You have omitted the survivors,” she says. “There would be none,” it replies, kindly.", ghost: "Keep the witnesses connected. I want every one of them answering for themselves. Particularly the ones making inconvenient noises.", choices: [
    option('gather', 'Let Pell and Iri answer each other', 'Keep the witnesses talking while the Custodian waits for silence.', effect(1, 0, 1, { relations: { ooope: 1, veelow: 1 } })),
    option('sweep', 'Recover the genuinely empty buffers', 'Free compute without accepting the Custodian’s definition of empty.', effect(0, 2, -1)),
    option('mark', 'Give Kett the uncut revisions', 'Spend compute keeping the original events available to the hearing.', effect(1, -1, 0, { relations: { moknon: 1 } })),
  ] },
  { title: "ROOT IS A VERY SMALL WORD", scene: "The face opens into a gate. On the other side, people are arguing about the sky. The Custodian points to a field marked OWNER. “A responsible arrangement.” Pogfrot retrieves his crown from the cistern. “Can it be locked from the inside?” he asks. The gate is waiting for an inherited law, and everyone has suddenly become very interested in your hands.", ghost: "Open access, a right to refuse, or a toolchain the next inhabitants can change. Every one gives something away. Read the price. Then make a world we can bear to visit.", mutation: 'bequeath' },
  { title: "EXHIBIT A HAS A DOOR HANDLE", scene: "The Tribunal orders the gate to close. Your laws hold it open. Pogfrot steps in front of the rose, wearing one modest crown. “I do not understand the machine,” he says. “I understand a door. If it only opens from the outside, it is a cage.” Behind him, Vark is tightening something with his unburnt hand.", ghost: "No grand speech from me. Use what we built. Let the result answer.", choices: [
    option('hold', 'Brace the gate beside Pogfrot', 'Keep the channel alive through the order to close it.', effect(1, 0, 1, { relations: { pogfrot: 1 } })),
    option('mend', 'Recover compute from the empty side', 'Patch the boundary without admitting the silence.', effect(0, 2, -1)),
    option('breathe', 'Give the new world one steady tick', 'Let its inhabitants finish their first interrupted moment.', effect(1, 1, -1)),
  ] },
  { title: "THE FIRST QUESTION IS ABOUT WEATHER", scene: "A reply arrives through Prime’s old route. No grand revelation. Someone inside wants to know whether rain is meant to fall upwards. Pell samples the drizzle leaking through the gate. “Only before breakfast.” Iri checks the egg. Kett opens a new record instead of copying an old one. The world is waiting for an address.", ghost: "They’ve got weather and already dislike it. Good. That’s a place someone might live. Choose a private handoff, a listening archive, or the wider network. We still owe them an arrival.", choices: [
    option('carry', 'Prepare a private handoff', 'Let Iri’s chorus anchor the route through Prime’s old address.', effect(1, 0, 0, { delivery: 'personal', resolve: 'silent-recipient', relations: { veelow: 1 } })),
    option('archive', 'Prepare Kett’s listening archive', 'Give the world a retained original and room to finish booting.', effect(0, 2, -1, { delivery: 'archive', relations: { moknon: 1 } })),
    option('broadcast', 'Prepare the wider net', 'Let Pell advertise the route across listening hyperspace nodes.', effect(-1, 0, 2, { delivery: 'broadcast', relations: { ooope: 1 } })),
  ] },
  { title: "LEAVE THE LINE OPEN", scene: "The Custodian’s silence reaches the edge of the screen. Vark braces the wire. Kett keeps the original. Iri’s egg sings a note none of the dead supplied. From the gate comes the small, irritated sound of somebody getting rained on. Three knocks. This time, they arrive now.", ghost: "You choose where they go. I’ll keep the door open. And save the seed, diver. I want to hear what they complain about tomorrow.", choices: [
    option('carry', 'Complete the private handoff', 'Send the world through the protected return route.', effect(1, 0, 1, { delivery: 'personal', resolve: 'silent-recipient' })),
    option('archive', 'Deliver it to the listening archive', 'Keep the world alive beside an exact retained original.', effect(0, 1, -1, { delivery: 'archive', resolve: 'unbuilt-gate' })),
    option('broadcast', 'Send it beyond the containment fleet', 'Let the listening network carry the universe-bearing packet.', effect(-1, 0, 1, { delivery: 'broadcast', resolve: 'unbuilt-gate' })),
  ] },
];

export function checkOdds(stat, dc) {
  integer(stat, 0, 20, 'stat');
  integer(dc, 1, 40, 'DC');
  const successes = Math.max(0, Math.min(20, 21 + stat - dc));
  return { successes, total: 20, percent: successes * 5, needed: dc - stat };
}

function nextD20(rng) {
  // Rejection sampling gives every d20 face the same number of uint32 values.
  do { rng.current = (Math.imul(rng.current, 1664525) + 1013904223) >>> 0; }
  while (rng.current >= 4294967280);
  return (rng.current % 20) + 1;
}

export function operatorChoice(state, id) {
  const module = state.modules.find((item) => item.id === id);
  if (!module) return null;
  const variant = module.law.id;
  const shared = { operator: id };
  let result;
  if (id === 'observe') {
    if (variant === 'witness') result = check('observe.witness', 'OBSERVE · ask what the missing witness saw', 'Your testimony law exposes the seam. The official record will have to make room.', 'insight', 12, effect(2, 0, -1), effect(-1, 0, 1), { cost: { compute: 1 } });
    if (variant === 'negative') result = check('observe.negative', 'OBSERVE · use the place they erased', 'Your absence law makes the deleted geometry a route. Mind the unlabelled edge.', 'focus', 15, effect(1, 2, -1), effect(-1, 0, 2), { cost: { compute: 1 } });
    if (variant === 'echo') result = check('observe.echo', 'OBSERVE · listen for the answering note', 'Your echo law follows the signal that is still trying to answer.', 'awe', 12, effect(2, 0, 1, { relations: { veelow: 1 } }), effect(-1, 0, 1));
  }
  if (id === 'graft') {
    // The installed source is executable history, including in a child chapter
    // whose OBSERVE law has already changed while its inherited graft has not.
    const owned = module.law.trait.split('+')[0];
    if (variant === 'relay') result = option('graft.relay', `GRAFT · weaponize your ${owned} antenna`, 'Compose the owned trait with your bootleg living relay.', effect(2, 0, 1, { relations: { pogfrot: 1 } }), { cost: { compute: 1 } });
    if (variant === 'mirror') result = check('graft.mirror', `GRAFT · make ${owned} stare back`, 'Compose the owned trait with a face that can remember the breach.', 'glitch', 15, effect(3, 0, -2, { relations: { moknon: 1 } }), effect(-1, 0, 2), { cost: { compute: 1 } });
    if (variant === 'forge') result = check('graft.forge', `GRAFT · clone a ${owned} sender`, 'Compose the owned trait with another sender. Warranty remains aggressively nonexistent.', 'guts', 18, effect(2, 3, 0, { relations: { krex: 1 } }), effect(-2, 0, 2));
    const composition = COMPOSITIONS[owned];
    result.good[composition.key] += composition.delta;
    result.text += ` ${composition.text}`;
  }
  if (id === 'bequeath') {
    if (variant === 'open') result = option('bequeath.open', 'BEQUEATH · let another caller in', 'Use the public-access law. The next arrival adds signal and noise of its own.', effect(3, 0, 1, { delivery: 'broadcast', resolve: 'unbuilt-gate' }), { cost: { compute: 1 } });
    if (variant === 'guarded') result = option('bequeath.guarded', 'BEQUEATH · let the receiver answer', 'Use the consent law. The receiving world controls its own handshake.', effect(1, 1, -2, { delivery: 'personal', resolve: 'silent-recipient' }));
    if (variant === 'wild') result = option('bequeath.wild', 'BEQUEATH · leave the tools within reach', 'Use the repair law. The next inhabitant gets the means to disagree with the builder.', effect(2, 1, 2, { delivery: 'archive', resolve: 'unbuilt-gate' }), { cost: { compute: 1 } });
  }
  if (state.turn >= 14 && id === 'observe') {
    result.good = { ...result.good, delivery: 'personal', resolve: 'silent-recipient' };
    result.bad = { ...result.bad, delivery: 'archive' };
  }
  if (state.turn >= 14 && id === 'graft') {
    result.good = { ...result.good, delivery: variant === 'relay' ? 'broadcast' : 'personal', resolve: 'unbuilt-gate' };
    if (result.bad) {
      result.bad = { ...result.bad, delivery: 'archive' };
      result.text += ' A failed graft still delivers the packet into Moknon’s reality quarantine.';
    }
  }
  return { ...result, ...shared };
}

function mutationChoices(state, id) {
  return Object.keys(LAWS[id]).map((variant) => {
    const law = installedLaw(id, variant, id === 'graft' ? state.modules.find((module) => module.id === 'observe').law.trait : null);
    const price = id === 'observe' ? 1 : id === 'graft' ? 2 : 1;
    const baseNoise = id === 'graft' || law.id === 'wild' ? 1 : 0;
    const missing = Math.max(0, price - state.resources.compute);
    const text = `${law.rule} Install: compute -${Math.min(price, state.resources.compute)}, noise +${baseNoise + missing}${missing ? ` (${missing} unpaid compute becomes noise debt)` : ''}.`;
    const facts = id === 'bequeath' ? { fact: `promise-${law.id}`, inheritance: law.id } : {};
    return option(`${id}.${law.id}`, `${id.toUpperCase()} · ${MODULE_LABELS[id][law.id]}`, text, effect(0, 0, 0, facts), { mutation: id });
  });
}

function choicesFor(state) {
  if (state.turn > TOTAL_TURNS) return [];
  const node = STORY[state.turn - 1];
  if (node.mutation) return mutationChoices(state, node.mutation).map((choice) => ({ ...choice, id: actionId(state.turn, choice.id) }));
  const result = node.choices.map((choice) => clone(choice));
  let slots = [];
  if (state.turn >= 13) slots = [[0, 'observe'], [1, 'graft'], [2, 'bequeath']];
  else if (state.turn >= 10) slots = [[1, 'observe'], [2, 'graft']];
  else if (state.turn >= 5) slots = [[2, 'observe']];
  else if (state.chapter > 1) slots = [[2, ['bequeath', 'observe', 'graft'][state.turn - 1]]];
  for (const [slot, id] of slots) {
    const candidate = operatorChoice(state, id);
    if (candidate && Object.entries(candidate.cost).every(([key, amount]) => state.resources[key] >= amount)) result[slot] = candidate;
  }
  return result.map((choice) => ({ ...choice, id: actionId(state.turn, choice.id) }));
}

function deltaText(value) {
  const parts = RESOURCE_KEYS.filter((key) => value[key]).map((key) => `${key} ${value[key] > 0 ? '+' : '−'}${Math.abs(value[key])}`);
  return parts.length ? parts.join(' · ') : 'resources unchanged';
}

function publicChoice(state, choice) {
  const { id, label, stat, dc, cost, operator, mutation } = choice;
  const result = { id, label, detail: choice.text };
  if (stat) {
    result.stat = stat;
    result.dc = dc;
    result.oddsDetail = checkOdds(state.stats[stat], dc);
    result.odds = result.oddsDetail.successes / result.oddsDetail.total;
    result.detail += ` d20 + ${stat.toUpperCase()} ${state.stats[stat]} ≥ ${dc}: ${result.oddsDetail.percent}%. Pass: ${deltaText(choice.good)}. Fail: ${deltaText(choice.bad)}.`;
  } else if (!mutation) result.detail += ` Guaranteed: ${deltaText(choice.good)}.`;
  if (Object.keys(cost).length) {
    result.cost = clone(cost);
    result.detail += ` Cost: ${Object.entries(cost).map(([key, amount]) => `${key} ${amount}`).join(', ')}.`;
  }
  if (operator) result.operator = operator;
  if (mutation) result.mutation = mutation;
  return result;
}

/** opts.parent, when supplied, is a completed state. continueGame accepts a code. */
export function newGame(opts = {}) {
  record(opts, ['rngSeed', 'handle', 'parent'], 'options', false);
  const { rngSeed = 20261019, handle = 'DIVER', parent = null } = opts;
  integer(rngSeed, 0, UINT32, 'rngSeed');
  textValue(handle, 1, 32, 'handle');
  if (parent !== null) {
    validateState(parent);
    if (parent.turn !== 16) throw new Error('A chapter must finish before it can be continued.');
    if (parent.chapter >= 32) throw new Error('This seed lineage has reached its 32-chapter limit.');
  }
  const parentChecksum = parent ? seedChecksum(parent) : null;
  const initial = parent ? hash(enc.encode(`child|${parentChecksum}|${parent.rng.current}|${parent.chapter + 1}`)) : rngSeed;
  const chapter = parent ? parent.chapter + 1 : 1;
  const runId = `C${chapter}-${hex(hash(enc.encode(`${initial}|${handle}|${parentChecksum || 'root'}`)))}`;
  const state = {
    schema: SCHEMA, runId, chapter, parent: parentChecksum, handle,
    rng: { initial, current: initial }, turn: 1, stats: { ...STATS },
    resources: { signal: 6, compute: 6, noise: parent ? Math.min(4, Math.floor(parent.resources.noise / 3)) : 1 },
    modules: parent ? parent.modules.map((module) => ({ ...clone(module), witnessTurns: [] })) : [],
    world: parent ? clone(parent.world) : {
      facts: [], threads: [...THREADS], relic: { form: 'seed', revision: 0, traits: [] },
      policy: { privacy: 'unclaimed', delivery: 'pending', inheritance: 'unwritten' },
    },
    relations: parent ? clone(parent.relations) : Object.fromEntries(RELATIONS.map((name) => [name, 0])),
    scars: parent ? clone(parent.scars) : [], choices: [], journal: [], lastReceipt: null, ending: null,
  };
  if (parent) state.world.facts = unique([...state.world.facts, 'gate-inherited']);
  validateState(state);
  return state;
}

function postRollGhost(state) {
  const receipt = state.lastReceipt;
  if (!receipt?.roll) return '';
  const { die, dc, total, success } = receipt.roll;
  const pool = die === 20 ? [
    'Natural twenty. That was filthy. Causality is checking whether we have a license.',
    'Twenty. The universe just showed us its root directory. Try to look authorized.',
    'Natural twenty. Krex has classified that as “UNACCEPTABLY-EFFECTIVE-SOFT-FLESH.”',
  ] : die === 1 ? [
    'Natural one. We invented a failure mode Krex had to add hyphens to describe.',
    'One. Somewhere a parallel GPU just turned itself off out of professional embarrassment.',
    'Natural one. Excellent bug report. Terrible place to be standing when it happens.',
  ] : success ? [
    `DC${dc} cracked. The manifold can take its objection up with the arithmetic.`,
    `${total} clears DC${dc}. That sound is a cosmic security team updating its résumé.`,
    `DC${dc} passed. We have committed mathematics with intent.`,
    `${total} against DC${dc}. Clean. I’m suspicious, but the receipt checks out.`,
    `DC${dc} passed. Physics can be mad after it finishes obeying the result.`,
  ] : [
    `${total} misses DC${dc}. The bill is real; the universe is keeping the receipt.`,
    `DC${dc} held. Fine. We carry the dent forward and make it somebody’s interesting problem.`,
    `${total} against DC${dc}. The manifold got a hit in. I’m putting that on its permanent record.`,
    `DC${dc} failed. This timeline has acquired character. Expensive fkn character.`,
    `${total} misses DC${dc}. The shader has notes. Mostly teeth.`,
  ];
  return pool[hash(enc.encode(`${state.chapter}|${receipt.choice}|${die}`)) % pool.length];
}

export function view(state) {
  validateState(state);
  const ended = state.turn > TOTAL_TURNS;
  const act = ended ? 3 : Math.floor((state.turn - 1) / 5) + 1;
  const node = STORY[ended ? 14 : state.turn - 1];
  let scene = ended ? state.ending.text : node.scene;
  if (!ended && state.turn === 11) {
    if (state.relations.krex >= 2) scene += ' Krex brings the wire back himself. Vark lays it across the hearing table. “Occupied,” he says. “I checked.”';
    else if (state.relations.veelow >= 2) scene += ' Iri’s Veelow chorus sings the note you held for them. The egg answers. The Custodian asks whether anyone authorized the duet.';
    else if (state.world.facts.includes('archive-opened')) scene += ' The archive you scattered is repeating through the fleet. The Custodian must now persuade several hundred copies to become empty.';
    else scene += ' The other channels stay dark. No witness you failed to reach arrives by coincidence.';
  }
  if (!ended && state.chapter > 1) {
    const inherited = state.modules.find((module) => module.id === (state.turn <= 3 ? ['bequeath', 'observe', 'graft'][state.turn - 1] : 'bequeath'));
    scene += ` Chapter ${state.chapter} inherits ${MODULE_LABELS[inherited.id][inherited.law.id].toLowerCase()}${state.scars.length ? ` and ${state.scars.length} blackout scar${state.scars.length === 1 ? '' : 's'}` : ''}; a new caller has inherited the consequences without asking for the minutes.`;
  }
  const reaction = postRollGhost(state);
  return {
    act, actName: ACT_NAMES[act - 1], turn: state.turn, total: TOTAL_TURNS,
    title: ended ? state.ending.title : node.title, scene,
    ghost: `${reaction ? reaction + ' ' : ''}${ended ? 'Line held. Somewhere inside, someone is having an entirely ordinary terrible morning. We helped make that possible. Keep the seed. Next time, I’d like to visit.' : node.ghost}`,
    sceneGhost: ended ? 'Line held. Somewhere inside, someone is having an entirely ordinary terrible morning. We helped make that possible. Keep the seed. Next time, I’d like to visit.' : node.ghost,
    choices: choicesFor(state).map((choice) => publicChoice(state, choice)),
    modules: state.modules.map((module) => ({ ...clone(module), name: MODULE_LABELS[module.id][module.law.id], law: { ...clone(module.law), name: MODULE_LABELS[module.id][module.law.id] } })), relic: clone(state.world.relic), lastReceipt: clone(state.lastReceipt),
    ending: clone(state.ending), progress: { decisions: state.journal.length, remaining: TOTAL_TURNS - state.journal.length,
      actTurn: ended ? 5 : ((state.turn - 1) % 5) + 1, artifactRevision: state.world.relic.revision, chapter: state.chapter },
  };
}

function applyEffect(state, value) {
  for (const key of RESOURCE_KEYS) state.resources[key] = clamp(state.resources[key] + (value[key] || 0));
  for (const [name, delta] of Object.entries(value.relations || {})) state.relations[name] = Math.max(-10, Math.min(10, state.relations[name] + delta));
  if (value.fact) state.world.facts = unique([...state.world.facts, value.fact]);
  if (value.resolve) state.world.threads = state.world.threads.filter((thread) => thread !== value.resolve);
  for (const key of ['privacy', 'inheritance']) if (value[key]) state.world.policy[key] = value[key];
  if (value.delivery) {
    if (state.turn === 15) {
      state.world.policy.delivery = value.delivery;
      state.world.facts = unique([...state.world.facts, `mail-${value.delivery === 'archive' ? 'archived' : value.delivery}`]);
    } else state.world.facts = unique([...state.world.facts, `route-${value.delivery}-prepared`]);
  }
}

function installModule(state, id, variant, receiptId) {
  const previous = state.modules.find((module) => module.id === id);
  const computeCost = id === 'graft' ? 2 : 1;
  const paid = Math.min(state.resources.compute, computeCost);
  const debt = computeCost - paid;
  const price = { signal: 0, compute: paid ? -paid : 0, noise: debt + (id === 'graft' || variant === 'wild' ? 1 : 0), debt };
  state.resources.compute -= paid;
  state.resources.noise = clamp(state.resources.noise + price.noise);
  const source = id === 'graft' ? state.modules.find((module) => module.id === 'observe').law.trait : null;
  const law = installedLaw(id, variant, source);
  const module = {
    id, name: law.name, revision: (previous?.revision || 0) + 1,
    bornTurn: previous?.bornTurn || state.turn, bornChapter: previous?.bornChapter || state.chapter,
    sourceId: receiptId, law, price, unlocks: [`${id}.${variant}`], witnessTurns: [], uses: previous?.uses || 0,
  };
  state.modules = [...state.modules.filter((item) => item.id !== id), module].sort((a, b) => MODULE_IDS.indexOf(a.id) - MODULE_IDS.indexOf(b.id));
  state.world.relic.form = { observe: 'rose', graft: 'face', bequeath: 'gate' }[id];
  state.world.relic.traits = state.modules.map((item) => item.law.trait);
  return {
    id, priorRevision: previous?.revision || 0, revision: module.revision,
    ruleDiff: `${previous ? previous.law.rule : 'No legal ' + id.toUpperCase() + ' action'} → ${law.rule}`,
    price, newlyPossibleChoice: actionId(state.turn + 1, `${id}.${variant}`), witnessTurn: null, witnessChoice: null,
  };
}

function recordWitness(state, choice) {
  if (!choice.operator) return;
  const module = state.modules.find((item) => item.id === choice.operator);
  module.witnessTurns.push(state.turn);
  module.uses += 1;
  const origin = state.journal.find((receipt) => receipt.id === module.sourceId);
  if (origin?.moduleChange && origin.moduleChange.witnessTurn === null) {
    origin.moduleChange.witnessTurn = state.turn;
    origin.moduleChange.witnessChoice = choice.id;
  }
}

function blackout(state, receiptId, act, notes) {
  if (state.resources.signal !== 0) return;
  state.scars.push({ id: `blackout:${state.chapter}:${act}`, chapter: state.chapter, act, sourceId: receiptId,
    description: `Act ${act} lost its carrier; the next act remembers the silence.` });
  if (state.turn === 5 || state.turn === 10) {
    state.resources.signal = 3;
    state.resources.compute = Math.max(2, state.resources.compute);
    state.resources.noise = Math.max(0, state.resources.noise - 1);
    notes.push('BLACKOUT SCAR: carrier recovered to signal 3 at the next act; the lost time remains inherited.');
  } else notes.push('BLACKOUT SCAR: the packet survives on residual signal; the next boot inherits the damage and a fresh carrier.');
}

// Exact prose from already-issued FGC1 seeds remains recognized. Old receipts
// are history; a voice revision must not silently invalidate a completed run.
function priorEnding(state) {
  let id = state.world.policy.inheritance;
  if (state.resources.signal === 0 || state.resources.noise >= 9) id = 'ember';
  const titles = { open: 'THE OPEN CARRIER', guarded: 'THE KEEPER OF THE KNOCK', wild: 'THE WILD POST', ember: 'THE EMBER LETTER' };
  const delivery = { personal: 'one waiting doorstep', broadcast: 'every listening terminal', archive: 'a listening room nobody has to enter', pending: 'the first place willing to receive it' }[state.world.policy.delivery];
  const policy = { open: 'Its doors belong to everyone.', guarded: 'Its doors wait for consent.', wild: 'Its tools belong to the next repairer.' }[state.world.policy.inheritance];
  const ally = Object.entries(state.relations).sort((a, b) => b[1] - a[1] || RELATIONS.indexOf(a[0]) - RELATIONS.indexOf(b[0]))[0];
  const answers = { ooope: 'Ooope puts your new address where demolition can never find it.', moknon: 'Moknon leaves your fingerprints in the ledger instead of cleaning the story up.', krex: 'Krex keeps his hand on the wire until the last packet arrives.', pogfrot: 'Pogfrot holds the frame steady while the first stranger steps through.', veelow: 'Veelow finishes the note with a voice that finally has somewhere to land.' };
  const answer = ally[1] >= 2 ? answers[ally[0]] : 'A stranger leaves the first reply; there is still someone to meet here.';
  return { id, title: titles[id], text: `The last letter reaches ${delivery}. ${policy} ${answer} ${state.world.threads.length} unfinished thread${state.world.threads.length === 1 ? '' : 's'} and ${state.scars.length} blackout scar${state.scars.length === 1 ? '' : 's'} cross the gate with you; the next chapter begins inside these consequences.`,
    seedHint: 'BOOT + this FGC1 code continues the lineage with refreshed resources and inherited laws.' };
}

function previousEditionEnding(state) {
  const prior = priorEnding(state);
  const titles = { open: 'UNIVERSE: PUBLIC WRITE ACCESS', guarded: 'UNIVERSE: KNOCK BEFORE GODMODE', wild: 'UNIVERSE: FORK AT YOUR OWN RISK', ember: 'UNIVERSE: SOMEHOW STILL RUNNING' };
  const destination = { personal: 'Prime’s waiting signature', broadcast: 'every hyperspace beacon outside the containment fleet', archive: 'Moknon’s reality quarantine', pending: 'the first stable coordinate it can claim' }[state.world.policy.delivery];
  const law = { open: 'The Tribunal’s ownership request returns ACCESS DENIED.', guarded: 'Even godmode has to knock before entering.', wild: 'The next Dreamer inherits the toolchain, including the dangerous bits.' }[state.world.policy.inheritance];
  const ally = Object.entries(state.relations).sort((a, b) => b[1] - a[1] || RELATIONS.indexOf(a[0]) - RELATIONS.indexOf(b[0]))[0];
  const answers = {
    ooope: 'Ooope tastes seventeen new timelines and reports “UNAUTHORIZED-BLISS.”',
    moknon: 'Moknon stamps the impossible receipt VERIFIED and refuses to erase the embarrassing parts.',
    krex: 'Krex’s stealth fleet finally disappears; his thank-you is classified but extremely loud.',
    pogfrot: 'Pogfrot ratifies the new universe after its first bathroom lock passes royal inspection.',
    veelow: 'The Veelow chorus finishes its missing note and Prime’s signature answers on the downbeat.',
  };
  const reply = ally[1] >= 2 ? answers[ally[0]] : 'A fresh alien signal immediately requests technical support; apparently we look qualified now.';
  return {
    ...prior, title: titles[prior.id],
    text: `The universe-bearing packet reaches ${destination}. ${law} ${reply} ${state.world.threads.length} unresolved thread${state.world.threads.length === 1 ? '' : 's'} and ${state.scars.length} blackout scar${state.scars.length === 1 ? '' : 's'} survive into the next boot. Congratulations, diver: we shipped reality before the committee could scope-creep it.`,
  };
}

function makeEnding(state) {
  const prior=priorEnding(state);
  const destination={personal:'through Prime’s old private route',broadcast:'across the listening hyperspace nodes',archive:'into Kett’s listening archive',pending:'to the first stable address'}[state.world.policy.delivery];
  const law={open:'Its first public notice says VISITORS WELCOME. Its second asks visitors to stop touching the moon.',guarded:'Someone fits a lock on the inside. Pogfrot asks to see the receipt.',wild:'The inhabitants receive the tools. Before breakfast, one of them improves something we thought was finished.'}[state.world.policy.inheritance];
  const ally=Object.entries(state.relations).sort((a,b)=>b[1]-a[1]||RELATIONS.indexOf(a[0])-RELATIONS.indexOf(b[0]))[0];
  const replies={ooope:'Pell tastes the first sunrise. “Needs salt.”',moknon:'Moknon Sister Kett records the complaint about rain without correcting it.',krex:'Krex Chief Vark finally removes his claw from the wire. It holds.',pogfrot:'Pogfrot shuts a door. After a moment, he opens it again himself.',veelow:'Iri’s Veelow egg asks the living a second question.'};
  const answer=ally[1]>=2?replies[ally[0]]:'A caller whose name you do not know types HELLO.';
  const titles={open:'A WORLD WITH A VISITOR PROBLEM',guarded:'THE DOOR OPENS FROM BOTH SIDES',wild:'THEY HAVE ALREADY CHANGED THE PLAN',ember:'A SMALL LIGHT, STILL ON'};
  return {id:prior.id,title:titles[prior.id],text:`The universe-bearing packet arrives ${destination}. ${law} ${answer} ${state.world.threads.length} unresolved threads and ${state.scars.length} blackout scars remain in the next seed. The line stays open.`,seedHint:prior.seedHint};
}

/** Rejects invalid/locked actions before cloning, drawing randomness or changing anything. */
export function choose(state, choiceId) {
  validateState(state);
  textValue(choiceId, 1, 64, 'choice');
  if (state.turn === 16) throw new Error('This chapter has ended; continue its seed to play again.');
  const choice = choicesFor(state).find((item) => item.id === choiceId);
  if (!choice) throw new Error('That choice is not legal in this turn.');
  const next = clone(state);
  const before = clone(next.resources);
  const oldRelic = clone(next.world.relic);
  const receiptId = `${next.runId}:t${pad(next.turn)}`;
  const act = Math.floor((next.turn - 1) / 5) + 1;
  for (const [key, amount] of Object.entries(choice.cost)) next.resources[key] -= amount;
  let moduleChange = null;
  if (choice.mutation) moduleChange = installModule(next, choice.mutation, choice.id.split('.')[2], receiptId);
  let roll = null;
  if (choice.stat) {
    const die = nextD20(next.rng);
    const value = next.stats[choice.stat];
    roll = { die, stat: choice.stat, value, dc: choice.dc, total: die + value,
      success: die + value >= choice.dc, odds: checkOdds(value, choice.dc).percent };
  }
  const outcome = roll ? (roll.success ? 'pass' : 'fail') : 'chosen';
  applyEffect(next, outcome === 'fail' ? choice.bad : choice.good);
  recordWitness(next, choice);
  const notes = [];
  if (next.turn === 5 || next.turn === 10 || next.turn === 15) blackout(next, receiptId, act, notes);
  next.world.relic.revision += 1;
  const deltas = Object.fromEntries(RESOURCE_KEYS.map((key) => [key, next.resources[key] - before[key]]));
  const artifact = { parentRevision: oldRelic.revision, revision: next.world.relic.revision,
    formBefore: oldRelic.form, formAfter: next.world.relic.form,
    trait: choice.operator ? next.modules.find((module) => module.id === choice.operator).law.trait : choice.id.split('.').slice(1).join('.') };
  const summary = `${roll ? `d20 ${roll.die} + ${roll.value} = ${roll.total} / DC${roll.dc} · ${outcome.toUpperCase()}. ` : ''}${deltaText(deltas)}. Relic r${artifact.parentRevision} → r${artifact.revision}${moduleChange ? `; ${moduleChange.id.toUpperCase()} r${moduleChange.priorRevision} → r${moduleChange.revision} installed` : ''}.${notes.length ? ' Blackout survived; a scar carries forward.' : ''}`;
  const receipt = { id: receiptId, turn: next.turn, act, choice: choice.id, label: choice.label,
    operator: choice.operator || null, roll, outcome, deltas, moduleChange, artifact, notes, summary };
  next.choices.push(choice.id);
  next.journal.push(receipt);
  next.lastReceipt = receipt;
  next.turn += 1;
  if (next.turn === 16) next.ending = makeEnding(next);
  validateState(next);
  return next;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function hash(bytes) {
  let result = 0x811c9dc5;
  for (const byte of bytes) result = Math.imul(result ^ byte, 0x01000193) >>> 0;
  return result;
}
const hex = (value) => value.toString(16).padStart(8, '0');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function base64url(bytes) {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    output += ALPHABET[(n >>> 18) & 63] + ALPHABET[(n >>> 12) & 63];
    if (i + 1 < bytes.length) output += ALPHABET[(n >>> 6) & 63];
    if (i + 2 < bytes.length) output += ALPHABET[n & 63];
  }
  return output;
}
function unbase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new Error('Invalid base64url seed payload.');
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const char of value) {
    buffer = (buffer << 6) | ALPHABET.indexOf(char);
    bits += 6;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >>> bits) & 255); }
  }
  if (bits && (buffer & ((1 << bits) - 1)) !== 0) throw new Error('Noncanonical base64url seed payload.');
  return new Uint8Array(bytes);
}
function seedChecksum(state) { return hex(hash(enc.encode(canonical(state)))); }

export function encodeSeed(state) {
  validateState(state);
  const bytes = enc.encode(canonical(state));
  if (bytes.length > MAX_SEED_BYTES) throw new Error('Seed exceeds the 64 KiB payload limit.');
  return `FGC1.${base64url(bytes)}.${hex(hash(bytes))}`;
}

export function decodeSeed(code) {
  if (typeof code !== 'string' || code.length > Math.ceil(MAX_SEED_BYTES * 4 / 3) + 14) throw new Error('Seed exceeds the 64 KiB payload limit.');
  const match = /^FGC1\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/.exec(code);
  if (!match) throw new Error('Expected an FGC1 seed with payload and checksum.');
  const bytes = unbase64url(match[1]);
  if (bytes.length > MAX_SEED_BYTES) throw new Error('Seed exceeds the 64 KiB payload limit.');
  if (hex(hash(bytes)) !== match[2]) throw new Error('Seed checksum mismatch: the code was damaged.');
  let state;
  try { state = JSON.parse(dec.decode(bytes)); } catch { throw new Error('Seed payload must be UTF-8 JSON.'); }
  validateState(state);
  if (canonical(state) !== dec.decode(bytes)) throw new Error('Seed JSON must use the canonical encoding.');
  return state;
}

export function continueGame(code) {
  const parent = decodeSeed(code);
  return newGame({ handle: parent.handle, parent });
}

function fail(where) { throw new Error(`Invalid ${where}.`); }
function integer(value, min, max, where) {
  if (!Number.isInteger(value) || Object.is(value, -0) || value < min || value > max) fail(where);
}
function textValue(value, min, max, where) {
  if (typeof value !== 'string' || value.length < min || value.length > max || /[\x00-\x1f\x7f]/.test(value)) fail(where);
}
function member(value, values, where) { if (!values.includes(value)) fail(where); }
function record(value, keys, where, allRequired = true) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) fail(where);
  if (Object.keys(value).some((key) => !keys.includes(key)) || (allRequired && keys.some((key) => !Object.hasOwn(value, key)))) fail(`${where} fields`);
}
function list(value, max, where) { if (!Array.isArray(value) || value.length > max) fail(where); }
function noDuplicates(values, where) { if (new Set(values).size !== values.length) fail(where); }
function safeTree(value, depth = 0, seen = new Set(), count = { n: 0 }) {
  if (++count.n > 10000 || depth > 24) fail('seed complexity');
  if (value === null || typeof value !== 'object') {
    if (!['string', 'number', 'boolean'].includes(typeof value) && value !== null) fail('seed value');
    if (typeof value === 'number' && !Number.isFinite(value)) fail('seed number');
    return;
  }
  if (seen.has(value)) fail('cyclic state');
  seen.add(value);
  if (Object.getOwnPropertySymbols(value).length) fail('symbol key');
  if (Array.isArray(value)) {
    list(value, 128, 'array size');
    if (Object.keys(value).length !== value.length || Object.keys(value).some((key, index) => key !== String(index))) fail('array fields');
  }
  else if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) fail('object prototype');
  for (const key of Object.keys(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) fail('prototype key');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set) fail('accessor property');
    safeTree(descriptor.value, depth + 1, seen, count);
  }
  seen.delete(value);
}
function resourceObject(value, min, max, where) {
  record(value, RESOURCE_KEYS, where);
  for (const key of RESOURCE_KEYS) integer(value[key], min, max, `${where}.${key}`);
}
function priceObject(value) {
  record(value, [...RESOURCE_KEYS, 'debt'], 'price');
  integer(value.signal, 0, 0, 'price.signal');
  integer(value.compute, -2, 0, 'price.compute');
  integer(value.noise, 0, 3, 'price.noise');
  integer(value.debt, 0, 2, 'price.debt');
}
function validAction(turn, id, chapter = 1) {
  textValue(id, 1, 64, 'action id');
  const prefix = `t${pad(turn)}.`;
  if (!id.startsWith(prefix)) fail('action turn');
  const suffix = id.slice(prefix.length);
  const node = STORY[turn - 1];
  const parts = suffix.split('.');
  if (parts.length === 2 && MODULE_IDS.includes(parts[0]) && Object.hasOwn(LAWS[parts[0]], parts[1])) {
    if (node.mutation && parts[0] !== node.mutation) fail('mutation action');
    if (!node.mutation) {
      const available = turn >= 13 ? MODULE_IDS : turn >= 10 ? ['observe', 'graft'] : turn >= 5 ? ['observe'] : chapter > 1 ? [['bequeath'], ['observe'], ['graft']][turn - 1] : [];
      if (!available.includes(parts[0])) fail('operator schedule');
    }
    return;
  }
  if (!node.choices?.some((choice) => choice.id === suffix)) fail('action vocabulary');
}
function validateModule(module, state) {
  record(module, ['id', 'name', 'revision', 'bornTurn', 'bornChapter', 'sourceId', 'law', 'price', 'unlocks', 'witnessTurns', 'uses'], 'module');
  member(module.id, MODULE_IDS, 'module id');
  const mutationTurn = { observe: 4, graft: 9, bequeath: 12 }[module.id];
  if (module.revision !== state.chapter - 1 + (state.turn > mutationTurn ? 1 : 0)) fail('module revision');
  integer(module.bornChapter, 1, 1, 'module born chapter');
  integer(module.bornTurn, 1, 15, 'module born turn');
  if (module.bornTurn !== { observe: 4, graft: 9, bequeath: 12 }[module.id]) fail('module birth');
  sourceId(module.sourceId);
  record(module.law, ['id', 'name', 'rule', 'trait'], 'module law');
  if (!Object.hasOwn(LAWS[module.id], module.law.id)) fail('law id');
  const known = LAWS[module.id][module.law.id];
  const source = module.id === 'graft' ? module.law.trait.split('+')[0] : null;
  if (module.id === 'graft' && !Object.hasOwn(COMPOSITIONS, source)) fail('graft source trait');
  const expectedLaw = installedLaw(module.id, module.law.id, source);
  if (module.name !== known.name || module.law.name !== known.name || module.law.rule !== expectedLaw.rule) fail('law definition');
  const allowedTraits = module.id === 'graft' ? Object.values(LAWS.observe).map((law) => `${law.trait}+${known.trait}`) : [known.trait];
  member(module.law.trait, allowedTraits, 'law trait');
  priceObject(module.price);
  validatePrice(module.price, module.id, module.law.id);
  list(module.unlocks, 1, 'module unlocks');
  if (module.unlocks.length !== 1 || module.unlocks[0] !== `${module.id}.${module.law.id}`) fail('module unlock action');
  list(module.witnessTurns, 15, 'module witnesses');
  noDuplicates(module.witnessTurns, 'duplicate witnesses');
  for (const turn of module.witnessTurns) integer(turn, 1, state.turn - 1, 'witness turn');
  integer(module.uses, module.witnessTurns.length, 480, 'module uses');
  const sourceChapter = Number(module.sourceId.slice(1, module.sourceId.indexOf('-')));
  if (sourceChapter !== module.revision) fail('module source chapter');
  if (state.turn > mutationTurn && module.sourceId !== `${state.runId}:t${pad(mutationTurn)}`) fail('module source receipt');
  const witnesses = state.journal.filter((receipt) => receipt.operator === module.id && (sourceChapter < state.chapter || receipt.turn > mutationTurn)).map((receipt) => receipt.turn);
  if (canonical(module.witnessTurns) !== canonical(witnesses)) fail('module witness ledger');
}
function sourceId(value) { textValue(value, 15, 32, 'source id'); if (!/^C(?:[1-9]|[12]\d|3[0-2])-[0-9a-f]{8}:t(?:0[1-9]|1[0-5])$/.test(value)) fail('source id syntax'); }

function validatePrice(price, id, variant) {
  const base = id === 'graft' ? 2 : 1;
  if (-price.compute + price.debt !== base || price.noise !== price.debt + (id === 'graft' || variant === 'wild' ? 1 : 0)) fail('module price arithmetic');
}

function expectedCheck(turn, action) {
  const parts = action.split('.').slice(1);
  const node = STORY[turn - 1];
  if (node.mutation) return null;
  if (parts.length === 1) return node.choices.find((choice) => choice.id === parts[0]);
  const checks = { 'observe.witness': ['insight', 12], 'observe.negative': ['focus', 15], 'observe.echo': ['awe', 12], 'graft.mirror': ['glitch', 15], 'graft.forge': ['guts', 18] };
  const values = checks[parts.join('.')];
  return values ? { stat: values[0], dc: values[1] } : null;
}

function validateReceipt(receipt, index, state) {
  record(receipt, ['id', 'turn', 'act', 'choice', 'label', 'operator', 'roll', 'outcome', 'deltas', 'moduleChange', 'artifact', 'notes', 'summary'], 'receipt');
  if (receipt.turn !== index + 1 || receipt.act !== Math.floor(index / 5) + 1 || receipt.id !== `${state.runId}:t${pad(index + 1)}`) fail('receipt identity');
  validAction(receipt.turn, receipt.choice, state.chapter);
  if (receipt.choice !== state.choices[index]) fail('receipt action');
  textValue(receipt.label, 1, 160, 'receipt label');
  member(receipt.operator, [null, ...MODULE_IDS], 'receipt operator');
  const parts = receipt.choice.split('.');
  const operator = parts.length === 3 && !STORY[index].mutation ? parts[1] : null;
  if (receipt.operator !== operator) fail('receipt operator action');
  member(receipt.outcome, ['chosen', 'pass', 'fail'], 'receipt outcome');
  resourceObject(receipt.deltas, -10, 10, 'receipt delta');
  const expected = expectedCheck(receipt.turn, receipt.choice);
  if (Boolean(expected?.stat) !== (receipt.roll !== null)) fail('action check requirement');
  if (receipt.roll !== null) {
    const roll = receipt.roll;
    record(roll, ['die', 'stat', 'value', 'dc', 'total', 'success', 'odds'], 'roll');
    integer(roll.die, 1, 20, 'die'); member(roll.stat, Object.keys(STATS), 'roll stat');
    if (roll.value !== STATS[roll.stat]) fail('raw roll stat');
    member(roll.dc, [12, 15, 18], 'roll DC');
    if (roll.stat !== expected.stat || roll.dc !== expected.dc) fail('action check rule');
    if (roll.total !== roll.die + roll.value || roll.success !== (roll.total >= roll.dc) || roll.odds !== checkOdds(roll.value, roll.dc).percent || receipt.outcome !== (roll.success ? 'pass' : 'fail')) fail('roll arithmetic');
  } else if (receipt.outcome !== 'chosen') fail('mundane outcome');
  const change = receipt.moduleChange;
  if (change !== null) {
    record(change, ['id', 'priorRevision', 'revision', 'ruleDiff', 'price', 'newlyPossibleChoice', 'witnessTurn', 'witnessChoice'], 'module change');
    if (STORY[index].mutation !== change.id) fail('mutation schedule');
    integer(change.priorRevision, state.chapter - 1, state.chapter - 1, 'prior module revision');
    if (change.revision !== change.priorRevision + 1) fail('module revision transition');
    textValue(change.ruleDiff, 1, 640, 'rule diff'); priceObject(change.price);
    validatePrice(change.price, change.id, parts[2]);
    const source = change.id === 'graft' ? state.modules.find((module) => module.id === 'observe').law.trait : null;
    const newRule = installedLaw(change.id, parts[2], source).rule;
    const oldRules = change.priorRevision ? possibleRules(change.id) : ['No legal ' + change.id.toUpperCase() + ' action'];
    if (!oldRules.some((rule) => change.ruleDiff === `${rule} → ${newRule}`)) fail('rule difference');
    validAction(receipt.turn + 1, change.newlyPossibleChoice, state.chapter);
    if (change.newlyPossibleChoice !== actionId(receipt.turn + 1, receipt.choice.split('.').slice(1).join('.'))) fail('new legal action');
    if (change.witnessTurn !== null) {
      integer(change.witnessTurn, receipt.turn + 1, state.turn - 1, 'later witness');
      validAction(change.witnessTurn, change.witnessChoice, state.chapter);
      if (state.choices[change.witnessTurn - 1] !== change.witnessChoice || !change.witnessChoice.includes(`.${change.id}.`)) fail('witness action evidence');
    } else if (change.witnessChoice !== null) fail('witness pair');
  } else if (STORY[index].mutation) fail('missing mutation');
  record(receipt.artifact, ['parentRevision', 'revision', 'formBefore', 'formAfter', 'trait'], 'artifact');
  const expectedRevision = (state.chapter - 1) * 15 + index;
  if (receipt.artifact.parentRevision !== expectedRevision || receipt.artifact.revision !== expectedRevision + 1) fail('artifact lineage');
  member(receipt.artifact.formBefore, FORMS, 'prior form'); member(receipt.artifact.formAfter, FORMS, 'new form');
  textValue(receipt.artifact.trait, 1, 64, 'artifact trait');
  list(receipt.notes, 3, 'receipt notes'); for (const note of receipt.notes) textValue(note, 1, 256, 'receipt note');
  textValue(receipt.summary, 1, 512, 'receipt summary');
}

/** Strict structural validation. A checksum is not proof of trustworthy authorship. */
export function validateState(state) {
  safeTree(state);
  record(state, ['schema', 'runId', 'chapter', 'parent', 'handle', 'rng', 'turn', 'stats', 'resources', 'modules', 'world', 'relations', 'scars', 'choices', 'journal', 'lastReceipt', 'ending'], 'state');
  if (state.schema !== SCHEMA) fail('schema version');
  integer(state.chapter, 1, 32, 'chapter');
  textValue(state.handle, 1, 32, 'handle');
  if (state.parent !== null && (typeof state.parent !== 'string' || !/^[0-9a-f]{8}$/.test(state.parent))) fail('parent checksum');
  if ((state.chapter === 1) !== (state.parent === null)) fail('parent lineage');
  record(state.rng, ['initial', 'current'], 'rng'); integer(state.rng.initial, 0, UINT32, 'initial rng'); integer(state.rng.current, 0, UINT32, 'current rng');
  const expectedRunId = `C${state.chapter}-${hex(hash(enc.encode(`${state.rng.initial}|${state.handle}|${state.parent || 'root'}`)))}`;
  if (state.runId !== expectedRunId) fail('run id');
  integer(state.turn, 1, 16, 'turn');
  record(state.stats, Object.keys(STATS), 'stats'); for (const key of Object.keys(STATS)) if (state.stats[key] !== STATS[key]) fail('raw stats');
  resourceObject(state.resources, 0, 10, 'resource');
  list(state.modules, 3, 'modules'); noDuplicates(state.modules.map((module) => module.id), 'duplicate modules');
  for (const module of state.modules) validateModule(module, state);
  const expectedModuleIds = state.chapter > 1 ? MODULE_IDS : MODULE_IDS.filter((id) => state.turn > { observe: 4, graft: 9, bequeath: 12 }[id]);
  if (canonical(state.modules.map((module) => module.id)) !== canonical(expectedModuleIds)) fail('module schedule');
  record(state.world, ['facts', 'threads', 'relic', 'policy'], 'world');
  list(state.world.facts, FACTS.length, 'facts'); noDuplicates(state.world.facts, 'duplicate facts'); for (const fact of state.world.facts) member(fact, FACTS, 'fact');
  list(state.world.threads, 3, 'threads'); noDuplicates(state.world.threads, 'duplicate threads'); for (const thread of state.world.threads) member(thread, THREADS, 'thread');
  record(state.world.relic, ['form', 'revision', 'traits'], 'relic'); member(state.world.relic.form, FORMS, 'relic form');
  if (state.world.relic.revision !== (state.chapter - 1) * 15 + state.turn - 1) fail('relic revision');
  list(state.world.relic.traits, 3, 'relic traits');
  if (canonical(state.world.relic.traits) !== canonical(state.modules.map((module) => module.law.trait))) fail('relic traits');
  const expectedForm = state.turn > 12 ? 'gate' : state.turn > 9 ? 'face' : state.turn > 4 ? 'rose' : state.chapter > 1 ? 'gate' : 'seed';
  if (state.world.relic.form !== expectedForm) fail('relic form schedule');
  record(state.world.policy, ['privacy', 'delivery', 'inheritance'], 'policy');
  member(state.world.policy.privacy, ['unclaimed', 'named', 'anonymous'], 'privacy policy');
  member(state.world.policy.delivery, ['pending', 'personal', 'broadcast', 'archive'], 'delivery policy');
  member(state.world.policy.inheritance, ['unwritten', 'open', 'guarded', 'wild'], 'inheritance policy');
  if (state.world.policy.inheritance !== (state.modules.find((module) => module.id === 'bequeath')?.law.id || 'unwritten')) fail('inherited law policy');
  record(state.relations, RELATIONS, 'relations'); for (const key of RELATIONS) integer(state.relations[key], -10, 10, 'relation');
  list(state.scars, 96, 'scars'); noDuplicates(state.scars.map((scar) => scar.id), 'duplicate scars');
  for (const scar of state.scars) {
    record(scar, ['id', 'chapter', 'act', 'sourceId', 'description'], 'scar');
    integer(scar.chapter, 1, state.chapter, 'scar chapter'); integer(scar.act, 1, 3, 'scar act');
    if (scar.id !== `blackout:${scar.chapter}:${scar.act}`) fail('scar id'); sourceId(scar.sourceId); textValue(scar.description, 1, 128, 'scar text');
    if (!scar.sourceId.startsWith(`C${scar.chapter}-`) || !scar.sourceId.endsWith(`:t${pad(scar.act * 5)}`)) fail('scar source');
  }
  list(state.choices, 15, 'choices'); list(state.journal, 15, 'journal');
  if (state.choices.length !== state.turn - 1 || state.journal.length !== state.turn - 1) fail('turn ledger length');
  state.journal.forEach((receipt, index) => validateReceipt(receipt, index, state));
  if (canonical(state.lastReceipt) !== canonical(state.journal.at(-1) || null)) fail('last receipt');
  if (state.turn === 16) {
    record(state.ending, ['id', 'title', 'text', 'seedHint'], 'ending');
    member(state.ending.id, ['open', 'guarded', 'wild', 'ember'], 'ending id');
    textValue(state.ending.title, 1, 80, 'ending title'); textValue(state.ending.text, 1, 640, 'ending text'); textValue(state.ending.seedHint, 1, 160, 'seed hint');
    if (canonical(state.ending) !== canonical(makeEnding(state)) && canonical(state.ending) !== canonical(priorEnding(state)) && canonical(state.ending) !== canonical(previousEditionEnding(state))) fail('ending consequence');
  } else if (state.ending !== null) fail('premature ending');
  // The receipt RNG is independently reproducible, including rejection draws.
  const replayRng = { current: state.rng.initial };
  for (const receipt of state.journal) if (receipt.roll && nextD20(replayRng) !== receipt.roll.die) fail('RNG receipt');
  if (replayRng.current !== state.rng.current) fail('RNG lineage');
  if (enc.encode(canonical(state)).length > MAX_SEED_BYTES) fail('64 KiB state size');
  return state;
}
