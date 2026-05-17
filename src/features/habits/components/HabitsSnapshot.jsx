import { C, FONT, label } from "../../../shared/design/tokens.js";

/* Compact today-tab strip: one dot per habit, ✓ if done. Tap → Habits tab.
   Pure presentation — receives state from the lifted useHabits hook. */
export default function HabitsSnapshot({ habits, todayLogsByHabit, doneCount, onOpen }) {
  if (habits.length === 0) return null;
  const total   = habits.length;
  const allDone = doneCount === total && total > 0;

  return (
    <button
      onClick={onOpen}
      style={{
        width: "100%",
        background: allDone ? C.C + "16" : C.surf,
        border: `1px solid ${allDone ? C.C + "55" : C.border}`,
        borderRadius: 6,
        padding: "12px 14px",
        marginBottom: 14,
        cursor: "pointer",
        fontFamily: FONT,
        textAlign: "left",
        transition: "all 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ ...label, color: allDone ? C.C : C.txtSec, marginBottom: 0 }}>
          {allDone ? "Abitudini complete oggi" : "Abitudini oggi"}
        </div>
        <div style={{ fontSize: 11, color: allDone ? C.C : C.txtMute, fontFamily: FONT, letterSpacing: 0.3 }}>
          {doneCount}/{total}
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {habits.map((h) => {
          const done = todayLogsByHabit[h.id]?.done;
          return (
            <div
              key={h.id}
              title={h.name}
              style={{
                width: 30, height: 30, borderRadius: 4,
                background: done ? h.color : C.surfHi,
                border: `1px solid ${done ? h.color + "66" : C.border}`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: done ? C.bg : C.txt,
              }}
            >
              {done ? "✓" : h.emoji}
            </div>
          );
        })}
      </div>
    </button>
  );
}
