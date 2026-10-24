/** Local author lookup for the curated Moknon seed. No network or writes.
 * Brief output is an editorial view, not player knowledge enforcement.
 * --author includes source spoilers, proposals and unresolved conflicts. */
import {readFile,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const base=new URL('./lore/',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const normal=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function lookup(seed,query,{author=false}={}){
  if(typeof query!=='string'||!query.trim())throw Error('Supply a race name or search phrase.');
  const q=normal(query),terms=q.split(' ');
  const exact=seed.races.filter(r=>[r.id,r.name,...r.aliases].some(s=>normal(s)===q||normal(s)==='race '+q));
  const races=(exact.length?exact:seed.races.filter(r=>terms.every(t=>normal([r.id,r.name,...r.aliases,r.firstContact,r.sourceAnchors,author?[r.authorOnly,JSON.stringify(r.writingKit)].join(' '):''].join(' ')).includes(t)))).slice(0,5);
  const sourceIds=new Set(races.flatMap(r=>r.sourceIds));
  const disputes=author?seed.disputes.filter(d=>terms.every(t=>normal(JSON.stringify(d)).includes(t))||d.sources.some(id=>sourceIds.has(id))):[];
  if(!races.length&&!disputes.length)throw Error('No matching seed record; the missing lore is not invented.');
  return {edition:seed.edition,status:seed.status,view:author?'author':'first-contact brief',
    races:races.map(r=>author?r:{id:r.id,name:r.name,firstContact:r.firstContact,artRef:r.artRef}),
    ...(author?{disputes,sources:seed.sources.filter(s=>sourceIds.has(s.id)||disputes.some(d=>d.sources.includes(s.id)))}:{})};
}
export async function loadSeed(){
  const manifest=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
  const bytes=await readFile(new URL(manifest.seed.path,base));
  if(bytes.length>1024*1024||hash(bytes)!==manifest.seed.sha256)throw Error('Seed size/integrity mismatch.');
  return {manifest,seed:JSON.parse(bytes)};
}
export async function validateKit(){
  const {manifest,seed}=await loadSeed(),artBytes=await readFile(new URL(manifest.artManifest.path,base));
  if(hash(artBytes)!==manifest.artManifest.sha256)throw Error('Art manifest integrity mismatch.');
  const {assets}=JSON.parse(artBytes),sources=new Set(seed.sources.map(s=>s.id)),races=new Set(seed.races.map(r=>r.id)),art=new Set(assets.map(a=>a.id));
  if(races.size!==26||art.size!==26||sources.size!==34)throw Error('Missing/duplicate seed entry.');
  for(const r of seed.races){if(r.writingKit&&(!r.writingKit.dramaticEngine||r.writingKit.playableApproaches?.some(a=>!a.benefit||!a.price||!a.ifBlocked||!a.returnConsequence)||r.writingKit.dialogue?.length!==6||r.writingKit.playableApproaches?.length!==3||r.writingKit.sourceIds?.some(id=>!sources.has(id))||r.writingKit.status!=='AUTHORED_LOCAL_FICTION_NOT_RECOVERED_DIALOGUE'))throw Error('Incomplete resident writing kit: '+r.id);if(!art.has(r.artRef)||r.sourceIds.some(id=>!sources.has(id)))throw Error('Broken race reference: '+r.id);}
  for(const d of seed.disputes)if(d.sources.some(id=>!sources.has(id)))throw Error('Broken dispute reference: '+d.id);
  for(const e of seed.relationships)if(!races.has(e.from)||!races.has(e.to)||e.sourceIds.some(id=>!sources.has(id)))throw Error('Broken relationship.');
  for(const a of assets){
    if(!/^art\/[a-z]+\.jpg$/.test(a.path))throw Error('Unsafe art path.');
    const bytes=await readFile(new URL(a.path,base));
    if(bytes.length!==a.bytes||hash(bytes)!==a.sha256||a.altered!==false)throw Error('Art integrity mismatch: '+a.id);
  }
  return {valid:true,edition:seed.edition,races:races.size,sources:sources.size,art:art.size,artBytes:manifest.artBytes};
}
if(process.argv[1]&&await realpath(path.resolve(process.argv[1]))===await realpath(fileURLToPath(import.meta.url))){
  try{
    const [command,...args]=process.argv.slice(2);let result;
    if(command==='validate')result=await validateKit();
    else if(command==='core'){const {seed}=await loadSeed();result={edition:seed.edition,status:seed.status,invariants:seed.invariants,authoring:seed.authoring};}
    else if(command==='scene'){if(!args.includes('--author'))throw Error('Scene kits are author material; pass --author.');result=lookup((await loadSeed()).seed,args.filter(s=>s!=='--author').join(' '),{author:true}).races.map(r=>({id:r.id,writingKit:r.writingKit}));}
    else if(command==='lookup'){const {seed}=await loadSeed();result=lookup(seed,args.filter(s=>s!=='--author').join(' '),{author:args.includes('--author')});}
    else throw Error('Use core | lookup <name or phrase> [--author] | scene <name> --author | validate');
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  }catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
