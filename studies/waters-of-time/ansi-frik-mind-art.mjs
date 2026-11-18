import {mandelEscape} from './ansi-mandel-field.mjs';
import {globeInk,knightInk} from './frik-crossing.mjs';
import {frikIdleMotion} from './ansi-frik-motion.mjs?v=waters-echo-2';
import {frikAdInk,frikAdGate,paintFrikAd} from './ansi-frik-hq-ad.mjs?v=waters-echo-2';
import {mirrorAnsiInk} from './ansi-mirror.mjs?v=frik-mind-46';
import {ansiLightPulse} from './ansi-animation.mjs?v=surface-light-3';
import {frikStoryIndex,frikStoryGrade,frikMemoryLayout,frikActorPoint,frikCymaticProfiles} from './ansi-frik-story.mjs?v=waters-echo-2';
import {frikLook, frikStandingInk,frikInkStrokes} from './ansi-frik-bridge-ink.mjs?v=waters-echo-2';
import {frikCraftSurface} from './ansi-frik-craft-surface.mjs?v=frik-mind-46';

// Each material in the bridge and the three views is authored in ANSI++.
export const clamp = n => Math.min(1, Math.max(0, n));
export function smooth(n) {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
}
export function mix(a, b, t) {
  if(t<=0)return a;
  if(t>=1)return b;
  const w = clamp(t), v = 1 - w;
  return (Math.round((a >> 16 & 255) * v + (b >> 16 & 255) * w) << 16) |
    (Math.round((a >> 8 & 255) * v + (b >> 8 & 255) * w) << 8) |
    Math.round((a & 255) * v + (b & 255) * w);
}
const ellipse = (x, y, rx, ry) => (x / rx) ** 2 + (y / ry) ** 2;
const repeat = (v, step) => Math.abs(v - Math.round(v / step) * step);
function mark(ink, color, d, w, pixel) {
  if (d > w + pixel || pixel > w * 8) return ink;
  const coverage = Math.min(w / pixel, 1) * smooth((w - d + pixel * .58) / pixel);
  return mix(ink, color, coverage);
}
function edge(ink, d, w, f, dark, bright) {
  ink = mark(ink, dark, Math.abs(d), w, f.pixel);
  return mark(ink, bright, Math.abs(d - w * 1.55), w * .56, f.pixel);
}
function distance(x, y, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
  return Math.hypot(x - ax - dx * t, (y - ay - dy * t) * .72);
}
function cast(ink, tint, d, power) {
  return d < 1 ? mix(ink, tint, (1 - d) ** 2 * power) : ink;
}

// Relief above the convergence plane in each memory. The gate itself is the
// stereo fixation point. Receding ceilings and projecting banks move in opposition.
export function memoryHeight(x,y,scene){
  if(scene===0){
    const deck=smooth((y-.52)*3.3);
    const hero=1-ellipse(x-.44,y-.43,.15,.51);
    return -.32+.84*deck+.47*smooth(hero*2);
  }
  if(scene===1)return -.48+.99*Math.sqrt(Math.max(0,1-ellipse(x-.5,y-.515,.324,.493)));
  if(scene===2)return -.33+.68*smooth((y-.48)*3)+.57*smooth((Math.abs(x-.52)-.18)*7);
  if(scene===5)return -.24*smooth((Math.abs(x-.50)-.405)*13)+.18*smooth((y-.77)*7);
  const coast=.64+.077*Math.sin(x*5.6);
  return -.41+.91*smooth((y-coast+.12)*4.4)+.23*smooth((.22-y)*5);
}
// A short bounded inverse height solve for the broad relief. Creature skin
// has its own finer ray intersection in the resulting anatomical coordinates.
export function memoryCrossing(x,y,scene,ray,tilt){
  const first=memoryHeight(x,y,scene);
  return memoryHeight(x+ray*first,y-tilt*first,scene);
}

// Drawn in the original parent field at every scale. The rim and the ants
// occupy the near plane; the evidence lives beyond the opening.
export function traceInk(x,y,f,under,index,cx,cy,r){
  let u=(x-cx)/r,v=(y-cy)/(r*1.45);
  if(u< -5.9||u>1.14||Math.abs(v)>1.14)return under;
  const pixel=f.pixel/r;
  const radius=u*u+v*v;
  if(radius>1){
    if(u>-.70)return under;
    const axis=.32*Math.sin(u*1.22)+.08*Math.sin(u*3.1);
    const lane=v-axis;
    const segment=repeat(u+f.time*.41,.70);
    const ants=ellipse(segment,lane,.137,.080);
    if(ants<1)under=mix(under,0xe9cc89,smooth((1-ants)*3));
    const legs=repeat(u+f.time*.41,.231);
    if(Math.abs(lane)<.16&&legs<.030)under=mix(under,0x99c6b7,.70);
    return under;
  }

  const rim=smooth((1-radius)*7);
  const depth=Math.sqrt(Math.max(0,1-radius));
  u+=f.bearing*.089*depth;v-=f.elevation*.077*depth;
  let ink=mix(0x102336,0x547471,clamp(.60-.35*v-.33*u));
  if(index===0){
    // Drowned entrance plaster, two door jambs, a lintel, four dated notches.
    const arch=ellipse(u,v+.12,.68,.79);
    if(arch<1&&v<.66){
      ink=mix(0x0a192c,0x476c6b,clamp(.32+v*.32+u*.27));
      const pane=ellipse(u-.05,v+.17,.30,.32);
      ink=cast(ink,0xf6bf72,pane,.86);
      if(Math.abs(u-.035)<.025||Math.abs(v+.17)<.024)ink=mix(ink,0x192a33,.80);
    }
    const post=Math.abs(u+.44+.06*v);
    if(post<.12&&v>-.66){
      ink=mix(0x484947,0xcba785,clamp(.79-post*4-v*.16));
      const notch=repeat(v+.22*u,.193);
      if(v>-.49&&v<.29&&u<-.40)ink=mark(ink,0x44362f,notch,.019,pixel);
    }
    const tide=.48+.052*Math.cos(u*7+f.time*.54);
    if(v>tide)ink=mix(ink,0x3c9e9d,.56);
    ink=mark(ink,0xa6e9c6,Math.abs(v-tide),.022,pixel);
  }else if(index===1){
    // The archive drum hesitates at the one missing tooth, revealing an empty berth.
    const phase=f.time*.56-.13*Math.sin(f.time*3.0);
    const a=Math.atan2(v+.06,u-.10)-phase,rad=Math.hypot(u-.10,v+.06);
    const tooth=Math.cos(a*12);
    const gap=Math.cos(a-.58)>.927;
    const outer=gap?.53:.64+.097*smooth((tooth+.18)*3);
    if(rad<outer&&rad>.25){
      ink=mix(0x4a3d45,0xbfa077,clamp(.48-u*.34-v*.49+.13*tooth));
      ink=mark(ink,0xf7ccb1,Math.abs(rad-outer+.022),.016,pixel);
    }
    if(rad<.23)ink=mix(0x172334,0x789098,clamp(.49-u-v));
    const pawl=distance(u,v,-.90,.62,-.30,.25);
    ink=mark(ink,0xdaaa78,pawl,.078,pixel);
    ink=mark(ink,0x8ad8cc,Math.abs(v+.59+.24*u),.018,pixel);
  }else if(index===3){
    // The embryo is curled around its yolk. The smaller heart answers in pairs.
    const beat=Math.max(0,Math.cos(f.time*2.4))**6;
    ink=mix(0x292f41,0xb4815a,clamp(.58-.31*v-.26*u));
    const sac=ellipse(u+.02,v-.09,.67,.66);
    ink=cast(ink,0xd3a666,sac,.64);
    const coil=ellipse(u+.09,v+.01,.51,.47);
    if(coil<1.18&&coil>.46&&v>-.28)ink=mix(0x31585a,0x8fbaa2,clamp(.59-v*.44-u*.27));
    const skull=ellipse(u-.24,v+.21,.25,.23);
    if(skull<1){
      ink=mix(0x386662,0xbad2ab,clamp(.58-v*.47-u*.41));
      ink=cast(ink,0x102b39,ellipse(u-.31,v+.24,.057,.072),1);
    }
    ink=cast(ink,0xff956f,ellipse(u+.31,v-.13,.12+.034*beat,.109+.027*beat),.65+.35*beat);
    const vein=Math.abs(v-.40-.13*Math.cos(u*5));
    ink=mark(ink,0x99574d,vein,.015,pixel);
  }else if(index===2){
    const stone=mandelEscape(-.745+u*.012,.108+v*.013,80);
    ink=mix(0x17353b,0x68776b,stone<0?.14:.40+.20*Math.cos(stone*.8));
    const ledger=ellipse(u+.04,v,.72,.82);
    if(ledger<1){
      ink=mix(0x6f5547,0xc6a981,clamp(.59-.23*u-.48*v));
      const row=Math.floor((v+.65)/.17);
      const stroke=repeat(u+v*.12,.22);
      if(row>=0&&row<7&&Math.abs(v+.65-row*.17)<.104&&(row<6||u<-.28))
        ink=mark(ink,0x3d3430,stroke,.024,pixel);
    }
  }else if(index===4){
    ink=mix(0x1c253a,0x645977,clamp(.48-u*.33-v*.25));
    for(const n of [0,1,2,3]){
      const sx=u+.66-n*.38,sy=v+.09*Math.sin(n*3);
      const hook=ellipse(sx,sy+.34,.119,.14);
      ink=mark(ink,0xd8c29f,Math.abs(hook-1)*.045,.014,pixel);
      if(n<3&&sy>-.27&&sy<.51){
        const shell=ellipse(sx+.037*Math.sin(sy*6+n),sy-.07,.134,.44);
        if(shell<1){
          ink=mix(0x40515a,0xc6c2a9,clamp(.52+.27*Math.cos(sy*46)+.2*sx));
          ink=mark(ink,0x424653,Math.abs(sx+.032*Math.sin(sy*7)),.018,pixel);
        }
      }
    }
  }else{
    // A loop of perforated paper carries the human reply between two capstans.
    ink=mix(0x101d34,0x375b66,clamp(.53-u*.21-v*.29));
    const strip=v+.23*Math.sin(u*3.1-.30),tape=Math.abs(strip);
    if(tape<.32){
      ink=mix(0x8b8373,0xe5d2a4,clamp(.77-strip*.83-u*.18));
      const hole=ellipse(repeat(u-f.time*.17,.21),repeat(strip+.035,.123),.046,.037);
      if(hole<1&&Math.cos(Math.floor((u-f.time*.17)/.21)*3+Math.floor(strip/.123)*5)>.05)ink=0x27313d;
      ink=mark(ink,0x725e59,Math.abs(tape-.28),.012,pixel);
    }
    for(const spool of [-.65,.65]){
      const hub=ellipse(u-spool,v+.28*spool,.147,.15);
      if(hub<1)ink=mix(0x263947,0xb6a983,clamp(.48+.42*Math.cos(hub*8)));
    }
  }
  ink=mark(ink,0xe1c899,Math.abs(radius-.92)*.39,.022,pixel);
  return mix(under,ink,rim);
}

