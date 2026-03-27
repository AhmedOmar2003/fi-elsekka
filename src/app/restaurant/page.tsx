"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/services/authService";
import { fetchRestaurantManagerOrders, submitRestaurantOrderEta } from "@/services/restaurantsService";
import {
  BellRing,
  ChevronDown,
  ChevronUp,
  ChefHat,
  Clock3,
  Loader2,
  LogOut,
  PackageCheck,
  Send,
  Store,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { formatRestaurantEtaWindow, getRestaurantOrderSnapshot } from "@/lib/restaurant-order";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type RestaurantPortalOrder = {
  id: string;
  status: string;
  total_amount: number;
  restaurant_total?: number;
  created_at: string;
  shipping_address?: Record<string, any>;
  users?: { full_name?: string; email?: string; phone?: string } | { full_name?: string; email?: string; phone?: string }[] | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    price_at_purchase?: number | null;
    products?: {
      id: string;
      name: string;
      price?: number | null;
      image_url?: string | null;
    } | null;
  }>;
};

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "في الانتظار";
    case "processing":
      return "قيد التجهيز";
    case "shipped":
      return "في الطريق";
    case "delivered":
      return "تم التوصيل";
    case "cancelled":
      return "ملغي";
    default:
      return status || "غير معروف";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-400";
    case "processing":
      return "border-sky-500/20 bg-sky-500/10 text-sky-400";
    case "shipped":
      return "border-violet-500/20 bg-violet-500/10 text-violet-400";
    case "delivered":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    case "cancelled":
      return "border-rose-500/20 bg-rose-500/10 text-rose-400";
    default:
      return "border-surface-hover bg-surface-hover text-gray-400";
  }
}

function orderUser(users: RestaurantPortalOrder["users"]) {
  return Array.isArray(users) ? users[0] : users;
}

function getFirstName(value?: string | null) {
  return value?.trim()?.split(" ")?.[0] || "بيكم";
}

