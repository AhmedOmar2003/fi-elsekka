import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This route requires the service role key to bypass RLS and create users
// without modifying the current user's session (so Admin stays logged in).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || ''; // Must be added to .env.local

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
    try {
        if (!serviceRoleKey) {
            return NextResponse.json({ error: 'Server misconfiguration: missing service role key.' }, { status: 500 });
        }

        const body = await request.json();
        const { email, password, full_name, phone, national_id } = body;

        if (!email || !password || !full_name || !phone) {
            return NextResponse.json({ error: 'Missing required driver fields.' }, { status: 400 });
        }

        // 1. Create user in Supabase Auth with 'driver' metadata
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 'driver',
                full_name,
                phone,
                national_id
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const newUser = authData.user;

        // 2. Ensure they exist in our public.users table with the correct role
        // Supabase triggers handle the initial insert, but we want to ensure custom fields
        // are explicitly set for the driver.
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({
                role: 'driver',
                full_name,
                // store phone in profile picture field temporarily or if schema allows it later
            })
            .eq('id', newUser.id);

        if (dbError) {
             console.error("Failed to update driver role in public.users:", dbError);
             // We won't block the response, auth user was still created
        }

        return NextResponse.json({ success: true, user: newUser });

    } catch (err: any) {
        console.error('API Error /create-driver:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
