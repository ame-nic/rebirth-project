import { useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";

const SCALES = [
  { key: "sleep_quality", lbl: "Qualità sonno" },
  { key: "energy_level",  lbl: "Energia" },
  { key: "mood",          lbl: "Umore" },
  { key: "soreness",      lbl: "Muscoli (5 = freschi)" },
];

function Scale({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              flex: 1, padding: "10px 0",
              background: on ? C.A + "22" : "none",
              border: `1px solid ${on ? C.A + "66" : C.border}`,
              color: on ? C.A : C.txtSec,
              borderRadius: 4, fontSize: 13, fontFamily: FONT, cursor: "pointer",
              fontWeight: on ? 500 : 400,
              transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

export default function CheckinSheet({ initial, onSave, onClose }) {
  const [sleepHours, setSleepHours]       = useState(initial?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality]   = useState(initial?.sleepQuality ?? 3);
  const [energyLevel, setEnergyLevel]     = useState(initial?.energyLevel ?? 3);
  const [mood, setMood]                   = useState(initial?.mood ?? 3);
  const [soreness, setSoreness]           = useState(initial?.soreness ?? 3);
  const [saving, setSaving]               = useState(false);

  const values = { sleep_quality: sleepQuality, energy_level: energyLevel, mood, soreness };
  const setters = {
    sleep_quality: setSleepQuality,
    energy_level:  setEnergyLevel,
    mood:          setMood,
    soreness:      setSoreness,
  };

  async function handleSubmit() {
    setSaving(true);
    await onSave({ sleepHours, sleepQuality, energyLevel, mood, soreness });
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
          maxHeight: "88vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ ...label, color: C.A, marginBottom: 6 }}>Check-in mattutino</div>
        <div style={{ fontSize: 13, color: C.txtSec, marginBottom: 18, lineHeight: 1.55 }}>
          Trenta secondi per misurare la disponibilità di oggi.
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <div style={{ ...label, marginBottom: 0 }}>Ore di sonno</div>
            <div style={{ fontSize: 14, color: C.txt, fontFamily: FONT, fontWeight: 500 }}>
              {sleepHours.toFixed(1)} h
            </div>
          </div>
          <input
            type="range"
            min="4" max="10" step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: C.A }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 2 }}>
            <span>4h</span><span>7h</span><span>10h</span>
          </div>
        </div>

        {SCALES.map(({ key, lbl }) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ ...label, marginBottom: 6 }}>{lbl}</div>
            <Scale value={values[key]} onChange={setters[key]} />
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ ...btn(C.A, C.bg), marginTop: 12 }}
        >
          {saving ? "Calcolo…" : "Calcola readiness"}
        </button>
      </div>
    </div>
  );
}
