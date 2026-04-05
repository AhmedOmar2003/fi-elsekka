"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Input } from "../ui/input"
import { cn } from "../ui/button"
import {
  X,
  Search,
  ChevronLeft,
  LayoutGrid,
  LogIn,
  LogOut,
} from "lucide-react"

type Category = {
  id: string
  name: string
}

type SearchResultProduct = {
  id: string
  name: string
  price: number
  image_url?: string | null
  discount_percentage?: number | null
  specifications?: Record<string, unknown> | null
  categories?: { name?: string | null } | { name?: string | null }[] | null
}

type SearchResultCategory = {
  id: string
  name: string
}

type DrawerItem = {
  label: string
  href: string
  icon: React.ReactNode
}

const QUICK_SEARCH_TERMS = [
  "عروض",
  "الأكثر طلبًا",
  "تيشيرتات",
  "طعام",
  "ألعاب أطفال",
  "صيدلية",
]

function SearchResults({
  query,
  onSelect,
  mobile = false,
}: {
  query: string
  onSelect: () => void
  mobile?: boolean
}) {
  const router = useRouter()
  const [matchedProducts, setMatchedProducts] = React.useState<SearchResultProduct[]>([])
  const [matchedCategories, setMatchedCategories] = React.useState<SearchResultCategory[]>([])
  const [isLoadingResults, setIsLoadingResults] = React.useState(false)

  const trimmed = query.trim().toLowerCase()

  React.useEffect(() => {
    if (!trimmed || trimmed.length < 2) {
      setMatchedProducts([])
      setMatchedCategories([])
      setIsLoadingResults(false)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const runSearch = async () => {
      try {
        setIsLoadingResults(true)
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || "Search failed")
        }

        if (!cancelled) {
          setMatchedProducts(payload.products || [])
          setMatchedCategories(payload.categories || [])
        }
      } catch {
        if (!cancelled) {
          setMatchedProducts([])
          setMatchedCategories([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingResults(false)
        }
      }
    }

    void runSearch()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [trimmed])

  const hasResults = matchedProducts.length > 0 || matchedCategories.length > 0

  return (
    <div
      className={cn(
        "max-h-[70vh] overflow-y-auto overflow-hidden rounded-[24px] border border-surface-border bg-surface shadow-[var(--shadow-material-2)]",
        mobile
          ? "fixed inset-x-0 bottom-0 top-[81px] z-[160] max-h-none rounded-none border-0 border-t border-surface-border bg-background shadow-none"
          : "absolute left-0 right-0 top-full z-50 mt-3",
      )}
    >
      {isLoadingResults ? (
        <div className="p-6 text-center">
          <Search className="mx-auto mb-2 h-8 w-8 animate-pulse text-primary/60" />
          <p className="text-sm font-bold text-gray-500">بندورلك على المنتج...</p>
        </div>
      ) : !hasResults ? (
        <div className="p-6 text-center">
          <Search className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm font-bold text-gray-500">مفيش نتايج لـ "{query}"</p>
          <p className="mt-1 text-xs text-gray-400">جرّب كلمة تانية أو لف في الأقسام</p>
        </div>
      ) : (
        <>
          {matchedCategories.length > 0 && (
            <div className="border-b border-surface-hover p-2">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">الأقسام</p>
              {matchedCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  onClick={onSelect}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{cat.name}</span>
                  <ChevronLeft className="ms-auto h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}

          {matchedProducts.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">المنتجات</p>
              {matchedProducts.map((product) => {
                let displayPrice = product.price
                if (product.discount_percentage && product.discount_percentage > 0) {
                  displayPrice = Math.round(product.price * (1 - product.discount_percentage / 100))
                }

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={onSelect}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-hover"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-surface-hover bg-surface-lighter">
                      <Image
                        src={product.image_url || (product.specifications as { image_url?: string } | null)?.image_url || "/icon-192x192.svg"}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Array.isArray(product.categories) ? product.categories[0]?.name || "" : product.categories?.name || ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black text-primary">{displayPrice} ج.م</span>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="border-t border-surface-hover p-2">
            <button
              type="button"
              onClick={() => {
                router.push(`/category/all?q=${encodeURIComponent(query)}`)
                onSelect()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              <Search className="h-4 w-4" />
              شوف كل النتايج لـ "{query}"
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SearchDiscoveryPanel({
  mobile = false,
  categories,
  onSelect,
  onPickTerm,
}: {
  mobile?: boolean
  categories: Category[]
  onSelect: () => void
  onPickTerm: (term: string) => void
}) {
  const topCategories = categories.slice(0, 8)

  return (
    <div
      className={cn(
        "overflow-y-auto rounded-[24px] border border-surface-border bg-surface shadow-[var(--shadow-material-2)]",
        mobile
          ? "fixed inset-x-0 bottom-0 top-[81px] z-[160] rounded-none border-0 border-t border-surface-border bg-background p-4 pt-5 shadow-none"
          : "absolute left-0 right-0 top-full z-50 mt-3 p-4",
      )}
    >
      <div className="space-y-5">
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">لف في الأقسام</h3>
          <div className="grid grid-cols-2 gap-2">
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.id}`}
                onClick={onSelect}
                className="flex items-center gap-2 rounded-2xl border border-surface-hover bg-gradient-to-br from-primary/10 to-transparent p-3 text-sm font-bold text-foreground transition-all hover:border-primary/30 active:scale-95"
              >
                <LayoutGrid className="h-4 w-4 text-primary" />
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">بحث شائع</h3>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCH_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onPickTerm(term)}
                className="inline-flex items-center rounded-full border border-surface-hover bg-surface px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:border-primary/30 hover:text-white"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
          <p className="text-sm font-black text-foreground">ملحوظة سريعة قبل ما تطلب</p>
          <p className="mt-2 text-xs leading-6 text-gray-500">
            التوصيل الحالي داخل قرية ميت العامل فقط، وقريبًا القرى المجاورة. ولو ملقتش المنتج اللي عاوزه هتقدر تطلبه من زر
            <span className="mx-1 font-black text-primary">ملقتش المنتج؟</span>
            ونرجعلك بالسعر قبل التأكيد.
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeaderSearchPanel({
  query,
  categories,
  mobile = false,
  onSelect,
  onPickTerm,
}: {
  query: string
  categories: Category[]
  mobile?: boolean
  onSelect: () => void
  onPickTerm: (term: string) => void
}) {
  if (query.trim().length >= 2) {
    return <SearchResults query={query} onSelect={onSelect} mobile={mobile} />
  }

  return (
    <SearchDiscoveryPanel
      categories={categories}
      mobile={mobile}
      onSelect={onSelect}
      onPickTerm={onPickTerm}
    />
  )
}

export function HeaderSearchOverlay({
  isOpen,
  isClient,
  query,
  categories,
  onChangeQuery,
  onClose,
  onKeyDown,
  onPickTerm,
}: {
  isOpen: boolean
  isClient: boolean
  query: string
  categories: Category[]
  onChangeQuery: (value: string) => void
  onClose: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onPickTerm: (term: string) => void
}) {
  if (!isOpen || !isClient) return null

  return createPortal(
    <div className="fixed inset-0 z-[140] flex flex-col bg-background">
      <div className="sticky top-0 z-[141] flex items-center gap-3 border-b border-white/8 bg-[#101816] p-4">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-white/55">
            <Search className="h-5 w-5" />
          </div>
          <Input
            type="search"
            placeholder="بتدور على إيه؟..."
            className="h-12 w-full rounded-2xl border-white/8 bg-white/6 ps-11 text-base text-white placeholder:text-white/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            autoFocus
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/65 transition-all hover:bg-white/6 hover:text-white active:scale-95"
          aria-label="إغلاق البحث"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative z-[140] flex-1 overflow-y-auto">
        <HeaderSearchPanel
          query={query}
          categories={categories}
          mobile
          onSelect={onClose}
          onPickTerm={onPickTerm}
        />
      </div>
    </div>,
    document.body,
  )
}

export function HeaderMobileMenuDrawer({
  isOpen,
  isClient,
  pathname,
  siteTagline,
  user,
  primaryItems,
  secondaryItems,
  onClose,
  onLogout,
}: {
  isOpen: boolean
  isClient: boolean
  pathname: string
  siteTagline: string
  user: unknown
  primaryItems: DrawerItem[]
  secondaryItems: DrawerItem[]
  onClose: () => void
  onLogout: () => void
}) {
  if (!isOpen || !isClient) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ms-auto flex h-full w-[86%] max-w-sm flex-col border-s border-white/8 bg-[#101816] text-white shadow-[var(--shadow-material-3)]">
        <div className="flex items-center justify-between border-b border-surface-hover p-4">
          <div className="flex items-center gap-2">
            <Image
              src="/icon-192x192.svg"
              alt="في السكة"
              width={36}
              height={36}
              className="rounded-2xl shadow-[var(--shadow-material-2)] ring-1 ring-primary/10"
            />
            <div>
              <div className="flex items-baseline gap-0 leading-none" style={{ fontFamily: "var(--font-lalezar), serif" }}>
                <span className="text-lg font-black text-white">فِي&nbsp;</span>
                <span className="text-lg font-black text-primary">السِّكَّةِ</span>
              </div>
              <p className="text-[10px] font-bold text-white/45">{siteTagline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/6 hover:text-white active:scale-95"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-5 rounded-[28px] border border-primary/14 bg-primary/10 p-4 shadow-[var(--shadow-material-2)]">
            <p className="text-sm font-black text-white">لف براحتك</p>
            <p className="mt-1 text-xs leading-6 text-white/58">
              من هنا تقدر توصل بسرعة للعروض، الأقسام، حسابك، أو أي صفحة تعريفية مهمة.
            </p>
          </div>

          <div>
            <p className="mb-2 px-2 text-[11px] font-black tracking-[0.18em] text-white/38">روابط أساسية</p>
            {primaryItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "my-1 flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                    isActive ? "bg-primary/12 text-primary" : "text-white hover:bg-white/6",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-primary" : "text-white/62"}>{item.icon}</span>
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-white/35" />
                </Link>
              )
            })}
          </div>

          <div className="mt-5">
            <p className="mb-2 px-2 text-[11px] font-black tracking-[0.18em] text-white/38">معلومات ومساعدة</p>
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "my-1 flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                    isActive ? "bg-primary/12 text-primary" : "text-white hover:bg-white/6",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-primary" : "text-white/62"}>{item.icon}</span>
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-white/35" />
                </Link>
              )
            })}
          </div>

          {!user ? (
            <Link
              href="/login"
              onClick={onClose}
              className="mt-5 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3.5 text-primary transition-colors hover:bg-primary/14"
            >
              <div className="flex items-center gap-3">
                <LogIn className="h-5 w-5" />
                <span className="text-sm font-bold">ادخل أو اعمل حساب</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-primary/70" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="mt-5 flex w-full items-center justify-between rounded-2xl border border-rose-400/14 bg-rose-500/8 px-4 py-3.5 text-rose-300 transition-colors hover:bg-rose-500/12"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-bold">تسجيل الخروج</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-rose-200/70" />
            </button>
          )}
        </nav>

        <div className="border-t border-white/8 p-4">
          <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
            <p className="mb-1 text-sm font-bold text-white">محتاج حد يساعدك؟ 💬</p>
            <p className="mb-3 text-xs text-white/58">فريقنا موجود علشانك في أي وقت لو محتاج تسأل أو تستفسر.</p>
            <Link
              href="/contact"
              onClick={onClose}
              className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-primary-hover active:scale-95"
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
