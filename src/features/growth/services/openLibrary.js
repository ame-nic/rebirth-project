/* OpenLibrary search — public, no API key, no rate-limit hardcoded.
   We still cache results in IndexedDB for 7 days so the user can re-search
   a recent query without network roundtrip. */

import { idbGet, idbSet } from "../../../shared/storage/idb.js";
import { resilientFetch } from "../../../shared/utils/fetchUtils.js";

const SEARCH_URL = "https://openlibrary.org/search.json";
const TTL_MS     = 7 * 24 * 60 * 60 * 1000;

function cacheKey(query) {
  return `ol_search_${query.trim().toLowerCase()}`;
}

export async function searchBooks(query) {
  const q = query?.trim();
  if (!q || q.length < 2) return [];

  const key = cacheKey(q);
  const cached = await idbGet(key);
  if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < TTL_MS) {
    return cached.results;
  }

  let results;
  try {
    const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&limit=5&fields=key,title,author_name,cover_i,first_publish_year`;
    const res = await resilientFetch(url, {}, { retries: 1 });
    if (!res.ok) throw new Error(`OpenLibrary ${res.status}`);
    const data = await res.json();
    results = (data.docs ?? []).map((b) => ({
      ol_key:    b.key,
      title:     b.title,
      author:    b.author_name?.[0] ?? "Autore sconosciuto",
      cover_url: b.cover_i
        ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
        : null,
      year:      b.first_publish_year,
    }));
  } catch {
    // Network failed — return stale cache when available, empty otherwise.
    if (cached) return cached.results;
    return [];
  }

  await idbSet(key, { fetchedAt: new Date().toISOString(), results });
  return results;
}
