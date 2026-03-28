"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight, Bike, CalendarDays, Loader2, Phone, Star, TrendingUp, Wallet, PackageCheck, Clock3, XCircle } from "lucide-react"
import { toast } from "sonner"

type DriverProfile = {
  id: string
  full_name: string
  email: string
  phone?: string
  national_id?: string
  created_at: string
  is_available?: boolean
  last_login_at?: string | null
}

type DriverStatsPayload = {
  driver: DriverProfile
  stats: {
    totalOrders: number
    activeOrders: number
    deliveredOrders: number
    cancelledOrders: number
    earnings: {
      today: number
      week: number
      month: number
      total: number
    }
    avgRating: number | null
    ratingCount: number
  }
  recentOrders: Array<{
    id: string
    status: string
    total_amount: number
    created_at: string
    delivered_at: string | null
    customer_name: string
    phone?: string
  }>
}

const statusLabelMap: Record<string, string> = {
  pending: "بانتظار التنفيذ",
  processing: "قيد التجهيز",
  shipped: "في الطريق",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
}

const statusToneMap: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-300 border-amber-400/15",
  processing: "bg-sky-400/10 text-sky-300 border-sky-400/15",
  shipped: "bg-violet-400/10 text-violet-300 border-violet-400/15",
  delivered: "bg-emerald-500/10 text-emerald-300 border-emerald-500/15",
  cancelled: "bg-rose-500/10 text-rose-300 border-rose-500/15",
}

