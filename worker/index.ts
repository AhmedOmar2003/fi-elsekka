/// <reference lib="webworker" />

// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging

self.addEventListener('push', (event: any) => {
  const data = JSON.parse(event?.data?.text() || '{}');

  event.waitUntil(
    (self as any).registration.showNotification(data.title || "في السكة", {
      body: data.body || "لديك إشعار جديد",
      icon: data.icon || '/icon-192x192.svg',
      badge: data.badge || '/icon-192x192.svg',
      image: data.image || '/icon-512x512.svg',
      vibrate: data.vibrate || [180, 80, 220, 80, 320],
      requireInteraction: data.requireInteraction ?? true,
      renotify: data.renotify ?? true,
      silent: data.silent ?? false,
      dir: data.dir || 'rtl',
      lang: data.lang || 'ar-EG',
      tag: data.tag || 'fi-elsekka-notification',
      data: data.data || {},
      actions: data.data?.url ? [
        { action: 'open', title: 'افتح الإشعار' }
      ] : undefined
    })
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        if ('navigate' in client) {
          client.navigate(targetUrl);
        }
        return client.focus();
      }
      return (self as any).clients.openWindow(targetUrl);
    })
  );
});
