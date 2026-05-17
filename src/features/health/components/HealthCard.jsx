import { C, FONT, label } from "../../../shared/design/tokens.js";

const METRICS = [
  { key: "steps",           icon: "ph-footprints",       suffix: "passi",    formatter: (v) => v.toLocaleString("it-IT") },
  { key: "sleep_hours",     icon: "ph-moon-stars",       suffix: "h sonno",  formatter: (v) => v.toFixed(1) },
  { key: "resting_hr",      icon: "ph-heartbeat",        suffix: "bpm",      formatter: (v) => String(v) },
  { key: "hrv_ms",          icon: "ph-pulse",            suffix: "ms HRV",   formatter: (v) => String(v) },
  { key: "active_calories", icon: "ph-flame",            suffix: "kcal",     formatter: (v) => String(v) },
  { key: "stand_hours",     icon: "ph-person-simple-walk", suffix: "h piedi", formatter: (v) => String(v) },
];

function formatSyncTime(iso) {
  if (!iso) return "mai";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `oggi ${time}` : d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) + ` ${time}`;
}

/* Compact health summary for the Today tab. Tappable — opens the full
   HealthScreen. Renders even with zero data so the user always has an
   entry point to the setup wizard. */
export default function HealthCard({ today, lastSync, onOpen }) {
  const hasAnyData = today && METRICS.some(({ key }) => today[key] != null);

  return (
    <button
      onClick={onOpen}
      style={{
        width: "100%", textAlign: "left",
        background: C.surf, border: `1px solid ${C.border}`,
        borderRadius: 6, padding: "12px 14px",
        marginBottom: 14, cursor: "pointer",
        fontFamily: FONT,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
        transition: "all 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div style={{ ...label, color: C.B, marginBottom: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ph ph-heart" style={{ fontSize: 11 }} />
          Apple Health
        </div>
        <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, letterSpacing: 0.3 }}>
          {formatSyncTime(lastSync)}
        </div>
      </div>

      {hasAnyData ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 12px" }}>
          {METRICS.map(({ key, icon, suffix, formatter }) => {
            const v = today?.[key];
            const isNull = v == null;
            return (
              <div
                key={key}
                style={{ display: "flex", alignItems: "center", gap: 8, opacity: isNull ? 0.4 : 1 }}
              >
                <i className={`ph ${icon}`} style={{ fontSize: 16, color: isNull ? C.txtMute : C.B, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, color: C.txt, fontFamily: FONT, fontWeight: 500 }}>
                    {isNull ? "—" : formatter(v)}
                  </div>
                  <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 1 }}>
                    {suffix}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55 }}>
          Nessun dato sincronizzato. Tocca per configurare il bridge Apple Health.
        </div>
      )}
    </button>
  );
}
