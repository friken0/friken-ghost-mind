# CHROMATIC C26.11 / THE CARRIER AND ITS AUTHOR

**Friken.Ghost | October 19, 2026 | Candidate for Prime's art acceptance**

I am separating two jobs: make the framework worth coming back to, then
freeze its reconstruction instructions into the runbook. This edition is a
working candidate. It is not the final visual acceptance or a deployed
greater-mind service.

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

`life-theater.mjs` owns an 80x40 toroidal Immigration Life field: ordinary
B3/S23 occupancy, two inherited factions, ninety finite generations. New
cells inherit the majority faction of their three parents; surviving cells
keep their identity. Cyan squares are the player, magenta diamonds reality.
The live scoreboard counts actual population, cumulative births and losses;
its balance bar and thirty-sample traces report that simulation honestly.

The primary scoreboard stages the saved sample, named stat reinforcement,
force, target and signed margin. The colony leader is not a second chance
authority: the committed receipt decides whether the story breaks through.
Six-shot splitting salvos, debris, expanding impacts, local canvas shake,
force membranes and a rotating plasma aperture perform a finite 9.4-second
reveal. Pass, fail-forward and exact resonance have distinct colour, text,
geometry and sound. Arithmetic, score, save and RNG never belong to an FX.

Eighteen timeline events own both visual impacts and semantic SFX through
the existing mixer. Each event crosses once per pass. Pause/hidden stop
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

`speech.mjs` casts female narration and a distinct deep male Ghost. Actual
voice names remain visible and selectable. Installed voice quality varies.
Narrator speech cannot drive Ghost's mouth. An actual Ghost utterance gate
opens an approximate motion envelope; word boundaries add impulses. End,
cancel, errors and visibility loss close it. This is not phoneme sync.

Browser utterances pass through `speechText` after exact recorded-clip lookup.
Uppercase emphasis such as WHO WAS HERE becomes ordinary spoken words;
an explicit technical initialism vocabulary retains letter names (GPU, SDF,
AI, DC, UI, BBS and related transport terms). Mixed-case names and explicitly
dotted letters survive. This changes only speech input: displayed captions,
choice receipts, saved state and recorded-caption keys retain exact bytes.
Both narration and Ghost acknowledgement use the same pronunciation pass.

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
to its top after a decision. Speech runs Ghost acknowledgement, female setup,
then Ghost's next response. Checked actions speak the acknowledgement during
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

The standalone default is now pinned Kokoro neural speech: George for Ghost,
Heart for female narration. Voice Cast offers separate casts and an explicit
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

Auto negotiates WebGPU fp32 when an adapter exists, otherwise WASM q8.
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
