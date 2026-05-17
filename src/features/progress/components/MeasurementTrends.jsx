import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { C, FONT, card } from "../../../shared/design/tokens.js";
import { FIELD_DIRECTION } from "../utils/bodyFat.js";

const FIELDS = [
  { key: "chest_cm", lbl: "Petto",   color: "#C46E40" },
  { key: "waist_cm", lbl: "Vita",    color: "#D88B72" },
  { key: "hips_cm",  lbl: "Fianchi", color: "#6E7EAA" },
  { key: "arm_cm",   lbl: "Braccio", color: "#8FA962" },
  { key: "thigh_cm", lbl: "Coscia",  color: "#E8B12A" },
  { key: "neck_cm",  lbl: "Collo",   color: "#F2CD64" },
];

function dataFor(measurements, key) {
  return measurements
    .map((m) => ({ date: m.date, value: m[key] }))
    .filter((d) => Number.isFinite(d.value));
}

function trendIcon(delta, direction) {
  if (!Number.isFinite(delta) || delta === 0) return { icon: "ph-minus", color: C.txtMute };
  const good = (direction === "down" && delta < 0) || (direction === "up" && delta > 0);
  const color = good ? C.C : direction === "neutral" ? C.txtMute : C.D;
  return { icon: delta > 0 ? "ph-arrow-up" : "ph-arrow-down", color };
}

function MiniTrend({ field }) {
  const { data, lbl, color, dir } = field;
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const delta = +(last.value - prev.value).toFixed(1);
  const trend = trendIcon(delta, dir);

  return (
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: C.txtSec, fontFamily: FONT, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {lbl}
        </div>
        <div style={{ fontSize: 11, color: trend.color, fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <i className={`ph ${trend.icon}`} style={{ fontSize: 10 }} />
          {Math.abs(delta).toFixed(1)}cm
        </div>
      </div>
      <div style={{ fontSize: 16, color: C.txt, fontFamily: FONT, fontWeight: 500, marginBottom: 4 }}>
        {last.value}<span style={{ color: C.txtMute, fontSize: 10, marginLeft: 4 }}>cm</span>
      </div>
      <ResponsiveContainer width="100%" height={48}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 2, fill: color }} />
          <Tooltip
            contentStyle={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 11 }}
            formatter={(v) => [`${v} cm`, ""]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function MeasurementTrends({ measurements }) {
  const fieldsWithData = useMemo(() => {
    return FIELDS
      .map((f) => ({
        ...f,
        data: dataFor(measurements, f.key),
        dir:  FIELD_DIRECTION[f.key],
      }))
      .filter((f) => f.data.length >= 2);
  }, [measurements]);

  if (fieldsWithData.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {fieldsWithData.map((f) => <MiniTrend key={f.key} field={f} />)}
    </div>
  );
}
