import {
  MEAL_TARGETS,
  FORBIDDEN_TECHNIQUES,
  FORBIDDEN_EQUIPMENT,
} from "./constants.js";

/* Pure functions over a Recipe. No I/O, no React, no side effects. */

function joined(recipe) {
  // Cheap full-text view of a recipe used for technique/equipment scans.
  const stepsText = (recipe.steps || []).join(" ");
  const ingredientsText = (recipe.ingredients || [])
    .map((i) => (typeof i === "string" ? i : i?.name || ""))
    .join(" ");
  const tagsText = (recipe.tags || []).join(" ");
  return `${stepsText} ${ingredientsText} ${tagsText}`.toLowerCase();
}

export function hasForbiddenTechnique(recipe) {
  const text = joined(recipe);
  return FORBIDDEN_TECHNIQUES.some((t) => text.includes(t));
}

export function hasForbiddenEquipment(recipe) {
  const text = joined(recipe);
  return FORBIDDEN_EQUIPMENT.some((e) => text.includes(e));
}

export function isRejected(recipe, mealType, isWeekend) {
  const targets = MEAL_TARGETS[mealType];
  if (!targets) return true;
  const prepLimit = isWeekend ? targets.prep_max_weekend : targets.prep_max_weekday;

  // Defensive defaults — partial recipes from external APIs may be missing fields
  const protein = recipe.protein_g ?? -1;
  const kcal    = recipe.kcal ?? Infinity;
  const active  = recipe.active_prep_minutes ?? 999;
  const ingCount  = (recipe.ingredients || []).length;
  const stepCount = (recipe.steps || []).length;

  return (
    active > prepLimit ||
    protein < targets.protein_min ||
    protein > targets.protein_max ||
    kcal > targets.kcal_max ||
    ingCount > 8 ||
    stepCount > 5 ||
    hasForbiddenTechnique(recipe) ||
    hasForbiddenEquipment(recipe)
  );
}

export function scoreRecipe(recipe, mealType, isWeekend) {
  let score = 0;
  const protein = recipe.protein_g ?? 0;
  const kcal    = recipe.kcal ?? 1;

  // Protein density — most important factor for body recomp
  const proteinDensity = (protein / Math.max(kcal, 1)) * 100;
  if (proteinDensity >= 20) score += 40;
  else if (proteinDensity >= 15) score += 25;
  else if (proteinDensity >= 10) score += 10;

  // Simplicity
  const ingredientCount = (recipe.ingredients || []).length;
  if (ingredientCount <= 4) score += 30;
  else if (ingredientCount <= 6) score += 20;
  else if (ingredientCount <= 8) score += 5;

  const stepCount = (recipe.steps || []).length;
  if (stepCount <= 2) score += 20;
  else if (stepCount <= 3) score += 15;
  else if (stepCount <= 4) score += 8;

  // Speed
  const target = MEAL_TARGETS[mealType];
  const prepRef = isWeekend ? target.prep_max_weekend : target.prep_max_weekday;
  const prepRatio = (recipe.active_prep_minutes ?? prepRef) / prepRef;
  if (prepRatio <= 0.4) score += 20;
  else if (prepRatio <= 0.7) score += 12;
  else if (prepRatio <= 1.0) score += 5;

  if (recipe.batch_friendly) score += 15;
  if (recipe.one_pan || recipe.no_cook) score += 10;

  return score;
}

export function getVarietyPenalty(proteinSource, weekProteinSources) {
  const count = weekProteinSources[proteinSource] ?? 0;
  if (count >= 3) return 50;
  if (count >= 2) return 20;
  return 0;
}

// On training days, modest bonus for carb-heavier meals at lunch.
export function getTrainingDayBonus(recipe, isTrainingDay) {
  if (!isTrainingDay) return 0;
  if ((recipe.carbs_g ?? 0) >= 50) return 8;
  return 0;
}
