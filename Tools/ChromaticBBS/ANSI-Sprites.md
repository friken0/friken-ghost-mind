# ANSI sprite layer

`ansi-sprites.mjs` adds original glyph creatures and small animations to the
existing response viewport. It uses the same GhostVGA font and 16-colour ANSI
palette as the terminal. Frames are character cells, not raster pictures.

**Mount only after the modem connection has completed and the reply handoff
has occurred.** This module has no automatic global activation. Importing it
does not create a canvas, load a font, fetch an asset, start audio, or schedule
a timer. The caller explicitly mounts and supplies its existing clock.

```js
import {mountAnsiSprites,ansiSpritePresets} from './ansi-sprites.mjs';

// In the existing post-connection handoff, never inside the modem sequence:
const sprites=mountAnsiSprites(stage,{
  columns:200,rows:60,cellWidth:8,cellHeight:16,maxFps:30
});
await sprites.ready;
sprites.add('packet-moth',{
  ...ansiSpritePresets.packetMoth,x:30,y:12,scale:2,alpha:.6
});

// Existing application animation callback; do not add another RAF.
sprites.set('packet-moth',{x:30+Math.sin(elapsedSeconds)*3});
sprites.update(elapsedSeconds);

sprites.remove('packet-moth');
sprites.update(elapsedSeconds); // clears its previous pixels
// When leaving the response:
sprites.destroy();
```

Time is monotonic **seconds**. The separate per-character choreography module
uses milliseconds; do not pass its clock units to this API. `update` accepts
`{reducedMotion:true}` to hold a settled first/paused frame. Movement is entirely
caller-controlled and should also respect the app's reduced-motion setting.

## Recipes and state

`add(id,spec)` admits or replaces one complete recipe. It returns the layer for
chaining. `frames` contains 1–16 multiline strings or cell-descriptor frames:

```js
sprites.add('signal',{
  frames:[
    [{x:0,y:0,glyph:'░',fg:6},{x:1,y:0,glyph:'◈',fg:14}],
    [{x:0,y:0,glyph:'▓',fg:14},{x:1,y:0,glyph:'◈',fg:11}]
  ],
  fps:8,mode:'once',x:10,y:4,scale:1,alpha:1,z:0
});
```

Descriptor frames can also be `{cells:[...],columns,rows}`. Cells accept one
printable Unicode `glyph` (or `char`), `fg`, and `bg`. Colours are a literal
canvas colour or an index in the recipe's `palette`; null is transparent.
Unpainted spaces in a multiline string remain transparent unless `bg` is set.
Escape sequences are rejected rather than executed. Recipe defaults are cyan
foreground, transparent background, 8 frames/s, loop mode, and scale/alpha 1.

`mode:'loop'` repeats. `mode:'once'` holds the final frame. `loop:false` is an
alias for once. Optional `duration` caps either sequence in seconds and then
holds its final frame. `fps:0` holds its first frame.

`set(id,state)` changes `x`, `y` (cell coordinates), `scale`, `alpha`, `visible`,
`z`, `playing`, `frame`, or `palette`. Patches are atomic. `playing:false` holds
the currently selected frame; true resumes from it. `frame:n` manually holds
one frame; `frame:null` returns control to the clock. Replace a complete recipe
with `add` to reroll its frames or timing. Higher `z` draws above lower `z`;
equal layers keep their original insertion order.

`remove(id)` returns whether a sprite existed. `clear()` removes all recipes;
the next `update` clears their pixels. `destroy()` removes the canvas and
releases all recipes immediately. The layer exposes `canvas`, `ready`, and
`size`. Update returns `{painted,cells,rects}` for diagnostic counters.

## Cost and ownership

Admission is bounded to 32 sprites and 8,000 occupied bounding-grid cells in
total. One frame is at most 128×64 and 2,048 cells; one recipe has at most
16 frames. Scale is 0.125–8. The compositor rate is at most 30 Hz, and a faster
recipe rate is capped at admission. The logical canvas is at most 4096×4096
pixels. Smaller `maxSprites` and `maxCells` budgets can be supplied by the host.

Only changed sprite bounds are cleared. Overlapping dirty rectangles are
merged, and intersecting layers are redrawn in stable order so moving a moth
does not erase another glyph. An unchanged or hidden scene performs no canvas
painting. There is no DOM glyph scan, network fetch, audio owner, observer,
timer, or render loop in this layer. A pointer-transparent canvas leaves the
application's actual controls and accessibility tree in charge of interaction.

`createAnsiSpriteScene(options)` exposes the same recipe/state operations as
a pure utility, plus `get(id,time,options)`, `update`, `invalidate`, `cells`, and
`dimensions`. Its snapshots and frame data are immutable. Tests cover finite
timelines, frame-rate limits, atomic admission, overlap restoration, manual
frames, reduced motion, exact glyph coordinates, idle work, and lifecycle.

The included `packetMoth`, `orbitWisp`, and `cursorCritter` presets are original
tiny glyph animations. They do not claim alien-race canon or borrow game art.
