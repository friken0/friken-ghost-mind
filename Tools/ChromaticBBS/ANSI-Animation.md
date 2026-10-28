# Per-character ANSI choreography

`ansi-animation.mjs` owns cell state and deterministic transition math.
The existing terminal/compositor owns its font, canvas, audio and clock.
No timer or animation loop is created by this module.

Register only the border, glyph or control that needs to move. Ordinary
paragraphs remain ordinary text; an idle frame does not scan their glyphs.
The hard budget is8,000 registered cells and16 frames in one playlist.
Default admission is30 changes/s; the configurable ceiling is60.

```js
import {createAnsiAnimator,drawAnsiCell} from './ansi-animation.mjs';
const animation=createAnsiAnimator({seed:'reply-713',maxRate:30});
animation.set('door:0',{glyph:'░',fg:14,bg:0});
animation.cycle('door:0',[
  {glyph:'░',fg:6},{glyph:'▒',fg:14},{glyph:'▓',fg:11},{glyph:'█',fg:15}
],{at:now,interval:160,transition:90,effect:'dither',
   mode:'loop',duration:960,settle:'first'});

// Called by the existing compositor; never start a second RAF loop.
for(const {id,frame} of animation.changed(now,{reducedMotion})){
  const {x,y}=cellLocations.get(id);
  drawAnsiCell(ctx,frame,{x,y,width:16,height:32,
    palette:ansiPalette,paintGlyph});
}
```

## State and time

- `set(id,state)` replaces a cell and cancels its existing timeline.
- `tween(id,next,{at,duration,wait,effect})` starts from the dominant current
  glyph. Duration defaults to300ms; wait defaults to0. Interrupted crossfades
  choose their dominant glyph rather than retain an unbounded layer history.
- `cycle(id,playlist,{at,interval,transition,effect,mode,duration,settle})`
  holds each frame for `interval-transition`, then changes to the next.
  Interval defaults to120ms, transition to90ms. Rates are clamped at admission.
  `once` ends at the last frame. `loop` repeats until replaced or unregistered;
  optional finite duration settles on `first` or `last` (default last).
  `choose-once` selects one stable seed/ID-derived frame and then stays still.
- `sample(id,time,{reducedMotion})` is a pure read for one cell, including
  historical reads. Time is a finite, nonnegative caller-clock millisecond.
- `changed(time,options)` requires monotonic time and returns only affected
  cells whose sampled result changed. A final settled frame is returned once.
- `unregister(id)` cancels the timeline and emits `{id,frame:null}` once so
  the compositor can clear that cell. `clear()` releases all tracking.

State accepts `glyph` (or terminal-compatible `char`), `fg`, `bg`, `alpha`,
`scaleX` and `scaleY`. A glyph is one printable Unicode scalar, including
CP437-style box/block equivalents. Colour is a palette index0..255 or a
literal canvas colour. The painter requires a matching palette for indices.
Null ink preserves the caller’s fill style. No CSS token lookup, HTML or
escape-sequence execution occurs inside the animation module.

## Effects and painting

`flip` turns a cell edge-on before showing its replacement. `fade` carries
two bounded layers. `dither` uses complementary ordered4×4 masks. `scan`
replaces the glyph behind a vertical reveal. `shrink-return` collapses both
axes and restores the replacement with a small return pulse. `scramble`
uses a seeded temporary glyph deck; it never consumes gameplay randomness.
`pulse` expands the replacement and settles exactly at its target scale.

Frames expose `glyph`, `char`, `glyphs`, colours, alpha and scale together
with at most two `layers`, progress, effect and settled/active flags.
Layers carry their own colour, scale and optional dither/scan clipping.
Reduced motion immediately returns a stable settled glyph, without cycling.
The caller may later resume motion on the same timeline.

`drawAnsiCell(ctx,frame,{x,y,width,height,paintGlyph,palette,clear})` preserves
the canvas state and clips everything to that cell. The required glyph
printer receives `(ctx,glyph,x,y,width,height)` so the same bitmap/font is
used for paragraphs, controls and animation. Clearing defaults to true;
pass false only when the caller already restored the cell background.
The helper does not choose a font, request sound or schedule another draw.

`node --test Tools/ChromaticBBS/ansi-animation.test.mjs` checks every effect,
playlist timing, seed stability, reduced motion, dirty/idle behaviour,
clipping and the8,000-cell admission boundary. Its timings describe this
small CPU utility, not native SDF rendering or a game-frame-rate guarantee.
