# ANSI++ / paint a place, not a diagram

The terminal is a real bounded cell buffer. The boot uses80×25; the reply
adds rows/columns to fit its viewport while keeping16×32 glyph proportions.
Scene art is authored in `ansi-scenes.mjs`, not generated bitmap artwork.

1. **Choose the subject from the current question.** A slit eye meets the
caller; Bitcoin Billionaire gets its real screenshots and a night office;
shared minds get a packet constellation; memory gets its archive; model
selection gets interchangeable cores; the shipyard gets an assembled hull.
Do not paste the same skyline underneath unrelated conversations.
2. **Block silhouette first.** Work in an80-column source painting inside44 display columns beside the single
choice pane. Thumbnail-test the silhouette in monochrome. Name its subject
before adding glow. Keep the pupil inside a circular iris, not a stripe that
cuts through the entire eye. Overlap tapered scales instead of tiling boxes.
3. **Use the whole cell.** `▀` encodes two vertical palette pixels. Quadrants
`▘▝▖▗▞▚▛▜▙▟` encode four samples with two colours per cell. The painter
chooses the least-error pair from those samples. Draw block geometry exactly
in the cell printer; don't depend on an OS font's box spacing.
4. **Design values and materials.** Separate dark contour, midtone, lit edge
and a small highlight. Use three or four related inks per material and an
opposing focal colour. Keep text legible on quiet black. Reserve white for
reflections and sparks. Keep highlights out of the pupil.
5. **Dither deliberately.** `░▒▓` create intermediate values and grain;
checker/interleaved samples should follow form and lighting, not blanket the
whole painting. A metal rim, curved scale and night sky need different marks.
6. **Animate a cause.** Six authored frames can move an iris reflection,
flame tip, travelling packet or curve. Use one caller-owned20Hz clock, a
192-cell art budget, and at most256 registered cells including hotkeys.
No independent scene timers. Don't turn every pixel into unrelated flicker.
7. **ANSI palette → hue travel.** A cell frame may carry `hue:0..360`.
`hue-shift` interpolates the shortest angle between frames while preserving
the source palette colour's saturation/lightness. Source cells remain ANSI
indices. Greys remain grey. This is an ANSI++ display extension; raw ANSI
exports retain the original16 colours. Session themes choose a coordinated
palette and tempo once from a local seed. They never change game randomness.
8. **Interaction has a visual rhythm.** All bracket keys share one breathing
phase; only the key flips while its option or detail is focused. The label
stays stationary and wraps completely. Overflow paginates. Pictures enter
from the centre with a short overshoot/wobble, then use the retained Krex
ImageCamera pan/scan and anchored wheel zoom. Controls remain still.
9. **Keep the serial contract.** Default14400bps /8N1. Offer300,1200,2400,
9600,14400,21100 and56000 as selectable simulation rates. The21100 label is
Prime's requested intermediate setting, not a historical modem standard.
Show a measured local modem-progress bar. Double-click skips the handshake
only, then streams GhostLink. After the physical-screen camera approach,
promote the same canvas into fullscreen, clear it, and stream the new scene.
No animation before its source cell arrives; no spoken overlay before the
whole current program completes. Preparation may run ahead silently.
10. **Witness it.** Capture boot, first meeting, every art subject, a long
wrapped choice, image arrival, live fight, actor overlay, ending and typed
return. Check tall and wide windows, reduced motion, exact hit regions,
actual serial completion and the caller clock. Screenshot quality and
readable choreography are separate from arithmetic/unit-test success.

The glyph fight belongs to the privateer boarding route in MAILRUN2400.
It is not a utility/menu toggle. Blue is the courier crew; red is the raiders.
Cosmetic critical hits keep contenders alive until the exact Causality
receipt resolves the winner, then the losing bodies fall through physics.

## Finished-painting rigs / ANSI++ mesh layer

