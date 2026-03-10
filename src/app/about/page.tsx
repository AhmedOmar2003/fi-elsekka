"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShieldCheck, Zap, HeartHandshake, Smile, TrendingUp, CheckCircle2 } from "lucide-react"

export default function AboutUsPage() {
  return (
    <>
      <Header />

      <main className="flex-1 pb-24 md:pb-16 bg-background">
        
        {/* Subtle decorative background glow */}
        <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10"></div>
        <div className="fixed top-40 right-10 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="relative px-4 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center max-w-4xl mx-auto overflow-hidden">
          
          <div className="inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 bg-primary/10 rounded-full mb-6 sm:mb-8 border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <span className="text-primary font-bold text-sm sm:text-base tracking-wide flex items-center gap-2">
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              أهلاً بيك في عالم "في السكة"
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-foreground mb-6 sm:mb-8 leading-[1.2] drop-shadow-sm tracking-tight text-balance">
            صاحبك الجدع في رحلة <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
              التسوق الأونلاين
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed text-balance">
            إحنا مش مجرد متجر أونلاين، إحنا فكرنا إزاي نوفر عليك المشوار والتعب، ونجيبلك كل اللي بتحبه وتثق فيه لحد باب بيتك، وبأسهل طريقة ممكنة.
          </p>
        </section>

        {/* ── Our Story ──────────────────────────────────────────────── */}
        <section className="px-4 py-12 sm:py-16 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 items-center">
            
            {/* Story Image / Graphic */}
            <div className="relative aspect-square sm:aspect-[4/3] rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-surface to-surface-light border border-surface-hover overflow-hidden shadow-2xl shadow-primary/5 flex items-center justify-center group">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-700"></div>
              {/* Abstract structural shapes */}
              <div className="relative w-3/4 h-3/4  opacity-80 flex flex-col items-center justify-center gap-4">
                <ShieldCheck className="w-24 h-24 sm:w-32 sm:h-32 text-slate-700 drop-shadow-lg transform transition-transform duration-700 group-hover:-rotate-12 group-hover:scale-110" />
                <div className="w-full h-2 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full mt-4 blur-[1px]"></div>
              </div>
            </div>

            {/* Story Text */}
            <div className="flex flex-col">
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-4 sm:mb-6">
                إزاي بدأنا الحكاية؟
              </h2>
              <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-gray-400 leading-relaxed text-justify sm:text-start">
                <p>
                  الفكرة دايماً كانت بتبدأ من احتياج بسيط. كنا بنشوف إزاي الناس بتعاني عشان تلاقي كذا منتج من أماكن مختلفة، ومصاريف الشحن بتكتر، والوقت بيضيع. فكرنا... ليه ميبقاش في مكان واحد يلم كل ده؟
                </p>
                <p>
                  من هنا اتولدت فكرة <strong className="text-foreground">"في السكة"</strong>. اسم بيعبر عننا، عن سرعتنا وعن إننا دايماً في طريقنا ليك. جمعنا المنتجات اللي البيت بيحتاجها، والموضة، والإلكترونيات، وحتى لعب الأطفال، عشان نوفرلك تجربة تسوق متكاملة.
                </p>
                <div className="flex items-center gap-3 pt-2 text-primary font-bold text-lg sm:text-xl">
                  <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span>عشان نفضل دايماً رقم واحد في الثقة.</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── Mission & Features Grid ─────────────────────────────────── */}
        <section className="px-4 py-12 sm:py-20 max-w-7xl mx-auto relative">
          
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-4">
              إيه اللي بيميزنا؟
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              مش مجرد كلام بنقوله، دي مبادئ بنمشي عليها عشان نضمنلك تجربة تسوق تفرحك وترجع تطلب منها تاني بثقة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            
            {/* Feature 1 */}
            <div className="bg-surface border border-surface-hover p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:-translate-y-2 hover:border-emerald-500/30 hover:shadow-[0_12px_40px_rgba(16,185,129,0.1)] transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-5 sm:mb-6 shadow-[0_4px_20px_rgba(16,185,129,0.2)]">
                <Zap className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-3">
                سرعة في التوصيل
              </h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                عارفين إنك مستعجل، عشان كده بنحاول دايماً نوصل طلبك في أسرع وقت ممكن وبأعلى معايير الأمان.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface border border-surface-hover p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_12px_40px_rgba(59,130,246,0.1)] transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-5 sm:mb-6 shadow-[0_4px_20px_rgba(59,130,246,0.2)]">
                <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-3">
                دفع آمن ١٠٠٪
              </h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                وفرنالك خدمة "الدفع عند الاستلام" عشان تدفع براحتك لما المنتج يوصلك وتتأكد منه بنفسك من غير أي بطاقات بنكية.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface border border-surface-hover p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:-translate-y-2 hover:border-rose-500/30 hover:shadow-[0_12px_40px_rgba(244,63,94,0.1)] transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-5 sm:mb-6 shadow-[0_4px_20px_rgba(244,63,94,0.2)]">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-3">
                جودة مضمونة
              </h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                بنختار المنتجات والموردين بعناية شديدة عشان نضمنلك تاخد أفضل جودة وأحسن سعر في السوق من غير مفاجآت.
              </p>
            </div>

          </div>
        </section>

        {/* ── Call to Action Board ────────────────────────────────────── */}
        <section className="px-4 py-8 sm:py-16 max-w-5xl mx-auto">
          <div className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden p-[2px] bg-gradient-to-br from-primary/50 via-primary/10 to-transparent shadow-[0_8px_40px_rgba(16,185,129,0.2)]">
            <div className="relative bg-surface p-8 sm:p-14 rounded-[calc(2rem-2px)] sm:rounded-[calc(3rem-2px)] text-center flex flex-col items-center overflow-hidden">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full mix-blend-screen pointer-events-none"></div>
              
              <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-primary mb-4 sm:mb-6" />
              <h2 className="text-2xl sm:text-4xl font-heading font-black text-foreground mb-3 sm:mb-4">
                مستني إيه؟ ابدأ تسوق دلوقتي!
              </h2>
              <p className="text-sm sm:text-base text-gray-400 max-w-lg mb-6 sm:mb-8 leading-relaxed">
                انضم لعيلتنا واستمتع بأقوى العروض والخصومات الحصرية اللي مش هتلاقيها في أي مكان تاني.
              </p>
              
              <Link href="/" className="inline-flex">
                <button className="h-12 sm:h-14 px-8 sm:px-10 rounded-2xl sm:rounded-3xl font-heading font-bold text-base sm:text-lg text-white bg-primary hover:bg-primary-hover shadow-[0_8px_30px_rgba(16,185,129,0.4)] active:scale-95 transition-all">
                  تصفح المنتجات
                </button>
              </Link>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