const ritualBowl = [.728,.611,.132,.067];
const deckWells = [[.147,.715,.057,.024],[.873,.558,.038,.019]];
function basin(x,y,f,cx,cy,rx,ry,ink,raised) {
  if (Math.abs(x-cx)>rx*1.11 || y<cy-ry*1.11) return ink;
  const u=(x-cx)/rx, v=(y-cy)/ry;
  const lip=u*u+v*v;
  if (raised && v>0 && y<.837) {
    const z=(y-cy)/(.837-cy);
    const spread=.92-.52*Math.sin(Math.PI*z*.92)+.14*smooth((z-.73)*6);
    if (Math.abs(u)<spread && (z<.58 || Math.abs(u)<.40 || z>.85)) {
      const side=u/spread;
      ink=mix(0x0a202f,0x5e8a81,clamp(.23-side*.51+Math.sqrt(Math.max(0,1-side*side))*.42));
      ink=edge(ink,z+.096*Math.sqrt(Math.max(0,1-side*side))-.55,.017,f,0x122732,0x8a9872);
      ink=edge(ink,z+.060*Math.sqrt(Math.max(0,1-side*side))-.91,.019,f,0x132737,0x657e78);
    }
  }
  if (lip>1.12) return ink;
  if (lip>.79) {
    if (!raised) {
      return mark(mix(0x081727,0x42666b,clamp(v)*.62),0x5b9c9b,
        Math.abs(lip-1)*ry,.0017,f.pixel);
    }
    const brass=clamp(.53-u*.28+v*.27);
    ink=mix(0x132d3c,0xd0be83,brass);
    const angle=Math.atan2(v,u);
    ink=mark(ink,0x354b54,repeat(angle,.19)*ry+Math.abs(lip-.93)*.023,.0012,f.pixel);
    return mark(ink,0xbcece2,Math.abs(lip-.97)*ry,.0025,f.pixel);
  }
  const [n,m]=f.cymatic.modes;
  const cymatic=Math.cos(u*Math.PI*n)*Math.cos(v*Math.PI*m)-
    Math.cos(u*Math.PI*m)*Math.cos(v*Math.PI*n);
  const waves=lip+.067*Math.sin(21*x+18*y-f.time*2)+cymatic*f.energy*.16;
  ink=mix(0x15425a,0x4fabb3,clamp(.64-v*.36-lip*.38));
  ink=mark(ink,0x99e6dc,repeat(waves-f.time*.13,.23)*ry,.0023,f.pixel);
  if(f.energy>.01)ink=mark(ink,0xc5ffe4,Math.abs(cymatic)*ry,.0012+f.bass*.0013,f.pixel);
  if (raised && f.effects) ink=cast(ink,0x95fff1,ellipse(u+.23,v+.24,.84,.65),.63*f.waterLight);
  return ink;
}

function bridge(x, y, f) {
  const worldX=x,actor=f.layout.bridge;
  if(f.layout.mirrorBridge)x=1-x;
  const p=f.pixel;
  const horizon=.54;
  const window=ellipse(x-.752,y-.287,.216,.224);
  const wall=y+.017*Math.cos(x*9);
  let color=mix(0x10192c,0x28464f,smooth((wall+.06)*1.62));
  if (y<horizon) {
    // Broad bulkhead surfaces frame one viewport and a light over the Frik.
    const vault=y-.062-.44*(x-.39)**2;
    color=mark(color,0x5d777e,Math.abs(vault-.015),.0047,p);
    color=mark(color,0x142631,Math.abs(vault+.018),.015,p);
    const joint=x+.14*(y-.52);
    color=edge(color,repeat(joint,.212)-.007,.005,f,0x0d1f2d,0x3d5761);
    color=cast(color,0x699e9b,ellipse(x-.445+.34*y,y-.164,.134,.438),.45);
    // A fan vault conducts the basin light through concave bronze ribs.
    const vx=x+f.ray*.047,vy=y-f.tilt*.032;
    const bearing=Math.atan2(vy+.19,vx-.39);
    const radius=Math.hypot(vx-.39,vy+.19);
    const rib=repeat(bearing+.13*Math.sin(radius*5),.265)*radius;
    const brass=smooth((.022-rib)/.022);
    color=mix(color,0x112031,brass);
    color=mark(color,0xb08b65,Math.abs(rib-.009),.004,p);
    color=mark(color,0x98dac9,Math.abs(rib-.015),.0015,p);
    // Recessed sluices run between the vault ribs. A bank of ceramic valves
    // and their witnesses give the navigator a human-readable water level.
    if(x>0&&x<.25&&y>.068&&y<.241){
      const bay=Math.floor(x*24),u=(x*24-bay-.5)*2,v=(y-.154)/.082;
      const housing=u*u+v*v;
      if(housing<1){
        color=mix(0x101b2e,0x8c7564,clamp(.52-u*.32-v*.34));
        const aperture=ellipse(u,v,.66,.78);
        if(aperture<1){
          color=mix(0x061728,0x265664,clamp(.37+v*.37));
          const level=.15+.42*Math.sin(bay*1.9+f.time*.31);
          if(v>level)color=mix(0x1d5e68,0x65d0bf,clamp((v-level)*.64+.21-u*.32));
          color=mark(color,0xe9c891,Math.abs(v-level)*.06,.0019,p);
        }
      }
    }
    if (window<1.15) {
      color=mix(0x101e31,0x849485,clamp(.48-(y-.28)*.95-(x-.73)*.92));
      if (window<.91) {
        // Present-day rendezvous. The ochre limb is the colony's new home.
        // The long hull, greenhouse spine and habitation lights belong to the survivors.
        const limb=y-.384+.39*(x-.76)+.68*(x-.76)**2;
        color=mix(0x090e26,0x30354a,smooth(y*1.9));
        if(limb>-.015){
          const clouds=Math.cos(x*95+y*59)+.52*Math.cos(x*183-y*82);
          color=mix(0x4b495e,0xcd9373,clamp(.60-limb*2+clouds*.15));
          color=mark(color,0xffdb99,Math.abs(limb+.008),.0042,p);
        }
        const u=(x-.746)/.116,v=(y-.274+.29*(x-.746))/.045;
        if(u>-.99&&u<1.03){
          const beam=.20+.30*smooth((u+1)*5)-.39*smooth((u-.59)*2.5);
          const stack=Math.floor((u+.76)*4.1);
          const module=ellipse(repeat(u+.76,.244),v+.39,.111,.43);
          if(stack>=0&&stack<5&&module<1)color=mix(0x244754,0x98c8b4,clamp(.45-v*.32-u*.10));
          if(Math.abs(v)<beam){
            color=mix(0x1a2033,0xc3a488,clamp(.47-v*.95-u*.12));
            color=mark(color,0x654d4b,repeat(u,.235)*.116,.0015,p);
            if(Math.abs(v-.075)<.067&&repeat(u,.095)<.024)color=0xffdc8e;
          }
          // Twin rotating habitats hang below the central structural spine.
          for(const hub of [-.53,.12]){
            const ring=ellipse(u-hub-.08*v,v-.10,.13,1.0);
            if(ring>.43&&ring<1.15){
              color=mix(0x373347,0xc79a70,clamp(.52-v*.29-(u-hub)*1.6));
              if(ring>.93&&v<.30)color=mix(color,0xe3d4ac,.64);
            }
            if(Math.abs(u-hub-.08*v)<.024&&Math.abs(v-.1)<.88)color=0x716f79;
          }
          const prow=ellipse(u-.70+.12*v,v+.09,.29,.46);
          if(prow<1)color=mix(0x413744,0xd5aa87,clamp(.56-v*.71+Math.sqrt(1-prow)*.18));
          if(u>.67&&u<.89&&Math.abs(v+.19)<.052)color=0xadede0;
          if(u<-.72&&Math.abs(Math.abs(v)-.40)<.19){
            color=mix(0x302e44,0x8ad2cc,clamp(.30-.7*v));
            if(u<-.93)color=0xa1ecdb;
          }
        }
        // Two separated halves of the archival drone with cooling fracture faces.
        const du=(x-.852)/.034,dv=(y-.184)/.048;
        const split=du+.35*dv;
        if(Math.abs(du)+Math.abs(dv)*.77<1&&Math.abs(split)>.17){
          color=mix(0x111828,0x727184,clamp(.42-du*.38-dv*.39));
          color=mark(color,0xff9864,Math.abs(Math.abs(split)-.19)*.034,.0028,p);
        }
      }
      color=mark(color,0x69a39d,Math.abs(window-.97)*.070,.0034,p);
    }
    if (x>.049 && x<.256 && y>.246 && y<.516) {
      const slant=x+.11*(y-.40), inset=ellipse(slant-.149,y-.381,.104,.122);
      if (inset<1.13) {
        color=inset>.89?0x284756:0x0b2638;
        const wave=y-.412+.038*Math.cos(x*24+f.time*.80);
        color=mark(color,0x51adae,repeat(wave,.030),.0027,p);
        color=mark(color,0x85e5d1,Math.abs(wave+.006),.0039,p);
      }
    }
  } else {
    const depth=(y-horizon)/(1-horizon);
    const line=x-.55-(.18+.93*depth)*Math.round((x-.55)/(.18+.93*depth));
    color=mix(0x324852,0x101e32,smooth(depth));
    const reflection=ellipse(x-.72+.026*Math.sin(y*66+f.time*.4),y-.64,.16,.25);
    color=cast(color,0x77aa9b,reflection,.39*f.waterLight);
    color=edge(color,repeat(Math.sqrt(depth),.167)*.097-.0014,.003,f,0x102231,0x2d4551);
    color=mark(color,0x44676a,Math.abs(line),.0034,p);
    color=mark(color,0x5b978e,Math.abs(line-.012),.0019,p);
    // Polished joints reflect the arcades in the lower deck. Tide channels
    // share a vanishing point; the narrow return pipe carries a brighter edge.
    const run=(x-.543)/(.07+depth*.87);
    if(Math.abs(run)>.50&&Math.abs(run)<2.85){
      const seam=repeat(run,.66)*(.07+depth*.87);
      color=mark(color,0x172c3d,seam,.006+.003*depth,p);
      color=mark(color,0x847865,Math.abs(seam-.006),.0022,p);
      const notch=repeat(Math.sqrt(depth)+.03*run,.096);
      if(seam<.012)color=mark(color,0xa5b2a1,notch*.048,.0013,p);
    }
    const contactX=actor.x+.427*actor.scale,contactY=actor.y+.884*actor.scale;
    color=cast(color,0x060e1b,ellipse(x-(f.layout.mirrorBridge?1-contactX:contactX),
      y-contactY,.166*actor.scale,.046*actor.scale),.79);
    color=cast(color,0x060e1b,ellipse(x-.724,y-.821,.181,.044),.88);
    color=cast(color,0x3eaea9,ellipse(x-.726,y-.756,.268,.180),.51*f.waterLight);
    for (const [cx,cy,rx,ry] of deckWells) color=basin(x,y,f,cx,cy,rx,ry,color,false);
  }
  color=basin(x,y,f,...ritualBowl,color,true);
  return frikStandingInk((worldX-actor.x)/actor.scale,(y-actor.y)/actor.scale,f.actorState,color);
}

