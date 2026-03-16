import { NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

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
  // Fallback to explicit cookie we set for middleware
  const alt = cookie.match(/sb-access-token=([^;]+)/);
  if (alt) return alt[1];
  return null;
}

function decodeJwt(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchUser(token: string) {
  const decoded = decodeJwt(token);
  const jwtRole =
    decoded?.app_metadata?.role ||
    decoded?.user_metadata?.role ||
    decoded?.role;
  const userId = decoded?.sub;

  // Preferred: validate via service role if available
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return { user: null, isAdmin: false };

    const user = data.user;
    const metaRole =
      user.user_metadata?.role ||
      (user.app_metadata as Record<string, unknown> | undefined)?.role ||
      jwtRole;

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const profileRole = profile?.role;
    const isAdmin = metaRole === 'admin' || profileRole === 'admin';
    return { user, isAdmin };
  }

  // Fallback: trust JWT claims (avoids hard failure if service key missing)
  if (jwtRole === 'admin' && userId) {
    return { user: { id: userId } as User, isAdmin: true };
  }

  return { user: null, isAdmin: false };
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
