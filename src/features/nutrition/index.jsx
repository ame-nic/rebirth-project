import { useState, useEffect } from "react";
import { C, FONT, btn, card, label } from "../../shared/design/tokens.js";
import { storageLoad, storageSave } from "../../shared/storage/index.js";
import { RECIPES } from "./data.js";

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function buildShoppingList(plan) {
  const counts = {};
  plan.forEach((day) => {
    ["colazione", "pranzo", "cena"].forEach((meal) => {
      if (day[meal]) {
        day[meal].ingredients.forEach((ing) => {
          const key = ing.toLowerCase().replace(/[\d]+(g|ml|kg)?\s*/gi, "").trim();
          counts[key] = (counts[key] || 0) + 1;
        });
      }
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
}

export default function NutritionTab() {
  const [mealPlan, setMealPlan]   = useState(null);
  const [view, setView]           = useState("plan");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [mealLog, setMealLog]     = useState({});

  useEffect(() => {
    storageLoad("mealPlan_v5", null).then((v) => v && setMealPlan(v));
    storageLoad("mealLog_v5", {}).then(setMealLog);
  }, []);

  function generatePlan() {
    setGenerating(true);
    setTimeout(() => {
      const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
      const plan = DAYS.map((day) => ({
        day,
        colazione: shuffle(RECIPES.colazione)[0],
        pranzo:    shuffle(RECIPES.pranzo)[0],
        cena:      shuffle(RECIPES.cena)[0],
      }));
      setMealPlan(plan);
      storageSave("mealPlan_v5", plan);
      setGenerating(false);
    }, 700);
  }

  async function toggleMeal(dayIdx, meal) {
    const k = `${dayIdx}-${meal}`;
    const updated = { ...mealLog, [k]: !mealLog[k] };
    setMealLog(updated);
    await storageSave("mealLog_v5", updated);
  }

  if (selectedRecipe) {
    return (
      <div>
        <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "16px 18px", display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => setSelectedRecipe(null)} style={{ background: "none", border: "none", color: C.txtSec, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>
            <i className="ph ph-arrow-left" />
          </button>
          <div>
            <div style={{ ...label, marginBottom: 2 }}>Ricetta</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{selectedRecipe.name}</div>
          </div>
        </div>
        <div style={{ padding: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[["Proteine", selectedRecipe.protein + "g", C.B], ["Calorie", selectedRecipe.kcal, C.A], ["Prep", selectedRecipe.prep, C.C]].map(([k, v, c]) => (
              <div key={k} style={{ background: C.surf, border: `1px solid ${c}33`, borderRadius: 6, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 18, color: c, fontFamily: FONT, fontWeight: 500 }}>{v}</div>
                <div style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
              </div>
            ))}
          </div>
          <div style={card()}>
            <div style={label}>Ingredienti</div>
            {selectedRecipe.ingredients.map((ing, i) => (
              <div key={i} style={{ fontSize: 14, color: C.txtSec, padding: "7px 0", borderBottom: i < selectedRecipe.ingredients.length - 1 ? `1px solid ${C.borderLo}` : "none" }}>
                · {ing}
              </div>
            ))}
          </div>
          <div style={card()}>
            <div style={label}>Preparazione</div>
            <div style={{ fontSize: 14, color: C.txtSec, lineHeight: 1.8 }}>{selectedRecipe.steps}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "20px 18px 16px" }}>
        <div style={{ ...label, marginBottom: 6 }}>
          <span style={{ color: C.A }}>§</span>&nbsp;&nbsp;Nutrizione
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, color: C.txt, letterSpacing: "-0.02em" }}>Piano settimanale</div>
          <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT }}>~185g prot/die</div>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surf, borderBottom: `1px solid ${C.border}` }}>
        {[["plan", "Piano"], ["shopping", "Spesa"]].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{ flex: 1, padding: "13px", background: "none", border: "none", borderBottom: view === id ? `2px solid ${C.A}` : "2px solid transparent", color: view === id ? C.txt : C.txtMute, cursor: "pointer", fontSize: 13, fontFamily: FONT, transition: "color 0.2s" }}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {!mealPlan ? (
          <div style={{ ...card(), textAlign: "center", padding: "32px 20px" }}>
            <i className="ph ph-calendar-blank" style={{ fontSize: 40, color: C.txtMute, marginBottom: 12, display: "inline-block" }} />
            <div style={{ fontSize: 17, marginBottom: 6, fontWeight: 500 }}>Nessun piano questa settimana.</div>
            <div style={{ fontSize: 13, color: C.txtSec, marginBottom: 24, lineHeight: 1.7 }}>Generalo la domenica prima di fare la spesa.</div>
            <button onClick={generatePlan} disabled={generating} style={btn(C.A, C.bg)}>
              {generating ? "Caricamento…" : "Genera piano"}
            </button>
          </div>
        ) : view === "plan" ? (
          <>
            <button onClick={generatePlan} disabled={generating} style={{ ...btn(C.surf, C.txtSec), border: `1px solid ${C.border}`, marginBottom: 12, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {generating ? "Caricamento…" : (
                <>
                  <i className="ph ph-arrows-clockwise" style={{ fontSize: 14 }} />
                  Rigenera piano
                </>
              )}
            </button>
            {mealPlan.map((day, dayIdx) => (
              <div key={day.day} style={card()}>
                <div style={{ ...label, color: C.gold }}>{day.day}</div>
                {(["colazione", "pranzo", "cena"]).map((meal, mi) => {
                  const rec = day[meal];
                  const done = mealLog[`${dayIdx}-${meal}`];
                  const icons = ["ph-sun", "ph-fork-knife", "ph-moon"];
                  return (
                    <div key={meal} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: mi < 2 ? `1px solid ${C.borderLo}` : "none" }}>
                      <button
                        onClick={() => toggleMeal(dayIdx, meal)}
                        style={{ width: 26, height: 26, borderRadius: 4, border: `1px solid ${done ? C.C : C.border}`, background: done ? C.C + "22" : "none", color: done ? C.C : C.txtMute, cursor: "pointer", fontSize: 14, flexShrink: 0, transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                      >
                        {done ? "✓" : ""}
                      </button>
                      <div style={{ flex: 1, opacity: done ? 0.5 : 1, display: "flex", alignItems: "center", gap: 8 }}>
                        <i className={`ph ${icons[mi]}`} style={{ color: done ? C.txtMute : C.txtSec, fontSize: 14, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: done ? C.txtMute : C.txt, textDecoration: done ? "line-through" : "none" }}>
                            {rec.name}
                          </div>
                          <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 2 }}>
                            {rec.protein}g prot · {rec.kcal} kcal · {rec.prep}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRecipe(rec)}
                        style={{ background: C.surfHi, border: `1px solid ${C.border}`, borderRadius: 4, color: C.txtSec, padding: "5px 10px", fontSize: 10, cursor: "pointer", fontFamily: FONT, flexShrink: 0 }}
                      >
                        Ricetta
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={card()}>
              <div style={{ ...label, color: C.gold }}>Lista della spesa</div>
              {buildShoppingList(mealPlan).map((item, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${C.borderLo}`, fontSize: 14, color: C.txtSec, display: "flex", gap: 10 }}>
                  <span style={{ color: C.txtMute }}>·</span>{item}
                </div>
              ))}
            </div>
            <div style={card()}>
              <div style={label}>Sempre in dispensa</div>
              {["Uova (almeno 20)", "Yogurt greco 0% (6 vasetti)", "Fiocchi di latte", "Avena", "Riso integrale 1kg", "Pasta integrale", "Olio EVO", "Frutta secca"].map((item, i, arr) => (
                <div key={i} style={{ padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLo}` : "none", fontSize: 13, color: C.txtSec, display: "flex", gap: 10 }}>
                  <span style={{ color: C.txtMute }}>·</span>{item}
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ height: 12 }} />
      </div>
    </div>
  );
}
