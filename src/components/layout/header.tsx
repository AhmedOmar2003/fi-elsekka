"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../ui/button"
import {
  Menu, Search, User, ShoppingBag, BadgePercent, X,
  ChevronLeft, Home, LayoutGrid, Package, Phone, Settings, HelpCircle,
  Info, MessageCircleQuestion, LogOut, LogIn, ShoppingCart, ShieldCheck, HeartPulse, Sparkles
} from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { useProducts } from "@/contexts/ProductsContext"
import { signOut } from "@/services/authService"
import { LogoutModal } from "@/components/ui/logout-modal"
import { ThemeToggle } from "../ui/theme-toggle"
import { toast } from "sonner"

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

const DRAWER_ITEMS = [
  { label: "الرئيسية", href: "/", icon: <Home className="w-5 h-5" /> },
  { label: "الأقسام", href: "/categories", icon: <LayoutGrid className="w-5 h-5" /> },
  { label: "حسابي", href: "/account", icon: <User className="w-5 h-5" /> },
  { label: "طلباتي", href: "/orders", icon: <Package className="w-5 h-5" /> },
  { label: "اعرف عنا", href: "/about", icon: <Info className="w-5 h-5" /> },
  { label: "الأسئلة الشائعة", href: "/faq", icon: <MessageCircleQuestion className="w-5 h-5" /> },
  { label: "تواصل معنا", href: "/contact", icon: <Phone className="w-5 h-5" /> },
  { label: "الدعم", href: "/support", icon: <HelpCircle className="w-5 h-5" /> },
  { label: "الإعدادات", href: "/settings", icon: <Settings className="w-5 h-5" /> },
]

