import { useCallback, useEffect, useMemo, useState } from "react";
import { storageLoad, storageSave } from "../../../shared/storage/index.js";

const KEYS = {
  books:    "rebirth_books",
  courses:  "rebirth_courses",
  skills:   "rebirth_skills",
  logs:     "rebirth_weekly_learning",
  articles: "rebirth_saved_articles",
};

const SAVED_ARTICLE_CAP = 500;

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() { return new Date().toISOString(); }
function todayDate() { return nowIso().slice(0, 10); }

/* ISO week-start: most-recent Monday at 00:00 local. */
function mondayOfThisWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();             // 0=Sun..6=Sat
  const back = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
}

export function useGrowth() {
  const [books,    setBooks]    = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [skills,   setSkills]   = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      storageLoad(KEYS.books,    []),
      storageLoad(KEYS.courses,  []),
      storageLoad(KEYS.skills,   []),
      storageLoad(KEYS.logs,     []),
      storageLoad(KEYS.articles, []),
    ]).then(([b, c, s, l, a]) => {
      if (cancelled) return;
      setBooks(Array.isArray(b) ? b : []);
      setCourses(Array.isArray(c) ? c : []);
      setSkills(Array.isArray(s) ? s : []);
      setLogs(Array.isArray(l) ? l : []);
      setArticles(Array.isArray(a) ? a : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Books ─────────────────────────────────────────────────────────────
  const upsertBook = useCallback(async (book) => {
    const id = book.id ?? genId();
    const next = books.some((b) => b.id === id)
      ? books.map((b) => (b.id === id ? { ...b, ...book, id } : b))
      : [...books, { id, tags: [], notes: "", rating: null, started_at: null, finished_at: null, ...book }];
    setBooks(next);
    await storageSave(KEYS.books, next);
    return id;
  }, [books]);

  const removeBook = useCallback(async (id) => {
    const next = books.filter((b) => b.id !== id);
    setBooks(next);
    await storageSave(KEYS.books, next);
  }, [books]);

  // ── Courses ───────────────────────────────────────────────────────────
  const upsertCourse = useCallback(async (course) => {
    const id = course.id ?? genId();
    const next = courses.some((c) => c.id === id)
      ? courses.map((c) => (c.id === id ? { ...c, ...course, id } : c))
      : [...courses, { id, status: "planned", started_at: null, completed_at: null, notes: "", credential_url: null, ...course }];
    setCourses(next);
    await storageSave(KEYS.courses, next);
    return id;
  }, [courses]);

  const removeCourse = useCallback(async (id) => {
    const next = courses.filter((c) => c.id !== id);
    setCourses(next);
    await storageSave(KEYS.courses, next);
  }, [courses]);

  // ── Skills ────────────────────────────────────────────────────────────
  const upsertSkill = useCallback(async (skill) => {
    const id = skill.id ?? genId();
    const next = skills.some((s) => s.id === id)
      ? skills.map((s) => (s.id === id ? { ...s, ...skill, id } : s))
      : [...skills, { id, last_used: null, notes: "", evidence: "", ...skill }];
    setSkills(next);
    await storageSave(KEYS.skills, next);
    return id;
  }, [skills]);

  const removeSkill = useCallback(async (id) => {
    const next = skills.filter((s) => s.id !== id);
    setSkills(next);
    await storageSave(KEYS.skills, next);
  }, [skills]);

  // ── Weekly logs ───────────────────────────────────────────────────────
  const saveWeeklyLog = useCallback(async (entry) => {
    const week = entry.week_start ?? mondayOfThisWeek();
    const next = [
      ...logs.filter((l) => l.week_start !== week),
      { week_start: week, bullets: ["", "", ""], article_ids: [], ...entry },
    ].sort((a, b) => a.week_start.localeCompare(b.week_start));
    setLogs(next);
    await storageSave(KEYS.logs, next);
  }, [logs]);

  // ── Saved articles ────────────────────────────────────────────────────
  const saveArticle = useCallback(async (article) => {
    if (!article?.id || !article?.url) return;
    const entry = {
      id:       article.id,
      title:    article.title,
      url:      article.url,
      source:   article.source || "",
      category: article.category || "",
      saved_at: nowIso(),
      notes:    "",
      tags:     [],
    };
    const filtered = articles.filter((a) => a.id !== entry.id);
    const next = [entry, ...filtered].slice(0, SAVED_ARTICLE_CAP);
    setArticles(next);
    await storageSave(KEYS.articles, next);
  }, [articles]);

  const updateArticle = useCallback(async (id, patch) => {
    const next = articles.map((a) => (a.id === id ? { ...a, ...patch } : a));
    setArticles(next);
    await storageSave(KEYS.articles, next);
  }, [articles]);

  const removeArticle = useCallback(async (id) => {
    const next = articles.filter((a) => a.id !== id);
    setArticles(next);
    await storageSave(KEYS.articles, next);
  }, [articles]);

  /* Cross-feature integration: FeedItemCard fires an `article:save` event.
     This hook listens and persists with zero prop threading from Feed
     down to Progress's growth section. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSave = (e) => { saveArticle(e.detail); };
    window.addEventListener("article:save", onSave);
    return () => window.removeEventListener("article:save", onSave);
  }, [saveArticle]);

  const savedArticleIds = useMemo(() => new Set(articles.map((a) => a.id)), [articles]);

  return {
    loading,
    books, courses, skills, logs, articles,
    savedArticleIds,
    currentWeekStart: mondayOfThisWeek(),
    todayDate,
    upsertBook, removeBook,
    upsertCourse, removeCourse,
    upsertSkill, removeSkill,
    saveWeeklyLog,
    saveArticle, updateArticle, removeArticle,
  };
}
