import { C, FONT, card, label } from "../../../shared/design/tokens.js";

const SOURCE_ICON = {
  chicken: "ph-bird",
  fish:    "ph-fish",
  beef:    "ph-cow",
  pork:    "ph-cow",
  eggs:    "ph-egg",
  legumes: "ph-bowl-food",
};

const SOURCE_LABEL = {
  chicken: "Pollo",
  fish:    "Pesce",
  beef:    "Manzo",
  pork:    "Maiale",
  eggs:    "Uova",
  legumes: "Legumi",
};

export default function BatchCookingCard({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;
  const totalSaved = suggestions.reduce((s, x) => s + (x.time_saved_minutes || 0), 0);

  return (
    <div style={{ ...card(C.gold + "55"), background: C.surf }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ ...label, color: C.gold, marginBottom: 0 }}>Batch cooking domenicale</div>
        <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, letterSpacing: 0.5 }}>
          ~{totalSaved} min risparmiati
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55, marginBottom: 10 }}>
        Prepara ora, mangia tutta la settimana.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {suggestions.map((s) => (
          <div
            key={s.protein_source}
            style={{
              background: C.surfHi, border: `1px solid ${C.border}`,
              borderRadius: 4, padding: "10px 12px",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}
          >
            <i
              className={`ph ${SOURCE_ICON[s.protein_source] ?? "ph-bowl-food"}`}
              style={{ color: C.gold, fontSize: 18, flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C.txt }}>
                {SOURCE_LABEL[s.protein_source] ?? s.protein_source}{" "}
                <span style={{ color: C.txtMute, fontFamily: FONT, fontSize: 10 }}>
                  · {s.occurrences.length} pasti
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.txtSec, marginTop: 4, lineHeight: 1.55 }}>
                {s.instruction}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
