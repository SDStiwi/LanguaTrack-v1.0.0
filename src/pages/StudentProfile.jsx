import React, { useState } from "react";
import { Archive, ChevronLeft, ClipboardList, Printer, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { AGE_GROUPS, modeOf } from "../lib/modes";
import { STUDENT_SELECT, isPersistedStudent } from "../lib/assessments";
import { summarizeTrend } from "../lib/progress";
import { backend } from "../lib/supabase";
import ProgressChart from "../components/ProgressChart";
import BookProgress from "../components/BookProgress";

const TREND_ICON = { up: TrendingUp, down: TrendingDown, same: Minus };

export default function StudentProfile({ student, onBack, onStart, onUpdated, onDeleted }) {
  const [notes, setNotes] = useState(student?.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(student?.name || "");
  const [ageGroup, setAgeGroup] = useState(student?.age_group || "Adult");

  if (!student) {
    return (
      <div className="page">
        <button className="back" onClick={onBack}><ChevronLeft size={17} /> Back to students</button>
        <p className="muted">Student not found.</p>
      </div>
    );
  }

  const assessments = [...(student.assessments || [])].sort(
    (a, b) => new Date(b.completed_at) - new Date(a.completed_at)
  );
  const trend = summarizeTrend(assessments);
  const TrendIcon = TREND_ICON[trend.direction];
  const mode = modeOf(student.age_group);

  const saveNotes = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    if (!backend || !isPersistedStudent(student)) {
      onUpdated({ ...student, notes });
      setSaving(false);
      setSaved(true);
      return;
    }
    const { data, error: err } = await backend
      .from("students").update({ notes }).eq("id", student.id).select(STUDENT_SELECT).single();
    if (err) setError("Couldn't save the notes. Check the connection and try again — your text is still here.");
    else { onUpdated(data); setSaved(true); }
    setSaving(false);
  };

  const patch = async fields => {
    setError("");
    if (!backend || !isPersistedStudent(student)) return onUpdated({ ...student, ...fields });
    const { data, error: err } = await backend.from("students").update(fields).eq("id", student.id).select(STUDENT_SELECT).single();
    if (err) setError("Couldn't save the change. Check the connection and try again.");
    else onUpdated(data);
  };
  const saveDetails = () => name.trim() && patch({ name: name.trim(), age_group: ageGroup });
  const toggleArchive = () => patch({ archived_at: student.archived_at ? null : new Date().toISOString() });

  const remove = async () => {
    const ok = window.confirm(
      `Delete ${student.name} and all of their results? This cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    setError("");
    const failed = await onDeleted(student);
    if (failed) { setError(failed); setDeleting(false); }
  };

  return (
    <div className="page profile-page">
      <button className="back" onClick={onBack}><ChevronLeft size={17} /> Back to students</button>

      <p className="print-only">LinguaTrack progress report · {new Date().toLocaleDateString()}</p>
      <div className="profile-hero">
        <div className={"profile-avatar mode-" + mode.key}>{student.name?.charAt(0).toUpperCase()}</div>
        <div>
          <span className="eyebrow">STUDENT PROFILE</span>
          <h1>{student.name}</h1>
          <p>{mode.emoji} {mode.label} · {assessments.length} assessment{assessments.length === 1 ? "" : "s"}</p>
        </div>
        <button className="outline no-print" onClick={() => window.print()}><Printer size={17} /> Print report</button>
        <button className="primary" onClick={() => onStart(student, assessments.length ? "progress" : "initial")}>
          <ClipboardList size={17} /> {assessments.length ? "New progress test" : "Start assessment"}
        </button>
      </div>

      <div className="profile-grid">
        <div className="panel">
          <span className="eyebrow">ASSESSMENT NOTES</span>
          <h2>Teacher notes</h2>
          <p className="muted">Save observations, areas to practise, or goals for this student. These notes stay with the student profile.</p>
          <textarea
            className="notes-input"
            value={notes}
            onChange={e => { setNotes(e.target.value); setSaved(false); }}
            placeholder="Example: Review past tense and everyday conversation. Student is more confident when questions are short and clear."
            rows={8}
          />
          <div className="notes-actions">
            <button className="primary" onClick={saveNotes} disabled={saving}>{saving ? "Saving..." : "Save notes"}</button>
            {saved && <span className="saved-note">Saved.</span>}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>

        <div className="panel">
          <span className="eyebrow">CURRENT SNAPSHOT</span>
          <h2>Latest result</h2>
          <div className="profile-stat"><span>Estimated level</span><strong>{student.level || "—"}</strong></div>
          <div className="profile-stat"><span>Latest score</span><strong>{student.score != null ? student.score + "%" : "—"}</strong></div>
          <div className="profile-stat"><span>Assessments</span><strong>{assessments.length}</strong></div>
          {TrendIcon && (
            <p className={"trend " + trend.direction}><TrendIcon size={16} /> {trend.message}</p>
          )}
          <p className="muted profile-footnote">The level is an estimate for teaching support, not an official CEFR certificate.</p>
        </div>
      </div>

      <BookProgress student={student} />

      <div className="panel">
        <span className="eyebrow">PROGRESS</span>
        <h2>Level over time</h2>
        <ProgressChart assessments={assessments} />
      </div>

      <div className="panel assessment-history">
        <span className="eyebrow">ASSESSMENT HISTORY</span>
        <h2>Results over time</h2>
        {assessments.length === 0 ? (
          <p className="muted">No assessments yet. Start the first assessment from this profile.</p>
        ) : (
          <div className="history-list">
            {assessments.map((a, i) => (
              <div className="history-item" key={a.id || i}>
                <div>
                  <strong>{a.title || (a.type === "initial" ? "Initial Level Assessment" : "Progress Test")}</strong>
                  <span>
                    {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "Date unavailable"}
                    {a.confidence && ` · ${a.confidence} confidence`}
                  </span>
                </div>
                <span className="level">{a.estimated_level || "—"}</span>
                <strong>{a.score != null ? a.score + "%" : "—"}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel no-print">
        <span className="eyebrow">DETAILS</span>
        <h2>Edit student</h2>
        <label>Name <input value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Age group
          <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>{AGE_GROUPS.map(g => <option key={g}>{g}</option>)}</select>
        </label>
        <div className="notes-actions">
          <button className="primary" onClick={saveDetails} disabled={!name.trim()}>Save details</button>
          <button className="outline" onClick={toggleArchive}><Archive size={16} /> {student.archived_at ? "Restore student" : "Archive student"}</button>
        </div>
        <p className="muted">Archiving hides the student from active lists but keeps every result.</p>
      </div>

      <div className="danger-zone no-print">
        <div>
          <strong>Delete this student</strong>
          <p className="muted">Removes the profile, notes and every saved result. Use this if a family asks for their child's data to be erased.</p>
        </div>
        <button className="danger" onClick={remove} disabled={deleting}><Trash2 size={16} /> {deleting ? "Deleting…" : "Delete student"}</button>
      </div>
    </div>
  );
}
