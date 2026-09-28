import React, { useEffect, useMemo, useState } from "react";
import { analyzeItems, MIN_SAMPLE } from "../lib/itemAnalysis";
import { buildQuestionIndex, questionLabel, withCustomQuestions } from "../lib/questionIndex";
import { backend } from "../lib/supabase";

const FLAG_TEXT = {
  "too-easy": "Almost everyone gets this right — it tells you little.",
  "too-hard": "Almost no one gets this right — check the wording or the answer key.",
  "out-of-step": "Easier than the average question one level below — its level tag may be wrong.",
  "needs-data": `Fewer than ${MIN_SAMPLE} sittings so far.`
};

/** Presentational part (also used for testing without a database). */
export function InsightsView({ rows, index, loading, error }) {
  const items = useMemo(() => analyzeItems(rows), [rows]);
  const flagged = items.filter(i => i.flags.some(f => f !== "needs-data"));

  return (
    <div className="page">
      <div className="section-head">
        <div>
          <span className="eyebrow">QUESTION INSIGHTS</span>
          <h1>How the questions perform</h1>
          <p>Success rate per question across all your students' sittings. Use it to retire weak questions and fix wrongly levelled ones — this is how the estimate becomes more accurate over time. Repeated sittings by the same student are included.</p>
        </div>
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="notice"><div><strong>No data yet</strong><p>Complete some assessments (with Supabase connected) and the per-question statistics will appear here.</p></div></div>
      )}
      {items.length > 0 && (
        <>
          <p className="list-meta">{items.length} questions · {flagged.length} need attention</p>
          <div className="insight-table" role="table" aria-label="Question statistics">
            <div className="insight-row head" role="row">
              <span>Level</span><span>Question</span><span>Sittings</span><span>Correct</span><span>Notes</span>
            </div>
            {items.map(i => (
              <div className={"insight-row" + (i.flags.some(f => f !== "needs-data") ? " flagged" : "")} role="row" key={i.question_id}>
                <span className="level">{i.level}</span>
                <span>{questionLabel(index, i.question_id)}<small className="count"> · {i.skill}</small></span>
                <span>{i.n}</span>
                <span><strong>{i.percentCorrect}%</strong></span>
                <span className="flags">{i.flags.map(f => FLAG_TEXT[f]).join(" ") || "—"}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Insights() {
  const [state, setState] = useState({ rows: [], loading: Boolean(backend), error: "" });
  const [custom, setCustom] = useState([]);
  const baseIndex = useMemo(buildQuestionIndex, []);
  const index = useMemo(() => withCustomQuestions(baseIndex, custom), [baseIndex, custom]);

  useEffect(() => {
    if (!backend) return;
    let active = true;
    backend.from("custom_questions").select("id, question, unit_id").then(({ data }) => { if (active && data) setCustom(data); });
    backend.from("question_stats").select("question_id, level, skill, n, correct").then(({ data, error }) => {
      if (!active) return;
      setState(error
        ? { rows: [], loading: false, error: "Couldn't load statistics. Have you run the latest supabase/migrations SQL?" }
        : { rows: data ?? [], loading: false, error: "" });
    });
    return () => { active = false; };
  }, []);

  if (!backend) {
    return <InsightsView rows={[]} index={index} loading={false} error="" />;
  }
  return <InsightsView {...state} index={index} />;
}
