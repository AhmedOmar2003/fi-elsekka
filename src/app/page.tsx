import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/ui/product-card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Zap, Banknote, Clock, MapPin } from "lucide-react"
import { fetchHomeProducts, fetchOffers, fetchBestSellers } from "@/services/productsService"
import { HomeCategoriesList } from "@/components/ui/home-categories"
import { PromoBanner } from "@/components/ui/promo-banner"
import { toProductCardProps } from "@/lib/product-presentation"
import { CURRENT_DELIVERY_FEE } from "@/lib/order-economics"

// Public home page: cache with ISR for strong performance while still refreshing often.
export const revalidate = 300;

const MOCK_FEATURED_PRODUCTS = [
  { id: "1", title: "مكرونة الملكة 400 جم حجم عائلي", price: 15, oldPrice: 20, discountBadge: "25% خصم", imageUrl: "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn" },
  { id: "2", title: "شامبو بانتين 400 مل", price: 95, oldPrice: 120, discountBadge: "توفير", imageUrl: "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn" },
  { id: "3", title: "تيشيرت قطن 100% رجالي أسود", price: 250, imageUrl: "https://th.bing.com/th/id/OIG2.M_o_l_L_v_R_J_p_f_M_?pid=ImgGn" },
  { id: "4", title: "سماعة بلوتوث لاسلكية", price: 450, oldPrice: 600, discountBadge: "عروض جامدة", imageUrl: "https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn" },
];
export default async function Home() {
  // 3 separate lightweight queries — each fetches only relevant items:
  // - fetchHomeProducts: 8 newest products for the featured section
  // - fetchBestSellers: top requested products from real orders
  // - fetchOffers: DB-filtered show_in_offers=true
  const [dbProducts, bestSellerProducts, offerProducts] = await Promise.all([
    fetchHomeProducts(),
    fetchBestSellers(),
    fetchOffers(),
  ]);

  const displayProducts = dbProducts.length > 0 ? dbProducts.slice(0, 4).map(p => ({
    ...toProductCardProps(p),
    imageUrl: p.image_url || p.specifications?.image_url || "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn"
  })) : MOCK_FEATURED_PRODUCTS;

  // Only admin-curated offer products
  const displayOffers = offerProducts.slice(0, 4).map(p => ({
    ...toProductCardProps(p),
    imageUrl: p.image_url || p.specifications?.image_url || "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn"
  }));

  // ── Most Requested Products ─────────────────────────────────────────────
  const displayBestSellers = bestSellerProducts.length > 0
    ? bestSellerProducts.slice(0, 4).map(p => ({
        ...toProductCardProps(p),
        imageUrl: p.image_url || p.specifications?.image_url || "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn"
      }))
    // Fallback: show newer products if there are still no real orders
    : dbProducts.slice(4, 9).map(p => ({
        ...toProductCardProps(p),
        imageUrl: p.image_url || p.specifications?.image_url || "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn"
      }));

  return (
    <>
      <Header />

      <main className="flex-1 pb-24 md:pb-0">

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-4 pb-10 sm:pt-12 sm:pb-20">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 h-[520px] w-[520px] rounded-full bg-primary/4 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 h-[420px] w-[420px] rounded-full bg-secondary/3 blur-[130px] pointer-events-none"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-start relative z-10">
            <div className="material-card-elevated grid grid-cols-1 items-center gap-6 overflow-hidden rounded-[30px] px-4 py-5 sm:gap-12 sm:rounded-[40px] sm:px-8 sm:py-10 lg:grid-cols-2 lg:px-12 lg:py-12">
              <div className="z-10 max-w-2xl">
                <Badge variant="success" className="mb-3 inline-flex rounded-full px-3.5 py-1.5 text-[11px] shadow-sm shadow-emerald-500/10 sm:mb-5 sm:px-4 sm:text-xs">
                  🔥 عروض المدارس رجعت تاني!
                </Badge>
                <h1 className="mb-3 text-[2rem] font-black leading-[1.08] tracking-[-0.05em] text-foreground sm:mb-5 sm:text-5xl lg:text-7xl">
                  كل طلباتك، <br className="hidden lg:block" />
                  <span className="text-primary tracking-tighter">في السكة</span> لحد عندك.
                </h1>
                <p className="storefront-subtle-text mx-auto mb-5 max-w-xl text-sm font-medium leading-7 sm:mx-0 sm:mb-8 sm:text-xl">
                  من السوبر ماركت للصيدلية، ومن اللبس للإلكترونيات. اختار اللي نفسك فيه وادفع كاش وإنت بتستلم. أسرع، أسهل، وأروق! ✨
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-start sm:gap-4">
                  <Button size="lg" className="h-12 w-full rounded-full px-6 text-sm shadow-premium sm:h-14 sm:w-auto sm:px-8 sm:text-base" asChild>
                    <Link href="/category/all">ابدأ التسوق</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 w-full rounded-full px-6 text-sm backdrop-blur-md sm:h-14 sm:w-auto sm:px-8 sm:text-base" asChild>
                    <Link href="/offers">شوف العروض</Link>
                  </Button>
                </div>

                {/* Trust mini-badges */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-gray-400 sm:mt-8 sm:justify-start sm:gap-6 sm:text-sm">
                  <div className="material-chip text-xs sm:text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>دفع عند الاستلام</span>
                  </div>
                  <div className="material-chip text-xs sm:text-sm">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>سريع ومريح</span>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-6 text-gray-500 sm:mt-5 sm:text-sm">
                  لو ملقتش المنتج اللي عاوزه، تقدر تطلبه من زر <span className="font-black text-primary">ملقتش المنتج؟</span> وإحنا نرجعلك بالسعر قبل ما تكمل.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-gray-500 sm:justify-start sm:text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    التوصيل الحالي داخل قرية ميت العامل فقط
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-emerald-500" />
                    الشحن الحالي {CURRENT_DELIVERY_FEE} ج.م
                  </span>
                </div>
              </div>

              {/* Hero Image Mock */}
              <div className="relative mx-auto mt-1 w-full max-w-[280px] sm:mt-8 sm:max-w-md lg:mt-0 lg:max-w-none perspective-1000">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-surface-border bg-surface-container p-2.5 shadow-premium transition-all duration-700 group transform hover:-translate-y-2 hover:shadow-glow-primary sm:rounded-[32px] sm:p-4">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 opacity-60 mix-blend-overlay"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1628102491629-778571d893a3?q=80&w=800&auto=format&fit=crop"
                    alt="Shopping Box"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="h-full w-full rounded-[18px] object-cover transition-transform duration-1000 group-hover:scale-110 sm:rounded-2xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center transition-transform duration-700 transform translate-y-2 group-hover:translate-y-0 sm:translate-y-4">
                      <span className="block text-5xl drop-shadow-2xl sm:text-6xl">📦</span>
                      <span className="mt-4 block rounded-full border border-white/5 bg-background/62 px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-foreground shadow-[var(--shadow-material-2)] backdrop-blur-md sm:mt-6 sm:px-5 sm:py-2.5 sm:text-sm">كل حاجة في مكان واحد</span>
                    </div>
                  </div>
                </div>

                {/* Floating decor */}
                <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-rose-500/20 blur-2xl animate-float sm:-bottom-6 sm:-right-6 sm:h-24 sm:w-24"></div>
                <div className="absolute -left-4 -top-4 h-20 w-20 rounded-full bg-emerald-500/20 blur-2xl animate-float sm:-left-6 sm:-top-6 sm:h-32 sm:w-32" style={{ animationDelay: "2s" }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="storefront-section-title text-2xl sm:text-3xl text-foreground">نجيبلك إيه النهارده؟</h2>
                <p className="storefront-subtle-text mt-2 text-sm">كل أقسامنا متظبطة علشان توصل للي على بالك بسرعة ومن غير لف</p>
              </div>
              <Link href="/categories" className="font-heading hidden sm:flex material-chip text-sm font-semibold text-primary hover:border-primary/20 hover:bg-primary/10">
                شوف كل الأقسام &larr;
              </Link>
            </div>

            <HomeCategoriesList />
          </div>
        </section>

        {/* Featured Offers Section */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between sm:mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                  </span>
                  <h2 className="storefront-section-title text-2xl sm:text-3xl text-foreground">عروض جامدة ما تتفوتش</h2>
                </div>
                <p className="storefront-subtle-text text-sm">وفّر أكتر وخد أحسن سعر من غير وجع دماغ</p>
              </div>
              <Link href="/offers" className="font-heading material-chip whitespace-nowrap text-sm font-semibold text-secondary hover:border-secondary/20 hover:bg-secondary/10">
                شوف الباقي
              </Link>
            </div>

            {displayOffers.length > 0 ? (
              <>
                <div className="sm:hidden -mx-1 overflow-x-auto pb-2 no-scrollbar">
                  <div className="flex gap-4 px-1 snap-x snap-mandatory">
                    {displayOffers.map((product) => (
                      <div key={product.id} className="snap-start min-w-[46vw] max-w-[46vw]">
                        <ProductCard {...product} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:grid grid-cols-2 gap-6 lg:grid-cols-4">
                  {displayOffers.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-gray-500">مفيش عروض ظاهرة دلوقتي، بس راجعنا تاني وهتلاقي الجديد 👀</div>
            )}
          </div>
        </section>

        {/* Dynamic Promo Banner (only shown to non-logged-in users) */}
        <PromoBanner />

        {/* Best Sellers Section */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between sm:mb-8">
              <div>
                <h2 className="storefront-section-title text-2xl sm:text-3xl text-foreground">الأكتر طلبًا</h2>
                <p className="storefront-subtle-text mt-2 text-sm">دي الحاجات اللي الناس بتحبها وبتطلبها كتير</p>
              </div>
              <Link href="/category/all" className="font-heading material-chip whitespace-nowrap text-sm font-semibold text-primary hover:border-primary/20 hover:bg-primary/10">
                عرض الكل
              </Link>
            </div>

            <div className="sm:hidden -mx-1 overflow-x-auto pb-2 no-scrollbar">
              <div className="flex gap-4 px-1 snap-x snap-mandatory">
                {displayBestSellers.map((product) => (
                  <div key={product.id} className="snap-start min-w-[46vw] max-w-[46vw]">
                    <ProductCard {...product} />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-2 gap-6 lg:grid-cols-4">
              {displayBestSellers.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* Delivery Trust Section */}
        <section className="relative mt-12 overflow-hidden py-16">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="material-card grid grid-cols-1 gap-10 rounded-[34px] p-8 text-center sm:gap-8 md:grid-cols-3 md:divide-x md:divide-x-reverse md:divide-y-0 lg:p-12 divide-y divide-surface-border/50">

              <div className="flex flex-col items-center pt-8 md:pt-0 group">
                <div className="h-20 w-20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/5 group-hover:scale-110 transition-transform duration-500">
                  <Banknote className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">الدفع وقت الاستلام</h3>
                <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">استلم طلبك، اتطمن عليه، وبعدها ادفع كاش وإنت مرتاح.</p>
              </div>

              <div className="flex flex-col items-center pt-8 md:pt-0 group">
                <div className="h-20 w-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform duration-500">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">توصيل سريع</h3>
                <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">طلباتك بتوصلك بسرعة ومن غير لف كتير.</p>
              </div>

              <div className="flex flex-col items-center pt-8 md:pt-0 group">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform duration-500">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">جودة تفرّح</h3>
                <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">بنختار منتجاتنا بعناية علشان اللي يوصلك يبقى نضيف ويستاهل.</p>
              </div>

            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-center text-xs text-gray-500">
              <span className="inline-flex items-center rounded-full border border-surface-border bg-surface px-4 py-2">ميت العامل فقط</span>
              <span className="inline-flex items-center rounded-full border border-surface-border bg-surface px-4 py-2">قريبًا القرى المجاورة</span>
              <span className="inline-flex items-center rounded-full border border-surface-border bg-surface px-4 py-2">الشحن {CURRENT_DELIVERY_FEE} ج.م</span>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}

