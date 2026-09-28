import test from "node:test";
import assert from "node:assert/strict";
import { analyzeItems, MIN_SAMPLE } from "../src/lib/itemAnalysis.js";

const row = (id, level, n, correct) => ({ question_id: id, level, skill: "Grammar", n, correct });

test("questions with too few sittings are marked needs-data, not judged", () => {
  const [r] = analyzeItems([row("q1", "A1", MIN_SAMPLE - 1, MIN_SAMPLE - 1)]);
  assert.deepEqual(r.flags, ["needs-data"]);
});

test("everyone right / almost nobody right are flagged", () => {
  const out = Object.fromEntries(analyzeItems([row("easy", "A1", 20, 20), row("hard", "A1", 20, 2), row("ok", "A1", 20, 12)]).map(r => [r.question_id, r.flags]));
  assert.deepEqual(out.easy, ["too-easy"]);
  assert.deepEqual(out.hard, ["too-hard"]);
  assert.deepEqual(out.ok, []);
});

test("a higher-level question easier than the level below is flagged as out-of-step", () => {
  const out = Object.fromEntries(analyzeItems([
    row("a2-a", "A2", 20, 12), row("a2-b", "A2", 20, 12), // A2 mean 60%
    row("b1-mislabelled", "B1", 20, 18),                  // 90% > 60% + 10%
    row("b1-fine", "B1", 20, 8)
  ]).map(r => [r.question_id, r.flags]));
  assert.ok(out["b1-mislabelled"].includes("out-of-step"));
  assert.deepEqual(out["b1-fine"], []);
});

test("results are sorted easiest level first", () => {
  const ids = analyzeItems([row("z", "B1", 20, 10), row("a", "A1", 20, 10)]).map(r => r.question_id);
  assert.deepEqual(ids, ["a", "z"]);
});
