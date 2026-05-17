import { useEffect, useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import DifficultyStars from "./DifficultyStars.jsx";

/* Variant suggestion sheet — different protein source, simpler-or-equal
   cooking difficulty, recipe not used in the past 2 weeks. Mirrors the
   training/SwapSheet pattern. */
export default function RecipeSwapSheet({ current, mealType, isWeekend, onSwap, onClose, fetchVariants }) {
  const [variants, setVariants] = useState(null); // null = loading
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await fetchVariants(current, mealType, isWeekend);
        if (!cancelled) setVariants(v);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Errore caricamento varianti.");
      }
    })();
    return () => { cancelled = true; };
  }, [current, mealType, isWeekend, fetchVariants]);

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
        <div style={{ ...label, color: C.A, marginBottom: 6 }}>Sostituisci pasto</div>
        <div style={{ fontSize: 17, color: C.txt, fontWeight: 500 }}>{current.name_it ?? current.name}</div>
        <div style={{ fontSize: 11, color: C.txtMute, marginTop: 4, marginBottom: 18, fontFamily: FONT }}>
          Proteina diversa · semplicità uguale o inferiore
        </div>

        {variants === null && !error && (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.txtMute, fontSize: 13 }}>
            Caricamento varianti…
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: C.D, lineHeight: 1.6, padding: "10px 12px", border: `1px solid ${C.D}44`, borderRadius: 4 }}>
            {error}
          </div>
        )}

        {variants && variants.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: C.txtSec, fontSize: 13, lineHeight: 1.6 }}>
            Nessuna variante disponibile per questo pasto.
          </div>
        )}

        {variants && variants.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => { onSwap(v); onClose(); }}
                style={{
                  background: C.surfHi, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "12px 14px",
                  cursor: "pointer", textAlign: "left",
                  fontFamily: FONT, color: C.txt,
                  transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <div style={{ fontSize: 14, color: C.txt, marginBottom: 4 }}>{v.name_it ?? v.name}</div>
                <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 6 }}>
                  {v.protein_g}g prot · {v.kcal} kcal · {v.active_prep_minutes} min
                  &nbsp;·&nbsp;<DifficultyStars value={v.difficulty} size={9} />
                </div>
                {v.ingredients?.length > 0 && (
                  <div style={{ fontSize: 11, color: C.txtSec, lineHeight: 1.55 }}>
                    {v.ingredients.slice(0, 4).map((i) => typeof i === "string" ? i : i.name).join(" · ")}
                    {v.ingredients.length > 4 ? "…" : ""}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 14 }}
        >
          Mantieni originale
        </button>
      </div>
    </div>
  );
}
