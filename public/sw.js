/* Hidayah service worker.
 *
 * Its only job is the prayer alarm. It shows the notification when a push
 * arrives, and tells any open tab so that tab can play the adhan, since a
 * service worker cannot play audio itself.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Prayer time";
  const body = payload.body || "It is time for prayer.";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // A tab that is open can play the adhan. The notification is shown
      // either way, so the alarm still lands if nothing is open.
      //
      // A test push is checking that delivery works, not announcing a prayer,
      // so it shows the notification without calling anyone to prayer.
      if (payload.test) {
        // Tells any open tab that the push itself arrived. Whether the
        // notification below is then displayed is up to the system, and this
        // is the only way to tell those two failures apart.
        for (const client of clients) {
          client.postMessage({ type: "hidayah-test" });
        }
      } else {
        for (const client of clients) {
          client.postMessage({ type: "hidayah-prayer", prayer: payload.prayer });
        }
      }

      await self.registration.showNotification(title, {
        body,
        tag: `hidayah-${payload.prayer || "prayer"}`,
        renotify: true,
        requireInteraction: false,
        icon: "/icons/192",
        badge: "/icons/192",
        vibrate: [200, 100, 200, 100, 200],
        data: { url: "/", prayer: payload.prayer },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }

      if (self.clients.openWindow) return self.clients.openWindow(target);
    })(),
  );
});
