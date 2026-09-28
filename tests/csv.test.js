import test from "node:test";
import assert from "node:assert/strict";
import { toCsv, studentsCsv } from "../src/lib/csv.js";

test("escapes commas, quotes and newlines", () => {
  const out = toCsv([{ a: 'x, "y"\nz' }], [{ label: "A", get: r => r.a }]);
  assert.equal(out, 'A\r\n"x, ""y""\nz"');
});

test("neutralises spreadsheet formulas", () => {
  const out = toCsv([{ a: "=SUM(1,2)" }], [{ label: "A", get: r => r.a }]);
  assert.match(out, /'=SUM/);
});

test("studentsCsv has a header and one row per student", () => {
  const rows = studentsCsv([{ name: "Sarah", age_group: "Adult", level: "A2", score: 80, tests: 2, notes: "" }]).split("\r\n");
  assert.equal(rows.length, 2);
  assert.match(rows[1], /^Sarah,Adult,A2,80,2,no,/);
});
