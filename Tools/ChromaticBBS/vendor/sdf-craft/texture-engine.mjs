// GENERATED verbatim InfiniTexture engine; edit the canonical GhostFace source.
// TEXTURE FOUNDRY ALGOS — extracted VERBATIM (2026-07-27) from
// Assets/scripts/FriktalStarDiver/prototypes/SDF-ShipFoundry-Fable5.html
// lines 1157-2165: RNG (mulberry32/mkGen/ihash), ROSTER (15 race
// palettes), canonical-space noise kit (vnoiseT/fbmT/voroT/brickT),
// the RACE_SKINS bank (30 per-race skin algorithms), hueRotJS,
// genSurface (the authentic game bake) and surfaceFX (terracing,
// canyon glow, framed viewports, bevel). The C# port in
// StarDiverFoundry.Skins.cs was made from THIS code with exact JS
// semantics — this file IS the game look. Do not fork the math
// here; algorithm changes belong in both lanes or neither.
// Globals: TS (let, bake res — the lab sets it per output),
// CT=256 canonical space. Consumer: texture-lab.js (v2 roots
// GAME RACE SKIN / AUTHENTIC GAME ROLL + RACE ALGO MIX pass).

/* ============================ RNG ============================ */

function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const newSeed = () => (Math.random()*0x7fffffff)|0;
function mkGen(seed){
  const R = mulberry32(seed);
  return {
    R,
    r:  (a,b) => a + R()*(b-a),
    ri: (a,b) => Math.floor(a + R()*(b-a+1)),
    pick: arr => arr[Math.floor(R()*arr.length)],
    chance: p => R() < p,
    sgn: () => R() < 0.5 ? -1 : 1,
  };
}
/* integer hash for tileable textures (ports ArtGen.Hash) */
function ihash(seed, x, y){
  let v = (Math.imul(x,73856093) ^ Math.imul(y,19349663) ^ seed)>>>0;
  v ^= v>>>13; v = Math.imul(v,0x5bd1e995)>>>0; v ^= v>>>15;
  return (v & 0xFFFF)/65535;
}

/* ====================== THE ROSTER (ported) ====================== */

const hex = s => [parseInt(s.slice(1,3),16)/255,
                  parseInt(s.slice(3,5),16)/255,
                  parseInt(s.slice(5,7),16)/255];
/* key, name, form(0 mach/1 org), hull, dark, trim, glow, shot,
   paint(secondary body color), archetypes, detail skins, irid */
const ROSTER = [
 ["krex","Krex",0,"#6fb36f","#243722","#d7ad2e","#55ff59","#ffd46a",
  "#4a6e3f",["warshard"],
  ["chevron"],0],
 ["benev","Benev",1,"#9b5328","#2e1208","#f0db9b","#69ff69","#82ff7b",
  "#6e3a1a",["bulb","petal","shoal","manta","medusa"],
  ["scaled","cellular","veined","monolithic"],0.5],
 ["lipok","Lipok",0,"#7a2430","#1c0509","#4a3f44","#3dff9c","#5cffb0",
  "#521821",["needle","lance","spindle","trident"],
  ["striated","ringed","monolithic","trussed"],0],
 ["blpblp","BlpBlp",1,"#3fae7c","#0c2e1e","#46ffd2","#74ff73","#46ffd2",
  "#2a7a56",["bulb","shoal","medusa"],
  ["cellular","scaled","veined"],0.4],
 ["dravlac","Dravlac",0,"#8f2333","#25060b","#ffd166","#ff8a5c","#ff4d73",
  "#5e1620",["cleaver","talon","needle","raptor"],
  ["striated","trussed","plated"],0],
 ["algatrons","Algatrons",0,"#2b7f8f","#07222a","#ffd166","#00e5ff","#7df3ff",
  "#1b525e",["carrier","barge","hammer","spindle"],
  ["plated","ringed","monolithic"],0,true],
 ["cylmis","Cylmis",0,"#b8c8dd","#2a3345","#a84bff","#dfa9ff","#c88aff",
  "#8494ad",["needle","trident","spindle","petal"],
  ["monolithic","striated","ringed"],0.8],
 ["gorlompa","Gorlompa",1,"#c76d84","#3a1420","#74ff73","#ff9ab0","#ff9ab0",
  "#8f4a5e",["barge","hammer","bulb"],
  ["plated","patchwork","monolithic"],0.2],
 ["moknon","Moknon",0,"#3a7d8c","#0b2229","#74ff73","#00e5ff","#74ff73",
  "#255460",["carrier","barge","spindle","manta"],
  ["ringed","monolithic","plated"],0,true],
 ["frik","Frik",0,"#a8863a","#2e2208","#00e5ff","#ffdf73","#ffd166",
  "#705a26",["wasp","raptor","patchquilt","spear"],
  ["patchwork","trussed","striated"],0],
 ["human","Human",0,"#78848f","#161b22","#c8323f","#dfffff","#bfe6ff",
  "#274f92",["naval"],
  ["navalplate"],0],
 ["salrith","Salrith",0,"#5b3a78","#170a24","#9be7ff","#a84bff","#c88aff",
  "#3d2752",["needle","lance","talon","raptor"],
  ["monolithic","striated","ringed"],0.3],
 ["veelow","Veelow",1,"#5da86a","#14301a","#dfffff","#74ff73","#a5ffb2",
  "#3d7346",["needle","petal","wasp","spear"],
  ["veined","scaled","striated"],0.3],
 ["epowat","Epowat",0,"#a89a54","#2e2a10","#46ffd2","#ffdf73","#ffdf73",
  "#736937",["hammer","barge","manta"],
  ["striated","plated","monolithic"],0],
 ["pogfrot","PogFrot",1,"#b04a8c","#320f26","#ffd166","#ff46d8","#ff8ad4",
  "#7a3260",["barge","bulb","carrier","medusa"],
  ["monolithic","plated","cellular"],0.3],
].map(r => ({
  key:r[0], name:r[1], form:r[2],
  hull:hex(r[3]), dark:hex(r[4]), trim:hex(r[5]),
  glow:hex(r[6]), shot:hex(r[7]), paint:hex(r[8]),
  archs:r[9], skins:r[10], irid:r[11], traces:!!r[12],
}));

/* FLY -> TITAN: name, length in meters */
const CLASSES = [
  ["FLY",6],["WASP",11],["SCOUT",19],["FIGHTER",32],
  ["CORVETTE",65],["CRUISER",130],["BATTLESHIP",260],["TITAN",520],
];

/* ==================== BAKED SURFACE TEXTURES ==================== */
/* Ports of StarDiverShipArtGen's texture thinking: tileable 256^2,
   albedo(rgb)+height(a) and emiss/metal/rough. All wrap-safe. */

let TS = 256;      /* live texture resolution (app-wide) */
const CT = 256;    /* canonical algo space: all skin algos are
                      authored in 256 units, so changing TS only
                      raises image QUALITY — feature count and
                      layout stay identical at every res */
function vnoiseT(seed, x, y, freq){
  /* tileable value noise in canonical space */
  const fx = x*freq/CT, fy = y*freq/CT;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx-x0, ty = fy-y0;
  const sx = tx*tx*(3-2*tx), sy = ty*ty*(3-2*ty);
  const h = (a,b) => ihash(seed, ((a%freq)+freq)%freq,
                                 ((b%freq)+freq)%freq);
  return (h(x0,y0)*(1-sx)+h(x0+1,y0)*sx)*(1-sy)
       + (h(x0,y0+1)*(1-sx)+h(x0+1,y0+1)*sx)*sy;
}
function fbmT(seed, x, y){
  return 0.55*vnoiseT(seed,x,y,8) + 0.30*vnoiseT(seed+7,x,y,16)
       + 0.15*vnoiseT(seed+13,x,y,32);
}

/* ── PER-RACE TEXTURE ALGOS ─────────────────────────────
   Each race owns its skins. NO algorithm is shared across
   races — only low-level utilities (noise, hash, voronoi).
   Every skin takes SP: rolled settings, so one algo covers
   a wide family of looks per reroll.
   Returns {tone, trimM, h, em, pm?} per texel. */

function rollSkin(G){
  return { sc: G.pick([0.7,0.85,1.0,1.2,1.45]),
           den: G.r(0.5,1.5), con: G.r(0.78,1.22),
           gl: G.r(0.4,1.3), m: G.ri(0,3), ph: G.ri(0,997) };
}
/* wrapped voronoi utility: {d1, edge (d2-d1), id} */
function voroT(seed, x, y, N){
  let f1=1e9, f2=1e9, id=0;
  const px = x/CT*N, py = y/CT*N;
  const cx = Math.floor(px), cy = Math.floor(py);
  const wr = (v,n) => ((v%n)+n)%n;
  for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){
    const gx=cx+ox, gy=cy+oy;
    const jx=gx+ihash(seed,wr(gx,N),wr(gy,N));
    const jy=gy+ihash(seed+3,wr(gx,N),wr(gy,N));
    const d=(jx-px)*(jx-px)+(jy-py)*(jy-py);
    if(d<f1){ f2=f1; f1=d; id=wr(gx,N)*31+wr(gy,N); }
    else if(d<f2) f2=d;
  }
  return { d1: Math.sqrt(f1), edge: Math.sqrt(f2)-Math.sqrt(f1),
           id };
}
/* brick-grid utility: {col,row,lx,ly,bd,hc} */
function brickT(seed, x, y, pw, ph){
  const row = Math.floor(y/ph);
  const off = Math.floor(ihash(seed,row,7)*pw);
  const col = Math.floor((x+off)/pw);
  const lx = (x+off)%pw, ly = y%ph;
  return { col, row, lx, ly,
           bd: Math.min(lx, pw-1-lx, ly, ph-1-ly),
           hc: ihash(seed, col, row) };
}

