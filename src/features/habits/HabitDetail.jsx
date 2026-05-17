import { useMemo } from "react";
import { C, FONT, btn, card, label } from "../../shared/design/tokens.js";
import {
  computeStreak, computeBestStreak,
  completionRate30d, totalCheckins,
} from "./utils/streak.js";
import ContributionGraph from "./components/ContributionGraph.jsx";

const DAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];

function MonthCalendar({ habit, logs }) {
  // Render the current calendar month with each day as a square.
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const startDow = (firstOfMonth.getDay() + 6) % 7; // Monday=0

  const map = new Map();
  for (const l of logs) {
    if (l.habitId === habit.id) map.set(l.date, l);
  }

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split("T")[0];
    const log = map.get(dateStr);
    const isFuture = date > today;
    cells.push({ d, dateStr, done: !!log?.done, skipped: !!log?.skipped, future: isFuture });
  }
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAY_LABELS.map((l, i) => (
          <div key={i} style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, textAlign: "center", letterSpacing: 0.5 }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((c, i) =>
          c == null
            ? <div key={i} />
            : (
              <div
                key={i}
                title={c.dateStr}
                style={{
                  aspectRatio: "1",
                  borderRadius: 4,
                  background: c.done
                    ? habit.color
                    : c.skipped
                    ? C.gold + "44"
                    : c.future
                    ? "transparent"
                    : C.borderLo,
                  border: c.future ? `1px dashed ${C.borderLo}` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontFamily: FONT,
                  color: c.done ? C.bg : c.future ? C.txtMute : C.txtSec,
                }}
              >
                {c.d}
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default function HabitDetail({ habit, logs, onClose, onToggle, onSkip, onArchive, onEdit }) {
  const streak     = useMemo(() => computeStreak(habit.id, logs), [habit.id, logs]);
  const bestStreak = useMemo(() => computeBestStreak(habit.id, logs), [habit.id, logs]);
  const rate       = useMemo(() => completionRate30d(habit.id, logs), [habit.id, logs]);
  const total      = useMemo(() => totalCheckins(habit.id, logs), [habit.id, logs]);

  const todayDate = new Date().toISOString().split("T")[0];
  const todayLog = logs.find((l) => l.habitId === habit.id && l.date === todayDate);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.txt, fontFamily: FONT, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.txtSec, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>
          <i className="ph ph-arrow-left" />
        </button>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{habit.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...label, marginBottom: 2 }}>Abitudine</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: habit.color, lineHeight: 1.2 }}>{habit.name}</div>
        </div>
      </div>

      <div style={{ padding: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            ["Streak",    `${streak}g`,                C.gold],
            ["Migliore",  `${bestStreak}g`,            habit.color],
            ["30 gg",     `${Math.round(rate * 100)}%`, C.C],
            ["Totale",    total,                       C.B],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: C.surf, border: `1px solid ${c}33`, borderRadius: 6, padding: "12px 6px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
              <div style={{ fontSize: 16, color: c, fontFamily: FONT, fontWeight: 500 }}>{v}</div>
              <div style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={card()}>
          <div style={{ ...label, marginBottom: 10 }}>Ultime 12 settimane</div>
          <ContributionGraph habit={habit} logs={logs} weeks={12} />
        </div>

        <div style={card()}>
          <div style={{ ...label, marginBottom: 10 }}>Questo mese</div>
          <MonthCalendar habit={habit} logs={logs} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => onToggle(habit.id)}
            style={{ ...btn(todayLog?.done ? C.surfHi : habit.color, todayLog?.done ? C.txt : C.bg), flex: 1 }}
          >
            {todayLog?.done ? "Annulla oggi" : "Fatto oggi"}
          </button>
          <button
            onClick={() => onSkip(habit.id)}
            style={{ ...btn("none", todayLog?.skipped ? C.gold : C.txtSec), border: `1px solid ${todayLog?.skipped ? C.gold : C.border}`, flex: 1 }}
          >
            {todayLog?.skipped ? "Non saltato" : "Salta oggi"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={() => onEdit(habit.id)}
            style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, flex: 1, fontSize: 12 }}
          >
            <i className="ph ph-pencil-simple" style={{ marginRight: 6 }} />
            Modifica
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Archiviare "${habit.name}"? Lo storico resta salvato.`)) {
                onArchive(habit.id);
                onClose();
              }
            }}
            style={{ ...btn("none", C.D), border: `1px solid ${C.D}44`, flex: 1, fontSize: 12 }}
          >
            <i className="ph ph-archive" style={{ marginRight: 6 }} />
            Archivia
          </button>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
