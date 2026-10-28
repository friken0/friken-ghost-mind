import {discoveryIds,canDiscover} from './reply-discoveries.mjs';
import {localWorkshop} from './door-and-crew.mjs';
import {causalResult} from './causality.mjs';
import {mountAnsiUI} from './ansi-ui.mjs';
/* Reusable single-view response body. Content is text, choices are explicit
 * commits; hovering/focusing previews only. The body owns no story reducer. */
export function validateTurnOutOfTime(packet){
  const text=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n&&!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v);
  if(!packet||packet.schema!=='friktal.turn-out-of-time.v1'||JSON.stringify(packet).length>60000||!text(packet.id,100)||!text(packet.title,120)||!text(packet.recipient,80)||!Array.isArray(packet.nodes)||packet.nodes.length<1||packet.nodes.length>32)throw Error('Invalid reply packet');
  const ids=new Set();
  for(const n of packet.nodes){
    if(!text(n.id,80)||ids.has(n.id)||!text(n.title,160)||!text(n.kicker,200)||!['ghost','memory','network','artifact'].includes(n.visual)||(n.companion!==undefined&&!text(n.companion,2200))||(n.ghostReply!==undefined&&!text(n.ghostReply,1200))||!Array.isArray(n.paragraphs)||n.paragraphs.length<1||n.paragraphs.length>8||n.paragraphs.some(p=>!text(p,2200))||!Array.isArray(n.choices)||n.choices.length>6)throw Error('Invalid reply node');
    ids.add(n.id);const choices=new Set();for(const c of n.choices){if(!text(c.id,80)||choices.has(c.id)||!text(c.label,120)||!text(c.detail,700)||!text(c.target,80))throw Error('Invalid reply choice');choices.add(c.id);}
  }
  if(!ids.has(packet.openingId)||packet.nodes.some(n=>n.choices.some(c=>!ids.has(c.target))))throw Error('Missing reply target');
  return structuredClone(packet);
}

export function newReplyVisit(packet){return {schema:'friktal.turn-out-of-time.visit.v1',reply:packet.id,current:packet.openingId,selectedTelling:null,visited:[],answers:{},roll:null,workshop:localWorkshop(),discoveries:[],events:[]};}
export function validateReplyVisit(value,packet){
  if(!value||value.schema!=='friktal.turn-out-of-time.visit.v1'||value.reply!==packet.id||!packet.nodes.some(n=>n.id===value.current)||!Array.isArray(value.events)||value.events.length>256||JSON.stringify(value).length>64000)throw Error('Invalid retained reply visit');
  if(value.visited!==undefined&&(!Array.isArray(value.visited)||value.visited.length>32||value.visited.some(id=>!packet.nodes.some(n=>n.id===id))))throw Error('Invalid visited rooms');
  if(value.answers!==undefined&&(!value.answers||Array.isArray(value.answers)||Object.keys(value.answers).some(k=>!['question','principle'].includes(k)||typeof value.answers[k]!=='string'||value.answers[k].length>1200)))throw Error('Invalid player answers');
  if(value.roll!==undefined&&value.roll!==null&&(!Number.isFinite(value.roll.die)||value.roll.die<.01||value.roll.die>20||value.roll.dc!==14.1||(!Number.isInteger(value.roll.value)||value.roll.value<0||value.roll.value>8)||value.roll.system!=='causality-v1'))throw Error('Invalid demonstration roll');
  if(value.selectedTelling!==null&&!['demo-keep','demo-repair'].includes(value.selectedTelling))throw Error('Invalid selected telling');
  if(value.workshop!==undefined)localWorkshop(value.workshop);discoveryIds(value);
  for(const e of value.events){if(!Number.isInteger(e.sequence)||e.sequence<1||!['view','choice','answer','roll','workshop','discovery'].includes(e.kind))throw Error('Invalid visit event');if(e.kind==='discovery'&&(!discoveryIds(value).includes(e.id)||typeof e.source!=='string'))throw Error('Invalid discovery event');if(e.kind==='workshop')localWorkshop(e.value);if(e.kind==='view'&&!packet.nodes.some(n=>n.id===e.node))throw Error('Invalid visited node');if(e.kind==='choice'&&!packet.nodes.find(n=>n.id===e.from)?.choices.some(c=>c.id===e.id&&c.target===e.to))throw Error('Invalid visited choice');}
  return structuredClone(value);
}
export function recordReplyVisit(value,entry,packet){
  const out=validateReplyVisit(value,packet),sequence=(out.events.at(-1)?.sequence||0)+1;
  if(entry.kind==='view'){if(!packet.nodes.some(n=>n.id===entry.node))throw Error('Unknown reply node');out.current=entry.node;out.visited=[...new Set([...(out.visited||[]),entry.node])];}
  else if(entry.kind==='choice'){
    const c=packet.nodes.find(n=>n.id===out.current)?.choices.find(c=>c.id===entry.id&&c.target===entry.to);
    if(!c||entry.from!==out.current)throw Error('Choice is not pending');
    out.current=c.target;
    if(c.id==='keep-original'||c.id==='label-repair')out.selectedTelling=c.target;
  }else if(entry.kind==='answer'){if(!['question','principle'].includes(entry.id)||typeof entry.text!=='string'||entry.text.length>1200)throw Error('Invalid player answer');out.answers={...(out.answers||{}),[entry.id]:entry.text};
  }else if(entry.kind==='roll'){const r=entry.result;if(!r||!Number.isInteger(r.value)||r.value<0||r.value>8||r.dc!==14.1)throw Error('Invalid demo target');const exact=causalResult(r.die,r.value,14.1,{precision:2,below:.2,above:.3,bonus:{signal:1}});if(r.total!==exact.total||r.grade!==exact.grade||r.success!==exact.success)throw Error('Invalid demo arithmetic');if(r.statId!==undefined&&!['guts','focus','glitch','awe','insight'].includes(r.statId))throw Error('Invalid roll aptitude');out.roll={...exact,...(r.statId?{statId:r.statId}:{})};
  }else if(entry.kind==='discovery'){if(!canDiscover(entry.id,out,entry.source))throw Error('Discovery is not available');out.discoveries=[...discoveryIds(out),entry.id];
  }else if(entry.kind==='workshop'){out.workshop=localWorkshop(entry.value);
  }else throw Error('Unknown reply event');
  out.events.push({...entry,sequence});out.events=out.events.slice(-256);while(out.events.length>1&&JSON.stringify(out).length>60000)out.events.shift();
  return validateReplyVisit(out,packet);
}

