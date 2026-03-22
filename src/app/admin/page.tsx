"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    fetchAdminAnalytics,
    fetchAdminOverview,
    fetchAdminStats,
    fetchRecentOrders,
    broadcastOfferNotification,
    getAdminOrderKind,
    type AdminAnalyticsData,
    type AdminOverview,
} from '@/services/adminService';
import {
    AlertTriangle,
    ArrowLeft,
    BellRing,
    CircleDot,
    CheckCircle2,
    Clock,
    Loader2,
    Package,
    ShieldAlert,
    ShoppingCart,
    TrendingUp,
    Truck,
    UserCog,
    Users,
    Warehouse,
    BarChart3,
    TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { hasPermission } from '@/lib/permissions';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending: { label: 'في الانتظار', color: 'text-amber-400 bg-amber-400/10' },
    shipped: { label: 'تم الشحن', color: 'text-blue-400 bg-blue-400/10' },
    delivered: { label: 'تم التوصيل', color: 'text-emerald-400 bg-emerald-400/10' },
    cancelled: { label: 'ملغي', color: 'text-rose-400 bg-rose-400/10' },
};

const EMPTY_OVERVIEW: AdminOverview = {
    orderHealth: {
        pending: 0,
        processing: 0,
        shipped: 0,
        ordersToday: 0,
        deliveredToday: 0,
        needsAssignment: 0,
        overdueShipping: 0,
        standardOrders: 0,
        searchingRequests: 0,
        pricedSearchRequests: 0,
    },
    financeHealth: {
        deliveredRevenueToday: 0,
        deliveredDriverRevenueToday: 0,
        deliveredMerchantSettlementToday: 0,
        deliveredMerchantDiscountProfitToday: 0,
        averageDeliveredOrderValue: 0,
        openOrderValue: 0,
        openPlatformRevenue: 0,
    },
    teamHealth: {
        totalStaff: 0,
        activeStaff: 0,
        disabledStaff: 0,
        mustChangePassword: 0,
        staleStaffCount: 0,
        neverLoggedInStaff: 0,
        totalDrivers: 0,
        availableDrivers: 0,
        restingDrivers: 0,
        newDriversThisWeek: 0,
        newStaffThisWeek: 0,
        newCustomersThisWeek: 0,
    },
    inventoryHealth: {
        lowStockCount: 0,
        outOfStockCount: 0,
        lowStockProducts: [],
        outOfStockProducts: [],
    },
    staffActivity: [],
    latestJoins: [],
};

const EMPTY_ANALYTICS: AdminAnalyticsData = {
    windowDays: 30,
    revenue: {
        today: 0,
        week: 0,
        month: 0,
        year: 0,
    },
    visits: {
        totalVisits: 0,
        todayVisits: 0,
        yesterdayVisits: 0,
        weekVisits: 0,
        previousWeekVisits: 0,
        monthVisits: 0,
        previousMonthVisits: 0,
        yearVisits: 0,
        totalPageViews: 0,
        todayPageViews: 0,
        yesterdayPageViews: 0,
        weekPageViews: 0,
        previousWeekPageViews: 0,
        monthPageViews: 0,
        previousMonthPageViews: 0,
        yearPageViews: 0,
        topPages: [],
        exitPages: [],
        checkoutSources: [],
    },
    comparisons: {
        revenue: {
            todayVsYesterday: 0,
            weekVsPreviousWeek: 0,
            monthVsPreviousMonth: 0,
            yearVsPreviousYear: 0,
        },
        visits: {
            todayVsYesterday: 0,
            weekVsPreviousWeek: 0,
            monthVsPreviousMonth: 0,
            pageViewsTodayVsYesterday: 0,
            pageViewsWeekVsPreviousWeek: 0,
            pageViewsMonthVsPreviousMonth: 0,
        },
    },
    summary: {
        totalTrackedOrders: 0,
        deliveredOrders: 0,
        totalOrderedUnits: 0,
        conversionRate: 0,
        averageOrderValue: 0,
    },
    trends: {
        dailyRevenue: [],
        dailyOrders: [],
    },
    productInsights: {
        mostOrdered: null,
        topProducts: [],
    },
    categoryInsights: {
        mostOrdered: null,
        leastOrdered: null,
        rows: [],
    },
};

