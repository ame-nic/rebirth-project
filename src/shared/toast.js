/* Tiny event-bus toast helper. Any module can call toast() without
   knowing where the renderer lives. shared/components/Toast.jsx listens
   to `rebirth-toast` events and renders the queue. */

const EVENT = "rebirth-toast";

export function toast(message, kind = "info") {
  if (typeof window === "undefined") return;
  const detail = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    message,
    kind,
  };
  window.dispatchEvent(new CustomEvent(EVENT, { detail }));
}

export const TOAST_EVENT = EVENT;
