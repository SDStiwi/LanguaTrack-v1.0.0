import React, { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { backend } from "../lib/supabase";
import { getCurriculum } from "../data/curriculum";
import { LEVELS } from "../lib/scoring";
import { SKILLS } from "../lib/validateBank";
import { checkQuestionForm } from "../lib/customQuestions";

const BOOKS = { "teen-adult": { label: "Teen / Adult book", group: "Adult" }, kids: { label: "Kids book", group: "Child" } };
const blank = { book: "teen-adult", unit_id: "", level: "A1", skill: "Grammar", question: "", options: ["", "", "", ""], answer: 0 };

export default function Questions() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [problems, setProblems] = useState([]);
  const [message, setMessage] = useState("");
  const units = getCurriculum(BOOKS[form.book].group);
  const unitLabel = u => `${u.number ?? ""} ${u.title || u.name || u.id}`.trim();

  const load = useCallback(async () => {
    if (!backend) return;
    const { data, error } = await backend.from("custom_questions").select("*").order("created_at", { ascending: false });
    if (error) setMessage("Couldn't load your questions."); else setRows(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!backend) return (
    <div className="page"><span className="eyebrow">QUESTION BANK</span><h1>Your questions</h1>
      <p className="muted">Connect Supabase to write your own questions. Demo mode uses the built-in bank only.</p></div>
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async e => {
    e.preventDefault();
    const unit_id = form.unit_id || units[0]?.id;
    const found = checkQuestionForm(form);
    setProblems(found);
    if (found.length) return;
    const { error } = await backend.from("custom_questions").insert({ ...form, unit_id });
    if (error) return setMessage("Couldn't save the question. Check the connection and try again.");
    setMessage("Question added. It will appear in this teacher's new tests.");
    setForm({ ...blank, book: form.book, unit_id, level: form.level, skill: form.skill });
    load();
  };
  const toggle = async r => { await backend.from("custom_questions").update({ active: !r.active }).eq("id", r.id); load(); };
  const remove = async r => {
    if (!window.confirm("Delete this question? Past results keep their recorded answers.")) return;
    await backend.from("custom_questions").delete().eq("id", r.id); load();
  };

  return (
    <div className="page">
      <span className="eyebrow">QUESTION BANK</span>
      <h1>Your questions</h1>
      <p className="muted">Add multiple-choice questions to a book unit. Active questions are mixed into your new tests alongside the built-in bank.</p>

      <form className="panel" onSubmit={save}>
        <h2>Add a question</h2>
        <label>Book <select value={form.book} onChange={e => setForm(f => ({ ...f, book: e.target.value, unit_id: "" }))}>
          {Object.entries(BOOKS).map(([k, b]) => <option key={k} value={k}>{b.label}</option>)}</select></label>
        <label>Unit <select value={form.unit_id || units[0]?.id} onChange={e => set("unit_id", e.target.value)}>
          {units.map(u => <option key={u.id} value={u.id}>{unitLabel(u)}</option>)}</select></label>
        <label>Level <select value={form.level} onChange={e => set("level", e.target.value)}>{LEVELS.map(l => <option key={l}>{l}</option>)}</select></label>
        <label>Skill <select value={form.skill} onChange={e => set("skill", e.target.value)}>{SKILLS.map(s => <option key={s}>{s}</option>)}</select></label>
        <label>Question <textarea rows={2} value={form.question} onChange={e => set("question", e.target.value)} /></label>
        {form.options.map((o, i) => (
          <label key={i}>Option {i + 1}{form.answer === i ? " (correct)" : ""}
            <input value={o} onChange={e => set("options", form.options.map((x, j) => (j === i ? e.target.value : x)))} />
          </label>
        ))}
        <label>Correct answer <select value={form.answer} onChange={e => set("answer", Number(e.target.value))}>
          {[0, 1, 2, 3].map(i => <option key={i} value={i}>Option {i + 1}</option>)}</select></label>
        {problems.length > 0 && <ul className="form-error" role="alert">{problems.map(p => <li key={p}>{p}</li>)}</ul>}
        <button className="primary" type="submit">Add question</button>
        {message && <p className="saved-note" role="status">{message}</p>}
      </form>

      <div className="panel">
        <h2>{rows.length} custom question{rows.length === 1 ? "" : "s"}</h2>
        {rows.length === 0 && <p className="muted">None yet.</p>}
        <div className="history-list">
          {rows.map(r => (
            <div className="history-item" key={r.id}>
              <div><strong>{r.question}</strong><span>{r.level} · {r.skill} · {BOOKS[r.book]?.label} · answer: {r.options[r.answer]}{r.active ? "" : " · paused"}</span></div>
              <button className="outline" onClick={() => toggle(r)}>{r.active ? "Pause" : "Resume"}</button>
              <button className="danger" onClick={() => remove(r)} aria-label="Delete question"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
