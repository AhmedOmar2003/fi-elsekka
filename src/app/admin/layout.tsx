"use client"

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard, Package, Tag, ShoppingCart, Users,
    Menu, X, LogOut, ChevronRight, Bell, Settings, Bike, Megaphone, Ticket,
    UserPlus, ShoppingBag, CheckCircle2, Clock, Truck, XCircle
} from 'lucide-react';
import { signOut } from '@/services/authService';
import { supabase } from '@/lib/supabase';

// ── Types ────────────────────────────────────────────────────
interface Notification {
    id: string;
    type: 'new_order' | 'new_user' | 'order_delivered';
    title: string;
    body: string;
    time: Date;
    read: boolean;
    link?: string;
}

// ── Nav Items ────────────────────────────────────────────────
const NAV_ITEMS = [
    { label: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
    { label: 'المنتجات', href: '/admin/products', icon: Package },
    { label: 'الأقسام', href: '/admin/categories', icon: Tag },
    { label: 'الطلبات', href: '/admin/orders', icon: ShoppingCart },
    { label: 'المستخدمون', href: '/admin/users', icon: Users },
    { label: 'العروض الترويجية', href: '/admin/promotions', icon: Megaphone },
    { label: 'أكواد الخصم', href: '/admin/discounts', icon: Ticket },
];

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <aside className="flex flex-col h-full bg-[#0a0e14] border-r border-white/5">
            {/* Logo */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <Bike className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-heading font-black text-white text-sm">في السكة</p>
                        <p className="text-[10px] text-primary font-medium">لوحة الإدارة</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                                ? 'bg-primary/15 text-primary border border-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            <div className="p-4 border-t border-white/5 space-y-1">
                <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {user?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{user?.email}</p>
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
function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
        const newNotif: Notification = {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            time: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 30)); // keep last 30

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

        // Subscribe to new orders
        const ordersChannel = supabase
            .channel('admin-orders-listener')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                addNotification({
                    type: 'new_order',
                    title: '🛒 طلب جديد!',
                    body: `طلب جديد بقيمة ${payload.new.total_amount?.toLocaleString()} ج.م`,
                    link: '/admin/orders',
                });
            })
            .subscribe();

        // Subscribe to new users
        const usersChannel = supabase
            .channel('admin-users-listener')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
                addNotification({
                    type: 'new_user',
                    title: '👤 مستخدم جديد!',
                    body: `انضم ${payload.new.full_name || payload.new.email || 'مستخدم جديد'} إلى المنصة`,
                    link: '/admin/users',
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(usersChannel);
        };
    }, [addNotification]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
        setIsOpen(false);
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'new_order': return <ShoppingBag className="w-4 h-4 text-primary" />;
            case 'new_user': return <UserPlus className="w-4 h-4 text-emerald-400" />;
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
            <button
                onClick={() => { setIsOpen(v => !v); if (!isOpen) markAllRead(); }}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-80 bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <h3 className="text-sm font-black text-white">الإشعارات</h3>
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
                                    <p className="text-[10px] text-gray-700">ستظهر هنا عند وصول طلبات جديدة أو تسجيل مستخدمين</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <Link
                                        key={n.id}
                                        href={n.link || '/admin'}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors ${!n.read ? 'bg-primary/3' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white">{n.title}</p>
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

    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        if (!isLoading) {
            if (!user && !isLoginPage) {
                router.replace('/admin/login');
            } else if (user && isLoginPage) {
                router.replace('/admin');
            }
        }
    }, [user, profile, isLoading, router, isLoginPage]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (isLoginPage) {
        return <div className="min-h-screen bg-[#05070a]">{children}</div>;
    }

    if (!user) return null;

    if (profile && profile.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#05070a] flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                    <span className="text-rose-500 text-2xl">🔒</span>
                </div>
                <h1 className="text-2xl font-black text-white mb-2">غير مصرح لك بالدخول</h1>
                <p className="text-gray-400 text-sm mb-6 text-center max-w-sm">
                    هذا الحساب لا يمتلك صلاحيات إدارة النظام. تأكد من تشغيل كود SQL لتحويل هذا الحساب إلى مدير.
                </p>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs text-left w-full max-w-md overflow-x-auto" dir="ltr">
                    <pre className="text-gray-300 font-mono">
{`UPDATE public.users 
SET role = 'admin' 
WHERE email = '${user.email}';`}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05070a] flex">
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
                <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 bg-[#05070a]/90 backdrop-blur-lg border-b border-white/5">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="hidden lg:block text-xs text-gray-500">
                        لوحة الإدارة — في السكة
                    </div>
                    <div className="flex items-center gap-2 mr-auto lg:mr-0">
                        {/* Realtime Notification Bell */}
                        <NotificationBell />
                        <Link href="/admin/settings">
                            <button className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <Settings className="w-4.5 h-4.5" />
                            </button>
                        </Link>
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
