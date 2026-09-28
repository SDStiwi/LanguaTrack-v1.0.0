import test from "node:test";
import assert from "node:assert/strict";
import { calculateResult, estimateLevel } from "../src/lib/scoring.js";

// Build questions: spec = "A1:4,A2:4,B1:3" ; skills rotate so every skill appears.
const SKILLS = ["Grammar", "Vocabulary", "Reading", "Everyday English"];
function make(spec) {
  const qs = [];
  let n = 0;
  for (const part of spec.split(",")) {
    const [level, count] = part.split(":");
    for (let i = 0; i < Number(count); i++) qs.push({ id: `${level}-${i}`, level, skill: SKILLS[n++ % 4], answer: 0 });
  }
  return qs;
}
// wrongIds get a wrong answer; everything else is right
const answerAll = (qs, wrong = []) => Object.fromEntries(qs.map(q => [q.id, wrong.includes(q.id) ? 1 : 0]));

test("perfect run reaches the top level and is flagged as a ceiling", () => {
  const qs = make("A1:4,A2:4,B1:3,B2:4");
  const r = calculateResult(qs, answerAll(qs));
  assert.equal(r.level, "B2");
  assert.equal(r.percentage, 100);
  assert.equal(r.ceiling, true);
  assert.equal(r.confidence, "high");
});

test("all wrong is A1 with 0%, not a crash", () => {
  const qs = make("A1:4,A2:4,B1:3,B2:4");
  const r = calculateResult(qs, answerAll(qs, qs.map(q => q.id)));
  assert.equal(r.level, "A1");
  assert.equal(r.percentage, 0);
  assert.equal(r.ceiling, false);
});

test("empty question list gives safe zeros (no NaN)", () => {
  const r = calculateResult([], {});
  assert.equal(r.percentage, 0);
  assert.equal(r.level, "A1");
  assert.equal(r.total, 0);
  assert.ok(!Number.isNaN(r.percentage));
});

test("one careless slip at a low level is forgiven", () => {
  const qs = make("A1:4,A2:4,B1:3,B2:4");
  const r = calculateResult(qs, answerAll(qs, ["A1-0"]));
  assert.equal(r.level, "B2");
});

test("a big hole at a lower level blocks higher levels (A2 scored 1/4)", () => {
  const qs = make("A1:4,A2:4,B1:3,B2:4");
  const r = calculateResult(qs, answerAll(qs, ["A2-0", "A2-1", "A2-2"]));
  assert.equal(r.level, "A1", "cannot be B1/B2 when A2 is a hole");
  assert.equal(r.inconsistent, true);
  assert.equal(r.confidence, "low");
});

test("a student who stops at B1 is placed at B1", () => {
  const qs = make("A1:4,A2:4,B1:4,B2:4");
  const wrong = qs.filter(q => q.level === "B2").map(q => q.id);
  const r = calculateResult(qs, answerAll(qs, wrong));
  assert.equal(r.level, "B1");
  assert.equal(r.ceiling, false);
});

test("estimate never exceeds the levels that were tested", () => {
  const qs = make("A1:5,A2:5,B1:5"); // kids test tops out at B1
  const r = calculateResult(qs, answerAll(qs));
  assert.equal(r.level, "B1");
  assert.equal(r.topLevel, "B1");
  assert.equal(r.ceiling, true);
});

test("unanswered questions count as wrong and are reported", () => {
  const qs = make("A1:4,A2:4");
  const r = calculateResult(qs, { "A1-0": 0, "A1-1": 0 });
  assert.equal(r.answered, 2);
  assert.equal(r.correct, 2);
  assert.equal(r.percentage, 25);
});

test("strongest/weakest ignore single-question skills and ties", () => {
  const qs = [
    { id: "1", level: "A1", skill: "Grammar", answer: 0 },
    { id: "2", level: "A1", skill: "Grammar", answer: 0 },
    { id: "3", level: "A1", skill: "Reading", answer: 0 },
    { id: "4", level: "A1", skill: "Reading", answer: 0 },
    { id: "5", level: "A1", skill: "Vocabulary", answer: 0 } // only one question: ignored
  ];
  const r = calculateResult(qs, { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 });
  assert.equal(r.strongest, "Grammar");
  assert.equal(r.weakest, "Reading");
  const tie = calculateResult(qs, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 });
  assert.equal(tie.strongest, null);
  assert.equal(tie.weakest, null);
});

test("levels with a single question are flagged as thin", () => {
  const qs = make("A1:1,A2:2,B1:3,B2:4");
  const r = calculateResult(qs, answerAll(qs));
  assert.deepEqual(r.thinLevels, ["A1"]);
});

test("a result that hinges on one answer gets lower confidence than a robust one", () => {
  const qs = make("A1:4,A2:4,B1:3,B2:4");
  const robust = calculateResult(qs, answerAll(qs));
  // B2 4/4 is fine; make B2 exactly at the pass mark boundary: 3/4 wrong one -> fragile
  const fragile = calculateResult(qs, answerAll(qs, ["B1-0", "B2-0"]));
  const order = { low: 0, medium: 1, high: 2 };
  assert.ok(order[fragile.confidence] <= order[robust.confidence]);
  assert.equal(robust.confidence, "high");
});

test("short tests (<8 questions) are never high confidence", () => {
  const qs = make("A1:2,A2:2,B1:2");
  assert.equal(calculateResult(qs, answerAll(qs)).confidence, "low");
});

test("estimateLevel is the pure rule used by calculateResult", () => {
  const levels = [
    { level: "A1", correct: 4, total: 4 },
    { level: "A2", correct: 3, total: 4 },
    { level: "B1", correct: 1, total: 3 }
  ];
  assert.equal(estimateLevel(levels), "A2");
});

test("Pre-A1 is the floor only when the test contains Pre-A1 questions", () => {
  const q = (id, level) => ({ id, level, skill: "Grammar", answer: 0 });
  const withPre = [q("1", "Pre-A1"), q("2", "Pre-A1"), q("3", "A1"), q("4", "A1")];
  assert.equal(calculateResult(withPre, {}).level, "Pre-A1", "nothing passed, Pre-A1 present");
  assert.equal(calculateResult(withPre, { 1: 0, 2: 0 }).level, "Pre-A1", "Pre-A1 passed, A1 not");
  assert.equal(calculateResult(withPre, { 1: 0, 2: 0, 3: 0, 4: 0 }).level, "A1");
  const withoutPre = [q("1", "A1"), q("2", "A1"), q("3", "A2"), q("4", "A2")];
  assert.equal(calculateResult(withoutPre, {}).level, "A1", "old behaviour: never below A1");
});
