import test from "node:test";
import assert from "node:assert/strict";
import { checkQuestionForm, mergePool, bookOf } from "../src/lib/customQuestions.js";

const good = { level: "A1", skill: "Grammar", question: "She ___ a teacher.", options: ["is", "are", "am", "be"], answer: 0 };

test("accepts a valid question", () => assert.deepEqual(checkQuestionForm(good), []));
test("rejects duplicate options and empty text", () => {
  assert.ok(checkQuestionForm({ ...good, options: ["is", "is", "am", "be"] }).length);
  assert.ok(checkQuestionForm({ ...good, question: " " }).length);
});
test("mergePool adds only active questions for known units", () => {
  const rows = [
    { id: "1", active: true, unit_id: "u1", ...good }, { id: "2", active: false, unit_id: "u1", ...good },
    { id: "3", active: true, unit_id: "zzz", ...good }
  ];
  const out = mergePool([{ id: "base" }], rows, ["u1"]);
  assert.deepEqual(out.map(q => q.id), ["base", "custom-1"]);
});
test("book mapping", () => { assert.equal(bookOf("Child"), "kids"); assert.equal(bookOf("Adult"), "teen-adult"); });
