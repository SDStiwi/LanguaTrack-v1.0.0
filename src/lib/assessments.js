import { LEVELS } from "./scoring.js";

const LEVEL_ORDER = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only persisted students with UUID-style IDs can have results saved. */
export const isPersistedStudent = student => Boolean(student?.persisted) || UUID_RE.test(String(student?.id ?? ""));

export function shuffle(items, rng = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Get a question bank ready for one sitting:
 *  - questions run from easiest to hardest level (the sort is stable, so the
 *    order inside a level is the bank's order),
 *  - answer options are shuffled so the correct answer isn't always in the same
 *    slot (in the raw data most correct answers sit in the first slot).
 * `answer` is recalculated for the shuffled options, and `order[k]` remembers
 * which ORIGINAL option is now shown in slot k (used when saving answers).
 */
export function prepareQuestions(bank, rng = Math.random) {
  return [...bank]
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level])
    .map(q => {
      const order = shuffle(q.options.map((_, i) => i), rng);
      return {
        ...q,
        options: order.map(i => q.options[i]),
        answer: order.indexOf(q.answer),
        order
      };
    });
}

/** Turn student rows (with their embedded assessments) into what the UI shows. */
export function summarizeStudent(row) {
  const done = [...(row.assessments || [])].sort(
    (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
  );
  const latest = done[0];
  return {
    ...row,
    level: latest?.estimated_level || "—",
    score: latest ? latest.score : null,
    tests: done.length
  };
}

/** Columns fetched for a student and their assessment history (used by list, profile and notes). */
export const STUDENT_SELECT =
  "*, assessments(id, title, type, score, estimated_level, confidence, completed_at, start_unit_id)";

/** Everything needed to save (or later re-send) one finished assessment. */
export function buildEntry({ student, type, questions, answers, result, startedAt, modeLabel, ownerId, startUnitId }) {
  return {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerId: ownerId ?? null,
    attempts: 0,
    assessment: {
      student_id: student.id,
      type,
      title: (type === "initial" ? "Initial Level Assessment" : "Progress Test") + (modeLabel ? ` · ${modeLabel}` : ""),
      score: result.percentage,
      estimated_level: result.level,
      confidence: result.confidence ?? null,
      start_unit_id: startUnitId ?? null,
      skills: result.skills ?? null,
      levels: (result.levels ?? []).map(({ level, correct, total }) => ({ level, correct, total })),
      started_at: startedAt,
      completed_at: new Date().toISOString()
    },
    answers: questions.map(q => ({
      question_id: String(q.id),
      // store the index in the ORIGINAL option order, not the shuffled one
      selected_answer: answers[q.id] === undefined ? null : q.order[answers[q.id]],
      is_correct: answers[q.id] === q.answer,
      // snapshot, so history stays analysable even if the question bank changes later
      level: q.level,
      skill: q.skill,
      unit_id: q.unitId ?? null
    }))
  };
}

/** The single JSON document sent to the `submit_assessment` database adapter. */
export function toPayload(entry) {
  return { client_id: entry.localId, assessment: entry.assessment, answers: entry.answers };
}

/**
 * Save an entry through the `submit_assessment` database adapter: the
 * assessment and all its answers are written in ONE transaction, and the call
 * is idempotent on `client_id`, so a retry after a lost response can never
 * create a duplicate. Never throws.
 */
export async function saveAssessment(client, entry) {
  try {
    const { error } = await client.rpc("submit_assessment", { p_payload: toPayload(entry) });
    if (error) throw error;
    return { ok: true, entry };
  } catch (error) {
    return { ok: false, error, entry };
  }
}
