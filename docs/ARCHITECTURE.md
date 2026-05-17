# Architecture

## Goals

- One person, one device class (iPhone Safari, Add-to-Home-Screen).
- Free tier hosting, free tier APIs. Never block on paid infra.
- Offline-first: every core feature works without network. Cloud sync
  is recovery + cross-device, not a runtime dependency.
- AI is enrichment, never gatekeeping. Every AI feature has a non-AI
  fallback.

## Shape

Single-page React 19 app served by Vite, deployed to Vercel as a
static bundle + two Edge Functions. No traditional backend. State
lives in three places:

1. **In-memory React state** — current session, UI flags.
2. **localStorage** — primary cache. Every persisted slice is here.
   Reads are sync, writes are sync. The UI never awaits the network.
3. **Upstash Redis** (via `/api/storage`) — source of truth for the
   critical slices. Survives an iOS Safari wipe and is the bridge for
   future cross-device sync.

IndexedDB exists for the feed cache only, where multi-hundred-KB blobs
make synchronous localStorage too slow.

## Boot sequence

```
main.jsx
  └─ App.jsx
       ├─ load workoutLog_v5 from cache (sync via storageLoad)
       ├─ first boot? syncFromRemote() → pushToRemote() if remote empty
       ├─ subsequent boot? syncFromRemote() in background (non-blocking)
       ├─ runPendingMigrations() — silent, before first render
       └─ render Today tab
```

## Module layout

`features/` — one folder per product area (`training`, `nutrition`,
`daily-feed`, `wellness`, `alterEgo`, `habits`, `progress`, `growth`).
Each owns its persisted slice, its hooks, its components. No global
store. `features/health/` existed up to migration #1 and has since
been removed — see ADR-005.

`shared/` — design tokens, storage layer, AI service, generic
components. Anything imported from more than one feature folder lives
here.

`api/` — Vercel Edge Functions. Currently `ai.js` (Gemini proxy) and
`storage.js` (Upstash CRUD).

## Architecture Decision Records

### ADR-001 · Hybrid storage (localStorage + Upstash)

**Status:** accepted (commit `98dbb41`).

**Context:** iOS Safari aggressively evicts website storage and the
"Clear Website Data" gesture wipes everything in one tap. A single
device meant a single failure point for months of training history.

**Decision:** wrap `localStorage` in a write-through layer that
mirrors critical slices to Upstash Redis through a Vercel Edge
Function. Reads check localStorage first (zero latency) and fall back
to remote when empty. Writes are sync local + fire-and-forget remote.
On boot, the remote pulls down everything so a fresh device picks up
the user's data.

**Consequences:**
- One round-trip per cold boot to refresh. Acceptable.
- Cross-device freshness lags by one reload. Acceptable for a
  single-user app; real-time sync would need SSE/WebSocket.
- Free tier is fine: ~1.5K commands/month vs. 500K limit.

### ADR-002 · AI behind an Edge Function

**Status:** accepted.

**Context:** `GEMINI_API_KEY` must not ship to the browser. A
client-side key would be lifted from the bundle and abused in days.

**Decision:** all model calls go through `POST /api/ai`. The function
holds the key in `process.env`, validates input size, and proxies the
request. Origin allowlist via `ALLOWED_ORIGIN` env (optional).

**Consequences:** AI features need network. We mitigate with
`callAIWithFallback` so every UI affordance has a non-AI path.

### ADR-003 · Migration runner, never in-place edits

**Status:** accepted.

**Context:** the schema will keep moving. We need a way to evolve
persisted shapes without breaking old installs.

**Decision:** sequential numeric migrations in
`shared/storage/migrationRunner.js`. Each migration has a unique id,
runs once per device, and is tracked in `_migrations_executed`.
Already-shipped migrations are immutable; new changes always get a
new id. Lazy field-level defaults live in `migrations.js` and apply
on read.

**Consequences:** schema evolution becomes mechanical and visible
in PRs. Trade-off: migrations must be idempotent — they may rerun on
retry after a partial failure.

### ADR-004 · No emoji in product UI, Phosphor everywhere

**Status:** accepted.

**Context:** OS-rendered emoji shift visually across iOS / Android /
desktop and clash with a deliberate "Zeroth" warm-document aesthetic.

**Decision:** Phosphor icons, loaded via CDN, used in every product
surface. Emoji are allowed only in documentation and commit messages.

### ADR-005 · Remove the Apple Health bridge

**Status:** accepted (migration #1, 2026-05-17).

**Context:** the Shortcuts → URL params bridge worked but was fragile
in practice: Shortcuts permissions had to be reconfirmed periodically,
URL length limits clipped batches, and the sleep numbers it produced
disagreed with what Apple Health itself displayed often enough that
the user lost trust in the data.

**Decision:** strip the integration. Delete `features/health/`, remove
`rebirth_health_snapshots` and `rebirth_hrv_baseline` from the schema,
and have the AI Expert Assessment + readiness score consume only
manually-entered data (morning check-in, workout log, body
measurements, habit toggles). Migration #1 wipes the leftover keys
locally and on Upstash on next boot.

**Consequences:**
- Less noisy signal — five fields are gone from the readiness inputs.
  Weights in `score.js` are redistributed to sleep (45%, was 38%) and
  feel (30%, was 28%); the HRV and RHR slots are gone.
- AI prompt no longer claims "no Apple Watch" as a missing-data
  fallback; the recovery section is now strictly self-reported.
- One fewer Edge of integration to break.

## Non-goals (today)

- Multi-user / auth
- Real-time cross-device sync
- Server-side rendering
- A native iOS app
- Wearable / HealthKit integration (removed; see ADR-005)
