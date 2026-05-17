/* Thin wrapper around the Performance API. No-op in environments where
   it's absent (older Safari, server-rendered probes). Tracks app spans
   so the user (or a future analytics layer) can see real-world timing. */

export function mark(name) {
  try { if (typeof performance !== "undefined") performance.mark(name); } catch { /* ignore */ }
}

export function measure(name, startMark, endMark) {
  try {
    if (typeof performance === "undefined") return null;
    performance.measure(name, startMark, endMark);
    const entries = performance.getEntriesByName(name, "measure");
    const last = entries[entries.length - 1];
    if (last && last.duration > 3000 && typeof console !== "undefined") {
      console.warn(`[perf] ${name} took ${Math.round(last.duration)}ms — over budget`);
    }
    return last?.duration ?? null;
  } catch {
    return null;
  }
}

/* Run an async fn with start/end marks. Returns the fn result. */
export async function track(name, fn) {
  mark(`${name}:start`);
  try {
    return await fn();
  } finally {
    mark(`${name}:end`);
    measure(name, `${name}:start`, `${name}:end`);
  }
}
