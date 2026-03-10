"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../ui/button"
import {
  Menu, Search, User, ShoppingBag, BadgePercent, X,
  ChevronLeft, Home, LayoutGrid, Package, Phone, Settings, HelpCircle
} from "lucide-react"

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
      {/* Rear wheel */}
      <circle cx="9" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="9" cy="24" r="2" />
      {/* Front wheel */}
      <circle cx="39" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="39" cy="24" r="2" />
      {/* Body / frame */}
      <path
        d="M9 24 L14 14 L22 14 L28 10 L36 14 L39 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Seat / fairing */}
      <path
        d="M17 14 L24 8 L31 8 L36 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Handlebar */}
      <path d="M38 10 L42 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Rider silhouette hint */}
      <circle cx="26" cy="9" r="2.5" />
    </svg>
  )
}

const DRAWER_ITEMS = [
  { label: "الرئيسية",    href: "/",           icon: <Home       className="w-5 h-5" /> },
  { label: "الأقسام",    href: "/categories",  icon: <LayoutGrid className="w-5 h-5" /> },
  { label: "حسابي",      href: "/account",     icon: <User       className="w-5 h-5" /> },
  { label: "طلباتي",     href: "/orders",      icon: <Package    className="w-5 h-5" /> },
  { label: "تواصل معنا", href: "/contact",     icon: <Phone      className="w-5 h-5" /> },
  { label: "الدعم",      href: "/support",     icon: <HelpCircle className="w-5 h-5" /> },
  { label: "الإعدادات",  href: "/settings",    icon: <Settings   className="w-5 h-5" /> },
]

export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchOpen,     setIsSearchOpen]     = React.useState(false)

  React.useEffect(() => {
    const overflow = isMobileMenuOpen || isSearchOpen ? "hidden" : "unset"
    document.body.style.overflow = overflow
    return () => { document.body.style.overflow = "unset" }
  }, [isMobileMenuOpen, isSearchOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-hover bg-background/90 backdrop-blur-lg">
      
      {/* ── Main header row ─────────────────────────────────────────────────── */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">

        {/* Mobile: Hamburger (left, since RTL = visual right) */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover active:scale-95 transition-all shrink-0"
          aria-label="القائمة"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          {/* Icon badge */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
            <MotorcycleIcon className="w-7 h-7" />
          </div>
          {/* Brand name — hidden on very small screens, shown sm+ */}
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-heading font-black text-lg tracking-tight text-foreground leading-tight">
              في السكة
            </span>
            <span className="text-[10px] text-primary font-medium tracking-wide opacity-80">
              بالسكة الصح
            </span>
          </div>
        </Link>

        {/* ── Desktop search bar (hidden on mobile) ──────────────────────────── */}
        <div className="hidden md:flex flex-1 max-w-lg px-4">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-500">
              <Search className="h-4 w-4" />
            </div>
            <Input
              type="search"
              placeholder="بتدور على إيه النهاردة؟..."
              className="h-10 w-full rounded-full bg-surface-hover ps-10 border-transparent focus-visible:bg-surface focus-visible:border-primary focus-visible:ring-0 text-sm"
            />
          </div>
        </div>

        {/* ── Desktop-only action area ────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3 ms-auto">
          <Link href="/offers" className="font-heading flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-rose-400 transition-colors">
            <BadgePercent className="h-4 w-4" />
            عروض جامدة
          </Link>
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
            <User className="h-5 w-5" />
          </Button>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white bg-surface-hover/50 hover:bg-surface-hover rounded-full transition-all">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-background">0</span>
            </Button>
          </Link>
        </div>

        {/* ── Mobile top-right utility icons ─────────────────────────────────── */}
        <div className="flex md:hidden items-center gap-0.5 ms-auto">
          {/* Icon 1: Offers */}
          <Link href="/offers">
            <button
              className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover active:scale-95 transition-all"
              aria-label="العروض"
            >
              <BadgePercent className="h-5 w-5" />
              {/* Live pulse badge */}
              <span className="absolute top-2 end-2 flex h-2 w-2 rounded-full bg-rose-500">
                <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              </span>
            </button>
          </Link>

          {/* Icon 3: Cart (visible on mobile too) */}
          <Link href="/cart">
            <button
              className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover active:scale-95 transition-all"
              aria-label="السلة"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute top-1.5 end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">0</span>
            </button>
          </Link>
        </div>

      </div>

      {/* ── Mobile inline search bar – always visible below header on mobile ── */}
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

      {/* ── SEARCH OVERLAY (full-screen) ───────────────────────────────────── */}
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
              />
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover active:scale-95 transition-all shrink-0"
              aria-label="إغلاق البحث"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Recent searches */}
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">عمليات بحث سابقة</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {["منظفات", "عروض الجبن", "شامبو بانتين", "بامبرز", "زيت نخيل"].map(term => (
                <button
                  key={term}
                  className="flex items-center gap-1.5 bg-surface-hover px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-surface-lighter hover:text-white active:scale-95 transition-all"
                >
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  {term}
                </button>
              ))}
            </div>

            {/* Suggested categories */}
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">تصفح قسم</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "سوبر ماركت", color: "from-emerald-500/20" },
                { label: "صيدلية", color: "from-blue-500/20" },
                { label: "موضة", color: "from-rose-500/20" },
                { label: "إلكترونيات", color: "from-slate-500/20" },
              ].map(cat => (
                <button
                  key={cat.label}
                  onClick={() => setIsSearchOpen(false)}
                  className={`flex items-center gap-2 p-3 rounded-2xl bg-gradient-to-br ${cat.color} to-transparent border border-surface-hover text-sm font-bold text-gray-200 hover:border-gray-500 active:scale-95 transition-all`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE NAVIGATION DRAWER ───────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer panel (right side in RTL) */}
          <div className="relative ms-auto w-4/5 max-w-xs bg-surface h-full flex flex-col shadow-premium border-s border-surface-hover">
            
            {/* Drawer header with logo */}
            <div className="flex items-center justify-between p-4 border-b border-surface-hover">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
                  <MotorcycleIcon className="w-5 h-5" />
                </div>
                <span className="font-heading font-black text-lg text-foreground">في السكة</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover active:scale-95 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
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
                      isActive ? "text-primary bg-primary/5" : "text-gray-200"
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

              {/* Offers highlight row */}
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

            {/* Support CTA */}
            <div className="p-4 border-t border-surface-hover">
              <div className="bg-gradient-to-br from-primary/15 to-transparent p-4 rounded-2xl border border-primary/20">
                <p className="font-bold text-primary text-sm mb-1">محتاج مساعدة؟ 💬</p>
                <p className="text-xs text-gray-400 mb-3">فريق خدمة العملاء موجود عشانك</p>
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
    </header>
  )
}
