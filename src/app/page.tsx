import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/ui/product-card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Zap, Banknote, Clock } from "lucide-react"
import { fetchHomeProducts, fetchOffers, fetchBestSellers } from "@/services/productsService"
import { HomeCategoriesList } from "@/components/ui/home-categories"
import { PromoBanner } from "@/components/ui/promo-banner"
import { toProductCardProps } from "@/lib/product-presentation"

// Cache the home page for 5 minutes using Next.js ISR
// The home page must be fully dynamic to guarantee admin updates 
// appear instantly and bypass stubborn Next.js router cache.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MOCK_FEATURED_PRODUCTS = [
  { id: "1", title: "مكرونة الملكة 400 جم حجم عائلي", price: 15, oldPrice: 20, discountBadge: "25% خصم", imageUrl: "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn" },
  { id: "2", title: "شامبو بانتين 400 مل", price: 95, oldPrice: 120, discountBadge: "توفير", imageUrl: "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn" },
  { id: "3", title: "تيشيرت قطن 100% رجالي أسود", price: 250, imageUrl: "https://th.bing.com/th/id/OIG2.M_o_l_L_v_R_J_p_f_M_?pid=ImgGn" },
  { id: "4", title: "سماعة بلوتوث لاسلكية", price: 450, oldPrice: 600, discountBadge: "عروض جامدة", imageUrl: "https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn" },
];
export default async function Home() {
  // 3 separate lightweight queries — each fetches only relevant items:
  // - fetchHomeProducts: 8 newest products for the featured section
  // - fetchBestSellers: DB-filtered is_best_seller=true (fixes regression)
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

  // ── Best Sellers ────────────────────────────────────────────────────────
  // FIX: use the dedicated DB query result — NOT dbProducts.filter()
  // The old approach filtered from 8 items; best sellers added earlier were invisible.
  const displayBestSellers = bestSellerProducts.length > 0
    ? bestSellerProducts.slice(0, 4).map(p => ({
        ...toProductCardProps(p),
        imageUrl: p.image_url || p.specifications?.image_url || "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn"
      }))
    // Fallback: show products 4-7 from the featured list if no best sellers are marked
    : dbProducts.slice(4, 9).map(p => ({
        ...toProductCardProps(p),
        imageUrl: p.image_url || p.specifications?.image_url || "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn"
      }));

  return (
    <>
      <Header />

      <main className="flex-1 pb-24 md:pb-0">

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-surface-light via-background to-background pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-surface-hover">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-start relative z-10">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="z-10 max-w-2xl">
                <Badge variant="success" className="mb-4 inline-flex">
                  🔥 عروض المدارس رجعت تاني!
                </Badge>
                <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
                  كل طلباتك، <br className="hidden sm:block" />
                  <span className="text-primary">في السكة</span> لحد عندك.
                </h1>
                <p className="mb-8 text-lg text-gray-500 max-w-xl mx-auto sm:mx-0">
                  من السوبر ماركت للصيدلية، ومن اللبس للإلكترونيات. اختار اللي نفسك فيه وادفع كاش وإنت بتستلم. أسرع، أسهل، وأروق! ✨
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-start">
                  <Button size="lg" className="w-full sm:w-auto text-lg rounded-full font-bold px-8 shadow-primary/30 shadow-lg" asChild>
                    <Link href="/category/all">يلا بينا نطلب</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg rounded-full font-bold px-8" asChild>
                    <Link href="/offers">شوف الحاجات الحلوة</Link>
                  </Button>
                </div>

                {/* Trust mini-badges */}
                <div className="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5 bg-surface/50 px-3 py-1.5 rounded-full border border-surface-hover">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>دفع عند الاستلام</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface/50 px-3 py-1.5 rounded-full border border-surface-hover">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>سريع ومريح</span>
                  </div>
                </div>
              </div>

              {/* Hero Image Mock */}
              <div className="relative mx-auto mt-8 w-full max-w-md lg:mt-0 lg:max-w-none perspective-1000">
                <div className="aspect-[4/3] rounded-3xl bg-surface border border-surface-hover/50 p-4 shadow-premium relative overflow-hidden group transform hover:-rotate-y-2 transition-transform duration-700">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 opacity-60 mix-blend-overlay"></div>
                  <Image
                    src="https://images.unsplash.com/photo-1628102491629-778571d893a3?q=80&w=800&auto=format&fit=crop"
                    alt="Shopping Box"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover w-full h-full rounded-2xl group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                      <span className="block text-6xl drop-shadow-2xl">📦</span>
                      <span className="block mt-6 px-5 py-2.5 bg-background/80 backdrop-blur-xl rounded-full text-foreground font-bold tracking-widest text-sm border border-white/5 shadow-xl">كل حاجة في مكان واحد</span>
                    </div>
                  </div>
                </div>

                {/* Floating decor */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl animate-float"></div>
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl animate-float" style={{ animationDelay: "2s" }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12 bg-background border-b border-surface-hover">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">نجيبلك إيه النهارده؟</h2>
                <p className="mt-2 text-sm text-gray-500">كل أقسامنا موجودة علشان تلاقي اللي على بالك بسرعة</p>
              </div>
              <Link href="/categories" className="font-heading hidden sm:flex text-sm font-semibold text-primary hover:text-primary-hover">
                شوف كل الأقسام &larr;
              </Link>
            </div>

            <HomeCategoriesList />
          </div>
        </section>

        {/* Featured Offers Section */}
        <section className="py-12 bg-surface/30 border-b border-surface-hover">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">عروض جامدة ما تتفوتش</h2>
                </div>
                <p className="text-sm text-gray-500">وفّر أكتر وخد أحسن سعر من غير وجع دماغ</p>
              </div>
              <Link href="/offers" className="font-heading text-sm font-semibold text-secondary hover:underline">
                شوف الباقي
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {displayOffers.length > 0 ? displayOffers.map((product) => (
                <ProductCard key={product.id} {...product} />
              )) : (
                <div className="col-span-4 text-center py-10 text-gray-500">مفيش عروض ظاهرة دلوقتي، بس راجعنا تاني وهتلاقي الجديد 👀</div>
              )}
            </div>
          </div>
        </section>

        {/* Dynamic Promo Banner (only shown to non-logged-in users) */}
        <PromoBanner />

        {/* Best Sellers Section */}
        <section className="py-12 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">الأكتر طلبًا</h2>
                <p className="mt-2 text-sm text-gray-500">دي الحاجات اللي الناس بتحبها وبتطلبها كتير</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {displayBestSellers.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* Delivery Trust Section */}
        <section className="py-20 bg-surface mt-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-background/50"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-8 text-center divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-surface-hover">

              <div className="flex flex-col items-center pt-8 md:pt-0 group">
                <div className="h-20 w-20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/5 group-hover:scale-110 transition-transform duration-500">
                  <Banknote className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">الدفع وقت الاستلام</h3>
                <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">استلم طلبك الأول، واتطمن عليه، وبعدها ادفع كاش وإنت مرتاح.</p>
              </div>

              <div className="flex flex-col items-center pt-8 md:pt-0 group">
                <div className="h-20 w-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform duration-500">
                  <Clock className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">توصيل سريع</h3>
                <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">طلباتك بتوصلك بسرعة ومن غير لف كتير، عشان وقتك مهم عندنا.</p>
              </div>

              <div className="flex flex-col items-center pt-8 md:pt-0 group">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform duration-500">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">جودة تفرّح</h3>
                <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">بنختار منتجاتنا بعناية علشان اللي يوصلك يبقى نضيف ويستاهل فلوسه فعلًا.</p>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}

