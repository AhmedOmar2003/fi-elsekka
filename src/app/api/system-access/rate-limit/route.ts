import { NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

const globalAny = globalThis as unknown as { __adminRateBuckets?: Map<string, Bucket> };
const buckets = globalAny.__adminRateBuckets ?? new Map<string, Bucket>();
globalAny.__adminRateBuckets = buckets;

function getKey(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return 'local';
}

export async function POST(req: Request) {
  const key = getKey(req);
  const now = Date.now();
  const existing = buckets.get(key);

  if (existing && existing.resetAt > now) {
    if (existing.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ ok: false, retryAfter: existing.resetAt - now }, { status: 429 });
    }
    existing.count += 1;
    buckets.set(key, existing);
    return NextResponse.json({ ok: true, remaining: MAX_ATTEMPTS - existing.count });
  }

  buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  return NextResponse.json({ ok: true, remaining: MAX_ATTEMPTS - 1 });
}
