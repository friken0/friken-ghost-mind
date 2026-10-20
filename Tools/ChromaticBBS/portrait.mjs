/* Reuse the canonical exported v19 face and existing three-pass renderer.
 * v19 u_gaze translates eye anatomy in FACE coordinates, not normalized screen
 * coordinates. Keep its movement inside an elliptical socket budget. Head pose
 * is neutral: the canonical renderer has no independent head-pose channel.
 * Speech boundary impulses are approximate; no music or PCM is fabricated. */
import { GhostPortrait } from '../InfiniEngineSite/ghost-renderer.js';
import { faceData, faceLibrary } from './face-data.mjs';

const EYE_TRAVEL_X = .040;
const EYE_TRAVEL_Y = .028;
const EYE_RESPONSE = 18; // ~128 ms to settle 90%; shared renderer draws at 20 Hz.
// Authored gaze units differ across the lineage. Keep actual eye/pupil travel
// bounded, including v6/v7's extra catchlight/pupil lead and v14/v15's .05 gain.
const GAZE_GAIN = { 'v6.0':2.4, 'v7.0':2.6, 'v13.37':1.6, 'v14.0':.05, 'v15.0':.05 };
const FACE_VERSIONS = Object.freeze(faceLibrary.versions.map(({id,title})=>Object.freeze({id,title})));

export function ocularGazeFromPointer(clientX, clientY, rect) {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)
    || !Number.isFinite(rect.left) || !Number.isFinite(rect.top)
    || !Number.isFinite(rect.width) || !Number.isFinite(rect.height)
    || rect.width <= 0 || rect.height <= 0) return null;
  const x = (clientX - rect.left - rect.width / 2) / (rect.width / 2);
  const y = (rect.top + rect.height / 2 - clientY) / (rect.height / 2);
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  // Radial normalization preserves direction at distant pointers and prevents
  // diagonal travel from exceeding the anatomical budget at the corners.
  const radius = Math.max(1, Math.hypot(x, y));
  return [x / radius * EYE_TRAVEL_X, y / radius * EYE_TRAVEL_Y];
}

export function mountPortrait(canvas, report=()=>{}) {
  let portrait;
  try { portrait=new GhostPortrait(canvas,faceData.vertex,report);portrait.setVersion(faceData.version); }
  catch(error){portrait?.destroy();report('Ghost portrait unavailable: '+error.message);return null;}
  let speaking=false,mouth=0,last=performance.now(),gaze=[0,0],target=[0,0],destroyed=false;
  let expression={talk:0,blink:0,smile:.16};
  portrait.expression=time=>{
    const now=performance.now(),dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
    if(portrait.motion){
      const response=1-Math.exp(-EYE_RESPONSE*dt);
      gaze=gaze.map((v,i)=>v+(target[i]-v)*response);
      mouth*=Math.exp(-dt*12);
      const blinkPhase=time%4.7;
      expression={talk:speaking?Math.max(mouth,.18+.55*Math.pow(Math.sin(time*12.1),2)):mouth,blink:blinkPhase<.14?Math.pow(Math.sin(blinkPhase/.14*Math.PI),2):0,smile:.16};
    }
    // Resize/manual draws while paused must not advance eyes, blink or speech.
    const gain=GAZE_GAIN[portrait.version.id]||1;
    portrait.gaze=gaze.map(value=>value/gain);
    return expression;
  };
  const host=canvas.closest('#chromatic-carrier')||canvas;
  const move=event=>{
    const next=ocularGazeFromPointer(event.clientX,event.clientY,canvas.getBoundingClientRect());
    if(next)target=next;
  };
  host.addEventListener('pointermove',move,{passive:true});
  // No leave/recenter handler: retain the last real target when it leaves.
  // The shared constructor honors reduced motion at boot. Explicit hold(false)
  // is the player's opt-in to resume; pointer events alone never start a loop.
  function announce(){
    const {id,title}=portrait.version;
    canvas.setAttribute('aria-label',`Friken.Ghost · ${title} (${id}) · canonical published shader`);
    report(`GHOST ${id} / ${title.toUpperCase()} / THREE PASSES`);
  }
  announce();
  return {
    versions:FACE_VERSIONS,
    get version(){const {id,title}=portrait.version;return {id,title};},
    setVersion(id){
      if(destroyed)throw new Error('Ghost portrait has been destroyed.');
      const version=typeof id==='string'?faceLibrary.versions.find(item=>item.id===id):null;
      if(!version)throw new Error('Unknown canonical Ghost face version.');
      if(portrait.version.id!==id){last=performance.now();portrait.setVersion(version);}
      announce();
      return {id:version.id,title:version.title};
    },
    cymatics(bands){portrait.cymatics=bands.map(x=>Math.max(0,Math.min(1,Number(x)||0)));canvas.dataset.cymatics=portrait.cymatics.map(x=>x.toFixed(3)).join(',');},
    audioLevel(value){speaking=false;mouth=Math.max(0,Math.min(1,Number(value)||0));},
    talking(value){speaking=!!value;if(!speaking)mouth=0;},
    pulse(){if(!destroyed&&portrait.motion)mouth=.85;},
    hold(value){
      if(destroyed)return;
      portrait.motion=!value;last=performance.now();
      if(value)mouth=0;
      portrait.schedule();portrait.draw(portrait.time);
    },
    destroy(){if(destroyed)return;destroyed=true;host.removeEventListener('pointermove',move);portrait.destroy();}
  };
}
