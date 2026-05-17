import { useState, useEffect } from "react";
import { C, FONT, btn, card, label } from "../../shared/design/tokens.js";
import { storageLoad, storageSave } from "../../shared/storage/index.js";
import { MEAL_TARGETS } from "./engine/constants.js";
import { useRecipeEngine } from "./hooks/useRecipeEngine.js";
import DifficultyStars from "./components/DifficultyStars.jsx";
import BatchCookingCard from "./components/BatchCookingCard.jsx";
import RecipeSwapSheet from "./components/RecipeSwapSheet.jsx";

const KEY_PLAN = "mealPlan_v6";
const KEY_LOG  = "mealLog_v6";

const MEAL_ICONS = { colazione: "ph-sun", pranzo: "ph-fork-knife", cena: "ph-moon" };

function recipeIngredientString(ing) {
  return typeof ing === "string" ? ing : (ing?.name || "");
}

function buildShoppingList(days) {
  const counts = {};
  for (const day of days) {
    for (const meal of ["colazione", "pranzo", "cena"]) {
      const r = day[meal];
      if (!r?.ingredients) continue;
      for (const ing of r.ingredients) {
        const raw = recipeIngredientString(ing);
        const key = raw.toLowerCase().replace(/[\d]+(g|ml|kg)?\s*/gi, "").trim();
        if (!key) continue;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([item]) => item);
}

function prepTimeColor(mealType, isWeekend, minutes) {
  const t = MEAL_TARGETS[mealType];
  if (!t) return C.txtMute;
  const limit = isWeekend ? t.prep_max_weekend : t.prep_max_weekday;
  if (minutes <= limit * 0.5) return C.C;
  if (minutes <= limit)       return C.sport;
  return C.D;
}

function MealRow({ meal, recipe, day, dayIdx, mealLog, onToggle, onSelect, onSwap }) {
  if (!recipe) {
    return (
      <div style={{ padding: "10px 0", fontSize: 12, color: C.txtMute, fontFamily: FONT }}>
        {meal === "colazione" ? "Colazione" : meal === "pranzo" ? "Pranzo" : "Cena"} non disponibile.
      </div>
    );
  }
  const done = mealLog[`${dayIdx}-${meal}`];
  const minutes = recipe.active_prep_minutes ?? recipe.total_minutes ?? 0;
  const timeColor = prepTimeColor(meal, day.isWeekend, minutes);
  const passive = (recipe.tags || []).includes("oven") || (recipe.tags || []).includes("passive");

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0" }}>
      <button
        onClick={() => onToggle(dayIdx, meal)}
        aria-label={done ? "Segna non fatto" : "Segna fatto"}
        style={{
          width: 26, height: 26, borderRadius: 4,
          border: `1px solid ${done ? C.C : C.border}`,
          background: done ? C.C + "22" : "none",
          color: done ? C.C : C.txtMute,
          cursor: "pointer", fontSize: 14, flexShrink: 0, marginTop: 2,
          transition: "all 120ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {done ? "✓" : ""}
      </button>
      <div style={{ flex: 1, minWidth: 0, opacity: done ? 0.5 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <i className={`ph ${MEAL_ICONS[meal]}`} style={{ color: done ? C.txtMute : C.txtSec, fontSize: 14, flexShrink: 0 }} />
          <div
            onClick={() => onSelect(recipe)}
            style={{
              fontSize: 13, color: done ? C.txtMute : C.txt,
              textDecoration: done ? "line-through" : "none",
              cursor: "pointer", flex: 1, minWidth: 0,
            }}
          >
            {recipe.name_it ?? recipe.name}
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 4, letterSpacing: 0.3 }}>
          {recipe.protein_g}g prot · {recipe.kcal} kcal
          &nbsp;·&nbsp;<DifficultyStars value={recipe.difficulty ?? 1} size={9} />
          &nbsp;·&nbsp;<span style={{ color: timeColor }}>{minutes} min</span>
          {passive ? <span style={{ color: C.txtMute }}> · forno</span> : null}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onSelect(recipe)}
          aria-label="Vedi ricetta"
          style={iconBtnStyle(C.txtSec)}
        >
          <i className="ph ph-book-open" style={{ fontSize: 12 }} />
        </button>
        <button
          onClick={() => onSwap(recipe, meal, day.isWeekend)}
          aria-label="Sostituisci"
          style={iconBtnStyle(C.A)}
        >
          <i className="ph ph-arrows-clockwise" style={{ fontSize: 12 }} />
        </button>
      </div>
    </div>
  );
}

function iconBtnStyle(color) {
  return {
    width: 26, height: 24, borderRadius: 4,
    background: "none", border: `1px solid ${C.border}`,
    color, cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}

export default function NutritionTab() {
  const [plan, setPlan]                     = useState(null);   // { days, batch, stats, sources_used, generatedAt }
  const [view, setView]                     = useState("plan"); // "plan" | "shopping"
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [mealLog, setMealLog]               = useState({});
  const [swapping, setSwapping]             = useState(null);   // { recipe, mealType, isWeekend, dayIdx }

  const { generate, getVariants, loading, phase, apiStatus } = useRecipeEngine();

  useEffect(() => {
    storageLoad(KEY_PLAN, null).then((v) => v && setPlan(v));
    storageLoad(KEY_LOG, {}).then(setMealLog);
  }, []);

  async function handleGenerate() {
    const result = await generate();
    const persisted = { ...result, generatedAt: new Date().toISOString() };
    setPlan(persisted);
    await storageSave(KEY_PLAN, persisted);
  }

  async function toggleMeal(dayIdx, meal) {
    const k = `${dayIdx}-${meal}`;
    const updated = { ...mealLog, [k]: !mealLog[k] };
    setMealLog(updated);
    await storageSave(KEY_LOG, updated);
  }

  function openSwap(recipe, mealType, isWeekend) {
    // Find which day the recipe belongs to so we can replace in place.
    const dayIdx = plan?.days?.findIndex((d) => d[mealType]?.id === recipe.id) ?? -1;
    setSwapping({ recipe, mealType, isWeekend, dayIdx });
  }

  async function applySwap(newRecipe) {
    if (!swapping || swapping.dayIdx < 0) return;
    const updatedDays = plan.days.map((d, i) =>
      i === swapping.dayIdx ? { ...d, [swapping.mealType]: newRecipe } : d
    );
    const updated = { ...plan, days: updatedDays };
    setPlan(updated);
    await storageSave(KEY_PLAN, updated);
  }

  /* ── Recipe detail view ─────────────────────────────────────────────── */
  if (selectedRecipe) {
    return (
      <div>
        <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "calc(16px + env(safe-area-inset-top)) 18px 16px", display: "flex", gap: 14, alignItems: "center" }}>
          <button onClick={() => setSelectedRecipe(null)} style={{ background: "none", border: "none", color: C.txtSec, fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>
            <i className="ph ph-arrow-left" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...label, marginBottom: 2 }}>Ricetta</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{selectedRecipe.name_it ?? selectedRecipe.name}</div>
          </div>
          <DifficultyStars value={selectedRecipe.difficulty ?? 1} size={14} />
        </div>
        <div style={{ padding: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
            {[
              ["Prot.",   `${selectedRecipe.protein_g}g`, C.B],
              ["Kcal",    selectedRecipe.kcal,            C.A],
              ["Carb.",   `${selectedRecipe.carbs_g ?? 0}g`, C.gold],
              ["Min",     selectedRecipe.active_prep_minutes ?? 0, C.C],
            ].map(([k, v, c]) => (
              <div key={k} style={{ background: C.surf, border: `1px solid ${c}33`, borderRadius: 6, padding: "12px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 16, color: c, fontFamily: FONT, fontWeight: 500 }}>{v}</div>
                <div style={{ fontSize: 9, color: C.txtMute, fontFamily: FONT, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{k}</div>
              </div>
            ))}
          </div>
          <div style={card()}>
            <div style={label}>Ingredienti</div>
            {(selectedRecipe.ingredients || []).map((ing, i, arr) => (
              <div key={i} style={{ fontSize: 14, color: C.txtSec, padding: "7px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLo}` : "none" }}>
                · {recipeIngredientString(ing)}
              </div>
            ))}
          </div>
          <div style={card()}>
            <div style={label}>Preparazione</div>
            {(selectedRecipe.steps || []).map((s, i) => (
              <div key={i} style={{ fontSize: 14, color: C.txtSec, padding: "6px 0", lineHeight: 1.6, display: "flex", gap: 10 }}>
                <span style={{ color: C.A, fontFamily: FONT, flexShrink: 0 }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Header ──────────────────────────────────────────────────────────── */
  return (
    <div>
      <div style={{ background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "calc(20px + env(safe-area-inset-top)) 18px 16px" }}>
        <div style={{ ...label, marginBottom: 6 }}>
          <span style={{ color: C.A }}>§</span>&nbsp;&nbsp;Nutrizione
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: 22, color: C.txt, letterSpacing: "-0.02em" }}>Piano settimanale</div>
          <div style={{ fontSize: 11, color: C.txtMute, fontFamily: FONT }}>~185g prot/die</div>
        </div>
        {!apiStatus.spoonacular && !apiStatus.usda && plan && (
          <div style={{ fontSize: 10, color: C.txtMute, fontFamily: FONT, marginTop: 6, letterSpacing: 0.3 }}>
            Fonti: solo ricette locali. Aggiungi VITE_SPOONACULAR_API_KEY per più varietà.
          </div>
        )}
      </div>

      <div style={{ display: "flex", background: C.surf, borderBottom: `1px solid ${C.border}` }}>
        {[["plan", "Piano"], ["shopping", "Spesa"]].map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              flex: 1, padding: "13px", background: "none", border: "none",
              borderBottom: view === id ? `2px solid ${C.A}` : "2px solid transparent",
              color: view === id ? C.txt : C.txtMute, cursor: "pointer",
              fontSize: 13, fontFamily: FONT,
              transition: "color 120ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {!plan ? (
          <div style={{ ...card(), textAlign: "center", padding: "32px 20px" }}>
            <i className="ph ph-calendar-blank" style={{ fontSize: 40, color: C.txtMute, marginBottom: 12, display: "inline-block" }} />
            <div style={{ fontSize: 17, marginBottom: 6, fontWeight: 500 }}>Nessun piano questa settimana.</div>
            <div style={{ fontSize: 13, color: C.txtSec, marginBottom: 24, lineHeight: 1.7 }}>
              Genera un piano calibrato sui tuoi obiettivi: 185g proteine al giorno, ricette ≤20 min nei giorni feriali.
            </div>
            <button onClick={handleGenerate} disabled={loading} style={btn(C.A, C.bg)}>
              {loading ? (phase ?? "Caricamento…") : "Genera piano"}
            </button>
          </div>
        ) : view === "plan" ? (
          <>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{ ...btn(C.surf, C.txtSec), border: `1px solid ${C.border}`, marginBottom: 12, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? (phase ?? "Caricamento…") : (
                <>
                  <i className="ph ph-arrows-clockwise" style={{ fontSize: 14 }} />
                  Rigenera piano
                </>
              )}
            </button>

            <BatchCookingCard suggestions={plan.batch} />

            {plan.days.map((day, dayIdx) => (
              <div key={day.day} style={card()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <div style={{ ...label, color: C.gold, marginBottom: 0 }}>
                    {day.day}
                    {day.isTrainingDay && (
                      <span style={{ color: C.A, fontFamily: FONT, fontSize: 9, marginLeft: 6 }}>· allenamento</span>
                    )}
                    {day.isWeekend && (
                      <span style={{ color: C.txtMute, fontFamily: FONT, fontSize: 9, marginLeft: 6 }}>· weekend</span>
                    )}
                  </div>
                </div>
                {(["colazione", "pranzo", "cena"]).map((meal) => (
                  <MealRow
                    key={meal}
                    meal={meal}
                    recipe={day[meal]}
                    day={day}
                    dayIdx={dayIdx}
                    mealLog={mealLog}
                    onToggle={toggleMeal}
                    onSelect={setSelectedRecipe}
                    onSwap={openSwap}
                  />
                ))}
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={card()}>
              <div style={{ ...label, color: C.gold }}>Lista della spesa</div>
              {buildShoppingList(plan.days).map((item, i) => (
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

      {swapping && (
        <RecipeSwapSheet
          current={swapping.recipe}
          mealType={swapping.mealType}
          isWeekend={swapping.isWeekend}
          fetchVariants={getVariants}
          onSwap={applySwap}
          onClose={() => setSwapping(null)}
        />
      )}
    </div>
  );
}
