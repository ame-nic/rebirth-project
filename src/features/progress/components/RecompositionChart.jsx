import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { C, FONT } from "../../../shared/design/tokens.js";
import { fmtDate } from "../../../shared/utils/date.js";
import { deriveComposition } from "../utils/bodyFat.js";

/* Stacked bar: lean mass at the bottom, fat mass on top. The visual goal
   of recomposition is the lean stripe growing while the fat stripe
   shrinks — even when the total bar height (weight) stays similar. */
export default function RecompositionChart({ measurements }) {
  const data = useMemo(() => {
    return measurements
      .map((m) => {
        const comp = deriveComposition(m);
        if (!comp) return null;
        return {
          date:   m.date,
          weight: m.weight_kg,
          leanKg: comp.leanKg,
          fatKg:  comp.fatKg,
        };
      })
      .filter(Boolean);
  }, [measurements]);

  if (data.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0", color: C.txtMute, fontSize: 12, fontFamily: FONT }}>
        Servono almeno 2 misurazioni con vita + collo + peso per il grafico.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.borderLo} />
        <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: C.txtMute, fontSize: 9 }} />
        <YAxis tick={{ fill: C.txtMute, fontSize: 9 }} width={28} />
        <Tooltip
          contentStyle={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12 }}
          labelFormatter={fmtDate}
          formatter={(v, name) => [`${v} kg`, name]}
        />
        <Bar dataKey="leanKg" stackId="body" fill={C.C} name="Massa magra" radius={[0, 0, 4, 4]} />
        <Bar dataKey="fatKg"  stackId="body" fill={C.A} name="Massa grassa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