function roleLabel(role: string) {
    switch (role) {
        case 'super_admin':
            return 'مشرف عام';
        case 'admin':
            return 'مدير نظام';
        case 'operations_manager':
            return 'مسؤول عمليات';
        case 'catalog_manager':
            return 'مسؤول كتالوج';
        case 'support_agent':
            return 'موظف دعم';
        case 'driver':
            return 'مندوب';
        default:
            return 'عميل';
    }
}

function activityStatusMeta(status: AdminOverview['staffActivity'][number]['status']) {
    switch (status) {
        case 'recent':
            return { label: 'نشط مؤخرًا', tone: 'text-emerald-400 bg-emerald-400/10' };
        case 'stale':
            return { label: 'غائب من فترة', tone: 'text-amber-400 bg-amber-400/10' };
        case 'disabled':
            return { label: 'معطل', tone: 'text-rose-400 bg-rose-400/10' };
        default:
            return { label: 'لم يسجل دخولًا بعد', tone: 'text-violet-400 bg-violet-400/10' };
    }
}

function orderKindMeta(order: any) {
    switch (getAdminOrderKind(order)) {
        case 'searching_request':
            return { label: 'بندور عليه', tone: 'text-violet-400 bg-violet-400/10' };
        case 'priced_request':
            return { label: 'لقيناه ومستني رد', tone: 'text-sky-400 bg-sky-400/10' };
        default:
            return { label: 'طلب عادي', tone: 'text-emerald-400 bg-emerald-400/10' };
    }
}

