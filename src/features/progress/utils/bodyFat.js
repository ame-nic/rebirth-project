/* US Navy Method for body fat estimation. Only inputs are waist, neck,
   and height — a tape measure is the only equipment needed. The Navy
   Method has a documented standard error of ±3-4% vs DEXA. */

export const HEIGHT_CM = 186;

/* Returns body fat percentage as an integer (rounded), or null if any
   required field is missing or out of plausible range. */
export function estimateBodyFatNavy({ waist_cm, neck_cm, height_cm = HEIGHT_CM }) {
  if (!Number.isFinite(waist_cm) || !Number.isFinite(neck_cm)) return null;
  if (waist_cm <= neck_cm)               return null;
  if (height_cm <= 0)                    return null;
  const logWaistNeck = Math.log10(waist_cm - neck_cm);
  const logHeight    = Math.log10(height_cm);
  const density      = 1.0324 - (0.19077 * logWaistNeck) + (0.15456 * logHeight);
  const bf           = (495 / density) - 450;
  if (!Number.isFinite(bf) || bf < 2 || bf > 60) return null;
  return Math.round(bf * 10) / 10;
}

export function estimateLeanMass(weight_kg, bodyFatPct) {
  if (!Number.isFinite(weight_kg) || !Number.isFinite(bodyFatPct)) return null;
  return +(weight_kg * (1 - bodyFatPct / 100)).toFixed(1);
}

export function estimateFatMass(weight_kg, bodyFatPct) {
  if (!Number.isFinite(weight_kg) || !Number.isFinite(bodyFatPct)) return null;
  return +(weight_kg * (bodyFatPct / 100)).toFixed(1);
}

/* Composes a full body-composition summary for one measurement.
   Returns null if BF can't be computed (skip the row in charts/summary). */
export function deriveComposition(m, heightCm = HEIGHT_CM) {
  if (!m || !Number.isFinite(m.weight_kg)) return null;
  const bf = estimateBodyFatNavy({ waist_cm: m.waist_cm, neck_cm: m.neck_cm, height_cm: heightCm });
  if (bf == null) return null;
  return {
    bodyFatPct: bf,
    leanKg:     estimateLeanMass(m.weight_kg, bf),
    fatKg:      estimateFatMass(m.weight_kg, bf),
  };
}

/* Per-field guidance for delta colorisation. "down" → smaller is better
   for recomp (waist, hips, fat), "up" → bigger is better (chest, arm,
   thigh, lean), "neutral" → weight (depends on goal — leave grey). */
export const FIELD_DIRECTION = {
  weight_kg: "neutral",
  chest_cm:  "up",
  waist_cm:  "down",
  hips_cm:   "down",
  arm_cm:    "up",
  thigh_cm:  "up",
  neck_cm:   "neutral",
  leanKg:    "up",
  fatKg:     "down",
  bodyFatPct:"down",
};
