/* Identify protein sources that appear ≥3 times in the weekly pranzo/cena
   schedule and emit prep-ahead instructions for them. Only meaningful for
   non-trivial protein sources — "mixed" or "dairy" gets skipped. */

const INSTRUCTION_TEMPLATES = {
  chicken: (count) => `Cuoci ${count * 200}g di petto di pollo in forno domenica (200°, 25 min). Conserva in frigo fino a 5 giorni e usa già cotto.`,
  fish:    () => "Usa scatolette di tonno o sgombro per i giorni feriali. Per il pesce fresco, cuoci appena prima.",
  beef:    (count) => `Forma ${count} hamburger e conserva crudi in frigo. Cottura al momento: 4 min per lato.`,
  pork:    () => "Pre-cuoci il maiale domenica per 2 pasti, congela il resto.",
  eggs:    (count) => `Soda ${count * 3} uova domenica. Si conservano 5 giorni in frigo col guscio.`,
  legumes: () => "Apri le scatolette al momento — nessuna preparazione anticipata necessaria.",
};

const TIME_SAVED_MIN_PER_OCCURRENCE = 12;
const SAVED_RATIO = 0.7;

export function annotateBatchCooking(plan) {
  if (!Array.isArray(plan)) return [];

  // Tally main-meal occurrences per protein source.
  const tally = {};
  for (const day of plan) {
    for (const meal of ["pranzo", "cena"]) {
      const source = day?.[meal]?.protein_source;
      if (!source || source === "mixed" || source === "dairy") continue;
      if (!tally[source]) tally[source] = [];
      tally[source].push({ day: day.day, meal });
    }
  }

  const suggestions = [];
  for (const [source, occurrences] of Object.entries(tally)) {
    if (occurrences.length < 3) continue;
    const tmpl = INSTRUCTION_TEMPLATES[source] ?? ((c) => `Prepara ${source} in batch domenica (${c} pasti).`);
    suggestions.push({
      protein_source:     source,
      occurrences,
      instruction:        tmpl(occurrences.length),
      time_saved_minutes: Math.round(occurrences.length * TIME_SAVED_MIN_PER_OCCURRENCE * SAVED_RATIO),
    });
  }

  // Sort by impact (most occurrences first).
  suggestions.sort((a, b) => b.occurrences.length - a.occurrences.length);
  return suggestions;
}