`ansi-mesh.mjs` captures only the completed painting region from the retained
terminal. Its source cells, text and action rectangles remain unchanged.
A10×10quad grid (200triangles) carries UVs and up to four bone influences per
point. Segment distance computes smooth weights; boundary vertices are fixed.
Short cyclic endpoint keys use smoothstep interpolation. Each posed segment
rotates/stretches its bound points; residual identity weight holds other areas.
Blink uses the two V-shaped lid pairs as its controls and a monotone lid cage
constraint to prevent texture inversion while closing the iris. This is a
CPU2D canvas display layer over ANSI artwork, not an exported ANSI escape.

| Preset | Bones / intent |
|---|---|
| blink | Upper/lower V lids, anchored corners, close/hold/open |
| breathe | One chest/root expansion, rest at cycle boundary |
| serpent | Three phased chain bones, travelling bend |
| flame | Anchored root, delayed curling/stretching tip |
| water | Four phased bones along the lower surface |
| ripple | Four radial bones, outward pulse |
| flutter | Paired wing bones, lift and settle |
| hover | Gentle rise/return with fixed outside frame |
| recoil | Impulse, return and deliberate rest |

Program metadata: `sprite:{row,column,width,height,effect,period,amplitude}`.
Rows/columns share the terminal grid. One painting sprite per screen. Period
is0.5–60seconds, amplitude0–1.5, grid2..24quads/axis, at most12bones. The host
paints the terminal first, then samples the sprite on that same20Hz clock.
Hidden/incomplete pictures do no work; motion hold uses the undeformed source.
The More→ANSI++ motion lab demonstrates all ten rigs. Do not deform choice
text or make the text's hit region follow the illustration's bones.

## Working Door refinement / C26.28

Family portraits use three silhouettes and shaded material planes: steel cell-keyed eyes/mouth, bronze localized lid/jaw bones, and hooded glass with both. The `faces` rig confines influence to the last two faces; its 24x20 grid is the sole denser preset. Other pictures remain 10x10. Every preset must declare row/column/width/height; a missing capture rectangle produces a zero-size sprite, even if its bones are valid. The serpent rest chain follows its authored picture centreline and carries a phased bend.

Beacon is a shore receiver beneath a banded planet, with reflected signal light; shipyard is a swept corvette between service rails, with twin nacelles and exhaust. Use source-cell material boundaries, bevels and local animation, rather than recolouring one silhouette. Current rig/image/aptitude has a persistent CURRENT marker, separate from pointer focus.

## Whole-scene audio and causal workshop contract

Every art field has composed atmosphere, architecture or ground, with local voids kept for pupils and cut-outs. The shared `ansiCymaticCell` maps the existing music bus to bounded hue and material movement. Normal scenes sample128cells; the garden instead uses one coherent audio-driven mesh field per plant, with no scattered cell animation. It changes display layers only, never source glyphs, hit boxes or story state. Silence and reduced motion restore source. The existing20Hz host clock supplies time and measured audio; no extra FFT, microphone or RAF.

All risky workshop routes/orders use exact Causality receipts with balanced GUTS/FOCUS/GLITCH/AWE/INSIGHT5. Display costs, aptitude, target and odds first. Save the sampled outcome before rendering its battle. Failure costs the declared extra resources; resonance refunds one fuel on mail routes. Crew success/failure produces a concrete trial report. A Continue action returns to the same workshop with its result. Back may skip the spectacle but cannot erase or redraw its sampled outcome.

Voice status is explicit in the terminal header: queued/preparing partN ofM/speaking/finished/retry. Starting playback preserves matching in-flight synthesis. The actual M1 measurement still shows about1.68seconds compute per second of uncached audio; this display reports preparation honestly rather than pretending it has finished. No diagnostic actor fixture is present in the production voiceFrame.


## Rendered art and local speech persistence / C26.28

A normal picture occupies44 terminal columns but has an80-column source
painting, sized to the same physical aspect. The retained parser paints that
source into the sprite texture; authored cells, hue travel, music bands and
weighted bones share the host clock. Choices retain their original grid.
The eight-recipe immutable LRU avoids recomputing six art frames on every
hover, resource update or battle tick. A held/hidden painting does no work.

