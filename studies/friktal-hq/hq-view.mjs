// Friktal HQ / first contact — ANSI++ style sign-off study.
//
// One clock (story time t), one camera (a pure function of t), one renderer
// (the existing ANSI++ multipass engine in ../waters-of-time/ansi-fractal.mjs,
// fed real art instead of the black plate the Lancing study used).
// Ghost's recorded voice owns time while it plays. No Continue gate.

import {mountNativeResponseHost} from '../waters-of-time/native-response-host.mjs';
import {boardTerminalPage, boardTerminalGrid, mountAnsiTerminal} from '../waters-of-time/ansi-terminal.mjs?v=terminal-score-1';
import {ansiSceneProgram} from '../waters-of-time/ansi-scenes.mjs';
import {mountAnsiFractal} from '../waters-of-time/ansi-fractal.mjs?v=brood-1';
import {packAnsiInk, packAnsiGlyph, shadeAnsiWord} from '../waters-of-time/ansi-animation.mjs?v=surface-light-3';
import {ansiColourTheme} from '../waters-of-time/ansi-terminal.mjs?v=terminal-score-1';
import {createFrikMindInk} from '../waters-of-time/ansi-frik-mind.mjs?v=nursery-stance-1';
import {inkLab} from '../../Tools/ChromaticBBS/ansi-cellsolve.mjs';
import {beats, speakers, buildTimeline, monotoneCurve, storyAt, depthShot, segments} from './story.mjs';

// ---------------------------------------------------------------------------
// The three looks under review. Same art, same story, same engine.
export const styles = [
  {id: 'acid', key: '1', label: 'ACiD 80', width: 40, height: 22, passes: 2, theme: 'ansi',
    glyphs: false, animated: false, bps: 9600,
    note: 'Stock 16 VGA inks, two passes. 1994 straight off the board.'},
  {id: 'xbin', key: '2', label: 'XBIN ICE', width: 56, height: 31, passes: 2, theme: 'ice',
    glyphs: true, animated: false, bps: 19200,
    note: 'iCE inks, three passes, contour glyphs stacked over the blocks.'},
  {id: 'plus', key: '3', label: 'ANSI++', width: 56, height: 31, passes: 3, theme: 'ice',
    glyphs: true, animated: true, bps: 28800,
    note: 'Four passes streamed at baud, glyph prints, palette cycling, light.'},
];
const params = new URLSearchParams(location.search);
let style = styles.find(s => s.id === params.get('style')) ?? styles[2];

// ---------------------------------------------------------------------------
// Palette-true sampling: every art sample becomes a packed ANSI ink (one of
// 16 theme colours x 16 dim levels), never raw RGB. A 32^3 lookup keeps it
// cheap enough to resample the whole pass ladder.
const artwork = createFrikMindInk();
let lut = null, lutTheme = '';
function inkTable(theme) {
  if (lutTheme === theme) return lut;
  const colours = ansiColourTheme(theme).colours.map(h => {
    const n = parseInt(h.slice(1), 16);
    return (0xff000000 | ((n & 255) << 16) | (n & 65280) | (n >>> 16)) >>> 0;
  });
  const cand = [];
  colours.forEach((word, c) => { for (let dim = 0; dim < 16; dim++) {
    const w = shadeAnsiWord(word, dim);
    cand.push([...inkLab(w & 255, w >>> 8 & 255, w >>> 16 & 255), packAnsiInk(c, 15 - dim)]);
  } });
  lut = new Uint32Array(32768);
  for (let i = 0; i < 32768; i++) {
    // Perceptual match: lightness first, hue kept (an ANSI artist never
    // repaints a teal hull purple to win a nearest-colour contest).
    const [L, A, B] = inkLab((i >> 10) * 8 + 4, (i >> 5 & 31) * 8 + 4, (i & 31) * 8 + 4);
    let best = 0, d = Infinity;
    for (const [cl, ca, cb, ink] of cand) {
      const e = (L - cl) ** 2 + 2.2 * ((A - ca) ** 2 + (B - cb) ** 2);
      if (e < d) { d = e; best = ink; }
    }
    lut[i] = best;
  }
  lutTheme = theme;
  return lut;
}
// Material glyphs ride inside the ink: bright cyan water, ember lamps and
// the gold rim of the keeper carry their own printing character.
function materialGlyph(r, g, b) {
  const L = r * .3 + g * .59 + b * .11;
  return L > 205 ? '.' : null;
}

