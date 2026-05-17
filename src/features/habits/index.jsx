import { useCallback, useMemo, useState } from "react";
import { C, FONT, btn, label } from "../../shared/design/tokens.js";
import HabitCard from "./components/HabitCard.jsx";
import AddHabitSheet from "./components/AddHabitSheet.jsx";
import HabitDetail from "./HabitDetail.jsx";
import StreakProtectionList from "../alterEgo/components/StreakProtectionList.jsx";
import {
  SUGGESTED_HABITS,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
} from "./data/suggestedHabits.js";
import { computeStreak } from "./utils/streak.js";
import {
  notificationsSupported,
  notificationsPermission,
  requestNotificationsPermission,
} from "./utils/notifications.js";

export default function HabitsTab({ habits: habitsApi, alterEgo }) {
  const {
    habits, logs, todayLogsByHabit, todayCompletionCount,
    addHabit, updateHabit, archiveHabit, toggleHabit, skipToday,
  } = habitsApi;

  const [adding, setAdding]               = useState(false);
  const [editing, setEditing]             = useState(null); // habit object
  const [detailId, setDetailId]           = useState(null);
  const [notifStatus, setNotifStatus]     = useState(notificationsPermission());

  const longestStreak = useMemo(() => {
    let best = 0;
    for (const h of habits) {
      const s = computeStreak(h.id, logs);
      if (s > best) best = s;
    }
    return best;
  }, [habits, logs]);

  const grouped = useMemo(() => {
    const out = { morning: [], anytime: [], evening: [] };
    for (const h of habits) out[h.timeOfDay]?.push(h);
    return out;
  }, [habits]);

  const handleToggle = useCallback((id) => toggleHabit(id), [toggleHabit]);
  const handleOpen   = useCallback((id) => setDetailId(id), []);

  const detailHabit = useMemo(() => habits.find((h) => h.id === detailId), [habits, detailId]);

  async function handleEnableNotifications() {
    const result = await requestNotificationsPermission();
    setNotifStatus(result);
  }

  async function handleSeedSuggestions() {
    for (const s of SUGGESTED_HABITS) {
      await addHabit(s);
    }
  }

  /* ── Detail view ────────────────────────────────────────────────────── */
  if (detailHabit) {
    return (
      <HabitDetail
        habit={detailHabit}
        logs={logs}
        onClose={() => setDetailId(null)}
        onToggle={(id) => toggleHabit(id)}
        onSkip={(id) => skipToday(id)}
        onArchive={(id) => archiveHabit(id)}
        onEdit={() => { setEditing(detailHabit); setDetailId(null); }}
      />
    );
  }

  /* ── Main list ──────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "20px 18px 16px" }}>
        <div style={{ ...label, marginBottom: 6 }}>
          <span style={{ color: C.A }}>§</span>&nbsp;&nbsp;Abitudini
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, color: C.txt, letterSpacing: "-0.02em" }}>
            {habits.length === 0
              ? "Nessuna abitudine."
              : `${todayCompletionCount}/${habits.length} oggi.`}
          </div>
          {longestStreak >= 3 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, color: C.gold }}>
                <i className="ph ph-flame-fill" />
              </div>
              <div style={{ fontSize: 9, color: C.gold, fontFamily: FONT, letterSpacing: 1, textTransform: "uppercase" }}>
                {longestStreak}g streak
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        <StreakProtectionList
          habits={habits}
          logs={logs}
          todayLogsByHabit={todayLogsByHabit}
          alterEgo={alterEgo}
          onToggleHabit={toggleHabit}
        />

        {/* Notifications status — informational; iOS PWA install required */}
        {notificationsSupported() && notifStatus === "default" && (
          <div
            style={{
              background: C.surf, border: `1px solid ${C.A}33`,
              borderRadius: 4, padding: "10px 12px", marginBottom: 12,
              fontSize: 12, color: C.txtSec, lineHeight: 1.55,
            }}
          >
            <div style={{ color: C.txt, marginBottom: 4 }}>Promemoria abitudini</div>
            Su iOS le notifiche funzionano solo dopo aver aggiunto l'app alla schermata Home.{" "}
            <button
              onClick={handleEnableNotifications}
              style={{ background: "none", border: "none", color: C.A, cursor: "pointer", padding: 0, fontSize: 12, fontFamily: FONT, textDecoration: "underline" }}
            >
              Abilita
            </button>
          </div>
        )}

        {/* Empty state with suggestion seed */}
        {habits.length === 0 && (
          <div style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 6, padding: "28px 20px", textAlign: "center" }}>
            <i className="ph ph-list-checks" style={{ fontSize: 40, color: C.txtMute, display: "block", marginBottom: 12 }} />
            <div style={{ fontSize: 16, color: C.txt, marginBottom: 6, fontWeight: 500 }}>
              Nessuna abitudine attiva.
            </div>
            <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.6, marginBottom: 20 }}>
              Inizia con sette abitudini suggerite o crea le tue.
            </div>
            <button onClick={handleSeedSuggestions} style={{ ...btn(C.A, C.bg), marginBottom: 8 }}>
              Usa le 7 suggerite
            </button>
            <button
              onClick={() => setAdding(true)}
              style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}` }}
            >
              Crea la prima
            </button>
          </div>
        )}

        {/* Grouped by time of day */}
        {habits.length > 0 && TIME_OF_DAY_ORDER.map((slot) => {
          const list = grouped[slot] ?? [];
          if (list.length === 0) return null;
          return (
            <div key={slot} style={{ marginBottom: 14 }}>
              <div style={{ ...label, color: C.txtSec, marginBottom: 8 }}>
                {TIME_OF_DAY_LABELS[slot]}
              </div>
              {list.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h}
                  todayLog={todayLogsByHabit[h.id]}
                  logs={logs}
                  onToggle={handleToggle}
                  onOpen={handleOpen}
                />
              ))}
            </div>
          );
        })}

        {habits.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            style={{ ...btn(C.surf, C.txtSec), border: `1px solid ${C.border}`, marginTop: 4, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <i className="ph ph-plus" style={{ fontSize: 14 }} />
            Nuova abitudine
          </button>
        )}

        <div style={{ height: 12 }} />
      </div>

      {adding && (
        <AddHabitSheet
          onSave={addHabit}
          onClose={() => setAdding(false)}
        />
      )}
      {editing && (
        <AddHabitSheet
          initial={editing}
          onSave={(patch) => updateHabit(editing.id, patch)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
