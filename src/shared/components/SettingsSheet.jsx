import { useState } from "react";
import { C, FONT, btn, label } from "../design/tokens.js";
import { useSyncStatus } from "../storage/useSyncStatus.js";
import { syncFromRemote, pushToRemote, wipeAllData } from "../storage/index.js";
import { toast } from "../toast.js";

/* Bottom-sheet settings surface. Currently hosts sync status + danger
   zone; more settings will land here as features grow. Matches the
   ConfirmModal idiom so the visual language stays consistent. */
export default function SettingsSheet({ onClose }) {
  const { lastSyncFormatted, isOnline } = useSyncStatus();
  const [syncing, setSyncing] = useState(false);
  const [wiping,  setWiping]  = useState(false);
  const [confirmingWipe, setConfirmingWipe] = useState(false);

  async function handleForceSync() {
    if (syncing || !isOnline) return;
    setSyncing(true);
    try {
      await pushToRemote();
      await syncFromRemote();
      window.dispatchEvent(new CustomEvent("storage:synced"));
      toast("Sincronizzato con Upstash.", "success");
    } catch {
      toast("Sync non riuscito.", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function handleWipe() {
    if (wiping) return;
    setWiping(true);
    try {
      await wipeAllData();
      window.location.reload();
    } catch {
      setWiping(false);
      toast("Cancellazione non riuscita.", "error");
    }
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
          padding: "20px 20px 40px", border: `1px solid ${C.border}`,
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 18px" }} />

        <div style={{ ...label, color: C.A, marginBottom: 4 }}>Impostazioni</div>
        <div style={{ fontSize: 18, color: C.txt, marginBottom: 20, letterSpacing: "-0.02em" }}>Sistema</div>

        {/* Sync row */}
        <div
          style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: "14px 14px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, color: C.txt, fontFamily: FONT, marginBottom: 6 }}>
                Sincronizzazione dati
              </div>
              <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, lineHeight: 1.55, display: "flex", alignItems: "center", gap: 6 }}>
                <i
                  className={isOnline ? "ph ph-circle-fill" : "ph ph-circle-fill"}
                  style={{ fontSize: 8, color: isOnline ? C.C : C.A }}
                />
                {isOnline ? "Online" : "Offline"}
                <span style={{ color: C.border }}>·</span>
                Ultimo sync: {lastSyncFormatted}
              </div>
            </div>
            <button
              onClick={handleForceSync}
              disabled={syncing || !isOnline}
              style={{
                background: "none",
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                color: syncing || !isOnline ? C.txtMute : C.B,
                padding: "6px 10px",
                fontSize: 11,
                cursor: syncing || !isOnline ? "default" : "pointer",
                fontFamily: FONT,
                display: "flex", alignItems: "center", gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <i className={syncing ? "ph ph-arrows-clockwise" : "ph ph-arrows-clockwise"} style={{ fontSize: 12 }} />
              {syncing ? "Sync…" : "Forza sync"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: C.txtSec, fontFamily: FONT, lineHeight: 1.55, marginTop: 10 }}>
            I dati sono salvati su questo dispositivo e su Upstash. Il sync forza l'invio dei dati locali e il pull di quelli remoti.
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ marginTop: 18 }}>
          <div style={{ ...label, color: C.A, marginBottom: 8 }}>Zona pericolosa</div>
          {!confirmingWipe ? (
            <button
              onClick={() => setConfirmingWipe(true)}
              style={{
                width: "100%",
                background: C.A + "1a",
                border: `1px solid ${C.A}44`,
                borderRadius: 4,
                padding: "12px",
                color: C.A,
                fontSize: 13,
                fontFamily: FONT,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <i className="ph ph-trash" style={{ fontSize: 14 }} />
              Cancella tutti i dati
            </button>
          ) : (
            <div style={{ background: C.A + "12", border: `1px solid ${C.A}44`, borderRadius: 4, padding: 14 }}>
              <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.6, marginBottom: 12 }}>
                Cancella tutti i dati locali <em>e</em> quelli su Upstash. Non è reversibile.
              </div>
              <button
                onClick={handleWipe}
                disabled={wiping}
                style={{ ...btn(C.A, C.bg), marginBottom: 8, opacity: wiping ? 0.6 : 1 }}
              >
                {wiping ? "Cancellazione…" : "Sì, cancella tutto"}
              </button>
              <button
                onClick={() => setConfirmingWipe(false)}
                disabled={wiping}
                style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}` }}
              >
                Annulla
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 20 }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
