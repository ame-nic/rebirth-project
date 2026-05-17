import { buildRecentlyUsedSet, getAllCandidates } from "./planGenerator.js";
import { isRejected, scoreRecipe } from "./scoring.js";

/* Suggest up to 3 swap-in replacements for a meal slot. Constraints:
   - different protein source (variety drives the swap)
   - difficulty ≤ original (don't push the user toward harder cooking)
   - not used in the last 2 weeks
   - passes all hard meal-target rules */
export async function suggestVariants(currentRecipe, mealType, isWeekend) {
  if (!currentRecipe) return [];
  const recentlyUsed = await buildRecentlyUsedSet(14);
  const pool = await getAllCandidates(mealType, isWeekend);

  const variants = pool
    .filter((r) =>
      r.id !== currentRecipe.id &&
      r.protein_source !== currentRecipe.protein_source &&
      (r.difficulty ?? 2) <= (currentRecipe.difficulty ?? 2) &&
      !recentlyUsed.has(r.id) &&
      !isRejected(r, mealType, isWeekend)
    )
    .map((r) => ({ r, score: scoreRecipe(r, mealType, isWeekend) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.r);

  // If we filtered too aggressively, relax the protein-source rule.
  if (variants.length === 0) {
    return pool
      .filter((r) =>
        r.id !== currentRecipe.id &&
        (r.difficulty ?? 2) <= (currentRecipe.difficulty ?? 2) &&
        !isRejected(r, mealType, isWeekend)
      )
      .map((r) => ({ r, score: scoreRecipe(r, mealType, isWeekend) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.r);
  }

  return variants;
}
