/* One bounded carrier. Score owns the top; transmission and story share a room. */
export function mountCarrierShell(root){
  const el=id=>root.querySelector('#cg-'+id),screen=el('screen');
  function node(tag,cls){const n=document.createElement(tag);n.className=cls;return n;}
  const panels={faces:el('lineage-panel'),archive:el('archive'),wire:el('station'),cast:el('voice-settings')};
  const nav=node('nav','cg-window-nav');nav.setAttribute('aria-label','Terminal windows');
  const desktop=node('div','cg-desktop'),left=node('main','cg-workspace'),aside=node('aside','cg-comms'),drawer=node('section','cg-utility-window');
  drawer.hidden=true;drawer.setAttribute('aria-label','Selected terminal window');
  const drawerBack=node('button','');drawerBack.type='button';drawerBack.textContent='← BACK TO ENCOUNTER';drawer.append(drawerBack);
  const playfield=root.querySelector('.cg-playfield'),presence=root.querySelector('.cg-presence'),face=root.querySelector('.cg-face'),instruments=root.querySelector('.cg-instruments');
  const frameHead=(label)=>{const h=node('div','cg-window-head');h.textContent=label;return h;};
  const world=root.querySelector('.cg-worldpane'),turn=root.querySelector('.cg-turnpane'),story=root.querySelector('.cg-story');
  world.prepend(frameHead('ARTIFACT OBSERVATORY'));turn.prepend(frameHead('ENCOUNTER / INCOMING TRANSMISSION'));
  const scroll=node('div','cg-narrative'),encounter=node('div','cg-encounter-body');
  const resident=node('figure','cg-resident');resident.id='cg-resident';const img=document.createElement('img');img.id='cg-resident-art';img.alt='';img.hidden=true;const caption=node('figcaption','');caption.id='cg-resident-caption';resident.append(img,caption);encounter.append(resident);
  const prose=node('div','cg-prose');for(const n of [el('decision'),story,el('receipt'),el('replay-roll'),el('laws'),el('completion')])prose.append(n);encounter.append(prose);scroll.append(encounter);
  turn.insertBefore(scroll,el('choices'));const moves=frameHead('YOUR NEXT MOVE');moves.classList.add('cg-moves-head');turn.insertBefore(moves,el('choices'));turn.append(el('boot'));
  face.prepend(frameHead('GHOST / LIVE'));aside.append(face,el('music-console'),world);
  const diagnostics=node('details','cg-diagnostics'),summary=node('summary','');summary.textContent='CARRIER DIAGNOSTICS';diagnostics.append(summary,root.querySelector('.cg-bootlog'));aside.append(diagnostics);presence.remove();
  const toolrow=[...screen.children].find(n=>n.classList.contains('cg-utilities'));
  if(toolrow){toolrow.classList.add('cg-audio-tools');aside.append(toolrow);}
  const status=el('status');aside.append(status);
  for(const p of Object.values(panels)){p.hidden=true;drawer.append(p);}
  function home(){root.dataset.window='encounter';playfield.hidden=false;drawer.hidden=true;for(const p of Object.values(panels))p.hidden=true;for(const b of nav.querySelectorAll('[data-window]'))b.setAttribute('aria-pressed',String(b.dataset.window==='encounter'));}
  function open(name){if(name==='encounter'){home();return;}playfield.hidden=true;drawer.hidden=false;for(const [id,p]of Object.entries(panels)){p.hidden=id!==name;if(id===name)p.open=true;}root.dataset.window=name;for(const b of nav.querySelectorAll('[data-window]'))b.setAttribute('aria-pressed',String(b.dataset.window===name));drawer.scrollTop=0;}
  for(const [id,title]of [['encounter','ENCOUNTER'],['faces','FACES'],['archive','SAVE / SEED'],['wire','WIRE'],['cast','VOICE CAST']]){const b=node('button','');b.type='button';b.dataset.window=id;b.textContent=title;b.addEventListener('click',()=>open(id));nav.append(b);}
  drawerBack.addEventListener('click',home);left.append(el('inspector'),playfield,drawer);desktop.append(left,aside);
  const header=root.querySelector('.cg-header');header.insertBefore(nav,header.querySelector('.cg-telemetry')); root.querySelector('.cg-progress').after(desktop);
  root.querySelector('nav[aria-label="Return to Ghost"]')?.remove();
  const top=node('section','cg-top-stats');top.setAttribute('aria-label','Score and ship resources');const score=root.querySelector('.cg-scoreline');score.classList.add('cg-score-board');const meta=node('div','cg-stat-meta');meta.append(el('turn'),el('chapter'));const attrs=node('div','cg-attribute-strip');attrs.id='cg-attributes';attrs.setAttribute('aria-label','Your character attributes');top.append(score,instruments,meta,attrs);screen.prepend(top);
  el('export').addEventListener('click',()=>open('archive'));for(const id of ['start','resume','load','next'])el(id).addEventListener('click',home);
  for(const id of ['voice','sound'])nav.append(el(id));home();return {home,open};
}
