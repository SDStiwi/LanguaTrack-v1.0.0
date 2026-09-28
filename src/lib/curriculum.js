/**
 * Curriculum helpers (pure, tested). A curriculum is an ordered array of units:
 * { id, number, title, grammar[], vocab[], scoringLevel, ... }. Questions carry a
 * `unitId` pointing at a unit, which lets results say "start at Unit 6" and lets
 * practice be recommended from the book.
 */

/** Structural checks for one curriculum. Errors would break lookups; warnings are hints. */
export function validateCurriculum(units, { name = "curriculum", seenIds = new Set(), levels } = {}) {
  const errors = [];
  const warnings = [];
  if (!Array.isArray(units) || units.length === 0) return { errors: [`${name}: curriculum is empty`], warnings };
  for (const u of units) {
    const at = `${name}/${u?.id ?? "?"}`;
    if (!u || typeof u.id !== "string" || !u.id) { errors.push(`${at}: missing id`); continue; }
    if (seenIds.has(u.id)) errors.push(`${at}: duplicate id`);
    seenIds.add(u.id);
    if (!u.title || !String(u.title).trim()) errors.push(`${at}: missing title`);
    if (!Array.isArray(u.grammar) || u.grammar.length === 0) errors.push(`${at}: needs at least one grammar focus`);
    if (!Array.isArray(u.vocab) || u.vocab.length === 0) errors.push(`${at}: needs vocabulary`);
    else if (new Set(u.vocab.map(w => w.toLowerCase())).size !== u.vocab.length) warnings.push(`${at}: repeated vocabulary word`);
    if (levels && !levels.includes(u.scoringLevel)) errors.push(`${at}: unknown scoringLevel "${u.scoringLevel}"`);
  }
  if (levels) {
    const order = units.map(u => levels.indexOf(u.scoringLevel));
    if (order.some((v, i) => i && v < order[i - 1])) errors.push(`${name}: scoringLevel must not go down as units go up`);
  }
  return { errors, warnings };
}

export const findUnit = (units, unitId) => units.find(u => u.id === unitId) || null;

/**
 * How well a question bank covers a curriculum.
 * - untagged: questions with no unitId
 * - unknown: questions whose unitId matches no unit (a bug)
 * - perUnit: question count per unit id
 * - uncovered: units with fewer than `min` questions
 */
export function unitCoverage(bank, units, { min = 1 } = {}) {
  const ids = new Set(units.map(u => u.id));
  const perUnit = Object.fromEntries(units.map(u => [u.id, 0]));
  const untagged = [];
  const unknown = [];
  for (const q of bank) {
    if (!q.unitId) untagged.push(q.id);
    else if (!ids.has(q.unitId)) unknown.push({ question: q.id, unitId: q.unitId });
    else perUnit[q.unitId]++;
  }
  const uncovered = units.filter(u => perUnit[u.id] < min).map(u => u.id);
  return { perUnit, untagged, unknown, uncovered };
}

/** [{ unitId, isCorrect }] for the questions a student saw. `answers` maps question id -> chosen slot. */
export const unitAnswers = (questions, answers) =>
  questions.filter(q => q.unitId).map(q => ({ unitId: q.unitId, isCorrect: answers[q.id] === q.answer }));

/** Per-unit tally for the results screen: [{ unit, right, total }] in book order, only units that were asked. */
export function unitBreakdown(answerList, units) {
  const tally = {};
  for (const a of answerList) {
    const t = (tally[a.unitId] ||= { right: 0, total: 0 });
    t.total++;
    if (a.isCorrect) t.right++;
  }
  return units.filter(u => tally[u.id]).map(u => ({ unit: u, ...tally[u.id] }));
}

/**
 * Where should teaching start? Slide a window of `window` consecutive units along the
 * book; the first window that scores below `passRatio` is a gap, and the start is the
 * first unit in that window that had a wrong answer. Pooling
 * neighbours means one careless slip is forgiven but two misses in a row are not,
 * which suits a test with only one or two questions per unit.
 * Returns { unit, kind: "gap" } or, when every window passes, { unit: <last unit>, kind: "complete" };
 * null when there are too few tagged answers to say.
 */
export function recommendStartUnit(answers, units, { window = 3, passRatio = 0.6, minAnswered = 2 } = {}) {
  const tally = {};
  for (const a of answers) {
    if (!a.unitId) continue;
    const t = (tally[a.unitId] ||= { right: 0, total: 0 });
    t.total++;
    if (a.isCorrect) t.right++;
  }
  let sawEvidence = false;
  for (let i = 0; i < units.length; i++) {
    let right = 0, total = 0;
    for (const u of units.slice(i, i + window)) {
      const t = tally[u.id];
      if (t) { right += t.right; total += t.total; }
    }
    if (total < minAnswered) continue;
    sawEvidence = true;
    if (right / total < passRatio) {
      // Start where the errors begin: the first unit inside the failing window that has a miss.
      const first = units.slice(i, i + window).find(u => tally[u.id] && tally[u.id].right < tally[u.id].total);
      return { unit: first || units[i], kind: "gap" };
    }
  }
  return sawEvidence ? { unit: units[units.length - 1], kind: "complete" } : null;
}
