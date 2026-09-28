import { validateBank } from "./validateBank.js";

export const bookOf = ageGroup => (ageGroup === "Child" ? "kids" : "teen-adult");

/** DB row -> the question shape used by the test builder. */
export const toPoolQuestion = row => ({
  id: `custom-${row.id}`, level: row.level, skill: row.skill, unitId: row.unit_id,
  question: row.question, options: row.options, answer: row.answer
});

/** Base pool + the teacher's active custom questions for the same book (only for units that exist). */
export function mergePool(pool, rows, unitIds) {
  const extra = rows.filter(r => r.active && unitIds.includes(r.unit_id)).map(toPoolQuestion);
  return extra.length ? [...pool, ...extra] : pool;
}

/** Returns a list of problems (empty = valid) for a form before it is saved. */
export function checkQuestionForm(f) {
  const q = { id: "new", level: f.level, skill: f.skill, question: f.question, options: f.options, answer: f.answer };
  return validateBank([q, { ...q, id: "new2" }], { name: "question" }).errors
    .filter(e => !e.includes("duplicate id")).map(e => e.replace(/^question\/new2?: /, ""));
}
