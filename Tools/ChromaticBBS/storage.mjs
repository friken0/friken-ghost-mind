import {rollScore} from './causality.mjs';
/**
 * A local, portable save vault. No cookies, network, fingerprint or login.
 * Seeds retain exact checkpoint data; derived run totals are never trusted on
 * import. Browser storage is best-effort and every receipt states its durability.
 * Leaderboard entries are local pseudonymous claims, not authenticated scores.
 */
import { encodePlaySeed, decodePlaySeed, validatePlayState } from './chapters.mjs';

export const VAULT_SCHEMA = 'friken.chromatic.vault.v1';
export const VAULT_KEY = VAULT_SCHEMA;
export const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024;
const encoder = new TextEncoder();
const copy = value => JSON.parse(JSON.stringify(value));
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const runKeys = ['playerId', 'runId', 'handle', 'chapter', 'parent', 'turns', 'score', 'completed', 'seed'];

function fail(message) { throw new Error(message); }
function fields(value, keys, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    fail(`Invalid ${name} fields.`);
  }
}
function playerId(id) {
  if (typeof id !== 'string' || !uuidPattern.test(id)) fail('Invalid pseudonymous player ID.');
}
function callsign(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 32 || /[\x00-\x1f\x7f]/.test(value)) {
    fail('A callsign must contain 1–32 visible characters.');
  }
}
function validateProfile(profile) {
  fields(profile, ['id', 'callsign'], 'profile');
  playerId(profile.id);
  callsign(profile.callsign);
}
function freshProfile() {
  const crypto = globalThis.crypto;
  let id;
  if (typeof crypto?.randomUUID === 'function') id = crypto.randomUUID();
  else if (typeof crypto?.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  } else fail('Secure random IDs are unavailable in this host.');
  return { id, callsign: `DIVER-${id.slice(0, 6).toUpperCase()}` };
}

function runMetadata(state, id, seed = encodePlaySeed(state)) {
  validatePlayState(state);
  playerId(id);
  const turns = state.journal.length;
  const checks = state.journal.reduce((score, receipt) => score +
    rollScore(receipt.roll), 0);
  // Inherited scars were already charged in their own chapters.
  const scars = state.scars.filter(scar => scar.chapter === state.chapter).length;
  return {
    playerId: id, runId: state.runId, handle: state.handle, chapter: state.chapter,
    parent: state.parent, turns, score: checks + (state.pack ? state.pack.scenes.filter((scene,i)=>i<turns&&(i===state.pack.scenes.length-1||state.pack.scenes[i+1].act!==scene.act)).length : Math.floor(turns / 5)) * 30 - scars * 20,
    completed: state.ending !== null, seed,
  };
}
function serialized(archive) {
  const json = JSON.stringify(archive);
  if (encoder.encode(json).length > MAX_ARCHIVE_BYTES) {
    fail('Vault exceeds its 2 MiB limit. Export the existing archive and keep the new FGC1 seed separately; no saved run was evicted.');
  }
  return json;
}
function parseArchive(json) {
  if (typeof json !== 'string' || json.length > MAX_ARCHIVE_BYTES || encoder.encode(json).length > MAX_ARCHIVE_BYTES) {
    fail('Archive must be JSON within the 2 MiB limit.');
  }
  let archive;
  try { archive = JSON.parse(json); } catch { fail('Archive must be valid JSON.'); }
  fields(archive, ['schema', 'profile', 'currentRunId', 'runs'], 'archive');
  if (archive.schema !== VAULT_SCHEMA) fail('Unsupported vault schema.');
  validateProfile(archive.profile);
  if (!Array.isArray(archive.runs) || archive.runs.length > 4096) fail('Invalid archive run list.');
  const seen = new Set();
  for (const run of archive.runs) {
    fields(run, runKeys, 'run');
    if (seen.has(run.runId)) fail('Duplicate run IDs in archive.');
    seen.add(run.runId);
    const state = decodePlaySeed(run.seed);
    const expected = runMetadata(state, run.playerId, run.seed);
    if (runKeys.some(key => run[key] !== expected[key])) fail('Run metadata does not match its seed.');
  }
  if (archive.currentRunId !== null && !seen.has(archive.currentRunId)) fail('Current run is absent from archive.');
  return archive;
}

