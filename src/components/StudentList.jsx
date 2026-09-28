import React from "react";
import { modeOf } from "../lib/modes";

export const PAGE_SIZE = 6;

export default function StudentList({ students, loading, onStart, onProfile, className, emptyText = "No students yet. Use “Add student” to create the first one." }) {
  if (loading) return <p className="muted">Loading students…</p>;
  if (!students.length) return <p className="muted">{emptyText}</p>;
  return <div className={className}>{students.map(s => <StudentCard key={s.id} student={s} onStart={onStart} onProfile={onProfile} />)}</div>;
}

function StudentCard({ student, onStart, onProfile }) {
  const tests = student.tests || 0;
  const mode = modeOf(student.age_group);
  return (
    <article className={"student-card mode-" + mode.key}>
      <div className="avatar">{student.name?.charAt(0).toUpperCase()}</div>
      <div className="student-info">
        <button className="student-name" onClick={() => onProfile(student)}>{student.name}</button>
        <span>{mode.emoji} {mode.label} · {tests} assessment{tests === 1 ? "" : "s"}</span>
      </div>
      <span className="level">{tests > 0 ? student.level : "—"}</span>
      <div className="card-score">
        <strong>{tests > 0 && student.score != null ? student.score + "%" : "—"}</strong>
        <span>latest</span>
      </div>
      <div className="card-actions">
        <button className="outline profile-button" onClick={() => onProfile(student)}>View profile</button>
        {tests === 0 ? (
          <button className="primary" onClick={() => onStart(student, "initial")}>Initial assessment</button>
        ) : (
          <>
            <button className="outline" onClick={() => onStart(student, "progress")}>Progress test</button>
            <button className="text-button" onClick={() => onStart(student, "initial")}>Redo initial</button>
          </>
        )}
      </div>
    </article>
  );
}
