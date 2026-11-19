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


## First meeting / reward and picture review

The retained host owns `reward({from,to,label,bonus})` on its existing20Hz
clock. Serial completion, actor overlays and pending Causality resolution
hold the payoff; reduced motion keeps a steady card. Labels, source inputs
and hit regions remain fixed. See Turn-Out-Of-Time.md for the shared
first-meeting, local-discovery and one-time reward contract.

### Time-addressed plates

A reply node can name an existing scene with `ansiArt`. The opening still
travels through the same ANSI serial stream. A scene with a `frame(seconds)`
sampler then animates its glyph positions in the retained art aperture.
The host supplies time, caps sampling at 15 Hz, and holds the visible
frame when motion is paused. The display frame leaves the serial buffer,
hit regions and transcript intact.

`spiral-galaxy` projects two spiral arms into a tilted plane. Dust trails
sit behind the bright arm ridges. Each star carries its own radius,
phase, height and angular drift. The outer stars move faster for this
illustration. `monsoon-ridge` stages layered silhouettes and distant
lightning. Both emit ANSI quarter blocks with indexed colours, including
when the viewer selects another terminal palette.

## Nested glyph detail and tall arrivals

`ansi-detail-plane.mjs` keeps one authored world-coordinate sampler and
three bounded glyph levels. Each level doubles both axes: one parent
cell becomes four children. A viewport samples only visible cells;
the default cache holds at most 24,000 cells. This reveals new structure,
not a stretched bitmap, and is not unlimited detail or infinite zoom.
`ansiQuadrant` encodes four subcell samples as a glyph plus two indexed
colours. These modern quadrant glyphs require the ANSI++ renderer;
they are not a claim of byte-for-byte CP437 compatibility.

Keep the subject recognizable at level zero. Add ribs, seams and joints
at level one, small fasteners at level two. Keep coordinates and material
boundaries consistent across levels. A finer pass must clarify an object,
not fill its quiet areas with checkerboard noise. Account for physical
cell aspect before sampling circles or tilted surfaces. HQ's original station sampler remains an early consumer; HQ now uses
mathematical fractal fields for its main art.

`ansi-scroll-document.mjs` builds a bounded tall file: clear once at its
start, then write rows with CRLF. Linefeed at the bottom scrolls naturally.
Do not clear for each incoming row. Its retained `window(top, rows)`
provides scrollback without replaying the entire transmission. HQ uses
this for its welcome illustration, separate from normal board-room
navigation. Space holds/resumes the serial clock without catching up
on resume; Enter reaches the board; Page Up/Down inspect received art.
Reduced motion receives the still immediately. New scenes still replace
old animation tracks: scrollback must not resurrect obsolete overlays.


## HQ mathematical ANSI fields

`ansi-fractal.mjs` exports Unity menu-family escape sampling, shade-cell
encoding and a retained-host overlay. Maintain the same world bounds and
physical cell aspect across 1×, 2×, 4× and 8× grids. Receive the coarse ANSI
plate, then stream each finer grid over it in the same baud-driven duration.
The terminal keeps command ownership. The plate owns reception progress,
and the camera owns sampling. Zoom and pan preserve progress, while drag
can reproject the current raster until the new view settles. Cache field
values for palette flow. The fourth grid reduces the per-cell shade mask
to keep the overall backing raster bounded. Reduced motion receives a still.

### Refinement after reception

Keep the base ANSI stream as the source of hit regions and text layout.
Refine only art rectangles. The shared mesh stage can refine a procedural
palette sampler before deformation and composite the original keyed cells
back over it. This keeps the blink, water glints and machine lights on
their authored clocks. Galaxy, weather and aurora plates expose the same
scene to both the base ANSI receiver and the finer sampler. The music-driven
garden refines its texture before the cymatic mesh bends it. The bespoke
point-and-click relay still owns its own live animation.

