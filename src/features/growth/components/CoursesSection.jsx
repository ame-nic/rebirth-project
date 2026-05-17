import { useMemo, useState } from "react";
import { C, FONT, btn, card, label, pill } from "../../../shared/design/tokens.js";
import { COURSE_STATUS, COURSE_STATUS_ORDER, COURSE_TYPE_LABEL } from "../data/skills.js";

const fieldStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 14, fontFamily: FONT, outline: "none",
};

const TYPE_OPTIONS = ["corso", "certificazione", "conferenza", "workshop"];

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

function CourseEditSheet({ course, onSave, onDelete, onClose }) {
  const initial = course ?? {};
  const [name, setName]                 = useState(initial.name ?? "");
  const [provider, setProvider]         = useState(initial.provider ?? "");
  const [type, setType]                 = useState(initial.type ?? "corso");
  const [status, setStatus]             = useState(initial.status ?? "planned");
  const [url, setUrl]                   = useState(initial.url ?? "");
  const [credentialUrl, setCredentialUrl] = useState(initial.credential_url ?? "");
  const [startedAt, setStartedAt]       = useState(initial.started_at ?? "");
  const [completedAt, setCompletedAt]   = useState(initial.completed_at ?? "");
  const [notes, setNotes]               = useState(initial.notes ?? "");

  async function save() {
    if (!name.trim()) return;
    await onSave({
      ...course,
      name: name.trim(),
      provider: provider.trim(),
      type,
      status,
      url: url.trim(),
      credential_url: credentialUrl.trim() || null,
      started_at:   startedAt   || null,
      completed_at: completedAt || null,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ ...label, color: C.A, marginBottom: 10 }}>
        {course?.id ? "Modifica corso" : "Nuovo corso / certificazione"}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ ...label, marginBottom: 4 }}>Nome</div>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} maxLength={120} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <label>
          <div style={{ ...label, marginBottom: 4 }}>Provider</div>
          <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)} style={fieldStyle} placeholder="Coursera, O'Reilly..." />
        </label>
        <label>
          <div style={{ ...label, marginBottom: 4 }}>Tipo</div>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...fieldStyle, appearance: "none" }}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{COURSE_TYPE_LABEL[t]}</option>)}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ ...label, marginBottom: 6 }}>Stato</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {COURSE_STATUS_ORDER.map((s) => {
            const def = COURSE_STATUS[s];
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

      <div style={{ marginBottom: 10 }}>
        <div style={{ ...label, marginBottom: 4 }}>URL corso (opzionale)</div>
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} style={fieldStyle} placeholder="https://" />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ ...label, marginBottom: 4 }}>URL certificato (opzionale)</div>
        <input type="url" value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} style={fieldStyle} placeholder="https://" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <label>
          <div style={{ ...label, marginBottom: 4 }}>Iniziato</div>
          <input type="date" value={startedAt ?? ""} onChange={(e) => setStartedAt(e.target.value)} style={fieldStyle} />
        </label>
        <label>
          <div style={{ ...label, marginBottom: 4 }}>Completato</div>
          <input type="date" value={completedAt ?? ""} onChange={(e) => setCompletedAt(e.target.value)} style={fieldStyle} />
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ ...label, marginBottom: 4 }}>Note</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ ...fieldStyle, resize: "vertical", fontFamily: FONT }}
          maxLength={400}
        />
      </div>

      <button onClick={save} disabled={!name.trim()} style={{ ...btn(C.A, C.bg), opacity: name.trim() ? 1 : 0.5 }}>
        Salva
      </button>
      <button onClick={onClose} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}>
        Annulla
      </button>
      {course?.id && onDelete && (
        <button
          onClick={() => {
            if (window.confirm(`Rimuovere "${course.name}"?`)) { onDelete(course.id); onClose(); }
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

export default function CoursesSection({ courses, upsertCourse, removeCourse }) {
  const [editing, setEditing] = useState(null);

  const grouped = useMemo(() => {
    const out = { in_progress: [], planned: [], completed: [], paused: [] };
    for (const c of courses) {
      const s = out[c.status] ? c.status : "planned";
      out[s].push(c);
    }
    out.completed.sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
    return out;
  }, [courses]);

  return (
    <>
      <button
        onClick={() => setEditing({})}
        style={{ ...btn(C.A, C.bg), marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="ph ph-plus" />
        Nuovo corso
      </button>

      {courses.length === 0 ? (
        <div style={card()}>
          <div style={{ fontSize: 13, color: C.txtSec, textAlign: "center", padding: "16px 0", lineHeight: 1.6 }}>
            Nessun corso registrato.
          </div>
        </div>
      ) : (
        COURSE_STATUS_ORDER.map((s) => {
          const list = grouped[s];
          if (list.length === 0) return null;
          const def = COURSE_STATUS[s];
          return (
            <div key={s} style={{ marginBottom: 14 }}>
              <div style={{ ...label, color: def.color, marginBottom: 8 }}>
                {def.label} <span style={{ color: C.txtMute, marginLeft: 4 }}>({list.length})</span>
              </div>
              {list.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setEditing(c)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: C.surf, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "10px 12px", marginBottom: 6,
                    cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 13, color: C.txt, fontWeight: 500, flex: 1 }}>{c.name}</div>
                    <span style={pill(def.color)}>{COURSE_TYPE_LABEL[c.type] ?? c.type}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.txtMute }}>
                    {c.provider}
                    {c.completed_at && ` · completato ${c.completed_at}`}
                  </div>
                  {c.credential_url && (
                    <a
                      href={c.credential_url}
                      target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 10, color: C.B, textDecoration: "underline", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: FONT }}
                    >
                      <i className="ph ph-link" /> certificato
                    </a>
                  )}
                </button>
              ))}
            </div>
          );
        })
      )}

      {editing != null && (
        <CourseEditSheet
          course={editing}
          onSave={upsertCourse}
          onDelete={removeCourse}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
