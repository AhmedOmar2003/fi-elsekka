import { supabase } from '@/lib/supabase';
import { Category } from './categoriesService';

const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

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
 * Fetches all products, optionally filtered by category ID.
 */
export const fetchProducts = async (categoryId?: string): Promise<Product[]> => {
    let query = supabase
        .from('products')
        .select(`
      *,
      categories ( name )
    `)
        .order('created_at', { ascending: false });

    if (categoryId) {
        if (!isUUID(categoryId)) {
            // If it's not a UUID, it's likely a mock slug (e.g., 'electronics'), so we can't query the DB by category_id directly
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
 * Fetches all products explicitly marked by admin to show in the Offers section.
 */
export const fetchOffers = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      categories ( name )
    `)
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
 */
export const fetchProductDetails = async (productId: string): Promise<Product | null> => {
    if (!isUUID(productId)) {
        // Not a valid UUID (likely a mock ID like 'prod-1')
        return null;
    }

    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      categories ( name ),
      product_specifications ( id, label, description )
    `)
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
        .select('*')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('fetchProductById error:', error.message);
        return null;
    }
    return data as Product;
};
