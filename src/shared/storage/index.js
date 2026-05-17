/* Storage layer.

   localStorage is the immediate cache (UI never waits on the network),
   Upstash is the source of truth (cross-device, survives iOS wiping
   Safari storage). Reads check localStorage first, fall back to Upstash
   when empty. Writes update localStorage synchronously then push to
   Upstash in the background.

   Critical keys are mirrored to Upstash. Ephemeral keys (caches that can
   be regenerated) stay local-only — no point burning Redis ops on them.

   Single entry point: every persisted slice in the app routes through
   storageLoad/storageSave. The async signature also makes it trivial to
   swap implementations later without touching callers. */

import { toast } from "../toast.js";

const STORAGE_ENDPOINT = "/api/storage";
const APP_TOKEN        = import.meta.env.VITE_APP_STORAGE_TOKEN ?? "";

// Keys mirrored to Upstash. Anything not listed here stays local-only.
const CRITICAL_KEYS = new Set([
  // Training
  "workoutLog_v5",
  // Nutrition (live keys are v6, not v5)
  "mealPlan_v6", "mealLog_v6", "rebirth_saved_recipes",
  // Progress
  "weightLog_v5", "rebirth_measurements",
  // Habits
  "rebirth_habits", "rebirth_habit_logs",
  // Wellness / readiness
  "rebirth_readiness_logs",
  // Alter ego
  "rebirth_alter_ego",
  // Growth
  "rebirth_books", "rebirth_courses", "rebirth_skills",
  "rebirth_weekly_learning", "rebirth_saved_articles",
  // Feed
  "rebirth_feed_sources",
]);

// Explicitly local-only. Mostly AI/cache slices that regenerate cheaply.
const EPHEMERAL_KEYS = new Set([
  "rebirth_ai_assessment",
  "rebirth_weekly_ai_message",
  "rebirth_feed_read",
  "rebirth_feed_last_day",
  "rebirth_recent_recipes",
]);

function isCritical(key) { return CRITICAL_KEYS.has(key); }

// ── localStorage helpers ─────────────────────────────────────────────────

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch { return null; }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    const isQuota = err?.name === "QuotaExceededError" || /quota/i.test(err?.message || "");
    if (!reportedFailures.has(key)) {
      reportedFailures.add(key);
      toast(
        isQuota
          ? "Spazio esaurito. Esporta i dati e svuota la cache del browser."
          : "Salvataggio non riuscito. Modalità privata?",
        "error",
      );
    }
    return false;
  }
}

