"use client"

import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/ui/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Star, ShieldCheck, Truck, ChevronRight, Check, Minus, Plus, ShoppingCart } from "lucide-react"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  // const slug = typeof params.slug === 'string' ? params.slug : '1'
  
  const [quantity, setQuantity] = React.useState(1)
  const [isAdded, setIsAdded] = React.useState(false)

  const handleAddToCart = () => {
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleBuyNow = () => {
    router.push('/checkout')
  }

  // Mock product data
  const product = {
    title: "سماعة بلوتوث لاسلكية عازلة للضوضاء",
    price: 450,
    oldPrice: 600,
    discountAmount: "وفر 150 ج.م",
    rating: 4.9,
    reviewsCount: 312,
    stock: "متوفر 15 قطعة فقط",
    description: "استمتع بتجربة صوتية لا مثيل لها مع سماعة البلوتوث اللاسلكية الجديدة. تصميم مريح للأذن، بطارية تدوم حتى 24 ساعة، وعزل تام للضوضاء الخارجية عشان تفصل براحتك.",
    specs: [
      { label: "الماركة", value: "SoundMax" },
      { label: "عمر البطارية", value: "24 ساعة" },
      { label: "الاتصال", value: "بلوتوث 5.2" },
      { label: "الضمان", value: "سنة واحدة" },
    ],
    features: [
      "صوت نقي وبيز قوي",
      "ميكروفون مزود بتقنية عزل الضوضاء",
      "تحكم باللمس",
      "مقاومة لرذاذ الماء والتعرق",
    ],
    images: [
      "https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn",
      "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn",
      "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn",
    ]
  }

  const [activeImage, setActiveImage] = React.useState(0)

  return (
    <>
      <Header />
      
      <main className="flex-1 pb-24 md:pb-8 bg-background">
        
        {/* Breadcrumbs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
           <nav className="flex text-sm text-gray-400" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 rtl:space-x-reverse md:space-x-3">
                 <li className="inline-flex items-center">
                    <Link href="/" className="hover:text-foreground">الرئيسية</Link>
                 </li>
                 <li>
                    <div className="flex items-center">
                       <svg className="w-4 h-4 text-gray-600 rotate-180" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                       <Link href="/category/electronics" className="ms-1 hover:text-foreground md:ms-2">إلكترونيات</Link>
                    </div>
                 </li>
                 <li>
                    <div className="flex items-center">
                       <ChevronRight className="w-4 h-4 text-gray-500" />
                       <span className="ms-1 text-gray-500 md:ms-2 line-clamp-1 truncate max-w-[150px]">{product.title}</span>
                    </div>
                 </li>
              </ol>
           </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              
              {/* Image Gallery */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                 
                 {/* Main Image */}
                 <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-3xl bg-surface border border-surface-hover overflow-hidden group">
                    {/* Subtle premium gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none z-10"></div>
                    <img 
                      src={product.images[activeImage]} 
                      className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105" 
                      alt={product.title} 
                    />
                 </div>

                 {/* Thumbnails */}
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {product.images.map((img, idx) => (
                       <button 
                         key={idx}
                         onClick={() => setActiveImage(idx)}
                         className={`relative aspect-[4/3] w-24 sm:w-28 shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeImage === idx ? 'border-primary ring-2 ring-primary/20 scale-100 shadow-md' : 'border-surface-hover hover:border-gray-500 scale-95 opacity-70 hover:opacity-100'}`}
                       >
                         <img src={img} className="object-cover w-full h-full" alt="" />
                       </button>
                    ))}
                 </div>

              </div>
              
              {/* Product Details */}
              <div className="lg:col-span-6 flex flex-col pl-0 lg:pl-4">
                 
                 <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-rose-500 text-white font-bold px-3 py-1 shadow-md shadow-rose-500/20">{product.discountAmount}</Badge>
                    <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-surface border border-surface-hover px-3 py-1.5 rounded-full font-bold">
                       <Star className="w-4 h-4 fill-current" />
                       <span>{product.rating}</span>
                       <span className="text-gray-400 font-medium">({product.reviewsCount} تقييم)</span>
                    </div>
                 </div>

                 <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground mb-6 leading-[1.3] drop-shadow-sm">{product.title}</h1>
                 
                 <div className="flex items-end gap-3 mb-6 p-5 rounded-2xl bg-surface-light border border-surface-hover shadow-sm">
                    <div className="flex flex-col">
                       <span className="text-gray-400 text-sm font-medium mb-1">السعر الحالي</span>
                       <span className="font-heading text-4xl font-black text-primary drop-shadow-sm tracking-tight">{product.price} <span className="font-heading text-lg font-bold">ج.م</span></span>
                    </div>
                    {product.oldPrice && (
                      <div className="flex flex-col mb-1 ml-4">
                         <span className="font-heading text-lg text-gray-500 line-through">{product.oldPrice} ج.م</span>
                      </div>
                    )}
                 </div>

                 <div className="mb-8 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                       <div className="relative flex h-3 w-3">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                       </div>
                       <span className="text-emerald-500">{product.stock}</span>
                    </div>
                 </div>

                 {/* Desktop Add to Cart */}
                 <div className="hidden md:flex flex-col gap-4 mb-10 p-1 bg-surface-light rounded-3xl border border-surface-hover shadow-lg">
                    <div className="flex items-center gap-3 p-3">
                       <div className="flex items-center shrink-0 rounded-2xl border border-surface-hover bg-background shadow-sm h-14">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-5 h-full hover:bg-surface rounded-e-2xl text-gray-400 hover:text-foreground active:scale-95 transition-all">
                             <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-10 text-center font-heading font-black text-xl">{quantity}</span>
                          <button onClick={() => setQuantity(quantity + 1)} className="px-5 h-full hover:bg-surface rounded-s-2xl text-gray-400 hover:text-foreground active:scale-95 transition-all">
                             <Plus className="w-5 h-5" />
                          </button>
                       </div>
                       
                       <Button size="lg" className="flex-1 h-14 space-x-2 space-x-reverse rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95" onClick={handleAddToCart}>
                          {isAdded ? <Check className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
                          <span>{isAdded ? "تمت الإضافة بنجاح" : "أضف للسلة"}</span>
                       </Button>
                    </div>

                    <div className="px-3 pb-3">
                       <Button variant="secondary" size="lg" className="w-full h-14 rounded-2xl text-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all active:scale-95" onClick={handleBuyNow}>
                          اخلص واشتري دلوقتي
                       </Button>
                    </div>
                 </div>

                 {/* Important Notes */}
                 <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface/50 border border-surface-hover hover:border-emerald-500/30 transition-colors">
                       <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                          <ShieldCheck className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-heading font-bold text-sm text-foreground mb-1">الدفع كاش عند الاستلام</p>
                          <p className="text-xs text-gray-400 leading-relaxed">عاين المنتج براحتك قبل ما تدفع أي حاجة</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface/50 border border-surface-hover hover:border-primary/30 transition-colors">
                       <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                          <Truck className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-heading font-bold text-sm text-foreground mb-1">توصيل سريع ومضمون</p>
                          <p className="text-xs text-gray-400 leading-relaxed">هنعرفك مصاريف الشحن بالضبط قبل التأكيد</p>
                       </div>
                    </div>
                 </div>

                 {/* Description & Specs Tabs (Simplified as sections for now) */}
                 <div className="space-y-8">
                    <section>
                       <h3 className="text-xl font-bold mb-3 pb-2 border-b border-surface-hover">عن المنتج</h3>
                       <p className="text-gray-400 leading-relaxed text-sm md:text-base">{product.description}</p>
                       
                       <ul className="mt-4 space-y-2">
                          {product.features.map((feature, idx) => (
                             <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {feature}
                             </li>
                          ))}
                       </ul>
                    </section>

                    <section>
                       <h3 className="text-xl font-bold mb-3 pb-2 border-b border-surface-hover">المواصفات</h3>
                       <div className="rounded-xl overflow-hidden border border-surface-hover divide-y divide-surface-hover">
                          {product.specs.map((spec, idx) => (
                             <div key={idx} className="flex flex-col sm:flex-row sm:items-center bg-surface px-4 py-3">
                                <span className="w-1/3 text-gray-500 text-sm">{spec.label}</span>
                                <span className="text-foreground text-sm font-medium mt-1 sm:mt-0">{spec.value}</span>
                             </div>
                          ))}
                       </div>
                    </section>
                 </div>

              </div>
           </div>
        </div>

      </main>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-lg border-t border-surface-hover md:hidden shadow-2xl">
         <div className="flex gap-3">
            <Button size="lg" className="flex-1 rounded-xl text-base font-bold" onClick={handleAddToCart}>
               {isAdded ? "تمت الإضافة ✓" : "أضف للسلة"}
            </Button>
            <Button variant="secondary" size="lg" className="px-6 rounded-xl font-bold text-white bg-blue-600 focus:ring-blue-500" onClick={handleBuyNow}>
               اشتري
            </Button>
         </div>
      </div>

      {!classNameMobile && <Footer />}
    </>
  )
}

// Just a tiny hack to remove footer if needed, but it's handled by padding at bottom for mobile.
const classNameMobile = false; 
