"use client"

import React from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppSettingsProvider } from '@/contexts/AppSettingsContext';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ThemeProvider } from 'next-themes';

const SiteVisitTracker = dynamic(
    () => import('@/components/analytics/site-visit-tracker').then((mod) => mod.SiteVisitTracker),
    { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AppSettingsProvider>
                <AuthProvider>
                    <CartProvider>
                        <FavoritesProvider>
                            <SiteVisitTracker />
                            {children}
                        </FavoritesProvider>
                    </CartProvider>
                </AuthProvider>
            </AppSettingsProvider>
        </ThemeProvider>
    );
}
