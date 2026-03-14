"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    CheckCircle2, MapPin, Phone, User as UserIcon, Loader2,
    ChevronDown, ChevronUp, Bell, BellOff, LogOut, Bike
} from 'lucide-react'
import { toast } from 'sonner'

interface DriverOrder {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    shipping_address: any;
    order_items?: any[];
    users?: { full_name: string; phone: string; };
}

// --- Minimal sound using Web Audio API (no external file needed) ---
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
        g.gain.setValueAtTime(0.4, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.6);
    } catch (e) {
        // Silently fail if audio is blocked
    }
}

function OrderCard({ order, onMarkDelivered, isUpdating }: {
    order: DriverOrder;
    onMarkDelivered: (id: string) => void;
    isUpdating: boolean;
}) {
    const [expanded, setExpanded] = useState(false)
    const isDelivered = order.status === 'delivered'

    const customerName = order.users?.full_name || 'غير معروف'
    const phone = order.shipping_address?.phone || order.users?.phone || 'لا يوجد رقم'
    const address = [
        order.shipping_address?.city,
        order.shipping_address?.area,
        order.shipping_address?.street || order.shipping_address?.address
    ].filter(Boolean).join('، ')

    return (
        <div className={`rounded-2xl border overflow-hidden transition-all ${isDelivered
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-surface border-surface-hover shadow-sm'
        }`}>
            {/* Header row - always visible */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between gap-3 p-4 text-right"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDelivered ? 'bg-emerald-500/15 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        {isDelivered ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div className="text-right min-w-0">
                        <p className={`text-xs font-mono mb-0.5 ${isDelivered ? 'text-emerald-500/70' : 'text-gray-500'}`}>
                            طلب #{order.id.slice(0, 6)}
                        </p>
                        <p className={`font-black text-sm truncate ${isDelivered ? 'text-emerald-600' : 'text-foreground'}`}>
                            {customerName}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${isDelivered
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20'
                        : 'bg-amber-400/10 text-amber-500 border-amber-400/20'
                    }`}>
                        {isDelivered ? 'تم التوصيل ✓' : 'جاري التوصيل'}
                    </span>
                    {expanded
                        ? <ChevronUp className="w-5 h-5 text-gray-400" />
                        : <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                </div>
            </button>

            {/* Expanded body */}
            {expanded && (
                <div className="border-t border-surface-hover p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">رقم الهاتف</p>
                            <div className="flex items-center justify-between bg-background border border-surface-hover px-3 py-2 rounded-xl">
                                <p className="font-mono text-sm font-bold tracking-wider" dir="ltr">{phone}</p>
                                <a href={`tel:${phone}`} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                                    اتصال 📞
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs text-gray-500 mb-1">العنوان</p>
                            <p className="font-bold text-sm text-foreground leading-relaxed">{address || 'لا يوجد عنوان'}</p>
                            {order.shipping_address?.notes && (
                                <p className="text-xs mt-1.5 p-2 bg-amber-400/5 border border-amber-400/20 rounded-lg text-amber-600 font-medium">
                                    📝 {order.shipping_address.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-surface-hover">
                        <span className="text-xs text-gray-500">إجمالي الطلب</span>
                        <span className="font-black text-primary text-lg">{order.total_amount?.toLocaleString() || 0} ج.م</span>
                    </div>

                    {!isDelivered && (
                        <button
                            onClick={() => onMarkDelivered(order.id)}
                            disabled={isUpdating}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            {isUpdating
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <><CheckCircle2 className="w-5 h-5" /> تم التوصيل بنجاح</>
                            }
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default function DriverDashboard() {
    const router = useRouter()
    const [activeOrders, setActiveOrders] = useState<DriverOrder[]>([])
    const [deliveredOrders, setDeliveredOrders] = useState<DriverOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [driverUser, setDriverUser] = useState<any>(null)
    const [notificationsAllowed, setNotificationsAllowed] = useState(true)
    const knownOrderIds = useRef<Set<string>>(new Set())
    const isFirstLoad = useRef(true)

    const fetchOrders = useCallback(async (session: any, userId: string) => {
        try {
            const res = await fetch(`/api/driver/orders?driverId=${userId}`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            })
            if (!res.ok) throw new Error('Failed to fetch orders')
            const data = await res.json()
            return (data.orders || []) as DriverOrder[]
        } catch (err) {
            console.error('Driver fetch error:', err)
            return []
        }
    }, [])

    // Also fetch "recently" delivered orders for the driver to review (last 24h)
    const fetchDeliveredOrders = useCallback(async (userId: string) => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', yesterday)
            .eq('status', 'delivered')
            .order('created_at', { ascending: false })
        if (data) {
            // Filter only this driver's delivered orders
            return data.filter((o: any) => o.shipping_address?.driver?.id === userId)
        }
        return []
    }, [])

    useEffect(() => {
        const init = async () => {
            setIsLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) { router.push('/login'); return; }
            const user = session.user
            if (user.user_metadata?.role !== 'driver') { router.push('/account'); return; }
            setDriverUser(user)

            const [active, delivered] = await Promise.all([
                fetchOrders(session, user.id),
                fetchDeliveredOrders(user.id)
            ])

            // Seed known IDs on first load to avoid fake notifications
            active.forEach(o => knownOrderIds.current.add(o.id))
            isFirstLoad.current = false

            setActiveOrders(active)
            setDeliveredOrders(delivered)
            setIsLoading(false)

            // Real-time subscription for new/updated orders
            const channel = supabase
                .channel(`driver-orders-${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                }, async (payload: any) => {
                    const updated = payload.new
                    if (!updated) return
                    const isForThisDriver = updated.shipping_address?.driver?.id === user.id

                    if (updated.status === 'delivered' && isForThisDriver) {
                        // Move to delivered section
                        setActiveOrders(prev => prev.filter(o => o.id !== updated.id))
                        setDeliveredOrders(prev => {
                            if (prev.find(o => o.id === updated.id)) return prev
                            return [{ ...updated }, ...prev]
                        })
                        return
                    }

                    if (!isForThisDriver) return

                    // It's a new active order for this driver
                    if (!knownOrderIds.current.has(updated.id)) {
                        knownOrderIds.current.add(updated.id)
                        // Play sound + show toast notification
                        if (notificationsAllowed) {
                            playNotificationSound()
                            toast('🛵 طلب جديد وصلك!', {
                                description: `طلب رقم #${updated.id.slice(0, 6)} - ${updated.total_amount?.toLocaleString()} ج.م`,
                                duration: 6000,
                            })
                        }
                        setActiveOrders(prev => [updated as DriverOrder, ...prev])
                    } else {
                        setActiveOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
                    }
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
        init()
    }, [fetchOrders, fetchDeliveredOrders, notificationsAllowed, router])

    const markAsDelivered = async (orderId: string) => {
        setUpdatingId(orderId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const res = await fetch('/api/driver/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ orderId, status: 'delivered' })
            })
            if (!res.ok) {
                const e = await res.json()
                throw new Error(e.error || 'Failed to update status')
            }
            toast.success("تم تأكيد التوصيل بنجاح! 📦✨")
            const order = activeOrders.find(o => o.id === orderId)
            if (order) {
                setActiveOrders(prev => prev.filter(o => o.id !== orderId))
                setDeliveredOrders(prev => [{ ...order, status: 'delivered' }, ...prev])
            }
        } catch (err: any) {
            toast.error(err.message || "حدث خطأ أثناء التحديث")
        } finally {
            setUpdatingId(null)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-gray-500 font-bold">جاري تحميل طلباتك...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Active Orders Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-black text-base text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block"></span>
                        طلبات نشطة
                        {activeOrders.length > 0 && (
                            <span className="text-xs font-bold bg-amber-400/15 text-amber-500 px-2 py-0.5 rounded-full">{activeOrders.length}</span>
                        )}
                    </h2>
                    <button
                        onClick={() => setNotificationsAllowed(v => !v)}
                        className={`p-2 rounded-xl transition-colors text-xs flex items-center gap-1 font-bold ${notificationsAllowed ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-gray-400'}`}
                        title={notificationsAllowed ? 'الأصوات مفعّلة' : 'الأصوات مطفية'}
                    >
                        {notificationsAllowed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        {notificationsAllowed ? 'صوت' : 'صامت'}
                    </button>
                </div>

                {activeOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface border border-surface-hover rounded-2xl">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                        <p className="font-black text-foreground">لا توجد طلبات نشطة حالياً</p>
                        <p className="text-xs text-gray-500 mt-1">ستظهر طلباتك هنا فور تعيينها لك من الإدارة</p>
                    </div>
                ) : (
                    activeOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onMarkDelivered={markAsDelivered}
                            isUpdating={updatingId === order.id}
                        />
                    ))
                )}
            </div>

            {/* Delivered Orders Section */}
            {deliveredOrders.length > 0 && (
                <div className="space-y-3">
                    <h2 className="font-black text-base text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span>
                        تم التوصيل <span className="text-xs font-bold text-gray-400">(آخر 24 ساعة)</span>
                        <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded-full">{deliveredOrders.length}</span>
                    </h2>
                    {deliveredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onMarkDelivered={markAsDelivered}
                            isUpdating={false}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
