import { C, FONT, btn, card, label } from "../../shared/design/tokens.js";
import ManualEntryForm from "./components/ManualEntryForm.jsx";
import ShortcutSetupWizard from "./components/ShortcutSetupWizard.jsx";

const PRIVACY_TEXT = [
  "I tuoi dati di salute restano sul tuo iPhone.",
  "rebirth non invia nessun dato a server esterni.",
  "La sincronizzazione avviene tramite un URL locale — nessuna informazione di salute lascia il dispositivo.",
  "I dati sono salvati in localStorage e puoi cancellarli in qualsiasi momento dal bottone qui sotto.",
];

export default function HealthScreen({ health, onClose }) {
  const { today, lastSync, baseline, applySnapshot, testSync, clearAll } = health;

  async function handleClear() {
    if (window.confirm("Cancellare tutti i dati di salute salvati su questo dispositivo?")) {
      await clearAll();
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.txt, fontFamily: FONT, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.txtSec, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>
          <i className="ph ph-arrow-left" />
        </button>
        <div>
          <div style={{ ...label, marginBottom: 2 }}>Sincronizzazione</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Apple Health</div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 28px" }}>
        {baseline && (
          <div style={card(`${C.B}33`)}>
            <div style={{ ...label, color: C.B, marginBottom: 8 }}>Baseline HRV</div>
            <div style={{ display: "flex", gap: 18 }}>
              <div>
                <div style={{ fontSize: 18, color: C.B, fontFamily: FONT, fontWeight: 500 }}>{baseline.avg7d} ms</div>
                <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  7 giorni · {baseline.sample_size_7d} campioni
                </div>
              </div>
              {baseline.avg30d != null && (
                <div>
                  <div style={{ fontSize: 18, color: C.B, fontFamily: FONT, fontWeight: 500 }}>{baseline.avg30d} ms</div>
                  <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    30 giorni · {baseline.sample_size_30d} campioni
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={card()}>
          <ManualEntryForm initial={today} onSave={applySnapshot} />
        </div>

        <div style={card()}>
          <ShortcutSetupWizard lastSync={lastSync} onTestSync={testSync} />
        </div>

        <div style={card(`${C.txtMute}55`)}>
          <div style={{ ...label, marginBottom: 8 }}>Privacy</div>
          {PRIVACY_TEXT.map((line, i) => (
            <div key={i} style={{ fontSize: 11, color: C.txtSec, lineHeight: 1.7, marginBottom: 4 }}>
              {line}
            </div>
          ))}
        </div>

        <button
          onClick={handleClear}
          style={{ ...btn("none", C.D), border: `1px solid ${C.D}44`, marginTop: 8 }}
        >
          <i className="ph ph-trash" style={{ marginRight: 8 }} />
          Cancella dati salute
        </button>
      </div>
    </div>
  );
}
