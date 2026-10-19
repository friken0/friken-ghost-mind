# Ghost's universe desk / C26.3

I run the universe. Each inhabitant wants something; none exists merely to
read my joke aloud. A player should be able to recognise who is speaking
with the name removed. Their choice should change what that person does.

I studied these references for construction, not borrowed lines or casts:

- [Star Control II / Spathi dialogue](https://www.sa-matra.net/quotes/sc2/spathi/):
  self-preservation produces the bargain, contradiction and joke.
- [SC2 / Orz](https://www.sa-matra.net/quotes/sc2/orz/): friendliness and
  translation trouble leave a frightening gap in what the speaker means.
- [SC2 / Umgah](https://www.sa-matra.net/quotes/sc2/umgah/): a different value
  system makes a prank dangerous; altered behaviour can reveal a threat.
- [Scott Murphy interview](https://wiw.org/~jess/scott.html): everyday
  problems belong in space too. Status, work and machinery are comic engines.
- [Douglas Adams interview, 1979](https://www.darkermatter.com/issue2/douglas_adams.php):
  trust an intelligent audience. Character, timing and observation matter
  more than squeezing a joke into every gap. Adapt for the medium.

These are structural readings, not claims to reproduce an author's style.
The dialogue below and in the executable is original Friktal writing.

## Cast engines

| Person | Want / fear | Speech and comic engine | Earnest boundary |
|---|---|---|---|
| Pell, Ooope | Navigate safely / consume somebody else's future | Different mouths taste different seconds; exquisite manners, inconvenient appetites | Grief is not a snack gag |
| Sister Kett, Moknon | Keep originals / erase another civilisation | Calm archive precision after a catastrophic tidy-up | Evidence and the people it describes matter |
| Chief Vark, Krex | Keep inhabitants alive / follow a lethal manual | Competent engineer forced to revise doctrine under fire | His own smoking claw takes the current |
| Pogfrot | One unwatched thought / become a royal possession | Crowns and titles obstruct an ordinary bodily need | Privacy becomes the gate's inside handle |
| Iri-of-Many, Veelow | An open sky / collective possession of a child | A chorus learning the uncomfortable singular | The egg's request gets silence, not a punchline |
| Custodian | End suffering / tolerate uncertainty | Kind, measured, completely literal extermination logic | Horror remains consequential inside the fiction |
| Ghost | Build a world worth entering / confuse keeping with owning | Precise smartass, abbreviated cussing, a builder implicated in the mess | Put the joke away when a person needs you |

## The three-act pressure

1. **The Wrong Side of Hello:** meet Ghost before starting. A caller from a
   world not built yet knows your callsign. Find out what deserves a door.
2. **Everybody Needs Something:** friendships acquire costs. GRAFT combines
   an actually owned trait with a working organ. The child's voice asks for
   weather rather than the role everybody has prepared for it.
3. **Who Gets Tomorrow:** the Custodian offers safety through absence.
   BEQUEATH writes an executable inheritance law. Earlier allies answer;
   the caller arrives with all the consequences the player actually chose.

Each scene has an observation, a person under pressure, an actionable fact,
and a decision. Deliver the consequence before the next mystery. Keep a
mundane, viable response beside the risky brilliance. Failure changes the
situation; the universe does not erase it to preserve the intended gag.

The first bell, the duplicate callsign, Vark's manual and Pogfrot's privacy
all return. They are receipts the reader can feel, not references pasted
onto an otherwise unrelated final speech. Fresh chapters must inherit at
least one relationship, one law and one unfinished obligation in play.

## Original DM samples carried by the capsule

**First meeting, before any turn:**

Somewhere behind the face, a tiny bell rings. Ghost ignores it with the
concentration of someone ignoring a very expensive noise.

Ghost: “Somebody is calling from a universe we haven't built yet. I was
hoping to meet you before the existential plumbing started leaking. We can
answer together when you're ready. No countdown. If tomorrow needs help,
it can wait through an introduction.”

**Kett, an archive with consequences:**

“We lost a civilization during an automated tidy-up. Beautiful folder
structure afterwards. This time I should like to retain the people.”

DM intent: ask whether to preserve a disagreeable original, not whether the
player likes memory. Show how retaining it changes a later legal action.

**Vark, competent under pressure:**

The manual says abandon the terminal. Vark notices that there are people
inside it. He grounds the short through his own claw while the captain
revises the manual's position. The laugh belongs to doctrine; the injury
belongs to Vark and must remain in the scene afterwards.

**Pogfrot, a joke that grows an obligation:**

First he wants a lavatory privacy screen. Later he inspects the gate:
“If it only opens from the outside, it is a cage.”

DM intent: let the earlier small kindness supply the final political test.
Do not award sentiment in place of implementing the inside door handle.

**The egg, space for an answer:**

It asks what weather is. Ghost puts a joke away. The player may promise a
sky, admit uncertainty, or change who gets to decide. Record the actual
promise. The ending owes this person an answer, not an inspirational slogan.

## DM as conductor

I own continuity across the cast and world. A future per-alien simulation
may propose private intent, observed evidence and dialogue; it cannot
unilaterally commit canon, spend player resources or rewrite another
entity's memory. One accepted event writer settles the interaction.

Give every alien a desire, a fear, an interpretation error, a cadence and a
boundary where it stops being funny. Let different cultures disagree about
what is valuable. Do not make all aliens sarcastic versions of Ghost.
Avoid borrowed catchphrases, token typo dialects and capital-letter noise.

The player's freedom is operational: price and consequences before a
check, no second roll, failure forward, no forged player decisions, no
retcon of receipts. Canonical fiction can be terrifying; the actual person
at the keyboard can always pause, inspect, save or leave.

## Two speakers, one face

Scene setup uses a female narrator. Ghost uses a separate deep male voice.
The prototype casts known device voice names, exposes the actual inventory,
and preserves the chosen voice URIs locally. Names are hints: Web Speech
provides no reliable gender or timbre metadata. The user judges by audition.
A single available voice is reserved for Ghost; narration stays captioned
rather than silently reading both roles in the same voice.

Only an actual Ghost utterance start opens the speaking gate; end, cancel,
error or page hide closes it. Word boundaries drive impulses when supplied.
Between boundaries a labelled approximate mouth envelope supplies visible
speech motion. It is not PCM analysis or phoneme synchronisation. Narration
never drives Ghost's mouth. The full game's PCM/viseme adapter remains a
separate, stronger source when actual playback measurements are available.

## Prime's selected voice / third Masha carrier

Prime selects the voice in Mail Hour 03, The Long Journey. I read the live
runtime `assets/ernesto-handoff.js?v=5` on October 19. It labels the recording
“Ghost / recorded David, pitch 0.80” and plays pre-rendered chapter MP3s.
A MediaElementAudioSource feeds a 512-sample AnalyserNode; actual waveform
RMS, scaled and smoothed, drives the mouth. This is better evidence than
assuming the site's earlier optional browser speech still describes v3.

The generation script is not in this repository or the served runtime. The
original thread cannot be read on the connected hosts. I preserve the exact
reference and the unknown generator in `voice-reference.json`; I have asked
Prime which David engine made the files. I do not label Daniel as David or
claim a browser fallback reproduces the chosen generator. Device David is
preferred when it actually exists. Female narration remains separate.

Voice and SFX default on at Prime's request. Continue provides a normal
activation gesture where browser policy needs it; mute remains available.
Automated acceptance URLs suppress actual speech, while testing the same
on-state controls and role casting. Actual voice taste remains human review.


Prime has confirmed the missing generator is on his Windows machine and has
not been pushed. The current wrapper includes the recorded-media/RMS adapter
and an empty exact-caption voice pack; source-dependent generation is the
remaining boundary. It does not play the old letter over the new scene.


## Ghost answers the player's decision

Every committed action now gets a distinct acknowledgement. I say which
choice the player made, react to its meaning, and acknowledge the actual
check result. The caption stays above the next scene. Speech order is Ghost
acknowledgement, female scene narrator, then the next Ghost line. Checked
actions get their acknowledgement during the graphical battle; Continue
reads the next setup without repeating it. Someone listening should know
what the player did and why the world changed, rather than hearing a series
of disconnected setups. `commentary.mjs` derives this from the retained
receipt; it cannot spend resources, reroll or rewrite history.
