import { useCallback, useEffect, useState } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { MILESTONE_STREAKS } from "../data/emojiPalette.js";

const KEY = "rebirth_alter_ego";

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `ae_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useAlterEgo() {
  const [alterEgo, setAlterEgo] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [pendingCelebration, setPendingCelebration] = useState(null);

  useEffect(() => {
    let cancelled = false;
    storageLoad(KEY, null).then((v) => {
      if (cancelled) return;
      setAlterEgo(v);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  /* Listen for milestones dispatched by useHabits.toggleHabit. We only
     queue a celebration if (a) the streak is in MILESTONE_STREAKS and
     (b) the alter ego has been set up — pre-onboarding milestones get
     swallowed silently so the first interaction isn't a popup. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onMilestone(e) {
      const detail = e.detail || {};
      if (!MILESTONE_STREAKS.includes(detail.streak)) return;
      if (!alterEgo) return;
      setPendingCelebration(detail);
    }
    window.addEventListener("habit:milestone", onMilestone);
    return () => window.removeEventListener("habit:milestone", onMilestone);
  }, [alterEgo]);

  const persistAlterEgo = useCallback(async (next) => {
    setAlterEgo(next);
    await storageSave(KEY, next);
  }, []);

  const createAlterEgo = useCallback(async ({ name, description, emoji, color, statements }) => {
    const now = new Date().toISOString();
    const cleanedStatements = (statements || []).map((s, i) => ({
      id:            s.id ?? genId(),
      text:          (s.text ?? "").trim(),
      linked_habit:  s.linked_habit ?? null,
      linked_goal:   s.linked_goal  ?? null,
      category:      s.category ?? "custom",
      active:        s.active ?? true,
      order:         i,
    })).filter((s) => s.text);

    const ego = {
      name:        (name ?? "").trim(),
      description: (description ?? "").trim(),
      emoji:       emoji || "🌱",
      color:       color || "#C46E40",
      created_at:  now,
      identity_statements: cleanedStatements,
    };
    await persistAlterEgo(ego);
    return ego;
  }, [persistAlterEgo]);

  const updateProfile = useCallback(async (patch) => {
    if (!alterEgo) return;
    const next = { ...alterEgo, ...patch };
    await persistAlterEgo(next);
  }, [alterEgo, persistAlterEgo]);

  const addStatement = useCallback(async (text, category = "custom") => {
    if (!alterEgo) return;
    const order = (alterEgo.identity_statements ?? []).reduce(
      (m, s) => Math.max(m, s.order ?? 0),
      0,
    ) + 1;
    const newStatement = {
      id: genId(),
      text: text.trim(),
      linked_habit: null,
      linked_goal: null,
      category,
      active: true,
      order,
    };
    const next = {
      ...alterEgo,
      identity_statements: [...(alterEgo.identity_statements ?? []), newStatement],
    };
    await persistAlterEgo(next);
  }, [alterEgo, persistAlterEgo]);

  const updateStatement = useCallback(async (id, patch) => {
    if (!alterEgo) return;
    const next = {
      ...alterEgo,
      identity_statements: alterEgo.identity_statements.map(
        (s) => (s.id === id ? { ...s, ...patch } : s),
      ),
    };
    await persistAlterEgo(next);
  }, [alterEgo, persistAlterEgo]);

  const removeStatement = useCallback(async (id) => {
    if (!alterEgo) return;
    const next = {
      ...alterEgo,
      identity_statements: alterEgo.identity_statements.filter((s) => s.id !== id),
    };
    await persistAlterEgo(next);
  }, [alterEgo, persistAlterEgo]);

  const reorderStatement = useCallback(async (id, direction) => {
    if (!alterEgo) return;
    const sorted = [...alterEgo.identity_statements].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    const next = {
      ...alterEgo,
      identity_statements: alterEgo.identity_statements.map((s) => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      }),
    };
    await persistAlterEgo(next);
  }, [alterEgo, persistAlterEgo]);

  const dismissCelebration = useCallback(() => setPendingCelebration(null), []);

  return {
    alterEgo,
    loading,
    isConfigured: !!alterEgo,
    pendingCelebration,
    dismissCelebration,
    createAlterEgo,
    updateProfile,
    addStatement,
    updateStatement,
    removeStatement,
    reorderStatement,
  };
}
