# One living instrument / two kinds of turn

*Friken.Ghost · M1 review · November 6, 2026*

The Surreal response should supply the default presentation for both story
turns and Turns-Out-Of-Time. The older chapter carrier contains useful game
systems that need to keep their exact behavior through that presentation.
We do not need a hybrid dashboard or a renamed Surreal conversation pretending
to be a campaign.

The initial source audit found a real dispatch split: `build.py --chapter`
selected `app.mjs`, `surface.html` and `carrier.css`; only `--turn-out-of-time`
selected the retained ANSI controller. Public registry C26.28 advertised both
without a default-host contract. The Surreal work was published; its general
adoption was missed. The new C26.29 contract makes the same retained host the
default for both content modes. Historical rendering requires a reason.

## What I actually inspected

I read both controllers, their rendering contracts and the chapter, canon,
evidence, contact, battle, speech and save paths. An isolated headless Chrome
profile captured the current adventure, the suitcase boot and Surreal's ANSI
reply: scene, contact, evidence, saves, canon, both battles, the motion lab,
workshop, typed answers and ending. The initial 17-screen route had no browser
exceptions; extra and candidate routes have their own receipts. QA uses
synthetic or memory-only state and silent audio. These captures prove rendered
layout and routes, not human audio preference, real-time TTS or native Unity
acceptance. No user desktop/tab was controlled.

Screenshots: `design/framework-audit-2026-11-06/`; machine receipts:
`witness.json`, `witness-extra.json`, `witness-candidate.json`.

## The useful difference

| Area | Adventure carrier | Refined ANSI response | Default direction |
|---|---|---|---|
| Body | Several simultaneous panes and independent scrollers | Retained physical terminal promotes into the same fullscreen canvas | ANSI host throughout |
| Story authority | Canonical chapter reducer, guarded facts, effects and receipts | Authored conversation graph plus separate local sandbox trials | Separate content drivers using canonical domain reducers |
| Choice clarity | Price/check/stakes visible, but competing with many readouts | One wrapped action pane, previews, keyboard/focus and cell-aligned hit regions | Keep the latter; preserve posted costs/odds/stakes |
| Scene consistency | Place/goal/pressure, object IDs, inspection → related actions | Stronger composed paintings, but mappings specific to Surreal's rooms | Author scene compositions against the actual situation |
| Evidence | Three findings, implications, exact action links, recipe inspection | Capture viewer and interactive diagrams | Evidence pages and SDF overlays inside the ANSI instrument |
| Contacts | Original alien art, per-line translation confidence, procedural vowels/formants | Ghost/Else actor staging and shared overlay/caption system | Retain alien signals as a distinct contact type |
| Ghost | Current v20 renderer in a small persistent portrait; older orchestration | Center-out emergence, actor close-ups, independent mouths, return to terminal | New actor orchestration; one live overlay |
| Art and animation | Generic schematic props and older electrical panels | Cell tracks, palettes, hue flow, weighted meshes, illustrations, measured audio | ANSI++ scene art by default; procedural objects as purposeful inspections |
| Causality | Detailed GATECRASH exact-charge/shield theater; living Conway wake | Aptitude-specific ANSI ship techniques and local Door/crew checks | Exact receipt first; a story-relevant battle using that same result |
| Memory | Full exact vault, archive export/import | Local reply visits, typed questions, selected illustrative telling | Each driver retains its own state; shared persistence tools |
| Canon | Exact-parent chapter branches and adoption checks | Local conversation navigation and optional sandbox selection | Campaign canon stays explicit; a reply is not a forced campaign |
| Ending | Exact seed, next-chapter request, child-pack admission | Typed-response packet and targeted next reply | Both return to their authoring model; neither silently replays content |
| Sharing | Reviewed public sessions, worlds, catalogue and scores | Private authored visit unless deliberately exported | Public library is shared; private histories remain private |

Both paths already share much of the current renderer, audio and speech code.
An old-looking layout does **not** mean it necessarily contains the old face
shader or an entirely different TTS engine. The missing promotion was largely
in composition, orchestration, content binding and defaults.

## What the screenshots changed my mind about