const RACE_SKINS = {
human: [
  function naval(seed, x, y, SP){
    /* BSG/B5 naval hull with PER-ROLL LAYOUT MODES and
       panel-aligned paint (pm). Ship plating, three ways. */
    const mode = SP.m % 3;
    const ph = Math.round((mode===2 ? 22 : 14)*SP.sc);
    const pw = Math.round((mode===1 ? 96 : 72)*SP.sc);
    const { col, row, lx, ly, bd, hc } =
        brickT(seed, x, y, pw, ph);
    let h = 0.52 + 0.26*Math.floor(hc*5)/5;
    let tone = 0.60 + 0.30*hc;
    let trimM = 0, pm = 0;
    if(bd < 1.5){ h -= 0.17; tone *= 0.60; }
    /* PAINT: bold, panel-aligned — never a soft blotch */
    if(mode===0){
      /* checker sections of whole panels */
      pm = ihash(seed+77, col, row) < 0.35 ? 1 : 0;
    } else if(mode===1){
      /* longitudinal two-tone band with hard edge */
      const b0 = Math.floor(ihash(seed+78,5,5)*CT*0.5);
      pm = (y >= b0 && y < b0+CT*0.30) ? 1 : 0;
    } else {
      /* diagonal split livery */
      pm = ((x*0.55 + y) % CT) < CT*0.42 ? 1 : 0;
    }
    /* rivet rows just inside long edges */
    if((ly === 2 || ly === ph-3) && lx%7 < 1.5){
      h += 0.10; tone *= 1.12;
    }
    /* louvered vent panel occasionally */
    if(hc > 0.88 && bd > 2){
      if(ly % 3 < 1.4){ h -= 0.12; tone *= 0.72; }
      pm = 0;
    }
    /* DIAGONAL reinforcement beams (the good accident, kept) */
    const d1 = (x + y) % 170;
    if(d1 < 8){
      h += 0.16; tone = Math.min(1, tone*1.2); pm = 0;
      if(d1 < 1.5 || d1 > 6.5){ h -= 0.24; tone *= 0.55; }
    }
    const d2 = (x - y + CT*4) % 240;
    if(d2 < 6){ h += 0.12; tone = Math.min(1, tone*1.12); }
    /* registry stripe band — painted trim, sits FLUSH */
    const sy = Math.floor(ihash(seed,3,11)*(CT-24))+8;
    if(y >= sy && y < sy+9 && bd >= 1.5){ trimM = 0.75; pm = 0; }
    /* hazard chevrons along the paint boundary (mode 1) */
    if(mode===1){
      const b0 = Math.floor(ihash(seed+78,5,5)*CT*0.5);
      if(Math.abs(y-b0) < 4 && ((x+y)%24) < 12) trimM = 0.6;
    }
    h += (fbmT(seed+3,x,y)-0.5)*0.05;
    return { tone, trimM, h, em:0, pm };
  },
  function drydock(seed, x, y, SP){
    /* shipyard-fresh slab hull: huge bay panels, recessed
       door tracks, stencil blocks, sparse hatch rows */
    const pw = Math.round(120*SP.sc), ph = Math.round(64*SP.sc);
    const { col, row, lx, ly, bd, hc } = brickT(seed,x,y,pw,ph);
    let h = 0.55 + 0.22*Math.floor(hc*3)/3;
    let tone = (0.58 + 0.30*hc)*SP.con;
    let trimM = 0;
    if(bd < 2){ h -= 0.16; tone *= 0.62; }
    /* bay door: recessed panel with track grooves */
    if(ihash(seed+5,col,row) > 0.72 && bd > 5){
      h -= 0.12;
      if(ly % 9 < 1.6) h -= 0.10;
      tone *= 0.85;
    }
    /* stencil block */
    if(ihash(seed+9,col,row) > 0.86
       && lx > pw*0.2 && lx < pw*0.5
       && ly > ph*0.3 && ly < ph*0.5) trimM = 0.7;
    /* hatch dots */
    if(bd > 4 && lx % 17 < 3 && ly % 23 < 3) h += 0.10;
    const pm = ((x + y*0.3) % CT) < CT*0.38 ? 1 : 0;
    h += (fbmT(seed+3,x,y)-0.5)*0.05;
    return { tone, trimM, h, em:0, pm };
  },
],
krex: [
  function chevron(seed, x, y, SP){
    /* KREX war armor: nested chevron plates + quantized
       digital camo (their broken-camo lore) + etched glyphs */
    const period = Math.round(26*SP.sc);
    const c = y + Math.abs((x % 96) - 48)*(0.6+0.4*SP.den);
    const band = Math.floor(c/period);
    const bb = ((c % period)+period)%period;
    const hb = ihash(seed, band, 3);
    let tone = (0.40 + 0.48*hb)*SP.con;
    let h = 0.46 + 0.30*hb;
    let trimM = 0, em = 0;
    if(bb < 3){ h -= 0.22; tone *= 0.52; }
    else if(bb < 5){ h += 0.10; }
    const q3 = Math.floor(vnoiseT(seed+9, x, y, 8)*3)/3;
    tone *= 0.72 + 0.42*q3;
    const pm = q3 < 0.01 ? 1 : 0;
    if(bb > 7 && bb < period-3){
      const gx = Math.floor(x/11);
      if(ihash(seed+17, gx, band) > 0.88 && x%11 < 2){
        h -= 0.12; trimM = 0.55;
      }
    }
    if(bb >= 4 && bb < 6 && x % 9 < 2) h += 0.09;
    h += (fbmT(seed+5,x,y)-0.5)*0.07;
    return { tone, trimM, h, em, pm };
  },
  function warscar(seed, x, y, SP){
    /* gouged battle armor: heavy slabs, deep claw scars,
       crude weld patches slapped over the wounds */
    const pw = Math.round(64*SP.sc);
    const { col, row, bd, hc } = brickT(seed,x,y,pw,pw);
    let h = 0.52 + 0.24*hc, tone = (0.42+0.4*hc)*SP.con;
    let trimM = 0;
    if(bd < 2){ h -= 0.15; tone *= 0.6; }
    /* claw scars: 3 parallel diagonal gouges per region */
    const sa = 0.9 + SP.den;
    const sv = (x*sa + y) % 160;
    if(ihash(seed+7, Math.floor((x*sa+y)/160), 3) > 0.55){
      const g = sv % 13;
      if(sv < 40 && g < 3.5){
        h -= 0.26; tone *= 0.5;
      }
    }
    /* weld patch: bright small plate + bead ring */
    const wv = voroT(seed+11, x, y, 9);
    if(wv.d1 < 0.30 && ihash(seed+13, wv.id, 1) > 0.7){
      h += 0.14; tone = Math.min(1, tone*1.35); trimM = 0;
      if(wv.d1 > 0.24) h += 0.10;   /* bead rim */
    }
    const pm = vnoiseT(seed+21,x,y,4) > 0.62 ? 1 : 0;
    h += (fbmT(seed+3,x,y)-0.5)*0.08;
    return { tone, trimM, h, em:0, pm };
  },
],
benev: [
  function shellscale(seed, x, y, SP){
    /* overlapping chitin scales w/ breathing pore glows */
    const sh2 = Math.round(20*SP.sc), sw = Math.round(30*SP.sc);
    const row = Math.floor(y/sh2);
    const off = (row%2)*sw/2;
    const col = Math.floor((x+off)/sw);
    const lx = (x+off)%sw - sw/2, ly = y%sh2;
    const arc = Math.sqrt(Math.max(0,
        1-(lx/(sw*0.52))*(lx/(sw*0.52))));
    const prof = Math.max(0, arc - ly/sh2);
    const hc = ihash(seed, col, row);
    /* pore: one glow dot under some scale lips */
    const pore = prof > 0.06 && prof < 0.22
        && Math.abs(lx) < sw*0.14
        && ihash(seed+5,col,row) > 0.6 ? SP.gl*0.7 : 0;
    return { tone: (0.45+0.45*hc*(0.6+0.4*prof))*SP.con,
             trimM: hc>0.93?0.5:0,
             h: 0.25 + 0.65*prof + (fbmT(seed+6,x,y)-0.5)*0.08,
             em: pore };
  },
  function gutweave(seed, x, y, SP){
    /* muscle-fiber bundles crossing under a translucent
       membrane, sinew knots at the crossings */
    const a1 = Math.sin((x*0.8+y*0.35)*0.049*SP.sc + SP.ph);
    const a2 = Math.sin((x*0.3-y*0.9)*0.041*SP.sc + SP.ph*2.0);
    const fib = Math.pow(Math.abs(a1), 0.5)*0.5
              + Math.pow(Math.abs(a2), 0.5)*0.5;
    const knot = (1-Math.abs(a1))*(1-Math.abs(a2));
    const n2 = fbmT(seed+77, x, y);
    return { tone: (0.42 + 0.4*n2 + knot*0.35)*SP.con,
             trimM: knot > 0.8 ? 0.4 : 0,
             h: 0.65 - fib*0.35 + knot*0.30
                + (n2-0.5)*0.10,
             em: knot > 0.86 ? SP.gl*0.6 : 0 };
  },
],
lipok: [
  function bloodgroove(seed, x, y, SP){
    /* long ceremonial grooves + band tone shifts, glow slits
       cut into the deepest channels */
    const bw = Math.round(10*SP.sc);
    const band = Math.floor(y/bw + 2.5*vnoiseT(seed,x,y,4));
    const hb = ihash(seed, band, 3);
    const g = Math.abs((y + bw*vnoiseT(seed,x,y,4)) % bw - bw/2);
    let h = 0.5 + 0.3*hb - (g<1.2 ? 0.22 : 0);
    let tone = (0.45 + 0.45*hb)*SP.con;
    let em = 0;
    if((x + Math.floor(ihash(seed,band,9)*97)) % 96 < 3){
      h -= 0.2; tone *= 0.6;
    }
    /* glow slit segments inside grooves */
    if(g < 1.0 && ihash(seed+8, band, x>>5) > 1-0.25*SP.den)
      em = SP.gl*0.8;
    return { tone, trimM: hb>0.92?0.7:0,
             h: h + (fbmT(seed+5,x,y)-0.5)*0.07, em };
  },
  function boneplate(seed, x, y, SP){
    /* interlocking bone-white plates with dark suture seams
       (wandering zigzag joints, like skull plates) */
    const v = voroT(seed, x, y, Math.round(5*SP.sc)||4);
    const wob = (vnoiseT(seed+4,x,y,16)-0.5)*0.16;
    const seam = v.edge + wob;
    const hc = ihash(seed, v.id, 5);
    let h = 0.55 + 0.25*hc, tone = (0.55+0.38*hc)*SP.con;
    if(seam < 0.05){ h -= 0.24; tone *= 0.5; }
    else if(seam < 0.10) h -= 0.08;
    /* pin studs along sutures */
    if(seam > 0.05 && seam < 0.09
       && (x+y) % 13 < 2) h += 0.12;
    return { tone, trimM: hc > 0.9 ? 0.5 : 0,
             h: h + (fbmT(seed+2,x,y)-0.5)*0.06, em:0 };
  },
],
blpblp: [
  function bubblehide(seed, x, y, SP){
    /* pressure bubbles w/ glossy lit nuclei — deep-sea hull */
    const v = voroT(seed, x, y, Math.round(7*SP.sc)||5);
    const dome = Math.max(0, 1 - v.d1*1.6);
    const hc = ihash(seed, v.id, 5);
    const nuc = dome > 0.72 && hc > 0.45;
    return { tone: (0.4+0.5*hc)*SP.con,
             trimM: hc>0.9?0.5:0,
             h: 0.25 + 0.6*dome*dome
                + (fbmT(seed+8,x,y)-0.5)*0.1,
             em: nuc ? SP.gl*(0.3+0.5*hc) : 0 };
  },
  function currentflow(seed, x, y, SP){
    /* tidal flow streaks: layered sine currents w/ foam
       crests and drifting plankton glow specks */
    const w1 = Math.sin(y*0.06*SP.sc + 4*vnoiseT(seed,x,y,3)
        + SP.ph);
    const w2 = Math.sin(y*0.11*SP.sc - 3*vnoiseT(seed+5,x,y,5));
    const flow = w1*0.6 + w2*0.4;
    const crest = Math.max(0, flow-0.72)*3.5;
    const spk = ihash(seed+9, x>>2, y>>2) > 1-0.02*SP.den;
    return { tone: (0.5 + 0.3*flow)*SP.con,
             trimM: crest > 0.5 ? 0.4 : 0,
             h: 0.5 + 0.22*flow + crest*0.2,
             em: spk ? SP.gl*0.8 : 0 };
  },
],
dravlac: [
  function knifeplate(seed, x, y, SP){
    /* long diagonal blade plates, edge-honed lips, etched
       kill-tally runes near the seams */
    const a = 0.35 + 0.25*SP.den;
    const c = (x*a + y) % Math.round(48*SP.sc);
    const band = Math.floor((x*a + y)/Math.round(48*SP.sc));
    const hb = ihash(seed, band, 3);
    let h = 0.5 + 0.28*hb, tone = (0.42+0.45*hb)*SP.con;
    let trimM = 0;
    if(c < 3){ h -= 0.24; tone *= 0.5; }
    else if(c < 6){ h += 0.12; tone *= 1.15; }  /* honed lip */
    /* kill-tally ticks */
    const gx = Math.floor(x/9);
    if(c > 10 && c < 20 && ihash(seed+7,gx,band) > 0.82
       && x%9 < 1.6){ h -= 0.10; trimM = 0.6; }
    const pm = vnoiseT(seed+13,x,y,2) > 0.6 ? 1 : 0;
    return { tone, trimM,
             h: h + (fbmT(seed+5,x,y)-0.5)*0.06, em:0, pm };
  },
  function whetstone(seed, x, y, SP){
    /* circular grind marks around wrapped centers — the hull
       is SHARPENED, not painted */
    let h = 0.55, tone = 0.58;
    for(let c2=0;c2<3;c2++){
      const cx = ihash(seed,c2,1)*CT, cy = ihash(seed,c2,2)*CT;
      let dx = Math.abs(x-cx); dx = Math.min(dx, CT-dx);
      let dy = Math.abs(y-cy); dy = Math.min(dy, CT-dy);
      const r = Math.hypot(dx,dy);
      const g = Math.abs(r % Math.round(9*SP.sc)
          - Math.round(9*SP.sc)/2);
      if(g < 1.0){ h -= 0.07; tone *= 0.88; }
    }
    const n = fbmT(seed+4,x,y);
    /* mirror-polish streaks where grinding is freshest */
    const pol = vnoiseT(seed+9,x,y,6);
    return { tone: (tone*(0.75+0.4*n))*SP.con,
             trimM: pol > 0.9 ? 0.5 : 0,
             h: h + (n-0.5)*0.05, em:0 };
  },
],
algatrons: [
  function circuitward(seed, x, y, SP){
    /* sacred machine ward: manhattan bus traces between
       component pads — carved INTO the plate, glowing */
    const cs = Math.round(52*SP.sc);
    const col = Math.floor(x/cs), row = Math.floor(y/cs);
    const hc = ihash(seed, col, row);
    const lx = x%cs, ly = y%cs;
    let h = 0.58 + 0.16*Math.floor(hc*3)/3;
    let tone = (0.55+0.32*hc)*SP.con;
    let em = 0, trimM = 0;
    const bd = Math.min(lx, cs-1-lx, ly, cs-1-ly);
    if(bd < 1.5){ h -= 0.14; tone *= 0.65; }
    /* bus lanes at fixed offsets */
    const lane = Math.round(cs*0.5);
    const onH = Math.abs(ly-lane) < 2 && ihash(seed+3,col,row)>0.35;
    const onV = Math.abs(lx-lane) < 2 && ihash(seed+5,col,row)>0.35;
    if(onH || onV){
      h -= 0.16; tone *= 0.6;
      if(ihash(seed+7,col,row) > 1-0.5*SP.den) em = SP.gl*0.8;
    }
    /* component pad: raised square w/ trim ring */
    if(bd > cs*0.30 && ihash(seed+9,col,row) > 0.6){
      h += 0.14;
      if(bd < cs*0.34) trimM = 0.6;
    }
    return { tone, trimM,
             h: h + (fbmT(seed+2,x,y)-0.5)*0.04, em };
  },
  function reliclattice(seed, x, y, SP){
    /* woven reliquary lattice: over-under strap weave with
       gilded crossings */
    const p = Math.round(34*SP.sc);
    const ux = Math.floor(x/p)%2, uy = Math.floor(y/p)%2;
    const lx = x%p, ly = y%p;
    const over = (ux+uy)%2 === 0;
    const sx = Math.min(lx, p-1-lx)/p, sy = Math.min(ly, p-1-ly)/p;
    const strap = over ? sy : sx;
    let h = 0.35 + strap*0.9;
    const hc = ihash(seed, Math.floor(x/p), Math.floor(y/p));
    let trimM = 0;
    if(sx > 0.34 && sy > 0.34) trimM = 0.7;   /* gilded knot */
    return { tone: (0.5+0.35*hc)*SP.con, trimM,
             h: Math.min(1,h) + (fbmT(seed+6,x,y)-0.5)*0.05,
             em: 0 };
  },
],
cylmis: [
  function prismfacet(seed, x, y, SP){
    /* crystal facets: voronoi shards, flat faces at stepped
       heights, razor seams — prism hue pass does the rest */
    const v = voroT(seed, x, y, Math.round(6*SP.sc)||4);
    const hc = ihash(seed, v.id, 5);
    let h = 0.30 + 0.55*Math.floor(hc*6)/6;
    let tone = (0.5+0.42*hc)*SP.con;
    if(v.edge < 0.04){ h -= 0.20; tone *= 0.55; }
    return { tone, trimM: hc > 0.88 ? 0.6 : 0,
             h, em: v.edge < 0.03 && hc > 0.7 ? SP.gl*0.5 : 0 };
  },
  function chime(seed, x, y, SP){
    /* hanging crystal rods: vertical prisms of varying length,
       lit tips — a hull of windchimes */
    const rw = Math.round(11*SP.sc);
    const col = Math.floor(x/rw);
    const hc = ihash(seed, col, 3);
    const len = CT*(0.3 + 0.6*hc);
    const ly = (y + ihash(seed+5,col,1)*CT) % CT;
    const inRod = ly < len;
    const lx = Math.min(x%rw, rw-1-(x%rw));
    let h = inRod ? 0.45 + 0.35*(lx/rw)*2 : 0.28;
    const tip = inRod && ly > len-6;
    return { tone: (inRod ? 0.55+0.35*hc : 0.35)*SP.con,
             trimM: 0,
             h: h + (fbmT(seed+4,x,y)-0.5)*0.03,
             em: tip ? SP.gl*0.9 : 0 };
  },
],
gorlompa: [
  function plateweb(seed, x, y, SP){
    /* THE one-in-a-hundred roll, now a birthright: heavy
       metal plates with organic vein-webbing grown through
       the seams — machine bones, living joints */
    const pw = Math.round(46*SP.sc), ph = Math.round(34*SP.sc);
    const { bd, hc } = brickT(seed, x, y, pw, ph);
    let h = 0.50 + 0.30*Math.floor(hc*4)/4;
    let tone = (0.5 + 0.4*hc)*SP.con;
    let em = 0, trimM = 0;
    if(bd < 5){
      /* the webbing: ridged noise veins fill the seams */
      const n = fbmT(seed+31, x, y);
      const vein = Math.pow(1-Math.abs(2*n-1), 5);
      h = 0.30 + vein*0.45;
      tone = 0.35 + vein*0.5;
      if(vein > 0.75) trimM = 0.45;
      if(vein > 0.85) em = SP.gl*0.5;
    } else if(bd < 8){
      h -= 0.10;   /* plate edge chamfer into the web */
    } else if((bd|0) % 9 === 4 && (x+y) % 7 < 2){
      h += 0.10;   /* bolt heads on plate faces */
    }
    return { tone, trimM,
             h: h + (fbmT(seed+3,x,y)-0.5)*0.05, em };
  },
  function quilt(seed, x, y, SP){
    /* padded pressure-quilt: puffed diamonds, cinched
       buttons, seam piping */
    const p = Math.round(40*SP.sc);
    const u = (x+y)/p, v2 = (x-y+CT*4)/p;
    const fu = u-Math.floor(u), fv = v2-Math.floor(v2);
    const puff = Math.sin(fu*Math.PI)*Math.sin(fv*Math.PI);
    const hc = ihash(seed, Math.floor(u), Math.floor(v2));
    const button = fu>0.44 && fu<0.56 && fv>0.44 && fv<0.56;
    return { tone: (0.45+0.4*hc)*(0.7+0.3*puff)*SP.con,
             trimM: (fu<0.05||fv<0.05) ? 0.5 : 0,
             h: 0.30 + puff*0.55 - (button?0.18:0)
                + (fbmT(seed+8,x,y)-0.5)*0.06,
             em: 0 };
  },
],
moknon: [
  function hexcore(seed, x, y, SP){
    /* hex cells w/ glow seams — memory-lattice hull */
    const s = 20*SP.sc;
    const qx = (x*1.1547)/s, qy = (y - x*0.5774)/s;
    const cq = Math.round(qx), cr = Math.round(qy);
    const fx = qx-cq, fy = qy-cr;
    const d = Math.max(Math.abs(fx+fy*0.5)*1.2,
                       Math.abs(fy)*1.1);
    const hc = ihash(seed, cq&1023, cr&1023);
    let em = 0;
    if(d > 0.40 && ihash(seed+3,cq&1023,cr&1023) > 1-0.4*SP.den)
      em = SP.gl*0.7;
    return { tone: (0.5+0.38*hc)*SP.con,
             trimM: hc > 0.92 ? 0.6 : 0,
             h: (d > 0.38 ? 0.32 : 0.55+0.22*hc)
                + (fbmT(seed+4,x,y)-0.5)*0.04,
             em };
  },
  function archivebanks(seed, x, y, SP){
    /* server-bank rows: slotted racks, status-light columns,
       cooling vane sections */
    const rh = Math.round(18*SP.sc);
    const row = Math.floor(y/rh);
    const hb = ihash(seed, row, 3);
    const ly = y%rh;
    let h = 0.52 + 0.2*hb, tone = (0.5+0.35*hb)*SP.con;
    let em = 0;
    if(ly < 2){ h -= 0.18; tone *= 0.6; }
    else if(hb > 0.6 && x % 6 < 3){ h -= 0.08; } /* vanes */
    /* status lights: sparse column of dots */
    const lc = Math.floor(ihash(seed+7,row,1)*24);
    if((x>>3)%24 === lc && ly > 4 && ly < rh-3 && (y%4)<2
       && ihash(seed+9, x>>3, row) > 0.4) em = SP.gl*0.9;
    return { tone, trimM: 0,
             h: h + (fbmT(seed+2,x,y)-0.5)*0.05, em };
  },
],
frik: [
  function scrapquilt(seed, x, y, SP){
    /* mismatched salvage plates from six different wrecks,
       bright weld beads where the grids disagree */
    const g1 = brickT(seed,     x, y, Math.round(42*SP.sc), 32);
    const g2 = brickT(seed+991, x+17, y+41, 36,
        Math.round(26*SP.sc));
    const pick = vnoiseT(seed+55, x, y, 4) > 0.5;
    const g = pick ? g1 : g2;
    let h = 0.45 + 0.35*Math.floor(g.hc*4)/4;
    let tone = (0.55+0.4*g.hc)*(pick?1.25:0.6)*SP.con;
    let trimM = g.hc > 0.9 ? 0.7 : 0;
    if(g.bd < 2){ h -= 0.18; tone *= 0.6; trimM = 0; }
    const edge = Math.abs(vnoiseT(seed+55,x,y,4)-0.5) < 0.02;
    if(edge){ h = Math.min(1,h+0.2); tone = 1.2; }
    return { tone, trimM,
             h: h + (fbmT(seed+3,x,y)-0.5)*0.08, em:0 };
  },
  function hazardrig(seed, x, y, SP){
    /* work-rig hull: hazard chevron bands, oil-stain blooms,
       taped-over seams, stamped serials */
    const pw = Math.round(56*SP.sc);
    const { col, row, bd, hc } = brickT(seed,x,y,pw,38);
    let h = 0.5 + 0.25*hc, tone = (0.5+0.35*hc)*SP.con;
    let trimM = 0;
    if(bd < 2){ h -= 0.15; tone *= 0.6; }
    /* hazard band rows */
    const hb = Math.floor(y/(pw*1.4));
    if(ihash(seed+3,hb,1) > 0.7 && y%(pw*1.4) < 10
       && ((x+y)%20) < 10) trimM = 0.8;
    /* oil bloom */
    const o = fbmT(seed+9, x*1.3, y*1.3);
    if(o > 0.62) tone *= 0.55 + 0.45*(1-(o-0.62)*3);
    if(bd > 4 && hc > 0.85 && (x%pw) > pw*0.6
       && (y%38) < 6) trimM = 0.5;   /* serial stamp */
    return { tone, trimM,
             h: h + (fbmT(seed+3,x,y)-0.5)*0.07, em:0 };
  },
],
salrith: [
  function runefacet(seed, x, y, SP){
    /* obsidian reliquary facets: large dark planes, hairline
       gilt seams, rune-dot constellations that glow */
    const v = voroT(seed, x, y, Math.round(4*SP.sc)||3);
    const hc = ihash(seed, v.id, 5);
    let h = 0.42 + 0.40*Math.floor(hc*4)/4;
    let tone = (0.30+0.35*hc)*SP.con;
    let trimM = 0, em = 0;
    if(v.edge < 0.035){ h -= 0.18; trimM = 0.65; } /* gilt seam */
    /* rune constellation dots on the faces */
    if(v.edge > 0.10){
      const rx = x>>3, ry = y>>3;
      if(ihash(seed+7,rx,ry) > 1-0.06*SP.den
         && (x%8)<3 && (y%8)<3){
        h -= 0.08; em = SP.gl*0.85;
      }
    }
    return { tone, trimM,
             h: h + (fbmT(seed+2,x,y)-0.5)*0.03, em };
  },
  function veilflow(seed, x, y, SP){
    /* silk-veil banding: smooth flowing drapes with glossy
       highlight streaks and pinned gathers */
    const n = vnoiseT(seed, x, y, 3);
    const band = Math.sin((y*0.05 + n*6)*SP.sc + SP.ph);
    const gather = voroT(seed+5, x, y, 5);
    let h = 0.5 + band*0.18;
    let tone = (0.45 + 0.30*band + 0.2*n)*SP.con;
    let trimM = 0;
    if(gather.d1 < 0.08){ h += 0.22; trimM = 0.6; } /* pin */
    else if(gather.d1 < 0.2) h += (0.2-gather.d1)*1.2;
    return { tone, trimM,
             h: h + (fbmT(seed+4,x,y)-0.5)*0.04,
             em: 0 };
  },
],
veelow: [
  function leafvein(seed, x, y, SP){
    /* ridged-noise veins over smooth flesh-metal — sap
       glows through the thickest channels */
    const n = fbmT(seed, x, y);
    const vein = Math.pow(1-Math.abs(2*n-1), 6);
    const n2 = fbmT(seed+77, x+31, y+57);
    return { tone: (0.5+0.35*n2 + vein*0.3)*SP.con,
             trimM: vein > 0.75 ? 0.5 : 0,
             h: 0.35 + 0.3*n2 + vein*0.35,
             em: vein > 0.85 ? SP.gl*0.5 : 0 };
  },
  function featherlap(seed, x, y, SP){
    /* lapped feather rows: pointed vanes w/ center quills,
       iridescent tips */
    const fh = Math.round(16*SP.sc), fw = Math.round(22*SP.sc);
    const row = Math.floor(y/fh);
    const off = (row%2)*fw/2;
    const col = Math.floor((x+off)/fw);
    const lx = Math.abs(((x+off)%fw) - fw/2)/(fw/2);
    const ly = (y%fh)/fh;
    const vane = Math.max(0, 1-lx-ly*0.8);
    const hc = ihash(seed, col, row);
    return { tone: (0.45+0.4*hc)*(0.7+0.3*vane)*SP.con,
             trimM: vane > 0.05 && vane < 0.14 && hc > 0.55
                 ? 0.55 : 0,
             h: 0.3 + vane*0.55 + (lx<0.08?0.12:0)
                + (fbmT(seed+6,x,y)-0.5)*0.06,
             em: 0 };
  },
],
epowat: [
  function duneplate(seed, x, y, SP){
    /* wind-rippled sand-cast plates: dune banding w/ crest
       lips, blasted-smooth faces */
    const n = vnoiseT(seed, x, y, 4);
    const dw = Math.round(14*SP.sc);
    const c = (y + n*22) % dw;
    const band = Math.floor((y + n*22)/dw);
    const hb = ihash(seed, band, 3);
    let h = 0.45 + 0.25*hb + (c/dw)*0.22;
    let tone = (0.5 + 0.38*hb)*SP.con;
    if(c < 1.6){ h -= 0.18; tone *= 0.8; }  /* slip face */
    return { tone, trimM: hb > 0.9 ? 0.4 : 0,
             h: h + (fbmT(seed+5,x,y)-0.5)*0.05, em:0 };
  },
  function saltblock(seed, x, y, SP){
    /* mineral block masonry: huge courses, chisel marks,
       crusted efflorescence in the joints */
    const pw = Math.round(78*SP.sc), ph = Math.round(44*SP.sc);
    const { bd, hc, lx } = brickT(seed, x, y, pw, ph);
    let h = 0.55 + 0.2*hc, tone = (0.55+0.3*hc)*SP.con;
    if(bd < 3){
      h -= 0.16; tone *= 0.75;
      /* salt crust sparkle in joints */
      if(ihash(seed+7, x, y) > 0.92) tone = 1.1;
    } else if(lx % 9 < 1.2) h -= 0.05;   /* chisel drag */
    return { tone, trimM: 0,
             h: h + (fbmT(seed+3,x,y)-0.5)*0.07, em:0 };
  },
],
pogfrot: [
  function gildscallop(seed, x, y, SP){
    /* palace hull: scalloped shingles with gilded rims and
       jewel studs at the crowns */
    const sh2 = Math.round(24*SP.sc), sw = Math.round(34*SP.sc);
    const row = Math.floor(y/sh2);
    const off = (row%2)*sw/2;
    const col = Math.floor((x+off)/sw);
    const lx = ((x+off)%sw - sw/2)/(sw/2);
    const ly = (y%sh2)/sh2;
    const arc = Math.sqrt(Math.max(0, 1-lx*lx));
    const prof = Math.max(0, arc-ly);
    const hc = ihash(seed, col, row);
    const rim = prof > 0.02 && prof < 0.10;
    const jewel = Math.abs(lx) < 0.12 && ly < 0.2
        && ihash(seed+5,col,row) > 0.55;
    return { tone: (0.5+0.4*hc*(0.6+0.4*prof))*SP.con,
             trimM: rim ? 0.75 : 0,
             h: 0.25 + prof*0.6 + (jewel?0.15:0),
             em: jewel ? SP.gl*0.7 : 0 };
  },
  function brocade(seed, x, y, SP){
    /* royal brocade: diamond lattice piping, alternating
       satin/velvet fields, pearl dots at crossings */
    const p = Math.round(30*SP.sc);
    const u = (x+y)/p, v2 = (x-y+CT*4)/p;
    const fu = u-Math.floor(u), fv = v2-Math.floor(v2);
    const pipe = Math.min(fu, 1-fu, fv, 1-fv) < 0.07;
    const fieldH = ihash(seed, Math.floor(u), Math.floor(v2));
    const pearl = fu < 0.10 && fv < 0.10;
    return { tone: (0.45+0.4*fieldH)*(pipe?1.25:1.0)*SP.con,
             trimM: pipe ? 0.6 : 0,
             h: 0.45 + (pipe?0.22:0) + (pearl?0.14:0)
                + (fieldH-0.5)*0.1
                + (fbmT(seed+8,x,y)-0.5)*0.04,
             em: pearl && fieldH > 0.6 ? SP.gl*0.4 : 0 };
  },
],
};

