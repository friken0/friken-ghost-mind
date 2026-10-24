/** The current physical problem. Readings are authored evidence, not a random
 * unlock, resource award or action. Looking cannot write canonical state. */
export function validateSpecimen(s){
 if(s===undefined)return;
 if(!s||Object.keys(s).some(k=>!['name','purpose','question','readings'].includes(k))||typeof s.name!=='string'||!s.name.length||s.name.length>100||typeof s.purpose!=='string'||s.purpose.length>300||!Array.isArray(s.readings)||s.readings.length!==3)throw Error('Specimen description');
 if(s.question!==undefined&&(typeof s.question!=='string'||!s.question.length||s.question.length>180))throw Error('Specimen question');
 const ids=new Set();for(const r of s.readings){if(!r||Object.keys(r).some(k=>!['id','label','text','choice','implication'].includes(k))||!/^[a-z][a-z0-9-]{0,31}$/.test(r.id)||ids.has(r.id)||typeof r.label!=='string'||!r.label.length||r.label.length>70||typeof r.text!=='string'||!r.text.length||r.text.length>500)throw Error('Specimen reading');if(r.choice!==undefined&&(!/^[a-z0-9-]{1,64}$/.test(r.choice)||typeof r.implication!=='string'||!r.implication.length||r.implication.length>300))throw Error('Specimen action');if(r.implication!==undefined&&!r.choice)throw Error('Specimen action');ids.add(r.id);}
}
export function specimenFinding(scene,choiceId){return scene?.specimen?.readings.find(r=>r.choice===choiceId)||null;}
export function mountScanner(root,{consider=()=>{}}={}){
 const el=id=>root.querySelector('#cg-'+id),world=root.querySelector('.cg-worldpane'),doc=root.ownerDocument;
 const title=doc.createElement('strong');title.id='cg-specimen-name';const purpose=doc.createElement('p');purpose.id='cg-specimen-purpose';
 const readings=doc.createElement('div');readings.className='cg-scan-tabs';readings.setAttribute('aria-label','Inspect this specimen');
 const text=doc.createElement('p');text.id='cg-scan-reading';text.setAttribute('role','status');
 const question=doc.createElement('p');question.id='cg-scan-question';const implication=doc.createElement('p');implication.id='cg-scan-implication';const action=doc.createElement('button');action.id='cg-scan-consider';action.type='button';let selected=null;action.addEventListener('click',()=>{if(selected)consider(selected);});
 const controls=doc.createElement('section');controls.className='cg-scanner-notes';controls.append(title,question,purpose,readings,text,implication,action);world.append(controls);
 let key=null;
 return {update(state,{active=true,choices=[]}={}){const scene=state.pack?.scenes[Math.min(state.turn-1,state.pack.scenes.length-1)],s=scene?.specimen;const next=(scene?.id||'native')+':'+state.world.relic.revision+':'+active;if(key===next)return;key=next;
   const description=s||{name:'CARRIED RELIC',purpose:'A visual record of the laws retained in this run.',readings:[{id:'form',label:'FORM',text:'Current form: '+state.world.relic.form+'.'},{id:'revision',label:'REVISION',text:'Committed revision '+state.world.relic.revision+'. Looking does not change it.'},{id:'laws',label:'LAWS',text:state.modules.map(m=>m.law.name).join('; ')||'No executable law installed yet.'}]};
   validateSpecimen(description);title.textContent=description.name;purpose.textContent=description.purpose;el('relic').textContent=(s?'SCHEMATIC / ':'')+description.name+' / REV '+state.world.relic.revision;root.dataset.specimen=scene?.id||'native';root.dataset.specimenName=description.name;world.dataset.specimen=scene?.id||'native';el('canvas').setAttribute('aria-label',description.name+' / interactive SDF specimen');
   question.textContent=description.question||'';question.hidden=!description.question;
   const show=r=>{const changed=world.dataset.reading!==r.id;text.textContent=r.text;world.dataset.reading=r.id;selected=active?choices.find(c=>c.id===r.choice)?.id:null;implication.textContent=r.implication||'';implication.hidden=!r.implication;action.hidden=!selected;action.dataset.choice=selected||'';action.textContent=selected?'Consider: '+choices.find(c=>c.id===selected).label+' →':'';for(const b of readings.children)b.setAttribute('aria-pressed',String(b.dataset.reading===r.id));if(changed&&world.checkVisibility({checkVisibilityCSS:true}))root.dispatchEvent(new CustomEvent('cg-scan-reading'));};
   readings.replaceChildren(...description.readings.map(r=>{const b=doc.createElement('button');b.type='button';b.dataset.reading=r.id;b.textContent=r.label;b.addEventListener('click',()=>show(r));return b;}));show(description.readings[0]);
  }};
}
