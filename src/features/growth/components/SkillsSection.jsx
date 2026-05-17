import { useMemo, useState } from "react";
import { C, FONT, btn, card, label } from "../../../shared/design/tokens.js";
import { SKILL_LEVELS, SKILL_CATEGORIES } from "../data/skills.js";

const fieldStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 14, fontFamily: FONT, outline: "none",
};

function LevelDots({ current, target = null, size = 8 }) {
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= current;
        const isTarget = target != null && n === target;
        return (
          <span
            key={n}
            style={{
              width: size, height: size, borderRadius: "50%",
              background: filled ? SKILL_LEVELS[Math.max(1, Math.min(5, current))].color : "transparent",
              border: filled
                ? "none"
                : isTarget
                ? `1px dashed ${C.txtSec}`
                : `1px solid ${C.borderLo}`,
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

function GapIndicator({ current, target }) {
  if (!Number.isFinite(current) || !Number.isFinite(target)) return null;
  const gap = target - current;
  if (gap <= 0) {
    return <i className="ph ph-check" style={{ color: C.C, fontSize: 14 }} aria-label="target raggiunto" />;
  }
  return (
    <span style={{ color: gap >= 2 ? C.D : C.sport, fontSize: 11, fontFamily: FONT, fontWeight: 500 }}>
      {"↑".repeat(Math.min(3, gap))}
    </span>
  );
}

function SkillEditSheet({ skill, onSave, onDelete, onClose }) {
  const initial = skill ?? {};
  const [name, setName]             = useState(initial.name ?? "");
  const [category, setCategory]     = useState(initial.category ?? "technical");
  const [current, setCurrent]       = useState(initial.current_level ?? 1);
  const [target, setTarget]         = useState(initial.target_level ?? 3);
  const [evidence, setEvidence]     = useState(initial.evidence ?? "");
  const [notes, setNotes]           = useState(initial.notes ?? "");
  const [lastUsed, setLastUsed]     = useState(initial.last_used ?? "");

  async function save() {
    if (!name.trim()) return;
    await onSave({
      ...skill,
      name: name.trim(),
      category,
      current_level: Math.max(1, Math.min(5, current)),
      target_level:  Math.max(1, Math.min(5, target)),
      evidence: evidence.trim(),
      notes: notes.trim(),
      last_used: lastUsed || null,
    });
    onClose();
  }

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
        <div style={{ ...label, color: C.A, marginBottom: 10 }}>
          {skill?.id ? "Modifica competenza" : "Nuova competenza"}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ ...label, marginBottom: 4 }}>Nome</div>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} maxLength={60} placeholder="es. Quarkus" />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ ...label, marginBottom: 4 }}>Categoria</div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...fieldStyle, appearance: "none" }}>
            {Object.entries(SKILL_CATEGORIES)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([key, def]) => (
                <option key={key} value={key}>{def.label}</option>
              ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ ...label, marginBottom: 6 }}>
            Livello attuale · <span style={{ color: SKILL_LEVELS[current].color }}>{SKILL_LEVELS[current].label}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = current === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCurrent(n)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: on ? SKILL_LEVELS[n].color + "22" : "none",
                    border: `1px solid ${on ? SKILL_LEVELS[n].color + "66" : C.border}`,
                    color: on ? SKILL_LEVELS[n].color : C.txtSec,
                    borderRadius: 4, fontSize: 13, fontFamily: FONT, cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginTop: 6 }}>
            {SKILL_LEVELS[current].desc}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ ...label, marginBottom: 6 }}>
            Target · <span style={{ color: SKILL_LEVELS[target].color }}>{SKILL_LEVELS[target].label}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = target === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTarget(n)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: on ? C.surfHi : "none",
                    border: `1px dashed ${on ? SKILL_LEVELS[n].color : C.border}`,
                    color: on ? SKILL_LEVELS[n].color : C.txtSec,
                    borderRadius: 4, fontSize: 13, fontFamily: FONT, cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ ...label, marginBottom: 4 }}>Evidenze (progetti, certificazioni)</div>
          <input type="text" value={evidence} onChange={(e) => setEvidence(e.target.value)} style={fieldStyle} placeholder="es. Progetto Zeroth, TOGAF cert." />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ ...label, marginBottom: 4 }}>Ultimo utilizzo</div>
          <input type="date" value={lastUsed ?? ""} onChange={(e) => setLastUsed(e.target.value)} style={fieldStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ ...label, marginBottom: 4 }}>Note</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...fieldStyle, resize: "vertical", fontFamily: FONT }} maxLength={300} />
        </div>

        <button onClick={save} disabled={!name.trim()} style={{ ...btn(C.A, C.bg), opacity: name.trim() ? 1 : 0.5 }}>Salva</button>
        <button onClick={onClose} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}>Annulla</button>
        {skill?.id && onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`Rimuovere "${skill.name}"?`)) { onDelete(skill.id); onClose(); }
            }}
            style={{ ...btn("none", C.D), border: `1px solid ${C.D}44`, marginTop: 8, fontSize: 12 }}
          >
            <i className="ph ph-trash" style={{ marginRight: 6 }} />
            Rimuovi
          </button>
        )}
      </div>
    </div>
  );
}

export default function SkillsSection({ skills, upsertSkill, removeSkill }) {
  const [editing, setEditing] = useState(null);

  const grouped = useMemo(() => {
    const out = {};
    for (const s of skills) {
      const cat = SKILL_CATEGORIES[s.category] ? s.category : "technical";
      if (!out[cat]) out[cat] = [];
      out[cat].push(s);
    }
    for (const cat of Object.keys(out)) {
      out[cat].sort((a, b) => (b.current_level ?? 0) - (a.current_level ?? 0));
    }
    return out;
  }, [skills]);

  const orderedCategories = useMemo(
    () => Object.keys(SKILL_CATEGORIES).sort((a, b) => SKILL_CATEGORIES[a].order - SKILL_CATEGORIES[b].order),
    [],
  );

  return (
    <>
      <button
        onClick={() => setEditing({})}
        style={{ ...btn(C.A, C.bg), marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <i className="ph ph-plus" />
        Nuova competenza
      </button>

      {skills.length === 0 ? (
        <div style={card()}>
          <div style={{ fontSize: 13, color: C.txtSec, textAlign: "center", padding: "16px 0", lineHeight: 1.6 }}>
            Nessuna competenza tracciata. Mappa cosa sai per vedere il gap verso dove vuoi arrivare.
          </div>
        </div>
      ) : (
        orderedCategories.map((cat) => {
          const list = grouped[cat];
          if (!list || list.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ ...label, marginBottom: 8 }}>{SKILL_CATEGORIES[cat].label}</div>
              {list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setEditing(s)}
                  style={{
                    width: "100%", textAlign: "left",
                    background: C.surf, border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "10px 12px", marginBottom: 6,
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", fontFamily: FONT,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.txt, fontWeight: 500 }}>{s.name}</div>
                    {s.evidence && (
                      <div style={{ fontSize: 10, color: C.txtMute, marginTop: 2 }}>{s.evidence}</div>
                    )}
                  </div>
                  <LevelDots current={s.current_level} target={s.target_level} />
                  <span style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, width: 28, textAlign: "right" }}>
                    {s.current_level}/{s.target_level}
                  </span>
                  <span style={{ width: 24, textAlign: "right" }}>
                    <GapIndicator current={s.current_level} target={s.target_level} />
                  </span>
                </button>
              ))}
            </div>
          );
        })
      )}

      {editing != null && (
        <SkillEditSheet
          skill={editing}
          onSave={upsertSkill}
          onDelete={removeSkill}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
