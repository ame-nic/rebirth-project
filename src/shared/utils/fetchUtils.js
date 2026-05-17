/* Hardened fetch utilities. Three concerns:

   1. Timeout — every external call MUST be bounded so a slow proxy
      doesn't hang the feed refresh forever.
   2. Retry — transient failures get one extra shot with backoff.
   3. Dedup — concurrent identical URLs share the same in-flight promise
      so we don't pay the cost twice (and don't trip rate limits twice).

   Free of React deps so services can use these standalone. */

const DEFAULT_TIMEOUT_MS = 6000;
const inFlight = new Map(); // url → Promise<Response>

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(`Timeout after ${timeoutMs}ms: ${url}`, { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/* Wrap an arbitrary async fn with exponential backoff. Default 2 retries:
   total 3 attempts with 500ms / 1000ms gaps. */
export async function fetchWithRetry(fn, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries) break;
      const delay = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/* Dedup by URL: while one request to `url` is in flight, subsequent
   callers share the same promise. Cleared on settle. */
export async function deduplicatedFetch(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const key = `${options.method ?? "GET"}:${url}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const p = fetchWithTimeout(url, options, timeoutMs).finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

/* Convenience: timeout + retry + dedup combined. Use this from services. */
export function resilientFetch(url, options, { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 2 } = {}) {
  return fetchWithRetry(() => deduplicatedFetch(url, options, timeoutMs), retries);
}
