import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-guard';
import { getProductCatalogMetadata } from '@/lib/product-metadata';
import { getRestaurantOrderSnapshot } from '@/lib/restaurant-order';

const ACTIVE_STATUSES = ['pending', 'processing', 'shipped'];

function getPeriodStarts() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(todayStart);
  const day = weekStart.getDay();
  const diff = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diff);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    todayStart: todayStart.getTime(),
    weekStart: weekStart.getTime(),
    monthStart: monthStart.getTime(),
  };
}

function getDeliveredTimestamp(order: any) {
  const raw =
    order?.shipping_address?.driver_delivered_at ||
    order?.shipping_address?.delivered_at ||
    order?.updated_at ||
    order?.created_at;

  const parsed = new Date(raw || '').getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLineTotal(item: any) {
  const quantity = Math.max(1, Number(item?.quantity || 1));
  const unitPrice = Number(item?.price || 0);
  return unitPrice * quantity;
}

function getRestaurantSubtotal(order: any, restaurantId: string) {
  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  const matchingItems = items.filter((item: any) => {
    const metadata = getProductCatalogMetadata(item?.products?.specifications);
    return metadata.restaurantId === restaurantId;
  });

  const sourceItems = matchingItems.length > 0 ? matchingItems : items;
  return sourceItems.reduce((sum: number, item: any) => sum + getLineTotal(item), 0);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi(request, 'manage_products');
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing service configuration' }, { status: 500 });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, short_description, description, cuisine, image_url, manager_name, manager_email, is_active, is_available, created_at, updated_at')
    .eq('id', id)
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
  }

  const orderSelect = `
    id,
    status,
    total_amount,
    created_at,
    updated_at,
    shipping_address,
    order_items (
      id,
      quantity,
      price,
      product_id,
      products ( name, image_url, specifications )
    )
  `;

  let orders: any[] = [];
  const targetedOrders = await supabaseAdmin
    .from('orders')
    .select(orderSelect)
    .contains('shipping_address', { restaurant_id: id })
    .order('created_at', { ascending: false })
    .limit(500);

  if (targetedOrders.error) {
    const fallbackOrders = await supabaseAdmin
      .from('orders')
      .select(orderSelect)
      .order('created_at', { ascending: false })
      .limit(800);

    if (fallbackOrders.error) {
      return NextResponse.json({ error: fallbackOrders.error.message }, { status: 500 });
    }

    orders = (fallbackOrders.data || []).filter((order: any) => {
      const snapshot = getRestaurantOrderSnapshot(order.shipping_address);
      return snapshot.restaurantId === id;
    });
  } else {
    orders = targetedOrders.data || [];
  }

  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const cancelledOrders = orders.filter((order) => order.status === 'cancelled');

  const { todayStart, weekStart, monthStart } = getPeriodStarts();
  const deliveredWithRevenue = deliveredOrders.map((order) => ({
    order,
    restaurantRevenue: getRestaurantSubtotal(order, id),
    deliveredAt: getDeliveredTimestamp(order),
  }));

  const earnings = {
    today: deliveredWithRevenue
      .filter(({ deliveredAt }) => deliveredAt >= todayStart)
      .reduce((sum, entry) => sum + entry.restaurantRevenue, 0),
    week: deliveredWithRevenue
      .filter(({ deliveredAt }) => deliveredAt >= weekStart)
      .reduce((sum, entry) => sum + entry.restaurantRevenue, 0),
    month: deliveredWithRevenue
      .filter(({ deliveredAt }) => deliveredAt >= monthStart)
      .reduce((sum, entry) => sum + entry.restaurantRevenue, 0),
    total: deliveredWithRevenue.reduce((sum, entry) => sum + entry.restaurantRevenue, 0),
  };

  const recentOrders = orders.slice(0, 12).map((order) => {
    const snapshot = getRestaurantOrderSnapshot(order.shipping_address);
    return {
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      delivered_at: order.shipping_address?.driver_delivered_at || null,
      customer_name:
        order.shipping_address?.recipient ||
        order.shipping_address?.recipientName ||
        order.shipping_address?.full_name ||
        'عميل',
      phone:
        order.shipping_address?.phone ||
        order.shipping_address?.recipientPhone ||
        '',
      items_count: Array.isArray(order.order_items)
        ? order.order_items.reduce((sum: number, item: any) => sum + Math.max(1, Number(item?.quantity || 1)), 0)
        : snapshot.restaurantItemsCount || 0,
      subtotal: getRestaurantSubtotal(order, id),
    };
  });

  return NextResponse.json({
    restaurant,
    stats: {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      earnings,
    },
    recentOrders,
  });
}