function hueRotJS(c, a){
  const cs = Math.cos(a), sn = Math.sin(a), k = 0.57735;
  const dx = k*(c[2]-c[1]), dy = k*(c[0]-c[2]),
        dz = k*(c[1]-c[0]);
  const d = k*k*(c[0]+c[1]+c[2])*(1-cs);
  return [ c[0]*cs + dx*sn + d,
           c[1]*cs + dy*sn + d,
           c[2]*cs + dz*sn + d ];
}

function genSurface(race, seed, tier){
  const G = mkGen(seed);
  /* RACE-LOCKED skins: the bank belongs to this race alone.
     Rolled settings (SP) give each algo a wide family of
     looks, so repaint stays ON-BRAND instead of iffy. */
  const bank = RACE_SKINS[race.key];
  const ai = G.ri(0, bank.length-1);
  const skinA = bank[ai];
  const SPa = rollSkin(G);
  /* MULTI-PASS: blend a second algo FROM THE SAME RACE over
     the first through a big quantized mask — hybrid skins
     with zero cross-race bleed */
  const mixOn = G.chance(0.4) && bank.length > 1;
  const skinB = bank[(ai+1) % bank.length];
  const SPb = rollSkin(G);
  const s2 = (seed ^ 0x5f356495) >>> 0;
  const s3 = (seed ^ 0x9e3779b9) >>> 0;
  const alb = new Uint8Array(TS*TS*4);
  const mtx = new Uint8Array(TS*TS*4);
  const paintPh = G.ri(0,999);
  const doTraces = race.traces;
  const prism = race.key === "cylmis";
  const baseMetal = race.form ? 0.9 : 0.75;
  const c2t = CT/TS;   /* pixel -> canonical algo space */
  for(let y=0;y<TS;y++){
    for(let x=0;x<TS;x++){
      const cx2 = x*c2t, cy2 = y*c2t;
      let t = skinA(s2, cx2, cy2, SPa);
      if(mixOn){
        const mk = vnoiseT(s3+321,
            Math.floor(cx2/8)*8, Math.floor(cy2/8)*8, 2);
        if(mk > 0.62) t = skinB(s3, cx2, cy2, SPb);
      }
      t.tone = Math.max(0, Math.min(1, t.tone*0.82));
      t.trimM = Math.min(t.trimM||0, 0.8);
      /* secondary paint: skins may supply a HARD panel-aligned
         mask (pm); fall back to cell-quantized patches */
      let painted;
      if(t.pm !== undefined){
        painted = t.pm > 0.5 && t.trimM === 0;
      } else {
        const pmv = vnoiseT(s2+paintPh,
            Math.floor(cx2/16)*16, Math.floor(cy2/16)*16, 4);
        painted = pmv > 0.56 && t.trimM === 0;
      }
      /* MULTI-COLOR SCHEME: base ramp dark->hull, but some
         32px blocks ramp toward the SHOT color family — no
         race reads mono-colored. Painted blocks use the
         paint color; trim overrides both. */
      const shotP = !painted && t.trimM === 0
          && ihash(s2+91, Math.floor(cx2/32),
                   Math.floor(cy2/32)) > 0.84;
      const c1 = shotP ? race.shot : race.hull;
      let r = race.dark[0]+(c1[0]-race.dark[0])*t.tone;
      let g = race.dark[1]+(c1[1]-race.dark[1])*t.tone;
      let b = race.dark[2]+(c1[2]-race.dark[2])*t.tone;
      if(painted){
        const pt = 0.35+0.65*t.tone;
        r = race.paint[0]*pt; g = race.paint[1]*pt;
        b = race.paint[2]*pt;
      }
      if(t.trimM > 0){
        r = r+(race.trim[0]-r)*t.trimM;
        g = g+(race.trim[1]-g)*t.trimM;
        b = b+(race.trim[2]-b)*t.trimM;
      }
      /* PRISMATIC race: saturate toward trim first (hue
         rotation of grey is grey), then sweep hue across
         the surface and with height — crystal refraction */
      if(prism){
        const sat = 0.55*t.tone;
        const pr2 = r+(race.trim[0]-r)*sat;
        const pg2 = g+(race.trim[1]-g)*sat;
        const pb2 = b+(race.trim[2]-b)*sat;
        const hr = hueRotJS([pr2,pg2,pb2],
            ((x+y)/TS)*4.2 + t.h*2.5);
        r = Math.max(0,hr[0]); g = Math.max(0,hr[1]);
        b = Math.max(0,hr[2]);
      }
      let em = t.em;
      /* truchet glow traces for the machine-lattice races.
         INTEGRATED, not overlaid: the trace is carved as a
         groove into the height field and its floor darkened,
         so in daylight it reads as an etched channel and at
         night the channel is what lights up. */
      if(doTraces){
        const tw = 32;
        const tx0 = Math.floor(x/tw), ty0 = Math.floor(y/tw);
        if(ihash(s2+41, tx0, ty0) < 0.4){
          const fx = (x%tw)/tw, fy = (y%tw)/tw;
          const flip = ihash(s2+43, tx0, ty0) > 0.5;
          const dT = Math.abs(flip ? fx+fy-1 : fx-fy)*1.414;
          if(dT < 0.13){
            t.h = Math.max(0, t.h - 0.14*(1 - dT/0.13));
            r *= 0.55; g *= 0.55; b *= 0.55;
            if(dT < 0.08) em = Math.max(em, 0.65);
          }
        }
      }
      const i = (y*TS+x)*4;
      alb[i]   = Math.min(255, r*255)|0;
      alb[i+1] = Math.min(255, g*255)|0;
      alb[i+2] = Math.min(255, b*255)|0;
      alb[i+3] = Math.max(0, Math.min(255, t.h*255))|0;
      mtx[i]   = Math.min(255, em*255)|0;
      mtx[i+1] = (baseMetal*(painted?0.35:1)*255)|0;
      mtx[i+2] = ((0.35+0.35*(1-t.tone))*255)|0;
      mtx[i+3] = em > 0.01 ? (((cx2+cy2)%CT)/CT*255)|0 : 0;
    }
  }
  surfaceFX(alb, mtx, G, race, seed);
  return { alb, mtx, recipe: {
    raceKey: race.key,
    raceName: race.name,
    seed: seed >>> 0,
    tier: tier | 0,
    algorithms: [skinA.name || "skinA"].concat(
      mixOn ? [skinB.name || "skinB"] : []),
    hybrid: mixOn
  } };
}

