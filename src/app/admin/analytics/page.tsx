"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
    fetchAdminAnalytics,
    fetchAdminOverview,
    type AdminAnalyticsRange,
    type AdminAnalyticsData,
    type AdminOverview,
} from '@/services/adminService';
import { hasPermission } from '@/lib/permissions';
import {
    AlertTriangle,
    ArrowLeft,
    BarChart3,
    Clock3,
    Download,
    Eye,
    Loader2,
    Package,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';

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

function currency(value: number) {
    return `${Math.round(value || 0).toLocaleString()} ج.م`;
}

function compareLabel(value: number) {
    if (value > 0) return `+${value}% عن الفترة اللي قبلها`;
    if (value < 0) return `${value}% عن الفترة اللي قبلها`;
    return 'ثابت تقريبًا عن الفترة اللي قبلها';
}

function compareTone(value: number) {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-rose-400';
    return 'text-gray-400';
}

function maxValue(items: Array<{ value: number }>) {
    return items.reduce((max, item) => Math.max(max, item.value), 0);
}

export default function AdminAnalyticsPage() {
    const { user, profile, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRange = Number(searchParams.get('range') || 30);
    const [windowDays, setWindowDays] = useState<AdminAnalyticsRange>(initialRange === 7 || initialRange === 90 ? initialRange : 30);
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AdminAnalyticsData>(EMPTY_ANALYTICS);
    const [overview, setOverview] = useState<AdminOverview>(EMPTY_OVERVIEW);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            setIsLoading(false);
            return;
        }

        if (!hasPermission(profile, 'view_reports')) {
            router.replace('/admin/orders');
            return;
        }

        let cancelled = false;

        const loadAnalytics = async () => {
            setIsLoading(true);
            try {
                const [analyticsData, overviewData] = await Promise.all([
                    fetchAdminAnalytics(windowDays),
                    fetchAdminOverview(),
                ]);

                if (cancelled) return;
                setAnalytics(analyticsData);
                setOverview(overviewData);
            } catch (error) {
                console.error('Failed to load analytics page', error);
                if (!cancelled) {
                    toast.error('تعذر تحميل التحليلات دلوقتي. جرّب تاني بعد شوية.');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        loadAnalytics();

        return () => {
            cancelled = true;
        };
    }, [user, profile, isAuthLoading, router, windowDays]);

    useEffect(() => {
        const current = searchParams.get('range');
        const wanted = String(windowDays);
        if (current === wanted) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('range', wanted);
        router.replace(`/admin/analytics?${params.toString()}`);
    }, [windowDays, router, searchParams]);

    const fixes = useMemo(() => {
        const items: Array<{ title: string; body: string; href: string; tone: string }> = [];

        if (overview.orderHealth.overdueShipping > 0) {
            items.push({
                title: 'في طلبات شحن اتأخرت',
                body: `${overview.orderHealth.overdueShipping} طلب محتاج متابعة مع المندوبين دلوقتي قبل ما العميل يضايق.`,
                href: '/admin/operations',
                tone: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
            });
        }

        if (overview.inventoryHealth.lowStockCount > 0 || overview.inventoryHealth.outOfStockCount > 0) {
            items.push({
                title: 'المخزون محتاج يتراجع',
                body: `${overview.inventoryHealth.outOfStockCount} منتجات خلصت و${overview.inventoryHealth.lowStockCount} قربت تخلص.`,
                href: '/admin/products',
                tone: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
            });
        }

        if ((analytics.categoryInsights.leastOrdered?.quantity || 0) === 0 && analytics.categoryInsights.leastOrdered) {
            items.push({
                title: 'في قسم شبه واقف',
                body: `قسم ${analytics.categoryInsights.leastOrdered.name} لسه مجبش طلبات فعلية، فغالبًا محتاج عرض أو ترتيب أحسن أو منتجات أوضح.`,
                href: '/admin/categories',
                tone: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
            });
        }

        if (overview.orderHealth.pricedSearchRequests > 0) {
            items.push({
                title: 'في عملاء مستنيين رد بعد التسعير',
                body: `${overview.orderHealth.pricedSearchRequests} طلب بندور عليه اتسعّر ومستني رد العميل، فمتابعة الإشعارات هنا مهمة.`,
                href: '/admin/orders/search-requests?state=priced',
                tone: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
            });
        }

        if (analytics.visits.weekVisits > 0 && analytics.summary.conversionRate < 3) {
            items.push({
                title: 'الزيارات موجودة لكن التحويل قليل',
                body: `معدل التحويل حاليًا ${analytics.summary.conversionRate}%، فممكن تحتاج نراجع الأسعار أو وصف المنتجات أو سرعة الطلب.`,
                href: '/admin/analytics',
                tone: 'text-primary bg-primary/10 border-primary/20',
            });
        }

        if (items.length === 0) {
            items.push({
                title: 'الوضع مطمّن حاليًا',
                body: 'مفيش إشارات حرجة واضحة في التحليلات دلوقتي، فإحنا ماشيين بشكل كويس.',
                href: '/admin',
                tone: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
            });
        }

        return items.slice(0, 5);
    }, [analytics, overview]);

    const revenueCards = [
        { label: 'دخل اليوم', value: currency(analytics.revenue.today), compare: analytics.comparisons.revenue.todayVsYesterday, icon: Wallet, tone: 'text-emerald-400 bg-emerald-400/10' },
        { label: 'دخل الأسبوع', value: currency(analytics.revenue.week), compare: analytics.comparisons.revenue.weekVsPreviousWeek, icon: TrendingUp, tone: 'text-primary bg-primary/10' },
        { label: 'دخل الشهر', value: currency(analytics.revenue.month), compare: analytics.comparisons.revenue.monthVsPreviousMonth, icon: BarChart3, tone: 'text-sky-400 bg-sky-400/10' },
        { label: 'دخل السنة', value: currency(analytics.revenue.year), compare: analytics.comparisons.revenue.yearVsPreviousYear, icon: TrendingUp, tone: 'text-violet-400 bg-violet-400/10' },
    ];

    const visitCards = [
        { label: 'زيارات اليوم', value: analytics.visits.todayVisits, compare: analytics.comparisons.visits.todayVsYesterday, icon: Eye, tone: 'text-primary bg-primary/10' },
        { label: 'زيارات الأسبوع', value: analytics.visits.weekVisits, compare: analytics.comparisons.visits.weekVsPreviousWeek, icon: Clock3, tone: 'text-sky-400 bg-sky-400/10' },
        { label: 'زيارات الشهر', value: analytics.visits.monthVisits, compare: analytics.comparisons.visits.monthVsPreviousMonth, icon: BarChart3, tone: 'text-violet-400 bg-violet-400/10' },
        { label: 'إجمالي الزيارات', value: analytics.visits.totalVisits, compare: null as number | null, icon: Eye, tone: 'text-amber-400 bg-amber-400/10' },
    ];

    const pageViewCards = [
        { label: 'فتح الصفحات اليوم', value: analytics.visits.todayPageViews, compare: analytics.comparisons.visits.pageViewsTodayVsYesterday, icon: Eye, tone: 'text-emerald-400 bg-emerald-400/10' },
        { label: 'فتح الصفحات الأسبوع ده', value: analytics.visits.weekPageViews, compare: analytics.comparisons.visits.pageViewsWeekVsPreviousWeek, icon: Clock3, tone: 'text-primary bg-primary/10' },
        { label: 'فتح الصفحات الشهر ده', value: analytics.visits.monthPageViews, compare: analytics.comparisons.visits.pageViewsMonthVsPreviousMonth, icon: BarChart3, tone: 'text-sky-400 bg-sky-400/10' },
        { label: 'إجمالي فتح الصفحات', value: analytics.visits.totalPageViews, compare: null as number | null, icon: Eye, tone: 'text-violet-400 bg-violet-400/10' },
    ];

    const insightCards = [
        {
            label: 'أكثر منتج بيتطلب',
            value: analytics.productInsights.mostOrdered?.name || 'لسه مفيش',
            helper: analytics.productInsights.mostOrdered
                ? `${analytics.productInsights.mostOrdered.quantity} قطعة اتطلبت`
                : 'أول ما الطلبات تزيد هيتحدد هنا',
            icon: Package,
            tone: 'text-emerald-400 bg-emerald-400/10',
        },
        {
            label: 'أكثر قسم شغال',
            value: analytics.categoryInsights.mostOrdered?.name || 'لسه مفيش',
            helper: analytics.categoryInsights.mostOrdered
                ? `${analytics.categoryInsights.mostOrdered.quantity} قطعة اتطلبت منه`
                : 'محتاج طلبات أكتر علشان يبان',
            icon: TrendingUp,
            tone: 'text-primary bg-primary/10',
        },
        {
            label: 'أقل قسم بيتطلب',
            value: analytics.categoryInsights.leastOrdered?.name || 'لسه مفيش',
            helper: analytics.categoryInsights.leastOrdered
                ? `${analytics.categoryInsights.leastOrdered.quantity} قطعة بس لحد دلوقتي`
                : 'لما تبقى الأقسام كاملة هيظهر هنا',
            icon: TrendingDown,
            tone: 'text-rose-400 bg-rose-400/10',
        },
        {
            label: 'معدل التحويل',
            value: `${analytics.summary.conversionRate}%`,
            helper: `${analytics.summary.totalTrackedOrders} طلب من أصل ${analytics.visits.totalVisits} زيارة`,
            icon: ShoppingCart,
            tone: 'text-sky-400 bg-sky-400/10',
        },
    ];

    const revenueChartMax = maxValue(analytics.trends.dailyRevenue);
    const ordersChartMax = maxValue(analytics.trends.dailyOrders);

    const exportAnalyticsCsv = () => {
        const rows: string[][] = [
            ['نوع التقرير', `تحليلات ${windowDays} يوم`],
            ['دخل اليوم', String(analytics.revenue.today)],
            ['دخل الأسبوع', String(analytics.revenue.week)],
            ['دخل الشهر', String(analytics.revenue.month)],
            ['دخل السنة', String(analytics.revenue.year)],
            ['زيارات اليوم', String(analytics.visits.todayVisits)],
            ['زيارات الأسبوع', String(analytics.visits.weekVisits)],
            ['زيارات الشهر', String(analytics.visits.monthVisits)],
            ['إجمالي الزيارات', String(analytics.visits.totalVisits)],
            [],
            ['أكثر المنتجات طلبًا'],
            ['المنتج', 'الكمية'],
            ...analytics.productInsights.topProducts.map((product) => [product.name, String(product.quantity)]),
            [],
            ['أداء الأقسام'],
            ['القسم', 'الكمية', 'عدد الطلبات', 'نسبة المساهمة', 'الدخل التقريبي'],
            ...analytics.categoryInsights.rows.map((category) => [
                category.name,
                String(category.quantity),
                String(category.ordersCount),
                `${category.share}%`,
                String(category.revenue),
            ]),
        ];

        const csv = '\uFEFF' + rows
            .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fi-elsekka-analytics-${windowDays}d.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('نزّلنا ملف التحليلات CSV، وتقدر تفتحه في Excel بسهولة.');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-black text-foreground">التحليلات والتقارير</h1>
                    <p className="mt-1 text-sm text-gray-500">هنا هتشوف أكتر منتج بيتطلب، أداء الأقسام، دخل المنصة، وزيارات الموقع بشكل مرتب وواضح.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-surface-hover bg-surface p-1">
                        {[7, 30, 90].map((days) => (
                            <button
                                key={days}
                                type="button"
                                onClick={() => setWindowDays(days as AdminAnalyticsRange)}
                                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                                    windowDays === days
                                        ? 'bg-primary text-white'
                                        : 'text-gray-400 hover:text-foreground'
                                }`}
                            >
                                {days} يوم
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={exportAnalyticsCsv}
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition-colors hover:bg-emerald-500/15"
                    >
                        <Download className="w-4 h-4" />
                        نزّل CSV
                    </button>
                    <Link href="/admin" className="rounded-2xl border border-surface-hover bg-surface px-4 py-2.5 text-sm font-bold text-gray-300 transition-colors hover:border-primary/20 hover:text-foreground">
                        ارجع للوحة التحكم
                    </Link>
                    <Link href="/admin/orders" className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15">
                        افتح الطلبات
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {revenueCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
                            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-bold text-gray-500">{card.label}</p>
                            <p className="mt-2 text-2xl font-black text-foreground">{isLoading ? '...' : card.value}</p>
                            <p className={`mt-2 text-xs font-bold ${compareTone(card.compare)}`}>
                                {isLoading ? '...' : compareLabel(card.compare)}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {visitCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
                            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-bold text-gray-500">{card.label}</p>
                            <p className="mt-2 text-2xl font-black text-foreground">{isLoading ? '...' : card.value.toLocaleString()}</p>
                            {card.compare !== null && (
                                <p className={`mt-2 text-xs font-bold ${compareTone(card.compare)}`}>
                                    {isLoading ? '...' : compareLabel(card.compare)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {pageViewCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
                            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-xs font-bold text-gray-500">{card.label}</p>
                            <p className="mt-2 text-2xl font-black text-foreground">{isLoading ? '...' : card.value.toLocaleString()}</p>
                            {card.compare !== null && (
                                <p className={`mt-2 text-xs font-bold ${compareTone(card.compare)}`}>
                                    {isLoading ? '...' : compareLabel(card.compare)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {insightCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500">{card.label}</p>
                                    <p className="mt-2 text-lg font-black text-foreground">{isLoading ? '...' : card.value}</p>
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-surface-hover bg-surface shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-surface-hover p-5">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <h2 className="text-sm font-bold text-foreground">الرسم اليومي للدخل</h2>
                            </div>
                            <div className="text-xs text-gray-500">آخر 7 أيام</div>
                        </div>

                        <div className="grid grid-cols-7 gap-3 p-5">
                            {isLoading ? (
                                [...Array(7)].map((_, index) => (
                                    <div key={index} className="h-36 rounded-xl bg-surface-hover animate-pulse" />
                                ))
                            ) : (
                                analytics.trends.dailyRevenue.map((point) => (
                                    <div key={point.label} className="flex flex-col items-center gap-3">
                                        <div className="flex h-36 w-full items-end rounded-2xl bg-background p-2">
                                            <div
                                                className="w-full rounded-xl bg-gradient-to-t from-primary to-emerald-400 transition-all"
                                                style={{ height: `${revenueChartMax > 0 ? Math.max((point.value / revenueChartMax) * 100, point.value > 0 ? 12 : 4) : 4}%` }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-foreground">{point.label}</p>
                                            <p className="text-[10px] text-gray-500">{currency(point.value)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-surface-hover bg-surface shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-surface-hover p-5">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-sky-400" />
                                <h2 className="text-sm font-bold text-foreground">الرسم اليومي للطلبات</h2>
                            </div>
                            <div className="text-xs text-gray-500">آخر 7 أيام</div>
                        </div>

                        <div className="grid grid-cols-7 gap-3 p-5">
                            {isLoading ? (
                                [...Array(7)].map((_, index) => (
                                    <div key={index} className="h-36 rounded-xl bg-surface-hover animate-pulse" />
                                ))
                            ) : (
                                analytics.trends.dailyOrders.map((point) => (
                                    <div key={point.label} className="flex flex-col items-center gap-3">
                                        <div className="flex h-36 w-full items-end rounded-2xl bg-background p-2">
                                            <div
                                                className="w-full rounded-xl bg-gradient-to-t from-sky-500 to-violet-400 transition-all"
                                                style={{ height: `${ordersChartMax > 0 ? Math.max((point.value / ordersChartMax) * 100, point.value > 0 ? 12 : 4) : 4}%` }}
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-foreground">{point.label}</p>
                                            <p className="text-[10px] text-gray-500">{point.value.toLocaleString()} طلب</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-surface-hover bg-surface shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-surface-hover p-5">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                <h2 className="text-sm font-bold text-foreground">المنتجات الأكثر مبيعًا</h2>
                            </div>
                            <div className="text-xs text-gray-500">
                                إجمالي القطع المتباعة: {isLoading ? '...' : analytics.summary.totalOrderedUnits.toLocaleString()}
                            </div>
                        </div>

                        <div className="divide-y divide-surface-hover">
                            {isLoading ? (
                                <div className="p-5 space-y-3">
                                    {[...Array(5)].map((_, index) => (
                                        <div key={index} className="h-16 rounded-xl bg-surface-hover animate-pulse" />
                                    ))}
                                </div>
                            ) : analytics.productInsights.topProducts.length === 0 ? (
                                <div className="p-10 text-center text-sm text-gray-500">لسه مفيش طلبات كفاية علشان نرتب المنتجات.</div>
                            ) : (
                                analytics.productInsights.topProducts.map((product, index) => (
                                    <div key={product.id} className="flex items-center gap-4 px-5 py-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.quantity} قطعة مطلوبة</p>
                                        </div>
                                        <Link href="/admin/products" className="text-xs font-bold text-primary hover:text-primary/80">
                                            افتح المنتج
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-surface-hover bg-surface shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-surface-hover p-5">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-sky-400" />
                                <h2 className="text-sm font-bold text-foreground">أداء الأقسام بالتفصيل</h2>
                            </div>
                            <div className="text-xs text-gray-500">
                                متوسط قيمة الطلب المكتمل: {isLoading ? '...' : currency(analytics.summary.averageOrderValue)}
                            </div>
                        </div>

                        <div className="space-y-3 p-5">
                            {isLoading ? (
                                [...Array(4)].map((_, index) => (
                                    <div key={index} className="h-16 rounded-xl bg-surface-hover animate-pulse" />
                                ))
                            ) : analytics.categoryInsights.rows.length === 0 ? (
                                <div className="rounded-xl bg-background p-4 text-center text-sm text-gray-500">
                                    لسه مفيش طلبات كفاية علشان نقيم الأقسام.
                                </div>
                            ) : (
                                analytics.categoryInsights.rows.slice(0, 8).map((category, index) => (
                                    <div key={category.id} className="rounded-xl bg-background p-4">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/admin/analytics/categories/${category.id}?range=${windowDays}`}
                                                    className="truncate text-sm font-bold text-foreground transition-colors hover:text-primary"
                                                >
                                                    {category.name}
                                                </Link>
                                                <p className="text-xs text-gray-500">{category.quantity} قطعة في {category.ordersCount} طلب</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full bg-surface-hover px-2.5 py-1 text-[11px] font-bold text-gray-300">
                                                    {category.share}% من الطلبات
                                                </span>
                                                {index === 0 && (
                                                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                                                        الأعلى
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-l from-primary to-emerald-400"
                                                style={{ width: `${Math.max(category.share, category.quantity > 0 ? 10 : 2)}%` }}
                                            />
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
                                            <span>دخل تقريبي من منتجات القسم</span>
                                            <span className="font-bold text-foreground">{currency(category.revenue)}</span>
                                        </div>
                                        <div className="mt-3">
                                            <Link
                                                href={`/admin/analytics/categories/${category.id}?range=${windowDays}`}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80"
                                            >
                                                افتح تفاصيل القسم <ArrowLeft className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <h2 className="text-sm font-bold text-foreground">إيه محتاج يتصلح؟</h2>
                        </div>

                        <div className="space-y-3">
                            {fixes.map((item) => (
                                <Link key={item.title} href={item.href} className={`block rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${item.tone}`}>
                                    <p className="text-sm font-black">{item.title}</p>
                                    <p className="mt-2 text-xs opacity-80">{item.body}</p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-bold text-foreground">خلاصة سريعة</h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">إجمالي الطلبات المتتابعة</span>
                                <span className="text-lg font-black text-foreground">{analytics.summary.totalTrackedOrders.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">طلبات مكتملة</span>
                                <span className="text-lg font-black text-emerald-400">{analytics.summary.deliveredOrders.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">طلبات محتاجة تعيين مندوب</span>
                                <span className="text-lg font-black text-amber-400">{overview.orderHealth.needsAssignment}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-background px-3 py-3">
                                <span className="text-sm text-gray-500">طلبات لسه بندور عليها</span>
                                <span className="text-lg font-black text-violet-400">{overview.orderHealth.searchingRequests}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <ShoppingCart className="w-4 h-4" />
                            <h2 className="text-sm font-black">تحرك سريع</h2>
                        </div>
                        <p className="text-sm text-gray-200">
                            لو عاوز تراجع الطلبات اللي مأثرة على الشغل بسرعة، افتح مركز العمليات أو راجع قسم الطلبات اللي بندور عليها.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <Link href="/admin/operations" className="inline-flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-xs font-bold text-foreground transition-colors hover:text-primary">
                                مركز العمليات <ArrowLeft className="w-3.5 h-3.5" />
                            </Link>
                            <Link href="/admin/orders/search-requests" className="inline-flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-xs font-bold text-foreground transition-colors hover:text-primary">
                                الطلبات اللي بندور عليها <ArrowLeft className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-2xl border border-surface-hover bg-surface px-5 py-4 text-sm font-bold text-foreground shadow-xl">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        بنجمع التحليلات دلوقتي...
                    </div>
                </div>
            )}
        </div>
    );
}
