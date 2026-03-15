"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/ui/product-card"
import { ProductCardSkeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useParams } from "next/navigation"
import { Product, fetchProductsByCategory } from "@/services/productsService"
import { useProducts } from "@/contexts/ProductsContext"
import { X } from "lucide-react"

export default function CategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = typeof params.slug === 'string' ? params.slug : 'all'
  
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  
  // For "all" category: use the context (which has all products in memory)
  // For specific categories: fetch only that category's products from DB
  const { products: allContextProducts, categories, isLoadingProducts: isContextLoading } = useProducts()

  // DB-fetched products for specific category pages
  const [categoryProducts, setCategoryProducts] = React.useState<Product[]>([])
  const [isCategoryLoading, setIsCategoryLoading] = React.useState(false)
  const categoryFetchedSlug = React.useRef<string | null>(null)

  // When on a specific category (not "all"), fetch only that category from DB
  React.useEffect(() => {
    if (slug === 'all') return
    
    // Validate: must be a UUID (real DB category)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (!isUUID) return

    // Avoid re-fetching the same category
    if (categoryFetchedSlug.current === slug) return
    categoryFetchedSlug.current = slug

    setIsCategoryLoading(true)
    fetchProductsByCategory(slug).then(data => {
      setCategoryProducts(data)
      setIsCategoryLoading(false)
    })
  }, [slug])

  // Choose which products to use:
  // - "all" page → use context (all products, full filtering support)
  // - specific category → use DB-fetched (only that category's products)
  const allProducts = slug === 'all' ? allContextProducts : categoryProducts
  const isLoading = slug === 'all' ? isContextLoading : isCategoryLoading

  // Get search query from URL (from smart search)
  const searchQuery = searchParams.get('q') || ''

  // ── Filter State ──────────────────────────────────────────────
  const [sortBy, setSortBy] = React.useState("popular")
  const [priceFilters, setPriceFilters] = React.useState<Set<string>>(new Set())
  const [categoryFilters, setCategoryFilters] = React.useState<Set<string>>(new Set())

  // Determine current category name from DB or slug
  const currentCategory = React.useMemo(() => {
    if (slug === 'all') return null
    return categories.find(c => c.id === slug) || null
  }, [categories, slug])

  const categoryName = currentCategory?.name || (slug === 'all' ? 'كل المنتجات' : 'قسم المنتجات')

  // ── Price filter toggle ──────────────────────────────────────
  const togglePriceFilter = (range: string) => {
    setPriceFilters(prev => {
      const next = new Set(prev)
      if (next.has(range)) next.delete(range)
      else next.add(range)
      return next
    })
  }

  // ── Category filter toggle ───────────────────────────────────
  const toggleCategoryFilter = (catId: string) => {
    setCategoryFilters(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  // ── Clear all filters ────────────────────────────────────────
  const clearAllFilters = () => {
    setSortBy("popular")
    setPriceFilters(new Set())
    setCategoryFilters(new Set())
  }

  const hasActiveFilters = priceFilters.size > 0 || categoryFilters.size > 0 || sortBy !== "popular"

  // ── Compute displayed products ───────────────────────────────
  const displayProducts = React.useMemo(() => {
    let filtered = [...allProducts]

    // 1. Filter by category slug (only applies on "all" page; specific pages use DB-filtered data)
    if (slug !== 'all' && categoryProducts.length === 0) {
      // Still loading or filtering from context as fallback
      filtered = filtered.filter(p => p.category_id === slug)
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q))
    }

    // 3. Filter by selected category types (only when on "all" page)
    if (categoryFilters.size > 0) {
      filtered = filtered.filter(p => p.category_id && categoryFilters.has(p.category_id))
    }

    // 4. Filter by price range
    if (priceFilters.size > 0) {
      filtered = filtered.filter(p => {
        let price = p.price
        if (p.discount_percentage && p.discount_percentage > 0) {
          price = Math.round(p.price * (1 - p.discount_percentage / 100))
        }
        if (priceFilters.has("under50") && price < 50) return true
        if (priceFilters.has("50to200") && price >= 50 && price <= 200) return true
        if (priceFilters.has("200to500") && price > 200 && price <= 500) return true
        if (priceFilters.has("over500") && price > 500) return true
        return false
      })
    }

    // 5. Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "price-low":
        filtered.sort((a, b) => {
          const pa = a.discount_percentage ? Math.round(a.price * (1 - a.discount_percentage / 100)) : a.price
          const pb = b.discount_percentage ? Math.round(b.price * (1 - b.discount_percentage / 100)) : b.price
          return pa - pb
        })
        break
      case "price-high":
        filtered.sort((a, b) => {
          const pa = a.discount_percentage ? Math.round(a.price * (1 - a.discount_percentage / 100)) : a.price
          const pb = b.discount_percentage ? Math.round(b.price * (1 - b.discount_percentage / 100)) : b.price
          return pb - pa
        })
        break
      default: // "popular" — best sellers first, then by rating
        filtered.sort((a, b) => {
          if (a.is_best_seller && !b.is_best_seller) return -1
          if (!a.is_best_seller && b.is_best_seller) return 1
          return ((b.specifications as any)?.rating || 0) - ((a.specifications as any)?.rating || 0)
        })
    }

    return filtered
  }, [allProducts, slug, categoryProducts, searchQuery, categoryFilters, priceFilters, sortBy])

  // Convert Product to ProductCard props
  const productCards = displayProducts.map((p) => {
    let price = p.price
    let oldPrice: number | undefined = p.specifications?.old_price
    let discountBadge = p.specifications?.discount_badge

    if (p.discount_percentage && p.discount_percentage > 0) {
      price = Math.round(p.price * (1 - p.discount_percentage / 100))
      oldPrice = p.price
      discountBadge = `خصم ${p.discount_percentage}%`
    }

    return {
      id: p.id,
      title: p.name,
      price,
      oldPrice,
      discountBadge,
      rating: p.specifications?.rating,
      reviewsCount: p.specifications?.reviews_count,
      imageUrl: p.image_url || p.specifications?.image_url || ''
    }
  })

  return (
    <>
      <Header />

      <main className="flex-1 pb-28 md:pb-8 bg-background min-h-screen">

        {/* Page Header */}
        <div className="bg-surface border-b border-surface-hover py-6 md:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              {searchQuery ? `نتايج البحث: "${searchQuery}"` : categoryName}
            </h1>
            <p className="mt-2 text-gray-500">
              {searchQuery 
                ? `تم العثور على ${productCards.length} منتج` 
                : 'تصفح أفضل المنتجات المختارة لك خصيصاً في هذا القسم.'
              }
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">

            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4 md:hidden">
              <span className="text-sm text-gray-500 font-medium">عرض {productCards.length} منتج</span>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 bg-surface border border-surface-hover px-4 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-surface-hover active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                تصفية وترتيب
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                )}
              </button>
            </div>

            {/* Sidebar Filters */}
            <aside className={`md:w-64 shrink-0 flex-col gap-8 ${isFilterOpen ? 'flex' : 'hidden md:flex'}`}>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 mb-2 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  مسح كل الفلاتر
                </button>
              )}

              {/* Sort */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">الترتيب</h3>
                <Select
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
                  className="w-full"
                >
                  <option value="popular">الأكثر شعبية</option>
                  <option value="newest">أضيف حديثاً</option>
                  <option value="price-low">السعر: من الأقل للأعلى</option>
                  <option value="price-high">السعر: من الأعلى للأقل</option>
                </Select>
              </div>

              {/* Price Filter */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">السعر</h3>
                <div className="space-y-3">
                  {[
                    { id: "under50", label: "أقل من 50 ج.م" },
                    { id: "50to200", label: "50 - 200 ج.م" },
                    { id: "200to500", label: "200 - 500 ج.م" },
                    { id: "over500", label: "أكثر من 500 ج.م" },
                  ].map(range => (
                    <div key={range.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox
                        id={`price-${range.id}`}
                        checked={priceFilters.has(range.id)}
                        onChange={() => togglePriceFilter(range.id)}
                      />
                      <Label htmlFor={`price-${range.id}`} className="text-foreground cursor-pointer">{range.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Type Filter (only on "all" page) */}
              {slug === 'all' && categories.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">النوع</h3>
                  <div className="space-y-3">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={categoryFilters.has(cat.id)}
                          onChange={() => toggleCategoryFilter(cat.id)}
                        />
                        <Label htmlFor={`cat-${cat.id}`} className="text-foreground cursor-pointer">
                          {cat.name}
                        </Label>
                        <span className="text-[10px] text-gray-500 ms-auto">
                          ({allProducts.filter(p => p.category_id === cat.id).length})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button for mobile */}
              <Button onClick={() => setIsFilterOpen(false)} className="md:hidden mt-4">
                عرض {productCards.length} نتيجة
              </Button>

            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="hidden md:flex justify-between items-center mb-6">
                <span className="text-sm text-gray-500">عرض {productCards.length} نتيجة</span>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors"
                  >
                    مسح الفلاتر
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : productCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-4 border border-surface-hover">
                    <svg className="w-9 h-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">مفيش منتجات بالمواصفات دي</h3>
                  <p className="text-gray-500 mb-6">جرب تغير الفلاتر أو تبحث بكلمة تانية</p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearAllFilters} className="rounded-xl">
                      مسح كل الفلاتر
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {productCards.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </>
  )
}
