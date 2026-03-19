"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { CURRENT_DELIVERY_FEE } from '@/lib/order-economics';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
   const { items, cartTotal, cartOriginalTotal, cartDiscountTotal, isLoading, updateQuantity, removeItem } = useCart();
   const router = useRouter();
   const [updatingItems, setUpdatingItems] = useState<{ [key: string]: boolean }>({});

   // Handler for quantity updates to show local loading state
   const handleUpdateQuantity = async (id: string, newQuantity: number) => {
      if (newQuantity < 1) {
         handleRemoveItem(id);
         return;
      }
      setUpdatingItems(prev => ({ ...prev, [id]: true }));
      await updateQuantity(id, newQuantity);
      setUpdatingItems(prev => ({ ...prev, [id]: false }));
   };

   // Handler for removing an item
   const handleRemoveItem = async (id: string) => {
      setUpdatingItems(prev => ({ ...prev, [id]: true }));
      await removeItem(id);
      setUpdatingItems(prev => ({ ...prev, [id]: false }));
   };

   const shippingCost: number = CURRENT_DELIVERY_FEE;
   const grandTotal = cartTotal + shippingCost;

   if (isLoading) {
      return (
         <>
            <Header />
            <main className="min-h-screen bg-background pt-20 pb-24 md:pb-16">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                  {/* Header skeleton */}
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-14 h-14 rounded-2xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                     <div className="space-y-2">
                        <div className="h-7 w-48 rounded-xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                        <div className="h-4 w-28 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                     {/* Items skeleton */}
                     <div className="lg:col-span-8 space-y-4">
                        {[1,2,3].map(i => (
                           <div key={i} className="bg-surface border border-surface-hover rounded-3xl p-4 sm:p-5 flex gap-5">
                              <div className="w-28 h-28 rounded-2xl bg-surface-hover shrink-0 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                              <div className="flex-1 flex flex-col gap-3">
                                 <div className="h-5 w-3/4 rounded-lg bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                                 <div className="h-4 w-24 rounded-lg bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                                 <div className="mt-auto flex items-center justify-between">
                                    <div className="h-10 w-28 rounded-xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     {/* Summary skeleton */}
                     <div className="lg:col-span-4">
                        <div className="bg-surface border border-surface-hover rounded-3xl p-6 space-y-4">
                           <div className="h-6 w-32 rounded-xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                           {[1,2,3].map(i => (
                              <div key={i} className="flex justify-between">
                                 <div className="h-4 w-24 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                                 <div className="h-4 w-16 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                              </div>
                           ))}
                           <div className="h-14 w-full rounded-2xl bg-primary/20 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent mt-4" />
                        </div>
                     </div>
                  </div>
               </div>
            </main>
            <Footer />
         </>
      );
   }

   return (
      <>
         <Header />
         <main className="min-h-screen bg-background pt-20 pb-24 md:pb-16">

            {/* Decorative background glows */}
            <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

               {/* Header */}
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                     <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-heading font-black text-foreground">سلة المشتريات</h1>
                     <p className="text-gray-400 text-sm mt-1">{items.length} منتجات في السلة</p>
                  </div>
               </div>

               {items.length === 0 ? (
                  // Empty State
                  <div className="bg-surface border border-surface-hover rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[50vh]">
                     <div className="w-24 h-24 bg-surface-hover rounded-full flex items-center justify-center mb-6 text-gray-400">
                        <ShoppingBag className="w-12 h-12" />
                     </div>
                     <h2 className="text-2xl font-bold text-foreground mb-3">سلتك فارغة تماماً!</h2>
                     <p className="text-gray-400 mb-8 max-w-md">يبدو أنك لم تقم بإضافة أي منتجات إلى سلتك حتى الآن. تصفح أقسامنا واكتشف أفضل العروض.</p>
                     <Button size="lg" className="rounded-xl px-10 h-14 font-bold text-lg shadow-primary/20 shadow-lg" asChild>
                        <Link href="/category/all">
                           تصفح المنتجات الآن
                           <ArrowRight className="w-5 h-5 mr-2" />
                        </Link>
                     </Button>
                  </div>
               ) : (
                  // Filled Cart Grid
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                     {/* Left Column: Cart Items (8 cols) */}
                     <div className="lg:col-span-8 space-y-4">
                        <AnimatePresence initial={false}>
                           {items.map((item) => (
                              <motion.div
                                 key={item.id}
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, x: -50, scale: 0.95 }}
                                 layout
                                 className="bg-surface border border-surface-hover rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-stretch relative overflow-hidden group"
                              >
                                 {/* Item Image */}
                                 <div className="w-full sm:w-32 h-40 sm:h-32 rounded-2xl flex-shrink-0 relative overflow-hidden border border-surface-hover/50">
                                    {item.product?.image_url ? (
                                       <Image
                                          src={item.product?.image_url}
                                          alt={item.product?.name || "Product image"}
                                          fill
                                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                                       />
                                    ) : (
                                       <div className="absolute inset-0 flex items-center justify-center bg-surface-hover text-gray-400">
                                          <ShoppingBag className="w-8 h-8 opacity-50" />
                                       </div>
                                    )}
                                 </div>

                                 {/* Item Details */}
                                 <div className="flex-1 flex flex-col justify-between w-full">
                                    <div className="flex justify-between items-start gap-4 mb-4 sm:mb-0">
                                       <div>
                                          <Link href={`/product/${item.product?.slug || item.product_id}`} className="block">
                                             <h3 className="font-bold text-lg text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                                                {item.product?.name}
                                             </h3>
                                          </Link>
                                          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline gap-2">
                                             <p className="text-secondary font-black text-lg">
                                                {(() => {
                                                   const p = item.product;
                                                   if (!p) return 0;
                                                   if (p.discount_percentage && p.discount_percentage > 0) {
                                                      return Math.round(p.price * (1 - p.discount_percentage / 100));
                                                   }
                                                   return p.price || 0;
                                                })().toLocaleString()} ج.م
                                             </p>
                                             {item.product?.discount_percentage ? (
                                                <div className="flex items-center gap-2">
                                                   <p className="text-sm text-gray-400 line-through">
                                                      {(item.product.price || 0).toLocaleString()} ج.م
                                                   </p>
                                                   <span className="text-xs bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded">
                                                      خصم {item.product.discount_percentage}%
                                                   </span>
                                                </div>
                                             ) : null}
                                          </div>
                                       </div>

                                       {/* Desktop Delete Target */}
                                       <button
                                          onClick={() => handleRemoveItem(item.id)}
                                          disabled={updatingItems[item.id]}
                                          className="hidden sm:flex text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 p-2.5 rounded-xl transition-colors disabled:opacity-50"
                                          title="حذف من السلة"
                                       >
                                          <Trash2 className="w-5 h-5" />
                                       </button>
                                    </div>

                                    {/* Controls Row */}
                                    <div className="flex items-center justify-between mt-auto">
                                       {/* Quantity Controller */}
                                       <div className="flex items-center bg-background border border-surface-hover rounded-xl p-1 shadow-sm">
                                          <button
                                             onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                             disabled={updatingItems[item.id]}
                                             className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-surface hover:text-rose-500 rounded-lg transition-colors disabled:opacity-50"
                                          >
                                             {item.quantity <= 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                          </button>

                                          <span className="w-12 text-center font-bold text-sm select-none">
                                             {updatingItems[item.id] ? (
                                                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                                             ) : (
                                                item.quantity
                                             )}
                                          </span>

                                          <button
                                             onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                             disabled={updatingItems[item.id]}
                                             className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-surface hover:text-primary rounded-lg transition-colors disabled:opacity-50"
                                          >
                                             <Plus className="w-4 h-4" />
                                          </button>
                                       </div>

                                       {/* Mobile Delete */}
                                       <button
                                          onClick={() => handleRemoveItem(item.id)}
                                          disabled={updatingItems[item.id]}
                                          className="sm:hidden text-gray-400 hover:text-rose-500 flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-50"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                          حذف
                                       </button>
                                    </div>
                                 </div>
                              </motion.div>
                           ))}
                        </AnimatePresence>
                     </div>

                     {/* Right Column: Order Summary (4 cols) */}
                     <div className="lg:col-span-4 max-lg:order-first">
                        <div className="bg-surface border border-surface-hover rounded-3xl p-6 md:p-8 lg:sticky lg:top-28 shadow-xl shadow-black/5">
                           <h2 className="text-xl font-bold font-heading text-foreground mb-6 pb-4 border-b border-surface-hover">ملخص الطلب</h2>

                           <div className="space-y-4 mb-6">
                              <div className="flex justify-between text-gray-400">
                                 <span>المجموع الأصلي ({items.reduce((t, i) => t + i.quantity, 0)} منتجات)</span>
                                 <span className="font-bold text-foreground">{cartOriginalTotal.toLocaleString()} ج.م</span>
                              </div>
                              {cartDiscountTotal > 0 && (
                                 <div className="flex justify-between text-rose-400">
                                    <span>إجمالي الخصم</span>
                                    <span className="font-bold">- {cartDiscountTotal.toLocaleString()} ج.م</span>
                                 </div>
                              )}
                              <div className="flex justify-between text-gray-400 pt-2 border-t border-surface-hover/50">
                                 <span>المجموع بعد الخصم</span>
                                 <span className="font-bold text-foreground">{cartTotal.toLocaleString()} ج.م</span>
                              </div>
                              <div className="flex justify-between text-gray-400">
                                 <span>مصاريف الشحن</span>
                                 {shippingCost === 0 ? (
                                    <span className="font-bold text-emerald-500">مجانًا</span>
                                 ) : (
                                    <span className="font-bold text-foreground">{shippingCost.toLocaleString()} ج.م</span>
                                 )}
                              </div>
                           </div>

                           <div className="pt-4 border-t border-surface-hover mb-8">
                              <div className="flex justify-between items-end">
                                 <span className="text-lg font-bold text-foreground">الإجمالي الكلي</span>
                                 <div className="text-end">
                                    <span className="block text-2xl font-black text-primary">{grandTotal.toLocaleString()} ج.م</span>
                                    <span className="text-[11px] text-gray-500">شامل ضريبة القيمة المضافة إن وجدت</span>
                                 </div>
                              </div>
                           </div>

                           <Button
                              size="lg"
                              className="w-full rounded-2xl h-14 font-bold text-lg shadow-primary/20 shadow-lg group"
                              onClick={() => router.push('/checkout')}
                           >
                              متابعة الدفع
                              <ArrowRight className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                           </Button>

                           <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                              <ShoppingBag className="w-4 h-4" />
                              تسوق إلكتروني آمن 100%
                           </div>
                        </div>
                     </div>

                  </div>
               )}
            </div>
         </main>
         <Footer />
      </>
   );
}
