import { useMemo } from "react";
import { C } from "../../../shared/design/tokens.js";
import { buildWeekGrid } from "../utils/streak.js";

/* GitHub-style heatmap. Each column = one week (Mon-Sun), each cell =
   one day. Rightmost column is the current week so today is the bottom-
   right cell on Sundays, otherwise positioned by day-of-week. */
export default function ContributionGraph({ habit, logs, weeks = 12 }) {
  const grid = useMemo(() => buildWeekGrid(habit.id, logs, weeks), [habit.id, logs, weeks]);

  return (
    <div style={{ overflowX: "auto", paddingBottom: 2 }}>
      <div style={{ display: "flex", gap: 3 }}>
        {grid.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((day, di) => (
              <div
                key={di}
                title={day.date}
                style={{
                  width: 11, height: 11, borderRadius: 2,
                  background: day.done
                    ? habit.color
                    : day.future
                    ? "transparent"
                    : day.skipped
                    ? C.gold + "44"
                    : C.borderLo,
                  border: day.future ? `1px dashed ${C.borderLo}` : "none",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
