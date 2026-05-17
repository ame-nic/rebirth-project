# API Reference

All endpoints are **Vercel Edge Functions** (`api/*.js`, `runtime: "edge"`).

Base URL: your production Vercel URL (e.g. `https://rebirth-project.vercel.app`).
Dev: Vite does **not** serve `/api/*`; test functions on a Vercel
preview deploy or via `vercel dev`.

---

## POST `/api/ai`

Proxy to Google Gemini 2.0 Flash. The `GEMINI_API_KEY` lives only in
Vercel server env. OpenRouter is wired as a fallback when present.

**Request body:**
```json
{
  "prompt":       "string (required, ≤ 4000 chars)",
  "systemPrompt": "string (optional, ≤ 2000 chars)",
  "maxTokens":    300
}
```

**Response 200:**
```json
{ "text": "..." }
```

**Response codes:**
- `400` invalid input (size cap, missing prompt)
- `403` origin not allowed (when `ALLOWED_ORIGIN` is set)
- `429` rate limit upstream
- `503` provider unavailable / no key configured

**Caps:** `MAX_PROMPT_CHARS=4000`, `MAX_SYSTEM_PROMPT_CHARS=2000`,
`MAX_TOKENS_CAP=1024`, default `DEFAULT_TOKENS=300`.

---

## `/api/storage`

CRUD on Upstash Redis, prefixed with `rebirth:`.

### `GET /api/storage?key=<key>`

```json
{ "key": "rebirth_habits", "value": [...] }   // value: null when absent
```

### `POST /api/storage` — single set

```json
{ "key": "rebirth_habits", "value": [...] }
→ { "ok": true }
```

### `POST /api/storage` — bulk get (`mget`)

```json
{ "op": "mget", "keys": ["workoutLog_v5", "rebirth_habits"] }
→ { "result": { "workoutLog_v5": [...], "rebirth_habits": [...] } }
```

### `POST /api/storage` — bulk set (`mset`)

```json
{ "op": "mset", "data": { "workoutLog_v5": [...], "rebirth_habits": [...] } }
→ { "ok": true }
```

### `DELETE /api/storage?key=<key>`

```json
{ "ok": true }
```

### Limits

| Bound                | Value         |
|----------------------|---------------|
| `MAX_KEY_LENGTH`     | 128           |
| `MAX_VALUE_BYTES`    | 1 MB / value  |
| `MAX_BULK_KEYS`      | 64 keys       |
| `MAX_TOTAL_BYTES`    | 4 MB / batch  |
| Key charset          | `[A-Za-z0-9_:\-.]+` |

### Auth (optional)

Set `APP_STORAGE_TOKEN` on Vercel and `VITE_APP_STORAGE_TOKEN` on the
client (same value). Requests must then carry `x-app-token: <token>`
or the function returns 401. Without the env var the endpoint is
open — fine for an unlisted personal URL, not fine for a public one.

### Origin allowlist (optional)

`ALLOWED_ORIGIN=https://rebirth-project.vercel.app,https://other.example`
restricts requests to those origins.
