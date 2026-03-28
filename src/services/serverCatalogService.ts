import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Category } from './categoriesService'
import type { Product } from './productsService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY

const PRODUCT_CARD_FIELDS = `
  id, name, price, image_url,
  discount_percentage, is_best_seller, show_in_offers,
  category_id, specifications, created_at, stock_quantity
`

const CATEGORY_FIELDS = 'id, name, description, parent_id, created_at, updated_at'

const isUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)

function getPublicServerSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and anon key are required.')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getServerAdminSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function fetchCategoryByIdServer(categoryId: string): Promise<Category | null> {
  if (!isUUID(categoryId)) return null

  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_FIELDS)
    .eq('id', categoryId)
    .single()

  if (error) {
    console.error('Error fetching category by id on server:', error.message)
    return null
  }

  return data as Category
}

export async function fetchProductsByCategoryServer(categoryId: string): Promise<Product[]> {
  if (!isUUID(categoryId)) return []

  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_CARD_FIELDS)
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching server category products:', error.message)
    return []
  }

  return (data || []) as Product[]
}

export async function fetchPaginatedProductsServer(
  page = 0,
  pageSize = 20,
  categoryId?: string,
): Promise<{ products: Product[]; hasMore: boolean }> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const supabase = getPublicServerSupabase()
  let query = supabase
    .from('products')
    .select(PRODUCT_CARD_FIELDS)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (categoryId && isUUID(categoryId)) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching server paginated products:', error.message)
    return { products: [], hasMore: false }
  }

  return {
    products: (data || []) as Product[],
    hasMore: (data?.length || 0) === pageSize,
  }
}

export async function fetchBestSellersServer(limit = 4): Promise<Product[]> {
  const supabaseAdmin = getServerAdminSupabase()
  if (!supabaseAdmin) return []

  const { data: deliveredOrders, error: deliveredOrdersError } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (deliveredOrdersError) {
    console.error('Error fetching delivered orders on server:', deliveredOrdersError.message)
    return []
  }

  const deliveredOrderIds = (deliveredOrders || []).map((order) => order.id).filter(Boolean)
  if (deliveredOrderIds.length === 0) return []

  const { data: orderItems, error: orderItemsError } = await supabaseAdmin
    .from('order_items')
    .select('product_id, quantity')
    .in('order_id', deliveredOrderIds)

  if (orderItemsError) {
    console.error('Error fetching delivered order items on server:', orderItemsError.message)
    return []
  }

  const sales = new Map<string, number>()
  for (const item of orderItems || []) {
    const productId = item.product_id
    if (!productId) continue
    sales.set(productId, (sales.get(productId) || 0) + Number(item.quantity || 1))
  }

  const rankedIds = Array.from(sales.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([productId]) => productId)

  if (rankedIds.length === 0) return []

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select(PRODUCT_CARD_FIELDS)
    .in('id', rankedIds)

  if (productsError) {
    console.error('Error fetching best seller products on server:', productsError.message)
    return []
  }

  const productMap = new Map((products || []).map((product) => [product.id, product as Product]))
  return rankedIds
    .map((id) => productMap.get(id))
    .filter((product): product is Product => Boolean(product))
}
