import { useEffect, useMemo, useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import { generateWeeklyMessage, loadCachedMessage } from "../services/weeklyMessage.js";
import { weeklyStats as habitWeeklyStats } from "../../habits/utils/streak.js";

function isSunday() { return new Date().getDay() === 0; }

function computeStatementCompletion(statement, habits, logs) {
  if (!statement?.linked_habit) return null;
  const habit = habits.find((h) => h.id === statement.linked_habit);
  if (!habit) return null;
  const ws = habitWeeklyStats(habit.id, logs, 0);
  return { habit, ratio: ws.ratio, done: ws.done, possible: ws.possible };
}

/* The Sunday-only alter-ego reflection. Renders per-statement weekly
   adherence (when statement is linked to a habit), overall identity
   score, and the AI-generated message (or fallback). */
export default function AlterEgoWeeklyCard({ alterEgo, habits, habitLogs, weekStats }) {
  const [aiMessage, setAiMessage] = useState(null);
  const [loading, setLoading]     = useState(false);

  // Try to load cached weekly message on mount — generation is opt-in.
  useEffect(() => {
    if (!isSunday() || !alterEgo) return;
    let cancelled = false;
    loadCachedMessage().then((cached) => {
      if (cancelled) return;
      if (cached?.text) setAiMessage(cached);
    });
    return () => { cancelled = true; };
  }, [alterEgo]);

  const statementsAdherence = useMemo(() => {
    if (!alterEgo) return [];
    return (alterEgo.identity_statements || [])
      .filter((s) => s.active && s.text)
      .map((s) => ({ statement: s, completion: computeStatementCompletion(s, habits, habitLogs) }));
  }, [alterEgo, habits, habitLogs]);

  if (!isSunday() || !alterEgo) return null;

  const withCompletion = statementsAdherence.filter((row) => row.completion);
  const overallRatio = withCompletion.length === 0
    ? null
    : withCompletion.reduce((s, r) => s + r.completion.ratio, 0) / withCompletion.length;

  async function handleGenerate(forceRefresh = false) {
    setLoading(true);
    try {
      const result = await generateWeeklyMessage({ alterEgo, weekStats, forceRefresh });
      setAiMessage(result);
    } finally {
      setLoading(false);
    }
  }

  const accent = alterEgo.color;
  const overallPct = overallRatio != null ? Math.round(overallRatio * 100) : null;

  return (
    <div
      style={{
        background: C.surf, border: `1px solid ${accent}55`,
        borderRadius: 6, padding: "14px 16px", marginBottom: 14,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ ...label, color: accent, marginBottom: 0 }}>
          <span style={{ fontSize: 11, marginRight: 4 }}>{alterEgo.emoji}</span>
          Settimana come {alterEgo.name?.trim() || "il tuo alter ego"}
        </div>
        {overallPct != null && (
          <div style={{ fontSize: 12, color: accent, fontFamily: FONT, fontWeight: 500 }}>
            {overallPct}%
          </div>
        )}
      </div>

      {/* Per-statement weekly score */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {statementsAdherence.length === 0 && (
          <div style={{ fontSize: 12, color: C.txtMute, fontFamily: FONT, fontStyle: "italic" }}>
            Nessuna dichiarazione attiva.
          </div>
        )}
        {statementsAdherence.map(({ statement, completion }) => (
          <div key={statement.id} style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55, display: "flex", alignItems: "center", gap: 8 }}>
            {completion ? (
              <i
                className={`ph ${completion.ratio >= 0.85 ? "ph-check-circle-fill" : completion.ratio >= 0.5 ? "ph-circle-half-tilt" : "ph-circle"}`}
                style={{ color: completion.ratio >= 0.85 ? C.C : completion.ratio >= 0.5 ? C.gold : C.D, fontSize: 14, flexShrink: 0 }}
              />
            ) : (
              <i className="ph ph-dot-outline" style={{ color: C.txtMute, fontSize: 14, flexShrink: 0 }} />
            )}
            <span style={{ flex: 1, minWidth: 0 }}>
              {statement.text}
            </span>
            {completion && (
              <span style={{ fontFamily: FONT, fontSize: 11, color: completion.ratio >= 0.85 ? C.C : completion.ratio >= 0.5 ? C.gold : C.D }}>
                {completion.done}/{completion.possible}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* AI message */}
      <div style={{ borderTop: `1px solid ${C.borderLo}`, paddingTop: 12 }}>
        {aiMessage ? (
          <>
            <div style={{ ...label, color: accent, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ph ph-sparkle" style={{ fontSize: 11 }} />
              {aiMessage.source === "ai" ? "Messaggio AI" : "Messaggio"}
            </div>
            <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.7, marginBottom: 10 }}>
              {aiMessage.text}
            </div>
            <button
              onClick={() => handleGenerate(true)}
              disabled={loading}
              style={{ background: "none", border: "none", color: C.txtMute, fontSize: 11, fontFamily: FONT, cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              {loading ? "Generazione…" : "Rigenera"}
            </button>
          </>
        ) : (
          <button
            onClick={() => handleGenerate(false)}
            disabled={loading}
            style={{
              ...btn("none", accent),
              border: `1px solid ${accent}55`,
              fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <i className="ph ph-sparkle" style={{ fontSize: 13 }} />
            {loading ? "Generazione…" : "Messaggio della settimana"}
          </button>
        )}
      </div>
    </div>
  );
}

