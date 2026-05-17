import { useEffect, useState } from "react";
import { C, FONT } from "../design/tokens.js";
import { TOAST_EVENT } from "../toast.js";

const DURATION_MS = 4500;

const KIND_COLOR = {
  info:    C.txtSec,
  success: C.C,
  error:   C.D,
  warn:    C.sport,
};

const KIND_ICON = {
  info:    "ph-info",
  success: "ph-check-circle",
  error:   "ph-warning-circle",
  warn:    "ph-warning",
};

export default function Toast() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onToast(e) {
      const t = e.detail;
      setItems((prev) => [...prev, t]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, DURATION_MS);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(76px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: 406,
        display: "flex", flexDirection: "column", gap: 8,
        zIndex: 250,
        pointerEvents: "none",
      }}
    >
      {items.map((t) => {
        const color = KIND_COLOR[t.kind] ?? C.txtSec;
        return (
          <div
            key={t.id}
            role="status"
            style={{
              background: C.surf,
              border: `1px solid ${color}55`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 4,
              padding: "10px 12px",
              fontSize: 12,
              color: C.txt,
              fontFamily: FONT,
              lineHeight: 1.5,
              display: "flex", alignItems: "flex-start", gap: 10,
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
              pointerEvents: "auto",
            }}
          >
            <i className={`ph ${KIND_ICON[t.kind] ?? KIND_ICON.info}`} style={{ fontSize: 16, color, flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>{t.message}</div>
          </div>
        );
      })}
    </div>
  );
}
