import test from "node:test";
import assert from "node:assert/strict";
import { classifyError, flushQueue, MAX_ATTEMPTS } from "../src/lib/sync.js";
import { createQueueStore } from "../src/lib/storage.js";

const fakeStorage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const stores = () => ({ queue: createQueueStore(fakeStorage(), "q"), failed: createQueueStore(fakeStorage(), "f") });
const entry = (id, extra = {}) => ({ localId: id, ownerId: "t1", assessment: {}, answers: [], ...extra });

test("classifyError separates network, auth, permanent and server failures", () => {
  assert.equal(classifyError(null), null);
  assert.equal(classifyError({ message: "Failed to fetch" }), "network");
  assert.equal(classifyError({ code: "PGRST301", message: "JWT expired" }), "auth");
  assert.equal(classifyError({ status: 401 }), "auth");
  assert.equal(classifyError({ code: "42501" }), "auth");
  assert.equal(classifyError({ code: "23503" }), "permanent"); // student was deleted
  assert.equal(classifyError({ code: "22P02" }), "permanent"); // malformed data
  assert.equal(classifyError({ code: "XX000" }), "server");
});

test("queue store survives corrupt storage and a full disk", () => {
  const broken = { getItem: () => "{not json", setItem: () => { throw new Error("quota"); } };
  const q = createQueueStore(broken, "k");
  assert.deepEqual(q.list(), []);
  assert.equal(q.add(entry("a")), false);
  assert.deepEqual(createQueueStore(null, "k").list(), []);
});

test("queue add is idempotent per localId", () => {
  const { queue } = stores();
  queue.add(entry("a")); queue.add(entry("a")); queue.add(entry("b"));
  assert.deepEqual(queue.list().map(e => e.localId), ["a", "b"]);
});

test("flush sends everything and empties the queue when the server accepts", async () => {
  const { queue, failed } = stores();
  queue.add(entry("a")); queue.add(entry("b"));
  const s = await flushQueue({ save: async e => ({ ok: true, entry: e }), queue, failed, ownerId: "t1" });
  assert.equal(s.sent, 2);
  assert.equal(queue.list().length, 0);
});

test("a network failure stops the run and keeps every remaining entry", async () => {
  const { queue, failed } = stores();
  queue.add(entry("a")); queue.add(entry("b"));
  let calls = 0;
  const s = await flushQueue({ save: async e => { calls++; return { ok: false, error: { message: "Failed to fetch" }, entry: e }; }, queue, failed, ownerId: "t1" });
  assert.equal(calls, 1, "does not hammer a dead connection");
  assert.equal(s.stopped, "network");
  assert.equal(queue.list().length, 2);
  assert.equal(queue.list()[0].attempts || 0, 0, "offline retries are not counted against the entry");
});

test("a permanently rejected entry moves to the failed list and does not block the rest", async () => {
  const { queue, failed } = stores();
  queue.add(entry("poison")); queue.add(entry("good"));
  const save = async e => e.localId === "poison"
    ? { ok: false, error: { code: "23503", message: "fk" }, entry: e }
    : { ok: true, entry: e };
  const s = await flushQueue({ save, queue, failed, ownerId: "t1" });
  assert.equal(s.sent, 1);
  assert.equal(s.failed, 1);
  assert.equal(queue.list().length, 0);
  assert.equal(failed.list()[0].localId, "poison");
  assert.equal(failed.list()[0].failedReason, "permanent");
});

test("an entry that keeps failing on the server is retired after MAX_ATTEMPTS", async () => {
  const { queue, failed } = stores();
  queue.add(entry("flaky"));
  const save = async e => ({ ok: false, error: { code: "XX000", message: "boom" }, entry: e });
  for (let i = 0; i < MAX_ATTEMPTS; i++) await flushQueue({ save, queue, failed, ownerId: "t1" });
  assert.equal(queue.list().length, 0);
  assert.equal(failed.list().length, 1);
});

test("results queued by another teacher on the same device are left alone", async () => {
  const { queue, failed } = stores();
  queue.add(entry("mine")); queue.add(entry("theirs", { ownerId: "t2" }));
  const sent = [];
  await flushQueue({ save: async e => { sent.push(e.localId); return { ok: true, entry: e }; }, queue, failed, ownerId: "t1" });
  assert.deepEqual(sent, ["mine"]);
  assert.deepEqual(queue.list().map(e => e.localId), ["theirs"]);
});

test("an auth failure stops the run but keeps the entry for after sign-in", async () => {
  const { queue, failed } = stores();
  queue.add(entry("a")); queue.add(entry("b"));
  const s = await flushQueue({ save: async e => ({ ok: false, error: { status: 401 }, entry: e }), queue, failed, ownerId: "t1" });
  assert.equal(s.stopped, "auth");
  assert.equal(queue.list().length, 2);
});
