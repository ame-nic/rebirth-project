import { useCallback, useEffect, useMemo, useState } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { todayStr } from "../../habits/utils/streak.js";
import { computeReadinessScore, getReadinessLevel } from "../utils/score.js";
import { collectAllData } from "../services/assessmentData.js";
import { loadOrRequestAssessment } from "../services/expertAssessment.js";

const KEY_LOGS       = "rebirth_readiness_logs";
const KEY_BASELINE   = "rebirth_hrv_baseline";          // owned by Layer 10
const KEY_ASSESSMENT = "rebirth_ai_assessment";
const ROLLING_DAYS   = 90;

function pruneLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return logs.slice(-ROLLING_DAYS);
}

async function computeActiveCalories7d(snapshots) {
  if (!Array.isArray(snapshots)) return null;
  const sevenAgo = new Date();
  sevenAgo.setDate(sevenAgo.getDate() - 7);
  const recent = snapshots.filter(
    (s) => new Date(s.date) >= sevenAgo && Number.isFinite(s.active_calories),
  );
  return recent.length > 0
    ? recent.reduce((sum, h) => sum + h.active_calories, 0)
    : null;
}

export function useReadiness({ workoutLog, habits }) {
  const [logs, setLogs]             = useState([]);
  const [baseline, setBaseline]     = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loadingAI, setLoadingAI]   = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      storageLoad(KEY_LOGS, []),
      storageLoad(KEY_BASELINE, null),
      storageLoad(KEY_ASSESSMENT, null),
    ]).then(([l, b, a]) => {
      if (cancelled) return;
      setLogs(pruneLogs(l));
      setBaseline(b);
      setAssessment(a);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  /* Inputs is the subset Nicola fills in: sleepHours, sleepQuality,
     energyLevel, mood, soreness. We enrich with workout cadence (from
     workoutLog), habit completion (from useHabits), and the Apple Health
     snapshot for today (read fresh from storage so the call is correct
     even if useHealth's state hasn't propagated yet). */
  const submitCheckin = useCallback(async (inputs) => {
    const snaps = await storageLoad("rebirth_health_snapshots", []);
    const healthToday = snaps.find((s) => s.date === todayStr()) || null;

    const sessionsThisWeek = computeSessionsThisWeek(workoutLog);
    const daysSinceLastSession = computeDaysSinceLastSession(workoutLog);

    const habitLogs = await storageLoad("rebirth_habit_logs", []);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const habitCompletionYesterday = habitLogs.filter(
      (l) => l.date === yStr && l.done,
    ).length;
    const totalActiveHabits = (habits ?? []).filter((h) => !h.archived).length;

    const enriched = {
      ...inputs,
      hrv:              healthToday?.hrv_ms       ?? null,
      restingHR:        healthToday?.resting_hr   ?? null,
      stepsYesterday:   healthToday?.steps        ?? null,
      activeCalories7d: await computeActiveCalories7d(snaps),
      sleepHoursHealth: healthToday?.sleep_hours  ?? null,
      baseHRV:          baseline?.avg7d           ?? null,
      baseRestingHR:    baseline?.restingHR_avg7d ?? null,
      sessionsThisWeek,
      daysSinceLastSession,
      habitCompletionYesterday,
      totalActiveHabits,
    };

    const score = computeReadinessScore(enriched);
    const entry = { date: todayStr(), score, inputs: enriched };
    const next = pruneLogs([...logs.filter((l) => l.date !== todayStr()), entry]);
    setLogs(next);
    await storageSave(KEY_LOGS, next);
    return score;
  }, [logs, workoutLog, habits, baseline]);

  const requestAssessment = useCallback(async (forceRefresh = false) => {
    setLoadingAI(true);
    try {
      const data   = await collectAllData(habits ?? []);
      const result = await loadOrRequestAssessment(data, forceRefresh);
      setAssessment(result);
      return result;
    } finally {
      setLoadingAI(false);
    }
  }, [habits]);

  const todayLog   = useMemo(() => logs.find((l) => l.date === todayStr()) ?? null, [logs]);
  const todayScore = todayLog?.score ?? null;
  const todayInputs = todayLog?.inputs ?? null;
  const level      = useMemo(() => getReadinessLevel(todayScore), [todayScore]);

  return {
    logs,
    baseline,
    todayScore,
    todayInputs,
    level,
    assessment,
    loadingAI,
    loading,
    submitCheckin,
    requestAssessment,
  };
}

function computeSessionsThisWeek(workoutLog) {
  if (!Array.isArray(workoutLog)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dow);
  return workoutLog.filter((w) => new Date(w.date) >= weekStart).length;
}

function computeDaysSinceLastSession(workoutLog) {
  if (!Array.isArray(workoutLog) || workoutLog.length === 0) return 99;
  const sorted = [...workoutLog].sort((a, b) => b.date.localeCompare(a.date));
  const last = new Date(sorted[0].date);
  last.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today - last) / (24 * 60 * 60 * 1000)));
}
