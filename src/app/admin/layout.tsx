"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
    LayoutDashboard, Package, Tag, ShoppingCart, Users,
    Menu, X, LogOut, ChevronRight, Bell, Settings, Bike, Megaphone, Ticket,
    UserPlus, ShoppingBag, CheckCircle2, Clock, Truck, XCircle, Loader2, ShieldAlert, MessageSquare, Star, Search, History, AlertTriangle
} from 'lucide-react';
import { signOut } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { hasFullAdminAccess, hasPermission } from '@/lib/permissions';

// ── Types ────────────────────────────────────────────────────
interface Notification {
    id: string;
    type: 'new_order' | 'new_user' | 'new_driver' | 'new_staff' | 'order_delivered' | 'new_review';
    title: string;
    body: string;
    time: Date;
    read: boolean;
    link?: string;
}

// ── Nav Items ────────────────────────────────────────────────
const NAV_ITEMS = [
    { label: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard, perm: null },
    { label: 'الطلبات', href: '/admin/orders', icon: ShoppingCart, perm: 'view_orders' },
    { label: 'مركز العمليات', href: '/admin/operations', icon: AlertTriangle, fullAdmin: true },
    { label: 'المندوبين', href: '/admin/drivers', icon: Bike, perm: 'view_drivers' },
    { label: 'المنتجات', href: '/admin/products', icon: Package, perm: 'manage_products' },
    { label: 'الأقسام', href: '/admin/categories', icon: Tag, perm: 'manage_categories' },
    { label: 'المستخدمون', href: '/admin/users', icon: Users, perm: 'manage_users' },
    { label: 'إدارة الطاقم', href: '/admin/staff', icon: ShieldAlert, perm: 'manage_admins' },
    { label: 'البحث الشامل', href: '/admin/search', icon: Search, fullAdmin: true },
    { label: 'سجل الإدارة', href: '/admin/audit-log', icon: History, fullAdmin: true },
    { label: 'التقييمات', href: '/admin/reviews', icon: MessageSquare, perm: 'view_reports' },
    { label: 'العروض الترويجية', href: '/admin/promotions', icon: Megaphone, perm: 'manage_offers' },
    { label: 'أكواد الخصم', href: '/admin/discounts', icon: Ticket, perm: 'manage_discounts' },
];

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile } = useAuth();
    const canAccessControlCenter = hasFullAdminAccess(profile);

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <aside className="flex flex-col h-full bg-surface border-r border-surface-hover">
            {/* Logo */}
            <div className="flex items-center justify-between p-5 border-b border-surface-hover">
                <div className="flex items-center gap-2.5">
                    <img 
                      src="/icon-192x192.svg" 
                      alt="في السكة Admin" 
                      className="w-9 h-9 rounded-xl shadow-lg shadow-primary/30" 
                    />
                    <div>
                        <p className="font-heading font-black text-foreground text-sm">في السكة</p>
                        <p className="text-[10px] text-primary font-medium">لوحة الإدارة</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-foreground rounded-lg hover:bg-surface-hover">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {NAV_ITEMS.filter(item => {
                    if (item.fullAdmin) return canAccessControlCenter;
                    if (item.perm === null) return true;
                    return hasPermission(profile, item.perm as any);
                }).map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                                ? 'bg-primary/15 text-primary border border-primary/20'
                                : 'text-gray-400 hover:text-foreground hover:bg-surface-hover'
                                }`}
                        >
                            <Icon className="w-4.5 h-4.5 shrink-0" />
                            {item.label}
                            {isActive && <ChevronRight className="w-3.5 h-3.5 mr-auto" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-surface-hover space-y-1">
                <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {user?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{user?.email}</p>
                        <p className="text-[10px] text-primary">مدير النظام</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                </button>
            </div>
        </aside>
    );
}

// ── Notification Bell Component ───────────────────────────────
const NOTIF_STORAGE_KEY = 'admin_notifications';
const NOTIF_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadStoredNotifications(): Notification[] {
    try {
        const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
        if (!raw) return [];
        const parsed: Notification[] = JSON.parse(raw).map((n: any) => ({ ...n, time: new Date(n.time) }));
        const cutoff = Date.now() - NOTIF_TTL_MS;
        return parsed.filter(n => new Date(n.time).getTime() > cutoff); // prune old ones
    } catch { return []; }
}

function saveNotifications(notifications: Notification[]) {
    try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
    } catch { }
}

const STAFF_ROLES = ['super_admin', 'admin', 'operations_manager', 'catalog_manager', 'support_agent'];

function getRoleLabel(role?: string | null) {
    switch (role) {
        case 'super_admin':
            return 'مشرف عام';
        case 'admin':
            return 'مدير نظام';
        case 'operations_manager':
            return 'مسؤول العمليات';
        case 'catalog_manager':
            return 'مسؤول الكتالوج';
        case 'support_agent':
            return 'موظف دعم';
        case 'driver':
            return 'مندوب';
        default:
            return 'مستخدم';
    }
}

function buildUserNotification(userRow: any): Omit<Notification, 'id' | 'time' | 'read'> {
    const displayName = userRow?.full_name || userRow?.email || 'عضو جديد';
    const role = userRow?.role || null;

    if (role === 'driver') {
        return {
            type: 'new_driver',
            title: 'مندوب جديد انضم للفريق',
            body: `تمت إضافة ${displayName} كمندوب جديد ويمكن تعيين الطلبات له الآن`,
            link: '/admin/drivers',
        };
    }

    if (STAFF_ROLES.includes(role)) {
        const permissionsCount = Array.isArray(userRow?.permissions) ? userRow.permissions.length : 0;
        return {
            type: 'new_staff',
            title: 'تمت إضافة موظف جديد',
            body: permissionsCount > 0
                ? `تمت إضافة ${displayName} بدور ${getRoleLabel(role)} مع ${permissionsCount} صلاحيات مخصصة`
                : `تمت إضافة ${displayName} بدور ${getRoleLabel(role)} ليتولى المهام التي حددتها له`,
            link: '/admin/staff',
        };
    }

    return {
        type: 'new_user',
        title: 'مستخدم جديد!',
        body: `انضم ${displayName} إلى المنصة كعميل جديد`,
        link: '/admin/users',
    };
}

function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        setNotifications(loadStoredNotifications());
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const playNotificationSound = () => {
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch((e: any) => console.log('Audio play blocked:', e));
            }
        } catch (e: any) {
            console.error('Audio playback failed', e);
        }
    };

    const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
        playNotificationSound();
        const newNotif: Notification = {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            time: new Date(),
            read: false,
        };
        setNotifications(prev => {
            const updated = [newNotif, ...prev].slice(0, 30); // keep last 30
            saveNotifications(updated);
            return updated;
        });

        // Browser notification (if permitted)
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification(n.title, { body: n.body, icon: '/logo.png' });
        }
    }, []);

    useEffect(() => {
        // Request browser notification permission
        if (typeof window !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Local set to prevent duplicate notifications in the same session,
        // since payload.old doesn't contain the full record by default in Supabase.
        const notifiedOrderIds = new Set<string>();

        // Subscribe to new orders (Handling the 5-minute grace period)
        const ordersChannel = supabase
            .channel('admin-orders-listener')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                const shipping = payload.new.shipping_address || {};
                
                // If it's in grace period, DO NOT notify now. We will notify on UPDATE.
                if (shipping.is_grace_period) {
                    return;
                }

                notifiedOrderIds.add(payload.new.id);
                // Otherwise, normal immediate notification
                addNotification({
                    type: 'new_order',
                    title: '🛒 طلب جديد!',
                    body: `طلب جديد بقيمة ${payload.new.total_amount?.toLocaleString()} ج.م`,
                    link: '/admin/orders',
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
                const newShipping = payload.new.shipping_address || {};

                // Notification should trigger when the grace period ends (user confirmed or 5 mins passed)
                // Since payload.old doesn't contain the full JSON by default, we check if it's currently confirmed,
                // and if we haven't notified about it yet in this session.
                const isNowConfirmed = newShipping.is_grace_period !== true;
                const isPending = payload.new.status === 'pending';
                
                if (isNowConfirmed && isPending && !notifiedOrderIds.has(payload.new.id)) {
                    notifiedOrderIds.add(payload.new.id);
                    addNotification({
                        type: 'new_order',
                        title: '🛒 طلب جديد تم تأكيده!',
                        body: `طلب بقيمة ${payload.new.total_amount?.toLocaleString()} ج.م تخطى فترة السماح`,
                        link: '/admin/orders',
                    });
                }
            })
            .subscribe();

        // Subscribe to new users
        const usersChannel = supabase
            .channel('admin-users-listener')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
                addNotification(buildUserNotification(payload.new));
            })
            .subscribe();

        // Subscribe to new reviews
        const reviewsChannel = supabase
            .channel('admin-reviews-listener')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews' }, (payload) => {
                addNotification({
                    type: 'new_review',
                    title: '⭐ تقييم جديد!',
                    body: `تم إضافة تقييم جديد (${payload.new.rating} نجوم) بواسطة ${payload.new.user_name || 'مستخدم'}`,
                    link: '/admin/reviews',
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(usersChannel);
            supabase.removeChannel(reviewsChannel);
        };
    }, [addNotification]);

    const markAllRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, read: true }));
            saveNotifications(updated);
            return updated;
        });
    };

    const clearAll = () => {
        setNotifications([]);
        saveNotifications([]);
        setIsOpen(false);
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'new_order': return <ShoppingBag className="w-4 h-4 text-primary" />;
            case 'new_user': return <UserPlus className="w-4 h-4 text-emerald-400" />;
            case 'new_driver': return <Bike className="w-4 h-4 text-sky-400" />;
            case 'new_staff': return <ShieldAlert className="w-4 h-4 text-violet-400" />;
            case 'new_review': return <Star className="w-4 h-4 text-yellow-500" />;
            case 'order_delivered': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'الآن';
        if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `منذ ${diffHr} ساعة`;
        return `منذ ${Math.floor(diffHr / 24)} يوم`;
    };

    return (
        <div className="relative">
            {/* Embedded Notification Sound */}
            <audio 
                ref={audioRef} 
                src="data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExEAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExIAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExMAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" 
                preload="auto" 
            />
            
            <button
                onClick={() => { setIsOpen(v => !v); if (!isOpen) markAllRead(); }}
                className="relative p-2 rounded-xl text-gray-400 hover:text-foreground hover:bg-surface-hover transition-colors"
            >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-foreground text-[10px] font-black rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-80 bg-surface border border-surface-hover rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-hover">
                            <h3 className="text-sm font-black text-foreground">الإشعارات</h3>
                            {notifications.length > 0 && (
                                <button onClick={clearAll} className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors font-bold">
                                    مسح الكل
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-10 flex flex-col items-center gap-2 text-gray-600">
                                    <Bell className="w-8 h-8 opacity-30" />
                                    <p className="text-xs">لا توجد إشعارات بعد</p>
                                    <p className="text-[10px] text-gray-700">ستظهر هنا طلبات جديدة أو أعضاء جدد من العملاء والمندوبين والطاقم</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <Link
                                        key={n.id}
                                        href={n.link || '/admin'}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-start gap-3 px-4 py-3 border-b border-surface-hover hover:bg-surface-hover transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-surface-hover flex items-center justify-center shrink-0 mt-0.5">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-foreground">{n.title}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                                            <p className="text-[10px] text-gray-600 mt-1">{formatTime(n.time)}</p>
                                        </div>
                                        {!n.read && (
                                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                        )}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main Layout ───────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const canManageSettings = hasPermission(profile, 'manage_settings');
    const canAccessControlCenter = hasFullAdminAccess(profile);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                const dest = encodeURIComponent(pathname || '/admin');
                router.replace(`/system-access/login?redirect=${dest}`);
            }
        }
    }, [user, isLoading, router, pathname]);

    // Don't render anything if we're not loaded or if a redirect is imminent
    if (isLoading || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (profile && profile.disabled) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                    <span className="text-rose-500 text-2xl">⛔</span>
                </div>
                <h1 className="text-2xl font-black text-foreground mb-2">تم تعطيل هذا الحساب</h1>
                <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
                    تواصل مع مشرف النظام لإعادة التفعيل أو الحصول على صلاحية جديدة.
                </p>
            </div>
        );
    }

    const allowedRoles = ['super_admin', 'admin', 'operations_manager', 'catalog_manager', 'support_agent'];
    if (profile && !allowedRoles.includes(profile.role || '')) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                    <span className="text-rose-500 text-2xl">🔒</span>
                </div>
                <h1 className="text-2xl font-black text-foreground mb-2">غير مصرح لك بالدخول</h1>
                <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
                    هذا الحساب لا يمتلك صلاحيات إدارة النظام. تأكد من تشغيل كود SQL لتحويل هذا الحساب إلى مدير.
                </p>
                <div className="bg-surface-hover p-4 rounded-xl border border-surface-hover text-xs text-left w-full max-w-md overflow-x-auto" dir="ltr">
                    <pre className="text-gray-400 font-mono">
{`UPDATE public.users 
SET role = 'super_admin' 
WHERE email = '${user.email}';`}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:w-60 shrink-0 h-screen sticky top-0">
                <div className="w-full overflow-hidden">
                    <Sidebar />
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 w-72 lg:hidden">
                        <Sidebar onClose={() => setIsSidebarOpen(false)} />
                    </div>
                </>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 bg-background/90 backdrop-blur-lg border-b border-surface-hover">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-foreground hover:bg-surface-hover"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:block text-xs text-gray-500">
                        لوحة الإدارة — في السكة
                    </div>
                    <div className="flex items-center gap-2 mr-auto lg:mr-0">
                        {canAccessControlCenter && (
                            <Link href="/admin/search" className="hidden md:flex items-center gap-2 rounded-xl border border-surface-hover bg-surface px-3 py-2 text-xs text-gray-500 transition-colors hover:text-foreground hover:border-primary/20">
                                <Search className="w-4 h-4" />
                                بحث شامل
                            </Link>
                        )}
                        {/* Realtime Notification Bell */}
                        <NotificationBell />
                        <ThemeToggle />
                        {canManageSettings && (
                            <Link href="/admin/settings">
                                <button className="p-2 rounded-xl text-gray-400 hover:text-foreground hover:bg-surface-hover">
                                    <Settings className="w-4.5 h-4.5" />
                                </button>
                            </Link>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