// The arch, shoal and geological landmarks survive the change of observer.
const visible = [0x0b2032,0x1c455b,0x346a74,0x527c76,0x78bbad,0x245763,0x18334c,0x4f8a8b,0x8bd4bf];
const shortwave = [0x1c1333,0x4c2854,0x703b75,0x965f90,0xee81a3,0x382a69,0x201b47,0xac6587,0xffd48b];
const pressure = [0x15142c,0x27335d,0x3c5875,0x598b8c,0xbad1ba,0x243965,0x1a2244,0x7cb4c1,0xd0f5db];
const spires = [[.095,.213,.091],[.211,.325,.066],[.289,.254,.051],[.380,.386,.069],
  [.707,.279,.048],[.762,.184,.055],[.845,.329,.039],[.951,.208,.082]];
function tidalWorld(x, y, f, spectrum) {
  const p = f.pixel, t = f.time;
  const [voidInk, fog, shale, stone, light, water, deep, foam, gleam] = spectrum;
  const roof = .10 + .038 * Math.cos(13 * x) + .047 * Math.cos(5.3 * x);
  let color = y < roof ? voidInk : y < .38 ? mix(voidInk, fog, clamp((y - roof) * 2.9)) :
    mix(fog, shale, clamp((y - .38) * 4.6));
  const cloud = y + .026 * Math.sin(13 * x+f.trip*.29) + .028 * Math.cos(5.3 * x);
  color = mark(color, stone, Math.abs(cloud - .221), .008, p);
  if (f.effects) color = cast(color, light, ellipse(x - .494, y - .27, .51, .46), .23);
  if (y > .16 && y < .678) {
    for (const [cx, tip, width] of spires) {
      if (y < tip || Math.abs(x - cx) > width + .022) continue;
      const foot = (y - tip) / (.68 - tip);
      const flank = x - cx + .051 * (y - tip) - .013 * Math.cos(21 * y + cx * 8);
      const reach = width * (.12 + .88 * foot) * (.83 + .17 * Math.cos(28 * y));
      if (Math.abs(flank) >= reach) continue;
      const round=Math.sqrt(Math.max(0,1-(flank/reach)**2));
      color=mix(voidInk,shale,clamp(.18-flank/reach*.24+round*.41));
      color=mark(color,mix(shale,stone,.34),Math.abs(flank+reach*.63),.0025,p);
      const layers = y + .113 * flank + .018 * Math.sin(x * 22);
      color = mark(color,mix(color,stone,.24),repeat(layers,.094),.0018,p);
    }
  }
  // Hanging colonies are backlit. Each pendant has a stalk, domed cap and gill light.
  if(y<.42){
    const shelfX=x-f.ray*.071;
    const bay=Math.floor(shelfX*12),side=shelfX*12-bay-.5;
    const root=.10+.038*Math.cos(13*shelfX)+.047*Math.cos(5.3*shelfX);
    const stem=root+.106+.062*Math.cos(bay*2.31);
    if(y>root&&y<stem)color=mark(color,shale,Math.abs(side)*.083,.0022,p);
    const bell=ellipse(side,y-stem,.27,.019);
    if(bell<1 && y<stem+.009){
      color=mix(shale,foam,clamp(.46-side+(stem-y)*14));
      color=mark(color,gleam,Math.abs(y-stem-.003),.002,p);
    }
  }
  // The failed gate works are visible to every observer. Three ceramic horns
  // straddle the same inlet; their cut faces expose the induction windings.
  if(x>.65&&x<.99&&y>.145&&y<.622){
    const gx=x+f.ray*.083,gy=y-f.tilt*.063;
    const beam=gy-.428+.10*(gx-.78);
    if(gx>.69&&gx<.95&&Math.abs(beam)<.014){
      color=mix(deep,stone,clamp(.56-beam*31));
      color=mark(color,gleam,Math.abs(beam+.011),.0015,p);
    }
    for(const [base,top,lean] of [[.707,.252,.045],[.803,.166,-.034],[.909,.239,-.056]]){
      const h=(gy-top)/(.621-top);
      if(h<0||h>1)continue;
      const spine=base+lean*(1-h)*(1-h);
      const width=.010+.022*h*h+.015*smooth((.13-h)*8);
      const side=(gx-spine)/width;
      if(Math.abs(side)<1){
        color=mix(deep,stone,clamp(.48-side*.28+Math.sqrt(1-side*side)*.31));
        const slot=repeat(h+.09*side,.112)*(.621-top);
        color=mark(color,shale,slot,.0031,p);
        color=mark(color,gleam,Math.abs(slot-.006),.0013,p);
        color=mark(color,foam,Math.abs(side+.64)*width,.0016,p);
        const cut=ellipse(side,h-.054,.88,.045);
        if(cut<1)color=mix(deep,light,clamp(1-cut)*(.48+.34*f.primary));
      }
    }
  }
  if(f.trip===1&&y>.19&&y<.49){
    // The lance strips the tops from a line of sea stacks. The cold gap persists behind the glowing edge.
    const slash=y-.30+.22*(x-.52)-.018*Math.sin(f.time*.29);
    const band=smooth((.060-Math.abs(slash))*24)*smooth((x-.04)*6);
    color=mix(color,0x101425,band*.85);
    color=mark(color,mix(color,0xffcca0,band+.35),Math.abs(slash+.046),.0044,p);
    const shard=repeat(x+.6*y,.092);
    if(slash>.011&&slash<.082&&shard<.009)color=mix(color,stone,.71);
  }
  if(f.trip===2&&y>.13&&y<.53){
    // Return paths cross the open sky in pairs; life registers at their intersections.
    const sx=x+f.ray*.24;
    const warp=y-.30-.10*Math.sin(sx*7+f.time*.16);
    const lattice=repeat(warp,.082);
    color=mark(color,foam,lattice,.0025,p);
    const cross=repeat(sx+.64*y,.103);
    if(lattice<.010&&cross<.007)color=cast(color,0xffdaaa,ellipse(cross,lattice,.007,.012),.78);
  }
  const river = .612 + .041 * Math.cos(x * 5.4) - .035 * Math.sin(x * 11 + .42);
  const bank = river + .112 + .093 * Math.sin(x * 5.2 + .54);
  if (y > river) {
    if (y < bank) {
      color=mix(fog,water,smooth((y-river)*10));
      const pools = y - river + .018 * Math.cos(x * 23 + .48 * t);
      color=mark(color,mix(water,foam,.35),repeat(pools,.053),.0019,p);
      color=mark(color,mix(water,gleam,.61),Math.abs(y-river-.025),.0027,p);
    } else {
      color = y > bank + .148 ? deep : shale;
      const terraces = y - bank + .033 * Math.cos(x * 11) - .016 * Math.sin(x * 27);
      const terrace=repeat(terraces,.074);
      color=mix(color,stone,.18*smooth((terrace-.013)/.026));
      color=mark(color,mix(deep,shale,.28),Math.abs(terrace-.012),.0031,p);
      if (p < .016 && repeat(terraces, .074) < .030) {
        const crack=repeat(x-.47*y+.019*Math.sin(30*y),.163);
        color=mark(color,mix(deep,shale,.17),crack,.0015,p);
      }
    }
  }

  // Tubeworm gardens hold the near bank together. The fans grow from sockets
  // in the bank. Each vane folds towards its own current before touching water.
  if(y>.67&&y<.866&&(x<.236||x>.727)){
    const bx=x+f.ray*.13;
    const bay=Math.floor(bx*17),local=bx*17-bay-.5;
    const bottom=.81+.036*Math.sin(bay*3.05);
    const u=local/.47,v=(bottom-y)/(.075+.033*Math.cos(bay*2.03));
    const a=Math.atan2(u,v),r=Math.hypot(u,v);
    if(v>0&&r<1&&Math.abs(a)<1.24){
      const veins=repeat(a+.17*r+.043*Math.sin(f.time*.74+bay),.255);
      color=mix(color,stone,.64*(1-r*.25));
      color=mark(color,foam,veins*r*.044,.0018,p);
      color=mark(color,gleam,Math.abs(1-r)*.046,.0014,p);
    }
    const collar=ellipse(local,y-bottom,.18,.009);
    if(collar<1)color=mix(deep,light,clamp(.66-local-(y-bottom)*32));
  }
  // The split fossil arch is a recognizable landmark in every perception.
  if (x < .455 && y > .26 && y < .74) {
    const outer = ellipse(x - .234, y - .623 - .21 * (x - .20), .194, .282);
    const inner = ellipse(x - .215, y - .633 - .24 * (x - .20), .131, .218);
    if (outer < 1 && (inner > 1 || y > .654) && (x < .348 || y < .473)) {
      const volume=Math.sqrt(Math.max(0,1-outer));
      color=mix(deep,stone,clamp(.29+volume*.34-(x-.23)*.83-(y-.52)*.36));
      const segments = y + .16 * x + .036 * Math.cos(17 * x);
      color = mix(color, shale, .38 * smooth((outer - .28) / .38));
      color=mark(color,mix(deep,stone,.43),repeat(segments,.067),.0027,p);
      color=mark(color,mix(stone,foam,.40),Math.abs(inner-1)*.05,.0031,p);
      color=mark(color,mix(stone,gleam,.55),Math.abs(outer-.89)*.06,.0021,p);
    }
  }
  return color;
}

