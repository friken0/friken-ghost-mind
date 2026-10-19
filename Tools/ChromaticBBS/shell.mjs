/* Single bounded BBS desktop. Existing nodes move; renderers stay alive. */
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
  world.prepend(frameHead('╔═ ARTIFACT / LIVE MANIFOLD ═╗'));turn.prepend(frameHead('╔═ ENCOUNTER / THE OTHER END OF THE LINE ═╗'));
  const scroll=node('div','cg-narrative');
  for(const n of [el('decision'),story,el('receipt'),el('replay-roll'),el('laws'),el('completion')])scroll.append(n);
  turn.insertBefore(scroll,el('choices'));turn.append(el('boot'));
  face.prepend(frameHead('╔═ GHOST / PRESENT ═╗'));aside.append(face,instruments);
  const diagnostics=node('details','cg-diagnostics'),summary=node('summary','');summary.textContent='CARRIER DIAGNOSTICS';diagnostics.append(summary,root.querySelector('.cg-bootlog'));aside.append(diagnostics);presence.remove();
  const toolrow=[...screen.children].find(n=>n.classList.contains('cg-utilities'));
  if(toolrow){toolrow.classList.add('cg-audio-tools');aside.append(toolrow);}
  const status=el('status');aside.append(status);
  for(const p of Object.values(panels)){p.hidden=true;drawer.append(p);}
  function home(){root.dataset.window='encounter';playfield.hidden=false;drawer.hidden=true;for(const p of Object.values(panels))p.hidden=true;for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.window==='encounter'));}
  function open(name){if(name==='encounter'){home();return;}playfield.hidden=true;drawer.hidden=false;for(const [id,p]of Object.entries(panels)){p.hidden=id!==name;if(id===name)p.open=true;}root.dataset.window=name;for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.window===name));drawer.scrollTop=0;console.warn('[Chromatic shell] window height',drawer.getBoundingClientRect().height);}
  for(const [id,title]of [['encounter','ENCOUNTER'],['faces','FACES'],['archive','SAVE / SEED'],['wire','WIRE'],['cast','VOICE CAST']]){const b=node('button','');b.type='button';b.dataset.window=id;b.textContent=title;b.addEventListener('click',()=>open(id));nav.append(b);}
  drawerBack.addEventListener('click',home);
  left.append(el('inspector'),playfield,drawer);desktop.append(left,aside);
  const header=root.querySelector('.cg-header');header.after(nav);
  const progress=root.querySelector('.cg-progress');progress.after(desktop);
  const back=root.querySelector('nav[aria-label="Return to Ghost"]');back?.remove();
  root.querySelector('.cg-scoreline').classList.add('cg-bottom-status');
  // Existing action buttons retain their handlers; open their destination.
  el('export').addEventListener('click',()=>open('archive'));
  el('start').addEventListener('click',home);el('resume').addEventListener('click',home);el('load').addEventListener('click',home);el('next').addEventListener('click',home);
  const compact=node('div','cg-compact-dock');screen.insertBefore(compact,root.querySelector('.cg-bottom-status'));
  const mobile=matchMedia('(max-width:450px)');
  function adapt(){compact.append(instruments);if(mobile.matches){compact.append(toolrow);}else{aside.insertBefore(toolrow,status);}}
  mobile.addEventListener('change',adapt);adapt();
  home();return {home,open};
}
