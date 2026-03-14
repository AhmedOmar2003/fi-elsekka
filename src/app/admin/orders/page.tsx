"use client"

import React, { useEffect, useState } from 'react';
import { fetchAdminOrders, fetchOrderDetails, updateOrderStatus, updateOrderEstimation } from '@/services/adminService';
import { ShoppingCart, ChevronDown, X, Package, Download, Filter } from 'lucide-react';
import Image from 'next/image';

const STATUSES = [
    { value: 'pending', label: 'في الانتظار', color: 'text-amber-400  bg-amber-400/10  border-amber-400/20' },
    { value: 'shipped', label: 'تم الشحن', color: 'text-blue-400   bg-blue-400/10   border-blue-400/20' },
    { value: 'delivered', label: 'تم التوصيل', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { value: 'cancelled', label: 'ملغي', color: 'text-rose-400   bg-rose-400/10   border-rose-400/20' },
];

function statusMeta(val: string) {
    return STATUSES.find(s => s.value === val) || { label: val, color: 'text-gray-500 bg-surface-hover border-surface-hover' };
}

function exportToCSV(orders: any[], statusFilter: string) {
    const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
    const statusLabel = statusFilter === 'all' ? 'الكل' : (STATUSES.find(s => s.value === statusFilter)?.label || statusFilter);

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
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    
    // Delivery estimation UI state
    const [estimatedTime, setEstimatedTime] = useState('');
    const [isSavingTime, setIsSavingTime] = useState(false);

    const load = async () => {
        setIsLoading(true);
        const data = await fetchAdminOrders();
        setOrders(data);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleViewOrder = async (order: any) => {
        setSelectedOrder(order);
        setEstimatedTime(order.shipping_address?.estimated_delivery || '');
        setLoadingDetail(true);
        const items = await fetchOrderDetails(order.id);
        setOrderItems(items);
        setLoadingDetail(false);
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
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
        setIsSavingTime(true);
        
        const { error } = await updateOrderEstimation(selectedOrder.id, estimatedTime);
        setIsSavingTime(false);

        if (!error) {
            // Update local state without full reload
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { 
                ...o, 
                shipping_address: { ...o.shipping_address, estimated_delivery: estimatedTime } 
            } : o));
            setSelectedOrder((prev: any) => ({
                ...prev,
                shipping_address: { ...prev.shipping_address, estimated_delivery: estimatedTime }
            }));
            // Show brief visual feedback (could use sonner toast if available)
            const btn = document.getElementById('save-est-btn');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = 'تم الحفظ ✔️';
                setTimeout(() => btn.innerText = originalText, 2000);
            }
        }
    };

    const displayedOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

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
                        {STATUSES.map(s => (
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
                                {STATUSES.map(s => (
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
                                                    <select
                                                        value={order.status}
                                                        onChange={e => handleStatusChange(order.id, e.target.value)}
                                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border appearance-none cursor-pointer ${sm.color} bg-transparent focus:outline-none`}
                                                    >
                                                        {STATUSES.map(s => (
                                                            <option key={s.value} value={s.value} className="bg-surface text-foreground">{s.label}</option>
                                                        ))}
                                                    </select>
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
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-2">الحالة الحالية</p>
                                <select
                                    value={selectedOrder.status}
                                    onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                                    className="w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                >
                                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>

                            {/* Estimated Delivery Input */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-2">مدة التوصيل المتوقعة</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="مثال: ساعتين، يوم واحد، الخ..."
                                        value={estimatedTime}
                                        onChange={e => setEstimatedTime(e.target.value)}
                                        className="w-full bg-surface-hover border border-surface-hover rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                                    />
                                    <button
                                        id="save-est-btn"
                                        onClick={handleSaveEstimation}
                                        disabled={isSavingTime}
                                        className="shrink-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                        {isSavingTime ? 'جاري...' : 'حفظ'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">تظهر هذه المدة للعميل في صفحة تتبع الطلبات لتطمئنه.</p>
                            </div>

                            {/* Products */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-3">المنتجات المطلوبة</p>
                                {loadingDetail ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-surface-hover rounded-xl animate-pulse" />)}
                                    </div>
                                ) : orderItems.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">لا توجد منتجات</p>
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
                                <span className="text-sm text-gray-500">الإجمالي الكلي</span>
                                <span className="text-xl font-black text-primary">{(selectedOrder.total_amount || 0).toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
