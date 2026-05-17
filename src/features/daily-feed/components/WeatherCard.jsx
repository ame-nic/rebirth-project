import { C, FONT } from "../../../shared/design/tokens.js";

export default function WeatherCard({ weather }) {
  if (!weather) return null;
  return (
    <div
      style={{
        background: C.surf, border: `1px solid ${C.border}`,
        borderRadius: 6, padding: "14px 16px", marginBottom: 10,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <i
          className={`ph ${weather.icon}`}
          style={{ fontSize: 36, color: C.sport, lineHeight: 1 }}
          aria-hidden="true"
        />
        <div>
          <div style={{ fontSize: 24, color: C.txt, fontFamily: FONT, fontWeight: 500, lineHeight: 1.1 }}>
            {weather.temp}°C
          </div>
          <div style={{ fontSize: 12, color: C.txtSec, marginTop: 4 }}>{weather.description}</div>
          <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 4 }}>
            Percepita {weather.feelsLike}°
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, letterSpacing: 1, textTransform: "uppercase" }}>
          Milano · Porta Nuova
        </div>
        <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginTop: 6 }}>
          {weather.humidity}% umidità · {weather.wind} km/h
        </div>
        {weather.trainingNote && (
          <div style={{ fontSize: 11, color: C.gold, marginTop: 10, lineHeight: 1.55, textAlign: "right" }}>
            {weather.trainingNote}
          </div>
        )}
      </div>
    </div>
  );
}
