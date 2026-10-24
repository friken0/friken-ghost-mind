/* C26.16 / Phosphor BBS. Shell owns view state; never chooses, samples or saves. */
export function mountCarrierShell(root){
  const originals=new Map([...root.querySelectorAll('[id]')].map(n=>[n.id,n]));
  const el=id=>originals.get('cg-'+id)||root.querySelector('#cg-'+id),screen=el('screen'),doc=root.ownerDocument;
  const node=(tag,cls='',label='')=>{const n=doc.createElement(tag);n.className=cls;n.textContent=label;return n;};
  const instruments=root.querySelector('.cg-instruments'),playfield=root.querySelector('.cg-playfield'),face=root.querySelector('.cg-face'),world=root.querySelector('.cg-worldpane'),turn=root.querySelector('.cg-turnpane'),story=root.querySelector('.cg-story');
  const panels={faces:el('lineage-panel'),archive:el('archive'),wire:el('station'),cast:el('voice-settings')};
  const desktop=node('div','cg-desktop'),workspace=node('main','cg-workspace'),drawer=node('section','cg-utility-window');
  drawer.hidden=true;drawer.setAttribute('aria-label','Selected terminal workspace');
  const back=node('button','','← Back to encounter');back.type='button';drawer.append(back);
  const nav=node('nav','cg-window-nav');nav.setAttribute('aria-label','Carrier utilities');
  const more=node('section','cg-more-panel'),moreTitle=node('h2','','Carrier controls'),moreNav=node('nav','cg-more-nav');
  moreNav.setAttribute('aria-label','More carrier destinations');more.append(moreTitle,moreNav);panels.more=more;
  const log=node('section','cg-log-panel');log.append(node('h2','','Log / carried laws'),el('receipt'),el('replay-roll'),el('laws'));panels.log=log;
  const diagnostics=node('details','cg-diagnostics');diagnostics.append(node('summary','','Carrier diagnostics'),root.querySelector('.cg-bootlog'));
  const audioTools=[...screen.children].find(n=>n.classList.contains('cg-utilities'));
  const reading=node('div','cg-reading-tools');reading.append(el('repeat'),el('reveal'));
  more.append(root.querySelector('.cg-scoreline'),el('music-console'),audioTools,el('status'),diagnostics,el('mode'));
  const scroll=node('div','cg-narrative'),encounter=node('div','cg-encounter-body'),prose=node('section','cg-prose');
  prose.setAttribute('aria-label','Scene and Ghost conversation');
  const context=node('div','cg-scene-context');for(const id of ['scene-tag','title','scene'])context.append(el(id));
  const comms=node('div','cg-comms'),dialogue=node('div','cg-dialogue');
  dialogue.append(el('ghost-lead').parentElement,el('ghost').parentElement,reading);
  const situation=node('section','cg-situation');situation.id='cg-situation';situation.setAttribute('aria-label','Current situation');for(const id of ['place','goal','pressure']){const row=node('p');row.append(node('strong','',id==='place'?'WHERE':id==='goal'?'YOUR GOAL':'AT STAKE'));const value=node('span');value.id='cg-'+id;row.append(value);situation.append(row);}
  comms.append(face,dialogue);story.append(situation,el('decision'),context,comms);prose.append(story,el('completion'));
  const visual=node('section','cg-visual-bay');visual.setAttribute('aria-label','Shared transmission and artifact viewscreen');
  const modes=node('nav','cg-view-modes');modes.setAttribute('aria-label','Viewscreen mode');
  const receiver=node('section','cg-transmission-view');receiver.id='cg-transmission-view';
  const resident=node('figure','cg-resident');resident.id='cg-resident';
  const img=node('img');img.id='cg-resident-art';img.alt='';img.hidden=true;
  const caption=node('figcaption');caption.id='cg-resident-caption';resident.append(img,caption);receiver.append(resident);
  const returnCall=node('button','cg-return-call');returnCall.id='cg-return-call';returnCall.type='button';returnCall.hidden=true;
  const viewStatus=node('span','cg-view-status');viewStatus.id='cg-view-status';
  const tableau=node('section','cg-tableau');tableau.id='cg-tableau';const unillustrated=node('p','cg-unillustrated','No scene reconstruction in this retained chapter. Read the situation; live contact art and the scan remain separate views.');unillustrated.id='cg-unillustrated';
  const modeButtons={};let mode='scene',sceneKey=null,contact=null;
  function selectMode(next,{focus=false}={}){
    if(!['scene','transmission','artifact'].includes(next))throw Error('Unknown viewscreen mode');
    const changed=mode!==next;mode=next;root.dataset.view=mode;receiver.hidden=mode!=='transmission';world.hidden=mode!=='artifact';tableau.hidden=mode!=='scene';unillustrated.hidden=mode!=='scene'||!!tableau.dataset.staged;
    returnCall.hidden=mode==='scene';returnCall.textContent='← Back to current situation';
    for(const [id,b]of Object.entries(modeButtons))b.setAttribute('aria-pressed',String(id===mode));
    modeButtons.transmission.disabled=!contact;modeButtons.transmission.textContent=contact?'Contact / '+contact.accuracy+'%':'Live contact';modeButtons.transmission.classList.toggle('cg-incoming',!!contact&&mode!=='transmission');viewStatus.textContent=mode==='artifact'?'Evidence · no turn spent':mode==='scene'?(contact?'Incoming / '+contact.speaker+' · '+contact.accuracy+'% translation':'Inspect parts · highlight related actions'):contact?contact.speaker+' · '+contact.accuracy+'% translation':'No live contact';
    if(focus)modeButtons[mode].focus({preventScroll:true});
    if(changed)root.dispatchEvent(new CustomEvent('cg-view-change',{detail:{mode}}));
  }
  for(const [id,label]of [['scene','Scene'],['transmission','Live contact'],['artifact','Scan / evidence']]){
    const b=node('button','',label);b.id='cg-view-'+id;b.type='button';b.addEventListener('click',()=>selectMode(id));modeButtons[id]=b;modes.append(b);
  }
  returnCall.addEventListener('click',()=>selectMode('scene',{focus:true}));
  modes.append(viewStatus);visual.append(modes,returnCall,tableau,unillustrated,receiver,world);encounter.append(prose,visual);scroll.append(encounter);
  const help=el('causality-help');help.querySelector('summary').textContent='How this roll works';
  const actionDock=node('section','cg-action-dock');actionDock.setAttribute('aria-label','Your next move');actionDock.append(el('choices'),help,el('boot'));
  turn.append(scroll,actionDock);playfield.replaceChildren(turn);
  for(const p of Object.values(panels)){p.hidden=true;drawer.append(p);}
  function home(){const changed=root.dataset.window!=='encounter';root.dataset.window='encounter';playfield.hidden=false;drawer.hidden=true;for(const p of Object.values(panels))p.hidden=true;for(const b of root.querySelectorAll('[data-window]'))b.setAttribute('aria-pressed','false');if(changed)root.dispatchEvent(new CustomEvent('cg-window-change'));}
  function open(name){
    if(name==='encounter'){home();return;}if(!panels[name])throw Error('Unknown carrier workspace');
    root.dispatchEvent(new CustomEvent('cg-shell-leave'));
    playfield.hidden=true;drawer.hidden=false;for(const [id,p]of Object.entries(panels)){p.hidden=id!==name;if(id===name&&p.tagName==='DETAILS')p.open=true;}
    root.dataset.window=name;root.dispatchEvent(new CustomEvent('cg-window-change'));for(const b of root.querySelectorAll('[data-window]'))b.setAttribute('aria-pressed',String(b.dataset.window===name));drawer.scrollTop=0;
  }
  function link(host,id,label){const b=node('button','',label);b.type='button';b.dataset.window=id;b.addEventListener('click',()=>open(id));host.append(b);}
  for(const [id,label]of [['archive','Save / Seed'],['wire','Wire']])link(nav,id,label);
  nav.append(el('voice'),el('sound'),el('music'),el('motion'));link(nav,'more','More');
  for(const [id,label]of [['faces','Faces / lineage'],['cast','Voice cast'],['log','Log / Laws']])link(moreNav,id,label);
  el('motion').setAttribute('aria-label','Pause or resume visual motion');
  back.addEventListener('click',home);workspace.append(el('inspector'),playfield,drawer);desktop.append(workspace);
  const header=root.querySelector('.cg-header'),brand=header.firstElementChild,telemetry=header.querySelector('.cg-telemetry');
  brand.classList.add('cg-brand');brand.querySelector('.cg-eyebrow').remove();
  const stats=node('section','cg-top-stats');stats.setAttribute('aria-label','Resources and character attributes');
  const attrs=node('div','cg-attribute-strip');attrs.id='cg-attributes';attrs.setAttribute('aria-label','Your character attributes');stats.append(instruments,attrs);
  const meta=node('div','cg-stat-meta');meta.append(el('turn'),el('chapter'),telemetry,el('save-label'));
  const score=el('score').closest('span');score.classList.add('cg-score-board');meta.prepend(score);
  header.replaceChildren(brand,stats,meta);
  const act=el('act');act.hidden=true;meta.append(act);root.querySelector('.cg-route').remove();root.querySelector('.cg-presence').remove();
  root.querySelector('nav[aria-label="Return to Ghost"]')?.remove();
  screen.insertBefore(desktop,root.querySelector('.cg-footer'));desktop.after(nav);root.querySelector('.cg-footer').remove();
  el('export').addEventListener('click',()=>open('archive'));for(const id of ['start','resume','load','next'])el(id).addEventListener('click',home);
  function sync({key,transmission}){
    contact=transmission;const call=el('alien-call');if(call&&call.parentElement!==receiver)receiver.append(call);
    caption.hidden=!!contact;
    if(key!==sceneKey){sceneKey=key;selectMode('scene');}else selectMode(mode);
  }
  home();selectMode(mode);return {home,open,sync,selectMode};
}
