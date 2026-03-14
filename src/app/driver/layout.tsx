import React from 'react';
import Link from 'next/link';
import { LogOut, Bike } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* Simple Mobile-Friendly Header */}
            <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-hover p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Bike className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-heading font-black text-lg">لوحة المندوب</h1>
                        <p className="text-[10px] text-gray-500 font-bold">في السكة</p>
                    </div>
                </div>
                {/* Logout is handled client-side, so we just link home where auth clears or make a tiny client component. Best to just link to account which has logout, or build a quick client wrapper for logout. */}
                <Link href="/account" className="p-2 text-gray-400 hover:bg-surface-hover rounded-xl transition-colors">
                    <LogOut className="w-5 h-5" />
                </Link>
            </header>

            <main className="flex-1 p-4 max-w-lg mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
