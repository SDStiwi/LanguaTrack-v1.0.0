import React from "react";
import { ChevronLeft } from "lucide-react";
import { starsFor } from "../lib/modes";
import { hasInteractiveBook, kidsBookLink } from "../lib/books";

const CONFIDENCE = {
  high: "High confidence — the estimate holds even if any single answer changes.",
  medium: "Medium confidence — one or two answers could shift the estimate.",
  low: "Low confidence — a single answer could change the estimate. Treat it as a starting point."
};

const SAVE_MESSAGES = {
  saving: "Saving result…",
  saved: "Result saved.",
  demo: "Demo mode: this result is not stored permanently.",
  queued: "Couldn't reach Supabase. The result is saved on this device and will sync automatically.",
  failed: "Couldn't save this result anywhere. Please note it down before leaving this page.",
  signedout: "You are signed out. Sign in again to save this result."
};

export default function Results({ result, student, mode, book, onBack, onRetake }) {
  const stars = starsFor(result.percentage);
  const placement = result.placement;
  const unit = placement?.unit;
  return (
    <div className={"page results mode-" + mode.key}>
      <button className="back" onClick={onBack}><ChevronLeft size={17} /> Back to students</button>

      <div className="result-hero">
        <span className="eyebrow">ASSESSMENT COMPLETE</span>
        <h1>{mode.resultTitle(student?.name)}</h1>
        {mode.key === "kids" && (
          <div className="stars" role="img" aria-label={`${stars} out of 3 stars`}>{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
        )}
        <div className="level-result">
          <span>Estimated level</span>
          <strong>{result.level}</strong>
          <small>{result.percentage}% overall</small>
        </div>
        {result.ceiling && (
          <p className="muted">Every level in this test was passed, and it only measures up to {result.topLevel}, so the true level may be higher.</p>
        )}
        <p className={"confidence " + result.confidence} title={CONFIDENCE[result.confidence]}>
          <strong>{result.confidence[0].toUpperCase() + result.confidence.slice(1)} confidence</strong>
          <span>{CONFIDENCE[result.confidence].split("— ")[1]}</span>
        </p>
        {result.inconsistent && (
          <p className="warn">The answers don't follow a clear pattern: a lower level was answered poorly while a higher one went well. Consider a short retest or a quick conversation to confirm the level.</p>
        )}
        {result.answered < result.total && (
          <p className="muted">{result.total - result.answered} question{result.total - result.answered === 1 ? " was" : "s were"} left unanswered and counted as incorrect.</p>
        )}
        <p className={"save-status " + result.saveStatus}>{SAVE_MESSAGES[result.saveStatus]}</p>
      </div>

      <div className="result-grid">
        <div className="panel">
          <span className="eyebrow">SKILL PROFILE</span>
          <h2>Where they are strongest</h2>
          {Object.entries(result.skills).map(([skill, value]) => {
            const d = result.skillDetail[skill];
            return (
              <div className="skill" key={skill}>
                <div>
                  <span>{skill} <small className="count">{d.correct}/{d.total}</small></span>
                  <strong>{value}%</strong>
                </div>
                <div className="bar"><span style={{ width: value + "%" }} /></div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <span className="eyebrow">TEACHING FOCUS</span>
          <h2>Useful next step</h2>
          {result.strongest && result.weakest ? (
            <>
              <p>Strongest area: <b>{result.strongest}</b></p>
              <p>Focus area: <b>{result.weakest}</b></p>
            </>
          ) : (
            <p>Skills are evenly balanced, with no single area standing out.</p>
          )}
          <div className="score-big">{result.correct}<small> / {result.total} correct</small></div>
          <p className="muted">Use this result as a teaching guide rather than an official certification.</p>
        </div>
      </div>

      {placement && (
        <div className="panel placement-panel">
          <span className="eyebrow">BOOK PLACEMENT · {book?.toUpperCase()}</span>
          <h2>
            {placement.kind === "gap"
              ? <>Start teaching at Unit {unit.number}: {unit.title}</>
              : <>Every unit in this test went well. Review Unit {unit.number}: {unit.title}</>}
          </h2>
          <p className="muted">
            {placement.kind === "gap"
              ? "This is the first unit where answers started to slip. Earlier units looked secure."
              : "No unit showed a gap. Consider extension work or the next book."}
          </p>
          <p><b>Language focus:</b> {unit.grammar.join("; ")}</p>
          {unit.canDo && <p><b>I can:</b> {unit.canDo}</p>}
          <p className="muted"><b>Core words:</b> {unit.vocab.slice(0, 8).join(", ")}…</p>
          {hasInteractiveBook(student?.age_group) && (
            <a className="outline link-btn" href={kidsBookLink(import.meta.env.BASE_URL, unit.number)} target="_blank" rel="noreferrer">Open Unit {unit.number} in the book</a>
          )}
          <div className="unit-strip" aria-label="Answers by unit">
            {result.unitResults.map(({ unit: u, right, total }) => (
              <span key={u.id} className={"unit-chip " + (right === total ? "ok" : right === 0 ? "bad" : "mixed")} title={`${u.title}: ${right}/${total}`}>
                {u.number}
              </span>
            ))}
          </div>
          <p className="muted profile-footnote">Green: all correct · amber: some · red: none. Hover a number for the unit name. Placement pools neighbouring units, so one slip does not move the start point.</p>
        </div>
      )}

      <div className="panel level-panel">
        <span className="eyebrow">BY LEVEL</span>
        <h2>How each level went</h2>
        {result.levels.map(l => (
          <div className="skill" key={l.level}>
            <div>
              <span>{l.level} <small className="count">{l.correct}/{l.total}</small>{l.thin && <small className="count" title="Only one question at this level, so it cannot be judged on its own"> · 1 question</small>}</span>
              <strong>{l.percentage}%</strong>
            </div>
            <div className="bar"><span style={{ width: l.percentage + "%" }} /></div>
          </div>
        ))}
      </div>

      <div className="result-actions">
        <button className="outline" onClick={onRetake}>Retake</button>
        <button className="primary" onClick={onBack}>Done</button>
      </div>
    </div>
  );
}
