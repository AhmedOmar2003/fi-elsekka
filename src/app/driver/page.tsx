"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, MapPin, Phone, User as UserIcon, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'

interface DriverOrder {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    shipping_address: any;
    users?: {
        full_name: string;
        phone: string;
    };
}

export default function DriverDashboard() {
    const router = useRouter()
    const [orders, setOrders] = useState<DriverOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [driverUserId, setDriverUserId] = useState<string | null>(null)

    useEffect(() => {
        checkAuthAndFetch()
    }, [])

    const checkAuthAndFetch = async () => {
        setIsLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            router.push('/login')
            return
        }

        const user = session.user
        if (user.user_metadata?.role !== 'driver') {
            router.push('/account')
            return
        }

        setDriverUserId(user.id)
        
        try {
            // Fetch via our secure API route
            const res = await fetch(`/api/driver/orders?driverId=${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            
            if (!res.ok) throw new Error('Failed to fetch orders')
            
            const data = await res.json()
            setOrders(data.orders || [])
        } catch (err) {
            console.error('Driver fetch error:', err)
            toast.error("حدث خطأ أثناء تحميل الطلبات")
        } finally {
            setIsLoading(false)
        }
    }

    const markAsDelivered = async (orderId: string) => {
        setUpdatingId(orderId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const res = await fetch('/api/driver/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ orderId, status: 'delivered' })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to update status')
            }

            toast.success("تم تأكيد التوصيل بنجاح! 📦✨")
            // Remove the delivered order from the active list
            setOrders(prev => prev.filter(o => o.id !== orderId))
        } catch (err: any) {
            toast.error(err.message || "حدث خطأ أثناء التحديث")
        } finally {
            setUpdatingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-gray-500 font-bold">جاري تحميل طلباتك...</p>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-20 h-20 bg-surface-hover rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">ليس لديك طلبات حالياً!</h2>
                <p className="text-gray-500 text-sm">عمل رائع! لقد قمت بتوصيل جميع طلباتك لا يوجد طلبات جديدة معينة لك حتى الآن.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-20">
            {orders.map(order => {
                const customerName = order.users?.full_name || 'غير معروف'
                const phone = order.shipping_address?.phone || order.users?.phone || 'لا يوجد رقم'
                const address = [
                    order.shipping_address?.city,
                    order.shipping_address?.area,
                    order.shipping_address?.street || order.shipping_address?.address
                ].filter(Boolean).join('، ')

                const isPending = order.status === 'pending'

                return (
                    <div key={order.id} className="bg-surface border border-surface-hover p-4 shadow-sm rounded-2xl space-y-4">
                        <div className="flex justify-between items-start border-b border-surface-hover pb-3">
                            <div>
                                <p className="text-xs font-mono text-gray-500 mb-1">طلب #{order.id.slice(0, 6)}</p>
                                <p className="font-black text-primary text-lg">{order.total_amount?.toLocaleString() || 0} ج.م</p>
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${isPending ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20' : 'bg-blue-400/10 text-blue-500 border border-blue-400/20'}`}>
                                {isPending ? 'في الانتظار' : 'في الطريق 🚚'}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <UserIcon className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">اسم العميل</p>
                                    <p className="font-bold text-sm text-foreground">{customerName}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-0.5">رقم الهاتف</p>
                                    <div className="flex items-center justify-between bg-background border border-surface-hover px-3 py-2 rounded-xl">
                                        <p className="font-mono text-sm font-bold tracking-wider">{phone}</p>
                                        <a href={`tel:${phone}`} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors">
                                            اتصال
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">العنوان</p>
                                    <p className="font-bold text-sm text-foreground leading-relaxed">{address}</p>
                                    {order.shipping_address?.notes && (
                                        <p className="text-xs text-gray-500 mt-1 mt-1.5 p-2 bg-amber-400/5 border border-amber-400/20 rounded-lg text-amber-500/90 font-medium">
                                            ملاحظة: {order.shipping_address.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-surface-hover">
                            <button
                                onClick={() => markAsDelivered(order.id)}
                                disabled={updatingId === order.id}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {updatingId === order.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        تم التوصيل بنجاح
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
