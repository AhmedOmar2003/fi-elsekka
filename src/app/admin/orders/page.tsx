"use client"

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cancelAdminOrder, fetchAdminOrders, fetchOrderDetails, getAdminOrderKind, isCustomerSelfCancelledGraceOrder, isPricedSearchRequestOrder, isSearchRequestOrder, isSearchingRequestOrder, reopenCancelledOrderAfterCustomerRequest, saveAdminOrderDeliveryPlan, saveAdminTextOrderQuote, updateOrderStatus, updateOrderDriver } from '@/services/adminService';
import { ShoppingCart, ChevronDown, X, Package, Download, Filter, Bike, Clock, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { toast } from 'sonner';
import { getOrderEconomics } from '@/lib/order-economics';
import { RequestAttachmentsGallery } from '@/components/orders/request-attachments-gallery';
import { SearchRequestProgress } from '@/components/orders/search-request-progress';
import { formatRestaurantEtaWindow, getRestaurantOrderSnapshot } from '@/lib/restaurant-order';

const STATUS_FILTERS = [
    { value: 'pending', label: 'في الانتظار', color: 'text-amber-400  bg-amber-400/10  border-amber-400/20' },
    { value: 'processing', label: 'قيد التجهيز', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
    { value: 'shipped', label: 'تم الشحن', color: 'text-blue-400   bg-blue-400/10   border-blue-400/20' },
    { value: 'delivered', label: 'تم التوصيل', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { value: 'cancelled', label: 'ملغي', color: 'text-rose-400   bg-rose-400/10   border-rose-400/20' },
];

const STATUS_UPDATE_OPTIONS = STATUS_FILTERS.filter((status) => status.value !== 'cancelled');
const KIND_FILTERS = [
    { value: 'all', label: 'الكل' },
    { value: 'standard', label: 'طلبات عادية' },
    { value: 'searching_request', label: 'بندور عليها' },
    { value: 'priced_request', label: 'لقيناها ومستنية رد' },
] as const;

type OrderKindFilter = (typeof KIND_FILTERS)[number]['value'];

function statusMeta(val: string) {
    return STATUS_FILTERS.find(s => s.value === val) || { label: val, color: 'text-gray-500 bg-surface-hover border-surface-hover' };
}

function orderKindMeta(order: any) {
    switch (getAdminOrderKind(order)) {
        case 'searching_request':
            return { label: 'بندور عليه', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' };
        case 'priced_request':
            return { label: 'لقيناه ومستني رد', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' };
        default:
            return { label: 'طلب عادي', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
    }
}

function formatWindow(days: number, hours: number) {
    if (days > 0 && hours > 0) return `${days} يوم و${hours} ساعة`;
    if (days > 0) return `${days} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    return 'غير محدد';
}

function exportToCSV(orders: any[], statusFilter: string) {
    const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
    const statusLabel = statusFilter === 'all' ? 'الكل' : (STATUS_FILTERS.find(s => s.value === statusFilter)?.label || statusFilter);

    const headers = ['رقم الطلب', 'اسم العميل', 'البريد الإلكتروني', 'التليفون', 'المدينة', 'المنطقة', 'العنوان', 'الإجمالي (ج.م)', 'الحالة', 'تاريخ الطلب'];

    const rows = filtered.map(order => [
        order.id,
        order.users?.full_name || '—',
        order.users?.email || '—',
        order.shipping_address?.phone || order.users?.phone || '—',
        order.shipping_address?.city || '—',
        order.shipping_address?.area || '—',
        order.shipping_address?.street || order.shipping_address?.address || '—',
        order.total_amount || 0,
        statusMeta(order.status).label,
        new Date(order.created_at).toLocaleString('ar-EG'),
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    // Add BOM for Arabic characters in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${statusFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile, isLoading: authLoading } = useAuth();
    const canViewOrders = hasPermission(profile, 'view_orders');
    const canUpdateStatus = hasPermission(profile, 'update_order_status');
    const canAssignDriver = hasPermission(profile, 'assign_driver');
    const canViewDrivers = hasPermission(profile, 'view_drivers') || canAssignDriver;

    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterKind, setFilterKind] = useState<OrderKindFilter>('all');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    // Delivery estimation UI state
    const [estimatedTime, setEstimatedTime] = useState('');
    const [isSavingTime, setIsSavingTime] = useState(false);
    const [etaHours, setEtaHours] = useState(0);
    const [etaDays, setEtaDays] = useState(0);
    const [driverNote, setDriverNote] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [cancellationMessage, setCancellationMessage] = useState('لو كنت ما زلت تريد هذا الطلب، ادينا فرصة نجهزه على أكمل وجه، ولو أصبح جاهزًا هنرسل لك إشعارًا جديدًا بموعد الوصول المتوقع.');
    const [isCancellingOrder, setIsCancellingOrder] = useState(false);
    const [isReopeningOrder, setIsReopeningOrder] = useState(false);
    const [quotedSubtotalInput, setQuotedSubtotalInput] = useState(0);
    const [isSavingTextQuote, setIsSavingTextQuote] = useState(false);

    // Driver Assignment UI state
    const [drivers, setDrivers] = useState<any[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [isAssigningDriver, setIsAssigningDriver] = useState(false);

    const load = async () => {
        setIsLoading(true);
        const data = await fetchAdminOrders();
        setOrders(data);
        
        // Fetch drivers only if the viewer has driver-related permissions
        if (canViewDrivers) {
            const { data: driversData } = await supabase.from('users').select('*').eq('role', 'driver');
            if (driversData) setDrivers(driversData);
        }
        
        setIsLoading(false);
    };

    useEffect(() => { 
        if (authLoading) return;
        if (!canViewOrders) {
            router.replace('/admin?error=forbidden');
            return;
        }
        load(); 
        
        // Listen for real-time driver acceptance/rejection and delivery updates
        const channel = supabase.channel('admin-notifications')
            .on('broadcast', { event: 'driver-response' }, (payload: any) => {
                const { orderId, status, driverName } = payload.payload;
                if (status === 'accepted') {
                   import('sonner').then(({ toast }) => toast.success(`المندوب ${driverName} استلم الطلب #${orderId.slice(-6).toUpperCase()} 🛵`));
                } else {
                   import('sonner').then(({ toast }) => toast.error(`المندوب ${driverName} اعتذر عن الطلب #${orderId.slice(-6).toUpperCase()} ❌`));
                }
                load(); // Reload orders to show updated status
            })
            .on('broadcast', { event: 'order-delivered' }, (payload: any) => {
                const { orderId, driverName } = payload.payload;
                import('sonner').then(({ toast }) => toast.success(`تم توصيل الطلب #${orderId.slice(-6).toUpperCase()} بنجاح بواسطة ${driverName} 📦✅`));
                load(); // Reload orders to show 'delivered' status dynamically
            })
            .on('broadcast', { event: 'restaurant-eta-submitted' }, (payload: any) => {
                const { orderId, restaurantName, etaText } = payload.payload || {};
                import('sonner').then(({ toast }) => toast.success(`المطعم ${restaurantName || ''} حدّد وقتًا جديدًا للطلب #${String(orderId || '').slice(-6).toUpperCase()}: ${etaText || 'راجع الطلب'}`));
                load();
            })
            .on('broadcast', { event: 'driver-availability-changed' }, (payload: any) => {
                const { driverName, isAvailable } = payload.payload;
                if (isAvailable) {
                    import('sonner').then(({ toast }) => toast.success(`المندوب ${driverName} جاهز للطلبات دلوقتي 🛵`));
                } else {
                    import('sonner').then(({ toast }) => toast.info(`المندوب ${driverName} بيريّح شوية 😴`, { icon: '☕' }));
                }
                // Reload drivers list to fetch the updated is_available flag
                supabase.from('users').select('*').eq('role', 'driver').then(({ data }) => {
                    if (data) setDrivers(data);
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: any) => {
                const updatedOrder = payload.new;
                const shouldHideFromAdmin = isCustomerSelfCancelledGraceOrder(updatedOrder);

                setOrders(prev => {
                    if (shouldHideFromAdmin) {
                        return prev.filter(order => order.id !== updatedOrder.id);
                    }

                    return prev.map(order =>
                        order.id === updatedOrder.id
                            ? {
                                ...order,
                                status: updatedOrder.status,
                                total_amount: updatedOrder.total_amount,
                                shipping_address: updatedOrder.shipping_address ?? order.shipping_address,
                            }
                            : order
                    );
                });
                setSelectedOrder((prev: any) => {
                    if (prev?.id !== updatedOrder.id) return prev;
                    if (shouldHideFromAdmin) return null;
                    return {
                        ...prev,
                        status: updatedOrder.status,
                        total_amount: updatedOrder.total_amount,
                        shipping_address: updatedOrder.shipping_address ?? prev.shipping_address,
                    };
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [authLoading, canViewOrders, canViewDrivers, router]);

    useEffect(() => {
        const requestedKind = searchParams.get('kind');
        if (requestedKind === 'standard' || requestedKind === 'searching_request' || requestedKind === 'priced_request' || requestedKind === 'all') {
            setFilterKind(requestedKind);
        }
    }, [searchParams]);

    const handleViewOrder = async (order: any) => {
        setSelectedOrder(order);
        setEstimatedTime(order.shipping_address?.estimated_delivery || '');
        setEtaHours(Number(order.shipping_address?.estimated_delivery_hours || 0));
        setEtaDays(Number(order.shipping_address?.estimated_delivery_days || 0));
        setDriverNote(order.shipping_address?.driver_delivery_note || '');
        setCancellationReason(order.shipping_address?.cancellation_reason || '');
        setCancellationMessage(
            order.shipping_address?.cancellation_message ||
            'لو كنت ما زلت تريد هذا الطلب، ادينا فرصة نجهزه على أكمل وجه، ولو أصبح جاهزًا هنرسل لك إشعارًا جديدًا بموعد الوصول المتوقع.'
        );
        setQuotedSubtotalInput(Number(order.shipping_address?.quoted_products_total || order.shipping_address?.subtotal_amount || 0));
        setSelectedDriverId(order.shipping_address?.driver?.id || '');
        // Use already-fetched items embedded in the order object (from the enriched query)
        setOrderItems(order.order_items || []);
        // If for some reason items are empty (fallback), try loading from separate call
        if (!order.order_items?.length) {
            setLoadingDetail(true);
            const items = await fetchOrderDetails(order.id);
            setOrderItems(items);
            setLoadingDetail(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (!canUpdateStatus) return;
        if (newStatus === 'cancelled') {
            toast.error('استخدم قسم الإلغاء داخل تفاصيل الطلب واكتب سبب الإلغاء أولاً');
            return;
        }
        await updateOrderStatus(orderId, newStatus);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
            setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        }
        // Reset filter to 'all' so the updated order doesn't disappear from view
        setFilterStatus('all');
    };

    const handleSaveEstimation = async () => {
        if (!selectedOrder) return;
        if (!estimatedTime.trim()) {
            toast.error('اكتب نصًا واضحًا للعميل عن موعد التوصيل');
            return;
        }
        setIsSavingTime(true);

        try {
            const data = await saveAdminOrderDeliveryPlan(selectedOrder.id, {
                estimatedText: estimatedTime,
                etaHours,
                etaDays,
                driverNote,
            });

            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
                ...o,
                shipping_address: data.shipping_address,
            } : o));
            setSelectedOrder((prev: any) => ({
                ...prev,
                shipping_address: data.shipping_address,
            }));
            toast.success('تم حفظ موعد التوصيل وإشعار العميل به');
        } catch (error: any) {
            toast.error(error.message || 'فشل حفظ خطة التوصيل');
        } finally {
            setIsSavingTime(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder) return;
        if (!cancellationReason.trim()) {
            toast.error('اكتب سبب الإلغاء أولًا');
            return;
        }

        setIsCancellingOrder(true);
        try {
            const data = await cancelAdminOrder(selectedOrder.id, cancellationReason, cancellationMessage);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
                ...o,
                status: 'cancelled',
                shipping_address: data.shipping_address,
            } : o));
            setSelectedOrder((prev: any) => ({
                ...prev,
                status: 'cancelled',
                shipping_address: data.shipping_address,
            }));
            toast.success('تم إلغاء الطلب وإرسال السبب للعميل');
        } catch (error: any) {
            toast.error(error.message || 'فشل إلغاء الطلب');
        } finally {
            setIsCancellingOrder(false);
        }
    };

    const handleReopenOrder = async () => {
        if (!selectedOrder) return;

        setIsReopeningOrder(true);
        try {
            const data = await reopenCancelledOrderAfterCustomerRequest(selectedOrder.id);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
                ...o,
                status: 'processing',
                shipping_address: data.shipping_address,
            } : o));
            setSelectedOrder((prev: any) => ({
                ...prev,
                status: 'processing',
                shipping_address: data.shipping_address,
            }));
            toast.success('تمت إعادة فتح الطلب وإبلاغ العميل أن الطلب عاد لقيد التجهيز');
        } catch (error: any) {
            toast.error(error.message || 'فشل إعادة فتح الطلب');
        } finally {
            setIsReopeningOrder(false);
        }
    };

    const handleSaveTextQuote = async () => {
        if (!selectedOrder) return;
        if (quotedSubtotalInput < 0) {
            toast.error('قيمة المنتجات لا يمكن أن تكون سالبة');
            return;
        }

        setIsSavingTextQuote(true);
        try {
            const data = await saveAdminTextOrderQuote(selectedOrder.id, quotedSubtotalInput);
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
                ...o,
                total_amount: data.total_amount,
                shipping_address: data.shipping_address,
            } : o));
            setSelectedOrder((prev: any) => ({
                ...prev,
                total_amount: data.total_amount,
                shipping_address: data.shipping_address,
            }));
            toast.success('تم إرسال التسعيرة للعميل بنجاح');
        } catch (error: any) {
            toast.error(error.message || 'فشل إرسال التسعيرة');
        } finally {
            setIsSavingTextQuote(false);
        }
    };

    const handleAssignDriver = async (driverId: string) => {
        if (!canAssignDriver) return;
        if (!selectedOrder) return;
        setIsAssigningDriver(true);
        setSelectedDriverId(driverId);
        const restaurantOrder = getRestaurantOrderSnapshot(selectedOrder.shipping_address);
        
        const driverObj = driverId ? drivers.find(d => d.id === driverId) : null;
        const driverData = driverObj ? { 
            id: driverObj.id, 
            name: driverObj.full_name, 
            phone: driverObj.phone || '',
            acceptance_status: 'pending'
        } : null;

        const { error } = await updateOrderDriver(selectedOrder.id, driverData);
        setIsAssigningDriver(false);
        
        if (!error) {
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { 
                ...o, 
                shipping_address: { ...o.shipping_address, driver: driverData } 
            } : o));
            setSelectedOrder((prev: any) => ({
                ...prev,
                shipping_address: { ...prev.shipping_address, driver: driverData }
            }));

            // Notify the driver via Web Push
            if (driverId) {
                try {
                    fetch('/api/admin/notify-driver', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            driverId,
                            title: restaurantOrder.isRestaurantOrder
                                ? `🛵 طلب جديد من مطعم ${restaurantOrder.restaurantName || ''}`
                                : '🛵 طلب جديد بانتظارك!',
                            body: restaurantOrder.isRestaurantOrder
                                ? `رقم الطلب: #${selectedOrder.id.slice(0,6)} — الاستلام من مطعم ${restaurantOrder.restaurantName || 'من في السكة'}`
                                : `رقم الطلب: #${selectedOrder.id.slice(0,6)}`,
                            orderId: selectedOrder.id
                        })
                    }).catch(err => console.error('Failed to notify driver:', err));
                } catch (err) {}
            }
        }
    };

    const orderBuckets = useMemo(() => ({
        standard: orders.filter((order) => !isSearchRequestOrder(order)).length,
        searching_request: orders.filter((order) => isSearchingRequestOrder(order)).length,
        priced_request: orders.filter((order) => isPricedSearchRequestOrder(order)).length,
    }), [orders]);

    const displayedOrders = orders.filter((order) => {
        const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;
        const matchesKind = filterKind === 'all' ? true : getAdminOrderKind(order) === filterKind;
        return matchesStatus && matchesKind;
    });
    const selectedOrderEconomics = selectedOrder ? getOrderEconomics(selectedOrder) : null;
    const selectedOrderKind = selectedOrder ? orderKindMeta(selectedOrder) : null;
    const selectedOrderIsTextRequest = selectedOrder?.shipping_address?.request_mode === 'custom_category_text';
    const selectedOrderTextRequest = selectedOrder?.shipping_address?.custom_request_text;
    const selectedOrderTextCategory = selectedOrder?.shipping_address?.custom_request_category_name;
    const selectedOrderTextRequestImages = Array.isArray(selectedOrder?.shipping_address?.custom_request_image_urls)
        ? selectedOrder.shipping_address.custom_request_image_urls
        : [];
    const selectedOrderPricingPending = selectedOrder?.shipping_address?.pricing_pending === true;
    const selectedOrderQuotedProductsTotal = Number(selectedOrder?.shipping_address?.quoted_products_total || 0);
    const selectedOrderQuotedFinalTotal = Number(selectedOrder?.shipping_address?.quoted_final_total || selectedOrder?.total_amount || 0);
    const selectedOrderPricingUpdatedAt = selectedOrder?.shipping_address?.pricing_updated_at;
    const selectedOrderPricingDriverName = selectedOrder?.shipping_address?.pricing_updated_by_admin_name || selectedOrder?.shipping_address?.pricing_updated_by_driver_name;
    const selectedOrderQuoteResponse = selectedOrder?.shipping_address?.customer_quote_response;
    const selectedOrderQuoteResponseAt = selectedOrder?.shipping_address?.customer_quote_response_at;
    const canAssignSelectedTextOrderDriver = !selectedOrderIsTextRequest || selectedOrderQuoteResponse === 'approve';
    const selectedOrderRestaurant = getRestaurantOrderSnapshot(selectedOrder?.shipping_address);
    const canEditDeliveryPlan = selectedOrder
        ? selectedOrder.shipping_address?.driver?.acceptance_status === 'accepted' || selectedOrderRestaurant.isRestaurantOrder
        : false;

    const useRestaurantEtaSuggestion = () => {
        if (!selectedOrderRestaurant.etaText) return;
        setEstimatedTime(selectedOrderRestaurant.etaText);
        setEtaHours(selectedOrderRestaurant.etaHours);
        setEtaDays(selectedOrderRestaurant.etaDays);
        setDriverNote((prev) => {
            const restaurantPrefix = selectedOrderRestaurant.restaurantName
                ? `الطلب من مطعم ${selectedOrderRestaurant.restaurantName}.`
                : 'الطلب من مطعم.';
            const etaNote = selectedOrderRestaurant.etaNote ? ` ملاحظة المطعم: ${selectedOrderRestaurant.etaNote}` : '';
            return `${restaurantPrefix}${etaNote}`.trim() || prev;
        });
        toast.success('تم تحميل وقت المطعم داخل خطة التوصيل، راجعه واضغط حفظ');
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-heading font-black text-foreground">الطلبات</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{displayedOrders.length} طلب {filterStatus !== 'all' ? `(${statusMeta(filterStatus).label})` : 'إجمالي'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-surface-hover border border-surface-hover rounded-xl p-1">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-surface border border-surface-hover text-foreground shadow-sm' : 'text-gray-500 hover:text-foreground'}`}
                        >الكل</button>
                        {STATUS_FILTERS.map(s => (
                            <button
                                key={s.value}
                                onClick={() => setFilterStatus(s.value)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${filterStatus === s.value ? 'bg-surface border border-surface-hover text-foreground shadow-sm' : 'text-gray-500 hover:text-foreground'}`}
                            >{s.label}</button>
                        ))}
                    </div>

                    {/* Export Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsExportMenuOpen(v => !v)}
                            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-500/20 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            تصدير CSV
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {isExportMenuOpen && (
                            <div className="absolute left-0 top-full mt-1 bg-surface border border-surface-hover rounded-xl overflow-hidden shadow-2xl z-20 min-w-[180px]">
                                <button
                                    onClick={() => { exportToCSV(orders, 'all'); setIsExportMenuOpen(false); }}
                                    className="w-full text-right px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover transition-colors font-bold"
                                >📦 كل الطلبات</button>
                                {STATUS_FILTERS.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => { exportToCSV(orders, s.value); setIsExportMenuOpen(false); }}
                                        className="w-full text-right px-4 py-2.5 text-sm text-gray-400 hover:text-foreground hover:bg-surface-hover transition-colors"
                                    >{s.label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-surface border border-surface-hover rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="border-b border-surface-hover">
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">رقم الطلب</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">العميل</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">التليفون</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 hidden sm:table-cell">التاريخ</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">الإجمالي</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">الحالة</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">تفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-hover">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-10 bg-surface-hover rounded-lg animate-pulse" /></td></tr>
                                ))
                            ) : displayedOrders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-gray-500 py-12">لا توجد طلبات في هذا التصنيف</td></tr>
                            ) : (
                                displayedOrders.map((order) => {
                                    const sm = statusMeta(order.status);
                                    return (
                                        <tr key={order.id} className="hover:bg-surface-hover transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</span>
                                                {order.shipping_address?.is_grace_period === true && (
                                                    <span className="block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 w-fit">⏳ يُمكن إلغاؤه</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-foreground text-xs">{order.users?.full_name || order.users?.email || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                                                {order.shipping_address?.phone || order.users?.phone || '—'}
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-4 py-3 font-black text-primary text-sm">
                                                {(order.total_amount || 0).toLocaleString()} ج.م
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="relative inline-block">
                                                    {order.status === 'cancelled' ? (
                                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sm.color}`}>
                                                            {sm.label}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={order.status}
                                                            onChange={e => handleStatusChange(order.id, e.target.value)}
                                                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border appearance-none cursor-pointer ${sm.color} bg-transparent focus:outline-none`}
                                                        >
                                                            {STATUS_UPDATE_OPTIONS.map(s => (
                                                                <option key={s.value} value={s.value} className="bg-surface text-foreground">{s.label}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleViewOrder(order)}
                                                    className="text-xs text-primary hover:text-primary/80 font-bold"
                                                >
                                                    عرض
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Drawer */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-stretch justify-end">
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-md bg-surface border-r border-surface-hover flex flex-col h-full shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-surface-hover sticky top-0 bg-surface z-10">
                            <div>
                                <h2 className="font-heading font-black text-foreground">تفاصيل الطلب</h2>
                                <p className="text-xs text-gray-500 mt-0.5 font-mono">#{selectedOrder.id.slice(0, 8)}...</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl text-gray-400 hover:text-foreground hover:bg-surface-hover">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5 flex-1">
                            {/* Customer Info */}
                            <div className="bg-surface-hover rounded-xl p-4 space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">معلومات العميل</p>
                                <p className="font-bold text-foreground">{selectedOrder.users?.full_name || 'غير معروف'}</p>
                                <p className="text-xs text-gray-500 font-mono">{selectedOrder.shipping_address?.phone || selectedOrder.users?.phone || 'لا يوجد رقم'}</p>
                                <p className="text-xs text-gray-500">{selectedOrder.users?.email}</p>
                                {selectedOrder.shipping_address?.city && (
                                    <p className="text-xs text-gray-500">
                                        {selectedOrder.shipping_address.city}
                                        {selectedOrder.shipping_address.area ? ` — ${selectedOrder.shipping_address.area}` : ''}
                                        {selectedOrder.shipping_address.street ? ` — ${selectedOrder.shipping_address.street}` : ''}
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="flex gap-3">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-gray-500 mb-2">الحالة الحالية</p>
                                {selectedOrder.status === 'cancelled' ? (
                                    <div className="w-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-bold text-rose-400">
                                        ملغي
                                    </div>
                                ) : (
                                    <select
                                        value={selectedOrder.status}
                                        onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                                        disabled={!canUpdateStatus}
                                        className={`w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 ${!canUpdateStatus ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {STATUS_UPDATE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                )}
                            </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-gray-500 mb-2 whitespace-nowrap overflow-hidden">مندوب التوصيل</p>
                                    <div className="relative">
                                            <select
                                                value={selectedDriverId}
                                                onChange={e => handleAssignDriver(e.target.value)}
                                                disabled={isAssigningDriver || !canAssignDriver || !canAssignSelectedTextOrderDriver}
                                                className={`w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 ${selectedDriverId ? 'text-primary font-bold' : 'text-foreground'} ${(!canAssignDriver || isAssigningDriver || !canAssignSelectedTextOrderDriver) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                            <option value="">بدون مندوب</option>
                                            {drivers.map(d => {
                                                const hasRejected = selectedOrder.shipping_address?.rejected_by?.includes(d.id);
                                                const isDelivering = orders.some(o => 
                                                    ['pending', 'processing', 'shipped'].includes(o.status) && 
                                                    o.shipping_address?.driver?.id === d.id && 
                                                    o.id !== selectedOrder.id // Don't block if they are assigned to THIS order
                                                );
                                                const isResting = d.is_available === false;
                                                const isBusy = isDelivering || isResting;
                                                const isDisabled = hasRejected || isBusy;
                                                
                                                let label = d.full_name || 'بدون اسم';
                                                if (hasRejected) label += ' — ❌ (رفض الطلب)';
                                                else if (isDelivering) label += ' — 🚚 (بيوصل طلب)';
                                                else if (isResting) label += ' — 😴 (مُريح)';

                                                return (
                                                    <option key={d.id} value={d.id} disabled={isDisabled}>
                                                        {label}
                                                    </option>
                                                )
                                            })}
                                        </select>
                                        {isAssigningDriver && (
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    {selectedOrderIsTextRequest && !canAssignSelectedTextOrderDriver && (
                                        <p className="mt-2 text-[11px] text-amber-500">
                                            لا تعيّن مندوبًا لهذا الطلب قبل أن يوافق العميل على التسعيرة أولًا.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery planning */}
                            <div className="rounded-2xl border border-surface-hover bg-background p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500">خطة التوصيل</p>
                                        <p className="text-[11px] text-gray-500">
                                            {selectedOrderRestaurant.isRestaurantOrder
                                                ? 'لو المطعم حدّد موعدًا، تقدر تستخدمه كما هو أو تعدّله قبل ما توصله للعميل والمندوب.'
                                                : 'لا تُحسب المهلة إلا بعد ما يؤكد المندوب استلام الطلب ويكون جاهزًا للتوصيل.'}
                                        </p>
                                    </div>
                                </div>

                                {selectedOrderRestaurant.isRestaurantOrder && (
                                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-3 text-sm text-sky-400 space-y-2">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-black">رد المطعم الحالي</p>
                                                <p className="mt-1 text-xs text-sky-100/80">
                                                    {selectedOrderRestaurant.restaurantName
                                                        ? `المطعم: ${selectedOrderRestaurant.restaurantName}`
                                                        : 'طلب مطعم'}
                                                </p>
                                            </div>
                                            <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${
                                                selectedOrderRestaurant.etaStatus === 'approved'
                                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                                                    : selectedOrderRestaurant.etaStatus === 'submitted'
                                                        ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                                                        : 'border-amber-400/20 bg-amber-400/10 text-amber-400'
                                            }`}>
                                                {selectedOrderRestaurant.etaStatus === 'approved'
                                                    ? 'اعتمدته الإدارة'
                                                    : selectedOrderRestaurant.etaStatus === 'submitted'
                                                        ? 'المطعم رد'
                                                        : 'بانتظار المطعم'}
                                            </span>
                                        </div>

                                        {selectedOrderRestaurant.etaText ? (
                                            <>
                                                <p className="font-black text-white">{selectedOrderRestaurant.etaText}</p>
                                                <p className="text-xs text-sky-100/80">
                                                    المدة: {formatRestaurantEtaWindow(selectedOrderRestaurant.etaDays, selectedOrderRestaurant.etaHours)}
                                                </p>
                                                {selectedOrderRestaurant.etaNote && (
                                                    <p className="text-xs text-sky-100/80">ملاحظة المطعم: {selectedOrderRestaurant.etaNote}</p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={useRestaurantEtaSuggestion}
                                                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-white/15"
                                                >
                                                    استخدم وقت المطعم مباشرة
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-xs text-sky-100/80">
                                                أول ما المطعم يحدد وقت التوصيل، هيظهر لك هنا مباشرة.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {!canEditDeliveryPlan ? (
                                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-xs text-amber-500">
                                        انتظر حتى يؤكد المندوب استلام الطلب. بعدها سيتاح لك تحديد النص + عدد الساعات + عدد الأيام للمحاسبة على التأخير.
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-2">النص الذي يراه العميل</p>
                                            <input
                                                type="text"
                                                placeholder="مثال: طلبك بيتجهز وهيصلك اليوم مساءً"
                                                value={estimatedTime}
                                                onChange={e => setEstimatedTime(e.target.value)}
                                                className="w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1.5">هذا النص يبقى ظاهرًا للعميل لأنه أوضح من مجرد الأرقام.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 mb-2">عدد الأيام</p>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={etaDays}
                                                    onChange={e => setEtaDays(Number(e.target.value || 0))}
                                                    className="w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 mb-2">عدد الساعات</p>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={etaHours}
                                                    onChange={e => setEtaHours(Number(e.target.value || 0))}
                                                    className="w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-2">رسالة للمندوب</p>
                                            <textarea
                                                value={driverNote}
                                                onChange={e => setDriverNote(e.target.value)}
                                                rows={3}
                                                placeholder={selectedOrderRestaurant.isRestaurantOrder ? "مثال: الطلب من مطعم بيتزا بينز، الموعد المتوقع 45 دقيقة" : "مثال: أمامك 4 ساعات للوصول، لو في تأخير بلغ الإدارة فورًا"}
                                                className="w-full resize-none bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                            />
                                        </div>

                                        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-xs text-gray-500">
                                            المهلة المحسوبة حاليًا: <span className="font-bold text-primary">{formatWindow(etaDays, etaHours)}</span>
                                            {selectedOrder.shipping_address?.delivery_deadline_at && (
                                                <span className="block mt-1">
                                                    الموعد الحالي ينتهي في {new Date(selectedOrder.shipping_address.delivery_deadline_at).toLocaleString('ar-EG')}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            id="save-est-btn"
                                            onClick={handleSaveEstimation}
                                            disabled={isSavingTime}
                                            className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                        >
                                            {isSavingTime ? 'جاري الحفظ...' : 'حفظ خطة التوصيل وإشعار العميل'}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Revenue breakdown */}
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-500" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-500">تفصيل التحصيل والإيراد</p>
                                        <p className="text-[11px] text-gray-500">الشحن الآن 20 ج.م: 10 للمنصة و10 للمندوب. أي خصومات أو إعلانات خاصة بالمحل خارج حسبة الموقع.</p>
                                    </div>
                                </div>

                                {selectedOrderEconomics && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-background px-3 py-3">
                                            <p className="text-[11px] text-gray-500">إجمالي العميل</p>
                                            <p className="mt-1 text-lg font-black text-foreground">{selectedOrderEconomics.grossCollected.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="rounded-xl bg-background px-3 py-3">
                                            <p className="text-[11px] text-gray-500">قيمة المنتجات</p>
                                            <p className="mt-1 text-lg font-black text-foreground">{selectedOrderEconomics.subtotalAmount.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="rounded-xl bg-background px-3 py-3">
                                            <p className="text-[11px] text-gray-500">نصيب المنصة</p>
                                            <p className="mt-1 text-lg font-black text-primary">{selectedOrderEconomics.platformRevenue.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="rounded-xl bg-background px-3 py-3">
                                            <p className="text-[11px] text-gray-500">نصيب المندوب</p>
                                            <p className="mt-1 text-lg font-black text-sky-400">{selectedOrderEconomics.driverRevenue.toLocaleString()} ج.م</p>
                                        </div>
                                        <div className="rounded-xl bg-background px-3 py-3">
                                            <p className="text-[11px] text-gray-500">المحل يستلم</p>
                                            <p className="mt-1 text-lg font-black text-amber-500">{selectedOrderEconomics.merchantSettlement.toLocaleString()} ج.م</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cancellation */}
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    <div>
                                        <p className="text-xs font-bold text-rose-400">إلغاء الطلب بسبب واضح</p>
                                        <p className="text-[11px] text-gray-500">لن يتم الإلغاء من هنا إلا بعد كتابة السبب، وسيصل السبب للعميل فورًا.</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">سبب الإلغاء</p>
                                    <textarea
                                        value={cancellationReason}
                                        onChange={e => setCancellationReason(e.target.value)}
                                        rows={3}
                                        placeholder="مثال: المنتج غير متاح حاليًا أو نحتاج وقتًا أطول للتجهيز"
                                        className="w-full resize-none bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-400/50"
                                    />
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-2">رسالة مطمئنة للعميل</p>
                                    <textarea
                                        value={cancellationMessage}
                                        onChange={e => setCancellationMessage(e.target.value)}
                                        rows={3}
                                        className="w-full resize-none bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-rose-400/50"
                                    />
                                </div>

                                {selectedOrder.shipping_address?.cancellation_reason && (
                                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-xs text-rose-400">
                                        <p className="font-bold">السبب الحالي:</p>
                                        <p className="mt-1">{selectedOrder.shipping_address.cancellation_reason}</p>
                                        {selectedOrder.shipping_address?.cancellation_message && (
                                            <p className="mt-2 text-gray-500">{selectedOrder.shipping_address.cancellation_message}</p>
                                        )}
                                    </div>
                                )}

                                {selectedOrder.shipping_address?.customer_cancellation_response && (
                                    <div className={`rounded-xl px-3 py-3 text-xs ${
                                        selectedOrder.shipping_address.customer_cancellation_response === 'insist'
                                            ? 'border border-amber-400/20 bg-amber-400/10 text-amber-500'
                                            : 'border border-surface-hover bg-surface-hover/60 text-gray-500'
                                    }`}>
                                        <p className="font-bold">
                                            {selectedOrder.shipping_address.customer_cancellation_response === 'insist'
                                                ? 'العميل ما زال مصرًا على هذا الطلب بعد الإلغاء'
                                                : 'العميل أكد أن الطلب لا يريده نهائيًا'}
                                        </p>
                                        {selectedOrder.shipping_address?.customer_cancellation_response_at && (
                                            <p className="mt-1 opacity-80">
                                                {new Date(selectedOrder.shipping_address.customer_cancellation_response_at).toLocaleString('ar-EG')}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {selectedOrder.status === 'cancelled' && selectedOrder.shipping_address?.customer_cancellation_response === 'insist' && (
                                    <button
                                        onClick={handleReopenOrder}
                                        disabled={isReopeningOrder || !canUpdateStatus}
                                        className="w-full rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
                                    >
                                        {isReopeningOrder ? 'جاري إعادة فتح الطلب...' : 'العميل مصر على الطلب — أعده إلى قيد التجهيز'}
                                    </button>
                                )}

                                <button
                                    onClick={handleCancelOrder}
                                    disabled={isCancellingOrder || selectedOrder.status === 'delivered' || isReopeningOrder}
                                    className="w-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white disabled:opacity-50"
                                >
                                    {isCancellingOrder ? 'جاري الإلغاء...' : 'إلغاء الطلب وإرسال السبب للعميل'}
                                </button>
                            </div>

                            {/* Products */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-3">
                                    {selectedOrderIsTextRequest ? 'تفاصيل الطلب النصي' : 'المنتجات المطلوبة'}
                                </p>
                                {selectedOrderIsTextRequest && (selectedOrderTextRequest || selectedOrderTextRequestImages.length > 0) && (
                                    <div className="mb-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                        <p className="text-xs font-black text-primary/80">
                                            {selectedOrderTextCategory ? `قسم ${selectedOrderTextCategory}` : 'طلب نصي'}
                                        </p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">
                                            {selectedOrderTextRequest?.trim() || 'هذا الطلب يعتمد على الصور المرفقة فقط دون نص إضافي من العميل.'}
                                        </p>
                                        <p className="mt-2 text-[11px] text-gray-500">هذا النص هو ما ستراجعه الإدارة أولًا، ثم يصل للمندوب بعد موافقة العميل على التسعيرة.</p>
                                        <div className="mt-3">
                                            <RequestAttachmentsGallery
                                                imageUrls={selectedOrderTextRequestImages}
                                                title="صور العميل المرفقة"
                                                hint="ستصل هذه الصور للمندوب كما هي، فراجع وضوحها قبل المتابعة."
                                            />
                                        </div>
                                    </div>
                                )}
                                {selectedOrderIsTextRequest && (
                                    <div className="mb-3">
                                        <SearchRequestProgress order={selectedOrder} audience="admin" />
                                    </div>
                                )}
                                {selectedOrderIsTextRequest && (
                                    <div className="mb-3 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background p-4 space-y-4">
                                        <div>
                                            <p className="text-xs font-black text-emerald-600">تسعير الطلب من الإدارة</p>
                                            <p className="mt-1 text-[11px] leading-6 text-gray-500">
                                                حدّد قيمة المنتجات من المحل، والنظام سيضيف 20 ج.م توصيل تلقائيًا ثم يرسل للعميل إشعارًا شيكًا، ولو ما فتحش الإشعار هيلاقي نفس القرار ظاهر له في تتبع الطلب.
                                            </p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                            <div>
                                                <p className="mb-2 text-xs font-bold text-gray-500">قيمة المنتجات</p>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={quotedSubtotalInput}
                                                    onChange={e => setQuotedSubtotalInput(Number(e.target.value || 0))}
                                                    className="w-full rounded-xl border border-surface-hover bg-background px-3 py-3 text-sm font-bold text-foreground outline-none focus:border-emerald-500/40"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveTextQuote}
                                                disabled={isSavingTextQuote}
                                                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                                            >
                                                {isSavingTextQuote ? 'جاري الإرسال...' : 'إرسال التسعيرة للعميل'}
                                            </button>
                                        </div>

                                        <div className="rounded-xl bg-background px-3 py-3 text-sm">
                                            <p className="text-gray-500">العميل سيدفع بعد اعتماد الطلب:</p>
                                            <p className="mt-1 text-lg font-black text-foreground">
                                                {(Number(quotedSubtotalInput || 0) + 20).toLocaleString()} ج.م
                                            </p>
                                        </div>

                                        {selectedOrderPricingPending ? (
                                            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-xs text-amber-500">
                                                الطلب بانتظار أن تحدد له الإدارة السعر أولًا قبل أن يراه العميل.
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-surface-hover bg-background px-3 py-3 text-xs text-gray-500 space-y-1">
                                                <p>آخر تسعيرة مرسلة: <span className="font-black text-foreground">{selectedOrderQuotedFinalTotal.toLocaleString()} ج.م</span></p>
                                                {selectedOrderPricingDriverName ? <p>آخر تحديث بواسطة: {selectedOrderPricingDriverName}</p> : null}
                                                {selectedOrderPricingUpdatedAt ? <p>وقت الإرسال: {new Date(selectedOrderPricingUpdatedAt).toLocaleString('ar-EG')}</p> : null}
                                                <p className="pt-1">
                                                    حالة العميل:
                                                    <span className="mr-1 font-bold text-foreground">
                                                        {selectedOrderQuoteResponse === 'approve'
                                                            ? 'وافق على التسعيرة'
                                                            : selectedOrderQuoteResponse === 'reject'
                                                                ? 'رفض التسعيرة'
                                                                : 'بانتظار رد العميل'}
                                                    </span>
                                                </p>
                                                {selectedOrderQuoteResponseAt ? <p>وقت الرد: {new Date(selectedOrderQuoteResponseAt).toLocaleString('ar-EG')}</p> : null}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {selectedOrderIsTextRequest && !selectedOrderPricingPending && selectedOrderQuotedFinalTotal > 0 && (
                                    <div className="mb-3 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black text-emerald-600">آخر تسعيرة معتمدة لهذا الطلب</p>
                                                <p className="mt-1 text-[11px] leading-6 text-gray-500">
                                                    من هنا تشوف آخر سعر اتبعت، وهل العميل وافق أو رفض، من غير ما تحتاج تفتش في الإشعارات.
                                                </p>
                                            </div>
                                            <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${
                                                selectedOrderQuoteResponse === 'approve'
                                                    ? 'border-primary/20 bg-primary/10 text-primary'
                                                    : selectedOrderQuoteResponse === 'reject'
                                                        ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                                                        : 'border-sky-500/20 bg-sky-500/10 text-sky-500'
                                            }`}>
                                                {selectedOrderQuoteResponse === 'approve'
                                                    ? 'العميل وافق'
                                                    : selectedOrderQuoteResponse === 'reject'
                                                        ? 'العميل رفض'
                                                        : 'مستنيين الرد'}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl bg-background px-3 py-3">
                                                <p className="text-[11px] text-gray-500">قيمة المنتجات</p>
                                                <p className="mt-1 text-lg font-black text-foreground">{selectedOrderQuotedProductsTotal.toLocaleString()} ج.م</p>
                                            </div>
                                            <div className="rounded-xl bg-background px-3 py-3">
                                                <p className="text-[11px] text-gray-500">السعر النهائي للعميل</p>
                                                <p className="mt-1 text-lg font-black text-emerald-600">{selectedOrderQuotedFinalTotal.toLocaleString()} ج.م</p>
                                            </div>
                                        </div>
                                        {(selectedOrderPricingDriverName || selectedOrderPricingUpdatedAt) && (
                                            <p className="mt-3 text-xs text-gray-500">
                                                {selectedOrderPricingDriverName ? `آخر تحديث بواسطة ${selectedOrderPricingDriverName}` : 'تم تحديث السعر'}
                                                {selectedOrderPricingUpdatedAt ? ` في ${new Date(selectedOrderPricingUpdatedAt).toLocaleString('ar-EG')}` : ''}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {loadingDetail ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-surface-hover rounded-xl animate-pulse" />)}
                                    </div>
                                ) : orderItems.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">
                                        {selectedOrderIsTextRequest ? 'هذا الطلب لا يحتوي على منتجات مخزنة، بل طلب نصي فقط.' : 'لا توجد منتجات'}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {orderItems.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-surface-hover rounded-xl p-3">
                                                {item.products?.image_url ? (
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                                                        <Image src={item.products.image_url} alt={item.products?.name || ''} width={40} height={40} className="object-contain w-full h-full p-0.5" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-surface border border-surface-hover flex items-center justify-center shrink-0">
                                                        <Package className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{item.products?.name}</p>
                                                    <p className="text-xs text-gray-500">{item.quantity} × {item.products?.price} ج.م</p>
                                                </div>
                                                <p className="text-sm font-black text-primary shrink-0">
                                                    {((item.quantity || 1) * (item.products?.price || 0)).toFixed(0)} ج.م
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div className="border-t border-surface-hover pt-4 flex items-center justify-between">
                                <span className="text-sm text-gray-500">{selectedOrderPricingPending ? 'السعر النهائي' : 'الإجمالي الكلي'}</span>
                                <span className="text-xl font-black text-primary">
                                    {selectedOrderPricingPending ? 'بانتظار تسعير الإدارة' : `${(selectedOrder.total_amount || 0).toLocaleString()} ج.م`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
