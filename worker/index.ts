/// <reference lib="webworker" />

// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging

self.addEventListener('push', (event: any) => {
  const data = JSON.parse(event?.data?.text() || '{}');

  event.waitUntil(
    (self as any).registration.showNotification(data.title || "في السكة", {
      body: data.body || "لديك إشعار جديد",
      icon: data.icon || '/icon512_maskable.png',
      badge: '/icon512_maskable.png',
      vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500],
      requireInteraction: true,
      silent: false,
      data: data.data || {}
    })
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return (self as any).clients.openWindow(event.notification.data.url || '/driver');
    })
  );
});
