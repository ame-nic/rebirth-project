# Data Model

Every persisted slice in the app. Types are TypeScript-shaped for
clarity even though the implementation is plain JS.

Each entry below tells you:
- **Where** — `CRITICAL_KEYS` (mirrored to Upstash) or `EPHEMERAL_KEYS` (local-only).
- **Owner** — the feature folder + hook that reads/writes it.

---

## Upstash-synced keys (CRITICAL_KEYS)

### `workoutLog_v5`

Owner: `features/training` · `App.jsx` (root) keeps the in-memory copy.

```ts
type WorkoutEntry = {
  date:      string;            // "YYYY-MM-DD"
  id:        string;            // "A" | "B" | "C" | "SPORT"
  title:     string;
  color:     string;            // hex from tokens.C
  type:      string;            // session id, or "SPORT" for calcetto/run
  exercises: LoggedExercise[];  // empty for SPORT
};

type LoggedExercise = {
  id:       string;
  name:     string;
  muscle:   string;
  sets:     number;
  reps:     string;             // "8-12", "AMRAP", etc.
  kg:       number;             // prescribed
  unit:     string;             // "kg" | "bw" | ...
  usedKg:   number;             // actually loaded
  setsDone: boolean[];
};
```

One entry per day. Same-day re-completion replaces via
`filter((w) => w.date !== todayStr())`.

### `mealPlan_v6` / `mealLog_v6`

Owner: `features/nutrition`.

```ts
type MealPlan = {
  weekStart: string;
  days: Record<DayName, {
    breakfast: RecipeRef;
    lunch:     RecipeRef;
    dinner:    RecipeRef;
    snacks?:   RecipeRef[];
  }>;
};

type MealLog = Record<string /* date */, { mealId: string; checked: boolean }[]>;
```

### `weightLog_v5`

```ts
type WeightEntry = { date: string; weight_kg: number };
```

### `rebirth_measurements`

Owner: `features/progress` · `useMeasurements`.

```ts
type BodyMeasurement = {
  date:      string;
  weight_kg: number;
  waist_cm:  number;  // required for Navy Method BF%
  neck_cm:   number;  // required for Navy Method BF%
  chest_cm?: number;
  hips_cm?:  number;
  arm_cm?:   number;
  thigh_cm?: number;
  notes?:    string;
};
```

### `rebirth_habits`

Owner: `features/habits` · `useHabits`.

```ts
type Habit = {
  id:         string;
  name:       string;
  emoji:      string;
  category:   "fitness" | "nutrition" | "sleep" | "mindset" | "learning" | "custom";
  timeOfDay:  "morning" | "evening" | "anytime";
  targetDays: number[];  // 0=Sun .. 6=Sat
  color:      string;
  createdAt:  string;
  archived:   boolean;
  order:      number;
};
```

### `rebirth_habit_logs`

```ts
type HabitLog = {
  habitId: string;
  date:    string;
  done:    boolean;
  skipped: boolean;
  note:    string;
};
```

### `rebirth_readiness_logs`

Owner: `features/wellness` · `useReadiness`.

```ts
type ReadinessLog = {
  date:   string;
  score:  number;  // 1..10
  inputs: {
    sleepHours:               number;
    sleepQuality:             number;  // 1..5
    energyLevel:              number;  // 1..5
    mood:                     number;  // 1..5
    soreness:                 number;  // 1..5
    sessionsThisWeek:         number;
    daysSinceLastSession:     number;
    habitCompletionYesterday: number;
    totalActiveHabits:        number;
  };
};
```

Manual inputs only. Apple Health was removed in migration #1; the AI
assessment now scores nothing but data the user entered.

### `rebirth_alter_ego`

Owner: `features/alterEgo` · `useAlterEgo`.

```ts
type AlterEgo = {
  name:                string;
  description:         string;
  identity_statements: IdentityStatement[];
  created_at:          string;
  color:               string;  // accent hex
  emoji:               string;
};

type IdentityStatement = {
  id:           string;
  text:         string;
  linked_habit: string | null;  // habit id, optional
  category:     string;
  active:       boolean;
  order:        number;
};
```

### `rebirth_books` / `rebirth_courses` / `rebirth_skills` / `rebirth_weekly_learning` / `rebirth_saved_articles`

Owner: `features/growth` · `useGrowth`.

```ts
type Book = {
  id:       string;
  title:    string;
  author?:  string;
  cover?:   string;
  status:   "to-read" | "reading" | "finished";
  progress: number;  // 0..100
  startedAt?: string;
  finishedAt?: string;
};

type Course = {
  id:        string;
  title:     string;
  provider?: string;
  url?:      string;
  status:    "to-do" | "in-progress" | "done";
  hours?:    number;
};

type Skill = {
  id:    string;
  name:  string;
  level: 1 | 2 | 3 | 4 | 5;
  notes?: string;
};

type WeeklyLearningEntry = { weekStart: string; text: string };

type SavedArticle = {
  id:       string;
  title:    string;
  url:      string;
  source:   string;
  savedAt:  string;
  summary?: string;
};
```

### `rebirth_feed_sources`

```ts
type FeedSource = {
  id:       string;
  name:     string;
  type:     "rss" | "reddit" | "weather" | "newsdata" | "guardian";
  url:      string;
  enabled:  boolean;
  category: string;
};
```

### `rebirth_saved_recipes`

```ts
type SavedRecipe = {
  id: string; title: string; image?: string; source: "spoonacular" | "themealdb" | "user";
  url?: string; protein_g?: number; calories?: number; time_min?: number;
  savedAt: string;
};
```

---

## Local-only keys (EPHEMERAL_KEYS)

| Key                           | Type      | TTL    | Notes                                  |
|-------------------------------|-----------|--------|----------------------------------------|
| `rebirth_ai_assessment`       | object    | 24h    | Cached AI expert assessment            |
| `rebirth_weekly_ai_message`   | object    | 7d     | Alter ego weekly message (ISO week)    |
| `rebirth_feed_read`           | string[]  | cap 500| Read article ids                       |
| `rebirth_feed_last_day`       | string    | ∞      | Day key for "Today vs Yesterday" group |
| `rebirth_recent_recipes`      | object[]  | cap 50 | Anti-repeat queue                      |
| `_migrations_executed`        | number[]  | ∞      | Migration ids already run              |
| `_last_sync`                  | string    | ∞      | ISO timestamp of last Upstash sync     |
| `_upstash_migration_done`     | string    | ∞      | First-boot Upstash migration flag      |

## Out-of-band caches (IndexedDB)

The daily-feed cache uses IndexedDB rather than localStorage to keep
the main thread responsive while a refresh is in flight. See
`shared/storage/idb.js`. Recipe and OpenLibrary caches use the same
store.
