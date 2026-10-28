# ANSI skirmish / glyph bodies, real consequences

1. Purpose: an optional post-connection spectacle with inspectable physics.
2. Zone: the existing reply stage; the host owns placement and input.
3. Context: a local toy, separate from campaign canon and roll arithmetic.
4. Owner: one character canvas, one caller clock, fixed120Hz simulation.
5. Controls: the host may expose Start, Pause and Reset through SDUI.press.
6. Grouping: one compact arena, not another menu or settings workbench.
7. Primary action: Start skirmish; no automatic connection activation.
8. States: ready, running, held, won and settled.
9. Readouts: actual Blue/Red HP, living troops, damage score and live counts.
10. Bounds:4actors,48projectiles,128fragments; no timer, RAF or audio owner.

`ansi-skirmish.mjs` exposes a pure deterministic state machine and its optional
GhostVGA canvas host. The body is assembled from individual block glyphs in
named head, chest, arm, hand, hip and leg parts. A swept projectile transforms
into each part's rotated local frame and tests occupied glyph pixels, rather
than testing the empty rectangle around the whole character. The canonical
block masks are mathematical8x16 CP437 geometry; the browser extracts the
retained font's actual alpha masks after the font loads.

Hits remove occupied pixels, damage the struck part and apply momentum.
An exhausted limb joint releases its descendant chain. A chest/head death
releases the remaining body as a jointed ragdoll. Gravity, angular momentum,
wall/floor bounce, friction and joint constraints continue after death.
Detached parts and fragments must settle before their fade timer starts.
The fragment budget refuses new fragments when full rather than vanishing
an existing moving body to make space.

The pea shooter uses a fast dot, the heavy gun a slower damaging round, and
grenades arc, bounce and detonate with distance-based impulse and damage.
Teams have visible coloured glyphs and an exact HUD. The event callback emits
semantic fire/impact/detach/death/explosion notices for the existing audio
owner; this component creates no oscillator, music source or audio context.

```js
import {mountAnsiSkirmish} from './ansi-skirmish.mjs';
const arena=mountAnsiSkirmish(existingStage,{seed:'surreal-713',
  onEvent:event=>existingSoundOwner(event)});
await arena.ready;
arena.start();
// The application's existing clock, seconds; never another RAF:
arena.update(elapsedSeconds);
arena.pause(true);
arena.pause(false);
arena.reset('another-seed');
arena.destroy();
```

The renderer fits the arena with one uniform scale and letterboxes excess
space. It never stretches8x16 cells to the host's aspect ratio. Canvas ink
is clipped per glyph, including rotated parts, so descenders leave no trails.
The host can hide the canvas during Ghost's speaking overlay and should pause
it on hiding. Importing the module starts nothing. A supplied receipt may
label context only; it cannot turn this autonomous battle into evidence that
a numeric causality roll succeeded. A real roll resolver keeps its own exact
arithmetic and immutable receipt.
