import { useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import {
  CATEGORY_LABELS,
  TIME_OF_DAY_LABELS,
  HABIT_COLORS,
  EMOJI_PRESETS,
} from "../data/suggestedHabits.js";

const DAYS = [
  { idx: 1, lbl: "L" },
  { idx: 2, lbl: "M" },
  { idx: 3, lbl: "M" },
  { idx: 4, lbl: "G" },
  { idx: 5, lbl: "V" },
  { idx: 6, lbl: "S" },
  { idx: 0, lbl: "D" },
];

const fieldStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 13, fontFamily: FONT,
  outline: "none",
};

export default function AddHabitSheet({ onSave, onClose, initial = null }) {
  const [emoji, setEmoji]         = useState(initial?.emoji ?? "✅");
  const [name, setName]           = useState(initial?.name ?? "");
  const [timeOfDay, setTimeOfDay] = useState(initial?.timeOfDay ?? "anytime");
  const [targetDays, setTargetDays] = useState(initial?.targetDays ?? [1, 2, 3, 4, 5, 6, 0]);
  const [color, setColor]         = useState(initial?.color ?? HABIT_COLORS[0]);
  const [category, setCategory]   = useState(initial?.category ?? "custom");
  const [showEmojis, setShowEmojis] = useState(false);

  const toggleDay = (idx) => {
    setTargetDays((prev) => prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort());
  };

  function handleSave() {
    if (!name.trim()) return;
    onSave({ emoji, name: name.trim(), timeOfDay, targetDays, color, category });
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surf, borderRadius: "10px 10px 0 0",
          padding: "20px 18px 28px", border: `1px solid ${C.border}`,
          maxHeight: "88vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ ...label, color: C.A, marginBottom: 6 }}>
          {initial ? "Modifica abitudine" : "Nuova abitudine"}
        </div>

        {/* Emoji */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 6 }}>Emoji</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setShowEmojis((s) => !s)}
              style={{
                width: 48, height: 48, fontSize: 24,
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 4, cursor: "pointer", flexShrink: 0,
              }}
            >
              {emoji}
            </button>
            <input
              type="text"
              maxLength={4}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value || "✅")}
              placeholder="o digita un emoji"
              style={fieldStyle}
            />
          </div>
          {showEmojis && (
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(8, 1fr)",
                gap: 4, marginTop: 8,
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 4, padding: 8,
              }}
            >
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  onClick={() => { setEmoji(e); setShowEmojis(false); }}
                  style={{
                    fontSize: 18, padding: "6px 0",
                    background: e === emoji ? C.surfHi : "transparent",
                    border: `1px solid ${e === emoji ? C.A + "55" : "transparent"}`,
                    borderRadius: 4, cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 6 }}>Nome</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es. Bevo 2.5L di acqua"
            style={fieldStyle}
            maxLength={60}
          />
        </div>

        {/* Time of day */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 6 }}>Quando</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(TIME_OF_DAY_LABELS).map(([key, lbl]) => (
              <button
                key={key}
                onClick={() => setTimeOfDay(key)}
                style={{
                  flex: 1, padding: "10px 8px",
                  background: timeOfDay === key ? C.surfHi : "none",
                  border: `1px solid ${timeOfDay === key ? C.A + "55" : C.border}`,
                  color: timeOfDay === key ? C.A : C.txtSec,
                  borderRadius: 4, fontSize: 12, fontFamily: FONT, cursor: "pointer",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Target days */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 6 }}>Giorni</div>
          <div style={{ display: "flex", gap: 4 }}>
            {DAYS.map(({ idx, lbl }) => {
              const on = targetDays.includes(idx);
              return (
                <button
                  key={`${idx}-${lbl}`}
                  onClick={() => toggleDay(idx)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: on ? C.A + "22" : "none",
                    border: `1px solid ${on ? C.A + "66" : C.border}`,
                    color: on ? C.A : C.txtSec,
                    borderRadius: 4, fontSize: 12, fontFamily: FONT, cursor: "pointer",
                  }}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 6 }}>Colore</div>
          <div style={{ display: "flex", gap: 8 }}>
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Colore ${c}`}
                style={{
                  width: 32, height: 32, borderRadius: 999,
                  background: c,
                  border: c === color ? `2px solid ${C.txt}` : `1px solid ${C.border}`,
                  cursor: "pointer",
                  transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ ...label, marginBottom: 6 }}>Categoria</div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...fieldStyle, appearance: "none" }}
          >
            {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => (
              <option key={key} value={key}>{lbl}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{ ...btn(C.A, C.bg), opacity: name.trim() ? 1 : 0.5 }}
        >
          {initial ? "Salva modifiche" : "Salva abitudine"}
        </button>
        <button
          onClick={onClose}
          style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