function lsDel(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

const reportedFailures = new Set();

// ── Remote helpers ───────────────────────────────────────────────────────

function authHeaders(json = false) {
  const h = {};
  if (json) h["Content-Type"] = "application/json";
  if (APP_TOKEN) h["x-app-token"] = APP_TOKEN;
  return h;
}

async function remoteGet(key) {
  try {
    const res = await fetch(`${STORAGE_ENDPOINT}?key=${encodeURIComponent(key)}`, {
      headers: authHeaders(false),
    });
    if (!res.ok) return null;
    const { value } = await res.json();
    return value ?? null;
  } catch { return null; }
}

async function remoteSet(key, value) {
  try {
    await fetch(STORAGE_ENDPOINT, {
      method:  "POST",
      headers: authHeaders(true),
      body:    JSON.stringify({ key, value }),
    });
  } catch (err) {
    // Background writes are best-effort. If the network is down, the
    // next sync at startup reconciles. Don't toast — it's noise.
    console.warn("[storage] remote write failed:", key, err);
  }
}

async function remoteDelete(key) {
  try {
    await fetch(`${STORAGE_ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method:  "DELETE",
      headers: authHeaders(false),
    });
  } catch { /* ignore */ }
}

async function remoteMGet(keys) {
  if (keys.length === 0) return {};
  try {
    const res = await fetch(STORAGE_ENDPOINT, {
      method:  "POST",
      headers: authHeaders(true),
      body:    JSON.stringify({ op: "mget", keys }),
    });
    if (!res.ok) return {};
    const { result } = await res.json();
    return result ?? {};
  } catch { return {}; }
}

async function remoteMSet(data) {
  if (Object.keys(data).length === 0) return;
  try {
    await fetch(STORAGE_ENDPOINT, {
      method:  "POST",
      headers: authHeaders(true),
      body:    JSON.stringify({ op: "mset", data }),
    });
  } catch (err) {
    console.warn("[storage] bulk remote write failed:", err);
  }
}

// ── Public API (preserved signatures) ────────────────────────────────────

// Legacy host wrapper — kept exported because daily-feed/services/cache.js
// references storage.* directly. New code should prefer the helpers below.
export const storage = {
  get: async (key) => {
    const raw = localStorage.getItem(key);
    return raw == null ? null : { value: raw };
  },
  set: async (key, raw) => { localStorage.setItem(key, raw); },
  delete: async (key) => { localStorage.removeItem(key); },
};

/* Load a value. Reads localStorage first; if empty AND the key is
   critical, falls back to Upstash and warms the cache. */
export async function storageLoad(key, fallback = null) {
  if (EPHEMERAL_KEYS.has(key)) {
    const local = lsGet(key);
    return local ?? fallback;
  }

  const local = lsGet(key);
  if (local !== null) return local;

  if (isCritical(key)) {
    const remote = await remoteGet(key);
    if (remote !== null && remote !== undefined) {
      lsSet(key, remote);
      return remote;
    }
  }
  return fallback;
}

/* Save a value. localStorage is sync (UI doesn't wait), Upstash is
   fire-and-forget. Returns true if the local write succeeded — the
   shape matches the prior implementation so existing callers that
   check the boolean keep working. */
export async function storageSave(key, value) {
  const ok = lsSet(key, value);
  if (ok && reportedFailures.has(key)) reportedFailures.delete(key);
  if (isCritical(key)) {
    // Fire and forget. We don't surface remote failures to the user —
    // the next sync recovers automatically.
    remoteSet(key, value);
  }
  return ok;
}

/* Delete a value locally and (for critical keys) on Upstash. */
export async function storageDelete(key) {
  lsDel(key);
  if (isCritical(key)) await remoteDelete(key);
}

// ── Sync orchestration ───────────────────────────────────────────────────

const LAST_SYNC_KEY = "_last_sync";

/* Pull from Upstash → localStorage. Upstash wins. Use at startup so a
   fresh device or wiped Safari picks up the user's real data. */
export async function syncFromRemote(onProgress) {
  const keys = [...CRITICAL_KEYS];
  const remoteData = await remoteMGet(keys);

  let synced = 0;
  for (const key of keys) {
    const remote = remoteData[key];
    if (remote !== null && remote !== undefined) {
      lsSet(key, remote);
      synced++;
    }
    onProgress?.(synced, keys.length);
  }
  lsSet(LAST_SYNC_KEY, new Date().toISOString());
  return synced;
}

/* Push localStorage → Upstash for every critical key the user has.
   Used on first migration (so Upstash gets the pre-migration data)
   and from the "force sync" button. */
export async function pushToRemote() {
  const data = {};
  for (const key of CRITICAL_KEYS) {
    const local = lsGet(key);
    if (local !== null) data[key] = local;
  }
  const count = Object.keys(data).length;
  if (count > 0) await remoteMSet(data);
  lsSet(LAST_SYNC_KEY, new Date().toISOString());
  return count;
}

export function getSyncStatus() {
  const last = lsGet(LAST_SYNC_KEY);
  return {
    lastSync:          last,
    lastSyncFormatted: last ? new Date(last).toLocaleString("it-IT") : "mai",
    isOnline:          typeof navigator !== "undefined" ? navigator.onLine : true,
  };
}

/* Lists used by the danger-zone reset and the sync surface. */
export const STORAGE_KEYS = {
  critical:  [...CRITICAL_KEYS],
  ephemeral: [...EPHEMERAL_KEYS],
};

/* Wipe everything — both locally and on Upstash. Called from the
   danger-zone confirmation in SettingsSheet. */
export async function wipeAllData() {
  const allKeys = [...CRITICAL_KEYS, ...EPHEMERAL_KEYS, "_upstash_migration_done", LAST_SYNC_KEY];
  for (const key of allKeys) lsDel(key);
  await Promise.allSettled([...CRITICAL_KEYS].map((k) => remoteDelete(k)));
}
