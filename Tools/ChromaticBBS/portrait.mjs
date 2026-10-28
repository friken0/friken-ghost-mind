/* Reuse the canonical exported v19 face and existing three-pass renderer.
 * v19 u_gaze translates eye anatomy in FACE coordinates, not normalized screen
 * coordinates. Keep its movement inside an elliptical socket budget. Head pose
 * is neutral for canonical faces. The provisional 3-D face owns a bounded
 * speech-led performance through the same renderer's scalar uniforms.
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

/** Exact critically damped scalar step. Velocity survives each measured input
 * change, so a beat cannot teleport the wing/body rig. No timer or audio owner. */
export function dampedFlight(value,velocity,target,dt,omega=6){
 if(![value,velocity,target,dt,omega].every(Number.isFinite)||dt<0||omega<=0)throw Error('Invalid flight state');
 if(dt===0)return [value,velocity];
 const t=Math.min(.1,dt),offset=value-target,c=velocity+omega*offset,e=Math.exp(-omega*t);
 return [target+(offset+c*t)*e,(velocity-omega*c*t)*e];
}

/** PCM energy and device boundaries are different evidence. A device word
 * boundary may animate a generic pulse, but can never become an FFT band. */
export function speechSurfaceSignal({speaking=false,measured=false,mouth=0,boundary=0,companion=false,companionMouth=0,companionDevice=false}={}){
 const unit=x=>Math.max(0,Math.min(1,Number(x)||0));
 if(companion)return {energy:companionDevice?0:unit(companionMouth),boundary:companionDevice?unit(companionMouth):0,source:companionDevice?'device-boundary-approximate':companionMouth>0?'measured-pcm':'rest'};
 return {energy:speaking&&measured?unit(mouth):0,boundary:speaking&&!measured?unit(boundary):0,source:!speaking?'rest':measured?'measured-pcm':'device-boundary-approximate'};
}

export function portraitEmergenceAt(from,to,elapsed,duration=.9){
 if(![from,to,elapsed,duration].every(Number.isFinite)||duration<=0)throw Error('Finite portrait emergence required');
 const t=Math.max(0,Math.min(1,elapsed/duration)),ease=t*t*(3-2*t);
 return from+(to-from)*ease;
}

