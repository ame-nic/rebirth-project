/* Async-compatible localStorage wrapper.
   The async signature is intentional — preserves the shape of the prior
   window.storage host API so future swaps (IndexedDB, remote sync) don't
   require touching every call site. */

import { toast } from "../toast.js";

export const storage = {
  get: async (key) => {
    const v = localStorage.getItem(key);
    return v == null ? null : { value: v };
  },
  set: async (key, val) => {
    localStorage.setItem(key, val);
  },
  delete: async (key) => {
    localStorage.removeItem(key);
  },
};

export async function storageLoad(key, fallback) {
  try {
    const r = await storage.get(key);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}

// Avoid spamming the same key on every retry (e.g. set-state-on-tick loops).
const reportedFailures = new Set();

export async function storageSave(key, val) {
  try {
    await storage.set(key, JSON.stringify(val));
    if (reportedFailures.has(key)) reportedFailures.delete(key); // recovered
    return true;
  } catch (err) {
    if (!reportedFailures.has(key)) {
      reportedFailures.add(key);
      const isQuota = err?.name === "QuotaExceededError" || /quota/i.test(err?.message || "");
      toast(
        isQuota
          ? "Spazio esaurito. Esporta i dati e svuota la cache del browser."
          : "Salvataggio non riuscito. Modalità privata?",
        "error",
      );
    }
    return false;
  }
}
