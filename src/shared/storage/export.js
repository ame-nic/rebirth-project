/* JSON backup of every persisted slice. Single-device localStorage is the
   weakest link in the data story — one Safari "clear site data" wipes
   months of training history. This helper produces a portable snapshot
   the user can stash in iCloud Drive or email to themselves. */

import { storageLoad } from "./index.js";
import { toast } from "../toast.js";

const BACKUP_KEYS = [
  "workoutLog_v5",
  "weightLog_v5",
  "mealPlan_v5",
  "mealLog_v5",
  "rebirth_feed_sources",
  "rebirth_feed_read",
];

export async function buildBackup() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    data[key] = await storageLoad(key, null);
  }
  return {
    app: "rebirth-project",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function exportBackup() {
  let backup;
  try {
    backup = await buildBackup();
  } catch (err) {
    toast(`Errore esportazione: ${err.message}`, "error");
    return;
  }

  const json     = JSON.stringify(backup, null, 2);
  const filename = `rebirth-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob     = new Blob([json], { type: "application/json" });

  // Web Share API with a real File — iOS Safari opens the system share
  // sheet (Save to Files, AirDrop, Mail, etc.). Best UX on the target
  // platform when supported.
  try {
    if (typeof File !== "undefined" && navigator.canShare) {
      const file = new File([blob], filename, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Backup Rebirth", files: [file] });
        toast("Backup condiviso.", "success");
        return;
      }
    }
  } catch (err) {
    if (err?.name === "AbortError") return; // user cancelled the share sheet
    // Fall through to download fallback on any other share-API hiccup.
  }

  // Fallback: classic download link. Works in every browser.
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Backup scaricato.", "success");
  } catch (err) {
    toast(`Errore download: ${err.message}`, "error");
  }
}
