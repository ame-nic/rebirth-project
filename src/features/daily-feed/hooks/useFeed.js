import { useState, useEffect, useCallback } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { DEFAULT_SOURCES } from "../data/defaultSources.js";
import { fetchSourceItems } from "../services/fetchSource.js";
import { fetchWeather } from "../services/fetchWeather.js";
import { getCachedOrFetch } from "../services/cache.js";

const KEY_SOURCES   = "rebirth_feed_sources";
const KEY_READ      = "rebirth_feed_read";
const KEY_LAST_DAY  = "rebirth_feed_last_day";
const READ_CAP      = 500;

const todayKey = () => new Date().toISOString().slice(0, 10);

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `src_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useFeed() {
  const [sources, setSources]             = useState([]);
  const [items, setItems]                 = useState([]);
  const [weather, setWeather]             = useState(null);
  const [readIds, setReadIds]             = useState([]);
  const [filter, setFilter]               = useState(null);   // null = "Tutti"
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [errorSources, setErrorSources]   = useState([]);     // source.id[] that failed this run
  const [initialised, setInitialised]     = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      storageLoad(KEY_SOURCES, DEFAULT_SOURCES),
      storageLoad(KEY_READ, []),
    ]).then(([s, r]) => {
      if (cancelled) return;
      setSources(s.length ? s : DEFAULT_SOURCES);
      setReadIds(r);
      setInitialised(true);
    });
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setErrorSources([]);

    const enabled = sources.filter((s) => s.enabled);
    const weatherSrc = enabled.find((s) => s.type === "weather");
    const itemSources = enabled.filter((s) => s.type !== "weather");

    const tasks = itemSources.map((s) =>
      getCachedOrFetch(s, fetchSourceItems, { forceRefresh })
        .then((items) => ({ ok: true, source: s, items }))
        .catch((err) => ({ ok: false, source: s, error: err }))
    );

    const weatherTask = weatherSrc
      ? getCachedOrFetch(weatherSrc, fetchWeather, { forceRefresh })
          .then((w) => ({ ok: true, source: weatherSrc, weather: w }))
          .catch((err) => ({ ok: false, source: weatherSrc, error: err }))
      : Promise.resolve(null);

    const [itemsResults, weatherResult] = await Promise.all([
      Promise.all(tasks),
      weatherTask,
    ]);

    const fails = [];
    const collected = [];
    itemsResults.forEach((r) => {
      if (r.ok) collected.push(...r.items);
      else      fails.push(r.source.id);
    });

    // dedup + sort newest first
    const seen = new Set();
    const deduped = collected.filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    deduped.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    setItems(deduped);

    if (weatherResult) {
      if (weatherResult.ok) setWeather(weatherResult.weather);
      else fails.push(weatherResult.source.id);
    }

    setErrorSources(fails);
    if (fails.length === itemsResults.length + (weatherSrc ? 1 : 0)) {
      setError("Nessuna fonte disponibile.");
    }

    await storageSave(KEY_LAST_DAY, todayKey());
    setLoading(false);
  }, [sources]);

  // Auto-refresh once sources are loaded, and force-refresh on calendar-day change
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

  // ── Mutations ──────────────────────────────────────────────────────────────
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
    if (readIds.includes(itemId)) return;
    const next = [...readIds, itemId].slice(-READ_CAP);
    setReadIds(next);
    await storageSave(KEY_READ, next);
  }, [readIds]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredItems = filter ? items.filter((i) => i.category === filter) : items;
  const itemsWithRead = filteredItems.map((i) => ({ ...i, read: readIds.includes(i.id) }));
  const unreadCount   = items.filter((i) => !readIds.includes(i.id)).length;

  const categories = [...new Set(
    sources.filter((s) => s.enabled && s.type !== "weather").map((s) => s.category)
  )];

  const sortedSources = [...sources].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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
