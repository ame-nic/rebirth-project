import { C, FONT, btn, label } from "../../../shared/design/tokens.js";

function formatGenerated(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `oggi ${time}`;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) + ` ${time}`;
}

export default function ExpertAssessmentCard({ assessment, loading, onRequest }) {
  const accent = assessment?.color || C.B;

  return (
    <div
      style={{
        background:   C.surf,
        border:       `1px solid ${assessment ? accent + "55" : C.border}`,
        borderRadius: 6, overflow: "hidden", marginBottom: 14,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          background: assessment ? `linear-gradient(135deg, ${accent}18 0%, transparent 60%)` : C.surfHi,
          borderBottom: `1px solid ${C.borderLo}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ ...label, color: accent, marginBottom: 4 }}>
              Valutazione AI · 30 giorni
            </div>
            <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.4 }}>
              Sto andando nella direzione giusta?
            </div>
          </div>
          {assessment?.verdict && (
            <div
              style={{
                fontSize: 11, color: accent, fontFamily: FONT, fontWeight: 500,
                background: accent + "18", border: `1px solid ${accent}44`,
                borderRadius: 999, padding: "4px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {assessment.verdict}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px" }}>
        {loading ? (
          <div style={{ color: C.txtSec, fontSize: 13, display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <i className="ph ph-sparkle" style={{ fontSize: 14, color: accent }} />
            Gemini sta analizzando i tuoi dati…
          </div>
        ) : assessment ? (
          <>
            <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {assessment.body}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>
                {formatGenerated(assessment.generatedAt)} · cache 24h
              </div>
              <button
                onClick={() => onRequest(true)}
                style={{
                  background: "none", border: `1px solid ${C.border}`,
                  borderRadius: 4, color: C.txtMute,
                  padding: "5px 10px", fontSize: 10, fontFamily: FONT, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <i className="ph ph-arrows-clockwise" style={{ fontSize: 10 }} />
                Aggiorna
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.6, marginBottom: 12 }}>
              Analisi su allenamento, recupero, nutrizione, misurazioni e abitudini. Risposta specifica ai tuoi dati reali.
            </div>
            <button
              onClick={() => onRequest(false)}
              style={{ ...btn(C.B, C.bg), display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <i className="ph ph-sparkle" style={{ fontSize: 14 }} />
              Richiedi valutazione esperto
            </button>
            <div style={{ fontSize: 10, color: C.txtMute, textAlign: "center", marginTop: 8, fontFamily: FONT }}>
              ~600 token · si aggiorna ogni 24h
            </div>
          </>
        )}
      </div>
    </div>
  );
}
