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

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function PATCH(request: NextRequest, context: any) {
  const params = context?.params || {};
  const routeId = typeof params.id === 'string' ? params.id : undefined;

  // Fallback: derive from URL if Next.js didn't populate params
  const urlPath = request.url || '';
  const derivedId = urlPath.includes('/api/admin/staff/')
    ? urlPath.split('/api/admin/staff/')[1]?.split(/[?#]/)[0]
    : undefined;

  const rawId = routeId || derivedId;
  const id = rawId ? decodeURIComponent(rawId) : undefined;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server misconfigured: missing service role key', stage: 'config' }, { status: 500 });
  }

  if (!id || !UUID_REGEX.test(id)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('staff PATCH missing/invalid id', { routeId, derivedId, url: request.url });
    }
    return NextResponse.json({ error: 'Invalid or missing staff id', stage: 'validate.id' }, { status: 400 });
  }

  const auth = await requireAdminApi(request, 'manage_admins');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { full_name, username, role, permissions, disabled } = body;

    // Validate body
    if (disabled === undefined && full_name === undefined && username === undefined && role === undefined && permissions === undefined) {
      return NextResponse.json({ error: 'Nothing to update', stage: 'validate.body' }, { status: 400 });
    }
    if (disabled !== undefined && typeof disabled !== 'boolean') {
      return NextResponse.json({ error: 'disabled must be boolean', stage: 'validate.body' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (username !== undefined) updates.username = username;
    if (role !== undefined) updates.role = role;
    if (permissions !== undefined) updates.permissions = permissions;
    if (disabled !== undefined) updates.disabled = disabled;

    const { error } = await supabaseAdmin.from('users').update(updates).eq('id', id);
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

    // Sync auth metadata if role/permissions/full_name/username changed
    if (role !== undefined || permissions !== undefined || full_name !== undefined || username !== undefined) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('staff PATCH error', { id, url: request.url, message: e?.message, stack: e?.stack });
    }
    return NextResponse.json({ error: e?.message || 'Internal error', stage: 'catch' }, { status: 500 });
  }
}
