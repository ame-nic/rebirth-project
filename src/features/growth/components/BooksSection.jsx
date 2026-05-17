import { useMemo, useState } from "react";
import { C, FONT, btn, card, label } from "../../../shared/design/tokens.js";
import { searchBooks } from "../services/openLibrary.js";
import { BOOK_STATUS, BOOK_STATUS_ORDER } from "../data/skills.js";

const fieldStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 14, fontFamily: FONT, outline: "none",
};

function Sheet({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surf, borderRadius: "10px 10px 0 0",
          padding: "20px 18px 28px", border: `1px solid ${C.border}`,
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        {children}
      </div>
    </div>
  );
}

function BookCover({ url, size = 56 }) {
  if (!url) {
    return (
      <div
        style={{
          width: size, height: size * 1.4, borderRadius: 4,
          background: C.bg, border: `1px solid ${C.borderLo}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.txtMute, flexShrink: 0,
        }}
      >
        <i className="ph ph-book" style={{ fontSize: 18 }} />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      style={{
        width: size, height: size * 1.4, objectFit: "cover",
        borderRadius: 4, background: C.bg, flexShrink: 0,
      }}
    />
  );
}

function RatingStars({ value, onChange, size = 14 }) {
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange?.(value === n ? null : n); }}
            style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", padding: 2 }}
            aria-label={`${n} stelle`}
          >
            <i className={`ph ${on ? "ph-star-fill" : "ph-star"}`} style={{ fontSize: size, color: on ? C.sport : C.txtMute }} />
          </button>
        );
      })}
    </div>
  );
}

function SearchSheet({ onPick, onClose }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    const r = await searchBooks(query);
    setResults(r);
    setLoading(false);
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ ...label, color: C.A, marginBottom: 6 }}>Cerca libro</div>
      <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.5, marginBottom: 12 }}>
        Cerca su OpenLibrary (gratuito). I risultati sono in cache 7 giorni.
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
          placeholder="Titolo o autore"
          style={fieldStyle}
          autoFocus
        />
        <button
          onClick={handleSearch}
          disabled={loading || query.trim().length < 2}
          style={{
            background: C.A, color: C.bg, border: "none", borderRadius: 4,
            padding: "10px 16px", fontFamily: FONT, fontSize: 13, cursor: "pointer",
          }}
        >
          {loading ? "…" : "Cerca"}
        </button>
      </div>

      {results == null ? (
        <div style={{ fontSize: 12, color: C.txtMute, fontStyle: "italic" }}>
          Inserisci un titolo o l'autore.
        </div>
      ) : results.length === 0 ? (
        <div style={{ fontSize: 12, color: C.txtMute }}>
          Nessun risultato.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {results.map((r) => (
            <button
              key={r.ol_key}
              onClick={() => onPick(r)}
              style={{
                background: C.surfHi, border: `1px solid ${C.border}`,
                borderRadius: 4, padding: "10px 12px",
                display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <BookCover url={r.cover_url} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: C.txt, fontWeight: 500, lineHeight: 1.3 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginTop: 2 }}>
                  {r.author}{r.year ? ` · ${r.year}` : ""}
                </div>
              </div>
              <i className="ph ph-plus" style={{ fontSize: 14, color: C.A }} />
            </button>
          ))}
        </div>
      )}

      <button onClick={onClose} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 16 }}>
        Chiudi
      </button>
    </Sheet>
  );
}

function BookEditSheet({ book, onSave, onClose, onDelete }) {
  const [status, setStatus]     = useState(book.status ?? "want_to_read");
  const [rating, setRating]     = useState(book.rating ?? null);
  const [tags, setTags]         = useState((book.tags ?? []).join(", "));
  const [notes, setNotes]       = useState(book.notes ?? "");
  const [startedAt, setStartedAt]   = useState(book.started_at ?? "");
  const [finishedAt, setFinishedAt] = useState(book.finished_at ?? "");

  async function save() {
    await onSave({
      ...book,
      status, rating,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes: notes.trim(),
      started_at:  startedAt  || null,
      finished_at: finishedAt || null,
    });
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ ...label, color: C.A, marginBottom: 8 }}>{book.title}</div>
      <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 14 }}>{book.author}</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 6 }}>Stato</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {BOOK_STATUS_ORDER.map((s) => {
            const def = BOOK_STATUS[s];
            const on = status === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: "6px 12px",
                  background: on ? def.color + "22" : "none",
                  border: `1px solid ${on ? def.color + "66" : C.border}`,
                  color: on ? def.color : C.txtSec,
                  borderRadius: 4, fontSize: 11, fontFamily: FONT, cursor: "pointer",
                }}
              >
                {def.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 6 }}>Voto</div>
        <RatingStars value={rating} onChange={setRating} size={20} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <label>
          <div style={{ ...label, marginBottom: 4 }}>Iniziato</div>
          <input type="date" value={startedAt ?? ""} onChange={(e) => setStartedAt(e.target.value)} style={fieldStyle} />
        </label>
        <label>
          <div style={{ ...label, marginBottom: 4 }}>Finito</div>
          <input type="date" value={finishedAt ?? ""} onChange={(e) => setFinishedAt(e.target.value)} style={fieldStyle} />
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 4 }}>Tag (separati da virgola)</div>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="es. architettura, ai" style={fieldStyle} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...label, marginBottom: 4 }}>Note</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={4}
          style={{ ...fieldStyle, resize: "vertical", fontFamily: FONT }}
        />
      </div>

      <button onClick={save} style={{ ...btn(C.A, C.bg) }}>Salva</button>
      <button onClick={onClose} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}>Annulla</button>
      {onDelete && (
        <button
          onClick={() => {
            if (window.confirm(`Rimuovere "${book.title}"?`)) { onDelete(book.id); onClose(); }
          }}
          style={{ ...btn("none", C.D), border: `1px solid ${C.D}44`, marginTop: 8, fontSize: 12 }}
        >
          <i className="ph ph-trash" style={{ marginRight: 6 }} />
          Rimuovi
        </button>
      )}
    </Sheet>
  );
}

export default function BooksSection({ books, upsertBook, removeBook }) {
  const [searching, setSearching] = useState(false);
  const [editing,   setEditing]   = useState(null);

  const grouped = useMemo(() => {
    const out = { reading: [], want_to_read: [], read: [], abandoned: [] };
    for (const b of books) {
      const s = out[b.status] ? b.status : "want_to_read";
      out[s].push(b);
    }
    // Sort: reading by started_at desc; read by finished_at desc.
    out.reading.sort((a, b) => (b.started_at ?? "").localeCompare(a.started_at ?? ""));
    out.read.sort((a, b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? ""));
    return out;
  }, [books]);

  async function handlePick(result) {
    await upsertBook({
      title: result.title,
      author: result.author,
      cover_url: result.cover_url,
      ol_key: result.ol_key,
      status: "want_to_read",
    });
    setSearching(false);
  }

  return (
    <>
      <button
        onClick={() => setSearching(true)}
        style={{ ...btn(C.A, C.bg), marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="ph ph-magnifying-glass" />
        Cerca e aggiungi libro
      </button>

      {books.length === 0 ? (
        <div style={card()}>
          <div style={{ fontSize: 13, color: C.txtSec, textAlign: "center", padding: "16px 0", lineHeight: 1.6 }}>
            Nessun libro in libreria. Inizia con un titolo che vuoi leggere.
          </div>
        </div>
      ) : (
        BOOK_STATUS_ORDER.map((s) => {
          const list = grouped[s];
          if (list.length === 0) return null;
          const def = BOOK_STATUS[s];
          return (
            <div key={s} style={{ marginBottom: 14 }}>
              <div style={{ ...label, color: def.color, marginBottom: 8 }}>
                {def.label} <span style={{ color: C.txtMute, marginLeft: 4 }}>({list.length})</span>
              </div>
              {list.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setEditing(b)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: C.surf, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "10px 12px", marginBottom: 6,
                    display: "flex", alignItems: "flex-start", gap: 10,
                    cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  <BookCover url={b.cover_url} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.txt, fontWeight: 500, lineHeight: 1.3 }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: C.txtMute, marginTop: 3 }}>{b.author}</div>
                    {b.rating != null && (
                      <div style={{ marginTop: 4 }}>
                        <RatingStars value={b.rating} size={12} />
                      </div>
                    )}
                    {b.tags?.length > 0 && (
                      <div style={{ fontSize: 10, color: C.txtMute, marginTop: 4 }}>
                        {b.tags.join(" · ")}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          );
        })
      )}

      {searching && <SearchSheet onPick={handlePick} onClose={() => setSearching(false)} />}
      {editing   && <BookEditSheet book={editing} onSave={upsertBook} onDelete={removeBook} onClose={() => setEditing(null)} />}
    </>
  );
}
