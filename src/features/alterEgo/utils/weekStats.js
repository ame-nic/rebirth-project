import { weeklyStats as habitWeeklyStats, computeStreak } from "../../habits/utils/streak.js";

/* Compute the weekStats payload the AI message generator expects.
   Kept separate from the component so React Fast Refresh stays clean. */
export function computeWeekStats({ workoutLog, habits, habitLogs, readinessLogs }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dow);

  const sessions = (workoutLog || []).filter((w) => new Date(w.date) >= weekStart).length;

  const active = (habits || []).filter((h) => !h.archived);
  let habitRate = 0;
  if (active.length > 0) {
    const totals = active.map((h) => habitWeeklyStats(h.id, habitLogs || [], 0));
    const ratio = totals.reduce((s, t) => s + t.ratio, 0) / active.length;
    habitRate = Math.round(ratio * 100);
  }

  const r7 = (readinessLogs || []).filter((r) => new Date(r.date) >= weekStart);
  const avgReadiness = r7.length === 0 ? null : +(r7.reduce((s, r) => s + r.score, 0) / r7.length).toFixed(1);

  const longestStreak = active.reduce((m, h) => Math.max(m, computeStreak(h.id, habitLogs || [])), 0);

  return { sessions, habitRate, avgReadiness, longestStreak };
}
