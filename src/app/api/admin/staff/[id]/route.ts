import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/admin-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export async function PATCH(request: NextRequest, context: any) {
  const params = context?.params || {};
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured: missing service role key', stage: 'config' }, { status: 500 });
  const auth = await requireAdminApi(request, 'manage_admins');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { full_name, username, role, permissions, disabled } = body;

    const updates: Record<string, any> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (username !== undefined) updates.username = username;
    if (role !== undefined) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (disabled !== undefined) updates.disabled = disabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('users').update(updates).eq('id', params.id);
    if (error) {
      const msg = error.message || '';
      if (msg.includes('permissions') || msg.includes('disabled') || msg.includes('must_change_password') || msg.includes('username')) {
        return NextResponse.json({
          error: 'Database missing required staff columns. Run supabase-admin-rls.sql migration.',
          stage: 'db.update',
        }, { status: 500 });
      }
      return NextResponse.json({ error: msg, stage: 'db.update' }, { status: 500 });
    }

    // Sync auth metadata if role/permissions changed
    if (role !== undefined || permissions !== undefined || full_name !== undefined || username !== undefined) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
        user_metadata: {
          ...(role !== undefined ? { role } : {}),
          ...(permissions !== undefined ? { permissions } : {}),
          ...(full_name !== undefined ? { full_name } : {}),
          ...(username !== undefined ? { username } : {}),
        },
      });
      if (authErr) {
        return NextResponse.json({ error: authErr.message, stage: 'auth.updateUserById' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error', stage: 'catch' }, { status: 500 });
  }
}
