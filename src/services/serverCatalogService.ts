import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Category } from './categoriesService'
import type { Product } from './productsService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
): Promise<{ products: Product[]; hasMore: boolean }> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const supabase = getPublicServerSupabase()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_CARD_FIELDS)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching server paginated products:', error.message)
    return { products: [], hasMore: false }
  }

  return {
    products: (data || []) as Product[],
    hasMore: (data?.length || 0) === pageSize,
  }
}
