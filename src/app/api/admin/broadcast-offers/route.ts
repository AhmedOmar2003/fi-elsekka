import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-guard';
import { createUserNotificationWithPush } from '@/lib/user-push-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request, 'manage_offers');
  if (!auth.ok) return auth.response;

  try {
    const { title, message, link } = await request.json();

    if (!title || !message || !link) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .is('role', null);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const recipientIds = (users || []).map((user: any) => user.id).filter(Boolean);

    await Promise.all(
      recipientIds.map((userId) =>
        createUserNotificationWithPush(supabaseAdmin, userId, {
          title,
          message,
          link,
          requireInteraction: false,
        })
      )
    );

    return NextResponse.json({ success: true, count: recipientIds.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