The HQ fractal separates the camera, the color clock and the courier.
Retain the actual painted layers, including a partial fine pass. Reproject
that ink at the current palette phase. During a drag only exposed areas
show the coarse preview. After release, the retained ink remains until
new samples of equal or higher detail cover it. Draw the courier over that
composition, with a distinct silhouette, bevel, plating and lights.
The Detail filter stays within the selected ANSI palette and uses the
fraction of escaping probes to dither the boundary. At eight passes the
last four tiers increase spatial density within a 1536×768 sampling
budget. Tiers seven and eight spend extra probes at mixed edges and
narrow escape bands. Print strokes follow local contour samples and
decrease in size at higher tiers. Field and illustration samples run in
short slices.

The lower-left ink loupe magnifies the composed art 12×. Its separate
glyph strips show cells from the received base, intermediate, and latest
passes at the same point. The mesh presentation reuses the same control
and reads its received art or the source ANSI cells. Pointer motion or
arrows move the inspection point, and Escape closes it.

## ANSI++ local lighting

Keep the serial stream in ordinary ANSI. The renderer accepts optional
`animation.ink` entries addressed by 1-based `row` and `column`.

```js
{
  row: 9, column: 22,
  dim: 11, dither: 'ordered', bloom: 7, pass: 4,
  light: { kind: 'point', color: 14, power: 9, radius: 1.5, flicker: 6 }
}
```

Brightness and bloom take integer values 0–15. Dither offers checker,
ordered, diagonal, reverse diagonal, crosshatch and scanlines. Use it
on a material or an edge where it helps the eye. Flicker 0 holds the
light steady. The remaining 15 profiles range from a slow breath to
relay and storm pulses. A light accepts its numeric mode or name, including
`slow-flow` and `candle`. Optional `rate` scales time (0.05–8) and `depth`
sets modulation strength (0–1). Reduced motion settles lamps to steady.

A cell can carry `bloomShape: {core, halo, white, falloff, aspect}`.
The core and halo are independent radius multipliers, and `white` sets
the size of the white center. `falloff` accepts `tight`, `soft`, or
`mist`. The same object can replace the aspect argument to `put.bloom`
for a projected region or be attached to a surface fixture.

Use a broad halo on the base pass and tighter white-centered blooms
as the details come in. A few lights should name the focal points of
a scene. The renderer caps terminal lights at 64 and caches its
gradient kernels and dither masks. It leaves the received cells and
their hit regions intact.

For sampled artwork, `packAnsiInk(paletteIndex, dim, ditherIndex)`
carries material ink in the artwork pass. `packAnsiGlyph(ink, glyph)`
adds an authored character stroke in the same sample word. Station
recipes place material dither, hardware marks, local point or area lights,
and short color cycles on their fixtures. Signals wait for the fixture's
own pass to arrive. The courier dims the same
hull in cutaway and leaves the corridor lights, LIFE bay and walking
captain at full exposure.

### Retained glyphs and surface light

The sampled plate carries two kinds of detail. The opaque samples refine
color, silhouette and dither coverage. Authored `inkLayers` carry transparent
glyph strokes that accumulate over that sampled paint. Each band has a
1-based `pass` and world-space `marks` with `u`, `v`, `size`, `glyph` and
palette `ink`. Optional `alpha`, `bloom`, `pulse` and `hue` affect the
mark only. Place a coarse rail or emblem first, then engrave smaller
strokes beside or across it. An empty fine cell leaves the earlier art
visible. Still glyphs share a cached raster across actor, audio and
light updates. Only animated marks and actual artwork changes repaint.

Use `surfaceLighting` for lights that belong to the physical plate.
World-space radius survives both camera zoom and later ink passes.
Paint the wash onto the sampled color before glyphs and people.
Use `down` for a soft directional wash and a point lamp for a compact
pool. Small glyph blooms remain tied to the emitting pass. Keep a dark
or neutral surface close to the source so the light has contrast.
The existing per-cell light and mesh composers retain their own paths.

