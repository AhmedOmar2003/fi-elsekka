"use client"

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ProductsProvider } from '@/contexts/ProductsContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { ThemeProvider } from 'next-themes';
import { SiteVisitTracker } from '@/components/analytics/site-visit-tracker';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
                <ProductsProvider>
                    <CartProvider>
                        <FavoritesProvider>
                            <SiteVisitTracker />
                            {children}
                        </FavoritesProvider>
                    </CartProvider>
                </ProductsProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
