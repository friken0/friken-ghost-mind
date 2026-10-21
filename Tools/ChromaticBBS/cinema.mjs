import {mountBootWorld} from './boot-world.mjs';
import {modemStages,modemDuration} from './modem.mjs';
/* Connection presentation only. No RNG, save or decision authority. */
export function mountCinema(root,{hold=()=>{},ready=()=>{},local=()=>false,audio,prepareVoice=()=>{}}={}){
 const el=id=>root.querySelector('#cg-'+id),screen=el('screen'),bay=el('power-bay'),canvas=el('boot-canvas'),glass=el('boot-glass'),field=el('boot-field'),ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const world=mountBootWorld(el('boot-world'),{fps:el('boot-fps'),reduced:reduced.matches,energy:()=>audio?.info?.bands||[0,0,0,0],level:()=>audio?.info?.rms||0});
 let phase='ready',raf=0,epoch=0,start=0,elapsed=0,arrival=0,lastPaint=0,lastInk='';
 const duration=modemDuration*1000;
 function mode(p){phase=p;root.dataset.power=p;}
 function cancel(){epoch++;cancelAnimationFrame(raf);raf=0;audio?.stopModem();}
 function aperture(age){const s=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);},x=.003+.997*s((age-200)/650),y=.003+.997*s((age-700)/1100);field.style.setProperty('--crt-width',x);field.style.setProperty('--crt-point',1-s((age-300)/600));field.style.setProperty('--crt-line',s(age/500)*(1-s((age-900)/800)));glass.style.setProperty('--crt-x',x);glass.style.setProperty('--crt-y',y);glass.style.setProperty('--crt-glow',1-s(age/1800));glass.style.setProperty('--crt-heat',1+2*(1-s(age/1800)));}
 function paint(age){
  if(!ctx)return;const w=Math.max(1,glass.clientWidth),h=Math.max(200,glass.clientHeight),d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.scale(canvas.width/w,canvas.height/h);ctx.clearRect(0,0,w,h);
  const font=Math.max(8,Math.min(15,(w-36)/57/.61)),step=font*1.55;
  ctx.font=font+'px Courier New,monospace';ctx.textBaseline='top';
  const idle=phase==='dial',all=['╔═ GHOST / CARRIER TERMINAL',
   '> PORT / HUMAN SALVAGE UPLINK',
   '> AUDIO ENGINE / '+(audio?.info?.context==='running'?'RUNNING':new URL(location.href).searchParams.get('qaAudio')==='silent'?'QA SILENT':'WAITING FOR DIAL'),
   ...(idle?['> DESTINATION / NOT YET YOUR PROBLEM','> DIAL WHEN YOU ARE READY. WE CAN WAIT.']:modemStages.filter(([t])=>t*1000<=age).map(([,line])=>'> '+line)),
   ...(age>=duration&&!idle?['> CARRIER / LOCKED','> GHOSTTRACKS / STARTING AUDIO TRANSPORT']:[]),
   '> MEMORY / '+(local()?'LOCAL CHECKPOINTS':'EXPORT TO CARRY YOURSELF')];
  const count=Math.max(4,Math.min(10,Math.floor((h*.57-18)/step))),lines=all.slice(-count),x=18,y=h-lines.length*step-16;
  const gradient=ctx.createLinearGradient(0,h*.28,0,h);
  gradient.addColorStop(0,'rgba(35,39,42,0)');gradient.addColorStop(.40,'rgba(35,39,42,.16)');gradient.addColorStop(.78,'rgba(35,39,42,.76)');gradient.addColorStop(.98,'rgba(35,39,42,1)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  const columns=Math.max(20,Math.floor((w-36)/(font*.61)));let used=0;const ink=[];
  for(let i=0;i<lines.length;i++){
   const line=lines[i].slice(0,columns),stage=modemStages.find(([,label])=>line==='> '+label);
   const n=idle||age>=duration||!stage?line.length:Math.max(0,Math.min(line.length,Math.floor((age-stage[0]*1000)/16)));
   const typed=line.slice(0,n);used+=n;ink.push(typed);ctx.fillStyle=i%3===0?'#e9bf5c':i%3===2?'#ea60bd':'#b6fff1';
   ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=3;ctx.fillText(typed,x,y+i*step);ctx.shadowBlur=0;
   if(stage&&n<line.length){ctx.fillStyle='#b6fff1';ctx.fillRect(x+n*font*.61,y+i*step,font*.5,font);}
  }
  const signature=ink.join('\n'),changed=!!lastInk&&signature!==lastInk;lastInk=signature;
  canvas.dataset.cells=String(used);canvas.dataset.overlay='full-glass-grey-gradient';canvas.setAttribute('aria-label',lines.join(' / '));
  world.set({phase:idle?0:2,progress:age/duration,paused:phase==='paused',ink:!idle&&changed?.75:0});
 }
 function controls({dial=false,pause=false,skip=false,cont=false,reconnect=false}={}){el('dial').hidden=!dial;el('pause').hidden=!pause;el('skip').hidden=!skip;el('continue').hidden=!cont;el('reconnect').hidden=!reconnect;}
 function standby(){cancel();hold(true);mode('awaiting');world.show(true);audio?.connection?.(true);screen.hidden=true;screen.inert=true;bay.hidden=false;canvas.hidden=false;aperture(2200);paint(duration);controls({cont:true});el('power-title').textContent='CONNECT 33600 / HOLDING FOR YOU';el('power-status').textContent='Connection held. Continue assembles your terminal. No turn spent.';}
 function finish(){cancel();world.show(false);mode('ready');bay.hidden=true;screen.hidden=false;screen.inert=false;screen.classList.remove('cg-crt-off','cg-arriving');root.dataset.assembly='complete';hold(false);ready();}
 function enter(){if(phase!=='awaiting')return;cancel();world.show(false);mode('arriving');bay.hidden=true;screen.hidden=false;screen.inert=true;root.dataset.assembly='frames';const own=epoch;arrival=performance.now();function build(now){if(own!==epoch)return;const age=now-arrival;root.dataset.assembly=age<650?'frames':age<1400?'instruments':age<2300?'presence':'content';if(age>=2900||reduced.matches){finish();return;}raf=requestAnimationFrame(build);}raf=requestAnimationFrame(build);}
 function tick(now){raf=0;const age=elapsed+now-start;aperture(2200);if(now-lastPaint>45){paint(age);lastPaint=now;}const stage=modemStages.filter(([t])=>t*1000<=age).at(-1);el('power-title').textContent=stage?.[1]||'DIALING';if(age>=duration){standby();return;}raf=requestAnimationFrame(tick);}
 async function dial(){if(phase!=='dial')return;const own=epoch;el('dial').disabled=true;el('power-status').textContent='Starting audio engine / opening the line…';const connected=audio?await audio.modem():true;el('dial').disabled=false;if(own!==epoch)return;if(!connected&&new URL(location.href).searchParams.get('qaAudio')!=='silent'){el('power-status').textContent='Audio awaits browser permission. Press Dial again, or Finish for captions.';return;}prepareVoice();mode('assembling');controls({pause:true,skip:true});elapsed=0;start=performance.now();el('power-status').textContent='Space holds the line · Escape finishes to the held screen';raf=requestAnimationFrame(tick);}
 function pause(){if(phase==='paused'){mode('assembling');world.set({paused:false});start=performance.now();audio?.modemResume(elapsed/1000);el('pause').textContent='[ PAUSE / HOLD LINE ]';el('power-status').textContent='Space holds the line · Escape finishes to the held screen';raf=requestAnimationFrame(tick);}else if(phase==='assembling'){elapsed+=performance.now()-start;cancelAnimationFrame(raf);raf=0;audio?.modemPause();mode('paused');world.set({paused:true});el('pause').textContent='[ RESUME CONNECTION ]';el('power-status').textContent='PAUSED / the universe can damn well wait.';}}
 function boot(){cancel();audio?.connection?.(false);hold(true);mode('dial');world.set({phase:0,progress:0,paused:false});world.show(true);screen.hidden=true;screen.inert=true;screen.classList.remove('cg-crt-off','cg-arriving');delete root.dataset.assembly;bay.hidden=false;canvas.hidden=false;aperture(2200);paint(0);controls({dial:true,skip:true});el('power-title').textContent='NO CARRIER / SOMEBODY IS OUT THERE';el('power-status').textContent='Dial starts the audio engine and modem. GhostTracks joins after carrier lock.';}
 function disconnected(){mode('off');screen.hidden=true;bay.hidden=false;canvas.hidden=true;controls({reconnect:true});el('power-title').textContent='NO CARRIER';el('power-status').textContent='Your checkpoint is held. No choice or die changed.';}
 function off(){if(phase!=='ready')return;cancel();world.show(false);audio?.connection?.(false);hold(true);audio?.pauseMusic();mode('collapsing');screen.inert=true;screen.classList.add('cg-crt-off');const began=performance.now();function collapse(now){if(now-began>=780||reduced.matches){disconnected();return;}raf=requestAnimationFrame(collapse);}raf=requestAnimationFrame(collapse);}
 el('dial').addEventListener('click',dial);el('skip').addEventListener('click',standby);el('pause').addEventListener('click',pause);el('continue').addEventListener('click',enter);el('reboot').addEventListener('click',boot);el('power-off').addEventListener('click',off);el('reconnect').addEventListener('click',boot);
 root.addEventListener('keydown',e=>{if(['ready','off','collapsing','arriving'].includes(phase))return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();standby();}else if(e.key===' '&&!e.target.matches('button,input,textarea')){e.preventDefault();e.stopImmediatePropagation();if(phase==='awaiting')enter();else if(phase==='dial')void dial();else pause();}},true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='assembling')pause();else if(document.hidden&&phase==='arriving')finish();});window.addEventListener('resize',()=>{if(!bay.hidden&&!canvas.hidden)paint(phase==='awaiting'?duration:elapsed);});
 return {boot,off,finish,standby,enter,pause,get phase(){return phase;}};
}