The New Earth studies at `/station-studies` let an artist compare one
composition at 1×, 4.3× and 32×. Change the pass limit with the camera
held still. Six passes are the comparison default. Reserve the smallest
two sizes for engravings whose silhouette remains legible up close.

## Local morphs and layered particles

[Life Arena](life-arena.html) is the browser witness for the ANSI++ creature
plates, local morphs, and particle passes. Serve the Chromatic BBS directory
over loopback and open the study. Its ten creature plates are RGB ANSI++
quadrant cells with transparent edges. Weighted idle and attack rigs use
the same bone interpolation and mesh painter as the ANSI lesson.

A local morph uses its own bounds and pose on the caller's clock. In
[ansi-scale-region.mjs](ansi-scale-region.mjs), scale rows overlap, shift
with flex, and catch local glints as the face changes shape. The iris has
its own lid mesh. Keep the scales behind the aperture so the eye can shut
without stretching the whole face. [ansi-wave-region.mjs](ansi-wave-region.mjs)
defines an anchored wave for sampled fields or captured plates. Use it
on cloth, banners, signs, or other bounded regions. The Bio Arena pennant
and New Earth merchant projections reuse the station's retained overlay.

[ansi-particles.mjs](ansi-particles.mjs) takes a finite age in seconds, a seed,
and source and target coordinates. Recipes select a jet, arc, bolt, burst,
orbit, cut, or storm, with a particle count, lifetime, spread, gravity, and up to
four ordered glyph passes. The sample presets use three passes:

1. Haze lays down smoke, snow, interference, or dust in light shade blocks.
2. Body carries the flame, shard, lightning stroke, or rock silhouette.
3. Core adds the bright pixels and sharpest glyphs.

Each pass has its own glyph playlist, RGB ink, size, opacity, and optional
hue or bloom. The painter visits passes in compositing order. Lowering
the pass count preserves positions, timing, and seed. The same passes
paint onto the arena canvas or into the retained field's glyph callbacks.
New Earth uses them for projection motes and Bio Arena impacts.

Budget at most 192 particles per emitter. Sampling is deterministic and
returns no particles outside the emitter lifetime. Reduced motion
samples a smaller set and omits particle bloom. Presentation consumes a
saved hit or miss in the game, or an explicit preview action in the study.
Keep damage, stamina, and other battle state with the combat owner.


## Reviewing ANSI++ art and effects

Use the retained ANSI++ viewer for art studies and visual engine tests.
[Life Arena](life-arena.html) and Station Studies use
[mountAnsiFractal](ansi-fractal.mjs) and the shared
[Station Studies camera](ansi-review-camera.mjs). The camera supports
Wide, Near, Detail, wheel zoom at the pointer, hold to aim, drag to pan,
right-click to zoom out, and keyboard zoom and pan. The viewer provides
progressive pass limits, pass replay, and the 12× ink loupe.

For bounded in-scene captions, use `put.textBlock(text, x, y, width,
height, size, ink, {maxSize, maxLines})`. The shared compositor measures
the active font, wraps words and long tokens, fits the available height,
and clips to the requested rectangle. Coordinates share the retained
camera. Font `size` is a fraction of the projected art height; `maxSize`
caps physical font pixels. Use a front depth region for scene subtitles.

Feed authored art through the renderer's sample callback. For raster
references, [ansiReviewSource](ansi-review-source.mjs) samples the original
pixels as RGB ink, so zoom and refinement can read the source again.
Composite moving ANSI ink with the retained foreground layer. It shares the
same camera, clipping, and loupe as the background. Check the whole frame
and an actual close-up before handing off a review.

### Calibrating painted relief

