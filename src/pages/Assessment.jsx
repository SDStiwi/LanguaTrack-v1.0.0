import React, { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

export default function Assessment({ session, onFinish, onCancel }) {
  const { student, type, mode, questions: bank } = session;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const q = bank[index];
  if (!q) return <div className="page"><p className="muted">This test has no questions.</p><button className="outline" onClick={onCancel}>Back</button></div>;
  const selected = answers[q.id];
  const skillText = mode.skillLabels[q.skill] || q.skill;
  const cheer = selected !== undefined && mode.cheers.length ? mode.cheers[index % mode.cheers.length] : null;

  const choose = i => setAnswers(a => ({ ...a, [q.id]: i }));

  // Keyboard: 1-4 or A-D picks an option (handy on a laptop and for assistive tech users).
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const i = "1234".includes(k) && k ? Number(k) - 1 : "abcd".indexOf(k);
      if (k.length === 1 && i >= 0 && i < q.options.length) setAnswers(a => ({ ...a, [q.id]: i }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q.id, q.options.length]);
  const exit = () => {
    if (Object.keys(answers).length === 0 || window.confirm("Leave this assessment? The answers so far will be lost.")) onCancel();
  };
  const finish = () => {
    if (submitting) return;
    setSubmitting(true);
    onFinish(answers);
  };

  return (
    <div className={"test-page mode-" + mode.key}>
      <div className="test-top">
        <button className="back" onClick={exit}><ChevronLeft size={17} /> Exit</button>
        <div>
          <strong>{type === "initial" ? "Initial Level Assessment" : "Progress Test"}</strong>
          <span>{student?.name} · {mode.label}</span>
        </div>
        <span>{index + 1} / {bank.length}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={bank.length} aria-valuenow={index + 1} aria-label="Question progress"><span style={{ width: `${((index + 1) / bank.length) * 100}%` }} /></div>
      <div className="question-wrap" key={q.id}>
        <span className="question-meta">{mode.showLevelInTest ? `${q.level} · ${skillText}` : skillText}</span>
        <h1>{q.question}</h1>
        <div className="options" role="group" aria-label="Answer options">
          {q.options.map((o, i) => (
            <button key={i} className={selected === i ? "selected" : ""} aria-pressed={selected === i} onClick={() => choose(i)}>
              <span>{String.fromCharCode(65 + i)}</span>{o}
            </button>
          ))}
        </div>
        {mode.cheers.length > 0 && <p className="cheer" aria-live="polite">{cheer || "\u00a0"}</p>}
        <div className="question-nav">
          {index > 0
            ? <button className="outline" onClick={() => setIndex(i => i - 1)}><ChevronLeft /> Back</button>
            : <span />}
          {index < bank.length - 1
            ? <button className="primary" disabled={selected === undefined} onClick={() => setIndex(i => i + 1)}>Next <ChevronRight /></button>
            : <button className="primary" disabled={selected === undefined || submitting} onClick={finish}>Finish assessment <CheckCircle2 size={18} /></button>}
        </div>
      </div>
    </div>
  );
}