/* ── EFFECT-AWARE POST-PASS ──────────────────────────────
   The baked maps are DESIGNED for the renderer's features
   instead of hoping they line up:
   1. PLATEAU TERRACING — height snaps toward flat steps
      with sharp walls. POM reads stepped plates far better
      than smooth noise.
   2. CANYON GLOW — emission is laid INTO height valleys:
      by day a dark etched channel, by night (shadow side)
      a lit lightning-band. Phase runs along the channel so
      pulses travel it.
   3. FRAMED VIEWPORTS — stamped windows: raised ROUGH
      organic frame, recessed SMOOTH glass interior with
      high metal (env-mirror), some lit from inside. One
      texture, three material stories. */
function surfaceFX(alb, mtx, G, race, seed){
  const N = TS;
  const hbuf = new Float32Array(N*N);
  for(let i=0;i<N*N;i++) hbuf[i] = alb[i*4+3]/255;
  const HH = (x,y) => hbuf[((y+N)%N)*N + ((x+N)%N)];
  const glowDen = race.form ? 0.26 : 0.09;
  const sV = (seed ^ 0x1234abcd) >>> 0;
  const st = Math.max(1, Math.round(N/256*3));
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      const i = y*N+x, i4 = i*4;
      const h = hbuf[i];
      /* 1. terracing (keep 65% original so curves survive) */
      let h2 = h*0.65 + Math.round(h*5)/5*0.35;
      /* 2. canyon glow: below the local mean = in a groove */
      const bl = (HH(x-st,y)+HH(x+st,y)+HH(x,y-st)+HH(x,y+st))/4;
      const valley = (bl - h)*4.0 - 0.10;
      if(valley > 0){
        const gate = ihash(sV, x>>4, y>>4) < glowDen;
        if(gate){
          const em = Math.min(0.8, valley*1.0);
          if(em*230 > mtx[i4]){
            mtx[i4] = (em*230)|0;
            mtx[i4+3] = (((x+y)%96)/96*255)|0;
          }
        }
        alb[i4]   = (alb[i4]  *0.80)|0;
        alb[i4+1] = (alb[i4+1]*0.80)|0;
        alb[i4+2] = (alb[i4+2]*0.80)|0;
      }
      alb[i4+3] = Math.max(0, Math.min(255, h2*255))|0;
    }
  }
  /* 3. framed viewports */
  const nWin = G.chance(0.8) ? G.ri(2,5) : 0;
  for(let w2=0; w2<nWin; w2++){
    const ww = Math.round(N*G.r(0.05,0.11));
    const wh = Math.round(N*G.r(0.035,0.07));
    const x0 = G.ri(0, N-1), y0 = G.ri(0, N-1);
    const rim = Math.max(2, Math.round(N/256*3));
    const lit = G.chance(0.5);
    const oct = G.chance(0.5);   /* octagon corner clip */
    for(let dy=0; dy<wh; dy++){
      for(let dx=0; dx<ww; dx++){
        if(oct){
          const cx3 = Math.min(dx, ww-1-dx);
          const cy3 = Math.min(dy, wh-1-dy);
          if(cx3+cy3 < rim*2) continue;
        }
        const px = (x0+dx)%N, py = (y0+dy)%N;
        const i4 = (py*N+px)*4;
        const onRim = dx < rim || dx >= ww-rim
                   || dy < rim || dy >= wh-rim;
        if(onRim){
          /* rough organic frame, raised */
          alb[i4+3] = Math.min(255, alb[i4+3]+56);
          mtx[i4+1] = 40;   /* metal low  */
          mtx[i4+2] = 225;  /* rough high */
          const wob = ihash(sV+7, px, py);
          alb[i4]   = (alb[i4]  *(0.55+0.3*wob))|0;
          alb[i4+1] = (alb[i4+1]*(0.55+0.3*wob))|0;
          alb[i4+2] = (alb[i4+2]*(0.55+0.3*wob))|0;
        } else {
          /* smooth glass: recessed, mirror-metal, near-zero
             rough — env reflection does the rest */
          alb[i4+3] = Math.max(0, alb[i4+3]-30);
          alb[i4]   = (alb[i4]*0.16 + 10)|0;
          alb[i4+1] = (alb[i4+1]*0.16 + 14)|0;
          alb[i4+2] = (alb[i4+2]*0.16 + 24)|0;
          mtx[i4+1] = 242;  /* metal high */
          mtx[i4+2] = 10;   /* rough near zero */
          if(lit){
            mtx[i4]   = Math.max(mtx[i4], 96);
            mtx[i4+3] = ((dx/ww)*160)|0;
          }
        }
      }
    }
  }
  /* 4. BEVEL PASS: one soft blur on the height channel.
     1-texel cliffs alias into stair-steps under the relief
     march; rounded shoulders are what make reference POM
     (cobblestones, brick) read as solid geometry. */
  {
    const hb2 = new Float32Array(N*N);
    for(let i=0;i<N*N;i++) hb2[i] = alb[i*4+3];
    const W2 = (x,y) => hb2[((y+N)%N)*N + ((x+N)%N)];
    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        const c = hb2[y*N+x];
        const av = (W2(x-1,y)+W2(x+1,y)+W2(x,y-1)+W2(x,y+1)
                  + W2(x-1,y-1)+W2(x+1,y-1)
                  + W2(x-1,y+1)+W2(x+1,y+1))/8;
        alb[(y*N+x)*4+3] = (c*0.45 + av*0.55)|0;
      }
    }
  }
}

