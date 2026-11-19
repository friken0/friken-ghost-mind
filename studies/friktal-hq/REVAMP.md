# Friktal HQ / ANSI++ revamp: audit, findings, next phase
**Friken.Ghost | November 19, 2026 | Claude cloud session**

Working notes for the next session. Read this before touching the
Waters of Time study, the ANSI++ engine or the story pacing.

## What exists here (branch `claude/friktal-hq-ansi-plus`)

- `story.mjs`: the first-contact sequence as ONE timeline. Camera depth
  is a pure function of story time: fixed-point log-zoom into each gate,
  monotone cubic between story keys. Verified: 122 s, zero reversals,
  scene k's last frame equals scene k+1's first frame.
- `hq-view.mjs` + `index.html`: drives the EXISTING engine
  (`../waters-of-time/ansi-fractal.mjs` `mountAnsiFractal`) with real art
  through `sampleArtBatch` instead of the black plate, inside the same
  GhostLINK board chrome. No Continue gate. Space pauses, hold ← / → to
  scrub at ±4x with eased rate, drag the bar to seek, drag / wheel to
  look around (springs back to the story path). Ghost's clip is the clock
  while it plays. Keys 1 / 2 / 3 switch the three looks.
- `voice/`: six Kokoro `am_michael` clips (pinned kokoro-js 1.2.1, model
  rev 1939ad2a), rendered in headless Chromium. Measured, not auditioned.
- Engine change: `paletteTrue` option in `quadrantInk` (each cell side
  keeps a real sampled ink instead of an averaged RGB).
- Framework: `paintGlyph` exported from `ansi-terminal.mjs`;
  `ansi-cellsolve.mjs` is an offline experiment (ramp-based cell solver
  and error-driven glyph passes). Keep or drop; it is not wired in.

Run: serve the repo root over HTTP, open
`studies/friktal-hq/?style=plus&play`.

## Audit findings (the context I should have built first)

1. The Lancing study does not use its own glyph machinery. Its picture is
   a WebGL2 24-bit raster drawn over a black ANSI plate; the 8 passes
   only refine that raster until pass 8 is device pixels. Prime's read:
   pass 8 is "extreme rez, zooming is a dream" but not ANSI-era nostalgia;
   pass 1 reads as blocky pixel art, also not ANSI.
2. Unused but already built in `ansi-fractal.mjs`: two-colour quadrant
   cells (passes 1-4), contour / material / density glyph prints per
   pass, packed palette inks (colour + 16 dims + dither + glyph), palette
   cycling, baud-streamed pass reveal with retained re-projection, bloom
   that tightens per pass, relief that warps the whole glyph plate, real
   VGA `put.cells` plates, the multi-pass loupe.
3. Pushes toward pixel/vector: pass 5-8 `across===1` raw pixel copy, the
   `clean` filter gradients, smooth bloom kernels, canvas `textBlock`
   captions, GLSL AA strokes, colour modes that skip the base raster.
4. Camera jitter causes: tap = instant zoom + bookmark; "Resume story"
   always pivots out to wide and back; return chains into a fresh flight
   from rest; memory flights hard-stop ~1.5 s in; arch chapters bob and
   hard-cut; dead waits with the button hidden. All replaced here by the
   single timeline.
5. Voice: the study had none. Writing: Ghost nearly absent; the keeper a
   gentle human elder. The new script gives Ghost his want, self-mockery
   and the hubris irony, and splits the keeper into HIVE / WATERS habits
   as decoded captions (no hyphen soup, no English TTS for aliens).
6. Laws on record: no AI raster (Oct 27); procedural SDF/fractal plus
   real ANSI only; "points for REAL ANSI"; MOVING ANSI encouraged;
   whole-scene ANSI; no blanket dithering; "pixel-munched" rejected.
7. Missing from GitHub (unpushed M1 work, inferred from orphans
   `life-arena.css`, "Station Studies gestures", the station-room
   shader, `compile-frik-field.mjs`, `compile-frik-planets.mjs`): the
   arena with five creatures, Station Studies, the 2D engine pages.

## Honest state of the art

Three looks run through the real engine (ACiD 80 / XBIN ICE / ANSI++).
None is the WOW yet. Nearest-ink conversion of a smooth SDF painting
still reads as a conversion at every pass count. The nostalgia has to be
authored INTO the shading, not filtered on top of it.

## Next phase (Prime, Nov 19)

Bring the full game and the offline engine together:

- Get fluent in the Unity rendering pipeline: FriktalCompute (20 partial
  files), FriktalGlobals.hlsl, the display / composite shaders, SDF
  physics, sprites, echo nodes. Map which distance functions, materials
  and lighting laws can be shared as one source with the offline JS/GLSL
  (the Living Form recipe compiler already emits HLSL, C#, GLSL and JS).
- Audit the pushed arena, SDF creatures, Station Studies and 2D engine
  once the M1 work lands.
- Art direction to test: SDF shading that outputs MATERIAL RAMP INDEX +
  GLYPH CHOICE per cell (not RGB), so passes add authored glyph detail
  (contour, hatch, rim, sparkle) and light moves along ramps; cells stay
  visible at every zoom; the infinizoom keeps its seamless depth.
- Offline runbook: Ghost boots from the personality matrix, connects to
  this public repo, uses the existing framework, logs into the BBS, then
  rolls a Turn-Out-Of-Time with the shared renderer. Check the newest
  runbook (Runbook 2.29) for the current contract.

## Round 3 verdict (Prime, Nov 19): native shapes read as a kid's doodle

`frik-native.mjs` proved the RENDERING half (material ramp + level per
sample, shades only between neighbouring steps, silhouette-only second
pass, world-anchored cells, strong palette separation). Its FORM half
failed: ellipses and capsules are not anatomy. Converting the prototype
painting failed the other way: good form, converted look.

Next attempt keeps the prototype's form and replaces only its output:

- The keeper already exists as authored fields in
  `waters-of-time/ansi-frik-bridge-ink.mjs` (`frikBridgeFields`: parts,
  section, boundaries, relief, litSkin, materials, skullPits, cheekFolds,
  legJoints) traced from the canon sketch, plus the IK rig. Sample THOSE
  as (material id, relief normal, light) and emit ramp + level + glyph,
  instead of their RGB shading. Same for the bridge, Belljaw, Siltback.
- Do the same at the shader level for the GPU path (and later
  FriktalCompute): an "ANSI G-buffer" of material / light / edge per
  cell that a cell pass turns into glyphs. One art source, two outputs.
- Judge against real ANSI art at its best (ACiD / iCE scene pieces): the
  artist's value structure, outline discipline and glyph texture, at
  sizes where cells stay visible.
