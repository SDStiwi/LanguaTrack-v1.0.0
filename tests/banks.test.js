import test from "node:test";
import assert from "node:assert/strict";
import { ALL_POOLS, getPool } from "../src/data/banks.js";
import { ALL_CURRICULA, getCurriculum } from "../src/data/curriculum/index.js";
import { LEGACY_BANKS } from "../src/data/legacy/index.js";
import { unitCoverage } from "../src/lib/curriculum.js";
import { validateBank } from "../src/lib/validateBank.js";
import { prepareQuestions } from "../src/lib/assessments.js";
import { calculateResult } from "../src/lib/scoring.js";
import { buildPool } from "../src/lib/buildPool.js";

const PAIRS = [["kids", "Child"], ["teenAdult", "Adult"]];

test("both question pools are structurally valid, with ids unique across pools and retired banks", () => {
  const seen = new Set(LEGACY_BANKS.flatMap(l => l.bank.map(q => q.id)));
  for (const [key] of PAIRS) {
    const { errors } = validateBank(ALL_POOLS[key], { name: key, seenIds: seen });
    assert.deepEqual(errors, []);
  }
});

test("every question is tagged with a real unit, and its level matches the unit's scoringLevel", () => {
  for (const [key] of PAIRS) {
    const units = ALL_CURRICULA[key];
    const cov = unitCoverage(ALL_POOLS[key], units, { min: 6 });
    assert.deepEqual(cov.untagged, [], `${key} untagged`);
    assert.deepEqual(cov.unknown, [], `${key} unknown`);
    assert.deepEqual(cov.uncovered, [], `${key} units with < 6 questions`);
    const level = Object.fromEntries(units.map(u => [u.id, u.scoringLevel]));
    for (const q of ALL_POOLS[key]) assert.equal(q.level, level[q.unitId], q.id);
  }
});

test("each unit mixes skills: two grammar, two vocabulary, one reading, one everyday-English question", () => {
  for (const [key] of PAIRS) {
    for (const u of ALL_CURRICULA[key]) {
      const skills = ALL_POOLS[key].filter(q => q.unitId === u.id).map(q => q.skill).sort();
      assert.deepEqual(skills, ["Everyday English", "Grammar", "Grammar", "Reading", "Vocabulary", "Vocabulary"], u.id);
    }
  }
});

test("no question repeats within a pool (normalised text)", () => {
  for (const [key] of PAIRS) {
    const texts = ALL_POOLS[key].map(q => q.question.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim());
    assert.equal(new Set(texts).size, texts.length, key);
  }
});

test("age groups get the right pool; teens and adults share one", () => {
  assert.equal(getPool("Child"), ALL_POOLS.kids);
  assert.equal(getPool("Teen"), getPool("Adult"));
  assert.equal(getPool("nonsense"), ALL_POOLS.teenAdult);
});

test("each unit's pool provides at least two distinct levels overall, so a level can be judged", () => {
  for (const [key] of PAIRS) {
    const levels = new Set(ALL_POOLS[key].map(q => q.level));
    assert.deepEqual([...levels], ["Pre-A1", "A1", "A2"], key);
  }
});

test("the validator really catches broken questions", () => {
  const bad = [
    { id: "x", level: "Z9", skill: "Grammar", question: "?", options: ["a", "a", "b", "c"], answer: 9 },
    { id: "x", level: "A1", skill: "Nonsense", question: "", options: ["a", "b"], answer: 0 }
  ];
  const { errors } = validateBank(bad, { name: "bad" });
  assert.ok(errors.some(e => /unknown level/.test(e)));
  assert.ok(errors.some(e => /duplicate options/.test(e)));
  assert.ok(errors.some(e => /out of range/.test(e)));
  assert.ok(errors.some(e => /duplicate id/.test(e)));
  assert.ok(errors.some(e => /unknown skill/.test(e)));
  assert.ok(errors.some(e => /exactly 4 options/.test(e)));
});

test("a full sitting scores 100% when the shown correct option is chosen, however options are shuffled", () => {
  for (const [key, group] of PAIRS) {
    const qs = prepareQuestions(ALL_POOLS[key].slice(0, 20));
    const answers = Object.fromEntries(qs.map(q => [q.id, q.answer]));
    assert.equal(calculateResult(qs, answers).percentage, 100, group);
  }
});

test("buildPool rejects unknown units and skill codes", () => {
  const units = [{ id: "u1", scoringLevel: "A1" }];
  assert.throws(() => buildPool(units, { nope: [] }), /unknown unit/);
  assert.throws(() => buildPool(units, { u1: [["Z", "q", "a", "b", "c", "d"]] }), /unknown skill/);
  const [q] = buildPool(units, { u1: [["G", "q", "a", "b", "c", "d"]] }, "p-");
  assert.deepEqual(q, { id: "p-u1-q1", unitId: "u1", level: "A1", skill: "Grammar", question: "q", options: ["a", "b", "c", "d"], answer: 0 });
});

test("curricula are reachable through getCurriculum", () => {
  assert.equal(getCurriculum("Child"), ALL_CURRICULA.kids);
});