let story = {t: 0, time: 0};
function sampleArtBatch({left, top, spanX, columns, rows, across, from, count, out}) {
  const table = inkTable(style.theme);
  const shot = {scene: 0, centerX: left + spanX / 2, centerY: top + spanX / 2, zoom: -Math.log2(spanX)};
  const raw = artwork.sample(shot, story.time, true, 8, columns * across);
  for (let i = from; i < count; i++) {
    const cx = i % columns, cy = Math.floor(i / columns);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < across; dx++) {
      const p = raw((cx + (dx + .5) / across) / columns, (cy + (dy + .5) / 2) / rows);
      const r = p >> 16 & 255, g = p >> 8 & 255, b = p & 255;
      let ink = table[(r >> 3) << 10 | (g >> 3) << 5 | b >> 3];
      if (style.glyphs) { const m = materialGlyph(r, g, b); if (m) ink = packAnsiGlyph(ink, m); }
      out[(i * 2 + dy) * across + dx] = ink;
    }
  }
}

// ---------------------------------------------------------------------------
// Camera: story depth -> scene-0 world coordinates. The whole dive stays in
// one coordinate system, so the engine keeps its retained passes across
// every gate instead of restarting the plate.
function rootShot(depth) {
  const s = depthShot(depth);
  let x = s.centerX, y = s.centerY, zoom = s.zoom;
  for (let k = s.scene - 1; k >= 0; k--) {
    const seg = segments[k], span = 2 ** -seg.Z;
    const gx = seg.px + (.5 - seg.px) * span, gy = seg.py + (.5 - seg.py) * span; // gate centre
    x = gx - span / 2 + x * span; y = gy - span / 2 + y * span; zoom += seg.Z;
  }
  return {x, y, zoom};
}

// ---------------------------------------------------------------------------
// Voice: Ghost's recorded clips own the clock while they play.
const voice = {clips: {}, el: new Audio(), line: null, ready: false};
voice.el.preload = 'auto';
try {
  const manifest = await (await fetch('./voice/voice.json')).json();
  voice.clips = manifest.clips;
  voice.ready = true;
} catch {}
const timeline = buildTimeline(voice.clips);
const curve = monotoneCurve(timeline.keys);

// ---------------------------------------------------------------------------
// Transport: rate eases toward its target, so a held arrow scrubs smoothly
// in either direction and release glides to a stop or back to 1x.
const transport = {rate: 0, target: 1, held: 0, paused: false, started: false, muted: false, scrub: null};
const view = {dx: 0, dy: 0, dz: 0, vx: 0, vy: 0, vz: 0, touched: -1e9};

// ---------------------------------------------------------------------------
// Board chrome: the same GhostLINK terminal frame as the Lancing study.
const byId = id => document.getElementById(id);
const screen = document.querySelector('main'), stage = byId('stage'), caption = byId('caption');
const terminal = mountAnsiTerminal({canvas: document.createElement('canvas'), cursor: false, animation: true});
const host = mountNativeResponseHost(screen, {terminal, gridForRect: boardTerminalGrid, maxFps: 20,
  label: 'Friktal HQ / First contact', onAction: action, onFocus: id => { focus = id; }});
host.element.append(stage);
host.focus();
let focus = null, chromeKey = '', fitKey = '', artBox = null;

const viewer = mountAnsiFractal(stage, {frameBudget: 6, host: {
  terminal: {get colourTheme() { return style.theme; }, colourMode: 'rgb'},
  rect() {
    const r = stage.getBoundingClientRect();
    return {left: r.left + stage.clientLeft, top: r.top + stage.clientTop,
      cellWidth: stage.clientWidth / style.width, cellHeight: stage.clientHeight / style.height};
  },
}});

function action(id) {
  if (id === 'play') togglePause();
  else if (id === 'back') { story.t = Math.max(0, story.t - 8); voiceStop(); }
  else if (id === 'fwd') { story.t = Math.min(timeline.duration, story.t + 8); voiceStop(); }
  else if (id === 'mute') { transport.muted = !transport.muted; voiceStop(); }
  else if (id.startsWith('style-')) setStyle(id.slice(6));
  start();
}
function setStyle(id) {
  style = styles.find(s => s.id === id) ?? style;
  terminal.setPalette?.(style.theme);
  chromeKey = '';
}
function togglePause() { transport.paused = !transport.paused; transport.target = transport.paused ? 0 : 1; if (transport.paused) voiceStop(); }
function start() { if (!transport.started) { transport.started = true; transport.target = 1; } }

function wrap(text, width) {
  const lines = []; let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > width) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}
// The keeper's lines decode: undecoded letters show as line noise, which
// un-decodes again when you rewind. Ghost's lines simply type.
const noise = '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌';
function visibleText(line, typed, t) {
  const text = line.beat.text, n = Math.floor(text.length * typed);
  if (line.beat.who === 'ghost') return text.slice(0, n);
  const lead = Math.min(text.length, n + 6);
  let s = text.slice(0, n);
  for (let i = n; i < lead; i++) s += text[i] === ' ' ? ' ' : noise[(i * 7 + Math.floor(t * 18)) % noise.length];
  return s;
}

