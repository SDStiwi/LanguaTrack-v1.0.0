const SKILL = { G: "Grammar", V: "Vocabulary", R: "Reading", E: "Everyday English" };

/**
 * Expand compact authoring rows into full question objects.
 * `rows` maps a unit id to an array of [skillCode, question, correct, wrong1, wrong2, wrong3].
 * The CORRECT option is always written first; `prepareQuestions` shuffles the options
 * at sitting time and recalculates `answer`, so the stored order never leaks.
 * Level comes from the unit's `scoringLevel`, so a question can never disagree with its unit.
 */
export function buildPool(units, rows, prefix = "") {
  const byId = Object.fromEntries(units.map(u => [u.id, u]));
  const out = [];
  for (const [unitId, list] of Object.entries(rows)) {
    const unit = byId[unitId];
    if (!unit) throw new Error(`buildPool: unknown unit "${unitId}"`);
    list.forEach(([code, question, ...options], i) => {
      if (!SKILL[code]) throw new Error(`buildPool: unknown skill code "${code}" in ${unitId}`);
      out.push({ id: `${prefix}${unitId}-q${i + 1}`, unitId, level: unit.scoringLevel, skill: SKILL[code], question, options, answer: 0 });
    });
  }
  return out;
}
