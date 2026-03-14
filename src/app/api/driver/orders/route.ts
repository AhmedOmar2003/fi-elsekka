import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId || !serviceRoleKey) {
        return NextResponse.json({ error: 'Missing driverId or service configuration' }, { status: 400 });
    }

    // Verify Authorization header to prevent abuse
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || user.id !== driverId || user.user_metadata?.role !== 'driver') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select('*, users!user_id(full_name, phone, email)')
            .contains('shipping_address', { driver: { id: driverId } })
            .neq('status', 'delivered')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch driver orders DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: orders || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
