import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/admin-guard';
import { getProductCatalogMetadata } from '@/lib/product-metadata';

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

function getRestaurantOrderItems(order: any, restaurantId: string) {
  const items = Array.isArray(order?.order_items) ? order.order_items : [];
  return items.filter((item: any) => {
    const metadata = getProductCatalogMetadata(item?.products?.specifications);
    return metadata.restaurantItem && metadata.restaurantId === restaurantId;
  });
}

function getRestaurantProductsRevenue(order: any, restaurantId: string) {
  const relevantItems = getRestaurantOrderItems(order, restaurantId);
  return relevantItems.reduce((sum: number, item: any) => {
    const quantity = Number(item?.quantity || 0) || 1;
    const unitPrice = Number(item?.price_at_purchase || 0) || 0;
    return sum + quantity * unitPrice;
  }, 0);
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

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, short_description, description, cuisine, image_url, manager_name, manager_email, menu_sections, is_active, is_available, created_at, updated_at')
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
      quantity,
      price_at_purchase,
      products (
        id,
        name,
        image_url,
        specifications
      )
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
      const shippingRestaurantId = String(order?.shipping_address?.restaurant_id || '').trim();
      if (shippingRestaurantId === id) return true;
      return getRestaurantOrderItems(order, id).length > 0;
    });
  } else {
    orders = targetedOrders.data || [];
  }

  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const cancelledOrders = orders.filter((order) => order.status === 'cancelled');

  const { todayStart, weekStart, monthStart } = getPeriodStarts();

  const revenueEntries = deliveredOrders.map((order) => ({
    amount: getRestaurantProductsRevenue(order, id),
    deliveredAt: getDeliveredTimestamp(order),
  }));

  const earnings = {
    today: revenueEntries.filter((entry) => entry.deliveredAt >= todayStart).reduce((sum, entry) => sum + entry.amount, 0),
    week: revenueEntries.filter((entry) => entry.deliveredAt >= weekStart).reduce((sum, entry) => sum + entry.amount, 0),
    month: revenueEntries.filter((entry) => entry.deliveredAt >= monthStart).reduce((sum, entry) => sum + entry.amount, 0),
    total: revenueEntries.reduce((sum, entry) => sum + entry.amount, 0),
  };

  const recentOrders = orders.slice(0, 12).map((order) => {
    const restaurantRevenue = getRestaurantProductsRevenue(order, id);
    return {
      id: order.id,
      status: order.status,
      created_at: order.created_at,
      delivered_at: order?.shipping_address?.driver_delivered_at || null,
      customer_name:
        order?.shipping_address?.recipient ||
        order?.shipping_address?.recipientName ||
        order?.shipping_address?.full_name ||
        'عميل',
      customer_phone:
        order?.shipping_address?.phone ||
        order?.shipping_address?.recipientPhone ||
        '',
      restaurant_total: restaurantRevenue,
      items_count: getRestaurantOrderItems(order, id).reduce((sum: number, item: any) => sum + (Number(item?.quantity || 0) || 1), 0),
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
