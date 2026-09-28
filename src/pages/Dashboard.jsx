import React from "react";
import { BarChart3, BookOpen, ChevronRight, ClipboardList, GraduationCap, Plus, Users } from "lucide-react";
import { AGE_GROUPS, MODES } from "../lib/modes";
import StudentList, { PAGE_SIZE } from "../components/StudentList";

export default function Dashboard({ students, loading, onStart, onStudents, onProfile }) {
  const assessed = students.filter(s => s.tests > 0 && s.score != null);
  const avgOf = list => (list.length ? Math.round(list.reduce((a, s) => a + Number(s.score), 0) / list.length) : null);
  const avg = avgOf(assessed);
  const levelsTracked = new Set(assessed.map(s => s.level).filter(l => l && l !== "—")).size;

  return (
    <div className="page">
      <div className="hero">
        <div>
          <span className="eyebrow">TEACHER DASHBOARD</span>
          <h1>Know where they are.<br /><em>See where they're going.</em></h1>
          <p>Assess practical English ability, keep results in one place, and follow progress over time.</p>
        </div>
        <button className="primary large" onClick={() => onStudents("all")}><Plus size={19} /> Start an assessment</button>
      </div>
      <div className="stats">
        <Stat icon={<Users />} label="Students" value={students.length} />
        <Stat icon={<ClipboardList />} label="Assessments" value={students.reduce((a, s) => a + Number(s.tests || 0), 0)} />
        <Stat icon={<BarChart3 />} label="Average score" value={avg === null ? "—" : avg + "%"} />
        <Stat icon={<GraduationCap />} label="Levels tracked" value={levelsTracked} />
      </div>

      <div className="mini-head"><span className="eyebrow">BY AGE GROUP</span></div>
      <div className="mode-cards">
        {AGE_GROUPS.map(g => {
          const m = MODES[g];
          const list = students.filter(s => s.age_group === g);
          const groupAvg = avgOf(list.filter(s => s.tests > 0 && s.score != null));
          return (
            <button key={g} className={"mode-card mode-" + m.key} onClick={() => onStudents(g)}>
              <span className="mode-emoji">{m.emoji}</span>
              <div>
                <strong>{m.label}</strong>
                <small>{list.length} student{list.length === 1 ? "" : "s"} · avg {groupAvg === null ? "—" : groupAvg + "%"}</small>
              </div>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>

      <section className="section-head">
        <div><span className="eyebrow">RECENT STUDENTS</span><h2>Keep an eye on progress</h2></div>
        <button className="text-button" onClick={() => onStudents("all")}>View all</button>
      </section>
      <StudentList students={students.slice(0, PAGE_SIZE)} loading={loading} onStart={onStart} onProfile={onProfile} className="student-grid" />
      <div className="notice">
        <BookOpen size={20} />
        <div>
          <strong>Assessment note</strong>
          <p>Results are estimates designed to support teaching decisions. They are not official CEFR certification.</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <span className="stat-icon">{icon}</span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </div>
  );
}