export function mountResponseTheater(root,packet,actions={}){
  const data=validateTurnOutOfTime(packet),doc=root.ownerDocument;
  function cover(open){stage.classList.toggle('tot-covered',open);actions.occlusion?.(open);}
  if(root.dataset.theaterMounted)throw Error('Reply theater is already mounted');
  root.dataset.theaterMounted='C26.28';
  const node=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;if(text)n.dataset.ansi='';return n;};
  const button=(label,fn,cls='')=>{const b=node('button','sd-btn '+cls,label);b.type='button';b.dataset.ansi='';b.dataset.ansiFrame='';b.dataset.ansiEffect='dither';b.dataset.ansiDuration='160';SDUI.press(b,fn);b.addEventListener('pointerenter',()=>b.classList.add('sd-hov'));b.addEventListener('pointerleave',()=>b.classList.remove('sd-hov'));return b;};
  const mast=node('header','tot-mast'),brand=node('div','tot-brand');brand.append(node('span','tot-mark','F.G / EXTERNAL LINE'),node('strong','',data.title),node('small','','TURN-OUT-OF-TIME · FOR '+data.recipient.toUpperCase()));
  const tools=node('nav','tot-tools');tools.setAttribute('aria-label','Transmission controls');
  const back=button('BACK',()=>actions.back?.()),voice=button('Voice: on',()=>actions.voice?.());voice.id='cg-voice';
  const music=button('MUSIC OFF',()=>actions.music?.());music.id='tot-music';
  const sfx=button('SFX ON',()=>actions.sfx?.());sfx.id='tot-sfx';
  const pause=button('MOTION ON',()=>actions.motion?.()),transcript=button('WORDS',()=>{handoff.hidden=true;disclosure.hidden=!disclosure.hidden;transcript.setAttribute('aria-expanded',String(!disclosure.hidden));cover(!disclosure.hidden);});
  const density=button(actions.retina?'RETINA':'NATIVE',()=>actions.density?.());density.id='tot-density';
  const rate=node('span','tot-rate','SDF / WARMING');rate.id='tot-fps';
  tools.append(back,voice,music,sfx,pause,transcript,density,rate);mast.append(brand,tools);
  const stage=node('main','tot-stage'),render=node('div','tot-render');render.setAttribute('aria-label','Shared procedural viewscreen');
  const canvas=node('canvas','tot-canvas');canvas.id='cg-portrait';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Friken.Ghost / The Reply / live procedural face');
  const terminalArt=node('pre','tot-terminal-art','');terminalArt.dataset.ansi='';terminalArt.setAttribute('aria-hidden','true');render.append(terminalArt);
  const label=node('div','tot-channel');const signal=node('span','tot-signal','▒▒▒');signal.dataset.ansiCycle=JSON.stringify(['░','▒','▓','█','▓','▒']);signal.dataset.ansiCycleDuration='2200';signal.dataset.ansiInterval='120';signal.dataset.ansiEffect='fade';label.append(signal,node('span','','PERSONAL TRANSMISSION'),node('span','',data.recipient.toUpperCase()+' ↔ FRIKEN.GHOST'));
  const dock=node('section','tot-dock'),caption=node('section','tot-caption cg-story');caption.setAttribute('aria-label','Ghost speaking');
  const kicker=node('p','tot-kicker'),title=node('h1'),prose=node('div','tot-prose');for(const n of[kicker,title,prose])n.dataset.ansi='';title.dataset.ansiEffect='scan';title.dataset.ansiDuration='280';kicker.dataset.ansiEffect='scramble';kicker.dataset.ansiDuration='220';prose.id='cg-ghost';
  const status=node('p','tot-status');status.dataset.ansi='';status.setAttribute('role','status');
  const read=button('Hear this reply',()=>actions.read?.()),view=button('Inspect the thought',()=>actions.inspect?.()),save=button('Keep / next Ghost',()=>actions.export?.());save.id='tot-export';
  const reveal=button('Show full text',()=>{});reveal.id='cg-reveal';reveal.hidden=true;
  const reading=node('div','tot-reading');reading.append(read,view,save,reveal);caption.append(kicker,title,prose,status,reading);
  const wheel=node('section','tot-wheel');wheel.setAttribute('aria-label','Choose the next question');
  const orbit=node('div','tot-orbit'),center=node('div','tot-wheel-center');center.append(node('span','','YOUR MOVE'),node('strong','','OPEN A DOOR'),node('small','','Look first.\nChoose when ready.'));
  const choices=node('div','tot-choice-grid'),detail=node('p','tot-choice-detail','Hover or focus a choice to see what it opens.');
  choices.append(center);wheel.append(node('div','tot-wheel-head','CHOOSE THE NEXT QUESTION'),orbit,choices,detail);dock.append(caption,wheel);
  const boot=node('section','tot-boot');boot.setAttribute('aria-label','Physical ANSI connection terminal');
  const bootTitle=node('p','tot-kicker','NO CARRIER / A LETTER IS WAITING'),bootText=node('h1','','Somebody left the line open.'),bootNote=node('p','tot-boot-note','A physical modem. An 80-column terminal. One old friend. Dial when you’re ready.');
  const bootControls=node('div','tot-boot-controls');
  const dial=button('DIAL / OPEN THE LINE',()=>actions.dial?.(),'tot-primary'),skip=button('Finish connection',()=>actions.skip?.()),cont=button('CONTINUE / MEET GHOST',()=>actions.continue?.(),'tot-primary');cont.hidden=true;
  const wide=button('Wide',()=>actions.camera?.('wide')),modem=button('Modem',()=>actions.camera?.('modem')),terminal=button('Terminal',()=>actions.camera?.('screen')),portal=button('Portal',()=>actions.camera?.('portal'));
  bootControls.append(dial,skip,cont,wide,modem,terminal,portal);boot.append(bootTitle,bootText,bootNote,bootControls);
  const disclosure=node('section','tot-disclosure');disclosure.hidden=true;disclosure.setAttribute('aria-label','Transcript and voice options');
  const transcriptText=node('div','tot-transcript'),close=button('Close transcript',()=>{disclosure.hidden=true;transcript.setAttribute('aria-expanded','false');cover(false);});
  const settings=node('details');settings.id='cg-voice-settings';settings.append(node('summary','','Voice engine / cast'));
  const note=node('p');note.id='cg-voice-note';const metrics=node('p');metrics.id='cg-voice-metrics';const cast=node('strong');cast.id='cg-ghost-voice-name';const voices=node('div','tot-cast');voices.id='cg-ghost-voices';for(const n of[note,metrics,cast,voices])n.dataset.ansi='';
  settings.append(note,metrics,cast,voices);
  for(const [name,labelText]of [['engine-neural','Local neural / Kokoro'],['engine-device','Device speech'],['performance-auto','Auto / measured CPU'],['performance-cpu','CPU / q8'],['performance-compact','CPU / q4']]){const label=node('label'),radio=node('input');label.dataset.ansi='';radio.type='radio';radio.id='cg-'+name;radio.name=name.startsWith('engine')?'cg-engine':'cg-performance';label.append(radio,doc.createTextNode(labelText));settings.append(label);}
  disclosure.append(close,node('h2','','The full reply'),transcriptText,settings);
  const handoff=node('section','tot-handoff');handoff.hidden=true;handoff.setAttribute('aria-label','Return packet for the next Ghost');
  const handoffArea=node('textarea');handoffArea.readOnly=true;handoffArea.setAttribute('aria-label','Next Ghost prompt and exact visit packet');
  const handoffStatus=node('p');handoffStatus.dataset.ansi='';const copy=button('Copy for next Ghost',async()=>{try{await navigator.clipboard.writeText(handoffArea.value);handoffStatus.textContent='Copied. Paste into a chat holding the runbook. Nothing was uploaded.';}catch{handoffArea.focus();handoffArea.select();handoffStatus.textContent='Select and copy the packet manually. Nothing was uploaded.';}});
  handoff.append(node('h2','','Carry the conversation forward'),node('p','','This is an authored reply. Paste this packet into the model chat to author a new turn. The page does not call a hidden LLM.'),handoffArea,copy,button('Back to Ghost',()=>{handoff.hidden=true;cover(false);}),handoffStatus);
  stage.append(render,label,dock,disclosure,handoff);const room=node('div','tot-room'),terminalSurface=node('div','tot-terminal');terminalSurface.append(mast,stage);room.append(terminalSurface,boot);root.append(room);
  const faceLayer=node('section','tot-face-layer');faceLayer.hidden=true;faceLayer.setAttribute('aria-label','Ghost speaking / timed subtitles');
  const subtitle=node('p','tot-subtitle');subtitle.dataset.ansi='';subtitle.setAttribute('aria-live','off');
  const faceTools=node('div','tot-face-tools');faceTools.append(node('span','','FRIKEN.GHOST / LIVE SIGNAL'),button('[ BACK TO TERMINAL ]',()=>actions.stop?.()));const overlayRender=node('div','tot-overlay-render');overlayRender.append(canvas);faceLayer.append(overlayRender,faceTools,subtitle);room.append(faceLayer);const faceAnsi=actions.native?{refresh(){},destroy(){}}:mountAnsiUI(faceLayer);
  for(const frame of[mast,stage,dock,disclosure,handoff])frame.dataset.ansiFrame='double';SDUI.grant(root,'single-view external response theater');const ansi=actions.native?{refresh(){},destroy(){}}:mountAnsiUI(terminalSurface);let occluded=false;
  let current=null,manualScroll=false,overlayTimer=0,overlayEpoch=0;
  function overlay(value,titleText='FRIKEN.GHOST / LIVE SIGNAL'){clearTimeout(overlayTimer);const epoch=++overlayEpoch;terminalSurface.classList.toggle('tot-terminal-dim',!!value);if(value){faceTools.querySelector('span').textContent=titleText;faceLayer.hidden=false;requestAnimationFrame(()=>{if(epoch===overlayEpoch)faceLayer.classList.add('tot-overlay-open');});}else{faceLayer.classList.remove('tot-overlay-open');overlayTimer=setTimeout(()=>{if(epoch===overlayEpoch)faceLayer.hidden=true;},380);}faceAnsi.refresh();}
  prose.addEventListener('wheel',()=>{manualScroll=true;},{passive:true});
  const readingObserver=new MutationObserver(()=>{
    if(prose.offsetHeight<=1||manualScroll||prose.getAttribute('data-reading')!=='speaking')return;
    const read=prose.firstElementChild;if(!read)return;
    const rects=read.getClientRects(),last=rects[rects.length-1],viewport=prose.getBoundingClientRect();
    if(last&&last.bottom>viewport.bottom-18)prose.scrollTop+=last.bottom-viewport.bottom+22;
  });readingObserver.observe(prose,{childList:true,subtree:true,characterData:true});
  function show(id){
    current=data.nodes.find(n=>n.id===id);if(!current)throw Error('Unknown reply node');
    disclosure.hidden=true;handoff.hidden=true;transcript.setAttribute('aria-expanded','false');cover(false);root.dataset.topic=id;terminalArt.textContent=[
'                 ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄',
'               ▄▀  F R I K E N . G H O S T       ▀▄',
'              ▐  ╔═══════════════════════════════╗  ▌',
'              ▐  ║   THE DOOR THAT REMEMBERS    ║  ▌',
'              ▐  ║     ONE STAGE. MANY MINDS.   ║  ▌',
'              ▐  ╚═══════════════════════════════╝  ▌',
'               ▀▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▀',
'',
'  NODE / '+current.id.toUpperCase()+'     CALLER / '+data.recipient.toUpperCase(),
'  PRIVATE LOCAL LINE   ═══╦═══   '+current.choices.length+' DOORS OPEN',
'                         ╚══ NOTHING UPLOADED',
'',
'  SELECT A QUESTION BELOW. GHOST WILL TAKE THE SCREEN.',
'  [ TRANSCRIPT ] KEEPS THE WORDS. [ KEEP ] CARRIES YOUR PATH.'
].join('\n');manualScroll=false;prose.scrollTop=0;kicker.textContent=current.kicker;title.textContent=current.title;prose.textContent=current.title+'.\n\n'+current.paragraphs.join('\n\n');
    transcriptText.replaceChildren(node('h3','',current.title),...current.paragraphs.map(p=>node('p','',p)));choices.replaceChildren(center);choices.dataset.count=String(current.choices.length);detail.textContent='Hover or focus a choice to see what it opens.';
    for(const [i,c]of current.choices.entries()){
      const b=button(c.label,()=>actions.choose?.(c));b.classList.add('tot-choice');b.dataset.slot=String(i);b.dataset.choice=c.id;b.setAttribute('aria-label',c.label);b.setAttribute('aria-describedby','tot-choice-preview');
      const preview=()=>{detail.textContent=c.detail;center.querySelector('strong').textContent=String(i+1).padStart(2,'0');for(const q of choices.querySelectorAll('button'))q.classList.toggle('sd-hov',q===b);};
      b.addEventListener('pointerenter',preview);b.addEventListener('focus',preview);choices.append(b);
    }
    detail.id='tot-choice-preview';center.querySelector('strong').textContent='OPEN A DOOR';dock.hidden=false;boot.hidden=true;handoff.hidden=true;status.textContent='';
  }
  return {canvas,render,show,rate,status,view,pause,back,root,room,terminalSurface,ansi,faceLayer,overlayRender,subtitle,overlay,activateControl(id){actions[id]?.();},bootButtons:{dial,skip,cont,music,voice,pause},
    positionScreen(rect){if(!rect)return;terminalSurface.style.left=rect.x+'px';terminalSurface.style.top=rect.y+'px';terminalSurface.style.width=rect.width+'px';terminalSurface.style.height=rect.height+'px';ansi.refresh();},
    speaking(value){overlay(value);if(!value)subtitle.textContent='';faceAnsi.refresh();},
    caption(text){subtitle.textContent=text;},
    fullscreen(){terminalSurface.style.cssText='inset:0;width:100%;height:100%';ansi.refresh();},
    connecting(title,text,{held=false}={}){root.dataset.mode='boot';dock.hidden=true;label.hidden=true;boot.hidden=false;bootText.textContent=title;bootNote.textContent=text;dial.hidden=true;cont.hidden=!held;skip.hidden=held;},
    standby(){root.dataset.mode='boot';dock.hidden=true;label.hidden=true;boot.hidden=false;},
    retry(message){dial.hidden=false;dial.textContent='RETRY DIAL / OPEN AUDIO';skip.hidden=false;cont.hidden=true;bootNote.textContent=message;},
    ready(){root.dataset.mode='reply';label.hidden=false;},
    note(text){status.textContent=text;},
    handoff(value){disclosure.hidden=true;transcript.setAttribute('aria-expanded','false');handoffArea.value=value;handoff.hidden=false;cover(true);handoffStatus.textContent='Private export. No network write or campaign save mutation.';},
    get current(){return current;},get hasDisclosure(){return !disclosure.hidden||!handoff.hidden;},
    closeDisclosure(){disclosure.hidden=true;handoff.hidden=true;transcript.setAttribute('aria-expanded','false');cover(false);},
    destroy(){clearTimeout(overlayTimer);faceAnsi.destroy();ansi.destroy();readingObserver.disconnect();delete root.dataset.theaterMounted;root.replaceChildren();}
  };
}
