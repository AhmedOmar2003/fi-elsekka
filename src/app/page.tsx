import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/ui/product-card"
import { CategoryCard } from "@/components/ui/category-card"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import Link from "next/link"
import { ShoppingBasket, Pill, Shirt, Smartphone, Baby, HomeIcon, Sparkles, ShieldCheck, Zap, Banknote, Clock } from "lucide-react"

const MOCK_CATEGORIES = [
  { slug: "groceries", name: "سوبر ماركت", icon: <ShoppingBasket className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" /> },
  { slug: "pharmacy", name: "صيدلية", icon: <Pill className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" /> },
  { slug: "fashion", name: "موضة", icon: <Shirt className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" /> },
  { slug: "electronics", name: "إلكترونيات", icon: <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" /> },
  { slug: "kids", name: "أطفال", icon: <Baby className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500" /> },
  { slug: "home", name: "البيت", icon: <HomeIcon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" /> },
];

const MOCK_FEATURED_PRODUCTS = [
  { id: "1", title: "مكرونة الملكة 400 جم حجم عائلي", price: 15, oldPrice: 20, discountBadge: "25% خصم", rating: 4.8, reviewsCount: 124, imageUrl: "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn" },
  { id: "2", title: "شامبو بانتين 400 مل", price: 95, oldPrice: 120, discountBadge: "توفير", rating: 4.5, reviewsCount: 89, imageUrl: "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn" },
  { id: "3", title: "تيشيرت قطن 100% رجالي أسود", price: 250, rating: 4.2, reviewsCount: 45, imageUrl: "https://th.bing.com/th/id/OIG2.M_o_l_L_v_R_J_p_f_M_?pid=ImgGn" },
  { id: "4", title: "سماعة بلوتوث لاسلكية", price: 450, oldPrice: 600, discountBadge: "عروض جامدة", rating: 4.9, reviewsCount: 312, imageUrl: "https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn" },
];

const MOCK_BEST_SELLERS = [
  { id: "5", title: "زيت عباد الشمس 1 لتر", price: 65, rating: 4.7, reviewsCount: 520, imageUrl: "https://th.bing.com/th/id/OIG4.X_Y_Z_A_B_C_D_E_F_G?pid=ImgGn" },
  { id: "6", title: "بنطلون جينز أزرق سليم فيت", price: 350, rating: 4.6, reviewsCount: 150, imageUrl: "https://th.bing.com/th/id/OIG1.A_B_C_D_E_F_G_H_I_J?pid=ImgGn" },
  { id: "7", title: "شاشة 32 بوصة سمارت", price: 4200, oldPrice: 4800, discountBadge: "تصفية", rating: 4.8, reviewsCount: 89, imageUrl: "https://th.bing.com/th/id/OIG2.K_L_M_N_O_P_Q_R_S_T?pid=ImgGn" },
  { id: "8", title: "حفاضات أطفال مقاس 4", price: 210, rating: 4.9, reviewsCount: 412, imageUrl: "https://th.bing.com/th/id/OIG3.U_V_W_X_Y_Z_1_2_3_4?pid=ImgGn" },
];

export default function Home() {
  return (
    <>
      <Header />
      
      <main className="flex-1 pb-16 md:pb-0">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-surface-light via-background to-background pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-surface-hover">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-start relative z-10">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="z-10 max-w-2xl">
                <Badge variant="success" className="mb-4 inline-flex">
                  🔥 عروض الدخول للمدارس رجعت!
                </Badge>
                <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  طلباتك كلها، <br className="hidden sm:block" />
                  <span className="text-primary">في السكة</span> لحد عندك.
                </h1>
                <p className="mb-8 text-lg text-gray-400 max-w-xl mx-auto sm:mx-0">
                  من السوبر ماركت للصيدلية، ومن اللبس للإلكترونيات. اختار اللي يعجبك وادفع كاش وانت بتستلم. أسهل، أسرع، وأوفر!
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-start">
                  <Button size="lg" className="w-full sm:w-auto text-lg rounded-full font-bold px-8 shadow-primary/30 shadow-lg" asChild>
                    <Link href="/category/all">يلا بينا نتسوق</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg rounded-full font-bold px-8" asChild>
                    <Link href="/offers">شوف العروض</Link>
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
                     <span>سريع ومضمون</span>
                   </div>
                </div>
              </div>

              {/* Hero Image Mock */}
              <div className="relative mx-auto mt-8 w-full max-w-md lg:mt-0 lg:max-w-none perspective-1000">
                <div className="aspect-[4/3] rounded-3xl bg-surface border border-surface-hover/50 p-4 shadow-premium relative overflow-hidden group transform hover:-rotate-y-2 transition-transform duration-700">
                   <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 opacity-60 mix-blend-overlay"></div>
                   <img src="https://images.unsplash.com/photo-1628102491629-778571d893a3?q=80&w=800&auto=format&fit=crop" alt="Shopping Box" className="object-cover w-full h-full rounded-2xl group-hover:scale-110 transition-transform duration-1000" />
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
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">بتدور في إيه؟</h2>
                <p className="mt-2 text-sm text-gray-500">أقسامنا كلها تحت أمرك</p>
              </div>
              <Link href="/categories" className="font-heading hidden sm:flex text-sm font-semibold text-primary hover:text-primary-hover">
                عرض كل الأقسام &larr;
              </Link>
            </div>
            
            <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-6 items-start">
              {MOCK_CATEGORIES.map((cat) => (
                <CategoryCard key={cat.slug} {...cat} className="w-[100px] sm:w-auto" />
              ))}
            </div>
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
                   <h2 className="text-2xl sm:text-3xl font-bold text-foreground">عروض جامدة متتفوتش</h2>
                </div>
                <p className="text-sm text-gray-500">وفر فلوسك واشتري بأسعار زمان</p>
              </div>
              <Link href="/offers" className="font-heading text-sm font-semibold text-secondary hover:underline">
                شوف أكتر
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {MOCK_FEATURED_PRODUCTS.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>

        {/* Banner Section */}
        <section className="py-12 sm:py-16">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 to-primary text-white p-8 sm:p-14 shadow-premium shadow-primary/20 flex flex-col sm:flex-row items-center justify-between group">
                 <div className="z-10 text-center sm:text-start mb-8 sm:mb-0">
                    <h3 className="text-3xl sm:text-4xl font-black mb-3 drop-shadow-sm">أطلب أول طلب ليك دلوقتي</h3>
                    <p className="text-white/90 text-lg sm:text-xl max-w-md font-medium leading-relaxed">
                       وهديتك 50 جنيه خصم وتوصيل مجاني بالكامل! 
                       <span className="block mt-3">استخدم كود: <span className="font-mono bg-black/20 px-3 py-1.5 rounded-lg inline-block tracking-widest text-white border border-white/10">AWAL50</span></span>
                    </p>
                 </div>
                 <Button variant="secondary" size="lg" className="rounded-xl text-primary font-bold shadow-xl mx-auto sm:mx-0 w-full sm:w-auto z-10 hover:scale-105 transition-transform h-14 px-8 text-lg" asChild>
                    <Link href="/login">سجل حساب جديد</Link>
                 </Button>
                 
                 {/* Decorative background elements */}
                 <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10 blur-3xl rounded-full w-96 h-96 bg-white pointer-events-none"></div>
                 <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-20 blur-2xl rounded-full w-64 h-64 bg-black pointer-events-none"></div>
              </div>
           </div>
        </section>

        {/* Best Sellers Section */}
        <section className="py-12 bg-background">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">الأكثر مبيعاً</h2>
                <p className="mt-2 text-sm text-gray-500">الناس كلها بتطلب الحاجات دي</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {MOCK_BEST_SELLERS.map((product) => (
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
                    <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">تأكد من طلبك الأول، وبعدين ادفع بطريقتك كاش بأمان تام وطمأنينة.</p>
                 </div>

                 <div className="flex flex-col items-center pt-8 md:pt-0 group">
                    <div className="h-20 w-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform duration-500">
                       <Clock className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">توصيل في الانجاز</h3>
                    <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">طلباتك هتوصلك في أسرع وقت ممكن، لأن وقتك يهمنا جداً.</p>
                 </div>

                 <div className="flex flex-col items-center pt-8 md:pt-0 group">
                    <div className="h-20 w-20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform duration-500">
                       <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-3 text-foreground drop-shadow-sm">جودة مضمونة 100%</h3>
                    <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">بنختار منتجاتنا بعناية عشان نضمنلك أفضل جودة بأحسن سعر ممكن.</p>
                 </div>

              </div>
           </div>
        </section>

      </main>

      <Footer />
      <MobileNav />
    </>
  )
}
