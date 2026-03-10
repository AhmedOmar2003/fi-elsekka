import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { CheckCircle2, PackageCheck } from "lucide-react"

export default function OrderSuccessPage() {
  const ORDER_ID = "FS-849201"

  return (
    <>
      <Header />
      <main className="flex-1 min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center py-16 px-4">
        
        <div className="w-full max-w-lg bg-surface border border-surface-hover rounded-[2rem] p-8 sm:p-12 text-center shadow-premium relative overflow-hidden">
           
           {/* Decorative background elements */}
           <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-20 blur-3xl rounded-full w-64 h-64 bg-emerald-500 pointer-events-none"></div>

           <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-500/5 shadow-inner">
                 <CheckCircle2 className="w-12 h-12" />
              </div>

              <h1 className="text-3xl font-heading font-black text-foreground mb-4 drop-shadow-sm">طلبك بقى في السكة! 🎉</h1>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed font-medium">
                 تم استلام طلبك بنجاح. هنجهزه بأسرع وقت وهنتواصل معاك لتأكيد ميعاد الاستلام وتقدر تدفع كاش للمندوب. نورتنا! 
              </p>

              <div className="bg-background rounded-2xl w-full p-6 border border-surface-hover mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                 <div className="text-center sm:text-start flex flex-col gap-1">
                    <p className="text-gray-500 text-sm font-medium">رقم الطلب</p>
                    <p className="font-mono text-xl font-bold text-foreground bg-surface-hover/50 px-3 py-1 rounded-lg inline-block tracking-widest">{ORDER_ID}</p>
                 </div>
                 <div className="h-12 w-px bg-surface-hover hidden sm:block"></div>
                 <div className="text-center sm:text-end text-sm text-gray-400 flex flex-col gap-1">
                    <p className="font-medium">المبلغ المطلوب</p>
                    <p className="font-heading font-black text-primary text-2xl drop-shadow-sm">615 <span className="text-sm">ج.م</span></p>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row w-full gap-4 justify-center">
                 <Button size="lg" className="w-full rounded-2xl text-lg font-bold h-14 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-shadow gap-2" asChild>
                    <Link href="/orders"><PackageCheck className="w-5 h-5" /> تابع طلبك</Link>
                 </Button>
                 <Button variant="outline" size="lg" className="w-full rounded-2xl text-lg font-bold border-2 h-14 hover:bg-surface-hover transition-colors" asChild>
                    <Link href="/">كمل تسوق</Link>
                 </Button>
              </div>
           </div>

        </div>

      </main>
      <Footer />
    </>
  )
}
