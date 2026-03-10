import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required in environment variables.');
}

// A no-op lock implementation that eliminates Web Lock API conflicts entirely.
// The AbortError "Lock broken by another request with the 'steal' option"
// originates from Supabase's internal lock() calls when multiple auth requests
// compete. Replacing it with an immediate pass-through fixes this permanently.
const noopLock = <T>(
    _name: string,
    _acquireTimeout: number | null,
    fn: () => Promise<T>
): Promise<T> => fn();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        lock: noopLock,
    },
});
