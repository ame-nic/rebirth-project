import { useState } from "react";
import { C, FONT, btn, label } from "../../../shared/design/tokens.js";
import { CATEGORY_LABELS } from "../data/defaultSources.js";
import { fetchRSS } from "../services/fetchRSS.js";
import { fetchReddit } from "../services/fetchReddit.js";

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS);

const fieldStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 13, fontFamily: FONT,
  outline: "none",
};

function TypeTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "10px 12px",
        background: active ? C.surfHi : "none",
        border: `1px solid ${active ? C.A + "55" : C.border}`,
        color: active ? C.A : C.txtSec,
        borderRadius: 4, fontSize: 12, fontFamily: FONT,
        cursor: "pointer",
        transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </button>
  );
}

export default function AddSourceSheet({ onSave, onClose }) {
  const [type, setType]           = useState("rss");
  const [labelText, setLabelText] = useState("");
  const [url, setUrl]             = useState("");
  const [subreddit, setSubreddit] = useState("");
  const [category, setCategory]   = useState("tech");
  const [testing, setTesting]     = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok, message, sample? }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const probe = type === "rss"
      ? { id: "probe", type: "rss",    category, label: labelText || url,  config: { url } }
      : { id: "probe", type: "reddit", category, label: labelText || subreddit, config: { subreddit, sort: "hot", limit: 1 } };
    try {
      const fetcher = type === "rss" ? fetchRSS : fetchReddit;
      const items = await fetcher(probe);
      if (!items.length) throw new Error("Nessun elemento trovato.");
      setTestResult({ ok: true, sample: items[0] });
    } catch (e) {
      setTestResult({ ok: false, message: e.message });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    const payload = type === "rss"
      ? { type: "rss",    label: labelText.trim() || url, category, config: { url: url.trim() } }
      : { type: "reddit", label: labelText.trim() || `r/${subreddit}`, category,
          config: { subreddit: subreddit.trim().replace(/^r\//, ""), sort: "hot", limit: 5 } };
    onSave(payload);
    onClose();
  }

  const canSave = type === "rss" ? !!url.trim() : !!subreddit.trim();

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
          maxHeight: "88vh", overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ ...label, color: C.A, marginBottom: 6 }}>Aggiungi fonte</div>
        <div style={{ fontSize: 18, color: C.txt, fontWeight: 500, marginBottom: 16 }}>Nuova fonte feed</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <TypeTab active={type === "rss"} onClick={() => { setType("rss"); setTestResult(null); }}>RSS / Atom</TypeTab>
          <TypeTab active={type === "reddit"} onClick={() => { setType("reddit"); setTestResult(null); }}>Reddit</TypeTab>
        </div>

        {type === "rss" ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...label, marginBottom: 4 }}>URL feed</div>
            <input
              type="url"
              placeholder="https://esempio.it/feed/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={fieldStyle}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...label, marginBottom: 4 }}>Subreddit</div>
            <input
              type="text"
              placeholder="es. MachineLearning (senza r/)"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              style={fieldStyle}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <div style={{ ...label, marginBottom: 4 }}>Etichetta</div>
          <input
            type="text"
            placeholder="Nome visualizzato nel feed"
            value={labelText}
            onChange={(e) => setLabelText(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ ...label, marginBottom: 4 }}>Categoria</div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...fieldStyle, appearance: "none" }}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        {testResult && (
          <div
            style={{
              fontSize: 12, lineHeight: 1.55,
              color: testResult.ok ? C.C : C.D,
              background: (testResult.ok ? C.C : C.D) + "14",
              border: `1px solid ${(testResult.ok ? C.C : C.D)}44`,
              borderRadius: 4, padding: "10px 12px", marginBottom: 12,
            }}
          >
            {testResult.ok
              ? <>Connessione ok. Esempio: <span style={{ color: C.txt }}>{testResult.sample.title}</span></>
              : `Errore: ${testResult.message}`}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleTest}
            disabled={testing || !canSave}
            style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, flex: 1 }}
          >
            {testing ? "Test in corso…" : "Testa connessione"}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ ...btn(C.A, C.bg), flex: 1 }}
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}
