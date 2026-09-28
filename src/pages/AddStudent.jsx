import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AGE_GROUPS, MODES } from "../lib/modes";
import { summarizeStudent } from "../lib/assessments";
import { backend } from "../lib/supabase";

export default function AddStudent({ onCreated, onBack, defaultAge = "Adult" }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(defaultAge);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError("");
    if (!backend) {
      onCreated({ id: "local-" + Date.now(), name: trimmed, age_group: age, level: "—", score: null, tests: 0 });
      return;
    }
    try {
      const { data, error: err } = await backend
        .from("students").insert({ name: trimmed, age_group: age }).select().single();
      if (err) throw err;
      onCreated(summarizeStudent(data));
    } catch {
      setError("Couldn't save the student. Check the connection and try again.");
      setSaving(false);
    }
  };

  return (
    <div className="narrow">
      <button className="back" onClick={onBack}><ChevronLeft size={17} /> Back</button>
      <div className="panel">
        <span className="eyebrow">NEW LEARNER</span>
        <h1>Add a student</h1>
        <label>Name
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="e.g. Sarah"
          />
        </label>
        <span className="field-label" id="age-label">Age group</span>
        <div className="age-picker" role="radiogroup" aria-labelledby="age-label">
          {AGE_GROUPS.map(g => {
            const m = MODES[g];
            return (
              <button
                key={g} type="button" role="radio" aria-checked={age === g}
                className={"age-option mode-" + m.key + (age === g ? " active" : "")}
                onClick={() => setAge(g)}
              >
                <span className="mode-emoji">{m.emoji}</span>
                <strong>{m.label}</strong>
                <small>{m.tagline}</small>
              </button>
            );
          })}
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary full" disabled={saving || !name.trim()} onClick={save}>
          {saving ? "Saving..." : "Save student"}
        </button>
      </div>
    </div>
  );
}
