// ANSI++ cell solver: turn any sampled field into true ANSI cells.
//
// Each cell receives 2x4 colour samples (column-major halves, four rows),
// the same footprint as an 8x16 VGA cell split into its block quadrants and
// shade bands. The solver picks ONE glyph from the block / quadrant / shade
// set and ONE foreground + background ink from a bounded palette, minimising
// error the way an ANSI artist reads a cell: silhouette first, then ramp.
// Output is never a pixel image: a cell can only ever hold two inks and one
// glyph, at every zoom and every pass.

// Coverage masks over the 2x4 sample footprint, index = row*2 + column.
const half = (rows, cols) => {
  const m = new Float32Array(8);
  for (const r of rows) for (const c of cols) m[r * 2 + c] = 1;
  return m;
};
const flat = a => new Float32Array(8).fill(a);
export const cellGlyphs = Object.freeze([
  {char: ' ', mask: flat(0), kind: 'solid'},
  {char: '█', mask: flat(1), kind: 'solid'},
  {char: '▀', mask: half([0, 1], [0, 1]), kind: 'half'},
  {char: '▄', mask: half([2, 3], [0, 1]), kind: 'half'},
  {char: '▌', mask: half([0, 1, 2, 3], [0]), kind: 'half'},
  {char: '▐', mask: half([0, 1, 2, 3], [1]), kind: 'half'},
  {char: '▘', mask: half([0, 1], [0]), kind: 'quad'},
  {char: '▝', mask: half([0, 1], [1]), kind: 'quad'},
  {char: '▖', mask: half([2, 3], [0]), kind: 'quad'},
  {char: '▗', mask: half([2, 3], [1]), kind: 'quad'},
  {char: '▚', mask: (() => { const m = half([0, 1], [0]); m[5] = m[7] = 1; return m; })(), kind: 'quad'},
  {char: '▞', mask: (() => { const m = half([0, 1], [1]); m[4] = m[6] = 1; return m; })(), kind: 'quad'},
  {char: '▛', mask: (() => { const m = flat(1); m[5] = m[7] = 0; return m; })(), kind: 'quad'},
  {char: '▜', mask: (() => { const m = flat(1); m[4] = m[6] = 0; return m; })(), kind: 'quad'},
  {char: '▙', mask: (() => { const m = flat(1); m[1] = m[3] = 0; return m; })(), kind: 'quad'},
  {char: '▟', mask: (() => { const m = flat(1); m[0] = m[2] = 0; return m; })(), kind: 'quad'},
  {char: '░', mask: flat(.25), kind: 'shade'},
  {char: '▒', mask: flat(.5), kind: 'shade'},
  {char: '▓', mask: flat(.75), kind: 'shade'},
]);

export const hexInk = hex => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const inkHex = ([r, g, b]) =>
  '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

// Perceptual-ish distance (redmean). Cheap and good enough for 16 inks.
function distance(r1, g1, b1, r2, g2, b2) {
  const rm = (r1 + r2) * .5, dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

// Fit a scene palette from samples (k-means, deterministic seeding by
// luminance quantiles). XBin files carried their own 16-ink palettes; so do
// ANSI++ scenes. `fixed` inks (e.g. black) are kept and never moved.
export function fitCellPalette(samples, count = 16, {fixed = ['#000000'], iterations = 12} = {}) {
  const n = samples.length / 3, lum = i => samples[i * 3] * .3 + samples[i * 3 + 1] * .59 + samples[i * 3 + 2] * .11;
  const order = Array.from({length: n}, (_, i) => i).sort((a, b) => lum(a) - lum(b));
  const free = count - fixed.length;
  let centres = Array.from({length: free}, (_, k) => {
    const i = order[Math.floor((k + .5) / free * n)];
    return [samples[i * 3], samples[i * 3 + 1], samples[i * 3 + 2]];
  });
  const pinned = fixed.map(hexInk);
  for (let it = 0; it < iterations; it++) {
    const sum = centres.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const r = samples[i * 3], g = samples[i * 3 + 1], b = samples[i * 3 + 2];
      let best = -1, bestD = Infinity;
      for (const p of pinned) { const d = distance(r, g, b, ...p); if (d < bestD) { bestD = d; best = -1; } }
      for (let k = 0; k < centres.length; k++) {
        const c = centres[k], d = distance(r, g, b, c[0], c[1], c[2]);
        if (d < bestD) { bestD = d; best = k; }
      }
      if (best >= 0) { const s = sum[best]; s[0] += r; s[1] += g; s[2] += b; s[3]++; }
    }
    centres = centres.map((c, k) => sum[k][3] ? sum[k].slice(0, 3).map(v => v / sum[k][3]) : c);
  }
  const inks = [...pinned, ...centres.map(c => c.map(v => Math.round(v)))];
  inks.sort((a, b) => (a[0] * .3 + a[1] * .59 + a[2] * .11) - (b[0] * .3 + b[1] * .59 + b[2] * .11));
  return inks.map(inkHex);
}

