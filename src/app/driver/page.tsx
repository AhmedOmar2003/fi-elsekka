"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Phone, Package, Navigation, CheckCircle2, Loader2, ChevronDown, ChevronUp, Bell, BellOff, X, AlertCircle, Coffee } from 'lucide-react'
import { toast } from 'sonner'
import { RequestAttachmentsGallery } from '@/components/orders/request-attachments-gallery'

// Helper for VAPID key conversion
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

function OrderCard({ order, onMarkDelivered, onSubmitPricing, isUpdating, isPricing }: {
    order: DriverOrder;
    onMarkDelivered: (id: string) => void;
    onSubmitPricing: (id: string, productsSubtotal: number) => void;
    isUpdating: boolean;
    isPricing: boolean;
}) {
    const [expanded, setExpanded] = useState(false)
    const [quotedSubtotal, setQuotedSubtotal] = useState<string>(String(order.shipping_address?.quoted_products_total ?? order.shipping_address?.subtotal_amount ?? ''))
    const isDelivered = order.status === 'delivered'

    const customerName = order.users?.full_name || 'غير معروف'
    const phone = order.shipping_address?.phone || order.users?.phone || 'لا يوجد رقم'
    const address = [
        order.shipping_address?.city,
        order.shipping_address?.area,
        order.shipping_address?.street || order.shipping_address?.address
    ].filter(Boolean).join('، ')
    const driverInstruction = order.shipping_address?.driver_delivery_note?.trim()
    const isTextRequestOrder = order.shipping_address?.request_mode === 'custom_category_text'
    const textRequest = order.shipping_address?.custom_request_text
    const textRequestCategory = order.shipping_address?.custom_request_category_name
    const textRequestImageUrls = Array.isArray(order.shipping_address?.custom_request_image_urls) ? order.shipping_address.custom_request_image_urls : []
    const pricingPending = order.shipping_address?.pricing_pending === true

    useEffect(() => {
        setQuotedSubtotal(String(order.shipping_address?.quoted_products_total ?? order.shipping_address?.subtotal_amount ?? ''))
    }, [order.shipping_address?.quoted_products_total, order.shipping_address?.subtotal_amount])

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
                        <span className="font-black text-primary text-lg">{pricingPending ? 'يحدد لاحقًا' : `${order.total_amount?.toLocaleString() || 0} ج.م`}</span>
                    </div>

                    {isTextRequestOrder && (textRequest || textRequestImageUrls.length > 0) && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                            <p className="text-xs font-black text-primary/80">
                                {textRequestCategory ? `طلب ${textRequestCategory} النصي` : 'طلب نصي'}
                            </p>
                            <p className="text-sm leading-7 text-foreground whitespace-pre-wrap">
                                {textRequest?.trim() || 'هذا الطلب يعتمد على الصور المرفقة فقط بدون نص إضافي.'}
                            </p>
                            <p className="text-xs text-gray-500">هذا هو النص الذي كتبه العميل، فنفّذه كما هو أو تواصل مع الإدارة لو احتجت توضيحًا.</p>
                            <RequestAttachmentsGallery
                                imageUrls={textRequestImageUrls}
                                title="صور الطلب المرفقة"
                                hint="افتح الصورة في نافذة جديدة لو احتجت تكبير الروشتة أو قراءة الاسم بوضوح."
                                compact
                            />
                        </div>
                    )}

                    {isTextRequestOrder && !isDelivered && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                            <p className="text-xs font-black text-emerald-500/80">تسعير الطلب للعميل</p>
                            <p className="text-xs leading-6 text-gray-500">
                                اكتب قيمة المنتجات من المحل، والنظام سيضيف رسوم التوصيل تلقائيًا حتى يصل السعر النهائي للإدارة والعميل.
                            </p>
                            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                                <div>
                                    <p className="mb-2 text-xs font-bold text-gray-500">سعر المنتجات من المحل</p>
                                    <input
                                        type="number"
                                        min={0}
                                        value={quotedSubtotal}
                                        onChange={(e) => setQuotedSubtotal(e.target.value)}
                                        className="w-full rounded-xl border border-surface-hover bg-background px-3 py-3 text-sm font-bold text-foreground outline-none focus:border-emerald-500/40"
                                        placeholder="مثال: 180"
                                    />
                                </div>
                                <button
                                    onClick={() => onSubmitPricing(order.id, Number(quotedSubtotal || 0))}
                                    disabled={isPricing || quotedSubtotal === '' || Number(quotedSubtotal) < 0}
                                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white disabled:opacity-50"
                                >
                                    {isPricing ? 'جاري الحفظ...' : pricingPending ? 'إرسال السعر' : 'تحديث السعر'}
                                </button>
                            </div>
                            <div className="rounded-xl bg-background/70 px-3 py-3 text-sm">
                                <p className="text-gray-500">العميل سيدفع:</p>
                                <p className="mt-1 font-black text-foreground">
                                    {(Number(quotedSubtotal || 0) + 20).toLocaleString()} ج.م
                                    <span className="mr-2 text-xs font-medium text-gray-500">(شامل 20 ج.م توصيل)</span>
                                </p>
                            </div>
                            {!pricingPending && (
                                <p className="text-xs text-gray-500">
                                    تم إرسال السعر الحالي للعميل والإدارة، ويمكنك تحديثه عند الحاجة.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                        <p className="text-xs font-bold text-primary/80">مهلة التوصيل المطلوبة منك</p>
                        {driverInstruction ? (
                            <p className="text-sm font-black leading-7 text-foreground">{driverInstruction}</p>
                        ) : (
                            <p className="text-xs leading-6 text-gray-500">بانتظار الإدارة لتكتب لك تعليمات التوصيل الخاصة بك.</p>
                        )}
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
    const [pricingOrderId, setPricingOrderId] = useState<string | null>(null)
    const [driverUser, setDriverUser] = useState<any>(null)
    const [notificationsAllowed, setNotificationsAllowed] = useState(true)
    const [pushStatus, setPushStatus] = useState<NotificationPermission | 'prompt' | 'unsupported'>('prompt')
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [actionLoadingOrder, setActionLoadingOrder] = useState<string | null>(null) // ID of order currently accepting/rejecting
    const [showAvailabilityPrompt, setShowAvailabilityPrompt] = useState(false)
    const [isSettingAvailability, setIsSettingAvailability] = useState(false)
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null) // null = not loaded yet
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

    const initializeDriver = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            
            // Fetch driver profile to get is_available
            const { data: profile } = await supabase
                .from('users')
                .select('is_available')
                .eq('id', session.user.id)
                .single()
            
            if (profile) {
                setIsAvailable(profile.is_available !== false) // default to true if null
            }
        } catch (err) {
            console.error('Driver profile fetch error:', err)
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

            // Check role from auth metadata first, then fall back to public.users table
            // (for backward compatibility with accounts created before metadata fix)
            let isDriver = user.user_metadata?.role === 'driver'
            if (!isDriver) {
                const { data: publicUser } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                isDriver = publicUser?.role === 'driver'
            }

            if (!isDriver) { router.push('/account'); return; }
            setDriverUser(user)

            const [active, delivered] = await Promise.all([
                fetchOrders(session, user.id),
                fetchDeliveredOrders(user.id)
            ])

            // Also fetch driver availability status
            initializeDriver()

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

                    // It's a new active order for this driver via postgres changes 
                    // To prevent double notifications, we ignore 'pending' assignments here.
                    // The broadcast event handles 'pending' assignments perfectly.
                    if (updated.shipping_address?.driver?.acceptance_status === 'pending') {
                        return; // Let the broadcast handle the ping
                    }

                    if (!knownOrderIds.current.has(updated.id)) {
                        knownOrderIds.current.add(updated.id)
                        if (notificationsAllowed) {
                            playNotificationSound()
                        }
                        setActiveOrders(prev => [updated as DriverOrder, ...prev])
                    } else {
                        setActiveOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
                    }
                })
                .on('broadcast', { event: 'new-assignment' }, async () => {
                    // Ping received directly from Admin notify backend
                    // Re-fetch orders for absolute data consistency
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session) {
                        const freshActive = await fetchOrders(session, user.id)
                        
                        // Register all fetched IDs so the fallback doesn't trigger on them later
                        freshActive.forEach(o => knownOrderIds.current.add(o.id))
                        
                        setActiveOrders(freshActive)
                        
                        const newPendings = freshActive.filter(o => o.shipping_address?.driver?.acceptance_status === 'pending')
                        if (newPendings.length > 0) {
                             if (notificationsAllowed) {
                                 playNotificationSound()
                             }
                             toast('🛵 طلب جديد بانتظارك من الإدارة!', { duration: 6000 })
                        }
                    }
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }
        init()

        // Check Push Notification status
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setPushStatus(Notification.permission)
        } else {
            setPushStatus('unsupported')
        }
    }, [fetchOrders, fetchDeliveredOrders, notificationsAllowed, router])

    const subscribeToPush = async () => {
        setIsSubscribing(true)
        try {
            const permission = await Notification.requestPermission()
            setPushStatus(permission)
            
            if (permission !== 'granted') throw new Error('تم رفض تصريح الإشعارات')

            const registration = await navigator.serviceWorker.ready
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_KEY
            if (!publicVapidKey) throw new Error('VAPID key مفقود')

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            })

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('جلسة منتهية')

            const res = await fetch('/api/driver/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ subscription })
            })

            if (!res.ok) throw new Error('فشل حفظ الاشتراك في الخادم')
            
            toast.success('تم تفعيل إشعارات الموبايل بنجاح! 🔔')
        } catch (err: any) {
            console.error('Push error:', err)
            if (err.message !== 'تم رفض تصريح الإشعارات') {
                toast.error(err.message || 'حدث خطأ أثناء تفعيل الإشعارات')
            }
        } finally {
            setIsSubscribing(false)
        }
    }

    const acceptOrder = async (orderId: string) => {
        setActionLoadingOrder(orderId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const res = await fetch('/api/driver/accept-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ orderId })
            })
            if (!res.ok) throw new Error('Failed to accept order')
            
            // Update local state to accepted immediately
            setActiveOrders(prev => prev.map(o => o.id === orderId 
                ? { ...o, shipping_address: { ...o.shipping_address, driver: { ...o.shipping_address.driver, acceptance_status: 'accepted' } } } 
                : o
            ))
            toast.success('تم استلام الطلب! 🛵')
        } catch (err: any) {
            toast.error('حدث خطأ أثناء قبول الطلب')
        } finally {
            setActionLoadingOrder(null)
        }
    }

    const rejectOrder = async (orderId: string) => {
        setActionLoadingOrder(orderId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return
            const res = await fetch('/api/driver/reject-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ orderId })
            })
            if (!res.ok) throw new Error('Failed to reject order')
            
            // Remove from local state
            setActiveOrders(prev => prev.filter(o => o.id !== orderId))
            toast.success('تم رفض الطلب بنجاح.')
        } catch (err: any) {
            toast.error('حدث خطأ أثناء رفض الطلب')
        } finally {
            setActionLoadingOrder(null)
        }
    }

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
                setActiveOrders(prev => {
                    const remainingOrders = prev.filter(o => o.id !== orderId)
                    
                    // Show the availability post-delivery prompt if there are no other active orders left
                    if (remainingOrders.length === 0) {
                        setShowAvailabilityPrompt(true)
                    }
                    
                    return remainingOrders
                })
                setDeliveredOrders(prev => [{ ...order, status: 'delivered' }, ...prev])
            }
        } catch (err: any) {
            toast.error(err.message || "حدث خطأ أثناء التحديث")
        } finally {
            setUpdatingId(null)
        }
    }

    const submitPricing = async (orderId: string, productsSubtotal: number) => {
        setPricingOrderId(orderId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const res = await fetch('/api/driver/quote-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ orderId, productsSubtotal })
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data?.error || 'فشل حفظ سعر الطلب')
            }

            setActiveOrders(prev => prev.map(order =>
                order.id === orderId
                    ? {
                        ...order,
                        total_amount: data.totalAmount ?? order.total_amount,
                        shipping_address: data.shipping_address ?? order.shipping_address,
                    }
                    : order
            ))

            toast.success('تم إرسال السعر للإدارة والعميل بنجاح')
        } catch (err: any) {
            toast.error(err.message || 'حدث خطأ أثناء حفظ السعر')
        } finally {
            setPricingOrderId(null)
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

    const handleSetAvailability = async (isAvailable: boolean) => {
        setIsSettingAvailability(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const res = await fetch('/api/driver/set-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ isAvailable })
            })

            if (!res.ok) throw new Error('Failed to set availability')
            
            // Update local state immediately
            setIsAvailable(isAvailable)
            setShowAvailabilityPrompt(false)
            
            if (isAvailable) {
                toast.success('بطل! منتظرين الأوردرات الجديدة ليك 🚀')
            } else {
                toast('ارتاح شوية يا وحش، متنساش ترجع تاني 😴', { icon: '☕' })
            }
        } catch (err) {
            toast.error('حدث خطأ أثناء تحديث حالتك')
        } finally {
            setIsSettingAvailability(false)
        }
    }

    const pendingOrders = activeOrders.filter(o => o.shipping_address?.driver?.acceptance_status === 'pending')
    const acceptedActiveOrders = activeOrders.filter(o => o.shipping_address?.driver?.acceptance_status !== 'pending')

    return (
        <div className="space-y-6 pb-8 relative">
            {/* Full Screen Availability Prompt Modal (After Delivery) */}
            {showAvailabilityPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                    <div className="bg-surface border border-surface-hover rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-xl font-black text-center text-foreground mb-2">عاش يا بطل! التوصيلة خلصت 🦸‍♂️</h2>
                        <p className="text-center text-gray-400 mb-8 text-sm leading-relaxed">
                            فاضي وجاهز تقبض وتوصل طلبات تانية، ولا ناوي تخنسر وتعمل نفسك تعبان؟ <br/>
                            <span className="text-xs text-rose-400 mt-2 inline-block">(أنت الخسران لو ريحت 🤣)</span>
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleSetAvailability(true)}
                                disabled={isSettingAvailability}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex justify-center items-center gap-2"
                            >
                                {isSettingAvailability ? <Loader2 className="w-5 h-5 animate-spin" /> : 'جاهز للطلبات ورزقي على الله 🛵'}
                            </button>
                            <button
                                onClick={() => handleSetAvailability(false)}
                                disabled={isSettingAvailability}
                                className="w-full bg-surface-hover border border-surface-hover hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-gray-400 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2"
                            >
                                {isSettingAvailability ? <Loader2 className="w-5 h-5 animate-spin" /> : 'هريح شوية / تعبان 😴'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Screen Pending Order Notification Modal */}
            {pendingOrders.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
                    <div className="bg-surface border border-surface-hover rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <Bell className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-black text-center text-foreground mb-2">طلب جديد بانتظارك!</h2>
                        <p className="text-center text-gray-400 mb-6 text-sm">الإدارة أرسلت لك طلباً لتوصيله، هل أنت متاح الآن؟</p>
                        
                        <div className="space-y-3 mb-6 bg-background rounded-2xl p-4 border border-surface-hover">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">رقم الطلب</span>
                                <span className="font-mono font-bold text-foreground">#{pendingOrders[0].id.slice(0, 6)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">إجمالي المبلغ</span>
                                <span className="font-black text-primary">
                                    {pendingOrders[0].shipping_address?.pricing_pending ? 'يحدد لاحقًا' : `${pendingOrders[0].total_amount?.toLocaleString() || 0} ج.م`}
                                </span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-surface-hover text-sm">
                                <p className="text-gray-500 mb-1 line-clamp-1">العنوان:</p>
                                <p className="font-bold text-foreground line-clamp-2">{pendingOrders[0].shipping_address?.street || 'عنوان غير معروف'}</p>
                            </div>
                            {pendingOrders[0].shipping_address?.request_mode === 'custom_category_text' && (
                                <div className="pt-2 mt-2 border-t border-surface-hover text-sm">
                                    <p className="text-gray-500 mb-1">الطلب النصي:</p>
                                    <p className="font-bold text-foreground line-clamp-4 whitespace-pre-wrap">
                                        {pendingOrders[0].shipping_address?.custom_request_text?.trim() || 'الطلب يعتمد على الصور المرفقة فقط.'}
                                    </p>
                                    <RequestAttachmentsGallery
                                        imageUrls={Array.isArray(pendingOrders[0].shipping_address?.custom_request_image_urls) ? pendingOrders[0].shipping_address.custom_request_image_urls : []}
                                        title="المرفقات"
                                        hint="الصور المرسلة مع الطلب"
                                        compact
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => acceptOrder(pendingOrders[0].id)}
                                disabled={actionLoadingOrder === pendingOrders[0].id}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all flex justify-center items-center gap-2"
                            >
                                {actionLoadingOrder === pendingOrders[0].id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'نعم، جاهز للتسليم ✔️'}
                            </button>
                            <button
                                onClick={() => rejectOrder(pendingOrders[0].id)}
                                disabled={actionLoadingOrder === pendingOrders[0].id}
                                className="w-full bg-surface-hover hover:bg-rose-500/10 hover:text-rose-500 text-gray-500 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2"
                            >
                                {actionLoadingOrder === pendingOrders[0].id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'لا، لدي مشكلة / طلب آخر ❌'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resting Banner — only shows when driver chose to rest */}
            {isAvailable === false && (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-amber-400" />
                        <div>
                            <p className="font-bold text-sm text-amber-400">مريح حالياً — الإدارة مش قادرة تعينك دلوقتي</p>
                            <p className="text-xs text-gray-500 mt-0.5">خد راحتك وروق، ولما تكون جاهز اضغط على الزر.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleSetAvailability(true)}
                        disabled={isSettingAvailability}
                        className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                        {isSettingAvailability ? '...' : 'جاهز دلوقتي 🚀'}
                    </button>
                </div>
            )}

            {/* Push Notification Promo Banner */}
            {pushStatus === 'default' || pushStatus === 'prompt' ? (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
                    <div className="flex items-start gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary mt-0.5">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-foreground">فعّل إشعارات الموبايل 🔔</p>
                            <p className="text-xs text-gray-500 mt-1">عشان الموبايل يرن فور تعيين طلب جديد لك، حتى لو التطبيق مقفول.</p>
                        </div>
                    </div>
                    <button 
                        onClick={subscribeToPush}
                        disabled={isSubscribing}
                        className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تفعيل الآن'}
                    </button>
                </div>
            ) : pushStatus === 'denied' ? (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-sm text-rose-500">تم حظر الإشعارات</p>
                        <p className="text-xs text-gray-500 mt-1">عشان تستقبل تنبيهات الطلبات الجديدة، يرجى تفعيل الإشعارات من إعدادات المتصفح أو جهازك.</p>
                    </div>
                </div>
            ) : null}

            {/* Active Orders Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-black text-base text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block"></span>
                        طلبات نشطة
                        {acceptedActiveOrders.length > 0 && (
                            <span className="text-xs font-bold bg-amber-400/15 text-amber-500 px-2 py-0.5 rounded-full">{acceptedActiveOrders.length}</span>
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

                {acceptedActiveOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface border border-surface-hover rounded-2xl">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                        <p className="font-black text-foreground">لا توجد طلبات نشطة حالياً</p>
                        <p className="text-xs text-gray-500 mt-1">ستظهر طلباتك هنا فور الموافقة عليها</p>
                    </div>
                ) : (
                    acceptedActiveOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onMarkDelivered={markAsDelivered}
                            onSubmitPricing={submitPricing}
                            isUpdating={updatingId === order.id}
                            isPricing={pricingOrderId === order.id}
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
                            onSubmitPricing={submitPricing}
                            isUpdating={false}
                            isPricing={false}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
