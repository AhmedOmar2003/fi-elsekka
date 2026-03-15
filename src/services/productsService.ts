import { supabase } from '@/lib/supabase';
import { Category } from './categoriesService';

const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

// Minimal fields for product cards (list views, home page)
const PRODUCT_CARD_FIELDS = `
  id, name, price, image_url, slug,
  discount_percentage, is_best_seller, show_in_offers,
  category_id, specifications, created_at, stock_quantity
`;

// Full fields for product details page (includes specs and images)
const PRODUCT_DETAIL_FIELDS = `
  *,
  categories ( name ),
  product_specifications ( id, label, description )
`;

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category_id: string | null;
    specifications: Record<string, any>;
    created_at: string;
    updated_at: string;
    image_url?: string;
    slug?: string;
    discount_percentage?: number;
    stock_quantity?: number;
    is_best_seller?: boolean;
    show_in_offers?: boolean;
    images?: string[];
    categories?: Pick<Category, 'name'>;
    product_specifications?: { id: string; label: string; description: string }[];
    specs?: { label: string; description: string }[];
}

/**
 * Fetches all products with minimal fields — for ProductsContext (category pages, search).
 * Uses only the fields needed for product cards — avoids select(*).
 */
export const fetchProducts = async (categoryId?: string): Promise<Product[]> => {
    let query = supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .order('created_at', { ascending: false });

    if (categoryId) {
        if (!isUUID(categoryId)) {
            return [];
        }
        query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching products:', error?.message || error);
        return [];
    }

    return data as Product[];
};

/**
 * Lightweight query used ONLY on home page — fetches just the first 8 products.
 * Much faster than loading all 500 products.
 */
export const fetchHomeProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .order('created_at', { ascending: false })
        .limit(8);

    if (error) {
        console.error('Error fetching home products:', error?.message || error);
        return [];
    }

    return data as Product[];
};

/**
 * Fetches products for a specific category — DB-level filter.
 * Used on category/[slug] page to avoid loading all products.
 */
export const fetchProductsByCategory = async (categoryId: string): Promise<Product[]> => {
    if (!isUUID(categoryId)) return [];

    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products by category:', error?.message || error);
        return [];
    }

    return data as Product[];
};

/**
 * Fetches all products explicitly marked by admin to show in the Offers section.
 * Only fetches show_in_offers=true — no need for full select(*).
 */
export const fetchOffers = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .eq('show_in_offers', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching offers:', error?.message || error);
        return [];
    }

    return data as Product[];
};

/**
 * Fetches details for a single product, including related specifications.
 * Uses full fields only on product detail pages.
 */
export const fetchProductDetails = async (productId: string): Promise<Product | null> => {
    if (!isUUID(productId)) {
        return null;
    }

    const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_DETAIL_FIELDS)
        .eq('id', productId)
        .single();

    if (error) {
        console.error('Error fetching product details:', error?.message || error);
        return null;
    }

    return data as Product;
};

/**
 * Fetches a single product by its UUID — lightweight, used for cart display.
 */
export const fetchProductById = async (productId: string): Promise<Product | null> => {
    if (!isUUID(productId)) return null;

    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, slug, discount_percentage, stock_quantity')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('fetchProductById error:', error.message);
        return null;
    }
    return data as Product;
};
