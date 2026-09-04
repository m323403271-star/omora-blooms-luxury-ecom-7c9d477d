/* OMORA BLOOMS — high-priority order alert push handlers.
   Imported into the generated Workbox service worker (see vite.config.ts). */

const ALERT_URL = "/admin/warehouse";

function showAlert(data, repeat) {
  const title = data.title || "🚨 NEW OMORA ORDER";
  return self.registration.showNotification(repeat ? `${title} — STILL WAITING` : title, {
    body: data.body || "A new order needs acceptance.",
    tag: data.tag || "omora-order-alert",
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [600, 200, 600, 200, 600, 200, 900],
    icon: "/omora-logo.jpg",
    badge: "/omora-logo.jpg",
    data: { url: data.url || ALERT_URL, alertId: data.alertId || null },
    actions: [
      { action: "accept", title: "Accept order" },
      { action: "open", title: "Open dashboard" },
    ],
  });
}

async function ringClients(data) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "OMORA_ORDER_ALERT", payload: data });
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    (async () => {
      await showAlert(data, false);
      await ringClients(data);
      // Keep re-alerting (vibration + sound) until the notification is dismissed
      // or the order is acknowledged from a dashboard.
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 7000));
        const open = await self.registration.getNotifications({ tag: data.tag || "omora-order-alert" });
        if (open.length === 0) break;
        await showAlert(data, true);
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  const url = (event.notification.data && event.notification.data.url) || ALERT_URL;
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if ("focus" in client) {
          client.postMessage({ type: "OMORA_ORDER_ALERT_OPEN", payload: event.notification.data });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
