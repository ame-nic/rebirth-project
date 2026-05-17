import { useCallback, useEffect, useMemo, useState } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { todayStr } from "../../habits/utils/streak.js";

const STORAGE_KEY = "rebirth_measurements";
const MS_PER_DAY  = 24 * 60 * 60 * 1000;

function sortByDateAsc(entries) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

export function useMeasurements() {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    let cancelled = false;
    storageLoad(STORAGE_KEY, []).then((m) => {
      if (cancelled) return;
      setMeasurements(sortByDateAsc(Array.isArray(m) ? m : []));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  /* Same-date entries overwrite. Convention: one measurement per day. */
  const addMeasurement = useCallback(async (partial) => {
    const entry = { date: todayStr(), notes: "", ...partial };
    const next = sortByDateAsc([
      ...measurements.filter((m) => m.date !== entry.date),
      entry,
    ]);
    setMeasurements(next);
    await storageSave(STORAGE_KEY, next);
    return entry;
  }, [measurements]);

  const removeMeasurement = useCallback(async (date) => {
    const next = measurements.filter((m) => m.date !== date);
    setMeasurements(next);
    await storageSave(STORAGE_KEY, next);
  }, [measurements]);

  const latest = useMemo(
    () => measurements.length > 0 ? measurements[measurements.length - 1] : null,
    [measurements],
  );

  const previous = useMemo(
    () => measurements.length > 1 ? measurements[measurements.length - 2] : null,
    [measurements],
  );

  const first = useMemo(
    () => measurements.length > 0 ? measurements[0] : null,
    [measurements],
  );

  /* Time-since calculation is exposed as a function rather than a
     memoized value so the impure Date.now() read happens at call-site,
     not during the hook's render. Callers invoke it when displaying
     "X days ago"; the result is read-once and doesn't need to react. */
  function getDaysSinceLastMeasurement() {
    if (!latest) return null;
    return Math.floor((Date.now() - new Date(latest.date).getTime()) / MS_PER_DAY);
  }

  return {
    measurements,
    latest,
    previous,
    first,
    loading,
    getDaysSinceLastMeasurement,
    addMeasurement,
    removeMeasurement,
  };
}