/* ==================== INFINITEXTURE PUBLIC API ====================
   This is the single procedural-material doorway for game and lab.
   Artifact surfaces begin with the authentic race bake, then receive
   a deterministic archaeological finish driven by specimen DNA and
   surface slot. Unknown races fail loudly; Human is never a fallback. */

// BEGIN GENERATED SURFACE MATH / c2ec2291e5dda8d1762bf2440daa9aa4d0c5d78f4d9495fc6a6f97285cd96287
const SurfaceSourceSha256="c2ec2291e5dda8d1762bf2440daa9aa4d0c5d78f4d9495fc6a6f97285cd96287";
// Canonical physical finish fields for the EXISTING InfiniTexture bake.
// Eight distinct material grammars, not eight tints. Periodic object UVs;
// channels: height / secondary pigment / edge wear / roughness. Bake-time only.
function SurfaceFrac(x){return x-Math.floor(x);}
function SurfaceMix(a,b,t){return a+(b-a)*t;}
function SurfaceHash(x,y,seed){
    let n=Math.floor(x)*37.0+Math.floor(y)*113.0+seed;
    n-=Math.floor(n/4096.0)*4096.0;
    // Power-of-two reductions keep every integer exact on C#/Metal/JS.
    // Fold high bits back into low bits before the next quadratic mix.
    n=n*n+173.0;let high=Math.floor(n/4096.0);n=n-high*4096.0+high*13.0;
    n-=Math.floor(n/4096.0)*4096.0;
    n=n*n+89.0;high=Math.floor(n/4096.0);n=n-high*4096.0+high*29.0;
    n-=Math.floor(n/4096.0)*4096.0;return n/4096.0;
}
function SurfaceNoise(u,v,seed,cells){
    let x=u*cells,y=v*cells,ix=Math.floor(x),iy=Math.floor(y);
    let fx=SurfaceFrac(x),fy=SurfaceFrac(y);
    fx=fx*fx*(3.0-2.0*fx);fy=fy*fy*(3.0-2.0*fy);
    let xx=ix-Math.floor(ix/cells)*cells,yy=iy-Math.floor(iy/cells)*cells;
    let xn=xx+1.0-Math.floor((xx+1.0)/cells)*cells;
    let yn=yy+1.0-Math.floor((yy+1.0)/cells)*cells;
    return SurfaceMix(SurfaceMix(SurfaceHash(xx,yy,seed),SurfaceHash(xn,yy,seed),fx),
        SurfaceMix(SurfaceHash(xx,yn,seed),SurfaceHash(xn,yn,seed),fx),fy);
}
function SurfacePattern(u,v,slot,seed,living,channel){
    let pi=3.14159265359;
    let fine=SurfaceNoise(u,v,seed+43.0,64.0);
    let slow=SurfaceNoise(u,v,seed+71.0,8.0);
    let h=.50,pigment=0.0,wear=0.0,rough=.50;
    if(slot==0.0){ // directional brushed alloy / dermal growth fibers
        let grain=.5+.5*Math.sin(u*128.0*pi+Math.sin(v*8.0*pi)*1.2);
        let pore=Math.max(0.0,(fine-.72)*3.0);
        h=.48+grain*.055-pore*.09;pigment=slow*.20;
        wear=pore;rough=.23+grain*.19+slow*.10+living*.24;
    }else if(slot==1.0){ // enamel/ceramic islands / overlapping keratin scutes
        let row=Math.floor(v*8.0),fx=SurfaceFrac(u*8.0+SurfaceFrac(row*.5)*.5),fy=SurfaceFrac(v*8.0);
        let seam=Math.min(Math.min(fx,1.0-fx),Math.min(fy,1.0-fy));
        let edge=Math.max(0.0,1.0-seam/.055);
        let chip=edge*Math.max(0.0,(fine-.38)*1.6);
        h=.59-edge*.27-chip*.11;pigment=chip*.70;
        wear=edge*.65;rough=.25+edge*.45+slow*.10;
    }else if(slot==2.0){ // machined bearing grooves / porous cartilage
        let ring=Math.abs(Math.sin((u*20.0+v*4.0)*pi));
        let pore=Math.max(0.0,(fine-.54)*2.1);
        h=.51-ring*.10-pore*living*.20;
        pigment=ring*.22+pore*.65;wear=Math.pow(ring,10.0)*.7;
        rough=.18+slow*.16+pore*.35+living*.18;
    }else if(slot==3.0){ // dark optical glass with embedded conductor junctions
        let fx=SurfaceFrac(u*6.0),fy=SurfaceFrac(v*6.0);
        let conductorDist=Math.min(Math.abs(fx-.5),Math.abs(fy-.5));
        let route=Math.max(0.0,1.0-conductorDist/.025);
        let node=Math.max(0.0,1.0-Math.sqrt((fx-.5)*(fx-.5)+(fy-.5)*(fy-.5))/.11);
        h=.44+route*.07+node*.08;pigment=Math.max(route,node);
        wear=fine*.03;rough=.08+slow*.07;
    }else if(slot==4.0){ // textile warp/weft / collagen weave
        let warp=.5+.5*Math.sin(u*48.0*pi),weft=.5+.5*Math.sin(v*48.0*pi);
        let over=SurfaceFrac(Math.floor(u*24.0)*.5+Math.floor(v*24.0)*.5);
        h=.42+SurfaceMix(warp,weft,over)*.16;
        pigment=SurfaceMix(warp,weft,1.0-over)*.34;
        wear=Math.max(0.0,(fine-.7)*1.2);rough=.73+slow*.16;
    }else if(slot==5.0){ // oxidation, mineral accretion / lichen colonies
        let cell=SurfaceNoise(u,v,seed+173.0,16.0);
        let boundary=Math.abs(cell-.49);
        let crack=Math.max(0.0,1.0-boundary/.035);
        h=.47+slow*.18-crack*.19;
        pigment=Math.min(1.0,Math.max(0.0,(slow-.32)*2.3));
        wear=crack*.75;rough=.58+pigment*.26;
    }else if(slot==6.0){ // carbon lamellae, gaskets / layered chitin
        let groove=Math.pow(.5+.5*Math.sin(v*32.0*pi+Math.sin(u*4.0*pi)*.5),6.0);
        let fiber=.5+.5*Math.sin((u+v)*96.0*pi);
        h=.52-groove*.20+fiber*.025;
        pigment=groove*.55;wear=(1.0-groove)*fine*.18;
        rough=.39+groove*.22+living*.15;
    }else{ // polished opaline mineral / translucent sensory nacre
        let growth=.5+.5*Math.sin((u*4.0+v*6.0+slow*.8)*pi);
        h=.46+growth*.10+fine*.025;pigment=growth;
        wear=fine*.035;rough=.13+slow*.16;
    }
    if(channel==0.0)return Math.min(1.0,Math.max(0.0,h));
    if(channel==1.0)return Math.min(1.0,Math.max(0.0,pigment));
    if(channel==2.0)return Math.min(1.0,Math.max(0.0,wear));
    return Math.min(1.0,Math.max(0.0,rough));
}

