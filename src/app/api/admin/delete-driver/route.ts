import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || ''; // Must be in .env.local

export async function DELETE(request: Request) {
    try {
        if (!serviceRoleKey || !supabaseUrl) {
            return NextResponse.json({ error: 'Server misconfiguration: missing service role key.' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        const { searchParams } = new URL(request.url);
        const driverId = searchParams.get('id');

        if (!driverId) {
            return NextResponse.json({ error: 'Missing driver ID' }, { status: 400 });
        }

        // Before deleting, ensure this user is actually a driver to prevent deleting admins/customers by mistake
        const { data: userRecord, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', driverId)
            .single();

        if (fetchError || !userRecord || userRecord.role !== 'driver') {
            return NextResponse.json({ error: 'Can only delete drivers' }, { status: 403 });
        }

        // 1. Delete from public.users manually just in case cascade is not set up
        await supabaseAdmin.from('users').delete().eq('id', driverId);
        
        // 2. Delete user from auth (this fully removes their login access)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(driverId);

        if (authError) {
             console.error('Failed to delete auth user:', authError);
             return NextResponse.json({ error: 'Failed to completely delete driver auth.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('API Error /delete-driver:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
