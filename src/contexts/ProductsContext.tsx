"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProducts, fetchOffers, Product } from '@/services/productsService';
import { fetchCategories, Category } from '@/services/categoriesService';

interface ProductsContextType {
    products: Product[];
    offerProducts: Product[];
    categories: Category[];
    isLoadingProducts: boolean;
    isLoadingCategories: boolean;
    refreshProducts: () => Promise<void>;
    refreshOffers: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType>({
    products: [],
    offerProducts: [],
    categories: [],
    isLoadingProducts: true,
    isLoadingCategories: true,
    refreshProducts: async () => { },
    refreshOffers: async () => { },
});

export const ProductsProvider = ({ children }: { children: React.ReactNode }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [offerProducts, setOfferProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // ── Load products ─────────────────────────────────────────────────────
    const loadProducts = useCallback(async () => {
        const data = await fetchProducts();
        setProducts(data);
        setIsLoadingProducts(false);
    }, []);

    // ── Load offer products ───────────────────────────────────────────────
    const loadOffers = useCallback(async () => {
        const data = await fetchOffers();
        setOfferProducts(data);
    }, []);

    // ── Load categories ───────────────────────────────────────────────────
    const loadCategories = useCallback(async () => {
        const data = await fetchCategories();
        setCategories(data);
        setIsLoadingCategories(false);
    }, []);

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        loadProducts();
        loadOffers();
        loadCategories();
    }, [loadProducts, loadOffers, loadCategories]);

    // ── Supabase realtime: products table ─────────────────────────────────
    useEffect(() => {
        const channel = supabase
            .channel('public:products:context')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newProduct = payload.new as Product;
                        setProducts(prev => [newProduct, ...prev]);
                        if (newProduct.show_in_offers) {
                            setOfferProducts(prev => [newProduct, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as Product;
                        setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
                        // Re-sync offer products on any product update
                        loadOffers();
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        setProducts(prev => prev.filter(p => p.id !== deletedId));
                        setOfferProducts(prev => prev.filter(p => p.id !== deletedId));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [loadOffers]);

    // ── Supabase realtime: categories table ───────────────────────────────
    useEffect(() => {
        const channel = supabase
            .channel('public:categories:context')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'categories' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setCategories(prev => [...prev, payload.new as Category].sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (payload.eventType === 'UPDATE') {
                        setCategories(prev => prev.map(c => c.id === payload.new.id ? payload.new as Category : c));
                    } else if (payload.eventType === 'DELETE') {
                        setCategories(prev => prev.filter(c => c.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <ProductsContext.Provider value={{
            products, offerProducts, categories,
            isLoadingProducts, isLoadingCategories,
            refreshProducts: loadProducts,
            refreshOffers: loadOffers,
        }}>
            {children}
        </ProductsContext.Provider>
    );
};

export const useProducts = () => useContext(ProductsContext);
