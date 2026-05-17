import { useMemo, useState } from "react";
import { C, FONT, card, label } from "../../../shared/design/tokens.js";
import { deriveYearStats } from "../utils/yearStats.js";

function StatTile({ icon, value, lbl, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <i className={`ph ${icon}`} style={{ fontSize: 16, color, marginBottom: 4 }} />
      <div style={{ fontSize: 18, color: C.txt, fontFamily: FONT, fontWeight: 500, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {lbl}
      </div>
    </div>
  );
}

export default function YearReviewCard({ growth }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => deriveYearStats(growth, year), [growth, year]);

  return (
    <div style={{ ...card(`${C.gold}55`), padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%", padding: "12px 14px",
          background: `linear-gradient(135deg, ${C.gold}15 0%, transparent 60%)`,
          border: "none", cursor: "pointer", textAlign: "left", fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ ...label, color: C.gold, marginBottom: 4 }}>Anno in review</div>
            <div style={{ fontSize: 15, color: C.txt, fontWeight: 500 }}>{year}</div>
          </div>
          <i className={`ph ${expanded ? "ph-caret-up" : "ph-caret-down"}`} style={{ color: C.txtMute, fontSize: 14 }} />
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {[currentYear, currentYear - 1].map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                style={{
                  flex: 1, padding: "6px 10px",
                  background: year === y ? C.gold + "22" : "none",
                  border: `1px solid ${year === y ? C.gold + "66" : C.border}`,
                  color: year === y ? C.gold : C.txtSec,
                  borderRadius: 4, fontSize: 11, fontFamily: FONT, cursor: "pointer",
                }}
              >
                {y}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <StatTile icon="ph-book"            value={stats.booksRead}     lbl="Libri letti"     color={C.A} />
            <StatTile icon="ph-graduation-cap"  value={stats.coursesDone}   lbl="Corsi"            color={C.B} />
            <StatTile icon="ph-puzzle-piece"    value={stats.skillsImproved} lbl="Skill a target"  color={C.C} />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <StatTile icon="ph-notebook"        value={stats.logsThisYear}  lbl="Log settimanali" color={C.gold} />
            <StatTile icon="ph-bookmark-simple" value={stats.articlesSaved} lbl="Articoli salvati" color={C.D} />
          </div>

          {stats.topSkills.length > 0 && (
            <>
              <div style={{ ...label, marginBottom: 8 }}>Top skills</div>
              {stats.topSkills.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.txtSec, marginBottom: 4 }}>
                  <span style={{ flex: 1, color: C.txt }}>{s.name}</span>
                  <span style={{ fontFamily: FONT, color: C.gold }}>livello {s.current_level}/5</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
