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
        const endpoint = subscription?.endpoint;

        if (!subscription || !endpoint) {
            return NextResponse.json({ error: 'Missing subscription payload' }, { status: 400 });
        }

        // Production-safe manual upsert:
        // some projects do not have a matching unique constraint for
        // `onConflict: driver_id, subscription`, which causes the exact
        // "no unique or exclusion constraint" error the driver sees.
        // We update by subscription endpoint first, then insert if needed.
        const { data: updatedRows, error: updateError } = await supabaseAdmin
            .from('driver_subscriptions')
            .update({ driver_id: user.id, subscription })
            .eq('subscription->>endpoint', endpoint)
            .select('id');

        if (updateError) {
            console.error('Failed to update driver push subscription:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        if (!updatedRows || updatedRows.length === 0) {
            const { error: insertError } = await supabaseAdmin
                .from('driver_subscriptions')
                .insert({ driver_id: user.id, subscription });

            if (insertError) {
                console.error('Failed to insert driver push subscription:', insertError);
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('API Error /driver/subscribe:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
