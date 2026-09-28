import React, { useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { studentsCsv } from "../lib/csv";
import { AGE_GROUPS, MODES } from "../lib/modes";
import StudentList, { PAGE_SIZE } from "../components/StudentList";
import Pager from "../components/Pager";

export default function Students({ students: allStudents, loading, onStart, onProfile, onAdd, filter, onFilter }) {
  const [query, setQuery] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  const q = query.trim().toLowerCase();
  const all = allStudents;
  const students = all.filter(s => Boolean(s.archived_at) === showArchived);
  const filtered = students.filter(s =>
    (filter === "all" || s.age_group === filter) && (!q || (s.name || "").toLowerCase().includes(q))
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(pageNo, pages);
  const from = (current - 1) * PAGE_SIZE;
  const shown = filtered.slice(from, from + PAGE_SIZE);
  const count = g => students.filter(s => s.age_group === g).length;

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob(["\ufeff" + studentsCsv(all)], { type: "text/csv;charset=utf-8" }));
    Object.assign(document.createElement("a"), { href: url, download: "linguatrack-students.csv" }).click();
    URL.revokeObjectURL(url);
  };
  const changeFilter = f => { setPageNo(1); onFilter(f); };
  const changeQuery = v => { setPageNo(1); setQuery(v); };

  return (
    <div className="page">
      <div className="section-head">
        <div>
          <span className="eyebrow">STUDENT MANAGEMENT</span>
          <h1>Students</h1>
          <p>Choose a learner to begin an assessment.</p>
        </div>
        <div className="notes-actions">
          <button className="outline" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          <button className="primary" onClick={onAdd}><Plus size={18} /> Add student</button>
        </div>
      </div>

      <div className="toolbar">
        <label className="search">
          <Search size={16} />
          <input value={query} onChange={e => changeQuery(e.target.value)} placeholder="Search by name" aria-label="Search students" />
        </label>
        <div className="chips" role="group" aria-label="Filter by age group">
          <button className={"chip" + (filter === "all" ? " active" : "")} onClick={() => changeFilter("all")}>All <small>{students.length}</small></button>
          {AGE_GROUPS.map(g => (
            <button key={g} className={"chip" + (filter === g ? " active" : "")} onClick={() => changeFilter(g)}>
              {MODES[g].emoji} {MODES[g].label} <small>{count(g)}</small>
            </button>
          ))}
        </div>
        <label className="chip"><input type="checkbox" checked={showArchived} onChange={e => { setPageNo(1); setShowArchived(e.target.checked); }} /> Archived</label>
      </div>

      <StudentList
        students={shown}
        loading={loading}
        onStart={onStart}
        onProfile={onProfile}
        className="student-list"
        emptyText={students.length ? "No students match this search or filter." : undefined}
      />
      {!loading && filtered.length > 0 && (
        <p className="list-meta">Showing {from + 1}–{from + shown.length} of {filtered.length}</p>
      )}
      <Pager page={current} pages={pages} onChange={setPageNo} />
    </div>
  );
}