/** Compare choice ancestry, keeping an existing source if a stale seed arrives. */
function mergedCheckpoint(previous, incoming) {
  if (!previous) return incoming;
  if (previous.seed === incoming.seed) return previous;
  if (previous.playerId !== incoming.playerId) fail('The same run ID has conflicting player attribution.');
  const a = decodePlaySeed(previous.seed);
  const b = decodePlaySeed(incoming.seed);
  const shared = Math.min(a.choices.length, b.choices.length);
  if (a.choices.slice(0, shared).some((choice, index) => choice !== b.choices[index])) {
    fail('Conflicting branches share one run ID. Export both FGC1 seeds separately; the existing run was preserved.');
  }
  if (a.choices.length === b.choices.length) {
    fail('Conflicting checkpoint data shares one run ID. The existing run was preserved.');
  }
  return b.choices.length > a.choices.length ? incoming : previous;
}

/**
 * Pass window.localStorage after reading it inside a try block, or null for an
 * explicit memory-only host. All methods are synchronous and return copies.
 * Import merges after full validation, adopts the imported portable profile,
 * and never discards unrelated runs. It cannot authenticate somebody's score.
 */
export function createVault(storage = null) {
  let archive = { schema: VAULT_SCHEMA, profile: freshProfile(), currentRunId: null, runs: [] };
  let writable = !!storage;
  let durability = { persistent: false, message: 'Memory only: browser storage is unavailable. Export your archive before leaving.' };

  function persist(candidate) {
    const json = serialized(candidate); // Fail before altering either copy.
    let result;
    if (writable) {
      try {
        storage.setItem(VAULT_KEY, json);
        result = { persistent: true, message: 'Saved in this browser. Export an archive for a portable backup.' };
      } catch (error) {
        result = { persistent: false, message: `Memory only: browser storage write failed (${error?.name || 'storage error'}). Previous persisted data was preserved; export before leaving.` };
      }
    } else result = durability;
    archive = candidate;
    durability = result;
    return { ...result };
  }

  if (storage) {
    try {
      if (typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') fail('Storage API unavailable.');
      const existing = storage.getItem(VAULT_KEY);
      if (existing !== null) {
        archive = parseArchive(existing);
        durability = { persistent: true, message: 'Restored from this browser. Export an archive for a portable backup.' };
      } else persist(archive);
    } catch (error) {
      writable = false;
      durability = { persistent: false, message: `Memory only: stored vault could not be read (${error.message}). Existing stored data was left untouched; export before leaving.` };
    }
  }

  return Object.freeze({
    profile() { return copy(archive.profile); },
    current() {
      const run = archive.runs.find(item => item.runId === archive.currentRunId);
      return run ? decodePlaySeed(run.seed) : null;
    },
    save(state) {
      const seed = encodePlaySeed(state);
      const candidate = copy(archive);
      const index = candidate.runs.findIndex(run => run.runId === state.runId);
      const previous = candidate.runs[index];
      // Continuing an imported run keeps its original pseudonymous attribution.
      const run = mergedCheckpoint(previous, runMetadata(state, previous?.playerId || candidate.profile.id, seed));
      if (index === -1) candidate.runs.push(run);
      else candidate.runs[index] = run;
      candidate.profile.callsign = run.handle;
      candidate.currentRunId = run.runId;
      return { ...persist(candidate), run: copy(run) };
    },
    leaderboard() {
      const grouped = new Map();
      for (const run of archive.runs) {
        const row = grouped.get(run.handle) || { handle: run.handle, score: 0, turns: 0, runs: 0, completedRuns: 0 };
        row.score += run.score;
        row.turns += run.turns;
        row.runs += 1;
        row.completedRuns += Number(run.completed);
        grouped.set(run.handle, row);
      }
      return [...grouped.values()].sort((a, b) => b.score - a.score || b.turns - a.turns || a.handle.localeCompare(b.handle));
    },
    exportArchive() { return serialized(archive); },
    importArchive(json) {
      const incoming = parseArchive(json);
      const candidate = copy(archive);
      const runs = new Map(candidate.runs.map(run => [run.runId, run]));
      let imported = 0;
      for (const run of incoming.runs) {
        const previous = runs.get(run.runId);
        const merged = mergedCheckpoint(previous, run);
        if (!previous || merged.seed !== previous.seed) imported += 1;
        runs.set(run.runId, merged);
      }
      candidate.runs = [...runs.values()];
      candidate.profile = incoming.profile;
      candidate.currentRunId = incoming.currentRunId ?? candidate.currentRunId;
      // The merged size is checked before persist commits any in-memory data.
      return { ...persist(candidate), imported, currentRunId: candidate.currentRunId };
    },
    status() { return { ...durability }; },
  });
}