// ── Search Results Component ────────────────────────────────────────────
function SearchResults({ query, onSelect }: { query: string; onSelect: () => void }) {
  const router = useRouter()
  const { products, categories } = useProducts()
  
  const trimmed = query.trim().toLowerCase()
  
  const matchedProducts = React.useMemo(() => {
    if (!trimmed || trimmed.length < 2) return []
    return products
      .filter(p => p.name.toLowerCase().includes(trimmed))
      .slice(0, 6)
  }, [products, trimmed])

  const matchedCategories = React.useMemo(() => {
    if (!trimmed || trimmed.length < 2) return []
    return categories.filter(c => c.name.toLowerCase().includes(trimmed)).slice(0, 3)
  }, [categories, trimmed])

  if (!trimmed || trimmed.length < 2) return null

  const hasResults = matchedProducts.length > 0 || matchedCategories.length > 0

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-surface-hover rounded-2xl shadow-premium overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
      {!hasResults ? (
        <div className="p-6 text-center">
          <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-bold">مفيش نتايج لـ "{query}"</p>
          <p className="text-gray-400 text-xs mt-1">جرب كلمة تانية أو تصفح الأقسام</p>
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
                    <div className="w-12 h-12 rounded-xl bg-surface-lighter overflow-hidden shrink-0 border border-surface-hover">
                      <img
                        src={product.image_url || (product.specifications as any)?.image_url || ''}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.name}</p>
                      <p className="text-xs text-gray-500">{(product.categories as any)?.name || ''}</p>
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
              عرض كل النتايج لـ "{query}"
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount } = useCart()
  const { user, profile } = useAuth()
  const { categories } = useProducts()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false)

  // Search state
  const [desktopQuery, setDesktopQuery] = React.useState("")
  const [mobileQuery, setMobileQuery] = React.useState("")
  const [showDesktopResults, setShowDesktopResults] = React.useState(false)
  const desktopSearchRef = React.useRef<HTMLDivElement>(null)

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
      window.location.reload();
    }, 500)
  }

  React.useEffect(() => {
    const overflow = isMobileMenuOpen || isSearchOpen ? "hidden" : "unset"
    document.body.style.overflow = overflow
    return () => { document.body.style.overflow = "unset" }
  }, [isMobileMenuOpen, isSearchOpen])

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-hover bg-background/90 backdrop-blur-lg">

      {/* ── Main header row ─────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">

        {/* Mobile: Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-foreground hover:bg-surface-hover active:scale-95 transition-all shrink-0"
          aria-label="القائمة"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <img 
            src="/icon-192x192.svg" 
            alt="في السكة Logo" 
            className="w-10 h-10 rounded-xl shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow" 
          />
          <div className="hidden sm:flex items-baseline gap-0 leading-none" style={{ fontFamily: 'var(--font-lalezar), serif' }}>
            <span className="font-black text-2xl text-foreground drop-shadow-sm">فِي&nbsp;</span>
            <span className="font-black text-2xl text-primary drop-shadow-sm">السِّكَّةِ</span>
          </div>
        </Link>

        {/* ── Desktop search bar with autocomplete ──────────────────────────── */}
        <div className="hidden md:flex flex-1 max-w-lg px-4" ref={desktopSearchRef}>
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-500">
              <Search className="h-4 w-4" />
            </div>
            <Input
              type="search"
              placeholder="بتدور على إيه النهاردة؟..."
              className="h-10 w-full rounded-full bg-surface-hover ps-10 border-transparent focus-visible:bg-surface focus-visible:border-primary focus-visible:ring-0 text-sm"
              value={desktopQuery}
              onChange={(e) => {
                setDesktopQuery(e.target.value)
                setShowDesktopResults(true)
              }}
              onFocus={() => desktopQuery.trim().length >= 2 && setShowDesktopResults(true)}
              onKeyDown={handleDesktopSearch}
            />
            {/* Autocomplete dropdown */}
            {showDesktopResults && desktopQuery.trim().length >= 2 && (
              <SearchResults
                query={desktopQuery}
                onSelect={() => {
                  setShowDesktopResults(false)
                  setDesktopQuery("")
                }}
              />
            )}
          </div>
        </div>

        {/* ── Desktop-only action area ────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3 ms-auto">
          <Link href="/offers" className="font-heading flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-rose-400 transition-colors">
            <BadgePercent className="h-4 w-4" />
            عروض جامدة
          </Link>

          {user ? (
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm font-bold text-foreground">{profile?.full_name || user.email?.split('@')[0]}</span>
              <Button variant="ghost" size="icon" onClick={handleLogoutClick} className="text-gray-500 hover:text-rose-500 hover:bg-rose-500/10" title="تسجيل الخروج">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" className="text-gray-500 hover:text-foreground flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>دخول</span>
              </Button>
            </Link>
          )}

          <ThemeToggle />

          <Link href="/cart" className="relative text-gray-500 hover:text-foreground bg-surface-hover/50 hover:bg-surface-hover w-10 h-10 flex items-center justify-center rounded-full transition-all">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-background">{cartCount}</span>}
          </Link>
        </div>

        {/* ── Mobile top-right utility icons ─────────────────────────────────── */}
        <div className="flex md:hidden items-center gap-0.5 ms-auto">
          <Link href="/offers">
            <button
              className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-foreground hover:bg-surface-hover active:scale-95 transition-all"
              aria-label="العروض"
            >
              <BadgePercent className="h-5 w-5" />
              <span className="absolute top-2 end-2 flex h-2 w-2 rounded-full bg-rose-500">
                <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              </span>
            </button>
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-foreground hover:bg-surface-hover active:scale-95 transition-all"
            aria-label="السلة"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute top-1.5 end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">{cartCount}</span>}
          </Link>
        </div>

      </div>

      {/* ── Mobile inline search bar ── */}
      <div className="md:hidden px-4 pb-3 pt-1">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-3 w-full h-10 rounded-full bg-surface-hover px-4 text-sm text-gray-500 hover:bg-surface-lighter transition-colors text-start"
          aria-label="ابحث عن منتج"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>بتدور على إيه؟ ابحث هنا...</span>
        </button>
      </div>

      {/* ── SEARCH OVERLAY (full-screen mobile) ───────────────────────────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          {/* Search header */}
          <div className="flex items-center gap-3 p-4 border-b border-surface-hover bg-surface">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-500">
                <Search className="h-5 w-5" />
              </div>
              <Input
                type="search"
                placeholder="بتدور على إيه؟..."
                className="h-12 w-full rounded-2xl bg-background ps-11 text-base border-surface-hover focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                autoFocus
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                onKeyDown={handleMobileSearch}
              />
            </div>
            <button
              onClick={() => { setIsSearchOpen(false); setMobileQuery("") }}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-foreground hover:bg-surface-hover active:scale-95 transition-all shrink-0"
              aria-label="إغلاق البحث"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {mobileQuery.trim().length >= 2 ? (
              /* Live search results */
              <SearchResults
                query={mobileQuery}
                onSelect={() => { setIsSearchOpen(false); setMobileQuery("") }}
              />
            ) : (
              /* Default: category suggestions */
              <div className="p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">تصفح الأقسام</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.id}`}
                      onClick={() => { setIsSearchOpen(false); setMobileQuery("") }}
                      className="flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-surface-hover text-sm font-bold text-foreground hover:border-primary/30 active:scale-95 transition-all"
                    >
                      <LayoutGrid className="w-4 h-4 text-primary" />
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MOBILE NAVIGATION DRAWER ───────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative ms-auto w-4/5 max-w-xs bg-surface h-full flex flex-col shadow-premium border-s border-surface-hover">
            <div className="flex items-center justify-between p-4 border-b border-surface-hover">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
                  <MotorcycleIcon className="w-5 h-5" />
                </div>
                <span className="font-heading font-black text-lg text-foreground">في السكة</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-foreground hover:bg-surface-hover active:scale-95 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2">
              {DRAWER_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 border-b border-surface-hover/50 hover:bg-surface-hover transition-colors",
                      isActive ? "text-primary bg-primary/5" : "text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-primary" : "text-gray-500"}>{item.icon}</span>
                      <span className="font-bold text-sm">{item.label}</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </Link>
                )
              })}

              {!user ? (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 border-b border-surface-hover/50 hover:bg-primary/10 transition-colors text-primary"
                >
                  <div className="flex items-center gap-3">
                    <LogIn className="w-5 h-5" />
                    <span className="font-bold text-sm">تسجيل الدخول / إنشاء حساب</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    handleLogoutClick()
                  }}
                  className="flex w-full items-center justify-between px-4 py-3.5 border-b border-surface-hover/50 hover:bg-rose-500/10 transition-colors text-rose-500"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold text-sm">تسجيل الخروج</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              )}

              <Link
                href="/offers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3.5 border-b border-surface-hover/50 hover:bg-rose-500/5 transition-colors text-secondary"
              >
                <div className="flex items-center gap-3">
                  <BadgePercent className="w-5 h-5" />
                  <span className="font-bold text-sm">أفضل العروض</span>
                  <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-bold">جديد</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </Link>
            </nav>

            <div className="p-4 border-t border-surface-hover">
              <div className="bg-gradient-to-br from-primary/15 to-transparent p-4 rounded-2xl border border-primary/20 bg-surface">
                <p className="font-bold text-primary text-sm mb-1">محتاج مساعدة؟ 💬</p>
                <p className="text-xs text-gray-500 mb-3">فريق خدمة العملاء موجود عشانك</p>
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center text-sm font-bold bg-primary text-white py-2.5 rounded-xl hover:bg-primary-hover active:scale-95 transition-all"
                >
                  تواصل معنا
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </header>
  )
}
