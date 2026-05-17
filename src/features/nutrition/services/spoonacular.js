/* Spoonacular complexSearch with nutritional filters. Free tier ~150
   calls/day, so 24h cache per (mealType × isWeekend) combo keeps us
   well under the cap. Module is a no-op if VITE_SPOONACULAR_API_KEY is
   not set. */

import { MEAL_TARGETS } from "../engine/constants.js";
import { getCachedOrFetch, TTL } from "./recipeCache.js";

const ENDPOINT = "https://api.spoonacular.com/recipes/complexSearch";

export function isSpoonacularAvailable() {
  return !!import.meta.env.VITE_SPOONACULAR_API_KEY;
}

function detectProteinSource(ingredients = []) {
  const text = ingredients.map((i) => (i.nameClean || i.name || "")).join(" ").toLowerCase();
  if (/(chicken|turkey|poultry)/.test(text))                return "chicken";
  if (/(salmon|tuna|cod|fish|shrimp|prawn|sardine|trout)/.test(text)) return "fish";
  if (/(beef|steak|veal)/.test(text))                       return "beef";
  if (/(pork|bacon|ham|sausage)/.test(text))                return "pork";
  if (/(egg)/.test(text))                                   return "eggs";
  if (/(bean|chickpea|lentil|legume|tofu|tempeh)/.test(text)) return "legumes";
  if (/(cheese|yogurt|cottage|ricotta|milk)/.test(text))    return "dairy";
  return "mixed";
}

function detectMealTypes(dishTypes = []) {
  const set = new Set();
  const text = dishTypes.join(" ").toLowerCase();
  if (/(breakfast|morning)/.test(text)) set.add("colazione");
  if (/(lunch|salad|sandwich|main course)/.test(text)) set.add("pranzo");
  if (/(dinner|main dish|main course)/.test(text)) set.add("cena");
  if (set.size === 0) {
    set.add("pranzo");
    set.add("cena");
  }
  return [...set];
}

function spoonacularToRecipe(raw) {
  const nutrients = raw.nutrition?.nutrients ?? [];
  const getN = (name) => nutrients.find((n) => n.name === name)?.amount ?? 0;

  const ingredientsRaw = raw.extendedIngredients ?? [];
  const ingredients = ingredientsRaw.map((i) => {
    const amount = i.measures?.metric?.amount;
    const unit   = i.measures?.metric?.unitShort;
    const name   = i.nameClean || i.name || "";
    return `${amount ? Math.round(amount) : ""}${unit ? unit : ""} ${name}`.trim();
  });

  const steps = (raw.analyzedInstructions?.[0]?.steps ?? []).map((s) => s.step);

  return {
    id:                  `spoonacular_${raw.id}`,
    source:              "spoonacular",
    name:                raw.title,
    name_it:             raw.title,
    meal_types:          detectMealTypes(raw.dishTypes ?? []),
    protein_g:           Math.round(getN("Protein")),
    kcal:                Math.round(getN("Calories")),
    carbs_g:             Math.round(getN("Carbohydrates")),
    fat_g:               Math.round(getN("Fat")),
    active_prep_minutes: raw.readyInMinutes ?? 20,
    total_minutes:       raw.readyInMinutes ?? 20,
    ingredients,
    steps,
    batch_friendly:      (raw.servings ?? 1) >= 3,
    one_pan:             (raw.dishTypes ?? []).some((t) => /one pot|one-pan|sheet pan/i.test(t)),
    no_cook:             (raw.readyInMinutes ?? 99) <= 5,
    protein_source:      detectProteinSource(ingredientsRaw),
    difficulty:          ingredients.length <= 4 ? 1 : ingredients.length <= 6 ? 2 : 3,
    tags:                [...(raw.dishTypes ?? []), ...(raw.diets ?? [])],
    image_url:           raw.image ?? null,
  };
}

async function fetchSpoonacular(mealType, isWeekend) {
  const targets = MEAL_TARGETS[mealType];
  const maxTime = isWeekend ? targets.prep_max_weekend : targets.prep_max_weekday;
  const params  = new URLSearchParams({
    apiKey:               import.meta.env.VITE_SPOONACULAR_API_KEY,
    minProtein:           String(targets.protein_min),
    maxProtein:           String(targets.protein_max),
    minCalories:          String(targets.kcal_min),
    maxCalories:          String(targets.kcal_max),
    maxReadyInMinutes:    String(maxTime),
    number:               "10",
    addRecipeNutrition:   "true",
    instructionsRequired: "true",
    sort:                 "healthiness",
    cuisine:              "italian,mediterranean,european",
  });

  const res = await fetch(`${ENDPOINT}?${params}`);
  if (!res.ok) throw new Error(`Spoonacular ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map(spoonacularToRecipe);
}

export async function searchSpoonacular(mealType, isWeekend) {
  if (!isSpoonacularAvailable()) return [];
  const key = `spoonacular_${mealType}_${isWeekend ? "we" : "wd"}`;
  try {
    return await getCachedOrFetch(key, () => fetchSpoonacular(mealType, isWeekend), TTL.spoonacular);
  } catch {
    return []; // degrade silently; engine has local fallback
  }
}
