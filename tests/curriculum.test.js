import test from "node:test";
import assert from "node:assert/strict";
import { validateCurriculum, unitCoverage, findUnit, recommendStartUnit, unitAnswers, unitBreakdown } from "../src/lib/curriculum.js";
import { getCurriculum, getBookName, ALL_CURRICULA } from "../src/data/curriculum/index.js";
import { LEVELS } from "../src/lib/scoring.js";

test("both curricula are structurally valid, with globally unique unit ids", () => {
  const seenIds = new Set();
  for (const [name, units] of Object.entries(ALL_CURRICULA)) {
    const { errors, warnings } = validateCurriculum(units, { name, seenIds, levels: LEVELS });
    assert.deepEqual(errors, [], errors.join("\n"));
    assert.deepEqual(warnings, [], warnings.join("\n"));
  }
});

test("kids book has 12 units and the teen/adult book has 14 (12 + 2 pre-A1)", () => {
  assert.equal(ALL_CURRICULA.kids.length, 12);
  assert.equal(ALL_CURRICULA.teenAdult.length, 14);
  assert.deepEqual(ALL_CURRICULA.teenAdult.slice(0, 2).map(u => u.band), ["Pre-A1", "Pre-A1"]);
});

test("units are in book order", () => {
  assert.deepEqual(ALL_CURRICULA.kids.map(u => u.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const pages = ALL_CURRICULA.kids.map(u => u.startPage);
  assert.deepEqual(pages, [...pages].sort((a, b) => a - b));
});

test("age groups map to the right book; unknown falls back to adult", () => {
  assert.equal(getBookName("Child"), "My English Adventure (Book 1)");
  assert.equal(getCurriculum("Teen"), getCurriculum("Adult"));
  assert.equal(getCurriculum("nonsense"), getCurriculum("Adult"));
});

test("validateCurriculum catches bad units", () => {
  const bad = [
    { id: "a", title: "A", grammar: ["x"], vocab: ["w"] },
    { id: "a", title: "", grammar: [], vocab: [] },
    { title: "no id", grammar: ["x"], vocab: ["w"] }
  ];
  const { errors } = validateCurriculum(bad);
  assert.ok(errors.some(e => e.includes("duplicate id")));
  assert.ok(errors.some(e => e.includes("missing title")));
  assert.ok(errors.some(e => e.includes("grammar")));
  assert.ok(errors.some(e => e.includes("vocabulary")));
  assert.ok(errors.some(e => e.includes("missing id")));
  assert.ok(validateCurriculum([]).errors.length);
});

test("unitCoverage counts tagged, untagged, unknown and uncovered", () => {
  const units = [{ id: "u1" }, { id: "u2" }, { id: "u3" }];
  const bank = [{ id: "q1", unitId: "u1" }, { id: "q2", unitId: "u1" }, { id: "q3" }, { id: "q4", unitId: "zzz" }, { id: "q5", unitId: "u2" }];
  const c = unitCoverage(bank, units, { min: 2 });
  assert.deepEqual(c.perUnit, { u1: 2, u2: 1, u3: 0 });
  assert.deepEqual(c.untagged, ["q3"]);
  assert.deepEqual(c.unknown, [{ question: "q4", unitId: "zzz" }]);
  assert.deepEqual(c.uncovered, ["u2", "u3"]);
});

test("recommendStartUnit forgives one slip but flags two misses in a row", () => {
  const units = ["u1", "u2", "u3", "u4", "u5"].map(id => ({ id }));
  const a = (unitId, ok) => ({ unitId, isCorrect: ok });
  // one slip at u2, then fine: no gap anywhere
  const slip = [a("u1", true), a("u2", false), a("u3", true), a("u4", true), a("u5", true)];
  assert.deepEqual(recommendStartUnit(slip, units), { unit: units[4], kind: "complete" });
  // u3 and u4 both missed: teaching starts at u3
  const gap = [a("u1", true), a("u2", true), a("u3", false), a("u4", false), a("u5", true)];
  assert.deepEqual(recommendStartUnit(gap, units), { unit: units[2], kind: "gap" });
  // weak from the very start
  const weak = units.map(u => a(u.id, false));
  assert.equal(recommendStartUnit(weak, units).unit.id, "u1");
});

test("recommendStartUnit says nothing without enough tagged answers", () => {
  const units = [{ id: "u1" }, { id: "u2" }];
  assert.equal(recommendStartUnit([{ unitId: "u1", isCorrect: true }], units), null);
  assert.equal(recommendStartUnit([{ isCorrect: true }, { isCorrect: false }], units), null);
  assert.equal(recommendStartUnit([], units), null);
  assert.equal(findUnit(units, "u2").id, "u2");
  assert.equal(findUnit(units, "nope"), null);
});

test("unitAnswers and unitBreakdown summarise a sitting by unit", () => {
  const units = [{ id: "u1" }, { id: "u2" }, { id: "u3" }];
  const qs = [{ id: "a", unitId: "u1", answer: 2 }, { id: "b", unitId: "u1", answer: 0 }, { id: "c", unitId: "u3", answer: 1 }, { id: "d", answer: 0 }];
  const list = unitAnswers(qs, { a: 2, b: 3, c: 1, d: 0 });
  assert.deepEqual(list, [{ unitId: "u1", isCorrect: true }, { unitId: "u1", isCorrect: false }, { unitId: "u3", isCorrect: true }]);
  assert.deepEqual(unitBreakdown(list, units).map(x => [x.unit.id, x.right, x.total]), [["u1", 1, 2], ["u3", 1, 1]]);
});

test("validateCurriculum checks scoringLevel names and order", () => {
  const ok = [{ id: "a", title: "A", grammar: ["x"], vocab: ["w"], scoringLevel: "A1" }, { id: "b", title: "B", grammar: ["x"], vocab: ["w"], scoringLevel: "A2" }];
  assert.deepEqual(validateCurriculum(ok, { levels: LEVELS }).errors, []);
  const bad = [{ ...ok[1], id: "a" }, { ...ok[0], id: "b", scoringLevel: "Z9" }];
  const { errors } = validateCurriculum(bad, { levels: LEVELS });
  assert.ok(errors.some(e => e.includes("unknown scoringLevel")));
  const down = [ok[1], { ...ok[0], id: "c" }];
  assert.ok(validateCurriculum(down, { levels: LEVELS }).errors.some(e => e.includes("must not go down")));
});
