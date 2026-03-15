const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');

const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function test() {
  console.log('--- Checking Offers ---');
  const { data: offers, error: err1 } = await supabase.from('products').select('*').eq('show_in_offers', true);
  console.log('Offers Error:', err1 ? err1.message : null);
  console.log('Offers count:', offers?.length || 0);
  if (offers?.length > 0) {
     console.log('First offer fields:', Object.keys(offers[0]).join(', '));
  }

  console.log('--- Checking Best Sellers ---');
  const { data: best, error: err2 } = await supabase.from('products').select('*').eq('is_best_seller', true);
  console.log('Best Sellers Error:', err2 ? err2.message : null);
  console.log('Best Sellers count:', best?.length || 0);

  console.log('--- Checking Orders for Sales ranking ---');
  const { data: orderItems, error: err3 } = await supabase.from('order_items').select('product_id, quantity');
  console.log('Order Items Error:', err3 ? err3.message : null);
  
  if (orderItems) {
    const sales = {};
    orderItems.forEach(item => {
      sales[item.product_id] = (sales[item.product_id] || 0) + item.quantity;
    });
    console.log('Sales Aggregation (top 3):');
    const sorted = Object.entries(sales).sort((a,b)=>b[1]-a[1]).slice(0,3);
    console.log(sorted);
  }
}

test();