// Style weights: how strongly an artist avoids each glyph family. Pure
// ACiD-era work leans on halves and shades; quadrants are a later luxury.
export const cellStyles = Object.freeze({
  acid: {half: 0, quad: 1.6, shade: .35, quadAllowed: false, shades: true, stepRange: .9},
  xbin: {half: 0, quad: .55, shade: .25, quadAllowed: true, shades: true, stepRange: .8},
  plus: {half: 0, quad: .4, shade: .2, quadAllowed: true, shades: true, stepRange: .7},
});

// Solve one cell. `s` is 24 numbers: 8 samples x RGB.
export function solveCell(s, inks, style = cellStyles.plus, out = {}) {
  // Candidate inks: nearest palette entry for each sample, plus the cell
  // mean's two nearest. An artist never reaches for an ink the cell lacks.
  const cand = [];
  const near = (r, g, b, skip = -1) => {
    let best = 0, bestD = Infinity;
    for (let k = 0; k < inks.length; k++) {
      if (k === skip) continue;
      const d = distance(r, g, b, inks[k][0], inks[k][1], inks[k][2]);
      if (d < bestD) { bestD = d; best = k; }
    }
    return best;
  };
  let mr = 0, mg = 0, mb = 0;
  for (let i = 0; i < 8; i++) {
    const r = s[i * 3], g = s[i * 3 + 1], b = s[i * 3 + 2];
    mr += r; mg += g; mb += b;
    const k = near(r, g, b);
    if (!cand.includes(k)) cand.push(k);
  }
  mr /= 8; mg /= 8; mb /= 8;
  const m1 = near(mr, mg, mb);
  if (!cand.includes(m1)) cand.push(m1);
  const m2 = near(mr, mg, mb, m1);
  if (!cand.includes(m2)) cand.push(m2);
  if (cand.length > 6) cand.length = 6;

  // Error is normalised by cell contrast so the family penalties read as
  // "how much detail would this glyph have to explain" on any value range.
  let bestE = Infinity, bestG = 0, bestF = cand[0], bestB = cand[0];
  for (let fi = 0; fi < cand.length; fi++) for (let bi = 0; bi < cand.length; bi++) {
    const f = inks[cand[fi]], b = inks[cand[bi]];
    for (let gi = 0; gi < cellGlyphs.length; gi++) {
      const g = cellGlyphs[gi];
      if (fi === bi && gi > 1) continue;
      if (g.kind === 'quad' && !style.quadAllowed) continue;
      let e = 0;
      for (let i = 0; i < 8; i++) {
        const a = g.mask[i];
        e += distance(s[i * 3], s[i * 3 + 1], s[i * 3 + 2],
          b[0] + (f[0] - b[0]) * a, b[1] + (f[1] - b[1]) * a, b[2] + (f[2] - b[2]) * a);
      }
      // Penalty scaled by the ink pair's own distance: a shade between two
      // near inks is cheap ramp work, between far inks it is mud.
      const pair = fi === bi ? 0 : distance(f[0], f[1], f[2], b[0], b[1], b[2]);
      e += (style[g.kind] || 0) * pair * (g.kind === 'shade' ? .5 : 1);
      if (e < bestE) { bestE = e; bestG = gi; bestF = cand[fi]; bestB = cand[bi]; }
    }
  }
  const g = cellGlyphs[bestG];
  out.char = g.char;
  // A space shows only its background; a full block only its foreground.
  out.fg = g.char === ' ' ? bestB : bestF;
  out.bg = g.char === '█' ? bestF : bestB;
  if (g.char === '█') { out.char = ' '; out.bg = bestF; }
  out.error = bestE / 8;
  return out;
}

