# GhostLink / serial glass

I use the supplied 33.76-second clip as a layout and pacing reference:
1280×800 pixels, eighty columns, twenty-five rows, 16×32 display cells.
I author new GhostLink character art; I do not copy the reference story.

`ansi-terminal.mjs` owns the bounded cell buffer and parser. SGR colours,
bright foreground, cursor addressing, line clearing, save/restore, scrolling
and partial escapes are real terminal operations. CP437-equivalent block,
shade and box-drawing glyphs form the artwork. No AI bitmap is involved.
At 2400bps with 8N1, 240 serial bytes arrive per second. Control bytes count.
The renderer uploads only when actual cells change. Its clock is its host's;
it has no separate animation timer. This is local connection theatre.

`boot-world.mjs` retains modem, portal, light rig and material engine. A
recessed SDF monitor has a bezel, service fins, seated stand, fasteners and
an actual world-space glass plane. The terminal canvas textures that glass.
A direct-emission pass preserves the palette and contrast. Nearest texture
sampling preserves glyph edges. Rendering uses exact CSS pixels by default on high-DPR Apple displays;
`pixelRatio: 'native'` requests CSS×DPR. There is no adaptive resolution
scaler. Once the camera settles on the screen, one SDF frame renders its
static bezel into a dedicated RGBA framebuffer. This avoids a driver-dependent
copy from an opaque default drawing buffer. A small analytic program then updates only the glass; the modem and
portal do not keep marching behind the front-on terminal. Cadence remains
observed, never claimed as60FPS.
Actual terminal arrival pulses the same signal envelope as before, distinct
from measured audio. The existing camera/picking functions own screen focus.

`cinema.mjs` keeps Dial, Pause, Finish, held Continue and reconnect. The
17.6-second modem handshake finishes before the9.66-second ANSI transfer.
Camera focus follows an explicit click or a named host action. Pointer motion
never changes the camera; the room starts in its wide view. The old grey text
curtain is removed. Continue remains a human action with no timeout.

## Reuse

```js
const world = mountBootWorld(canvas, {
  terminal: {recipient: 'SURREAL', label: 'TURN OUT OF TIME'},
  energy: () => audio.info.bands,
  level: () => audio.info.rms
});
world.show(true);
world.set({phase: 2, progress: 1, terminalElapsed: 4});
world.focus('screen');
// Host pause keeps its clock fixed. Explicit finish reveals exact content.
world.set({terminalComplete: true});
world.destroy();
```

The twelve focused Node checks cover fragmented escapes, bounded state,
serial timing, retained canvas rewind/reveal, projected screen picking and
square/wide/mobile bezel fitting and Apple/native pixel-ratio selection.
The retained carrier can reserve a bottom command band; dialer actions also
live inside the physical screen. The reply fit
removes that external control reservation; its actions live inside the glass.
The existing twenty-one presentation tests still pass. Browser shader,
readability and live SDF inspection require the final integrated page witness;
these numerical checks alone do not certify the picture or human pacing.

## Craft decisions retained

I build a distinct silhouette beside the modem, a deep continuous shell,
seated glass/stand, negative screen recess, split bezel/service fins,
object-local metal finish, bright isolated glass, actual signal-driven
light, named camera and exact resource teardown. The screen is hardware,
not a floating browser screenshot. Root owns the final integrated visual
review and its front/oblique/connection-state evidence.

The integrated browser witness caught mirrored U coordinates and an over-tight
square-view lens. I reverse the glass U sample and fit the whole bezel from
the actual aspect ratio, with optional bottom clearance for the retained
carrier. The new response places actions inside the glass. These corrections
keep camera picking and shader lens on the same fitted view.

## Native terminal ownership

Dialer, receiving and held modes each expose actual eighty-column cells and
matching bounded hotspots. `screenCell(clientX,clientY)` returns u/v,
column/row and hotspot identity from the same camera projection as the glass.
`pick(clientX,clientY)` returns the physical object under a press; the host
uses its shared input binder to choose focus. `screenRect()` exposes the front-on glass rectangle in local and viewport
coordinates. `focus('screen',{reply:true})` chooses the fuller reply framing.
`set({terminalReply:true})` or `freeze()` retains the final bezel and
stops its loop after camera arrival. A fullscreen reply handoff can hide or
destroy the room after its final zoom; the reply owns a separate native
display surface, avoiding continued room raymarching behind the face. `resume()` restarts the scene clock.
`setDisplay(canvas,revision)` admits a compositor-owned display texture;
DOM controls can instead occupy the returned physical glass rectangle.

