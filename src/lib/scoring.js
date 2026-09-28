export const LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1"];

// A level counts as "passed" when the student answers at least this share of
// that level's own questions correctly...
export const LEVEL_PASS_RATE = 0.65;
// ...and at least this share of ALL questions up to and including that level.
// This forgives one careless slip at a lower level, but stops a scattered
// answer pattern from reaching a high level.
export const CUMULATIVE_PASS_RATE = 0.7;
// A level with at least MIN_ITEMS_FOR_HOLE questions that scored below this
// share is a "hole": no higher level can be reported above it, because a
// student who cannot do A2 tasks is not a B2 student who had a bad day.
export const HOLE_RATE = 0.5;
export const MIN_ITEMS_FOR_HOLE = 2;
// Skills/levels with fewer questions than this are too noisy to call
// "strongest" or "weakest" / to trust on their own.
export const MIN_ITEMS_FOR_SIGNAL = 2;

const ratio = ({ correct, total }) => (total ? correct / total : 0);
const pct = s => Math.round(ratio(s) * 100);

function tally(map, key, isCorrect) {
  const entry = (map[key] ||= { correct: 0, total: 0 });
  entry.total += 1;
  if (isCorrect) entry.correct += 1;
}

/**
 * Pure level-estimation rule. `levels` is `[{ level, correct, total }]`, ordered
 * from easiest to hardest. Returns the highest level that
 *   1. was passed on its own (LEVEL_PASS_RATE),
 *   2. was passed cumulatively (CUMULATIVE_PASS_RATE), and
 *   3. sits below no "hole" (a level scored under HOLE_RATE).
 * Never lower than A1, unless the test itself contains Pre-A1 questions: then Pre-A1
 * is the floor, so a beginner who cannot yet do A1 tasks is reported as Pre-A1.
 */
export function estimateLevel(levels) {
  let estimate = levels.some(l => l.level === "Pre-A1") ? "Pre-A1" : "A1";
  let runCorrect = 0;
  let runTotal = 0;
  let blocked = false;
  for (const l of levels) {
    runCorrect += l.correct;
    runTotal += l.total;
    if (blocked) continue;
    const passedOwn = ratio(l) >= LEVEL_PASS_RATE;
    const passedCumulative = runTotal > 0 && runCorrect / runTotal >= CUMULATIVE_PASS_RATE;
    if (passedOwn && passedCumulative) estimate = l.level;
    if (l.total >= MIN_ITEMS_FOR_HOLE && ratio(l) < HOLE_RATE) blocked = true;
  }
  return estimate;
}

/** True when a lower level scored under HOLE_RATE but a higher one was passed on its own. */
function hasInconsistentPattern(levels) {
  let hole = false;
  for (const l of levels) {
    if (hole && l.total >= MIN_ITEMS_FOR_SIGNAL && ratio(l) >= LEVEL_PASS_RATE) return true;
    if (l.total >= MIN_ITEMS_FOR_HOLE && ratio(l) < HOLE_RATE) hole = true;
  }
  return false;
}

/**
 * Sensitivity analysis: how many single answers, if flipped, would change the
 * estimated level? A result that survives every one-answer change is robust;
 * one that hinges on a single lucky guess is not. This turns "treat short tests
 * as a guide" from a disclaimer into a number.
 */
function fragility(levels, baseline) {
  let flips = 0;
  let items = 0;
  levels.forEach((l, idx) => {
    for (let k = 0; k < l.total; k++) {
      items += 1;
      const wasCorrect = k < l.correct; // which item doesn't matter, only the counts
      const changed = levels.map((x, j) =>
        j === idx ? { ...x, correct: x.correct + (wasCorrect ? -1 : 1) } : x
      );
      if (estimateLevel(changed) !== baseline) flips += 1;
    }
  });
  return items ? flips / items : 1;
}

export function confidenceOf({ levels, level, total, inconsistent }) {
  if (inconsistent || total < 8) return "low";
  const f = fragility(levels, level);
  if (f <= 0.1) return "high";
  if (f <= 0.35) return "medium";
  return "low";
}

/**
 * Score an assessment.
 * `questions` must be the exact list the student saw (options may be shuffled),
 * and `answers` maps question id -> index of the option the student chose.
 * Unanswered questions count as incorrect.
 */
export function calculateResult(questions, answers) {
  const total = questions.length;
  const skillStats = {};
  const levelStats = {};
  let correct = 0;
  let answered = 0;

  for (const q of questions) {
    if (answers[q.id] !== undefined) answered += 1;
    const ok = answers[q.id] === q.answer;
    if (ok) correct += 1;
    tally(skillStats, q.skill, ok);
    tally(levelStats, q.level, ok);
  }

  const percentage = total ? Math.round((correct / total) * 100) : 0;

  const skills = Object.fromEntries(Object.entries(skillStats).map(([name, s]) => [name, pct(s)]));
  const levels = LEVELS.filter(l => levelStats[l]).map(l => ({
    level: l,
    ...levelStats[l],
    percentage: pct(levelStats[l]),
    thin: levelStats[l].total < MIN_ITEMS_FOR_SIGNAL
  }));

  const level = estimateLevel(levels);
  const topLevel = levels.length ? levels[levels.length - 1].level : "A1";
  const ceiling = levels.length > 0 && level === topLevel;
  const inconsistent = hasInconsistentPattern(levels);
  const confidence = confidenceOf({ levels, level, total, inconsistent });

  // Strongest / weakest skills. Skills with a single question are ignored (one
  // answer is not a pattern), and if every remaining skill scored the same
  // there is no meaningful difference, so report neither (null).
  const rated = Object.keys(skills).filter(k => skillStats[k].total >= MIN_ITEMS_FOR_SIGNAL);
  const values = rated.map(k => skills[k]);
  const max = values.length ? Math.max(...values) : 0;
  const min = values.length ? Math.min(...values) : 0;
  const namesAt = v => rated.filter(k => skills[k] === v).join(" & ");
  const balanced = rated.length < 2 || max === min;

  return {
    correct,
    total,
    answered,
    percentage,
    level,
    levels,
    topLevel,
    ceiling,
    inconsistent,
    confidence,
    thinLevels: levels.filter(l => l.thin).map(l => l.level),
    skills,
    skillDetail: skillStats,
    strongest: balanced ? null : namesAt(max),
    weakest: balanced ? null : namesAt(min)
  };
}