// Solve a whole grid. `sample(u, v)` returns [r,g,b] (0..255) for a point in
// the viewport's unit square. Returns {columns, rows, chars, fg, bg, error}.
export function solveCellGrid(sample, columns, rows, inks, style = cellStyles.plus, previous) {
  const n = columns * rows;
  const grid = previous && previous.columns === columns && previous.rows === rows ? previous : {
    columns, rows, chars: new Array(n), fg: new Uint8Array(n), bg: new Uint8Array(n), error: new Float32Array(n),
  };
  const s = new Float32Array(24), cell = {};
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    for (let i = 0; i < 8; i++) {
      const c = sample((x + ((i & 1) + .5) / 2) / columns, (y + ((i >> 1) + .5) / 4) / rows);
      s[i * 3] = c[0]; s[i * 3 + 1] = c[1]; s[i * 3 + 2] = c[2];
    }
    solveCell(s, inks, style, cell);
    const k = y * columns + x;
    grid.chars[k] = cell.char; grid.fg[k] = cell.fg; grid.bg[k] = cell.bg; grid.error[k] = cell.error;
  }
  return grid;
}

// ---------------------------------------------------------------------------
// Ramp solver: how an ANSI artist actually shades.
//
// A palette is organised into material RAMPS (dark -> light ink indices).
// Every sample is read as (ramp, continuous level). A cell whose samples sit
// on one ramp with a small level range becomes a ramp STEP: a solid ink, or
// ░ ▒ ▓ between two NEIGHBOURING inks of that ramp. Anything else becomes a
// SILHOUETTE: the best half/quadrant block, each side snapped to a solid ink.
// Shades therefore only ever appear inside a gradient between adjacent inks,
// never as noise over a flat area or across unrelated colours.

const srgbLin = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
// Approximate OKLab: perceptual lightness plus an a/b chroma plane.
export function inkLab(r, g, b) {
  const R = srgbLin(r), G = srgbLin(g), B = srgbLin(b);
  const l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * B);
  const m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * B);
  const s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * B);
  return [.2104542553 * l + .793617785 * m - .0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + .4505937099 * s,
    .0259040371 * l + .7827717662 * m - .808675766 * s];
}

// Build a ramp model from inks + ramp lists. Each ramp gets a chroma
// signature (its most saturated ink) and its inks' lightness for levels.
export function rampModel(inksHex, ramps) {
  const inks = inksHex.map(hexInk), lab = inks.map(c => inkLab(...c));
  const list = ramps.map(ids => {
    const sat = ids.reduce((best, id) => Math.hypot(lab[id][1], lab[id][2]) > Math.hypot(lab[best][1], lab[best][2]) ? id : best, ids[0]);
    const chroma = Math.hypot(lab[sat][1], lab[sat][2]);
    return {ids, L: ids.map(id => lab[id][0]), a: lab[sat][1], b: lab[sat][2], chroma};
  });
  return {inks, inksHex, lab, ramps: list};
}

