import { C, FONT } from "../../../shared/design/tokens.js";
import { CATEGORY_LABELS } from "../data/defaultSources.js";

function labelFor(cat) {
  return CATEGORY_LABELS[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

function chipStyle(active) {
  return {
    background: active ? C.A + "22" : "none",
    border: `1px solid ${active ? C.A + "55" : C.border}`,
    color: active ? C.A : C.txtSec,
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 11,
    fontFamily: FONT,
    cursor: "pointer",
    letterSpacing: 0.3,
    whiteSpace: "nowrap",
    transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
  };
}

export default function CategoryFilter({ categories, value, onChange }) {
  return (
    <div
      style={{
        display: "flex", gap: 6, overflowX: "auto",
        padding: "0 0 6px",
        scrollbarWidth: "none",
      }}
    >
      <button onClick={() => onChange(null)} style={chipStyle(value == null)}>
        Tutti
      </button>
      {categories.map((cat) => (
        <button key={cat} onClick={() => onChange(cat)} style={chipStyle(value === cat)}>
          {labelFor(cat)}
        </button>
      ))}
    </div>
  );
}
