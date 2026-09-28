/**
 * Teacher-recorded progress through the book: 0-3 stars per unit.
 *   0 not started · 1 practising · 2 nearly there · 3 confident (unit done)
 * Stored in the `unit_progress` table, one row per student and unit.
 */
export const STAR_LABELS = ["Not started", "Practising", "Nearly there", "Confident"];
export const MAX_STARS = 3;
export const clampStars = n => Math.max(0, Math.min(MAX_STARS, Math.round(Number(n) || 0)));

/** rows: [{ unit_id, stars }]. Returns per-unit stars plus a short summary. */
export function summarizeProgress(units, rows = []) {
  const stars = Object.fromEntries(units.map(u => [u.id, 0]));
  for (const r of rows) if (r.unit_id in stars) stars[r.unit_id] = clampStars(r.stars);
  const done = units.filter(u => stars[u.id] === MAX_STARS).length;
  const started = units.filter(u => stars[u.id] > 0).length;
  // The unit to work on next: the first one that is not yet confident, once any progress exists.
  const next = started > 0 ? units.find(u => stars[u.id] < MAX_STARS) || null : null;
  return { stars, done, started, total: units.length, next };
}

/** Replace or add one unit's row (used for optimistic updates). */
export function withUnitStars(rows, unitId, stars, note) {
  const rest = rows.filter(r => r.unit_id !== unitId);
  const prev = rows.find(r => r.unit_id === unitId);
  return [...rest, { ...prev, unit_id: unitId, stars: clampStars(stars), note: note ?? prev?.note ?? "" }];
}

export async function loadUnitProgress(client, studentId) {
  const { data, error } = await client.from("unit_progress").select("unit_id, stars, note").eq("student_id", studentId);
  if (error) throw error;
  return data || [];
}

export async function saveUnitStars(client, { studentId, unitId, stars, note = "" }) {
  const { error } = await client.from("unit_progress").upsert(
    { student_id: studentId, unit_id: unitId, stars: clampStars(stars), note, updated_at: new Date().toISOString() },
    { onConflict: "student_id,unit_id" }
  );
  if (error) throw error;
}
