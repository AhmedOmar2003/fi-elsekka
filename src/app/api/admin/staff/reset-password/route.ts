import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminApi } from '@/lib/admin-guard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function randomPassword() {
  return `Tmp!${Math.random().toString(36).slice(2, 8)}#${Math.floor(100 + Math.random() * 900)}`;
}

export async function POST(request: Request) {
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin.from('users').update({ must_change_password: true }).eq('id', id);

    return NextResponse.json({ success: true, tempPassword: newPass });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}
