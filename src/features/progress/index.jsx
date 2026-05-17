import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid } from "recharts";
import { C, FONT, btn, card, label, pill } from "../../shared/design/tokens.js";
import { storageLoad, storageSave } from "../../shared/storage/index.js";
import { exportBackup } from "../../shared/storage/export.js";
import { todayStr, fmtDate, getWeekStart } from "../../shared/utils/date.js";
import HealthTrends from "../health/components/HealthTrends.jsx";
import ExpertAssessmentCard from "../wellness/components/ExpertAssessmentCard.jsx";
import Measurements from "./Measurements.jsx";
import { useMeasurements } from "./hooks/useMeasurements.js";

const MEASUREMENT_REMINDER_DAYS = 28;

export default function ProgressTab({ workoutLog, health, readiness }) {
  const [weights, setWeights]     = useState([]);
  const [newW, setNewW]           = useState("95");
  const [showInput, setShowInput] = useState(false);
  const [view, setView]           = useState("generale"); // "generale" | "misurazioni"

  const measurementsApi = useMeasurements();
  const daysSinceLastMeasurement = measurementsApi.getDaysSinceLastMeasurement();
  const measurementOverdue =
    daysSinceLastMeasurement == null ||
    daysSinceLastMeasurement > MEASUREMENT_REMINDER_DAYS;

  useEffect(() => {
    storageLoad("weightLog_v5", []).then(setWeights);
  }, []);

  async function addWeight() {
    const val = parseFloat(newW);
    if (!val) return;
    const entry = { date: todayStr(), weight: val };
    const updated = [...weights.filter((w) => w.date !== todayStr()), entry]
      .sort((a, b) => a.date.localeCompare(b.date));
    setWeights(updated);
    await storageSave("weightLog_v5", updated);
    setShowInput(false);
  }

  const weeklyData = (() => {
    const map = {};
    workoutLog.forEach((w) => {
      const ws = getWeekStart(new Date(w.date));
      const k = ws.toISOString().split("T")[0];
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .slice(-8)
      .map(([date, count]) => ({ week: fmtDate(date), sessioni: count }));
  })();

  const adherencePct = () => {
    if (workoutLog.length === 0) return 0;
    const firstDate = new Date(workoutLog[0].date);
    const weeks = Math.max(1, Math.round((new Date() - firstDate) / (7 * 24 * 3600 * 1000)));
    return Math.min(100, Math.round((workoutLog.length / (weeks * 3)) * 100));
  };

  return (
    <div>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "20px 18px 16px" }}>
        <div style={{ ...label, marginBottom: 6 }}>
          <span style={{ color: C.A }}>§</span>&nbsp;&nbsp;Progressi
        </div>
        <div style={{ fontSize: 22, color: C.txt, letterSpacing: "-0.02em" }}>Il tuo percorso.</div>
      </div>

      {/* Sub-tab toggle — minimal 2-segment split. Future expansion to
          the 4-tab layout in the spec would split the Generale content
          further (Peso / Allenamento / etc.). */}
      <div style={{ display: "flex", background: C.surf, borderBottom: `1px solid ${C.border}` }}>
        {[["generale", "Generale"], ["misurazioni", "Misurazioni"]].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              flex: 1, padding: "13px", background: "none", border: "none",
              borderBottom: view === id ? `2px solid ${C.A}` : "2px solid transparent",
              color: view === id ? C.txt : C.txtMute, cursor: "pointer",
              fontSize: 13, fontFamily: FONT,
              transition: "color 120ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Monthly measurement reminder — appears on the Generale view so
          the prompt is visible from the default landing. */}
      {view === "generale" && measurementOverdue && measurementsApi.measurements.length > 0 && (
        <div style={{ padding: "12px 14px 0" }}>
          <button
            onClick={() => setView("misurazioni")}
            style={{
              width: "100%", textAlign: "left",
              background: C.surf, border: `1px solid ${C.A}55`,
              borderRadius: 4, padding: "10px 12px",
              fontFamily: FONT, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <i className="ph ph-ruler" style={{ fontSize: 18, color: C.A, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.txt }}>
                Ultima misurazione: {daysSinceLastMeasurement} giorni fa
              </div>
              <div style={{ fontSize: 10, color: C.txtMute, marginTop: 2 }}>
                Tocca per registrare una nuova misurazione.
              </div>
            </div>
            <i className="ph ph-caret-right" style={{ fontSize: 12, color: C.txtMute }} />
          </button>
        </div>
      )}

      {view === "misurazioni" ? (
        <div style={{ padding: "14px 14px 0" }}>
          <Measurements measurementsApi={measurementsApi} />
          <div style={{ height: 12 }} />
        </div>
      ) : (
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            ["Sessioni totali",  workoutLog.length,                                                   C.A],
            ["Aderenza",         adherencePct() + "%",                                                 adherencePct() >= 80 ? C.C : adherencePct() >= 60 ? C.sport : C.A],
            ["Peso attuale",     weights.length ? weights[weights.length - 1].weight + "kg" : "—",    C.D],
            ["Sett. complete",   weeklyData.filter((w) => w.sessioni >= 3).length,                    C.gold],
          ].map(([l, v, color]) => (
            <div key={l} style={{ background: C.surf, border: `1px solid ${color}33`, borderRadius: 6, padding: "16px 14px", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)" }}>
              <div style={{ fontSize: 24, color, fontFamily: FONT, fontWeight: 500 }}>{v}</div>
              <div style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 5, lineHeight: 1.4, textTransform: "uppercase", letterSpacing: 1 }}>
                {l}
              </div>
            </div>
          ))}
        </div>

        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={label}>Peso corporeo</div>
            <button
              onClick={() => setShowInput(!showInput)}
              style={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, color: C.txtSec, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: FONT, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <i className="ph ph-plus" style={{ fontSize: 12 }} />
              Registra
            </button>
          </div>
          {showInput && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
              <button onClick={() => setNewW((w) => String(Math.max(0, parseFloat(w || 0) - 0.5).toFixed(1)))} style={{ width: 36, height: 36, borderRadius: 4, border: `1px solid ${C.border}`, background: C.surfHi, color: C.txtSec, fontSize: 18, cursor: "pointer" }}>−</button>
              <input
                type="number" value={newW} step="0.1"
                onChange={(e) => setNewW(e.target.value)}
                style={{ flex: 1, background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, color: C.txt, padding: "8px", fontSize: 18, fontFamily: FONT, textAlign: "center" }}
              />
              <button onClick={() => setNewW((w) => String((parseFloat(w || 0) + 0.5).toFixed(1)))} style={{ width: 36, height: 36, borderRadius: 4, border: `1px solid ${C.border}`, background: C.surfHi, color: C.txtSec, fontSize: 18, cursor: "pointer" }}>+</button>
              <button onClick={addWeight} style={{ width: 36, height: 36, borderRadius: 4, border: "none", background: C.C, color: C.bg, fontSize: 16, cursor: "pointer" }}>✓</button>
            </div>
          )}
          {weights.length >= 2 ? (
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={weights.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderLo} />
                <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fill: C.txtMute, fontSize: 10 }} />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: C.txtMute, fontSize: 10 }} width={34} />
                <Tooltip contentStyle={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12 }} labelFormatter={fmtDate} formatter={(v) => [v + "kg", "Peso"]} />
                <Line type="monotone" dataKey="weight" stroke={C.A} strokeWidth={2} dot={{ fill: C.A, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.txtMute, fontSize: 13 }}>
              Registra almeno 2 pesate per il grafico
            </div>
          )}
        </div>

        <div style={card()}>
          <div style={{ ...label, marginBottom: 12 }}>Sessioni a settimana</div>
          {weeklyData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={weeklyData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.borderLo} />
                <XAxis dataKey="week" tick={{ fill: C.txtMute, fontSize: 10 }} />
                <YAxis domain={[0, 4]} tick={{ fill: C.txtMute, fontSize: 10 }} width={18} />
                <Tooltip contentStyle={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 12 }} />
                <Bar dataKey="sessioni" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((e, i) => (
                    <Cell key={i} fill={e.sessioni >= 3 ? C.C : e.sessioni >= 2 ? C.sport : C.A} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", color: C.txtMute, fontSize: 13 }}>
              Completa sessioni per vedere le statistiche
            </div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {[[C.C, "3+ sess."], [C.sport, "2 sess."], [C.A, "< 2"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {readiness && (
          <ExpertAssessmentCard
            assessment={readiness.assessment}
            loading={readiness.loadingAI}
            onRequest={readiness.requestAssessment}
          />
        )}

        {health && health.snapshots && health.snapshots.length > 0 && (
          <HealthTrends snapshots={health.snapshots} />
        )}

        <div style={card()}>
          <div style={{ ...label, marginBottom: 8 }}>Backup</div>
          <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.6, marginBottom: 12 }}>
            I dati sono salvati solo su questo dispositivo. Esporta un backup periodico per non perderli.
          </div>
          <button
            onClick={exportBackup}
            style={{ ...btn(C.surfHi, C.txt), border: `1px solid ${C.border}`, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <i className="ph ph-download-simple" style={{ fontSize: 14 }} />
            Esporta dati
          </button>
        </div>

        {workoutLog.length > 0 && (
          <div>
            <div style={label}>Storico recente</div>
            {[...workoutLog].reverse().slice(0, 8).map((w, i) => (
              <div key={i} style={{ background: C.surf, border: `1px solid ${(w.color || C.sport) + "22"}`, borderRadius: 6, padding: "12px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {w.type === "SPORT" && <i className="ph ph-soccer-ball" style={{ color: C.sport, fontSize: 16 }} />}
                  <div>
                    <div style={{ fontSize: 13, color: C.txt }}>{w.type === "SPORT" ? "Calcetto / corsa" : w.title}</div>
                    <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 2 }}>{fmtDate(w.date)}</div>
                  </div>
                </div>
                <span style={pill(w.color || C.sport)}>
                  {w.type === "SPORT" ? "Sport" : `Sess. ${w.id}`}
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 12 }} />
      </div>
      )}
    </div>
  );
}
