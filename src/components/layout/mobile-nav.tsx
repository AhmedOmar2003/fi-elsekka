"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../ui/button"
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "../ui/theme-toggle"

export function MobileNav() {
  const pathname = usePathname()
  const { cartCount } = useCart()
  const { user } = useAuth()

  // Hide on detail-focused pages where full attention is needed
  const isHidden =
    pathname.startsWith('/product/') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/driver') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/system-access');

  if (isHidden) return null;

  const navItems = [
    {
      name: "الرئيسية",
      href: "/",
      icon: <Home className="h-6 w-6" />,
    },
    {
      name: "الأقسام",
      href: "/categories",
      icon: <LayoutGrid className="h-6 w-6" />,
    },
    {
      name: "السلة",
      href: "/cart",
      badge: cartCount > 0 ? cartCount : undefined,
      icon: <ShoppingBag className="h-6 w-6" />,
    },
    {
      name: "حسابي",
      href: user ? "/account" : "/login",
      icon: <User className="h-6 w-6" />,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block bg-transparent px-3 pb-3 md:hidden">
      <nav className="material-shell mx-auto flex h-[74px] max-w-xl items-center justify-around rounded-[28px] px-2">
        <div className="mb-1 flex shrink-0 flex-col items-center justify-center">
          <ThemeToggle />
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex h-[58px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-[22px] px-3 transition-all",
                isActive ? "bg-primary/12 text-primary shadow-[var(--shadow-material-1)]" : "text-foreground/60 hover:bg-surface-container hover:text-foreground"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white ring-2 ring-background">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="font-heading text-[10px] font-semibold">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
