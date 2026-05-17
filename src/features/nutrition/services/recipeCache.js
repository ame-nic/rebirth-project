/* TTL-based localStorage cache shared by the recipe services. Each
   external API has tight free-tier quotas, so we want aggressive cache
   hits and graceful fallback to stale data on fetch failure. */

import { storageLoad, storageSave } from "../../../shared/storage/index.js";

export const TTL = {
  spoonacular: 24 * 60 * 60 * 1000,      // 24h
  mealdb:      24 * 60 * 60 * 1000,      // 24h
  usda:         7 * 24 * 60 * 60 * 1000, // 7d (ingredient macros barely change)
};

export async function getCached(cacheKey, ttlMs) {
  const cached = await storageLoad(cacheKey, null);
  if (!cached) return null;
  const age = Date.now() - new Date(cached.fetchedAt).getTime();
  if (age > ttlMs) return { stale: true, value: cached.value };
  return { stale: false, value: cached.value };
}

export async function setCached(cacheKey, value) {
  await storageSave(cacheKey, { fetchedAt: new Date().toISOString(), value });
}

/* Wrap a fetcher: return fresh-or-still-warm cache hit, otherwise call
   the fetcher and persist the result. Falls back to stale cache on any
   thrown error — never let an API outage blank the feature. */
export async function getCachedOrFetch(cacheKey, fetcher, ttlMs) {
  const hit = await getCached(cacheKey, ttlMs);
  if (hit && !hit.stale) return hit.value;
  try {
    const value = await fetcher();
    await setCached(cacheKey, value);
    return value;
  } catch (err) {
    if (hit) return hit.value; // stale-but-better-than-nothing
    throw err;
  }
}
