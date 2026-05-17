/* Hard constraints that drive the recipe engine. Nothing in this file
   should be softened or worked around at the call site — if a recipe
   doesn't fit, drop it and surface fewer results. */

export const USER_PROFILE = {
  goal:                "body_recomposition",
  weight_kg:           95,
  daily_protein:       185,
  daily_kcal:          2600,
  cooking_skill:       "beginner",
  available_equipment: ["pan", "oven", "pot", "microwave", "knife", "cutting_board"],
};

// Per-meal nutritional + time targets. prep_max_weekday/weekend are
// ACTIVE prep time only — oven, marinating, and "passive" steps are
// excluded.
export const MEAL_TARGETS = {
  colazione: { protein_min: 32, protein_max: 42, kcal_min: 420, kcal_max: 560, prep_max_weekday: 10, prep_max_weekend: 20 },
  pranzo:    { protein_min: 44, protein_max: 58, kcal_min: 580, kcal_max: 700, prep_max_weekday: 15, prep_max_weekend: 45 },
  cena:      { protein_min: 46, protein_max: 60, kcal_min: 400, kcal_max: 580, prep_max_weekday: 20, prep_max_weekend: 45 },
};

export const FORBIDDEN_TECHNIQUES = [
  "julienne", "deglaze", "braise", "caramelize", "temper",
  "blanch", "flambé", "reduce sauce", "fold", "knead",
  "poach", "confit", "emulsify", "clarify",
];

export const FORBIDDEN_EQUIPMENT = [
  "food processor", "stand mixer", "mandoline", "wok",
  "pressure cooker", "blowtorch", "thermometer", "piping bag",
];

// These passive techniques add total_minutes but not active_prep_minutes.
export const PASSIVE_TECHNIQUES = ["bake", "roast", "slow cook", "marinate"];

export const WEEKLY_VARIETY_RULES = {
  max_chicken_per_week:        3,
  max_red_meat_per_week:       3,
  min_fish_per_week:           2,
  min_legumes_per_week:        1,
  max_same_method_consecutive: 2,
  no_repeat_within_days:       10,
};

// Italian-day → JS day-of-week mapping (matches existing training data).
export const DAY_TO_DOW = { Lun: 1, Mar: 2, Mer: 3, Gio: 4, Ven: 5, Sab: 6, Dom: 0 };
export const WEEKEND_DAYS = ["Sab", "Dom"];