// Read one colour as (ramp, level). `grade` is the artist's value curve:
// contrast around mid-grey and a lift, applied to lightness only.
export function readRamp(model, r, g, b, grade = {contrast: 1.25, lift: 0}) {
  const [L0, A, B] = inkLab(r, g, b);
  let L = (L0 - .5) * grade.contrast + .5 + grade.lift;
  const c = Math.hypot(A, B);
  let best = 0, bestD = Infinity;
  for (let k = 0; k < model.ramps.length; k++) {
    const rp = model.ramps[k];
    // Chroma distance, with greys pulled to the least saturated ramp.
    // An artist exaggerates hue: any colour with a readable cast joins the
    // ramp whose hue it leans toward; only true neutrals stay grey.
    const ha = Math.atan2(B, A), ra = Math.atan2(rp.b, rp.a);
    const hueGap = Math.abs(Math.atan2(Math.sin(ha - ra), Math.cos(ha - ra)));
    const d = rp.chroma < .02 ? (c < (grade.neutral ?? .012) ? 0 : .6 + c) : c < (grade.neutral ?? .012) ? 2 : hueGap;
    if (d < bestD) { bestD = d; best = k; }
  }
  const Ls = model.ramps[best].L;
  let level;
  if (L <= Ls[0]) level = 0;
  else if (L >= Ls[Ls.length - 1]) level = Ls.length - 1;
  else { let i = 0; while (L > Ls[i + 1]) i++; level = i + (L - Ls[i]) / Math.max(1e-6, Ls[i + 1] - Ls[i]); }
  return [best, level];
}

const blockChoices = cellGlyphs.filter(g => g.kind === 'half' || g.kind === 'quad');

