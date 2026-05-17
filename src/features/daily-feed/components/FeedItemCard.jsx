import { memo } from "react";
import { C, FONT } from "../../../shared/design/tokens.js";
import { timeAgo } from "../utils/timeAgo.js";
import LazyImage from "./LazyImage.jsx";

function dispatchSave(item) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("article:save", { detail: item }));
}

/* memo'd because the feed re-renders frequently (scroll, background
   revalidation, read state changes). Custom comparator: a card only
   needs to re-render if its id, read state, saved state, or onRead
   identity changed. */
function FeedItemCardImpl({ item, onRead, saved = false }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onRead(item.id)}
      style={{
        display: "flex", gap: 12,
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
    </a>
  );
}

export default memo(FeedItemCardImpl, (prev, next) =>
  prev.item.id === next.item.id &&
  prev.item.read === next.item.read &&
  prev.saved === next.saved &&
  prev.onRead === next.onRead
);
