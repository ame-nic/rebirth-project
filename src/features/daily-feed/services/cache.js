/* localStorage-backed cache for feed responses.
   Keeps free-tier proxies (rss2json, Open-Meteo) under their daily quotas
   and makes the feed instant after the first paint. */

import { storageLoad, storageSave } from "../../../shared/storage/index.js";

export const CACHE_TTL = {
  weather: 30 * 60 * 1000,       // 30 minutes
  rss:      4 * 60 * 60 * 1000,  // 4 hours
  reddit:   2 * 60 * 60 * 1000,  // 2 hours
};

const cacheKey = (sourceId) => `feed_cache_${sourceId}`;

export async function readCache(source) {
  const cached = await storageLoad(cacheKey(source.id), null);
  if (!cached) return null;
  const age = Date.now() - new Date(cached.fetchedAt).getTime();
  const ttl = CACHE_TTL[source.type] ?? 60 * 60 * 1000;
  if (age > ttl) return { stale: true, items: cached.items };
  return { stale: false, items: cached.items };
}

export async function writeCache(source, items) {
  await storageSave(cacheKey(source.id), {
    fetchedAt: new Date().toISOString(),
    items,
  });
}

/* Return fresh-or-stale-cached items, or fetch when there's nothing usable.
   `forceRefresh` bypasses the freshness check but still falls back to stale
   cache on fetch failure. */
export async function getCachedOrFetch(source, fetcher, { forceRefresh = false } = {}) {
  const cached = await readCache(source);
  if (cached && !cached.stale && !forceRefresh) return cached.items;

  try {
    const items = await fetcher(source);
    await writeCache(source, items);
    return items;
  } catch (err) {
    if (cached) return cached.items;   // return stale rather than crash
    throw err;
  }
}