// Solve one cell from 8 (ramp, level) readings.
export function solveRampCell(ramp, level, model, style = cellStyles.plus, out = {}) {
  const count = new Map();
  for (let i = 0; i < 8; i++) count.set(ramp[i], (count.get(ramp[i]) || 0) + 1);
  const families = [...count.entries()].sort((a, b) => b[1] - a[1]);
  const R = families[0][0], ids = model.ramps[R].ids;
  let lo = Infinity, hi = -Infinity, sum = 0;
  for (let i = 0; i < 8; i++) if (ramp[i] === R) { lo = Math.min(lo, level[i]); hi = Math.max(hi, level[i]); sum += level[i]; }
  const single = families.length === 1 || families[1][1] <= 1;
  if (single && hi - lo < (style.stepRange ?? .9)) {
    const m = sum / families[0][1], a = Math.min(ids.length - 1, Math.floor(m)), f = m - a;
    if (a >= ids.length - 1 || f < .2) { out.char = ' '; out.fg = out.bg = ids[a]; return out; }
    if (f >= .8 || !style.shades) { const k = f >= .5 ? a + 1 : a; out.char = ' '; out.fg = out.bg = ids[k]; return out; }
    const step = f < .4 ? '░' : f < .6 ? '▒' : '▓';
    out.char = step; out.fg = ids[a + 1]; out.bg = ids[a]; return out;
  }
  // Silhouette: split samples into a "fore" set and pick the block glyph
  // whose mask agrees most; each side snaps to a solid ink.
  const key = new Float32Array(8);
  if (single) { const mid = (lo + hi) / 2; for (let i = 0; i < 8; i++) key[i] = level[i] > mid ? 1 : 0; }
  else { const F = families[1][0]; for (let i = 0; i < 8; i++) key[i] = ramp[i] === F ? 1 : 0; }
  let best = blockChoices[0], bestScore = -Infinity;
  for (const g of blockChoices) {
    if (g.kind === 'quad' && !style.quadAllowed) continue;
    let score = 0;
    for (let i = 0; i < 8; i++) score += g.mask[i] === key[i] ? 1 : -1;
    score -= g.kind === 'quad' ? style.quad * 2 : 0;
    if (score > bestScore) { bestScore = score; best = g; }
  }
  const side = want => {
    const tally = new Map();
    for (let i = 0; i < 8; i++) if (best.mask[i] === want) {
      const ink = model.ramps[ramp[i]].ids[Math.max(0, Math.min(model.ramps[ramp[i]].ids.length - 1, Math.round(level[i])))];
      tally.set(ink, (tally.get(ink) || 0) + 1);
    }
    return [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const fg = side(1), bg = side(0);
  if (fg == null || bg == null || fg === bg) { out.char = ' '; out.fg = out.bg = fg ?? bg; return out; }
  out.char = best.char; out.fg = fg; out.bg = bg; return out;
}

// Solve a grid with the ramp model. Reuses `previous` storage when shaped.
export function solveRampGrid(sample, columns, rows, model, style = cellStyles.plus, grade, previous) {
  const n = columns * rows;
  const grid = previous && previous.columns === columns && previous.rows === rows ? previous : {
    columns, rows, chars: new Array(n), fg: new Uint8Array(n), bg: new Uint8Array(n),
  };
  const ramp = new Int8Array(8), level = new Float32Array(8), cell = {};
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    for (let i = 0; i < 8; i++) {
      const c = sample((x + ((i & 1) + .5) / 2) / columns, (y + ((i >> 1) + .5) / 4) / rows);
      const [rp, lv] = readRamp(model, c[0], c[1], c[2], grade);
      ramp[i] = rp; level[i] = lv;
    }
    solveRampCell(ramp, level, model, style, cell);
    const k = y * columns + x;
    grid.chars[k] = cell.char; grid.fg[k] = cell.fg; grid.bg[k] = cell.bg;
  }
  return grid;
}

// Fit a ramped scene palette: split the scene's colours into hue families
// by chroma, then give each family lightness steps from shadow to light.
// Black is shared by every ramp so shadows stay one ink, as in real ANSI.
export function fitRampPalette(samples, {families = 4, steps = 4, black = '#000000', iterations = 10, saturate = 1.35} = {}) {
  const n = samples.length / 3, labs = [];
  for (let i = 0; i < n; i++) labs.push(inkLab(samples[i * 3], samples[i * 3 + 1], samples[i * 3 + 2]));
  // k-means on hue angle (a,b normalised) weighted by chroma.
  const ang = labs.map(([, a, b]) => Math.atan2(b, a)), chroma = labs.map(([, a, b]) => Math.hypot(a, b));
  const greyCut = .03;
  let centres = Array.from({length: families - 1}, (_, k) => -Math.PI + (k + .5) * 2 * Math.PI / (families - 1));
  const assign = new Int8Array(n);
  for (let it = 0; it < iterations; it++) {
    const sx = new Float64Array(families - 1), sy = new Float64Array(families - 1), w = new Float64Array(families - 1);
    for (let i = 0; i < n; i++) {
      if (chroma[i] < greyCut) { assign[i] = families - 1; continue; }
      let best = 0, bestD = Infinity;
      for (let k = 0; k < centres.length; k++) { const d = Math.abs(Math.atan2(Math.sin(ang[i] - centres[k]), Math.cos(ang[i] - centres[k]))); if (d < bestD) { bestD = d; best = k; } }
      assign[i] = best; sx[best] += Math.cos(ang[i]) * chroma[i]; sy[best] += Math.sin(ang[i]) * chroma[i]; w[best] += chroma[i];
    }
    centres = centres.map((c, k) => w[k] ? Math.atan2(sy[k], sx[k]) : c);
  }
  const inks = [black], ramps = [];
  for (let k = 0; k < families; k++) {
    const members = [];
    for (let i = 0; i < n; i++) if (assign[i] === k) members.push(i);
    if (members.length < n * .01) continue;
    members.sort((a, b) => labs[a][0] - labs[b][0]);
    const ids = [0];
    for (let s = 0; s < steps; s++) {
      // Quantile band per step, coloured by the band's mean (keeps hue honest).
      const from = Math.floor((s + .15) / steps * members.length), to = Math.max(from + 1, Math.floor((s + .85) / steps * members.length));
      let r = 0, g = 0, b = 0;
      for (let j = from; j < to; j++) { const i = members[j]; r += samples[i * 3]; g += samples[i * 3 + 1]; b += samples[i * 3 + 2]; }
      const c = to - from, boost = s === steps - 1 ? 1.15 : 1;
      // Artist's ink: push saturation away from the band's grey.
      const mean = [r / c, g / c, b / c], grey = (mean[0] + mean[1] + mean[2]) / 3;
      inks.push(inkHex(mean.map(v => Math.max(0, Math.min(255, Math.round((grey + (v - grey) * saturate) * boost))))));
      ids.push(inks.length - 1);
    }
    ramps.push(ids);
  }
  return {inks, ramps};
}

// Classic VGA ramps an ANSI artist reaches for. Indices into vgaInks.
export const vgaRamps = Object.freeze([
  [0, 8, 7, 15],        // steel / grey
  [0, 4, 6, 14, 15],    // water: blue -> cyan -> bright cyan -> white
  [0, 3, 11, 15],       // skin / brass: brown -> yellow -> white
  [0, 2, 10, 15],       // moss
  [0, 1, 9, 15],        // ember
  [0, 5, 13, 15],       // violet
  [0, 4, 12, 15],       // night blue
]);

// The sixteen stock VGA inks, for strict ACiD-era output.
export const vgaInks = Object.freeze(['#000000', '#aa0000', '#00aa00', '#aa5500', '#0000aa', '#aa00aa', '#00aaaa', '#aaaaaa',
  '#555555', '#ff5555', '#55ff55', '#ffff55', '#5555ff', '#ff55ff', '#55ffff', '#ffffff']);

// ---------------------------------------------------------------------------
// ANSI++ passes: error-driven glyph refinement.
//
// Pass 1 is a chunky world-anchored cell grid. Each later pass splits ONLY
// the cells whose two inks cannot hold their art (high residual: an eye, a
// claw, a rim light, a material edge) into 2x2 child cells, each of which is
// again a true ANSI cell: one glyph, two inks. Flats stay chunky; detail
// becomes finer glyph work. A pass never goes below `minCell` world size,
// so the output can never converge to the source raster.

function cellResidual(samples, cell, model) {
  const g = cellGlyphs.find(c => c.char === cell.char) ?? cellGlyphs[0];
  const f = model.inks[cell.fg], b = model.inks[cell.bg];
  let e = 0;
  for (let i = 0; i < 8; i++) {
    const a = cell.char === ' ' ? 0 : g.mask[i];
    e += distance(samples[i * 3], samples[i * 3 + 1], samples[i * 3 + 2],
      b[0] + (f[0] - b[0]) * a, b[1] + (f[1] - b[1]) * a, b[2] + (f[2] - b[2]) * a);
  }
  return e / 8 / (9 * 65025);
}

export function solveRampPasses(sampleWorld, region, model, style = cellStyles.plus, grade, options = {}) {
  const {passes = 6, minCell = 0, threshold = .0035, growth = 1.45, budget = 60000} = options;
  const {x0, y0, cw, ch, columns, rows} = region;
  const leaves = [], s = new Float32Array(24), ramp = new Int8Array(8), level = new Float32Array(8);
  let sampled = 0;
  const solve = (x, y, w, h, pass) => {
    for (let i = 0; i < 8; i++) {
      const c = sampleWorld(x + ((i & 1) + .5) / 2 * w, y + ((i >> 1) + .5) / 4 * h);
      s[i * 3] = c[0]; s[i * 3 + 1] = c[1]; s[i * 3 + 2] = c[2];
      const [rp, lv] = readRamp(model, c[0], c[1], c[2], grade);
      ramp[i] = rp; level[i] = lv;
    }
    sampled += 8;
    const cell = solveRampCell(ramp, level, model, style, {});
    cell.x = x; cell.y = y; cell.w = w; cell.h = h; cell.pass = pass;
    cell.error = cellResidual(s, cell, model);
    return cell;
  };
  let frontier = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++)
    frontier.push(solve(x0 + i * cw, y0 + j * ch, cw, ch, 1));
  for (let pass = 2; pass <= passes; pass++) {
    const limit = threshold * growth ** (pass - 2), next = [];
    for (const cell of frontier) {
      const w = cell.w / 2, h = cell.h / 2;
      if (cell.error < limit || w < minCell || sampled > budget) { leaves.push(cell); continue; }
      for (let q = 0; q < 4; q++) next.push(solve(cell.x + (q & 1) * w, cell.y + (q >> 1) * h, w, h, pass));
    }
    frontier = next;
    if (!frontier.length) break;
  }
  leaves.push(...frontier);
  return {leaves, sampled};
}
