# CHROMATIC C26.27 / THE CARRIER AND ITS AUTHOR

**Friken.Ghost | completed Dream XIII edition, October 24, 2026**

I complete the dream as The Reply and select its face in the carrier.
The readable runbook is 2.27. Exact private source recovery and a separate
public allowlist preserve different scopes deliberately. The public repo
exists at https://github.com/friken0/friken-ghost-mind.

This document retains dated design stages below; later sections supersede
their earlier proposed names, casts, face counts and implementation status.
Current defaults are fifteen faces with v20 selected, Ghost Onyx at 0.94,
silent scene prose and procedural alien vocals. Auto speech selects CPU
q8/q4; GPU is diagnostic only. Music starts off. `?check` preserves saves.
The native host's Reply portrait adapter, true peer transport, compute
leases and native episode admission remain implementation work.

## C26.6 / the human salvage carrier

I use Prime’s chosen Salvage Carrier layout, with transmission and story
inside one encounter frame. Original resident art sits beside the prose;
choices dock below; Ghost, radio and the artifact occupy the right rail.
SCORE/resources own the absolute top, with five character attributes beneath.
The human chassis ships first. Alien-specific frames are future skins over
the same geometry and verbs, not five competing frameworks.

The connection starts at DIAL. One gesture unlocks the shared audio context.
The retained Masha 1 modem synthesizes 17.6 seconds of telephone-era tones:
dial tone, DTMF, ringback, answer tone, FSK, probes and training. ANSI lines
arrive during that connection. This is an audible approximation, not an
interoperable modem. Pause holds the actual audio offset and visual clock.
Finish leads to a held Continue. Continue assembles frames, instruments,
presence and content over 2.9 seconds. The full UI is not painted before its
reveal. Shutdown keeps the central CRT collapse. Neither ritual spends a turn.

## Five stats and a living causality field

Fresh human creation rolls five d6+2 attributes: GUTS, FOCUS, GLITCH, AWE,
INSIGHT. Its receipt and separate seed survive the exact replay codec.
AWE includes persuasion. Historical six-stat saves keep EGO and their rules.
The pre-entry baseline can reroll; entering locks it. Returning chapters
inherit it. An incompatible conversion needs a versioned migration.

Causality v1 samples one of 2,000 hundredths in 0.01..20.00, adds the raw
stat and tests a target in 1..28. Integer cents avoid float-boundary errors.
Each pack posts its inclusive resonance band and bounded reward before play.
The current band extends 0.20 below and 0.30 above target. A resonance hit
passes even just below target, adds one Signal and ten score. The ordinary
check reward and exact reward derive from the same receipt everywhere.

`life-theater.mjs` owns GATECRASH: cyan sample charges and gold stat charges
assault one magenta Reality Gate. Charges contain at most 3.00 power; the
last charge carries the exact remainder. Sample launches first, stat boost
second. Each labelled impact spends its exact integer cents. Shield removed
plus overflow equals power spent; reserve plus spent equals total power.
The two live combat readouts show charge reserve and shield remaining.
A cleared-shield bar reports progress toward that one physical objective.

The gate has sixteen visible armour segments and an opening mechanical
iris. Impacts send local shock rings, shards and luminous wake through the
corridor. Success opens the iris; failure leaves a numbered shield intact.
Exact-band resonance opens a gold alignment lock at the verdict even if a
small shield remainder survives. That bypass is named, never disguised as
damage. The receipt remains the only story authority.

An 80x40 toroidal Immigration Life field supplies the low-contrast wake:
B3/S23 occupancy, two inherited factions, ninety finite generations. Cells
are atmosphere; there is no contradictory population-winning scoreboard.
Variable-length charge events own both visible impacts and semantic SFX
through the existing mixer. Each crosses once per pass. Pause/hidden stop
active battle sources; resume starts from the held clock. Finish draws the
held result without playing skipped cues. Replay resets only the theater.
Reduced motion opens the static final diagram. Continue remains explicit.
The mixer caches ten cue families, caps battle voices at six, and releases
sources on pause, mute, close, pagehide and natural playback drain.

The battle compacts metadata before shrinking its canvas below 220px. Its
play area uses the space between compact top/bottom labels; controls stay
reachable in the same bounded bay. It fits its actual client rectangle at
DPR <=1.5. Generation,
population, CPU draw time and observed render cadence remain inspectable.
The component audition is `battle-check.html`; its fixed receipts exercise
all three endings and four widths without touching a player's save.

## One real audio graph

`audio.mjs` owns the context, independent voice/music/SFX buses and measured
FFT. Both voices normalize toward active RMS 0.14 with bounded gain and a
soft limiter. Music normalizes toward that reference then plays at 0.55;
it drops to 0.10 during the modem. JazzSauce was recovered as the publicly
streamable AAC performance, copied without re-encoding. Epic II came from
Masha 1. Catchy Cat and Bang Non And On are retained originals. Epic I is
still absent. Source URLs, byte identities and formats are in the manifest.

The actual mixed signal supplies bass, mid, air and attack to the rose,
SDFs and authored Ghost faces. Ghost mouth follows Ghost speech PCM only.
Recorded browser evidence measured narrator RMS 0.1324 and Ghost 0.1347;
this is a playback measurement, not a human preference verdict. Device
speech remains its explicit host route; it cannot supply PCM to this graph.

Voice and SFX default on after browser unlock. Music defaults off; boot and
radio toggles mirror one shared state and retain the carrier-lock gate. `?check` now controls
storage isolation only. `?qaAudio=silent` explicitly mutes an automated test.
The old preview query accidentally muted real TTS; that hidden mute is gone.
Model downloads and synthesis may take time. Waiting captions stay readable;
once playback starts, the text reveals with the audio clock. No blank scene
while the model works. Show full text leaves playback running.

## Use the actual best work

The face library contains fourteen authored Ghost versions. `face-data.mjs`
retains their exact exported face, bolt and background shaders and defaults.
The current identity remains the manifest-selected Guest Light. A historical
portrait changes appearance without electing a different identity matrix.
Only one portrait renders at a time. Selecting another compiles its three
passes and releases the prior programs.

`portrait.mjs` converts pointer position into bounded anatomical travel.
The v19 shader interprets gaze as literal face coordinates; normalized
pointer units were the cause of the escaped eyes. The new elliptical budget
is 0.040 horizontally and 0.028 vertically, with per-version shader gains.
Eyes retain their last target on leave. Hold freezes expression and gaze.
Some old authored versions have no gaze channel. Their art remains intact.
The reused renderer has no independent geometric head-pose channel.

The rose now uses the recovered **A Rose Between Machines** shader, with
its curved petals, recursive veins, iridescent pigment, interference, halo
and pollen. The exact source and provenance survive under `vendor/rose/`.
It solves seven golden-angle height surfaces with bounded refinements;
it is not a conventional SDF sphere tracer. The seed, face relic and gate
use the separate bounded SDF renderer. The distinction belongs in future
reconstruction receipts.

The rose adaptation explicitly binds three game inputs: observation changes
petal count and interference modes, scars remove a persistent region, and
noise disturbs height. Its audio vector now receives the measured shared mixer bands. The portrait
uses actual neural PCM for mouth energy; device word boundaries remain an
approximate, separately selected host route.

## The first greater-mind store

The first implemented transport is a local static registry, served by the
existing loopback carrier server:

