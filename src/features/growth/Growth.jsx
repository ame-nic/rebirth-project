import { useState } from "react";
import { C, FONT, label } from "../../shared/design/tokens.js";
import BooksSection         from "./components/BooksSection.jsx";
import CoursesSection       from "./components/CoursesSection.jsx";
import SkillsSection        from "./components/SkillsSection.jsx";
import WeeklyLogSection     from "./components/WeeklyLogSection.jsx";
import SavedArticlesSection from "./components/SavedArticlesSection.jsx";
import YearReviewCard       from "./components/YearReviewCard.jsx";

const SECTIONS = [
  { id: "books",    label: "Libri",    icon: "ph-book" },
  { id: "courses",  label: "Corsi",    icon: "ph-graduation-cap" },
  { id: "skills",   label: "Skill",    icon: "ph-puzzle-piece" },
  { id: "logs",     label: "Log",      icon: "ph-notebook" },
  { id: "articles", label: "Salvati",  icon: "ph-bookmark-simple" },
];

export default function Growth({ growth }) {
  const [section, setSection] = useState("books");
  const {
    books, courses, skills, logs, articles, currentWeekStart,
    upsertBook, removeBook,
    upsertCourse, removeCourse,
    upsertSkill, removeSkill,
    saveWeeklyLog,
    updateArticle, removeArticle,
  } = growth;

  return (
    <>
      <YearReviewCard growth={growth} />

      <div style={{ marginTop: 8, marginBottom: 14 }}>
        <div style={{ ...label, marginBottom: 6 }}>Sezioni</div>
        <div
          style={{
            display: "flex", gap: 6, overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {SECTIONS.map((s) => {
            const on = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  flex: "0 0 auto",
                  padding: "6px 12px",
                  background: on ? C.A + "22" : "none",
                  border: `1px solid ${on ? C.A + "66" : C.border}`,
                  color: on ? C.A : C.txtSec,
                  borderRadius: 999, fontSize: 11, fontFamily: FONT, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                  whiteSpace: "nowrap",
                }}
              >
                <i className={`ph ${s.icon}`} style={{ fontSize: 12 }} />
                {s.label}
                {s.id === "articles" && articles.length > 0 && (
                  <span style={{
                    background: on ? C.A : C.txtMute, color: C.bg,
                    fontSize: 9, padding: "1px 5px", borderRadius: 999,
                    marginLeft: 2, fontWeight: 500,
                  }}>
                    {articles.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {section === "books"    && <BooksSection      books={books}     upsertBook={upsertBook}      removeBook={removeBook} />}
      {section === "courses"  && <CoursesSection    courses={courses} upsertCourse={upsertCourse}  removeCourse={removeCourse} />}
      {section === "skills"   && <SkillsSection     skills={skills}   upsertSkill={upsertSkill}    removeSkill={removeSkill} />}
      {section === "logs"     && <WeeklyLogSection  logs={logs}       currentWeekStart={currentWeekStart} saveWeeklyLog={saveWeeklyLog} />}
      {section === "articles" && <SavedArticlesSection articles={articles} updateArticle={updateArticle} removeArticle={removeArticle} />}
    </>
  );
}
