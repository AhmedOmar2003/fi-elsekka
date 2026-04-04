"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cancelOrderByCustomer, fetchUserOrders, respondToQuotedTextOrder, type Order } from "@/services/ordersService"
import { formatNumberLatin } from "@/lib/formatters"
import { toast } from "sonner"
import { CheckCircle, Clock, XCircle } from "lucide-react"

export function SearchRequestsPanel({ userId }: { userId: string }) {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    setOrdersLoading(true)

    void fetchUserOrders(userId).then((data) => {
      if (!mounted) return
      setOrders(data)
      setOrdersLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [userId])

  const handleCancelOrder = async (orderId: string) => {
    const { error } = await cancelOrderByCustomer(orderId, "account")
    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "cancelled",
                shipping_address: {
                  ...(o.shipping_address || {}),
                  customer_cancelled_order: true,
                  customer_cancel_origin: "account",
                  customer_cancelled_at: new Date().toISOString(),
                },
              }
            : o
        )
      )
    }
  }

  const handleSearchRequestDecision = async (orderId: string, decision: "approve" | "reject") => {
    try {
      const data = await respondToQuotedTextOrder(orderId, decision)
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: data.status,
                shipping_address: data.shipping_address,
              }
            : order
        )
      )
      toast.success(decision === "approve" ? "تمام، هنجهز الطلب ونكملك عليه" : "تمام، اتلغى الطلب")
    } catch (error: any) {
      toast.error(error.message || "تعذر تنفيذ طلبك دلوقتي")
    }
  }

  const searchRequests = React.useMemo(() => {
    return orders.filter((order) => {
      const shipping = order.shipping_address || {}
      return (
        shipping.request_mode === "custom_category_text" &&
        (shipping.search_pending === true ||
          (shipping.search_pending !== true && !shipping.customer_quote_response && order.status !== "cancelled"))
      )
    })
  }, [orders])

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (searchRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-4 border border-surface-hover">
          <Clock className="w-9 h-9 text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">مفيش طلبات بحث دلوقتي</h2>
        <p className="text-gray-500 mb-6">لو ملقتش منتج في أي قسم، ابعته من صفحة الطلب السريع وهيظهر لك هنا.</p>
        <Button asChild className="rounded-xl px-8">
          <Link href="/categories">ارجع للأقسام</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {searchRequests.map((order) => {
        const shipping = order.shipping_address || {}
        const dateStr = new Date(order.created_at).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        const requestTitle = shipping.custom_request_category_name === "صيدلية" ? "طلب صيدلي" : "طلب بحث عن منتج"
        const requestText = shipping.custom_request_text || "الطلب معتمد على التفاصيل اللي كتبتها وقت الإرسال."
        const isSearching = shipping.search_pending === true
        const quotedProductsTotal = Number(shipping.quoted_products_total || 0)
        const quotedFinalTotal = Number(shipping.quoted_final_total || order.total_amount || 0)

        return (
          <div key={order.id} className="bg-surface border border-surface-hover rounded-3xl p-5 md:p-6 transition-all hover:border-primary/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">نوع الطلب</p>
                <h3 className="text-lg font-black text-foreground">{requestTitle}</h3>
                <p className="mt-1 text-xs text-gray-500">بتاريخ {dateStr}</p>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-black ${isSearching ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-600"}`}>
                {isSearching ? <Clock className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {isSearching ? "بندور على طلبك" : "لقيناه وسعرناه"}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-surface-hover bg-background/70 p-4">
              <p className="text-xs font-black text-gray-500">التفاصيل اللي بعتهالنا</p>
              <p className="mt-2 text-sm leading-7 text-foreground whitespace-pre-wrap">{requestText}</p>
            </div>

            {isSearching ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-sm font-black text-amber-500">إحنا لسه بندور على طلبك</p>
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  أول ما نلاقيه هنبعتلك إشعار ونقولك سعره. طول ما الحالة دي موجودة تقدر تلغي الطلب من الزر اللي تحت.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order.id)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-500 transition-colors hover:bg-rose-500 hover:text-white"
                    aria-label="إلغاء طلب البحث"
                  >
                    <XCircle className="w-4 h-4" />
                    إلغاء الطلب
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-black text-emerald-600">لقينا طلبك وسعرناه</p>
                <p className="mt-2 text-sm text-gray-500">
                  قيمة المنتجات: <span className="font-black text-foreground">{formatNumberLatin(quotedProductsTotal)} ج.م</span>
                </p>
                <p className="mt-1 text-base font-black text-emerald-600">
                  السعر النهائي شامل الشحن: {formatNumberLatin(quotedFinalTotal)} ج.م
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  لو مناسبك السعر هنجهز الطلب ونبعتهولك. ولو مش مناسبك نلغي الطلب عادي.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSearchRequestDecision(order.id, "approve")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90"
                    aria-label="الموافقة على سعر الطلب"
                  >
                    نعم، جهزوه وابعتهولي
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchRequestDecision(order.id, "reject")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-500 transition-colors hover:bg-rose-500 hover:text-white"
                    aria-label="رفض سعر الطلب"
                  >
                    لا، خلاص مش حابب
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