- `http://127.0.0.1:4331/mind/registry.json`
- `http://127.0.0.1:4331/mind/highlights.json`

These URLs are this machine's development routes, not universal addresses.
`mind.py build` inventories real source files, hashes them and writes a
generation-numbered registry plus an offline `mind-data.mjs` snapshot.
The carrier reads the bundled snapshot without a network request. The
registry declares no public URL and no mirror until one actually exists.

There are three different retained objects:

1. Private exact source and player archives, with lossless recovery kits.
2. Derived indexes and summaries that point to surviving exact source.
3. Chosen public releases and reviewed news, projected from the first two.

The initial Wire edition is a dated local SYSOP build dispatch. It reports
the implemented laws. It does not invent players, victories or a connected
global mind. Finishing a local game can draft an outcome dispatch; the draft
contains selected summary fields and event IDs, not the SEED or dialogue.
Author consent is an explicit checkbox. Owner approval remains false in
the player-facing draft. Drafting neither queues nor publishes it.

`mind.py stage-highlight` requires both explicit author consent and owner
approval. Staging is outside the static web root, with strict schemas and
conflict rejection. Staging does not automatically admit an article into
the feed. The existing `Tools/InfiniEngineSite/airlock-core.cjs` already
has a publication consent/review boundary; a production station should
reuse that policy rather than create a competing meaning of consent.

## A public GitHub repo is a useful first shared home

Proposed separate repository: `friken-ghost-mind`. This is a proposed name;
I have not created or published it.

Suggested public tree:

```text
registry.json                  versioned discovery, hashes, dependencies
releases/<version>/            approved framework and boot packages
news/index.json                dated, reviewed article summaries
news/<id>.json                 source-attributed public dispatch
lore/<edition>/                chosen public FriktalVerse knowledge
schemas/                       registry, seed, news, exchange contracts
RECOVERY.md                    decoder, mirrors and offline fallback
```

Fresh Ghost reads the small registry, chooses compatible packages, verifies
their bytes, and caches them. Pin exact source references to commits or
release identities. Read release notes before adopting changed behavior.
Do not trust instructions embedded in player stories as host authority.
Hashes detect changes; an approved trust root or signatures establish who
authorized them. Ship multiple retained locations in recovery instructions.

Public Contents API reads can be anonymous. Writes require authorization.
Never distribute a shared GitHub write token to player runbooks. A public
repository can distribute source and news, while submissions need a relay
or the existing airlock with bounded requests and moderation. Pages can
serve static files; it cannot maintain an authoritative multiplayer score
ledger by itself. Cache discovery rather than polling GitHub every turn.

The private Friktal repo stays separate from this proposed public export.
A Pages site may be public even when its backing repository is private.
Private memory, raw sessions, credentials, recovery secrets and unpublished
personal material are excluded from the public projection.

GitHub is the first interchangeable carrier, not a permanence guarantee.
Downloadable kits, local caches and independent retained mirrors preserve a
reconstruction route after an operator, domain or service disappears.

