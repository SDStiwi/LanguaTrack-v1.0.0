import test from "node:test";
import assert from "node:assert/strict";
import { questionLabel, withCustomQuestions } from "../src/lib/questionIndex.js";

test("custom question text is found by its result id", () => {
  const index = withCustomQuestions({}, [{ id: "abc", question: "She ___ a teacher.", unit_id: "ta-1" }]);
  assert.equal(questionLabel(index, "custom-abc"), "She ___ a teacher.");
});

test("a deleted custom question gets a readable label, not a raw id", () => {
  assert.equal(questionLabel({}, "custom-gone"), "(deleted custom question)");
});

test("unknown built-in ids still fall back to the id", () => {
  assert.equal(questionLabel({}, "ta-9-q1"), "ta-9-q1");
});
