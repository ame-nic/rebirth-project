import { useMemo, useState } from "react";
import { C, FONT, btn, card, label, pill } from "../../shared/design/tokens.js";
import { fmtDate } from "../../shared/utils/date.js";
import { deriveComposition } from "./utils/bodyFat.js";
import MeasurementForm from "./components/MeasurementForm.jsx";
import RecompositionChart from "./components/RecompositionChart.jsx";
import MeasurementSummary from "./components/MeasurementSummary.jsx";
import MeasurementTrends from "./components/MeasurementTrends.jsx";

function HistoryItem({ m, onEdit, onDelete }) {
  const comp = deriveComposition(m);
  return (
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ ...label, color: C.gold, marginBottom: 0 }}>{fmtDate(m.date)}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onEdit(m)}
            aria-label="Modifica"
            style={iconBtn(C.txtSec)}
          >
            <i className="ph ph-pencil-simple" style={{ fontSize: 11 }} />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Eliminare la misurazione del ${fmtDate(m.date)}?`)) onDelete(m.date);
            }}
            aria-label="Elimina"
            style={iconBtn(C.D)}
          >
            <i className="ph ph-trash" style={{ fontSize: 11 }} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 8, fontFamily: FONT }}>
        <div>
          <div style={{ fontSize: 18, color: C.txt, fontWeight: 500 }}>{m.weight_kg}<span style={{ color: C.txtMute, fontSize: 10, marginLeft: 4 }}>kg</span></div>
          <div style={{ fontSize: 9, color: C.txtMute, letterSpacing: 0.5, textTransform: "uppercase" }}>Peso</div>
        </div>
        {comp && (
          <>
            <div>
              <div style={{ fontSize: 18, color: C.B, fontWeight: 500 }}>~{comp.bodyFatPct}<span style={{ color: C.txtMute, fontSize: 10, marginLeft: 2 }}>%</span></div>
              <div style={{ fontSize: 9, color: C.txtMute, letterSpacing: 0.5, textTransform: "uppercase" }}>%BF</div>
            </div>
            <div>
              <div style={{ fontSize: 18, color: C.C, fontWeight: 500 }}>~{comp.leanKg}<span style={{ color: C.txtMute, fontSize: 10, marginLeft: 4 }}>kg</span></div>
              <div style={{ fontSize: 9, color: C.txtMute, letterSpacing: 0.5, textTransform: "uppercase" }}>Magra</div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["chest_cm", "waist_cm", "hips_cm", "arm_cm", "thigh_cm", "neck_cm"].map((k) => {
          if (!Number.isFinite(m[k])) return null;
          const lbl = { chest_cm: "Petto", waist_cm: "Vita", hips_cm: "Fianchi", arm_cm: "Braccio", thigh_cm: "Coscia", neck_cm: "Collo" }[k];
          return (
            <span key={k} style={pill(C.txtSec)}>
              {lbl} {m[k]}cm
            </span>
          );
        })}
      </div>

      {m.notes && (
        <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginTop: 8, fontStyle: "italic" }}>
          {m.notes}
        </div>
      )}
    </div>
  );
}

function iconBtn(color) {
  return {
    width: 26, height: 26, borderRadius: 4,
    background: "none", border: `1px solid ${C.border}`,
    color, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}

export default function Measurements({ measurementsApi }) {
  const { measurements, latest, first, addMeasurement, removeMeasurement } = measurementsApi;
  const [adding, setAdding]   = useState(false);
  const [editing, setEditing] = useState(null);

  const reversed = useMemo(() => [...measurements].reverse(), [measurements]);

  return (
    <>
      {measurements.length === 0 ? (
        <div style={{ ...card(), textAlign: "center", padding: "28px 18px" }}>
          <i className="ph ph-ruler" style={{ fontSize: 40, color: C.txtMute, display: "block", marginBottom: 12 }} />
          <div style={{ fontSize: 16, color: C.txt, fontWeight: 500, marginBottom: 6 }}>
            Nessuna misurazione.
          </div>
          <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.6, marginBottom: 18 }}>
            Un metro da sarta, sette numeri al mese. La recomposizione si vede qui prima che sulla bilancia.
          </div>
          <button onClick={() => setAdding(true)} style={btn(C.A, C.bg)}>
            Aggiungi la prima misurazione
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setAdding(true)}
            style={{
              ...btn(C.surf, C.txt), border: `1px solid ${C.border}`,
              marginBottom: 12, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <i className="ph ph-plus" style={{ fontSize: 14 }} />
            Nuova misurazione
          </button>

          <MeasurementSummary first={first} latest={latest} />

          {measurements.length >= 2 && (
            <div style={card()}>
              <div style={{ ...label, marginBottom: 10 }}>Massa magra vs grassa</div>
              <RecompositionChart measurements={measurements} />
              <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: C.C }} />
                  <span style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>Magra</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: C.A }} />
                  <span style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>Grassa</span>
                </div>
                <span style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginLeft: "auto" }}>
                  stima ±3–4%
                </span>
              </div>
            </div>
          )}

          <MeasurementTrends measurements={measurements} />

          <div style={{ marginTop: 12 }}>
            <div style={label}>Storico</div>
            {reversed.map((m) => (
              <HistoryItem
                key={m.date}
                m={m}
                onEdit={(entry) => setEditing(entry)}
                onDelete={(date) => removeMeasurement(date)}
              />
            ))}
          </div>
        </>
      )}

      {adding && (
        <MeasurementForm onSave={addMeasurement} onClose={() => setAdding(false)} />
      )}
      {editing && (
        <MeasurementForm
          initial={editing}
          onSave={(patch) => addMeasurement({ ...editing, ...patch, date: editing.date })}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