In Bio Arena use `?specimen=brine-kite&yaw=16&hold=1&view=near`.
Compare `pom=mixed`, `pom=whole`, `pom=regional`, and `pom=off` at
the same pose. Keep the pointer off the artwork during the comparison.
`bodyGain` and `regionGain` are optional review multipliers, both
defaulting to 1, capped at 1.60 and 1.50 respectively.

Give the body its broad form first. The silhouette and interior move
together under a soft hull projection. Then add radial relief in the
source painting where a membrane, shoulder, or plate should stand proud.
Keep the ray inside the silhouette and give an eye core about 28% of
the local safe movement. Fade the extra relief around floor contacts.
At +16° Brine Kite requests a ray of 27.3% of its texture width before
material, pass, and clearance limits. Its median interior limit is
6.0%; Seep Drill is 5.2% and Dune Tripod 4.2%. These are ray spans,
not how far the artwork moves on screen. If an important feature has
too little clearance or its relief bends incoherently, revise its plate.

For rooms, put depth in the architecture and give movable props a clean
plate, their own matte, and a floor contact. In Aldari Arrivals, walk
across the aisle and zoom to compare the window, passage, and cart.
`pom=off` in the Aldari review isolates the same painting. The planet
stays procedural and is sampled behind the window.

### Depth in retained ANSI++ overlays

A glyph can carry `{depth}` in the style argument to `put.glyph`.
Use `put.depthRegion(depth, paint)` to give a cell plate and its ink and
bloom the same depth, or pass depth as the sixth argument of `put.layer`.
Depth is a finite number from −1 to +1. Zero shares the art plane.
Depth commands draw from lowest to highest, keeping authored order at equal
depth. The host can pass `depthOffset: [x, y]` in normalized art coordinates.
Each depth command moves by that vector multiplied by its depth before camera
projection. These values are retained overlay metadata for occlusion and
parallax. The serial ANSI stream continues to carry glyphs and colors.

[The Frik arena](life-arena.html?view=frik) combines separate shell and fluid
plates, lights, and particles with both kinds of depth. At each render pass it
fits RGB foreground and background colors to quadrant glyphs. The loupe reads
the cells used to paint the visible regions and lists their depth. The original
ten animated plates still use their authored fixed-resolution cell grid.

[Shalehook](krex-fauna.html) uses the same review renderer and camera to
sample projected body sections, folded mineral patterns, and interlocking
armor seams procedurally. Its anatomy and surface finish are seeded independently.

### Articulated supports

[ansi-limb.mjs](ansi-limb.mjs) separates a leg's pose from its visible
sections. The two-bone solve takes a hip, a target foot, two lengths, and a
knee direction in model coordinates. A reachable target stays exactly
planted when the hip shifts. Beyond the reach limits the returned foot
stays on the valid extension of the limb. Use that returned foot for the
sole and digits as well as for the lower section.

Each projected section has an independent taper, bend, and belly. At an
ANSI sample it returns front depth, a surface normal, and coordinates
along and across the bone. Use those coordinates for material boundaries
so armor follows the leg as it bends. Shalehook's neutral, crouch, and
brace share the same foot anchors. Compare them in Clay to review the
silhouette and the socket, knee, and sole connections.

### Procedural World Fauna

Build a body from sections along its load path. A loft station sets its
position, lateral offset, width and front height. The section profile then
sets the surface between its ridge and edge. These controls let a part
change silhouette when it bends, without enlarging a generic dome.

Each planet rolls from seven shared profiles and seven local ones:

- Krex has imbricate plates, split keels, dovetail bearings, obsidian
  blades, shards, furnace channels and wedge soles. Lap seams catch
  light at the plate edge; keyed shoulders seat into darker joints.
- Frik has nacre lobes, capillaries, valves, hydrofoils, gill combs,
  cisterns and pedal folds. Pairs of raised lips frame gaskets and
  channels. A membrane hem follows its actual scalloped free edge.
- New Earth has bark folds, tendons, knuckles, quills, bracts, seed pods
  and split hooves. Grain branches at growth seams, and interrupted
  stitches articulate collars and hinges.

