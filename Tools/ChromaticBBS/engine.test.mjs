/** Run: node --test Tools/ChromaticBBS/engine.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  newGame, view, choose, encodeSeed, decodeSeed, continueGame,
  validateState, checkOdds, SCHEMA, TOTAL_TURNS, MAX_SEED_BYTES,
} from './engine.mjs';

const copy = (value) => JSON.parse(JSON.stringify(value));
const canonical = (value) => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object'
    ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
    : JSON.stringify(value);
function forgePayload(value) {
  const bytes = Buffer.from(canonical(value));
  let checksum = 0x811c9dc5;
  for (const byte of bytes) checksum = Math.imul(checksum ^ byte, 0x01000193) >>> 0;
  return `FGC1.${bytes.toString('base64url')}.${checksum.toString(16).padStart(8, '0')}`;
}
function play({ rngSeed = 20261019, selector = () => 0, initial = null } = {}) {
  let state = initial || newGame({ rngSeed });
  while (state.turn <= TOTAL_TURNS) {
    const currentView = view(state);
    const index = selector(state, currentView);
    state = choose(state, typeof index === 'string' ? index : currentView.choices[index].id);
  }
  return state;
}
const suffix = (game, name) => {
  const choice = view(game).choices.find((item) => item.id.endsWith(`.${name}`));
  assert.ok(choice, `Missing choice ${name} at turn ${game.turn}`);
  return choice.id;
};

test('all 15 decisions produce immutable lineage, three acts, ending and portable seed', () => {
  let state = newGame();
  assert.equal(state.schema, SCHEMA);
  assert.deepEqual(state.stats, { guts: 6, focus: 5, glitch: 5, awe: 5, insight: 5, ego: 4 });
  assert.equal(state.rng.initial, 20261019);
  const acts = [];
  for (let turn = 1; turn <= 15; turn++) {
    const priorState = state;
    const before = copy(state);
    const frame = view(state);
    assert.equal(frame.choices.length, 3);
    assert.equal(new Set(frame.choices.map((choice) => choice.id)).size, 3);
    assert.equal(frame.act, Math.floor((turn - 1) / 5) + 1);
    acts.push(frame.act);
    state = choose(state, frame.choices[0].id);
    assert.deepEqual(priorState, before, 'choose must not mutate its input');
    assert.equal(state.world.relic.revision, turn);
    assert.equal(state.lastReceipt.artifact.parentRevision, turn - 1);
    assert.equal(state.lastReceipt.artifact.revision, turn);
    assert.ok(Object.values(state.resources).every((value) => value >= 0 && value <= 10));
    assert.equal(state.journal.length, turn);
    assert.equal(state.turn, turn + 1);
    if ([4, 9, 12].includes(turn)) {
      assert.ok(state.lastReceipt.moduleChange);
      assert.equal(state.lastReceipt.moduleChange.priorRevision, 0);
      assert.equal(state.lastReceipt.moduleChange.revision, 1);
      assert.match(state.lastReceipt.moduleChange.ruleDiff, / → /);
      assert.equal(state.world.relic.form, { 4: 'rose', 9: 'face', 12: 'gate' }[turn]);
    }
  }
  assert.deepEqual(acts, [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3]);
  assert.match(state.ending.text, /universe-bearing packet/);
  assert.equal(view(state).choices.length, 0);
  assert.equal(view(state).progress.remaining, 0);
  assert.deepEqual(decodeSeed(encodeSeed(state)), state);
});

test('OBSERVE and GRAFT create legal actions, compose traits and retain later witnesses', () => {
  const final = play({ selector(state, frame) {
    if (state.turn === 4) return suffix(state, 'observe.echo');
    if (state.turn === 9) return suffix(state, 'graft.forge');
    if (state.turn === 12) return suffix(state, 'bequeath.guarded');
    if ([5, 6, 7, 8].includes(state.turn)) return suffix(state, 'observe.echo');
    if ([10, 11].includes(state.turn)) return suffix(state, 'graft.forge');
    if (state.turn >= 13) return suffix(state, 'bequeath.guarded');
    return frame.choices[0].id;
  } });
  const [observe, graft, bequeath] = final.modules;
  assert.deepEqual(observe.witnessTurns, [5, 6, 7, 8]);
  assert.deepEqual(graft.witnessTurns, [10, 11]);
  assert.deepEqual(bequeath.witnessTurns, [13, 14, 15]);
  assert.equal(graft.law.trait, 'resonance+sender');
  assert.equal(final.journal[3].moduleChange.witnessTurn, 5);
  assert.equal(final.journal[8].moduleChange.witnessTurn, 10);
  assert.equal(final.journal[11].moduleChange.witnessTurn, 13);
  assert.equal(final.journal[8].moduleChange.newlyPossibleChoice, 't10.graft.forge');
  assert.match(final.journal[9].label, /resonance/);
  assert.ok(final.world.relic.traits.includes('resonance+sender'));
  assert.equal(final.world.policy.inheritance, 'guarded');
});

test('the same GRAFT variant executes different arithmetic for three owned source traits', () => {
  const outcomes = {};
  for (const source of ['witness', 'negative', 'echo']) {
    let state = newGame({ rngSeed: 33 });
    while (state.turn <= 9) {
      const selected = state.turn === 4 ? suffix(state, `observe.${source}`)
        : state.turn === 9 ? suffix(state, 'graft.relay') : view(state).choices[0].id;
      state = choose(state, selected);
    }
    // Start at the same resource point to isolate the actual composition law.
    state.resources = { signal: 3, compute: 4, noise: 4 };
    const graft = view(state).choices.find((choice) => choice.operator === 'graft');
    assert.match(graft.detail, /Owned (testimony|absence|resonance)/);
    assert.match(state.modules.find((module) => module.id === 'graft').law.rule, /Owned/);
    const result = choose(state, graft.id);
    outcomes[source] = result.resources;
    assert.equal(result.lastReceipt.roll, null);
  }
  assert.deepEqual(outcomes.witness, { signal: 6, compute: 3, noise: 5 });
  assert.deepEqual(outcomes.negative, { signal: 5, compute: 4, noise: 5 });
  assert.deepEqual(outcomes.echo, { signal: 5, compute: 3, noise: 4 });
});

test('relationships answer in the square and the ending; preparation does not deliver early', () => {
  let state = newGame();
  while (state.turn < 11) state = choose(state, view(state).choices[0].id);
  assert.match(view(state).scene, /Krex brings the wire back himself/);
  while (state.turn < 15) state = choose(state, view(state).choices[0].id);
  assert.equal(state.world.policy.delivery, 'pending');
  assert.ok(state.world.facts.some((fact) => fact.startsWith('route-')));
  assert.ok(!state.world.facts.some((fact) => fact.startsWith('mail-')));
  state = choose(state, view(state).choices[0].id);
  assert.notEqual(state.world.policy.delivery, 'pending');
  assert.ok(state.world.facts.some((fact) => fact.startsWith('mail-')));
  assert.match(state.ending.text, /Ooope|Moknon|Krex|Pogfrot|Veelow/);
});

test('raw stat d20 odds are exact, mundane choices consume no randomness', () => {
  assert.deepEqual(checkOdds(5, 12), { successes: 14, total: 20, percent: 70, needed: 7 });
  assert.equal(checkOdds(6, 15).percent, 60);
  assert.equal(checkOdds(4, 18).percent, 35);
  assert.equal(checkOdds(0, 40).percent, 0);
  assert.equal(checkOdds(20, 1).percent, 100);
  const before = newGame({ rngSeed: 4 });
  const checked = view(before).choices.find((choice) => choice.stat);
  assert.equal(checked.odds, 0.75);
  assert.equal(checked.oddsDetail.successes, 15);
  const mundane = choose(before, suffix(before, 'listen'));
  assert.equal(mundane.rng.current, before.rng.current);
  assert.equal(mundane.lastReceipt.roll, null);
  const rolled = choose(before, checked.id);
  assert.notEqual(rolled.rng.current, before.rng.current);
  const receipt = rolled.lastReceipt;
  assert.equal(receipt.roll.total, receipt.roll.die + 6);
  assert.equal(receipt.roll.success, receipt.roll.total >= 12);
});

test('post-roll Ghost reactions cover results deterministically without advancing RNG', () => {
  const seen = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const initial = newGame({ rngSeed: Math.imul(seed, 2654435761) >>> 0 });
    const state = choose(initial, suffix(initial, 'bridge'));
    const before = canonical(state);
    const first = view(state);
    const second = view(state);
    assert.equal(first.ghost, second.ghost);
    assert.equal(canonical(state), before);
    const roll = state.lastReceipt.roll;
    if (roll.die === 1) {
      seen.add('one');
      assert.match(first.ghost, /^(Natural one|One\.)/);
    } else if (roll.die === 20) {
      seen.add('twenty');
      assert.match(first.ghost, /^(Natural twenty|Twenty\.)/);
    } else {
      seen.add(roll.success ? 'pass' : 'fail');
      assert.match(first.ghost, /DC12/);
    }
    assert.ok(first.ghost.length>40);
  }
  assert.deepEqual([...seen].sort(), ['fail', 'one', 'pass', 'twenty']);
});

test('completed seeds issued before the voice revision still validate and continue', () => {
  const legacy = play();
  legacy.ending = {
    id: 'open', title: 'THE OPEN CARRIER',
    text: 'The last letter reaches one waiting doorstep. Its doors belong to everyone. Veelow finishes the note with a voice that finally has somewhere to land. 2 unfinished threads and 0 blackout scars cross the gate with you; the next chapter begins inside these consequences.',
    seedHint: 'BOOT + this FGC1 code continues the lineage with refreshed resources and inherited laws.',
  };
  const code = encodeSeed(legacy);
  assert.deepEqual(decodeSeed(code).ending, legacy.ending);
  const child = continueGame(code);
  assert.equal(child.chapter, 2);
  assert.equal(child.parent, code.split('.')[2]);
  assert.deepEqual(child.world.policy, legacy.world.policy);
});

test('the actual C26.2 completed seed retains its original ending through the new cast edition', () => {
  const code=readFileSync(new URL('./fixtures/c26-2-completed.seed',import.meta.url),'utf8').trim();
  const original=decodeSeed(code);
  assert.equal(original.handle,'OLD-GUEST');
  assert.equal(original.ending.title,'UNIVERSE: PUBLIC WRITE ACCESS');
  assert.match(original.ending.text,/shipped reality before the committee/);
  assert.equal(encodeSeed(original),code);
  const next=continueGame(code);
  assert.equal(next.chapter,2);
  assert.equal(next.parent,code.split('.')[2]);
});

test('choice sequence and RNG deterministically reproduce every byte, with distinct histories', () => {
  const selector = (state) => (state.turn * 7) % 3;
  const a = play({ rngSeed: 0, selector });
  const b = play({ rngSeed: 0, selector });
  assert.deepEqual(a, b);
  assert.equal(encodeSeed(a), encodeSeed(b));
  const other = play({ rngSeed: 19, selector });
  assert.notEqual(encodeSeed(a), encodeSeed(other));
  const ids = [...a.choices];
  let replay = newGame({ rngSeed: 0 });
  for (const id of ids) replay = choose(replay, id);
  assert.deepEqual(replay, a);
});

test('many seeds and changing paths all finish, remain bounded and round-trip', () => {
  const endings = new Set();
  for (let seed = 0; seed < 48; seed++) {
    for (const pattern of [0, 1, 2]) {
      const state = play({ rngSeed: seed * 1009, selector: (game) => (game.turn + seed + pattern) % 3 });
      assert.equal(state.turn, 16);
      assert.equal(state.modules.length, 3);
      assert.ok(state.ending);
      assert.deepEqual(decodeSeed(encodeSeed(state)), state);
      endings.add(state.ending.id);
    }
  }
  assert.ok(endings.size >= 3, 'The paths must materially affect their endings.');
});

test('invalid, premature, locked and completed actions reject without changing input', () => {
  const game = newGame();
  const before = canonical(game);
  for (const invalid of ['t01.observe.echo', 't02.listen', '__proto__', '', 'x'.repeat(65), null]) assert.throws(() => choose(game, invalid));
  assert.equal(canonical(game), before);
  const ended = play();
  const finalBefore = encodeSeed(ended);
  assert.throws(() => choose(ended, ended.choices[0]), /ended/);
  assert.equal(encodeSeed(ended), finalBefore);
  // A real cost gate removes the operator. No hidden choice can be executed.
  let low = newGame();
  for (let i = 0; i < 4; i++) low = choose(low, view(low).choices[0].id);
  low.resources.compute = 0;
  assert.ok(!view(low).choices.some((choice) => choice.operator === 'observe'));
  const lockedBefore = canonical(low);
  assert.throws(() => choose(low, 't05.observe.witness'), /not legal/);
  assert.equal(canonical(low), lockedBefore);
});

test('a depleted carrier crosses the act boundary with one bounded scar, without extra turns', () => {
  let recovered;
  for (let seed = 0; seed < 200 && !recovered; seed++) {
    let state = newGame({ rngSeed: seed });
    for (const name of ['bridge', 'chalk', 'borrow', 'observe.echo', 'leap']) state = choose(state, suffix(state, name));
    if (state.scars.length) recovered = state;
  }
  assert.ok(recovered, 'A real failed-check path must exercise blackout recovery.');
  assert.equal(recovered.turn, 6);
  assert.equal(recovered.resources.signal, 3);
  assert.equal(recovered.scars.length, 1);
  assert.equal(recovered.scars[0].act, 1);
  assert.match(recovered.lastReceipt.notes[0], /recovered/);
  const final = play({ initial: recovered });
  assert.equal(final.turn, 16);
  assert.ok(final.scars.length <= 3);
  assert.equal(continueGame(encodeSeed(final)).scars[0].id, recovered.scars[0].id);
});

test('canonical Unicode seed survives key reordering; view returns detached values', () => {
  const state = newGame({ handle: 'Masha · 雨 🌹' });
  const code = encodeSeed(state);
  assert.equal(decodeSeed(code).handle, 'Masha · 雨 🌹');
  const reordered = Object.fromEntries(Object.entries(state).reverse());
  assert.equal(encodeSeed(reordered), code);
  const frame = view(state);
  frame.relic.form = 'gate';
  frame.choices[0].label = 'changed';
  assert.equal(state.world.relic.form, 'seed');
  assert.notEqual(view(state).choices[0].label, 'changed');
});

test('damaged, oversized, wrong-version, prototype and malformed seeds are rejected', () => {
  const final = play({ selector: () => 2 });
  const valid = encodeSeed(final);
  const damaged = valid.slice(0, -1) + (valid.endsWith('0') ? '1' : '0');
  assert.throws(() => decodeSeed(damaged), /checksum mismatch/);
  assert.throws(() => decodeSeed(valid.replace('FGC1.', 'FGC2.')));
  assert.throws(() => decodeSeed('FGC1.' + 'A'.repeat(MAX_SEED_BYTES * 2) + '.00000000'), /limit/);
  assert.throws(() => decodeSeed('FGC1.A.00000000'));
  assert.throws(() => decodeSeed(valid + '\n'));
  const mutations = [
    (state) => { state.schema = 'friken.chromatic.state.v9'; },
    (state) => { state.unrecognized = true; },
    (state) => { state.turn = 17; },
    (state) => { state.stats.guts = 20; },
    (state) => { state.resources.noise = -1; },
    (state) => { state.resources.compute = '8'; },
    (state) => { state.handle = 'x'.repeat(33); },
    (state) => { state.world.facts.push('unknown-world-rule'); },
    (state) => { state.world.relic.form = 'script'; },
    (state) => { state.modules[0].id = 'eval'; },
    (state) => { state.modules[0].law.rule = 'Run arbitrary code'; },
    (state) => { state.modules[1].price.compute = -100; },
    (state) => { state.modules[0].witnessTurns.push(99); },
    (state) => { state.journal[0].choice = state.choices[0] = 't01.hack'; },
    (state) => { state.journal[0].choice = state.choices[0] = 't01.observe.echo'; },
    (state) => { state.journal[0].deltas.signal = 11; },
    (state) => { state.journal[3].moduleChange.ruleDiff = 'not the rule that changed'; },
    (state) => { state.ending.text = 'An ending unrelated to your consequences'; },
    (state) => { state.parent = 'abc'; },
    (state) => { state.rng.current = (state.rng.current + 1) >>> 0; },
  ];
  for (const mutation of mutations) {
    const forged = copy(final);
    mutation(forged);
    assert.throws(() => decodeSeed(forgePayload(forged)), `Accepted mutation ${mutation}`);
  }
  const polluted = JSON.parse(canonical(final));
  polluted.world = JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(() => decodeSeed(forgePayload(polluted)), /prototype key/);
  assert.equal({}.polluted, undefined);
  const cyclic = newGame();
  cyclic.world.extra = cyclic;
  assert.throws(() => validateState(cyclic), /cyclic/);
  const sparse = newGame();
  sparse.world.facts = new Array(3);
  assert.throws(() => validateState(sparse), /array fields/);
});

test('a checksum-valid lie about a roll or an operator is still invalid state', () => {
  const state = play({ selector: (game) => game.turn === 4 ? 2 : 1 });
  const rolled = state.journal.findIndex((receipt) => receipt.roll);
  assert.notEqual(rolled, -1);
  const arithmetic = copy(state);
  arithmetic.journal[rolled].roll.total += 1;
  assert.throws(() => decodeSeed(forgePayload(arithmetic)), /roll arithmetic/);
  const wrongRule = copy(state);
  wrongRule.journal[rolled].roll.dc = wrongRule.journal[rolled].roll.dc === 12 ? 15 : 12;
  assert.throws(() => decodeSeed(forgePayload(wrongRule)), /action check rule/);
  const wrongOperator = copy(state);
  wrongOperator.journal[0].operator = 'graft';
  assert.throws(() => decodeSeed(forgePayload(wrongOperator)), /receipt operator/);
});

test('continuation requires completion and inherits actual world consequences and working laws', () => {
  assert.throws(() => continueGame(encodeSeed(newGame())), /finish/);
  assert.throws(() => newGame({ parent: newGame() }), /finish/);
  const parent = play({ selector: (state) => state.turn === 4 ? 2 : state.turn === 9 ? 0 : state.turn === 12 ? 1 : 0 });
  const code = encodeSeed(parent);
  const child = continueGame(code);
  assert.equal(child.chapter, 2);
  assert.equal(child.parent, code.split('.')[2]);
  assert.equal(child.turn, 1);
  assert.deepEqual(child.journal, []);
  assert.deepEqual(child.choices, []);
  assert.equal(child.lastReceipt, null);
  assert.equal(child.ending, null);
  assert.deepEqual(child.relations, parent.relations);
  assert.deepEqual(child.scars, parent.scars);
  assert.deepEqual(child.world.threads, parent.world.threads);
  assert.deepEqual(child.world.policy, parent.world.policy);
  assert.ok(parent.world.facts.every((fact) => child.world.facts.includes(fact)));
  assert.equal(child.world.relic.revision, 15);
  assert.deepEqual(child.modules.map((module) => module.law), parent.modules.map((module) => module.law));
  assert.equal(child.resources.signal, 6);
  assert.equal(child.resources.compute, 6);
  assert.notEqual(child.rng.initial, parent.rng.initial);
  assert.match(view(child).scene, /Chapter 2 inherits/);
  assert.ok(view(child).choices.some((choice) => choice.id === 't01.bequeath.guarded'));
  const acted = choose(child, 't01.bequeath.guarded');
  assert.equal(acted.lastReceipt.operator, 'bequeath');
  assert.equal(acted.resources.compute, 7);
  assert.equal(acted.modules.find((module) => module.id === 'bequeath').uses, parent.modules.find((module) => module.id === 'bequeath').uses + 1);
  assert.deepEqual(continueGame(code), child);
  const nextEnd = play({ initial: acted });
  assert.equal(nextEnd.modules[0].revision, 2);
  assert.equal(nextEnd.journal[3].moduleChange.priorRevision, 1);
  assert.match(nextEnd.journal[3].moduleChange.ruleDiff, / → /);
  assert.deepEqual(decodeSeed(encodeSeed(nextEnd)), nextEnd);
});

test('32-chapter lineage remains bounded and explicitly rejects a chapter past its format limit', () => {
  let state = play({ selector: () => 2 });
  for (let chapter = 2; chapter <= 32; chapter++) {
    state = play({ initial: continueGame(encodeSeed(state)), selector: () => 2 });
    assert.equal(state.chapter, chapter);
    assert.equal(state.world.relic.revision, chapter * 15);
    assert.ok(Buffer.from(encodeSeed(state).split('.')[1], 'base64url').length <= MAX_SEED_BYTES);
  }
  assert.equal(state.modules[2].revision, 32);
  assert.throws(() => continueGame(encodeSeed(state)), /32-chapter limit/);
});