// END GENERATED SURFACE MATH

const INFINITEXTURE_VERSION = "4.0.0-material-grammar";
const ARTIFACT_FINISHES = [
  "GLYPH INLAY",
  "RESONANCE RINGS",
  "STAR MAP",
  "BURIAL CRAQUELURE",
  "CEREMONIAL WEAVE",
  "PHASE FILAMENT"
];

function infiniRaceToken(v){
  return String(v == null ? "" : v).toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Explicit prototype culture registration. Keeps the native 15-entry race ABI
// untouched; adds no alternate engine and accepts data, never shader source.
const INFINI_CULTURES=new Map();
const INFINI_CULTURE_KEYS=['cylvix','dimnar','harkellinia','khaodra','mooshee','niyette','ooope','ornyon','upatamerae','voolgard','wisperala'];
function CulturePattern(key,x,y,seed){
 const u=x/256,v=y/256,pi=Math.PI,n=SurfaceNoise(u,v,seed&4095,32),slow=SurfaceNoise(u,v,seed&4095,6);
 let h=.5,route=0;
 switch(key){
 case 'cylvix':{const a=Math.abs(Math.sin((u+v)*pi*8)),b=Math.abs(Math.sin((u-v)*pi*8));h=.48+Math.min(a,b)*.3;route=Math.pow(1-Math.min(a,b),18);break;}
 case 'dimnar':{const seam=Math.min(SurfaceFrac(u*7),SurfaceFrac(v*4));h=.65-Math.exp(-seam*45)*.34;route=SurfaceFrac(v*4)>.92?1:0;break;}
 case 'harkellinia':{const tri=Math.abs(SurfaceFrac((u+v*.5)*9)-.5),rib=Math.abs(Math.sin(v*pi*9));h=.3+tri*.6+rib*.12;route=Math.pow(rib,28);break;}
 case 'khaodra':{const vein=Math.abs(Math.sin((u*7+Math.sin(v*pi*4)*.25)*pi));h=.35+vein*.35+n*.1;route=Math.pow(1-vein,12);break;}
 case 'mooshee':{const hypha=Math.abs(Math.sin(u*pi*12+Math.sin(v*pi*6)*3));h=.32+hypha*.3+slow*.15;route=Math.pow(1-hypha,7);break;}
 case 'niyette':{const rings=Math.abs(Math.sin(Math.hypot(u-.5,v-.5)*pi*28));h=.48+rings*.13;route=Math.pow(1-rings,16);break;}
 case 'ooope':{const flow=.5+.5*Math.sin(v*pi*10+Math.sin(u*pi*4)*1.8);h=.35+flow*.35+slow*.15;route=Math.pow(flow,14)*.5;break;}
 case 'ornyon':{const stem=Math.abs(Math.sin((u*8+Math.sin(v*pi*2))*pi)),leaf=Math.abs(Math.sin((u*16+v*9)*pi));h=.3+stem*.25+leaf*.15;route=Math.pow(1-stem,14);break;}
 case 'upatamerae':{const wave=.5+.5*Math.cos((u-.5)*pi*8)*Math.sin(v*pi*8);h=.4+wave*.26;route=Math.pow(wave,11);break;}
 case 'voolgard':{const sig=Math.min(Math.abs(Math.sin((u+v)*pi*6)),Math.abs(Math.sin((u-v)*pi*6)));h=.6-Math.pow(1-sig,12)*.3;route=Math.pow(1-sig,26)*.35;break;}
 case 'wisperala':{const row=Math.floor(v*9),a=SurfaceFrac(u*8+row*.5)-.5,b=SurfaceFrac(v*9)-.5,d=Math.max(Math.abs(a)*.866+Math.abs(b)*.5,Math.abs(b));h=.34+Math.max(0,1-d*2)*.3;route=Math.exp(-Math.abs(d-.4)*85);break;}
 default:throw Error('No culture surface grammar '+key);
 }
 return {h:Math.max(0,Math.min(1,h)),route,rough:.22+slow*.24+n*.12};
}
function registerInfiniCulture(c){
 if(!c||!INFINI_CULTURE_KEYS.includes(c.key)||![c.base,c.accent,c.glow].every(v=>/^#[a-f0-9]{6}$/i.test(v)))throw Error('Invalid prototype culture data');
 const race={key:c.key,name:String(c.name),form:['mooshee','ooope','ornyon','upatamerae','wisperala','khaodra'].includes(c.key)?1:0,hull:hex(c.base),paint:hex(c.base),trim:hex(c.accent),glow:hex(c.glow),shot:hex(c.glow),dark:hex(c.base).map(v=>v*.24),archs:['culture-study'],skins:[c.texture],irid:.25,traces:true,prototype:true};
 INFINI_CULTURES.set(c.key,race);
 RACE_SKINS[c.key]=[function cultureSkin(seed,x,y,SP){const p=CulturePattern(c.key,x,y,seed);return {tone:p.h,trimM:p.route,emiss:p.route,height:p.h,rough:p.rough};}];
 Object.defineProperty(RACE_SKINS[c.key][0],'name',{value:'culture_'+c.key});
 return race;
}
function resolveInfiniRace(ref){
  if(ref && typeof ref === "object"){
    const named = ref.raceKey || ref.key || ref.race || ref.name;
    if(named !== undefined && String(named).trim()) return resolveInfiniRace(named);
    const indexed = ref.raceIdx !== undefined ? ref.raceIdx : ref.index;
    if(indexed !== undefined) return resolveInfiniRace(indexed);
  }
  if(typeof ref === "number" && Number.isFinite(ref)){
    const idx = Math.floor(ref);
    if(idx >= 0 && idx < ROSTER.length) return ROSTER[idx];
    throw new Error("InfiniTexture race index out of range: " + ref);
  }
  const token = infiniRaceToken(ref);
  if(INFINI_CULTURES.has(token))return INFINI_CULTURES.get(token);
  for(let i=0;i<ROSTER.length;i++){
    if(infiniRaceToken(ROSTER[i].key) === token
        || infiniRaceToken(ROSTER[i].name) === token) return ROSTER[i];
  }
  throw new Error("InfiniTexture unknown race: " + String(ref));
}

function infiniResolution(value){
  const n = Math.floor(Number(value === undefined ? 256 : value));
  if(!Number.isFinite(n) || n < 16 || n > 2048)
    throw new Error("InfiniTexture resolution must be 16..2048: " + value);
  return n;
}

function infiniDnaValue(dna, i, fallback){
  const v = dna && Number(dna[i]);
  return Number.isFinite(v) ? v : fallback;
}

function infiniDnaHash(dna){
  let h = 2166136261 >>> 0;
  const n = dna && dna.length ? Math.min(32, dna.length) : 0;
  for(let i=0;i<n;i++){
    const q = Math.round((Number(dna[i]) || 0) * 100000) | 0;
    h ^= q; h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function describeArtifactSurface(options){
  options = options || {};
  const race = resolveInfiniRace(options.race);
  const seed = Number(options.seed) >>> 0;
  const slot = Math.max(0, Math.floor(Number(options.slot) || 0));
  const sig = infiniDnaHash(options.dna);
  const finishRoll = (seed ^ Math.imul(slot + 1, 0x9e3779b1) ^ sig) >>> 0;
  return {
    version: INFINITEXTURE_VERSION,
    kind: "artifact",
    raceKey: race.key,
    raceName: race.name,
    seed: seed,
    tier: Math.max(0, Math.floor(Number(options.tier) || 0)),
    slot: slot,
    finishIndex: finishRoll % ARTIFACT_FINISHES.length,
    finish: ARTIFACT_FINISHES[finishRoll % ARTIFACT_FINISHES.length],
    dnaSignature: ("00000000" + sig.toString(16)).slice(-8)
  };
}

function applyArtifactFinish(alb, mtx, race, recipe, dna){
  const N = Math.round(Math.sqrt(alb.length / 4));
  const seed = (recipe.seed ^ Math.imul(recipe.slot + 11, 0x85ebca6b)) >>> 0;
  const glyphs = Math.max(3, Math.min(17,
    Math.round(infiniDnaValue(dna, 5, 7))));
  const density = 4 + Math.floor(infiniDnaValue(dna, 13, 8)) % 15;
  const strength = Math.max(0.35, Math.min(1.45,
    0.5 + infiniDnaValue(dna, 30, 0.5) * 0.62
      + recipe.tier * 0.08));
  const phase = infiniDnaValue(dna, 25, 0) + recipe.slot * 1.618;
  const tau = Math.PI * 2;
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      const u=x/N, v=y/N, cx=x*CT/N, cy=y*CT/N;
      let mark=0, cut=0, pulse=0;
      if(recipe.finishIndex === 0){
        const row=Math.floor(v*glyphs), local=(v*glyphs)-row;
        const code=Math.abs(Math.sin(tau*(u*(2+(row%5))+phase)
          +ihash(seed,row,recipe.slot)*tau));
        mark=(local>0.34&&local<0.62&&code>0.82)?1:0;
        cut=(local>0.31&&local<0.66&&code>0.72)?1:0;
      } else if(recipe.finishIndex === 1){
        const tx=Math.sin(tau*u), ty=Math.sin(tau*v);
        const rr=Math.sqrt(tx*tx+ty*ty);
        const wave=Math.abs(Math.sin(rr*(8+density*0.55)+phase));
        mark=wave>0.86?1:0; cut=wave>0.75?1:0;
      } else if(recipe.finishIndex === 2){
        const cells=8+density, gx=Math.floor(u*cells), gy=Math.floor(v*cells);
        const fx=u*cells-gx-0.5, fy=v*cells-gy-0.5;
        const star=ihash(seed,gx,gy);
        const rr=Math.sqrt(fx*fx+fy*fy);
        mark=star>0.80&&rr<0.11+(star-0.8)*0.38?1:0;
        const route=Math.abs(Math.sin(
          (u*(3+glyphs%4)+v*(5+density%5))*tau+phase));
        cut=route>0.965?0.72:mark;
      } else if(recipe.finishIndex === 3){
        const cell=voroT(seed,cx,cy,6+density%9);
        cut=Math.max(0,Math.min(1,(0.115-cell.edge)*13));
        mark=cut*cut*(ihash(seed+19,x>>3,y>>3)>0.58?1:0.35);
      } else if(recipe.finishIndex === 4){
        const a=Math.abs(Math.sin(
          (u*(4+glyphs%7)+v*(3+density%6))*tau+phase));
        const b=Math.abs(Math.sin(
          (u*(5+density%5)-v*(4+glyphs%6))*tau-phase));
        mark=(a>0.91||b>0.91)?1:0;
        cut=Math.max(a,b)>0.82?0.72:0;
      } else {
        const bend=(fbmT(seed,cx,cy)-0.5)*1.9;
        const f=Math.abs(Math.sin(
          tau*(u*(3+density%8)+bend+phase)));
        mark=f>0.91?1:0; cut=f>0.78?(f-0.78)/0.22:0;
        pulse=0.5+0.5*Math.sin(tau*v*(2+glyphs%5)+phase);
      }
      const pat=Math.max(0,Math.min(1,mark*strength));
      const groove=Math.max(0,Math.min(1,cut*strength));
      const i=(y*N+x)*4;
      const dust=(fbmT(seed+71,cx,cy)-0.5)*0.12;
      const accent=recipe.finishIndex===3?race.dark:race.trim;
      const blend=pat*(recipe.finishIndex===3?0.32:0.68);
      alb[i]=Math.max(0,Math.min(255,
        alb[i]*(1-blend)+(accent[0]*255+dust*255)*blend));
      alb[i+1]=Math.max(0,Math.min(255,
        alb[i+1]*(1-blend)+(accent[1]*255+dust*255)*blend));
      alb[i+2]=Math.max(0,Math.min(255,
        alb[i+2]*(1-blend)+(accent[2]*255+dust*255)*blend));
      alb[i+3]=Math.max(0,Math.min(255,alb[i+3]-groove*34+pat*18));
      mtx[i]=Math.max(mtx[i],Math.round(255*pat*(0.42+0.38*pulse)));
      mtx[i+1]=Math.round(mtx[i+1]*(1-pat*0.25)
        +(race.form?110:238)*pat*0.25);
      mtx[i+2]=Math.round(mtx[i+2]*(1-groove*0.4)
        +(recipe.finishIndex===3?235:42)*groove*0.4);
      if(pat>0.05) mtx[i+3]=Math.round(255*((u+v*0.71+phase)%1));
    }
  }
}

function generateInfiniShipSurface(options){
  options = options || {};
  const race = resolveInfiniRace(options.race);
  const resolution = infiniResolution(options.resolution);
  const oldTS = TS;
  try{
    TS = resolution;
    const out = genSurface(race, Number(options.seed) >>> 0,
      Math.max(0, Math.floor(Number(options.tier) || 0)));
    out.recipe.version = INFINITEXTURE_VERSION;
    out.recipe.kind = "ship";
    out.recipe.resolution = resolution;
    return out;
  } finally { TS = oldTS; }
}

const MATERIAL_PROFILES = [
  "BRUSHED ALLOY / DERMAL FIBERS", "CHIPPED ENAMEL / KERATIN SCUTES",
  "BEARING BRONZE / POROUS CARTILAGE", "OPTICAL GLASS / FLUID CIRCUITS",
  "WOVEN INSULATOR / COLLAGEN", "OXIDE ACCRETION / LICHEN",
  "CARBON LAMELLAE / CHITIN", "OPALINE INLAY / SENSORY NACRE"
];
function generateInfiniMaterialSurface(options){
  options=options||{};
  const slot=Number(options.slot===undefined?0:options.slot);
  if(!Number.isInteger(slot)||slot<0||slot>7)throw Error("InfiniTexture material slot must be0..7");
  const race=resolveInfiniRace(options.race),seed=Number(options.seed)>>>0;
  const out=generateInfiniShipSurface(options),N=out.recipe.resolution;
  const mix=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t);
  const a=[mix(race.hull,[.36,.42,.48],.34),race.paint,
    mix(race.dark,[.31,.16,.075],.65),mix(race.dark,[.035,.07,.10],.6),
    mix(race.hull,[.16,.12,.09],.6),mix(race.paint,[.12,.29,.23],.65),
    mix(race.dark,[.095,.11,.14],.6),mix(race.paint,[.17,.13,.30],.5)][slot];
  const z=[mix(race.hull,[.77,.81,.82],.55),[.76,.77,.67],
    mix(race.trim,[.76,.46,.17],.55),race.glow,
    mix(race.trim,[.77,.65,.43],.5),[.58,.25,.095],
    mix(race.hull,[.48,.55,.62],.45),race.shot][slot];
  const metal=[.84,.07,.91,.18,.02,.16,.48,.12][slot]*(race.form?.14:1);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const u=x/N,v=y/N,i=(y*N+x)*4,s=seed&4095;
    const h=SurfacePattern(u,v,slot,s,race.form,0),pigment=SurfacePattern(u,v,slot,s,race.form,1);
    const wear=SurfacePattern(u,v,slot,s,race.form,2),rough=SurfacePattern(u,v,slot,s,race.form,3);
    let colour=mix(a,z,pigment);
    if(race.prototype){const cp=CulturePattern(race.key,x*256/N,y*256/N,seed);colour=mix(colour,mix(race.hull,race.trim,cp.route),.55);out.alb[i+3]=cp.h*255;out.mtx[i+2]=cp.rough*255;}
    if(slot===7){const phase=pigment*6.2831853;colour=colour.map((c,k)=>c*(.7+.5*Math.cos(phase+k*2.094)));}
    for(let k=0;k<3;k++)out.alb[i+k]=Math.round(Math.max(0,Math.min(255,
      out.alb[i+k]*(slot===1?.22:.045)+colour[k]*255*(slot===1?.78:.955)+wear*16)));
    out.alb[i+3]=Math.round(out.alb[i+3]*(race.prototype?.5:slot===1?.18:.035)+h*255*(race.prototype?.5:slot===1?.82:.965));
    out.mtx[i]=Math.round(slot===3?pigment*150:slot===7?pigment*18:out.mtx[i]*.035);
    out.mtx[i+1]=Math.round(Math.max(0,metal-wear*.18)*255);
    out.mtx[i+2]=Math.round(rough*255);
    out.mtx[i+3]=Math.round(((u+v*.5+slot*.071)%1)*255);
  }
  out.recipe={...out.recipe,version:INFINITEXTURE_VERSION,kind:"material",slot,
    profile:MATERIAL_PROFILES[slot],surfaceSource:SurfaceSourceSha256};
  return out;
}

function generateInfiniArtifactSurface(options){
  options = options || {};
  const race = resolveInfiniRace(options.race);
  const recipe = describeArtifactSurface(options);
  const out = generateInfiniMaterialSurface({ race: race, seed: recipe.seed, slot:recipe.slot,
    tier: recipe.tier, resolution: options.resolution });
  applyArtifactFinish(out.alb, out.mtx, race, recipe, options.dna || []);
  recipe.resolution = infiniResolution(options.resolution);
  recipe.profile = out.recipe.profile;
  recipe.surfaceSource = out.recipe.surfaceSource;
  recipe.algorithms = out.recipe.algorithms.slice(0);
  recipe.hybrid = out.recipe.hybrid;
  out.recipe = recipe;
  return out;
}

export const InfiniTexture = {
  version: INFINITEXTURE_VERSION,
  registerCulture: registerInfiniCulture,
  races: ROSTER,
  finishes: ARTIFACT_FINISHES.slice(0),
  resolveRace: resolveInfiniRace,
  describeArtifactSurface: describeArtifactSurface,
  materialProfiles: MATERIAL_PROFILES.slice(0),
  materialPattern: SurfacePattern,
  generateMaterialSurface: generateInfiniMaterialSurface,
  generateShipSurface: generateInfiniShipSurface,
  generateArtifactSurface: generateInfiniArtifactSurface
};
if(typeof globalThis !== "undefined") globalThis.InfiniTexture = InfiniTexture;
