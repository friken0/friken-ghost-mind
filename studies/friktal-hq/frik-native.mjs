// The Frik keeper, authored natively for ANSI++.
//
// No RGB painting is converted here. The scene is shapes + materials +
// light, and every sample answers with (material ramp, level) — the way an
// ANSI artist thinks in "teal, step 3". Cells are then solved from those
// readings by the ramp solver (one glyph, two inks, shades only between
// neighbouring steps of the same material).
//
// Canon (Moknon/StarDiver/Entities/Aliens/Frik): biped, long segmented
// hooked neck, huge lateral eye with a cabled lens, square buck teeth,
// heavy single claws, olive-to-yellow-green hide; bridge with luminous
// fluid pools and cyan deck veins.

// One palette, chosen for separation: violet void behind, olive/amber hide,
// cyan water as the light. Index 0 is shared black.
export const frikInks = [
  '#05040c', // 0 void
  '#170f3a', // 1 indigo deep
  '#2a1f66', // 2 indigo
  '#43369a', // 3 violet
  '#0e2a2a', // 4 bridge deep
  '#1b5a50', // 5 bridge teal
  '#2ea58c', // 6 vein cyan
  '#93f7e2', // 7 water light
  '#2a210c', // 8 hide shadow
  '#5b4b17', // 9 hide dark
  '#9b8a2a', // 10 hide olive
  '#d7c35a', // 11 hide light
  '#fff1ae', // 12 hide highlight
  '#ff6f24', // 13 amber
  '#ffcf6e', // 14 amber glow
  '#ffffff', // 15 specular
];
export const frikRamps = [
  [0, 1, 2, 3],          // 0 void / far bridge
  [0, 4, 5, 6, 7],       // 1 bridge metal + veins
  [0, 8, 9, 10, 11, 12], // 2 hide
  [8, 13, 14, 15],       // 3 eye amber
  [4, 5, 6, 7, 15],      // 4 water
];
const VOID = 0, METAL = 1, HIDE = 2, AMBER = 3, WATER = 4;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ellipse = (x, y, cx, cy, rx, ry) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
function segment(x, y, ax, ay, bx, by) {
  const px = x - ax, py = y - ay, dx = bx - ax, dy = by - ay;
  const h = clamp((px * dx + py * dy) / (dx * dx + dy * dy));
  return [Math.hypot(px - dx * h, py - dy * h), h];
}
const smin = (a, b, k) => { const h = clamp(.5 + .5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };

// The neck: a hooked chain of joints, rising from the shoulder and curling
// forward to the head. Returns distance and arc position for the rings.
const neckPts = [[.60, .80], [.66, .58], [.74, .40], [.83, .29], [.93, .25]];
function neck(x, y, t) {
  const sway = Math.sin(t * .7) * .012;
  let best = 1e9, arc = 0, run = 0;
  for (let i = 0; i < neckPts.length - 1; i++) {
    const [ax, ay] = neckPts[i], [bx, by] = neckPts[i + 1];
    const s1 = sway * i / 4, s2 = sway * (i + 1) / 4;
    const [d, h] = segment(x, y, ax + s1, ay, bx + s2, by);
    const r = .078 - .008 * (i + h);
    const len = Math.hypot(bx - ax, by - ay);
    if (d - r < best) { best = d - r; arc = run + h * len; }
    run += len;
  }
  return [best, arc];
}

// Signed distance of the whole keeper, plus which part won.
export function keeper(x, y, t) {
  const sway = Math.sin(t * .7) * .012;
  const body = ellipse(x, y, .58, 1.06, .36, .30);
  const [n, arc] = neck(x, y, t);
  const head = ellipse(x, y, 1.02 + sway, .27, .17, .13);
  const [sn] = segment(x, y, 1.08 + sway, .31, 1.20 + sway, .355);
  const snout = sn - .052;
  const [ar] = segment(x, y, .80, .86, 1.10, .80);
  const arm = ar - .046;
  const [cl] = segment(x, y, 1.10, .80, 1.17, .72);
  const claw = cl - .030 + .010 * clamp((y - .72) / .08);
  let d = smin(smin(body, n, .05), smin(head, snout, .03), .04);
  d = smin(d, arm, .03);
  d = Math.min(d, claw);
  return {d, arc, claw: claw <= d + 1e-4, head: Math.min(head, snout)};
}

// Light: the water in the bowl is the key light; a cold rim from the void.
const bowl = {x: 1.24, y: .84};

function hideLevel(x, y, t) {
  const e = .004, k = keeper(x, y, t);
  const nx = keeper(x + e, y, t).d - keeper(x - e, y, t).d;
  const ny = keeper(x, y + e, t).d - keeper(x, y - e, t).d;
  const nl = Math.hypot(nx, ny) || 1;
  // Curved-surface normal: flat towards the viewer inside, turning at edges.
  const edge = clamp(1 + k.d / .05);
  const sx = nx / nl * edge, sy = ny / nl * edge, sz = Math.sqrt(Math.max(0, 1 - sx * sx - sy * sy));
  const lx = bowl.x - x, ly = bowl.y - y, ll = Math.hypot(lx, ly, .35);
  const key = clamp((sx * lx + sy * ly + sz * .35) / ll);
  const fall = 1 / (1 + 2.2 * ll * ll);
  const rim = clamp(-sx * .8 - sy * .6) * edge;
  let level = .6 + 3.6 * key * fall + 1.1 * rim + .5 * sz;
  // Neck rings: segmented grooves along the arc, as a real hide pattern.
  if (k.d < 0 && !k.claw && y > .30) level -= .9 * Math.max(0, Math.cos(k.arc * 52)) ** 6;
  if (k.claw) level = Math.min(level, 2.4) - .4;
  return clamp(level, 0, 5);
}

// The eye: huge lateral eye in a cabled lens ring.
function eye(x, y, t) {
  const sway = Math.sin(t * .7) * .012;
  const cx = .995 + sway, cy = .235, r = Math.hypot((x - cx) / 1.0, (y - cy) / .9);
  const blink = Math.max(0, Math.sin(t * .45 + 1.3)) ** 400;
  if (Math.abs(y - cy) < .1 * blink && r < .12) return [HIDE, 2.2];
  if (r < .036) return [VOID, 0];
  if (r < .043) return [AMBER, 3];
  if (r < .086) {
    const a = Math.atan2(y - cy, x - cx);
    return [AMBER, 1.2 + .9 * (1 - r / .086) + .4 * Math.sin(a * 9 + t * .5)];
  }
  if (r < .095) return [VOID, 1];
  if (r < .115) return [METAL, 2.2 + 1.4 * clamp((cx + .05 - x) * 8)];
  return null;
}

// The bridge behind: ribs converging overhead, vein-lit deck, far violet.
function bridge(x, y, t) {
  if (y > .90) {
    const v = Math.abs(Math.sin((x - .8) / (y - .78) * 7));
    const pulse = .5 + .5 * Math.sin(t * 2 - x * 6);
    if (v < .10) return [METAL, 3 + pulse];
    return [METAL, .9 + (y - .9) * 6];
  }
  const vx = .78, vy = -.35, a = Math.atan2(y - vy, x - vx), r = Math.hypot(x - vx, y - vy);
  const rib = Math.abs(Math.sin(a * 13));
  if (rib < .16 && r > .55) return [METAL, 1.4 + 1.2 * (1 - rib / .16) * clamp((r - .55) * 2)];
  return [VOID, 1 + 1.6 * clamp(1 - y) * clamp(1 - Math.abs(x - .8))];
}

function bowlAt(x, y, t) {
  const top = ellipse(x, y, bowl.x, bowl.y - .035, .125, .026);
  if (top < 0) {
    const ripple = Math.sin(Math.hypot((x - bowl.x) / 1, (y - bowl.y + .035) * 4.5) * 90 - t * 3);
    return [WATER, 2.4 + .9 * ripple + 1.2 * clamp(-top / .02)];
  }
  const cup = ellipse(x, y, bowl.x, bowl.y - .03, .13, .085);
  if (cup < 0 && y > bowl.y - .035) return [METAL, 1.6 + 1.6 * clamp((bowl.x + .08 - x) * 5) * clamp((bowl.y + .05 - y) * 9)];
  return null;
}

// The whole frame: returns [ramp, level] for a point in scene units
// (x in [0, 1.6], y in [0, 1]).
export function frikScene(x, y, t) {
  const b = bowlAt(x, y, t); if (b) return b;
  const e = eye(x, y, t); if (e) return e;
  const k = keeper(x, y, t);
  // Buck teeth: two square incisors under the snout.
  const sway = Math.sin(t * .7) * .012;
  if (y > .385 && y < .43 && ((x > 1.15 + sway && x < 1.175 + sway) || (x > 1.18 + sway && x < 1.205 + sway))) return [HIDE, 5];
  if (k.d < 0) return [HIDE, hideLevel(x, y, t)];
  // Bowl light spills onto the bridge as a cyan pool.
  const glow = 1.6 / (1 + 160 * ((x - bowl.x) ** 2 + 2 * (y - bowl.y) ** 2));
  const [ramp, level] = bridge(x, y, t);
  if (glow > .45 && ramp === VOID) return [METAL, Math.min(3.4, 1 + glow * 1.6)];
  return [ramp, Math.min(frikRamps[ramp].length - 1, level + (ramp === METAL ? glow : 0))];
}

// Authored glyph marks: the detail an artist types on top of the blocks.
export function frikMarks(t) {
  const marks = [];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4 + t * .8;
    marks.push({x: bowl.x + Math.cos(a) * .09, y: bowl.y - .035 + Math.sin(a) * .016, ch: i % 2 ? '·' : '∙', ink: 7, alpha: .6 + .4 * Math.sin(t * 3 + i)});
  }
  marks.push({x: .975, y: .205, ch: '■', ink: 15, alpha: .9});
  return marks;
}
