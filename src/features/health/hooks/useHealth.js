import { useCallback, useEffect, useMemo, useState } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { readHealthSyncFromURL } from "../services/healthBridge.js";
import {
  pruneOldSnapshots,
  mergeSnapshot,
  todaySnapshot,
  computeHRVBaseline,
} from "../utils/baseline.js";
import { todayStr } from "../../habits/utils/streak.js";

const KEY_SNAPSHOTS = "rebirth_health_snapshots";
const KEY_BASELINE  = "rebirth_hrv_baseline";

/* The Shortcut may invoke us before React mounts. We snapshot the URL
   query string at module load so the address bar is cleaned immediately,
   even before the hook's effect runs. The hook then applies the captured
   sync once storage is hydrated. */
const pendingFromURL = readHealthSyncFromURL();

export function useHealth() {
  const [snapshots, setSnapshots]   = useState([]);
  const [baseline, setBaseline]     = useState(null);
  const [lastSync, setLastSync]     = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      storageLoad(KEY_SNAPSHOTS, []),
      storageLoad(KEY_BASELINE, null),
    ]).then(async ([s, b]) => {
      if (cancelled) return;
      let pruned = pruneOldSnapshots(Array.isArray(s) ? s : []);
      let nextBaseline = b;

      if (pendingFromURL) {
        pruned = mergeSnapshot(pruned, pendingFromURL);
        nextBaseline = computeHRVBaseline(pruned) ?? nextBaseline;
        await Promise.all([
          storageSave(KEY_SNAPSHOTS, pruned),
          nextBaseline ? storageSave(KEY_BASELINE, nextBaseline) : Promise.resolve(),
        ]);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("health:synced", { detail: pendingFromURL }));
        }
      }

      setSnapshots(pruned);
      setBaseline(nextBaseline);
      setLastSync(pendingFromURL?.receivedAt ?? findLastSyncedAt(pruned));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const applySnapshot = useCallback(async (incoming) => {
    const normalized = { ...incoming, date: incoming.date || todayStr() };
    let nextSnapshots;
    setSnapshots((prev) => {
      nextSnapshots = mergeSnapshot(prev, normalized);
      return nextSnapshots;
    });
    // Persist + recompute baseline outside of the setter
    const merged = mergeSnapshot(snapshots, normalized);
    await storageSave(KEY_SNAPSHOTS, merged);
    const newBaseline = computeHRVBaseline(merged);
    if (newBaseline) {
      setBaseline(newBaseline);
      await storageSave(KEY_BASELINE, newBaseline);
    }
    setLastSync(new Date().toISOString());
  }, [snapshots]);

  /* Inject a believable test payload — used by the wizard's "Testa
     sincronizzazione" button so the user can verify the flow without
     having actually built their Shortcut yet. */
  const testSync = useCallback(async () => {
    await applySnapshot({
      date:            todayStr(),
      steps:           8234,
      sleep_hours:     7.5,
      hrv_ms:          62,
      resting_hr:      54,
      active_calories: 340,
      stand_hours:     9,
      source:          "manual",
      receivedAt:      new Date().toISOString(),
    });
  }, [applySnapshot]);

  const clearAll = useCallback(async () => {
    setSnapshots([]);
    setBaseline(null);
    setLastSync(null);
    await Promise.all([
      storageSave(KEY_SNAPSHOTS, []),
      storageSave(KEY_BASELINE, null),
    ]);
  }, []);

  const today = useMemo(() => todaySnapshot(snapshots), [snapshots]);

  return {
    snapshots,
    baseline,
    today,
    lastSync,
    loading,
    applySnapshot,
    testSync,
    clearAll,
  };
}

function findLastSyncedAt(snapshots) {
  if (!snapshots || snapshots.length === 0) return null;
  const newest = snapshots[snapshots.length - 1];
  return newest.receivedAt ?? newest.date;
}
