import React from "react";
import { ClipboardList } from "lucide-react";
import { getPool } from "../data/banks";
import { getCurriculum } from "../data/curriculum";
import { unitCoverage } from "../lib/curriculum";
import { INITIAL_SIZE, PROGRESS_SIZE } from "../lib/testBuilder";
import { AGE_GROUPS, MODES } from "../lib/modes";
import { LEVELS } from "../lib/scoring";
import { validateBank } from "../lib/validateBank";

function levelRange(bank) {
  const present = LEVELS.filter(l => bank.some(q => q.level === l));
  return present.length > 1 ? `${present[0]}–${present[present.length - 1]}` : present[0];
}

export default function Tests() {
  return (
    <div className="page">
      <div className="section-head">
        <div>
          <span className="eyebrow">ASSESSMENTS</span>
          <h1>Test library</h1>
          <p>Tests are sampled from a book-aligned question pool for each age group: the initial assessment samples every unit of the book (15 questions), and progress tests (10 questions) centre on the student's current unit and avoid questions they have already seen.</p>
        </div>
      </div>
      <div className="test-grid three">
        {AGE_GROUPS.map(g => {
          const m = MODES[g];
          const pool = getPool(g);
          const units = getCurriculum(g);
          const cov = unitCoverage(pool, units, { min: 6 });
          const problems = [
            ...validateBank(pool, { name: "pool" }).errors,
            ...cov.unknown.map(u => `${u.question} points at unknown unit ${u.unitId}`),
            ...cov.uncovered.map(id => `unit ${id} has fewer than 6 questions`)
          ];
          return (
            <div className={"test-tile mode-" + m.key} key={g}>
              <span className="pill">{m.emoji} {m.label.toUpperCase()}</span>
              <h2>{m.label}</h2>
              <p>{m.tagline}.</p>
              <ul className="bank-list">
                <li><strong>Question pool</strong><span>{pool.length} questions · {units.length} units · {levelRange(pool)}</span></li>
                <li><strong>Initial assessment</strong><span>{INITIAL_SIZE} questions · {m.time.initial}</span></li>
                <li><strong>Progress test</strong><span>{PROGRESS_SIZE} questions · {m.time.progress}</span></li>
              </ul>
              <p className={"bank-health " + (problems.length ? "bad" : "good")}>
                {problems.length ? `⚠ ${problems.length} question-bank problem${problems.length === 1 ? "" : "s"}: ${problems[0]}` : "✓ Pool passes every integrity and coverage check"}
              </p>
            </div>
          );
        })}
      </div>
      <div className="notice">
        <ClipboardList size={20} />
        <div>
          <strong>Question design</strong>
          <p>Questions are original and use CEFR-style task types and level descriptions from established English-learning resources. After real sittings, the Insights page shows which questions are too easy, too hard or tagged with the wrong level.</p>
        </div>
      </div>
    </div>
  );
}
