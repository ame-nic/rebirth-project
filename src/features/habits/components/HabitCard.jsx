import { memo } from "react";
import { C, FONT } from "../../../shared/design/tokens.js";
import { computeStreak, last7Days } from "../utils/streak.js";

/* memo'd because the habit list re-renders on every toggle and we don't
   want untouched cards to re-render. Comparator checks the fields that
   actually affect the rendered output. */
function HabitCardImpl({ habit, todayLog, logs, onToggle, onOpen }) {
  const done    = !!todayLog?.done;
  const skipped = !!todayLog?.skipped;
  const dots    = last7Days(habit.id, logs);
  const streak  = computeStreak(habit.id, logs);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px",
        background:   done ? habit.color + "12" : skipped ? C.gold + "10" : C.surf,
        border:       `1px solid ${done ? habit.color + "55" : skipped ? C.gold + "55" : C.border}`,
        borderRadius: 6,
        marginBottom: 8,
        transition:   "all 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Toggle tap target — 44px to meet iOS minimum hit-area guidance. */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(habit.id); }}
        aria-label={done ? "Segna come non fatto" : "Segna come fatto"}
        style={{
          width: 44, height: 44, borderRadius: 4,
          border: `2px solid ${done ? habit.color : C.border}`,
          background: done ? habit.color : "none",
          fontSize: done ? 18 : 22,
          color: done ? C.bg : C.txt,
          cursor: "pointer", flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT,
          transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {done ? "✓" : habit.emoji}
      </button>

      {/* Info — tap area opens detail */}
      <div
        onClick={() => onOpen?.(habit.id)}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
      >
        <div
          style={{
            fontSize: 14, color: done ? C.txtSec : C.txt,
            textDecoration: done ? "line-through" : "none",
            marginBottom: 5,
          }}
        >
          {habit.name}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {dots.map((day, i) => (
            <div
              key={i}
              title={day.date}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: day.done
                  ? habit.color
                  : day.skipped
                  ? C.gold + "66"
                  : day.future
                  ? "transparent"
                  : C.borderLo,
              }}
            />
          ))}
        </div>
      </div>

      {streak >= 3 && (
        <div
          style={{ textAlign: "right", flexShrink: 0 }}
          aria-label={`Streak ${streak} giorni`}
        >
          <div style={{ fontSize: 14, color: C.gold, lineHeight: 1 }}>
            <i className="ph ph-flame-fill" />
          </div>
          <div style={{ fontSize: 10, color: C.gold, fontFamily: FONT, marginTop: 2, fontWeight: 500 }}>
            {streak}g
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(HabitCardImpl, (prev, next) =>
  prev.habit === next.habit &&
  prev.todayLog === next.todayLog &&
  prev.logs === next.logs &&
  prev.onToggle === next.onToggle &&
  prev.onOpen === next.onOpen,
);
