"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { fetchActivePromotion, Promotion } from '@/services/promotionsService';
import { useAuth } from '@/contexts/AuthContext';

export function PromoBanner() {
    const { user, isLoading: authLoading } = useAuth();
    const [promo, setPromo] = useState<Promotion | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchActivePromotion().then(setPromo);

        const channel = supabase
            .channel('public:promotions:banner')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
                fetchActivePromotion().then(setPromo);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // While auth is loading, render nothing to avoid flash
    if (authLoading) return null;

    // If no active promotion is set by admin, hide the section
    if (!promo) return null;

    const handleCopy = () => {
        if (promo.discount_code) {
            navigator.clipboard.writeText(promo.discount_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleLogout = () => { }; // unused but kept for safety

    return (
        <section className="py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-600 to-primary text-white p-8 sm:p-14 shadow-premium shadow-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6 group">

                    {/* Text */}
                    <div className="z-10 text-center sm:text-start">
                        <h3 className="text-3xl sm:text-4xl font-black mb-3 drop-shadow-sm">
                            {promo.title}
                        </h3>
                        {promo.description && (
                            <p className="text-white/90 text-lg sm:text-xl max-w-md font-medium leading-relaxed">
                                {promo.description}
                            </p>
                        )}
                        {promo.discount_code && (
                            <button
                                onClick={handleCopy}
                                title="انقر لنسخ الكود"
                                className="mt-3 inline-flex items-center gap-2 font-mono bg-black/20 hover:bg-black/30 active:scale-95 transition-all px-4 py-2 rounded-xl text-white border border-white/15 text-lg tracking-widest cursor-pointer select-none"
                            >
                                <span className="text-sm text-white/60 font-sans ml-1">استخدم كود:</span>
                                {promo.discount_code}
                                <span className="text-xs text-white/50 font-sans">{copied ? '✓ تم النسخ' : '📋 نسخ'}</span>
                            </button>
                        )}
                    </div>

                    {/* CTA Button — guest goes to register, logged-in goes to /offers with admin's button text */}
                    <div className="shrink-0 z-10 w-full sm:w-auto mx-auto sm:mx-0">
                        {user ? (
                            <Link
                                href="/offers"
                                className="flex items-center justify-center bg-white text-primary font-bold text-lg px-10 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-transform text-center"
                            >
                                {promo.button_text || 'شوف العروض'}
                            </Link>
                        ) : (
                            <Link
                                href="/register"
                                className="flex items-center justify-center bg-white text-primary font-bold text-lg px-10 py-4 rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-transform text-center"
                            >
                                سجل حساب جديد
                            </Link>
                        )}
                    </div>

                    {/* Decorative bg blobs */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10 blur-3xl rounded-full w-96 h-96 bg-white pointer-events-none" />
                    <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 opacity-20 blur-2xl rounded-full w-64 h-64 bg-black pointer-events-none" />
                </div>
            </div>
        </section>
    );
}
