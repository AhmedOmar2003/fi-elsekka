import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
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
      .select('user_id, shipping_address, status')
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
      .update({
        status,
        shipping_address: {
          ...(order.shipping_address || {}),
          ...(status === 'shipped'
            ? {
                driver_picked_up_at: new Date().toISOString(),
                driver_delivery_state: 'on_the_way_to_customer'
              }
            : {})
        }
      })
            .eq('id', orderId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Notify Admin Dashboard immediately so they see the status change live
    if (status === 'shipped') {
      await supabaseAdmin.channel('admin-notifications').send({
        type: 'broadcast',
        event: 'order-shipped',
        payload: {
          orderId,
          driverName: user.email || 'المندوب'
        }
      })

      if (order.user_id) {
        await createUserNotificationWithPush(supabaseAdmin, order.user_id, {
          title: 'طلبك بقى في الطريق 🛵',
          message: 'المندوب استلم طلبك من المكان وخرج بالفعل علشان يوصلهولك. تابع الطلب وشوف هو وصل لفين.',
          link: '/orders'
        })
      }
    }

    if (status === 'delivered') {
            await supabaseAdmin.channel('admin-notifications').send({
                type: 'broadcast',
                event: 'order-delivered',
                payload: { 
                    orderId, 
                    driverName: user.user_metadata?.full_name || 'مندوب' 
                }
            });

            // CREATE IN-APP NOTIFICATION FOR THE CUSTOMER
            if (order.user_id) {
                await createUserNotificationWithPush(supabaseAdmin, order.user_id, {
                    title: 'تم توصيل طلبك! 📦',
                    message: `تم تسليم طلبك رقم #${orderId.substring(0,6)} بنجاح. نتمنى لك تجربة سعيدة!`,
                    link: '/orders',
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('API Error /driver/update-status:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