// Stable star occupancy: evaluate the authored hash once at cell centres.
// Float32 storage gives CPU and shader the same source values; evaluating
// sin()*78731 per fragment amplified GPU transcendental rounding into stars.
const orbitStars=Float32Array.from({length:256*256},(_,i)=>{
 const gx=i%256,gy=Math.floor(i/256),seed=Math.sin(gx*41.73+gy*15.1)*78731.63;
 return seed-Math.floor(seed);
});
const starHash=(gx,gy)=>orbitStars[(gy&255)*256+(gx&255)];
function orbit(x,y,f) {
  const dx=(x-.500)/.324, dy=(y-.515)/.493, r=dx*dx+dy*dy;
  if(r>1.116){
    let color=0x050a18;
    const nebula=y-.21-.34*x+.08*Math.sin(x*7.5+f.trip*1.8);
    color=cast(color,0x252654,nebula*nebula/.058,.65);
    if(f.trip){
      const ring=ellipse(x-.5,y-.515-.29*(x-.5),.47,.20);
      color=mark(color,f.trip===1?0xbc986b:0x779be6,Math.abs(ring-1)*.075,.0035,f.pixel);
      const moonX=f.trip===1?.115:.86,moonY=f.trip===1?.18:.24;
      const moon=ellipse(x-moonX,y-moonY,.033,.050);
      if(moon<1)color=mix(0x192c48,0xb9bd9b,clamp(.25-(x-moonX)*9-(y-moonY)*6+Math.sqrt(1-moon)*.56));
    }
    if(f.pixel<.021){
      const gx=Math.floor(x*71),gy=Math.floor(y*46),n=starHash(gx,gy);
      if(n>.928)color=mark(color,n>.986?0xbadfe5:0x4d7894,
        Math.hypot(repeat(x,1/71),repeat(y,1/46)),n>.986?.0035:.0017,f.pixel);
    }
    color=knightInk((x-.184)/.14,(y-.127)/.22,color);
    return color;
  }
  const z=Math.sqrt(Math.max(0,1-r));
  const face=clamp(.14-dx*.39-dy*.28+z*.64);
  const bx=Math.atan2(dx,z+.025)+f.time*.028,lat=Math.asin(clamp((dy+1)*.5)*2-1);
  const land=Math.sin(bx*4.2+lat*3.6+f.trip*.57)+.65*Math.sin(lat*10-bx*5)+.29*Math.cos(lat*25+bx*18)+
    .14*Math.sin(lat*51-bx*41);
  const arc=ellipse(x-.600+.022*Math.sin(y*29),y-.537+.031*Math.sin(x*16),.090,.104);
  let color=globeInk(dx,dy,f.time,1);
  if(arc<1.45){
    const shoal=clamp((1.45-arc)*.70);
    color=mix(color,arc>.74?0x6c9f91:0x245c72,shoal*.82);
    color=mark(color,0x89abaa,Math.abs(arc-1.08)*.055,.0018,f.pixel);
  }
  // Storm bands turn around the eye with altitude-dependent parallax.
  const stormX=bx+.43-f.ray*z*.85,stormY=lat+.22+f.tilt*z;
  const stormRadius=Math.hypot(stormX,stormY*1.6);
  if(stormRadius<.65){
    const curl=Math.atan2(stormY*1.6,stormX)*2+stormRadius*24-f.time*.12;
    const cloudBank=smooth((.65-stormRadius)*4)*smooth((stormRadius-.036)*13);
    color=mix(color,0xefe3bb,cloudBank*(.32+.30*Math.cos(curl))*face);
    color=mark(color,0x76cdb7,Math.abs(stormRadius-.077)*.18,.002,f.pixel);
  }
  const cloud=Math.sin(bx*8.1-lat*11+.21*f.time)+.68*Math.cos(lat*26-bx*7)+.19*Math.sin(bx*42+lat*30);
  color=mix(color,0xd3e6cf,clamp((cloud-.52)*.32)*face*.78);
  // Night-side chains of estuary lights follow continental shelves. The
  // auroral curtains turn at the magnetic pole, separately from cloud height.
  const terminator=clamp((.76-face)*2.8);
  if(land>.02&&land<.43&&terminator>.05){
    const ports=repeat(bx+.28*Math.sin(lat*9),.092);
    color=mark(color,mix(color,0xffbb73,terminator*.83),ports*.13,.0024,f.pixel);
  }
  if(lat<-.48){
    const oval=lat+.86+.094*Math.cos(bx*4+f.time*.16)+.036*Math.sin(bx*11+lat);
    const curtain=clamp(1-Math.abs(oval)*10)*(.32+.26*Math.cos(bx*63+lat*5));
    color=mix(color,f.trip===2?0xd4a9f2:0x81f3b8,curtain);
  }
  const trench=Math.abs(land-.22);
  color=mark(color,0x9fc3a8,trench*.055,.0015,f.pixel);
  if(f.trip===1&&dx<-.08&&dx>-.94){
    const scan=dy-.19*dx-.08-.016*Math.sin(f.time*.41);
    const column=Math.floor((dx+.94)*20);
    const reach=.078+.022*Math.cos(column*2.14);
    if(Math.abs(scan)<reach){
      const seam=repeat(dx+.94,.050);
      color=mix(color,0x121323,smooth((reach-Math.abs(scan))*58)*.91);
      color=mark(color,0xa76a65,seam*.25,.0018,f.pixel);
      color=mark(color,0xf2c68b,Math.abs(scan+reach)*.33,.0019,f.pixel);
    }
  }
  if(f.trip===2&&dx>.23&&dy<.10){
    const phase=Math.hypot((dx-.71)*1.26,dy+.24);
    const response=repeat(phase-f.time*.032,.15);
    color=mix(color,mark(color,0xa3e5df,response*.23,.0021,f.pixel),smooth((.55-phase)*4)*.56);
  }
  const ringX=(x-.5)/.475,ringY=(y-.515-.29*(x-.5))/.19;
  const belt=Math.hypot(ringX,ringY);
  if(f.trip&&ringY>0&&belt>.88&&belt<1.05){
    const groove=.5+.5*Math.cos(belt*351);
    color=mix(color,f.trip===1?0xd5b58c:0xbab5d9,.22+.39*groove);
  }
  if(r>.94)color=mix(color,0x67e7ec,clamp((1.116-r)*8)*(.22+face*.69));
  if(r>1)color=mix(color,0x050a18,clamp((r-1)*8.62));
  return color;
}

function coreMemory(x,y,f){
  const u=(x-.52)/.54,v=(y-.49)/.62;
  const vault=u*u+v*v;
  let ink=mix(0x050e1a,0x17434a,clamp(.63-y*.38-vault*.13));
  // Follow one Mandelbrot estuary into the cave. Strata keep their world coordinates during flight.
  if(vault>.24){
    const rock=mandelEscape(-.745+(x-.51)*.061,.109+(y-.45)*.049,66);
    const lith=rock<0?.21:.45+.30*Math.cos(rock*1.26);
    ink=mix(ink,mix(0x092637,0x9db397,lith),smooth((vault-.24)*2.7)*.80);
  }
  const contour=Math.sqrt(Math.max(0,vault))+.034*Math.sin(x*19+y*8);
  ink=mark(ink,0x315c5a,repeat(contour,.17)*.12,.0024,f.pixel);
  const root=x-.526-.081*Math.sin((y-.16)*5.3);
  if(y>.16&&y<.76){
    const ribs=repeat(root+.022*Math.sin(y*22),.176);
    ink=cast(ink,0x326c69,(ribs*29)**2,.40);
    ink=mark(ink,0x09212e,Math.abs(ribs-.017),.005,f.pixel);
  }
  if(f.trip&&y>.18&&y<.70){
    const stemX=(f.trip===1?.205:.805)+.025*Math.sin(y*11+f.trip);
    const frond=Math.abs(x-stemX);
    ink=mark(ink,0x3c9e9d,frond,.004,f.pixel);
    const level=repeat(y,.076),leaf=ellipse(x-stemX-.034*Math.sin(y*22),level,.041,.015);
    if(leaf<1)ink=mix(0x1a4957,0x9bcd9e,clamp((1-leaf)*.63+(stemX-x)*4));
  }
  if(y>.69){
    const bed=y-.69+.047*Math.cos(x*8);
    ink=mix(ink,0x081b2a,smooth(bed*4));
    ink=mark(ink,0x254e54,repeat(bed,.073),.0020,f.pixel);
  }
  // Cleaved mineral organ pipes grow from both sides of the memory well.
  const gx=x+f.ray*.13,gy=y-f.tilt*.08;
  const bankDistance=Math.abs(gx-.525);
  if(bankDistance>.17 && gy>.21 && gy<.79){
    const column=Math.floor(gx/.057);
    const local=gx/.057-column-.5;
    const lip=.39+.14*Math.cos(column*4.25)-.25*(bankDistance-.26);
    const crown=lip+.095*Math.abs(local+.18);
    if(gy>crown&&Math.abs(local)<.43){
      const polish=clamp(.52-local*.77+(gy-crown)*.5);
      ink=mix(0x142d47,local<-.17?0x9598c5:0x498d89,polish);
      ink=mark(ink,0xf2cba1,Math.abs(gy-crown),.0028,f.pixel);
      ink=mark(ink,0x9aebc6,Math.abs(local+.17)*.057,.0014,f.pixel);
    }
  }
  // Two spiral fossil cuts flank the well. Their chambers widen outwards;
  // the oldest seams collect the water that feeds the lifting stem.
  if((x<.36||x>.68)&&y>.25&&y<.72){
    const cx=x<.36?.219:.809,cy=x<.36?.444:.496;
    const fx=(gx-cx)/.116,fy=(gy-cy)/.174,r=Math.hypot(fx,fy);
    if(r<1){
      const a=Math.atan2(fy,fx),spiral=r*2.7-a/(2*Math.PI);
      const chamber=repeat(spiral,1),rib=repeat(a+r*.74,.524);
      ink=mix(0x162d42,0x9c8174,clamp(.47-fx*.20-fy*.24+chamber*.27));
      ink=mark(ink,0x183c4b,chamber*.041,.0039,f.pixel);
      ink=mark(ink,0xf4cd9a,Math.abs(chamber-.13)*.041,.0018,f.pixel);
      ink=mark(ink,0x446e72,rib*r*.068,.0018,f.pixel);
      ink=mark(ink,0x72cbb9,Math.abs(r-.96)*.09,.0023,f.pixel);
    }
  }
  const pool=ellipse(x-.524,y-.644,.317,.113);
  if(pool<1.20){
    ink=pool>1.03?0x365854:mix(0x0b3141,0x267b80,clamp(1-pool)*.69);
    const ripple=repeat(pool-f.time*.21+.038*Math.sin(x*37),.24);
    ink=mark(ink,0x7ce0c3,ripple*.033,.0023,f.pixel);
  }
  // The fluid rises from the pool through one continuous, curling stem.
  if(y>.465&&y<.651){
    const t=(y-.465)/.186;
    const axis=.525+.032*Math.sin(t*5.3+f.time*.46)*Math.sin(Math.PI*t);
    const width=.013+.033*t*t;
    const across=(x-axis)/width;
    if(Math.abs(across)<1){
      ink=mix(0x144751,0x8edac0,clamp(.45-across*.26+Math.sqrt(1-across*across)*.35));
      ink=mark(ink,0xbee6ce,Math.abs(across+.32)*width,.0016,f.pixel);
    }
  }
  const dx=(x-.525)/.117,dy=(y-.423)/.156,r=dx*dx+dy*dy;
  if(r<1.07){
    const z=Math.sqrt(Math.max(0,1-r));
    const lit=clamp(.38-dx*.31-dy*.48+z*.37);
    ink=mix(0x123447,0x7bd7bd,lit);
    const film=Math.atan2(dy,dx)+Math.sin(r*17-f.time*.61)*.22;
    ink=mark(ink,0x3b9f9d,repeat(film,.49)*.035,.0021,f.pixel);
    ink=cast(ink,0xd7ffdc,ellipse(dx+.38,dy+.43,.27,.20),.74*f.primary);
    ink=mark(ink,0xb5f4d3,Math.abs(r-.96)*.061,.0024,f.pixel);
  }
  return cast(ink,0x439c92,ellipse(x-.52,y-.592,.319,.244),.28*f.primary);
}

