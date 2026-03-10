"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Menu, Search, User, ShoppingBag, BadgePercent, X, ChevronLeft } from "lucide-react"

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)

  // Prevent background scrolling when overlays are open
  React.useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileMenuOpen, isSearchOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-hover bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <Button variant="ghost" size="icon" aria-label="القائمة" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Logo */}
        <div className="flex shrink-0 items-center justify-center md:justify-start">
          <Link href="/" className="flex items-center gap-2">
            {/* Simple logo mock for now */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-xl shadow-lg shadow-primary/20">
              في
            </div>
            <span className="font-heading hidden text-xl font-black tracking-tight text-foreground sm:block">
              في السكة
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="hidden flex-1 px-8 md:flex max-w-lg">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-500">
               <Search className="h-5 w-5" />
            </div>
            <Input 
              type="search" 
              placeholder="بتدور على إيه النهاردة؟..." 
              className="h-11 w-full rounded-full bg-surface-hover ps-11 border-transparent focus-visible:bg-surface focus-visible:border-primary focus-visible:ring-0" 
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-4">
          
          {/* Mobile Top Action 1: Search */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-gray-300 hover:text-white" 
            aria-label="بحث"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-6 w-6" />
          </Button>

          {/* Mobile Top Action 2 & Desktop Offer Link: Offers/Notifications */}
          <Link href="/offers" className="hidden lg:flex font-heading items-center gap-2 text-sm font-semibold text-secondary hover:text-rose-400 transition-colors">
            <BadgePercent className="h-5 w-5" />
            عروض جامدة
          </Link>
          <Link href="/offers" className="md:hidden">
             <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white" aria-label="عروض أو إشعارات">
                <BadgePercent className="h-6 w-6" />
                <span className="absolute top-1 end-1 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
             </Button>
          </Link>
          
          {/* Desktop Only Actions */}
          <Button variant="ghost" size="icon" className="hidden md:flex relative text-gray-300 hover:text-white">
            <User className="h-6 w-6" />
          </Button>
          <Link href="/cart" className="hidden md:block">
            <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white bg-surface-hover/50 hover:bg-surface-hover rounded-full transition-all">
              <ShoppingBag className="h-6 w-6" />
              <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
                0
              </span>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* --- MOBILE SEARCH FULL-SCREEN OVERLAY --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-surface-hover bg-surface">
            <div className="relative flex-1 me-3">
               <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-500">
                  <Search className="h-5 w-5" />
               </div>
               <Input 
                 type="search" 
                 placeholder="بتدور على إيه؟..." 
                 className="h-12 w-full rounded-2xl bg-background ps-11 text-base border-surface-hover focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                 autoFocus 
               />
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)} aria-label="إغلاق البحث" className="text-gray-400 hover:text-white shrink-0">
               <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
             <h3 className="text-sm font-bold text-gray-400 mb-4">عمليات بحث سابقة</h3>
             <div className="flex flex-wrap gap-2">
                {["منظفات", "عروض الجبن", "شامبو بانتين", "بامبرز"].map(term => (
                   <span key={term} className="bg-surface-hover px-4 py-2 rounded-xl text-sm text-gray-300 flex items-center gap-1 cursor-pointer hover:bg-surface-lighter transition-colors">
                     <Search className="w-3 h-3 text-gray-500" /> {term}
                   </span>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* --- MOBILE MENU SIDE SHEET --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-surface h-full flex flex-col shadow-premium animate-fade-in transform translate-x-0 border-l border-surface-hover">
            
            <div className="flex items-center justify-between p-4 border-b border-surface-hover">
               <span className="font-heading text-xl font-black text-foreground">القائمة</span>
               <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} >
                 <X className="h-6 w-6" />
               </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-2">
               {/* Menu Items */}
               {[
                 { label: "حسابي", href: "/account", icon: <User className="w-5 h-5"/> },
                 { label: "الأقسام", href: "/categories", icon: <Menu className="w-5 h-5"/> },
                 { label: "أفضل العروض", href: "/offers", icon: <BadgePercent className="w-5 h-5 text-secondary"/> },
               ].map((item, i) => (
                 <Link key={i} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors border-b border-surface-hover/50">
                    <div className="flex items-center gap-3 text-gray-200">
                       {item.icon}
                       <span className="font-bold">{item.label}</span>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                 </Link>
               ))}
               
               <div className="mt-8 px-4">
                  <div className="bg-gradient-to-br from-primary/20 to-transparent p-4 rounded-2xl border border-primary/20 flex flex-col gap-2">
                     <span className="font-bold text-primary">محتاج مساعدة؟ 💬</span>
                     <span className="text-sm text-gray-400">فريق خدمة العملاء موجود عشانك</span>
                     <Button className="mt-2 text-sm h-9 rounded-xl">تواصل معنا</Button>
                  </div>
               </div>
            </div>

          </div>
        </div>
      )}
    </header>
  )
}
