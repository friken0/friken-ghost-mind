# M1 connection and Reply renderer / November6

**Current correction:** Prime rejected the scaled portrait as pixel-munched.
I removed automatic density changes from GhostPortrait and both face callers.
Ghost/Else field, depth and history now match their output at all times.
The shader optimizations remain; the connection keeps its separate budget.
All scaled-face FPS results below are historical, rejected-quality evidence,
not a claim about the current full-resolution face performance.

I profiled the actual production fields in isolated headless Chrome156,
using ANGLE Metal on AppleM1. I never attached to Prime's browser tabs.
The controlled viewport is1280×800 CSS pixels at devicePixelRatio2.
The existing Mac output policy remains one drawing pixel per CSS pixel;
this is not a claim of native Retina2× or Unity/Windows performance.

## Expensive paths and changes

The connection's76-step marcher evaluated the modem, terminal, portal,
conduit and relays together. I prune unions with conservative component
bounds, specialize the two canonical Craft entry points, prepare moving
rotation pairs once per frame, and use the exact analytic deck normal.
The same atlas, geometry, AO,76-step limit and animated light remain.

The face's64-step curved companion pass combined the coil, neck, wings
and thirteen silk curves. I split silk from the body, tighten their ray
bounds, and gate distant coil/torso/skull refinement with positive bounds.
I retain the carved field, textures, articulation and four-probe normals.
I remove preserved default framebuffers; depth, bloom and pose history
remain owned render targets.

I test at unchanged density before enabling a fallback. When sustained
cadence remains below30FPS, the opt-in budget adjusts only the expensive
3D field target. The connection composites its terminal glass afterward
at full output resolution. Portrait output/bloom compositing, ANSI text,
subtitles and controls remain native. Field, depth and history resize
as one unit. The policy starts at1, ignores startup/visibility gaps,
measures1.4s and at least12frames, targets40FPS, and recovers cautiously.
It never changes march counts, SDF detail, timing, speaker or game state.
`?pixels=native` disables the response's automatic Mac density policy.

## Witness and limits

`profile-renderers.mjs` owns a temporary loopback server and a separate
Chrome profile. Browser/module caching is disabled. No TTS is generated,
no audio envelope is fabricated, and no player saves are touched.
The benchmark holds the same output viewport across all six views.
Auto results describe settled windows after calibration, not every
startup, camera-travel or compilation frame. This M1 is shared with
other desktop work; thermal and competing GPU load can move the result.

Apple elapsed queries returned overlapping/inconsistent pass intervals.
I keep those diagnostic samples separate from actual completed-frame
cadence, and do not sum them into a claimed GPU frame time. An early
repeat test also reused cached modules; those repeats are excluded.

| View | Original FPS | Tuned / unchanged grid | Tuned / auto FPS | Auto field grid |
|---|---:|---:|---:|---|
| Wide connection | 10.8 | 26.7 | 48.9 | 880×550 |
| Modem | 12.1 | 21.2 | 43.3 | 720×450 |
| Portal | 9.4 | 19.6 | 48.4 | 720×450 |
| Terminal | 25.5 | 60.0 | 60.0 | 800×500 |
| Ghost wide | 26.0 | 28.2 | 34.9 | 1040×650 |
| Else close-up | 8.8 | 12.6 | 34.8 | 640×400 |


With the actual rebuilt ANSI host still running, silent Ghost/Else overlays
measure32.7/37.5FPS after calibration at960×600 and560×350 field grids.
The1280×800 output and terminal stay native; connection promotion completes.
This extra check uses temporary test exposure in an isolated document only,
without modifying the delivered controller or synthesizing speech.

At fixed native test density, before/after captures differ by mean RGB
channel0.00036/255 for the connection and0.0643/255 for the face. Pixels
with any channel delta>30 occupy0% and0.1324% respectively. These are
fixed wide-pose comparisons, not a proof of every animated close-up.
The production640×640 alpha probe passes: solid center, twelve sampled
feathered contour regions, and all409600pixels clear when fully closed.
It used silence and makes no new live speech/cymatics acceptance claim.

Run on the Mac from the repository root:

```sh
node Tools/ChromaticBBS/profile-renderers.mjs /tmp/ghost-native native
node Tools/ChromaticBBS/profile-renderers.mjs /tmp/ghost-auto auto
```

The script records actual field/output sizes, loaded revision, GPU identity,
FPS and screenshots. It requires installed GoogleChrome. Native is an
explicit control run: the 3D field and output use the same1280×800 grid.
