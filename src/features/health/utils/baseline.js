/* Pure functions over the health snapshot array. */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function pruneOldSnapshots(snapshots, days = 365) {
  if (!Array.isArray(snapshots)) return [];
  const cutoffMs = Date.now() - days * MS_PER_DAY;
  return snapshots.filter((s) => new Date(s.date).getTime() >= cutoffMs);
}

/* One snapshot per date. New entry replaces existing entry on the same
   date — useful when the Shortcut runs twice in a day or a manual edit
   overrides an earlier auto-sync. */
export function mergeSnapshot(snapshots, incoming) {
  const next = snapshots.filter((s) => s.date !== incoming.date);
  next.push(incoming);
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

export function todaySnapshot(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return null;
  const today = new Date().toISOString().slice(0, 10);
  return snapshots.find((s) => s.date === today) || null;
}

export function recentSnapshots(snapshots, n = 7) {
  if (!Array.isArray(snapshots)) return [];
  return snapshots.slice(-n);
}

export function computeHRVBaseline(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return null;
  const last7  = snapshots.slice(-7).filter((s) => Number.isFinite(s.hrv_ms));
  const last30 = snapshots.slice(-30).filter((s) => Number.isFinite(s.hrv_ms));
  if (last7.length < 3) return null;
  return {
    avg7d:  Math.round(last7.reduce((sum, s) => sum + s.hrv_ms, 0)  / last7.length),
    avg30d: last30.length > 0
      ? Math.round(last30.reduce((sum, s) => sum + s.hrv_ms, 0) / last30.length)
      : null,
    sample_size_7d:  last7.length,
    sample_size_30d: last30.length,
    computed_at:     new Date().toISOString().slice(0, 10),
  };
}
