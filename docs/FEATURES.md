# Feature Catalogue

Layered chronology of what's in the app. Layers map to the prompts the
project was built from. Each entry names the feature folder and the
storage keys it owns.

## Layer 1 — Training (foundation)
`features/training` · keys: `workoutLog_v5`

Week-grid header, three-session split (A push / B pull / C legs +
optional D sport), expandable cards, active workout flow with per-set
checkmarks. Single entry per day; same-day re-completion replaces.

## Layer 2 — Nutrition + Recipes
`features/nutrition` · keys: `mealPlan_v6`, `mealLog_v6`, `rebirth_saved_recipes`, `rebirth_recent_recipes`

Weekly meal plan generation, recipe database, scoring engine that
respects `USER_PROFILE` constraints (protein floor, prep time ceiling).
Spoonacular + TheMealDB + USDA when keys are present; graceful local
catalogue otherwise.

## Layer 3 — Daily Feed
`features/daily-feed` · keys: `rebirth_feed_sources`, `rebirth_feed_read`, `rebirth_feed_last_day`

22 default sources (RSS + Reddit + weather), Italian-language
categories, virtual list, IndexedDB cache. Web Worker for XML parsing.

## Layer 4 — Readiness + AI Expert Assessment
`features/wellness` · keys: `rebirth_readiness_logs`, `rebirth_ai_assessment`

Daily check-in (sleep hours + quality, energy, mood, soreness) →
score 1..10 with training + lifestyle recommendation. Monthly AI
expert assessment from the same data (cached 24h). All inputs are
self-reported; Apple Health was removed in migration #1.

## Layer 5 — Body Measurements
`features/progress` · keys: `weightLog_v5`, `rebirth_measurements`

Weight + Navy Method body-fat from neck/waist (+ hips for women).
Recomp chart over time.

## Layer 6 — Professional Growth
`features/growth` · keys: `rebirth_books`, `rebirth_courses`, `rebirth_skills`, `rebirth_weekly_learning`, `rebirth_saved_articles`

Books (OpenLibrary covers), courses, 1..5 skills matrix, weekly
learning log, articles saved from Feed.

## Layer 9 — Alter Ego
`features/alterEgo` · keys: `rebirth_alter_ego`, `rebirth_weekly_ai_message`

Identity-statement greeting on Today, streak-protection alerts on
Habits, milestone celebrations at 7 / 21 / 30 / 66 / 100 days, Sunday
reflection card with per-statement adherence + optional AI message.

## Layer 10 — Apple Health Bridge ~~(removed in migration #1)~~

Originally piped Steps / Sleep / HRV / RHR / Active Calories from
Apple Health into Readiness + the AI Expert Assessment via a Shortcuts
URL-params bridge. Removed: the integration was fragile (URL length
caps, Shortcuts permissions, sleep numbers that didn't match what
Apple Health itself displayed) and Nicola judged it more trouble than
it was worth.

The AI assessment and the readiness score now consume *only*
manually-entered data: the morning check-in, the workout log, body
measurements, and habit toggles. Migration #1 wipes
`rebirth_health_snapshots` and `rebirth_hrv_baseline` from every device
+ Upstash on next boot.

## Habits (cross-cutting)
`features/habits` · keys: `rebirth_habits`, `rebirth_habit_logs`

Atomic-Habits-style tracker with streaks, contribution graph, weekly
summary, push-notification scaffold (iOS PWA only fires after Add to
Home Screen).

## Platform services

- **Storage** — `shared/storage` (write-through localStorage + Upstash,
  migrations, useSyncStatus, JSON export).
- **AI** — `shared/services/ai.js` + `/api/ai` Edge Function.
- **PWA** — `vite-plugin-pwa`, Workbox runtime caching, generated icons.
- **Settings sheet + Offline banner** — `shared/components`.
