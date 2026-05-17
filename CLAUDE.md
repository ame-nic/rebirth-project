# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server with HMR. The PWA service worker is disabled in dev (`devOptions.enabled: false`).
- `npm run build` — production build to `dist/`. Also generates `manifest.webmanifest`, `sw.js`, and PWA icons.
- `npm run preview` — serve the built bundle (use this to test the PWA + service worker locally).
- `npm run lint` — ESLint over the repo (flat config in `eslint.config.js`).

There is no test runner.

## Architecture

React 19 + Vite, mobile-first PWA (max-width 430, fixed bottom tab bar). Italian-language personal companion app for one user — training, nutrition, progress today; daily feed, wellness, AI coach planned (see memory `rebirth-project-intent` for roadmap).

### Layout

```
src/
  App.jsx                          — thin root: owns tab, activeSession, workoutLog
  main.jsx
  index.css                        — minimal base (JetBrains Mono, dark page)
  shared/
    design/tokens.js               — C palette, FONT, appWrap, card(), label, btn(), pill()
    utils/date.js                  — DAY_IT, todayStr, todayDOW, fmtDate, getWeekStart
    storage/index.js               — async localStorage wrapper + storageLoad/storageSave
    components/
      BottomNav.jsx                — 3-tab bottom nav (training / nutrition / progress)
      ConfirmModal.jsx             — iOS-style bottom-sheet confirm for off-schedule sessions
  features/
    training/
      index.jsx                    — TodayTab (default), ActiveWorkout (named), SessionCard
      data.js                      — SESSIONS + getTodaySession
    nutrition/
      index.jsx                    — NutritionTab
      data.js                      — RECIPES
    progress/
      index.jsx                    — ProgressTab
```

Folders for `daily-feed/`, `wellness/`, `coach/` will land in later phases — don't scaffold them speculatively.

### Design system

The visual language is "Zeroth": warm document-like dark UI, JetBrains Mono everywhere, sentence-case copy, Phosphor icons (no emoji in product UI), restrained radii (2/4/6/10), low warm shadows. All token consumers go through `shared/design/tokens.js` — never hardcode a color or font literal; extend the `C` object instead. Phosphor and JetBrains Mono are loaded via CDN links in `index.html`.

### State and persistence

State is split per feature with hooks colocated in each `features/*/index.jsx`. There is no global store. Each feature owns its persisted slice via the keys `workoutLog_v5`, `mealPlan_v5`, `mealLog_v5`, `weightLog_v5`. Bump the `_v5` suffix on backwards-incompatible shape changes.

All persistence routes through `shared/storage/index.js`, which wraps `localStorage` in an async-shaped API. The async signature is intentional — preserved so the storage layer can be swapped for IndexedDB or remote sync without touching call sites. Don't call `localStorage` directly.

### Workout flow

The root `App` holds `activeSession`. When non-null, `ActiveWorkout` (from `features/training`) renders full-screen instead of the tabbed layout — this is the only place the bottom nav is hidden. `ActiveWorkout` keeps per-set completion local and commits a single entry to `workoutLog` on finish (one entry per day; same-day re-completions replace via `filter((w) => w.date !== todayStr())`).

### PWA

`vite-plugin-pwa` (configured in `vite.config.js`) generates `manifest.webmanifest`, registers a Workbox-built service worker, and precaches the built bundle. `pwa-assets.config.js` drives `@vite-pwa/assets-generator` to derive the icon set from `public/favicon.svg` at build time. Runtime caching is configured for Google Fonts and the Phosphor CDN so the app is fully usable offline after first visit.

iOS Safari "Add to Home Screen" works because `index.html` includes `apple-mobile-web-app-*` meta tags + an `apple-touch-icon` link. The service worker is intentionally disabled in dev — test PWA behavior via `npm run preview`.

## Known issues

- `features/training/index.jsx` has a `useEffect` that calls `setRestTimer(null)` synchronously when the timer hits 0 — ESLint's `react-hooks/set-state-in-effect` rule flags it. Functionally correct, but worth restructuring if you're already in that hook.
- `src/App.css` is orphaned Vite-template cruft and nothing imports it. Safe to delete.
