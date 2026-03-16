import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-guard';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// VAPID keys should be generated once and stored in .env
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const email = 'mailto:admin@fielsekka.com'; // Admin contact

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(email, publicVapidKey, privateVapidKey);
}

export async function POST(request: Request) {
    // Assigning a driver or notifying them requires assign_driver permission
    const auth = await requireAdminApi(request, 'assign_driver');
    if (!auth.ok) return auth.response;

    try {
        if (!publicVapidKey || !privateVapidKey) {
            return NextResponse.json({ error: 'Server missing VAPID keys for push notifications' }, { status: 500 });
        }

        const { driverId, title, body, orderId } = await request.json();

        if (!driverId || !title || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // ALWAYS send a realtime broadcast to the driver's active dashboard
        // This makes the UI update instantly if the window is open.
        await supabaseAdmin.channel(`driver-orders-${driverId}`).send({
            type: 'broadcast',
            event: 'new-assignment',
            payload: { timestamp: Date.now() }
        });

        // Fetch driver's push subscriptions
        const { data: subs, error: subsError } = await supabaseAdmin
            .from('driver_subscriptions')
            .select('subscription')
            .eq('driver_id', driverId);

        if (subsError) {
            console.error('Failed to fetch subscriptions:', subsError);
            return NextResponse.json({ error: subsError.message }, { status: 500 });
        }

        if (!subs || subs.length === 0) {
            // Even if no push subs, we return success because the broadcast was sent
            return NextResponse.json({ message: 'Broadcast sent, but no push devices registered' });
        }

        const payload = JSON.stringify({
            title,
            body,
            icon: '/icon512_maskable.png', // Optional: standard PWA icon
            silent: false,
            requireInteraction: true,
            data: {
                url: `/driver${orderId ? `?order=${orderId}` : ''}`
            }
        });

        // Send push to all registered devices this driver owns
        const sendPromises = subs.map(subRecord => 
            webpush.sendNotification(subRecord.subscription, payload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // The subscription is expired/invalid, remove it
                        console.log('Subscription expired, deleting from DB');
                        supabaseAdmin.from('driver_subscriptions')
                            .delete()
                            .eq('subscription->>endpoint', subRecord.subscription.endpoint)
                            .then();
                    } else {
                        console.error('Push error:', err);
                    }
                })
        );

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, devicesNotified: subs.length });

    } catch (err: any) {
        console.error('API Error /admin/notify-driver:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
