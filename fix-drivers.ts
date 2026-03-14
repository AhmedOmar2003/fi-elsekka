import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function fixDrivers() {
  console.log('Fetching drivers from auth metadata...');
  
  // Get all users from auth to read user_metadata
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error('Auth fetch error', authError);
    return;
  }

  const driverUsers = users.filter(u => u.user_metadata?.role === 'driver');
  console.log(`Found ${driverUsers.length} drivers in Auth.`);

  for (const driver of driverUsers) {
    const phone = driver.user_metadata?.phone;
    if (phone) {
        console.log(`Updating driver ${driver.email} in public.users with phone ${phone}`);
        const { error } = await supabaseAdmin.from('users').update({ phone }).eq('id', driver.id);
        if (error) console.error('Failed to update public user:', error.message);
    }
  }
  console.log('Done fixing drivers!');
}

fixDrivers();
