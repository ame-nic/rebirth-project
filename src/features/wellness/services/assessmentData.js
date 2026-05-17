/* Cross-feature data collector for the AI Expert Assessment.

   Reads from storage rather than asking the caller to lift state for
   six separate features. Single point of access keeps the App.jsx
   orchestration thin. */

import { storageLoad } from "../../../shared/storage/index.js";
import { todayStr } from "../../habits/utils/streak.js";

const PRIMARY_LIFTS = ["squat", "bench", "deadlift", "ohp"];

function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function deriveProgramWeek(workoutLog) {
  if (!Array.isArray(workoutLog) || workoutLog.length === 0) return 1;
  const sorted = [...workoutLog].sort((a, b) => a.date.localeCompare(b.date));
  const first  = new Date(sorted[0].date).getTime();
  const weeks  = Math.floor((Date.now() - first) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(12, Math.max(1, weeks));
}

function progressionByExercise(workoutLog) {
  const out = {};
  for (const exId of PRIMARY_LIFTS) {
    const points = workoutLog
      .filter((w) => Array.isArray(w.exercises) && w.exercises.some((e) => e.id === exId))
      .map((w) => ({ date: w.date, kg: w.exercises.find((e) => e.id === exId)?.usedKg }))
      .filter((p) => Number.isFinite(p.kg))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (points.length >= 2) {
      out[exId] = {
        start:   points[0].kg,
        current: points[points.length - 1].kg,
        delta:   +(points[points.length - 1].kg - points[0].kg).toFixed(1),
      };
    }
  }
  return out;
}

function readinessTrend(readinessLogs) {
  const cutoff = daysAgo(30);
  const r30 = readinessLogs.filter((r) => new Date(r.date) >= cutoff);
  if (r30.length === 0) return { avg: null, trend: "stable", count: 0 };

  const avg = +(r30.reduce((s, r) => s + r.score, 0) / r30.length).toFixed(1);
  const head = r30.slice(0, 5);
  const tail = r30.slice(-5);
  const headAvg = head.reduce((s, r) => s + r.score, 0) / head.length;
  const tailAvg = tail.reduce((s, r) => s + r.score, 0) / tail.length;
  const trend = tailAvg > headAvg + 0.5 ? "improving"
              : tailAvg < headAvg - 0.5 ? "declining" : "stable";
  return { avg, trend, count: r30.length };
}

function aggregateHealth(snapshots) {
  const cutoff = daysAgo(30);
  const window = snapshots.filter((s) => new Date(s.date) >= cutoff);
  const avg = (arr, key) => {
    const vals = arr.map((s) => s[key]).filter((v) => Number.isFinite(v));
    if (vals.length === 0) return null;
    return +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
  };
  return {
    avgSleep30d: avg(window, "sleep_hours"),
    avgHRV30d:   avg(window, "hrv_ms"),
    avgSteps30d: avg(window, "steps") != null ? Math.round(avg(window, "steps")) : null,
  };
}

function weightDelta(weightLog) {
  if (!Array.isArray(weightLog) || weightLog.length < 2) {
    return { delta: 0, current: weightLog?.[weightLog.length - 1]?.weight ?? null };
  }
  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = daysAgo(30);
  const inWindow = sorted.filter((w) => new Date(w.date) >= cutoff);
  const startWeight = (inWindow[0] ?? sorted[0]).weight;
  const endWeight   = sorted[sorted.length - 1].weight;
  return {
    delta:   +(endWeight - startWeight).toFixed(1),
    current: endWeight,
  };
}

function aggregateHabits(habitLogs, habits) {
  const cutoff = daysAgo(30);
  const window = (habitLogs ?? []).filter((l) => new Date(l.date) >= cutoff);
  const active = (habits ?? []).filter((h) => !h.archived);

  let rate30 = null;
  if (active.length > 0) {
    const possible = active.length * 30;
    const done     = window.filter((l) => l.done).length;
    rate30 = Math.round((done / possible) * 100);
  }

  const breakdown = {};
  for (const h of active) {
    const hl = window.filter((l) => l.habitId === h.id);
    if (hl.length > 0) {
      const ratio = hl.filter((l) => l.done).length / hl.length;
      breakdown[h.name] = Math.round(ratio * 100) + "%";
    }
  }
  return { rate30, breakdown };
}

function mealAdherence(mealLog) {
  if (!mealLog || typeof mealLog !== "object") return null;
  const vals = Object.values(mealLog);
  if (vals.length === 0) return null;
  return Math.round((vals.filter(Boolean).length / vals.length) * 100);
}

/* The single entry point. Reads every storage slice we need and emits a
   structured object ready to be templated into the AI prompt. */
export async function collectAllData(habits = []) {
  const [workoutLog, weightLog, habitLogs, healthSnapshots, mealLog, readinessLogs, measurements] = await Promise.all([
    storageLoad("workoutLog_v5",             []),
    storageLoad("weightLog_v5",              []),
    storageLoad("rebirth_habit_logs",        []),
    storageLoad("rebirth_health_snapshots",  []),
    storageLoad("mealLog_v6",                {}),
    storageLoad("rebirth_readiness_logs",    []),
    storageLoad("rebirth_measurements",      []), // not shipped yet — passes through
  ]);

  const cutoff30 = daysAgo(30);
  const sessions30d = workoutLog.filter((w) => new Date(w.date) >= cutoff30);
  const targetSessionsLast30d = Math.round((30 / 7) * 3);

  const { avg: avgReadiness30d, trend: trendReadiness } = readinessTrend(readinessLogs);
  const { delta: weightDelta30d, current: weightCurrent } = weightDelta(weightLog);
  const { avgSleep30d, avgHRV30d, avgSteps30d } = aggregateHealth(healthSnapshots);
  const { rate30: habitCompletionRate30d, breakdown: habitBreakdown } = aggregateHabits(habitLogs, habits);

  const sortedM   = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const latestM   = sortedM[sortedM.length - 1] ?? null;
  const previousM = sortedM[sortedM.length - 2] ?? null;
  const leanDelta = latestM?.leanMass_kg != null && previousM?.leanMass_kg != null
    ? +(latestM.leanMass_kg - previousM.leanMass_kg).toFixed(1) : null;
  const fatDelta  = latestM?.fatMass_kg != null && previousM?.fatMass_kg != null
    ? +(latestM.fatMass_kg - previousM.fatMass_kg).toFixed(1) : null;

  return {
    profile: {
      age:       35,
      weight_kg: weightCurrent ?? 95,
      height_cm: 186,
    },
    today: todayStr(),
    programWeek: deriveProgramWeek(workoutLog),

    sessionsLast30d:        sessions30d.length,
    targetSessionsLast30d,
    progressionByExercise:  progressionByExercise(workoutLog),

    avgReadiness30d,
    readinessTrend: trendReadiness,

    weightDelta30d,
    latestMeasurement: latestM,
    previousMeasurement: previousM,
    leanMassDelta: leanDelta,
    fatMassDelta:  fatDelta,

    mealAdherence7d: mealAdherence(mealLog),

    habitCompletionRate30d,
    habitBreakdown,

    avgSleep30d,
    avgHRV30d,
    avgSteps30d,
  };
}
