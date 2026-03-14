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
        
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { isAvailable } = await request.json();
        
        if (typeof isAvailable !== 'boolean') {
            return NextResponse.json({ error: 'Invalid availability status' }, { status: 400 });
        }

        // Update the driver's availability in the users table
        const { error: updateErr } = await supabaseAdmin
            .from('users')
            .update({ is_available: isAvailable })
            .eq('id', user.id)
            .eq('role', 'driver');

        if (updateErr) throw updateErr;

        // Broadcast the availability change to the admin dashboard instantly
        await supabaseAdmin.channel('admin-notifications').send({
            type: 'broadcast',
            event: 'driver-availability-changed',
            payload: { 
                driverId: user.id, 
                isAvailable,
                driverName: user.user_metadata?.full_name || 'مندوب'
            }
        });

        return NextResponse.json({ success: true, isAvailable });

    } catch (err: any) {
        console.error('API Error /driver/set-availability:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