// Shell hatching and egg cracks belong to their hosts in the wide painting.
const nurseryInk=Array.from({length:3},(_,i)=>({
  id:'eggshell-'+i,x:.554+i*.045,y:.773+.012*(i%2),
  glyph:['╱','⌁','╲'][i],size:.008,ink:'#e3e2ad',pass:4+i,
}));
const pressureInk=Array.from({length:3},(_,i)=>({
  id:'operculum-'+i,x:.406+i*.031,y:.538+.006*i,
  glyph:'╵',size:.004,ink:'#b1d6bb',pass:4+i%3,
}));

const bellEye=[.608,.349,.041];
const siltEye=[.530,.490,.047];
// The Siltback occupies a separate, distant inlet left of the nursery.
const visitor={scale:.88,x:.034,y:.104};
const returningFrik=mirrorAnsiInk(frikStandingInk,{horizontal:true});
const returnGate=[visitor.x+visitor.scale*(1-frikLook.x),visitor.y+visitor.scale*frikLook.y,
  visitor.scale*frikLook.span];
const visitorRestContacts=[[.516,.867,.067],[.363,.898,.068]];

function lensEye(x,y,f,anchor,rx,ry,tint,under){
  const [cx,cy]=anchor;
  const u=(x-cx+(y-cy)*.13)/rx,v=(y-cy)/ry,r=u*u+v*v;
  if(r>1.26)return under;
  const z=Math.sqrt(Math.max(0,1-r/1.26));
  const light=clamp(.22-u*.34-v*.40+z*.49);
  let ink=r>1?mix(0x101b2c,tint,light*.49):mix(0x132437,tint,light*.78);
  ink=mark(ink,0x14252b,Math.abs(r-1.13)*rx,.0022,f.pixel);
  ink=mark(ink,mix(tint,0x597c67,.6),Math.abs(r-.93)*rx,.0016,f.pixel);
  if(r<.71){
    const radial=Math.atan2(v,u),fibers=Math.sin(radial*39+Math.sqrt(r)*9);
    ink=mix(ink,tint,Math.max(0,fibers)*.20);
  }
  if(ellipse(u-.074,v-.028,.61,.72)<1)ink=0x0b172b;
  return cast(ink,0xfff2c0,ellipse(u+.24,v+.37,.29,.23),.83);
}

const bellLimbs=[
  [.468,.547,.380,.691,.358,.833,.026],[.503,.596,.474,.771,.446,.894,.038],
  [.576,.556,.653,.693,.716,.818,.029],[.624,.548,.693,.647,.766,.746,.038],
];

function limbInk(x,y,f,under,[ax,ay,bx,by,cx,cy,radius],near) {
  if(x<Math.min(ax,bx,cx)-radius-.027||x>Math.max(ax,bx,cx)+radius+.040||
    y<Math.min(ay,by,cy)-radius*1.4||y>Math.max(ay,by,cy)+.045)return under;
  const ux=bx-ax,uy=by-ay,lx=cx-bx,ly=cy-by;
  const upperT=clamp(((x-ax)*ux+(y-ay)*uy)/(ux*ux+uy*uy));
  const lowerT=clamp(((x-bx)*lx+(y-by)*ly)/(lx*lx+ly*ly));
  const a=distance(x,y,ax,ay,bx,by), b=distance(x,y,bx,by,cx,cy);
  const joint=ellipse(x-bx+.14*(y-by),y-by,radius*.70,radius*1.24);
  const upper=a/(radius*(1.04+.32*Math.sin(upperT*Math.PI)-upperT*.29));
  const lower=b/(radius*(.69-.35*lowerT+.14*Math.sin(lowerT*Math.PI)));
  const d=Math.min(upper,lower,Math.sqrt(joint));
  if(d<1.12) {
    const z=Math.sqrt(Math.max(0,1-d*d));
    const upperPart=upper<lower;
    const qx=upperPart?ax+ux*upperT:bx+lx*lowerT;
    const side=(x-qx)/radius;
    const bend=clamp(.21-side*.39+z*.59-(near?0:.13));
    let tone=mix(0x142a37,near?0xd1a272:0x846c63,bend);
    if(joint<1.8){
      tone=mix(tone,0x514a41,smooth((joint-.68)*3)*smooth((1.28-joint)*3)*.33);
    }
    if(upperPart&&upperT>.18&&upperT<.77){
      const shield=ellipse(side+.12,upperT-.46,.66,.31);
      tone=cast(tone,near?0xceab84:0x665a52,shield,near?.27:.20);
    }
    const tendon=distance(x+.009,y-.007,bx,by,cx,cy);
    const groove=mark(tone,0xf0ac71,tendon,.0025,f.pixel);
    under=mix(under,mix(tone,groove,z*.36),smooth((1.12-d)*8.34));
  }
  const pad=ellipse(x-cx-.016,y-cy,.036,.014);
  if(pad<1)under=mix(under,mix(0x392938,0xc08d74,clamp((1-pad)*.92)),smooth((1-pad)*6));
  if(y>cy-.011&&y<cy+.025){
    for(let toe=0;toe<3;toe++){
      const tipX=cx+.017+toe*.015,tipY=cy+.022-(toe===1?.006:0);
      const digit=distance(x,y,cx+.008+toe*.007,cy+.002,tipX,tipY);
      under=mark(under,0x523e49,digit,.0034,f.pixel);
      under=mark(under,0xdac195,Math.abs(digit-.0008),.0011,f.pixel);
    }
  }
  return under;
}

// Each lobe contributes to one relief envelope. Slope and color are sampled
// after joining the forms so the anatomical connections share their shading.
function merge(a,b,width) {
  const overlap=Math.max(width-Math.abs(a-b),0)/width;
  return Math.max(a,b)+overlap*overlap*width*.25;
}

function bellMantle(x,y) {
  const torso=1-ellipse(x-.481,y-.551-.075*Math.sin((x-.34)*6.3),.176,.151);
  const shoulder=1-ellipse(x-.565+.19*(y-.521),y-.525,.112,.132);
  const neck=1-ellipse(x-.607-.096*Math.cos((y-.364)*10.2),y-.431,.076,.170);
  const skull=1-ellipse(x-.625,y-.335+.34*(x-.636),.104,.094);
  const muzzle=1-ellipse(x-.691,y-.338-.20*(x-.69),.079,.048);
  const jaw=1-ellipse(x-.697,y-.414+.14*(x-.71),.075,.041);
  let skin=merge(merge(merge(torso,shoulder,.31),merge(neck*.92,skull,.29),.29),muzzle*.73,.20);
  skin=merge(skin,jaw*.66,.11);
  skin=Math.min(skin,(ellipse(x-.731,y-.381,.068,.022)-1)*.54);
  return merge(skin,(1-bellArmor(x,y))*.63,.10);
}

function bellArmor(x,y){
  let hull=8;
  for(let i=0;i<3;i++){
    const cx=.354+.071*i,cy=.483+i*.008;
    const dy=y-cy;
    const plate=ellipse(x-cx+.31*dy,dy,.064,.059);
    hull=Math.min(hull,plate);
  }
  return hull;
}

const bellCrestSegments=Array.from({length:3},(_,trip)=>{
 const out=[],crests=[[[.602,.308],[.528,.261],[.526,.151],.020],
  [[.655,.309],[.616,.231],[.650,.158],.017]];
 for(const [a,b,c,width] of crests)for(let segment=0;segment<6;segment++){
  const at=t=>[(1-t)**2*a[0]+2*t*(1-t)*b[0]+t*t*c[0],
    (1-t)**2*a[1]+2*t*(1-t)*b[1]+t*t*(c[1]-(trip===1?.023:trip===2?-.012:0))];
  const t=segment/6,next=(segment+1)/6,p=at(t),q=at(next);
  out.push([...p,...q,width*(1-t*.90),t]);
 }
 return out;
});
function bellCrest(x,y,f,under){
 if(x<.49||x>.73||y<.12||y>.33)return under;
 let closest=1;
 for(const [ax,ay,bx,by,radius,t] of bellCrestSegments[f.trip]){
  if(x<Math.min(ax,bx)-radius||x>Math.max(ax,bx)+radius||y<Math.min(ay,by)-radius*1.4||y>Math.max(ay,by)+radius*1.4)continue;
  const d=distance(x,y,ax,ay,bx,by);
  if(d/radius>=closest)continue;
  closest=d/radius;
  const shade=Math.sqrt(Math.max(0,1-(d/radius)**2));
  const dx=bx-ax,dy=by-ay;
  const along=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy));
  const across=((x-ax)*dy-(y-ay)*dx)/Math.hypot(dx,dy)/radius;
  let ink=mix(0x17343c,0xd5c99a,clamp(.23+shade*.53-across*.26));
  ink=mark(ink,mix(ink,0x556b61,.4),repeat(t+along/6,.18)*radius*2,.0004,f.pixel);
  under=ink;
 }
 return under;
}

function bellRelief(x,y) {
  const mantle=bellMantle(x,y);
  const gill=ellipse(x-.646-.24*(y-.430),y-.430,.081,.104);
  const hip=ellipse(x-.408,y-.560,.068,.125);
  const brow=ellipse(x-.600,y-.309+.22*(x-.603),.064,.022);
  const cheek=ellipse(x-.661,y-.368,.078,.061);
  const flank=ellipse(x-.475,y-.553,.171,.117);
  const scutes=smooth((1-flank)*4)*Math.max(0,1-bellArmor(x,y));
  const shoulder=ellipse(x-.554,y-.508,.072,.112);
  const flutes=repeat(y-.052*Math.sin((x-.41)*11)+x*.29,.047);
  const pleat=Math.sqrt(Math.max(0,1-(flutes/.022)**2))*smooth((1-shoulder)*3);
  return Math.sqrt(Math.max(0,mantle))*.126+
    .032*Math.max(0,1-hip)+.024*Math.max(0,1-brow)+.025*Math.max(0,1-cheek)+
    .018*scutes+.003*pleat-.032*Math.max(0,1-gill);
}

