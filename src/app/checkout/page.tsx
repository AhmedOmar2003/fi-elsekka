"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { CheckCircle2, MapPin, CreditCard, User } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Mock API call
    setTimeout(() => {
      router.push('/checkout/success')
    }, 1500)
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-16 min-h-screen bg-background">
        
        <div className="bg-surface border-b border-surface-hover py-4 md:py-6">
           <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-xl md:text-2xl font-black text-foreground">إتمام الطلب</h1>
           </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Checkout Form */}
              <div className="lg:col-span-7 space-y-8">
                 
                 {/* Contact Details */}
                 <div className="bg-surface rounded-3xl border border-surface-hover p-6 sm:p-8 shadow-sm hover:shadow-premium transition-shadow">
                    <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-3 border-b border-surface-hover pb-4">
                       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <User className="w-5 h-5" />
                       </span>
                       المعلومات الشخصية
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-2">
                         <Label htmlFor="firstName">الاسم الأول</Label>
                         <Input id="firstName" required placeholder="مثال: أحمد" />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="lastName">الاسم الأخير</Label>
                         <Input id="lastName" required placeholder="مثال: محمد" />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                         <Label htmlFor="phone">رقم الموبايل</Label>
                         <Input id="phone" type="tel" required placeholder="01xxxxxxxxx" dir="ltr" className="text-right" />
                         <p className="text-xs text-gray-400">هنتواصل معاك على الرقم ده لتأكيد الطلب</p>
                       </div>
                    </div>
                 </div>

                 {/* Delivery Details */}
                 <div className="bg-surface rounded-3xl border border-surface-hover p-6 sm:p-8 shadow-sm hover:shadow-premium transition-shadow">
                    <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-3 border-b border-surface-hover pb-4">
                       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <MapPin className="w-5 h-5" />
                       </span>
                       عنوان التوصيل
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-2">
                         <Label htmlFor="city">المحافظة</Label>
                         <Select id="city" required defaultValue="">
                           <option value="" disabled>اختر المحافظة...</option>
                           <option value="cairo">القاهرة</option>
                           <option value="giza">الجيزة</option>
                           <option value="alex">الإسكندرية</option>
                         </Select>
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="area">المنطقة / الحي</Label>
                         <Input id="area" required placeholder="مثال: المعادي، مدينة نصر..." />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                         <Label htmlFor="address">عنوان الشارع بالتفصيل</Label>
                         <Input id="address" required placeholder="اسم الشارع، رقم العمارة، رقم الشقة" />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                         <Label htmlFor="notes">علامة مميزة (اختياري)</Label>
                         <Input id="notes" placeholder="بجوار صيدلية، أمام مدرسة..." />
                       </div>
                    </div>
                 </div>

                 {/* Payment Method */}
                 <div className="bg-surface rounded-3xl border border-surface-hover p-6 sm:p-8 shadow-sm hover:shadow-premium transition-shadow">
                    <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-3 border-b border-surface-hover pb-4">
                       <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                          <CreditCard className="w-5 h-5" />
                       </span>
                       طريقة الدفع
                    </h2>
                    
                    <label className="relative flex cursor-pointer rounded-2xl border-2 border-primary bg-primary/5 p-5 focus:outline-none shadow-sm transition-all hover:bg-primary/10">
                      <input type="radio" name="payment" value="cod" className="sr-only" defaultChecked />
                      <div className="flex w-full items-center justify-between">
                         <div className="flex items-center gap-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-primary/20">
                               <CheckCircle2 className="w-6 h-6 text-primary" />
                            </span>
                            <div className="text-sm">
                               <p className="font-heading font-bold text-base text-foreground mb-1">الدفع عند الاستلام (كاش)</p>
                               <p className="text-gray-400">ادفع براحتك لما المندوب يوصلك وتستلم طلبك وتقييمه.</p>
                            </div>
                         </div>
                      </div>
                    </label>
                 </div>

              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-5">
                 <div className="rounded-3xl bg-surface border border-surface-hover p-6 sm:p-8 sticky top-24 shadow-premium">
                    <h3 className="text-xl font-heading font-bold mb-6 text-foreground border-b border-surface-hover pb-4">طلبك</h3>
                    
                    {/* Mock Items list */}
                    <div className="divide-y divide-surface-hover border-b border-surface-hover mb-6 pb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       <div className="flex justify-between py-3 text-sm">
                         <div className="flex gap-3 items-center">
                            <span className="font-heading font-black text-gray-400 w-5">1x</span>
                            <span className="text-gray-300 line-clamp-1 font-medium">سماعة بلوتوث لاسلكية</span>
                         </div>
                         <span className="font-heading font-bold text-foreground shrink-0">450 ج.م</span>
                       </div>
                       <div className="flex justify-between py-3 text-sm">
                         <div className="flex gap-3 items-center">
                            <span className="font-heading font-black text-gray-400 w-5">2x</span>
                            <span className="text-gray-300 line-clamp-1 font-medium">زيت عباد الشمس 1 لتر</span>
                         </div>
                         <span className="font-heading font-bold text-foreground shrink-0">130 ج.م</span>
                       </div>
                    </div>

                    <div className="space-y-4 mb-8 text-base font-medium">
                       <div className="flex justify-between items-center text-gray-400">
                          <span>المجموع الفرعي</span>
                          <span className="font-heading font-semibold text-foreground">580 ج.م</span>
                       </div>
                       <div className="flex justify-between items-center text-gray-400">
                          <span>مصاريف التوصيل</span>
                          <span className="font-heading font-semibold text-foreground">35 ج.م</span>
                       </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-surface-hover pt-6 mb-8 bg-surface-lighter/50 rounded-xl p-4 mt-2">
                       <span className="text-lg font-bold text-foreground">الإجمالي للدفع</span>
                       <span className="font-heading text-3xl font-black text-primary drop-shadow-sm">615 <span className="text-sm">ج.م</span></span>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full text-lg font-bold rounded-xl h-14" 
                      isLoading={isSubmitting}
                    >
                       تأكيد الطلب
                    </Button>
                    
                    <p className="mt-4 text-xs text-center text-gray-500">
                       بالضغط على تأكيد الطلب، أنت توافق على الشروط والأحكام وسياسة الخصوصية الخاصة بنا.
                    </p>
                 </div>
              </div>

           </form>
        </div>
      </main>
      <Footer />
    </>
  )
}
