"use client"

import React, { useEffect, useState } from 'react';
import { fetchAdminOrders, fetchOrderDetails, updateOrderStatus } from '@/services/adminService';
import { ShoppingCart, ChevronDown, X, Package } from 'lucide-react';
import Image from 'next/image';

const STATUSES = [
    { value: 'pending', label: 'في الانتظار', color: 'text-amber-400  bg-amber-400/10  border-amber-400/20' },
    { value: 'shipped', label: 'تم الشحن', color: 'text-blue-400   bg-blue-400/10   border-blue-400/20' },
    { value: 'delivered', label: 'تم التوصيل', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { value: 'cancelled', label: 'ملغي', color: 'text-rose-400   bg-rose-400/10   border-rose-400/20' },
];

function statusMeta(val: string) {
    return STATUSES.find(s => s.value === val) || { label: val, color: 'text-gray-400 bg-white/5 border-white/10' };
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const load = async () => {
        setIsLoading(true);
        const data = await fetchAdminOrders();
        setOrders(data);
        setIsLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleViewOrder = async (order: any) => {
        setSelectedOrder(order);
        setLoadingDetail(true);
        const items = await fetchOrderDetails(order.id);
        setOrderItems(items);
        setLoadingDetail(false);
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        await updateOrderStatus(orderId, newStatus);
        // Optimistic update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
            setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-heading font-black text-white">الطلبات</h1>
                <p className="text-sm text-gray-400 mt-0.5">{orders.length} طلب إجمالي</p>
            </div>

            <div className="bg-[#0a0e14] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">رقم الطلب</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">العميل</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">التليفون</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 hidden sm:table-cell">التاريخ</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">الإجمالي</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500">الحالة</th>
                                <th className="px-4 py-3 text-xs font-bold text-gray-500 text-center">تفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-10 bg-white/5 rounded-lg animate-pulse" /></td></tr>
                                ))
                            ) : orders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-gray-500 py-12">لا توجد طلبات بعد</td></tr>
                            ) : (
                                orders.map((order) => {
                                    const sm = statusMeta(order.status);
                                    return (
                                        <tr key={order.id} className="hover:bg-white/3 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-white text-xs">{order.users?.full_name || order.users?.email || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-300 font-mono">
                                                {order.shipping_address?.phone || order.users?.phone || '—'}
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-4 py-3 font-black text-primary text-sm">
                                                {(order.total_amount || 0).toLocaleString()} ج.م
                                            </td>
                                            <td className="px-4 py-3">
                                                {/* Status dropdown */}
                                                <div className="relative inline-block">
                                                    <select
                                                        value={order.status}
                                                        onChange={e => handleStatusChange(order.id, e.target.value)}
                                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border appearance-none cursor-pointer ${sm.color} bg-transparent focus:outline-none`}
                                                    >
                                                        {STATUSES.map(s => (
                                                            <option key={s.value} value={s.value} className="bg-[#0a0e14] text-white">{s.label}</option>
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
                    <div className="relative w-full max-w-md bg-[#0a0e14] border-r border-white/10 flex flex-col h-full shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0a0e14] z-10">
                            <div>
                                <h2 className="font-heading font-black text-white">تفاصيل الطلب</h2>
                                <p className="text-xs text-gray-500 mt-0.5 font-mono">#{selectedOrder.id.slice(0, 8)}...</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5 flex-1">
                            {/* Customer Info */}
                            <div className="bg-white/3 rounded-xl p-4 space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">معلومات العميل</p>
                                <p className="font-bold text-white">{selectedOrder.users?.full_name || 'غير معروف'}</p>
                                <p className="text-xs text-gray-300 font-mono">{selectedOrder.shipping_address?.phone || selectedOrder.users?.phone || 'لا يوجد رقم'}</p>
                                <p className="text-xs text-gray-400">{selectedOrder.users?.email}</p>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-2">الحالة الحالية</p>
                                <select
                                    value={selectedOrder.status}
                                    onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                >
                                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>

                            {/* Products */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 mb-3">المنتجات المطلوبة</p>
                                {loadingDetail ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
                                    </div>
                                ) : orderItems.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">لا توجد منتجات</p>
                                ) : (
                                    <div className="space-y-2">
                                        {orderItems.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/3 rounded-xl p-3">
                                                {item.products?.image_url ? (
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                                                        <Image src={item.products.image_url} alt={item.products?.name || ''} width={40} height={40} className="object-contain w-full h-full p-0.5" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                                                        <Package className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white truncate">{item.products?.name}</p>
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
                            <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                                <span className="text-sm text-gray-400">الإجمالي الكلي</span>
                                <span className="text-xl font-black text-primary">{(selectedOrder.total_amount || 0).toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
