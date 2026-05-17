/* RSS fetch with rss2json primary + allorigins fallback.
   Browsers can't fetch raw RSS due to CORS, so we route through a proxy.
   rss2json returns parsed JSON (preferred). allorigins returns raw XML
   wrapped in `{ contents }`. All network calls go through resilientFetch
   (timeout + retry + dedup). The XML parse path can optionally run in
   a Web Worker — see parseInWorker(). */

import { resilientFetch } from "../../../shared/utils/fetchUtils.js";

const RSS2JSON   = "https://api.rss2json.com/v1/api.json";
const ALLORIGINS = "https://api.allorigins.win/get";

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function normalize(item, source) {
  return {
    id:          item.id,
    title:       item.title,
    summary:     item.summary,
    url:         item.url,
    publishedAt: item.publishedAt,
    source:      item.source ?? source.label,
    sourceId:    source.id,
    category:    source.category,
    image:       item.image ?? null,
    read:        false,
  };
}

async function viaRss2Json(source, limit = 8) {
  const endpoint = `${RSS2JSON}?rss_url=${encodeURIComponent(source.config.url)}&count=${limit}`;
  const res  = await resilientFetch(endpoint);
  if (!res.ok) throw new Error(`rss2json ${res.status}`);
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "rss2json failed");
  return (data.items || []).map((item) => normalize({
    id:          item.guid || item.link,
    title:       item.title,
    summary:     stripHtml(item.description).slice(0, 240),
    url:         item.link,
    publishedAt: new Date(item.pubDate),
    source:      data.feed?.title || source.label,
    image:       item.thumbnail || item.enclosure?.link || null,
  }, source));
}

function parseXMLItems(xml, source) {
  // Try RSS 2.0 <item> first, fall back to Atom <entry>.
  let nodes = Array.from(xml.querySelectorAll("item"));
  let isAtom = false;
  if (nodes.length === 0) {
    nodes = Array.from(xml.querySelectorAll("entry"));
    isAtom = true;
  }

  return nodes.slice(0, 8).map((node) => {
    const get = (sel) => node.querySelector(sel)?.textContent?.trim() || "";
    const title       = get("title");
    const link        = isAtom
      ? node.querySelector("link")?.getAttribute("href") || ""
      : get("link");
    const description = get("description") || get("summary") || get("content");
    const pubDate     = get("pubDate") || get("published") || get("updated");
    const guid        = get("guid") || link;
    return normalize({
      id:          guid,
      title,
      summary:     stripHtml(description).slice(0, 240),
      url:         link,
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      image:       null,
    }, source);
  });
}

async function viaAllOrigins(source) {
  const endpoint = `${ALLORIGINS}?url=${encodeURIComponent(source.config.url)}`;
  const res  = await resilientFetch(endpoint);
  if (!res.ok) throw new Error(`allorigins ${res.status}`);
  const data = await res.json();
  if (!data.contents) throw new Error("allorigins empty response");
  // Try to parse in a Worker; fall back to main-thread DOMParser if
  // the worker is unavailable (older Safari sometimes blocks workers
  // in standalone PWA mode).
  try {
    const items = await parseInWorker(data.contents, source);
    if (items) return items;
  } catch {
    /* fall through */
  }
  const xml = new DOMParser().parseFromString(data.contents, "text/xml");
  if (xml.querySelector("parsererror")) throw new Error("XML parse error");
  return parseXMLItems(xml, source);
}

// Lazily-instantiated worker; one per session, message-based.
let _worker = null;
function getWorker() {
  if (_worker !== null) return _worker;
  try {
    // Vite resolves ?worker imports to dedicated worker bundles.
    _worker = new Worker(new URL("../workers/rssParser.worker.js", import.meta.url), { type: "module" });
  } catch {
    _worker = false; // sticky failure — don't keep retrying
  }
  return _worker;
}

function parseInWorker(xmlString, source) {
  const w = getWorker();
  if (!w) return null;
  return new Promise((resolve, reject) => {
    const id = `${source.id}_${Math.random().toString(36).slice(2, 8)}`;
    const onMsg = (e) => {
      if (e.data?.id !== id) return;
      w.removeEventListener("message", onMsg);
      if (e.data.ok) {
        resolve(e.data.items.map((item) => normalize(item, source)));
      } else {
        reject(new Error(e.data.error || "worker parse failed"));
      }
    };
    w.addEventListener("message", onMsg);
    w.postMessage({ id, xmlString });
  });
}

export async function fetchRSS(source) {
  try {
    return await viaRss2Json(source);
  } catch (e1) {
    try {
      return await viaAllOrigins(source);
    } catch (e2) {
      throw new Error(`RSS fetch failed (${source.label}): ${e1.message} / ${e2.message}`, { cause: e2 });
    }
  }
}
