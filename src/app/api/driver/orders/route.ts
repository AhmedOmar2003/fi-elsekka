import { NextResponse } from 'next/server';
import { driverSupabaseAdmin, requireDriverApi } from '@/lib/driver-guard';

export async function GET(request: Request) {
    if (!driverSupabaseAdmin) {
        return NextResponse.json({ error: 'Missing service configuration' }, { status: 500 });
    }

    const auth = await requireDriverApi(request);
    if (!auth.ok) {
        return auth.response;
    }

    const driverId = auth.profile.user.id;
    
    try {
        const { data: orders, error } = await driverSupabaseAdmin
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
