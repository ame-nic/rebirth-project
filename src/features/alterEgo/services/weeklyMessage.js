/* Weekly alter-ego message generation. Hits /api/ai (Gemini → OpenRouter
   fallback handled server-side). Cached per ISO week so a Sunday open
   doesn't re-burn tokens. Always graceful: falls back to pre-written
   copy if the AI is unavailable. */

import { callAIWithFallback } from "../../../shared/services/ai.js";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";

const STORAGE_KEY  = "rebirth_weekly_ai_message";
const TTL_MS       = 7 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT =
  "Sei la voce di un coach interiore — diretto, caldo, orientato al futuro. " +
  "Rispondi in italiano in 2-3 frasi brevi. Niente luoghi comuni, niente esclamazioni " +
  "eccessive, niente emoji. Fai riferimento a numeri specifici se forniti. " +
  "Chiudi con un'affermazione prospettica.";

function isoWeekKey(d = new Date()) {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  const dow = dd.getDay() === 0 ? 6 : dd.getDay() - 1; // Mon=0..Sun=6
  dd.setDate(dd.getDate() - dow);
  return dd.toISOString().slice(0, 10);
}

function buildPrompt(alterEgo, weekStats) {
  const ego = alterEgo || {};
  const name = ego.name?.trim() || "qualcuno nel suo percorso di crescita";
  const desc = ego.description?.trim() || "una persona che cresce con intenzione";
  const statements = (ego.identity_statements || [])
    .filter((s) => s.active && s.text)
    .map((s) => s.text)
    .slice(0, 5)
    .join("; ");

  return [
    `Scrivi un messaggio personale per ${name}.`,
    `Descrizione: "${desc}".`,
    statements ? `Identità: è qualcuno che ${statements}.` : null,
    "",
    "Statistiche della settimana:",
    `- Sessioni di allenamento completate: ${weekStats?.sessions ?? 0}/3`,
    `- Aderenza abitudini: ${weekStats?.habitRate ?? 0}%`,
    `- Readiness medio: ${weekStats?.avgReadiness != null ? `${weekStats.avgReadiness}/10` : "non disponibile"}`,
    "",
    "Riferisciti a un numero specifico. Niente luoghi comuni. Chiudi prospetticamente.",
  ].filter(Boolean).join("\n");
}

export function fallbackMessage(weekStats) {
  const sessions  = weekStats?.sessions ?? 0;
  const habitRate = weekStats?.habitRate ?? 0;
  if (sessions >= 3 && habitRate >= 80) {
    return "Settimana solida. Sei coerente con chi hai deciso di diventare. Continua.";
  }
  if (sessions >= 2) {
    return "Buona settimana. Un'altra sessione avrebbe fatto la differenza — tienilo a mente questa settimana.";
  }
  return "La settimana è stata difficile. Va bene. Ricomincia da lunedì con una sola cosa: non saltare il lunedì.";
}

export async function loadCachedMessage() {
  return storageLoad(STORAGE_KEY, null);
}

export async function generateWeeklyMessage({ alterEgo, weekStats, forceRefresh = false } = {}) {
  const weekKey = isoWeekKey();
  const cached = await storageLoad(STORAGE_KEY, null);

  if (cached && !forceRefresh && cached.weekKey === weekKey) {
    const age = Date.now() - new Date(cached.generatedAt).getTime();
    if (age < TTL_MS) return cached;
  }

  const prompt = buildPrompt(alterEgo, weekStats);
  const aiText = await callAIWithFallback(prompt, SYSTEM_PROMPT, 180);

  const text = aiText?.trim() || fallbackMessage(weekStats);
  const result = {
    text,
    source:      aiText ? "ai" : "fallback",
    weekKey,
    generatedAt: new Date().toISOString(),
  };
  await storageSave(STORAGE_KEY, result);
  return result;
}
