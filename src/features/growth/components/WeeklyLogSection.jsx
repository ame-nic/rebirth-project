import { useMemo, useState } from "react";
import { C, FONT, btn, card, label } from "../../../shared/design/tokens.js";

const fieldStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 13, fontFamily: FONT, outline: "none",
};

const QUESTIONS = [
  "Cosa ho imparato di più concreto?",
  "Cosa mi ha sorpreso?",
  "Cosa voglio esplorare la prossima settimana?",
];

function formatWeek(weekStart) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("it-IT", opts)} → ${end.toLocaleDateString("it-IT", opts)}`;
}

function LogEditor({ entry, onSave, onClose }) {
  const [b1, setB1] = useState(entry?.bullets?.[0] ?? "");
  const [b2, setB2] = useState(entry?.bullets?.[1] ?? "");
  const [b3, setB3] = useState(entry?.bullets?.[2] ?? "");
  const bullets = [b1, b2, b3];
  const setters = [setB1, setB2, setB3];

  async function save() {
    await onSave({ ...entry, bullets: [b1.trim(), b2.trim(), b3.trim()] });
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surf, borderRadius: "10px 10px 0 0",
          padding: "20px 18px 28px", border: `1px solid ${C.border}`,
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ ...label, color: C.A, marginBottom: 4 }}>Log settimanale</div>
        <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 14 }}>
          {formatWeek(entry.week_start)}
        </div>

        {QUESTIONS.map((q, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ ...label, marginBottom: 4 }}>{i + 1}. {q}</div>
            <textarea
              value={bullets[i]}
              onChange={(e) => setters[i](e.target.value)}
              rows={2}
              style={{ ...fieldStyle, resize: "vertical", fontFamily: FONT, fontSize: 13, lineHeight: 1.5 }}
              maxLength={280}
            />
          </div>
        ))}

        <button onClick={save} style={{ ...btn(C.A, C.bg) }}>Salva</button>
        <button onClick={onClose} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}>
          Annulla
        </button>
      </div>
    </div>
  );
}

function LogCard({ entry, onEdit }) {
  const filled = entry.bullets.filter(Boolean).length;
  return (
    <button
      onClick={() => onEdit(entry)}
      style={{
        width: "100%", textAlign: "left",
        background: C.surf, border: `1px solid ${C.border}`,
        borderRadius: 6, padding: "12px 14px", marginBottom: 8,
        cursor: "pointer", fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: C.gold, fontFamily: FONT, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 500 }}>
          {formatWeek(entry.week_start)}
        </div>
        <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>
          {filled}/3 risposte
        </div>
      </div>
      {entry.bullets.map((b, i) => (
        b && (
          <div key={i} style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55, marginBottom: 4 }}>
            <span style={{ color: C.A, fontFamily: FONT, marginRight: 6 }}>{i + 1}.</span>
            {b}
          </div>
        )
      ))}
      {filled === 0 && (
        <div style={{ fontSize: 12, color: C.txtMute, fontStyle: "italic" }}>
          Tocca per aggiungere le tue risposte.
        </div>
      )}
    </button>
  );
}

export default function WeeklyLogSection({ logs, currentWeekStart, saveWeeklyLog }) {
  const [editing, setEditing] = useState(null);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => b.week_start.localeCompare(a.week_start)),
    [logs],
  );

  const currentEntry = useMemo(
    () => logs.find((l) => l.week_start === currentWeekStart) ?? { week_start: currentWeekStart, bullets: ["", "", ""], article_ids: [] },
    [logs, currentWeekStart],
  );

  return (
    <>
      <button
        onClick={() => setEditing(currentEntry)}
        style={{ ...btn(C.A, C.bg), marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="ph ph-notebook-pen" />
        Log di questa settimana
      </button>

      {sortedLogs.length === 0 ? (
        <div style={card()}>
          <div style={{ fontSize: 13, color: C.txtSec, textAlign: "center", padding: "16px 0", lineHeight: 1.6 }}>
            Nessun log scritto. Tre frasi alla settimana sono sufficienti.
          </div>
        </div>
      ) : (
        sortedLogs.map((entry) => (
          <LogCard key={entry.week_start} entry={entry} onEdit={setEditing} />
        ))
      )}

      {editing && (
        <LogEditor entry={editing} onSave={saveWeeklyLog} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