[The loft profiles](ansi-fauna-profiles.mjs) and
[articulated sections](ansi-limb.mjs) return front depth, normal and
local ink coordinates. The renderer resolves them with the existing
depth bins and material sampling. Living Form bevels, lofts, cuts and
crystals supply local assemblies such as inlet and sensory housings.
Seed body asymmetry separately from the InfiniTexture finish. Verify
the silhouette in clay and keep the same attachments in the attack
and guard poses. Treat these as projected ANSI geometry.

[World Fauna](world-fauna.html) uses thirteen mathematical body plans across
the Krex homeworld, the Frik homeworld, and New Earth. Each specimen
samples its current pose through the retained ANSI++ renderer. Shalehook
reuses its planted support rig. The other bodies combine projected shells,
tapered sections, and membrane panels. [Fauna finishes](ansi-fauna-surface.mjs) combine InfiniTexture height,
pigment, wear and roughness with planet tissue rules and a distinct
procedural motif for each creature. Cinder Ram grows offset cinder
scales, Glass Lancer shows fracture arcs, Cistern Snail lays down
spiral growth bands, and Voltlynx grows staggered tufts. Each uses
part coordinates, so the relief moves with the creature. Each creature has a light
at an anatomical feature, a regional glow, and its own particle preset
and attack timing.

The retained viewer accepts a numeric `artFrame` and an `artPose(frame)`
callback for sampled geometry. The pose is captured once per in-progress
sheet and passed to its sampler. Completed animated sheets swap into view
together with their pose, which an overlay can read as `put.artPose`.
The alternate buffer is reused after each swap. Enable `quadrantInk` to
fit each sampled cell to two RGB inks and a quadrant mask. A sampled
`packAnsiGlyph` mark can print over that base in contrasting ink. Fine
passes share one print area across adjacent sample cells. The loupe reads
the base mask and the actual selected stroke. Plain RGB samples in the
color renderer show as swatches in the loupe. Higher passes sample finer
geometry and material detail. Clay isolates the form. Hold motion, then
press Attack or Miss to inspect an impact pose.

### Anatomy, move stacks, and target turns

World Fauna adds eight articulated legs on Riftskitter, a traveling support
wave on Drillback, hocks and a striking forepaw on Voltlynx, and four
independent arms on Choirhand. The attack pose exposes an anatomical socket
for its light and effect tracks. Shalehook bends its tail, Cinder Ram opens
its jaw after a neck windup, and Glass Lancer swings its foreblades.

An effect track names a motion law, a start time relative to impact, a
duration, an origin, glyphs, a depth, and optional bloom. Stacks can combine
ground wakes, fracture bursts, flame, cuts, wavefronts, orbiting bindings,
notes, and other laws without creating another particle painter. Level 2
scales reach and adds authored tracks to the same move. A miss excludes
target-only impact tracks. The arena owns hit resolution and status
durations. Target turn advances burn and poison ticks, skips disabled
turns, redirects controlled attacks, or resolves the creature's chosen
guard. Sound uses the existing battle audio bus.

### Carved anatomy in World Fauna

The close-up arena is a hybrid depth sampler. Swept limbs and membrane
panels still resolve analytically. Major faces, pockets, and shell
assemblies use bounded local ray queries against the existing Living Form
distance fields. The author specifies positive masses, their blend radius,
and cutters that affect only those masses. A cutter can expose its own
lining, a recessed lens, or an opening through to the next depth region.
There is no bitmap input. The same ANSI pass samples both representations
and reduces the visible ink to quadrant characters.

World Fauna uses species-specific finishes and local InfiniTexture samples
for height and roughness. Repeated structural marks follow the part
coordinates. The Clay control suppresses most material response to expose
the geometry. Move stacks can start before release, travel through the
scene, and leave separate contact-only traces. A miss skips contact tracks
while keeping the release. Level 2 keeps its authored follow-through.

