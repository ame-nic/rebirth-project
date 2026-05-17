import { useState, useEffect } from "react";
import { C, FONT, btn, label, pill } from "../../shared/design/tokens.js";
import { DAY_IT, todayStr, todayDOW, getWeekStart } from "../../shared/utils/date.js";
import ConfirmModal from "../../shared/components/ConfirmModal.jsx";
import SwapSheet from "./SwapSheet.jsx";
import { SESSIONS, getTodaySession } from "./data.js";

function computeStreak(workoutLog) {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 52; i++) {
    const wkStart = getWeekStart(cursor);
    const wkEnd = new Date(wkStart);
    wkEnd.setDate(wkStart.getDate() + 6);
    const inWeek = workoutLog.filter((w) => {
      const wd = new Date(w.date);
      return wd >= wkStart && wd <= wkEnd;
    });
    if (inWeek.length >= 3) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      break;
    }
  }
  return streak;
}

function SessionCard({ session, isToday, isExpanded, onToggle, onStart, workoutLog }) {
  const alreadyDone = workoutLog.some(
    (w) => w.date === todayStr() && w.id === session.id
  );
  const [swapPreview, setSwapPreview] = useState(null);

  return (
    <div
      style={{
        borderRadius: 10, overflow: "hidden", marginBottom: 10,
        border: `1px solid ${isToday ? session.color + "44" : C.border}`,
        background: isToday ? session.color + "08" : C.surf,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div
        onClick={onToggle}
        style={{
          background: `linear-gradient(135deg, ${session.color}1a 0%, transparent 60%)`,
          padding: "16px 18px 14px", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              <span style={pill(session.color)}>{session.day}</span>
              {isToday && <span style={pill(C.C)}>Oggi</span>}
              {alreadyDone && (
                <span style={{ ...pill(C.C), background: C.bg }}>✓ Fatto</span>
              )}
              {!isToday && !alreadyDone && (
                <i className="ph ph-lock" style={{ color: C.txtMute, fontSize: 14 }} />
              )}
            </div>
            <div style={{ fontSize: isToday ? 22 : 18, color: isToday ? C.txt : C.txtSec, lineHeight: 1.2 }}>
              {session.title}
            </div>
            <div style={{ fontSize: 12, color: C.txtMute, marginTop: 3 }}>{session.sub}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT }}>
              {session.exercises.length} esercizi
            </div>
            <i
              className="ph ph-caret-down"
              style={{
                color: C.txtMute, fontSize: 14,
                transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
                transform: isExpanded ? "rotate(180deg)" : "none",
              }}
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={{ borderTop: `1px solid ${C.borderLo}` }}>
          {session.exercises.map((ex, i) => (
            <div
              key={ex.id}
              style={{
                padding: "10px 18px",
                display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12,
                borderBottom: i < session.exercises.length - 1 ? `1px solid ${C.borderLo}` : "none",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14, color: C.txt }}>{ex.name}</div>
                <div style={{ fontSize: 11, color: C.txtMute, marginTop: 2, fontFamily: FONT }}>
                  {ex.muscle}
                </div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                {ex.unit !== "bw" && (
                  <div style={{ fontSize: 14, color: session.color, fontFamily: FONT }}>
                    {ex.kg} {ex.unit}
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginTop: 2 }}>
                  {ex.sets}×{ex.reps}
                </div>
              </div>
              {ex.variants && ex.variants.length > 0 ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setSwapPreview(ex); }}
                  aria-label={`Vedi varianti di ${ex.name}`}
                  style={{
                    background: "none", border: `1px solid ${C.border}`,
                    borderRadius: 4, color: C.txtSec,
                    width: 32, height: 32, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <i className="ph ph-arrows-clockwise" style={{ fontSize: 14 }} />
                </button>
              ) : <span style={{ width: 32 }} />}
            </div>
          ))}

          <div style={{ padding: "12px 16px" }}>
            {alreadyDone ? (
              <div
                style={{
                  textAlign: "center", fontSize: 13, color: C.C,
                  padding: "12px", background: C.C + "10", borderRadius: 4,
                }}
              >
                ✓ Sessione già completata oggi
              </div>
            ) : isToday ? (
              <button onClick={onStart} style={{ ...btn(session.color, C.bg), display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Avvia sessione {session.id}
                <i className="ph ph-arrow-right" style={{ fontSize: 16 }} />
              </button>
            ) : (
              <button
                onClick={onStart}
                style={{ ...btn("none", C.sport), border: `1px solid ${C.sport}44`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <i className="ph ph-warning" style={{ fontSize: 14 }} />
                Avvia fuori programma
              </button>
            )}
          </div>
        </div>
      )}

      {swapPreview && (
        <SwapSheet
          exercise={swapPreview}
          accentColor={session.color}
          readOnly
          onClose={() => setSwapPreview(null)}
        />
      )}
    </div>
  );
}

export function ActiveWorkout({ session, onFinish, onCancel }) {
  const totalSets = session.exercises.reduce((s, e) => s + e.sets, 0);

  const [logs, setLogs] = useState(() =>
    session.exercises.map((ex) => ({
      ...ex,
      usedKg: ex.kg,
      setsDone: Array(ex.sets).fill(false),
    }))
  );
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [restTimer, setRestTimer] = useState(null);
  // Original-id → variant. Session-scoped only; resets when ActiveWorkout
  // unmounts (i.e. next session start).
  const [swappedExercises, setSwappedExercises] = useState({});
  const [swapIdx, setSwapIdx] = useState(null);

  function swapExercise(exIdx, variant) {
    const originalId = session.exercises[exIdx].id;
    setSwappedExercises((prev) => ({ ...prev, [originalId]: variant }));
    setLogs(logs.map((ex, i) =>
      i === exIdx
        ? { ...variant, usedKg: variant.kg, setsDone: Array(variant.sets).fill(false) }
        : ex
    ));
  }

  const doneSets = logs.reduce((s, ex) => s + ex.setsDone.filter(Boolean).length, 0);
  const pct = Math.round((doneSets / totalSets) * 100);

  // Single interval, started when the timer becomes active and torn down
  // when it becomes inactive — the boolean dep keeps the interval from
  // restarting on every tick (which the previous setTimeout pattern did).
  const timerActive = restTimer !== null;
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => {
      setRestTimer((t) => (t == null || t <= 1) ? null : t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timerActive]);

  function toggleSet(exIdx, setIdx) {
    const updated = logs.map((ex, i) => {
      if (i !== exIdx) return ex;
      const sd = [...ex.setsDone];
      sd[setIdx] = !sd[setIdx];
      return { ...ex, setsDone: sd };
    });
    setLogs(updated);
    if (!logs[exIdx].setsDone[setIdx]) setRestTimer(90);
    if (exIdx < logs.length - 1 && updated[exIdx].setsDone.every(Boolean)) {
      setExpandedIdx(exIdx + 1);
    }
  }

  function adjustKg(exIdx, delta) {
    setLogs(logs.map((ex, i) =>
      i === exIdx ? { ...ex, usedKg: Math.max(0, ex.usedKg + delta) } : ex
    ));
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.txt, fontFamily: FONT, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ ...label, marginBottom: 2 }}>In allenamento</div>
            <div style={{ fontSize: 20, color: session.color, fontWeight: 500 }}>{session.title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, color: pct === 100 ? C.C : session.color }}>{pct}%</div>
            <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>
              {doneSets}/{totalSets} serie
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: C.surfHi, borderRadius: 2 }}>
          <div style={{ height: 3, background: session.color, borderRadius: 2, width: pct + "%", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {restTimer !== null && (
        <div
          style={{
            background: session.color + "18",
            borderBottom: `1px solid ${session.color}33`,
            padding: "10px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <div style={{ fontSize: 10, color: session.color, letterSpacing: 1.5, fontFamily: FONT, fontWeight: 500, textTransform: "uppercase" }}>Recupero</div>
          <div style={{ fontSize: 26, color: session.color, fontFamily: FONT, fontWeight: 500 }}>{restTimer}s</div>
          <button
            onClick={() => setRestTimer(null)}
            style={{ background: "none", border: `1px solid ${session.color}44`, borderRadius: 4, color: session.color, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: FONT }}
          >
            Salta
          </button>
        </div>
      )}

      <div style={{ padding: "12px 14px", overflowY: "auto", maxHeight: "calc(100vh - 160px)" }}>
        {logs.map((ex, exIdx) => {
          const allDone = ex.setsDone.every(Boolean);
          const isOpen = expandedIdx === exIdx;
          const originalEx = session.exercises[exIdx];
          const isSwapped = !!swappedExercises[originalEx.id];
          const hasVariants = (originalEx.variants || []).length > 0;
          return (
            <div
              key={originalEx.id}
              style={{
                background: allDone ? C.C + "0f" : C.surf,
                border: `1px solid ${allDone ? C.C + "44" : C.border}`,
                borderRadius: 6, marginBottom: 8, overflow: "hidden",
                transition: "all 180ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <div
                onClick={() => setExpandedIdx(isOpen ? -1 : exIdx)}
                style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 15, color: allDone ? C.C : C.txt }}>{ex.name}</div>
                    {isSwapped && (
                      <span style={{
                        fontSize: 9, fontFamily: FONT, color: C.sport,
                        border: `1px solid ${C.sport}44`, background: C.sport + "14",
                        borderRadius: 999, padding: "1px 7px",
                        letterSpacing: 0.6, textTransform: "uppercase",
                        display: "inline-flex", alignItems: "center", gap: 3,
                      }}>
                        <i className="ph ph-arrows-clockwise" style={{ fontSize: 9 }} />
                        Variante
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: C.txtMute, marginTop: 3, fontFamily: FONT }}>{ex.muscle}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {ex.unit !== "bw" && (
                    <div style={{ fontSize: 16, color: allDone ? C.C : session.color, fontFamily: FONT }}>
                      {ex.usedKg}kg
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT }}>
                    {ex.sets}×{ex.reps}
                  </div>
                </div>
                {hasVariants && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSwapIdx(exIdx); }}
                    aria-label="Sostituisci esercizio"
                    style={{
                      background: "none", border: `1px solid ${C.border}`,
                      borderRadius: 4, color: C.txtSec,
                      width: 32, height: 32, cursor: "pointer", flexShrink: 0,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <i className="ph ph-arrows-clockwise" style={{ fontSize: 14 }} />
                  </button>
                )}
              </div>

              {isOpen && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.borderLo}` }}>
                  {ex.unit !== "bw" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
                      <div style={{ ...label, marginBottom: 0 }}>Kg usati</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => adjustKg(exIdx, -2.5)} style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: C.surfHi, color: C.txtSec, fontSize: 18, cursor: "pointer" }}>−</button>
                        <div style={{ width: 56, textAlign: "center", fontSize: 18, color: C.txt, fontFamily: FONT }}>{ex.usedKg}</div>
                        <button onClick={() => adjustKg(exIdx, 2.5)} style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: C.surfHi, color: C.txtSec, fontSize: 18, cursor: "pointer" }}>+</button>
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {ex.setsDone.map((done, setIdx) => (
                      <button
                        key={setIdx}
                        onClick={() => toggleSet(exIdx, setIdx)}
                        style={{
                          width: 44, height: 44, borderRadius: 4,
                          border: `2px solid ${done ? session.color : C.border}`,
                          background: done ? session.color : C.surfHi,
                          color: done ? C.bg : C.txtMute,
                          fontSize: done ? 18 : 14, cursor: "pointer",
                          fontFamily: FONT,
                          transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        {done ? "✓" : setIdx + 1}
                      </button>
                    ))}
                  </div>
                  {ex.tip && (
                    <div style={{
                      marginTop: 14, padding: "10px 12px",
                      background: C.bg, border: `1px solid ${C.border}`,
                      borderRadius: 4, fontSize: 12, color: C.txtSec, lineHeight: 1.55,
                    }}>
                      <span style={{ color: session.color, fontFamily: FONT, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, fontSize: 10 }}>Tip · </span>
                      {ex.tip}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 8 }}>
          {pct === 100 ? (
            <button onClick={() => onFinish(logs)} style={{ ...btn(C.C, C.bg), display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <i className="ph ph-check-circle" style={{ fontSize: 16 }} />
              Sessione completata
            </button>
          ) : (
            <button
              onClick={onCancel}
              style={{ ...btn("none", C.txtMute), border: `1px solid ${C.border}` }}
            >
              Interrompi sessione
            </button>
          )}
        </div>
        <div style={{ height: 20 }} />
      </div>

      {swapIdx !== null && (
        <SwapSheet
          exercise={session.exercises[swapIdx]}
          accentColor={session.color}
          onSwap={(variant) => swapExercise(swapIdx, variant)}
          onClose={() => setSwapIdx(null)}
        />
      )}
    </div>
  );
}

export default function TodayTab({ workoutLog, onStartWorkout, onLogCalcetto }) {
  const todaySession = getTodaySession();
  const today = todayStr();
  const todayLog = workoutLog.find((w) => w.date === today);

  const [expandedId, setExpandedId] = useState(todaySession ? todaySession.id : SESSIONS[0].id);
  const [confirmSession, setConfirmSession] = useState(null);

  const weekStart = getWeekStart();
  const weekSessions = workoutLog.filter((w) => new Date(w.date) >= weekStart);
  const streak = computeStreak(workoutLog);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    const log = workoutLog.find((w) => w.date === ds);
    const isToday = ds === today;
    const session = SESSIONS.find((s) => s.dayN === d.getDay());
    return { d, ds, log, isToday, label: DAY_IT[d.getDay()], session };
  });

  function handleStartRequest(session) {
    const isToday = session.dayN === todayDOW();
    if (isToday) {
      onStartWorkout(session);
    } else {
      setConfirmSession(session);
    }
  }

  function handleConfirm() {
    onStartWorkout(confirmSession);
    setConfirmSession(null);
  }

  const headerMsg = todayLog
    ? "Ottimo lavoro."
    : todaySession
      ? "È ora di allenarsi."
      : "Giorno di riposo.";

  const adherencePct = () => {
    if (workoutLog.length === 0) return 0;
    const firstDate = new Date(workoutLog[0].date);
    const weeks = Math.max(1, Math.round((new Date() - firstDate) / (7 * 24 * 3600 * 1000)));
    return Math.min(100, Math.round((workoutLog.length / (weeks * 3)) * 100));
  };

  return (
    <>
      {confirmSession && (
        <ConfirmModal
          session={confirmSession}
          todaySession={todaySession}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmSession(null)}
        />
      )}

      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "20px 18px 16px" }}>
        <div style={{ fontSize: 10, color: C.txtSec, letterSpacing: 1.5, fontFamily: FONT, marginBottom: 6, fontWeight: 500, textTransform: "uppercase" }}>
          <span style={{ color: C.A }}>§</span>&nbsp;&nbsp;{DAY_IT[new Date().getDay()].toUpperCase()} · {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, color: C.txt, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{headerMsg}</div>
          {streak > 0 && (
            <div style={{ textAlign: "right", background: C.gold + "14", border: `1px solid ${C.gold}33`, borderRadius: 4, padding: "8px 12px" }}>
              <div style={{ fontSize: 22, color: C.gold, lineHeight: 1, fontWeight: 500 }}>{streak}</div>
              <div style={{ fontSize: 9, color: C.gold, fontFamily: FONT, letterSpacing: 1, textTransform: "uppercase" }}>Sett.</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {weekDays.map(({ ds, log, isToday, label: dayLabel, session }) => (
            <div key={ds} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: isToday ? C.txt : C.txtMute, fontFamily: FONT, marginBottom: 5 }}>
                {dayLabel.slice(0, 1)}
              </div>
              <div
                style={{
                  height: 34, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                  background: log ? (log.type === "SPORT" ? C.sport + "22" : log.color + "22") : (isToday ? C.surfHi : C.borderLo),
                  border: isToday ? `2px solid ${session ? session.color : C.border}` : `1px solid ${C.borderLo}`,
                  fontSize: 14, color: log ? (log.type === "SPORT" ? C.sport : log.color) : C.txtMute,
                  transition: "all 180ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {log ? (log.type === "SPORT" ? <i className="ph ph-soccer-ball" /> : <i className="ph ph-check" />) : (session && isToday ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: session.color, display: "inline-block" }} /> : null)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          {[
            ["Questa sett.", `${weekSessions.length}/3`, weekSessions.length >= 3 ? C.C : weekSessions.length >= 2 ? C.sport : C.A],
            ["Totali",       workoutLog.length,             C.B],
            ["Aderenza",     adherencePct() + "%",          C.gold],
          ].map(([l, v, color]) => (
            <div key={l} style={{ background: C.surf, border: `1px solid ${color}33`, borderRadius: 6, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, color, fontFamily: FONT, fontWeight: 500 }}>{v}</div>
              <div style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 4, lineHeight: 1.3, letterSpacing: 1, textTransform: "uppercase" }}>
                {l}
              </div>
            </div>
          ))}
        </div>

        {!todayLog && (
          <button
            onClick={onLogCalcetto}
            style={{ ...btn("none", C.sport), border: `1px solid ${C.sport}44`, marginBottom: 14, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <i className="ph ph-soccer-ball" style={{ fontSize: 16 }} />
            Registra calcetto o corsa
          </button>
        )}

        <div style={label}>Piano settimanale</div>

        {SESSIONS.map((s) => (
          <SessionCard
            key={s.id}
            session={s}
            isToday={s.dayN === todayDOW()}
            isExpanded={expandedId === s.id}
            onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
            onStart={() => handleStartRequest(s)}
            workoutLog={workoutLog}
          />
        ))}
        <div style={{ height: 12 }} />
      </div>
    </>
  );
}
