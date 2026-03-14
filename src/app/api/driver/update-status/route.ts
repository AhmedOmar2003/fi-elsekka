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

export async function POST(request: Request) {
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Missing service configuration' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
        }

        // Verify Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !user || user.user_metadata?.role !== 'driver') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the order actually belongs to this driver
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('shipping_address')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // The stored ID inside JSON might be typed slightly differently, so use generic check
        if (order.shipping_address?.driver?.id !== user.id) {
            return NextResponse.json({ error: 'You are not assigned to this order' }, { status: 403 });
        }
        
        // Update order status securely
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ status })
            .eq('id', orderId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('API Error /driver/update-status:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
