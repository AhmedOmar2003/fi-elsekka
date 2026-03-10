"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Trash2, Minus, Plus, Info, ArrowRight } from "lucide-react"

export default function CartPage() {
  const [quantities, setQuantities] = React.useState({ "p1": 1, "p2": 2 })
  
  const SUB_TOTAL = (450 * quantities["p1"]) + (65 * quantities["p2"])
  const SHIPPING = 35
  const TOTAL = SUB_TOTAL + SHIPPING

  return (
    <>
      <Header />
      <main className="flex-1 pb-36 md:pb-8 min-h-screen bg-background">
        
        <div className="bg-surface border-b border-surface-hover py-6 md:py-8">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl md:text-3xl font-black text-foreground">سلة المشتريات</h1>
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
               {/* Cart Items */}
               <div className="lg:col-span-8 flex flex-col gap-5">
                  
                  <div className="flex flex-col sm:flex-row gap-5 p-5 rounded-3xl bg-surface border border-surface-hover shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-28 h-28 shrink-0 rounded-2xl bg-surface-lighter border border-surface-hover relative overflow-hidden flex items-center justify-center p-3">
                        <img src="https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn" className="object-contain max-w-full max-h-full transition-transform duration-500 hover:scale-110" alt="" />
                     </div>
                     <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-4">
                           <div>
                              <h3 className="font-heading font-bold text-foreground leading-tight text-lg mb-1 line-clamp-2">سماعة بلوتوث لاسلكية عازلة للضوضاء</h3>
                              <p className="text-sm text-gray-400 font-medium mt-1">اللون: أسود</p>
                           </div>
                           <button className="text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 p-2.5 rounded-xl transition-colors shrink-0">
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-5">
                           <span className="font-heading font-black text-primary text-2xl tracking-tight">450 <span className="text-sm font-bold">ج.م</span></span>
                           <div className="flex items-center rounded-xl border border-surface-hover bg-background shadow-sm h-10">
                             <button onClick={() => setQuantities({...quantities, p1: Math.max(1, quantities.p1 - 1)})} className="px-3 hover:bg-surface text-gray-400 hover:text-foreground h-full rounded-e-xl transition-colors">
                                <Minus className="w-4 h-4" />
                             </button>
                             <span className="w-10 text-center font-bold text-base">{quantities.p1}</span>
                             <button onClick={() => setQuantities({...quantities, p1: quantities.p1 + 1})} className="px-3 hover:bg-surface text-gray-400 hover:text-foreground h-full rounded-s-xl transition-colors">
                                <Plus className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5 p-5 rounded-3xl bg-surface border border-surface-hover shadow-sm hover:shadow-md transition-shadow">
                     <div className="w-28 h-28 shrink-0 rounded-2xl bg-surface-lighter border border-surface-hover relative overflow-hidden flex items-center justify-center p-3">
                        <img src="https://th.bing.com/th/id/OIG4.X_Y_Z_A_B_C_D_E_F_G?pid=ImgGn" className="object-contain max-w-full max-h-full transition-transform duration-500 hover:scale-110" alt="" />
                     </div>
                     <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-4">
                           <div>
                              <h3 className="font-heading font-bold text-foreground leading-tight text-lg mb-1 line-clamp-2">زيت عباد الشمس 1 لتر</h3>
                              <p className="text-sm text-gray-400 font-medium mt-1">الوزن: 1 لتر - الماركة: عافية</p>
                           </div>
                           <button className="text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 p-2.5 rounded-xl transition-colors shrink-0">
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-5">
                           <span className="font-heading font-black text-primary text-2xl tracking-tight">65 <span className="text-sm font-bold">ج.م</span></span>
                           <div className="flex items-center rounded-xl border border-surface-hover bg-background shadow-sm h-10">
                             <button onClick={() => setQuantities({...quantities, p2: Math.max(1, quantities.p2 - 1)})} className="px-3 hover:bg-surface text-gray-400 hover:text-foreground h-full rounded-e-xl transition-colors">
                                <Minus className="w-4 h-4" />
                             </button>
                             <span className="w-10 text-center font-bold text-base">{quantities.p2}</span>
                             <button onClick={() => setQuantities({...quantities, p2: quantities.p2 + 1})} className="px-3 hover:bg-surface text-gray-400 hover:text-foreground h-full rounded-s-xl transition-colors">
                                <Plus className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                     </div>
                  </div>

              </div>

              {/* Order Summary */}
              <div className="lg:col-span-4">
                 <div className="rounded-3xl bg-surface border border-surface-hover p-6 sticky top-24 shadow-premium">
                    <h3 className="text-xl font-heading font-bold mb-6 text-foreground border-b border-surface-hover pb-4">ملخص الطلب</h3>
                    
                    <div className="space-y-4 mb-6 text-base">
                       <div className="flex justify-between items-center text-gray-300">
                          <span>المجموع الفرعي ({quantities.p1 + quantities.p2} منتج)</span>
                          <span className="font-heading font-semibold text-foreground">{SUB_TOTAL} ج.م</span>
                       </div>
                       <div className="flex justify-between items-center text-gray-300">
                          <span>رسوم التوصيل</span>
                          <span className="font-heading font-semibold text-foreground">{SHIPPING} ج.م</span>
                       </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-surface-hover pt-6 mb-6">
                       <span className="text-lg font-bold text-foreground">الإجمالي للدفع</span>
                       <span className="font-heading text-3xl font-black text-primary drop-shadow-sm">{TOTAL} <span className="text-sm">ج.م</span></span>
                    </div>

                    <p className="text-sm font-medium text-emerald-500/90 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 mb-8">
                       <Info className="w-5 h-5 shrink-0 mt-0.5" />
                       <span className="leading-relaxed">الأسعار شاملة ضريبة القيمة المضافة. الدفع كاش عند الاستلام فقط لضمان راحتك وأمانك.</span>
                    </p>

                    <Button size="lg" className="w-full h-14 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-shadow" asChild>
                       <Link href="/checkout">متابعة الشراء</Link>
                    </Button>
                    
                    <div className="mt-5 text-center">
                       <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-primary transition-colors group">
                          <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                          كمل تسوق
                       </Link>
                    </div>
                 </div>
              </div>

           </div>
        </div>

      </main>

      {/* Sticky Mobile Checkout Bar - sits above the fixed bottom nav */}
      <div className="fixed bottom-[65px] left-0 right-0 z-40 px-4 py-3 bg-surface/95 backdrop-blur-xl border-t border-surface-hover md:hidden">
         <div className="flex items-center justify-between max-w-lg mx-auto gap-4">
            <div className="flex flex-col">
               <span className="text-xs text-gray-400 font-medium">الإجمالي</span>
               <span className="font-heading font-black text-xl text-primary">{TOTAL} <span className="text-xs">ج.م</span></span>
            </div>
            <Button size="lg" className="flex-1 h-13 text-base font-black rounded-2xl shadow-lg shadow-primary/20" asChild>
               <Link href="/checkout">ماشي نكمل الطلب ⮞</Link>
            </Button>
         </div>
      </div>

      <Footer />
    </>
  )
}
