/* Web Push permission helper.

   Reality check on iOS: scheduled push (e.g. "remind me at 8 AM") requires
   a push server pushing on a schedule. iOS Safari doesn't expose Periodic
   Background Sync, so a pure-client schedule isn't possible.

   What works here:
   - Permission request (gates everything else)
   - In-app reminder banners (when the app is open at the relevant time)

   What's deferred for now:
   - True scheduled push via Web Push API + a Vercel cron job — would need
     server-side push subscription storage. */

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationsPermission() {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationsPermission() {
  if (!notificationsSupported()) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return "denied";
  }
}

/* Show an in-app browser notification immediately. Useful for the "test"
   button + future SW push hookups. */
export function showLocalNotification(title, body) {
  if (notificationsPermission() !== "granted") return false;
  try {
    new Notification(title, { body, icon: "/pwa-192x192.png" });
    return true;
  } catch {
    return false;
  }
}
