/* Readiness scoring engine — pure function.

   Weights, in order of contribution:
     38%  sleep duration + quality
     28%  subjective energy + mood
     14%  muscular soreness
     10%  recent training load
      5%  HRV vs baseline (redistributed to sleep if no Watch)
      2%  resting HR vs baseline
     ±    flat bonuses for steps yesterday, weekly active calories,
          habits-yesterday adherence

   Result clamped 1–10 and rounded. */

export function computeReadinessScore(inputs) {
  const {
    sleepHours, sleepQuality, energyLevel, mood, soreness,
    hrv, baseHRV,
    restingHR, baseRestingHR,
    stepsYesterday,
    activeCalories7d,
    sleepHoursHealth,
    sessionsThisWeek = 0,
    daysSinceLastSession = 99,
    habitCompletionYesterday = 0,
    totalActiveHabits = 0,
  } = inputs;

  // Apple Health sleep is more accurate than self-reported — prefer it.
  const effectiveSleep = sleepHoursHealth ?? sleepHours ?? 0;

  let score = 0;

  // ── SLEEP (38%) ─────────────────────────────────────────────────────────
  const sleepScore =
    effectiveSleep >= 8   ? 10 :
    effectiveSleep >= 7   ? 8  :
    effectiveSleep >= 6.5 ? 6  :
    effectiveSleep >= 6   ? 4  :
    effectiveSleep >= 5   ? 2  : 1;
  const sleepQualityMod = ((sleepQuality ?? 3) - 3) * 0.5;
  score += (sleepScore + sleepQualityMod) * 0.38;

  // ── FEEL: energy + mood (28%) ───────────────────────────────────────────
  const feel = ((energyLevel ?? 3) + (mood ?? 3)) / 2;
  score += feel * 2 * 0.28;

  // ── SORENESS (14%) ──────────────────────────────────────────────────────
  score += (soreness ?? 3) * 2 * 0.14;

  // ── LOAD (10%) ──────────────────────────────────────────────────────────
  const loadScore =
    sessionsThisWeek >= 5     ? 4 :
    sessionsThisWeek >= 3     ? 7 :
    daysSinceLastSession <= 1 ? 5 :
    daysSinceLastSession >= 4 ? 9 : 7;
  score += loadScore * 0.10;

  // ── HRV (5%) — fallback to sleep when no Apple Watch ────────────────────
  if (hrv && baseHRV) {
    const delta    = (hrv - baseHRV) / baseHRV;
    const hrvScore = Math.max(1, Math.min(10, 5 + delta * 20));
    score += hrvScore * 0.05;
  } else {
    // Redistribute the 5% to sleep so missing data doesn't deflate the score.
    score += (sleepScore + sleepQualityMod) * 0.05;
  }

  // ── RHR (2%) ────────────────────────────────────────────────────────────
  if (restingHR && baseRestingHR) {
    const rhrDelta = (restingHR - baseRestingHR) / baseRestingHR;
    const rhrScore = Math.max(1, Math.min(10, 5 - rhrDelta * 15));
    score += rhrScore * 0.02;
  } else {
    score += 5 * 0.02;
  }

  // ── Flat bonuses / penalties ─────────────────────────────────────────────
  if (stepsYesterday != null) {
    if (stepsYesterday >= 10000) score += 0.3;
    else if (stepsYesterday >= 7000) score += 0.1;
    else if (stepsYesterday < 3000)  score -= 0.3;
  }

  if (activeCalories7d != null) {
    const dailyAvg = activeCalories7d / 7;
    if (dailyAvg > 700) score -= 0.2;
    if (dailyAvg < 150) score += 0.1;
  }

  if (totalActiveHabits > 0) {
    const habitRate = habitCompletionYesterday / totalActiveHabits;
    if (habitRate >= 0.9) score += 0.3;
    if (habitRate <= 0.3) score -= 0.3;
  }

  return Math.round(Math.max(1, Math.min(10, score)));
}

/* Score-band metadata. Colors use the Zeroth palette literals so callers
   don't have to thread tokens through. icons map to Phosphor names. */
export const READINESS_LEVELS = [
  { min: 9, max: 10, key: "ottimo",      label: "Ottimo",       color: "#8FA962", icon: "ph-flame-fill",
    training:  "Giornata ideale. Puoi aumentare i carichi del 5–10%.",
    lifestyle: "Alta capacità cognitiva — dedica le ore migliori al lavoro profondo." },
  { min: 7, max: 8,  key: "buono",       label: "Buono",        color: "#6E7EAA", icon: "ph-check-circle",
    training:  "Sessione normale. Segui il piano. Puoi fare set di qualità.",
    lifestyle: "Giornata produttiva. Priorità al lavoro cognitivo al mattino." },
  { min: 5, max: 6,  key: "norma",       label: "Nella norma",  color: "#F2CD64", icon: "ph-minus-circle",
    training:  "Allenamento ok ma senza stressare. Considera −10% sul carico.",
    lifestyle: "Alterna lavoro profondo con pause più frequenti." },
  { min: 3, max: 4,  key: "basso",       label: "Basso",        color: "#E8B12A", icon: "ph-warning",
    training:  "Sessione leggera o active recovery. No PR oggi.",
    lifestyle: "Privilegia compiti routinari. Dormi presto stasera." },
  { min: 1, max: 2,  key: "recupero",    label: "Recupero",     color: "#D88B72", icon: "ph-pause-circle",
    training:  "Riposo attivo. Stretching o camminata.",
    lifestyle: "Idratati, mangia bene, dormi. Domani sarà meglio." },
];

export function getReadinessLevel(score) {
  if (score == null) return null;
  for (const level of READINESS_LEVELS) {
    if (score >= level.min && score <= level.max) return level;
  }
  return READINESS_LEVELS[READINESS_LEVELS.length - 1];
}
