import { useState, useCallback } from "react";
import { C, FONT, btn, label } from "../../shared/design/tokens.js";
import WeatherCard from "./components/WeatherCard.jsx";
import FeedItemCard from "./components/FeedItemCard.jsx";
import CategoryFilter from "./components/CategoryFilter.jsx";
import SourceManager from "./components/SourceManager.jsx";
import VirtualFeedList from "./components/VirtualFeedList.jsx";

function fullDate() {
  return new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

export default function FeedTab({ feed, savedArticleIds }) {
  const [showManager, setShowManager] = useState(false);
  const {
    sources, items, weather,
    loading, errorSources,
    filter, setFilter, categories,
    refresh, addSource, toggleSource, removeSource, reorderSource,
    markRead,
  } = feed;

  // Stable callback so memoized FeedItemCards don't get re-renders when
  // unrelated state changes.
  const handleRead = useCallback((id) => markRead(id), [markRead]);
  const renderItem = useCallback(
    (item) => (
      <FeedItemCard
        key={item.id}
        item={item}
        onRead={handleRead}
        saved={savedArticleIds?.has(item.id) ?? false}
      />
    ),
    [handleRead, savedArticleIds],
  );

  if (showManager) {
    return (
      <SourceManager
        sources={sources}
        onAdd={addSource}
        onToggle={toggleSource}
        onRemove={removeSource}
        onReorder={reorderSource}
        onClose={() => setShowManager(false)}
      />
    );
  }

  return (
    <>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "calc(20px + env(safe-area-inset-top)) 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...label, marginBottom: 6 }}>
              <span style={{ color: C.A }}>§</span>&nbsp;&nbsp;Feed
            </div>
            <div style={{ fontSize: 22, color: C.txt, letterSpacing: "-0.02em", textTransform: "capitalize" }}>
              {fullDate()}
            </div>
          </div>
          <button
            onClick={() => setShowManager(true)}
            aria-label="Gestisci fonti"
            style={{
              background: C.surfHi, border: `1px solid ${C.border}`,
              borderRadius: 4, color: C.txtSec,
              width: 36, height: 36, cursor: "pointer", flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <i className="ph ph-gear" style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {weather && <WeatherCard weather={weather} />}

        {categories.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <CategoryFilter categories={categories} value={filter} onChange={setFilter} />
          </div>
        )}

        {errorSources.length > 0 && (
          <div
            style={{
              fontSize: 11, color: C.D, lineHeight: 1.6,
              background: C.D + "10", border: `1px solid ${C.D}33`,
              borderRadius: 4, padding: "8px 12px", marginBottom: 10,
              fontFamily: FONT,
            }}
          >
            {errorSources.length} {errorSources.length === 1 ? "fonte non disponibile" : "fonti non disponibili"} · contenuti dalla cache se presenti
          </div>
        )}

        {loading && items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.txtMute, fontSize: 13 }}>
            Caricamento…
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 20px", color: C.txtSec, fontSize: 13, lineHeight: 1.6 }}>
            <i className="ph ph-newspaper" style={{ fontSize: 32, color: C.txtMute, display: "block", marginBottom: 12 }} />
            Nessun articolo per questo filtro.
            <div style={{ marginTop: 4, color: C.txtMute, fontSize: 12 }}>
              Aggiungi fonti dal pulsante in alto a destra.
            </div>
          </div>
        ) : (
          <VirtualFeedList key={filter ?? "all"} items={items} renderItem={renderItem} />
        )}

        <button
          onClick={() => refresh(true)}
          disabled={loading}
          style={{
            ...btn(C.surf, C.txtSec),
            border: `1px solid ${C.border}`,
            marginTop: 8, fontSize: 12,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {loading ? "Caricamento…" : (
            <>
              <i className="ph ph-arrows-clockwise" style={{ fontSize: 14 }} />
              Aggiorna
            </>
          )}
        </button>
        <div style={{ height: 16 }} />
      </div>
    </>
  );
}
