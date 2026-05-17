import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid } from "recharts";
import { C, FONT, card, label } from "../../../shared/design/tokens.js";

/* 7-day trend block for the Progress tab. Renders only the metrics that
   actually have data — if a Watch isn't paired, HRV/RHR/calories/stand
   panels simply don't appear. */

function metricColor(v, thresholds) {
  if (v == null) return C.txtMute;
  if (v >= thresholds.good) return C.C;
  if (v >= thresholds.mid)  return C.sport;
  return C.A;
}

const STEPS_THRESHOLDS = { good: 10000, mid: 7000 };

function HealthBarChart({ data, dataKey, color, fmt }) {
  if (data.length < 2) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={110}>
      <BarChart data={data} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.borderLo} />
        <XAxis dataKey="label" tick={{ fill: C.txtMute, fontSize: 10 }} />
        <YAxis tick={{ fill: C.txtMute, fontSize: 10 }} width={28} />
        <Tooltip
          contentStyle={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12 }}
          formatter={(v) => fmt ? [fmt(v), ""] : [v, ""]}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={typeof color === "function" ? color(d[dataKey]) : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function HealthLineChart({ data, dataKey, color, fmt }) {
  if (data.length < 2) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={110}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.borderLo} />
        <XAxis dataKey="label" tick={{ fill: C.txtMute, fontSize: 10 }} />
        <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: C.txtMute, fontSize: 10 }} width={32} />
        <Tooltip
          contentStyle={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12 }}
          formatter={(v) => fmt ? [fmt(v), ""] : [v, ""]}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "20px 0", color: C.txtMute, fontSize: 12 }}>
      Servono almeno 2 giorni di dati per il grafico.
    </div>
  );
}

export default function HealthTrends({ snapshots }) {
  // Build the 7-day rolling window. Missing days get null so the chart
  // visualises gaps rather than back-shifting older points.
  const data = useMemo(() => {
    const series = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const s = snapshots.find((x) => x.date === ds);
      series.push({
        date:  ds,
        label: d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
        steps:       s?.steps           ?? null,
        sleep_hours: s?.sleep_hours     ?? null,
        hrv_ms:      s?.hrv_ms          ?? null,
        resting_hr:  s?.resting_hr      ?? null,
      });
    }
    return series;
  }, [snapshots]);

  const stepsData = data.filter((d) => d.steps != null);
  const sleepData = data.filter((d) => d.sleep_hours != null);
  const hrvData   = data.filter((d) => d.hrv_ms != null);
  const rhrData   = data.filter((d) => d.resting_hr != null);

  if (stepsData.length === 0 && sleepData.length === 0 && hrvData.length === 0 && rhrData.length === 0) {
    return null;
  }

  return (
    <>
      {stepsData.length > 0 && (
        <div style={card()}>
          <div style={{ ...label, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-footprints" style={{ fontSize: 11 }} />
            Passi · ultimi 7 giorni
          </div>
          <HealthBarChart
            data={stepsData}
            dataKey="steps"
            color={(v) => metricColor(v, STEPS_THRESHOLDS)}
            fmt={(v) => v.toLocaleString("it-IT")}
          />
          <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
            {[[C.C, "≥10k"], [C.sport, "≥7k"], [C.A, "<7k"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sleepData.length > 0 && (
        <div style={card()}>
          <div style={{ ...label, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-moon-stars" style={{ fontSize: 11 }} />
            Sonno · ultimi 7 giorni
          </div>
          <HealthLineChart data={sleepData} dataKey="sleep_hours" color={C.D} fmt={(v) => `${v.toFixed(1)} h`} />
        </div>
      )}

      {hrvData.length > 0 && (
        <div style={card()}>
          <div style={{ ...label, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-pulse" style={{ fontSize: 11 }} />
            HRV · ultimi 7 giorni
          </div>
          <HealthLineChart data={hrvData} dataKey="hrv_ms" color={C.C} fmt={(v) => `${v} ms`} />
        </div>
      )}

      {rhrData.length > 0 && (
        <div style={card()}>
          <div style={{ ...label, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-heartbeat" style={{ fontSize: 11 }} />
            Frequenza a riposo · ultimi 7 giorni
          </div>
          <HealthLineChart data={rhrData} dataKey="resting_hr" color={C.A} fmt={(v) => `${v} bpm`} />
        </div>
      )}
    </>
  );
}
