// Minimal CSV builder. Cells starting with = + - @ are prefixed with ' so spreadsheets never run them as formulas.
const esc = v => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows, cols) =>
  [cols.map(c => esc(c.label)).join(","), ...rows.map(r => cols.map(c => esc(c.get(r))).join(","))].join("\r\n");

export const studentsCsv = students => toCsv(students, [
  { label: "Name", get: s => s.name },
  { label: "Age group", get: s => s.age_group },
  { label: "Level", get: s => s.level },
  { label: "Latest score %", get: s => s.score },
  { label: "Assessments", get: s => s.tests },
  { label: "Archived", get: s => (s.archived_at ? "yes" : "no") },
  { label: "Notes", get: s => s.notes }
]);
