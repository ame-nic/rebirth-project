import { useRegisterSW } from "virtual:pwa-register/react";
import { C, FONT, btn } from "../design/tokens.js";

/* Surfaces a banner when a new SW version is waiting. Without this prompt,
   the user could keep using the stale bundle on every revisit because the
   plugin is configured with registerType:'prompt'. */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      // SW registration failures shouldn't crash the app — log only.
      if (typeof console !== "undefined") console.warn("[SW] register error", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(76px + env(safe-area-inset-bottom))",
        width: "calc(100% - 24px)",
        maxWidth: 406,
        background: C.surf,
        border: `1px solid ${C.A}55`,
        borderLeft: `3px solid ${C.A}`,
        borderRadius: 4,
        padding: "12px 14px",
        zIndex: 260,
        fontFamily: FONT,
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
        display: "flex", alignItems: "center", gap: 12,
      }}
    >
      <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 18, color: C.A, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.3 }}>Nuova versione disponibile</div>
        <div style={{ fontSize: 11, color: C.txtMute, marginTop: 2 }}>Ricarica per applicare l'aggiornamento.</div>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{ ...btn(C.A, C.bg), width: "auto", padding: "8px 14px", fontSize: 12 }}
      >
        Aggiorna
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="Ignora"
        style={{
          background: "none", border: `1px solid ${C.border}`,
          borderRadius: 4, color: C.txtMute,
          width: 28, height: 28, cursor: "pointer", flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <i className="ph ph-x" style={{ fontSize: 12 }} />
      </button>
    </div>
  );
}
