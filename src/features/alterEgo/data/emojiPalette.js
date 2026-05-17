/* Symbol + color choices for the alter ego. Emojis here are user-chosen
   identity expressions, not UI chrome — they're allowed to stay
   pictographic. Colors map to Zeroth tokens. */

import { C } from "../../../shared/design/tokens.js";

export const ALTER_EGO_EMOJIS = [
  "🏔", "🔥", "⚔️", "🦁", "🎯", "🧱", "💎", "🌊", "⚡", "🦅",
  "🌱", "🌟", "🪨", "🌲", "🐺",
];

export const ALTER_EGO_COLORS = [C.A, C.B, C.C, C.D, C.sport, C.gold];

export const MILESTONE_STREAKS = [7, 21, 30, 66, 100];

export const MILESTONE_MESSAGES = {
  7:   "Una settimana intera. Il cambiamento inizia qui.",
  21:  "Tre settimane. È il primo punto di svolta — la neuroscienza lo conferma.",
  30:  "Un mese. Questa non è più una sfida — è chi sei.",
  66:  "66 giorni. La ricerca dice che è qui che le abitudini diventano automatiche.",
  100: "100 giorni. Questo è il punto di non ritorno.",
};

export const STATEMENT_CATEGORIES = {
  fitness:      { label: "Fitness" },
  nutrition:    { label: "Nutrizione" },
  learning:     { label: "Apprendimento" },
  mindset:      { label: "Mindset" },
  professional: { label: "Professionale" },
  custom:       { label: "Custom" },
};
