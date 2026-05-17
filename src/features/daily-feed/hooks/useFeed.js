import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { DEFAULT_SOURCES } from "../data/defaultSources.js";
import { fetchSourceItems } from "../services/fetchSource.js";
import { fetchWeather } from "../services/fetchWeather.js";
import {
  readCache,
  writeCache,
  revalidateInBackground,
  evictOldEntries,
  purgeLegacyLocalStorageCache,
} from "../services/cache.js";
import { mark, measure } from "../../../shared/perf.js";

const KEY_SOURCES   = "rebirth_feed_sources";
const KEY_READ      = "rebirth_feed_read";
const KEY_LAST_DAY  = "rebirth_feed_last_day";
const READ_CAP      = 500;

const todayKey = () => new Date().toISOString().slice(0, 10);

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Append any DEFAULT_SOURCES not already present in stored (by id).
// Existing entries keep their full state untouched.
function mergeWithDefaults(stored, defaults) {
  if (!stored || stored.length === 0) return [...defaults];
  const ids = new Set(stored.map((s) => s.id));
  const additions = defaults.filter((d) => !ids.has(d.id));
  if (additions.length === 0) return stored;
  return [...stored, ...additions];
}

function dedupAndSort(items) {
  const seen = new Set();
  const deduped = items.filter((i) => {
    if (!i?.id || seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
  deduped.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return deduped;
}

export function useFeed() {
  const [sources, setSources]           = useState([]);
  const [items, setItems]               = useState([]);
  const [weather, setWeather]           = useState(null);
  const [readIds, setReadIds]           = useState([]);
  const [filter, setFilter]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [errorSources, setErrorSources] = useState([]);
  const [initialised, setInitialised]   = useState(false);

  // Latch sources so the feed:updated handler always reads the latest.
  const sourcesRef = useRef(sources);
  useEffect(() => { sourcesRef.current = sources; }, [sources]);

  // Hydrate from storage + run cache maintenance in the background.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      storageLoad(KEY_SOURCES, []),
      storageLoad(KEY_READ, []),
    ]).then(([stored, r]) => {
      if (cancelled) return;
      const merged = mergeWithDefaults(stored, DEFAULT_SOURCES);
      setSources(merged);
      setReadIds(r);
      setInitialised(true);
      if (merged.length !== stored.length) {
        storageSave(KEY_SOURCES, merged);
      }
    });

    // Fire-and-forget maintenance — don't block first paint.
    evictOldEntries().catch(() => {});
    purgeLegacyLocalStorageCache();

    return () => { cancelled = true; };
  }, []);

  // Re-paint when a background revalidation completes.
  const repaintFromCache = useCallback(async () => {
    const sources = sourcesRef.current;
    const enabled    = sources.filter((s) => s.enabled);
    const itemSrcs   = enabled.filter((s) => s.type !== "weather");
    const weatherSrc = enabled.find((s) => s.type === "weather");

    const caches = await Promise.all(itemSrcs.map((s) => readCache(s)));
    const allItems = caches.flatMap((c) => c?.items ?? []);
    setItems(dedupAndSort(allItems));

    if (weatherSrc) {
      const wc = await readCache(weatherSrc);
      if (wc?.items) setWeather(wc.items);
    }
  }, []);

  useEffect(() => {
    function onUpdate() { repaintFromCache(); }
    if (typeof window === "undefined") return;
    window.addEventListener("feed:updated", onUpdate);
    return () => window.removeEventListener("feed:updated", onUpdate);
  }, [repaintFromCache]);

  const refresh = useCallback(async (forceRefresh = false) => {
    mark("feed:refresh:start");
    setLoading(true);
    setError(null);
    setErrorSources([]);

    const enabled     = sources.filter((s) => s.enabled);
    const weatherSrc  = enabled.find((s) => s.type === "weather");
    const itemSources = enabled.filter((s) => s.type !== "weather");

    // ── PHASE 1: instant paint from cache (fresh or stale) ──────────────
    const cachedReads = await Promise.all(
      itemSources.map((s) => readCache(s).then((cached) => ({ source: s, cached })))
    );
    const initialItems = cachedReads.flatMap(({ cached }) => cached?.items ?? []);
    if (initialItems.length > 0) {
      setItems(dedupAndSort(initialItems));
    }

    if (weatherSrc) {
      const wc = await readCache(weatherSrc);
      if (wc?.items) setWeather(wc.items);
    }

    mark("feed:refresh:cache-painted");

    // ── PHASE 2: parallel fetch for stale or missing sources ────────────
    const itemFetches = cachedReads.map(({ source, cached }) => {
      if (cached && !cached.stale && !forceRefresh) {
        return Promise.resolve({ ok: true, source, items: cached.items });
      }
      if (cached && !forceRefresh) {
        // Stale — fire background revalidation. The feed:updated listener
        // will repaint when fresh data lands. Return the stale items so
        // they participate in this round's dedup/sort.
        revalidateInBackground(source, fetchSourceItems);
        return Promise.resolve({ ok: true, source, items: cached.items });
      }
      // Missing OR forced — must wait for network.
      return fetchSourceItems(source)
        .then(async (items) => {
          await writeCache(source, items);
          return { ok: true, source, items };
        })
        .catch((err) => ({ ok: false, source, error: err }));
    });

    const weatherFetch = weatherSrc
      ? (async () => {
          const cached = await readCache(weatherSrc);
          if (cached && !cached.stale && !forceRefresh) {
            return { ok: true, weather: cached.items };
          }
          if (cached && !forceRefresh) {
            revalidateInBackground(weatherSrc, fetchWeather);
            return { ok: true, weather: cached.items };
          }
          try {
            const w = await fetchWeather(weatherSrc);
            await writeCache(weatherSrc, w);
            return { ok: true, weather: w };
          } catch (err) {
            return { ok: false, error: err };
          }
        })()
      : Promise.resolve(null);

    const [itemResults, weatherResult] = await Promise.all([
      Promise.all(itemFetches),
      weatherFetch,
    ]);

    const fails = [];
    const collected = [];
    itemResults.forEach((r) => {
      if (r.ok) collected.push(...r.items);
      else      fails.push(r.source.id);
    });
    setItems(dedupAndSort(collected));

    if (weatherResult) {
      if (weatherResult.ok && weatherResult.weather) setWeather(weatherResult.weather);
      else if (!weatherResult.ok) fails.push(weatherSrc.id);
    }

    setErrorSources(fails);
    if (fails.length === itemResults.length + (weatherSrc ? 1 : 0)) {
      setError("Nessuna fonte disponibile.");
    }

    await storageSave(KEY_LAST_DAY, todayKey());
    setLoading(false);

    mark("feed:refresh:done");
    measure("feed:refresh", "feed:refresh:start", "feed:refresh:done");
  }, [sources]);

  // Auto-refresh when sources hydrate; force on calendar-day rollover.
  useEffect(() => {
    if (!initialised || sources.length === 0) return;
    let cancelled = false;
    (async () => {
      const lastDay = await storageLoad(KEY_LAST_DAY, null);
      const isNewDay = lastDay !== todayKey();
      if (cancelled) return;
      refresh(isNewDay);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialised]);

  // ── Mutations ────────────────────────────────────────────────────────
  const persistSources = useCallback(async (next) => {
    setSources(next);
    await storageSave(KEY_SOURCES, next);
  }, []);

  const addSource = useCallback(async (partial) => {
    const order = sources.reduce((m, s) => Math.max(m, s.order ?? 0), 0) + 1;
    const created = { id: genId(), enabled: true, order, ...partial };
    await persistSources([...sources, created]);
    return created;
  }, [sources, persistSources]);

  const updateSource = useCallback(async (id, patch) => {
    await persistSources(sources.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, [sources, persistSources]);

  const toggleSource = useCallback(async (id) => {
    await persistSources(sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }, [sources, persistSources]);

  const removeSource = useCallback(async (id) => {
    await persistSources(sources.filter((s) => s.id !== id));
  }, [sources, persistSources]);

  const reorderSource = useCallback(async (id, direction) => {
    const sorted = [...sources].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    const newSources = sources.map((s) => {
      if (s.id === a.id) return { ...s, order: b.order };
      if (s.id === b.id) return { ...s, order: a.order };
      return s;
    });
    await persistSources(newSources);
  }, [sources, persistSources]);

  const markRead = useCallback(async (itemId) => {
    setReadIds((prev) => {
      if (prev.includes(itemId)) return prev;
      const next = [...prev, itemId].slice(-READ_CAP);
      storageSave(KEY_READ, next).catch(() => {});
      return next;
    });
  }, []);

  // ── Derived (memoized so re-renders stay cheap) ──────────────────────
  const filteredItems = useMemo(
    () => filter ? items.filter((i) => i.category === filter) : items,
    [items, filter],
  );

  const readSet = useMemo(() => new Set(readIds), [readIds]);

  const itemsWithRead = useMemo(
    () => filteredItems.map((i) => ({ ...i, read: readSet.has(i.id) })),
    [filteredItems, readSet],
  );

  const unreadCount = useMemo(
    () => items.reduce((n, i) => n + (readSet.has(i.id) ? 0 : 1), 0),
    [items, readSet],
  );

  const categories = useMemo(
    () => [...new Set(
      sources.filter((s) => s.enabled && s.type !== "weather").map((s) => s.category)
    )],
    [sources],
  );

  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [sources],
  );

  return {
    sources: sortedSources,
    items: itemsWithRead,
    weather,
    loading,
    error,
    errorSources,
    filter,
    setFilter,
    categories,
    unreadCount,
    refresh,
    addSource,
    updateSource,
    toggleSource,
    removeSource,
    reorderSource,
    markRead,
  };
}
