import React, { useState } from "react";
import Logo from "../components/Logo";

export default function Login({ onSignIn, onReset, demo = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    if (reset) {
      const message = await onReset(email.trim());
      if (message) setError(message); else setSent(true);
      setBusy(false);
      return;
    }
    const message = await onSignIn(email.trim(), password);
    if (message) { setError(message); setBusy(false); }
  };

  const enterDemo = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const message = await onSignIn("demo@linguatrack.local", "");
    if (message) { setError(message); setBusy(false); }
  };

  return (
    <div className="login-wrap">
      <form className="panel login" onSubmit={submit}>
        <Logo size={44} tagline={false} />
        <span className="eyebrow">{demo ? "PORTFOLIO DEMO" : "TEACHER SIGN-IN"}</span>
        <h1>Welcome back</h1>
        <p className="muted">
          {demo
            ? "Explore the assessment dashboard with realistic demo students and the adult coursebook."
            : "Student records are private. Sign in to continue."}
        </p>

        {demo ? (
          <>
            <div className="demo-login-note">
              <strong>Demo mode</strong>
              <span>No account or password is required. Demo data stays in this browser.</span>
            </div>
            <button className="primary full" type="button" onClick={enterDemo} disabled={busy}>
              {busy ? "Opening workspace…" : "Enter demo workspace"}
            </button>
          </>
        ) : (
          <>
            <label>Email
              <input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            {!reset && (
              <label>Password
                <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
              </label>
            )}
            <button className="primary full" type="submit" disabled={busy || !email || (!reset && !password)}>
              {reset ? (busy ? "Sending…" : "Send reset link") : busy ? "Signing in…" : "Sign in"}
            </button>
            {sent && <p className="saved-note" role="status">If that email has an account, a reset link is on its way.</p>}
            <button className="back" type="button" onClick={() => { setReset(r => !r); setSent(false); setError(""); }}>
              {reset ? "Back to sign in" : "Forgot password?"}
            </button>
          </>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="login-footnote">
          {demo ? "Demo authentication is local-only and is not a security mechanism." : "Authentication is handled by Supabase Auth."}
        </p>
      </form>
    </div>
  );
}