export default function AdminPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalTrackedOrders: 0,
        totalSearchRequests: 0,
        totalRevenue: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [overview, setOverview] = useState<AdminOverview>(EMPTY_OVERVIEW);
    const [analytics, setAnalytics] = useState<AdminAnalyticsData>(EMPTY_ANALYTICS);
    const { user, profile, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        const hasFullAdmin =
            hasPermission(profile, 'manage_admins') ||
            hasPermission(profile, 'manage_users') ||
            hasPermission(profile, 'manage_products') ||
            hasPermission(profile, 'manage_categories') ||
            hasPermission(profile, 'manage_offers') ||
            hasPermission(profile, 'manage_discounts') ||
            hasPermission(profile, 'manage_settings') ||
            hasPermission(profile, 'view_reports');

        if (!hasFullAdmin) {
            router.replace('/admin/orders');
            return;
        }

        let cancelled = false;

        const loadDashboard = async () => {
            setIsLoading(true);
            try {
                const [statsData, recentOrdersData, overviewData, analyticsData] = await Promise.all([
                    fetchAdminStats(),
                    fetchRecentOrders(6),
                    fetchAdminOverview(),
                    fetchAdminAnalytics(),
                ]);

                if (cancelled) return;
                setStats(statsData);
                setRecentOrders(recentOrdersData);
                setOverview(overviewData);
                setAnalytics(analyticsData);
            } catch (error) {
                console.error('Failed to load admin dashboard', error);
                if (!cancelled) {
                    toast.error('تعذر تحميل بيانات لوحة التحكم بالكامل. حاول التحديث مرة أخرى.');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [user, profile, isAuthLoading, router]);

    const analyticsHighlights = [
        {
            label: 'أكثر منتج بيتطلب',
            value: analytics.productInsights.mostOrdered?.name || 'لسه مفيش',
            helper: analytics.productInsights.mostOrdered
                ? `${analytics.productInsights.mostOrdered.quantity} قطعة`
                : 'أول ما الطلبات تزيد هيبان هنا',
            href: '/admin/analytics',
            icon: Package,
            tone: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        },
        {
            label: 'أكثر قسم بيتطلب',
            value: analytics.categoryInsights.mostOrdered?.name || 'لسه مفيش',
            helper: analytics.categoryInsights.mostOrdered
                ? `${analytics.categoryInsights.mostOrdered.quantity} قطعة`
                : 'محتاج شوية طلبات كمان',
            href: '/admin/analytics',
            icon: TrendingUp,
            tone: 'text-primary bg-primary/10 border-primary/20',
        },
        {
            label: 'أقل قسم بيتطلب',
            value: analytics.categoryInsights.leastOrdered?.name || 'لسه مفيش',
            helper: analytics.categoryInsights.leastOrdered
                ? `${analytics.categoryInsights.leastOrdered.quantity} قطعة`
                : 'لسه مفيش بيانات كفاية',
            href: '/admin/analytics',
            icon: TrendingDown,
            tone: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
        },
        {
            label: 'زيارات اليوم',
            value: analytics.visits.todayVisits.toLocaleString(),
            helper: `إجمالي الزيارات ${analytics.visits.totalVisits.toLocaleString()}`,
            href: '/admin/analytics',
            icon: BarChart3,
            tone: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
        },
    ];

    const metricCards = [
        { label: 'المستخدمون', value: stats.totalUsers, icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10', href: '/admin/users' },
        { label: 'المنتجات', value: stats.totalProducts, icon: Package, color: 'text-sky-400', bg: 'bg-sky-400/10', href: '/admin/products' },
        { label: 'الطلبات العادية', value: stats.totalOrders, icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-400/10', href: '/admin/orders' },
        { label: 'طلبات بندور عليها', value: stats.totalSearchRequests, icon: Clock, color: 'text-violet-400', bg: 'bg-violet-400/10', href: '/admin/orders/search-requests' },
        { label: 'إيراد المنصة', value: `${stats.totalRevenue.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', href: '/admin/orders' },
    ];

    const operationAlerts = [
        {
            label: 'طلبات تنتظر التعيين',
            value: overview.orderHealth.needsAssignment,
            href: '/admin/orders',
            icon: Truck,
            tone: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        },
        {
            label: 'طلبات شحن متأخرة',
            value: overview.orderHealth.overdueShipping,
            href: '/admin/orders',
            icon: AlertTriangle,
            tone: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
        },
        {
            label: 'طلبات لسه بندور عليها',
            value: overview.orderHealth.searchingRequests,
            href: '/admin/orders/search-requests?state=searching',
            icon: Clock,
            tone: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
        },
        {
            label: 'لقيناها ومستنية رد العميل',
            value: overview.orderHealth.pricedSearchRequests,
            href: '/admin/orders/search-requests?state=priced',
            icon: CircleDot,
            tone: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
        },
        {
            label: 'موظفون يحتاجون تحديث كلمة المرور',
            value: overview.teamHealth.mustChangePassword,
            href: '/admin/staff',
            icon: ShieldAlert,
            tone: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
        },
    ];

    const handleBroadcastOffers = async () => {
        if (!confirm('هل أنت متأكد من إرسال إشعار بوجود عروض جديدة لجميع المستخدمين؟')) return;

        setIsBroadcasting(true);
        try {
            const res = await broadcastOfferNotification(
                'عروض مَتتفوّتش! 🚀🔥',
                'خصومات حصرية بدأت دلوقتي على منتجات مختارة، الحقها قبل ما تخلص!',
                '/offers'
            );

            if (res.error) throw new Error(res.error.message);
            toast.success(`تم إرسال الإشعار بنجاح لـ ${res.count} مستخدم! 🔔`);
        } catch (error: any) {
            toast.error('حدث خطأ أثناء إرسال الإشعارات: ' + error.message);
        } finally {
            setIsBroadcasting(false);
        }
    };

    const pulseCards = [
        {
            label: 'طلبات اليوم',
            value: overview.orderHealth.ordersToday,
            helper: `${overview.orderHealth.deliveredToday} تم توصيلها اليوم`,
            icon: ShoppingCart,
            tone: 'text-amber-400 bg-amber-400/10',
        },
        {
            label: 'نصيب المنصة اليوم',
            value: `${overview.financeHealth.deliveredRevenueToday.toLocaleString()} ج.م`,
            helper: `ربح إضافي من خصومات المحلات ${overview.financeHealth.deliveredMerchantDiscountProfitToday.toLocaleString()} ج.م`,
            icon: TrendingUp,
            tone: 'text-emerald-400 bg-emerald-400/10',
        },
        {
            label: 'نصيب المندوبين اليوم',
            value: `${overview.financeHealth.deliveredDriverRevenueToday.toLocaleString()} ج.م`,
            helper: `ثابت 10 ج.م لكل طلب تم توصيله`,
            icon: Truck,
            tone: 'text-sky-400 bg-sky-400/10',
        },
        {
            label: 'مستحقات المحلات اليوم',
            value: `${overview.financeHealth.deliveredMerchantSettlementToday.toLocaleString()} ج.م`,
            helper: `بعد خصومات المحلات المتفق عليها`,
            icon: Warehouse,
            tone: 'text-violet-400 bg-violet-400/10',
        },
        {
            label: 'تحصيلات مفتوحة',
            value: `${overview.financeHealth.openOrderValue.toLocaleString()} ج.م`,
            helper: `منها نصيب منصة متوقع ${overview.financeHealth.openPlatformRevenue.toLocaleString()} ج.م`,
            icon: Users,
            tone: 'text-amber-400 bg-amber-400/10',
        },
    ];

    const priorityCards = [
        {
            title: 'تدخل تشغيلي فوري',
            value: overview.orderHealth.needsAssignment + overview.orderHealth.overdueShipping,
            description: `${overview.orderHealth.needsAssignment} طلبات بدون مندوب و${overview.orderHealth.overdueShipping} طلبات شحن متأخرة`,
            href: '/admin/orders',
            icon: AlertTriangle,
            tone: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
        },
        {
            title: 'متابعة الطاقم',
            value: overview.teamHealth.mustChangePassword + overview.teamHealth.staleStaffCount + overview.teamHealth.neverLoggedInStaff,
            description: `${overview.teamHealth.mustChangePassword} يحتاجون كلمة مرور، ${overview.teamHealth.staleStaffCount} غائبون، ${overview.teamHealth.neverLoggedInStaff} لم يسجلوا الدخول`,
            href: '/admin/staff',
            icon: ShieldAlert,
            tone: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
        },
        {
            title: 'حرج في المخزون',
            value: overview.inventoryHealth.lowStockCount + overview.inventoryHealth.outOfStockCount,
            description: `${overview.inventoryHealth.outOfStockCount} نفد بالكامل و${overview.inventoryHealth.lowStockCount} منخفضة المخزون`,
            href: '/admin/products',
            icon: Package,
            tone: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-black text-foreground">لوحة متابعة الشغل</h1>
                    <p className="text-sm text-gray-500 mt-1">كل اللي محتاجه قدامك بسرعة، من الطلبات العادية لحد الطلبات اللي لسه بندور عليها</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/admin/staff" className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-400 transition-colors hover:bg-violet-500/15">
                        إدارة الطاقم
                    </Link>
                    <Link href="/admin/drivers" className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15">
                        شوف المندوبين
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                {metricCards.map((card) => {
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

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                {pulseCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500">{card.label}</p>
                                    <p className="mt-2 text-2xl font-black text-foreground">{isLoading ? '...' : card.value}</p>
                                    <p className="mt-2 text-xs text-gray-500">{card.helper}</p>
                                </div>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                {operationAlerts.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link key={item.label} href={item.href} className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${item.tone}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold opacity-80">{item.label}</p>
                                    <p className="mt-2 text-3xl font-black">{isLoading ? '...' : item.value}</p>
                                </div>
                                <div className="rounded-xl bg-black/10 p-2">
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <h2 className="text-sm font-bold text-foreground">لمحة تحليلية سريعة</h2>
                    </div>
                    <Link href="/admin/analytics" className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                        افتح صفحة التحليلات <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {analyticsHighlights.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link key={item.label} href={item.href} className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${item.tone}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold opacity-80">{item.label}</p>
                                        <p className="mt-2 truncate text-lg font-black">{isLoading ? '...' : item.value}</p>
                                        <p className="mt-2 text-xs opacity-80">{item.helper}</p>
                                    </div>
                                    <div className="rounded-xl bg-black/10 p-2">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {priorityCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link key={card.title} href={card.href} className={`rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${card.tone}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold opacity-80">أولوية المشرف العام</p>
                                    <h2 className="mt-2 text-lg font-black">{card.title}</h2>
                                    <p className="mt-2 text-sm opacity-80">{card.description}</p>
                                </div>
                                <div className="rounded-2xl bg-black/10 p-3">
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-3xl font-black">{isLoading ? '...' : card.value}</span>
                                <span className="text-xs font-bold">فتح القسم</span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between p-5 border-b border-surface-hover">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <h2 className="font-bold text-foreground text-sm">رادار العمليات</h2>
                            </div>
                            <Link href="/admin/orders" className="text-xs text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
                                فتح الطلبات <ArrowLeft className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 p-5">
                            {[
                                { label: 'قيد الانتظار', value: overview.orderHealth.pending, icon: Clock, tone: 'text-amber-400 bg-amber-400/10' },
                                { label: 'قيد التجهيز', value: overview.orderHealth.processing, icon: CircleDot, tone: 'text-violet-400 bg-violet-400/10' },
                                { label: 'تم الشحن', value: overview.orderHealth.shipped, icon: Truck, tone: 'text-blue-400 bg-blue-400/10' },
                                { label: 'تم التوصيل اليوم', value: overview.orderHealth.deliveredToday, icon: CheckCircle2, tone: 'text-emerald-400 bg-emerald-400/10' },
                                { label: 'بانتظار مندوب', value: overview.orderHealth.needsAssignment, icon: UserCog, tone: 'text-violet-400 bg-violet-400/10' },
                                { label: 'متأخرة', value: overview.orderHealth.overdueShipping, icon: AlertTriangle, tone: 'text-rose-400 bg-rose-400/10' },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className="rounded-2xl border border-surface-hover bg-background p-4">
                                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <p className="text-2xl font-black text-foreground">{isLoading ? '...' : item.value}</p>
                                        <p className="mt-1 text-xs text-gray-500">{item.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

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
                            <div className="p-10 text-center text-gray-500 text-sm">لسه مفيش طلبات ظاهرة</div>
                        ) : (
                            <div className="divide-y divide-surface-hover">
                                {recentOrders.map((order: any) => {
                                    const status = STATUS_MAP[order.status] || { label: order.status, color: 'text-gray-500 bg-surface-hover' };
                                    const kind = orderKindMeta(order);
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
                                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${kind.tone}`}>
                                                {kind.label}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <span className="text-sm font-black text-primary shrink-0">
                                                {(order.total_amount || 0).toLocaleString()} ج.م
                                            </span>
                                            <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-surface border border-surface-hover rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert className="w-4 h-4 text-violet-400" />
                            <h2 className="font-bold text-foreground text-sm">حالة الفريق</h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">الطاقم النشط</span>
                                <span className="text-lg font-black text-foreground">{overview.teamHealth.activeStaff}/{overview.teamHealth.totalStaff}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">الموظفون المعطلون</span>
                                <span className="text-lg font-black text-rose-400">{overview.teamHealth.disabledStaff}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">مندوبون متاحون</span>
                                <span className="text-lg font-black text-emerald-400">{overview.teamHealth.availableDrivers}/{overview.teamHealth.totalDrivers}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">مندوبون في راحة</span>
                                <span className="text-lg font-black text-amber-400">{overview.teamHealth.restingDrivers}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">طاقم غائب من فترة</span>
                                <span className="text-lg font-black text-amber-400">{overview.teamHealth.staleStaffCount}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">بانتظار أول دخول</span>
                                <span className="text-lg font-black text-violet-400">{overview.teamHealth.neverLoggedInStaff}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-surface-hover rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-violet-400" />
                                <h2 className="font-bold text-foreground text-sm">نبض الطاقم</h2>
                            </div>
                            <Link href="/admin/staff" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                افتح إدارة الطاقم
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {overview.staffActivity.length === 0 ? (
                                <div className="rounded-xl bg-background p-4 text-center text-xs text-gray-500">
                                    لا توجد بيانات نشاط للطاقم بعد
                                </div>
                            ) : (
                                overview.staffActivity.map((item) => {
                                    const meta = activityStatusMeta(item.status);
                                    return (
                                        <div key={item.id} className="rounded-xl bg-background px-3 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-foreground">{item.full_name}</p>
                                                    <p className="truncate text-xs text-gray-500">{item.email}</p>
                                                </div>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.tone}`}>
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                                <span>{roleLabel(item.role)}</span>
                                                <span>
                                                    {item.last_login_at
                                                        ? `آخر دخول ${new Date(item.last_login_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}`
                                                        : 'بانتظار أول تسجيل دخول'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="bg-surface border border-surface-hover rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Warehouse className="w-4 h-4 text-sky-400" />
                                <h2 className="font-bold text-foreground text-sm">تابع المخزون</h2>
                            </div>
                            <Link href="/admin/products" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                فتح المنتجات
                            </Link>
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-background p-3">
                                <p className="text-xs text-gray-500">منخفض المخزون</p>
                                <p className="mt-1 text-2xl font-black text-amber-400">{overview.inventoryHealth.lowStockCount}</p>
                            </div>
                            <div className="rounded-xl bg-background p-3">
                                <p className="text-xs text-gray-500">نفد من المخزون</p>
                                <p className="mt-1 text-2xl font-black text-rose-400">{overview.inventoryHealth.outOfStockCount}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {overview.inventoryHealth.lowStockProducts.length === 0 ? (
                                <div className="rounded-xl bg-background p-4 text-center text-xs text-gray-500">
                                    لا توجد منتجات حرجة حاليًا
                                </div>
                            ) : (
                                overview.inventoryHealth.lowStockProducts.map((product) => (
                                    <Link
                                        key={product.id}
                                        href="/admin/products"
                                        className="flex items-center justify-between rounded-xl bg-background px-3 py-3 transition-colors hover:bg-surface-hover"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.price.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-400">
                                            {product.stock_quantity} متبقي
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>

                        {overview.inventoryHealth.outOfStockProducts.length > 0 && (
                            <div className="mt-4 border-t border-surface-hover pt-4">
                                <p className="mb-2 text-xs font-bold text-rose-400">نفدت بالكامل</p>
                                <div className="space-y-2">
                                    {overview.inventoryHealth.outOfStockProducts.map((product) => (
                                        <Link
                                            key={product.id}
                                            href="/admin/products"
                                            className="flex items-center justify-between rounded-xl bg-background px-3 py-3 transition-colors hover:bg-surface-hover"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.price.toLocaleString()} ج.م</p>
                                            </div>
                                            <div className="rounded-full bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-400">
                                                نفد المخزون
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-surface border border-surface-hover rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <h2 className="font-bold text-foreground text-sm">أحدث المنضمين</h2>
                            </div>
                            <Link href="/admin/users" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                افتح السجلات
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {overview.latestJoins.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-background px-3 py-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-black">
                                        {(item.full_name || item.email || 'U').charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-foreground">{item.full_name}</p>
                                        <p className="truncate text-xs text-gray-500">{item.email}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-primary">{roleLabel(item.role)}</p>
                                        <p className="text-[10px] text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'الطاقم والصلاحيات', href: '/admin/staff', icon: ShieldAlert, tone: 'from-violet-500/10 to-transparent border-violet-500/20 text-violet-400' },
                    { label: 'وزّع المندوبين', href: '/admin/drivers', icon: Truck, tone: 'from-primary/10 to-transparent border-primary/20 text-primary' },
                    { label: 'إدارة المستخدمين', href: '/admin/users', icon: Users, tone: 'from-sky-500/10 to-transparent border-sky-500/20 text-sky-400' },
                    { label: 'ابعت إشعار بالعروض', href: '#', icon: BellRing, tone: 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-400', action: handleBroadcastOffers },
                ].map((item) => {
                    const Icon = item.icon;
                    const content = (
                        <>
                            <Icon className="w-5 h-5 mb-3" />
                            <p className="text-sm font-bold">{item.label}</p>
                            {item.action && isBroadcasting && (
                                <div className="mt-3 flex items-center gap-2 text-xs">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    بنبعت دلوقتي...
                                </div>
                            )}
                        </>
                    );

                    if (item.action) {
                        return (
                            <button
                                key={item.label}
                                onClick={item.action}
                                disabled={isBroadcasting}
                                className={`bg-gradient-to-br ${item.tone} border rounded-2xl p-4 text-start transition-all hover:scale-[1.02] shadow-sm disabled:opacity-50`}
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`bg-gradient-to-br ${item.tone} border rounded-2xl p-4 text-start transition-all hover:scale-[1.02] shadow-sm`}
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

