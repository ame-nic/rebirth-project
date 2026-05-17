import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import { MILESTONE_MESSAGES } from "../data/emojiPalette.js";

/* Full-screen modal triggered by habit:milestone events. Calm, no
   confetti — the visual weight comes from typographic restraint and
   the alter ego's chosen accent color. */
export default function MilestoneCelebration({ celebration, alterEgo, habits, onDismiss }) {
  if (!celebration || !alterEgo) return null;
  const habit = habits.find((h) => h.id === celebration.habitId);
  if (!habit) return null;

  const message = MILESTONE_MESSAGES[celebration.streak] ?? "Un altro giorno coerente.";
  const accent = alterEgo.color;

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surf, border: `1px solid ${accent}66`,
          borderRadius: 10, padding: "32px 24px",
          maxWidth: 380, width: "100%", textAlign: "center",
          fontFamily: FONT,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 12, lineHeight: 1 }}>{alterEgo.emoji}</div>
        <div style={{ ...label, color: accent, marginBottom: 6 }}>Traguardo</div>
        <div style={{ fontSize: 48, color: accent, fontFamily: FONT, fontWeight: 500, lineHeight: 1, marginBottom: 8 }}>
          {celebration.streak}
        </div>
        <div style={{ fontSize: 13, color: C.txtSec, fontFamily: FONT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 24 }}>
          Giorni · {habit.name}
        </div>
        <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.7, marginBottom: 24 }}>
          {message}
        </div>
        {alterEgo.name?.trim() && (
          <div style={{ fontSize: 12, color: accent, fontStyle: "italic", lineHeight: 1.6, marginBottom: 24 }}>
            "{alterEgo.name} sa che non si torna indietro."
          </div>
        )}
        <button onClick={onDismiss} style={btn(accent, C.bg)}>
          Continua
        </button>
      </div>
    </div>
  );
}
