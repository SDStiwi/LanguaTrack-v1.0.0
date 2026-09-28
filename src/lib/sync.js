// Decides what to do with a save failure, and drains the offline queue.
export const MAX_ATTEMPTS = 8;

/**
 * network   – no response at all (network failures carry no error code): keep, retry later
 * auth      – not signed in / token expired / not allowed: keep, retry after sign-in
 * permanent – the server will never accept this row (bad data, missing student): give up
 * server    – anything else: keep, but count attempts so it cannot loop forever
 */
export function classifyError(error) {
  if (!error) return null;
  const code = String(error.code ?? "");
  const status = Number(error.status ?? 0);
  if (!code && !status) return "network";
  if (status === 401 || status === 403 || code === "42501" || /^PGRST30[1-3]$/.test(code) || /jwt/i.test(error.message ?? "")) return "auth";
  if (/^(22|23)/.test(code) || code === "PGRST116") return "permanent";
  return "server";
}

/**
 * Drain the queue for one signed-in owner.
 * `save(entry)` → { ok, error, entry }. Never throws.
 * `queue` / `failed` are stores from storage.js.
 * Stops at the first network or auth problem (no point hammering), moves
 * permanent failures to `failed`, and retires entries after MAX_ATTEMPTS.
 */
export async function flushQueue({ save, queue, failed, ownerId }) {
  const summary = { sent: 0, failed: 0, remaining: 0, stopped: null };
  for (const entry of queue.list()) {
    if (entry.ownerId && ownerId && entry.ownerId !== ownerId) continue; // someone else's result
    const res = await save(entry);
    if (res.ok) {
      queue.remove(entry.localId);
      summary.sent += 1;
      continue;
    }
    const kind = classifyError(res.error);
    const attempts = (entry.attempts || 0) + (kind === "network" ? 0 : 1);
    const next = { ...res.entry, attempts, lastError: res.error?.message ?? String(kind) };
    if (kind === "permanent" || attempts >= MAX_ATTEMPTS) {
      queue.remove(entry.localId);
      failed.add({ ...next, failedReason: kind });
      summary.failed += 1;
      continue;
    }
    queue.update(next);
    if (kind === "network" || kind === "auth") { summary.stopped = kind; break; }
  }
  summary.remaining = queue.list().filter(e => !e.ownerId || !ownerId || e.ownerId === ownerId).length;
  return summary;
}
