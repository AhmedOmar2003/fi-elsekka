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
};

function buildPushPayload(payload: PushNotificationPayload) {
  return JSON.stringify({
    title: payload.title,
    body: payload.message,
    icon: '/icon512_maskable.png',
    badge: '/icon512_maskable.png',
    silent: false,
    requireInteraction: payload.requireInteraction ?? true,
    data: {
      url: payload.link || '/notifications',
    },
  });
}

export async function sendPushToUserDevices(
  supabaseAdmin: any,
  userId: string,
  payload: PushNotificationPayload
) {
  if (!supabaseAdmin || !userId || !publicVapidKey || !privateVapidKey) {
    return { success: false, skipped: true, devicesNotified: 0 };
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to fetch user push subscriptions:', error);
    return { success: false, skipped: false, devicesNotified: 0 };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { success: true, skipped: true, devicesNotified: 0 };
  }

  const pushPayload = buildPushPayload(payload);

  await Promise.all(
    subscriptions.map(async (subscriptionRecord: any) => {
      try {
        await webpush.sendNotification(subscriptionRecord.subscription, pushPayload);
      } catch (pushError: any) {
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

  return { success: true, skipped: false, devicesNotified: subscriptions.length };
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
    return { success: false, error };
  }

  await sendPushToUserDevices(supabaseAdmin, userId, payload);
  return { success: true };
}
