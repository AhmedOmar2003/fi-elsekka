import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-background pb-20">
        
        {/* Hero Section */}
        <div className="relative bg-surface py-16 md:py-24 overflow-hidden border-b border-surface-hover">
           <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10 blur-3xl rounded-full w-96 h-96 bg-primary pointer-events-none"></div>
           <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6">احنا <span className="text-primary">في السكة</span> معاك</h1>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                 أكتر من مجرد متجر، إحنا صاحبك الجدع اللي بيوفرلك كل احتياجاتك، من الإبرة للصاروخ، بسرعة، أمان، وأنت مطمن لأن الدفع كله مع الاستلام.
              </p>
           </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
           
           <section className="text-center sm:text-start flex flex-col sm:flex-row gap-8 items-center">
              <div className="w-24 h-24 shrink-0 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center -rotate-6">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-foreground mb-3">ليه بدأنا «في السكة»؟</h2>
                 <p className="text-gray-400 leading-relaxed">
                    لاحظنا إن التسوق الأونلاين أحياناً بيكون معقد، أو الناس بتخاف تدفع بفيزا، أو التوصيل بيتأخر. فقررنا نجمع كل المنتجات الحلوة والموثوقة في مكان واحد، ونخلي الدفع <span className="text-white font-bold">كاش عند الاستلام بس</span> عشان كل حد يشتري وهو متطمن.
                 </p>
              </div>
           </section>

           <section className="text-center sm:text-start flex flex-col sm:flex-row-reverse gap-8 items-center">
              <div className="w-24 h-24 shrink-0 rounded-3xl bg-secondary/10 text-secondary flex items-center justify-center rotate-6">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-foreground mb-3">سرعتنا سر نجاحنا</h2>
                 <p className="text-gray-400 leading-relaxed">
                    اسمنا مبني على إن طلبك <span className="text-white font-bold">في السكة</span> دايماً. بمجرد ما بتأكد الطلب، فريقنا بيتحرك فوراً عشان نضمن إن الأوردر يوصلك في أسرع وقت وفي أحسن حالة، لأننا مقدرين وقتك.
                 </p>
              </div>
           </section>

           <section className="text-center sm:text-start flex flex-col sm:flex-row gap-8 items-center">
              <div className="w-24 h-24 shrink-0 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center -rotate-3">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-foreground mb-3">التجربة المحلية الأقرب لقلبك</h2>
                 <p className="text-gray-400 leading-relaxed">
                    إحنا مش مجرد منصة عالمية باردة، إحنا فريق مصري فاهم دماغك وعارف إنت بتحب إيه. بنتكلم لغتك، وبنقدملك العروض اللي فعلاً تهمك، وبنتعامل معاك كأنك أول وأهم عميل عندنا.
                 </p>
              </div>
           </section>

        </div>

      </main>
      <Footer />
    </>
  )
}
