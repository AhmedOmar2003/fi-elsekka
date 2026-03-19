import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-guard';
import { sendPushToDriverDevices } from '@/lib/driver-push-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(request: Request) {
    // Assigning a driver or notifying them requires assign_driver permission
    const auth = await requireAdminApi(request, 'assign_driver');
    if (!auth.ok) return auth.response;

    try {
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

        const pushResult = await sendPushToDriverDevices(supabaseAdmin, driverId, {
            title,
            message: body,
            link: `/driver${orderId ? `?order=${orderId}` : ''}`,
            requireInteraction: true,
        });

        if (pushResult.success && pushResult.skipped) {
            return NextResponse.json({ message: 'Broadcast sent, but no push devices registered' });
        }

        return NextResponse.json({ success: true, devicesNotified: pushResult.devicesNotified });

    } catch (err: any) {
        console.error('API Error /admin/notify-driver:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
