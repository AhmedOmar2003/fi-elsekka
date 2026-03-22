import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/admin-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function startOfToday() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
}

function startOfWeek() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const diff = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - diff);
    return date.toISOString();
}

function startOfYesterday() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 1);
    return date.toISOString();
}

function startOfMonth() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(1);
    return date.toISOString();
}

function startOfYear() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setMonth(0, 1);
    return date.toISOString();
}

export async function GET(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Missing service configuration' }, { status: 500 });
    }

    const auth = await requireAdminApi(request, 'view_reports');
    if (!auth.ok) return auth.response;

    const today = startOfToday();
    const yesterday = startOfYesterday();
    const week = startOfWeek();
    const month = startOfMonth();
    const year = startOfYear();
    const previousWeekDate = new Date(week);
    previousWeekDate.setDate(previousWeekDate.getDate() - 7);
    const previousWeek = previousWeekDate.toISOString();
    const previousMonthDate = new Date(month);
    previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
    const previousMonth = previousMonthDate.toISOString();

    const [totalRes, todayRes, yesterdayRes, weekRes, previousWeekRes, monthRes, previousMonthRes, yearRes] = await Promise.all([
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', yesterday).lt('created_at', today),
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', week),
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', previousWeek).lt('created_at', week),
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', month),
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', previousMonth).lt('created_at', month),
        supabaseAdmin.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', year),
    ]);

    const error =
        totalRes.error ||
        todayRes.error ||
        yesterdayRes.error ||
        weekRes.error ||
        previousWeekRes.error ||
        monthRes.error ||
        previousMonthRes.error ||
        yearRes.error;

    if (error) {
        return NextResponse.json({ error: error.message || 'Failed to load visit analytics' }, { status: 500 });
    }

    return NextResponse.json({
        totalVisits: totalRes.count || 0,
        todayVisits: todayRes.count || 0,
        yesterdayVisits: yesterdayRes.count || 0,
        weekVisits: weekRes.count || 0,
        previousWeekVisits: previousWeekRes.count || 0,
        monthVisits: monthRes.count || 0,
        previousMonthVisits: previousMonthRes.count || 0,
        yearVisits: yearRes.count || 0,
    });
}
