import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, BookOpen, ClipboardList, LayoutDashboard, ListPlus, LogOut, RefreshCw, UserCog, Users } from "lucide-react";
import { getPool } from "./data/banks";
import { getBookName, getCurriculum } from "./data/curriculum";
import { demoStudents } from "./data/demo";
import { modeOf } from "./lib/modes";
import { calculateResult } from "./lib/scoring";
import { recommendStartUnit, unitAnswers, unitBreakdown } from "./lib/curriculum";
import { buildTest } from "./lib/testBuilder";
import { fetchTestContext } from "./lib/testContext";
import {
  STUDENT_SELECT, buildEntry, isPersistedStudent, prepareQuestions, saveAssessment, summarizeStudent
} from "./lib/assessments";
import { failedStore, pendingStore } from "./lib/storage";
import { classifyError, flushQueue } from "./lib/sync";
import { backend } from "./lib/supabase";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import AddStudent from "./pages/AddStudent";
const Tests = lazy(() => import("./pages/Tests"));
const Insights = lazy(() => import("./pages/Insights"));
const Books = lazy(() => import("./pages/Books"));
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Login from "./pages/Login";
const Account = lazy(() => import("./pages/Account"));
import Logo from "./components/Logo";
const Questions = lazy(() => import("./pages/Questions"));
import { bookOf, mergePool } from "./lib/customQuestions";

/** Sign-in gate. Without Supabase configured the app runs as a local demo. */
export default function App() {
  const auth = useAuth();
  if (backend && auth.loading) return <div className="login-wrap"><p className="muted">Loading…</p></div>;
  if (!auth.user) return <Login onSignIn={auth.signIn} onReset={auth.resetPassword} demo={auth.demo} />;
  return <Workspace user={auth.user} onSignOut={auth.signOut} demo={auth.demo} recovery={auth.recovery} onChangePassword={auth.updatePassword} onReauth={auth.reauthenticate} />;
}

