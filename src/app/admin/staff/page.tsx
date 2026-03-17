"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Shield, Edit2, LockKeyhole, Slash, CheckCircle2, Trash2 } from "lucide-react";

type Staff = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  disabled: boolean;
  created_at: string;
  last_login_at?: string | null;
};

const ROLE_OPTIONS = [
  { value: "super_admin", label: "مشرف عام" },
  { value: "operations_manager", label: "إدارة العمليات" },
  { value: "catalog_manager", label: "إدارة المنتجات" },
  { value: "support_agent", label: "دعم" },
];

const PERMISSION_OPTIONS = [
  "view_orders",
  "update_order_status",
  "assign_driver",
  "view_drivers",
  "manage_products",
  "manage_categories",
  "manage_offers",
  "manage_discounts",
  "manage_users",
  "manage_admins",
  "manage_settings",
  "view_reports",
];

export default function StaffPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    role: "operations_manager",
    permissions: ["view_orders", "update_order_status", "assign_driver", "view_drivers"],
    tempPassword: "",
    disabled: false,
  });

  useEffect(() => {
    if (isLoading) return;
    const role = profile?.role;
    const perms = profile?.permissions || [];
    const allowed = role === "super_admin" || role === "admin" || perms.includes("manage_admins");
    if (!allowed) {
      router.replace("/admin");
      return;
    }
    (async () => {
      await loadStaff();
    })();
  }, [profile, isLoading, router]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", { cache: "no-store" });
      if (!res.ok) throw new Error("فشل تحميل الطاقم");
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (e: any) {
      toast.error(e.message || "خطأ في تحميل الطاقم");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      full_name: "",
      username: "",
      email: "",
      role: "operations_manager",
      permissions: ["view_orders", "update_order_status", "assign_driver", "view_drivers"],
      tempPassword: "",
      disabled: false,
    });
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: Staff) => {
    setEditing(item);
    setForm({
      full_name: item.full_name || "",
      username: item.username || "",
      email: item.email || "",
      role: item.role,
      permissions: item.permissions || [],
      tempPassword: "",
      disabled: item.disabled,
    });
    setModalOpen(true);
  };

  const togglePerm = (perm: string) => {
    setForm((f) => {
      const exists = f.permissions.includes(perm);
      return {
        ...f,
        permissions: exists ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm],
      };
    });
  };

  const handleSave = async () => {
    if (!form.email || !form.full_name || !form.username) {
      toast.error("املأ الحقول المطلوبة");
      return;
    }
    const payload = {
      ...form,
      tempPassword: form.tempPassword || undefined,
    };
    try {
      const url = editing ? `/api/admin/staff/${editing.id}` : "/api/admin/staff";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || "فشل الحفظ";
        throw new Error(msg);
      }
      toast.success(editing ? "تم تحديث بيانات الموظف" : "تم إضافة موظف جديد");
      setModalOpen(false);
      await loadStaff();
    } catch (e: any) {
      toast.error(e.message || "خطأ أثناء الحفظ");
    }
  };

  const handleDisable = async (id: string | undefined, disable: boolean) => {
    if (!id) {
      toast.error("معرّف الموظف مفقود، حاول إعادة تحميل الصفحة");
      return;
    }
    try {
      const url = `/api/admin/staff/${encodeURIComponent(id)}`;
      if (process.env.NODE_ENV !== "production") {
        console.debug("Disabling staff", { id, url, disable });
      }
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: disable }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "فشل التحديث");
      toast.success(disable ? "تم تعطيل الحساب" : "تم تفعيل الحساب");
      await loadStaff();
    } catch (e: any) {
      toast.error(e.message || "خطأ أثناء التحديث");
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/staff/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "فشل إعادة التهيئة");
      toast.success(`كلمة مرور مؤقتة: ${data.tempPassword || ''}`);
    } catch (e: any) {
      toast.error(e.message || "خطأ أثناء إعادة التهيئة");
    }
  };

  const handleDeleteStaff = async (member: Staff) => {
    if (!member?.id) {
      toast.error("معرّف الموظف مفقود");
      return;
    }

    const confirmed = window.confirm(`هل أنت متأكد من حذف الموظف "${member.full_name || member.email}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/staff/${encodeURIComponent(member.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "فشل حذف الموظف");
      toast.success("تم حذف الموظف نهائيًا");
      await loadStaff();
    } catch (e: any) {
      toast.error(e.message || "خطأ أثناء حذف الموظف");
    }
  };

  const roleLabel = useMemo(
    () => (value: string) => ROLE_OPTIONS.find((r) => r.value === value)?.label || value,
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">إدارة الطاقم</h1>
          <p className="text-gray-500 text-sm">إضافة، تعديل، تعطيل، وصلاحيات الموظفين</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة موظف
        </Button>
      </div>

      <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 bg-surface-hover px-4 py-3 text-xs font-bold text-gray-500">
          <div className="col-span-2">الاسم</div>
          <div className="col-span-2">البريد</div>
          <div className="col-span-2">المسمى</div>
          <div className="col-span-2">الحالة</div>
          <div className="col-span-2">آخر دخول</div>
          <div className="col-span-2 text-left">الإجراءات</div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : staff.length === 0 ? (
          <div className="py-10 text-center text-gray-500">لا يوجد طاقم بعد</div>
        ) : (
          staff.map((s) => (
            <div key={s.id} className="grid grid-cols-12 px-4 py-3 border-t border-surface-hover text-sm items-center">
              <div className="col-span-2">
                <div className="font-bold text-foreground">{s.full_name || s.username}</div>
                <div className="text-xs text-gray-500">{s.username}</div>
              </div>
              <div className="col-span-2">{s.email}</div>
              <div className="col-span-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                {roleLabel(s.role)}
              </div>
              <div className="col-span-2">
                {s.disabled ? (
                  <span className="text-rose-500 text-xs font-bold">معطل</span>
                ) : (
                  <span className="text-emerald-500 text-xs font-bold">نشط</span>
                )}
              </div>
              <div className="col-span-2 text-xs text-gray-500">
                {s.last_login_at ? new Date(s.last_login_at).toLocaleString() : "—"}
              </div>
              <div className="col-span-2 flex items-center gap-2 justify-end">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(s)}>
                  <Edit2 className="w-3 h-3" /> تعديل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => handleResetPassword(s.id)}
                >
                  <LockKeyhole className="w-3 h-3" /> إعادة تعيين
                </Button>
                <Button
                  size="sm"
                  variant={s.disabled ? "outline" : "danger"}
                  className="gap-1"
                  onClick={() => handleDisable(s.id, !s.disabled)}
                >
                  {s.disabled ? <CheckCircle2 className="w-3 h-3" /> : <Slash className="w-3 h-3" />}
                  {s.disabled ? "تفعيل" : "تعطيل"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                  onClick={() => handleDeleteStaff(s)}
                  disabled={user?.id === s.id}
                  title={user?.id === s.id ? "لا يمكنك حذف حسابك الحالي" : "حذف الموظف نهائيًا"}
                >
                  <Trash2 className="w-3 h-3" />
                  حذف
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-surface-hover rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">
                  {editing ? "تعديل موظف" : "إضافة موظف جديد"}
                </h2>
                <p className="text-xs text-gray-500">الصلاحيات تُعدل من هنا مباشرة</p>
              </div>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                إغلاق
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-bold">الاسم الكامل</label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-bold">اسم المستخدم</label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-bold">البريد</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-bold">الدور</label>
                <select
                  className="w-full h-10 rounded-xl border border-surface-hover bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 font-bold">كلمة مرور مؤقتة (اختياري)</label>
                <Input
                  type="text"
                  placeholder="ستُولد تلقائياً إن تركتها فارغة"
                  value={form.tempPassword}
                  onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                />
              </div>
              <div className="space-y-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.disabled}
                  onChange={(e) => setForm({ ...form, disabled: e.target.checked })}
                />
                <span className="text-sm text-gray-500">تعطيل الحساب</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500">الصلاحيات</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PERMISSION_OPTIONS.map((perm) => (
                  <label
                    key={perm}
                    className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 border ${
                      form.permissions.includes(perm) ? "border-primary text-primary" : "border-surface-hover text-gray-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(perm)}
                      onChange={() => togglePerm(perm)}
                    />
                    <span>{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave}>{editing ? "حفظ التغييرات" : "إضافة"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
