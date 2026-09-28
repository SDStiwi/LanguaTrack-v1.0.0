// Supabase client for LinguaTrack (Auth + Postgres via PostgREST).
// With no env vars the app runs as a local demo and `backend` is null.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Read before createClient() strips the token from the URL, so a reset link always opens "choose a new password".
export const startedInRecovery = typeof window !== "undefined" && /type=recovery/.test(window.location.hash + window.location.search);

export const supabaseConfigured = Boolean(url && anonKey);

export const backend = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null;