export function mountPortrait(canvas, report=()=>{}, options={}) {
  let portrait;
  const performanceVersion=v=>({...v,shader:performingFace(v.shader),defaults:{...v.defaults,companionTalk:0,frameScale:1,voiceBass:0,voiceMid:0,voiceAir:0,voiceAttack:0,voiceEnergy:0,voiceBoundary:0}});
  try { portrait=new GhostPortrait(canvas,faceData.vertex,report,options);portrait.setVersion(performanceVersion(faceData.version)); }
  catch(error){canvas.dataset.error=error.message;portrait?.destroy();report('Ghost portrait unavailable: '+error.message);return null;}
  let articulation=null,serpentTime=8,gearPhase=0,gearRate=.38,gearAcceleration=0;
  let speakerRole=null,companionMouth=0,companionDevice=false,companionPlaying=false;
  let shotRole=null,focus=0,focusFrom=0,focusTo=0,focusAt=performance.now(),focusWait=null;
  let speaking=false,measured=false,vocal=[0,0,0,0],mouth=0,boundaryEnergy=0,last=performance.now(),gaze=[0,0],target=[0,0],destroyed=false;
  let emergence=options.background===false?0:1,emergenceFrom=emergence,emergenceTarget=emergence,emergenceAt=last;
  let expression={talk:0,blink:0,smile:.16};
  const poses=[[.38,.05,-.04,1.02],[-.30,-.045,.04,.99],
    [.12,.10,.02,1.08],[-.44,.03,-.025,1.025],[.29,-.025,.025,1.05],[.02,.015,0,1]];
  let pointer=[0,0],pointerActive=0,sway=0,lift=0,wing=0,swayVelocity=0,liftVelocity=0,wingVelocity=0,lastLaser=performance.now(),laserDelay=180000+Math.random()*120000,laserSerial=0;
  let pose=[.18,-.035,0,1],poseTarget=pose.slice(),poseFrom=pose.slice(),shiftAt=-Infinity,shiftSerial=0;
  let beat=0,lastBeat=-Infinity,hitch=0,paragraphKey=null,pendingParagraph=false;
  let authoredShot=false;
  function cutTo(next,now){poseFrom=pose.slice();poseTarget=next.slice();shiftAt=now;shiftSerial++;}
  portrait.expression=time=>{
    const now=performance.now(),dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
    if(portrait.motion){
      const response=1-Math.exp(-EYE_RESPONSE*dt);
      gaze=gaze.map((v,i)=>v+(target[i]-v)*response);
      mouth*=Math.exp(-dt*12);companionMouth*=Math.exp(-dt*12);boundaryEnergy*=Math.exp(-dt*7);
      const blinkPhase=time%4.7;
      expression={talk:speakerRole==='companion'?0:speaking?(measured?mouth:.18+.40*Math.pow(Math.sin(time*12.1),2)):mouth,blink:blinkPhase<.14?Math.pow(Math.sin(blinkPhase/.14*Math.PI),2):0,smile:.16};
      if(portrait.version.id==='v20.0'){
        const jawDrive=speaking&&measured?Math.min(1,mouth*5)*(.55+.45*(articulation?.jaw||0)):0;
        const gearTarget=.38-jawDrive*3.8;
        [gearRate,gearAcceleration]=dampedFlight(gearRate,gearAcceleration,gearTarget,dt,10);gearPhase+=gearRate*dt;
        canvas.dataset.gearRate=gearRate.toFixed(3);canvas.dataset.gearPhase=gearPhase.toFixed(3);
        const mix=portrait.cymatics;
        if(shotRole!=='ghost'&&!speaking){serpentTime+=dt;
        const drive=Math.min(1,mix[0]*.65+mix[1]*.15+mix[3]*.70);
        const flap=.5+.5*Math.sin(time*5.1);
        const wingTarget=drive*(.24+flap*.76);
        [wing,wingVelocity]=dampedFlight(wing,wingVelocity,wingTarget,dt,8);
        // Shoulder/body extension follows the downstroke with a slower
        // response. Sustained sound keeps flight smooth between attacks.
        [lift,liftVelocity]=dampedFlight(lift,liftVelocity,wing*.90+drive*.10,dt,5);
        const swayTarget=Math.sin(time*1.85)*Math.min(.20,mix[0]*.22+mix[1]*.08);
        [sway,swayVelocity]=dampedFlight(sway,swayVelocity,swayTarget,dt,5);
        }
        if(focus<.01&&pointerActive&&now-lastLaser>laserDelay&&host.dataset.inspect==='face'){
          lastLaser=now;laserDelay=180000+Math.random()*120000;laserSerial++;
          // Project the actual snake eye through the same orbit camera.
          const yaw=pose[0],pitch=pose[1],dist=2.4/pose[3];
          const ro=[Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist,Math.cos(yaw)*Math.cos(pitch)*dist];
          const norm=a=>{const l=Math.hypot(...a);return a.map(x=>x/l);};
          const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
          const f=norm([-ro[0],-.015-ro[1],-ro[2]]),right=norm(cross(f,[0,1,0])),up=cross(right,f);
          const head=[.003+.023*(laserSerial%2?1:-1)+sway*.11,.593+lift*.055,.269];
          const v=head.map((x,i)=>x-ro[i]),z=dot(v,f),x=dot(v,right)*2.2/z/.73,y=dot(v,up)*2.2/z/.73;
          const ca=Math.cos(pose[2]),sa=Math.sin(pose[2]),sx=ca*x-sa*y,sy=sa*x+ca*y,r=canvas.getBoundingClientRect();
          const fx=options.viewport==='rect'?Math.min(r.width,r.height)/r.width:1,fy=options.viewport==='rect'?Math.min(r.width,r.height)/r.height:1;
          host.dispatchEvent(new CustomEvent('cg-portrait-pulse',{detail:{from:[r.left+(sx*fx+1)*r.width/2,r.top+(1-sy*fy)*r.height/2],to:[r.left+(pointer[0]*fx+1)*r.width/2,r.top+(1-pointer[1]*fy)*r.height/2]}}));
          canvas.dataset.laserPulses=String(laserSerial);
        }
        const energy=speaking&&measured?mouth:0;
        // One shot per source paragraph, admitted by its real voiced playback.
        // Sentence/PCM buffer boundaries and consonant attacks cannot cut.
        if(!authoredShot&&pendingParagraph&&energy>.015){
          cutTo(poses[beat++%poses.length],now);lastBeat=now;pendingParagraph=false;
        }
        // Most travel happens early; the wider spectral bridge resolves with
        // the camera at 510ms. Hold that clean shot even across speech gaps.
        const phase=Math.min(1,(now-shiftAt)/510),follow=1-Math.pow(1-phase,4);
        pose=poseFrom.map((v,i)=>v+(poseTarget[i]-v)*follow);
        hitch=beat%3===0&&now-lastBeat<75?1:0;
      }
    }
    // Resize/manual draws while paused must not advance eyes, blink or speech.
    const gain=GAZE_GAIN[portrait.version.id]||1;
    portrait.gaze=gaze.map(value=>value/gain);canvas.dataset.framing=host.dataset.inspect==='face'?'close':'dock';
    focus=portraitEmergenceAt(focusFrom,focusTo,(now-focusAt)/1000,.8);
    canvas.dataset.speakerFraming=shotRole||'wide';canvas.dataset.companionFocus=focus.toFixed(4);canvas.dataset.companionMouth=(speakerRole==='companion'&&companionPlaying?companionMouth:0).toFixed(4);
    if(focusWait&&Math.abs(focus-focusTo)<.0001){const done=focusWait;focusWait=null;done(true);}
    const voice=speaking&&speakerRole!=='companion'&&measured?vocal:[0,0,0,0];
    const signal=speechSurfaceSignal({speaking,measured,mouth,boundary:boundaryEnergy,companion:speakerRole==='companion',companionMouth:companionPlaying?companionMouth:0,companionDevice});
    emergence=portraitEmergenceAt(emergenceFrom,emergenceTarget,(now-emergenceAt)/1000);
    canvas.dataset.emergence=emergence.toFixed(4);canvas.dataset.speechSurface=signal.source;canvas.dataset.speechEnergy=signal.energy.toFixed(4);canvas.dataset.boundaryEnergy=signal.boundary.toFixed(4);
    if(portrait.version.id==='v20.0'){
      canvas.dataset.pose=pose.map(x=>x.toFixed(3)).join(',');
      canvas.dataset.performance=speaking&&measured?'measured-voice':'rest';
      canvas.dataset.gestures=String(beat);canvas.dataset.mouth=expression.talk.toFixed(4);canvas.dataset.serpentSway=sway.toFixed(4);canvas.dataset.serpentLift=lift.toFixed(4);canvas.dataset.wingFlex=wing.toFixed(4);canvas.dataset.pointer=pointer.join(',');
    }
    const a=articulation||{},v=speaking?Math.min(1,mouth*3):0;
    if(portrait.version.id==='v20.0'){canvas.dataset.articulation=a.kind||'energy';canvas.dataset.faceTiming=a.timing||'energy-only';}
    return {...expression,companionFocus:focus,companionTalk:speakerRole==='companion'&&companionPlaying?companionMouth:0,jawOpen:(a.jaw||0)*v,lipRound:(a.round||0)*v,lipWide:(a.wide||0)*v,
      lipPress:articulation?(a.press||0)*v:0,tongue:(a.tongue||0)*v,teeth:(a.teeth||0)*v,
      browLift:(a.brow||0)*v,eyeSquint:(a.squint||0)*v,frameScale:host.dataset.inspect==='face'?.73:.84,
      voiceBass:voice[0],voiceMid:voice[1],voiceAir:voice[2],voiceAttack:voice[3],
      voiceEnergy:signal.energy,voiceBoundary:signal.boundary,emergenceReveal:emergence,
      headYaw:pose[0],headPitch:pose[1],headRoll:pose[2],headZoom:pose[3],
      shift:portrait.motion?Math.max(0,1-(now-shiftAt)/510):0,shiftSerial,
      shiftX:(poseTarget[0]-poseFrom[0])*.39,shiftY:(poseTarget[1]-poseFrom[1])*.39,
      gearPhase,hitch:portrait.motion?hitch:0,pointerX:pointer[0],pointerY:pointer[1],pointerActive,serpentTime,serpentSway:sway,serpentLift:lift,wingFlex:wing};
  };
  const host=canvas.closest('#chromatic-carrier')||canvas;
  const move=event=>{
    const next=ocularGazeFromPointer(event.clientX,event.clientY,canvas.getBoundingClientRect());
    if(!next)return;target=next;
    const r=canvas.getBoundingClientRect(),edge=Math.min(r.width,r.height);
    pointer=[(event.clientX-r.left)/r.width*2-1,(r.top-event.clientY)/r.height*2+1];
    if(options.viewport==='rect')pointer=[pointer[0]*r.width/edge,pointer[1]*r.height/edge];
    pointerActive=1;
  };
  host.addEventListener('pointermove',move,{passive:true});
  const leavePointer=()=>{pointerActive=0;};host.addEventListener('pointerleave',leavePointer,{passive:true});
  // No leave/recenter handler: retain the last real target when it leaves.
  // The shared constructor honors reduced motion at boot. Explicit hold(false)
  // is the player's opt-in to resume; pointer events alone never start a loop.
  function announce(){
    const {id,title,revision}=portrait.version;
    const provenance='canonical face';
    canvas.setAttribute('aria-label',`Friken.Ghost · ${title} (${id}${revision?' / '+revision:''}) · ${provenance} / voice-surface performance`);
    report(`GHOST ${id} / ${title.toUpperCase()} / ${2+(portrait.version.geometryShaders?.length||1)+(portrait.version.bloomShader?1:0)} PASSES`);
  }
  announce();
  return {
    // Recorded monologues use this same camera/RAF and dissolve history.
    // This is staging, never a new geometry or fabricated speech signal.
    stageShot({yaw=0,pitch=0,roll=0,zoom=1,gazeX=0,gazeY=0}={}){
      const values=[yaw,pitch,roll,zoom,gazeX,gazeY];
      if(values.some(v=>!Number.isFinite(v))||Math.abs(yaw)>1.1||Math.abs(pitch)>.25||Math.abs(roll)>.16||zoom<.85||zoom>1.35||Math.abs(gazeX)>1||Math.abs(gazeY)>1)throw Error('Recorded portrait shot exceeds its camera bounds');
      authoredShot=true;pendingParagraph=false;
      target=[gazeX*EYE_TRAVEL_X,gazeY*EYE_TRAVEL_Y];
      cutTo([yaw,pitch,roll,zoom],performance.now());portrait.schedule();
    },
    releaseShot(){authoredShot=false;},
    versions:FACE_VERSIONS,
    get companion(){return portrait.version.companion||null;},
    get version(){const {id,title}=portrait.version;return {id,title};},
    setVersion(id){
      if(destroyed)throw new Error('Ghost portrait has been destroyed.');
      const version=typeof id==='string'?faceLibrary.versions.find(item=>item.id===id):null;
      if(!version)throw new Error('Unknown canonical Ghost face version.');
      if(portrait.version.id!==id){last=performance.now();portrait.setVersion(performanceVersion(version));}
      announce();
      return {id:version.id,title:version.title};
    },
    cymatics(bands){portrait.cymatics=bands.map(x=>Math.max(0,Math.min(1,Number(x)||0)));canvas.dataset.cymatics=portrait.cymatics.map(x=>x.toFixed(3)).join(',');},
    voiceSpectrum(bands){vocal=bands.map(x=>Math.max(0,Math.min(1,Number(x)||0)));canvas.dataset.voiceCymatics=(speaking&&measured?vocal:[0,0,0,0]).map(x=>x.toFixed(3)).join(',');},
    speaker(role){speakerRole=role;canvas.dataset.speaker=role||'none';if(role!=='companion'){companionMouth=0;companionPlaying=false;}if(role==='companion'){speaking=false;mouth=0;boundaryEnergy=0;articulation=null;}},
    focusSpeaker(role,{immediate=false,signal}={}){
      if(destroyed||signal?.aborted)return Promise.resolve(false);
      const target=role==='companion'?1:0,now=performance.now();shotRole=role||null;
      if(focusWait){const done=focusWait;focusWait=null;done(false);}
      focus=portraitEmergenceAt(focusFrom,focusTo,(now-focusAt)/1000,.8);focusFrom=focus;focusTo=target;focusAt=now;
      if(immediate||!portrait.motion){focus=focusFrom=focusTo;portrait.draw(portrait.time);return Promise.resolve(true);}
      if(Math.abs(focus-focusTo)<.0001)return Promise.resolve(true);
      const wait=new Promise(resolve=>{const finish=value=>{signal?.removeEventListener('abort',abort);if(focusWait===finish)focusWait=null;resolve(value);},abort=()=>finish(false);focusWait=finish;signal?.addEventListener('abort',abort,{once:true});});portrait.schedule();return wait;
    },
    companionLevel(value){if(companionDevice||!companionPlaying||speakerRole!=='companion')return;companionMouth=Math.max(0,Math.min(1,Number(value)||0));canvas.dataset.companionMouth=companionMouth.toFixed(4);},
    companionTalking(value,{measured:actualPCM=false}={}){companionPlaying=!!value;if(value)canvas.dataset.companionStartFocus=focus.toFixed(4);companionDevice=!!value&&!actualPCM;if(!value)companionMouth=0;canvas.dataset.companionTiming=value?(actualPCM?'measured-pcm':'device-boundary'):'rest';},
    companionPulse(){if(companionDevice&&speakerRole==='companion'&&!destroyed){companionMouth=.85;canvas.dataset.companionMouth='0.8500';}},
    audioLevel(value){measured=true;mouth=speakerRole==='companion'?0:Math.max(0,Math.min(1,Number(value)||0));},
    articulate(cue){articulation=cue;if(typeof cue?.paragraph==='string'&&cue.paragraph!==paragraphKey){paragraphKey=cue.paragraph;pendingParagraph=true;}},
    talking(value){speaking=!!value&&speakerRole!=='companion';if(speaking)canvas.dataset.ghostStartFocus=focus.toFixed(4);if(!speaking)articulation=null;measured=false;if(!speaking){mouth=0;boundaryEnergy=0;vocal=[0,0,0,0];}},
    pulse(){if(!destroyed&&portrait.motion&&speakerRole!=='companion'){mouth=.85;boundaryEnergy=.85;}},
    emerge(value,{immediate=false}={}){
      if(destroyed)return;
      const now=performance.now();emergence=portraitEmergenceAt(emergenceFrom,emergenceTarget,(now-emergenceAt)/1000);emergenceFrom=emergence;emergenceTarget=value?1:0;emergenceAt=now;
      if(immediate)emergence=emergenceFrom=emergenceTarget;
      portrait.draw(portrait.time);portrait.schedule();
    },
    hold(value){
      if(destroyed)return;
      portrait.motion=!value;last=performance.now();
      if(value)mouth=0;
      portrait.resize();portrait.schedule();portrait.draw(portrait.time);
    },
    destroy(){if(destroyed)return;destroyed=true;if(focusWait){const done=focusWait;focusWait=null;done(false);}host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leavePointer);portrait.destroy();}
  };
}

