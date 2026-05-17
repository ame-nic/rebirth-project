import { useEffect, useMemo, useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { callAIWithFallback } from "../../../shared/services/ai.js";
import { weeklyStats, todayStr } from "../utils/streak.js";

const SUMMARY_STORAGE_PREFIX = "rebirth_habit_summary_";

const SYSTEM_PROMPT =
  "Sei un coach personale che dà feedback settimanale sulle abitudini di Nicola. " +
  "Rispondi in italiano con 2-3 frasi brevi e concrete. " +
  "Tono calmo, specifico, supportivo — mai esagerato, mai con emoji. " +
  "Sottolinea cosa è andato bene e individua un punto preciso su cui migliorare la settimana prossima.";

function buildPromptLine({ habit, cur, prev, trend }) {
  const trendLabel =
    trend > 0.1  ? "in miglioramento" :
    trend < -0.1 ? "in calo" :
                   "stabile";
  const prevLabel = prev.possible > 0 ? ` (settimana scorsa: ${prev.done}/${prev.possible})` : "";
  return `- ${habit.name}: ${cur.done}/${cur.possible}${prevLabel} — ${trendLabel}`;
}

function buildPrompt(stats, totalDone, totalPossible) {
  const lines = stats.map(buildPromptLine).join("\n");
  const ratio = totalPossible === 0 ? 0 : Math.round((totalDone / totalPossible) * 100);
  return [
    `Resoconto della settimana per l'utente.`,
    `Completamento totale: ${totalDone}/${totalPossible} (${ratio}%).`,
    "",
    lines,
    "",
    "Scrivi un commento utile e onesto.",
  ].join("\n");
}

/* Shown only on Sundays — a tally per habit for the current week with a
   trend arrow against last week, plus an optional AI-generated commento. */
export default function WeeklySummaryCard({ habits, logs }) {
  const isSunday = new Date().getDay() === 0;

  const stats = useMemo(() => {
    return habits.map((h) => {
      const cur  = weeklyStats(h.id, logs, 0);
      const prev = weeklyStats(h.id, logs, 1);
      const trend = prev.possible === 0 ? 0 : cur.ratio - prev.ratio;
      return { habit: h, cur, prev, trend };
    });
  }, [habits, logs]);

  const totalDone     = stats.reduce((s, x) => s + x.cur.done, 0);
  const totalPossible = stats.reduce((s, x) => s + x.cur.possible, 0);
  const totalRatio    = totalPossible === 0 ? 0 : totalDone / totalPossible;

  // Per-Sunday cache. Generating a comment is a one-call-per-week-ish
  // affair; we don't want a re-render or tab switch to retrigger it.
  const cacheKey = useMemo(() => `${SUMMARY_STORAGE_PREFIX}${todayStr()}`, []);
  const [aiText,   setAiText]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!isSunday) return;
    storageLoad(cacheKey, null).then((cached) => {
      if (cached?.text) setAiText(cached.text);
    });
  }, [isSunday, cacheKey]);

  if (!isSunday || habits.length === 0) return null;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const prompt = buildPrompt(stats, totalDone, totalPossible);
    const result = await callAIWithFallback(prompt, SYSTEM_PROMPT, 320);
    if (result) {
      setAiText(result);
      await storageSave(cacheKey, { text: result, generatedAt: new Date().toISOString() });
    } else {
      setError("Commento AI non disponibile.");
    }
    setLoading(false);
  }

  async function handleRegenerate() {
    // User explicitly wants a new take — bypass cache.
    await handleGenerate();
  }

  return (
    <div
      style={{
        background: C.surf, border: `1px solid ${C.gold}55`,
        borderRadius: 6, padding: "14px 16px",
        marginBottom: 14,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ ...label, color: C.gold, marginBottom: 0 }}>Settimana di abitudini</div>
        <div style={{ fontSize: 12, color: C.gold, fontFamily: FONT, fontWeight: 500 }}>
          {Math.round(totalRatio * 100)}%
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 12 }}>
        {totalDone}/{totalPossible} check-in possibili
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {stats.map(({ habit, cur, trend }) => {
          const arrow =
            trend > 0.1  ? <i className="ph ph-arrow-up" style={{ color: C.C }} /> :
            trend < -0.1 ? <i className="ph ph-arrow-down" style={{ color: C.D }} /> :
                           <i className="ph ph-minus" style={{ color: C.txtMute }} />;
          return (
            <div
              key={habit.id}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 12,
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{habit.emoji}</span>
              <span style={{ flex: 1, color: C.txt, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {habit.name}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 11, color: habit.color }}>
                {cur.done}/{cur.possible}
              </span>
              <span style={{ fontSize: 12, lineHeight: 1, width: 14, textAlign: "right" }}>{arrow}</span>
            </div>
          );
        })}
      </div>

      {/* AI commento — opt-in */}
      <div style={{ marginTop: 14, borderTop: `1px solid ${C.borderLo}`, paddingTop: 12 }}>
        {aiText ? (
          <div>
            <div style={{ ...label, color: C.A, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ph ph-sparkle" style={{ fontSize: 11 }} />
              Commento AI
            </div>
            <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.6, marginBottom: 10 }}>
              {aiText}
            </div>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              style={{
                background: "none", border: "none", color: C.txtMute,
                fontSize: 11, fontFamily: FONT, cursor: "pointer",
                padding: 0, textDecoration: "underline",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              <i className="ph ph-arrows-clockwise" style={{ fontSize: 10 }} />
              {loading ? "Generazione…" : "Rigenera"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              ...btn("none", C.A),
              border: `1px solid ${C.A}55`,
              fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <i className="ph ph-sparkle" style={{ fontSize: 13 }} />
            {loading ? "Generazione…" : "Genera commento AI"}
          </button>
        )}
        {error && (
          <div style={{ fontSize: 11, color: C.D, marginTop: 8, fontFamily: FONT }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
