import webpush from 'web-push';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const contactEmail = 'mailto:admin@fielsekka.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(contactEmail, publicVapidKey, privateVapidKey);
}

type PushNotificationPayload = {
  title: string;
  message: string;
  link?: string;
  requireInteraction?: boolean;
  topic?: string;
};

function buildPushPayload(payload: PushNotificationPayload) {
  const title = payload.title.startsWith('في السكة')
    ? payload.title
    : `في السكة | ${payload.title}`;
  const notificationLink = payload.link || '/notifications';

  return JSON.stringify({
    title,
    body: payload.message,
    icon: '/notification-icon-512.png',
    image: '/notification-icon-512.png',
    silent: false,
    requireInteraction: payload.requireInteraction ?? true,
    renotify: true,
    dir: 'rtl',
    lang: 'ar-EG',
    vibrate: [180, 80, 220, 80, 320],
    tag: `${notificationLink}::${payload.title}`,
    timestamp: Date.now(),
    data: {
      url: notificationLink,
      allowWhileVisible: false,
    },
  });
}

export async function sendPushToUserDevices(
  supabaseAdmin: any,
  userId: string,
  payload: PushNotificationPayload
) {
  if (!supabaseAdmin || !userId || !publicVapidKey || !privateVapidKey) {
    return { success: false, skipped: true, devicesNotified: 0, failedDevices: 0 };
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch user push subscriptions:', error);
    return { success: false, skipped: false, devicesNotified: 0, failedDevices: 0 };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { success: true, skipped: true, devicesNotified: 0, failedDevices: 0 };
  }

  const uniqueSubscriptions = subscriptions.filter((record: any, index: number, all: any[]) => {
    const endpoint = record.endpoint || record.subscription?.endpoint;
    return !!endpoint && all.findIndex((item: any) => (item.endpoint || item.subscription?.endpoint) === endpoint) === index;
  });

  const pushPayload = buildPushPayload(payload);
  let devicesNotified = 0;
  let failedDevices = 0;

  await Promise.all(
    uniqueSubscriptions.map(async (subscriptionRecord: any) => {
      try {
        await webpush.sendNotification(subscriptionRecord.subscription, pushPayload, {
          TTL: 60,
          urgency: 'high',
          topic: payload.topic || 'customer-notification',
        });
        devicesNotified += 1;
      } catch (pushError: any) {
        failedDevices += 1;
        if (pushError?.statusCode === 404 || pushError?.statusCode === 410) {
          await supabaseAdmin
            .from('user_subscriptions')
            .delete()
            .eq('endpoint', subscriptionRecord.endpoint);
        } else {
          console.error('Failed to send user push notification:', pushError);
        }
      }
    })
  );

  return {
    success: devicesNotified > 0,
    skipped: devicesNotified === 0 && failedDevices === 0,
    devicesNotified,
    failedDevices,
  };
}

export async function createUserNotificationWithPush(
  supabaseAdmin: any,
  userId: string,
  payload: PushNotificationPayload
) {
  const { error } = await supabaseAdmin.from('notifications').insert([
    {
      user_id: userId,
      title: payload.title,
      message: payload.message,
      link: payload.link || '/notifications',
      is_read: false,
    },
  ]);

  if (error) {
    console.error('Failed to create in-app notification:', error);
    return { success: false, error, notificationCreated: false, push: null };
  }

  const pushResult = await sendPushToUserDevices(supabaseAdmin, userId, payload);

  return {
    success: true,
    notificationCreated: true,
    push: pushResult,
  };
}
