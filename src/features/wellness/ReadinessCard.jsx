import { useState } from "react";
import { C, FONT, btn, label } from "../../shared/design/tokens.js";
import CheckinSheet from "./components/CheckinSheet.jsx";

function MicroTile({ icon, value, suffix, color, disabled }) {
  return (
    <div
      style={{
        background: C.surfHi, border: `1px solid ${C.border}`,
        borderRadius: 4, padding: "10px 8px", textAlign: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <i className={`ph ${icon}`} style={{ fontSize: 14, color: disabled ? C.txtMute : (color || C.txt) }} />
      <div style={{ fontSize: 13, color: disabled ? C.txtMute : C.txt, fontFamily: FONT, marginTop: 4, fontWeight: 500 }}>
        {disabled ? "—" : value}
      </div>
      <div style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {suffix}
      </div>
    </div>
  );
}

export default function ReadinessCard({ readiness, healthToday, baseline }) {
  const { todayScore, todayInputs, level, submitCheckin } = readiness;
  const [open, setOpen] = useState(false);

  if (todayScore == null) {
    return (
      <>
        <div
          style={{
            background: C.surf, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: "16px 16px", marginBottom: 14,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ ...label, color: C.A, marginBottom: 6 }}>Readiness</div>
          <div style={{ fontSize: 15, color: C.txt, marginBottom: 4, fontWeight: 500 }}>
            Nessun check-in oggi.
          </div>
          <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.6, marginBottom: 14 }}>
            Trenta secondi per stimare quanto è pronto il tuo corpo oggi.
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{ ...btn(C.A, C.bg), display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <i className="ph ph-sun-horizon" style={{ fontSize: 16 }} />
            Check-in mattutino
          </button>
        </div>
        {open && (
          <CheckinSheet
            onSave={submitCheckin}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  // Score known — render the rich card.
  const sleepHrs = todayInputs?.sleepHoursHealth ?? todayInputs?.sleepHours;
  const energy   = todayInputs?.energyLevel;
  const soreness = todayInputs?.soreness;
  const rhr      = todayInputs?.restingHR ?? healthToday?.resting_hr;
  const steps    = todayInputs?.stepsYesterday ?? healthToday?.steps;
  const hrv      = todayInputs?.hrv ?? healthToday?.hrv_ms;

  let hrvTrend = null;
  if (Number.isFinite(hrv) && baseline?.avg7d) {
    if (hrv > baseline.avg7d * 1.05)      hrvTrend = "up";
    else if (hrv < baseline.avg7d * 0.95) hrvTrend = "down";
    else                                  hrvTrend = "flat";
  }

  return (
    <>
      <div
        style={{
          background: C.surf,
          border: `1px solid ${level.color}55`,
          borderRadius: 6, padding: "16px 16px", marginBottom: 14,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <div style={{ ...label, color: level.color, marginBottom: 0 }}>Readiness</div>
          <button
            onClick={() => setOpen(true)}
            style={{ background: "none", border: "none", color: C.txtMute, fontSize: 11, fontFamily: FONT, cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            Aggiorna
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <i className={`ph ${level.icon}`} style={{ fontSize: 36, color: level.color }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, color: level.color, fontFamily: FONT, fontWeight: 500, lineHeight: 1 }}>
              {todayScore}<span style={{ color: C.txtMute, fontSize: 16 }}>/10</span>
              <span style={{ fontSize: 12, color: C.txtSec, marginLeft: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                {level.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55, marginTop: 6 }}>
              {level.training}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
          <MicroTile icon="ph-moon-stars"          value={sleepHrs != null ? `${sleepHrs}h` : "—"} suffix="sonno"   color={C.D} disabled={sleepHrs == null} />
          <MicroTile icon="ph-lightning"           value={energy != null ? `${energy}/5` : "—"}    suffix="energia" color={C.sport} disabled={energy == null} />
          <MicroTile icon="ph-heartbeat-bold"      value={soreness != null ? `${soreness}/5` : "—"} suffix="muscoli" color={C.C} disabled={soreness == null} />
          <MicroTile icon="ph-heartbeat"           value={rhr != null ? `${rhr}` : "—"}             suffix="rhr"     color={C.A} disabled={rhr == null} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT, fontSize: 11, color: C.txtMute }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-footprints" />
            {steps != null ? steps.toLocaleString("it-IT") + " passi ieri" : "passi —"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-pulse" />
            {hrv != null ? `HRV ${hrv} ms` : "HRV —"}
            {hrvTrend === "up"   && <i className="ph ph-arrow-up"   style={{ color: C.C, fontSize: 10 }} />}
            {hrvTrend === "down" && <i className="ph ph-arrow-down" style={{ color: C.D, fontSize: 10 }} />}
            {hrvTrend === "flat" && <i className="ph ph-minus"      style={{ color: C.txtMute, fontSize: 10 }} />}
          </div>
        </div>
      </div>

      {open && (
        <CheckinSheet
          initial={todayInputs}
          onSave={submitCheckin}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
