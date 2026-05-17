import { C, btn, label } from "../design/tokens.js";
import { DAY_IT } from "../utils/date.js";

export default function ConfirmModal({ session, todaySession, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surf, borderRadius: "10px 10px 0 0",
          padding: "24px 20px 40px", border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ ...label, color: C.sport, marginBottom: 6 }}>Attenzione</div>
        <div style={{ fontSize: 18, marginBottom: 10 }}>Sessione non programmata oggi.</div>
        <div style={{ fontSize: 14, color: C.txtSec, lineHeight: 1.7, marginBottom: 20 }}>
          Oggi è {DAY_IT[new Date().getDay()]}. La sessione programmata è{" "}
          <span style={{ color: todaySession ? todaySession.color : C.txt }}>
            {todaySession ? todaySession.title : "nessuna"}
          </span>
          . Stai per avviare{" "}
          <span style={{ color: session.color }}>
            Sessione {session.id} — {session.title}
          </span>
          .
        </div>
        <button onClick={onConfirm} style={{ ...btn(C.sport, C.bg), marginBottom: 10 }}>
          Avvia comunque
        </button>
        <button
          onClick={onCancel}
          style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}` }}
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