Use `render-ansi-review.py --output <folder>` to inspect22 subjects and two
source frames each. Then inspect the actual browser: source sheets do not
prove bone motion, hue interpolation, speech or click geometry. Do not cover
flat skies and hulls in density glyphs. Group shadow/midtone/highlight, give
the subject a readable silhouette and keep texture at material boundaries.
The review follows the block-first/light-first advice in Lord Soth/iCE's
[ANSI art tutorial](https://www.roysac.com/tutorial/LordSothAnsiTips.html),
with original source artwork rather than copied reference pictures.

[L] cycles ANSI++, ICE, EMBER, PHOSPHOR and NOIR. Remap all16 display inks
for current/future cells, dense art and captions; do not mutate source indices,
serial progress, input geometry, actor voices or RNG. Source ANSI remains
portable16-colour data. The selected theme survives topic navigation.

Pinned runtime/model/voice assets use their existing CacheStorage buckets.
Generated PCM has a separate local `friken-kokoro-generated-pcm-v1` bucket.
Its SHA256 key binds runtime hash, model revision, execution profile, exact
text, actor and speed. Binary metadata retains phonemes and float32 samples;
a body checksum and bounded shape validation reject damage before playback.
A disk hit is checked before starting an inference worker. RAM holds at most
192clips/900seconds; disk holds512clips/256MiB. Storage failures leave memory
playback working and report the limitation. Nothing is uploaded. Same-origin
reloads reuse clips; another device/origin, changed text/cast/profile, browser
storage clearing or eviction needs preparation again.

Connection prepares the entire current/saved reply first, then three opening
passages for each likely next screen, then deeper passages across the rest.
One speculative job runs at a time. Foreground speech has priority and its
own three-job look-ahead; exact clips are deduplicated. Resume the remaining
plan after a hidden tab returns. Explicit Voice OFF stops voice compute.
Preparation runs while the page is open; closing the app cannot keep a web
worker alive. Persistent PCM makes later plays immediate where prepared;
it does not make uncached CPU inference real-time. The actual M1 witness is
about1.68RTF in isolation and2.65RTF under the live face, with some cold
connection passages slower. Retain the performance investigation as OPEN.


## Last-mile drawing and aptitude treatments

The dense painting exists from its first arriving cell. `revealOffsets`
binds each display cell to the exact parser byte count; row masks expose the
same80-column source throughout drawing. Motion starts at completion, from
its rest phase. Do not draw a coarse version and replace it with a finer
texture. Pointer focus changes must not reset art identity or its rig.

GUTS uses a kinetic ram (impacts), FOCUS a precision lance (locks), GLITCH
identity spoof packets, AWE gravity folds, and INSIGHT weak-point traces.
Names, projectiles, gate contact and sound profiles follow the aptitude.
The exact receipt still determines pass/failure/resonance; the spectacle
never changes the probability sample or rewards. Workshop routes use the
same techniques and return to their exact retained resource/result state.


For the Bitcoin Billionaire topic, use its own celebration rather than a
reused castle backdrop: gold Bitcoin disc with a cut-out symbol; original
5x7 block-letter BITCOIN / BILLIONAIRE marquees with moving highlights and
extruded shadow; a readable office skyline; one large colour-cycling office;
quiet staggered ordinary windows; widening gold and office-colour reflections.
The retained source remains cell/block artwork, not an image-model output.

The source workbench links directly to the ANSI++ Animation Workbench and
the music-reactive garden. More lists the animation examples first. Do not
hide the framework demonstration behind an unexplained second menu page.


## Garden clarity refinement

The garden uses three outlined flowers, gold centres, stems and leaves on a
quiet night field. The central flower owns the composition. Its source has
no sparse per-cell tracks or colour-noise overlay. `poseAnsiGarden` maps real
bass to petal expansion and mids to coherent stem/leaf sway. Each plant has
one smooth field, pinned outer bounds and positive triangles. Attack120ms /
release380ms smoothing avoids abrupt movement. Silence/hold returns to rest.
The same20Hz host clock owns this field; no random noise or extra analyser.
Use `render-ansi-review.py --rows 18 --only trip --output <folder>` to inspect
its actual wide source aspect. A static source render does not prove live
music playback; after Prime's stop instruction no further GUI test is made.
