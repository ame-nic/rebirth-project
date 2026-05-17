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

import { storageLoad, storageSave } from "./index.js";

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
