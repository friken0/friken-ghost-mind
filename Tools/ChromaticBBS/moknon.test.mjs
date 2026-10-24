import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loadSeed,lookup,validateKit} from './moknon-cli.mjs';

test('curated kit validates exact portraits and linked source identities',async()=>{
  const r=await validateKit();assert.equal(r.races,26);assert.equal(r.art,26);assert.equal(r.sources,34);
});
test('aliases resolve the same race without fabricating source facts',async()=>{
  const {seed}=await loadSeed();assert.equal(lookup(seed,'Frik-Bridge').races[0].id,'race.frik');
  assert.equal(lookup(seed,'Cylvis').races[0].id,'race.cylvix');
  assert.throws(()=>lookup(seed,'a race we have not written'),/No matching/);
  assert.throws(()=>lookup(seed,''),/Supply/);
});
test('brief view excludes deep plot and proposed encounters; author view labels them',async()=>{
  const {seed}=await loadSeed(),brief=lookup(seed,'Ooope'),author=lookup(seed,'Ooope',{author:true});
  assert.equal(brief.races.length,1);assert.equal(brief.races[0].authorOnly,undefined);
  assert.equal(brief.races[0].proposedEncounter,undefined);assert.equal(brief.sources,undefined);
  assert.equal(author.races[0].proposedEncounter.status,'NEW_PROPOSAL_NOT_RECOVERED_DIALOGUE');assert.ok(author.sources.length);
});
test('satellite lookup preserves contradictory accounts; editorial lookup cannot mutate the seed',async()=>{
  const {seed}=await loadSeed(),before=JSON.stringify(seed),r=lookup(seed,'black knight',{author:true});
  assert.ok(r.disputes.some(d=>d.id==='dispute.black-knight'&&d.accounts.length===3));
  assert.equal(JSON.stringify(seed),before);
});

test('standalone CLI actually emits a validation receipt',()=>{
 const r=spawnSync(process.execPath,[fileURLToPath(new URL('./moknon-cli.mjs',import.meta.url)),'validate'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).valid,true);
});


test('all 26 writing kits have individual motives, six authored lines, three approaches and evidence boundaries',async()=>{
 const {seed}=await loadSeed();const names=new Set();for(const race of seed.races){const w=race.writingKit;assert.equal(w.status,'AUTHORED_LOCAL_FICTION_NOT_RECOVERED_DIALOGUE');assert.deepEqual(w.sourceIds,race.sourceIds);assert.equal(w.dialogue.length,6);assert.equal(w.playableApproaches.length,3);assert.equal(w.sceneBeats.length,3);for(const key of ['name','role','want','fear','blindSpot','surprisingKindness','voice'])assert.ok(w.resident[key].length>2);assert.equal(w.evidenceBoundary,race.authorOnly);names.add(w.resident.name);assert.equal(lookup(seed,race.name).races[0].writingKit,undefined);}assert.equal(names.size,26);
});
