import test from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, summarizeTrend } from "../src/lib/progress.js";

const a = (date, level, score, type = "progress") => ({ id: date, completed_at: date, estimated_level: level, score, type });

test("timeline is oldest-first and drops rows without a date or a known level", () => {
  const line = buildTimeline([a("2026-03-01T00:00:00Z", "B1", 70), a("2026-01-01T00:00:00Z", "A2", 50), { id: "x", estimated_level: "B1" }, a("2026-02-01T00:00:00Z", "?", 1)]);
  assert.deepEqual(line.map(x => x.estimated_level), ["A2", "B1"]);
});

test("trend: no results / first result", () => {
  assert.equal(summarizeTrend([]).direction, "none");
  assert.equal(summarizeTrend([a("2026-01-01T00:00:00Z", "A2", 50)]).direction, "new");
});

test("trend: moving up, down and staying level", () => {
  assert.equal(summarizeTrend([a("2026-01-01T00:00:00Z", "A2", 50), a("2026-02-01T00:00:00Z", "B1", 60)]).direction, "up");
  assert.equal(summarizeTrend([a("2026-01-01T00:00:00Z", "B1", 70), a("2026-02-01T00:00:00Z", "A2", 60)]).direction, "down");
  assert.equal(summarizeTrend([a("2026-01-01T00:00:00Z", "B1", 70), a("2026-02-01T00:00:00Z", "B1", 75)]).direction, "same");
});

test("score delta is only reported between two tests of the same kind", () => {
  const same = summarizeTrend([a("2026-01-01T00:00:00Z", "A2", 50, "progress"), a("2026-02-01T00:00:00Z", "A2", 65, "progress")]);
  assert.equal(same.scoreDelta, 15);
  const mixed = summarizeTrend([a("2026-01-01T00:00:00Z", "A2", 50, "initial"), a("2026-02-01T00:00:00Z", "A2", 65, "progress")]);
  assert.equal(mixed.scoreDelta, null);
});
