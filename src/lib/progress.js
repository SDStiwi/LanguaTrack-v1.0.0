import { LEVELS } from "./scoring.js";

export const levelIndex = level => LEVELS.indexOf(level);

/** Assessments oldest → newest, keeping only ones that have a date and a known level. */
export function buildTimeline(assessments = []) {
  return assessments
    .filter(a => a && a.completed_at && levelIndex(a.estimated_level) >= 0)
    .map(a => ({ ...a, levelIdx: levelIndex(a.estimated_level), time: new Date(a.completed_at).getTime() }))
    .filter(a => Number.isFinite(a.time))
    .sort((a, b) => a.time - b.time);
}

/**
 * Compare the two most recent results. The LEVEL is the trustworthy signal:
 * raw percentages from an initial test and a progress test are not measured on
 * the same scale (different length, different level mix), so a score delta is
 * only reported when both results come from the same kind of test.
 */
export function summarizeTrend(assessments = []) {
  const line = buildTimeline(assessments);
  if (line.length === 0) return { direction: "none", message: "No results yet." };
  if (line.length === 1) return { direction: "new", to: line[0].estimated_level, message: "First result recorded." };
  const prev = line[line.length - 2];
  const last = line[line.length - 1];
  const diff = last.levelIdx - prev.levelIdx;
  const sameKind = prev.type && prev.type === last.type;
  const scoreDelta = sameKind && prev.score != null && last.score != null ? last.score - prev.score : null;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "same";
  const message =
    direction === "up" ? `Moved up from ${prev.estimated_level} to ${last.estimated_level}.`
    : direction === "down" ? `Estimate dropped from ${prev.estimated_level} to ${last.estimated_level} — check the per-level breakdown before drawing conclusions.`
    : `Level unchanged at ${last.estimated_level}.`;
  return { direction, from: prev.estimated_level, to: last.estimated_level, scoreDelta, message };
}
