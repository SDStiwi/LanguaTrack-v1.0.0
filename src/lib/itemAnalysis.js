import { LEVELS } from "./scoring.js";

// Below this many sittings a question's success rate is anecdote, not evidence.
export const MIN_SAMPLE = 10;
export const TOO_EASY = 0.95;
export const TOO_HARD = 0.2;
export const EASIER_THAN_LOWER_BY = 0.1;

const rate = r => (r.n ? r.correct / r.n : 0);

/**
 * Classic item analysis. `rows` are aggregated per question:
 *   [{ question_id, level, skill, n, correct }]
 * Flags questions worth a second look:
 *   - too-easy / too-hard: (almost) everyone or (almost) no one gets it right,
 *     so it tells you little about the student;
 *   - out-of-step: a question tagged with a harder level that students find
 *     easier than the average question one level below — its level tag is
 *     probably wrong.
 * Questions with fewer than MIN_SAMPLE sittings are marked "needs-data".
 */
export function analyzeItems(rows = []) {
  const byLevel = {};
  for (const r of rows) {
    if (r.n < MIN_SAMPLE) continue;
    const acc = (byLevel[r.level] ||= { n: 0, correct: 0 });
    acc.n += r.n;
    acc.correct += r.correct;
  }
  const levelMean = level => (byLevel[level] ? byLevel[level].correct / byLevel[level].n : null);

  return rows
    .map(r => {
      const p = rate(r);
      const flags = [];
      if (r.n < MIN_SAMPLE) {
        flags.push("needs-data");
      } else {
        if (p >= TOO_EASY) flags.push("too-easy");
        if (p <= TOO_HARD) flags.push("too-hard");
        const idx = LEVELS.indexOf(r.level);
        const lower = idx > 0 ? levelMean(LEVELS[idx - 1]) : null;
        if (lower !== null && p >= lower + EASIER_THAN_LOWER_BY) flags.push("out-of-step");
      }
      return { ...r, percentCorrect: Math.round(p * 100), flags };
    })
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || String(a.question_id).localeCompare(String(b.question_id)));
}
