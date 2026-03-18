"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { RequestAttachmentsGallery } from '@/components/orders/request-attachments-gallery';
import { supabase } from '@/lib/supabase';
import { hasPermission } from '@/lib/permissions';
import {
    fetchAdminOrders,
    getAdminOrderKind,
    isCustomerSelfCancelledGraceOrder,
    isPricedSearchRequestOrder,
    isSearchRequestOrder,
    isSearchingRequestOrder,
    markAdminSearchRequestUnavailable,
    saveAdminTextOrderQuote,
} from '@/services/adminService';

type SearchStateFilter = 'all' | 'searching' | 'priced';

function stateMeta(state: SearchStateFilter) {
    switch (state) {
        case 'searching':
            return { label: 'لسه بندور عليه', tone: 'text-violet-400 bg-violet-400/10 border-violet-400/20' };
        case 'priced':
            return { label: 'لقيناه ومستنيين رد العميل', tone: 'text-sky-400 bg-sky-400/10 border-sky-400/20' };
        default:
            return { label: 'كل طلبات البحث', tone: 'text-primary bg-primary/10 border-primary/20' };
    }
}

function searchRequestState(order: any): SearchStateFilter {
    if (isSearchingRequestOrder(order)) return 'searching';
    if (isPricedSearchRequestOrder(order)) return 'priced';
    return 'all';
}

function customerName(order: any) {
    return order?.users?.full_name || order?.users?.email || order?.shipping_address?.recipient || 'عميل غير معروف';
}

function categoryName(order: any) {
    return order?.shipping_address?.custom_request_category_name || 'قسم غير محدد';
}

