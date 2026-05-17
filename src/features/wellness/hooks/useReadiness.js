import { useCallback, useEffect, useMemo, useState } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { todayStr } from "../../habits/utils/streak.js";
import { computeReadinessScore, getReadinessLevel } from "../utils/score.js";
import { collectAllData } from "../services/assessmentData.js";
import { loadOrRequestAssessment } from "../services/expertAssessment.js";

const KEY_LOGS       = "rebirth_readiness_logs";
const KEY_ASSESSMENT = "rebirth_ai_assessment";
const ROLLING_DAYS   = 90;

function pruneLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return logs.slice(-ROLLING_DAYS);
}

export function useReadiness({ workoutLog, habits }) {
  const [logs, setLogs]             = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loadingAI, setLoadingAI]   = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      storageLoad(KEY_LOGS, []),
      storageLoad(KEY_ASSESSMENT, null),
    ]).then(([l, a]) => {
      if (cancelled) return;
      setLogs(pruneLogs(l));
      setAssessment(a);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  /* Inputs is the subset Nicola fills in by hand: sleepHours, sleepQuality,
     energyLevel, mood, soreness. We enrich with workout cadence (from
     workoutLog) and habit completion (from useHabits). No Apple Health —
     the only signals are the ones the user reports. */
  const submitCheckin = useCallback(async (inputs) => {
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
  }, [logs, workoutLog, habits]);

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
