# Deployment

One-time provisioning + the routine deploy cycle.

## Prerequisites

- A Vercel account (free tier).
- A GitHub repo with the project pushed.
- A Google AI Studio account for the Gemini API key.

## Step 1 — Vercel project

1. Vercel → **New Project** → import the GitHub repo.
2. Framework preset: **Vite**. Build command + output dir auto-detected.
3. **Environment Variables** → add:
   - `GEMINI_API_KEY` = your Gemini key (server-side only, no `VITE_` prefix).
   - Optional: `OPENROUTER_API_KEY`, `ALLOWED_ORIGIN`,
     `APP_STORAGE_TOKEN`.
   - Optional client keys (these are exposed in the bundle, only set if
     willing): `VITE_SPOONACULAR_API_KEY`, `VITE_USDA_API_KEY`,
     `VITE_NEWSDATA_API_KEY`, `VITE_GUARDIAN_API_KEY`,
     `VITE_APP_STORAGE_TOKEN`.
4. **Deploy**.

## Step 2 — Upstash KV (storage)

1. Vercel project → **Storage** → **Add New** → **Upstash KV**.
2. Name `rebirth-store`. Region **Frankfurt** (eu-central-1) — closest
   to Milano.
3. **Create and Connect** — Vercel auto-injects `KV_REST_API_URL`,
   `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN` and friends.
4. Redeploy (Vercel triggers automatically when env vars change).

`Redis.fromEnv()` in `api/storage.js` picks the credentials up.

## Step 3 — PWA install

Open the production URL on iPhone Safari → Share → **Add to Home
Screen**. The Service Worker activates after the first visit and the
app is fully usable offline (after the initial cache prime).

## Routine deploys

`git push origin main` triggers Vercel. Pre-push discipline (per
`CLAUDE.md` runtime-verify rule):

```
npm run lint && npm run build
npm run dev      # smoke-test in browser
npm run preview  # smoke-test the production bundle
```

For UI changes, content-check the relevant `dist/assets/*.js`
chunk to confirm the new component shipped.

## Rollback

Vercel dashboard → **Deployments** → pick a previous green deploy →
**Promote to Production**. Storage is *not* rolled back — Upstash
keeps the latest writes. If a release shipped a bad migration, the
client will skip-and-log on next boot, but a follow-up corrective
migration is usually the right fix.
