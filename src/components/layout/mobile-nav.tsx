"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../ui/button"
import { Home, LayoutGrid, Package, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function MobileNav() {
  const pathname = usePathname()
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
      name: "طلباتي",
      href: "/orders",
      icon: <Package className="h-6 w-6" />,
    },
    {
      name: "حسابي",
      href: user ? "/account" : "/login",
      icon: <User className="h-6 w-6" />,
    },
  ]

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 block border-t border-white/8 bg-[#101816] shadow-[0_-10px_30px_rgba(0,0,0,0.24)] md:hidden">
      <nav className="mx-auto flex h-[74px] w-full max-w-none items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex h-[58px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-[22px] px-3 transition-all",
                isActive ? "bg-primary/14 text-primary shadow-[var(--shadow-material-1)]" : "text-white/62 hover:bg-white/6 hover:text-white"
              )}
            >
              <div className="relative">
                {item.icon}
              </div>
              <span className="font-heading text-[10px] font-semibold">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
