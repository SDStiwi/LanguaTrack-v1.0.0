import test from "node:test";
import assert from "node:assert/strict";
import { prepareQuestions, buildEntry, toPayload, saveAssessment, summarizeStudent, isPersistedStudent, shuffle } from "../src/lib/assessments.js";
import { calculateResult } from "../src/lib/scoring.js";

const bank = [
  { id: "b1", level: "B1", skill: "Grammar", question: "q", options: ["w", "x", "y", "z"], answer: 2 },
  { id: "a1", level: "A1", skill: "Reading", question: "q", options: ["w", "x", "y", "z"], answer: 0 }
];
const seq = values => { let i = 0; return () => values[i++ % values.length]; };

test("prepareQuestions orders easiest-first and keeps the correct answer correct after shuffling", () => {
  for (let run = 0; run < 50; run++) {
    const qs = prepareQuestions(bank);
    assert.deepEqual(qs.map(q => q.id), ["a1", "b1"]);
    for (const q of qs) {
      const original = bank.find(b => b.id === q.id);
      assert.equal(q.options[q.answer], original.options[original.answer]);
      assert.deepEqual([...q.options].sort(), [...original.options].sort());
    }
  }
});

test("shuffle is a permutation and does not mutate its input", () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seq([0.1, 0.9, 0.5, 0.3]));
  assert.deepEqual([...out].sort(), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});

test("saved answers use the ORIGINAL option index, with a level/skill snapshot", () => {
  const qs = prepareQuestions(bank, seq([0.99, 0.5, 0.1, 0.7]));
  const answers = Object.fromEntries(qs.map(q => [q.id, q.answer])); // all correct
  const result = calculateResult(qs, answers);
  const entry = buildEntry({ student: { id: "s" }, type: "initial", questions: qs, answers, result, startedAt: "t", modeLabel: "Adults", ownerId: "teacher-1" });
  for (const a of entry.answers) {
    const original = bank.find(b => b.id === a.question_id);
    assert.equal(a.selected_answer, original.answer);
    assert.equal(a.is_correct, true);
    assert.equal(a.level, original.level);
    assert.equal(a.skill, original.skill);
  }
  assert.equal(entry.ownerId, "teacher-1");
  assert.equal(entry.assessment.title, "Initial Level Assessment · Adults");
  assert.equal(toPayload(entry).client_id, entry.localId);
});

test("an unanswered question is saved as null and incorrect", () => {
  const qs = prepareQuestions(bank);
  const entry = buildEntry({ student: { id: "s" }, type: "progress", questions: qs, answers: {}, result: calculateResult(qs, {}), startedAt: "t" });
  assert.ok(entry.answers.every(a => a.selected_answer === null && a.is_correct === false));
});

test("saveAssessment calls the atomic RPC once and reports success", async () => {
  const calls = [];
  const client = { rpc: async (name, args) => { calls.push([name, args]); return { error: null }; } };
  const entry = { localId: "L1", assessment: { student_id: "s" }, answers: [] };
  const res = await saveAssessment(client, entry);
  assert.equal(res.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "submit_assessment");
  assert.equal(calls[0][1].p_payload.client_id, "L1");
});

test("saveAssessment never throws — errors and network exceptions come back as { ok:false }", async () => {
  const entry = { localId: "L1", assessment: {}, answers: [] };
  const a = await saveAssessment({ rpc: async () => ({ error: { code: "23503", message: "fk" } }) }, entry);
  assert.equal(a.ok, false);
  assert.equal(a.error.code, "23503");
  const b = await saveAssessment({ rpc: async () => { throw new TypeError("Failed to fetch"); } }, entry);
  assert.equal(b.ok, false);
});

test("summarizeStudent takes level/score from the most recent assessment", () => {
  const s = summarizeStudent({ id: "1", assessments: [
    { completed_at: "2026-01-01T00:00:00Z", estimated_level: "A2", score: 50 },
    { completed_at: "2026-03-01T00:00:00Z", estimated_level: "B1", score: 70 }
  ] });
  assert.equal(s.level, "B1");
  assert.equal(s.score, 70);
  assert.equal(s.tests, 2);
  assert.equal(summarizeStudent({ id: "2" }).level, "—");
});

test("isPersistedStudent only accepts real UUIDs (demo/local ids are not saved remotely)", () => {
  assert.equal(isPersistedStudent({ id: "3f2b8c1e-9a4d-4e6b-8f10-1234567890ab" }), true);
  assert.equal(isPersistedStudent({ id: "demo-1" }), false);
  assert.equal(isPersistedStudent({ id: "local-123" }), false);
  assert.equal(isPersistedStudent(null), false);
});
