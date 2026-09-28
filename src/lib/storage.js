// Results that could not be saved (offline, Supabase down, ...) wait here and
// are re-sent automatically. localStorage can be unavailable (private mode,
// quota), so every access is guarded and writes report success.
// The store takes its storage backend as a parameter so it can be tested.
const PENDING_KEY = "linguatrack_pending_assessments";
const FAILED_KEY = "linguatrack_failed_assessments";

function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function createQueueStore(storage = browserStorage(), key = PENDING_KEY) {
  const read = () => {
    try {
      const list = JSON.parse(storage?.getItem(key) || "[]");
      return Array.isArray(list) ? list : [];
    } catch { return []; }
  };
  const write = list => {
    try { storage.setItem(key, JSON.stringify(list)); return true; } catch { return false; }
  };
  return {
    list: read,
    add: entry => write([...read().filter(e => e.localId !== entry.localId), entry]),
    update: entry => write(read().map(e => (e.localId === entry.localId ? entry : e))),
    remove: localId => write(read().filter(e => e.localId !== localId)),
    removeWhere: predicate => write(read().filter(e => !predicate(e)))
  };
}

export const pendingStore = createQueueStore(browserStorage(), PENDING_KEY);
// Results the server permanently rejected. Kept (not silently dropped) so the
// teacher can export or discard them.
export const failedStore = createQueueStore(browserStorage(), FAILED_KEY);

// Back-compat named exports used by the UI.
export const getPendingAssessments = pendingStore.list;
export const addPendingAssessment = pendingStore.add;
export const updatePendingAssessment = pendingStore.update;
export const removePendingAssessment = pendingStore.remove;
