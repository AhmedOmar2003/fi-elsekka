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

        const { orderId } = await request.json();
        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // 1. Fetch current order to get existing shipping_address
        const { data: order, error: fetchErr } = await supabaseAdmin
            .from('orders')
            .select('shipping_address')
            .eq('id', orderId)
            .single();

        if (fetchErr || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const shipping = order.shipping_address || {};
        
        // Security check: ensure this driver is the one assigned
        if (shipping.driver?.id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Update acceptance_status to 'accepted'
        const updatedShipping = {
            ...shipping,
            driver: {
                ...shipping.driver,
                acceptance_status: 'accepted'
            }
        };

        const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update({ shipping_address: updatedShipping })
            .eq('id', orderId);

        if (updateErr) throw updateErr;

        // Notify Admin Dashboard
        await supabaseAdmin.channel('admin-notifications').send({
            type: 'broadcast',
            event: 'driver-response',
            payload: { 
                orderId, 
                status: 'accepted', 
                driverName: user.user_metadata?.full_name || 'مندوب' 
            }
        });

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('API Error /driver/accept-order:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
