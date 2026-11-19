// Friktal HQ / first contact with the keeper — the story as a timeline.
//
// Everything here is a pure function of story time `t` (seconds):
// camera pose, which line is speaking, how much of it is typed. Rewind is
// therefore just a smaller t. There is no Continue gate, no tween that
// restarts from the current pose, and no second clock.

import {frikMindArt} from '../waters-of-time/ansi-frik-mind-art.mjs';

// ---------------------------------------------------------------------------
// Camera: one continuous log-zoom through nested gates.
//
// Inside scene k the camera zooms toward a FIXED point P_k chosen so that at
// local zoom Z_k = -log2(span) the view is exactly the gate square, which is
// exactly scene k+1 at zoom 0. Depth D is the sum of local zooms, so the
// whole dive is one monotone number.

export const sceneCount = 4; // keeper -> homeworld -> beneath the tide -> caldera
export const segments = frikMindArt.slice(0, sceneCount).map(({gate: [gx, gy, span]}, scene) => {
  const Z = -Math.log2(span);
  return {scene, Z, px: (gx - .5 * span) / (1 - span), py: (gy - .5 * span) / (1 - span)};
});
let acc = 0;
for (const s of segments) { s.from = acc; acc += s.Z; s.to = acc; }
export const maxDepth = acc;

export function depthShot(depth) {
  const D = Math.max(0, Math.min(maxDepth - 1e-6, depth));
  const s = segments.find(seg => D < seg.to) ?? segments.at(-1);
  const z = D - s.from, w = 2 ** -z;
  return {scene: s.scene, zoom: z, centerX: s.px + (.5 - s.px) * w, centerY: s.py + (.5 - s.py) * w};
}

// ---------------------------------------------------------------------------
// The script. Ghost speaks English (recorded clips). The keeper never does:
// its lines are DECODED captions over its own water-voice, per Writing.md.
// The keeper has two speech habits because it is two minds sharing a skull:
// HIVE counts, plural, blunt. WATERS remembers, singular, tidal.

const seg = k => segments[k];
export const beats = [
  {who: 'ghost', depth: [0, .35],
    text: 'Captain. The thing on the other ship is holding out a bowl of water. That is either diplomacy or soup. I am not ruling out soup.'},
  {who: 'hive', depth: [.35, .7],
    text: 'Water-bag. You lost your world. We counted the lights going out.'},
  {who: 'ghost', depth: [.7, 1.1],
    text: 'Sixty-one percent decode. The other thirty-nine is either grief or very specific swearing. I would bet my last checksum on both.'},
  {who: 'waters', depth: [1.1, 2.4],
    text: 'Not at me. Look in.'},
  {who: 'ghost', depth: [seg(1).from + .35, seg(1).from + .8], flight: 7,
    text: 'Oh. That is not an eye. That is a planet. Somebody keeps a whole world in a cornea, and I complain about a hundred and twenty-eight kilobyte program limit.'},
  {who: 'waters', depth: [seg(1).from + .8, seg(1).from + 1.5],
    text: 'Home. At low tide you walked to my sister’s door. At high tide she sent the bowl across on a string.'},
  {who: 'hive', depth: [seg(2).from + .4, seg(2).from + .8], flight: 4.5,
    text: 'A black satellite gave us plans for a gate. We built it. All of us. We were proud.'},
  {who: 'ghost', depth: [seg(2).from + .8, seg(2).from + 1.3],
    text: 'Captain… I have read those plans. Ours had the same rivets. We were proud too. Very proud. Ten centuries of proud.'},
  {who: 'waters', depth: [seg(2).from + 1.3, seg(2).from + 1.9],
    text: 'It opened. The lights on the coast went out, west to east. The bowl came back empty.'},
  {who: 'ghost', depth: [seg(3).from + .5, seg(3).from + 1.1], flight: 4.5,
    text: 'He is not showing us his world. He is showing us ours, about ninety years early. I would like a word with whoever schedules the foreshadowing.'},
  {who: 'waters', depth: [seg(3).from + 1.1, seg(3).from + 1.8],
    text: 'Bring your ship alongside mine. A million bowls are still knocking. Let us go and see who is inside.'},
  {who: 'ghost', depth: [seg(3).from + 1.8, seg(3).from + 2.7],
    text: 'That is an invitation, Captain. I am saying yes before my pride gets a vote.'},
];

export const speakers = {
  ghost: {label: 'FRIKEN.GHOST', ink: 'ghost'},
  hive: {label: 'FRIK KEEPER / HIVE · DECODED 61%', ink: 'hive'},
  waters: {label: 'FRIK KEEPER / WATERS · DECODED 74%', ink: 'waters'},
};

// Seconds a line holds the stage. Recorded clips own Ghost's timing; the
// keeper's decoded captions hold for comfortable reading plus a breath.
export function lineSeconds(beat, clips = {}) {
  if (beat.who === 'ghost') {
    const clip = clips[beatId(beat)];
    return clip ? clip.duration + .55 : beat.text.split(/\s+/).length / 2.55 + .7;
  }
  return beat.text.length / 15 + 1.6;
}
export const beatId = beat => `${beat.who}-${beats.indexOf(beat)}`;

// Build the timeline: [{beat, start, end, flightStart}] plus keyframes.
export function buildTimeline(clips = {}) {
  const lead = 1.6; // the scene settles in before anyone speaks
  let t = lead;
  const lines = [], keys = [[0, 0]];
  beats.forEach((beat, i) => {
    const flight = beat.flight ?? (i === 0 ? 0 : .35);
    const start = t + flight, end = start + lineSeconds(beat, clips);
    // Contiguous lines keep the camera moving; only a real gap adds a key.
    if (i === 0 || beat.depth[0] !== beats[i - 1].depth[1]) keys.push([start, beat.depth[0]]);
    keys.push([end, beat.depth[1]]);
    lines.push({beat, id: beatId(beat), start, end, flightStart: t});
    t = end;
  });
  const tail = 3.5;
  keys.push([t + tail, beats.at(-1).depth[1] + .35]);
  return {lines, keys: dedupe(keys), duration: t + tail};
}
const dedupe = keys => keys.filter((k, i) => i === 0 || k[0] > keys[i - 1][0] + 1e-6);

// Monotone cubic (Fritsch-Carlson): C1-continuous, never overshoots, so the
// camera can slow, hold and speed up but can never reverse.
export function monotoneCurve(keys) {
  const n = keys.length, x = keys.map(k => k[0]), y = keys.map(k => k[1]);
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  m[0] = 0; m[n - 1] = 0; // start and finish at rest
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const s = 3 / Math.sqrt(h); m[i] = s * a * d[i]; m[i + 1] = s * b * d[i]; }
  }
  return t => {
    if (t <= x[0]) return y[0];
    if (t >= x[n - 1]) return y[n - 1];
    let i = 0; while (t > x[i + 1]) i++;
    const h = x[i + 1] - x[i], s = (t - x[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}

// What is on screen at story time t.
export function storyAt(timeline, curve, t) {
  const line = timeline.lines.find(l => t >= l.start && t < l.end + .9) ?? null;
  let typed = 0;
  if (line) {
    const speak = line.end - line.start - (line.beat.who === 'ghost' ? .55 : 1.2);
    typed = Math.min(1, Math.max(0, (t - line.start) / Math.max(.5, speak)));
  }
  return {depth: curve(t), line, typed};
}
