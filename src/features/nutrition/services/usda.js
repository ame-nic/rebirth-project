/* USDA FoodData Central lookup — used to estimate macros for recipes
   from sources (like TheMealDB) that ship ingredients but no nutrition.
   Free tier 1000 calls/day, cached 7 days per ingredient name. */

import { getCachedOrFetch, TTL } from "./recipeCache.js";

const ENDPOINT = "https://api.nal.usda.gov/fdc/v1/foods/search";

export function isUSDAAvailable() {
  return !!import.meta.env.VITE_USDA_API_KEY;
}

const NUTRIENT_IDS = { protein: 1003, kcal: 1008, carbs: 1005, fat: 1004 };

async function fetchUSDA(ingredientName) {
  const key = import.meta.env.VITE_USDA_API_KEY;
  const url = `${ENDPOINT}?query=${encodeURIComponent(ingredientName)}&pageSize=1&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = await res.json();
  const food = data.foods?.[0];
  if (!food) return null;

  const get = (id) => food.foodNutrients?.find((n) => n.nutrientId === id)?.value ?? 0;
  return {
    protein_per_100g: get(NUTRIENT_IDS.protein),
    kcal_per_100g:    get(NUTRIENT_IDS.kcal),
    carbs_per_100g:   get(NUTRIENT_IDS.carbs),
    fat_per_100g:     get(NUTRIENT_IDS.fat),
  };
}

export async function lookupNutrition(ingredientName) {
  if (!isUSDAAvailable() || !ingredientName) return null;
  const cacheKey = `usda_${ingredientName.toLowerCase().slice(0, 40)}`;
  try {
    return await getCachedOrFetch(cacheKey, () => fetchUSDA(ingredientName), TTL.usda);
  } catch {
    return null;
  }
}

/* Best-effort extraction of grams from strings like "200g chicken" or
   "1.5 kg potatoes". Returns null when no quantity can be inferred —
   the caller should fall back to a sensible default like 100g. */
function extractGrams(amountString = "") {
  const s = amountString.toLowerCase();
  const kg = s.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kg) return Math.round(parseFloat(kg[1]) * 1000);
  const g = s.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (g) return Math.round(parseFloat(g[1]));
  return null;
}

export async function estimateMacros(ingredients = []) {
  if (!isUSDAAvailable() || ingredients.length === 0) return null;
  let totals = { protein_g: 0, kcal: 0, carbs_g: 0, fat_g: 0 };
  for (const ing of ingredients) {
    const name   = typeof ing === "string" ? ing : (ing.name || "");
    const amount = typeof ing === "string" ? ing : (ing.amount || "");
    const grams  = extractGrams(amount) ?? 100;
    const data   = await lookupNutrition(name);
    if (!data) continue;
    totals.protein_g += (data.protein_per_100g * grams) / 100;
    totals.kcal      += (data.kcal_per_100g    * grams) / 100;
    totals.carbs_g   += (data.carbs_per_100g   * grams) / 100;
    totals.fat_g     += (data.fat_per_100g     * grams) / 100;
  }
  return {
    protein_g: Math.round(totals.protein_g),
    kcal:      Math.round(totals.kcal),
    carbs_g:   Math.round(totals.carbs_g),
    fat_g:     Math.round(totals.fat_g),
  };
}
