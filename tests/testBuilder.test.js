import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_SIZE, PROGRESS_SIZE, buildInitial, buildProgress, buildTest } from "../src/lib/testBuilder.js";
import { ALL_POOLS } from "../src/data/banks.js";
import { ALL_CURRICULA } from "../src/data/curriculum/index.js";
import { calculateResult } from "../src/lib/scoring.js";
import { prepareQuestions } from "../src/lib/assessments.js";

// Small deterministic generator so the tests are repeatable.
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const SETS = [["kids", ALL_POOLS.kids, ALL_CURRICULA.kids], ["teenAdult", ALL_POOLS.teenAdult, ALL_CURRICULA.teenAdult]];

test("initial test: exactly 15 distinct questions covering every unit", () => {
  for (const [name, pool, units] of SETS) for (let s = 1; s <= 25; s++) {
    const t = buildInitial(pool, units, seeded(s));
    assert.equal(t.length, INITIAL_SIZE, name);
    assert.equal(new Set(t.map(q => q.id)).size, INITIAL_SIZE, `${name} duplicates`);
    assert.deepEqual([...new Set(t.map(q => q.unitId))].sort(), units.map(u => u.id).sort(), `${name} coverage`);
  }
});

test("initial test gives every level at least two questions, so each can be judged", () => {
  for (const [name, pool, units] of SETS) for (let s = 1; s <= 25; s++) {
    const counts = {};
    for (const q of buildInitial(pool, units, seeded(s))) counts[q.level] = (counts[q.level] || 0) + 1;
    for (const [level, n] of Object.entries(counts)) assert.ok(n >= 2, `${name} ${level} has ${n}`);
  }
});

test("initial tests vary between sittings", () => {
  const [, pool, units] = SETS[1];
  const ids = s => buildInitial(pool, units, seeded(s)).map(q => q.id).join();
  assert.notEqual(ids(1), ids(2));
});

test("progress test: 10 distinct questions, at most 3 per unit", () => {
  for (const [name, pool, units] of SETS) for (let s = 1; s <= 25; s++) {
    const t = buildProgress(pool, units, { rng: seeded(s), focusUnitId: units[4].id });
    assert.equal(t.length, PROGRESS_SIZE, name);
    assert.equal(new Set(t.map(q => q.id)).size, PROGRESS_SIZE);
    const per = {};
    for (const q of t) per[q.unitId] = (per[q.unitId] || 0) + 1;
    assert.ok(Math.max(...Object.values(per)) <= 3, name);
  }
});

test("progress test avoids questions the student has already seen", () => {
  for (const [name, pool, units] of SETS) {
    const seen = new Set(buildInitial(pool, units, seeded(3)).map(q => q.id));
    for (let s = 1; s <= 25; s++) {
      const t = buildProgress(pool, units, { rng: seeded(s), seen, focusUnitId: units[2].id });
      assert.ok(t.every(q => !seen.has(q.id)), name);
    }
  }
});

test("progress test falls back to seen questions rather than running short", () => {
  const [, pool, units] = SETS[0];
  const seen = new Set(pool.slice(0, pool.length - 4).map(q => q.id)); // only 4 unseen left
  const t = buildProgress(pool, units, { rng: seeded(9), seen });
  assert.equal(t.length, PROGRESS_SIZE);
});

test("progress test centres on the focus unit, averaged over many draws", () => {
  const [, pool, units] = SETS[1];
  const near = focusId => {
    let hits = 0, total = 0;
    const fi = units.findIndex(u => u.id === focusId);
    for (let s = 1; s <= 200; s++) for (const q of buildProgress(pool, units, { rng: seeded(s), focusUnitId: focusId })) {
      total++;
      if (Math.abs(units.findIndex(u => u.id === q.unitId) - fi) <= 1) hits++;
    }
    return hits / total;
  };
  const focused = near(units[10].id);
  const baseline = 3 / units.length; // share of units within +-1 if nothing were weighted
  assert.ok(focused > baseline * 1.5, `focused ${focused.toFixed(2)} vs unweighted ${baseline.toFixed(2)}`);
});

test("buildTest dispatches on type, and a sitting scores end to end", () => {
  const [, pool, units] = SETS[0];
  const t = buildTest({ type: "initial", pool, units, rng: seeded(5) });
  assert.equal(t.length, INITIAL_SIZE);
  const qs = prepareQuestions(t);
  const perfect = calculateResult(qs, Object.fromEntries(qs.map(q => [q.id, q.answer])));
  assert.equal(perfect.percentage, 100);
  assert.equal(perfect.level, "A2");
  assert.equal(perfect.ceiling, true);
  const none = calculateResult(qs, {});
  assert.equal(none.level, "Pre-A1");
  assert.equal(buildTest({ type: "progress", pool, units, rng: seeded(5) }).length, PROGRESS_SIZE);
});