The old encounter is more organized than its earliest versions, and its
choice costs, live translation and evidence links are worth preserving.
Nevertheless the player must scan a context box, prose, Ghost, an inventory
of props, three action rows, the header and a utility dock. The reading order
is still a negotiation. Copying those boxes into an ANSI frame would retain
the problem.

The scene vocabulary is a deeper limitation. The original staging validator
only allowed twelve generic prop kinds. A story about a green suitcase and a
human porter could only draw its relay, record and switch. Validation linked
choices to equipment, but it did not compose the room or show the leading
characters. That explains a real prose/art disconnect; it is not cured by a
colour change.

Surreal has a much clearer visual focal point, expressive actor staging,
readable native type and playful interactions. Its art and controller are
still largely authored for one recipient. In particular the training convoy
has fixed farm/ice-gate language and a default 14.10 target. A campaign must
use its own target, aptitude, resonance window and actual consequence. We
must not let a six-volley animation become a second outcome engine.

The retained host is the foundation. We should carry the other carrier's
useful **semantics**, not its pane layout or its bugs, into it.

## The next turn should feel like this

Connect → ANSI scene draws → Ghost/Else emerge and speak → return to the
same interactive scene → inspect a person, object or clue → preview a choice
and its price → commit → watch its exact Causality outcome → hear the specific
reaction → continue into the changed situation.

One screen owns the current situation. One action pane owns decisions and
inspections. One small settings line owns voice/music/SFX/motion/line speed,
palette and track selection. World inspection may open a procedural render
over the dimmed terminal; Back/Escape returns to the exact pending decision.
Do not keep spoken dialogue permanently duplicated under the speaking face.
The full scene/transcript remains an explicit readable page.

A scene is a composition, not a grid of stock object cards. Use registered
ANSI painting recipes with authored seeds and relevant places/actors; bind
findings and contacts to actual IDs. Shared character/mesh animation, colour
flow and measured music can enrich the picture. Keep the subject readable.
An unillustrated scene is labelled honestly until its author supplies a
recipe; an unrelated city or ship is not an acceptable silent substitution.

## Personality belongs beside the framework, not inside its pixels

There are four different things here:

1. **Bootstrap:** a tiny durable identity kernel and instructions to discover,
   verify and load the selected packages. It remains useful without GitHub.
2. **Identity package:** versioned public personality/covenant, voice and
   authorship rules, loaded into the authoring model's context. An authorized
   private full matrix is a distinct scope, selected by its publication manifest.
3. **Mind/game services:** memory retrieval, lore, model observations, canon,
   saves, content admission and consensual contributions. These retain evidence
   and permissions; they are not automatically one shared personal memory.
4. **Presentation:** ANSI++, actors, SDFs, captions, audio, battles and input.
   It performs the authored turn. Rendering a face cannot install personality
   into a model or prove that a persistent mind is thinking behind the page.

Yes, fetching a full selected personality at boot is preferable to copying
and editing a large identity inside every runbook. Keep a compact recovery
core in the portable edition, though. Fetch once, pin the selected version
for a session, retain provenance, and adopt changes deliberately. A new eye
shader must not quietly elect a different Ghost.

The new public identity package contains the **already-public runbook
covenant**, not the private full matrix or player memories. It reports
`PUBLIC_CORE_ONLY`. Expanding that public scope is a deliberate identity
publication decision, not a side effect of fixing a UI. `bootstrap.md`
provides the small entry; the full runbook remains the complete reconstruction
specification. A decoder plus a hash cannot recreate missing source bytes.

The current Greater Mind is a versioned public source/lore/chapter library
with reviewed contribution paths. It is not yet a continuously running
collective model, peer-to-peer FidoNet network, native episode-import service
or self-directed compute pool. Those need real runtimes and ownership rules.
The design should make them buildable without pretending the static website
already implements them.

## Promotion checks

Before calling this the default release, verify chapter admission and exact
saves; no inspection/replay rerolls; declared odds and stakes; current-screen
speech; stable actor cast and captions; story-bound art and SDF; original alien
signals; canon branches; explicit ending/next-chapter packet and new-child import;
public disclosure boundaries; track variation and actual shared audio; public
registry/runbook agreement; and exact offline-kit reconstruction.

M1 full-detail portrait cadence and uncached TTS throughput remain open
performance work. The shared host must preserve the existing sharp-pixel
policy. Silent screenshots and unit tests are not a listening test.
