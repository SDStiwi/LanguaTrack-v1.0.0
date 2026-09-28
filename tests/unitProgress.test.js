import test from "node:test";
import assert from "node:assert/strict";
import { clampStars, summarizeProgress, withUnitStars, loadUnitProgress, saveUnitStars } from "../src/lib/unitProgress.js";
import { chooseFocusUnit, fetchTestContext } from "../src/lib/testContext.js";
import { kidsBookLink, hasInteractiveBook } from "../src/lib/books.js";

const units = [{ id: "u1", number: 1 }, { id: "u2", number: 2 }, { id: "u3", number: 3 }];

test("clampStars keeps ratings between 0 and 3", () => {
  assert.deepEqual([-2, 0, 1.6, 3, 9, "x", null].map(clampStars), [0, 0, 2, 3, 3, 0, 0]);
});

test("summarizeProgress counts done units and finds the next one", () => {
  assert.deepEqual(summarizeProgress(units, []).next, null); // nothing recorded yet: no opinion
  const s = summarizeProgress(units, [{ unit_id: "u1", stars: 3 }, { unit_id: "u2", stars: 1 }, { unit_id: "ghost", stars: 3 }]);
  assert.equal(s.done, 1);
  assert.equal(s.started, 2);
  assert.equal(s.total, 3);
  assert.equal(s.next.id, "u2");
  assert.deepEqual(s.stars, { u1: 3, u2: 1, u3: 0 });
  assert.equal(summarizeProgress(units, units.map(u => ({ unit_id: u.id, stars: 3 }))).next, null);
});

test("withUnitStars replaces one row and keeps its note", () => {
  const rows = [{ unit_id: "u1", stars: 1, note: "hw p.7" }, { unit_id: "u2", stars: 2, note: "" }];
  const out = withUnitStars(rows, "u1", 3);
  assert.equal(out.length, 2);
  assert.deepEqual(out.find(r => r.unit_id === "u1"), { unit_id: "u1", stars: 3, note: "hw p.7" });
  assert.equal(withUnitStars([], "u3", 2).length, 1);
});

test("saveUnitStars upserts on (student_id, unit_id) and surfaces errors", async () => {
  const calls = [];
  const client = ok => ({ from: table => ({ upsert: async (row, opts) => { calls.push({ table, row, opts }); return { error: ok ? null : new Error("nope") }; } }) });
  await saveUnitStars(client(true), { studentId: "s1", unitId: "u2", stars: 7 });
  assert.equal(calls[0].table, "unit_progress");
  assert.equal(calls[0].row.stars, 3);
  assert.deepEqual(calls[0].opts, { onConflict: "student_id,unit_id" });
  await assert.rejects(saveUnitStars(client(false), { studentId: "s1", unitId: "u2", stars: 1 }), /nope/);
});

test("loadUnitProgress returns rows and throws on error", async () => {
  const mk = (data, error) => ({ from: () => ({ select: () => ({ eq: async () => ({ data, error }) }) }) });
  assert.deepEqual(await loadUnitProgress(mk([{ unit_id: "u1", stars: 2 }], null), "s1"), [{ unit_id: "u1", stars: 2 }]);
  assert.deepEqual(await loadUnitProgress(mk(null, null), "s1"), []);
  await assert.rejects(loadUnitProgress(mk(null, new Error("down")), "s1"), /down/);
});

test("focus unit prefers the teacher's next unit, then the latest placement", () => {
  const student = { assessments: [{ completed_at: "2026-01-01", start_unit_id: "u3" }, { completed_at: "2025-01-01", start_unit_id: "u1" }] };
  assert.equal(chooseFocusUnit({ student, progressRows: [{ unit_id: "u1", stars: 3 }], units }), "u2");
  assert.equal(chooseFocusUnit({ student, progressRows: [], units }), "u3");
  assert.equal(chooseFocusUnit({ student: { assessments: [{ completed_at: "2026-01-01", start_unit_id: "gone" }] }, units }), null);
  assert.equal(chooseFocusUnit({ student: {}, units }), null);
});

test("fetchTestContext is best-effort: demo students use in-memory ids, failures never throw", async () => {
  const demo = await fetchTestContext(null, { id: "demo-1", seenQuestionIds: ["q1", "q2"] }, units);
  assert.deepEqual([...demo.seen].sort(), ["q1", "q2"]);
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  const broken = { from: () => { throw new Error("offline"); } };
  const ctx = await fetchTestContext(broken, { id: uuid, assessments: [{ id: "a1", completed_at: "2026-01-01", start_unit_id: "u2" }] }, units);
  assert.equal(ctx.seen.size, 0);
  assert.equal(ctx.focusUnitId, "u2");
});

test("kids book links use the book's #unit-N anchors", () => {
  assert.equal(kidsBookLink("/", 5), "/books/my-english-adventure-kids.html#unit-5");
  assert.equal(kidsBookLink("/app/"), "/app/books/my-english-adventure-kids.html");
  assert.equal(hasInteractiveBook("Child"), true);
  assert.equal(hasInteractiveBook("Adult"), false);
});
