/* Seven starter habits shown to first-time users. Each maps to a Zeroth
   color token so the suggestion palette stays coherent. Identifiers are
   placeholders — the hook generates real UUIDs on add. */

import { C } from "../../../shared/design/tokens.js";

export const SUGGESTED_HABITS = [
  { name: "Bevo 2.5L di acqua",        emoji: "💧", category: "nutrition", timeOfDay: "anytime",  color: C.B },
  { name: "Mangio proteine target",     emoji: "🥩", category: "nutrition", timeOfDay: "evening",  color: C.A },
  { name: "Dormo almeno 7 ore",         emoji: "😴", category: "sleep",     timeOfDay: "morning",  color: C.D },
  { name: "Niente schermo dopo le 22",  emoji: "📵", category: "sleep",     timeOfDay: "evening",  color: C.D },
  { name: "Leggo 20 minuti",            emoji: "📖", category: "learning",  timeOfDay: "evening",  color: C.C },
  { name: "5 minuti di respirazione",   emoji: "🧘", category: "mindset",   timeOfDay: "morning",  color: C.C },
  { name: "Esco a camminare",           emoji: "🚶", category: "fitness",   timeOfDay: "anytime",  color: C.C },
];

export const CATEGORY_LABELS = {
  fitness:   "Fitness",
  nutrition: "Nutrizione",
  sleep:     "Sonno",
  mindset:   "Mindset",
  learning:  "Apprendimento",
  custom:    "Custom",
};

export const TIME_OF_DAY_LABELS = {
  morning: "Stamattina",
  evening: "Sera",
  anytime: "Sempre",
};

export const TIME_OF_DAY_ORDER = ["morning", "anytime", "evening"];

export const HABIT_COLORS = [C.A, C.B, C.C, C.D, C.sport, C.gold];

export const EMOJI_PRESETS = [
  "💧", "🥩", "🍎", "🥗", "🥦", "☕",
  "😴", "🛌", "📵", "💤", "⏰", "🌙",
  "🧘", "🙏", "📿", "💆", "🌱", "✨",
  "📖", "📚", "✏️", "📝", "🎓", "💡",
  "🚶", "🏃", "🏋️", "💪", "🚴", "🧗",
  "✅", "🎯", "🔥", "⭐", "💎", "🏆",
];
