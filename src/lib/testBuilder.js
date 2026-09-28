/**
 * Builds one sitting from a book-aligned pool (pure; pass a seeded `rng` in tests).
 *
 *  - initial (15 questions): every unit gets one question, in the spirit of "sample the
 *    whole book"; the few remaining slots go to extra questions from evenly spread units.
 *  - progress (10 questions): sampled across all units, but units around the student's
 *    current unit are weighted up. Questions the student has already seen are avoided
 *    unless the pool would run short (exposure control).
 */
export const INITIAL_SIZE = 15;
export const PROGRESS_SIZE = 10;
const MAX_PER_UNIT_IN_PROGRESS = 3;

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const byUnit = (pool, units) => Object.fromEntries(units.map(u => [u.id, pool.filter(q => q.unitId === u.id)]));

export function buildInitial(pool, units, rng = Math.random) {
  const groups = byUnit(pool, units);
  const chosen = [];
  const used = new Set();
  const take = (unitId, avoidSkill) => {
    const options = groups[unitId].filter(q => !used.has(q.id));
    if (!options.length) return false;
    const varied = options.filter(q => q.skill !== avoidSkill);
    const q = pick(varied.length ? varied : options, rng);
    used.add(q.id);
    chosen.push(q);
    return true;
  };
  let lastSkill = null;
  for (const u of units) if (take(u.id, lastSkill)) lastSkill = chosen[chosen.length - 1].skill;

  const extras = Math.max(0, INITIAL_SIZE - chosen.length);
  for (let k = 1; k <= extras; k++) {
    const idx = Math.round((k * (units.length - 1)) / (extras + 1));
    const order = [...units.slice(idx), ...units.slice(0, idx)];
    for (const u of order) if (take(u.id, null)) break;
  }
  return chosen.slice(0, INITIAL_SIZE);
}

function weightFor(unitIdx, focusIdx) {
  if (focusIdx < 0) return 1;
  const d = Math.abs(unitIdx - focusIdx);
  return d <= 1 ? 4 : d <= 3 ? 2 : 1;
}

/** Weighted sampling without replacement (Efraimidis-Spirakis keys). */
function weightedSample(items, n, keyOf, rng) {
  return items
    .map(item => ({ item, key: Math.pow(rng(), 1 / keyOf(item)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, n)
    .map(x => x.item);
}

export function buildProgress(pool, units, { rng = Math.random, seen = new Set(), focusUnitId = null } = {}) {
  const idxOf = Object.fromEntries(units.map((u, i) => [u.id, i]));
  const focusIdx = focusUnitId in idxOf ? idxOf[focusUnitId] : -1;
  const fresh = pool.filter(q => !seen.has(q.id));
  const source = fresh.length >= PROGRESS_SIZE ? fresh : pool;
  const weight = q => weightFor(idxOf[q.unitId], focusIdx);

  const chosen = [];
  const perUnit = {};
  let candidates = source;
  while (chosen.length < PROGRESS_SIZE && candidates.length) {
    const [q] = weightedSample(candidates, 1, weight, rng);
    candidates = candidates.filter(c => c !== q);
    if ((perUnit[q.unitId] || 0) >= MAX_PER_UNIT_IN_PROGRESS) continue;
    perUnit[q.unitId] = (perUnit[q.unitId] || 0) + 1;
    chosen.push(q);
  }
  return chosen;
}

export const buildTest = ({ type, pool, units, rng, seen, focusUnitId }) =>
  type === "initial" ? buildInitial(pool, units, rng) : buildProgress(pool, units, { rng, seen, focusUnitId });
