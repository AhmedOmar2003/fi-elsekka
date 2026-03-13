"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAdminStats, fetchRecentOrders } from '@/services/adminService';
import { Users, Package, ShoppingCart, TrendingUp, ArrowLeft, Clock, ChevronRight } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'في الانتظار', color: 'text-amber-400  bg-amber-400/10' },
    shipped: { label: 'تم الشحن', color: 'text-blue-400   bg-blue-400/10' },
    delivered: { label: 'تم التوصيل', color: 'text-emerald-400 bg-emerald-400/10' },
    cancelled: { label: 'ملغي', color: 'text-rose-400   bg-rose-400/10' },
};

export default function AdminPage() {
    const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const { user, isLoading: isAuthLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        Promise.all([fetchAdminStats(), fetchRecentOrders(6)]).then(([s, o]) => {
            setStats(s);
            setRecentOrders(o);
            setIsLoading(false);
        });
    }, [user, isAuthLoading]);

    const METRIC_CARDS = [
        { label: 'المستخدمون', value: stats.totalUsers, icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10', href: '/admin/users' },
        { label: 'المنتجات', value: stats.totalProducts, icon: Package, color: 'text-sky-400', bg: 'bg-sky-400/10', href: '/admin/products' },
        { label: 'الطلبات', value: stats.totalOrders, icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-400/10', href: '/admin/orders' },
        { label: 'الإيرادات', value: `${stats.totalRevenue.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', href: '#' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-heading font-black text-foreground">لوحة التحكم 🛠️</h1>
                <p className="text-sm text-gray-500 mt-1">نظرة سريعة على أداء المتجر</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {METRIC_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link href={card.href} key={card.label} className="group bg-surface border border-surface-hover rounded-2xl p-5 hover:border-primary/30 transition-all hover:-translate-y-0.5 shadow-sm">
                            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-4`}>
                                <Icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                            {isLoading ? (
                                <div className="h-8 w-20 bg-surface-hover rounded-lg animate-pulse mb-1" />
                            ) : (
                                <p className="text-2xl font-black text-foreground">{card.value}</p>
                            )}
                            <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                        </Link>
                    );
                })}
            </div>

            {/* Recent Orders */}
            <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-surface-hover">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <h2 className="font-bold text-foreground text-sm">أحدث الطلبات</h2>
                    </div>
                    <Link href="/admin/orders" className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                        عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-14 bg-surface-hover rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 text-sm">لا توجد طلبات بعد</div>
                ) : (
                    <div className="divide-y divide-surface-hover">
                        {recentOrders.map((order: any) => {
                            const status = STATUS_MAP[order.status] || { label: order.status, color: 'text-gray-500 bg-surface-hover' };
                            return (
                                <Link href={`/admin/orders?id=${order.id}`} key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">
                                            {(order.users as any)?.full_name || (order.users as any)?.email || 'مستخدم غير معروف'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(order.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${status.color}`}>
                                        {status.label}
                                    </span>
                                    <span className="text-sm font-black text-primary shrink-0">
                                        {(order.total_amount || 0).toLocaleString()} ج.م
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { label: 'إضافة منتج جديد', href: '/admin/products?action=new', color: 'from-primary/10 to-transparent border-primary/20 text-primary' },
                    { label: 'إضافة قسم جديد', href: '/admin/categories?action=new', color: 'from-violet-500/10 to-transparent border-violet-500/20 text-violet-500' },
                    { label: 'إدارة المستخدمين', href: '/admin/users', color: 'from-sky-500/10 to-transparent border-sky-500/20 text-sky-500' },
                ].map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`bg-gradient-to-br ${link.color} border rounded-2xl p-4 text-sm font-bold hover:scale-[1.02] bg-surface transition-all shadow-sm`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
