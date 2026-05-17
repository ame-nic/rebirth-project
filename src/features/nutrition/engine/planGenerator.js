import { storageLoad, storageSave } from "../../../shared/storage/index.js";
import { LOCAL_RECIPES } from "../data.js";
import { searchSpoonacular, isSpoonacularAvailable } from "../services/spoonacular.js";
import { searchMealDB } from "../services/mealdb.js";
import { isRejected, scoreRecipe, getVarietyPenalty, getTrainingDayBonus } from "./scoring.js";
import { WEEKEND_DAYS, WEEKLY_VARIETY_RULES } from "./constants.js";

const KEY_RECENT = "rebirth_recent_recipes";
const KEY_SAVED  = "rebirth_saved_recipes";

const TRAINING_DAYS = new Set(["Lun", "Mer", "Ven", "Sab"]);
const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

/* ── Recently-used tracking ───────────────────────────────────────────── */

async function readRecentEntries() {
  const raw = await storageLoad(KEY_RECENT, []);
  if (!Array.isArray(raw)) return [];
  // Drop anything older than 30 days to keep the list bounded.
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return raw.filter((e) => new Date(e.usedAt).getTime() >= cutoff);
}

export async function buildRecentlyUsedSet(daysBack = WEEKLY_VARIETY_RULES.no_repeat_within_days) {
  const entries = await readRecentEntries();
  const cutoff  = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  return new Set(entries.filter((e) => new Date(e.usedAt).getTime() >= cutoff).map((e) => e.id));
}

async function recordPlanUsage(plan) {
  const entries = await readRecentEntries();
  const now = new Date().toISOString();
  plan.forEach((day) => {
    ["colazione", "pranzo", "cena"].forEach((meal) => {
      const r = day[meal];
      if (r?.id) entries.push({ id: r.id, usedAt: now });
    });
  });
  await storageSave(KEY_RECENT, entries);
}

/* ── Candidate aggregation ────────────────────────────────────────────── */

function deduplicateById(recipes) {
  const seen = new Set();
  return recipes.filter((r) => {
    if (!r?.id || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export async function getAllCandidates(mealType, isWeekend) {
  const local = LOCAL_RECIPES.filter((r) => r.meal_types.includes(mealType));

  let saved = [];
  try {
    const persisted = await storageLoad(KEY_SAVED, []);
    saved = (persisted || []).filter((r) => r.meal_types?.includes(mealType));
  } catch {
    // empty array fallback already initialised
  }

  const remote = await Promise.allSettled([
    searchSpoonacular(mealType, isWeekend),
    searchMealDB(mealType),
  ]);
  const remoteResults = remote.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  return deduplicateById([...local, ...saved, ...remoteResults]);
}

/* ── Selection ────────────────────────────────────────────────────────── */

function pickWithJitter(scored) {
  // Soft-randomise among the top few candidates to keep plans from being
  // deterministic. Mostly favours the top, occasionally picks 2nd or 3rd.
  if (scored.length === 0) return null;
  const top = scored.slice(0, Math.min(3, scored.length));
  const weights = [0.7, 0.2, 0.1].slice(0, top.length);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < top.length; i++) {
    r -= weights[i];
    if (r <= 0) return top[i].recipe;
  }
  return top[0].recipe;
}

export async function selectBestRecipe({ mealType, isWeekend, isTrainingDay, recentlyUsed, weekProteinSources, candidates }) {
  const pool = candidates ?? await getAllCandidates(mealType, isWeekend);

  const valid = pool.filter((r) =>
    !isRejected(r, mealType, isWeekend) &&
    !recentlyUsed.has(r.id),
  );

  if (valid.length === 0) {
    // Fallback: drop the recently-used filter rather than fail the meal.
    const looserPool = pool.filter((r) => !isRejected(r, mealType, isWeekend));
    if (looserPool.length === 0) return null;
    return looserPool[Math.floor(Math.random() * looserPool.length)];
  }

  const scored = valid.map((r) => ({
    recipe: r,
    score:  scoreRecipe(r, mealType, isWeekend)
          - getVarietyPenalty(r.protein_source, weekProteinSources)
          + getTrainingDayBonus(r, isTrainingDay),
  }));
  scored.sort((a, b) => b.score - a.score);
  return pickWithJitter(scored);
}

/* ── Plan generation ──────────────────────────────────────────────────── */

export async function generateWeeklyPlan({ onProgress } = {}) {
  const report = (phase) => { if (typeof onProgress === "function") onProgress(phase); };

  report("preferences");
  const recentlyUsed = await buildRecentlyUsedSet();

  report("variety");
  const weekProteinSources = { chicken: 0, fish: 0, beef: 0, pork: 0, eggs: 0, legumes: 0, dairy: 0, mixed: 0 };

  report("fetch");
  // Pre-warm candidate pools once per (mealType × isWeekend) — six API
  // shapes total — instead of per day.
  const candidatePools = {};
  for (const mealType of ["colazione", "pranzo", "cena"]) {
    candidatePools[`${mealType}_wd`] = await getAllCandidates(mealType, false);
    candidatePools[`${mealType}_we`] = await getAllCandidates(mealType, true);
  }

  report("optimize");
  const plan = [];
  for (const day of DAYS) {
    const isWeekend = WEEKEND_DAYS.includes(day);
    const isTrainingDay = TRAINING_DAYS.has(day);
    const dayPlan = { day, isWeekend, isTrainingDay };

    for (const mealType of ["colazione", "pranzo", "cena"]) {
      const candidates = candidatePools[`${mealType}_${isWeekend ? "we" : "wd"}`];
      const recipe = await selectBestRecipe({
        mealType, isWeekend, isTrainingDay,
        recentlyUsed, weekProteinSources, candidates,
      });
      dayPlan[mealType] = recipe;
      if (recipe) {
        recentlyUsed.add(recipe.id);
        weekProteinSources[recipe.protein_source] = (weekProteinSources[recipe.protein_source] ?? 0) + 1;
      }
    }
    plan.push(dayPlan);
  }

  report("done");
  await recordPlanUsage(plan);

  return {
    days:         plan,
    sources_used: {
      local:       true,
      spoonacular: isSpoonacularAvailable(),
      themealdb:   true,
    },
    stats: summarisePlan(plan),
  };
}

function summarisePlan(plan) {
  let fishMeals = 0, legumeMeals = 0, chickenMeals = 0, redMeatMeals = 0;
  let totalProtein = 0, totalKcal = 0, mealCount = 0;
  for (const day of plan) {
    for (const m of ["colazione", "pranzo", "cena"]) {
      const r = day[m];
      if (!r) continue;
      mealCount++;
      totalProtein += r.protein_g || 0;
      totalKcal    += r.kcal || 0;
      if (r.protein_source === "fish")    fishMeals++;
      if (r.protein_source === "legumes") legumeMeals++;
      if (r.protein_source === "chicken") chickenMeals++;
      if (r.protein_source === "beef" || r.protein_source === "pork") redMeatMeals++;
    }
  }
  return {
    avg_protein_per_meal: mealCount ? Math.round(totalProtein / mealCount) : 0,
    avg_kcal_per_meal:    mealCount ? Math.round(totalKcal / mealCount)    : 0,
    fish_meals:           fishMeals,
    legume_meals:         legumeMeals,
    chicken_meals:        chickenMeals,
    red_meat_meals:       redMeatMeals,
  };
}
