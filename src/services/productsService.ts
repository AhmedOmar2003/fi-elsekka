import { supabase } from '@/lib/supabase';
import { Category } from './categoriesService';
import {
    compareRelatedCandidates,
    getManualRelatedProductIds,
    isPublishedProduct,
} from '@/lib/product-metadata';

const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);

// Minimal fields for product cards (list views, home page)
// Removed 'slug' as it does not exist in the database table.
const PRODUCT_CARD_FIELDS = `
  id, name, price, image_url,
  discount_percentage, is_best_seller, show_in_offers,
  category_id, specifications, created_at, stock_quantity
`;

// Full fields for product details page (includes specs and images)
const PRODUCT_DETAIL_FIELDS = `
  *,
  categories ( name ),
  product_specifications ( id, label, description )
`;

const RELATED_PRODUCT_FIELDS = `
  id, name, price, image_url,
  discount_percentage, is_best_seller, show_in_offers,
  category_id, specifications, created_at, stock_quantity,
  categories ( name )
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
 * Fetches the most requested products using actual order volume only.
 * Logic:
 * 1. Calculate total ordered quantity per product from `order_items`.
 * 2. Ignore cancelled orders completely.
 * 3. Return the top 4 in exact ranking order.
 * 4. If there are no real orders yet, fallback to newest 4 products.
 */
export const fetchBestSellers = async (): Promise<Product[]> => {
    try {
        // 1. Try to fetch sales data from order_items
        const { data: orderItems, error: itemsError } = await supabase
            .from('order_items')
            .select('product_id, quantity, orders(status)');

        let salesRank: string[] = [];
        if (!itemsError && orderItems && orderItems.length > 0) {
            const sales: Record<string, number> = {};
            for (const item of orderItems) {
                const relatedOrder = Array.isArray((item as any).orders) ? (item as any).orders[0] : (item as any).orders;
                if (relatedOrder?.status === 'cancelled') continue;
                if (item.product_id) {
                    sales[item.product_id] = (sales[item.product_id] || 0) + (item.quantity || 1);
                }
            }
            // Sort by total quantity descending
            salesRank = Object.entries(sales)
                .sort((a, b) => b[1] - a[1])
                .map(e => e[0]);
        }

        // If we have top selling products by actual sales
        if (salesRank.length > 0) {
            const topIds = salesRank.slice(0, 4);
            const { data: topProducts } = await supabase
                .from('products')
                .select(PRODUCT_CARD_FIELDS)
                .in('id', topIds);

            if (topProducts && topProducts.length > 0) {
                // Sort to match the exact sales rank order
                const ordered = topIds
                    .map(id => topProducts.find(p => p.id === id))
                    .filter(Boolean) as Product[];

                if (ordered.length > 0) return ordered.slice(0, 4);
            }
        }

        // 2. Final fallback: newest products if there are no real orders yet
        const { data: newest } = await supabase
            .from('products')
            .select(PRODUCT_CARD_FIELDS)
            .order('created_at', { ascending: false })
            .limit(4);

        return (newest || []) as Product[];
    } catch (err) {
        console.error('Error in fetchBestSellers:', err);
        return [];
    }
};

/**
 * Paginated product fetch for the /category/all page.
 * Returns a page of products with total count for infinite scroll.
 * @param page - 0-indexed page number
 * @param pageSize - number of items per page (default: 20)
 * @param categoryId - optional category filter
 */
export const fetchPaginatedProducts = async (
    page: number = 0,
    pageSize: number = 20,
    categoryId?: string
): Promise<{ products: Product[]; hasMore: boolean }> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('products')
        .select(PRODUCT_CARD_FIELDS)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (categoryId && isUUID(categoryId)) {
        query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching paginated products:', error?.message || error);
        return { products: [], hasMore: false };
    }

    return {
        products: data as Product[],
        // If we got a full page, there might be more
        hasMore: (data?.length ?? 0) === pageSize,
    };
};

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
        .select('id, name, price, image_url, discount_percentage, stock_quantity, specifications')
        .eq('id', productId)
        .single();

    if (error) {
        console.error('fetchProductById error:', error.message);
        return null;
    }
    return data as Product;
};

async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
    const validIds = ids.filter((id) => isUUID(id));
    if (validIds.length === 0) return [];

    const { data, error } = await supabase
        .from('products')
        .select(RELATED_PRODUCT_FIELDS)
        .in('id', validIds);

    if (error) {
        console.error('fetchProductsByIds error:', error.message);
        return [];
    }

    const lookup = new Map((data || []).map((product) => [product.id, product as unknown as Product]));
    return validIds
        .map((id) => lookup.get(id))
        .filter((product): product is Product => Boolean(product));
}

export const fetchRelatedProducts = async (productId: string, limit: number = 8): Promise<Product[]> => {
    if (!isUUID(productId)) return [];

    const currentProduct = await fetchProductDetails(productId);
    if (!currentProduct) return [];

    const manualIds = getManualRelatedProductIds(currentProduct).filter((id) => id !== currentProduct.id);
    const manualProducts = (await fetchProductsByIds(manualIds))
        .filter((product) => isPublishedProduct(product))
        .slice(0, limit);

    const excludedIds = new Set<string>([currentProduct.id, ...manualProducts.map((product) => product.id)]);
    const remainingLimit = Math.max(limit - manualProducts.length, 0);

    if (remainingLimit === 0) {
        return manualProducts;
    }

    let query = supabase
        .from('products')
        .select(RELATED_PRODUCT_FIELDS)
        .neq('id', currentProduct.id)
        .order('created_at', { ascending: false })
        .limit(currentProduct.category_id ? 80 : 120);

    if (currentProduct.category_id) {
        query = query.eq('category_id', currentProduct.category_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error('fetchRelatedProducts error:', error.message);
        return manualProducts;
    }

    const candidates = (data || [])
        .map((item) => item as unknown as Product)
        .filter((product) => !excludedIds.has(product.id))
        .filter((product) => isPublishedProduct(product));

    const automaticProducts = candidates
        .sort((left, right) => compareRelatedCandidates(currentProduct, left, right))
        .slice(0, remainingLimit);

    return [...manualProducts, ...automaticProducts].slice(0, limit);
};
