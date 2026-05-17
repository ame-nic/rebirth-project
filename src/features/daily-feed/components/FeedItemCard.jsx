import { memo, useCallback, useEffect, useState } from "react";
import { C, FONT } from "../../../shared/design/tokens.js";
import { callAIWithFallback } from "../../../shared/services/ai.js";
import { timeAgo } from "../utils/timeAgo.js";
import { getSummary, setSummary } from "../services/summaryCache.js";
import LazyImage from "./LazyImage.jsx";

function dispatchSave(item) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("article:save", { detail: item }));
}

const SUMMARY_SYSTEM_PROMPT =
  "Sei un assistente che riassume articoli di notizie. " +
  "Rispondi SEMPRE in italiano, in massimo 3 frasi, neutrale e factual. " +
  "Niente preamboli tipo 'Ecco un riassunto:' — vai diretto al contenuto.";

function buildSummaryPrompt(item) {
  const title = item.title ?? "";
  const body  = item.summary ?? "";
  return body
    ? `Titolo: ${title}\n\nContenuto:\n${body}`
    : `Titolo: ${title}\n\n(Solo il titolo è disponibile — fai un riassunto/contestualizzazione di una frase basandoti su di esso.)`;
}

/* memo'd because the feed re-renders frequently (scroll, background
   revalidation, read state changes). Custom comparator: a card only
   needs to re-render if its id, read state, saved state, or onRead
   identity changed. Local state (summary expanded, summary text,
   loading) is preserved across re-renders naturally. */
function FeedItemCardImpl({ item, onRead, saved = false }) {
  const [summaryOpen,    setSummaryOpen]    = useState(false);
  const [summaryText,    setSummaryText]    = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError,   setSummaryError]   = useState(false);

  // Lazy cache lookup on first expand — keeps cold scrolls cheap.
  useEffect(() => {
    if (!summaryOpen || summaryText || summaryLoading) return;
    let cancelled = false;
    (async () => {
      const cached = await getSummary(item.id);
      if (cancelled) return;
      if (cached) {
        setSummaryText(cached);
        return;
      }
      setSummaryLoading(true);
      setSummaryError(false);
      const text = await callAIWithFallback(buildSummaryPrompt(item), SUMMARY_SYSTEM_PROMPT, 200);
      if (cancelled) return;
      if (text) {
        setSummaryText(text.trim());
        setSummary(item.id, text.trim()).catch(() => {});
      } else {
        setSummaryError(true);
      }
      setSummaryLoading(false);
    })();
    return () => { cancelled = true; };
  }, [summaryOpen, summaryText, summaryLoading, item]);

  const handleSummary = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setSummaryOpen((prev) => !prev);
  }, []);

  const handleRetry = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setSummaryText(null);
    setSummaryError(false);
  }, []);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onRead(item.id)}
      style={{
        display: "flex", flexDirection: "column", gap: 0,
        padding: "12px 14px",
        background: item.read ? C.surf : C.surfHi,
        border: `1px solid ${item.read ? C.borderLo : C.border}`,
        borderRadius: 6,
        marginBottom: 8,
        textDecoration: "none",
        color: "inherit",
        opacity: item.read ? 0.55 : 1,
        transition: "opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        {item.image ? (
          <LazyImage src={item.image} width={56} height={56} />
        ) : (
          <div
            style={{
              width: 56, height: 56, borderRadius: 4,
              background: C.bg, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.txtMute,
            }}
            aria-hidden="true"
          >
            <i className="ph ph-newspaper" style={{ fontSize: 20 }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontSize: 14, color: C.txt, lineHeight: 1.4, marginBottom: 4, flex: 1, minWidth: 0 }}>
              {item.title}
            </div>
            <button
              onClick={handleSummary}
              aria-label={summaryOpen ? "Nascondi riassunto" : "Riassumi con AI"}
              aria-expanded={summaryOpen}
              style={{
                background: "none", border: "none",
                color: summaryOpen ? C.B : C.txtMute,
                cursor: "pointer", padding: 2,
                flexShrink: 0, marginTop: -2,
              }}
            >
              <i className="ph ph-sparkle" style={{ fontSize: 14 }} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dispatchSave(item); }}
              aria-label={saved ? "Articolo salvato" : "Salva articolo"}
              style={{
                background: "none", border: "none",
                color: saved ? C.gold : C.txtMute,
                cursor: "pointer", padding: 2,
                flexShrink: 0, marginTop: -2, marginRight: -4,
              }}
            >
              <i className={`ph ${saved ? "ph-bookmark-simple-fill" : "ph-bookmark-simple"}`} style={{ fontSize: 14 }} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginBottom: 4, letterSpacing: 0.3 }}>
            {item.source} · {timeAgo(item.publishedAt)}
          </div>
          {item.summary && (
            <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.5 }}>
              {item.summary.length > 140 ? item.summary.slice(0, 140) + "…" : item.summary}
            </div>
          )}
        </div>
      </div>

      {summaryOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 10, paddingTop: 10,
            borderTop: `1px solid ${C.borderLo}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <i className="ph ph-sparkle" style={{ fontSize: 11, color: C.B }} />
            <span style={{ fontSize: 10, color: C.B, fontFamily: FONT, letterSpacing: 1, textTransform: "uppercase" }}>
              Riassunto AI
            </span>
          </div>
          {summaryLoading && (
            <div style={{ fontSize: 12, color: C.txtMute, fontFamily: FONT, fontStyle: "italic" }}>
              Generazione in corso…
            </div>
          )}
          {!summaryLoading && summaryError && (
            <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.5 }}>
              {summaryError === "unavailable" 
                ? "Servizio AI momentaneamente non disponibile." 
                : "Non sono riuscito a generare il riassunto."}{" "}
              <button
                onClick={handleRetry}
                style={{ background: "none", border: "none", color: C.B, fontSize: 12, fontFamily: FONT, cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                Riprova
              </button>
            </div>
          )}
          {!summaryLoading && !summaryError && summaryText && (
            <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.6 }}>
              {summaryText}
            </div>
          )}
        </div>
      )}
    </a>
  );
}

export default memo(FeedItemCardImpl, (prev, next) =>
  prev.item.id === next.item.id &&
  prev.item.read === next.item.read &&
  prev.saved === next.saved &&
  prev.onRead === next.onRead
);
