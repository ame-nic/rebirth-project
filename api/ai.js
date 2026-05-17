/* Vercel Edge Function: POST /api/ai
   Proxies LLM calls so API keys live server-side only. Gemini is primary;
   OpenRouter is the fallback when Gemini fails (rate limit, key invalid,
   transient 5xx). Both keys come from Vercel env (GEMINI_API_KEY,
   OPENROUTER_API_KEY). An optional ALLOWED_ORIGIN env var enables a
   simple origin allowlist for additional abuse protection. */

export const config = { runtime: "edge" };

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Hard caps — defensive bounds against runaway requests. The endpoint is
// publicly reachable once deployed and CORS doesn't stop scripted callers.
const MAX_PROMPT_CHARS        = 4000;
const MAX_SYSTEM_PROMPT_CHARS = 2000;
const MAX_TOKENS_CAP          = 1024;
const MIN_TOKENS              = 32;
const DEFAULT_TOKENS          = 300;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Gemini (primary) ─────────────────────────────────────────────────────────
async function callGemini(prompt, systemPrompt, maxTokens) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(
    `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// ── OpenRouter (fallback) ────────────────────────────────────────────────────
async function callOpenRouter(prompt, systemPrompt, maxTokens) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: prompt },
  ];

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      "meta-llama/llama-3.3-70b-instruct:free",
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// ── Origin allowlist (opt-in via env) ────────────────────────────────────────
function isOriginAllowed(req) {
  const allowed = process.env.ALLOWED_ORIGIN;
  if (!allowed) return true; // no allowlist configured → open
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  return allowed
    .split(",")
    .map((s) => s.trim())
    .some((o) => o && origin.startsWith(o));
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method !== "POST")  return json({ error: "method_not_allowed" }, 405);
  if (!isOriginAllowed(req))  return json({ error: "forbidden" }, 403);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const promptRaw       = typeof payload?.prompt === "string"       ? payload.prompt       : "";
  const systemPromptRaw = typeof payload?.systemPrompt === "string" ? payload.systemPrompt : "";
  const maxTokensRaw    = Number(payload?.maxTokens);

  if (!promptRaw)                                       return json({ error: "missing_prompt" }, 400);
  if (promptRaw.length > MAX_PROMPT_CHARS)              return json({ error: "prompt_too_long" }, 413);
  if (systemPromptRaw.length > MAX_SYSTEM_PROMPT_CHARS) return json({ error: "system_prompt_too_long" }, 413);

  const tokens = Number.isFinite(maxTokensRaw)
    ? Math.min(Math.max(MIN_TOKENS, Math.floor(maxTokensRaw)), MAX_TOKENS_CAP)
    : DEFAULT_TOKENS;

  let text;
  let usedFallback = false;

  try {
    text = await callGemini(promptRaw, systemPromptRaw, tokens);
  } catch (geminiErr) {
    console.warn("[api/ai] Gemini failed, trying OpenRouter:", geminiErr.message);

    if (!process.env.OPENROUTER_API_KEY) {
      return json({ error: "ai_unavailable" }, 503);
    }

    try {
      text = await callOpenRouter(promptRaw, systemPromptRaw, tokens);
      usedFallback = true;
    } catch (orErr) {
      console.error("[api/ai] All providers failed:", orErr.message);
      return json({ error: "ai_unavailable" }, 503);
    }
  }

  return json({ text, usedFallback });
}
