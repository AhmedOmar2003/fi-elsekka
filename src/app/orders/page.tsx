"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useAuth } from "@/contexts/AuthContext"
import { fetchUserOrders, Order } from "@/services/ordersService"
import { supabase } from "@/lib/supabase"
import { Package, ShoppingBag, Clock, Truck, CheckCircle2, XCircle, ChevronDown, ChevronUp, Wifi } from "lucide-react"

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

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_MAP[order.status] || { label: order.status, color: "text-gray-500 bg-surface-hover border-surface-border", icon: <Package className="w-4 h-4" /> }
  const date = new Date(order.created_at).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden hover:border-surface-border transition-all">
      {/* Header row */}
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">طلب #{order.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-gray-500 mt-0.5">{date}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${status.color} shrink-0`}>
          {status.icon}
          {status.label}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-foreground hover:bg-surface-hover transition-all shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-surface-hover p-4 sm:p-5 space-y-3">
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
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o)
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
        <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
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
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}
