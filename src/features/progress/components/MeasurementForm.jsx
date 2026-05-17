import { useMemo, useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import { estimateBodyFatNavy, estimateLeanMass } from "../utils/bodyFat.js";

const FIELDS = [
  { key: "weight_kg", lbl: "Peso",         unit: "kg", step: "0.1", required: true,  hint: null },
  { key: "waist_cm",  lbl: "Vita",         unit: "cm", step: "0.5", required: true,  hint: "punto più stretto" },
  { key: "neck_cm",   lbl: "Collo",        unit: "cm", step: "0.5", required: true,  hint: "necessario per la stima %BF" },
  { key: "chest_cm",  lbl: "Petto",        unit: "cm", step: "0.5", required: false, hint: "a livello capezzoli" },
  { key: "hips_cm",   lbl: "Fianchi",      unit: "cm", step: "0.5", required: false, hint: "punto più largo" },
  { key: "arm_cm",    lbl: "Braccio dx",   unit: "cm", step: "0.5", required: false, hint: "punto medio, rilassato" },
  { key: "thigh_cm",  lbl: "Coscia dx",    unit: "cm", step: "0.5", required: false, hint: "punto medio" },
];

const inputStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 14, fontFamily: FONT,
  outline: "none",
};

function parseNum(v) {
  if (v === "" || v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export default function MeasurementForm({ initial, onSave, onClose }) {
  const [values, setValues] = useState(() => {
    const out = { notes: initial?.notes ?? "" };
    for (const f of FIELDS) {
      out[f.key] = initial?.[f.key] != null ? String(initial[f.key]) : "";
    }
    return out;
  });
  const [saving, setSaving] = useState(false);

  const update = (key, raw) => setValues((prev) => ({ ...prev, [key]: raw }));

  /* Live preview — Navy BF computed as the user types waist/neck/weight.
     Shows the user the payoff of filling the required fields. */
  const preview = useMemo(() => {
    const weight = parseNum(values.weight_kg);
    const waist  = parseNum(values.waist_cm);
    const neck   = parseNum(values.neck_cm);
    if (!Number.isFinite(weight) || !Number.isFinite(waist) || !Number.isFinite(neck)) return null;
    const bf = estimateBodyFatNavy({ waist_cm: waist, neck_cm: neck });
    if (bf == null) return null;
    const lean = estimateLeanMass(weight, bf);
    return { bf, lean };
  }, [values.weight_kg, values.waist_cm, values.neck_cm]);

  const canSave = useMemo(() => {
    return FIELDS.filter((f) => f.required).every((f) => Number.isFinite(parseNum(values[f.key])));
  }, [values]);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const payload = { notes: values.notes?.trim() || "" };
    for (const f of FIELDS) {
      const n = parseNum(values[f.key]);
      if (n != null) payload[f.key] = n;
    }
    await onSave(payload);
    setSaving(false);
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
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ ...label, color: C.A, marginBottom: 6 }}>
          {initial ? "Modifica misurazione" : "Nuova misurazione"}
        </div>
        <div style={{
          fontSize: 12, color: C.txtSec, lineHeight: 1.6,
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 4, padding: "10px 12px", marginBottom: 16,
        }}>
          Misura sempre la mattina, a digiuno, prima di allenarti. Tape misurato senza stringere.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {FIELDS.map((f) => (
            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {f.lbl}{f.required && <span style={{ color: C.A }}> *</span>}
              </span>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step={f.step}
                  value={values[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder="—"
                  style={inputStyle}
                />
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 10, color: C.txtMute, fontFamily: FONT, pointerEvents: "none",
                }}>
                  {f.unit}
                </span>
              </div>
              {f.hint && (
                <span style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 2 }}>{f.hint}</span>
              )}
            </label>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
            Note (opzionale)
          </div>
          <input
            type="text"
            value={values.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="es. post-deload, mattina a digiuno"
            maxLength={100}
            style={inputStyle}
          />
        </div>

        {preview && (
          <div style={{
            background: C.surfHi, border: `1px solid ${C.B}55`,
            borderRadius: 4, padding: "10px 12px", marginBottom: 14,
            fontFamily: FONT,
          }}>
            <div style={{ fontSize: 10, color: C.B, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
              Anteprima
            </div>
            <div style={{ fontSize: 13, color: C.txt }}>
              Stima %BF (Navy): <span style={{ color: C.B, fontWeight: 500 }}>~{preview.bf}%</span>
              {" · "}Massa magra: <span style={{ color: C.B, fontWeight: 500 }}>~{preview.lean} kg</span>
            </div>
            <div style={{ fontSize: 10, color: C.txtMute, marginTop: 4 }}>
              Stima orientativa ±3–4%. Non sostituisce una misurazione DEXA.
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{ ...btn(C.A, C.bg), opacity: canSave ? 1 : 0.5 }}
        >
          {saving ? "Salvataggio…" : "Salva misurazione"}
        </button>
        <button
          onClick={onClose}
          style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
