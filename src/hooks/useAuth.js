import { useCallback, useEffect, useState } from "react";
import { backend, startedInRecovery } from "../lib/supabase";

const DEMO_SESSION_KEY = "linguatrack_demo_session.v1";
const DEMO_USER = { id: "demo-teacher", email: "demo@linguatrack.local" };

function hasDemoSession() {
  try { return localStorage.getItem(DEMO_SESSION_KEY) !== "0"; }
  catch { return true; }
}

/** Teacher session. With no Supabase configured the app runs as a local portfolio demo. */
export function useAuth() {
  const [state, setState] = useState(() =>
    backend
      ? { loading: true, user: null, demo: false, recovery: startedInRecovery }
      : { loading: false, user: hasDemoSession() ? DEMO_USER : null, demo: true, recovery: false }
  );

  useEffect(() => {
    if (!backend) return undefined;
    let active = true;
    const { data } = backend.auth.onAuthStateChange((event, session) => {
      if (active) setState(cur => ({ loading: false, user: session?.user ?? null, demo: false, recovery: event === "PASSWORD_RECOVERY" || (cur.recovery && Boolean(session)) }));
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!backend) {
      try { localStorage.setItem(DEMO_SESSION_KEY, "1"); } catch {}
      setState({ loading: false, user: DEMO_USER, demo: true });
      return null;
    }
    const { error } = await backend.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    if (!backend) {
      try { localStorage.setItem(DEMO_SESSION_KEY, "0"); } catch {}
      setState({ loading: false, user: null, demo: true });
      return;
    }
    await backend.auth.signOut();
  }, []);

  const resetPassword = useCallback(async email => {
    if (!backend) return "Password reset needs Supabase to be configured.";
    const { error } = await backend.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    return error ? error.message : null;
  }, []);

  // Returns null on success, "REAUTH" when Supabase wants an emailed code first, otherwise an error message.
  const updatePassword = useCallback(async (password, nonce) => {
    if (!backend) return "Demo mode has no password to change.";
    const { data, error } = await backend.auth.updateUser(nonce ? { password, nonce } : { password });
    if (error) return /reauthenticat/i.test(error.message) ? "REAUTH" : error.message;
    if (!data?.user) return "Supabase did not confirm the change. Please try again.";
    setState(cur => ({ ...cur, recovery: false }));
    return null;
  }, []);

  const reauthenticate = useCallback(async () => {
    if (!backend) return "Demo mode has no account.";
    const { error } = await backend.auth.reauthenticate();
    return error ? error.message : null;
  }, []);

  return { ...state, signIn, signOut, resetPassword, updatePassword, reauthenticate };
}
