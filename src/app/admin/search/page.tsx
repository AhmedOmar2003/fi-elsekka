"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2, Users, ShoppingCart, Package, Tag, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdminSearchResults, type AdminSearchResults } from "@/services/adminService";
import { hasFullAdminAccess } from "@/lib/permissions";
import { Input } from "@/components/ui/input";

const EMPTY_RESULTS: AdminSearchResults = {
  staff: [],
  users: [],
  products: [],
  categories: [],
  orders: [],
};

function roleLabel(role?: string | null) {
  switch (role) {
    case "super_admin":
      return "مشرف عام";
    case "admin":
      return "مدير نظام";
    case "operations_manager":
      return "إدارة العمليات";
    case "catalog_manager":
      return "إدارة المنتجات";
    case "support_agent":
      return "دعم";
    case "driver":
      return "مندوب";
    default:
      return "مستخدم";
  }
}

export default function AdminSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AdminSearchResults>(EMPTY_RESULTS);

  useEffect(() => {
    if (authLoading) return;
    if (!hasFullAdminAccess(profile)) {
      router.replace("/admin/orders?error=forbidden");
    }
  }, [authLoading, profile, router]);

  useEffect(() => {
    const term = query.trim();
    const timer = setTimeout(async () => {
      if (term.length < 2) {
        setResults(EMPTY_RESULTS);
        return;
      }

      setLoading(true);
      const next = await fetchAdminSearchResults(term);
      setResults(next);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResults = useMemo(
    () =>
      results.staff.length +
      results.users.length +
      results.products.length +
      results.categories.length +
      results.orders.length,
    [results]
  );

  const sections = [
    {
      title: "الطاقم",
      icon: ShieldAlert,
      items: results.staff,
      href: "/admin/staff",
      render: (item: AdminSearchResults["staff"][number]) => (
        <div className="space-y-1">
          <p className="font-bold text-foreground">{item.full_name}</p>
          <p className="text-xs text-gray-500">{item.email}</p>
          <p className="text-[11px] text-violet-400">{roleLabel(item.role)}</p>
        </div>
      ),
    },
    {
      title: "المستخدمون",
      icon: Users,
      items: results.users,
      href: "/admin/users",
      render: (item: AdminSearchResults["users"][number]) => (
        <div className="space-y-1">
          <p className="font-bold text-foreground">{item.full_name}</p>
          <p className="text-xs text-gray-500">{item.email}</p>
          <p className="text-[11px] text-sky-400">{item.phone || "بدون هاتف"}</p>
        </div>
      ),
    },
    {
      title: "الطلبات",
      icon: ShoppingCart,
      items: results.orders,
      href: "/admin/orders",
      getHref: (item: AdminSearchResults["orders"][number]) => `/admin/orders?order=${item.id}`,
      render: (item: AdminSearchResults["orders"][number]) => (
        <div className="space-y-1">
          <p className="font-bold text-foreground">#{item.id.slice(0, 8)} — {item.customer_name}</p>
          <p className="text-xs text-gray-500">{item.customer_email || item.phone || "بدون بيانات إضافية"}</p>
          <p className="text-[11px] text-amber-400">{item.total_amount.toLocaleString()} ج.م</p>
        </div>
      ),
    },
    {
      title: "المنتجات",
      icon: Package,
      items: results.products,
      href: "/admin/products",
      render: (item: AdminSearchResults["products"][number]) => (
        <div className="space-y-1">
          <p className="font-bold text-foreground">{item.name}</p>
          <p className="text-xs text-gray-500">{item.price.toLocaleString()} ج.م</p>
          <p className="text-[11px] text-sky-400">المخزون: {item.stock_quantity ?? 0}</p>
        </div>
      ),
    },
    {
      title: "الأقسام",
      icon: Tag,
      items: results.categories,
      href: "/admin/categories",
      render: (item: AdminSearchResults["categories"][number]) => (
        <div className="space-y-1">
          <p className="font-bold text-foreground">{item.name}</p>
          <p className="text-xs text-gray-500 line-clamp-2">{item.description || "بدون وصف"}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-black text-foreground">البحث الشامل</h1>
        <p className="mt-1 text-sm text-gray-500">ابحث من مكان واحد في الطاقم، العملاء، الطلبات، المنتجات، والأقسام.</p>
      </div>

      <div className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب اسمًا أو بريدًا أو رقم طلب أو منتجًا أو قسمًا"
            className="pr-10"
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          ابدأ بكتابة حرفين على الأقل. {totalResults > 0 ? `تم العثور على ${totalResults} نتيجة.` : "النتائج ستظهر هنا مباشرة."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : query.trim().length < 2 ? (
        <div className="rounded-2xl border border-dashed border-surface-hover bg-surface p-12 text-center text-sm text-gray-500">
          اكتب ما تبحث عنه وسنجمع لك النتائج من كل أقسام الإدارة.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="rounded-2xl border border-surface-hover bg-surface shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-surface-hover px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-foreground">{section.title}</h2>
                      <p className="text-[11px] text-gray-500">{section.items.length} نتيجة</p>
                    </div>
                  </div>
                  <Link href={section.href} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                    فتح القسم <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-surface-hover">
                  {section.items.length === 0 ? (
                    <div className="px-5 py-8 text-center text-xs text-gray-500">لا توجد نتائج في هذا القسم</div>
                  ) : (
                    section.items.map((item: any) => {
                      const itemHref = section.getHref?.(item);
                      if (itemHref) {
                        return (
                          <Link
                            key={item.id}
                            href={itemHref}
                            className="block px-5 py-4 transition-colors hover:bg-surface-hover"
                          >
                            {section.render(item)}
                          </Link>
                        );
                      }

                      return (
                        <div key={item.id} className="px-5 py-4">
                          {section.render(item)}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
