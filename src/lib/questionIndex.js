import { ALL_POOLS } from "../data/banks.js";
import { LEGACY_BANKS } from "../data/legacy/index.js";

/** id → { question, group, unitId } across the current pools and the retired banks, so Insights can label old and new results. */
export function buildQuestionIndex() {
  const index = {};
  for (const { group, bank } of LEGACY_BANKS) for (const q of bank) index[q.id] = { question: q.question, group, legacy: true };
  for (const q of ALL_POOLS.kids) index[q.id] = { question: q.question, group: "Child", unitId: q.unitId };
  for (const q of ALL_POOLS.teenAdult) index[q.id] = { question: q.question, group: "Teen/Adult", unitId: q.unitId };
  return index;
}

/** Adds a teacher's custom questions to the index (ids are `custom-<uuid>`, matching customQuestions.toPoolQuestion). */
export function withCustomQuestions(index, rows = []) {
  const out = { ...index };
  for (const r of rows) out[`custom-${r.id}`] = { question: r.question, group: "Custom", unitId: r.unit_id };
  return out;
}

/** Label for a question id in Insights; a deleted custom question keeps its statistics but not its text. */
export const questionLabel = (index, id) =>
  index?.[id]?.question ?? (String(id).startsWith("custom-") ? "(deleted custom question)" : id);
