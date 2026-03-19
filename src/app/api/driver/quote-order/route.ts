import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { attachOrderEconomics, CURRENT_DELIVERY_FEE } from '@/lib/order-economics';
import { createUserNotificationWithPush } from '@/lib/user-push-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

export async function POST(request: Request) {
    if (!serviceRoleKey || !supabaseUrl) {
        return NextResponse.json({ error: 'Missing service configuration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const body = await request.json();
        const { orderId, productsSubtotal } = body;

        if (!orderId || productsSubtotal === undefined || productsSubtotal === null) {
            return NextResponse.json({ error: 'Missing orderId or productsSubtotal' }, { status: 400 });
        }

        const parsedSubtotal = Number(productsSubtotal);
        if (!Number.isFinite(parsedSubtotal) || parsedSubtotal < 0) {
            return NextResponse.json({ error: 'Invalid productsSubtotal' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: driverProfile } = await supabaseAdmin
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (driverProfile?.role !== 'driver') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, shipping_address, status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const shipping = order.shipping_address || {};
        if (shipping?.driver?.id !== user.id) {
            return NextResponse.json({ error: 'You are not assigned to this order' }, { status: 403 });
        }

        if (shipping?.request_mode !== 'custom_category_text') {
            return NextResponse.json({ error: 'This order does not accept driver pricing' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const quotedFinalTotal = parsedSubtotal + CURRENT_DELIVERY_FEE;
        const updatedShipping = attachOrderEconomics(
            {
                ...shipping,
                pricing_pending: false,
                quoted_products_total: parsedSubtotal,
                quoted_delivery_fee: CURRENT_DELIVERY_FEE,
                quoted_final_total: quotedFinalTotal,
                pricing_updated_at: now,
                pricing_updated_by_driver_id: user.id,
                pricing_updated_by_driver_name: driverProfile?.full_name || user.user_metadata?.full_name || shipping?.driver?.name || 'مندوب',
            },
            quotedFinalTotal,
            Number(shipping?.merchant_discount_amount || 0)
        );

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                total_amount: quotedFinalTotal,
                shipping_address: updatedShipping,
            })
            .eq('id', orderId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        if (order.user_id) {
            await createUserNotificationWithPush(supabaseAdmin, order.user_id, {
                title: 'تم تحديد سعر طلبك النصي',
                message: `تم تسعير طلبك بمبلغ ${quotedFinalTotal.toLocaleString()} ج.م شامل التوصيل. افتح تتبع الطلب لمراجعة التفاصيل.`,
                link: '/orders',
            });
        }

        await supabaseAdmin.channel('admin-notifications').send({
            type: 'broadcast',
            event: 'driver-priced-order',
            payload: {
                orderId,
                driverName: driverProfile?.full_name || user.user_metadata?.full_name || 'مندوب',
                quotedFinalTotal,
                categoryName: shipping?.custom_request_category_name || 'طلب نصي',
            }
        });

        return NextResponse.json({
            success: true,
            totalAmount: quotedFinalTotal,
            shipping_address: updatedShipping,
        });
    } catch (err: any) {
        console.error('API Error /driver/quote-order:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
