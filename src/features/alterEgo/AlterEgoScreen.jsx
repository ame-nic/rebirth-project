import { useMemo, useState } from "react";
import { C, FONT, btn, card, label } from "../../shared/design/tokens.js";
import { STARTER_STATEMENTS } from "./data/starterStatements.js";
import { ALTER_EGO_EMOJIS, ALTER_EGO_COLORS, STATEMENT_CATEGORIES } from "./data/emojiPalette.js";

const fieldStyle = {
  width: "100%", padding: "10px 12px",
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 4, color: C.txt,
  fontSize: 14, fontFamily: FONT, outline: "none",
};

const STEP_LABELS = ["Identità", "Dichiarazioni", "Simbolo"];

/* Onboarding wizard for first-time setup. After completion, the same
   component flips to "profile" mode with editable sections. */
function OnboardingFlow({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [checked, setChecked]         = useState(new Set([0, 1, 2]));
  const [custom, setCustom]           = useState([]);
  const [draft, setDraft]             = useState("");
  const [emoji, setEmoji]             = useState(ALTER_EGO_EMOJIS[0]);
  const [color, setColor]             = useState(ALTER_EGO_COLORS[0]);

  function toggleStarter(i) {
    const next = new Set(checked);
    if (next.has(i)) next.delete(i); else next.add(i);
    setChecked(next);
  }

  function addCustom() {
    const t = draft.trim();
    if (!t) return;
    setCustom([...custom, { text: t, category: "custom" }]);
    setDraft("");
  }

  function removeCustom(i) {
    setCustom(custom.filter((_, idx) => idx !== i));
  }

  const totalSelected = checked.size + custom.length;
  const canFinish = totalSelected >= 3 && totalSelected <= 10;

  async function handleFinish() {
    const statements = [
      ...[...checked].map((i) => STARTER_STATEMENTS[i]),
      ...custom,
    ];
    await onComplete({ name, description, emoji, color, statements });
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.txt, fontFamily: FONT, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "calc(16px + env(safe-area-inset-top)) 18px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onSkip} style={{ background: "none", border: "none", color: C.txtSec, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>
          <i className="ph ph-arrow-left" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ ...label, marginBottom: 2 }}>Configurazione · {step + 1}/3</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{STEP_LABELS[step]}</div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 28px" }}>
        {step === 0 && (
          <>
            <div style={{ ...card(), textAlign: "center", padding: "24px 18px" }}>
              <i className="ph ph-leaf" style={{ fontSize: 36, color: C.C, display: "block", marginBottom: 12 }} />
              <div style={{ fontSize: 17, color: C.txt, marginBottom: 8, fontWeight: 500 }}>
                Chi stai diventando?
              </div>
              <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.7 }}>
                Non chi sei oggi. Chi sei quando dai il meglio.<br />
                Molti atleti gli danno un nome — puoi farlo anche tu.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ ...label, marginBottom: 4 }}>Nome (opzionale)</div>
              <input
                type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`es. "L'Architetto", "Il Professionista"`}
                style={fieldStyle}
                maxLength={40}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ ...label, marginBottom: 4 }}>Descrizione</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="es. Una persona disciplinata che si allena, studia e cresce ogni giorno."
                rows={3}
                style={{ ...fieldStyle, resize: "vertical", fontFamily: FONT }}
                maxLength={200}
              />
            </div>

            <button onClick={() => setStep(1)} style={btn(C.A, C.bg)}>
              Continua
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.7, marginBottom: 14 }}>
              <strong style={{ color: C.txt }}>"Sono qualcuno che…"</strong><br />
              Scegli almeno tre dichiarazioni che vuoi rappresentare. Massimo dieci.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {STARTER_STATEMENTS.map((s, i) => {
                const on = checked.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleStarter(i)}
                    style={{
                      textAlign: "left",
                      background: on ? C.A + "14" : C.surf,
                      border: `1px solid ${on ? C.A + "55" : C.border}`,
                      borderRadius: 4, padding: "10px 12px",
                      cursor: "pointer", fontFamily: FONT,
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <i className={`ph ${on ? "ph-check-circle-fill" : "ph-circle"}`} style={{ color: on ? C.A : C.txtMute, fontSize: 16 }} />
                    <span style={{ flex: 1, fontSize: 13, color: on ? C.txt : C.txtSec }}>
                      {s.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {custom.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...label, marginBottom: 6 }}>Le tue</div>
                {custom.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: C.A + "14", border: `1px solid ${C.A}55`, borderRadius: 4, padding: "8px 12px", marginBottom: 4 }}>
                    <span style={{ flex: 1, fontSize: 13, color: C.txt }}>{s.text}</span>
                    <button onClick={() => removeCustom(i)} style={{ background: "none", border: "none", color: C.D, cursor: "pointer", padding: 0 }}>
                      <i className="ph ph-x" style={{ fontSize: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              <input
                type="text" value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                placeholder="Aggiungi una tua dichiarazione"
                style={fieldStyle}
                maxLength={100}
              />
              <button
                onClick={addCustom}
                disabled={!draft.trim() || totalSelected >= 10}
                style={{
                  background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4,
                  color: C.A, padding: "0 16px", cursor: "pointer", fontFamily: FONT,
                }}
              >
                <i className="ph ph-plus" />
              </button>
            </div>

            <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT, marginBottom: 12 }}>
              {totalSelected}/10 selezionate {totalSelected < 3 ? " · servono almeno 3" : ""}
            </div>

            <button onClick={() => setStep(2)} disabled={!canFinish} style={{ ...btn(C.A, C.bg), opacity: canFinish ? 1 : 0.5 }}>
              Continua
            </button>
            <button onClick={() => setStep(0)} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}>
              Indietro
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.7, marginBottom: 14 }}>
              Scegli un'emoji e un colore che ti rappresentano.
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ ...label, marginBottom: 6 }}>Simbolo</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
                {ALTER_EGO_EMOJIS.map((e) => {
                  const on = e === emoji;
                  return (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      style={{
                        fontSize: 22, padding: "10px 0",
                        background: on ? color + "22" : C.surf,
                        border: `1px solid ${on ? color + "66" : C.border}`,
                        borderRadius: 4, cursor: "pointer",
                      }}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ ...label, marginBottom: 6 }}>Colore</div>
              <div style={{ display: "flex", gap: 10 }}>
                {ALTER_EGO_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Colore ${c}`}
                    style={{
                      width: 36, height: 36, borderRadius: 999,
                      background: c,
                      border: c === color ? `2px solid ${C.txt}` : `1px solid ${C.border}`,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ ...card(), textAlign: "center", padding: "20px 16px", borderColor: color + "55", marginBottom: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div>
              <div style={{ fontSize: 14, color, fontFamily: FONT, fontWeight: 500, marginBottom: 6 }}>
                {name?.trim() || "Il tuo alter ego"}
              </div>
              <div style={{ fontSize: 12, color: C.txtSec, lineHeight: 1.55 }}>
                {description?.trim() || "Una persona che cresce ogni giorno."}
              </div>
            </div>

            <button onClick={handleFinish} style={btn(color, C.bg)}>
              Inizia la rinascita
            </button>
            <button onClick={() => setStep(1)} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, marginTop: 8 }}>
              Indietro
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Profile view — only rendered after onboarding. */
function ProfileView({ alterEgo, updateProfile, addStatement, updateStatement, removeStatement, reorderStatement, onClose }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName]               = useState(alterEgo.name ?? "");
  const [description, setDescription] = useState(alterEgo.description ?? "");
  const [emoji, setEmoji]             = useState(alterEgo.emoji);
  const [color, setColor]             = useState(alterEgo.color);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState("");
  const [draftCategory, setDraftCategory] = useState("custom");

  const sorted = useMemo(
    () => [...(alterEgo.identity_statements || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [alterEgo.identity_statements],
  );

  async function saveProfile() {
    await updateProfile({ name: name.trim(), description: description.trim(), emoji, color });
    setEditingProfile(false);
  }

  async function saveDraft() {
    const t = draft.trim();
    if (!t) return;
    await addStatement(t, draftCategory);
    setDraft("");
    setAdding(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.txt, fontFamily: FONT, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "calc(16px + env(safe-area-inset-top)) 18px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.txtSec, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>
          <i className="ph ph-arrow-left" />
        </button>
        <div>
          <div style={{ ...label, marginBottom: 2 }}>Identità</div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Il tuo alter ego</div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 28px" }}>
        {/* Profile card */}
        <div style={{ ...card(alterEgo.color + "55"), textAlign: "center", padding: "20px 16px" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{alterEgo.emoji}</div>
          {!editingProfile ? (
            <>
              <div style={{ fontSize: 18, color: alterEgo.color, fontWeight: 500 }}>
                {alterEgo.name?.trim() || "Senza nome"}
              </div>
              <div style={{ fontSize: 13, color: C.txtSec, lineHeight: 1.65, marginTop: 8, marginBottom: 14 }}>
                {alterEgo.description?.trim() || "Nessuna descrizione."}
              </div>
              <button
                onClick={() => setEditingProfile(true)}
                style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, fontSize: 12 }}
              >
                <i className="ph ph-pencil-simple" style={{ marginRight: 6 }} />
                Modifica
              </button>
            </>
          ) : (
            <>
              <input
                type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
                style={{ ...fieldStyle, textAlign: "center", marginBottom: 8 }}
                maxLength={40}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione"
                rows={2}
                style={{ ...fieldStyle, resize: "vertical", fontFamily: FONT, marginBottom: 10 }}
                maxLength={200}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, marginBottom: 10 }}>
                {ALTER_EGO_EMOJIS.map((e) => {
                  const on = e === emoji;
                  return (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      style={{
                        fontSize: 18, padding: "8px 0",
                        background: on ? color + "22" : C.surf,
                        border: `1px solid ${on ? color + "66" : C.border}`,
                        borderRadius: 4, cursor: "pointer",
                      }}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10 }}>
                {ALTER_EGO_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Colore ${c}`}
                    style={{
                      width: 28, height: 28, borderRadius: 999,
                      background: c,
                      border: c === color ? `2px solid ${C.txt}` : `1px solid ${C.border}`,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveProfile} style={{ ...btn(color, C.bg), flex: 1 }}>Salva</button>
                <button onClick={() => setEditingProfile(false)} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, flex: 1 }}>
                  Annulla
                </button>
              </div>
            </>
          )}
        </div>

        {/* Statements */}
        <div style={card()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ ...label, marginBottom: 0 }}>Dichiarazioni</div>
            <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT }}>
              {sorted.filter((s) => s.active).length} attive
            </div>
          </div>

          {sorted.length === 0 && (
            <div style={{ fontSize: 13, color: C.txtMute, fontStyle: "italic", padding: "10px 0" }}>
              Nessuna dichiarazione.
            </div>
          )}

          {sorted.map((s, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === sorted.length - 1;
            return (
              <div
                key={s.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 0",
                  borderBottom: idx < sorted.length - 1 ? `1px solid ${C.borderLo}` : "none",
                  opacity: s.active ? 1 : 0.5,
                }}
              >
                <button
                  onClick={() => updateStatement(s.id, { active: !s.active })}
                  aria-label={s.active ? "Disattiva" : "Attiva"}
                  style={{
                    width: 12, height: 12, borderRadius: 999,
                    background: s.active ? alterEgo.color : "transparent",
                    border: `1px solid ${s.active ? alterEgo.color : C.txtMute}`,
                    cursor: "pointer", padding: 0, flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: C.txt, lineHeight: 1.5 }}>
                  {s.text}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <button
                    onClick={() => reorderStatement(s.id, "up")}
                    disabled={isFirst}
                    style={iconBtn(isFirst)}
                    aria-label="Sposta su"
                  >
                    <i className="ph ph-caret-up" style={{ fontSize: 10 }} />
                  </button>
                  <button
                    onClick={() => reorderStatement(s.id, "down")}
                    disabled={isLast}
                    style={iconBtn(isLast)}
                    aria-label="Sposta giù"
                  >
                    <i className="ph ph-caret-down" style={{ fontSize: 10 }} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Rimuovere questa dichiarazione?")) removeStatement(s.id);
                  }}
                  aria-label="Rimuovi"
                  style={{
                    width: 22, height: 22, borderRadius: 4,
                    background: "none", border: `1px solid ${C.border}`,
                    color: C.D, cursor: "pointer", padding: 0,
                  }}
                >
                  <i className="ph ph-trash" style={{ fontSize: 11 }} />
                </button>
              </div>
            );
          })}

          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              style={{ ...btn("none", alterEgo.color), border: `1px solid ${alterEgo.color}44`, marginTop: 10, fontSize: 12 }}
            >
              <i className="ph ph-plus" style={{ marginRight: 6 }} />
              Aggiungi dichiarazione
            </button>
          ) : (
            <div style={{ marginTop: 10 }}>
              <input
                type="text" value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="...si allena ogni lunedì"
                style={{ ...fieldStyle, marginBottom: 6 }}
                maxLength={120}
              />
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                style={{ ...fieldStyle, appearance: "none", marginBottom: 8 }}
              >
                {Object.entries(STATEMENT_CATEGORIES).map(([key, def]) => (
                  <option key={key} value={key}>{def.label}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveDraft} disabled={!draft.trim()} style={{ ...btn(alterEgo.color, C.bg), flex: 1, opacity: draft.trim() ? 1 : 0.5 }}>
                  Aggiungi
                </button>
                <button onClick={() => { setAdding(false); setDraft(""); }} style={{ ...btn("none", C.txtSec), border: `1px solid ${C.border}`, flex: 1 }}>
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function iconBtn(disabled) {
  return {
    width: 18, height: 14, borderRadius: 2,
    background: "none", border: `1px solid ${C.border}`,
    color: disabled ? C.txtMute : C.txtSec,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.4 : 1, padding: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}

export default function AlterEgoScreen({ alterEgo, isConfigured, createAlterEgo, updateProfile, addStatement, updateStatement, removeStatement, reorderStatement, onClose }) {
  // First-launch onboarding gets priority — if not configured, render the
  // wizard. After completion the same screen renders the profile view.
  if (!isConfigured) {
    return (
      <OnboardingFlow
        onComplete={async (cfg) => {
          await createAlterEgo(cfg);
          onClose();
        }}
        onSkip={onClose}
      />
    );
  }
  return (
    <ProfileView
      alterEgo={alterEgo}
      updateProfile={updateProfile}
      addStatement={addStatement}
      updateStatement={updateStatement}
      removeStatement={removeStatement}
      reorderStatement={reorderStatement}
      onClose={onClose}
    />
  );
}
