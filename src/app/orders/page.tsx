"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/contexts/AuthContext"
import { fetchUserOrders, Order } from "@/services/ordersService"
import { supabase } from "@/lib/supabase"
import { Package, ShoppingBag, Clock, Truck, CheckCircle2, XCircle, ChevronDown, ChevronUp, Wifi, Phone, Star } from "lucide-react"

// ─── Driver Rating Widget ──────────────────────────────────────────────────
function DriverRating({ orderId, driverId, userId }: { orderId: string; driverId: string; userId: string }) {
  const [existingRating, setExistingRating] = React.useState<number | null>(null)
  const [existingComment, setExistingComment] = React.useState('')
  const [hovered, setHovered] = React.useState(0)
  const [selected, setSelected] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    supabase
      .from('driver_reviews')
      .select('rating, comment')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingRating(data.rating)
          setExistingComment(data.comment || '')
          setSelected(data.rating)
        }
        setLoaded(true)
      })
  }, [orderId, userId])

  if (!loaded) return null

  const handleSubmit = async () => {
    if (!selected) return
    setSubmitting(true)
    const { error } = await supabase.from('driver_reviews').upsert({
      order_id: orderId,
      driver_id: driverId,
      user_id: userId,
      rating: selected,
      comment: comment.trim() || null
    }, { onConflict: 'order_id' })
    setSubmitting(false)
    if (!error) {
      setExistingRating(selected)
      setExistingComment(comment)
      setSubmitted(true)
    }
  }

  return (
    <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 space-y-3">
      <p className="text-xs font-black uppercase text-amber-500/80">⭐ قيّم تجربة التوصيل</p>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(star => (
          <button
            key={star}
            disabled={!!existingRating}
            onClick={() => !existingRating && setSelected(star)}
            onMouseEnter={() => !existingRating && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform active:scale-90 disabled:cursor-default"
          >
            <Star className={`w-8 h-8 transition-colors ${star <= (hovered || existingRating || selected) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
          </button>
        ))}
        {existingRating && <span className="mr-2 text-sm font-black text-amber-500">{existingRating}/5</span>}
      </div>
      {!existingRating && (
        <>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="تعليق اختياري على المندوب..."
            rows={2}
            className="w-full bg-background border border-surface-hover rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full bg-amber-400 text-black font-black py-2.5 rounded-xl text-sm hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم ⭐'}
          </button>
        </>
      )}
      {existingRating && existingComment && (
        <p className="text-xs text-gray-500 italic">"{existingComment}"</p>
      )}
      {submitted && <p className="text-xs text-emerald-500 font-bold">✅ شكراً! تم إرسال تقييمك للمندوب.</p>}
    </div>
  )
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "في الانتظار",
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    icon: <Clock className="w-4 h-4" />,
  },
  processing: {
    label: "جاري التجهيز",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    icon: <Package className="w-4 h-4" />,
  },
  shipped: {
    label: "🏍️ المندوب في الطريق",
    color: "text-primary bg-primary/10 border-primary/20",
    icon: <Truck className="w-4 h-4" />,
  },
  delivered: {
    label: "تم التوصيل",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  cancelled: {
    label: "ملغي",
    color: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    icon: <XCircle className="w-4 h-4" />,
  },
}

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const steps = ['pending', 'processing', 'shipped', 'delivered']
  const currentIndex = steps.indexOf(currentStatus) >= 0 ? steps.indexOf(currentStatus) : 0

  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-500">
        <XCircle className="w-6 h-6 shrink-0" />
        <div>
          <p className="font-bold text-sm">تم إلغاء الطلب</p>
          <p className="text-xs opacity-80 mt-0.5">يرجى التواصل مع الدعم الفني لو محتاج مساعدة.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between w-full relative pt-2 pb-8 px-2 sm:px-4">
      {steps.map((step, idx) => {
        const isActive = idx <= currentIndex
        const isLast = idx === steps.length - 1
        const meta = STATUS_MAP[step]

        return (
          <React.Fragment key={step}>
            <div className="relative flex flex-col items-center z-10 shrink-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  isActive
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-surface border-surface-hover text-gray-400'
                }`}
              >
                {meta.icon}
              </div>
              <p
                className={`text-[10px] sm:text-xs font-bold absolute top-12 w-20 text-center transition-colors duration-500 ${
                  isActive ? 'text-foreground' : 'text-gray-400'
                }`}
              >
                {meta.label.replace('🏍️ ', '')}
              </p>
            </div>
            
            {!isLast && (
              <div className="flex-1 h-1.5 mx-1 sm:mx-2 rounded-full bg-surface-hover overflow-hidden relative z-0">
                <div 
                  className="absolute inset-y-0 right-0 bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: idx < currentIndex ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function OrderCard({ order, userId }: { order: Order; userId: string }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_MAP[order.status] || { label: order.status, color: "text-gray-500 bg-surface-hover border-surface-border", icon: <Package className="w-4 h-4" /> }
  const date = new Date(order.created_at).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  })
  const etaDays = Number(order.shipping_address?.estimated_delivery_days || 0)
  const etaHours = Number(order.shipping_address?.estimated_delivery_hours || 0)
  const customerCancelReason = order.shipping_address?.cancellation_reason
  const customerCancelMessage = order.shipping_address?.cancellation_message

  const etaWindow = etaDays > 0 && etaHours > 0
    ? `${etaDays} يوم و${etaHours} ساعة`
    : etaDays > 0
      ? `${etaDays} يوم`
      : etaHours > 0
        ? `${etaHours} ساعة`
        : null

  return (
    <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-premium transition-all">
      {/* Header row */}
      <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">طلب #{order.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-0.5">{date}</p>
        </div>
        <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${status.color} shrink-0`}>
          {status.icon}
          {status.label}
        </div>
        <button
          className={`p-1.5 rounded-lg text-gray-500 hover:text-foreground hover:bg-surface-hover transition-all shrink-0 ${expanded ? 'bg-surface-hover' : ''}`}
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-surface-hover p-4 sm:p-5 space-y-5 animate-in slide-in-from-top-2 duration-300">
          
          {/* Estimated Delivery Box */}
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            order.shipping_address?.estimated_delivery 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' 
              : 'bg-primary/10 border border-primary/20 text-primary'
          }`}>
            <Clock className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase mb-0.5 opacity-80">موعد التوصيل المتوقع</p>
              <p className="font-black text-sm sm:text-base">
                {order.shipping_address?.estimated_delivery || "جاري حساب وقت التوصيل..."}
              </p>
              {etaWindow && (
                <p className="mt-1 text-xs opacity-80">المدة المتوقعة: {etaWindow}</p>
              )}
            </div>
          </div>

          {order.shipping_address?.driver_delivery_note && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold text-primary/80 mb-1">معلومة من الإدارة بخصوص التوصيل</p>
              <p className="text-sm font-medium text-foreground">{order.shipping_address.driver_delivery_note}</p>
            </div>
          )}

          {order.status === 'cancelled' && (customerCancelReason || customerCancelMessage) && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-rose-400">سبب الإلغاء</p>
              {customerCancelReason && (
                <p className="text-sm font-bold text-rose-400">{customerCancelReason}</p>
              )}
              {customerCancelMessage && (
                <p className="text-sm leading-7 text-gray-500">{customerCancelMessage}</p>
              )}
            </div>
          )}

          {/* Driver Info Box (if assigned & accepted) */}
          {order.shipping_address?.driver && order.shipping_address.driver.acceptance_status === 'accepted' ? (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase mb-0.5 text-blue-500/80">مندوب التوصيل</p>
                  <p className="font-black text-sm text-blue-600 sm:text-base">{order.shipping_address.driver.name}</p>
                  {order.shipping_address.driver.phone && (
                    <p className="text-xs text-blue-500/90 font-mono mt-0.5" dir="ltr">{order.shipping_address.driver.phone}</p>
                  )}
                </div>
              </div>
              {order.shipping_address.driver.phone && (
                <a 
                  href={`tel:${order.shipping_address.driver.phone}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          ) : order.shipping_address?.driver && order.shipping_address.driver.acceptance_status === 'pending' ? (
             <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 shrink-0 animate-pulse">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase mb-0.5 text-amber-500/80">مندوب التوصيل</p>
                  <p className="font-black text-sm text-amber-600 sm:text-base">جارٍ تعيين مندوب وتأكيد الاستلام...</p>
                </div>
             </div>
          ) : null}

          {/* Visual Order Timeline */}
          <OrderTimeline currentStatus={order.status} />

          {/* Items */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">المنتجات</p>
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium truncate flex-1 ml-2">{item.product?.name || "منتج"}</span>
                  <span className="text-gray-500 shrink-0">x{item.quantity}</span>
                  <span className="text-primary font-bold shrink-0 mr-4">{item.price_at_purchase?.toLocaleString()} ج.م</span>
                </div>
              ))}
            </div>
          )}

          {/* Shipping info */}
          {order.shipping_address && (
            <div className="bg-surface-hover/50 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">عنوان التوصيل</p>
              <p className="text-sm text-foreground">{order.shipping_address.recipient || order.shipping_address.recipientName}</p>
              <p className="text-sm text-gray-500">{order.shipping_address.city} - {order.shipping_address.area}</p>
              <p className="text-sm text-gray-500">{order.shipping_address.street || order.shipping_address.address}</p>
              {order.shipping_address.phone && (
                <p className="text-sm text-primary font-bold">📞 {order.shipping_address.phone}</p>
              )}
            </div>
          )}

          {/* Driver Rating Widget — only for delivered orders with an assigned driver */}
          {order.status === 'delivered' && order.shipping_address?.driver && order.shipping_address.driver.acceptance_status === 'accepted' && (
            <div className="mt-6 pt-6 border-t border-surface-hover">
              <DriverRating 
                orderId={order.id}
                driverId={order.shipping_address.driver.id}
              userId={userId}
            />
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-hover">
            <span className="text-sm text-gray-500 font-medium">المجموع الكلي (شاملاً التوصيل)</span>
            <span className="text-lg font-black text-primary">{order.total_amount?.toLocaleString()} ج.م</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchUserOrders(user.id).then(data => {
      setOrders(data)
      setIsLoading(false)
    })

    // Subscribe to real-time updates on this user's orders
    const channel = supabase
      .channel(`orders-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setOrders(prev =>
            prev.map(o => o.id === payload.new.id 
              ? { 
                  ...o, 
                  status: payload.new.status, 
                  total_amount: payload.new.total_amount,
                  // Keep the existing joined order_items and full shipping_address from our initial load
                  // Real-time payloads don't include joined relations, so we merge carefully
                  shipping_address: payload.new.shipping_address ?? o.shipping_address,
                } as Order 
              : o
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  if (isAuthLoading || (isLoading && user)) {
    return (
      <>
        <Header />
        <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh]">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-4">
            <div className="h-9 w-40 rounded-xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
            {[1,2,3].map(i => (
              <div key={i} className="bg-surface border border-surface-hover rounded-2xl p-4 sm:p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-hover shrink-0 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded-lg bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  <div className="h-3 w-24 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>
                <div className="h-7 w-24 rounded-xl bg-surface-hover shrink-0 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh] flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">سجل دخولك أولاً</h1>
            <p className="text-gray-500 mb-6">لازم تكون مسجل دخول عشان تشوف طلباتك.</p>
            <Link href="/login?redirect=/orders">
              <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-2xl transition-all">
                تسجيل الدخول
              </button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh]">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">

          {/* Page header */}
          <div className="mb-6 flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-heading font-black text-foreground">طلباتي 📦</h1>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مباشر
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">تابع كل طلباتك وحالتها هنا — تتحدث تلقائياً</p>
            </div>
          </div>

          {/* Orders list */}
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-10 h-10 text-gray-600 dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-black text-foreground mb-2">مفيش طلبات لسه</h2>
              <p className="text-gray-500 text-sm mb-6">ابدأ تسوق وطلباتك هتظهر هنا فوراً!</p>
              <Link href="/">
                <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-2xl transition-all flex items-center gap-2 mx-auto">
                  <ShoppingBag className="w-5 h-5" />
                  تسوق دلوقتي
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} userId={user?.id || ''} />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