/** Keep the original face anatomy; add non-radial standing waves over its
 * membrane, fed only by the measured Ghost voice bus. No invented FFT. */
export function performingFace(source){
 if(!source.includes('gfLineageNativeMain'))return source;
 return source.replace('uniform vec4 u_cymatics;','uniform vec4 u_cymatics;\nuniform float u_frameScale,u_voiceBass,u_voiceMid,u_voiceAir,u_voiceAttack;')
 .replace('(v_uv*2.-1.)*max(u_scale,.1)','(v_uv*2.-1.)*max(u_scale,.1)*u_frameScale')
 .replace('gfLineageFinish(v_uv*2.-1.)','gfLineageFinish((v_uv*2.-1.)*u_frameScale)')
 .replace('float returnWave=ridge(length(door)-(.13+hit*.27),.020)*hit;','float returnWave=0.;')
 .replace('light*=1.+u_hover*.12;',`
 // Crossed Chladni modes settle on the forehead and cheek planes. Low voice
 // bands carry broad jaw modes, mids break symmetry, consonants light nodes.
 float vb=clamp(u_voiceBass*2.1,0.,1.),vm=clamp(u_voiceMid*2.,0.,1.);
 float va=clamp(u_voiceAir*2.6,0.,1.),attack=clamp(u_voiceAttack,0.,1.);
 vec2 surface=hc+vec2(.045*vm*sin(hc.y*5.-t*.6),.025*vb*sin(hc.x*7.));
 float mode=cos(surface.x*(10.+vb*7.))*cos(surface.y*(14.+vm*8.))
           -cos(surface.y*(10.+vb*7.))*cos(surface.x*(14.+vm*8.));
 float nodes=exp(-abs(mode)*18.)*head;
 float eyeKeep=1.-exp(-pow((abs(p.x)-.215)/.15,4.)-pow((p.y-.16)/.13,2.));
 float jawMode=exp(-abs(sin(surface.x*24.+surface.y*9.+vb*4.))*15.)
              *head*smoothstep(.04,-.48,p.y);
 float browMode=exp(-abs(sin(surface.x*31.-surface.y*18.+vm*3.))*18.)
              *head*smoothstep(.13,.40,p.y);
 float syllable=exp(-pow((surface.y-(.65-1.5*fract(t*.48)))/.15,2.))*head*attack;
 float vocal=(nodes*(vb*.34+vm*.62)+jawMode*vb*.48+browMode*vm*.40
             +syllable*.48)*eyeKeep;
 float sparks=pow(max(0.,sin(surface.x*61.)*sin(surface.y*57.)),12.)*head*va;
 light+=mix(cyan,hearth,.22+vb*.28)*vocal+mix(violet,cyan,.58)*sparks*.65;
 cover+=vocal*.16+sparks*.12;
 light*=1.+u_hover*.12;`);
}
