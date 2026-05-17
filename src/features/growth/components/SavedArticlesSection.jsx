import { useMemo, useState } from "react";
import { C, FONT, card } from "../../../shared/design/tokens.js";

const fieldStyle = {
  width: "100%", padding: "8px 10px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 12, fontFamily: FONT, outline: "none",
};

function ArticleCard({ article, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes]     = useState(article.notes ?? "");
  const [tags, setTags]       = useState((article.tags ?? []).join(", "));

  async function save() {
    await onUpdate(article.id, {
      notes: notes.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setEditing(false);
  }

  return (
    <div style={{ background: C.surf, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px", marginBottom: 8 }}>
      <a
        href={article.url}
        target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 13, color: C.txt, fontWeight: 500, lineHeight: 1.4, textDecoration: "none", display: "block" }}
      >
        {article.title}
      </a>
      <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 4 }}>
        {article.source} · {new Date(article.saved_at).toLocaleDateString("it-IT")}
      </div>

      {!editing ? (
        <>
          {article.notes && (
            <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55, marginTop: 8, fontStyle: "italic" }}>
              "{article.notes}"
            </div>
          )}
          {article.tags?.length > 0 && (
            <div style={{ fontSize: 10, color: C.B, fontFamily: FONT, marginTop: 6 }}>
              {article.tags.map((t) => `#${t}`).join(" ")}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button
              onClick={() => setEditing(true)}
              style={{
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: 4, color: C.txtSec,
                padding: "4px 10px", fontSize: 10, fontFamily: FONT, cursor: "pointer",
              }}
            >
              <i className="ph ph-pencil-simple" style={{ marginRight: 4 }} /> annota
            </button>
            <button
              onClick={() => {
                if (window.confirm("Rimuovere questo articolo dai salvati?")) onRemove(article.id);
              }}
              style={{
                background: "none", border: `1px solid ${C.border}`,
                borderRadius: 4, color: C.D,
                padding: "4px 10px", fontSize: 10, fontFamily: FONT, cursor: "pointer",
              }}
            >
              <i className="ph ph-trash" style={{ marginRight: 4 }} /> rimuovi
            </button>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Cosa mi ha colpito di questo articolo?"
            style={{ ...fieldStyle, resize: "vertical", fontFamily: FONT, marginBottom: 6 }}
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tag separati da virgola"
            style={fieldStyle}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button
              onClick={save}
              style={{ background: C.A, color: C.bg, border: "none", borderRadius: 4, padding: "6px 14px", fontSize: 11, fontFamily: FONT, cursor: "pointer" }}
            >
              Salva
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 4, color: C.txtSec, padding: "6px 14px", fontSize: 11, fontFamily: FONT, cursor: "pointer" }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavedArticlesSection({ articles, updateArticle, removeArticle }) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter) return articles;
    const q = filter.toLowerCase();
    return articles.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.source?.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q) ||
      a.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [articles, filter]);

  return (
    <>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Cerca per titolo, fonte o tag"
          style={{
            width: "100%", padding: "10px 12px 10px 36px",
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 4, color: C.txt,
            fontSize: 13, fontFamily: FONT, outline: "none",
          }}
        />
        <i className="ph ph-magnifying-glass" style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          color: C.txtMute, fontSize: 14, pointerEvents: "none",
        }} />
      </div>

      {filtered.length === 0 ? (
        <div style={card()}>
          <div style={{ fontSize: 13, color: C.txtSec, textAlign: "center", padding: "20px 0", lineHeight: 1.6 }}>
            {articles.length === 0
              ? "Nessun articolo salvato. Usa l'icona bookmark nel Feed per aggiungerli."
              : "Nessun risultato per questa ricerca."}
          </div>
        </div>
      ) : (
        filtered.map((a) => (
          <ArticleCard
            key={a.id}
            article={a}
            onUpdate={updateArticle}
            onRemove={removeArticle}
          />
        ))
      )}
    </>
  );
}
