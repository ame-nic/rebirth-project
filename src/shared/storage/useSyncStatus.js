import { useEffect, useState } from "react";
import { getSyncStatus } from "./index.js";

/* Reactive wrapper around getSyncStatus(). Re-reads on online/offline
   events so the badge in the settings sheet stays current without
   anyone having to poll. */
export function useSyncStatus() {
  const [status, setStatus] = useState(getSyncStatus());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => setStatus(getSyncStatus());
    window.addEventListener("online",  refresh);
    window.addEventListener("offline", refresh);
    // Also refresh whenever syncFromRemote/pushToRemote update _last_sync —
    // the rest of the app dispatches `storage:synced` when that happens.
    window.addEventListener("storage:synced", refresh);
    return () => {
      window.removeEventListener("online",  refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("storage:synced", refresh);
    };
  }, []);

  return status;
}
