"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../ui/button"
import {
  Menu, Search, User, ShoppingBag, BadgePercent, X,
  ChevronLeft, Home, LayoutGrid, Package, Phone,
  Info, MessageCircleQuestion, LogOut, LogIn
} from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { useProducts } from "@/contexts/ProductsContext"
import { signOut } from "@/services/authService"
import { useAppSettings } from "@/contexts/AppSettingsContext"
import { toast } from "sonner"

const NotificationBell = dynamic(
  () => import("../ui/notification-bell").then((mod) => mod.NotificationBell),
  { ssr: false }
)

const LogoutModal = dynamic(
  () => import("@/components/ui/logout-modal").then((mod) => mod.LogoutModal),
  { ssr: false }
)

// ── Motorcycle SVG Logo Icon ──────────────────────────────────────────────────
function MotorcycleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 32"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="9" cy="24" r="2" />
      <circle cx="39" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="39" cy="24" r="2" />
      <path
        d="M9 24 L14 14 L22 14 L28 10 L36 14 L39 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M17 14 L24 8 L31 8 L36 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M38 10 L42 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="9" r="2.5" />
    </svg>
  )
}

const PRIMARY_DRAWER_ITEMS = [
  { label: "الرئيسية", href: "/", icon: <Home className="w-5 h-5" /> },
  { label: "الأقسام", href: "/categories", icon: <LayoutGrid className="w-5 h-5" /> },
  { label: "حسابي", href: "/account", icon: <User className="w-5 h-5" /> },
  { label: "طلباتي", href: "/orders", icon: <Package className="w-5 h-5" /> },
]

const SECONDARY_DRAWER_ITEMS = [
  { label: "عروض جامدة", href: "/offers", icon: <BadgePercent className="w-5 h-5" /> },
  { label: "احنا مين", href: "/about", icon: <Info className="w-5 h-5" /> },
  { label: "الأسئلة الشائعة", href: "/faq", icon: <MessageCircleQuestion className="w-5 h-5" /> },
  { label: "تواصل معنا", href: "/contact", icon: <Phone className="w-5 h-5" /> },
  { label: "الشروط والأحكام", href: "/terms", icon: <Info className="w-5 h-5" /> },
  { label: "سياسة الخصوصية", href: "/privacy", icon: <Info className="w-5 h-5" /> },
]

const QUICK_SEARCH_TERMS = [
  "عروض",
  "الأكثر طلبًا",
  "تيشيرتات",
  "طعام",
  "ألعاب أطفال",
  "صيدلية",
]

// ── Search Results Component ────────────────────────────────────────────
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

