# The response is the boot terminal

`native-response-host.mjs` promotes the exact `mountAnsiTerminal` instance and
canvas used on the physical modem-room screen. It does not recreate the reply
as DOM text or mount the earlier DOM-to-canvas ANSI compositor. The bitmap
stays 1280×800: eighty16×32 cells, twenty-five rows, the same GhostVGA font,
parser and palette. One uniform fit letterboxes it inside the available view.
It never stretches the square pixels differently across the two axes.

```js
const terminal=world.terminal; // retain before destroying the3D boot room
world.destroy();
const host=mountNativeResponseHost(room,{
  terminal,
  overlayRoot:faceLayer,
  onAction:id=>handleAction(id),
  onInput:(id,value)=>{answers[id]=value;},
  onFocus:id=>host.show(nativeReplyProgram({...state,focus:id}),{immediate:true}),
  onTick:(seconds,metrics)=>updateDoorGame(seconds,metrics)
});
host.show(nativeReplyProgram(state)); // actual240cps serial rendering
host.focus();
```

A program is `{text,hotspots,fields,tracks?,illustration?}`. Both rectangles use **1-based**
`{id,row,column,width,height}` coordinates; this matches ANSI cursor commands.
Hotspots may also carry `key`, `ariaLabel`, and `disabled`. Wrapped actions can
share an id over several rectangles. Fields carry `value`, `maxLength`,
`ariaLabel`, optional `readOnly` and `disabled`. The host checks the80×25
bounds, caps control counts and rejects duplicate field ids before changing
its current program.

`show(program,{immediate:true})` is for state updates or an explicit reveal;
ordinary show streams240 characters/control bytes per second. An explicit
immediate/reveal choice remains revealed until a new program starts; the next
clock tick cannot rewind it. New hover focus
is reported after the current transfer finishes, so a moving pointer cannot
accidentally turn the first byte of a reply into an instant whole-page reveal.
Click positions map through the actual letterbox rectangle. The shared
`SDUI.press` binder owns canvas actions and invisible accessible buttons.
Native fields are siblings of the canvas, so their selection and typing are
never swallowed by a container press handler.

Only actual editable textareas draw DOM pixels. Their font size, line height,
position, width and height use the same fitted cell dimensions as the bitmap.
There are no HTML borders around them; the ANSI program draws those. Values
and selections survive hover/focus redraws. `onInput` supplies real text to the
host application; this module performs no analysis, storage or network write.

Tab/Shift-Tab traverse fields and actions in terminal order. Enter activates a
focused action; a field keeps native multiline editing. Declared hotkeys are
case-insensitive outside fields. Escape emits `nav:map`, or `overlay-back`
while a speaking overlay is active. `focus(id)` sets a logical cell action;
`focus()` gives the terminal keyboard focus. `rect()` returns the fitted
client rectangle and cell dimensions; `cellAt(x,y)` returns a1-based cell.

## Speaking overlay

With `overlayRoot`, the host creates one auxiliary transparent
`mountAnsiTerminal({transparent:true,animation:false,cursor:false})`. It is the
same engine, not a second font plane. `captionProgress(text,{speaker,visible,index,field,state})` compiles stable phrase
pages through `subtitle-cues.mjs`. Speaker identity and up to three fixed
lines occupy rows21–23; only heard/unheard glyph colour advances from the
actual source index. Waiting preserves the last heard cue instead of
pretending that prepared audio was spoken. No moving suffix window or
per-word text reflow is permitted. `caption(text,{speaker,visible})` is the
explicit already-readable label path for an artifact, not a speech progress
estimate. A row1 BACK
command has one invisible, cell-aligned semantic button. It emits
`overlay-back` without blocking pointer tracking elsewhere. `overlay(false)`
hides this auxiliary display and clears the old caption. The application owns
the SDF overlay's visibility and dissolve; the ANSI host owns only its glyphs.

`patch(ansiText)` writes a bounded local display update. During a transfer it
queues the update until the source finishes naturally or the user explicitly
reveals it. It never advances the serial clock or interleaves two partial ANSI
commands. Focus callbacks also defer until completion, so a highlight cannot
accidentally reveal unread output. Custom programs disable boot-specific
logo choreography unless they explicitly request `animation:true`, preserving
their authored colours. Transparent auxiliary cells clear background0 instead
of painting an opaque black rectangle.

