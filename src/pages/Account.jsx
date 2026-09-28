import React, { useState } from "react";

export default function Account({ user, demo, recovery, onChangePassword, onReauth, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [needCode, setNeedCode] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState({ text: "", ok: false });

  const submit = async e => {
    e.preventDefault();
    if (password.length < 8) return setMessage({ text: "Use at least 8 characters.", ok: false });
    if (password !== confirm) return setMessage({ text: "The two passwords don't match.", ok: false });
    setBusy(true);
    const err = await onChangePassword(password, needCode ? code.trim() : undefined);
    if (err === "REAUTH") {
      const sendErr = await onReauth();
      setBusy(false);
      setNeedCode(true);
      return setMessage(sendErr
        ? { text: sendErr, ok: false }
        : { text: "For security, Supabase emailed you a code. Enter it below and press Update password again.", ok: true });
    }
    setBusy(false);
    if (err) return setMessage({ text: err, ok: false });
    setPassword(""); setConfirm(""); setCode(""); setNeedCode(false);
    setMessage({ text: "Password updated. Use it the next time you sign in.", ok: true });
    if (recovery) onDone();
  };

  return (
    <div className="page narrow">
      <span className="eyebrow">ACCOUNT</span>
      <h1>Account settings</h1>
      <p className="muted">Signed in as <strong>{user?.email}</strong></p>
      <form className="panel" onSubmit={submit}>
        <h2>{recovery ? "Choose a new password" : "Change password"}</h2>
        {demo ? <p className="muted">Demo mode has no real account. Configure Supabase to manage passwords.</p> : (
          <>
            <label>New password
              <input type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
            <label>Confirm password
              <input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </label>
            {needCode && <label>Code from the email<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} required /></label>}
            <button className="primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
          </>
        )}
        {message.text && <p className={message.ok ? "saved-note" : "form-error"} role="alert">{message.text}</p>}
      </form>
    </div>
  );
}
