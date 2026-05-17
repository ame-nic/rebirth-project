import { C, FONT } from "../design/tokens.js";
import { useSyncStatus } from "../storage/useSyncStatus.js";

/* Mounted at the top of TodayTab. Silent when online — only surfaces
   when the network drops, so the user knows new changes are queued
   locally and will sync once they're back. */
export default function OfflineBanner() {
  const { isOnline } = useSyncStatus();
  if (isOnline) return null;

  return (
    <div
      style={{
        background: C.sport + "1a",
        border: `1px solid ${C.sport}44`,
        borderRadius: 4,
        padding: "10px 14px",
        marginBottom: 12,
        fontSize: 12,
        color: C.sport,
        fontFamily: FONT,
        display: "flex",
        alignItems: "center",
        gap: 8,
        lineHeight: 1.5,
      }}
    >
      <i className="ph ph-cloud-slash" style={{ fontSize: 16, flexShrink: 0 }} />
      <span>Offline — i dati restano locali, sincronizzo appena torni online.</span>
    </div>
  );
}
