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
    pathname.startsWith('/driver');

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
    <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden border-t border-surface-hover bg-background/90 pb-safe pt-2 backdrop-blur-lg">
      <nav className="flex h-16 items-center justify-around px-2">
        <div className="flex flex-col items-center justify-center shrink-0 mb-1">
          <ThemeToggle />
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex h-full min-w-[64px] flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-200"
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
