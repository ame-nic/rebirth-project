import { lazy, Suspense, useState, useEffect } from "react";
import { C, FONT, appWrap } from "./shared/design/tokens.js";
import { todayStr } from "./shared/utils/date.js";
import { storageLoad, storageSave, syncFromRemote, pushToRemote } from "./shared/storage/index.js";
import { runPendingMigrations } from "./shared/storage/migrationRunner.js";
import BottomNav from "./shared/components/BottomNav.jsx";
import ErrorBoundary from "./shared/components/ErrorBoundary.jsx";
import Toast from "./shared/components/Toast.jsx";
import UpdatePrompt from "./shared/components/UpdatePrompt.jsx";
import { useFeed } from "./features/daily-feed/hooks/useFeed.js";
import { readCache } from "./features/daily-feed/services/cache.js";
import { fetchSourceItems } from "./features/daily-feed/services/fetchSource.js";
import { fetchWeather } from "./features/daily-feed/services/fetchWeather.js";
import { useHabits } from "./features/habits/hooks/useHabits.js";
import { useHealth } from "./features/health/hooks/useHealth.js";
import { useReadiness } from "./features/wellness/hooks/useReadiness.js";
import { useGrowth } from "./features/growth/hooks/useGrowth.js";
import { useAlterEgo } from "./features/alterEgo/hooks/useAlterEgo.js";
import MilestoneCelebration from "./features/alterEgo/components/MilestoneCelebration.jsx";

// Each tab module is its own chunk. Recharts (Progress, ~150 KB) and
// the recipe engine (Nutrition) are the biggest wins from splitting.
const TodayTab     = lazy(() => import("./features/training/index.jsx"));
const ActiveWorkout = lazy(() =>
  import("./features/training/index.jsx").then((m) => ({ default: m.ActiveWorkout }))
);
const NutritionTab = lazy(() => import("./features/nutrition/index.jsx"));
const ProgressTab  = lazy(() => import("./features/progress/index.jsx"));
const FeedTab      = lazy(() => import("./features/daily-feed/index.jsx"));
const HabitsTab    = lazy(() => import("./features/habits/index.jsx"));
const HealthScreen   = lazy(() => import("./features/health/HealthScreen.jsx"));
const AlterEgoScreen = lazy(() => import("./features/alterEgo/AlterEgoScreen.jsx"));
const SettingsSheet  = lazy(() => import("./shared/components/SettingsSheet.jsx"));

// Used by BottomNav for preload-on-hover. Triggering the dynamic import
// here primes the chunk so the tap transition feels instant.
function preloadTab(id) {
  switch (id) {
    case "oggi":       return import("./features/training/index.jsx");
    case "nutrizione": return import("./features/nutrition/index.jsx");
    case "feed":       return import("./features/daily-feed/index.jsx");
    case "progressi":  return import("./features/progress/index.jsx");
    case "abitudini":  return import("./features/habits/index.jsx");
    case "salute":     return import("./features/health/HealthScreen.jsx");
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
  const [healthOpen,    setHealthOpen]    = useState(false);
  const [alterEgoOpen,  setAlterEgoOpen]  = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);

  // Feed / Habits / Health / Readiness all live at root: cross-tab
  // affordances need their state regardless of which tab is active.
  const feed      = useFeed();
  const habits    = useHabits();
  const health    = useHealth();
  const readiness = useReadiness({ workoutLog, habits: habits.habits });
  const growth    = useGrowth();
  const alterEgo  = useAlterEgo();

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      // First boot after the Upstash migration: pull anything the user
      // already has on the server, and if there's nothing yet, push the
      // existing localStorage data up so the device isn't the only copy.
      try {
        const migrated = localStorage.getItem("_upstash_migration_done");
        if (!migrated) {
          const pulled = await syncFromRemote();
          if (pulled === 0) await pushToRemote();
          localStorage.setItem("_upstash_migration_done", "true");
        } else {
          // Background refresh — don't block the splash. Next reload
          // reflects whatever Upstash had at this moment.
          syncFromRemote().catch(() => {});
        }
        // Schema migrations run silently between the sync and the first
        // render so any new field/shape is already in place when the
        // feature hooks read their slices.
        await runPendingMigrations();
      } catch (err) {
        // Sync should never block boot. localStorage is still the
        // immediate cache, so the app keeps working without Upstash.
        console.warn("[App] storage bootstrap failed:", err);
      }

      const v = await storageLoad("workoutLog_v5", []);
      if (cancelled) return;
      setWorkoutLog(v);
      setLoading(false);
    }
    bootstrap();
    return () => { cancelled = true; };
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

  if (healthOpen) {
    return (
      <>
        <ErrorBoundary label="Salute">
          <Suspense fallback={<TabFallback />}>
            <HealthScreen health={health} onClose={() => setHealthOpen(false)} />
          </Suspense>
        </ErrorBoundary>
        <Toast />
        <UpdatePrompt />
      </>
    );
  }

  if (alterEgoOpen) {
    return (
      <>
        <ErrorBoundary label="Alter ego">
          <Suspense fallback={<TabFallback />}>
            <AlterEgoScreen
              alterEgo={alterEgo.alterEgo}
              isConfigured={alterEgo.isConfigured}
              createAlterEgo={alterEgo.createAlterEgo}
              updateProfile={alterEgo.updateProfile}
              addStatement={alterEgo.addStatement}
              updateStatement={alterEgo.updateStatement}
              removeStatement={alterEgo.removeStatement}
              reorderStatement={alterEgo.reorderStatement}
              onClose={() => setAlterEgoOpen(false)}
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
            <TodayTab
              workoutLog={workoutLog}
              onStartWorkout={setActiveSession}
              onLogCalcetto={handleCalcetto}
              habits={habits}
              onOpenHabits={() => setTab("abitudini")}
              health={health}
              onOpenHealth={() => setHealthOpen(true)}
              readiness={readiness}
              alterEgo={alterEgo}
              onOpenAlterEgo={() => setAlterEgoOpen(true)}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </ErrorBoundary>
        )}
        {tab === "nutrizione" && (
          <ErrorBoundary label="Nutrizione">
            <NutritionTab />
          </ErrorBoundary>
        )}
        {tab === "feed" && (
          <ErrorBoundary label="Feed">
            <FeedTab feed={feed} savedArticleIds={growth.savedArticleIds} />
          </ErrorBoundary>
        )}
        {tab === "progressi" && (
          <ErrorBoundary label="Progressi">
            <ProgressTab workoutLog={workoutLog} health={health} readiness={readiness} growth={growth} />
          </ErrorBoundary>
        )}
        {tab === "abitudini" && (
          <ErrorBoundary label="Abitudini">
            <HabitsTab habits={habits} alterEgo={alterEgo.alterEgo} />
          </ErrorBoundary>
        )}
      </Suspense>
      <BottomNav tab={tab} onChange={setTab} onHover={preloadTab} feedUnread={feed.unreadCount} />
      <Toast />
      <UpdatePrompt />
      {alterEgo.pendingCelebration && (
        <MilestoneCelebration
          celebration={alterEgo.pendingCelebration}
          alterEgo={alterEgo.alterEgo}
          habits={habits.habits}
          onDismiss={alterEgo.dismissCelebration}
        />
      )}
      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsSheet onClose={() => setSettingsOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
