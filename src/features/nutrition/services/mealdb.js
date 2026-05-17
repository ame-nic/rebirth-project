/* TheMealDB — free, no key. Used as a variety fallback; nutrition data
   is missing, so we lean on USDA estimateMacros() to fill the gaps.
   When USDA isn't available, we skip TheMealDB entirely (a recipe
   without macros can't pass isRejected).

   This module errs on the side of conservative — we fetch a handful of
   recipes per meal type, filter via macros, and only contribute valid
   ones to the candidate pool. */

import { getCachedOrFetch, TTL } from "./recipeCache.js";
import { estimateMacros, isUSDAAvailable } from "./usda.js";

const BASE = "https://www.themealdb.com/api/json/v1/1";

// Ingredients that tend to mean "high protein" — used to bias the
// filter.php search toward useful candidates.
const SEED_INGREDIENTS = ["chicken_breast", "salmon", "tuna", "beef", "eggs"];

function mealdbBasicToRecipe(meal, estimated, mealTypeHint) {
  // Reconstruct ingredient list from strIngredientN / strMeasureN fields.
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name   = (meal[`strIngredient${i}`] || "").trim();
    const amount = (meal[`strMeasure${i}`] || "").trim();
    if (!name) continue;
    ingredients.push(`${amount} ${name}`.trim());
    if (ingredients.length >= 8) break;
  }

  // Split the long instructions block into short steps. TheMealDB
  // returns dense paragraphs; we cap at 5 short ones.
  const rawInstr = meal.strInstructions || "";
  const steps = rawInstr
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    id:                  `mealdb_${meal.idMeal}`,
    source:              "themealdb",
    name:                meal.strMeal,
    name_it:             meal.strMeal,
    meal_types:          [mealTypeHint],
    protein_g:           estimated?.protein_g ?? 0,
    kcal:                estimated?.kcal ?? 0,
    carbs_g:             estimated?.carbs_g ?? 0,
    fat_g:               estimated?.fat_g ?? 0,
    active_prep_minutes: Math.max(5, Math.round(steps.length * 3)),
    total_minutes:       Math.max(5, Math.round(steps.length * 4)),
    ingredients,
    steps,
    batch_friendly:      false,
    one_pan:             false,
    no_cook:             false,
    protein_source:      "mixed",
    difficulty:          ingredients.length <= 4 ? 1 : 2,
    tags:                [meal.strArea, meal.strCategory].filter(Boolean),
    image_url:           meal.strMealThumb ?? null,
  };
}

async function lookupMeal(id) {
  const res = await fetch(`${BASE}/lookup.php?i=${id}`);
  if (!res.ok) throw new Error(`MealDB lookup ${res.status}`);
  const data = await res.json();
  return data.meals?.[0] ?? null;
}

async function fetchByIngredient(ingredient) {
  const res = await fetch(`${BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
  if (!res.ok) throw new Error(`MealDB filter ${res.status}`);
  const data = await res.json();
  return data.meals ?? [];
}

async function fetchMealsForMealType(mealType) {
  // Without USDA we can't estimate nutrition, so the recipes will fail
  // isRejected on protein/kcal. Skip the calls to be a good citizen.
  if (!isUSDAAvailable()) return [];

  // Fetch a small list per seed ingredient, then enrich 1-2 with full
  // details and USDA-derived macros. We deliberately stay tiny because
  // each detail+macro path is multiple network hops.
  const all = [];
  for (const ing of SEED_INGREDIENTS.slice(0, 2)) {
    try {
      const basics = await fetchByIngredient(ing);
      // Pick the first one, fetch full detail, estimate macros.
      const pick = basics.slice(0, 2);
      for (const b of pick) {
        const full = await lookupMeal(b.idMeal);
        if (!full) continue;
        const ingredientList = [];
        for (let i = 1; i <= 20; i++) {
          const n = (full[`strIngredient${i}`] || "").trim();
          const m = (full[`strMeasure${i}`] || "").trim();
          if (!n) continue;
          ingredientList.push({ name: n, amount: m });
          if (ingredientList.length >= 8) break;
        }
        const macros = await estimateMacros(ingredientList);
        all.push(mealdbBasicToRecipe(full, macros, mealType));
      }
    } catch {
      // Skip this seed and continue with the next.
    }
  }
  return all;
}

export async function searchMealDB(mealType) {
  const key = `mealdb_${mealType}`;
  try {
    return await getCachedOrFetch(key, () => fetchMealsForMealType(mealType), TTL.mealdb);
  } catch {
    return [];
  }
}
