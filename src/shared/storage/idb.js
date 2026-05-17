/* IndexedDB wrapper for the feed cache. Sync localStorage blocks the
   main thread under load — moving the feed payload (potentially 100s of
   KB) to IDB keeps scrolling smooth even while a refresh is in flight.

   Only large, frequently-rewritten data goes here. Small user prefs
   (workout log, weight log, feed sources, read IDs) stay on localStorage. */

import { openDB } from "idb";

const DB_NAME    = "rebirth-feed-cache";
const STORE_NAME = "cache";
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function idbGet(key) {
  try {
    const db = await getDB();
    return await db.get(STORE_NAME, key);
  } catch {
    return undefined;
  }
}

export async function idbSet(key, value) {
  try {
    const db = await getDB();
    await db.put(STORE_NAME, value, key);
    return true;
  } catch {
    return false;
  }
}

export async function idbDelete(key) {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
    return true;
  } catch {
    return false;
  }
}

export async function idbKeys() {
  try {
    const db = await getDB();
    return await db.getAllKeys(STORE_NAME);
  } catch {
    return [];
  }
}

/* Evict any entry whose fetchedAt is older than maxAge ms.
   Bounded loop — only the keys we have, not a scan over the whole DB. */
export async function idbEvict(maxAge = 48 * 60 * 60 * 1000) {
  try {
    const db   = await getDB();
    const keys = await db.getAllKeys(STORE_NAME);
    const now  = Date.now();
    let removed = 0;
    for (const key of keys) {
      const entry = await db.get(STORE_NAME, key);
      const ts = entry?.fetchedAt ? new Date(entry.fetchedAt).getTime() : 0;
      if (ts && now - ts > maxAge) {
        await db.delete(STORE_NAME, key);
        removed++;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}