function chrome(now) {
  const fit = host.rect(), grid = host.grid, {columns: C, rows: R} = grid;
  const capRows = 3;
  const h = Math.max(4, Math.min(R - capRows - 9, Math.floor((C - 8) * 9 / 24)));
  const w = Math.min(C - 8, Math.round(h * 24 / 9));
  const col = 1 + Math.floor((C - w - 2) / 2), row = 2;
  const geometry = [fit.left, fit.top, fit.cellWidth, fit.cellHeight, col, row, w, h].join('/');
  if (fitKey !== geometry) {
    fitKey = geometry;
    const root = screen.getBoundingClientRect();
    Object.assign(stage.style, {left: (fit.left - root.left + col * fit.cellWidth) + 'px',
      top: (fit.top - root.top + row * fit.cellHeight) + 'px', width: w * fit.cellWidth + 'px', height: h * fit.cellHeight + 'px'});
    artBox = {w, h};
  }
  const s = storyAt(timeline, curve, story.t);
  const line = s.line, who = line ? speakers[line.beat.who] : null;
  const text = line ? visibleText(line, s.typed, now) : '';
  const clock = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  const bar = Math.max(10, w - 34), filled = Math.round(bar * story.t / timeline.duration);
  const key = JSON.stringify([geometry, focus, style.id, who?.label, text, transport.paused, transport.muted, filled, clock(story.t), transport.started]);
  if (key === chromeKey) return;
  chromeKey = key;
  const {box, put, action: act, hotspots, cells, tracks, inkStyles} = boardTerminalPage(grid, focus);
  put(row - 1, col + 1, 'FRIKTAL HQ  /  GHOSTLINK ' + style.bps + ' BPS', 6);
  put(row - 1, col + w - 13, style.label.padStart(14), 11);
  box(row, col, w + 2, h + 2, 'FIRST CONTACT / THE KEEPER', 6);
  const cap = row + h + 2;
  box(cap, col, w + 2, capRows + 2, who ? who.label : transport.started ? '' : 'PRESS ENTER OR CLICK PLAY', who?.ink === 'ghost' ? 11 : 13);
  wrap(text, w - 2).slice(-capRows).forEach((l, i) => put(cap + 1 + i, col + 2, l, line?.beat.who === 'ghost' ? 15 : 14));
  const foot = cap + capRows + 2;
  act('back', foot, col + 1, 7, '←', '‹‹', {label: 'Rewind (hold ← to scrub)'});
  act('play', foot, col + 9, 9, 'Space', transport.paused || !transport.started ? 'PLAY' : 'PAUSE', {primary: true});
  act('fwd', foot, col + 19, 7, '→', '››', {label: 'Forward (hold → to scrub)'});
  put(foot, col + 27, '[' + '█'.repeat(filled) + '░'.repeat(bar - filled) + '] ' + clock(story.t) + '/' + clock(timeline.duration), 7);
  styles.forEach((st, i) => act('style-' + st.id, foot + 1, col + 1 + i * 14, 13, st.key, st.label, {fg: st.id === style.id ? 11 : 7}));
  act('mute', foot + 1, col + w - 9, 9, 'M', transport.muted ? 'VOICE' : 'MUTE');
  const page = ansiSceneProgram({cells: cells.map((cell, i) => ({...cell, column: i % C + 1, row: Math.floor(i / C) + 1})), tracks}, grid);
  host.show({grid, text: page.text, hotspots, animation: {tracks, ink: inkStyles}}, {immediate: true, preserve: true});
  if (line && caption.dataset.id !== line.id) { caption.dataset.id = line.id; caption.textContent = (who?.label ?? '') + ': ' + line.beat.text; }
  progressBar = {row: foot, col: col + 28, width: bar};
}
let progressBar = null;