// Normals are immutable surface data, sampled in the creature's bent local
// coordinates. Fine pigment, shell rays, eyes and lights still evaluate at
// the active ANSI pass. This replaces three relief evaluations per pixel.
function createCreatureSurface(relief,materialAt) {
  const width=1024,height=600;
  const field=new Float32Array(width*height);
  const depth=new Float32Array(width*height);
  const pigment=new Uint8Array(width*height),roughness=new Uint8Array(width*height);
  for(let row=0;row<height;row++){
    const y=(row+.5)/height;
    for(let col=0;col<width;col++){
      const x=(col+.5)/width;
      const z=relief(x,y),i=row*width+col;
      const slot=materialAt(x,y),u=x*2.7+y*.13,v=y*2.1;
      depth[i]=z+(z>0?(frikCraftSurface(slot,u,v)-.5)*.0025:0);
      pigment[i]=Math.round(clamp(frikCraftSurface(slot,u,v,1))*255);
      roughness[i]=Math.round(clamp(frikCraftSurface(slot,u,v,3))*255);
    }
  }
  // One material/height bake; central differences then reuse the same field.
  for(let row=0;row<height;row++)for(let col=0;col<width;col++){
    const i=row*width+col;
    const dx=(depth[row*width+Math.min(width-1,col+2)]-depth[row*width+Math.max(0,col-2)])*width/4;
    const dy=(depth[Math.min(height-1,row+2)*width+col]-depth[Math.max(0,row-2)*width+col])*height/4;
    field[i]=clamp(.14+(.63+.58*dx+.78*dy)/Math.hypot(1,dx,dy)*.91);
  }
  const sample=(field,x,y)=>{
    const u=clamp(x)*width-.5,v=clamp(y)*height-.5;
    const col=Math.max(0,Math.min(width-2,Math.floor(u)));
    const row=Math.max(0,Math.min(height-2,Math.floor(v))),i=row*width+col;
    const fx=clamp(u-col),fy=clamp(v-row);
    return (field[i]*(1-fx)+field[i+1]*fx)*(1-fy)+
      (field[i+width]*(1-fx)+field[i+width+1]*fx)*fy;
  };
  return {fields:{width,height,depth,light:field,pigment,roughness},light:(x,y)=>sample(field,x,y),depth:(x,y)=>sample(depth,x,y),
    pigment:(x,y)=>sample(pigment,x,y)/255,roughness:(x,y)=>sample(roughness,x,y)/255};
}
const bellSurface=createCreatureSurface(bellRelief,(x,y)=>bellArmor(x,y)<1.1?1:y>.48?4:2);

function belljaw(x,y,f,under) {
  if(x<.245||x>.85||y<.12||y>.943)return under;
  if(f.trip){
    const q=Math.max(0,1-ellipse(x-.48,y-.555,.27,.16)),weight=q*q;
    x+=(x-.48)*(f.trip===1?.27:-.24)*weight;
    y+=(y-.555)*(f.trip===1?-.10:.17)*weight;
  }
  const p=f.pixel;
  let ink=cast(under,0x08162a,ellipse(x-.554,y-.862,.265,.069),.91);
  ink=bellCrest(x,y,f,ink);
  const mouth=ellipse(x-.731,y-.381,.071,.024);
  if(mouth<1.1){
    ink=mix(0x090f20,0x743644,clamp(1-mouth)*.39);
    ink=mark(ink,0xd18474,Math.abs(y-.386-.028*(x-.72)),.0018,p);
  }
  // A single dusk-red brood mantle between three load-bearing spines.
  if(x>.28&&x<.53){
    const u=(x-.28)/.25,root=.515+.03*u;
    const height=Math.sin(Math.PI*u)*(.114+.035*Math.cos(u*Math.PI*4));
    const h=(root-y)/Math.max(.0001,height);
    if(h>0&&h<1){
      ink=mix(0x5e3847,0xc37c5b,.23+.52*h);
      ink=mark(ink,0xecb17e,Math.abs(1-h)*height,.0024,p);
      ink=mark(ink,0x97594e,repeat(u+.022*h,.49)*.25,.003,p);
    }
  }
  const skin=bellMantle(x,y);
  if(skin<0&&y>.51){
    for(const i of [0,2])ink=limbInk(x,y,f,ink,bellLimbs[i],false);
  }
  if(skin>-.054) {
    const edgeWeight=smooth(skin*4);
    const dx=f.ray*1.40*edgeWeight,dy=-f.tilt*1.35*edgeWeight;
    let lift=bellSurface.depth(x,y);
    if(Math.abs(dx)+Math.abs(dy)>.001){
      for(let step=0;step<3;step++)lift=bellSurface.depth(x+dx*lift,y+dy*lift);
    }
    const surfaceX=x+dx*lift,surfaceY=y+dy*lift;
    const light=bellSurface.light(surfaceX,surfaceY);
    const undertone=clamp(.50+(surfaceX-.49)*1.41+(surfaceY-.5)*.43);
    const pigment=mix(0x647c78,0xb77b55,undertone);
    let body=mix(0x142637,pigment,light);
    body=mix(body,0xf2c997,smooth((light-.52)*1.95)*.62);
    const physical=bellSurface.pigment(surfaceX,surfaceY),rough=bellSurface.roughness(surfaceX,surfaceY);
    body=mix(body,0x5b796f,physical*.20);
    body=mix(body,0xf2cba0,Math.max(0,light-.64)*(1-rough)*.75);
    // One matte saddle silhouette over a warm unbroken flank. Only the
    // overlapping free edges of its three shields take a light-catching cut.
    const mantle=bellArmor(surfaceX,surfaceY);
    const coverage=smooth((1.13-mantle)*4);
    const freeEdge=repeat(surfaceX+.37*(surfaceY-.46)-.007*Math.cos(surfaceY*28),.071);
    let plate=mix(0x354447,0xa18b68,clamp(.25+light*.64));
    plate=mark(plate,0x6a6458,freeEdge,.0021,p);
    body=mix(body,plate,coverage*.91);
    body=mark(body,mix(body,0xcfad80,.65),Math.abs(mantle-.99)*.026,.0018,p);
    // Broad insulating breast runs up into a pale, horn-sheathed snout.
    const bib=smooth((surfaceX-.558+.24*(surfaceY-.43))*20);
    body=mix(body,0xcc956c,bib*.33*light);
    if(surfaceX>.655&&surfaceY<.378)body=mix(body,0xe1c499,smooth((surfaceX-.655)*19)*.64);
    // Cheek inserts, seated jaw hinge and a real recessed nostril.
    if(surfaceX>.572&&surfaceY<.423){
      const cheek=ellipse(surfaceX-.665,surfaceY-.368,.072,.054);
      body=edge(body,(cheek-.88)*.021,.0020,f,0x27303e,0xd5af83);
      const nostril=ellipse(surfaceX-.756,surfaceY-.345,.009,.0055);
      body=cast(body,0x0b1927,nostril,.96);
      body=mark(body,0xe4be8c,Math.abs(nostril-1.1)*.004,.0011,p);
      const hinge=ellipse(surfaceX-.579,surfaceY-.398,.019,.024);
      body=cast(body,0x243343,hinge,.76);
      body=mark(body,0xb49278,Math.abs(hinge-.91)*.014,.0018,p);
    }
    if(surfaceX>.655) {
      const bite=.357+.14*(surfaceX-.68)+.014*Math.sin(surfaceX*26);
      const taper=smooth((surfaceX-.655)*35);
      body=mix(body,mark(body,0x241d2e,Math.abs(surfaceY-bite),.0036,p),taper);
      body=mix(body,mark(body,0xe8b38a,Math.abs(surfaceY-bite+.009),.0017,p),taper);
    }
    body=cast(body,0xca765b,ellipse(surfaceX-.626,surfaceY-.477,.147,.180),.30*f.primary);
    ink=mix(ink,body,smooth((skin+.054)*18.52));
  }
  if(y>.54){
    for(const i of [1,3]){
      const root=i===1?.503:.624;
      if(Math.abs(x-root)>.22)continue;
      const thigh=limbInk(x,y,f,ink,bellLimbs[i],true);
      ink=mix(ink,thigh,smooth((y-(i===1?.594:.56))*22));
    }
  }
  if(x>.682&&x<.780&&y>.355&&y<.412){
    const tooth=Math.floor((x-.682)/.025),cx=.694+tooth*.025;
    const top=.363+.005*(tooth%2),length=.029-(tooth%2)*.006,t=(y-top)/length;
    if(t>0&&t<1){
      const axis=cx-.005*t*t,width=.007*(1-t)+.0005;
      const side=(x-axis)/width;
      if(Math.abs(side)<1)ink=mix(0x707f6a,0xe6d9ab,clamp(.48-side*.26+Math.sqrt(1-side*side)*.35));
    }
  }
  const throat=.456+f.throat*.65;
  const u=(x-.675+.43*(y-throat))/.047, v=(y-throat)/.075;
  const sac=u*u+v*v;
  if(sac<1.035) {
    const z=Math.sqrt(Math.max(0,1-sac));
    const light=clamp(.29-u*.30-v*.57+z*.26);
    const attachment=smooth((v+.87)*2.1)*smooth((u+.94)*2.4);
    let glass=mix(0x754c42,0xdd985c,attachment*(.32+light*.47));
    glass=cast(glass,0xffdf95,ellipse(u-.08,v-.11,.55,.69),.73*f.primary);
    const lip=v-.53+.22*u*u;
    glass=mark(glass,0xb66150,Math.abs(lip)*.063,.0021,p);
    glass=cast(glass,0xffedc4,ellipse(u+.27,v+.49,.38,.26),.36);
    ink=mix(ink,glass,smooth((1.035-sac)*4)*(.50+.50*attachment));
  }
  return lensEye(x,y,f,bellEye,.045,.067,0xeeb56f,ink);
}

function siltShape(x,y) {
  const dx=x-.516;
  const axis=.507+.027*Math.sin(dx*10)+.082*Math.max(0,dx);
  const crown=1-ellipse(dx,y-axis,.244,.148-.21*Math.max(0,dx));
  const collar=.81*(1-ellipse(x-.563,y-.550,.177,.091));
  const muzzle=.76*(1-ellipse(x-.686,y-.538-.11*(x-.69),.103,.048));
  const tailSpan=clamp((x-.10)/.31);
  const tail=.77*(1-ellipse(x-.292,y-.562+.17*(x-.26),.194,.016+.066*tailSpan));
  return merge(merge(merge(crown,collar,.35),muzzle,.27),tail,.36);
}

