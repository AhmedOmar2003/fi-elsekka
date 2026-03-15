import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductCard } from "@/components/ui/product-card"
import { fetchOffers } from "@/services/productsService"

// Cache the offers page for 1 minute using ISR.
// Admin changes will be visible within 1 minute max.
export const revalidate = 60;

export default async function OffersPage() {
  const dbProducts = await fetchOffers();

  const displayProducts = dbProducts.map(p => {
    let price = p.price;
    let oldPrice: number | undefined = undefined;
    let discountBadge: string | undefined = undefined;

    if (p.discount_percentage && p.discount_percentage > 0) {
      price = Math.round(p.price * (1 - p.discount_percentage / 100));
      oldPrice = p.price;
      discountBadge = `خصم ${p.discount_percentage}%`;
    }

    return {
      id: p.id,
      title: p.name,
      price,
      oldPrice,
      discountBadge,
      rating: p.specifications?.rating,
      reviewsCount: p.specifications?.reviews_count,
      imageUrl: p.image_url || "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn"
    };
  });

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
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-surface-hover rounded-full flex items-center justify-center border border-white/5">
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">لا توجد عروض حالياً</h3>
              <p className="text-gray-400">تابعنا لمعرفة أحدث العروض والخصومات قريباً.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
