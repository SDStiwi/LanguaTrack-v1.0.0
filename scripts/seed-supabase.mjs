/**
 * LinguaTrack Supabase demo seeder.
 *
 * Creates two real Supabase Auth teacher accounts plus realistic students,
 * assessments, per-question answers and coursebook progress. Server-side only:
 * it uses the SERVICE ROLE key, which must never reach the browser or Git.
 *
 * Setup:  copy .env.seed.example to .env.seed and fill it in, then
 *   npm run seed:supabase
 * Safe to re-run: every id is deterministic, so rows are updated, not duplicated.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.seed.example).");
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

/** Deterministic UUID from a string (so re-running the seed is idempotent). */
function uuidFrom(text) {
  const h = createHash("sha1").update(`linguatrack:${text}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const x = h.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

const ACCOUNTS = [
  { email: "teacher.demo@linguatrack.app", password: "LinguaDemo2026!", name: "Demo Teacher" },
  { email: "teacher.second@linguatrack.app", password: "LinguaDemo2026!", name: "Second Teacher" }
];

const QUESTIONS = [
  "ta-0A-q1", "ta-0A-q2", "ta-0A-q3", "ta-0A-q4", "ta-0A-q5", "ta-0A-q6",
  "ta-0B-q1", "ta-0B-q2", "ta-0B-q3", "ta-0B-q4", "ta-0B-q5", "ta-0B-q6",
  "ta-1-q1", "ta-1-q2", "ta-1-q3", "ta-1-q4", "ta-1-q5", "ta-1-q6"
];
const META = QUESTIONS.map((id, i) => ({
  id,
  level: i < 12 ? "A1" : "A1+",
  skill: ["Grammar", "Grammar", "Vocabulary", "Vocabulary", "Reading", "Everyday English"][i % 6],
  unit_id: i < 6 ? "ta-0A" : i < 12 ? "ta-0B" : "ta-1"
}));

const check = (label, { error }) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

async function ensureAuthUser(account) {
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: account.email, password: account.password, email_confirm: true,
    user_metadata: { name: account.name, role: "teacher" }
  });
  if (!error) return created.user.id;

  // Already exists: find it, and reset password/metadata so the README credentials always work.
  for (let page = 1; page < 20; page++) {
    const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (listError) throw listError;
    const found = data.users.find(u => u.email?.toLowerCase() === account.email);
    if (found) {
      const { error: upErr } = await supabase.auth.admin.updateUserById(found.id, {
        password: account.password, email_confirm: true, user_metadata: { name: account.name, role: "teacher" }
      });
      if (upErr) throw upErr;
      return found.id;
    }
    if (data.users.length < 200) break;
  }
  throw error;
}

const daysAgo = (now, d) => new Date(now - 1000 * 60 * 60 * 24 * d).toISOString();

async function seedTeacher(uid, prefix, includeExtra = true) {
  const students = [
    { key: `${prefix}-adult-sarah`, name: "Sarah Benali", age_group: "Adult", notes: "Practise past tense and everyday conversation.", level: "A1+", score: 78 },
    { key: `${prefix}-adult-karim`, name: "Karim Haddad", age_group: "Adult", notes: "Strong vocabulary; needs confidence with grammar.", level: "A2", score: 86 },
    ...(includeExtra ? [{ key: `${prefix}-teen-lina`, name: "Lina Amrane", age_group: "Teen", notes: "Short, clear prompts work well.", level: "A1+", score: 71 }] : [])
  ];
  const now = Date.now();

  for (const s of students) {
    const studentId = uuidFrom(s.key);
    check("students", await supabase.from("students").upsert({
      id: studentId, teacher_id: uid, name: s.name, age_group: s.age_group, notes: s.notes
    }));

    const firstScore = Math.max(0, s.score - 9);
    const assessments = [
      {
        id: uuidFrom(`${s.key}-initial`), client_id: `${s.key}-initial`, type: "initial",
        title: "Initial Level Assessment · Adult / Teen", score: firstScore,
        estimated_level: firstScore >= 80 ? "A2" : "A1+", confidence: "medium",
        skills: { Grammar: firstScore - 4, Vocabulary: firstScore + 5, Reading: firstScore, "Everyday English": firstScore + 2 },
        levels: [{ level: "A1", correct: 8, total: 12 }, { level: "A2", correct: 3, total: 6 }],
        start_unit_id: "ta-0B", started_at: daysAgo(now, 14), completed_at: daysAgo(now, 13), correctEvery: 4
      },
      {
        id: uuidFrom(`${s.key}-progress`), client_id: `${s.key}-progress`, type: "progress",
        title: "Progress Test · Adult / Teen", score: s.score, estimated_level: s.level, confidence: "high",
        skills: { Grammar: s.score - 2, Vocabulary: s.score + 4, Reading: s.score, "Everyday English": s.score + 3 },
        levels: [{ level: "A1", correct: 10, total: 12 }, { level: "A2", correct: 5, total: 6 }],
        start_unit_id: "ta-1", started_at: daysAgo(now, 3), completed_at: daysAgo(now, 2), correctEvery: 5
      }
    ];

    for (const { correctEvery, ...a } of assessments) {
      check("assessments", await supabase.from("assessments").upsert(
        { ...a, teacher_id: uid, student_id: studentId, created_at: a.completed_at },
        { onConflict: "id" }
      ));
      const answers = META.map((m, i) => {
        const correct = i % correctEvery !== 1;
        return {
          id: uuidFrom(`${a.id}-${m.id}`), teacher_id: uid, assessment_id: a.id, student_id: studentId,
          question_id: m.id, selected_answer: correct ? 0 : 1, is_correct: correct,
          level: m.level, skill: m.skill, unit_id: m.unit_id, created_at: daysAgo(now, i + 1)
        };
      });
      check("assessment_answers", await supabase.from("assessment_answers").upsert(answers, { onConflict: "id" }));
    }

    const progress = [["ta-0A", 3], ["ta-0B", 3], ["ta-1", 2], ["ta-2", 1]].map(([unit_id, stars]) => ({
      teacher_id: uid, student_id: studentId, unit_id, stars,
      note: stars === 3 ? "Confident" : "Continue practising", updated_at: new Date().toISOString()
    }));
    check("unit_progress", await supabase.from("unit_progress").upsert(progress, { onConflict: "student_id,unit_id" }));
  }
}

const ids = [];
for (const account of ACCOUNTS) ids.push(await ensureAuthUser(account));
await seedTeacher(ids[0], "demo", true);
await seedTeacher(ids[1], "second", false);

console.log("\nLinguaTrack Supabase demo data is ready.\n");
console.log("Teacher accounts:");
for (const account of ACCOUNTS) console.log(`  ${account.email} / ${account.password}`);
console.log("\nEach account has isolated students, assessments, answer analytics and book progress.\n");
