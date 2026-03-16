import { NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('[admin-guard] Missing SUPABASE config. Admin checks will fail.');
}

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export type AdminCheck =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

function extractToken(req: Request): string | null {
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }

  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/sb-[^-]+-auth-token=([^;]+)/);
  if (match) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      return parsed.access_token || null;
    } catch {
      return null;
    }
  }
  return null;
}

async function fetchUser(token: string) {
  if (!supabaseAdmin) return { user: null, isAdmin: false, mustChangePassword: false };
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { user: null, isAdmin: false, mustChangePassword: false };

  const user = data.user;
  const metaRole =
    user.user_metadata?.role ||
    (user.app_metadata as Record<string, unknown> | undefined)?.role;

  // Cross-check public.users.role for certainty
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const profileRole = profile?.role;
  const isAdmin = metaRole === 'admin' || profileRole === 'admin';
  return { user, isAdmin };
}

export async function requireAdminApi(req: Request): Promise<AdminCheck> {
  const token = extractToken(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { user, isAdmin } = await fetchUser(token);
  if (!user || !isAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

export async function verifyAdminToken(token: string) {
  return fetchUser(token);
}

export function extractAccessToken(req: Request) {
  return extractToken(req);
}
