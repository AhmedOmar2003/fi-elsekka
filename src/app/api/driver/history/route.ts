import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function GET(request: Request) {
    try {
        // 1. Verify driver auth via bearer token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        let decoded: any;
        try { decoded = jwtDecode(token); } catch { 
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const driverId = decoded.sub as string;
        if (!driverId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Fetch ALL orders (bypass RLS with service role), filter by driver in shipping_address
        const { data: allOrders, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('id, total_amount, created_at, status, shipping_address')
            .eq('status', 'delivered')
            .order('created_at', { ascending: false });

        if (ordersError) {
            return NextResponse.json({ error: ordersError.message }, { status: 500 });
        }

        // Filter delivered orders assigned to this driver
        const deliveredOrders = (allOrders || []).filter(
            (o: any) => o.shipping_address?.driver?.id === driverId
        );

        if (deliveredOrders.length === 0) {
            return NextResponse.json({ orders: [], totalCount: 0, avgRating: null });
        }

        // 3. Fetch reviews for these orders
        const orderIds = deliveredOrders.map((o: any) => o.id);
        const { data: reviews } = await supabaseAdmin
            .from('driver_reviews')
            .select('order_id, rating, comment')
            .in('order_id', orderIds);

        const reviewMap: Record<string, { rating: number; comment: string | null }> = {};
        for (const rev of (reviews || [])) {
            reviewMap[rev.order_id] = { rating: rev.rating, comment: rev.comment };
        }

        const enriched = deliveredOrders.map((o: any) => ({
            ...o,
            review: reviewMap[o.id] || null
        }));

        // 4. Calculate average rating
        const ratedOrders = enriched.filter(o => o.review);
        const avgRating = ratedOrders.length > 0
            ? parseFloat((ratedOrders.reduce((s, o) => s + o.review!.rating, 0) / ratedOrders.length).toFixed(1))
            : null;

        return NextResponse.json({
            orders: enriched,
            totalCount: enriched.length,
            avgRating
        });

    } catch (err: any) {
        console.error('API Error /driver/history:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
