import * as React from "react"
import Link from "next/link"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Menu, Search, User, ShoppingBag, BadgePercent } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-hover bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <Button variant="ghost" size="icon" aria-label="القائمة">
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
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/offers" className="font-heading hidden lg:flex items-center gap-2 text-sm font-semibold text-secondary hover:text-rose-400 transition-colors">
            <BadgePercent className="h-5 w-5" />
            عروض جامدة
          </Link>
          
          <Button variant="ghost" size="icon" className="hidden md:flex relative text-gray-300 hover:text-white">
            <User className="h-6 w-6" />
          </Button>
          
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white bg-surface-hover/50 hover:bg-surface-hover rounded-full transition-all">
              <ShoppingBag className="h-6 w-6" />
              <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
                0
              </span>
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Mobile Search - Visible only on small screens */}
       <div className="px-4 pb-3 md:hidden">
         <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-gray-500">
               <Search className="h-5 w-5" />
            </div>
            <Input 
              type="search" 
              placeholder="بتدور على إيه؟..." 
              className="h-10 w-full rounded-full bg-surface-hover ps-11 text-sm border-transparent" 
            />
          </div>
      </div>
    </header>
  )
}