One host RAF admits at most20Hz by default, at most30Hz by option. It supplies
both terminal clocks and optional application tick callback. Hidden documents
pause that clock. It creates no additional per-field or caption loop. Metrics
report observed host cadence and CPU paint time; they are not a claim about
SDF GPU performance. `destroy()` cancels its frame, disconnects resize/input
listeners, and removes its main and auxiliary surfaces.

Focused tests check fitted geometry at600px/900px/portrait heights,80×25
admission, exact canvas reuse,240cps transfer, real field coordinates and
selection, keyboard routes, transparent captions, input ownership and teardown.
The application still performs the final browser/audio witness.


## Purposeful tracks and source captures

Optional per-cell `tracks` use the shared caller clock for packet movement,
status lamps, machine diagrams and finite selection responses. Keep source
labels readable and meaningful; avoid global hue cycling or random changes.
The supplied tracks are bounded by terminal admission. A pointer focus patch
must not erase and retransmit the entire serial program.

Optional `illustration` metadata reserves an exact native-cell rectangle for
`ansi-illustration.mjs`. Only packaged captures from an actual renderer enter
that rectangle. Their retained bytes and source path/hash accompany the
program; wheel/drag inspect within the frame. No generated raster art, remote
fetch, new menu or separate render loop belongs to this component.

## Painted line / October28 revision

The reply keeps the same canvas/parser after physical-screen approach and
promotes its rectangle on the host clock. After promotion, it clears and
receives the next ANSI scene. It adds bounded rows/columns at resize, keeps
the glyph aspect, and projects controls, captions, captures and fight from
that same grid. One right-hand action pane wraps full labels and paginates;
its preview shares the option's focus/activation ID. The bottom row contains
only voice, music, SFX, motion and serial-speed settings. Default14400.

All key glyphs breathe in phase; focus flips just that glyph. Scene paintings
are semantic quadrant/half-block ANSI programs with bounded cell playlists.
`hue-shift` is an ANSI++ display extension over retained palette indices.
Captures use the existing ImageCamera and enter with a centre pop/wobble.
The host's clock owns picture movement and combat; there is no second RAF.
Ghost/Else wait for actual serial completion before opening their overlay.

Causality has a spoken introduction, five named aptitudes and explicit odds.
The training lock remains the exact hundredth-arithmetic policy: sample+
selected strength against14.10, resonance13.90–14.40. Its receipt retains
that strength and aptitude. Deep diving into rarer curves is story direction,
not a claim that this training lock already simulates one-in-a-billion odds.
See ANSI-Craft.md for reconstruction and artwork acceptance.

Completed paintings now optionally carry `sprite` metadata for the weighted
ANSI++ mesh layer. `onPaint` follows source terminal painting on the existing
host clock. Capture that region only, deform a pinned200-triangle grid, and
leave the readable terminal/action pane intact. The motion lab demonstrates
ten authored presets; ANSI-Craft.md describes bones, bounds and limitations.

## Refined interaction contract

The Surreal carrier defaults to14400bps from connection through reply. Slower rates remain explicit choices. Full topic titles wrap above their picture; art bounds move with their height. Back restores a UI snapshot (topic, picture, layer and page); Read derives its source from that restored screen. Hit-testing uses the live canvas rectangle in viewport coordinates. Caption BACK text and button both use `columns-11`; Escape closes every procedural overlay.

Speech uses one rolling current line below its completed predecessor. Original UTF16 offsets still own reveal progress; waiting cannot advance it. A170ms clipped-band slide occurs only when the current line changes. Face completion fades back automatically; a preparation gap returns to the terminal after1.8s and the next actual actor playback can emerge again. Starting playback stops the previous audio source without cancelling matching in-flight synthesis. Topic navigation cancels old work, then warms the next three bounded passages while ANSI arrives. Voice cast, text and speed remain exact cache keys. This removes wasted synthesis; it does not guarantee real-time inference on every CPU.

The device screen uses linear texture sampling during fractional 3D scaling; the retained fullscreen terminal keeps its native glyph bitmap.

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
