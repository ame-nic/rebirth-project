import { C, FONT } from "../design/tokens.js";

const TABS = [
  ["oggi",       "ph-barbell",        "Oggi"],
  ["nutrizione", "ph-fork-knife",     "Nutrizione"],
  ["feed",       "ph-newspaper",      "Feed"],
  ["progressi",  "ph-chart-line-up",  "Progressi"],
];

export default function BottomNav({ tab, onChange, feedUnread = 0 }) {
  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: C.surf, borderTop: `1px solid ${C.border}`,
        display: "flex", zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(([id, icon, lbl]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            flex: 1, padding: "10px 0 8px", background: "none", border: "none",
            borderTop: tab === id ? `2px solid ${C.A}` : "2px solid transparent",
            color: tab === id ? C.A : C.txtMute, cursor: "pointer",
            fontSize: 9, fontFamily: FONT, letterSpacing: 1.5,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "color 120ms cubic-bezier(0.22, 1, 0.36, 1)",
            textTransform: "uppercase", fontWeight: 500,
            position: "relative",
          }}
        >
          <span style={{ position: "relative", display: "inline-flex" }}>
            <i className={`ph ${icon}`} style={{ fontSize: 22 }} />
            {id === "feed" && feedUnread > 0 && (
              <span
                aria-label={`${feedUnread} non letti`}
                style={{
                  position: "absolute",
                  top: -2, right: -8,
                  minWidth: 16, height: 16, padding: "0 4px",
                  borderRadius: 999,
                  background: C.A, color: C.bg,
                  fontSize: 9, fontFamily: FONT, fontWeight: 500,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {feedUnread > 99 ? "99+" : feedUnread}
              </span>
            )}
          </span>
          {lbl}
        </button>
      ))}
    </nav>
  );
}