// ---------------------------------------------------------------------------
function voiceStop() { if (!voice.el.paused) voice.el.pause(); voice.line = null; }
function voiceSync() {
  const s = storyAt(timeline, curve, story.t), line = s.line;
  const clip = line && line.beat.who === 'ghost' ? voice.clips[line.id] : null;
  const forward = Math.abs(transport.rate - 1) < .05 && !transport.paused && !transport.muted;
  if (!clip || !forward) { if (voice.line) voiceStop(); return false; }
  const offset = story.t - line.start;
  if (offset < 0 || offset >= clip.duration) { if (voice.line) voiceStop(); return false; }
  if (voice.line !== line.id) {
    voice.line = line.id;
    voice.el.src = './voice/' + clip.file;
    voice.el.currentTime = offset;
    voice.el.play().catch(() => { voice.line = null; });
    return false;
  }
  return !voice.el.paused && voice.el.readyState >= 2;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  // Rate glides: hold arrows for -4x / +4x, release returns to play or pause.
  const want = transport.held || (transport.paused || !transport.started ? 0 : transport.target);
  transport.rate += (want - transport.rate) * (1 - Math.exp(-dt * (transport.held ? 3 : 6)));
  if (transport.scrub == null) {
    // Ghost's playing clip is the clock; otherwise the transport rate is.
    const spoken = voiceSync() && voice.line;
    if (spoken) { const l = timeline.lines.find(x => x.id === voice.line); story.t = l.start + voice.el.currentTime; }
    else story.t = Math.max(0, Math.min(timeline.duration, story.t + dt * transport.rate));
  }
  story.time = story.t;
  // Look-around offset springs home after the hand lets go.
  if (now - view.touched > 900) {
    const k = 1 - Math.exp(-dt * 2.2);
    view.dx -= view.dx * k; view.dy -= view.dy * k; view.dz -= view.dz * k;
  }
  const cam = rootShot(curve(story.t));
  const zoom = cam.zoom + view.dz, span = 2 ** -zoom;
  chrome(now / 1000);
  viewer.update({
    id: 'friktal-hq/' + style.id, width: style.width, height: style.height,
    zoom, centerX: cam.x + view.dx * span, centerY: cam.y + view.dy * span, viewport: {x: 1, y: 1},
    row: 1, column: 1, passes: style.passes, plane: true, worldOverlay: true, quadrantInk: true, paletteTrue: true,
    batchGlyphInk: style.glyphs, animated: style.animated, instantPasses: false, bps: style.bps,
    sample: () => 0, sampleArtBatch, retainCameraProgress: true, retainResize: true, smoothInk: false, smoothSprites: false,
  }, true, now / 1000, false);
  stage.dataset.t = story.t.toFixed(2); stage.dataset.depth = curve(story.t).toFixed(3); stage.dataset.style = style.id;
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Input. Keys drive the transport; the art surface is look-around only.
addEventListener('keydown', e => {
  if (e.repeat && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return e.preventDefault();
  if (e.key === ' ' || e.key === 'Enter') { start(); if (e.key === ' ' || transport.started) togglePause(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { start(); transport.held = -4; voiceStop(); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { start(); transport.held = 4; voiceStop(); e.preventDefault(); }
  else if (e.key === 'm' || e.key === 'M') action('mute');
  else { const st = styles.find(s => s.key === e.key); if (st) setStyle(st.id); }
});
addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') transport.held = 0; });
let drag = null;
stage.addEventListener('pointerdown', e => { start(); drag = {x: e.clientX, y: e.clientY, dx: view.dx, dy: view.dy}; stage.setPointerCapture(e.pointerId); view.touched = performance.now(); });
stage.addEventListener('pointermove', e => {
  if (!drag) return;
  const r = stage.getBoundingClientRect();
  view.dx = drag.dx - (e.clientX - drag.x) / r.width; view.dy = drag.dy - (e.clientY - drag.y) / r.height;
  view.touched = performance.now();
});
stage.addEventListener('pointerup', () => { drag = null; view.touched = performance.now(); });
stage.addEventListener('wheel', e => { view.dz = Math.max(-2, Math.min(3, view.dz - e.deltaY * .002)); view.touched = performance.now(); e.preventDefault(); }, {passive: false});
// Scrub: click/drag on the progress bar row in the chrome.
screen.addEventListener('pointerdown', e => {
  if (!progressBar) return;
  const fit = host.rect(), root = screen.getBoundingClientRect();
  const col = (e.clientX - fit.left) / fit.cellWidth, row = (e.clientY - fit.top) / fit.cellHeight;
  if (Math.floor(row) !== progressBar.row - 1 || col < progressBar.col - 1 || col > progressBar.col + progressBar.width) return;
  const seek = ev => { const c = (ev.clientX - fit.left) / fit.cellWidth - progressBar.col + 1; story.t = Math.max(0, Math.min(1, c / progressBar.width)) * timeline.duration; voiceStop(); };
  transport.scrub = true; seek(e);
  const move = ev => seek(ev), up = () => { transport.scrub = null; removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
  addEventListener('pointermove', move); addEventListener('pointerup', up);
  void root;
}, true);

if (params.has('t')) story.t = +params.get('t');
if (params.has('play')) start();
setStyle(style.id);
requestAnimationFrame(frame);
