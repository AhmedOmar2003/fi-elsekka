import { supabase } from '@/lib/supabase';

// ─── Helper: log Supabase errors properly (they are objects, not strings) ──────
function logError(ctx: string, error: unknown) {
    if (!error) return;
    const e = error as Record<string, unknown>;
    // Ignore AbortErrors — transient lock conflicts handled at client level
    const msg = (e.message as string) || '';
    if (msg.includes('AbortError') || msg.includes('Lock broken')) return;
    console.error(`[adminService] ${ctx}:`, e.message || e.code || JSON.stringify(e));
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function fetchAdminStats() {
    const [usersRes, productsRes, ordersRes, revenueRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('status', 'delivered'),
    ]);

    const totalRevenue = revenueRes.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    return {
        totalUsers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
    };
}

export async function fetchRecentOrders(limit = 5) {
    const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, user_id, users(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) logError('fetchRecentOrders', error);
    return data || [];
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function fetchAdminProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), product_specifications(id, label, description)')
        .order('created_at', { ascending: false });
    if (error) logError('fetchAdminProducts', error);
    return data || [];
}

// Columns that may not exist in older schemas — strip all at once on column error
const OPTIONAL_COLUMNS = ['discount_percentage', 'stock_quantity', 'image_url', 'is_best_seller', 'show_in_offers'];

function stripOptionalColumns(payload: Record<string, unknown>): Record<string, unknown> {
    const safe = { ...payload };
    for (const col of OPTIONAL_COLUMNS) delete safe[col];
    return safe;
}

function isColumnError(msg: string) {
    return msg.includes("Could not find the '") || msg.includes('column') || msg.includes('schema cache');
}

export async function createProduct(payload: Record<string, unknown>) {
    let res = await supabase.from('products').insert([payload]).select().single();
    if (res.error && isColumnError(res.error.message || '')) {
        // Retry with ONLY core columns guaranteed to exist
        const safe = stripOptionalColumns(payload);
        res = await supabase.from('products').insert([safe]).select().single();
    }
    if (res.error) logError('createProduct', res.error);
    return res;
}

export async function updateProduct(id: string, payload: Record<string, unknown>) {
    let res = await supabase.from('products').update(payload).eq('id', id);
    if (res.error && isColumnError(res.error.message || '')) {
        const safe = stripOptionalColumns(payload);
        res = await supabase.from('products').update(safe).eq('id', id).select().single();
    }
    if (res.error) logError('updateProduct', res.error);
    return res;
}

export async function saveProductSpecifications(productId: string, specs: { id?: string, label: string, description: string }[]) {
    // 1. Delete all existing specs for this product to keep it simple
    await supabase.from('product_specifications').delete().eq('product_id', productId);

    // 2. Insert new valid specs
    const newSpecs = specs.filter(s => s.label.trim() && s.description.trim()).map(s => ({
        product_id: productId,
        label: s.label.trim(),
        description: s.description.trim()
    }));

    if (newSpecs.length > 0) {
        const res = await supabase.from('product_specifications').insert(newSpecs);
        if (res.error) logError('saveProductSpecifications', res.error);
    }
}



export async function deleteProduct(id: string) {
    const res = await supabase.from('products').delete().eq('id', id);
    if (res.error) {
        logError('deleteProduct', res.error);
        return { success: false, error: res.error.message || 'Error' };
    }
    return { success: true };
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
export async function uploadProductImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (error) { logError('uploadProductImage', error); return null; }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function fetchAdminCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*, products(id)')
        .order('created_at', { ascending: false });
    if (error) logError('fetchAdminCategories', error);
    return data || [];
}

export async function createCategory(name: string, description: string) {
    const res = await supabase.from('categories').insert([{ name, description }]).select().single();
    if (res.error) logError('createCategory', res.error);
    return res;
}

export async function updateCategory(id: string, name: string, description: string) {
    const res = await supabase.from('categories').update({ name, description }).eq('id', id);
    if (res.error) logError('updateCategory', res.error);
    return res;
}

export async function deleteCategory(id: string) {
    const res = await supabase.from('categories').delete().eq('id', id);
    if (res.error) logError('deleteCategory', res.error);
    return res;
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function fetchAdminOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false });
    if (error) logError('fetchAdminOrders', error);
    return data || [];
}

export async function fetchOrderDetails(orderId: string) {
    const { data, error } = await supabase
        .from('order_items')
        .select('*, products(name, price, image_url)')
        .eq('order_id', orderId);
    if (error) logError('fetchOrderDetails', error);
    return data || [];
}

export async function updateOrderStatus(orderId: string, status: string) {
    const res = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (res.error) logError('updateOrderStatus', res.error);
    return res;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function fetchAdminUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) logError('fetchAdminUsers', error);
    return data || [];
}

export async function deleteUser(userId: string) {
    const res = await supabase.from('users').delete().eq('id', userId);
    if (res.error) logError('deleteUser', res.error);
    return res;
}
