"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard, Package, Tag, ShoppingCart, Users,
    Menu, X, LogOut, ChevronRight, Bell, Settings, Bike, Megaphone, Ticket
} from 'lucide-react';
import { signOut } from '@/services/authService';

// To restrict admin access: check user.email or user metadata role here

const NAV_ITEMS = [
    { label: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
    { label: 'المنتجات', href: '/admin/products', icon: Package },
    { label: 'الأقسام', href: '/admin/categories', icon: Tag },
    { label: 'الطلبات', href: '/admin/orders', icon: ShoppingCart },
    { label: 'المستخدمون', href: '/admin/users', icon: Users },
    { label: 'العروض الترويجية', href: '/admin/promotions', icon: Megaphone },
    { label: 'أكواد الخصم', href: '/admin/discounts', icon: Ticket },
];

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        if (!isLoading) {
            // Check if not logged in or doesn't have admin role
            const isUnauthorized = !user || profile?.role !== 'admin';
            
            if (isUnauthorized && !isLoginPage) {
                router.replace('/admin/login');
            } else if (!isUnauthorized && isLoginPage) {
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

    if (!user || profile?.role !== 'admin') return null;

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
                        <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                            <Bell className="w-4.5 h-4.5" />
                        </button>
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
