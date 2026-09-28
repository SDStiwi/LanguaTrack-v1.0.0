import React from "react";
import { LEVELS } from "../lib/scoring";
import { buildTimeline } from "../lib/progress";

const W = 640, H = 240, PAD = { l: 44, r: 44, t: 18, b: 46 };

/**
 * Level (stepped line, left axis) and score (dots, right axis) across every
 * assessment, oldest → newest. Plain SVG: no chart library needed.
 * Points are evenly spaced (not proportional to time) so sessions that are
 * close together stay readable; dates are labelled.
 */
export default function ProgressChart({ assessments }) {
  const line = buildTimeline(assessments);
  if (line.length < 2) {
    return <p className="muted">Complete at least two assessments to see progress over time.</p>;
  }
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const x = i => PAD.l + (line.length === 1 ? innerW / 2 : (i / (line.length - 1)) * innerW);
  const yLevel = idx => PAD.t + innerH - (idx / (LEVELS.length - 1)) * innerH;
  const yScore = v => PAD.t + innerH - (v / 100) * innerH;
  const levelPath = line.map((a, i) => `${i ? "L" : "M"}${x(i)},${yLevel(a.levelIdx)}`).join(" ");
  const fmt = a => new Date(a.time).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <figure className="progress-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Estimated level over time: ${line.map(a => `${fmt(a)} ${a.estimated_level}`).join(", ")}`}>
        {LEVELS.map((l, idx) => (
          <g key={l}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yLevel(idx)} y2={yLevel(idx)} className="grid" />
            <text x={PAD.l - 10} y={yLevel(idx) + 4} textAnchor="end" className="axis">{l}</text>
          </g>
        ))}
        {[0, 50, 100].map(v => (
          <text key={v} x={W - PAD.r + 10} y={yScore(v) + 4} className="axis score-axis">{v}%</text>
        ))}
        <path d={levelPath} className="level-line" fill="none" />
        {line.map((a, i) => (
          <g key={a.id ?? i}>
            {a.score != null && <circle cx={x(i)} cy={yScore(a.score)} r="4" className="score-dot"><title>{`${fmt(a)}: ${a.score}%`}</title></circle>}
            <circle cx={x(i)} cy={yLevel(a.levelIdx)} r="6" className="level-dot"><title>{`${fmt(a)}: ${a.estimated_level}${a.type ? " (" + a.type + ")" : ""}`}</title></circle>
            <text x={x(i)} y={H - 20} textAnchor="middle" className="axis">{fmt(a)}</text>
          </g>
        ))}
      </svg>
      <figcaption>
        <span className="key level-key" /> Estimated level
        <span className="key score-key" /> Score (different tests aren't on exactly the same scale — trust the level first)
      </figcaption>
    </figure>
  );
}
