/* Apple Shortcuts → PWA bridge.

   A user-built iOS Shortcut reads HealthKit data and opens our PWA at a
   URL like /?hksync=1&steps=8234&sleep=7.5&hrv=62&rhr=54&cal=340&stand=9
   We parse those params, persist a snapshot, and strip the URL so the
   address bar doesn't leak personal health data into the browser
   history. */

import { todayStr } from "../../habits/utils/streak.js";

function intOrNull(v) {
  if (v == null || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function floatOrNull(v) {
  if (v == null || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/* Synchronously read the current location for an hksync payload, clean
   the URL via history.replaceState, and return the parsed snapshot.
   Returns null if no hksync flag is present. */
export function readHealthSyncFromURL() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.get("hksync")) return null;

  const snapshot = {
    date:            todayStr(),
    steps:           intOrNull(params.get("steps")),
    sleep_hours:     floatOrNull(params.get("sleep")),
    hrv_ms:          intOrNull(params.get("hrv")),
    resting_hr:      intOrNull(params.get("rhr")),
    active_calories: intOrNull(params.get("cal")),
    stand_hours:     intOrNull(params.get("stand")),
    source:          "shortcuts",
    receivedAt:      new Date().toISOString(),
  };

  // Strip the query string immediately — never let health data linger
  // in the address bar or browser history.
  try {
    window.history.replaceState({}, "", window.location.pathname);
  } catch {
    /* private mode or sandboxed contexts — best effort */
  }

  return snapshot;
}

/* The URL the user copies into their Shortcut's "Open URL" action.
   The Shortcut variable substitution happens client-side in Shortcuts,
   so we use plain placeholder names that match the spec. */
export function buildShortcutURLTemplate(origin) {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "https://your-app.vercel.app");
  return `${base}/?hksync=1&steps=[steps]&sleep=[sleep]&hrv=[hrv]&rhr=[rhr]&cal=[cal]&stand=[stand]`;
}