function siltRelief(x,y) {
  const skin=siltShape(x,y);
  const fan=ellipse(x-.475,y-.472,.242,.204);
  const hood=ellipse(x-.524,y-.431,.142,.099);
  const lip=ellipse(x-.704,y-.539,.067,.042);
  return .151*Math.sqrt(Math.max(0,skin))+.052*Math.max(0,1-fan)+
    .038*Math.max(0,1-hood)+.014*Math.max(0,1-lip)-
    .027*Math.max(0,1-ellipse(x-.585,y-.603,.149,.058));
}
const siltSurface=createCreatureSurface(siltRelief,(x,y)=>y>.56?2:x<.30?4:7);
const siltCrown=[
 [.418,.468,.280,.315,.021],[.460,.447,.365,.277,.029],

];
function sensoryCrown(x,y,f,under){
 if(x<.24||x>.59||y<.18||y>.49)return under;
 for(let i=0;i<siltCrown.length;i++){
  const [ax,ay,tx,ty,width]=siltCrown[i];
  const bx=tx+(f.effects?Math.sin(f.time*(.63+i*.11)+i)*.008:0)+(f.trip-1)*.009;
  const by=ty-(f.trip===2?.018:0),dx=bx-ax,dy=by-ay;
  const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy));
  const cx=ax+dx*t+.011*Math.sin(t*Math.PI),cy=ay+dy*t;
  const reach=width*Math.sin(Math.PI*t)**.72+.002;
  const across=(x-cx)/reach,d=ellipse(x-cx,y-cy,reach,reach*.65);
  if(d>1)continue;
  const slot=repeat(t,.19);
  if(Math.abs(across)>.91&&t>.44&&slot<.017)continue;
  const light=clamp(.28-across*.28+Math.sqrt(1-d)*.52);
  let ink=mix(0x1b2942,0x9faeb0,light);
  const vein=Math.abs(x-cx+.002*Math.sin(t*23));
  ink=mark(ink,0xcee7cd,vein,.0015,f.pixel);
  ink=mix(ink,0x5d858c,.22*t);
  if(f.effects)ink=mix(ink,0x8ef4db,Math.max(0,t-.67)*f.primary*.7);
  under=ink;
 }
 return under;
}

function siltback(x,y,f,under) {
  if(x<.041||x>.820||y<.18||y>.943)return under;
  const p=f.pixel;
  // One inverse bend moves the tail, trailing fins and shell together.
  // Its gain and derivative reach zero before the eye aperture.
  const rear=smooth((.493-x)/.425);
  if(f.trip===1)y-=rear*(.035+.025*Math.sin((x-.10)*9));
  if(f.trip===2)y=.582+(y-.582)/(1+rear*.70);
  const motion=f.effects?rear*(.052*f.swimA+.028*f.swimB*(.52-x)*2.2):0;
  y-=motion;
  const skin=siltShape(x,y);
  let ink=under;
  // Bifurcated caudal flukes: two lobes grip the same bending tail root.
  if(x<.282&&y>.34&&y<.75){
    const tx=(x-.068)/.204;
    if(tx>0&&tx<1){
      for(const branch of [-1,1]){
        const mid=.563+branch*(1-tx)*(1-tx)*.145;
        const width=.002+.046*Math.sin(tx*Math.PI);
        const side=(y-mid)/width;
        if(Math.abs(side)<1){
          ink=mix(0x203651,branch<0?0x92c8b4:0xbb7f92,clamp(.55-side*.24+.19*Math.cos(tx*19)));
          ink=mark(ink,0xe3d4ac,Math.abs(side+.86)*width,.0017,p);
          ink=mix(ink,0x657d96,Math.max(0,-side)*.22);
        }
      }
    }
  }
  // A long near-side hydrofoil starts under the gill cover and narrows to a recurved tip.
  if(x>.253&&x<.495&&y>.529&&y<.797){
    const t=(.495-x)/.242;
    const axis=.542+.208*Math.sin(t*1.40)-.039*t*t*t;
    const width=.008*(1-t)+.041*Math.sin(Math.PI*t);
    const side=(y-axis)/Math.max(.0001,width);
    if(Math.abs(side)<1){
      ink=mix(0x20384d,0x779598,clamp(.52-side*.37+.17*Math.sin(t*3.14)));
      ink=mark(ink,0xb8c1a7,Math.abs(side+.85)*width,.0018,p);
    }
  }
  ink=sensoryCrown(x,y,f,ink);
  if(skin<0&&x>.246&&x<.733&&y>.521&&y<.898) {
    for(let i=0;i<2;i++) {
      const root=.440+i*.128, end=.355+i*.125;
      const t=clamp((y-.54)/(.226+.021*(i%2)));
      const sweep=end+(root-end)*(1-t)+.033*t*t*Math.sin(f.time*.90+i*.72+t*4.5);
      const width=.015*(1-t)**.65+.0025;
      const d=Math.abs((x-sweep)/width);
      const reach=smooth((y-.521)*36)*smooth((.988-t)/.13);
      if(d<1&&reach>0) {
        const light=clamp(.37+(sweep-x)/width*.50+Math.sqrt(1-d*d)*.32);
        let frond=mix(0x17253c,0xbc909d,light);
        const rib=repeat(t+.021*Math.cos((x-sweep)*310),.116);
        frond=mark(frond,0x513f5c,rib*.041,.0017,p);
        frond=mark(frond,0x9ce0cc,Math.abs(x-sweep+width*.25),.0011,p);
        ink=mix(ink,frond,reach*smooth((1-d)*6));
      }
    }
  }
  if(skin>-.043){
    const edgeWeight=smooth(skin*4);
    const dx=f.ray*1.40*edgeWeight,dy=-f.tilt*1.35*edgeWeight;
    let lift=siltSurface.depth(x,y);
    if(Math.abs(dx)+Math.abs(dy)>.001){
      for(let step=0;step<3;step++)lift=siltSurface.depth(x+dx*lift,y+dy*lift);
    }
    const surfaceX=x+dx*lift,surfaceY=y+dy*lift;
    const lit=siltSurface.light(surfaceX,surfaceY);
    // Dorsal hood and countershaded belly meet at a single sweeping edge.
    const waterline=.556+.035*Math.cos((surfaceX-.46)*10)-.09*(surfaceX-.51);
    const belly=smooth((surfaceY-waterline)*55);
    const hood=mix(0x0c273c,0x427481,clamp(.08+.86*lit));
    const lowerPlane=smooth((.646-surfaceY)*9+lit*.49);
    let shell=mix(hood,mix(0x31475b,0xb6c8b8,lowerPlane),belly);
    if(belly>.1&&surfaceX>.52){
      const jaw=ellipse(surfaceX-.622,surfaceY-.562+.12*(surfaceX-.59),.109,.055);
      shell=cast(shell,0xb3c2ad,jaw,.40*belly);
      const pouch=surfaceY-.563+.13*(surfaceX-.62);
      const pleat=repeat(pouch+.009*Math.cos(surfaceX*24),.018);
      const seat=smooth((1-jaw)*4);
      shell=mix(shell,mark(shell,0x57757b,pleat,.0015,f.pixel),seat*.51);
    }
    // The sensory saddle carries four broken cream bars. Their ends turn with the hull.
    const saddle=ellipse(surfaceX-.473,surfaceY-.428+.12*(surfaceX-.45),.124,.048);
    if(saddle<1){
      const pigment=repeat(surfaceX+.35*(surfaceY-.43)+.012*Math.cos(surfaceY*26),.065);
      shell=mix(shell,0x9cb7a5,smooth((.008-pigment)*145)*smooth((1-saddle)*2)*.63);
    }
    const faceMask=ellipse(surfaceX-.621,surfaceY-.495+.25*(surfaceX-.62),.149,.052);
    shell=mix(shell,0x152c45,smooth((1-faceMask)*4)*.70);
    if(surfaceX>.662&&surfaceY>.493&&surfaceY<.588){
      const mouth=surfaceY-.556-.18*(surfaceX-.70);
      shell=mark(shell,0x0a1c2d,Math.abs(mouth),.0034,p);
      shell=mark(shell,0xbddbc6,Math.abs(mouth-.006),.0016,p);
      shell=cast(shell,0x152438,ellipse(surfaceX-.745,surfaceY-.533,.008,.005),.87);
    }
    // Three open gills face the current. Only the inner lips bioluminesce.
    if(surfaceX>.354&&surfaceX<.501&&surfaceY>.466&&surfaceY<.593){
      for(let i=0;i<3;i++){
        const cx=.397+i*.031,cy=.534+i*.006;
        const v=(surfaceY-cy)/(.046-i*.006);
        const u=(surfaceX-cx-.012*(1-v*v)+.21*(surfaceY-cy))/.006;
        const slot=u*u+v*v;
        if(slot<1)shell=mix(0x0b2130,0x73beb3,clamp(.22-u*.48+f.energy*.22));
      }
    }
    // One swept sculling fin casts an attachment shadow against the belly.
    const fin=ellipse(surfaceX-.450+1.23*(surfaceY-.591),surfaceY-.591,.064,.034);
    if(fin<1)shell=mix(shell,0x749193,clamp((1-fin)*1.7)*.53);
    ink=mix(ink,shell,smooth((skin+.043)*23.26));
  }
  ink=lensEye(x,y,f,siltEye,.050,.067,0x9ceadd,ink);
  return f.distant&&ink!==under?mix(ink,0x2d5b6b,.23):ink;
}

