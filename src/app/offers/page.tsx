import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/ui/product-card"

export default function OffersPage() {
  const MOCK_FEATURED_PRODUCTS = [
    { id: "1", title: "مكرونة الملكة 400 جم حجم عائلي", price: 15, oldPrice: 20, discountBadge: "25% خصم", rating: 4.8, reviewsCount: 124, imageUrl: "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn" },
    { id: "2", title: "شامبو بانتين 400 مل", price: 95, oldPrice: 120, discountBadge: "توفير", rating: 4.5, reviewsCount: 89, imageUrl: "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn" },
    { id: "4", title: "سماعة بلوتوث لاسلكية", price: 450, oldPrice: 600, discountBadge: "عروض جامدة", rating: 4.9, reviewsCount: 312, imageUrl: "https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn" },
    { id: "7", title: "شاشة 32 بوصة سمارت", price: 4200, oldPrice: 4800, discountBadge: "تصفية", rating: 4.8, reviewsCount: 89, imageUrl: "https://th.bing.com/th/id/OIG2.K_L_M_N_O_P_Q_R_S_T?pid=ImgGn" },
    { id: "10", title: "حقيبة ظهر رياضية", price: 299, oldPrice: 450, discountBadge: "30% خصم", rating: 4.3, reviewsCount: 45, imageUrl: "https://th.bing.com/th/id/OIG1.A_B_C_D_E_F_G_H_I_J?pid=ImgGn" },
    { id: "11", title: "طقم حلل جرانيت 4 قطع", price: 1800, oldPrice: 2200, discountBadge: "تصفيات", rating: 4.6, reviewsCount: 78, imageUrl: "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn" },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 pb-16 min-h-screen bg-background">
        <div className="bg-secondary/10 border-b border-secondary/20 py-8 md:py-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-50 blur-3xl rounded-full w-96 h-96 bg-secondary pointer-events-none"></div>
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <h1 className="text-3xl md:text-5xl font-black text-secondary mb-4 flex items-center gap-3">
                 <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 عروض متتفوتش
              </h1>
              <p className="max-w-xl text-lg text-foreground/80 md:text-xl font-medium">
                 وقت التوفير جه! جبنالك أحسن العروض والخصومات على كل المنتجات اللي نفسك فيها. الكميات محدودة، الحق اشتري دلوقتي.
              </p>
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
           <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
             {MOCK_FEATURED_PRODUCTS.map((product) => (
               <ProductCard key={product.id} {...product} />
             ))}
           </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
