import React from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { ALL_CURRICULA } from "../data/curriculum";
import { adultBookLink, kidsBookLink } from "../lib/books";

const BOOKS = [
  {
    key: "kids", title: "My English Adventure", sub: "Book 1 · ages 6–9 · Foundations + 12 units", units: ALL_CURRICULA.kids,
    blurb: "Learn, speak, play, draw, shine: a picture-led course with a colour-a-star adventure map and a final check.", interactive: true, audience: "Kids"
  },
  {
    key: "teen-adult", title: "English A1+/A2 Bridge", sub: "Student book · 16-week course · Pre-A1 to A2", units: ALL_CURRICULA.teenAdult,
    blurb: "A six-page rhythm per unit (vocabulary, grammar, listening, speaking, reading and writing, review and mission) with four progress checks.", interactive: true, audience: "Teens and adults", bookLink: "adult"
  }
];

export default function Books() {
  const base = import.meta.env.BASE_URL;
  return (
    <div className="page">
      <div className="section-head">
        <div>
          <span className="eyebrow">CURRICULUM</span>
          <h1>Books</h1>
          <p>The two coursebooks LinguaTrack is built around. Every test question is tagged with a book unit, which is how results can say where to start teaching.</p>
        </div>
      </div>
      <div className="test-grid">
        {BOOKS.map(b => (
          <div className="panel book-card" key={b.key}>
            <span className="pill">{b.audience.toUpperCase()}</span>
            <h2>{b.title}</h2>
            <p className="muted">{b.sub}</p>
            <p>{b.blurb}</p>
            {b.interactive && (
              <a
                className="primary link-btn"
                href={b.bookLink === "adult" ? adultBookLink(base) : kidsBookLink(base)}
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen size={16} /> Open the interactive book <ExternalLink size={13} />
              </a>
            )}
            <details>
              <summary>{b.units.length} units: language focus and vocabulary</summary>
              <ol className="unit-map">
                {b.units.map(u => (
                  <li key={u.id}>
                    <strong>Unit {u.number} · {u.title}</strong>
                    <span>{u.grammar.join("; ")}</span>
                    <small>{u.vocab.length} core words{u.band ? ` · ${u.band}` : ""}</small>
                  </li>
                ))}
              </ol>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