const heat=[0x210e2c,0x4e2456,0x783352,0xad525d,0xfb9474,0x391d4c,0x201831,0xd17877,0xffda98];
function coast(x,y,f){
  let color=tidalWorld(x,y,f,visible);
  const inlet=ellipse(x-.208,y-.646,.287,.128);
  if(inlet<1){
    color=mix(0x102d40,0x406d78,smooth(inlet)*.47);
    color=mark(color,0x73aaac,Math.abs(inlet-.97)*.045,.0028,f.pixel);
    color=mark(color,0x3f737d,repeat(y+.006*Math.sin(x*58+f.time),.032),.0016,f.pixel);
  }
  const distant=f.layout.distant;
  const localX=(x-distant.x)/distant.scale,localY=(y-distant.y)/distant.scale;
  color=siltback(localX,localY,f.small,color);
  for(const [,,,,cx,cy] of bellLimbs){
    if(Math.abs(x-cx)>.070||Math.abs(y-cy-.016)>.035)continue;
    const stone=ellipse(x-cx,y-cy-.017,.063,.027);
    if(stone<1){
      color=mix(0x112c3c,0x688679,clamp(.61-(y-cy)*15-(x-cx)*3.5));
      color=mark(color,0x244953,Math.abs(y-cy-.027-.023*Math.cos((x-cx)*32)),.0024,f.pixel);
      color=cast(color,0x081725,ellipse(x-cx,y-cy-.011,.037,.010),.74);
    }
  }
  color=belljaw(x,y,f,color);
  const nest=ellipse(x-.601,y-.799+.10*(x-.60),.105,.046);
  if(nest<1){
    color=mix(0x294147,0x80735c,clamp(.58-(y-.791)*10-.23*nest));
    color=mark(color,0xaf9d78,Math.abs(nest-.89)*.031,.0022,f.pixel);
  }
  if(x>.52&&x<.69&&y>.704&&y<.833){
    for(let i=0;i<3;i++){
      const tap=f.trip===2?Math.max(0,Math.cos(f.time*2.1))**9:0;
      const rock=i===1&&f.effects?.0045*Math.sin(f.time*.87)+.006*tap:0;
      const cx=.554+i*.045+rock,cy=.766+.012*(i%2)-.2*rock;
      const u=(x-cx)/.027,v=(y-cy)/.043,d=u*u+v*v;
      if(d>=1.08)continue;
      const light=clamp(.40-u*.25-v*.47+Math.sqrt(Math.max(0,1-d))*.33);
      let shell=mix(0x223a44,0xada779,light);
      const seam=v+.18*Math.cos(u*3+f.trip*.7)+.035*Math.sin(f.time*.37+i);
      shell=mark(shell,0x86d5ba,Math.abs(seam-.13)*.027,.0018,f.pixel);
      shell=cast(shell,0xc4efad,ellipse(u+.23,v+.29,.44,.51),.25*f.primary);
      if(i===1){
        const chip=Math.abs(u+.11+.32*Math.abs(v+.29));
        if(v<.12)shell=mark(shell,0x443e43,chip*.024,.0017,f.pixel);
      }
      color=mix(color,shell,smooth((1.08-d)*10));
    }
  }
  if(y>.633&&y<.839&&x>.703) {
    color=cast(color,0xe88b69,ellipse(x-.758,y-.740,.111,.094),.27*f.primary);
  }
  return color;
}
function heatSight(x,y,f){
  // A lower eye position and a shifted sightline retain the same split arch.
  const wx=.5+(x-.5)*.93, wy=y-.060*Math.cos((x-.48)*2.91);
  let color=tidalWorld(wx,wy,f,heat);
  color=cast(color,0xffb767,ellipse(x-.684,y-.752,.236,.119),.22);
  if(y>.689&&y<.849) {
    const wake=ellipse(x-.477,y-.758,.342,.055);
    color=mark(color,0xba8d9d,Math.abs(wake-.96)*.030,.0034,f.pixel);
  }
  const plume=Math.abs(x-.51-.07*Math.sin(y*12-f.time*.48));
  if(y>.17&&y<.57)color=cast(color,0xfcaa6d,(plume/(.045+.13*(.58-y)))**2,.33*smooth((y-.17)*5));
  return siltback(x,y,f,color);
}
function tideSight(x,y,f){
  const dx=x-.480,dy=y-.407;
  const r=dx*dx+dy*dy*.56;
  let color=tidalWorld(x+dx*r*.94,y+dy*r*.61+.035,f,pressure);
  const wave=repeat(ellipse(dx,dy,.52,.59)-f.time*.071+.068*Math.cos(dx*21),.30);
  if(y>.53)color=mix(color,mark(color,0x95e9eb,wave*.067,.0018,f.pixel),.28);
  if(y>.50 && y<.84){
    const echo=Math.hypot((x-.43)*1.28,y-.86)-f.time*.045;
    const train=repeat(echo,.168);
    color=mark(color,0x68a6b4,train,.0018,f.pixel);
    color=mark(color,0x486c91,Math.abs(train-.009),.0011,f.pixel);
  }
  const shore=.845+.056*Math.cos(x*8.6);
  if(y>shore&&x<.636) {
    color=mix(color,0x385a70,smooth((y-shore)*18)*.59);
    color=mark(color,0x79b8b0,Math.abs(y-shore),.004,f.pixel);
  }
  for(const [cx,cy,rx] of f.visitorContacts){
    color=cast(color,0x071626,ellipse(x-cx,y-cy,rx,.014),.83);
  }
  // The filter feeder looks across to the same Frik standing in the shoal.
  const actor=f.layout.visitor;
  color=returningFrik((x-actor.x)/actor.scale,(y-actor.y)/actor.scale,f.actorState,color);
  if(y>.847&&y<.925){
    for(const [cx,cy,rx] of f.visitorContacts){
      const feet=ellipse(x-cx,y-cy,rx,.010);
      color=mark(color,0x84c8c5,Math.abs(feet-1)*.020,.0018,f.pixel);
    }
  }
  return color;
}

const glow=(u,v,size,tint,power,flicker,shape,rate,depth)=>
  ({u,v,size,tint,power,flicker,shape,rate,depth});
const pin={core:.40,halo:.90,white:.89,falloff:'tight'};
const soft={core:.18,halo:1.8,white:.27,falloff:'mist'};
const bowl={core:.28,halo:1.63,white:.67,falloff:'soft',aspect:1.3};

export const frikMindArt = [
  {name:'Waters of Time',view:'The keeper listens to a living memory in the basin',ink:bridge,
    glyphs:frikInkStrokes,
    gate:[frikLook.x,frikLook.y,frikLook.span],depth:[.085,.038],duration:8.6,eye:true,
    lights:[
      glow(.728,.600,.099,0x5ae5ef,.88,'slow-flow',bowl,.63,.90),
      glow(.147,.709,.036,0x269be8,.57,'slow-flow',soft,.44,.76),
      glow(.551,.141,.034,0x6ae7f9,.69,'scanner',pin,.59,.64),
      glow(frikLook.x-.008,frikLook.y-.017,.018,0xb9e9ce,.73,'heartbeat',pin,.61,.48),
    ]},
  {name:'Homeworld Orbit',view:'Follow the glowing inlet down into the planet',ink:orbit,
    gate:[.592,.539,.098],depth:[.025,.012],duration:6.4,shore:true,
    lights:[glow(.330,.212,.19,0x61aabd,.66,'slow-flow',soft,.47,.51)]},
  {name:'Beneath the Tide',view:'The Waters lift a nursery memory from the planet core',ink:coreMemory,
    gate:[.525,.423,.110],depth:[.057,.031],duration:7.9,
    lights:[
      glow(.525,.423,.065,0x90efc5,.78,'slow-flow',soft,.51,.67),
      glow(.524,.644,.126,0x4bcdc3,.81,'heartbeat',bowl,.43,.70),
    ]},
  {name:'The Flooded Caldera',view:'A Belljaw warms three eggs while a Siltback watches',ink:coast,glyphs:nurseryInk,
    gate:bellEye,depth:[.076,.025],duration:9.6,
    lights:[
      glow(.672,.468,.037,0xffa660,.49,'candle',soft,.95,.87),
      glow(.599,.334,.033,0xffcb82,.70,'heartbeat',pin,.71,.58),
      glow(.181,.481,.022,0x64f0d5,.49,'double-pulse',soft,.43,.58),
    ]},
  {name:'Heat Sight',view:'Belljaw sees the Waters glowing inside the Siltback',ink:heatSight,glyphs:pressureInk,
    gate:siltEye,depth:[.055,.026],duration:8.6,
    lights:[
      glow(.435,.544,.045,0xa6ffda,.63,'double-pulse',bowl,.67,.88),
      glow(.526,.479,.036,0x98f8e0,.68,'ember',pin,.56,.58),
    ]},
  {name:'Friktal HQ BBS',view:'Colony radio translates the pressure pulses into a live board transmission.',ink:frikAdInk,
    paintCells:paintFrikAd,gate:frikAdGate,depth:[.026,.017],duration:6.8,
    lights:[
      glow(.50,.405,.154,0x33bcdd,.66,'scanner',soft,.63,.55),
      glow(frikAdGate[0],frikAdGate[1],.024,0xffda8b,.74,'beacon',pin,.57,.51),
    ]},
  {name:'Tide Sight',view:'Siltback recognizes the same Waters in its Frik keeper',ink:tideSight,
    glyphs:frikInkStrokes,glyphActor:{...visitor,mirror:true},
    gate:returnGate,depth:[.070,.045],duration:9.4,
    lights:[
      glow(.330,.445,.14,0x70c6f5,.76,'slow-flow',soft,.52,.73),
      glow(returnGate[0],returnGate[1]-.020,.023,0x9af5df,.79,'beacon',pin,.4,.55),
    ]},
];

export function makeMindState(index,time,effects,pixel,swing,motionSeed=0,grade=8,trip=0,audio=[],rewinding=false,pitch=swing,bearing=swing,elevation=pitch){
  const style=frikMindArt[index];
  trip=frikStoryIndex(trip);
  const layout=frikMemoryLayout(trip),cymatic=frikCymaticProfiles[trip];
  const bass=effects?clamp(audio?.[0]??0):0;
  const energy=effects?clamp(Math.max((audio?.[4]??0)*12,bass*.9,(audio?.[1]??0)*.7)*cymatic.gain):0;
  const rig=effects&&(style.eye||style.ink===tideSight)?frikIdleMotion(time,motionSeed):undefined;
  const blink=style.eye&&rig?rig.face.blink:0;
  const lights=style.lights.map((lamp,i)=>{
    if(index===0){
      const [u,v]=i<2?[layout.mirrorBridge?1-lamp.u:lamp.u,lamp.v]:
        frikActorPoint(layout.bridge,lamp.u,lamp.v);
      return {...lamp,u,v};
    }
    if(index===6&&i===1){
      const u=layout.visitor.x+(lamp.u-visitor.x)*layout.visitor.scale/visitor.scale;
      const v=layout.visitor.y+(lamp.v-visitor.y)*layout.visitor.scale/visitor.scale;
      return {...lamp,u,v};
    }
    if(index===3&&i===2)return {...lamp,u:layout.distant.x+.55*layout.distant.scale,
      v:layout.distant.y+.60*layout.distant.scale};
    return lamp;
  });
  const levels=lights.map((lamp,i)=>ansiLightPulse(lamp,time,i,!effects)*
    (1+energy*.30+bass*.20+(effects?clamp(audio?.[3]??0):0)*.30));
  const primary=levels[0];
  const state={time:effects?time:0,effects,blink,pixel,style,primary,levels,rig,grade,trip,rewinding,
    layout,cymatic,lights,
    audio,bass,energy,colorGrade:frikStoryGrade(index,trip),
    pulse:primary,waterLight:primary,
    throat:effects?.013*Math.sin(time*.89):0,
    swimA:effects?Math.sin(time*1.78):0,swimB:effects?Math.cos(time*2.13+.85):0,
    bearing:effects?bearing:0,elevation:effects?elevation:0,
    ray:effects?swing*style.depth[0]:0,tilt:effects?pitch*style.depth[1]:0};
  if(style.ink===coast)state.small={...state,pixel:pixel/layout.distant.scale,distant:true};
  if(style.eye||style.ink===tideSight){
    const actor=style.eye?layout.bridge:layout.visitor;
    state.actorState={...state,pixel:pixel/actor.scale,blink:rig?.face.blink??0};
    state.glyphActor=actor;
  }
  if(style.ink===tideSight)state.visitorContacts=visitorRestContacts.map(([x,y,rx])=>[
    ...frikActorPoint(layout.visitor,x,y),rx*layout.visitor.scale,
  ]);
  return state;
}

export const frikMindFields={orbitStars,bellSurface:bellSurface.fields,siltSurface:siltSurface.fields,spires,ritualBowl,deckWells,bellEye,siltEye,bellLimbs,bellCrestSegments,siltCrown,visitorRestContacts};
