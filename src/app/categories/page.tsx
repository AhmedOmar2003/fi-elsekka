"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LayoutGrid, ShoppingBasket, Stethoscope, Laptop, Shirt, Baby, Sparkles, Home as HomeIcon } from "lucide-react"

const categories = [
  {
    id: "groceries",
    name: "سوبر ماركت",
    desc: "كل طلبات البيت والمطبخ",
    icon: <ShoppingBasket className="w-8 h-8" />,
    color: "from-emerald-500/20 to-emerald-500/5 hover:from-emerald-500/30",
    iconColor: "text-emerald-500 bg-emerald-500/10",
  },
  {
    id: "pharmacy",
    name: "صيدلية",
    desc: "أدوية وعناية صحية",
    icon: <Stethoscope className="w-8 h-8" />,
    color: "from-blue-500/20 to-blue-500/5 hover:from-blue-500/30",
    iconColor: "text-blue-500 bg-blue-500/10",
  },
  {
    id: "electronics",
    name: "إلكترونيات",
    desc: "موبايلات، لابتوب وأجهزة",
    icon: <Laptop className="w-8 h-8" />,
    color: "from-slate-500/20 to-slate-500/5 hover:from-slate-500/30",
    iconColor: "text-slate-400 bg-slate-500/10",
  },
  {
    id: "fashion",
    name: "ملابس وأزياء",
    desc: "أحدث صيحات الموضة",
    icon: <Shirt className="w-8 h-8" />,
    color: "from-rose-500/20 to-rose-500/5 hover:from-rose-500/30",
    iconColor: "text-rose-500 bg-rose-500/10",
  },
  {
    id: "kids",
    name: "ألعاب أطفال",
    desc: "ألعاب مستلزمات المدارس",
    icon: <Baby className="w-8 h-8" />,
    color: "from-yellow-500/20 to-yellow-500/5 hover:from-yellow-500/30",
    iconColor: "text-yellow-500 bg-yellow-500/10",
  },
  {
    id: "personal-care",
    name: "عناية شخصية",
    desc: "مستحضرات تجميل وعطور",
    icon: <Sparkles className="w-8 h-8" />,
    color: "from-purple-500/20 to-purple-500/5 hover:from-purple-500/30",
    iconColor: "text-purple-500 bg-purple-500/10",
  },
  {
    id: "home",
    name: "أدوات منزلية",
    desc: "ديكور وأجهزة البيت",
    icon: <HomeIcon className="w-8 h-8" />,
    color: "from-orange-500/20 to-orange-500/5 hover:from-orange-500/30",
    iconColor: "text-orange-500 bg-orange-500/10",
  },
]

export default function CategoriesPage() {
  return (
    <>
      <Header />
      
      {/* 
        Note: The global MobileNav is configured to stay visible on /categories
        So we add pb-28 to the main container just like the home page to avoid overlap.
      */}
      <main className="flex-1 pb-28 md:pb-16 bg-background">
        
        {/* Subtle decorative background glow */}
        <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="fixed bottom-20 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        {/* Header Section */}
        <section className="px-4 pt-8 pb-6 sm:pt-12 sm:pb-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl text-primary">
              <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-black text-foreground tracking-tight drop-shadow-sm">
              كل الأقسام
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-400 mt-2 ms-2 leading-relaxed max-w-2xl">
            اختار القسم اللي بتدور فيه، وهتلاقي كل اللي تحتاجه بأحسن الأسعار ويوصلك لحد باب البيت.
          </p>
        </section>

        {/* Categories Grid */}
        <section className="px-4 pb-12 sm:pb-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            
            {categories.map((cat, idx) => (
              <Link 
                key={cat.id} 
                href={`/category/${cat.id}`}
                className={`
                  group relative flex flex-col p-5 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-surface-hover overflow-hidden transition-all duration-300
                  bg-gradient-to-br ${cat.color} backdrop-blur-sm
                  hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
                  active:scale-[0.98]
                `}
                style={{
                  animationDelay: `${idx * 50}ms`,
                  animationFillMode: 'both'
                }}
              >
                {/* Decorative background icon (faint, large) */}
                <div className="absolute -bottom-4 -end-4 text-white/5 transform -rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 pointer-events-none">
                  {React.cloneElement(cat.icon, { className: "w-32 h-32 sm:w-40 sm:h-40" })}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${cat.iconColor}`}>
                    {cat.icon}
                  </div>
                  
                  <h3 className="font-heading font-black text-lg sm:text-xl md:text-2xl text-foreground mb-1 sm:mb-2 drop-shadow-sm">
                    {cat.name}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 mt-auto">
                    {cat.desc}
                  </p>
                </div>
              </Link>
            ))}

          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
