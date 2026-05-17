/* Sequential storage migrations.

   Used for structural changes: renaming a field, changing its type,
   reshaping an object, splitting one key into many. Each migration has
   a unique numeric id and runs at most once per device — the executed
   set lives in localStorage under `_migrations_executed`.

   Migrations are invisible to the user: they run during App.jsx
   bootstrap before the splash unlocks. A failed migration logs the
   error and is skipped so the app still boots; rerun next launch.

   Rules — see CLAUDE.md → "REGOLE DI MIGRAZIONE".
   - Never reuse an id, never edit a migration that has already shipped.
   - For breaking shape changes, version the key (foo_v5 → foo_v6) and
     have the migration copy + transform in one pass. */

import { storageLoad, storageSave, storageDelete } from "./index.js";

const EXECUTED_KEY = "_migrations_executed";

function lsGetExecuted() {
  try {
    const raw = localStorage.getItem(EXECUTED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function lsSetExecuted(ids) {
  try { localStorage.setItem(EXECUTED_KEY, JSON.stringify(ids)); }
  catch { /* full disk — we'll retry next launch */ }
}

/* Append migrations here, never edit existing entries. ids must be
   strictly increasing. Run signature: ({ storageLoad, storageSave }). */
const MIGRATIONS = [
  {
    id: 0,
    description: "Migration system smoke test — no-op marker that proves the runner ran.",
    run: async () => {
      // Intentionally a no-op. Existence + bookkeeping is the whole point;
      // future migrations rely on this slot being present so #1 lands cleanly.
    },
  },
  {
    id: 1,
    description:
      "Remove Apple Health bridge — delete health snapshots and HRV baseline " +
      "from both localStorage and Upstash. Readiness and AI assessment now " +
      "rely only on user-entered data.",
    run: async () => {
      // storageDelete drops the local copy and (for keys that were in
      // CRITICAL_KEYS *before* this migration) also DELETEs them on
      // Upstash. We can't rely on the live CRITICAL_KEYS set here — it
      // already excludes the legacy keys — so call the remote DELETE
      // unconditionally.
      try { localStorage.removeItem("rebirth_health_snapshots"); } catch { /* ignore */ }
      try { localStorage.removeItem("rebirth_hrv_baseline"); } catch { /* ignore */ }
      // Fire-and-forget the remote wipes. Failures are non-fatal — the
      // migration is marked done either way; remote DELETE is idempotent
      // and there's nothing to retry if Upstash never had the key.
      const endpoint = "/api/storage";
      const token = import.meta.env.VITE_APP_STORAGE_TOKEN ?? "";
      const headers = token ? { "x-app-token": token } : {};
      try { await fetch(`${endpoint}?key=rebirth_health_snapshots`, { method: "DELETE", headers }); } catch { /* ignore */ }
      try { await fetch(`${endpoint}?key=rebirth_hrv_baseline`, { method: "DELETE", headers }); } catch { /* ignore */ }
      // Touch the unused symbols so the linter doesn't object — they're
      // available for future migrations even though this one doesn't
      // need them.
      void storageLoad; void storageSave; void storageDelete;
    },
  },
  {
    id: 2,
    description:
      "Remove alter ego feature — delete rebirth_alter_ego from " +
      "localStorage and Upstash, and drop the local-only weekly AI " +
      "message cache that fed it.",
    run: async () => {
      try { localStorage.removeItem("rebirth_alter_ego"); } catch { /* ignore */ }
      try { localStorage.removeItem("rebirth_weekly_ai_message"); } catch { /* ignore */ }
      const endpoint = "/api/storage";
      const token = import.meta.env.VITE_APP_STORAGE_TOKEN ?? "";
      const headers = token ? { "x-app-token": token } : {};
      try { await fetch(`${endpoint}?key=rebirth_alter_ego`, { method: "DELETE", headers }); } catch { /* ignore */ }
    },
  },
];

export async function runPendingMigrations() {
  const executed = new Set(lsGetExecuted());
  const ctx = { storageLoad, storageSave };
  let dirty = false;

  for (const m of MIGRATIONS) {
    if (executed.has(m.id)) continue;
    try {
      await m.run(ctx);
      executed.add(m.id);
      dirty = true;
    } catch (err) {
      // Log + skip. We don't block boot, and we don't mark as executed
      // so the next launch retries. Migrations must be idempotent so
      // re-running is safe even after a partial application.
      console.error(`[migrations] #${m.id} failed:`, err);
    }
  }

  if (dirty) lsSetExecuted([...executed]);
}

// Exposed for the docs + sanity checks; not used at runtime.
export const __MIGRATION_IDS = MIGRATIONS.map((m) => m.id);