The shared `ansi-ui.mjs` compositor uses VileR's unmodified IBM VGA8×16 font,
retained under CC BY-SA4.0 with its exact offline bytes and license. Visible
text and frame art are character canvas output; semantic DOM owns layout,
keyboard navigation, hit targets and accessibility. Read-along spans retain
actual DOM positions, alpha and scroll clipping. Dirty work coalesces at15Hz,
then sleeps. Finite per-cell effects use the shared caller-clock animation
module. No AI picture or decorative terminal screenshot supplies these pixels.

## Flagship cell choreography

The connection logo is a retained character composition: diagonal colour
weaves run through its solid blocks while its bevels scan between cyan,
blue, purple and warm-white ink. A single bounded packet chase travels the
outer rail. The phase-bus row demonstrates flip, ordered dither, scan and
shrink/return transitions through the shared `ansi-animation.mjs` engine.
Status brackets receive a slower colour chase. Controls are excluded from
all decorative effects; their text and hit cells stay solid. There is no
whole-panel flash, background strobe or floating sprite during connection.

`terminal.update(serialSeconds,{reveal,time:presentationSeconds,reducedMotion})`
keeps the serial arrival clock separate from animation. The world supplies
its existing pause-aware clock. Changed glyphs repaint at at most20Hz; static
cells retain their pixels. The authoritative parser/transcript never changes
when colours or geometry animate. `setAnimationEnabled(false)` and reduced
motion settle the exact same readable display. `data-paint-ms`,
`data-changed-cells` and `data-animation-cells` expose actual work.

## Executable first; ANSI after carrier

The external reply starts with `terminalMode:'prompt'`, not the logo. Its
bare prompt offers the exact logical command, wrapped before the final flag:

```text
C:\GHOST> Friken.Ghost.exe --boot
          --connect:https://github.com/friken0/friken-ghost-mind
```

Both command rows expose the same `dial` hotspot. Highlight follows the host's
shared input focus. On activation, `terminalMode:'command'` types the78-character
command at35 characters/second from `terminalElapsed`; `commandDuration`
reports78/35 seconds. Keep this mode during the modem handshake. No flagship
logo or decorative cell animation appears until the host selects `receiving`
after connection. The host owns actual HTTPS loading and distinguishes its
result from local modem theatre. `terminalControls.boardStatus` is bounded,
control-code-stripped status text; a controls-only `world.set()` can update it
without resetting the typing clock. The transfer `duration` stays separate
from command typing duration. These presentation functions execute no shell
command and make no network request themselves.

## Device focus and the audible handshake

The wide shot approaches from the other side of the dock. The terminal is
closer to the camera and its projected hardware area is larger than the
modem's; the modem remains visible beside it. Screen/glass focus still uses
the exact front-on lens. No device transform or geometry was scaled to fake
this composition. Wide view refits the actual aspect after arrival or resize.

Picking follows rendered order: the analytic3.2×2 glass rectangle owns its
foreground pixels, including where it visually covers another device. The
other device bounds compare positive ray distances. A hidden portal center
therefore cannot steal a screen click; its exposed aperture remains clickable.
The host binds Escape to `world.focus('wide')`.

During command mode, after all78 command characters are visible, pass
`terminalControls:{connectionProgress:0..1,connSeconds,boardStatus}`. Nine
boot phases use the same0/.75/2.55/3.25/6/7.6/9.1/11.4/15.2-second boundaries
as the17.6-second synthesized modem. Completed phases, an active glyph spinner,
a58-cell packet meter and elapsed time make that audible interval readable.
This is explicitly a local modem clock. The real HTTPS result remains the
host-supplied transport status, displayed separately and never invented by
the terminal. ANSI logo/chroma still begin only after the carrier connects.
The retained cinema uses the same phased display and labels its embedded
specimen honestly; the new external reply's host owns its real board fetch.

The reply's ANSI chrome uses one grid scale:32px cells on viewports at least
1200px wide,16px below. Commands, headings, choices, subtitles and character
frames share that scale. The dock is capped at45dvh with its own scrollport;
the stage can shrink instead of pushing its bottom border beyond the page.
The header is separately bounded. The host puts the dock's ANSI frame on
the fixed scrollport, keeping it independent of scrolling choice content.
