/* Dedicated worker that parses RSS/Atom XML off the main thread.
   Vite resolves the `new Worker(new URL(...))` pattern to a separate
   bundle at build time. Communicates via { id, xmlString } request /
   { id, ok, items|error } response. */

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseXml(xmlString) {
  const xml = new DOMParser().parseFromString(xmlString, "text/xml");
  if (xml.querySelector("parsererror")) throw new Error("XML parse error");

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
    return {
      id:          guid,
      title,
      summary:     stripHtml(description).slice(0, 240),
      url:         link,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      image:       null,
    };
  });
}

self.addEventListener("message", (e) => {
  const { id, xmlString } = e.data ?? {};
  if (!id) return;
  try {
    const items = parseXml(xmlString);
    self.postMessage({ id, ok: true, items });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err?.message ?? String(err) });
  }
});
