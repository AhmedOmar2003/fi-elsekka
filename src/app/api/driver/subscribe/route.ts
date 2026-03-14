import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user || user.user_metadata?.role !== 'driver') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { subscription } = await request.json();
        if (!subscription) {
            return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
        }

        // Store subscription in Supabase
        const { error: dbError } = await supabaseAdmin
            .from('driver_subscriptions')
            .upsert(
                { driver_id: user.id, subscription },
                { onConflict: 'driver_id, subscription' }
            );

        if (dbError) {
            console.error('Failed to save push subscription:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('API Error /driver/subscribe:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
