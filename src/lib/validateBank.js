import { LEVELS } from "./scoring.js";

export const SKILLS = ["Grammar", "Vocabulary", "Reading", "Everyday English"];
export const MAX_INITIAL_QUESTIONS = 15;

const norm = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

/**
 * Structural checks for one question bank. Errors would break scoring or the
 * UI; warnings are content-quality hints. `seenIds` lets callers check id
 * uniqueness across several banks.
 */
export function validateBank(bank, { name = "bank", seenIds = new Set(), maxQuestions } = {}) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(bank) || bank.length === 0) return { errors: [`${name}: bank is empty`], warnings };
  if (maxQuestions && bank.length > maxQuestions) errors.push(`${name}: ${bank.length} questions exceeds the limit of ${maxQuestions}`);

  const perLevel = {};
  const perSkill = {};
  for (const q of bank) {
    const at = `${name}/${q?.id ?? "?"}`;
    if (!q || typeof q.id !== "string" || !q.id) { errors.push(`${at}: missing id`); continue; }
    if (seenIds.has(q.id)) errors.push(`${at}: duplicate id`);
    seenIds.add(q.id);
    if (!LEVELS.includes(q.level)) errors.push(`${at}: unknown level "${q.level}"`);
    if (!SKILLS.includes(q.skill)) errors.push(`${at}: unknown skill "${q.skill}"`);
    if (!q.question || !String(q.question).trim()) errors.push(`${at}: empty question text`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${at}: needs exactly 4 options`);
    else {
      if (q.options.some(o => !String(o).trim())) errors.push(`${at}: empty option`);
      if (new Set(q.options.map(norm)).size !== q.options.length) errors.push(`${at}: duplicate options`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errors.push(`${at}: answer index out of range`);
    }
    perLevel[q.level] = (perLevel[q.level] || 0) + 1;
    perSkill[q.skill] = (perSkill[q.skill] || 0) + 1;
  }
  for (const [l, n] of Object.entries(perLevel)) if (n < 2) warnings.push(`${name}: level ${l} has only ${n} question — it cannot be judged on its own`);
  for (const s of SKILLS) if (!perSkill[s]) warnings.push(`${name}: no ${s} questions`);
  return { errors, warnings, perLevel, perSkill };
}

/** A progress test should not re-ask questions from the initial test (practice effect). */
export function findRepeatedQuestions(initial, progress) {
  const seen = new Map(initial.map(q => [norm(q.question), q.id]));
  return progress.filter(q => seen.has(norm(q.question))).map(q => ({ progress: q.id, initial: seen.get(norm(q.question)) }));
}
