/* Zeroth design tokens — warm, document-like, mono everywhere.
   The single source of truth for colors, fonts, and shared style factories. */

export const C = {
  bg:      "#14110D",                       // page — deep warm ink
  surf:    "#1C1814",                       // card surface
  surfHi:  "#2A241D",                       // raised / hover surface
  border:  "rgba(240, 230, 210, 0.12)",     // 1px container cue
  borderLo:"rgba(240, 230, 210, 0.06)",     // hairline inside dense UI
  txt:     "#F0E6D2",                       // warm cream — primary
  txtSec:  "#C9BCA1",                       // secondary
  txtMute: "#6B5F4F",                       // muted / placeholder
  A:       "#C46E40",                       // clay-400 — primary brand
  B:       "#6E7EAA",                       // indigo — info, the one cool tone
  C:       "#8FA962",                       // moss — success
  D:       "#D88B72",                       // rust — alt session accent
  sport:   "#E8B12A",                       // amber-300 — signal
  gold:    "#F2CD64",                       // amber-200 — signal soft
};

export const FONT = "'JetBrains Mono', ui-monospace, monospace";

export const appWrap = {
  background: C.bg, minHeight: "100vh", color: C.txt,
  fontFamily: FONT, maxWidth: 430, margin: "0 auto",
  // 76px clears the BottomNav; env() adds the iOS home indicator inset
  // so content doesn't scroll under the gesture bar on notched iPhones.
  paddingBottom: "calc(76px + env(safe-area-inset-bottom))",
};

export const card = (borderColor = C.border, bgOverride = null) => ({
  background: bgOverride || C.surf,
  border: `1px solid ${borderColor}`,
  borderRadius: 6,
  padding: "14px 16px",
  marginBottom: 10,
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
});

export const label = {
  fontSize: 10, color: C.txtSec, letterSpacing: 1.5,
  fontFamily: FONT,
  fontWeight: 500, textTransform: "uppercase", marginBottom: 8,
};

export const btn = (bg, color = "#FBF7F0") => ({
  width: "100%", padding: "14px", background: bg, border: "none",
  borderRadius: 4, color, fontSize: 13, fontFamily: FONT,
  fontWeight: 500, cursor: "pointer", letterSpacing: 0,
  transition: "background 120ms cubic-bezier(0.22, 1, 0.36, 1)",
});

export const pill = (color) => ({
  background: color + "22", border: `1px solid ${color}44`,
  color, borderRadius: 999, padding: "3px 10px",
  fontSize: 10, fontFamily: FONT,
  display: "inline-block", letterSpacing: 0.8, textTransform: "uppercase",
});
