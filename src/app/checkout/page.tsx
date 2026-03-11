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
import { CheckCircle2, MapPin, CreditCard, User, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { createOrder } from "@/services/ordersService"
import { getDefaultDeliveryAddress, saveDeliveryAddress } from "@/services/deliveryService"

export default function CheckoutPage() {
   const router = useRouter()
   const { user, profile, isLoading: isAuthLoading } = useAuth()
   const { items, cartTotal, cartOriginalTotal, cartDiscountTotal, isLoading: isCartLoading } = useCart()
   const [isSubmitting, setIsSubmitting] = React.useState(false)
   const [errorMsg, setErrorMsg] = React.useState("")

   // Form states
   const [firstName, setFirstName] = React.useState("")
   const [lastName, setLastName] = React.useState("")
   const [phone, setPhone] = React.useState("")
   const [city, setCity] = React.useState("")
   const [area, setArea] = React.useState("")
   const [address, setAddress] = React.useState("")
   const [notes, setNotes] = React.useState("")

   // Pre-fill from user's default saved delivery address (delivery_info table)
   React.useEffect(() => {
      if (!user) return;
      getDefaultDeliveryAddress(user.id).then(addr => {
         if (addr) {
            if (addr.recipient_name) {
               const parts = addr.recipient_name.split(" ")
               setFirstName(parts[0] || "")
               setLastName(parts.slice(1).join(" ") || "")
            } else if (profile?.full_name) {
               const parts = (profile.full_name).split(" ")
               setFirstName(parts[0] || "")
               setLastName(parts.slice(1).join(" ") || "")
            }
            if (addr.phone_number) setPhone(addr.phone_number)
            if (addr.city) setCity(addr.city)
            if (addr.area) setArea(addr.area)
            if (addr.address) setAddress(addr.address)
         } else if (profile?.full_name) {
            // Fallback: fill name from profile if no delivery address yet
            const parts = (profile.full_name).split(" ")
            setFirstName(parts[0] || "")
            setLastName(parts.slice(1).join(" ") || "")
         }
      })
   }, [user, profile])

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user || items.length === 0) return
      setIsSubmitting(true)
      setErrorMsg("")

      const shippingDetails = {
         recipient: `${firstName} ${lastName}`,
         phone, city, area, street: address, notes
      }

      const { error } = await createOrder(user.id, items, shippingDetails, cartTotal + 35)
      setIsSubmitting(false)

      if (error) {
         setErrorMsg((error as any).message || "حصل خطأ أثناء تأكيد الطلب، حاول مرة أخرى!")
         return
      }

      // Save or update their delivery address for next time
      await saveDeliveryAddress(user.id, {
         label: 'المنزل',
         recipient_name: `${firstName} ${lastName}`,
         phone_number: phone,
         city, area, address,
         is_default: true
      })

      router.push('/order-success')
   }

   const isLoading = isAuthLoading || isCartLoading

   if (isLoading) {
      return (
         <>
            <Header />
            <main className="flex-1 pb-24 md:pb-8 bg-background flex items-center justify-center min-h-[60vh]">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </main>
            <Footer />
         </>
      )
   }

   if (!user) {
      return (
         <>
            <Header />
            <main className="flex-1 pb-24 md:pb-8 flex flex-col items-center justify-center min-h-[60vh] bg-background px-4 text-center">
               <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-surface-hover shadow-lg">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
               </div>
               <h2 className="text-2xl font-black text-foreground mb-3">لازم تسجل دخول الأول!</h2>
               <p className="text-gray-400 max-w-sm mb-8">عشان تقدر تكمل طلبك وتحفظ عناوينك، سجل دخول دلوقتي.</p>
               <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="rounded-xl px-10 font-bold text-lg shadow-primary/20 shadow-lg" asChild>
                     <Link href="/login?redirect=/checkout">تسجيل الدخول</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-xl px-10 font-bold text-lg" asChild>
                     <Link href="/register?redirect=/checkout">إنشاء حساب</Link>
                  </Button>
               </div>
            </main>
            <Footer />
         </>
      )
   }

   return (
      <>
         <Header />
         <main className="flex-1 pb-8 min-h-screen bg-background">

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
                              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="مثال: أحمد" />
                           </div>
                           <div className="space-y-2">
                              <Label htmlFor="lastName">الاسم الأخير</Label>
                              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="مثال: محمد" />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="phone">رقم الموبايل</Label>
                              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" required placeholder="01xxxxxxxxx" dir="ltr" className="text-right" />
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
                              <Select id="city" value={city} onChange={e => setCity(e.target.value)} required>
                                 <option value="" disabled>اختر المحافظة...</option>
                                 <option value="cairo">القاهرة</option>
                                 <option value="giza">الجيزة</option>
                                 <option value="alex">الإسكندرية</option>
                                 <option value="mansura">المنصورة</option>
                                 <option value="tanta">طنطا</option>
                                 <option value="assiut">أسيوط</option>
                                 <option value="luxor">الأقصر</option>
                                 <option value="aswan">أسوان</option>
                              </Select>
                           </div>
                           <div className="space-y-2">
                              <Label htmlFor="area">المنطقة / الحي</Label>
                              <Input id="area" value={area} onChange={e => setArea(e.target.value)} required placeholder="مثال: المعادي، مدينة نصر..." />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="address">عنوان الشارع بالتفصيل</Label>
                              <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required placeholder="اسم الشارع، رقم العمارة، رقم الشقة" />
                           </div>
                           <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="notes">علامة مميزة (اختياري)</Label>
                              <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="بجوار صيدلية، أمام مدرسة..." />
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
                        <h3 className="text-xl font-heading font-bold mb-6 text-foreground border-b border-surface-hover pb-4">ملخص طلبك</h3>

                        <div className="divide-y divide-surface-hover border-b border-surface-hover mb-6 pb-6 max-h-48 overflow-y-auto custom-scrollbar">
                           {items.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">السلة فارغة</p>
                           ) : items.map(item => (
                              <div key={item.id} className="flex justify-between py-3 text-sm">
                                 <div className="flex gap-3 items-center">
                                    <span className="font-heading font-black text-gray-400 w-5">{item.quantity}x</span>
                                    <span className="text-gray-300 line-clamp-1 font-medium">{item.product?.name || "منتج"}</span>
                                 </div>
                                 <div className="flex flex-col items-end shrink-0">
                                    <span className="font-heading font-bold text-foreground">
                                       {(() => {
                                          const p = item.product;
                                          if (!p) return 0;
                                          if (p.discount_percentage && p.discount_percentage > 0) {
                                             return Math.round(p.price * (1 - p.discount_percentage / 100)) * item.quantity;
                                          }
                                          return (p.price || 0) * item.quantity;
                                       })().toLocaleString()} ج.م
                                    </span>
                                    {item.product?.discount_percentage ? (
                                       <span className="text-[10px] text-rose-400 line-through">
                                          {((item.product.price || 0) * item.quantity).toLocaleString()}
                                       </span>
                                    ) : null}
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="space-y-4 mb-8 text-base font-medium">
                           <div className="flex justify-between items-center text-gray-400">
                              <span>المجموع الأصلي</span>
                              <span className="font-heading font-semibold text-foreground">{cartOriginalTotal.toLocaleString()} ج.م</span>
                           </div>
                           {cartDiscountTotal > 0 && (
                              <div className="flex justify-between items-center text-rose-400">
                                 <span>إجمالي الخصم</span>
                                 <span className="font-heading font-semibold text-rose-400">- {cartDiscountTotal.toLocaleString()} ج.م</span>
                              </div>
                           )}
                           <div className="flex justify-between items-center text-gray-400 pt-2 border-t border-surface-hover/50">
                              <span>المجموع بعد الخصم</span>
                              <span className="font-heading font-semibold text-foreground">{cartTotal.toLocaleString()} ج.م</span>
                           </div>
                           <div className="flex justify-between items-center text-gray-400">
                              <span>مصاريف التوصيل</span>
                              <span className="font-heading font-semibold text-foreground">35 ج.م</span>
                           </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-surface-hover pt-6 mb-8 bg-surface-lighter/50 rounded-xl p-4 mt-2">
                           <span className="text-lg font-bold text-foreground">الإجمالي للدفع</span>
                           <span className="font-heading text-3xl font-black text-primary drop-shadow-sm">{(cartTotal + 35).toFixed(0)} <span className="text-sm">ج.م</span></span>
                        </div>

                        {errorMsg && (
                           <p className="text-rose-500 text-sm text-center mb-4 bg-rose-500/10 p-3 rounded-xl">{errorMsg}</p>
                        )}

                        <Button
                           type="submit"
                           size="lg"
                           className="w-full text-lg font-bold rounded-xl h-14"
                           disabled={isSubmitting || items.length === 0}
                        >
                           {isSubmitting ? (
                              <div className="flex items-center gap-2">
                                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                 جاري التأكيد...
                              </div>
                           ) : 'تأكيد الطلب'}
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
