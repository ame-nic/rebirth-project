import { lazy, Suspense, useState, useEffect } from "react";
import { C, FONT, appWrap } from "./shared/design/tokens.js";
import { todayStr } from "./shared/utils/date.js";
import { storageLoad, storageSave } from "./shared/storage/index.js";
import BottomNav from "./shared/components/BottomNav.jsx";
import ErrorBoundary from "./shared/components/ErrorBoundary.jsx";
import Toast from "./shared/components/Toast.jsx";
import UpdatePrompt from "./shared/components/UpdatePrompt.jsx";
import { useFeed } from "./features/daily-feed/hooks/useFeed.js";
import { readCache } from "./features/daily-feed/services/cache.js";
import { fetchSourceItems } from "./features/daily-feed/services/fetchSource.js";
import { fetchWeather } from "./features/daily-feed/services/fetchWeather.js";

// Each tab module is its own chunk. Recharts (Progress, ~150 KB) and
// the recipe engine (Nutrition) are the biggest wins from splitting.
const TodayTab     = lazy(() => import("./features/training/index.jsx"));
const ActiveWorkout = lazy(() =>
  import("./features/training/index.jsx").then((m) => ({ default: m.ActiveWorkout }))
);
const NutritionTab = lazy(() => import("./features/nutrition/index.jsx"));
const ProgressTab  = lazy(() => import("./features/progress/index.jsx"));
const FeedTab      = lazy(() => import("./features/daily-feed/index.jsx"));

// Used by BottomNav for preload-on-hover. Triggering the dynamic import
// here primes the chunk so the tap transition feels instant.
function preloadTab(id) {
  switch (id) {
    case "oggi":       return import("./features/training/index.jsx");
    case "nutrizione": return import("./features/nutrition/index.jsx");
    case "feed":       return import("./features/daily-feed/index.jsx");
    case "progressi":  return import("./features/progress/index.jsx");
    default:           return Promise.resolve();
  }
}

function TabFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  height: "50vh", color: C.txtMute, fontSize: 13, fontFamily: FONT }}>
      Caricamento…
    </div>
  );
}

export default function App() {
  const [tab,           setTab]           = useState("oggi");
  const [workoutLog,    setWorkoutLog]    = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading,       setLoading]       = useState(true);

  // Feed lives at root so the BottomNav badge stays current regardless
  // of which tab is open.
  const feed = useFeed();

  useEffect(() => {
    storageLoad("workoutLog_v5", []).then((v) => {
      setWorkoutLog(v);
      setLoading(false);
    });
  }, []);

  // Delayed cache prefetch — warm weather + top sources after the first
  // paint settles, so the Feed tab is ready before the user navigates.
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (!feed.sources || feed.sources.length === 0) return;
      const enabled = feed.sources.filter((s) => s.enabled);
      const weather = enabled.find((s) => s.type === "weather");
      const top = enabled.filter((s) => s.type !== "weather").slice(0, 4);

      const prime = async (source, fetcher) => {
        const cached = await readCache(source);
        if (cached && !cached.stale) return;
        try {
          await fetcher(source);
        } catch {
          /* prefetch is best-effort — failures surface during the real refresh */
        }
      };

      if (weather) prime(weather, fetchWeather);
      top.forEach((s) => prime(s, fetchSourceItems));
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading, feed.sources]);

  async function handleFinish(logs) {
    const entry = {
      date:      todayStr(),
      id:        activeSession.id,
      title:     activeSession.title,
      color:     activeSession.color,
      type:      activeSession.id,
      exercises: logs,
    };
    const updated = [...workoutLog.filter((w) => w.date !== todayStr()), entry];
    setWorkoutLog(updated);
    await storageSave("workoutLog_v5", updated);
    setActiveSession(null);
  }

  async function handleCalcetto() {
    const entry = { date: todayStr(), id: "SPORT", title: "Calcetto / Corsa", color: C.sport, type: "SPORT" };
    const updated = [...workoutLog.filter((w) => w.date !== todayStr()), entry];
    setWorkoutLog(updated);
    await storageSave("workoutLog_v5", updated);
  }

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.txtMute, fontFamily: FONT, fontSize: 13 }}>
        Caricamento…
      </div>
    );
  }

  if (activeSession) {
    return (
      <>
        <ErrorBoundary label="Allenamento">
          <Suspense fallback={<TabFallback />}>
            <ActiveWorkout
              session={activeSession}
              onFinish={handleFinish}
              onCancel={() => setActiveSession(null)}
            />
          </Suspense>
        </ErrorBoundary>
        <Toast />
        <UpdatePrompt />
      </>
    );
  }

  return (
    <div style={appWrap}>
      <Suspense fallback={<TabFallback />}>
        {tab === "oggi" && (
          <ErrorBoundary label="Oggi">
            <TodayTab workoutLog={workoutLog} onStartWorkout={setActiveSession} onLogCalcetto={handleCalcetto} />
          </ErrorBoundary>
        )}
        {tab === "nutrizione" && (
          <ErrorBoundary label="Nutrizione">
            <NutritionTab />
          </ErrorBoundary>
        )}
        {tab === "feed" && (
          <ErrorBoundary label="Feed">
            <FeedTab feed={feed} />
          </ErrorBoundary>
        )}
        {tab === "progressi" && (
          <ErrorBoundary label="Progressi">
            <ProgressTab workoutLog={workoutLog} />
          </ErrorBoundary>
        )}
      </Suspense>
      <BottomNav tab={tab} onChange={setTab} onHover={preloadTab} feedUnread={feed.unreadCount} />
      <Toast />
      <UpdatePrompt />
    </div>
  );
}
