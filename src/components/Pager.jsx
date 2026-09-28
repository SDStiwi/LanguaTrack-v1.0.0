import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 1 … 4 5 6 … 12 — always shows first, last and the pages around the current one.
export function pageWindow(current, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = [...new Set([1, pages, current - 1, current, current + 1])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  keep.forEach((n, i) => {
    if (i > 0 && n - keep[i - 1] > 1) out.push("gap-" + n);
    out.push(n);
  });
  return out;
}

export default function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="pager" role="navigation" aria-label="Pagination">
      <button className="outline" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /> Prev</button>
      {pageWindow(page, pages).map(n =>
        typeof n === "string"
          ? <span key={n} className="page-gap">…</span>
          : <button key={n} className={"page-num" + (n === page ? " active" : "")} aria-current={n === page ? "page" : undefined} onClick={() => onChange(n)}>{n}</button>
      )}
      <button className="outline" disabled={page === pages} onClick={() => onChange(page + 1)}>Next <ChevronRight size={16} /></button>
    </div>
  );
}
