/* Async-compatible localStorage wrapper.
   The async signature is intentional — preserves the shape of the prior
   window.storage host API so future swaps (IndexedDB, remote sync) don't
   require touching every call site. */

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

export async function storageSave(key, val) {
  try {
    await storage.set(key, JSON.stringify(val));
  } catch {
    /* quota exceeded, private mode, etc. — drop silently */
  }
}
