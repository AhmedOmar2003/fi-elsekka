"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../ui/button"
import {
  Menu, Search, User, ShoppingBag, BadgePercent,
  Home, LayoutGrid, Package, Phone,
  Info, MessageCircleQuestion, LogOut, LogIn
} from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { signOut } from "@/services/authService"
import { useAppSettings } from "@/contexts/AppSettingsContext"
import { fetchCategories, type Category } from "@/services/categoriesService"
import { toast } from "sonner"

const NotificationBell = dynamic(
  () => import("../ui/notification-bell").then((mod) => mod.NotificationBell),
  { ssr: false }
)

const LogoutModal = dynamic(
  () => import("@/components/ui/logout-modal").then((mod) => mod.LogoutModal),
  { ssr: false }
)

const HeaderSearchPanel = dynamic(
  () => import("./header-overlays").then((mod) => mod.HeaderSearchPanel),
  { ssr: false }
)

const HeaderSearchOverlay = dynamic(
  () => import("./header-overlays").then((mod) => mod.HeaderSearchOverlay),
  { ssr: false }
)

const HeaderMobileMenuDrawer = dynamic(
  () => import("./header-overlays").then((mod) => mod.HeaderMobileMenuDrawer),
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

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { cartCount } = useCart()
  const { user, profile } = useAuth()
  const { settings: appSettings } = useAppSettings()
  const [categories, setCategories] = React.useState<Category[]>([])
  const categoriesLoadedRef = React.useRef(false)
  const categoriesLoadingRef = React.useRef(false)

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
    if (categoriesLoadedRef.current || categoriesLoadingRef.current) return

    categoriesLoadingRef.current = true

    void fetchCategories()
      .then((data) => {
        setCategories(data)
        categoriesLoadedRef.current = true
      })
      .catch(() => {
        setCategories([])
      })
      .finally(() => {
        categoriesLoadingRef.current = false
      })
  }, [])

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
            priority
            fetchPriority="high"
            sizes="40px"
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
              <HeaderSearchPanel
                query={deferredDesktopQuery}
                categories={categories}
                onSelect={() => {
                  setShowDesktopResults(false)
                  setDesktopQuery("")
                }}
                onPickTerm={pickDesktopQuickSearch}
              />
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
          <Link
            href="/offers"
            className="relative flex items-center justify-center w-10 h-10 rounded-2xl text-white/70 hover:text-white hover:bg-white/6 active:scale-95 transition-all"
            aria-label="العروض"
          >
            <BadgePercent className="h-5 w-5" />
            <span className="absolute top-2 end-2 flex h-2 w-2 rounded-full bg-rose-500">
              <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            </span>
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
      <HeaderSearchOverlay
        isOpen={isSearchOpen}
        isClient={isClient}
        query={mobileQuery}
        categories={categories}
        onChangeQuery={setMobileQuery}
        onClose={() => {
          setIsSearchOpen(false)
          setMobileQuery("")
        }}
        onKeyDown={handleMobileSearch}
        onPickTerm={pickMobileQuickSearch}
      />

      {/* ── MOBILE NAVIGATION DRAWER ───────────────────────────────────────── */}
      <HeaderMobileMenuDrawer
        isOpen={isMobileMenuOpen}
        isClient={isClient}
        pathname={pathname}
        siteTagline={siteTagline}
        user={user}
        primaryItems={PRIMARY_DRAWER_ITEMS}
        secondaryItems={SECONDARY_DRAWER_ITEMS}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={() => {
          setIsMobileMenuOpen(false)
          handleLogoutClick()
        }}
      />

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </header>
  )
}

