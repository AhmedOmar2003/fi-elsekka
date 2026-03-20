"use client"
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike, History, Package, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { signOut } from '@/services/authService';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile } = useAuth();

    const handleLogout = async () => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('driver_logout_flash', '1');
        }
        await signOut();
        window.location.href = '/driver/login?logged_out=1';
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* Simple Mobile-Friendly Header */}
            <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-hover px-4 pt-4 pb-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Bike className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-heading font-black text-lg">
                                {profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name 
                                    ? `أهلاً بمندوبنا الجميل ${(profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name).split(' ')[0]} ✨` 
                                    : 'لوحة المندوب'}
                            </h1>
                            <p className="text-[10px] text-gray-500 font-bold">في السكة</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button type="button" onClick={handleLogout} className="p-2 text-gray-400 hover:bg-surface-hover rounded-xl transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-1 -mb-px">
                    <Link
                        href="/driver"
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black border-b-2 transition-colors ${
                            pathname === '/driver'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-foreground'
                        }`}
                    >
                        <Package className="w-4 h-4" />
                        طلباتي
                    </Link>
                    <Link
                        href="/driver/history"
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black border-b-2 transition-colors ${
                            pathname === '/driver/history'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-400 hover:text-foreground'
                        }`}
                    >
                        <History className="w-4 h-4" />
                        السجل
                    </Link>
                </div>
            </header>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
