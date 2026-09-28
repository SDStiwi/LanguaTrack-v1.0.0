import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { getBookName, getCurriculum } from "../data/curriculum";
import { hasInteractiveBook, kidsBookLink } from "../lib/books";
import { isPersistedStudent } from "../lib/assessments";
import { backend } from "../lib/supabase";
import { MAX_STARS, STAR_LABELS, loadUnitProgress, saveUnitStars, summarizeProgress, withUnitStars } from "../lib/unitProgress";

/** Teacher-rated 0-3 stars per book unit, with the unit's language focus and "I can" statement. */
export default function BookProgress({ student }) {
  const units = getCurriculum(student.age_group);
  const persisted = Boolean(backend) && isPersistedStudent(student);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!persisted) return;
    let cancelled = false;
    loadUnitProgress(backend, student.id).then(r => { if (!cancelled) setRows(r); }).catch(() => { if (!cancelled) setError("Couldn't load book progress. Check the connection."); });
    return () => { cancelled = true; };
  }, [persisted, student.id]);

  const summary = summarizeProgress(units, rows);
  const placedAt = [...(student.assessments || [])].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]?.start_unit_id;

  const setStars = async (unit, stars) => {
    const previous = rows;
    setRows(withUnitStars(rows, unit.id, stars));
    setError("");
    if (!persisted) return; // demo mode: kept in memory for this visit only
    try { await saveUnitStars(backend, { studentId: student.id, unitId: unit.id, stars }); }
    catch { setRows(previous); setError("Couldn't save that rating. Nothing was changed."); }
  };

  return (
    <div className="panel book-progress">
      <span className="eyebrow">BOOK PROGRESS</span>
      <h2>{getBookName(student.age_group)}</h2>
      <p className="muted">
        {summary.done} of {summary.total} units confident
        {summary.next ? ` · next: Unit ${summary.next.number}, ${summary.next.title}` : ""}
        {!persisted && " · demo mode: ratings are not stored"}
      </p>
      <ul className="unit-list">
        {units.map(u => (
          <li key={u.id} className={open === u.id ? "open" : ""}>
            <div className="unit-row">
              <button className="unit-title" aria-expanded={open === u.id} onClick={() => setOpen(open === u.id ? null : u.id)}>
                <strong>Unit {u.number}</strong> {u.title}
                {placedAt === u.id && <em className="placed">placed here</em>}
              </button>
              <div className="star-input" role="radiogroup" aria-label={`Progress for unit ${u.number}`}>
                {[1, 2, 3].map(n => (
                  <button key={n} role="radio" aria-checked={summary.stars[u.id] === n} aria-label={`${n} of ${MAX_STARS}: ${STAR_LABELS[n]}`}
                    className={summary.stars[u.id] >= n ? "on" : ""} onClick={() => setStars(u, summary.stars[u.id] === n ? n - 1 : n)}>
                    {summary.stars[u.id] >= n ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>
            {open === u.id && (
              <div className="unit-detail">
                <p><b>{STAR_LABELS[summary.stars[u.id]]}.</b> Language focus: {u.grammar.join("; ")}</p>
                {u.canDo && <p><b>I can:</b> {u.canDo}</p>}
                <p className="muted">Core words: {u.vocab.join(", ")}</p>
                {hasInteractiveBook(student.age_group) && (
                  <a className="outline link-btn" href={kidsBookLink(import.meta.env.BASE_URL, u.number)} target="_blank" rel="noreferrer"><BookOpen size={14} /> Open in the book (page {u.startPage})</a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
