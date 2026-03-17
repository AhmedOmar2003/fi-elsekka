"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock3, Loader2, MapPin, ShieldAlert, Truck, UserRoundX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOperationsCenterData, type OperationsCenterData } from "@/services/adminService";
import { hasFullAdminAccess } from "@/lib/permissions";
import { toast } from "sonner";

const EMPTY_DATA: OperationsCenterData = {
  summary: {
    criticalCount: 0,
    pendingWithoutDriver: 0,
    overdueShipping: 0,
    addressIssues: 0,
    rejectedByDrivers: 0,
    gracePeriodOrders: 0,
  },
  pendingWithoutDriver: [],
  overdueShipping: [],
  addressIssues: [],
  rejectedByDrivers: [],
  gracePeriodOrders: [],
};

function SectionCard({
  title,
  description,
  tone,
  icon: Icon,
  items,
}: {
  title: string;
  description: string;
  tone: string;
  icon: any;
  items: any[];
}) {
  return (
    <div className="rounded-2xl border border-surface-hover bg-surface shadow-sm overflow-hidden">
      <div className={`border-b px-5 py-4 ${tone}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black">{title}</h2>
            <p className="mt-1 text-[11px] opacity-80">{description}</p>
          </div>
          <div className="rounded-2xl bg-black/10 p-3">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="divide-y divide-surface-hover">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-gray-500">لا توجد حالات حالية هنا</div>
        ) : (
          items.map((item) => (
            <Link key={item.id} href={`/admin/orders?id=${item.id}`} className="block px-5 py-4 hover:bg-surface-hover transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">#{item.id.slice(0, 8)} — {item.customer_name}</p>
                  <p className="text-xs text-gray-500">{item.customer_email || item.phone || "بدون بيانات عميل كافية"}</p>
                  <p className="text-[11px] text-gray-500">
                    {new Date(item.created_at).toLocaleString("ar-EG")}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-primary">{(item.total_amount || 0).toLocaleString()} ج.م</p>
                  {item.driver_name && <p className="text-[11px] text-sky-400">{item.driver_name}</p>}
                  {item.rejected_count > 0 && <p className="text-[11px] text-rose-400">رفضه {item.rejected_count} مندوب</p>}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function OperationsCenterPage() {
  const router = useRouter();
  const { profile, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OperationsCenterData>(EMPTY_DATA);

  useEffect(() => {
    if (authLoading) return;
    if (!hasFullAdminAccess(profile)) {
      router.replace("/admin/orders?error=forbidden");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        setData(await fetchOperationsCenterData());
      } catch (error) {
        console.error(error);
        toast.error("تعذر تحميل مركز العمليات");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authLoading, profile, router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-black text-foreground">مركز العمليات</h1>
          <p className="mt-1 text-sm text-gray-500">صفحة مركزة فقط على الطلبات الحرجة التي تحتاج تدخلًا إداريًا سريعًا.</p>
        </div>
        <Link href="/admin/orders" className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15">
          فتح صفحة الطلبات الكاملة <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: "الإجمالي الحرج", value: data.summary.criticalCount, icon: AlertTriangle, tone: "text-rose-400 bg-rose-400/10" },
          { label: "بدون مندوب", value: data.summary.pendingWithoutDriver, icon: Truck, tone: "text-amber-400 bg-amber-400/10" },
          { label: "شحن متأخر", value: data.summary.overdueShipping, icon: Clock3, tone: "text-violet-400 bg-violet-400/10" },
          { label: "مشاكل عنوان", value: data.summary.addressIssues, icon: MapPin, tone: "text-sky-400 bg-sky-400/10" },
          { label: "مرفوضة من مندوبين", value: data.summary.rejectedByDrivers, icon: UserRoundX, tone: "text-rose-400 bg-rose-400/10" },
          { label: "فترة سماح", value: data.summary.gracePeriodOrders, icon: ShieldAlert, tone: "text-emerald-400 bg-emerald-400/10" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-black text-foreground">{loading ? "..." : card.value}</p>
              <p className="text-xs text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SectionCard
            title="طلبات بدون مندوب"
            description="طلبات فعالة ما زالت بلا تعيين مندوب"
            tone="bg-amber-400/10 text-amber-400"
            icon={Truck}
            items={data.pendingWithoutDriver}
          />
          <SectionCard
            title="طلبات شحن متأخرة"
            description="طلبات مر عليها 24 ساعة أو أكثر في حالة الشحن"
            tone="bg-rose-400/10 text-rose-400"
            icon={AlertTriangle}
            items={data.overdueShipping}
          />
          <SectionCard
            title="مشاكل بيانات العنوان"
            description="طلبات ينقصها هاتف أو مدينة أو عنوان واضح"
            tone="bg-sky-400/10 text-sky-400"
            icon={MapPin}
            items={data.addressIssues}
          />
          <SectionCard
            title="طلبات رفضها مندوبون"
            description="طلبات تم رفضها من مندوب واحد أو أكثر"
            tone="bg-violet-400/10 text-violet-400"
            icon={UserRoundX}
            items={data.rejectedByDrivers}
          />
          <SectionCard
            title="داخل فترة السماح"
            description="طلبات لم تنتهِ فترة السماح بعد"
            tone="bg-emerald-400/10 text-emerald-400"
            icon={ShieldAlert}
            items={data.gracePeriodOrders}
          />
        </div>
      )}
    </div>
  );
}