export default function AdminDriverDetailsPage() {
  const params = useParams<{ id: string }>()
  const driverId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [data, setData] = useState<DriverStatsPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!driverId) return

    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/admin/drivers/${driverId}`, {
          credentials: "include",
          cache: "no-store",
        })

        const payload = await res.json().catch(() => null)
        if (!res.ok || !payload) {
          const message = payload?.error === 'Driver not found'
            ? 'المندوب ده مش ظاهر كامل في البيانات دلوقتي. جرّب تحدث الصفحة أو راجع بياناته من إدارة المندوبين.'
            : (payload?.error || "تعذر تحميل صفحة المندوب")
          throw new Error(message)
        }

        setData(payload)
      } catch (error: any) {
        toast.error(error?.message || "فشل تحميل بيانات المندوب")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [driverId])

  const cards = useMemo(() => {
    if (!data) return []
    return [
      {
        label: "إجمالي الطلبات",
        value: data.stats.totalOrders,
        helper: `${data.stats.activeOrders} شغال الآن`,
        icon: Bike,
        tone: "text-primary bg-primary/10",
      },
      {
        label: "تم توصيله",
        value: data.stats.deliveredOrders,
        helper: `${data.stats.cancelledOrders} طلب ملغي`,
        icon: PackageCheck,
        tone: "text-emerald-400 bg-emerald-400/10",
      },
      {
        label: "دخل اليوم",
        value: `${data.stats.earnings.today.toLocaleString()} ج.م`,
        helper: `الأسبوع ${data.stats.earnings.week.toLocaleString()} ج.م`,
        icon: Wallet,
        tone: "text-amber-300 bg-amber-400/10",
      },
      {
        label: "دخل الشهر",
        value: `${data.stats.earnings.month.toLocaleString()} ج.م`,
        helper: `الإجمالي ${data.stats.earnings.total.toLocaleString()} ج.م`,
        icon: TrendingUp,
        tone: "text-sky-300 bg-sky-400/10",
      },
    ]
  }, [data])

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-surface-hover bg-surface p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold text-gray-400">بنجهز ملخص المندوب حالًا...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <p className="text-sm font-bold text-rose-300">مش قادرين نعرض بيانات المندوب دلوقتي.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/drivers"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-hover bg-surface px-3 py-2 text-xs font-bold text-gray-400 transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع للمندوبين
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-black text-foreground">متابعة المندوب</h1>
            <p className="mt-1 text-sm text-gray-500">هنا هتشوف نشاطه، عدد الطلبات، والدخل بشكل مرتب وواضح.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-primary/15 bg-primary/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-lg font-black text-primary">
              {data.driver.full_name?.charAt(0) || "م"}
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{data.driver.full_name}</p>
              <p className="text-xs text-gray-500">{data.driver.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-3xl border border-surface-hover bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500">{card.label}</p>
                  <p className="mt-3 text-2xl font-black text-foreground">{card.value}</p>
                  <p className="mt-2 text-xs text-gray-500">{card.helper}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-surface-hover bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-surface-hover pb-4">
            <div>
              <h2 className="text-lg font-black text-foreground">آخر الطلبات المسندة له</h2>
              <p className="mt-1 text-sm text-gray-500">آخر الطلبات التي اشتغل عليها المندوب، سواء ما زالت شغالة أو تم إغلاقها.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {data.recentOrders.length === 0 ? (
              <div className="rounded-2xl border border-surface-hover bg-background px-4 py-8 text-center text-sm text-gray-500">
                لسه المندوب ده ما استلمش أي طلبات.
              </div>
            ) : (
              data.recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-surface-hover bg-background px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-foreground">طلب #{order.id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{order.customer_name}</p>
                      {order.phone ? <p className="text-[11px] text-gray-500" dir="ltr">{order.phone}</p> : null}
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusToneMap[order.status] || "border-surface-hover bg-surface-hover text-gray-300"}`}>
                      {statusLabelMap[order.status] || order.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-surface-hover bg-surface px-3 py-3">
                      <p className="text-[11px] text-gray-500">قيمة الطلب</p>
                      <p className="mt-1 text-sm font-black text-foreground">{Number(order.total_amount || 0).toLocaleString()} ج.م</p>
                    </div>
                    <div className="rounded-xl border border-surface-hover bg-surface px-3 py-3">
                      <p className="text-[11px] text-gray-500">تاريخ الإسناد</p>
                      <p className="mt-1 text-sm font-black text-foreground">{new Date(order.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div className="rounded-xl border border-surface-hover bg-surface px-3 py-3">
                      <p className="text-[11px] text-gray-500">تم التوصيل</p>
                      <p className="mt-1 text-sm font-black text-foreground">
                        {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('ar-EG') : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-surface-hover bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-black text-foreground">ملف المندوب</h2>
            <div className="mt-4 space-y-3">
              <InfoRow icon={Phone} label="رقم الهاتف" value={data.driver.phone || 'غير محدد'} dir="ltr" />
              <InfoRow icon={CalendarDays} label="تاريخ الانضمام" value={new Date(data.driver.created_at).toLocaleDateString('ar-EG')} />
              <InfoRow icon={Clock3} label="آخر دخول" value={data.driver.last_login_at ? new Date(data.driver.last_login_at).toLocaleString('ar-EG') : 'لسه ما سجلش دخول'} />
              <InfoRow icon={Bike} label="الحالة الحالية" value={data.driver.is_available === false ? 'غير متاح الآن' : 'متاح للطلبات'} />
            </div>
          </div>

          <div className="rounded-3xl border border-surface-hover bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-black text-foreground">جودة الأداء</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MiniMetric
                icon={Star}
                label="متوسط التقييم"
                value={data.stats.avgRating ? `${data.stats.avgRating} / 5` : 'لا يوجد'}
                helper={data.stats.ratingCount ? `بناءً على ${data.stats.ratingCount} تقييم` : 'لسه ما فيش تقييمات'}
                tone="text-amber-300 bg-amber-400/10"
              />
              <MiniMetric
                icon={PackageCheck}
                label="طلبات تم توصيلها"
                value={data.stats.deliveredOrders}
                helper={`${data.stats.activeOrders} طلب ما زال شغال`}
                tone="text-emerald-300 bg-emerald-500/10"
              />
              <MiniMetric
                icon={XCircle}
                label="طلبات ملغية"
                value={data.stats.cancelledOrders}
                helper="للمراجعة وتحسين التشغيل"
                tone="text-rose-300 bg-rose-500/10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  dir,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  dir?: "ltr" | "rtl"
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-surface-hover bg-background px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-500">{label}</p>
        <p className="mt-1 text-sm font-black text-foreground break-words" dir={dir}>{value}</p>
      </div>
    </div>
  )
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  helper: string
  tone: string
}) {
  return (
    <div className="rounded-2xl border border-surface-hover bg-background px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gray-500">{label}</p>
          <p className="mt-2 text-xl font-black text-foreground">{value}</p>
          <p className="mt-1 text-[11px] text-gray-500">{helper}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