function RestaurantEtaComposer({
  order,
  onSaved,
}: {
  order: RestaurantPortalOrder;
  onSaved: (shippingAddress: Record<string, any>) => void;
}) {
  const shipping = order.shipping_address || {};
  const etaSnapshot = getRestaurantOrderSnapshot(shipping);
  const [etaText, setEtaText] = React.useState(etaSnapshot.etaText || "");
  const [etaHours, setEtaHours] = React.useState(etaSnapshot.etaHours || 0);
  const [etaDays, setEtaDays] = React.useState(etaSnapshot.etaDays || 0);
  const [etaNote, setEtaNote] = React.useState(etaSnapshot.etaNote || "");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setEtaText(etaSnapshot.etaText || "");
    setEtaHours(etaSnapshot.etaHours || 0);
    setEtaDays(etaSnapshot.etaDays || 0);
    setEtaNote(etaSnapshot.etaNote || "");
  }, [order.id, etaSnapshot.etaDays, etaSnapshot.etaHours, etaSnapshot.etaNote, etaSnapshot.etaText]);

  const handleSubmit = async () => {
    if (!etaText.trim()) {
      toast.error("اكتب نصًا واضحًا للموعد قبل الإرسال");
      return;
    }

    if (etaDays <= 0 && etaHours <= 0) {
      toast.error("حدد عدد ساعات أو أيام على الأقل");
      return;
    }

    setIsSaving(true);
    try {
      const payload = await submitRestaurantOrderEta(order.id, {
        etaText,
        etaHours,
        etaDays,
        etaNote,
      });
      onSaved(payload.shipping_address || {});
      toast.success("تم إرسال الموعد للإدارة بنجاح");
    } catch (error: any) {
      toast.error(error?.message || "فشل إرسال الموعد");
    } finally {
      setIsSaving(false);
    }
  };

  const isClosed = ["cancelled", "delivered"].includes(order.status);

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-primary/80">وقت تجهيز وتوصيل الطلب</p>
          <p className="mt-1 text-sm leading-7 text-gray-400">
            اكتب الوقت المتوقع عندك، والإدارة هتراجعه وتبلغه للعميل والمندوب بشكل رسمي.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${
          etaSnapshot.etaStatus === "approved"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            : etaSnapshot.etaStatus === "submitted"
              ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
              : "border-amber-400/20 bg-amber-400/10 text-amber-400"
        }`}>
          {etaSnapshot.etaStatus === "approved"
            ? "اعتمدته الإدارة"
            : etaSnapshot.etaStatus === "submitted"
              ? "وصل للإدارة"
              : "بانتظار ردك"}
        </span>
      </div>

      {(etaSnapshot.etaText || etaSnapshot.etaSubmittedAt) && (
        <div className="rounded-2xl border border-surface-hover bg-background/70 px-4 py-3 text-sm">
          <p className="font-black text-foreground">{etaSnapshot.etaText || "موعد بدون نص"}</p>
          <p className="mt-1 text-xs text-gray-500">
            المدة المحسوبة: {formatRestaurantEtaWindow(etaSnapshot.etaDays, etaSnapshot.etaHours)}
          </p>
          {etaSnapshot.etaSubmittedAt && (
            <p className="mt-1 text-xs text-gray-500">
              آخر إرسال: {new Date(etaSnapshot.etaSubmittedAt).toLocaleString("ar-EG")}
            </p>
          )}
        </div>
      )}

      {!isClosed && (
        <>
          <div>
            <p className="mb-2 text-xs font-black text-gray-500">النص اللي هيوصل للإدارة</p>
            <input
              type="text"
              value={etaText}
              onChange={(event) => setEtaText(event.target.value)}
              placeholder="مثال: الطلب هيكون جاهز خلال ساعة ونصف"
              className="w-full rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black text-gray-500">عدد الأيام</p>
              <input
                type="number"
                min={0}
                value={etaDays}
                onChange={(event) => setEtaDays(Number(event.target.value || 0))}
                className="w-full rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-black text-gray-500">عدد الساعات</p>
              <input
                type="number"
                min={0}
                value={etaHours}
                onChange={(event) => setEtaHours(Number(event.target.value || 0))}
                className="w-full rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black text-gray-500">ملاحظة للإدارة (اختياري)</p>
            <textarea
              rows={2}
              value={etaNote}
              onChange={(event) => setEtaNote(event.target.value)}
              placeholder="مثال: الطلب محتاج 20 دقيقة تجهيز قبل خروجه"
              className="w-full resize-none rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-surface-hover bg-background/70 px-4 py-3 text-xs text-gray-500">
            المدة الحالية: <span className="font-black text-primary">{formatRestaurantEtaWindow(etaDays, etaHours)}</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : etaSnapshot.etaStatus === "submitted" ? <TimerReset className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {isSaving ? "جاري الإرسال..." : etaSnapshot.etaStatus === "submitted" ? "تحديث الموعد عند الإدارة" : "إرسال الموعد للإدارة"}
          </button>
        </>
      )}
    </div>
  );
}

function RestaurantOrderCard({
  order,
  defaultExpanded = false,
  tone = "active",
  onSaved,
}: {
  order: RestaurantPortalOrder;
  defaultExpanded?: boolean;
  tone?: "active" | "closed";
  onSaved: (shippingAddress: Record<string, any>) => void;
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const customer = orderUser(order.users);
  const shipping = order.shipping_address || {};
  const restaurantOrderSnapshot = getRestaurantOrderSnapshot(shipping);
  const isClosedTone = tone === "closed";

  return (
    <div
      className={`overflow-hidden rounded-3xl border transition-colors ${
        isClosedTone
          ? "border-emerald-500/15 bg-emerald-500/[0.04] hover:border-emerald-500/25"
          : "border-amber-400/15 bg-background/40 hover:border-primary/20"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={`flex w-full flex-col gap-4 p-4 text-right transition-colors md:flex-row md:items-start md:justify-between ${
          isClosedTone ? "hover:bg-emerald-500/[0.03]" : "hover:bg-surface/40"
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-foreground">طلب #{order.id.slice(0, 8)}</p>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusClass(order.status)}`}>
              {statusLabel(order.status)}
            </span>
            {restaurantOrderSnapshot.etaStatus === "approved" && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black text-emerald-400">
                الموعد اتعتمد
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 text-sm text-gray-400 sm:grid-cols-2">
            <p>
              العميل: <span className="font-bold text-foreground">{customer?.full_name || "غير معروف"}</span>
            </p>
            <p>
              رقم العميل: <span className="font-bold text-foreground">{customer?.phone || shipping.phone || "غير متوفر"}</span>
            </p>
            <p>
              وقت الطلب:{" "}
              <span className="font-bold text-foreground">
                {new Date(order.created_at).toLocaleDateString("ar-EG")} -{" "}
                {new Date(order.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
            <p>
              أصناف مطعمك: <span className="font-bold text-primary">{order.order_items?.length || 0}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
          <div className="rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-right">
            <p className="text-[11px] font-black text-gray-500">إجمالي منتجات مطعمك</p>
            <p className="mt-1 text-2xl font-black text-primary">
              {Number(order.restaurant_total || 0).toLocaleString("ar-EG")} ج.م
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-surface-hover bg-surface px-3 py-2 text-xs font-black text-gray-300">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? "إخفاء التفاصيل" : "افتح التفاصيل"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-surface-hover px-4 pb-4 pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-surface-hover bg-surface px-4 py-3">
              <p className="text-xs font-black text-gray-500">بيانات العميل</p>
              <div className="mt-2 space-y-1 text-sm text-foreground">
                <p>{customer?.phone || shipping.phone || "بدون رقم هاتف"}</p>
                <p className="text-gray-400">{customer?.email || "بدون إيميل"}</p>
                <p className="text-gray-400">
                  {[shipping.city, shipping.area, shipping.street || shipping.address].filter(Boolean).join("، ") || "العنوان هيتراجع من الإدارة"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-hover bg-surface px-4 py-3">
              <p className="text-xs font-black text-gray-500">تنسيق الطلب</p>
              <p className="mt-2 text-sm leading-7 text-gray-400">
                ابعت موعد التجهيز أو التوصيل المتوقع من هنا، والإدارة هتعتمده وتبلغه للعميل والمندوب.
              </p>
              {restaurantOrderSnapshot.restaurantName && (
                <p className="mt-2 text-xs font-black text-primary">
                  الطلب ظاهر عندك باسم المطعم: {restaurantOrderSnapshot.restaurantName}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <RestaurantEtaComposer order={order} onSaved={onSaved} />
          </div>

          <div className="mt-4">
            <p className="mb-3 text-sm font-black text-foreground">الأصناف المطلوبة من منيو المطعم</p>
            <div className="space-y-3">
              {order.order_items?.map((item) => {
                const unitPrice = Number(item.price_at_purchase || item.products?.price || 0);
                const quantity = Number(item.quantity || 1);
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-surface-hover bg-surface px-3 py-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-surface-hover bg-background">
                      {item.products?.image_url ? (
                        <Image src={item.products.image_url} alt={item.products?.name || "منتج"} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-500">
                          <ChefHat className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-foreground">{item.products?.name || "منتج من المطعم"}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {quantity} × {unitPrice.toLocaleString("ar-EG")} ج.م
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-primary">
                      {(unitPrice * quantity).toLocaleString("ar-EG")} ج.م
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RestaurantPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [restaurant, setRestaurant] = React.useState<any>(null);
  const [orders, setOrders] = React.useState<RestaurantPortalOrder[]>([]);

  const loadOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/restaurant/login");
        return;
      }

      const payload = await fetchRestaurantManagerOrders();
      setRestaurant(payload.restaurant || null);
      setOrders(payload.orders || []);
    } catch (error: any) {
      if (String(error?.message || "").includes("Unauthorized") || String(error?.message || "").includes("Forbidden")) {
        router.replace("/restaurant/login");
        return;
      }

      toast.error(error?.message || "مش قادرين نفتح طلبات المطعم دلوقتي");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/restaurant/login?logged_out=1";
  };

  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status));
  const closedOrders = orders.filter((order) => ["delivered", "cancelled"].includes(order.status));

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-gray-500">ثانية واحدة بنجهز طلبات المطعم...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-surface-hover bg-surface p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ChefHat className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black text-primary">بوابة المطعم</p>
              <h1 className="mt-1 text-2xl font-black text-foreground">
                أهلاً يا {getFirstName(restaurant?.manager_name)}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {restaurant?.name || "مطعم في السكة"} - الطلبات اللي جاية من موقع في السكة هتظهر لك هنا مباشرة.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-surface-hover bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-500">إجمالي الطلبات</p>
                <p className="mt-2 text-3xl font-black text-foreground">{orders.length}</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <BellRing className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-surface-hover bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-500">طلبات شغالة الآن</p>
                <p className="mt-2 text-3xl font-black text-foreground">{activeOrders.length}</p>
              </div>
              <div className="rounded-2xl bg-amber-400/10 p-3 text-amber-400">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-surface-hover bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-gray-500">حالة المطعم</p>
                <p className={`mt-2 text-xl font-black ${restaurant?.is_available ? "text-emerald-400" : "text-amber-400"}`}>
                  {restaurant?.is_available ? "متاح الآن" : "غير متاح الآن"}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                <Store className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-surface-hover bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-foreground">طلبات المطعم</h2>
              <p className="mt-1 text-sm text-gray-500">
                رتبنا الطلبات بشكل أوضح: الشغالة فوق، والمقفولة تحت، وكل طلب تقدر تفتحه وقت ما تحتاج.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadOrders()}
              className="rounded-2xl border border-surface-hover bg-background px-4 py-2 text-sm font-bold text-gray-300 transition-colors hover:border-primary hover:text-primary"
            >
              تحديث الآن
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-surface-hover bg-background/50 px-6 py-14 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-gray-600" />
              <p className="mt-4 text-base font-black text-foreground">لسه مفيش طلبات واصلة للمطعم</p>
              <p className="mt-2 text-sm leading-7 text-gray-500">
                أول ما عميل يطلب من منيو المطعم عندك، الطلب هيظهر هنا ومعاه بيانات العميل والمنتجات المطلوبة.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-4 rounded-[28px] border border-amber-400/15 bg-amber-400/[0.035] p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                  <div>
                    <h3 className="text-base font-black text-foreground">الطلبات الشغالة</h3>
                    <p className="mt-1 text-xs text-gray-500">دي الطلبات اللي محتاجة منك متابعة أو رد بوقت التوصيل.</p>
                  </div>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-400">
                    {activeOrders.length} طلب شغال
                  </span>
                </div>

                {activeOrders.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-surface-hover bg-background/50 px-6 py-10 text-center text-sm text-gray-500">
                    مفيش طلبات شغالة حاليًا، أول ما طلب جديد يدخل هيظهر هنا فوق.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOrders.map((order, index) => (
                      <RestaurantOrderCard
                        key={order.id}
                        order={order}
                        defaultExpanded={index === 0}
                        tone="active"
                        onSaved={(nextShippingAddress) => {
                          setOrders((prev) =>
                            prev.map((entry) =>
                              entry.id === order.id
                                ? { ...entry, shipping_address: nextShippingAddress }
                                : entry
                            )
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4 rounded-[28px] border border-emerald-500/15 bg-emerald-500/[0.035] p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                  <div>
                    <h3 className="text-base font-black text-foreground">الطلبات المقفولة</h3>
                    <p className="mt-1 text-xs text-gray-500">الطلبات اللي اتسلمت أو اتلغت موجودة هنا للرجوع السريع.</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400">
                    {closedOrders.length} طلب مقفول
                  </span>
                </div>

                {closedOrders.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-surface-hover bg-background/50 px-6 py-10 text-center text-sm text-gray-500">
                    لسه ما عندكش طلبات مقفولة.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {closedOrders.map((order) => (
                      <RestaurantOrderCard
                        key={order.id}
                        order={order}
                        tone="closed"
                        onSaved={(nextShippingAddress) => {
                          setOrders((prev) =>
                            prev.map((entry) =>
                              entry.id === order.id
                                ? { ...entry, shipping_address: nextShippingAddress }
                                : entry
                            )
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