function orderKindMeta(order: any) {
    switch (getAdminOrderKind(order)) {
        case 'searching_request':
            return { label: 'بندور عليه', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' };
        case 'priced_request':
            return { label: 'لقيناه ومستنيين رد', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' };
        default:
            return { label: 'طلب عادي', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    }
}

export default function AdminSearchRequestsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile, isLoading: authLoading } = useAuth();
    const canViewOrders = hasPermission(profile, 'view_orders');
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stateFilter, setStateFilter] = useState<SearchStateFilter>('all');
    const [quotedInputs, setQuotedInputs] = useState<Record<string, number>>({});
    const [unavailableMessages, setUnavailableMessages] = useState<Record<string, string>>({});
    const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

    const loadOrders = async () => {
        setIsLoading(true);
        const data = await fetchAdminOrders();
        setOrders(data.filter((order) => isSearchRequestOrder(order)));
        setIsLoading(false);
    };

    useEffect(() => {
        if (authLoading) return;
        if (!canViewOrders) {
            router.replace('/admin?error=forbidden');
            return;
        }
        loadOrders();
    }, [authLoading, canViewOrders, router]);

    useEffect(() => {
        const requestedState = searchParams.get('state');
        if (requestedState === 'searching' || requestedState === 'priced' || requestedState === 'all') {
            setStateFilter(requestedState);
        }
    }, [searchParams]);

    useEffect(() => {
        const channel = supabase
            .channel('admin-search-requests-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    const nextOrder = payload.new;
                    if (isSearchRequestOrder(nextOrder)) {
                        setOrders((prev) => [nextOrder, ...prev.filter((order) => order.id !== nextOrder.id)]);
                    }
                    return;
                }

                if (payload.eventType === 'UPDATE') {
                    const nextOrder = payload.new;
                    if (isCustomerSelfCancelledGraceOrder(nextOrder) || !isSearchRequestOrder(nextOrder)) {
                        setOrders((prev) => prev.filter((order) => order.id !== nextOrder.id));
                        return;
                    }

                    setOrders((prev) => prev.map((order) => (
                        order.id === nextOrder.id
                            ? { ...order, ...nextOrder, shipping_address: nextOrder.shipping_address ?? order.shipping_address }
                            : order
                    )));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const searchingOrders = useMemo(
        () => orders.filter((order) => isSearchingRequestOrder(order)),
        [orders]
    );
    const pricedOrders = useMemo(
        () => orders.filter((order) => isPricedSearchRequestOrder(order)),
        [orders]
    );
    const visibleOrders = useMemo(() => {
        if (stateFilter === 'searching') return searchingOrders;
        if (stateFilter === 'priced') return pricedOrders;
        return orders;
    }, [orders, pricedOrders, searchingOrders, stateFilter]);

    useEffect(() => {
        setQuotedInputs((prev) => {
            const next = { ...prev };
            for (const order of orders) {
                if (next[order.id] === undefined) {
                    next[order.id] = Number(order?.shipping_address?.quoted_products_total || order?.shipping_address?.subtotal_amount || 0);
                }
            }
            return next;
        });
        setUnavailableMessages((prev) => {
            const next = { ...prev };
            for (const order of orders) {
                if (next[order.id] === undefined) {
                    next[order.id] = 'للأسف مش عارفين نجيب طلبك لحد دلوقتي، ولو لقيناه في أي وقت بعد كده هنرجع نبعتلك على طول.';
                }
            }
            return next;
        });
    }, [orders]);

    const handleSendPrice = async (orderId: string) => {
        const productsSubtotal = Number(quotedInputs[orderId] || 0);
        if (productsSubtotal < 0) {
            toast.error('السعر لازم يكون رقم صحيح');
            return;
        }

        setBusyOrderId(orderId);
        try {
            const data = await saveAdminTextOrderQuote(orderId, productsSubtotal);
            setOrders((prev) => prev.map((order) => order.id === orderId ? {
                ...order,
                total_amount: data.total_amount,
                shipping_address: data.shipping_address,
            } : order));
            toast.success('اتبعت للعميل رسالة إننا لقينا طلبه وسعره جاهز');
        } catch (error: any) {
            toast.error(error.message || 'تعذر إرسال السعر');
        } finally {
            setBusyOrderId(null);
        }
    };

    const handleMarkUnavailable = async (orderId: string) => {
        setBusyOrderId(orderId);
        try {
            await markAdminSearchRequestUnavailable(orderId, unavailableMessages[orderId]);
            setOrders((prev) => prev.filter((order) => order.id !== orderId));
            toast.success('اتبعت للعميل رسالة إننا لسه مش قادرين نوفر الطلب واتقفل الطلب عنده');
        } catch (error: any) {
            toast.error(error.message || 'تعذر إرسال رسالة التعذر');
        } finally {
            setBusyOrderId(null);
        }
    };

    const stateInfo = stateMeta(stateFilter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-black text-violet-400">قسم مخصص داخل الطلبات</p>
                    <h1 className="mt-1 text-2xl font-heading font-black text-foreground">طلبات بندور عليها</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        من هنا تتابع الطلبات اللي العميل كتبها كنص، وتبعت له السعر، وتستقبل منه موافقة أو رفض في نفس المكان.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/orders" className="rounded-2xl border border-surface-hover bg-surface px-4 py-2.5 text-sm font-bold text-gray-500 transition-colors hover:text-foreground hover:border-primary/20">
                        ارجع لكل الطلبات
                    </Link>
                    <Link href="/admin" className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-400 transition-colors hover:bg-violet-500/15">
                        غرفة القيادة
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <button
                    onClick={() => setStateFilter('all')}
                    className={`rounded-2xl border p-4 text-right transition-all ${stateFilter === 'all' ? 'border-primary/20 bg-primary/10' : 'border-surface-hover bg-surface hover:border-primary/20'}`}
                >
                    <p className="text-xs font-black text-gray-500">كل طلبات البحث</p>
                    <p className="mt-2 text-3xl font-black text-foreground">{orders.length}</p>
                    <p className="mt-2 text-xs text-gray-500">كل الطلبات اللي مازالت في مرحلة البحث أو بانتظار رد العميل</p>
                </button>
                <button
                    onClick={() => setStateFilter('searching')}
                    className={`rounded-2xl border p-4 text-right transition-all ${stateFilter === 'searching' ? 'border-violet-500/20 bg-violet-500/10' : 'border-surface-hover bg-surface hover:border-violet-500/20'}`}
                >
                    <p className="text-xs font-black text-violet-400">لسه بندور عليها</p>
                    <p className="mt-2 text-3xl font-black text-foreground">{searchingOrders.length}</p>
                    <p className="mt-2 text-xs text-gray-500">طلبات لسه محتاجة تدور لها على المنتج وتحدد السعر</p>
                </button>
                <button
                    onClick={() => setStateFilter('priced')}
                    className={`rounded-2xl border p-4 text-right transition-all ${stateFilter === 'priced' ? 'border-sky-500/20 bg-sky-500/10' : 'border-surface-hover bg-surface hover:border-sky-500/20'}`}
                >
                    <p className="text-xs font-black text-sky-400">لقيناه ومستنيين رد العميل</p>
                    <p className="mt-2 text-3xl font-black text-foreground">{pricedOrders.length}</p>
                    <p className="mt-2 text-xs text-gray-500">العميل استلم الإشعار بالسعر، ولسه مستنيين موافقته أو رفضه</p>
                </button>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${stateInfo.tone}`}>
                {stateInfo.label}
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="h-48 animate-pulse rounded-2xl border border-surface-hover bg-surface" />
                    ))}
                </div>
            ) : visibleOrders.length === 0 ? (
                <div className="rounded-3xl border border-surface-hover bg-surface p-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-hover text-gray-500">
                        <Search className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-xl font-black text-foreground">مفيش طلبات في الحالة دي دلوقتي</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        أول ما عميل يطلب منتج مش موجود، أو توافق له تسعيرة ونستنى رده، هتلاقيه ظاهر هنا فورًا.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {visibleOrders.map((order) => {
                        const shipping = order.shipping_address || {};
                        const kind = orderKindMeta(order);
                        const textRequest = String(shipping.custom_request_text || '').trim();
                        const imageUrls = Array.isArray(shipping.custom_request_image_urls) ? shipping.custom_request_image_urls : [];
                        const quotedFinalTotal = Number(shipping.quoted_final_total || order.total_amount || 0);
                        const quotedProductsTotal = Number(shipping.quoted_products_total || shipping.subtotal_amount || 0);

                        return (
                            <div key={order.id} className="rounded-3xl border border-surface-hover bg-surface p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-gray-500">رقم الطلب</p>
                                        <p className="mt-1 text-lg font-black text-foreground">#{order.id.slice(-6).toUpperCase()}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {customerName(order)} • {categoryName(order)}
                                        </p>
                                    </div>
                                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${kind.color}`}>
                                        {kind.label}
                                    </span>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-background px-4 py-3">
                                        <p className="text-[11px] font-bold text-gray-500">اتبعت إمتى</p>
                                        <p className="mt-1 text-sm font-black text-foreground">
                                            {new Date(order.created_at).toLocaleString('ar-EG')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-background px-4 py-3">
                                        <p className="text-[11px] font-bold text-gray-500">رد العميل</p>
                                        <p className="mt-1 text-sm font-black text-foreground">
                                            {shipping.customer_quote_response === 'approve'
                                                ? 'وافق'
                                                : shipping.customer_quote_response === 'reject'
                                                    ? 'رفض'
                                                    : 'لسه مستنيين الرد'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                    <p className="text-xs font-black text-primary/80">الطلب اللي العميل كتبه</p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
                                        {textRequest || 'العميل بعت صور فقط من غير نص.'}
                                    </p>
                                    {imageUrls.length > 0 && (
                                        <div className="mt-4">
                                            <RequestAttachmentsGallery
                                                imageUrls={imageUrls}
                                                title="الصور المرفقة"
                                                hint="مرفقات العميل اللي هتراجعها قبل ما تسعّر الطلب."
                                            />
                                        </div>
                                    )}
                                </div>

                                {isSearchingRequestOrder(order) ? (
                                    <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                                        <div className="flex items-center gap-2 text-violet-400">
                                            <Clock className="h-4 w-4" />
                                            <p className="text-sm font-black">لسه بندور على الطلب ده</p>
                                        </div>
                                        <p className="mt-2 text-sm leading-7 text-gray-500">
                                            أول ما تلاقي المنتج وتحدد سعره، ابعت التسعيرة من تفاصيل الطلب. العميل هيوصله إشعار، وبعدها يا إما يوافق أو يرفض.
                                        </p>
                                        <div className="mt-4 space-y-3">
                                            <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
                                                <div className="rounded-2xl bg-background px-4 py-3">
                                                    <p className="text-[11px] font-bold text-gray-500">الرسالة اللي هتتبعت للعميل لو ملقيناش الطلب</p>
                                                    <textarea
                                                        value={unavailableMessages[order.id] || ''}
                                                        onChange={(event) => setUnavailableMessages((prev) => ({ ...prev, [order.id]: event.target.value }))}
                                                        rows={3}
                                                        className="mt-2 w-full resize-none rounded-xl border border-surface-hover bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-violet-500/40"
                                                    />
                                                </div>
                                                <div className="rounded-2xl bg-background px-4 py-3">
                                                    <p className="text-[11px] font-bold text-gray-500">سعر المنتجات</p>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={quotedInputs[order.id] ?? 0}
                                                        onChange={(event) => setQuotedInputs((prev) => ({ ...prev, [order.id]: Number(event.target.value || 0) }))}
                                                        className="mt-2 w-full rounded-xl border border-surface-hover bg-surface px-3 py-3 text-sm font-black text-foreground outline-none focus:border-violet-500/40"
                                                    />
                                                    <p className="mt-2 text-[11px] text-gray-500">
                                                        هيتبعت للعميل إن إجمالي طلبه <span className="font-black text-foreground">{(Number(quotedInputs[order.id] || 0) + 20).toLocaleString()} ج.م</span> شامل الشحن
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => handleSendPrice(order.id)}
                                                    disabled={busyOrderId === order.id}
                                                    className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                                                >
                                                    {busyOrderId === order.id ? 'جاري الإرسال...' : 'ابعت إشعار: لقينالك طلبك وسعره كذا'}
                                                </button>
                                                <button
                                                    onClick={() => handleMarkUnavailable(order.id)}
                                                    disabled={busyOrderId === order.id}
                                                    className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-black text-rose-500 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50"
                                                >
                                                    {busyOrderId === order.id ? 'جاري الإرسال...' : 'للأسف مش عارفين نجيبه دلوقتي'}
                                                </button>
                                                <Link href={`/admin/orders?id=${order.id}`} className="rounded-2xl border border-surface-hover bg-white px-4 py-2.5 text-sm font-black text-gray-600 transition-colors hover:border-primary/20 hover:text-primary">
                                                    افتح تفاصيل الطلب
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
                                        <div className="flex items-center gap-2 text-sky-500">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <p className="text-sm font-black">لقيناه وبعتنا السعر للعميل</p>
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl bg-background px-4 py-3">
                                                <p className="text-[11px] font-bold text-gray-500">قيمة المنتجات</p>
                                                <p className="mt-1 text-lg font-black text-foreground">{quotedProductsTotal.toLocaleString()} ج.م</p>
                                            </div>
                                            <div className="rounded-2xl bg-background px-4 py-3">
                                                <p className="text-[11px] font-bold text-gray-500">السعر النهائي</p>
                                                <p className="mt-1 text-lg font-black text-sky-500">{quotedFinalTotal.toLocaleString()} ج.م</p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm leading-7 text-gray-500">
                                            العميل وصله الإشعار إننا لقينا طلبه وسعرناه. أول ما يوافق أو يرفض هيوصلك إشعار فوق في جرس الإدارة ويتحدث الطلب هنا تلقائيًا.
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Link href={`/admin/orders?id=${order.id}`} className="rounded-2xl border border-sky-500/20 bg-white px-4 py-2.5 text-sm font-black text-sky-500 transition-colors hover:bg-sky-500 hover:text-white">
                                                افتح الطلب وتابع الرد
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
