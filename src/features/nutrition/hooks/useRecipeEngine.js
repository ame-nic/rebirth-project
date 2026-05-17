import { useState } from "react";
import { generateWeeklyPlan } from "../engine/planGenerator.js";
import { suggestVariants } from "../engine/variants.js";
import { annotateBatchCooking } from "../engine/batchCooking.js";
import { isSpoonacularAvailable } from "../services/spoonacular.js";
import { isUSDAAvailable } from "../services/usda.js";

const PHASE_LABELS = {
  preferences: "Analisi delle tue preferenze…",
  variety:     "Verifica varietà proteica…",
  fetch:       "Ricerca ricette da fonti esterne…",
  optimize:    "Ottimizzazione piano settimanale…",
  done:        null,
};

// API availability is determined by env vars known at build time —
// no need for an effect, derive once at module load.
const STATIC_API_STATUS = Object.freeze({
  spoonacular: isSpoonacularAvailable(),
  usda:        isUSDAAvailable(),
});

export function useRecipeEngine() {
  const [loading, setLoading] = useState(false);
  const [phase, setPhase]     = useState(null);
  const apiStatus = STATIC_API_STATUS;

  async function generate() {
    setLoading(true);
    setPhase(PHASE_LABELS.preferences);
    try {
      const result = await generateWeeklyPlan({
        onProgress: (key) => {
          const lbl = PHASE_LABELS[key];
          if (lbl !== undefined) setPhase(lbl);
        },
      });
      const batch = annotateBatchCooking(result.days);
      return { ...result, batch };
    } finally {
      setLoading(false);
      setPhase(null);
    }
  }

  async function getVariants(recipe, mealType, isWeekend) {
    return suggestVariants(recipe, mealType, isWeekend);
  }

  return { generate, getVariants, loading, phase, apiStatus };
}
