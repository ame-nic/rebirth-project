import { useState } from "react";
import { C, FONT, btn, label, pill } from "../../../shared/design/tokens.js";
import { CATEGORY_LABELS } from "../data/defaultSources.js";
import AddSourceSheet from "./AddSourceSheet.jsx";

const TYPE_LABEL = { rss: "RSS", reddit: "Reddit", weather: "Meteo", manual: "Manuale" };

function categoryLabel(cat) {
  return CATEGORY_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function SourceManager({ sources, onAdd, onToggle, onRemove, onReorder, onClose }) {
  const [adding, setAdding] = useState(false);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.txt, fontFamily: FONT, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "16px 18px", display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.txtSec, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>
            <i className="ph ph-arrow-left" />
          </button>
          <div>
            <div style={{ ...label, marginBottom: 2 }}>Feed</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Fonti</div>
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            background: C.surfHi, border: `1px solid ${C.border}`,
            borderRadius: 4, color: C.A, padding: "6px 12px",
            fontSize: 11, fontFamily: FONT, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          <i className="ph ph-plus" style={{ fontSize: 12 }} />
          Aggiungi
        </button>
      </div>

      <div style={{ padding: "12px 14px 24px" }}>
        <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 12, lineHeight: 1.6 }}>
          Usa le frecce per riordinare. Toccare per attivare o disattivare. Il meteo non si può rimuovere.
        </div>

        {sources.map((s, idx) => {
          const isFirst = idx === 0;
          const isLast  = idx === sources.length - 1;
          const isWeather = s.type === "weather";
          return (
            <div
              key={s.id}
              style={{
                background: C.surf,
                border: `1px solid ${s.enabled ? C.border : C.borderLo}`,
                borderRadius: 6,
                padding: "12px 14px",
                marginBottom: 6,
                display: "flex", alignItems: "center", gap: 10,
                opacity: s.enabled ? 1 : 0.55,
              }}
            >
              <button
                onClick={() => onToggle(s.id)}
                disabled={isWeather}
                aria-label={s.enabled ? "Disattiva" : "Attiva"}
                style={{
                  width: 12, height: 12, borderRadius: 999,
                  border: `1px solid ${s.enabled ? C.C : C.txtMute}`,
                  background: s.enabled ? C.C : "transparent",
                  cursor: isWeather ? "default" : "pointer",
                  flexShrink: 0, padding: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.txt }}>{s.label}</div>
                <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 2 }}>
                  {categoryLabel(s.category)}
                </div>
              </div>
              <span style={pill(C.txtSec)}>{TYPE_LABEL[s.type] ?? s.type}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button
                  onClick={() => onReorder(s.id, "up")}
                  disabled={isFirst}
                  aria-label="Sposta su"
                  style={iconBtn(isFirst)}
                >
                  <i className="ph ph-caret-up" style={{ fontSize: 11 }} />
                </button>
                <button
                  onClick={() => onReorder(s.id, "down")}
                  disabled={isLast}
                  aria-label="Sposta giù"
                  style={iconBtn(isLast)}
                >
                  <i className="ph ph-caret-down" style={{ fontSize: 11 }} />
                </button>
              </div>
              {!isWeather && (
                <button
                  onClick={() => {
                    if (window.confirm(`Rimuovere "${s.label}"?`)) onRemove(s.id);
                  }}
                  aria-label="Rimuovi"
                  style={{
                    width: 24, height: 24, borderRadius: 4,
                    border: `1px solid ${C.border}`, background: "none",
                    color: C.D, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <i className="ph ph-trash" style={{ fontSize: 12 }} />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setAdding(true)}
          style={{ ...btn(C.surf, C.txtSec), border: `1px solid ${C.border}`, marginTop: 14 }}
        >
          + Aggiungi fonte
        </button>
      </div>

      {adding && (
        <AddSourceSheet onSave={onAdd} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}

function iconBtn(disabled) {
  return {
    width: 20, height: 16, borderRadius: 2,
    background: "none", border: `1px solid ${C.border}`,
    color: disabled ? C.txtMute : C.txtSec,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.4 : 1,
    padding: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}
