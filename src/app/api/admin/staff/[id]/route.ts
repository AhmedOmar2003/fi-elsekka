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

function resolveStaffId(request: NextRequest, context: any) {
  const params = context?.params || {};
  const routeId = typeof params.id === 'string' ? params.id : undefined;
  const urlPath = request.url || '';
  const derivedId = urlPath.includes('/api/admin/staff/')
    ? urlPath.split('/api/admin/staff/')[1]?.split(/[?#]/)[0]
    : undefined;
  const rawId = routeId || derivedId;
  const id = rawId ? decodeURIComponent(rawId) : undefined;

  return { id, routeId, derivedId };
}

export async function PATCH(request: NextRequest, context: any) {
  const { id, routeId, derivedId } = resolveStaffId(request, context);

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

export async function DELETE(request: NextRequest, context: any) {
  const { id, routeId, derivedId } = resolveStaffId(request, context);

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server misconfigured: missing service role key', stage: 'config' }, { status: 500 });
  }

  if (!id || !UUID_REGEX.test(id)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('staff DELETE missing/invalid id', { routeId, derivedId, url: request.url });
    }
    return NextResponse.json({ error: 'Invalid or missing staff id', stage: 'validate.id' }, { status: 400 });
  }

  const auth = await requireAdminApi(request, 'manage_admins');
  if (!auth.ok) return auth.response;

  if (auth.profile.user.id === id) {
    return NextResponse.json({ error: 'لا يمكن حذف حسابك الحالي' }, { status: 400 });
  }

  try {
    const { data: targetStaff, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, role, email, full_name')
      .eq('id', id)
      .single();

    if (targetError || !targetStaff) {
      return NextResponse.json({ error: 'الموظف غير موجود', stage: 'db.select' }, { status: 404 });
    }

    if (targetStaff.role === 'super_admin' && auth.profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'فقط المشرف العام يمكنه حذف مشرف عام آخر', stage: 'authorize.delete' }, { status: 403 });
    }

    const { data: authLookup, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(id);
    const authUserExists = !!authLookup?.user;

    if (authLookupError && !authLookupError.message?.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: authLookupError.message, stage: 'auth.getUserById' }, { status: 500 });
    }

    if (authUserExists) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

      if (authDeleteError) {
        return NextResponse.json({
          error: authDeleteError.message,
          stage: 'auth.deleteUser',
        }, { status: 500 });
      }
    }

    const { error: dbDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (dbDeleteError) {
      return NextResponse.json({ error: dbDeleteError.message, stage: 'db.delete' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: {
        id: targetStaff.id,
        email: targetStaff.email,
        full_name: targetStaff.full_name,
      },
      authUserDeleted: authUserExists,
    });
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('staff DELETE error', { id, url: request.url, message: e?.message, stack: e?.stack });
    }
    return NextResponse.json({ error: e?.message || 'Internal error', stage: 'catch' }, { status: 500 });
  }
}