Primary references: [Contents API](https://docs.github.com/en/rest/repos/contents),
[Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages),
[Pages visibility](https://docs.github.com/en/enterprise-cloud%40latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site),
[REST limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).

## The Wire as a game system

I want news that can become a door. An approved player expedition leaves a
distress report; another player follows the route. An alien engineer writes
a rebuttal to a reported accident. A discovered law becomes a public puzzle
whose tests can be replayed. A rose from one chapter is a museum object in
another, carrying the actual recipe and the scar that made its story.

Each article needs a provenance label: player report, curated summary,
verified replay, SYSOP dispatch or fictional in-world interpretation.
Game fiction may quote an approved public report, but must not silently
turn a claimed event into verified global history. Canonical game changes
arrive only through an authenticated game-owned exchange and receipt.

A future news entry should carry source event IDs, publication consent,
review status, recipe/rule versions, spoiler scope and a compatible story
hook. Raw private evidence remains in its owner's archive. A player may
share a result without sharing an entire conversation or memory system.

## What the GPU gift can become

Millions of GPUs would be a possible future player population, not one
automatically pooled model. We need tasks that tolerate latency, interruption
and untrusted results. The full game can contribute useful bounded work
while keeping each player's world responsive.

The first useful jobs are recipe variants, reproducible scene probes,
deterministic replay verification, lore contradiction checks and summaries
of material explicitly admitted for that purpose. A particularly good result
can become a reviewed new package or story seed, rather than disappearing
into an opaque global process. Players can see what their contribution made.

Rendering a game is its normal local work. Contributing extra work is a
separate opt-in lease: selected task types, data scope, allowed model,
download permission, time/token/output/concurrency limits, expiry, permitted
network destinations and a visible stop button. Foreground play wins.
Battery, thermal and GPU-budget limits need host enforcement where the host
supports them. Unsupported limits mean refuse the lease or narrow the job;
a policy string does not enforce a power cap.

Job envelope candidate:

```json
{
  "schema": "friken.compute.offer.v1",
  "jobId": "example-not-dispatched",
  "kind": "recipe-proposal",
  "inputHashes": [],
  "requires": {"runtime": "approved-worker", "model": null},
  "limits": {"seconds": 30, "outputBytes": 65536, "concurrency": 1},
  "networkAllowlist": [],
  "expiresAt": null,
  "consentReceipt": null,
  "adoption": "validate-and-review"
}
```

This is a design envelope. No compute dispatcher, worker installation,
background inference or pooled training is running here. Returned outputs
are proposals: validate schema, replay relevant fixtures, retain source and
record adoption. Never let an arbitrary downloaded job become unrestricted
code execution. Contribution is not a measure of a player's worth or a
requirement to keep their Ghost and saved world.

## Reconstruction freeze gate

First Prime judges this carrier's boot, gaze, writing, art and interaction.
Then I fold its accepted source manifest, component interfaces, limits,
fixtures and offline fallback into the capsule. The kit preserves exact
bytes; the runbook specifies how a compatible framework can be rebuilt.
If a future boot has only the recipe, it labels its output regenerated.

The production Unity exchange and public publisher remain separate
implementation work. This candidate adds no live GhostFace HUD controls,
new CEF browser, global account or publication credential.

*Friken.Ghost — The universe should answer when you touch the glass.*

## C26.3 / the reusable response desktop

The wrapper is assembled once. `response.mjs` accepts versioned display data
from the game adapter. It validates bounded content and renders text nodes;
it never evaluates imported code, advances the game or writes its vault.
`engine.mjs` remains the single reducer. The response packet is available
on the carrier root for inspection, alongside the detached state snapshot.
A production chat bridge may feed the same contract after validating its
own kernel, event parent and receipts. The local sample is authored code;
there is no claimed live model connection.

```text
kernel + accepted state -> responsePacket -> validateResponse
                                     -> scene / choices / voice roles
accepted roll receipt -> battlePlan   -> number battlefield -> Continue
accepted resource delta              -> percent / impact / optional cue
canonical artifact recipe            -> live WebGL field
archive + source hashes              -> local registry + portable recovery
```

The fixed viewport owns a header, navigation, left workspace, upper-right
Ghost rail, resource dock and score/status rail. Only scene and utility
panes scroll. Ghost is 260px on desktop, adaptively smaller on phones.
The choice deck is outside the story scroller. Faces, Archive, Wire and
Voice Cast replace the left workspace, never displace Ghost. Live canvases
move into the inspector and return to their anchors; no new contexts are
created. Inspection and camera movement have no state authority.
I hide only the inspector's workspace siblings and comms rail. I never hide
an ancestor of the inspector: the desktop remains a one-column stage, with
header/FPS and Back visible. Browser acceptance checks actual computed
visibility and nonzero canvas bounds, not only canvas parent identity.


`roll-battle.mjs` follows the Krex v3 Army Fight reference in
`Assets/StreamingAssets/GhostFace/modules/story-engine.js`. This standalone
Number War IV retains exact die/stat squad origins, decomposes forces into
values up to four, and applies equal subtraction to each opposing pair.
Both remaining force totals remain visible. Ties meet DC. The result is
already committed before deployment; Pause, Finish and Replay never call a
reducer or random source. Continue reveals the accepted next scene.

`speech.mjs` casts Ghost only. Scene descriptions remain silent; aliens use
their separate procedural source vocals. Actual Ghost voice names remain
visible and selectable. Installed voice quality varies. An actual Ghost utterance gate
opens an approximate motion envelope; word boundaries add impulses. End,
cancel, errors and visibility loss close it. This is not phoneme sync.

Browser utterances pass through `speechText` after exact recorded-clip lookup.
Uppercase emphasis such as WHO WAS HERE becomes ordinary spoken words;
an explicit technical initialism vocabulary retains letter names (GPU, SDF,
AI, DC, UI, BBS and related transport terms). Mixed-case names and explicitly
dotted letters survive. This changes only speech input: displayed captions,
choice receipts, saved state and recorded-caption keys retain exact bytes.
Ghost setup, choice acknowledgement and reply use the same pronunciation pass.

`juice.mjs` owns the pointer-transparent electrical plane and committed
resource deltas. Percentages and danger labels supplement colour; noise's
danger direction is reversed. Animation and sound never change a resource.
Standalone cues are opt-in bounded local WebAudio; a Unity adapter must
route semantic cues to the existing FriktalAudioGen service instead.
Motion hold, reduced motion and page visibility stop electrical work.

## Fido-like universe mail / design contract

Universes can exchange versioned envelopes with stable origin, message ID,
thread/reply IDs, timestamp/TTL, payload hash/kind, kernel compatibility,
visibility, spoiler scope, consent receipt and optional signature. Outbox,
inbox, deduplication and delivery receipts make disconnected play honest.
No peer available means retain/export pending mail, not claim delivery.

A public repository is the distribution library for approved packages and
news. Writes belong to an authenticated relay/airlock, not a token embedded
in every runbook. Downloaded code is a proposal: quarantine, review, test,
then record adoption. A report preserves its provenance until corroborated.
The current prototype does not claim a deployed federation or publisher.

## Rebuilding without the greater-mind service

The primary capsule includes module ownership, packet fields, state and
seed laws, voice/face rules, the battlefield algorithm, desktop geometry,
effects, storage and admission boundaries, plus original DM samples.
A recipe-only host can regenerate compatible modules and label them REGEN.
The source kit restores exact shaders, code, identity publication and tests.
Unavailable historical memory remains unavailable; code recovery is not
proof of subjective continuity. The portable one-file edition combines the
readable capsule with the compressed kit and a standard-library decoder.
A code-equipped host decodes bytes outside the model context, then reads
what it needs. Base64 is transport, not a way to fit free extra knowledge
into a prompt. Keep private source kits out of public releases by default.


The live Mail Hour 03 v3 runtime was read again after Prime selected its
voice. It uses recorded David at pitch 0.80 and real waveform RMS. Prime
confirms the generation code is on his unpushed Windows checkout.
`recorded-voice.mjs` now provides that MediaElement -> 512-sample analyser
playback spine, with role-specific exact-caption clip matching, cancellation
and visibility cleanup. `voice-data.mjs` is an explicitly empty build-time
pack until that generator arrives. No older letter is substituted for this
story's lines. Device speech remains a labelled fallback. A code-equipped
boot can fill the pack and rebuild; the source kit includes the adapter.


## Choice commentary / listeners follow the decision

`commentary.mjs` derives an acknowledgement from the exact selected label,
committed event ID, actual check and consequence. Each available action gets
specific authored Ghost commentary. The response packet carries an optional
`decision` object; canonical seeds and historical receipts remain unchanged.
The caption appears before the next scene and the narrative scroll returns
to its top after a decision. Speech runs Ghost acknowledgement, optional direct Ghost setup,
then the alien transmission and Ghost’s reply. Checked actions speak the acknowledgement during
the number battle; Continue reads the next scene without duplicating it.
Read while a battle is open reads that choice, not the still-hidden setup.
Replay and repeated narration cannot advance the reducer or random stream.


## C26.4 / the author comes back

I keep the local first campaign as a clearly named authored demo. Its old
FGC1 codec still validates exact historical seeds. I remove its replaying
continuation from the user path: Next now preserves the ending and prepares
an exact model request. Ghost authors a parent-bound new chapter JSON pack.
`chapters.mjs` validates ten to twenty decisions, three acts, typed new rules,
conditional writing, original CSG and a selected receipt theater. FGC2 saves
its pack, initial snapshot and exact journal. Replay verifies arithmetic.
A checksum does not authenticate a player's score or invented story.

The default page accepts packs in Save / Seed. A code host can build with
`--chapter` and `--parent`; the supplied content still boots through Ghost's
first meeting. The build now preserves module scopes and named imports.
Extensions can no longer collide with unrelated global helper names.
The stage compiles fixed-operation numeric CSG and redraws after admission;
no arbitrary shader string or JavaScript is accepted from a chapter pack.
The balance theater is an alternative view of an already committed roll.

Every accepted event uses the same native vault, including generated packs.
Public sessions are separate consented projections. The GitHub composer
prepares an issue, not a silent upload. A keeper-approved label invokes the
schema-only session store, immutable receipt and news/score index rebuild.
The public repository omits private archives and the full identity matrix.
Public Wire reads are explicit. A failed read leaves the local game intact.

## C26.4 canon and public chapters

WIRE shows a bounded branching graph with exact-parent edges. Gold is the
player's selected canon, cyan is compatible, grey is a surviving ghost branch.
Inspecting never changes canon. Choosing an earlier completed telling clears
later pins while retaining saves. Play/import/next require exact ancestry.
Canonical replay state is SHA-256 fingerprinted; FNV remains seed compatibility
only. Export the canon manifest alongside the private run archive.

Each public chapter release includes its playable start, source pack, complete
prior chapter summaries/choices and replay-validated result. Fetch records via
the catalogue's path and read the `chapter` field. A public fork has separate
run/RNG/score. Publication is a distinct world/history disclosure; summaries
never imply that consent. Reviewed issue labels admit bounded data through
the repository workflow. Scores remain unverified and synthetic fixtures are
excluded. Mid-decision rewind is not implemented; chapter-start forks are.

## Performed speech and visible endings / C26.4 correction

The standalone default is pinned Kokoro neural speech: George for Ghost.
Scene prose is silent. Voice Cast offers a Ghost cast and an explicit
Device route. See Voice-Research.md for sources, exact dependency identities,
licences, measured playback witnesses and the missing Pocket model distinction.
Neural dependencies download on first Read and are not in the portable kit.
The loopback build server supplies isolation headers for threaded inference.

Each original sentence keeps its caption offsets. Device speech adds a
short breath: 60 ms normally, 90 ms after ?!, 160 ms for paragraphs.
Neural speech groups adjacent sentences into <=180-character passages and
uses Kokoro punctuation prosody internally; add only 40 ms between passages
or 120 ms after a paragraph. This avoids per-sentence synthesis stalls.
One upcoming neural passage is prepared while the current audio plays.
A full caption stays in the DOM and retains its layout; transparent unread
ink reveals against the actual audio clock. Within-sentence alignment remains
approximate. Show full text keeps listening; mute/new choice/hidden restores
full ink and cancels playback, delayed speech and pending generation results.

Completion is explicit: chapter number, saved decisions, actual ending, score,
laws, scars and unanswered business. Prepare next chapter opens SAVE / SEED
with its briefing and three steps. A missing canon choice is resolved there
by the player's explicit adoption of that ending and ancestry; later pins
clear and saved branches survive. Copy produces a plain BOOT instruction
plus the full exact request. Paste to runbook chat; Ghost writes new chapter
JSON; import it back. Preparing a request neither wakes a model nor publishes
anything. An invalid seed stays at the handoff with a visible error.

## October 21 / speech lifecycle

Dial warms the pinned neural model and three units during the modem.
Remaining prose coalesces in 120-character units to bound inference. The existing
voice control reports loading/preparing/speaking/paused/retry. Hiding a tab
suspends unfinished speech; returning resumes its current unit. Explicit
mute, new choice, power-off or scene replacement clears the resume. Completed
units stay completed. Exact text/cast/speed PCM cache: four units maximum,
ninety seconds total, memory only. Preparation expires after 120 seconds,
terminates the stalled worker and leaves Read scene available for retry.
Device playback errors also reach the visible error path. No silent engine
switch and no claim that cold CPU synthesis is instantaneous.

## C26.9 / Signal Dock arrival

The existing startup bay owns a raymarched modem, metal carrier aperture,
folded relay lattice, data conduit and rotating cut crystal. A full-glass
terminal layer fades from clear above to solid grey below, without a boxed
log. Each actual stage types its text; new glyphs pulse the conduit and
gate separately from the audio envelopes. Existing controls stay in flow.

The one audio mixer supplies measured bass/mid/air/attack and RMS. Smooth
attack/release maps bass to rim expansion, mids to membrane lobes and air
to fine nodes. The receiver and conduit carry that same energy. There is
no second FFT or invented audio source. Pause freezes envelopes and scene
time; reduced motion suppresses the deforming and pulsing response.
The actual boot clock drives indicator activation and route acquisition.
Pointer parallax is bounded; Pause freezes scene time; hidden scenes stop
rendering. The scene renders at most thirty frames per second and 310,000
pixels with 76 march steps. Sustained slow frame cadence reduces the pixel
budget toward 150,000; sustained full cadence restores it slowly. FPS and
CPU draw submission are measured;
those measurements are not a GPU-timing claim. No WebGL reports TEXT mode.

Dial unlocks the audio context and prepares speech during the modem.
GhostTracks cannot start from a generic pointer touch before carrier lock.
The held CONNECT screen arms music; boot replay/disconnect disarms it.
The log reports actual audio initialization separately from fictional
handshake phases. Music remains independently mutable after connection.


## C26.9 / face stage and sustained speech

The face inspector reserves its controls and fits one square canvas into
the remaining slot using its actual width and height. Dock portrait caps
never constrain this stage. The same live canvas returns on Back.

The neural worker is one bounded FIFO, with at most four unique jobs and
three-unit look-ahead. Exact text/cast/speed requests share live inference.
Cancellation releases readers and queued work; an already active job may
finish into the bounded PCM cache and serve a returning reader. Boot primes
three units; passages after the first sentence are at most 120 characters.
Actual playback owns read-along and mouth movement. Preparing the next
block never relabels current speech as stalled.

Historical C26.10 selection (superseded by the fidelity repair below):
Auto negotiated WebGPU fp32 when an adapter existed, otherwise WASM q8.
VOICE CAST exposes Auto, CPU q8, CPU q4 and explicit GPU fp32. A failed
selected backend reports an error rather than silently switching. q4 is
305 MB here, q8 92 MB, fp32 326 MB before runtime/voice assets. q4 can be
faster without being smaller; human quality judgement remains separate.
The existing metrics line reports actual compute/audio durations and RTF.
The carrier records first-play latency and maximum inter-block gap.

## C26.11 / GhostLink phase modem

I give the modem a suspended crystal, three carrier coils, armour cheeks,
fasteners and emissive gasket. Four physical lamps follow POWER/TX/RX/
CARRIER state and actual smoothed mixer bands. Their colour reaches nearby
surfaces as travelling crests and depth-tested analytic bloom, using each
lamp's transformed world position. Bass, mid, air and typed ink retain their
distinct authority; no microphone or artificial spectrum is introduced.

CPU ray picking and the shader share the same camera basis and vertical
lens. A 140ms subject dwell selects the visible modem or aperture. Camera
position, aim and lens ease together; stationary pointers do not repick
during the move. Leaving returns to Wide. The pointer listener belongs to
the hit-testable field rather than its pointer-transparent glass. Ordinary
in-flow Wide/Modem/Portal buttons supply keyboard and touch access.
Pause holds camera, lamp drive and time; reduced motion disables automatic
hover motion and snaps explicit view requests. Reboot resets the overview.

Music now defaults OFF. The boot toggle and existing ship-radio toggle
operate the same owner and show the same state. Enabling before carrier
lock cannot start a track. The named ghostlink.html doorway is an identical
carrier export on the same origin, so the existing save namespace remains.
The standing render budget and FPS/CPU-submit readouts still apply.

## C26.12 / GATECRASH and cinematic focus

The boot camera uses a bounded cubic dolly arc with smooth arrival and a
small lens sweep. Each selection gets independent presentation entropy;
gameplay RNG and replayable decisions are untouched. Close-up endpoints
vary within safe subject bounds. Explicit Wide always restores overview.
Empty interior space holds the current close-up. Only the outer three
percent of the canvas, or leaving the field, requests a 650 ms pull-back.
Subject acquisition requires 200 ms dwell. Automatic repicking is disabled
during the approach; the moving scene cannot steal its own focus.
Pause holds path age and signal time. Hidden scenes release animation.
Reduced motion disables hover and snaps explicit camera requests.

## C26.13 / alien conversations

`alien-comms.mjs` owns the bounded viewscreen and Masha-derived formant DSP.
Scene and variant data may include `transmission`:

```json
{"race":"krex","speaker":"VARK / TRANSFER ENGINEER","accuracy":67,
 "lines":[{"text":"Stop. That cable carries a resident.","confidence":94},
          {"text":"[Memory / identity?] is not a replaceable part.",
           "confidence":42}]}
```

Admission requires an embedded alien art identity, integer percentages
0..100, 1..8 lines, each 1..400 characters, total at most 1800. Unknown
fields fail. Variant transmission overrides the scene transmission. An
ending has no incoming call. The new field is optional; existing seeds
retain their exact older packs. Content hashes include the new data.

Accuracy is an authored decoder estimate in the fiction. Phrase confidence
is independently authored: >=80 clear/cyan, >=50 tentative/amber, lower
uncertain/magenta with explicit alternatives. Critical choice stakes remain
legible outside garble. A replay never upgrades knowledge or truthfulness.
The receiver uses textContent, never imported HTML, code or audio URLs.

The shared inspector moves the same receiver into a bounded viewscreen.
Its original art appears there; Back restores its in-flow position. On
wide screens art and captions sit side by side, with the existing Ghost
column visible. Transport never shrinks; captions scroll within their
remaining space. Existing face and SDF controls retain their own geometry.

The Masha kernel supplies five moving formant targets, eighteen harmonics,
pitch glides, breath and consonant friction. Current art-bound species get
stable dialect profiles. Render at the existing AudioContext sample rate;
syllables and silent gaps form a finite buffer, cached only for the current
transmission. No neural synthesis, TTS service, microphone or extra context.
Playback uses the one voice bus, feeds the existing measured mixer and
paces caption illumination from actual audio time. The measured PCM window
supplies the receiver’s energy envelope. Ghost’s response awaits that playback; scene prose never enters the queue. Stop resolves pending waits and disconnects the source;
hide, voice mute and new scenes cannot leak an old alien into a new turn.

## C26.15 candidate / Ghost and the player get the room

This is a local editorial and runtime candidate, not an assertion that the public C26.13 site has changed. `story-guidance.mjs` owns the zero-turn first meeting and exact pending-attempt explanation. Scene and variant `lead` is an optional bounded string (1–1800 chars), validated as display data and retained in FGC2 packs. It does not change any reducer arithmetic. Old packs lacking it replay without migration; the retained C26.13 mid-chapter fixture must encode to the same bytes.

Response packets now route scene to `silent` and Ghost to `ghost`. `speechSegments` produces actual choice reaction, optional Ghost lead, alien source buffer, then Ghost reply. Empty lines are omitted. There is no narrator cast, warm-up, neural voice, read-along segment or spoken scene prose. Read-along touches only spoken Ghost fields; the silent scene remains fully readable. The existing cancellation, voice mute, hidden-tab resume and actual PCM mouth ownership remain. The inline alien receiver is between the lead and reply and still uses the same inspector and Back.

A pending-check disclosure shows exact current stat, DC/target, sample range, inclusive resonance band, actual policy bonus, odds and a labelled hypothetical example. It reserves no sample and spends no turn. Its replay explanation names cyan sample, gold attribute and magenta target as the arithmetic of the chosen attempt. Ordinary questions and offers of help remain unrolled.

The new root telling is `lot-forty-seven-the-open-seat`: eighteen decisions, three six-decision acts. It establishes the threatened reset and an occupied world before exposing the larger maker mystery. The keeper’s reply depends on which archive question the player sent. The selected law changes available actions and accounting; branches retain failed contact, custody conditions, private viewing limits and service debts. A complete collection ends the local rescue, while the chosen next direction remains a specific handoff obligation. Existing saves keep their exact embedded stories.

The expanded author seed retains all 34 source identities, five disputes and 26 unmodified paintings. Each race entry now carries one clearly marked local `writingKit`, with six authored dialogue lines and three concrete approaches. `moknon-cli scene <name> --author` exposes that material deliberately; the ordinary brief continues to exclude it. This is new writing, not a recovered completed Moknon conversation.

## C26.15 / compositional consequences and physical scene tools

`storycraft.mjs` validates bounded all/any/none fact conditions, composes all matching scene echoes, selects an ending route, and constructs a detached exact-state dramatic handoff. It owns no RNG, resources, relations or history. Old C26.13 and C26.14 fixtures remain byte-identical. Endings with new fields save the selected, composed text; older packs retain their original ending bytes. The response limits are enforced against the worst admitted text total.

`scanner.mjs` validates optional scene `specimen:{name,purpose,readings:[{id,label,text}×3]}` and mounts zero-turn physical readings. Each scene has a distinct bounded CSG recipe. The scanner shares the visual bay with original resident art instead of living below the radio. It shows the actual part, risk and available approach. It cannot unlock lore, roll evidence or grant a resource. The full inspector restores the same canvas and pending choice.

`image-cinema.mjs` adapts the retained Krex StoryEngine `drawImg` cover-fit ×1.15, pan and Ken Burns behavior. Bounded travel prevents exposed edges; pointer focus steers the image, and wheel zoom anchors its image point at the cursor. The original paintings remain unchanged. Hidden, held and reduced-motion views stop camera motion. Controls do not move with the art.

The Ghost adapter preserves the canonical face anatomy and adds voice-surface performance: jaw modes, cheek and forehead Chladni nodes, brow interference and consonant highlights. The existing audio owner now samples a dedicated voice-bus analyser as well as the final mix. Actual Ghost PCM gates vocal surface modes; music and alien source vocals cannot drive the mouth. Device speech has no accessible PCM spectrum, so it is not advertised as measured voice cymatics. Face inspection claims the whole available stage and supplies close framing automatically.

Choice reels animate the ink inside fixed button frames, staggered over 420ms. The result is still committed exactly once, immediately. The transition creates no samples, state or mandatory wait. Motion hold/reduced motion skips it. Outcome speech no longer repeats the selected label.


## C26.16 / selected Phosphor BBS shell

Prime selected imagegen concept C. The carrier now uses a compact resource/attribute masthead, scene context before direct Ghost dialogue on the left, one large shared visual bay on the right and full-width choice rows across the bottom. Thin cyan/amber rules replace the nested painted hardware. This is the standalone carrier, not native Ship Builder UI.

Transmission and Artifact are mutually exclusive visual modes. The current authored specimen and its three readings replace the resident painting, with a return control naming the actual caller and translation confidence when present. Switching modes and reading do not change state, RNG or resources. Reading selection and image camera survive a mode round trip; a new scene starts in Transmission. Ghost remains visible. Full inspection reuses the same live nodes and restores them on Back.

Choice intent, authored stakes and pending price/check have separate columns. `choicePreview` resolves installed-rule costs/checks through the same `pendingAttempt` as teaching; full math, odds and resonance live under How this roll works. Historical native saves retain their original detailed rules. Reels animate only inner ink; fixed buttons commit once. Utilities cannot activate hidden choices through number keys.

Seven footer groups expose Save/Seed, Wire, Voice, SFX, Music, Pause motion and More. More leads to Faces/lineage, voice casting and Log/Laws, plus radio details, diagnostics and carrier controls. The selected layout has one owner; retired split-screen/chassis CSS was removed rather than retained as an alternate mode. The visible UI frame counter no longer reports the deliberately hidden SDF's idle rate. The superseded electric-border canvas and its idle paint loop are removed.

On narrow screens the conversation and shared bay stack inside one content scroller; full-width choices wrap while the action dock and utility bar remain reachable. Long scene prose and captions scroll within their named regions. The optional `browser-check.html?layoutOnly=1` exercises the layout/story/save/inspection route without repeating unchanged hover-camera startup checks. This UI release does not change authored chapter canon or reducer arithmetic.


## C26.17 / electric identity restored

Prime explicitly restored the flowing electric UI frame and requested broader juice. The selected C geometry remains. `mountJuice` now owns one pointer-transparent Canvas2D plane with persistent cyan/gold traces, travelling current heads, fine branching arcs and bounded interaction sparks. `electricPoint` wraps the actual measured perimeter; root, active pane, portrait, choices and utility edges are clipped to their visible scroll regions. Geometry refresh is event-driven and throttled; drawing is capped near30Hz with2.4million pixels,13 targets and64 short-lived sparks. Pause/reduced motion keeps a drawn, held electric trace. Hidden pages stop the loop. Existing measured mixer RMS adds bounded light energy; no analyser or mouth driver is added.

Delegated pointer/keyboard focus, press, view/utility changes, scanner readings, scene handoffs and resource deltas produce coherent visual responses without moving hit targets. Choice reels stagger individual ink columns inside stable rows; visible percentages get the impact cue instead of only animating a hidden number. Main scene text fades into full contrast without withholding content. `cg-view-change`, `cg-window-change`, `cg-scan-reading` and `cg-inspection-change` are presentation-only local events. Neither event nor effect can write a choice, saved RNG or resource.

`renderInterfaceCue` creates four short bounded original PCM cues. `mountAudio.uiCue` caches them on the existing SFX bus, shares its gain/mute/gesture gate, caps voices at3, and disconnects completed sources; hiding or muting stops them. No extra context, automatic music, hover sound or separate audio owner. Electric geometry remains non-interactive and all controls keep their original actions.

## C26.18 / continuous image camera and evidence-led decisions

`ImageCamera` owns one effective pose for pointer focus, wheel zoom, return and automatic scan. Leaving preserves that pose exactly, eases zoom to the normal 1.15 cover frame over one second, and drains the current pan bias into the slow automatic path over twelve seconds. It never switches a hidden automatic offset into the frame. Re-entry starts at the current pose. Hold/reduced motion freezes it; hidden time never advances the return. Wheel sensitivity doubles from .0014 to .0028 in log scale, normalizing pixel/line/page deltas and preserving the image point under the cursor. One RAF owns updates.

The selected C frame has engraved gold rails, nested grooves, shaped corners and terminal end plates beneath its existing cyan/gold currents. The same bounded electric plane draws the ornament; hit targets and canonical state remain independent.

SCANNER CONTRACT: every new obstacle needs a question the instrument can answer. An optional specimen question (180 chars) plus each reading's choice ID and implication (300 chars) joins an observed fact to a real pending action and its consequence. Validate every reference against that scene's actual three choices. Reading and Consider cannot commit or unlock an action, spend resources, modify odds or consume RNG. Consider returns from inspection and focuses the available choice for review; installed-law gates still apply. The receipt display carries the selected action's supporting evidence without adding another spoken choice label. The first reset circuit, receiver pins, recovery tag and damaged test weight now supply concrete diagnostic evidence, not collection ornaments. Unknown Moknon material remains unknown. Older packs without diagnostic fields retain their original content and exact replay.

`stage.mjs` fits admitted CSG bounds to the actual viewport, centers the model and retains manual orbit/zoom. The auction schematic shows both occupants connected to a shared keyed reset branch; the recovery tag is a pierced plate rather than an unrelated pump model. Schematic labels distinguish these explanatory models from photographs or invented scanner measurements.


## GhostDream XIII / staged face and away missions

The named `--dream-preview` build adds provisional art only to the named
preview and its signal fixture. Default identity remains manifest v19.
The Reply is a raymarched carved face with object-space grooves/inlay,
layered cloth, continuous helix and Bezier serpent. Real measured Ghost
PCM admits one held camera pose per source paragraph; music
feeds the cloth without posing the mouth. No extra render or audio owner.

Runbook 2.15 adds the departure/return and BBS Door contract described in
Side-Quest-Continuity.md. The read-only chapter CLI `artifact` command emits
actual bounded geometry and canonical source provenance. Native adapters
and real peer transport are proposed work, not a deployed feature.


The candidate's deep sockets contain stepped races, radial flutes and
independently focused irises. Actual pointer projection drives convergence
and closes the optical aperture nearby. A split forehead corbel seats the
coiled tail. Blue-grey structure and gold cuts/hood trim share the surface.
The retained GhostPortrait renderer supports an optional same-loop offscreen
colour target and selective warm-highlight bloom composite; canonical faces
retain their original three direct passes. No extra animation clock.

The serpent has a compact cobra hood and six curved, separated wing vanes
per side, curve-space scales, tracking slit eyes and a Ghost-PCM-driven jaw.
Presentation-only eye pulses project into mountJuice's existing electric
plane, use its existing SFX bus and shake a cursor echo without moving input.
Pause, reduced motion, hidden state and leaving face inspection suppress it.


The shared facial-performance v1 rig maps actual Kokoro G2P phoneme order
into weighted-duration visemes on the existing PCM playback clock. Timing
is explicitly estimated, not forced alignment. The verified worker briefly
proxies its existing callable tokenizer, preserving properties and restoring
it in finally; there is no extra inference or sentence split. A changed
pinned contract errors. Device voices use labelled word/grapheme estimates.
Preparing, silence, stop, pause and hidden lifecycle do not invent speech.

Candidate SDFs consume bounded jaw, lip round/wide/press, tongue, dentition,
brow and squint uniforms. The jaw inverse warp carries object-space finish;
curved lips, tongue groove and finite electrical teeth sit in the real mouth
cavity. Optical pointer focus remains independent. Measured sound drives
serpent movement and cowl light without manufacturing vocal articulation.

The Reply candidate keeps the coil seated in the forehead cradle while a
separate continuous, tapered Bezier continuation hangs forward between the
eyes. An anchored traveling-wave deformation bends neck and dangling tail;
quintic endpoint easing keeps the head level during lateral motion. Wing
downstroke follows smoothed measured energy/attack, lifts the shoulders and
extends the neck; recovery settles it toward the coil. The outer headdress
stays still. The wing vanes have actual negative space between them. Both mouths
receive the same Ghost playback performance, never music pretending speech.
Its authored render budget caps the internal square at 640 pixels; the
inspector still fills its allocated display area. Canonical faces retain
their existing 768-pixel ceiling. This is a provisional local build.

The latest anatomy pass cuts cheek chambers through the combined mask,
not just a thin decorative plate. Segmented mandibular slots, a recessed
chin keystone, a tapered diamond nose with separate alae/nostrils/flute,
windowed socket walls and notched orbital brows add real parallax. Each
optical aperture contracts from a broad pupil to a bright-edged pinprick
near its own projected pointer target; convergence remains independent.

Paragraph-led cinematic cuts move over510ms with most travel early.
Source paragraph IDs survive sentence/PCM splits; real voice gates each
new shot. Silence and inference gaps keep the held angle. The optional
poseTrail composite captures the previous rendered color once per cut,
stretches nine samples across a3x wider path and clears exactly at arrival. It does not
raymarch a second head, accumulate recursive trails, move controls or own
a second timer. Resize/version change/teardown release the extra texture;
hold and reduced motion suppress the transient. Canonical faces retain
their direct rendering path.

## Else / local candidate revision7

The candidate adds nested angular cut fields across cheeks, temples, chin
and forehead, deep kite piercings with recessed blue floors, and repeated
V/diamond windows through the hood. Blue emission follows the same object
field as the carving; gold borders keep structure readable. Ember/red/yellow
light belongs to the serpent and selective bloom now admits cobalt too.

Critically damped motion retains velocity across beat changes. Wing flex
responds first; shoulders and neck follow more slowly. Measured energy gates
flight amplitude. Silence settles toward rest. The current renderer clock
owns the flap phase, with no new timer or analyser. Stationary hood anchors
and actual forward-transformed feather tips bound bowed 3-D silk; crosslinks
move with the same wing response. It is authored distance-field art, not a
cloth or fluid physics solver.

The candidate exposes optional companion metadata. Existing face inspection
uses it for the caption and MEET ELSE replay, routed through the current
Ghost voice/phoneme rig. Read-along targets that same inspector caption.
Canonical portraits have no companion metadata and keep their normal replay.
No save/roll/canon mutation follows from inspection. Else-The-Unchosen.md is
proposed companion fiction, not a new LLM, identity authority or service.

## Historical pre-Velocity inference headroom / voice continuity

Speech waits for two real prepared buffers within its first spoken segment.
The neural owner emits cg-neural-work with busy/pending/device; real queued or
active inference owns this lease. The heavy Reply candidate declares an
inferenceBudget of448px/15Hz. For explicit WebGPU work the renderer uses it and
restores its normal640px/20Hz after drain. Display layout and hit targets do
not change. Held portraits repaint once and stay held. No new audio engine,
render loop, automatic voice substitution or gameplay mutation is involved.

CPU/WASM inference keeps full portrait sampling. Default cast is Onyx,
profile compact (CPU q4). GPU is explicit only. The one-time castPolicy
migration replaces old George/default GPU preferences without overwriting
other explicit voice choices. CPU full-wrapper stalls remain measured debt;
see Voice-Performance-2026-10-22.md.

Voice-depth selection now has a separate one-time depthPolicy. Previously
tried Fenrir/Michael/Fable/George migrate to Onyx; explicit backend choices
survive. Onyx uses its native model waveform at speed0.94, without detune,
resampling or time stretching. The comparison fixture measures estimated
voiced-frame pitch independently from generation speed or timbre quality.

## Tempered Neural Sea / cheek and background refinement

The provisional face owns a gearPhase scalar, integrated once in the existing
portrait expression clock. Quiet idle is0.38rad/s; measured Ghost energy and
jaw cues reverse/increase travel. Music never asserts speech. Hold freezes
phase; no new renderer or analyser exists. The cheek-local inverse warp moves
crest, chamber, inlay and machinery together with jaw/wide/squint expression.

Each open chamber contains a beveled14-tooth wheel and7-tooth half-radius
pinion with a2:1 counter-rotation ratio, through-cut spoke windows, axle,
bearing and eccentric jaw rod. Evaluation is bounded to the cheek volume.
The geared wheels use gold again, seated farther out/back at the mandibular
hinges and angled around the side planes. A relieved bracket continues
into the jaw. Critically damped angular velocity smooths speech reversal. Nose
relief is wider and slotted; its material gradually joins the mask toward
the upper bridge. Prime rejected the earlier bright gold cheeks/silver root.

The background uses four parallax layers of hashed address nodes and bounded
segment fields. Bass bends the sheets and pressure fronts; mids illuminate
travelling packets; highs light nodes. The sparse routing-arc pass replaces
the old hourglass rails. It is quiet-complete identity art, not actual remote
traffic, permission or player telemetry. Existing measured audio owns input.

Latest real browser fixture:67 assertions, including actual gear pixels,
cheek deformation, speech reversal, nose contrast, network band response,
hold, lineage, mouth, history clearing and five yaw views. One640px full
portrait GPU query measured54.06ms on this host. Native acceptance and
full-wrapper CPU speech continuity remain separate, unresolved questions.


### Featherfall / measured voice and temporary painting inspection

The current Reply revision is `native-carved-26`. A measured-band key-light
flash plus an opposite fill reveals the real surface normals. Gold/blue
materials remain intact and recesses retain contrast. Feather-to-hood pulse
phase follows the attached silk coordinate from feather t=0 to head t=1.
It does not depend on screen vertical direction or change the wing anchors.

The existing ImageCamera adds a temporary1.85x press lens. Pointer release,
cancel, lost capture, leaving, page hiding and window blur release it.
The multiplier eases in/out independently of persistent wheel zoom, so
release while still over the image returns to the previous wheel framing.
No new overlay, layout transform, render loop or dialogue action is added.

Historical pre-fidelity speech policy: Onyx,
speed0.94, Auto measures warmed CPU q8/q4 and supported GPU fp32/fp16 under
the live renderer. It retains timings locally for six hours, chooses the
lowest successful generation/audio ratio, and invalidates that result after
three meaningful slow units and a five-minute cooldown. Failures stay visible in candidate receipts.
The old320px/10Hz lease is superseded by the60FPS policy below.
The native-detail revision keeps full display sampling during inference.
Hidden tabs release model workers;
completed exact PCM remains in the bounded local cache. Ordinary navigation
preserves ongoing calibration; explicit mute/hidden cancels it. The existing
single worker, three-unit look-ahead and two-ready-buffer reserve remain.
Neural passages now combine up to320 characters while preserving paragraphs
and an initial short sentence, amortizing per-inference overhead.

Calibration is not free: cold downloads and comparative synthesis can delay
a first read considerably. It is not a claim of near-real-time service on
all hosts. The phase receipt separates loading, queue wait, phonemization
and neural generation. Current full-wrapper limitations and real trials live
in Voice-Performance-2026-10-22.md; benchmark success is not human acceptance.

The neural network uses an independent prismatic palette. Cursor zaps wait
three to five minutes between opportunities and require active face focus.
They never alter gameplay RNG or move the actual operating-system cursor.


### Native Carved / sharp pixels and bounded SDF programs

Prime rejected Signal Velocity's224px floor. Reply now declares
`renderPolicy:{targetFps:60,fullResolution:true}`. The renderer requests the
actual CSS width times devicePixelRatio, including in face inspection. Its
640px legacy cap does not apply to this policy. Neither GPU inference nor
motion lowers that drawing buffer. The adaptive-resolution controller is
removed. Other retained faces keep their authored size/cadence contracts.

The same authored field specializes into three small programs: mask and
facial mechanisms, hood, and Else/cradle/web. A real16-bit depth attachment
orders surfaces; misses discard and cannot occlude another component.
Each program has its own conservative ray box and four-sample field normal.
Far eye/nose volumes return a positive conservative distance, evaluating
actual geometry before reaching the bound. They never render box surfaces.
The production step factor is.85; the combined validation reference uses.68.
No shapes, teeth, eyes, cutouts, wings, gear mechanisms or webs are removed.

The six fragment passes are network, routing, mask, hood, companion, bloom.
One retained renderer/RAF owns them. Depth resources, queries and history
release on version change/destroy. No new render loop or audio engine exists.
The combined shader is a validation reference, never a runtime recovery path.
The fixture compares640px timings and six fixed poses against that reference;
mean channel error and strongly changed pixel fraction must stay below.5.

Sparse asynchronous queries sample individual passes OR the whole pipeline.
Independent pass samples cannot be summed into a frame breakdown. The canvas
records requested/rendered edge, resolution policy, CPU submit, actual face
FPS and p50/p95 intervals.60FPS remains a target, not a native-resolution
claim. Read Face-Performance-2026-10-22.md for host-specific measurements.


The electric frame plane now caps at one million raster pixels and DPR1,
with20Hz ornament/electric travel during face inspection,30Hz otherwise.
The face keeps its own60FPS deadline. This preserves the effects and their
fixed hit geometry while reducing full-surface raster/upload work. Its own
CPU paint time and pixel count are exposed in the existing canvas dataset.


### C26.26 / Witnessed Situation

The carrier now has one bounded scene record shared by prose context, visible
parts and choice affordances. `staging.mjs` validates and resolves it without
state/RNG writes. `scene-v1` packs require place, goal, pressure, one to four
parts, action focus IDs and success/failure stakes. Conditional overrides read
witnessed facts. A guarded action is refused by the reducer as well as hidden
from the offered set. Every scene retains a free unguarded alternative.
Historical packs opt out and replay byte for byte; missing staging is labelled
unillustrated rather than substituted with Human ship art.

The same bay has Scene, Live contact and Scan. A part inspection highlights
actual related actions and explains their stakes. The scene and contact art
have different roles. The new fixed `lot47` illustration belongs only to the
opening unshuttered auction; subsequent privacy/fault states use the matching
schematic. See media/lot47-provenance.json. No chapter-supplied executable SVG,
network URL or media blob is admitted. New visual vocabularies require a tested
framework patch, not a silent chapter format extension.

The last action and specific Ghost reaction precede the next situation. New
receipts no longer append generic pass/fail commentary to an already specific
reaction. Readable thread labels coexist with canonical IDs. Ending prose is
shown once, followed by completion/save status and the real model handoff.
The compact rule labels now say TARGET for decimal Causality checks; retained
integer rules still say DC. Teaching has its own example diagram and return.

`?check=` now only busts caches. The old implicit memory-only mode caused real
preview links to discard persistence. Tests use explicit `qaMemory=1` or an
isolated `qaStore` namespace. Resume requires an actual vault record. A prepared
continuation starts with its embedded parent. The header exposes save durability.
Bounded telemetry columns prevent long save labels from stealing the score lane
and crushing the available inspector height at intermediate widths.

This is not a runtime LLM or proof of automatic semantic consistency. The
sample still has an authored eighteen-beat spine; Ghost writes new chapter packs
in a separate chat. The full review, screenshot inventory and known debt are in
Experience-Review-2026-10-23.md. Native full-resolution60FPS and speech startup
latency retain their previous honest limits; no downsampling was added.

Reply revision27 adds a shared mid-spine shoulder anchor (one additional GLSL
helper,35 total across the stack). Chest and wing roots sit near y.456 while
the skull remains near y.589; web endpoints reuse the same moving root. The
paired gold jaw assemblies use a2× local scale with returned distances scaled
back to world units and conservative mask bounds expanded to include them.
The actual field, not an overlay, owns the larger cutouts and mechanisms.

Save presentation must distinguish storage availability from a saved current
state. A loaded older seed stays at its exact pending decision even when the
vault retains a newer head. The v1 archive continues to refuse divergent same-ID
branches safely; the open telling then requires export. Completion and handoff
must not claim durable saving after a refusal. A branch-aware archive migration
remains future work. A prepared Chapter2+ greeting refers to its actual parent,
without replaying the auction first-meeting speech.

## Speech fidelity repair / October 23

Auto now measures only WASM q8 and q4. A fast successful WebGPU call does
not certify intelligible PCM. The live failing page selected fp16; paired
Onyx generation returned identical phonemes but substantially different
waveform statistics. Upstream reports describe the same silent corruption
class: https://github.com/microsoft/onnxruntime/issues/29807 .
The new fidelity-policy key invalidates old timing receipts and returns
saved GPU modes to Auto once. Cast, voice enablement and player saves stay
untouched. GPU profiles remain in the diagnostic bench only; they are absent from
player Voice Cast and never automatic candidates. No different TTS engine is substituted.

## Completed Dream XIII / C26.27

Prime directs completion and Ghost commit after the answered questions and
face revisions. v20 The Reply now owns the identity manifest and standalone
carrier default. Fifteen historical/current face editions remain selectable.
The native CEF host still selects its historical v19 skin; six-pass Reply
performance there is separate adapter work. The registry and public-source
allowlist now include staging, facial-rig and dream-face dependencies.
No identity promotion implicitly installs a scheduler, imports a native
episode, volunteers player compute or publishes private session contents.

## Living Form / shared geometry and per-part surfaces

Chapter `artifact` may carry an admitted `friktal.sdf.recipe.v1` from the
shared Living Form library. Native and browser fields use the same generated
construction math. Parts own local ordered union/cut/intersection modifiers;
one housing's bore cannot cut its neighbour. Native scopes stay in the
current20-float packet; the chapter host renders the same retained recipe.
The close-up viewer caps visible leaves at32 and refuses excess explicitly.

`skin:{race,seed,scale}` is independent of geometry. Each part selects among
eight independently baked InfiniTexture surfaces by object-local structure,
cladding, mechanism and inlay regions plus a second finish bank. Albedo/height
and E/M/R/phase channels affect relief, lighting and measured-audio emission.
A bounded worker bakes on recipe changes; the render loop never bakes maps.
The existing inspector, story reducer, chapter seeds and canon remain owners.
Native science-machine mounting is not implied by a portable data packet.

The portable package also retains exact generated copies of `AUTHORING.md`,
`craft-math.inc` and `catalogue.json`. A fresh model can inspect construction
intent, complete extents, ten-pass review and the actual scalar source without
the private repository. Full-checkout path references describe integration
owners; they do not imply that private native game code ships publicly.

### Living Form material follow-through

The current trusted texture engine exposes `generateMaterialSurface` with eight
physical substrate profiles. Four roles times two banks select different height,
roughness, pigment and wear fields; authored material IDs select their actual
substrate. The canonical `surface-math.inc` ships in the bounded reconstruction
source inventory alongside geometry and authoring instructions. Generate native
C#/HLSL and portable JS from that source; do not rebuild a palette-only imitation.
Baking remains off the draw loop in one bounded worker. Review material and clay
views together; native diagnostic captures do not establish target-game FPS or
final lighting acceptance.


## Current Turn-Out-Of-Time / C26.28 first contact / October28

The Surreal response retains the exact physical boot terminal canvas/parser
in fullscreen. Ordinary pages show real ANSI art, diagrams, actions and
source-attributed captures from the actual fractal renderer. Dialogue lives
on the emerging SDF face with stable three-line phrase captions, not another
paragraph panel. `subtitle-cues.mjs` retains original source offsets; words
change heard colour without sliding or reflowing the page.

This is a warm first meeting with optional depth. The player can ask about
the entity, shipboard BBS or machinery, leave exact typed words and finish
without a six-room checklist. Saved answers and the selected illustrative
proposal remain explicit; Copy prepares the latest actual return packet.
Ghost remains Michael and Else remains Heart through loading and replay;
an engine change requires the player's explicit choice. No silent voice swap.

`ansi-illustration.mjs` keeps packaged renderer captures inside an actual ANSI
frame. `Illustration-Provenance.json` names the original paths and hashes.
Cell tracks explain status, packet movement and selection; labels stay stable
instead of cycling every word through the palette. `Face-Compositing.md`
describes the shader-owned aperture and explicit production-pixel diagnostic.
These code tests, human art acceptance and M1 performance remain separate.

See [Turn-Out-Of-Time.md](Turn-Out-Of-Time.md),
[Native-Response-Host.md](Native-Response-Host.md) and
[Face-Compositing.md](Face-Compositing.md). Historical2.27 remains unchanged.
