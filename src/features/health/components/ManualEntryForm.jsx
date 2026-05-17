import { useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import { todayStr } from "../../habits/utils/streak.js";

const FIELDS = [
  { key: "steps",       lbl: "Passi ieri",           type: "int",   suffix: "" },
  { key: "sleep_hours", lbl: "Ore sonno",            type: "float", suffix: "h" },
  { key: "hrv_ms",      lbl: "HRV (solo Watch)",     type: "int",   suffix: "ms" },
  { key: "resting_hr",  lbl: "Freq. riposo (Watch)", type: "int",   suffix: "bpm" },
  { key: "active_calories", lbl: "Kcal attive (Watch)", type: "int", suffix: "kcal" },
  { key: "stand_hours", lbl: "Ore in piedi (Watch)", type: "int",   suffix: "h" },
];

const fieldInputStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 14, fontFamily: FONT,
  outline: "none",
};

function parseValue(raw, type) {
  if (raw === "") return null;
  const n = type === "float" ? parseFloat(raw) : parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export default function ManualEntryForm({ initial, onSave }) {
  const [values, setValues] = useState(() => ({
    steps:           initial?.steps           ?? "",
    sleep_hours:     initial?.sleep_hours     ?? "",
    hrv_ms:          initial?.hrv_ms          ?? "",
    resting_hr:      initial?.resting_hr      ?? "",
    active_calories: initial?.active_calories ?? "",
    stand_hours:     initial?.stand_hours     ?? "",
  }));
  const [saving, setSaving] = useState(false);

  function handleChange(key, raw) {
    setValues((prev) => ({ ...prev, [key]: raw }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const snapshot = {
      date: todayStr(),
      source: "manual",
      receivedAt: new Date().toISOString(),
    };
    for (const f of FIELDS) {
      snapshot[f.key] = parseValue(String(values[f.key] ?? ""), f.type);
    }
    await onSave(snapshot);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
      <div style={{ ...label, marginBottom: 8 }}>Inserimento manuale</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {FIELDS.map((f) => (
          <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {f.lbl}
            </span>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                inputMode="decimal"
                step={f.type === "float" ? "0.1" : "1"}
                value={values[f.key] ?? ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                placeholder="—"
                style={fieldInputStyle}
              />
              {f.suffix && (
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 10, color: C.txtMute, fontFamily: FONT, pointerEvents: "none",
                }}>
                  {f.suffix}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
      <button
        type="submit"
        disabled={saving}
        style={{ ...btn(C.A, C.bg), marginTop: 12 }}
      >
        {saving ? "Salvataggio…" : "Salva dati di oggi"}
      </button>
    </form>
  );
}
