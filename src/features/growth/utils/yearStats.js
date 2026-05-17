/* Year-in-review aggregates. Counts items completed in the given year. */

function inYear(iso, year) {
  if (!iso) return false;
  return iso.startsWith(String(year));
}

export function deriveYearStats({ books = [], courses = [], skills = [], weeklyLogs = [], savedArticles = [] }, year = new Date().getFullYear()) {
  const booksRead     = books.filter((b) => b.status === "read" && inYear(b.finished_at, year)).length;
  const booksTotal    = books.length;
  const coursesDone   = courses.filter((c) => c.status === "completed" && inYear(c.completed_at, year)).length;
  const logsThisYear  = weeklyLogs.filter((l) => inYear(l.week_start, year)).length;
  const articlesSaved = savedArticles.filter((a) => inYear(a.saved_at, year)).length;

  // Top skill growth: highest (current - baseline) over time.
  // For now baseline = the first stored level; growth = current - history[0].
  // Without history tracking we just surface skills where (current - target_was) is non-zero;
  // when no history exists we fall back to listing skills with current_level ≥ 4.
  const topSkills = [...skills]
    .filter((s) => Number.isFinite(s.current_level))
    .sort((a, b) => (b.current_level ?? 0) - (a.current_level ?? 0))
    .slice(0, 3);

  return {
    year,
    booksRead,
    booksTotal,
    coursesDone,
    skillsImproved: skills.filter((s) => s.current_level >= s.target_level).length,
    logsThisYear,
    articlesSaved,
    topSkills,
  };
}
