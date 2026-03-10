"use client"

import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/ui/product-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useParams } from "next/navigation"

// Mock data generator for the category page
const generateMockProducts = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `prod-${i}`,
    title: `منتج تجريبي رقم ${i + 1} بمواصفات ممتازة وجودة عالية`,
    price: Math.floor(Math.random() * 500) + 50,
    oldPrice: Math.random() > 0.6 ? Math.floor(Math.random() * 800) + 600 : undefined,
    discountBadge: Math.random() > 0.8 ? "خصم خاص" : undefined,
    rating: Number((Math.random() * 2 + 3).toFixed(1)),
    reviewsCount: Math.floor(Math.random() * 200),
    imageUrl: `https://th.bing.com/th/id/OIG${(i % 4) + 1}.random?pid=ImgGn`, // placeholder
  }))
}

const CATEGORY_NAMES: Record<string, string> = {
  all: "كل المنتجات",
  groceries: "سوبر ماركت",
  pharmacy: "صيدلية",
  fashion: "موضة وأزياء",
  electronics: "إلكترونيات",
  kids: "أطفال",
  home: "مستلزمات البيت",
}

export default function CategoryPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : 'all'
  const categoryName = CATEGORY_NAMES[slug] || "قسم المنتجات"
  
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  
  const products = React.useMemo(() => generateMockProducts(12), [])

  return (
    <>
      <Header />
      
      <main className="flex-1 pb-28 md:pb-8 bg-background min-h-screen">
        
        {/* Page Header */}
        <div className="bg-surface border-b border-surface-hover py-6 md:py-10">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl md:text-4xl font-black text-foreground">{categoryName}</h1>
              <p className="mt-2 text-gray-500">تصفح أفضل المنتجات المختارة لك خصيصاً في هذا القسم.</p>
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4 md:hidden">
               <span className="text-sm text-gray-400 font-medium">عرض {products.length} منتج</span>
               <button 
                 onClick={() => setIsFilterOpen(!isFilterOpen)}
                 className="flex items-center gap-2 bg-surface border border-surface-hover px-4 py-2.5 rounded-xl text-sm font-bold text-gray-200 hover:bg-surface-hover active:scale-95 transition-all"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                 تصفية وترتيب
               </button>
            </div>

            {/* Sidebar Filters */}
            <aside className={`md:w-64 shrink-0 flex-col gap-8 ${isFilterOpen ? 'flex' : 'hidden md:flex'}`}>
              
              {/* Sort - visible in sidebar on desktop, inline on mobile if needed */}
              <div className="space-y-4">
                 <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">الترتيب</h3>
                 <Select defaultValue="popular" className="w-full">
                    <option value="popular">الأكثر شعبية</option>
                    <option value="newest">أضيف حديثاً</option>
                    <option value="price-low">السعر: من الأقل للأعلى</option>
                    <option value="price-high">السعر: من الأعلى للأقل</option>
                 </Select>
              </div>

              {/* Price Filter */}
              <div className="space-y-4">
                 <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">السعر</h3>
                 <div className="space-y-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id="price-1" />
                      <Label htmlFor="price-1" className="text-gray-300">أقل من 50 ج.م</Label>
                    </div>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id="price-2" />
                      <Label htmlFor="price-2" className="text-gray-300">50 - 200 ج.م</Label>
                    </div>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id="price-3" />
                      <Label htmlFor="price-3" className="text-gray-300">200 - 500 ج.م</Label>
                    </div>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id="price-4" />
                      <Label htmlFor="price-4" className="text-gray-300">أكثر من 500 ج.م</Label>
                    </div>
                 </div>
              </div>

              {/* Brand Filter */}
              <div className="space-y-4">
                 <h3 className="font-bold text-lg text-foreground pb-2 border-b border-surface-hover">الماركة</h3>
                 <div className="space-y-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id="brand-1" />
                      <Label htmlFor="brand-1" className="text-gray-300">المراعي</Label>
                    </div>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id="brand-2" />
                      <Label htmlFor="brand-2" className="text-gray-300">جهينة</Label>
                    </div>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Checkbox id="brand-3" />
                      <Label htmlFor="brand-3" className="text-gray-300">بانتين</Label>
                    </div>
                 </div>
              </div>

              {/* Apply button for mobile */}
              <Button onClick={() => setIsFilterOpen(false)} className="md:hidden mt-4">
                 تطبيق
              </Button>

            </aside>

            {/* Product Grid */}
            <div className="flex-1">
               <div className="hidden md:flex justify-between items-center mb-6">
                 <span className="text-sm text-gray-400">عرض {products.length} نتيجة</span>
               </div>
               
               <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                 {products.map((product) => (
                   <ProductCard key={product.id} {...product} />
                 ))}
               </div>

               {/* Pagination / Load More Dummy */}
               <div className="mt-12 flex justify-center">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full font-bold">
                    حمل منتجات أكتر
                  </Button>
               </div>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </>
  )
}
