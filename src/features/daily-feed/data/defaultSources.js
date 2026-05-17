/* Seed source registry, written into localStorage on first launch.
   Users add/remove/toggle/reorder through the Fonti screen — these are
   only the defaults. Categories shown as filter pills in the feed. */

export const SOURCE_TYPES = {
  RSS:     "rss",
  REDDIT:  "reddit",
  WEATHER: "weather",
  MANUAL:  "manual",
};

export const CATEGORY_LABELS = {
  italia:  "Italia",
  tech:    "Tech",
  java:    "Java",
  ai:      "AI",
  calcio:  "Calcio",
  cultura: "Cultura",
};

export const DEFAULT_SOURCES = [
  // ── METEO ────────────────────────────────────────────────────────────────
  { id: "weather_milan", type: "weather", label: "Meteo Milano",
    category: "meteo", enabled: true, order: 0,
    config: { lat: 45.4845, lon: 9.1897 } },

  // ── ITALIA ───────────────────────────────────────────────────────────────
  { id: "rss_ilpost", type: "rss", label: "Il Post",
    category: "italia", enabled: true, order: 1,
    config: { url: "https://www.ilpost.it/feed/" } },
  { id: "rss_corriere", type: "rss", label: "Corriere della Sera",
    category: "italia", enabled: true, order: 2,
    config: { url: "https://xml2.corrieredellasera.it/rss/homepage.xml" } },
  { id: "rss_repubblica", type: "rss", label: "Repubblica",
    category: "italia", enabled: false, order: 3,
    config: { url: "https://www.repubblica.it/rss/homepage/rss2.0.xml" } },
  { id: "rss_ansa_tech", type: "rss", label: "ANSA Tecnologia",
    category: "italia", enabled: true, order: 4,
    config: { url: "https://www.ansa.it/sito/notizie/tecnologia/tecnologia_rss.xml" } },
  { id: "reddit_italy", type: "reddit", label: "r/italy",
    category: "italia", enabled: false, order: 5,
    config: { subreddit: "italy", sort: "hot", limit: 5 } },

  // ── TECH ─────────────────────────────────────────────────────────────────
  { id: "rss_wired_it", type: "rss", label: "Wired Italia",
    category: "tech", enabled: true, order: 6,
    config: { url: "https://www.wired.it/feed/rss" } },
  { id: "rss_punto_informatico", type: "rss", label: "Punto Informatico",
    category: "tech", enabled: true, order: 7,
    config: { url: "https://www.punto-informatico.it/feed/" } },
  { id: "rss_techcrunch", type: "rss", label: "TechCrunch",
    category: "tech", enabled: true, order: 8,
    config: { url: "https://techcrunch.com/feed/" } },
  { id: "rss_hn", type: "rss", label: "Hacker News Top",
    category: "tech", enabled: true, order: 9,
    config: { url: "https://hnrss.org/frontpage?points=100" } },
  { id: "rss_mit_tech", type: "rss", label: "MIT Technology Review",
    category: "tech", enabled: false, order: 10,
    config: { url: "https://www.technologyreview.com/feed/" } },
  { id: "rss_verge", type: "rss", label: "The Verge",
    category: "tech", enabled: false, order: 11,
    config: { url: "https://www.theverge.com/rss/index.xml" } },

  // ── JAVA & ENTERPRISE ────────────────────────────────────────────────────
  { id: "rss_main_thread", type: "rss", label: "The Main Thread",
    category: "java", enabled: true, order: 12,
    config: { url: "https://myfear.substack.com/feed" } },
  { id: "rss_infoq", type: "rss", label: "InfoQ",
    category: "java", enabled: true, order: 13,
    config: { url: "https://www.infoq.com/feed/" } },
  { id: "rss_quarkus_blog", type: "rss", label: "Quarkus Blog",
    category: "java", enabled: true, order: 14,
    config: { url: "https://quarkus.io/blog/feed.xml" } },
  { id: "rss_baeldung", type: "rss", label: "Baeldung",
    category: "java", enabled: false, order: 15,
    config: { url: "https://www.baeldung.com/feed/" } },

  // ── AI ───────────────────────────────────────────────────────────────────
  { id: "reddit_machinelearning", type: "reddit", label: "r/MachineLearning",
    category: "ai", enabled: true, order: 16,
    config: { subreddit: "MachineLearning", sort: "hot", limit: 5 } },
  { id: "reddit_localllama", type: "reddit", label: "r/LocalLLaMA",
    category: "ai", enabled: true, order: 17,
    config: { subreddit: "LocalLLaMA", sort: "hot", limit: 5 } },
  { id: "rss_anthropic", type: "rss", label: "Anthropic News",
    category: "ai", enabled: true, order: 18,
    config: { url: "https://www.anthropic.com/rss.xml" } },

  // ── CALCIO ───────────────────────────────────────────────────────────────
  { id: "rss_gazzetta_calcio", type: "rss", label: "Gazzetta — Calcio",
    category: "calcio", enabled: true, order: 19,
    config: { url: "https://www.gazzetta.it/rss/calcio.xml" } },
  { id: "rss_tuttosport", type: "rss", label: "Tuttosport",
    category: "calcio", enabled: false, order: 20,
    config: { url: "https://www.tuttosport.com/rss/calcio.xml" } },

  // ── CULTURA ──────────────────────────────────────────────────────────────
  { id: "rss_wikipedia_featured", type: "rss", label: "Wikipedia — In primo piano",
    category: "cultura", enabled: true, order: 21,
    config: { url: "https://it.wikipedia.org/w/api.php?action=featuredfeed&feed=featured&feedformat=rss" } },
  { id: "rss_guardian_culture", type: "rss", label: "The Guardian — Tech",
    category: "cultura", enabled: true, order: 22,
    config: { url: "https://www.theguardian.com/technology/rss" } },
];
