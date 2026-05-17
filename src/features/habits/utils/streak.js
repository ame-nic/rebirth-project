/* Pure functions over the habit log. No I/O, no React.

   "Skip" semantics: a skipped day doesn't increment the streak but also
   doesn't break it (use case: travel, illness). Future-dated cells in
   the contribution graph render transparent. */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function dateNDaysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export function formatDate(d) {
  return d.toISOString().split("T")[0];
}

export function computeStreak(habitId, logs) {
  const map = new Map();
  for (const l of logs) {
    if (l.habitId !== habitId) continue;
    map.set(l.date, l);
  }

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(cursor);
    const log = map.get(dateStr);
    const isToday = i === 0;

    if (log?.done) {
      streak++;
    } else if (log?.skipped) {
      // skipped — neutral, no increment, no break
    } else if (isToday) {
      // today not yet done — don't break, don't count
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeBestStreak(habitId, logs) {
  const map = new Map();
  for (const l of logs) {
    if (l.habitId !== habitId) continue;
    map.set(l.date, l);
  }

  let best = 0;
  let current = 0;
  // Walk back 365 days
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const log = map.get(formatDate(cursor));
    if (log?.done) {
      current++;
      if (current > best) best = current;
    } else if (log?.skipped) {
      // neutral
    } else {
      current = 0;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return best;
}

/* Build a grid of W weeks × 7 days, oldest week first. Each cell carries
   the date string + whether it was done/skipped/future. The grid ends on
   Sunday of the current week so the most recent column always represents
   the active week. */
export function buildWeekGrid(habitId, logs, weeks = 12) {
  const map = new Map();
  for (const l of logs) {
    if (l.habitId !== habitId) continue;
    map.set(l.date, l);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = today.getDay(); // 0=Sun, 1=Mon, ...
  // Anchor to the most recent Sunday so the rightmost column = current week
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() + (todayDow === 0 ? 0 : 7 - todayDow));

  const grid = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(lastSunday);
      cell.setDate(lastSunday.getDate() - (w * 7 + (6 - d)));
      const dateStr = formatDate(cell);
      const log = map.get(dateStr);
      week.push({
        date:    dateStr,
        done:    !!log?.done,
        skipped: !!log?.skipped,
        future:  cell > today,
      });
    }
    grid.push(week);
  }
  return grid;
}

/* Last 7 days as an array, oldest first — used for the inline dot row. */
export function last7Days(habitId, logs) {
  const map = new Map();
  for (const l of logs) {
    if (l.habitId !== habitId) continue;
    map.set(l.date, l);
  }
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = dateNDaysAgo(i);
    const dateStr = formatDate(d);
    const log = map.get(dateStr);
    out.push({ date: dateStr, done: !!log?.done, skipped: !!log?.skipped, future: d > new Date() });
  }
  return out;
}

/* 30-day completion rate, 0–1. Excludes future days. */
export function completionRate30d(habitId, logs) {
  const map = new Map();
  for (const l of logs) {
    if (l.habitId !== habitId) continue;
    map.set(l.date, l);
  }
  let done = 0;
  let total = 0;
  for (let i = 0; i < 30; i++) {
    const d = dateNDaysAgo(i);
    if (d > new Date()) continue;
    const log = map.get(formatDate(d));
    total++;
    if (log?.done) done++;
  }
  return total === 0 ? 0 : done / total;
}

/* Total done-checks across all time for this habit. */
export function totalCheckins(habitId, logs) {
  let n = 0;
  for (const l of logs) {
    if (l.habitId === habitId && l.done) n++;
  }
  return n;
}

/* Drop logs older than `days` days. Keeps storage bounded at ~1 year. */
export function pruneOldLogs(logs, days = 365) {
  if (!Array.isArray(logs)) return [];
  const cutoff = dateNDaysAgo(days);
  return logs.filter((l) => new Date(l.date) >= cutoff);
}

/* Weekly aggregate for one habit: { done, possible, ratio }. `weekOffset`=0
   is the current week (Mon-Sun), 1 is last week, etc. */
export function weeklyStats(habitId, logs, weekOffset = 0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1; // Mon=0..Sun=6
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dow - weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const map = new Map();
  for (const l of logs) {
    if (l.habitId === habitId) map.set(l.date, l);
  }

  let done = 0;
  let possible = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    if (d > today) continue;
    possible++;
    const log = map.get(formatDate(d));
    if (log?.done) done++;
  }
  return { done, possible, ratio: possible === 0 ? 0 : done / possible };
}

export const _testing = { MS_PER_DAY };
