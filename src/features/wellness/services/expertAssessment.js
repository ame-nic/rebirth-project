/* AI Expert Assessment: builds a structured prompt from collectAllData
   output, calls the /api/ai Edge Function (Gemini → OpenRouter fallback
   already handled server-side), and parses the verdict line so the UI
   can render it with the right accent color. */

import { callAIWithFallback } from "../../../shared/services/ai.js";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";

const CACHE_KEY = "rebirth_ai_assessment";
const TTL_MS    = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT =
  "Sei un coach esperto di body recomposition, nutrizione sportiva e recupero. " +
  "Stai valutando i progressi di un atleta maschio di 35 anni, ~95kg, 186cm. " +
  "Obiettivo: recomposizione corporea (aumentare massa muscolare, ridurre massa grassa, contemporaneamente). " +
  "Rispondi ESCLUSIVAMENTE in italiano. Usa i numeri reali forniti. " +
  "Non usare frasi generiche o motivazionali vuote. Sii un esperto, non un coach social.";

function formatProgression(progression) {
  const entries = Object.entries(progression);
  if (entries.length === 0) return "non disponibile";
  return entries
    .map(([k, v]) => `${k}: ${v.start}→${v.current}kg (${v.delta > 0 ? "+" : ""}${v.delta}kg)`)
    .join(", ");
}

function buildPrompt(data) {
  const lines = [];
  lines.push("Analizza i dati degli ultimi 30 giorni. Rispondi ESATTAMENTE in questo formato:");
  lines.push("");
  lines.push('VERDETTO: [scrivi esattamente una di queste opzioni: "In rotta ✅" / "Parzialmente in rotta ⚠️" / "Fuori rotta ❌"]');
  lines.push("");
  lines.push("ANALISI:");
  lines.push("[3-4 frasi specifiche sui dati. Cosa funziona, cosa non funziona, perché.]");
  lines.push("");
  lines.push("PRIORITÀ QUESTA SETTIMANA:");
  lines.push("1. [azione concreta e specifica]");
  lines.push("2. [azione concreta e specifica]");
  lines.push("3. [azione concreta e specifica]");
  lines.push("");
  lines.push("PROIEZIONE A 4 SETTIMANE:");
  lines.push("[1-2 frasi: se continua così, cosa succederà a livello di composizione corporea]");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("DATI:");
  lines.push("");
  lines.push(`Programma: settimana ${data.programWeek}/12`);
  lines.push("");
  lines.push("ALLENAMENTO (30 giorni):");
  lines.push(`- Sessioni completate: ${data.sessionsLast30d}/${data.targetSessionsLast30d} (obiettivo 3/sett)`);
  lines.push(`- Progressione forza: ${formatProgression(data.progressionByExercise)}`);
  lines.push("");
  lines.push("RECUPERO (autovalutato):");
  lines.push(`- Readiness medio: ${data.avgReadiness30d != null ? data.avgReadiness30d + "/10" : "non disponibile"}`);
  const trendIt = data.readinessTrend === "improving" ? "in miglioramento"
                : data.readinessTrend === "declining" ? "in peggioramento" : "stabile";
  lines.push(`- Trend readiness: ${trendIt}`);
  lines.push("");
  lines.push("COMPOSIZIONE CORPOREA:");
  lines.push(`- Variazione peso 30gg: ${data.weightDelta30d > 0 ? "+" : ""}${data.weightDelta30d}kg`);
  lines.push(`- Massa magra (delta): ${data.leanMassDelta != null ? (data.leanMassDelta > 0 ? "+" : "") + data.leanMassDelta + "kg" : "non misurata — aggiungi misurazioni mensili"}`);
  lines.push(`- Massa grassa (delta): ${data.fatMassDelta != null ? (data.fatMassDelta > 0 ? "+" : "") + data.fatMassDelta + "kg" : "non misurata"}`);
  lines.push(`- Vita: ${data.latestMeasurement?.waist_cm != null ? data.latestMeasurement.waist_cm + "cm" : "non misurata"}`);
  lines.push("");
  lines.push("ADERENZA:");
  lines.push(`- Piano pasti: ${data.mealAdherence7d != null ? data.mealAdherence7d + "%" : "non tracciato"}`);
  lines.push(`- Abitudini (30gg): ${data.habitCompletionRate30d != null ? data.habitCompletionRate30d + "%" : "non tracciato"}`);
  const breakdown = Object.entries(data.habitBreakdown || {}).map(([k, v]) => `${k}: ${v}`).join(", ");
  lines.push(`- Dettaglio abitudini: ${breakdown || "non disponibile"}`);

  return lines.join("\n");
}

export async function generateExpertAssessment(data) {
  const prompt = buildPrompt(data);
  return await callAIWithFallback(prompt, SYSTEM_PROMPT, 600);
}

/* Pull the verdict line out of the response. Three known shapes:
   "In rotta ✅" | "Parzialmente in rotta ⚠️" | "Fuori rotta ❌". */
const VERDICT_PATTERN = /(In rotta|Parzialmente in rotta|Fuori rotta)\s*(✅|⚠️|❌)/;

export function parseAssessment(text) {
  if (!text) return null;
  const match = text.match(VERDICT_PATTERN);
  const verdict = match ? match[0] : null;
  // Strip the "VERDETTO: ..." prefix from the body so the verdict only
  // appears in the header pill.
  const body = text.replace(/VERDETTO:\s*[^\n]*\n+/i, "").trim();
  const color =
    verdict?.includes("✅") ? "#8FA962" :
    verdict?.includes("⚠️") ? "#F2CD64" :
    verdict?.includes("❌") ? "#D88B72" :
                              "#C9BCA1";
  return { text, body, verdict, color };
}

export async function loadOrRequestAssessment(data, forceRefresh = false) {
  const cached = await storageLoad(CACHE_KEY, null);
  if (cached && !forceRefresh) {
    const age = Date.now() - new Date(cached.generatedAt).getTime();
    if (age < TTL_MS) return cached;
  }

  const text = await generateExpertAssessment(data);
  if (!text) return cached ?? null; // graceful: fall back to stale cache rather than null-out

  const parsed = parseAssessment(text);
  const result = { ...parsed, generatedAt: new Date().toISOString() };
  await storageSave(CACHE_KEY, result);
  return result;
}

export async function clearAssessment() {
  await storageSave(CACHE_KEY, null);
}
