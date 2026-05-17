import { C, FONT, btn, label } from "../../shared/design/tokens.js";

/* Bottom-sheet for swapping an exercise with one of its variants.
   readOnly mode: used in session previews — variant cards are
   non-interactive, "Mantieni originale" → "Chiudi".
   Active mode: tapping a variant calls onSwap then onClose. */
export default function SwapSheet({ exercise, accentColor, onSwap, onClose, readOnly = false }) {
  const variants = exercise.variants || [];
  const accent = accentColor || C.A;

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
          maxHeight: "82vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />

        <div style={{ ...label, color: accent, marginBottom: 6 }}>Sostituisci esercizio</div>
        <div style={{ fontSize: 17, color: C.txt, fontWeight: 500, lineHeight: 1.3 }}>{exercise.name}</div>
        <div style={{ fontSize: 11, color: C.txtMute, marginTop: 4, marginBottom: 18, fontFamily: FONT }}>
          Stesso gruppo muscolare · {readOnly ? "Anteprima" : "Solo questa sessione"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={readOnly ? undefined : () => { onSwap(variant); onClose(); }}
              disabled={readOnly}
              style={{
                background: C.surfHi,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "12px 14px",
                cursor: readOnly ? "default" : "pointer",
                textAlign: "left",
                fontFamily: FONT,
                color: C.txt,
                transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <div style={{ fontSize: 14, color: C.txt, marginBottom: 4 }}>{variant.name}</div>
              <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 6 }}>
                {variant.muscle}
              </div>
              <div style={{ fontSize: 12, color: accent, fontFamily: FONT, marginBottom: 8 }}>
                {variant.kg > 0 ? `${variant.kg} ${variant.unit}` : "corpo libero"} · {variant.sets}×{variant.reps}
              </div>
              <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55 }}>{variant.tip}</div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 14 }}
        >
          {readOnly ? "Chiudi" : "Mantieni originale"}
        </button>
      </div>
    </div>
  );
}