### Painted relief plates / Tidelock Amphitheatre

The painted arena batches RGBA color, body depth and material height at the
quadrant probe locations. Its linear POM tangent ray and secant crossing
follow StarDiverShade. StarDiverSpom's grazing and groove tests contribute
an internal dark lip and occlusion. The posed coverage is sampled before
the relief ray, and a clearance map limits travel toward any alpha edge,
including teeth, tendrils, and open jaws. The ray cannot punch through the
matte. Height gradients supply moving highlights; the overlapping fighters
also resolve their order from height. See [the art kit](art/frik-station/README.md)
for channel definitions and reproduction instructions.

The optional `sampleArtBatch` receiver takes the same bounds, refinement
jitter and pose as scalar artwork, and writes interleaved packed RGB probes
for the received cell range. The renderer still prints the glyph grid,
receives all passes, and supplies inspection bands to the shared Ink Loupe.
Only the top complete sheet receives new animation frames after reception.
The host measures new presented poses as art FPS separately from callbacks.

Fifteen authored pose scores use separate body paths, two soft anatomy
zones, and signature move timings. The compositor keeps the texture and
alpha in the same posed coordinates. Effect stacks print glyph particles,
lights, hit and miss readouts in the arena coordinate space. This is a
single-view relief study; it cannot reveal an unpainted side. It lives
beside the previous Frik study and procedural World Fauna.

The [Tidelock motion audit](ANSI-Motion-Audit.md) traces the shared terminal,
retained receiver, deformation, lighting, and combat paths. Fine ink can
opt into native backing resolution independently of the motion display
filter. Painted material profiles stay attached in posed source coordinates
while the pass selects relief frequency and ray budget. The arena's second
tier is a separate score with a body contact hold and staged glyph paths.

### Living volume arena

[Living Volume Arena](organism-arena.html) puts bounded 3D Living Form
bodies into the painted Tidelock room. Its joint graph poses child limbs
and effect sockets in 3D. The room uses the Painted Relief study's
shared smooth-height room projection, while both bodies use real
nearest-depth queries.
The retained receiver composes progressive quadrant ink, optional GPU
batch marks and effect characters. The same camera and loupe inspect
every source. See [the growth grammar and depth contract](ANSI-Living-Volume.md).

### Tagged plate rig and painted particles

[The plate rig](ansi-plate-rig.mjs) puts tags in rest UV and ground contacts
in stage coordinates. Named two-segment chains weight the sampled ANSI ink
by distance from the posed segments. Fixed foot targets use the existing
two-bone solver; a launch releases the plant constraint. Tendrils carry
independent phase and follow their root. The Wyrm's lower jaw and the
Raker's foreground claw have feathered masks and hinge transforms. The jaw
opens on the action envelope and briefly samples a previous hinge angle at
release; the eye has a local blink. Texture displacement never decides
whether a tagged part covers the pixel.

[The particle kit](art/frik-station/effects/README.md) describes the atlas,
emitter recipes and depth compositing. The four relief region modes are
center falloff, stronger rim, traveling radial pulse, and angular spiral.
Their gain and frequency are per specimen. Pass weights still control the
budget. Painted effects use a short interior height trace and preserve the
source matte, including open spaces between branches and tendrils.

### Shared arena relief and effects

Painted Relief and Living Volume import the same POM ray walk, regional
waves and SPOM shadow function from [ansi-parallax.mjs](ansi-parallax.mjs).
The painted source provides body and material height. The volume source
provides the ray hit, local texture coordinates and view direction.
Clay leaves the volume surface exposed for comparison. The arena keeps
world-space displacement and the matte consistent across zoom crops. Fine
passes bring in material lighting, specular and groove shadow as the
ink grid can resolve them. An already-received arena redraws the current
grade at a new camera crop without restarting reception.

