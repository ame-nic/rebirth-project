/* Per-article AI summary cache.

   Local-only (the key is in EPHEMERAL_KEYS). Cap at 200 entries —
   newest first when we prune — so a heavy day on the feed doesn't
   blow up localStorage. Reads return null on miss; the caller does
   the AI call and writes the result back. */

import { storageLoad, storageSave } from "../../../shared/storage/index.js";

const STORAGE_KEY = "rebirth_feed_summaries";
const MAX_ENTRIES = 200;

let cache = null;
let loadPromise = null;

async function ensureLoaded() {
  if (cache) return cache;
  if (!loadPromise) {
    loadPromise = storageLoad(STORAGE_KEY, {}).then((data) => {
      cache = data && typeof data === "object" && !Array.isArray(data) ? data : {};
      return cache;
    });
  }
  return loadPromise;
}

export async function getSummary(id) {
  if (!id) return null;
  const c = await ensureLoaded();
  return c[id]?.text ?? null;
}

export async function setSummary(id, text) {
  if (!id || !text) return;
  const c = await ensureLoaded();
  c[id] = { text, generatedAt: new Date().toISOString() };

  // Prune to the most recent MAX_ENTRIES if we've grown past the cap.
  const entries = Object.entries(c);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) =>
      (b[1].generatedAt || "").localeCompare(a[1].generatedAt || ""),
    );
    cache = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
  }

  await storageSave(STORAGE_KEY, cache);
}
