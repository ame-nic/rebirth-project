import { C, FONT, card, label } from "../../../shared/design/tokens.js";
import { deriveComposition, FIELD_DIRECTION } from "../utils/bodyFat.js";

const ROWS = [
  { key: "weight_kg", lbl: "Peso",         unit: "kg" },
  { key: "waist_cm",  lbl: "Vita",         unit: "cm" },
  { key: "chest_cm",  lbl: "Petto",        unit: "cm" },
  { key: "arm_cm",    lbl: "Braccio",      unit: "cm" },
  { key: "thigh_cm",  lbl: "Coscia",       unit: "cm" },
  { key: "hips_cm",   lbl: "Fianchi",      unit: "cm" },
  { key: "leanKg",    lbl: "Massa magra",  unit: "kg" },
  { key: "fatKg",     lbl: "Massa grassa", unit: "kg" },
];

function deltaColor(direction, delta) {
  if (!Number.isFinite(delta) || delta === 0) return C.txtMute;
  if (direction === "down") return delta < 0 ? C.C : C.D;
  if (direction === "up")   return delta > 0 ? C.C : C.D;
  return C.txtMute;
}

function deltaIcon(delta) {
  if (!Number.isFinite(delta) || delta === 0) return "ph-minus";
  return delta > 0 ? "ph-arrow-up" : "ph-arrow-down";
}

function pickValue(m, key) {
  if (key === "leanKg" || key === "fatKg") {
    const comp = deriveComposition(m);
    return comp?.[key] ?? null;
  }
  return m[key] ?? null;
}

/* Compares the first measurement against the most recent. Recomp shows
   up here: weight may be flat while lean mass increases and fat mass
   drops. */
export default function MeasurementSummary({ first, latest }) {
  if (!first || !latest || first.date === latest.date) return null;

  const compFirst   = deriveComposition(first);
  const compLatest  = deriveComposition(latest);
  const recomp =
    compFirst && compLatest &&
    (compLatest.leanKg - compFirst.leanKg) > 0.3 &&
    (compLatest.fatKg  - compFirst.fatKg ) < -0.3;

  return (
    <div style={card(`${C.gold}55`)}>
      <div style={{ ...label, color: C.gold, marginBottom: 4 }}>Da quando hai iniziato</div>
      <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 10 }}>
        {first.date} → {latest.date}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ROWS.map(({ key, lbl, unit }) => {
          const a = pickValue(first, key);
          const b = pickValue(latest, key);
          if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
          const delta = +(b - a).toFixed(1);
          const dir = FIELD_DIRECTION[key];
          const color = deltaColor(dir, delta);
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              <span style={{ width: 90, color: C.txtSec, fontFamily: FONT, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lbl}
              </span>
              <span style={{ flex: 1, color: C.txt, fontFamily: FONT }}>
                {a}{unit} → {b}{unit}
              </span>
              <span style={{ color, fontFamily: FONT, fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <i className={`ph ${deltaIcon(delta)}`} style={{ fontSize: 10 }} />
                {Math.abs(delta).toFixed(1)}{unit}
              </span>
            </div>
          );
        })}
      </div>

      {recomp && (
        <div style={{
          marginTop: 12, padding: "8px 12px",
          background: C.C + "16", border: `1px solid ${C.C}44`,
          borderRadius: 4, fontSize: 12, color: C.C,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <i className="ph ph-trend-up" style={{ fontSize: 14 }} />
          Recomposizione in atto: massa magra ↑, grassa ↓.
        </div>
      )}
    </div>
  );
}
