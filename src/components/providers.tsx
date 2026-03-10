"use client"

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ProductsProvider } from '@/contexts/ProductsContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ProductsProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </ProductsProvider>
        </AuthProvider>
    );
}
