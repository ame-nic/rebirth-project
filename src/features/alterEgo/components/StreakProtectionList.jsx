import { useMemo, useState } from "react";
import { C, FONT } from "../../../shared/design/tokens.js";
import { computeStreak, todayStr } from "../../habits/utils/streak.js";

const MIN_STREAK = 7;
const MAX_ALERTS = 2;
const DISMISS_KEY_PREFIX = "ae_dismiss_";

/* Surface up to two streak-protection prompts for habits the user has
   not done today AND has a streak of ≥7 days. Phrased as identity
   ("Hai ancora tempo per essere…"), never shame. Dismissals are local
   to the current calendar day. */
export default function StreakProtectionList({ habits, logs, todayLogsByHabit, alterEgo, onToggleHabit }) {
  const today = todayStr();
  const [dismissed, setDismissed] = useState(() => new Set());

  const atRisk = useMemo(() => {
    return habits
      .map((h) => ({ habit: h, streak: computeStreak(h.id, logs), done: !!todayLogsByHabit[h.id]?.done }))
      .filter(({ streak, done }) => streak >= MIN_STREAK && !done)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, MAX_ALERTS);
  }, [habits, logs, todayLogsByHabit]);

  function dismiss(id) {
    setDismissed((prev) => new Set([...prev, id]));
    try {
      sessionStorage.setItem(`${DISMISS_KEY_PREFIX}${id}_${today}`, "1");
    } catch { /* ignore */ }
  }

  const visible = atRisk.filter(({ habit }) => {
    if (dismissed.has(habit.id)) return false;
    try {
      return sessionStorage.getItem(`${DISMISS_KEY_PREFIX}${habit.id}_${today}`) == null;
    } catch {
      return true;
    }
  });

  if (visible.length === 0) return null;

  const egoName = alterEgo?.name?.trim() || "la persona che stai diventando";

  return (
    <>
      {visible.map(({ habit, streak }) => (
        <div
          key={habit.id}
          style={{
            background:  C.surfHi,
            border:      `1px solid ${habit.color}44`,
            borderLeft:  `3px solid ${habit.color}`,
            borderRadius: 6,
            padding:     "12px 14px",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 11, color: habit.color, fontFamily: FONT, marginBottom: 6, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <i className="ph ph-flame-fill" style={{ fontSize: 11 }} />
            {streak} giorni di streak · {habit.name.toLowerCase()}
          </div>
          <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.55, marginBottom: 10 }}>
            Hai ancora tempo oggi per essere {egoName}.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                onToggleHabit(habit.id);
                dismiss(habit.id);
              }}
              style={{
                flex: 2, padding: "10px",
                background: habit.color, border: "none", borderRadius: 4,
                color: C.bg, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: "pointer",
              }}
            >
              Lo faccio ora
            </button>
            <button
              onClick={() => dismiss(habit.id)}
              style={{
                flex: 1, padding: "10px",
                background: "none", border: `1px solid ${C.border}`, borderRadius: 4,
                color: C.txtMute, fontSize: 12, fontFamily: FONT, cursor: "pointer",
              }}
            >
              Dopo
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
