/* IDB-backed feed cache with stale-while-revalidate.

   The feed payload is the heaviest data in the app (potentially hundreds
   of KB across enabled sources). Synchronous localStorage reads of that
   size measurably jank scrolling on iOS Safari — moving it to IndexedDB
   keeps the main thread free.

   SWR pattern: callers get fresh-or-stale cache items immediately.
   When the cache is stale, a background revalidation fires and emits
   a `feed:updated` CustomEvent that the UI listens for. */

import { idbGet, idbSet, idbDelete, idbKeys, idbEvict } from "../../../shared/storage/idb.js";

export const CACHE_TTL = {
  weather: 30 * 60 * 1000,        // 30 minutes
  rss:      4 * 60 * 60 * 1000,   // 4 hours
  reddit:   2 * 60 * 60 * 1000,   // 2 hours
};

const cacheKey = (sourceId) => `feed_cache_${sourceId}`;

export async function readCache(source) {
  const entry = await idbGet(cacheKey(source.id));
  if (!entry) return null;
  const age = Date.now() - new Date(entry.fetchedAt).getTime();
  const ttl = CACHE_TTL[source.type] ?? 60 * 60 * 1000;
  return { stale: age > ttl, items: entry.items, fetchedAt: entry.fetchedAt };
}

export async function writeCache(source, items) {
  await idbSet(cacheKey(source.id), {
    fetchedAt: new Date().toISOString(),
    items,
  });
}

/* In-flight revalidation registry: one revalidation per source at a time
   so a fast tab-switch + manual refresh doesn't fire two parallel fetches. */
const revalidating = new Map();

function dispatchUpdated(sourceId) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("feed:updated", { detail: { sourceId } }));
}

export function revalidateInBackground(source, fetcher) {
  if (revalidating.has(source.id)) return revalidating.get(source.id);
  const p = (async () => {
    try {
      const items = await fetcher(source);
      await writeCache(source, items);
      dispatchUpdated(source.id);
      return items;
    } catch {
      // Background revalidation failure is silent — we already have stale data on screen.
      return null;
    } finally {
      revalidating.delete(source.id);
    }
  })();
  revalidating.set(source.id, p);
  return p;
}

/* Stale-while-revalidate: returns `{ items, fromCache, stale }` synchronously
   relative to network. If a fresh cache hit, we return it without touching
   the network. If stale, we return cached AND fire revalidate. If absent,
   we await the network call. */
export async function fetchWithSWR(source, fetcher, { forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = await readCache(source);
    if (cached && !cached.stale) {
      return { items: cached.items, fromCache: true, stale: false };
    }
    if (cached && cached.stale) {
      revalidateInBackground(source, fetcher);
      return { items: cached.items, fromCache: true, stale: true };
    }
  }

  // No cache (or forced) — must wait for network.
  const items = await fetcher(source);
  await writeCache(source, items);
  return { items, fromCache: false, stale: false };
}

/* Drop in replacement for the old getCachedOrFetch API, kept for any
   call site that doesn't care about the SWR metadata. */
export async function getCachedOrFetch(source, fetcher, { forceRefresh = false } = {}) {
  try {
    const { items } = await fetchWithSWR(source, fetcher, { forceRefresh });
    return items;
  } catch (err) {
    // On a hard fetch failure with no cache, surface the error so the
    // caller can record it in errorSources.
    const cached = await readCache(source);
    if (cached) return cached.items; // graceful: return stale rather than throw
    throw err;
  }
}

/* ── Eviction + maintenance ─────────────────────────────────────────── */

export async function evictOldEntries(maxAgeMs = 48 * 60 * 60 * 1000) {
  return idbEvict(maxAgeMs);
}

/* One-time migration helper: clear pre-IDB cache entries that may still
   be in localStorage from older builds. No-op on fresh installs. */
export function purgeLegacyLocalStorageCache() {
  if (typeof localStorage === "undefined") return 0;
  let removed = 0;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("feed_cache_")) {
        localStorage.removeItem(k);
        removed++;
      }
    }
  } catch {
    /* private mode etc. */
  }
  return removed;
}

export { idbKeys, idbDelete }; // re-export for debugging tools
