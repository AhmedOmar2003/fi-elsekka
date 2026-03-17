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
import { Loader2, NotebookPen, ShoppingBasket, Sparkles } from "lucide-react"
import { Product, fetchProductsByCategory, fetchPaginatedProducts } from "@/services/productsService"
import { useProducts } from "@/contexts/ProductsContext"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { isTextRequestCategory, TEXT_CATEGORY_ORDER_MODE, writeTextCategoryOrderDraft } from "@/lib/text-category-orders"

const PAGE_SIZE = 20

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = typeof params.slug === 'string' ? params.slug : 'all'
  
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const { categories } = useProducts()
  const [textRequest, setTextRequest] = React.useState("")

  // ── State for paginated "all" view ──────────────────────────────────────
  const [allPageProducts, setAllPageProducts] = React.useState<Product[]>([])
  const [currentPage, setCurrentPage] = React.useState(0)
  const [hasMore, setHasMore] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [isInitialLoading, setIsInitialLoading] = React.useState(false)

  // ── State for specific category view ────────────────────────────────────
  const [categoryProducts, setCategoryProducts] = React.useState<Product[]>([])
  const [isCategoryLoading, setIsCategoryLoading] = React.useState(false)
  const categoryFetchedSlug = React.useRef<string | null>(null)

  const isAllPage = slug === 'all'

  // ── Load first page for "all" ────────────────────────────────────────────
  React.useEffect(() => {
    if (!isAllPage) return
    setIsInitialLoading(true)
    setAllPageProducts([])
    setCurrentPage(0)
    setHasMore(true)

    fetchPaginatedProducts(0, PAGE_SIZE).then(({ products, hasMore }) => {
      setAllPageProducts(products)
      setCurrentPage(1)
      setHasMore(hasMore)
      setIsInitialLoading(false)
    })
  }, [isAllPage])

  // ── Load more handler (infinite scroll) ──────────────────────────────────
  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const { products, hasMore: more } = await fetchPaginatedProducts(currentPage, PAGE_SIZE)
    setAllPageProducts(prev => {
      // Deduplicate by ID in case of repeated calls
      const ids = new Set(prev.map(p => p.id))
      return [...prev, ...products.filter(p => !ids.has(p.id))]
    })
    setCurrentPage(p => p + 1)
    setHasMore(more)
    setIsLoadingMore(false)
  }, [currentPage, hasMore, isLoadingMore])

  // ── Specific category DB fetch ───────────────────────────────────────────
  React.useEffect(() => {
    if (isAllPage) return

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (!isUUID) return

    if (categoryFetchedSlug.current === slug) return
    categoryFetchedSlug.current = slug

    setIsCategoryLoading(true)
    fetchProductsByCategory(slug).then(data => {
      setCategoryProducts(data)
      setIsCategoryLoading(false)
    })
  }, [slug, isAllPage])

  const allProducts = isAllPage ? allPageProducts : categoryProducts
  const isLoading = isAllPage ? isInitialLoading : isCategoryLoading

  const searchQuery = searchParams.get('q') || ''

  // ── Filter State ─────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = React.useState("popular")
  const [priceFilters, setPriceFilters] = React.useState<Set<string>>(new Set())
  const [categoryFilters, setCategoryFilters] = React.useState<Set<string>>(new Set())

  const currentCategory = React.useMemo(() => {
    if (isAllPage) return null
    return categories.find(c => c.id === slug) || null
  }, [categories, slug, isAllPage])

  const categoryName = currentCategory?.name || (isAllPage ? 'كل المنتجات' : 'قسم المنتجات')
  const isTextRequestCategoryPage = !!currentCategory && isTextRequestCategory(currentCategory.name)

  React.useEffect(() => {
    if (!isTextRequestCategoryPage || !currentCategory) return
    try {
      const raw = window.sessionStorage.getItem(`text-category-order-draft:${currentCategory.id}`)
      if (!raw) return
      const draft = JSON.parse(raw) as { requestText?: string }
      if (draft?.requestText) {
        setTextRequest(draft.requestText)
      }
    } catch {
      // Ignore malformed draft state
    }
  }, [currentCategory, isTextRequestCategoryPage])

  const togglePriceFilter = (range: string) => {
    setPriceFilters(prev => { const next = new Set(prev); next.has(range) ? next.delete(range) : next.add(range); return next })
  }

  const toggleCategoryFilter = (catId: string) => {
    setCategoryFilters(prev => { const next = new Set(prev); next.has(catId) ? next.delete(catId) : next.add(catId); return next })
  }

  const clearAllFilters = () => {
    setSortBy("popular")
    setPriceFilters(new Set())
    setCategoryFilters(new Set())
  }

  const hasActiveFilters = priceFilters.size > 0 || categoryFilters.size > 0 || sortBy !== "popular"

  // ── Compute displayed products ───────────────────────────────────────────
  const displayProducts = React.useMemo(() => {
    let filtered = [...allProducts]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q))
    }

    // Category type filter (only on "all" page)
    if (categoryFilters.size > 0) {
      filtered = filtered.filter(p => p.category_id && categoryFilters.has(p.category_id))
    }

    // Price filter
    if (priceFilters.size > 0) {
      filtered = filtered.filter(p => {
        const price = p.discount_percentage ? Math.round(p.price * (1 - p.discount_percentage / 100)) : p.price
        if (priceFilters.has("under50") && price < 50) return true
        if (priceFilters.has("50to200") && price >= 50 && price <= 200) return true
        if (priceFilters.has("200to500") && price > 200 && price <= 500) return true
        if (priceFilters.has("over500") && price > 500) return true
        return false
      })
    }

    // Sort
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
      default: // "popular"
        filtered.sort((a, b) => {
          if (a.is_best_seller && !b.is_best_seller) return -1
          if (!a.is_best_seller && b.is_best_seller) return 1
          return ((b.specifications as any)?.rating || 0) - ((a.specifications as any)?.rating || 0)
        })
    }

    return filtered
  }, [allProducts, searchQuery, categoryFilters, priceFilters, sortBy])

  const productCards = displayProducts.map((p) => {
    let price = p.price
    let oldPrice: number | undefined = p.specifications?.old_price
    let discountBadge = p.specifications?.discount_badge
    if (p.discount_percentage && p.discount_percentage > 0) {
      price = Math.round(p.price * (1 - p.discount_percentage / 100))
      oldPrice = p.price
      discountBadge = `خصم ${p.discount_percentage}%`
    }
    return { id: p.id, title: p.name, price, oldPrice, discountBadge, rating: p.specifications?.rating, reviewsCount: p.specifications?.reviews_count, imageUrl: p.image_url || p.specifications?.image_url || '' }
  })

  const handleContinueTextOrder = () => {
    const normalizedText = textRequest.trim()
    if (normalizedText.length < 12 || !currentCategory) return

    writeTextCategoryOrderDraft({
      categoryId: currentCategory.id,
      categoryName: currentCategory.name,
      requestText: normalizedText,
    })

    router.push(`/checkout?requestMode=${TEXT_CATEGORY_ORDER_MODE}&categoryId=${currentCategory.id}`)
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-28 md:pb-8 bg-background min-h-screen">
        <div className="bg-surface border-b border-surface-hover py-6 md:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              {searchQuery ? `نتايج البحث: "${searchQuery}"` : categoryName}
            </h1>
            <p className="mt-2 text-gray-500">
              {searchQuery
                ? `تم العثور على ${productCards.length} منتج`
                : isTextRequestCategoryPage
                  ? 'اكتب طلبك كنص واضح، وسيراه الأدمن والمندوب كما كتبته بالضبط.'
                  : 'تصفح أفضل المنتجات المختارة لك خصيصاً في هذا القسم.'}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {isTextRequestCategoryPage ? (
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[2rem] border border-surface-hover bg-surface p-6 shadow-premium sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                      <ShoppingBasket className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-foreground">اطلب من السوبر ماركت بالنص</h2>
                      <p className="mt-2 text-sm leading-7 text-gray-500">
                        اكتب احتياجاتك بالتفصيل بدل اختيار منتجات جاهزة. الإدارة ستراجع الطلب، ثم نرسله للمندوب كما كتبته تمامًا.
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-xs font-black">كيف تكتب الطلب بشكل صحيح؟</p>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-gray-500">
                      <li>اكتب اسم كل منتج والكمية المطلوبة.</li>
                      <li>اذكر المقاسات أو الوزن أو النوع إن وجد.</li>
                      <li>لو عندك بديل مقبول، اكتبه بوضوح.</li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <label className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
                      <NotebookPen className="h-4 w-4 text-primary" />
                      تفاصيل الطلب النصي
                    </label>
                    <textarea
                      value={textRequest}
                      onChange={(e) => setTextRequest(e.target.value)}
                      rows={9}
                      placeholder={`مثال:\n2 كيلو أرز الضحى\n1 زيت عباد الشمس 2 لتر\n4 علب تونة مفتاح سهل\nلو نوع الجبن غير موجود بدّله بأي نوع مشابه`}
                      className="w-full resize-none rounded-[1.5rem] border border-surface-hover bg-background px-4 py-4 text-sm leading-7 text-foreground outline-none transition-colors focus:border-primary/40"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      هذا النص سيصل إلى الأدمن والمندوب كما هو، فحاول يكون واضحًا ومباشرًا.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-500">
                      السعر النهائي للمنتجات يتحدد بعد مراجعة الطلب، ثم يتم التوصيل كالمعتاد.
                    </p>
                    <Button
                      onClick={handleContinueTextOrder}
                      disabled={textRequest.trim().length < 12}
                      className="rounded-2xl px-6 py-6 text-sm font-black"
                    >
                      متابعة الطلب
                    </Button>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-surface-hover bg-surface p-6 shadow-premium sm:p-8">
                  <h3 className="text-lg font-black text-foreground">نموذج كتابة مقترح</h3>
                  <div className="mt-4 rounded-3xl border border-surface-hover bg-background/70 p-4 text-sm leading-7 text-gray-500">
                    لبن 3 علب
                    <br />
                    جبنة فيتا نصف كيلو
                    <br />
                    مكرونة 2 كيس رقم 5
                    <br />
                    6 زبادي فراولة
                    <br />
                    لو نوع اللبن غير موجود خذ أي بديل كامل الدسم
                  </div>

                  <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4">
                    <p className="text-xs font-black text-amber-500">مهم</p>
                    <p className="mt-2 text-sm leading-7 text-gray-500">
                      لا تكتب كلامًا عامًا مثل "هاتلي شوية طلبات". كلما كان الطلب أدق، كان التنفيذ أسرع وأصح.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
          <div className="flex flex-col md:flex-row gap-8">

            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4 md:hidden">
              <span className="text-sm text-gray-500 font-medium">عرض {productCards.length} منتج</span>
              <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 bg-surface border border-surface-hover px-4 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-surface-hover active:scale-95 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                تصفية وترتيب
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary"></span>}
              </button>
            </div>

            {/* Sidebar */}
            <aside className={`md:w-64 shrink-0 flex-col gap-8 ${isFilterOpen ? 'flex' : 'hidden md:flex'}`}>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-400 mb-2 transition-colors">
                  <X className="w-3.5 h-3.5" />مسح كل الفلاتر
                </button>
              )}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">الترتيب</h3>
                <Select value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)} className="w-full">
                  <option value="popular">الأكثر شعبية</option>
                  <option value="newest">أضيف حديثاً</option>
                  <option value="price-low">السعر: من الأقل للأعلى</option>
                  <option value="price-high">السعر: من الأعلى للأقل</option>
                </Select>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">السعر</h3>
                <div className="space-y-3">
                  {[{ id: "under50", label: "أقل من 50 ج.م" }, { id: "50to200", label: "50 - 200 ج.م" }, { id: "200to500", label: "200 - 500 ج.م" }, { id: "over500", label: "أكثر من 500 ج.م" }].map(range => (
                    <div key={range.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id={`price-${range.id}`} checked={priceFilters.has(range.id)} onChange={() => togglePriceFilter(range.id)} />
                      <Label htmlFor={`price-${range.id}`} className="text-foreground cursor-pointer">{range.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              {isAllPage && categories.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">النوع</h3>
                  <div className="space-y-3">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Checkbox id={`cat-${cat.id}`} checked={categoryFilters.has(cat.id)} onChange={() => toggleCategoryFilter(cat.id)} />
                        <Label htmlFor={`cat-${cat.id}`} className="text-foreground cursor-pointer">{cat.name}</Label>
                        <span className="text-[10px] text-gray-500 ms-auto">({allProducts.filter(p => p.category_id === cat.id).length})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={() => setIsFilterOpen(false)} className="md:hidden mt-4">عرض {productCards.length} نتيجة</Button>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="hidden md:flex justify-between items-center mb-6">
                <span className="text-sm text-gray-500">عرض {productCards.length} نتيجة</span>
                {hasActiveFilters && <button onClick={clearAllFilters} className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors">مسح الفلاتر</button>}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
              ) : productCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-4 border border-surface-hover">
                    <svg className="w-9 h-9 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">مفيش منتجات بالمواصفات دي</h3>
                  <p className="text-gray-500 mb-6">جرب تغير الفلاتر أو تبحث بكلمة تانية</p>
                  {hasActiveFilters && <Button variant="outline" onClick={clearAllFilters} className="rounded-xl">مسح كل الفلاتر</Button>}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                    {productCards.map((product) => <ProductCard key={product.id} {...product} />)}
                  </div>

                  {/* Load More button — only shown on "all" page when more products exist */}
                  {isAllPage && hasMore && !hasActiveFilters && (
                    <div className="flex justify-center mt-10">
                      <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="flex items-center gap-2 bg-surface border border-surface-hover hover:bg-surface-hover text-foreground font-bold px-8 py-3.5 rounded-xl transition-all disabled:opacity-50"
                      >
                        {isLoadingMore ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...</>
                        ) : (
                          'تحميل المزيد من المنتجات'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
