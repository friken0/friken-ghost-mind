/** Run: node --test Tools/ChromaticBBS/storage.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, view, choose, encodeSeed, continueGame } from './engine.mjs';
import { createVault, VAULT_KEY, VAULT_SCHEMA, MAX_ARCHIVE_BYTES } from './storage.mjs';

class FakeStorage {
  values = new Map();
  quota = false;
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (this.quota) throw Object.assign(new Error('No room'), { name: 'QuotaExceededError' });
    this.values.set(key, value);
  }
}
function play(state = newGame(), turns = 15, selector = () => 0) {
  while (state.turn <= turns) state = choose(state, view(state).choices[selector(state)].id);
  return state;
}
const parsed = vault => JSON.parse(vault.exportArchive());
const expectedScore = state => state.journal.reduce((score, receipt) => score +
  (receipt.roll?.success ? { 12: 5, 15: 10, 18: 20 }[receipt.roll.dc] : 0), 0) +
  Math.floor(state.journal.length / 5) * 30 - state.scars.filter(scar => scar.chapter === state.chapter).length * 20;

test('memory-only vault exports a pseudonymous portable profile without browser APIs', () => {
  const vault = createVault();
  assert.equal(vault.status().persistent, false);
  assert.match(vault.status().message, /Memory only/);
  const profile = vault.profile();
  assert.match(profile.id, /^[0-9a-f-]{36}$/);
  assert.match(profile.callsign, /^DIVER-/);
  assert.equal(vault.current(), null);
  assert.deepEqual(vault.leaderboard(), []);
  assert.equal(parsed(vault).schema, VAULT_SCHEMA);
  assert.deepEqual(Object.keys(profile).sort(), ['callsign', 'id']);
  profile.callsign = 'tampered';
  assert.notEqual(vault.profile().callsign, profile.callsign);
});

test('profile identity and the exact latest seed survive a browser reload', () => {
  const storage = new FakeStorage();
  const vault = createVault(storage);
  const state = play(newGame({ handle: 'Masha · 雨 🌹', rngSeed: 33 }), 7);
  const receipt = vault.save(state);
  assert.equal(receipt.persistent, true);
  assert.equal(receipt.run.seed, encodeSeed(state));
  assert.equal(vault.profile().callsign, state.handle);
  const restored = createVault(storage);
  assert.deepEqual(restored.profile(), vault.profile());
  assert.deepEqual(restored.current(), state);
  restored.current().resources.signal = 0;
  assert.deepEqual(restored.current(), state);
  assert.deepEqual(restored.leaderboard(), vault.leaderboard());
  assert.equal(restored.status().persistent, true);
});

test('saving every decision counts one unique run once and derives its score from receipts', () => {
  const vault = createVault(new FakeStorage());
  let state = newGame({ rngSeed: 17, handle: 'DIVER' });
  vault.save(state);
  while (!state.ending) {
    state = choose(state, view(state).choices[(state.turn + 1) % 3].id);
    const receipt = vault.save(state);
    assert.equal(receipt.run.turns, state.journal.length);
    assert.equal(receipt.run.score, expectedScore(state));
    vault.save(state); // An idempotent refresh must not award more turns.
    assert.equal(parsed(vault).runs.length, 1);
  }
  assert.deepEqual(vault.leaderboard(), [{
    handle: 'DIVER', score: expectedScore(state), turns: 15, runs: 1, completedRuns: 1,
  }]);
  assert.deepEqual(vault.current(), state);
});

test('local leaderboard groups nicknames across unique runs with deterministic sorting', () => {
  const vault = createVault();
  const a = play(newGame({ handle: 'A', rngSeed: 21 }));
  const b = play(newGame({ handle: 'A', rngSeed: 22 }));
  const c = play(newGame({ handle: 'C', rngSeed: 23 }), 4);
  for (const state of [a, b, c]) vault.save(state);
  const rows = vault.leaderboard();
  assert.deepEqual(rows.find(row => row.handle === 'A'), {
    handle: 'A', score: expectedScore(a) + expectedScore(b), turns: 30, runs: 2, completedRuns: 2,
  });
  assert.deepEqual(rows.find(row => row.handle === 'C'), {
    handle: 'C', score: expectedScore(c), turns: 4, runs: 1, completedRuns: 0,
  });
  assert.ok(rows.every((row, index) => index === 0 || rows[index - 1].score >= row.score));
});

test('scar penalties apply in their source chapter only and lineage retains both seeds', () => {
  let state;
  for (let seed = 0; seed < 200 && !state; seed++) {
    let candidate = newGame({ rngSeed: seed });
    for (const suffix of ['bridge', 'chalk', 'borrow', 'observe.echo', 'leap']) {
      const action = view(candidate).choices.find(choice => choice.id.endsWith(`.${suffix}`));
      candidate = choose(candidate, action.id);
    }
    if (candidate.scars.length) state = play(candidate);
  }
  assert.ok(state, 'A real game path must produce a blackout scar.');
  const vault = createVault();
  const parent = vault.save(state).run;
  const child = continueGame(encodeSeed(state));
  const childReceipt = vault.save(child).run;
  assert.equal(childReceipt.score, 0, 'Inherited scars do not create a second penalty.');
  assert.equal(parent.score, expectedScore(state));
  assert.equal(childReceipt.parent, parent.seed.split('.')[2]);
  assert.deepEqual(parsed(vault).runs.map(run => run.seed), [encodeSeed(state), encodeSeed(child)]);
  assert.deepEqual(vault.current(), child);
});

test('quota failure preserves the previous persisted vault and exposes an exportable memory checkpoint', () => {
  const storage = new FakeStorage();
  const vault = createVault(storage);
  const initial = newGame();
  vault.save(initial);
  const previous = storage.getItem(VAULT_KEY);
  storage.quota = true;
  const next = play(initial, 1);
  const receipt = vault.save(next);
  assert.equal(receipt.persistent, false);
  assert.match(receipt.message, /Previous persisted data was preserved/);
  assert.equal(storage.getItem(VAULT_KEY), previous);
  assert.deepEqual(vault.current(), next);
  assert.equal(parsed(vault).runs[0].seed, encodeSeed(next));
  assert.deepEqual(createVault(storage).current(), initial);
  storage.quota = false;
  assert.equal(vault.save(next).persistent, true);
  assert.deepEqual(createVault(storage).current(), next);
});

test('blocked and corrupt browser storage remain explicit memory modes without overwriting source', () => {
  const blocked = createVault({ getItem() { throw new Error('blocked'); }, setItem() { assert.fail('must not write'); } });
  assert.equal(blocked.status().persistent, false);
  assert.match(blocked.status().message, /could not be read/);
  blocked.save(newGame());
  const storage = new FakeStorage();
  storage.setItem(VAULT_KEY, '{damaged');
  const corrupt = createVault(storage);
  corrupt.save(newGame());
  assert.equal(storage.getItem(VAULT_KEY), '{damaged');
  assert.equal(corrupt.status().persistent, false);
  assert.deepEqual(corrupt.current(), newGame());
});

test('a portable archive imports the profile, exact checkpoints and current pointer in one operation', () => {
  const source = createVault();
  const a = play(newGame({ rngSeed: 51, handle: 'SENDER' }));
  const b = play(continueGame(encodeSeed(a)), 2);
  source.save(a);
  source.save(b);
  const destination = createVault(new FakeStorage());
  const receipt = destination.importArchive(source.exportArchive());
  assert.equal(receipt.imported, 2);
  assert.equal(receipt.persistent, true);
  assert.equal(receipt.currentRunId, b.runId);
  assert.deepEqual(destination.profile(), source.profile());
  assert.deepEqual(destination.current(), b);
  assert.deepEqual(parsed(destination), parsed(source));
  assert.equal(destination.importArchive(source.exportArchive()).imported, 0);
});

test('import merges unrelated histories and keeps a newer checkpoint when stale data arrives', () => {
  const source = createVault();
  const a = newGame({ rngSeed: 60 });
  source.save(a);
  const destination = createVault();
  destination.importArchive(source.exportArchive());
  const newer = play(a, 5);
  destination.save(newer);
  destination.save(newGame({ rngSeed: 61, handle: 'OTHER' }));
  destination.importArchive(source.exportArchive());
  assert.equal(parsed(destination).runs.length, 2);
  assert.deepEqual(destination.current(), newer);
  assert.equal(destination.save(a).run.seed, encodeSeed(newer));
});

test('malformed, duplicated, damaged, oversize and dishonest imports reject atomically', () => {
  const storage = new FakeStorage();
  const vault = createVault(storage);
  vault.save(play(newGame(), 7));
  const baseline = vault.exportArchive();
  const changes = [
    value => { value.schema = 'v9'; },
    value => { value.extra = true; },
    value => { value.profile.id = 'fingerprint'; },
    value => { value.profile.callsign = '\n'; },
    value => { value.currentRunId = 'missing'; },
    value => { value.runs.push(value.runs[0]); },
    value => { value.runs[0].score += 999; },
    value => { value.runs[0].turns += 1; },
    value => { value.runs[0].completed = true; },
    value => { value.runs[0].handle = 'somebody-else'; },
    value => { value.runs[0].chapter += 1; },
    value => { value.runs[0].parent = '00000000'; },
    value => { value.runs[0].seed = value.runs[0].seed.slice(0, -1); },
    value => { value.runs[0].untrusted = 'more'; },
  ];
  const invalid = ['{', '[]', '{}', '', null, ' '.repeat(MAX_ARCHIVE_BYTES + 1)];
  for (const change of changes) {
    const archive = JSON.parse(baseline);
    change(archive);
    invalid.push(JSON.stringify(archive));
  }
  for (const json of invalid) {
    assert.throws(() => vault.importArchive(json));
    assert.equal(vault.exportArchive(), baseline);
    assert.equal(storage.getItem(VAULT_KEY), baseline);
  }
});

test('same-run divergent branches cannot silently overwrite the source', () => {
  const state = newGame();
  const first = choose(state, view(state).choices[0].id);
  const second = choose(state, view(state).choices[1].id);
  const vault = createVault(new FakeStorage());
  vault.save(first);
  const baseline = vault.exportArchive();
  assert.throws(() => vault.save(second), /Conflicting branches/);
  assert.equal(vault.exportArchive(), baseline);
  const incoming = JSON.parse(baseline);
  const secondVault = createVault();
  secondVault.importArchive(JSON.stringify({ ...incoming, currentRunId: null, runs: [] }));
  secondVault.save(second);
  assert.throws(() => vault.importArchive(secondVault.exportArchive()), /Conflicting branches/);
  assert.equal(vault.exportArchive(), baseline);
});

test('mutating returned objects and invalid save input cannot mutate the vault', () => {
  const vault = createVault();
  const state = play(newGame(), 1);
  const receipt = vault.save(state);
  const baseline = vault.exportArchive();
  receipt.run.score = 999;
  vault.status().persistent = true;
  vault.leaderboard()[0].score = 999;
  assert.equal(vault.exportArchive(), baseline);
  state.turn = 99;
  assert.throws(() => vault.save(state));
  assert.equal(vault.exportArchive(), baseline);
});

test('two individually valid archives cannot exceed capacity by merging or silently evict old runs', () => {
  const a = createVault();
  const b = createVault();
  // Completed receipts make the capacity check exercise real retained source,
  // rather than padding an otherwise invalid JSON document.
  for (let index = 0; index < 160; index++) {
    const target = index < 80 ? a : b;
    target.save(play(newGame({ rngSeed: 2000 + index, handle: 'CAPACITY' })));
  }
  const before = a.exportArchive();
  const incoming = b.exportArchive();
  assert.ok(Buffer.byteLength(before) < MAX_ARCHIVE_BYTES);
  assert.ok(Buffer.byteLength(incoming) < MAX_ARCHIVE_BYTES);
  assert.throws(() => a.importArchive(incoming), /2 MiB limit/);
  assert.equal(a.exportArchive(), before);
  assert.equal(parsed(a).runs.length, 80);
});