// Top-level pages live in the URL hash (#/insights) so the browser back button and deep links work.
const TOP_PAGES = ["dashboard", "students", "tests", "books", "questions", "insights", "account"];
const pageFromHash = () => {
  const p = window.location.hash.replace(/^#\//, "");
  return TOP_PAGES.includes(p) ? p : null;
};

function downloadJson(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

function Workspace({ user, onSignOut, demo, recovery, onChangePassword, onReauth }) {
  const ownerId = user?.id ?? null;
  const [page, setPage] = useState(recovery ? "account" : pageFromHash() || "dashboard");
  const [session, setSession] = useState(null); // { student, type, mode, questions, startedAt }
  const [result, setResult] = useState(null);
  const [students, setStudents] = useState(backend ? [] : demoStudents);
  const [loading, setLoading] = useState(Boolean(backend));
  const [online, setOnline] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => pendingStore.list().length);
  const [failedCount, setFailedCount] = useState(() => failedStore.list().length);
  const [syncing, setSyncing] = useState(false);
  const [studentFilter, setStudentFilter] = useState("all"); // "all" or an age group
  const [profileStudentId, setProfileStudentId] = useState(null);
  const flushing = useRef(false);

  const refreshCounts = () => {
    const mine = e => !e.ownerId || !ownerId || e.ownerId === ownerId;
    setPendingCount(pendingStore.list().filter(mine).length);
    setFailedCount(failedStore.list().filter(mine).length);
  };

  useEffect(() => {
    if (TOP_PAGES.includes(page) && window.location.hash !== `#/${page}`) window.history.pushState(null, "", `#/${page}`);
  }, [page]);
  useEffect(() => {
    const onNav = () => { const p = pageFromHash(); if (p) setPage(p); };
    window.addEventListener("popstate", onNav);
    return () => window.removeEventListener("popstate", onNav);
  }, []);

  // every page change starts at the top
  useEffect(() => { window.scrollTo?.(0, 0); }, [page]);

  const loadStudents = useCallback(async () => {
    if (!backend) return;
    try {
      const { data, error } = await backend
        .from("students")
        .select(STUDENT_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStudents(data.map(summarizeStudent));
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-send results that could not be saved earlier (see lib/sync.js for the rules).
  const flushPending = useCallback(async () => {
    if (!backend || flushing.current) return;
    flushing.current = true;
    setSyncing(true);
    try {
      const summary = await flushQueue({
        save: entry => saveAssessment(backend, entry), queue: pendingStore, failed: failedStore, ownerId
      });
      if (summary.stopped === "network") setOnline(false);
    } finally {
      flushing.current = false;
      setSyncing(false);
      refreshCounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const syncAndReload = useCallback(async () => {
    await flushPending();
    await loadStudents();
  }, [flushPending, loadStudents]);

  useEffect(() => {
    syncAndReload();
    window.addEventListener("online", syncAndReload);
    return () => window.removeEventListener("online", syncAndReload);
  }, [syncAndReload]);

  const startAssessment = async (student, type) => {
    const units = getCurriculum(student.age_group);
    // Progress tests avoid questions already seen and centre on the student's current unit.
    const ctx = type === "progress" ? await fetchTestContext(backend, student, units) : { seen: new Set(), focusUnitId: null };
    let pool = getPool(student.age_group);
    if (backend) {
      const { data } = await backend.from("custom_questions").select("*").eq("book", bookOf(student.age_group)).eq("active", true);
      if (data?.length) pool = mergePool(pool, data, units.map(u => u.id));
    }
    const bank = buildTest({ type, pool, units, seen: ctx.seen, focusUnitId: ctx.focusUnitId });
    setSession({
      student, type, mode: modeOf(student.age_group), units, book: getBookName(student.age_group),
      questions: prepareQuestions(bank), startedAt: new Date().toISOString()
    });
    setResult(null);
    setPage("test");
  };

  const finishAssessment = async answers => {
    const { student, type, mode, questions: bank, startedAt, units } = session;
    const answerList = unitAnswers(bank, answers);
    const placement = recommendStartUnit(answerList, units);
    const r = {
      ...calculateResult(bank, answers), runId: startedAt, saveStatus: "saving",
      placement, unitResults: unitBreakdown(answerList, units)
    };
    const setStatus = saveStatus => setResult(cur => (cur && cur.runId === startedAt ? { ...cur, saveStatus } : cur));
    setResult(r);
    setPage("results");

    // Demo students (or no Supabase): keep the result in memory only.
    if (!backend || !isPersistedStudent(student)) {
      setStudents(prev => prev.map(s => {
        if (s.id !== student.id) return s;
        const assessment = {
          id: `local-${Date.now()}`,
          title: `${type === "initial" ? "Initial Level Assessment" : "Progress Test"} · ${mode.label}`,
          type,
          score: r.percentage,
          estimated_level: r.level,
          confidence: r.confidence,
          start_unit_id: placement?.unit.id ?? null,
          completed_at: new Date().toISOString()
        };
        return {
          ...s, level: r.level, score: r.percentage, tests: (s.tests || 0) + 1,
          assessments: [assessment, ...(s.assessments || [])],
          seenQuestionIds: [...new Set([...(s.seenQuestionIds || []), ...bank.map(q => q.id)])]
        };
      }));
      setStatus("demo");
      return;
    }

    const entry = buildEntry({ student, type, questions: bank, answers, result: r, startedAt, modeLabel: mode.label, ownerId, startUnitId: placement?.unit.id });
    const res = await saveAssessment(backend, entry);
    if (res.ok) {
      setStatus("saved");
      loadStudents();
      return;
    }
    const kind = classifyError(res.error);
    if (kind === "network") setOnline(false);
    if (kind === "permanent") {
      failedStore.add({ ...entry, failedReason: kind, lastError: res.error?.message });
      refreshCounts();
      setStatus("failed");
      return;
    }
    const queued = pendingStore.add(entry);
    refreshCounts();
    setStatus(queued ? "queued" : "failed");
  };

  const deleteStudent = async student => {
    if (backend && isPersistedStudent(student)) {
      const { error } = await backend.from("students").delete().eq("id", student.id);
      if (error) return "Couldn't delete this student. Check the connection and try again.";
    }
    // anything still waiting to sync for this student would otherwise fail forever
    pendingStore.removeWhere(e => e.assessment?.student_id === student.id);
    setStudents(prev => prev.filter(s => s.id !== student.id));
    setProfileStudentId(null);
    refreshCounts();
    setPage("students");
    return null;
  };

  const exportFailed = () => downloadJson("linguatrack-unsynced-results.json", failedStore.list());
  const discardFailed = () => {
    if (window.confirm("Discard these results permanently? Export them first if you might need them.")) {
      failedStore.removeWhere(() => true);
      refreshCounts();
    }
  };

  const navBtn = (target, label, icon, active = [target]) => (
    <button className={active.includes(page) ? "active" : ""} aria-current={active.includes(page) ? "page" : undefined} onClick={() => setPage(target)}>
      {icon} {label}
    </button>
  );
  const openStudents = filter => { setStudentFilter(filter); setPage("students"); };
  const openProfile = student => { setProfileStudentId(student.id); setPage("profile"); };
  const updateStudentInState = updated => {
    setStudents(prev => prev.map(s => s.id === updated.id ? summarizeStudent(updated) : s));
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setPage("dashboard")}>
          <Logo />
        </button>
        <nav aria-label="Main">
          {navBtn("dashboard", "Dashboard", <LayoutDashboard size={17} />)}
          {navBtn("students", "Students", <Users size={17} />, ["students", "add-student", "profile"])}
          {navBtn("tests", "Tests", <ClipboardList size={17} />)}
          {navBtn("books", "Books", <BookOpen size={17} />)}
          {navBtn("questions", "Questions", <ListPlus size={17} />)}
          {navBtn("insights", "Insights", <BarChart3 size={17} />)}
        </nav>
        <span className={"connection " + (online ? "online" : "offline")}>
          {!backend ? "Local demo mode" : online ? "Supabase connected" : "Supabase unreachable"}
        </span>
        <button className="signout" onClick={() => setPage("account")} title="Account settings"><UserCog size={16} /> <span className="lbl">Account</span></button>
        <button
          className="signout"
          onClick={() => { setSession(null); setResult(null); setPage("dashboard"); onSignOut(); }}
          title={user?.email ? `Signed in as ${user.email}` : "Sign out"}
        >
          <LogOut size={16} /> <span className="lbl">{demo ? "Exit demo" : "Sign out"}</span>
        </button>
      </header>

      {backend && pendingCount > 0 && (
        <div className="sync-bar">
          <span>{pendingCount} result{pendingCount === 1 ? "" : "s"} saved on this device, not yet synced.</span>
          <button className="outline" onClick={syncAndReload} disabled={syncing}>
            <RefreshCw size={14} /> {syncing ? "Syncing..." : "Sync now"}
          </button>
        </div>
      )}
      {backend && failedCount > 0 && (
        <div className="sync-bar failed">
          <span>{failedCount} result{failedCount === 1 ? "" : "s"} could not be saved (the server rejected {failedCount === 1 ? "it" : "them"}).</span>
          <button className="outline" onClick={exportFailed}>Export</button>
          <button className="outline" onClick={discardFailed}>Discard</button>
        </div>
      )}

      <main>
        <Suspense fallback={<p className="muted page">Loading…</p>}>
        {page === "dashboard" && (
          <Dashboard students={students.filter(s => !s.archived_at)} loading={loading} onStart={startAssessment} onStudents={openStudents} onProfile={openProfile} />
        )}
        {page === "students" && (
          <Students
            students={students} loading={loading} onStart={startAssessment} onProfile={openProfile}
            filter={studentFilter} onFilter={setStudentFilter} onAdd={() => setPage("add-student")}
          />
        )}
        {page === "profile" && profileStudentId && (
          <StudentProfile
            key={profileStudentId}
            student={students.find(s => s.id === profileStudentId)}
            onBack={() => setPage("students")}
            onStart={startAssessment}
            onUpdated={updateStudentInState}
            onDeleted={deleteStudent}
          />
        )}
        {page === "add-student" && (
          <AddStudent
            defaultAge={studentFilter === "all" ? "Adult" : studentFilter}
            onBack={() => setPage("students")}
            onCreated={s => { setStudents(prev => [s, ...prev]); setPage("students"); }}
          />
        )}
        {page === "account" && <Account user={user} demo={demo} recovery={recovery} onChangePassword={onChangePassword} onReauth={onReauth} onDone={() => setPage("dashboard")} />}
        {page === "tests" && <Tests />}
        {page === "books" && <Books />}
        {page === "questions" && <Questions />}
        {page === "insights" && <Insights />}
        {page === "test" && session && (
          <Assessment key={session.startedAt} session={session} onFinish={finishAssessment} onCancel={() => setPage("students")} />
        )}
        {page === "results" && result && session && (
          <Results
            result={result}
            student={session.student}
            mode={session.mode}
            book={session.book}
            onBack={() => setPage("students")}
            onRetake={() => startAssessment(session.student, session.type)}
          />
        )}
        </Suspense>
      </main>

      {page !== "test" && (
        <div className="bottom-nav">
          {navBtn("dashboard", "Dashboard", <LayoutDashboard size={20} />)}
          {navBtn("students", "Students", <Users size={20} />, ["students", "add-student", "profile"])}
          {navBtn("tests", "Tests", <ClipboardList size={20} />)}
          {navBtn("books", "Books", <BookOpen size={20} />)}
          {navBtn("questions", "Questions", <ListPlus size={20} />)}
          {navBtn("insights", "Insights", <BarChart3 size={20} />)}
        </div>
      )}
    </div>
  );
}
