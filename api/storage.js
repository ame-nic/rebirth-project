/* Vercel Edge Function: /api/storage
   Wraps Upstash Redis so user data persists server-side across devices
   (iOS can wipe localStorage on its own; Upstash is the source of truth).

   Routes
     GET    /api/storage?key=xxx              → { key, value }
     POST   /api/storage   { key, value }     → single set
     POST   /api/storage   { op:"mget", keys: [...] }   → { result: { key: value, ... } }
     POST   /api/storage   { op:"mset", data: { key: value, ... } } → { ok: true }
     DELETE /api/storage?key=xxx              → { ok: true }

   All keys are prefixed with `rebirth:` so this DB can host other data
   in the future without collisions.

   APP_STORAGE_TOKEN (optional) — when set on Vercel, every request must
   include the matching `x-app-token` header. Stops random callers from
   reading/writing your data once the URL is public.

   ALLOWED_ORIGIN (optional) — same allowlist pattern as /api/ai. */

import { Redis } from "@upstash/redis";

export const config = { runtime: "edge" };

const redis = Redis.fromEnv();
const PREFIX = "rebirth:";

// Defensive caps. Bodies above these limits are rejected before hitting Redis.
const MAX_KEY_LENGTH    = 128;
const MAX_VALUE_BYTES   = 1024 * 1024;     // 1 MB per slice — workoutLog is far smaller
const MAX_BULK_KEYS     = 64;
const MAX_TOTAL_BYTES   = 4 * 1024 * 1024; // 4 MB for an entire bulk request

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function originAllowed(req) {
  const allowed = process.env.ALLOWED_ORIGIN;
  if (!allowed) return true;
  const origin = req.headers.get("origin") ?? "";
  return allowed.split(",").map((s) => s.trim()).includes(origin);
}

function authorized(req) {
  const token = process.env.APP_STORAGE_TOKEN;
  if (!token) return true; // no token configured → open (dev/personal)
  return req.headers.get("x-app-token") === token;
}

function validKey(k) {
  return typeof k === "string" && k.length > 0 && k.length <= MAX_KEY_LENGTH && /^[A-Za-z0-9_:\-.]+$/.test(k);
}

function approxBytes(v) {
  // Avoid full JSON.stringify on huge payloads — Redis stores strings.
  if (v == null) return 0;
  if (typeof v === "string") return v.length;
  try { return JSON.stringify(v).length; } catch { return Infinity; }
}

export default async function handler(req) {
  if (!originAllowed(req)) return json({ error: "Origin not allowed" }, 403);
  if (!authorized(req))    return json({ error: "Unauthorized" }, 401);

  const url    = new URL(req.url);
  const method = req.method;

  try {
    if (method === "GET") {
      const key = url.searchParams.get("key");
      if (!validKey(key)) return json({ error: "Invalid key" }, 400);
      const value = await redis.get(PREFIX + key);
      return json({ key, value: value ?? null });
    }

    if (method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);

      // Bulk read
      if (body.op === "mget") {
        const keys = Array.isArray(body.keys) ? body.keys : null;
        if (!keys || keys.length === 0)     return json({ error: "Missing keys" }, 400);
        if (keys.length > MAX_BULK_KEYS)    return json({ error: "Too many keys" }, 400);
        if (!keys.every(validKey))          return json({ error: "Invalid key in batch" }, 400);
        const prefixed = keys.map((k) => PREFIX + k);
        const values   = await redis.mget(...prefixed);
        const result   = {};
        keys.forEach((k, i) => { result[k] = values[i] ?? null; });
        return json({ result });
      }

      // Bulk write
      if (body.op === "mset") {
        const data = body.data;
        if (!data || typeof data !== "object") return json({ error: "Missing data" }, 400);
        const entries = Object.entries(data);
        if (entries.length === 0)              return json({ error: "Empty batch" }, 400);
        if (entries.length > MAX_BULK_KEYS)    return json({ error: "Too many keys" }, 400);
        let total = 0;
        for (const [k, v] of entries) {
          if (!validKey(k))                return json({ error: `Invalid key: ${k}` }, 400);
          const size = approxBytes(v);
          if (size > MAX_VALUE_BYTES)      return json({ error: `Value too large for ${k}` }, 413);
          total += size;
          if (total > MAX_TOTAL_BYTES)     return json({ error: "Batch too large" }, 413);
        }
        const pipeline = redis.pipeline();
        for (const [k, v] of entries) pipeline.set(PREFIX + k, v);
        await pipeline.exec();
        return json({ ok: true });
      }

      // Single set
      const { key, value } = body;
      if (!validKey(key))                       return json({ error: "Invalid key" }, 400);
      if (approxBytes(value) > MAX_VALUE_BYTES) return json({ error: "Value too large" }, 413);
      await redis.set(PREFIX + key, value);
      return json({ ok: true });
    }

    if (method === "DELETE") {
      const key = url.searchParams.get("key");
      if (!validKey(key)) return json({ error: "Invalid key" }, 400);
      await redis.del(PREFIX + key);
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("[api/storage]", err);
    return json({ error: "Storage error" }, 500);
  }
}
