"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/contexts/AuthContext"
import { fetchUserOrders, Order, respondToCancelledOrder, respondToQuotedTextOrder } from "@/services/ordersService"
import { supabase } from "@/lib/supabase"
import { Package, ShoppingBag, Clock, Truck, CheckCircle2, XCircle, ChevronDown, ChevronUp, Wifi, Phone, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { RequestAttachmentsGallery } from "@/components/orders/request-attachments-gallery"
import { SearchRequestProgress } from "@/components/orders/search-request-progress"
import { formatRestaurantEtaWindow, getRestaurantOrderSnapshot } from "@/lib/restaurant-order"

function isAwaitingTextOrderConfirmation(order: Order) {
  const isTextRequestOrder = order.shipping_address?.request_mode === 'custom_category_text'
  const pricingPending = order.shipping_address?.pricing_pending === true
  const quoteDecision = order.shipping_address?.customer_quote_response as 'approve' | 'reject' | undefined
  const quotedFinalTotal = Number(order.shipping_address?.quoted_final_total || order.total_amount || 0)

  return isTextRequestOrder && !pricingPending && !quoteDecision && order.status !== 'cancelled' && quotedFinalTotal > 0
}

function QuoteReadyPopup({
  order,
  onApprove,
  onReject,
  onClose,
  isSubmitting,
}: {
  order: Order
  onApprove: () => void
  onReject: () => void
  onClose: () => void
  isSubmitting: 'approve' | 'reject' | null
}) {
  const quotedProductsTotal = Number(order.shipping_address?.quoted_products_total || 0)
  const quotedFinalTotal = Number(order.shipping_address?.quoted_final_total || order.total_amount || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-primary/20 bg-surface p-6 shadow-premium">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary/80">تم تحديد تسعيرة طلبك</p>
            <h3 className="mt-1 text-xl font-black text-foreground">راجع السعر قبل تأكيد الطلب</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-surface-hover px-3 py-2 text-xs font-bold text-gray-500 transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            لاحقًا
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-gray-500">قيمة المنتجات: <span className="font-black text-foreground">{quotedProductsTotal.toLocaleString()} ج.م</span></p>
          <p className="text-lg font-black text-emerald-600">الإجمالي مع التوصيل: {quotedFinalTotal.toLocaleString()} ج.م</p>
          <p className="text-xs leading-6 text-gray-500">
            لو السعر مناسبك اضغط تأكيد الطلب، وسنكمل تجهيز الطلب على السعر ده مباشرة.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            onClick={onApprove}
            disabled={!!isSubmitting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            تأكيد الطلب
          </button>
          <button
            onClick={onReject}
            disabled={!!isSubmitting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-400 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-60"
          >
            {isSubmitting === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            لا، مش هكمل
          </button>
        </div>
      </div>
    </div>
  )
}

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

function OrderCard({
  order,
  userId,
  onOrderUpdated,
}: {
  order: Order;
  userId: string;
  onOrderUpdated: (order: Order) => void;
}) {
  const [expanded, setExpanded] = useState(false)
  const [isSubmittingCancelResponse, setIsSubmittingCancelResponse] = useState<null | 'insist' | 'confirm_cancel'>(null)
  const status = STATUS_MAP[order.status] || { label: order.status, color: "text-gray-500 bg-surface-hover border-surface-border", icon: <Package className="w-4 h-4" /> }
  const date = new Date(order.created_at).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  })
  const etaDays = Number(order.shipping_address?.estimated_delivery_days || 0)
  const etaHours = Number(order.shipping_address?.estimated_delivery_hours || 0)
  const customerCancelReason = order.shipping_address?.cancellation_reason
  const customerCancelMessage = order.shipping_address?.cancellation_message
  const cancellationDecision = order.shipping_address?.customer_cancellation_response as 'insist' | 'confirm_cancel' | undefined
  const cancellationDecisionAt = order.shipping_address?.customer_cancellation_response_at
  const quoteDecision = order.shipping_address?.customer_quote_response as 'approve' | 'reject' | undefined
  const quoteDecisionAt = order.shipping_address?.customer_quote_response_at

  const etaWindow = etaDays > 0 && etaHours > 0
    ? `${etaDays} يوم و${etaHours} ساعة`
    : etaDays > 0
      ? `${etaDays} يوم`
      : etaHours > 0
        ? `${etaHours} ساعة`
        : null
  const isTextRequestOrder = order.shipping_address?.request_mode === 'custom_category_text'
  const textRequest = order.shipping_address?.custom_request_text
  const textRequestCategory = order.shipping_address?.custom_request_category_name
  const textRequestImageUrls = Array.isArray(order.shipping_address?.custom_request_image_urls) ? order.shipping_address.custom_request_image_urls : []
  const pricingPending = order.shipping_address?.pricing_pending === true
  const quotedProductsTotal = Number(order.shipping_address?.quoted_products_total || 0)
  const quotedFinalTotal = Number(order.shipping_address?.quoted_final_total || order.total_amount || 0)
  const pricingUpdatedAt = order.shipping_address?.pricing_updated_at
  const [isSubmittingQuoteResponse, setIsSubmittingQuoteResponse] = useState<null | 'approve' | 'reject'>(null)
  const restaurantOrder = getRestaurantOrderSnapshot(order.shipping_address)

  const handleCancelledOrderDecision = async (decision: 'insist' | 'confirm_cancel') => {
    setIsSubmittingCancelResponse(decision)
    try {
      const data = await respondToCancelledOrder(order.id, decision)
      onOrderUpdated({
        ...order,
        shipping_address: data.shipping_address,
      })
      toast.success(
        decision === 'insist'
          ? 'تم إبلاغ الإدارة أنك ما زلت تريد هذا الطلب'
          : 'تم تأكيد الإلغاء النهائي لهذا الطلب'
      )
    } catch (error: any) {
      toast.error(error.message || 'تعذر إرسال ردك الآن')
    } finally {
      setIsSubmittingCancelResponse(null)
    }
  }

  const handleQuotedOrderDecision = async (decision: 'approve' | 'reject') => {
    setIsSubmittingQuoteResponse(decision)
    try {
      const data = await respondToQuotedTextOrder(order.id, decision)
      onOrderUpdated({
        ...order,
        status: data.status,
        shipping_address: data.shipping_address,
      })
      if (decision === 'approve') {
        toast.success('تم تأكيد الطلب بالسعر المحدد، وهنكمل تجهيز الطلب على طول')
        return
      }

      toast.success('تم إلغاء الطلب بناءً على رفضك للتسعيرة')
    } catch (error: any) {
      toast.error(error.message || 'تعذر إرسال ردك على التسعيرة الآن')
    } finally {
      setIsSubmittingQuoteResponse(null)
    }
  }

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
          {restaurantOrder.isRestaurantOrder && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold uppercase mb-1 text-primary/80">طلب من مطعم</p>
              <p className="font-black text-base text-foreground">
                {restaurantOrder.restaurantName || 'مطعم من في السكة'}
              </p>
              {restaurantOrder.etaStatus === 'submitted' && !order.shipping_address?.estimated_delivery && (
                <p className="mt-2 text-xs leading-6 text-gray-500">
                  المطعم حدّد وقتًا مبدئيًا والإدارة بتراجعه الآن قبل ما توصله لك بشكل نهائي.
                </p>
              )}
              {restaurantOrder.etaText && (
                <p className="mt-2 text-xs text-gray-500">
                  الموعد المبدئي من المطعم: <span className="font-bold text-foreground">{restaurantOrder.etaText}</span>
                  <span className="mr-1">({formatRestaurantEtaWindow(restaurantOrder.etaDays, restaurantOrder.etaHours)})</span>
                </p>
              )}
            </div>
          )}

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

          {order.status === 'cancelled' && customerCancelReason && (
            <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-background to-background p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-500">هل ما زلت محتاج الطلب ده؟</p>
                  <p className="mt-1 text-sm leading-7 text-gray-500">
                    لو ما زلت محتاجه، بلغنا وإحنا هنرجع نراجع الطلب مع الإدارة. ولو خلاص مش محتاجه هنثبت الإلغاء النهائي.
                  </p>
                </div>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-black text-amber-500">
                  قرارك مهم
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-surface-hover bg-background px-4 py-3">
                  <p className="text-[11px] font-bold text-gray-500">لو ضغطت أيوه</p>
                  <p className="mt-2 text-sm font-black text-foreground">هنبلغ الإدارة فورًا</p>
                  <p className="mt-1 text-xs leading-6 text-gray-500">ولو فيه فرصة نرجع نجهزه، هيكملوا معاك من نفس الطلب.</p>
                </div>
                <div className="rounded-xl border border-surface-hover bg-background px-4 py-3">
                  <p className="text-[11px] font-bold text-gray-500">لو ضغطت لا خلاص</p>
                  <p className="mt-2 text-sm font-black text-foreground">هيتثبت الإلغاء النهائي</p>
                  <p className="mt-1 text-xs leading-6 text-gray-500">وساعتها هنعتبر إنك مش محتاج الطلب ده تاني.</p>
                </div>
              </div>

              {!cancellationDecision ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => handleCancelledOrderDecision('insist')}
                    disabled={!!isSubmittingCancelResponse}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary shadow-lg shadow-primary/10 transition-colors hover:bg-primary hover:text-white disabled:opacity-60"
                  >
                    {isSubmittingCancelResponse === 'insist' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    أيوه، لسه محتاجه
                  </button>
                  <button
                    onClick={() => handleCancelledOrderDecision('confirm_cancel')}
                    disabled={!!isSubmittingCancelResponse}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-60"
                  >
                    {isSubmittingCancelResponse === 'confirm_cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    لا خلاص، الغِ الطلب
                  </button>
                </div>
              ) : (
                <div className={`rounded-xl px-3 py-3 text-sm ${
                  cancellationDecision === 'insist'
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
                }`}>
                  <p className="font-bold">
                    {cancellationDecision === 'insist'
                      ? 'تم إرسال رغبتك للإدارة لإعادة تجهيز الطلب.'
                      : 'تم تثبيت الإلغاء النهائي لهذا الطلب بناءً على اختيارك.'}
                  </p>
                  {cancellationDecisionAt && (
                    <p className="mt-1 text-xs opacity-80">
                      {new Date(cancellationDecisionAt).toLocaleString('ar-EG')}
                    </p>
                  )}
                </div>
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
          {isTextRequestOrder && (textRequest || textRequestImageUrls.length > 0) && (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">
                {textRequestCategory ? `طلب ${textRequestCategory} النصي` : 'الطلب النصي'}
              </p>
              <p className="text-sm leading-7 text-foreground whitespace-pre-wrap">
                {textRequest?.trim() || 'اعتمدت هذا الطلب على الصور المرفقة فقط بدون نص إضافي.'}
              </p>
              <p className="text-xs text-gray-500">الإدارة والمندوب يستلمان هذا الطلب كما أرسلته أنت تمامًا.</p>
              <RequestAttachmentsGallery
                imageUrls={textRequestImageUrls}
                title="المرفقات التي أرسلتها"
                hint="لو رفعت روشتة أو صورة دواء فستظل مرتبطة بالطلب هنا."
              />
            </div>
          )}

          {isTextRequestOrder && (
            <SearchRequestProgress order={order} audience="customer" />
          )}

          {isTextRequestOrder && pricingPending && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-amber-500">بانتظار التسعير من الإدارة</p>
              <p className="text-sm leading-7 text-gray-500">
                يجري الآن مراجعة طلبك لتحديد سعر المنتجات. بعد دقائق ستصلك التسعيرة كاملة مع التوصيل، ثم تختار أنت هل تكمل الطلب أم لا.
              </p>
            </div>
          )}

          {isTextRequestOrder && !pricingPending && quotedFinalTotal > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-600">لقينالك طلبك وحددنا سعره</p>
                  <p className="mt-1 text-sm leading-7 text-gray-500">
                    راجع السعر براحتك، ولو مناسبك كمّل الطلب من هنا. ولو ما كنتش فتحت الإشعار، هتلاقي نفس القرار ظاهر لك هنا عادي.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-600">
                  جاهز لقرارك
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-surface-hover bg-background px-4 py-3">
                  <p className="text-[11px] font-bold text-gray-500">قيمة المنتجات</p>
                  <p className="mt-1 text-lg font-black text-foreground">{quotedProductsTotal.toLocaleString()} ج.م</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-[11px] font-bold text-gray-500">الإجمالي شامل التوصيل</p>
                  <p className="mt-1 text-lg font-black text-emerald-600">{quotedFinalTotal.toLocaleString()} ج.م</p>
                </div>
              </div>

              {pricingUpdatedAt && (
                <p className="text-xs text-gray-500">آخر تحديث: {new Date(pricingUpdatedAt).toLocaleString('ar-EG')}</p>
              )}

              {!quoteDecision && order.status !== 'cancelled' && (
                <div className="grid gap-2 pt-2 sm:grid-cols-2">
                  <button
                    onClick={() => handleQuotedOrderDecision('approve')}
                    disabled={!!isSubmittingQuoteResponse}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary shadow-lg shadow-primary/10 transition-colors hover:bg-primary hover:text-white disabled:opacity-60"
                  >
                    {isSubmittingQuoteResponse === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    تمام، كمّلوا الطلب
                  </button>
                  <button
                    onClick={() => handleQuotedOrderDecision('reject')}
                    disabled={!!isSubmittingQuoteResponse}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-60"
                  >
                    {isSubmittingQuoteResponse === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    لا، مش مناسب ليا
                  </button>
                </div>
              )}

              {quoteDecision && (
                <div className={`rounded-xl px-3 py-3 text-sm ${
                  quoteDecision === 'approve'
                    ? 'border border-primary/20 bg-primary/10 text-primary'
                    : 'border border-rose-500/20 bg-rose-500/10 text-rose-400'
                }`}>
                  <p className="font-bold">
                    {quoteDecision === 'approve'
                      ? `تم تأكيد الطلب على السعر المحدد: ${quotedFinalTotal.toLocaleString()} ج.م شامل التوصيل.`
                      : 'تم تسجيل رفضك للتسعيرة، وتم إلغاء الطلب.'}
                  </p>
                  {quoteDecisionAt && (
                    <p className="mt-1 text-xs opacity-80">
                      {new Date(quoteDecisionAt).toLocaleString('ar-EG')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
            <span className="text-sm text-gray-500 font-medium">{pricingPending ? 'حالة التسعير' : 'المجموع الكلي (شاملاً التوصيل)'}</span>
            <span className="text-lg font-black text-primary">
              {pricingPending ? 'بانتظار التسعير' : `${order.total_amount?.toLocaleString()} ج.م`}
            </span>
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
  const [quotePromptOrderId, setQuotePromptOrderId] = useState<string | null>(null)
  const [popupSubmittingDecision, setPopupSubmittingDecision] = useState<'approve' | 'reject' | null>(null)

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

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === updatedOrder.id
          ? { ...order, ...updatedOrder }
          : order
      )
    )
  }

  const pendingPricingOrders = orders.filter(order => {
    const isTextRequestOrder = order.shipping_address?.request_mode === 'custom_category_text'
    return isTextRequestOrder && order.shipping_address?.pricing_pending === true
  })

  const visibleOrders = orders.filter(order => {
    const isTextRequestOrder = order.shipping_address?.request_mode === 'custom_category_text'
    return !(isTextRequestOrder && order.shipping_address?.pricing_pending === true)
  })

  useEffect(() => {
    const activePromptOrder = orders.find(order => order.id === quotePromptOrderId)
    if (quotePromptOrderId && activePromptOrder && isAwaitingTextOrderConfirmation(activePromptOrder)) {
      return
    }

    const nextPromptOrder = orders.find(order => {
      if (!isAwaitingTextOrderConfirmation(order)) return false
      const popupKey = `text-order-quote-popup:${order.id}:${order.shipping_address?.pricing_updated_at || 'initial'}`
      if (typeof window === 'undefined') return false
      return !window.localStorage.getItem(popupKey)
    })

    if (!nextPromptOrder) {
      setQuotePromptOrderId(null)
      return
    }

    const popupKey = `text-order-quote-popup:${nextPromptOrder.id}:${nextPromptOrder.shipping_address?.pricing_updated_at || 'initial'}`
    window.localStorage.setItem(popupKey, 'shown')
    setQuotePromptOrderId(nextPromptOrder.id)
  }, [orders, quotePromptOrderId])

  const quotePromptOrder = orders.find(order => order.id === quotePromptOrderId) || null

  const handlePopupQuoteDecision = async (decision: 'approve' | 'reject') => {
    if (!quotePromptOrder) return

    setPopupSubmittingDecision(decision)
    try {
      const data = await respondToQuotedTextOrder(quotePromptOrder.id, decision)
      const updatedOrder = {
        ...quotePromptOrder,
        status: data.status,
        shipping_address: data.shipping_address,
      }

      handleOrderUpdated(updatedOrder)
      setQuotePromptOrderId(null)

      if (decision === 'approve') {
        toast.success('تم تأكيد الطلب بالسعر المحدد، وهنكمل تجهيز الطلب على طول')
        return
      }

      toast.success('تم إلغاء الطلب بناءً على رفضك للتسعيرة')
    } catch (error: any) {
      toast.error(error.message || 'تعذر إرسال ردك على التسعيرة الآن')
    } finally {
      setPopupSubmittingDecision(null)
    }
  }

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
          {visibleOrders.length === 0 ? (
            <div className="text-center py-20">
              {pendingPricingOrders.length > 0 ? (
                <div className="mx-auto max-w-xl rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-right shadow-premium">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <Clock className="h-8 w-8 text-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-center text-xl font-black text-foreground">طلبك ما زال قيد التسعير</h2>
                  <p className="mt-3 text-center text-sm leading-7 text-gray-500">
                    لن يظهر هذا الطلب في صفحة التتبع قبل أن تحدد الإدارة السعر. بمجرد وصول التسعيرة ستستطيع الدخول هنا ومتابعة تجهيز الطلب والمندوب فقط.
                  </p>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-emerald-500/10">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
                  </div>
                  <p className="mt-4 text-center text-xs font-bold text-emerald-600">
                    تسعيرة طلبك ستكون شاملة مصاريف الشحن
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {visibleOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  userId={user?.id || ''}
                  onOrderUpdated={handleOrderUpdated}
                />
              ))}
            </div>
          )}

        </div>
      </main>
      {quotePromptOrder && (
        <QuoteReadyPopup
          order={quotePromptOrder}
          isSubmitting={popupSubmittingDecision}
          onApprove={() => handlePopupQuoteDecision('approve')}
          onReject={() => handlePopupQuoteDecision('reject')}
          onClose={() => setQuotePromptOrderId(null)}
        />
      )}
      <Footer />
    </>
  )
}