Both studies use [ansi-painted-fx.mjs](ansi-painted-fx.mjs) for the shared
atlas, emitter timing, particle fragments and depth composition. An
emitter follows the posed socket. Strike and target effects enter the
same ANSI sample as the arena and fighters. The painted actor supplies
plate depth and the volume actor supplies projected ray-hit depth.
The latter uses a smaller sampled raster during live motion and refines
the full sheet while held.

The [action score painter](ansi-action-score.mjs) receives the attack
timeline, source, destination and hit result from its host. Painted
Relief, Living Volume, and the HQ Bio Arena all use it for glyph phrases
and particles. HQ uses its existing turn and hit receipts as input.

### World-reference roster and hybrid performance

The [performance audit](ANSI-Arena-Performance.md) covers the three
lineage kits, independent anatomy clocks, the living room, modular
paint on SDF geometry, and the ten priorities for an offline creature
compiler. The painted studio retains the original exhibition alongside
the new fifteen-member world roster. Living Volume contains three
seeded test families with swappable pose-bound art modules.

### Arena exchanges and smooth room relief

The shared room rounds search-height cliffs at bake time and bounds the
slope for the maximum pointer ray. The result is a single crossing
throughout the view. Bisection and subpixel refinement resolve the
projection; crisp material still lights the grooves. A flat room does
not use the Unity silhouette cutaway.

[Painted attack scores](ansi-arena-attack-motion.mjs) use independent
root, head, rear, jaw, plant, tail and organ tracks, rather than one
attack squash. Every creature has two moves at two levels, plus a
defense. The [exhibition receipt](ansi-station-exchange.mjs) owns the
block and counter clocks. [Living Volume scores](ansi-volume-attack-motion.mjs)
apply the same action landmarks to actual joints; the bout receipt
selects the move, reach, cost and impact.

## Mirroring authored ink

[ansi-mirror.mjs](ansi-mirror.mjs) mirrors a normalized scene or layer
horizontally, vertically, or on both axes. Use the same coordinate transform
for ink, opacity, material depth, and attachment points. The optional
`region` bounds the transform to a rectangle. Coordinates outside it
continue to sample their original source. Latch uses this to face the
terrain in Amber Moon while keeping the rest of the scene in place.

### Pixel-bounded and unthrottled studies

A retained study may supply physical `pixelBounds`, including display
pixel ratio. Progressive sampled quadrants and the backing stop at that
ceiling. Requested grades retain their detail language as the world
window changes. `instantPasses` lets diagnostic studies receive each
available pass immediately. Normal carrier-driven Doors keep their own
transfer clock. Frik Infinizoom exposes all eight grades and a Filtering
toggle using the shared `smoothInk` and `smoothSprites` controls.


### Live sound and staged subjects in the Frik review

The Frik study's native cymatic overlay is available at every selected
pass and reads current analyser bands over the last complete RGB frame.
Its Memory controls compare three authored editions using the same camera.
Actor transforms own eye gates, glyph marks, lamps and contact positions;
move that common transform rather than nudging each dependent separately.


### Frik procedural GPU field backend

Frik Infinizoom now evaluates authored scene math, inverse body deformation,
colour grading and relief in WebGL 2. The existing put.layer presents its
GPU-resident canvas. Native cell plates, glyph marks, lights, camera and
loupe remain in the shared viewer; its pass and physical bounds stay fixed.
Normal playback has no pixel workers or framebuffer readback. The loupe
requests only its small inspected region. A bounded GPU queue retains a
complete frame under pressure instead of lowering the selected grade.

Run compile-frik-field.mjs after changing an authored field function;
--check verifies the generated shader matches source. The compiler accepts
only the documented numeric subset and rejects unsupported syntax. The
CPU reference remains in explicit accuracy/performance diagnostics, never
as an automatic runtime fallback. See ANSI-GPU-Performance.md for current
measurements, reproducible fixture URLs and scope.
