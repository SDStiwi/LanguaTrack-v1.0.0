import React from "react";

/** LinguaTrack mark: a speech bubble (language) holding a rising line (progress). */
export function LogoMark({ size = 34, className = "" }) {
  return (
    <svg className={"logo-mark " + className} width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="LinguaTrack logo">
      <rect width="48" height="48" rx="13" fill="#16352f"/>
  <path d="M16 11h16a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5h-8l-7 6v-6h-1a5 5 0 0 1-5-5V16a5 5 0 0 1 5-5z" fill="#f4e6b7"/>
  <path d="M16.5 25.5l4.5-5 4 3 6.5-7" fill="none" stroke="#16352f" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="31.5" cy="16.5" r="2.3" fill="#7d946b"/>
    </svg>
  );
}

export default function Logo({ size = 34, tagline = true }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-text">
        <strong>Lingua<em>Track</em></strong>
        {tagline && <small>English assessment &amp; progress</small>}
      </span>
    </span>
  );
}
