/* ===================================================================
   WEBHOOK LOG — an in-memory record of every backend call the app
   makes, mock or real.

   Two purposes:
   - Development: see at a glance which webhooks fired, in what order,
     with what payload, and how long each took.
   - Demo: prove the wiring works before the backends exist.

   The DevPanel component renders this. Nothing here touches the
   network; it only observes.
=================================================================== */

const listeners = new Set();
let entries = [];
let nextId = 1;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  const snapshot = [...entries];
  listeners.forEach((fn) => fn(snapshot));
}

/**
 * Record the start of a call. Returns a handle whose `.done(result)` or
 * `.fail(error)` closes the entry out.
 */
/**
 * Strip anything that shouldn't be visible in a UI log. The real value
 * still goes over the wire — this only affects what we display.
 */
function redact(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const out = { ...payload };
  if ("password" in out) out.password = "••••••••";
  if ("audio_base64" in out) {
    const len = out.audio_base64?.length || 0;
    out.audio_base64 = `<audio, ${Math.round(len / 1024)} KB>`;
  }
  return out;
}

export function logCall({ name, url, payload, mocked }) {
  const entry = {
    id: nextId++,
    name,
    url,
    payload: redact(payload),
    mocked,
    status: "pending",
    startedAt: Date.now(),
    ms: null,
    result: null,
    error: null,
  };
  entries = [entry, ...entries].slice(0, 50); // keep the log bounded
  emit();

  const close = (patch) => {
    entries = entries.map((e) =>
      e.id === entry.id
        ? { ...e, ...patch, ms: Date.now() - e.startedAt }
        : e
    );
    emit();
  };

  return {
    done: (result) => close({ status: "ok", result }),
    fail: (error) => close({ status: "error", error: String(error) }),
  };
}

export function getEntries() {
  return entries;
}

export function clearLog() {
  entries = [];
  emit();
}
