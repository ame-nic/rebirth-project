import { C, FONT, label } from "../../../shared/design/tokens.js";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}

function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / (24 * 60 * 60 * 1000));
}

/* Rotates through active identity statements so the user reads a
   different one each day — without the user having to pick. */
export default function AlterEgoGreeting({ alterEgo, onOpen }) {
  // No alter ego configured → show the setup prompt instead.
  if (!alterEgo) {
    return (
      <button
        onClick={onOpen}
        style={{
          width: "100%", textAlign: "left",
          background: C.surf, border: `1px dashed ${C.A}55`,
          borderRadius: 6, padding: "14px 16px", marginBottom: 14,
          cursor: "pointer", fontFamily: FONT,
        }}
      >
        <div style={{ ...label, color: C.A, marginBottom: 4 }}>Alter ego</div>
        <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.4, marginBottom: 4 }}>
          Configura chi stai diventando.
        </div>
        <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55 }}>
          Tre minuti per scegliere un nome, un simbolo e le dichiarazioni che ti rappresentano.
        </div>
      </button>
    );
  }

  const active = (alterEgo.identity_statements || []).filter((s) => s.active && s.text);
  const todayStmt = active.length > 0 ? active[dayOfYear() % active.length] : null;

  return (
    <button
      onClick={onOpen}
      style={{
        width: "100%", textAlign: "left",
        background: `linear-gradient(135deg, ${alterEgo.color}18 0%, transparent 60%)`,
        border: `1px solid ${alterEgo.color}55`,
        borderRadius: 6, padding: "14px 16px", marginBottom: 14,
        cursor: "pointer", fontFamily: FONT,
      }}
    >
      <div style={{ ...label, color: alterEgo.color, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, letterSpacing: 0 }}>{alterEgo.emoji}</span>
        {alterEgo.name?.trim() || "Il tuo alter ego"}
      </div>
      <div style={{ fontSize: 15, color: C.txt, lineHeight: 1.4 }}>
        {greeting()}. Ricorda chi sei.
      </div>
      {todayStmt ? (
        <div style={{ fontSize: 14, color: alterEgo.color, marginTop: 8, fontStyle: "italic", lineHeight: 1.55 }}>
          "Sono qualcuno che {todayStmt.text}."
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.txtMute, marginTop: 8 }}>
          Aggiungi le tue prime dichiarazioni di identità.
        </div>
      )}
    </button>
  );
}
