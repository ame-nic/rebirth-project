import { useState, useEffect } from "react";
import { C, FONT, appWrap } from "./shared/design/tokens.js";
import { todayStr } from "./shared/utils/date.js";
import { storageLoad, storageSave } from "./shared/storage/index.js";
import BottomNav from "./shared/components/BottomNav.jsx";
import ErrorBoundary from "./shared/components/ErrorBoundary.jsx";
import Toast from "./shared/components/Toast.jsx";
import UpdatePrompt from "./shared/components/UpdatePrompt.jsx";
import TodayTab, { ActiveWorkout } from "./features/training/index.jsx";
import NutritionTab from "./features/nutrition/index.jsx";
import ProgressTab from "./features/progress/index.jsx";
import FeedTab from "./features/daily-feed/index.jsx";
import { useFeed } from "./features/daily-feed/hooks/useFeed.js";

export default function App() {
  const [tab,           setTab]           = useState("oggi");
  const [workoutLog,    setWorkoutLog]    = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading,       setLoading]       = useState(true);

  // Feed lives at root so the BottomNav can show the unread badge from any tab.
  const feed = useFeed();

  useEffect(() => {
    storageLoad("workoutLog_v5", []).then((v) => {
      setWorkoutLog(v);
      setLoading(false);
    });
  }, []);

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
          <ActiveWorkout
            session={activeSession}
            onFinish={handleFinish}
            onCancel={() => setActiveSession(null)}
          />
        </ErrorBoundary>
        <Toast />
        <UpdatePrompt />
      </>
    );
  }

  return (
    <div style={appWrap}>
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
      <BottomNav tab={tab} onChange={setTab} feedUnread={feed.unreadCount} />
      <Toast />
      <UpdatePrompt />
    </div>
  );
}