function SearchResults({ query, onSelect, mobile = false }: { query: string; onSelect: () => void; mobile?: boolean }) {
  const router = useRouter()
  const [matchedProducts, setMatchedProducts] = React.useState<SearchResultProduct[]>([])
  const [matchedCategories, setMatchedCategories] = React.useState<SearchResultCategory[]>([])
  const [isLoadingResults, setIsLoadingResults] = React.useState(false)

  const trimmed = query.trim().toLowerCase()

  if (!trimmed || trimmed.length < 2) return null

  React.useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const runSearch = async () => {
      try {
        setIsLoadingResults(true)
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Search failed')
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
          : "absolute left-0 right-0 top-full z-50 mt-3"
      )}
    >
      {isLoadingResults ? (
        <div className="p-6 text-center">
          <Search className="w-8 h-8 text-primary/60 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500 text-sm font-bold">بندورلك على المنتج...</p>
        </div>
      ) : !hasResults ? (
        <div className="p-6 text-center">
          <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-bold">مفيش نتايج لـ "{query}"</p>
          <p className="text-gray-400 text-xs mt-1">جرّب كلمة تانية أو لف في الأقسام</p>
        </div>
      ) : (
        <>
          {/* Category matches */}
          {matchedCategories.length > 0 && (
            <div className="p-2 border-b border-surface-hover">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 py-1">الأقسام</p>
              {matchedCategories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.id}`}
                  onClick={onSelect}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{cat.name}</span>
                  <ChevronLeft className="w-4 h-4 text-gray-400 ms-auto" />
                </Link>
              ))}
            </div>
          )}

          {/* Product matches */}
          {matchedProducts.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 py-1">المنتجات</p>
              {matchedProducts.map(product => {
                let displayPrice = product.price
                if (product.discount_percentage && product.discount_percentage > 0) {
                  displayPrice = Math.round(product.price * (1 - product.discount_percentage / 100))
                }
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={onSelect}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors group"
                  >
                    <div className="relative w-12 h-12 rounded-xl bg-surface-lighter overflow-hidden shrink-0 border border-surface-hover">
                      <Image
                        src={product.image_url || (product.specifications as any)?.image_url || "/icon-192x192.svg"}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.name}</p>
                      <p className="text-xs text-gray-500">{Array.isArray(product.categories) ? product.categories[0]?.name || '' : product.categories?.name || ''}</p>
                    </div>
                    <span className="text-sm font-black text-primary shrink-0">{displayPrice} ج.م</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* View all results link */}
          <div className="p-2 border-t border-surface-hover">
            <button
              onClick={() => {
                router.push(`/category/all?q=${encodeURIComponent(query)}`)
                onSelect()
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              <Search className="w-4 h-4" />
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
  categories: { id: string; name: string }[]
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
          : "absolute left-0 right-0 top-full z-50 mt-3 p-4"
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

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount } = useCart()
  const { user, profile } = useAuth()
  const { categories, ensureCategoriesLoaded } = useProducts()
  const { settings: appSettings } = useAppSettings()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false)

  // Search state
  const [desktopQuery, setDesktopQuery] = React.useState("")
  const [mobileQuery, setMobileQuery] = React.useState("")
  const [showDesktopResults, setShowDesktopResults] = React.useState(false)
  const desktopSearchRef = React.useRef<HTMLDivElement>(null)
  const deferredDesktopQuery = React.useDeferredValue(desktopQuery)
  const deferredMobileQuery = React.useDeferredValue(mobileQuery)
  const [isClient, setIsClient] = React.useState(false)

  // Close desktop dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setShowDesktopResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true)
  }

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false)
    await signOut();
    
    toast.success("تم تسجيل الخروج", {
      description: "هتوحشنا، مستنيينك ترجع قريب! 👋"
    })
    
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 500)
  }

  React.useEffect(() => {
    const overflow = isMobileMenuOpen || isSearchOpen ? "hidden" : "unset"
    document.body.style.overflow = overflow
    return () => { document.body.style.overflow = "unset" }
  }, [isMobileMenuOpen, isSearchOpen])

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  const warmCategories = React.useCallback(() => {
    void ensureCategoriesLoaded()
  }, [ensureCategoriesLoaded])

  const userDisplayName = profile?.full_name || user?.email?.split('@')[0] || "حسابي"
  const userInitial = userDisplayName.trim().charAt(0)
  const siteTagline = appSettings.siteTagline || "طلباتك رايقة ووصلالك بسرعة"
  const hideMobileInlineSearch = pathname?.startsWith("/product/")

  const handleDesktopSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && desktopQuery.trim()) {
      router.push(`/category/all?q=${encodeURIComponent(desktopQuery.trim())}`)
      setShowDesktopResults(false)
      setDesktopQuery("")
    }
  }

  const handleMobileSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && mobileQuery.trim()) {
      router.push(`/category/all?q=${encodeURIComponent(mobileQuery.trim())}`)
      setIsSearchOpen(false)
      setMobileQuery("")
    }
  }

  const pickDesktopQuickSearch = (term: string) => {
    router.push(`/category/all?q=${encodeURIComponent(term)}`)
    setShowDesktopResults(false)
    setDesktopQuery("")
  }

  const pickMobileQuickSearch = (term: string) => {
    router.push(`/category/all?q=${encodeURIComponent(term)}`)
    setIsSearchOpen(false)
    setMobileQuery("")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-[#101816]/95 text-white backdrop-blur-sm shadow-[var(--shadow-material-2)]">

      {/* ── Main header row ─────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-3 px-4 sm:px-6 transition-all duration-300">

        {/* Mobile: Hamburger */}
        <button
          onClick={() => {
            warmCategories()
            setIsMobileMenuOpen(true)
          }}
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-2xl text-white/70 hover:text-white hover:bg-white/6 active:scale-95 transition-all shrink-0"
          aria-label="القائمة"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <Image
            src="/icon-192x192.svg"
            alt="في السكة Logo"
            width={40}
            height={40}
            className="rounded-2xl shadow-[var(--shadow-material-2)] ring-1 ring-primary/10 group-hover:shadow-[var(--shadow-material-3)] transition-all"
          />
          <div className="hidden sm:flex flex-col leading-none">
            <div className="flex items-baseline gap-0" style={{ fontFamily: 'var(--font-lalezar), serif' }}>
              <span className="font-black text-2xl text-white">فِي&nbsp;</span>
              <span className="font-black text-2xl text-primary">السِّكَّةِ</span>
            </div>
            <span className="mt-1 text-[10px] font-bold tracking-[0.12em] text-white/45">{siteTagline}</span>
          </div>
        </Link>

        {/* ── Desktop search bar with autocomplete ──────────────────────────── */}
        <div className="hidden md:flex flex-1 max-w-xl px-4" ref={desktopSearchRef}>
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-white/55">
              <Search className="h-4 w-4" />
            </div>
            <Input
              type="search"
              placeholder="بتدور على إيه النهاردة؟..."
              className="h-12 w-full rounded-full border-white/6 bg-white/6 ps-10 pe-4 text-sm text-white placeholder:text-white/40 shadow-none focus-visible:ring-primary/30"
              value={desktopQuery}
              onChange={(e) => {
                warmCategories()
                setDesktopQuery(e.target.value)
                setShowDesktopResults(true)
              }}
              onFocus={() => {
                warmCategories()
                setShowDesktopResults(true)
              }}
              onKeyDown={handleDesktopSearch}
            />
            {/* Autocomplete dropdown */}
            {showDesktopResults && (
              deferredDesktopQuery.trim().length >= 2 ? (
                <SearchResults
                  query={deferredDesktopQuery}
                  onSelect={() => {
                    setShowDesktopResults(false)
                    setDesktopQuery("")
                  }}
                />
              ) : (
                <SearchDiscoveryPanel
                  categories={categories}
                  onSelect={() => setShowDesktopResults(false)}
                  onPickTerm={pickDesktopQuickSearch}
                />
              )
            )}
          </div>
        </div>

        {/* ── Desktop-only action area ────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-2 ms-auto">
          <Link href="/offers" className="material-chip !border-rose-300/24 !bg-rose-400/12 !text-rose-100 !shadow-[var(--shadow-material-1)] hover:!border-rose-300/35 hover:!bg-rose-400/16 font-heading text-sm font-semibold transition-colors">
            <BadgePercent className="h-4 w-4" />
            عروض جامدة
          </Link>

          {user ? (
            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/6 px-2.5 py-1.5 shadow-[var(--shadow-material-1)]">
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-full px-1.5 py-0.5 transition-colors hover:bg-white/6"
                aria-label="افتح حسابي"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#17231f] text-sm font-black text-primary shadow-[var(--shadow-material-1)]">
                  {profile?.profile_picture ? (
                    <Image
                      src={profile.profile_picture}
                      alt={userDisplayName}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-bold text-white">{userDisplayName}</span>
                  <span className="mt-1 text-[11px] text-white/55">حسابي</span>
                </div>
              </Link>
              <NotificationBell />
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/6 flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>ادخل</span>
              </Button>
            </Link>
          )}

          <Link href="/cart" aria-label="سلة المشتريات" className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/6 text-white/72 shadow-[var(--shadow-material-1)] transition-all hover:-translate-y-0.5 hover:text-white hover:shadow-[var(--shadow-material-2)]">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-background">{cartCount}</span>}
          </Link>
        </div>

        {/* ── Mobile top-right utility icons ─────────────────────────────────── */}
        <div className="ms-auto flex items-center gap-1 md:hidden">
          <Link href="/offers">
            <button
              className="relative flex items-center justify-center w-10 h-10 rounded-2xl text-white/70 hover:text-white hover:bg-white/6 active:scale-95 transition-all"
              aria-label="العروض"
            >
              <BadgePercent className="h-5 w-5" />
              <span className="absolute top-2 end-2 flex h-2 w-2 rounded-full bg-rose-500">
                <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              </span>
            </button>
          </Link>

          {user && <NotificationBell />}

          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-2xl text-white/70 hover:text-white hover:bg-white/6 active:scale-95 transition-all"
            aria-label="السلة"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute top-1.5 end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">{cartCount}</span>}
          </Link>
        </div>

      </div>

      {/* ── Mobile inline search bar ── */}
      {!hideMobileInlineSearch && (
        <div className="md:hidden border-t border-white/8 bg-[#101816] px-3 pb-3 pt-2">
          <button
            onClick={() => {
              warmCategories()
              setIsSearchOpen(true)
            }}
            className="flex h-12 w-full items-center gap-3 rounded-[24px] border border-white/8 bg-white/6 px-4 text-start text-sm text-white/55 shadow-[var(--shadow-material-1)] transition-colors hover:bg-white/8"
            aria-label="ابحث عن منتج"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>بتدوّر على إيه؟ اكتب هنا...</span>
          </button>
        </div>
      )}

      {/* ── SEARCH OVERLAY (full-screen mobile) ───────────────────────────────────── */}
      {isSearchOpen && isClient && createPortal((
        <div className="fixed inset-0 z-[140] flex flex-col bg-background">
          {/* Search header */}
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
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                onKeyDown={handleMobileSearch}
              />
            </div>
            <button
              onClick={() => { setIsSearchOpen(false); setMobileQuery("") }}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-white/65 hover:text-white hover:bg-white/6 active:scale-95 transition-all shrink-0"
              aria-label="إغلاق البحث"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-[140] flex-1 overflow-y-auto">
            {deferredMobileQuery.trim().length >= 2 ? (
              /* Live search results */
              <SearchResults
                query={deferredMobileQuery}
                mobile
                onSelect={() => { setIsSearchOpen(false); setMobileQuery("") }}
              />
            ) : (
              <SearchDiscoveryPanel
                mobile
                categories={categories}
                onSelect={() => { setIsSearchOpen(false); setMobileQuery("") }}
                onPickTerm={pickMobileQuickSearch}
              />
            )}
          </div>
        </div>
      ), document.body)}

      {/* ── MOBILE NAVIGATION DRAWER ───────────────────────────────────────── */}
      {isMobileMenuOpen && isClient && createPortal((
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
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
                  <div className="flex items-baseline gap-0 leading-none" style={{ fontFamily: 'var(--font-lalezar), serif' }}>
                    <span className="font-black text-lg text-white">فِي&nbsp;</span>
                    <span className="font-black text-lg text-primary">السِّكَّةِ</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/45">{siteTagline}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-white/60 hover:text-white hover:bg-white/6 active:scale-95 transition-all"
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
                {PRIMARY_DRAWER_ITEMS.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "my-1 flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                        isActive ? "bg-primary/12 text-primary" : "text-white hover:bg-white/6"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? "text-primary" : "text-white/62"}>{item.icon}</span>
                        <span className="font-bold text-sm">{item.label}</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-white/35" />
                    </Link>
                  )
                })}
              </div>

              <div className="mt-5">
                <p className="mb-2 px-2 text-[11px] font-black tracking-[0.18em] text-white/38">معلومات ومساعدة</p>
                {SECONDARY_DRAWER_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "my-1 flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors",
                      isActive ? "bg-primary/12 text-primary" : "text-white hover:bg-white/6"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-primary" : "text-white/62"}>{item.icon}</span>
                      <span className="font-bold text-sm">{item.label}</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-white/35" />
                  </Link>
                )
                })}
              </div>

              {!user ? (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-5 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3.5 text-primary transition-colors hover:bg-primary/14"
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5" />
                    <span className="font-bold text-sm">ادخل أو اعمل حساب</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-primary/70" />
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleLogoutClick()
                  }}
                  className="mt-5 flex w-full items-center justify-between rounded-2xl border border-rose-400/14 bg-rose-500/8 px-4 py-3.5 text-rose-300 transition-colors hover:bg-rose-500/12"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold text-sm">تسجيل الخروج</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-rose-200/70" />
                </button>
              )}
            </nav>

            <div className="border-t border-white/8 p-4">
              <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
                <p className="mb-1 text-sm font-bold text-white">محتاج حد يساعدك؟ 💬</p>
                <p className="mb-3 text-xs text-white/58">فريقنا موجود علشانك في أي وقت لو محتاج تسأل أو تستفسر.</p>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-primary-hover active:scale-95"
                >
                  تواصل معنا
                </Link>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </header>
  )
}

