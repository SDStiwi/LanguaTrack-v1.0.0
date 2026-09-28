import { isPersistedStudent } from "./assessments.js";
import { loadUnitProgress, summarizeProgress } from "./unitProgress.js";

/** The unit tests should centre on: the teacher's "next unit" if progress exists, else where the latest placement said to start. */
export function chooseFocusUnit({ student, progressRows = [], units }) {
  const fromTeacher = summarizeProgress(units, progressRows).next;
  if (fromTeacher) return fromTeacher.id;
  const latest = [...(student?.assessments || [])].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];
  return latest?.start_unit_id && units.some(u => u.id === latest.start_unit_id) ? latest.start_unit_id : null;
}

/**
 * Everything a progress test needs to avoid repeats and centre on the right unit.
 * Best effort: any failure just means an un-personalised test, never a blocked one.
 */
export async function fetchTestContext(client, student, units) {
  const seen = new Set(student?.seenQuestionIds || []); // demo mode keeps these in memory
  let progressRows = [];
  if (client && isPersistedStudent(student)) {
    try {
      const ids = (student.assessments || []).map(a => a.id).filter(Boolean);
      const [answers, rows] = await Promise.all([
        ids.length ? client.from("assessment_answers").select("question_id").in("assessment_id", ids) : { data: [] },
        loadUnitProgress(client, student.id)
      ]);
      for (const a of answers.data || []) seen.add(a.question_id);
      progressRows = rows;
    } catch { /* keep going without personalisation */ }
  }
  return { seen, progressRows, focusUnitId: chooseFocusUnit({ student, progressRows, units }) };
}
