import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/admin-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function randomPassword() {
  return `Tmp!${Math.random().toString(36).slice(2, 8)}#${Math.floor(100 + Math.random() * 900)}`;
}

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured: missing service role key' }, { status: 500 });
  const auth = await requireAdminApi(request, 'manage_admins');
  if (!auth.ok) return auth.response;

  try {
    const { id, tempPassword } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const newPass = tempPassword || randomPassword();

    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPass,
      user_metadata: { must_change_password: true },
    });
    if (error) return NextResponse.json({ error: error.message, stage: 'auth.updateUserById' }, { status: 500 });

    const { error: upErr } = await supabaseAdmin.from('users').update({ must_change_password: true }).eq('id', id);
    if (upErr) return NextResponse.json({ error: upErr.message, stage: 'db.update' }, { status: 500 });

    return NextResponse.json({ success: true, tempPassword: newPass });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error', stage: 'catch' }, { status: 500 });
  }
}
