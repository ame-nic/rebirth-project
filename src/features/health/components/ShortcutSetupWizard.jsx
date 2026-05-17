import { useMemo, useState } from "react";
import { C, FONT, label } from "../../../shared/design/tokens.js";
import { buildShortcutURLTemplate } from "../services/healthBridge.js";

const STEPS = [
  {
    title: "Apri Comandi → Nuovo comando",
    body: "Sull'iPhone apri l'app Comandi (Shortcuts). Tocca il + in alto a destra per creare un nuovo comando rapido. Chiamalo \"Rebirth Health Sync\".",
  },
  {
    title: "Aggiungi le azioni di lettura salute",
    body: "Cerca \"Trova campioni di salute\" e aggiungi un'azione per ogni metrica:\n" +
          "  • Conteggio passi · Periodo: Ieri\n" +
          "  • Sonno · Periodo: Ultima notte\n" +
          "  • Variabilità frequenza cardiaca · Ultima notte (solo Watch)\n" +
          "  • Frequenza cardiaca a riposo · Ieri (solo Watch)\n" +
          "Dopo ogni azione aggiungi \"Imposta variabile\" e dai il nome corrispondente (steps, sleep, hrv, rhr).",
  },
  {
    title: "Aggiungi l'azione URL",
    body: "Aggiungi un'azione \"URL\" e incolla l'indirizzo qui sotto. Dove vedi [steps], [sleep], [hrv], [rhr], sostituiscili toccando il campo e scegliendo la variabile corretta.",
  },
  {
    title: "Apri l'URL e automatizza",
    body: "Aggiungi l'azione \"Apri URL\". Salva il comando. Poi vai in Automazione → + → \"Ora del giorno\" → 07:00 → \"Esegui comando\" → seleziona Rebirth Health Sync.",
  },
];

const codeStyle = {
  display: "block",
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  padding: "10px 12px",
  fontSize: 11, fontFamily: FONT,
  color: C.txtSec, lineHeight: 1.6,
  wordBreak: "break-all",
  marginTop: 8,
};

export default function ShortcutSetupWizard({ lastSync, onTestSync }) {
  const [expanded, setExpanded] = useState(0);
  const [copied, setCopied]     = useState(false);

  const url = useMemo(() => buildShortcutURLTemplate(), []);

  async function copyURL() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard might be unavailable; the URL is shown inline anyway */
    }
  }

  function formatSync(iso) {
    if (!iso) return "mai";
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }) +
           " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ ...label, marginBottom: 8 }}>Configura Apple Shortcut</div>
      <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.6, marginBottom: 12 }}>
        Sincronizza Apple Health al PWA tramite un comando rapido. Tutti i dati restano sul tuo iPhone — nessun server esterno.
      </div>

      {STEPS.map((step, idx) => {
        const open = expanded === idx;
        return (
          <div
            key={idx}
            style={{
              background: C.surf, border: `1px solid ${C.border}`,
              borderRadius: 6, marginBottom: 6, overflow: "hidden",
            }}
          >
            <button
              onClick={() => setExpanded(open ? -1 : idx)}
              style={{
                width: "100%", textAlign: "left",
                padding: "12px 14px", background: "none", border: "none",
                color: C.txt, fontFamily: FONT, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13,
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 999,
                background: C.A + "22", color: C.A,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500, flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <span style={{ flex: 1 }}>{step.title}</span>
              <i className={`ph ${open ? "ph-caret-up" : "ph-caret-down"}`} style={{ fontSize: 12, color: C.txtMute }} />
            </button>
            {open && (
              <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.borderLo}` }}>
                <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.7, whiteSpace: "pre-line", marginTop: 10 }}>
                  {step.body}
                </div>
                {idx === 2 && (
                  <>
                    <code style={codeStyle}>{url}</code>
                    <button
                      onClick={copyURL}
                      style={{
                        marginTop: 8, background: C.surfHi, border: `1px solid ${C.border}`,
                        borderRadius: 4, color: copied ? C.C : C.txtSec,
                        padding: "6px 12px", fontSize: 11, fontFamily: FONT, cursor: "pointer",
                        display: "inline-flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <i className={`ph ${copied ? "ph-check" : "ph-copy"}`} style={{ fontSize: 12 }} />
                      {copied ? "Copiato" : "Copia URL"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div
        style={{
          marginTop: 12,
          background: C.surf, border: `1px solid ${C.border}`,
          borderRadius: 6, padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          fontFamily: FONT,
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: C.txtMute, textTransform: "uppercase", letterSpacing: 1 }}>Ultimo sync</div>
          <div style={{ fontSize: 13, color: C.txt, marginTop: 2 }}>{formatSync(lastSync)}</div>
        </div>
        <button
          onClick={onTestSync}
          style={{
            background: C.surfHi, border: `1px solid ${C.border}`,
            borderRadius: 4, color: C.A,
            padding: "8px 14px", fontSize: 12, fontFamily: FONT, cursor: "pointer",
          }}
        >
          Testa sincronizzazione
        </button>
      </div>
    </div>
  );
}
