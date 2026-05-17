import { useCallback, useEffect, useMemo, useState } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { todayStr, pruneOldLogs, computeStreak } from "../utils/streak.js";

const MILESTONE_STREAKS = new Set([7, 21, 30, 66, 100]);

const KEY_HABITS = "rebirth_habits";
const KEY_LOGS   = "rebirth_habit_logs";

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `habit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useHabits() {
  const [habits, setHabits]   = useState([]);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      storageLoad(KEY_HABITS, []),
      storageLoad(KEY_LOGS, []),
    ]).then(([h, l]) => {
      if (cancelled) return;
      setHabits(Array.isArray(h) ? h : []);
      setLogs(pruneOldLogs(Array.isArray(l) ? l : []));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const persistHabits = useCallback(async (next) => {
    setHabits(next);
    await storageSave(KEY_HABITS, next);
  }, []);

  const persistLogs = useCallback(async (next) => {
    const pruned = pruneOldLogs(next);
    setLogs(pruned);
    await storageSave(KEY_LOGS, pruned);
  }, []);

  const addHabit = useCallback(async (partial) => {
    const order = habits.reduce((m, h) => Math.max(m, h.order ?? 0), 0) + 1;
    const created = {
      id: genId(),
      name: partial.name?.trim() || "Senza nome",
      emoji: partial.emoji || "✅",
      category: partial.category || "custom",
      timeOfDay: partial.timeOfDay || "anytime",
      targetDays: partial.targetDays || [1, 2, 3, 4, 5, 6, 0],
      color: partial.color || "#C46E40",
      createdAt: todayStr(),
      archived: false,
      order,
    };
    await persistHabits([...habits, created]);
    return created;
  }, [habits, persistHabits]);

  const updateHabit = useCallback(async (id, patch) => {
    await persistHabits(habits.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }, [habits, persistHabits]);

  const archiveHabit = useCallback(async (id) => {
    await persistHabits(habits.map((h) => (h.id === id ? { ...h, archived: true } : h)));
  }, [habits, persistHabits]);

  const reorderHabit = useCallback(async (id, direction) => {
    const sorted = [...habits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((h) => h.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await persistHabits(habits.map((h) => {
      if (h.id === a.id) return { ...h, order: b.order };
      if (h.id === b.id) return { ...h, order: a.order };
      return h;
    }));
  }, [habits, persistHabits]);

  const toggleHabit = useCallback(async (habitId) => {
    const today = todayStr();
    const existing = logs.find((l) => l.habitId === habitId && l.date === today);
    let next;
    const wasDoneToday = !!existing?.done;
    if (existing) {
      // Toggle done state. Clears skipped when transitioning to done.
      next = logs.map((l) =>
        l.habitId === habitId && l.date === today
          ? { ...l, done: !l.done, skipped: l.done ? l.skipped : false }
          : l,
      );
    } else {
      next = [...logs, { habitId, date: today, done: true, skipped: false, note: "" }];
    }
    await persistLogs(next);

    // Emit a milestone event only when the toggle made the habit DONE
    // (not when un-marking). Layer 9's useAlterEgo listens for this to
    // surface the full-screen celebration.
    const isNowDone = !wasDoneToday;
    if (isNowDone && typeof window !== "undefined") {
      const newStreak = computeStreak(habitId, next);
      if (MILESTONE_STREAKS.has(newStreak)) {
        window.dispatchEvent(new CustomEvent("habit:milestone", { detail: { habitId, streak: newStreak } }));
      }
    }
  }, [logs, persistLogs]);

  const skipToday = useCallback(async (habitId) => {
    const today = todayStr();
    const existing = logs.find((l) => l.habitId === habitId && l.date === today);
    let next;
    if (existing) {
      next = logs.map((l) =>
        l.habitId === habitId && l.date === today
          ? { ...l, skipped: !l.skipped, done: l.skipped ? l.done : false }
          : l,
      );
    } else {
      next = [...logs, { habitId, date: today, done: false, skipped: true, note: "" }];
    }
    await persistLogs(next);
  }, [logs, persistLogs]);

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [habits],
  );

  const todayLogsByHabit = useMemo(() => {
    const today = todayStr();
    const map = {};
    for (const l of logs) {
      if (l.date === today) map[l.habitId] = l;
    }
    return map;
  }, [logs]);

  const todayCompletionCount = useMemo(() => {
    let n = 0;
    for (const h of activeHabits) if (todayLogsByHabit[h.id]?.done) n++;
    return n;
  }, [activeHabits, todayLogsByHabit]);

  return {
    habits: activeHabits,
    allHabits: habits, // includes archived — for restore UI later
    logs,
    loading,
    todayLogsByHabit,
    todayCompletionCount,
    totalActiveHabits: activeHabits.length,
    addHabit,
    updateHabit,
    archiveHabit,
    reorderHabit,
    toggleHabit,
    skipToday,
  };
}
