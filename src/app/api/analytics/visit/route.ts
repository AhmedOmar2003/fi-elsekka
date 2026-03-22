import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const EXCLUDED_PREFIXES = ['/admin', '/driver', '/system-access', '/api', '/_next'];

export async function POST(request: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Missing service configuration' }, { status: 500 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const path = typeof body?.path === 'string' ? body.path.trim() : '';
        const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';

        if (!path.startsWith('/') || !visitorId) {
            return NextResponse.json({ error: 'Invalid visit payload' }, { status: 400 });
        }

        if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
            return NextResponse.json({ ok: true, skipped: true });
        }

        const { error } = await supabaseAdmin.from('site_visits').insert({
            visitor_id: visitorId.slice(0, 120),
            path: path.slice(0, 240),
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
    }
}
