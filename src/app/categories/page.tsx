"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useRealtimeCategories, getCategoryDesign } from "@/services/categoriesService"

export default function CategoriesPage() {
  const { categories: dbCategories, isLoading } = useRealtimeCategories();

  const displayCategories = dbCategories.map((c) => {
    const design = getCategoryDesign(c.name);
    return {
      id: c.id,
      name: c.name,
      desc: c.description || "",
      iconComponent: design.iconComponent,
      color: design.color,
      iconColor: design.iconColor
    }
  });

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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-8 sm:h-8"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
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
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : displayCategories.length === 0 ? (
            <div className="text-center py-20 text-gray-500">لا توجد أقسام متاحة حالياً.</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {displayCategories.map((cat, idx) => (
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
                    <cat.iconComponent className="w-32 h-32 sm:w-40 sm:h-40" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${cat.iconColor}`}>
                      <cat.iconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-current" />
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
          )}
        </section>

      </main>

      <Footer />
    </>
  )
}
