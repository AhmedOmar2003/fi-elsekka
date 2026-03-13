"use client"

import React, { useState, useEffect } from 'react';
import { Settings, Globe, Bell, ShieldCheck, Palette, Save, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const SETTING_KEY = 'fi_elsekka_admin_settings';

const DEFAULT_SETTINGS = {
    siteName: 'في السكة',
    siteTagline: 'بالسكة الصح',
    supportPhone: '',
    supportEmail: '',
    freeShippingThreshold: '0',
    defaultShippingCost: '35',
    notifyNewOrders: true,
    notifyNewUsers: true,
    maintenanceMode: false,
};

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(SETTING_KEY);
            if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        } catch { }
    }, []);

    const handleSave = () => {
        try {
            localStorage.setItem(SETTING_KEY, JSON.stringify(settings));
            setSaved(true);
            toast.success('تم حفظ الإعدادات ✅');
            setTimeout(() => setSaved(false), 3000);
        } catch {
            toast.error('فشل الحفظ');
        }
    };

    const Field = ({ label, value, onChange, type = 'text', placeholder = '' }: {
        label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
    }) => (
        <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-primary/50"
            />
        </div>
    );

    const Toggle = ({ label, description, value, onChange }: {
        label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
    }) => (
        <label className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border cursor-pointer transition-all ${value ? 'bg-primary/5 border-primary/20' : 'bg-surface-hover border-surface-hover hover:border-primary/30'}`}>
            <div>
                <span className="text-sm font-bold text-foreground block">{label}</span>
                {description && <span className="text-xs text-gray-500 mt-0.5 block">{description}</span>}
            </div>
            <div
                onClick={() => onChange(!value)}
                className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${value ? 'bg-primary' : 'bg-gray-400/30 dark:bg-white/10'}`}
            >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
            </div>
        </label>
    );

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-black text-foreground">الإعدادات</h1>
                    <p className="text-sm text-gray-500 mt-0.5">إعدادات عامة للوحة الإدارة والموقع</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${saved ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'}`}
                >
                    {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'تم الحفظ!' : 'حفظ الإعدادات'}
                </button>
            </div>

            {/* Site Info */}
            <div className="bg-surface border border-surface-hover rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-black text-foreground">معلومات الموقع</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="اسم الموقع" value={settings.siteName} onChange={v => setSettings(s => ({ ...s, siteName: v }))} placeholder="في السكة" />
                    <Field label="الشعار التعريفي" value={settings.siteTagline} onChange={v => setSettings(s => ({ ...s, siteTagline: v }))} placeholder="بالسكة الصح" />
                    <Field label="رقم الدعم" value={settings.supportPhone} onChange={v => setSettings(s => ({ ...s, supportPhone: v }))} placeholder="01xxxxxxxxx" type="tel" />
                    <Field label="إيميل الدعم" value={settings.supportEmail} onChange={v => setSettings(s => ({ ...s, supportEmail: v }))} placeholder="support@example.com" type="email" />
                </div>
            </div>

            {/* Shipping */}
            <div className="bg-surface border border-surface-hover rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm font-black text-foreground">إعدادات الشحن</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="تكلفة الشحن الافتراضية (ج.م)"
                        value={settings.defaultShippingCost}
                        onChange={v => setSettings(s => ({ ...s, defaultShippingCost: v }))}
                        type="number"
                        placeholder="35"
                    />
                    <Field
                        label="حد الشحن المجاني (ج.م) - 0 = لا يوجد"
                        value={settings.freeShippingThreshold}
                        onChange={v => setSettings(s => ({ ...s, freeShippingThreshold: v }))}
                        type="number"
                        placeholder="500"
                    />
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-surface border border-surface-hover rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-black text-foreground">إعدادات الإشعارات</h2>
                </div>
                <Toggle
                    label="إشعارات الطلبات الجديدة"
                    description="اعرض إشعاراً عند ورود كل طلب جديد"
                    value={settings.notifyNewOrders}
                    onChange={v => setSettings(s => ({ ...s, notifyNewOrders: v }))}
                />
                <Toggle
                    label="إشعارات المستخدمين الجدد"
                    description="اعرض إشعاراً عند تسجيل مستخدم جديد"
                    value={settings.notifyNewUsers}
                    onChange={v => setSettings(s => ({ ...s, notifyNewUsers: v }))}
                />
            </div>

            {/* System */}
            <div className="bg-surface border border-surface-hover rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4 text-rose-500" />
                    <h2 className="text-sm font-black text-foreground">إعدادات النظام</h2>
                </div>
                <Toggle
                    label="وضع الصيانة"
                    description="عند التفعيل، يظهر للزوار رسالة الصيانة بدلاً من الموقع"
                    value={settings.maintenanceMode}
                    onChange={v => setSettings(s => ({ ...s, maintenanceMode: v }))}
                />
                <div className="mt-4 p-3.5 bg-surface-hover rounded-xl border border-surface-hover flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-foreground">إدارة قاعدة البيانات</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">فتح Supabase Dashboard مباشرةً</p>
                    </div>
                    <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                    >
                        Supabase <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>
    );
}
