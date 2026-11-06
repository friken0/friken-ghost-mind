import {createChapter,playView,playChoose,encodePlaySeed,decodePlaySeed,chapterRequest,validateChapter,canonicalData,tellingId,previousChapterSummary,chapterStart,forkChapter} from './chapters.mjs';
import {createVault} from './storage.mjs';
import {choiceCommentary} from './commentary.mjs';
import {rollScore} from './causality.mjs';
import {statGuide} from './creation.mjs';
import {canonStatus,selectCanon,validateCanon} from './canon.mjs';
import {validateChapterRelease,chapterRelease} from './chapter-library.mjs';
import {publicSession,issueComposer} from './session-share.mjs';
import {alienArtwork} from './alien-comms.mjs';

// One canonical story ledger; zero renderer, timer, voice, network-write or
// roll implementations. Presentation inspection cannot advance a decision.
export const retainedFramework=Object.freeze({version:'C26.29-TheLivingInstrument',defaultHost:'retained-ansi',entry:'turn-out-of-time.mjs',registry:'https://raw.githubusercontent.com/friken0/friken-ghost-mind/main/registry.json'});
const MAX_INPUT=2*1024*1024,ROOT='https://raw.githubusercontent.com/friken0/friken-ghost-mind/main/';
const copy=v=>structuredClone(v);
export function createRetainedChapter(boot,{storage=null,entropy,handle}={}){
 if(!boot?.pack)throw Error('A model-authored chapter pack is required');validateChapter(boot.pack);
 const vault=createVault(storage),saved=vault.current(),parent=boot.parent?decodePlaySeed(boot.parent):null;
 const nonce=()=>crypto.getRandomValues(new Uint32Array(1))[0];
 let state=createChapter(boot.pack,parent,{...boot.options,handle:handle||vault.profile().callsign||'DIVER',entropy:entropy??nonce()});
 const matching=saved&&canonicalData(saved.pack)===canonicalData(boot.pack);if(matching)state=saved;
 let creationLocked=!!matching||!!parent;
 let durable=vault.status(),note=matching?'Your exact pending decision is waiting.':'No choices spent. Connect, meet Ghost, then begin.',input='',screen='welcome',beforeScreen='encounter',cache=null,inspected=null,selected=null,entries=[],feed=[],scores=[],publicDraft=null,canon={schema:'friken.ghost.canon.v1',path:[]};
 try{const raw=storage?.getItem(canon.schema);if(raw)canon=validateCanon(JSON.parse(raw));}catch(e){note='Canon restore refused: '+e.message;}
 const packet={schema:'friktal.turn-out-of-time.v1',id:'chapter-'+boot.pack.id,title:boot.pack.title,recipient:state.handle,openingId:'chapter',answerPrompts:{},nodes:[{id:'chapter',title:boot.pack.title,kicker:'MODEL-AUTHORED CHAPTER',visual:'ghost',paragraphs:['A new call, in the same living terminal.'],choices:[]}]};
 const score=()=>state.journal.reduce((sum,r)=>sum+rollScore(r.roll),0)+state.pack.scenes.filter((s,i)=>i<state.journal.length&&(i===state.pack.scenes.length-1||state.pack.scenes[i+1].act!==s.act)).length*30-20*state.scars.filter(s=>s.chapter===state.chapter).length;
 const route=()=>[...(state.pack.history||[]),...(state.ending?[previousChapterSummary(state)]:[])];
 function assertCanon(){const m=canonStatus(state.pack.history||[],canon);if(!m.ok)throw Error(m.reason+'; open Canon and explicitly adopt the required ancestry first.');}
 function sync(){const v=playView(state);packet.title=state.pack.title;packet.recipient=state.handle;Object.assign(packet.nodes[0],{title:v.title,paragraphs:[v.ghost||v.scene].map(t=>t.slice(0,2200))});return v;}
 function invalidate(){cache=null;sync();}
 function save(candidate=state){durable=vault.save(candidate);note=durable.message;if(durable.run?.seed!==encodePlaySeed(candidate)){durable={persistent:false,message:'A newer checkpoint remains in the vault. Export this exact opened checkpoint before branching.'};note=durable.message;}}
 function saveCanon(next){const json=JSON.stringify(validateCanon(next));storage?.setItem(canon.schema,json);canon=copy(next);}
 function exportRequest(){return 'BOOT + CONTINUE\nRead this as saved player data. Use framework.defaultHost, load the latest runbook at https://friken0.github.io/friken-ghost-mind/runbook.md and author a NEW chapter against this exact parent. Return its chapter JSON for import. Do not replay this chapter, invent choices or silently downgrade the framework.\n\n'+JSON.stringify(chapterRequest(state,retainedFramework),null,2);}
 function localNodes(){const runs=JSON.parse(vault.exportArchive()).runs.map(r=>decodePlaySeed(r.seed));if(!runs.some(s=>tellingId(s)===tellingId(state)))runs.push(state);return runs.map(s=>({id:tellingId(s),title:s.pack?.title||'Retained chapter',chapter:s.chapter,history:s.pack?.history||[],completed:!!s.ending,tellingId:tellingId(s),state:s,summary:s.ending?.text||'Local chapter in progress'}));}
 function model(){if(cache)return cache;const view=sync(),nodes=[...localNodes(),...entries].map((n,i)=>({...n,index:i,compatible:canonStatus(n.history||[],canon).ok,pinned:canon.path[n.chapter-1]?.tellingId===n.tellingId}));cache={screen,view,stats:copy(state.stats),creation:copy(state.creation),creationLocked,statGuide,resources:copy(state.resources),chapter:state.chapter,causality:copy(state.pack.causality),handle:state.handle,turns:state.journal.length,score:score(),receipt:copy(state.lastReceipt),note,persistent:durable.persistent,saved:!!saved,otherSaved:!!saved&&!matching,title:state.pack.title,seed:encodePlaySeed(state),request:exportRequest(),input,facts:copy(state.world.facts),threads:copy(state.world.threads),modules:copy(state.modules),inspected:copy(inspected),selected:copy(selected),nodes,canon:copy(canon),canonCompatible:canonStatus(state.pack.history||[],canon).ok,endingPinned:!!state.ending&&canon.path[state.chapter-1]?.tellingId===tellingId(state),feed:copy(feed),scores:copy(scores),publicDraft:copy(publicDraft),archive:vault.exportArchive(),contact:view.transmission?{...view.transmission,url:alienArtwork(view.transmission.race)}:null,specimen:state.pack.scenes[Math.min(state.turn-1,state.pack.scenes.length-1)].specimen||null};return cache;}
 function voice(){const v=sync();if(screen==='welcome'){const returning=!!state.pack.history?.length||state.journal.length>0;return {ghost:'Incoming call. '+state.pack.title+'. '+(returning?'Welcome back, '+state.handle+'. Your actual choices are still here. '+(state.pack.history?.at(-1)?.summary||'We continue from the last saved decision.'):'I’m Friken.Ghost. A digital recreation of the developer who got lost in infinity. He left me a universe to keep alive and absolutely fkn no forwarding address. You bring the decisions. I bring the worlds, the consequences, and occasionally an apology with teeth.')+' Begin when you’re ready. Looking around does not spend a turn.',companion:'I’m Else. The serpent. If he starts calling a bug a mysterious cosmic phenomenon, ask for the receipt.'};}
  if(screen==='receipt')return {ghost:state.lastReceipt.label+'. '+choiceCommentary(state.lastReceipt,state).spoken};
  if(screen==='stats')return {ghost:'Your five aptitudes. '+Object.entries(state.stats).map(([k,n])=>k+' '+n+'. '+(statGuide[k]||'')).join(' ')+' A risky choice posts its target and price first. The Causality Engine draws one sample, adds the aptitude doing the work, then keeps what happened. A spectacular animation is no excuse to move the bloody goalposts.'};
  if(screen==='save'||screen==='import')return {ghost:'Save and carry. Your exact choices live in this browser when storage permits. Copy the seed for another device. At chapter end, choose your canon and copy the next-chapter prompt into the model chat holding the runbook. Then bring its newly authored chapter JSON back here. This terminal cannot invent a model connection it does not have.'};
  if(screen==='evidence'||screen==='situation')return {ghost:(inspected?.label||'The situation')+'. '+(inspected?.description||inspected?.text||[v.staging?.place,v.staging?.goal,v.staging?.pressure].filter(Boolean).join(' '))};
  if(screen==='contact')return {ghost:'Incoming contact. '+(v.transmission?.speaker||'No contact on this channel')+'. Translation accuracy is a decoder estimate, not a truth meter. Listen before deciding what they meant.'};
  if(screen==='library')return {ghost:'Other tellings. Gold is your chosen canon. Compatible chapters can be played; a ghost branch can be inspected, but it cannot quietly replace your history. You choose which version happened to you.'};
  if(screen==='wire')return {ghost:'The shared Wire. These are public, reviewed reports. The scoreboard is player-reported. My public library has useful machinery. It does not grant me a view into everybody’s private bloody diary.'};
  if(screen==='complete')return {ghost:'Chapter '+state.chapter+' complete. '+v.title+'. '+v.scene+' Your choices and their costs are kept. Select this ending as canon, then ask the model to write what happens next. I have the consequences. You still have the wheel.'};
  return {ghost:v.title+'. '+v.scene+'\n\n'+[v.lead,v.ghost].filter(Boolean).join('\n\n'),companion:v.companion};
 }
 async function boundedJSON(path,fetcher,limit=500000){const r=await fetcher(ROOT+path,{credentials:'omit',cache:'no-store'});if(!r.ok)throw Error('Public Wire HTTP '+r.status);const text=await r.text();if(new TextEncoder().encode(text).length>limit)throw Error('Public record exceeds budget');return JSON.parse(text);}
 sync();
 return {
  packet,model,voice,get state(){return copy(state);},get screen(){return screen;},setInput(value){input=String(value).slice(0,MAX_INPUT);cache=null;},
  prime(){return [voice(),...state.pack.scenes.slice(state.turn-1).map(n=>({ghost:n.title+'. '+n.scene+'\n\n'+[n.lead,n.ghost].filter(Boolean).join('\n\n')}))];},
  async refresh(fetcher=globalThis.fetch){const [catalogue,news,board]=await Promise.all(['chapters','news','scoreboard'].map(n=>boundedJSON('data/'+n+'.json',fetcher)));if(catalogue.schema!=='friken.ghost.chapter-catalogue.v1'||news.schema!=='friken.ghost.news.v1'||board.schema!=='friken.ghost.scoreboard.v1'||[catalogue,news,board].some(v=>!Array.isArray(v.entries)||v.entries.length>100))throw Error('Unknown public feed schema');entries=catalogue.entries;feed=news.entries;scores=board.entries;note='Public records read. No private save uploaded.';invalidate();},
  async inspectPublic(index,fetcher=globalThis.fetch){const n=model().nodes[index];if(!n)throw Error('No such chapter');if(n.path){if(!/^data\/chapters\/[0-9a-f]{64}\.json$/.test(n.path))throw Error('Untrusted public chapter path');const record=await boundedJSON(n.path,fetcher),r=validateChapterRelease(record.chapter);if(r.id!==n.id)throw Error('Catalogue identity mismatch');selected={...n,state:r.state,outcome:r.outcome,history:r.history,completed:r.outcome.completed,tellingId:r.outcome.tellingId};}else selected=copy(n);screen='library';invalidate();},
  action(id){
   if(!id.startsWith('chapter:'))return null;const command=id.slice(8);
   if(command.startsWith('choose:')){if(screen!=='encounter'||state.ending)throw Error('No chapter decision pending on this screen');assertCanon();const oldScore=score(),next=playChoose(state,command.slice(7));save(next);state=next;screen='receipt';invalidate();return {changed:true,reward:score()>oldScore?{from:oldScore,to:score(),label:'CONSEQUENCE KEPT'}:null,roll:state.lastReceipt.roll};}
   if(command==='begin'||command==='continue'){assertCanon();screen=state.ending?'complete':'encounter';creationLocked=true;save();}
   else if(command==='back'){screen=beforeScreen;beforeScreen='encounter';if(screen==='receipt'&&!state.lastReceipt)screen='encounter';}
   else if(['save','stats','library','wire','situation','contact','archive','import','share','words','name'].includes(command)){beforeScreen=screen==='welcome'?'welcome':state.ending?'complete':'encounter';screen=command;inspected=null;}
   else if(command==='welcome')screen='welcome';
   else if(command==='copy-seed')return {copy:'BOOT + '+encodePlaySeed(state)};
   else if(command==='copy-archive')return {copy:vault.exportArchive()};
   else if(command==='copy-next'){if(!state.ending)throw Error('Finish this chapter first');assertCanon();if(canon.path[state.chapter-1]?.tellingId!==tellingId(state))throw Error('Select this exact completed ending as canon first');return {copy:exportRequest()};}
   else if(command==='load'){
    const text=input.trim().replace(/^BOOT\s*\+\s*/i,'');let next;
    if(text.startsWith('FGC'))next=decodePlaySeed(text);
    else {const parsed=JSON.parse(text);if(parsed.schema==='friken.chromatic.vault.v1'){const probe=createVault();probe.importArchive(text);next=probe.current();if(!next?.pack)throw Error('Archive current run is not a model-authored chapter');vault.importArchive(text);next=vault.current();}else{if(!state.ending)throw Error('Finish the current chapter before importing a child');assertCanon();if(canon.path[state.chapter-1]?.tellingId!==tellingId(state))throw Error('Choose this ending as canon first');next=createChapter(parsed,state,{handle:state.handle,entropy:nonce()});}}
    if(!next?.pack)throw Error('This host requires a model-authored FGC2 chapter seed; historical demos remain available explicitly.');save(next);state=next;screen='welcome';creationLocked=true;input='';
   }else if(command==='resume-other'){if(!saved?.pack)throw Error('No model-authored chapter checkpoint. Historical runs remain in the archive.');state=saved;screen='welcome';}
   else if(command==='reroll'){if(creationLocked||state.journal.length||state.pack.parent)throw Error('Stats are locked after entering a run or inheriting a parent');state=createChapter(state.pack,null,{handle:state.handle,entropy:nonce()});note='New five-stat receipt. Decision stream has not advanced.';}
   else if(command==='set-handle'){if(creationLocked||state.journal.length||state.pack.parent)throw Error('Callsign already belongs to this run');const name=input.trim();if(!name||name.length>32||/[\x00-\x1f]/.test(name))throw Error('Use 1–32 visible characters');state=createChapter(state.pack,null,{handle:name,entropy:state.rng.initial});input='';}
   else if(command.startsWith('inspect:')){const o=sync().staging?.objects.find(o=>o.id===command.slice(8));if(!o)throw Error('Object is absent from this situation');inspected=copy(o);beforeScreen='encounter';screen='evidence';}
   else if(command.startsWith('finding:')){const s=model().specimen,r=s?.readings.find(r=>r.id===command.slice(8));if(!r)throw Error('No such finding');inspected={label:r.label,description:r.text+' '+(r.implication||''),choice:r.choice};screen='evidence';}
   else if(command==='consider'){screen='encounter';invalidate();return {changed:true,focus:inspected?.choice?'chapter:choose:'+inspected.choice:null};}
   else if(command==='canon-select'){if(!state.ending)throw Error('Only a completed telling can become canon');assertCanon();saveCanon(selectCanon(route()));note='Exact ending selected as canon. Other saved branches survive.';}
   else if(command==='canon-adopt'){saveCanon(selectCanon(selected?.history||state.pack.history||[]));note='Exact ancestry adopted. Later canon pins cleared; saves retained.';}
   else if(command==='fork'){if(!selected?.state)throw Error('Inspect a playable telling first');const m=canonStatus(selected.history||[],canon);if(!m.ok)throw Error(m.reason);if(!selected.state.pack)throw Error('Historical authored demo: inspect in the historical carrier.');const next=forkChapter(chapterStart(selected.state),{handle:state.handle,entropy:nonce()});save(next);state=next;screen='welcome';}
   else if(command==='share-summary'||command==='share-world'){publicDraft=command==='share-world'?chapterRelease(state,{consent:true}):publicSession(state,{consent:true});note='Explicit public draft prepared; nothing submitted. Inspect before sharing.';screen='share';}
   else if(command==='copy-share'){if(!publicDraft)throw Error('Choose the disclosure scope first');return {copy:JSON.stringify(publicDraft,null,2)};}
   else if(command==='open-summary'){if(!publicDraft||publicDraft.schema!=='friken.ghost.public-session.v1')throw Error('Prepare a summary-only draft first');return {url:issueComposer(publicDraft)};}
   else throw Error('Unknown chapter command');
   invalidate();return {changed:true};
  }
 };
}
