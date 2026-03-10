import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- CHECKING DISCOUNT CODES ---');
  const { data, error } = await supabase.from('discount_codes').select('*');
  console.log('All codes (anon key):', JSON.stringify(data, null, 2));
  console.log('Error (anon key):', error);
  
  // also try to specifically query 'TEST50'
  const res2 = await supabase.from('discount_codes').select('*').eq('code', 'TEST50');
  console.log('Finding TEST50:', res2.data, res2.error);
}
check();
